'use server';

/**
 * @fileoverview Server Action for recording PDPPA consent at registration.
 *
 * Writes an immutable ConsentRecord to the `/consentRecords/{id}` root
 * collection in Firestore via the Admin SDK (bypasses Security Rules).
 *
 * Firestore Security Rules for this collection:
 *   allow create: if request.auth != null;
 *   allow update, delete: if false;  // immutable audit trail
 */

import { z } from 'zod';
import { requireRole, withAuth, verifyAuth } from '@/lib/auth-utils';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { getDb } from '@/lib/db';
import type { ConsentType } from '@/lib/types';

// ── Input schema ───────────────────────────────────────────────────────────

const RecordConsentSchema = z.object({
  userId: z.string().min(1),
  conservatoriumId: z.string().min(1),
  consentDataProcessing: z.boolean(),
  consentTerms: z.boolean(),
  consentMarketing: z.boolean(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// ── Server Action ──────────────────────────────────────────────────────────

/**
 * Records a PDPPA consent snapshot for the given user.
 *
 * The record is written to `/consentRecords/{id}` — a root-level collection
 * that is NOT scoped under any conservatorium sub-collection, so it can be
 * audited globally and survives conservatorium data migrations.
 *
 * @param input - Validated consent payload
 * @returns `{ success: true, consentId }` on success, or `{ success: false, error }` on failure
 */
export async function recordConsentAction(
  input: z.infer<typeof RecordConsentSchema>
): Promise<{ success: true; consentId: string } | { success: false; error: string }> {
  // --- 1. Validate input ---
  const parsed = RecordConsentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid consent payload' };
  }

  // --- 2. Authenticate & authorise ---
  let claims;
  try {
    claims = await requireRole([
      'student',
      'parent',
      'teacher',
      'conservatorium_admin',
      'delegated_admin',
      'site_admin',
    ]);
  } catch {
    return { success: false, error: 'Unauthorized' };
  }

  // Validate that the caller belongs to the claimed conservatorium (or is a global admin)
  if (parsed.data.conservatoriumId !== claims.conservatoriumId && !['site_admin', 'superadmin'].includes(claims.role)) {
    return { success: false, error: 'Forbidden: conservatoriumId mismatch' };
  }

  // --- 3. Build the ConsentRecord document ---
  const {
    userId,
    conservatoriumId,
    consentDataProcessing,
    consentTerms,
    consentMarketing,
    ipAddress,
    userAgent,
  } = parsed.data;

  const recordData: Record<string, unknown> = {
    userId,
    conservatoriumId,
    consentDataProcessing,
    consentTerms,
    consentMarketing,
    recordedAt: new Date().toISOString(),
    version: '1.0', // PDPPA consent schema version — bump when consent text changes
  };

  if (ipAddress) {
    recordData.ipAddress = ipAddress;
  }
  if (userAgent) {
    recordData.userAgent = userAgent;
  }

  // --- 4. Persist to Firestore ---
  try {
    const db = getAdminFirestore();

    if (!db) {
      // Dev mode: Admin SDK not configured — log and return success so the
      // registration flow can proceed without Firestore credentials.
      console.warn(
        '[recordConsentAction] getAdminFirestore() returned null. ' +
          'Consent record NOT persisted (dev mode without FIREBASE_SERVICE_ACCOUNT_KEY). ' +
          'Returning success to allow registration flow to continue.'
      );
      return { success: true, consentId: `dev-consent-${Date.now()}` };
    }

    const docRef = await db.collection('consentRecords').add(recordData);

    return { success: true, consentId: docRef.id };
  } catch (err) {
    console.error('[recordConsentAction] Failed to write consent record:', err);
    return { success: false, error: 'Failed to record consent' };
  }
}

// ── B1.3: saveConsentRecord (DB-adapter based, supports parental consent) ──

const SaveConsentSchema = z.object({
  userId: z.string(),
  conservatoriumId: z.string(),
  consentDataProcessing: z.boolean(),
  consentTerms: z.boolean(),
  consentMarketing: z.boolean().optional(),
  consentVideoRecording: z.boolean().optional(),
  consentPhotos: z.boolean().optional(),
  isMinorConsent: z.boolean().optional(),
  minorUserId: z.string().optional(),
});

export const saveConsentRecord = withAuth(
  SaveConsentSchema,
  async (data) => {
    const db = await getDb();

    const claims = await verifyAuth();
    if (data.userId !== claims.uid) {
      const user = await db.users.findById(claims.uid);
      const isParentOfTarget = user?.role === 'parent' && user?.childIds?.includes(data.userId);
      const isAdmin = ['site_admin', 'conservatorium_admin'].includes(claims.role || '');
      if (!isParentOfTarget && !isAdmin) {
        return { success: false, error: 'Cannot record consent for another user' };
      }
    }

    const consentTypes: ConsentType[] = [
      ...(data.consentDataProcessing ? ['DATA_PROCESSING' as ConsentType] : []),
      ...(data.consentTerms ? ['TERMS' as ConsentType] : []),
      ...(data.consentMarketing ? ['MARKETING' as ConsentType] : []),
      ...(data.consentVideoRecording ? ['VIDEO_RECORDING' as ConsentType] : []),
      ...(data.consentPhotos ? ['PHOTOS' as ConsentType] : []),
    ];

    const timestamp = new Date().toISOString();
    const targetUserId = data.minorUserId || data.userId;

    // Create one ConsentRecord per consent type (schema requires single consentType per record)
    const records = await Promise.all(
      consentTypes.map((consentType) =>
        db.consentRecords.create({
          id: crypto.randomUUID(),
          userId: targetUserId,
          consentType,
          givenAt: timestamp,
          givenByUserId: data.userId,
          ipAddress: '',
          consentVersion: '2.0',
        })
      )
    );

    // PDPPA compliance audit — non-fatal; log failure must not block registration
    try {
      const actor = await verifyAuth();
      await db.complianceLogs.create({
        id: `cl-${Date.now()}`,
        action: 'CONSENT_GIVEN',
        subjectId: targetUserId,
        performedBy: actor.uid,
        reason: `Consent recorded for types: ${consentTypes.join(', ')}${data.isMinorConsent ? ' (parental consent on behalf of minor)' : ''}`,
        performedAt: timestamp,
      });
    } catch (logErr) {
      console.error('[saveConsentRecord] ComplianceLog write failed (non-fatal):', logErr);
    }

    return { success: true, recordIds: records.map((r) => r.id) };
  }
);

// ── B1.4: getConsentStatus (per-user consent map) ──────────────────────────

const GetConsentStatusSchema = z.object({ userId: z.string() });

export const getConsentStatus = withAuth(
  GetConsentStatusSchema,
  async (data) => {
    const db = await getDb();

    const claims = await verifyAuth();
    if (data.userId !== claims.uid) {
      const user = await db.users.findById(claims.uid);
      const isParentOfTarget = user?.role === 'parent' && user?.childIds?.includes(data.userId);
      const isAdmin = ['site_admin', 'conservatorium_admin'].includes(claims.role || '');
      if (!isParentOfTarget && !isAdmin) {
        return { success: false, error: 'Access denied' };
      }
    }

    const all = await db.consentRecords.list();
    const records = all.filter((r) => r.userId === data.userId);
    // Build map: only count non-revoked records
    const status: Record<string, boolean> = {};
    for (const r of records) {
      if (!r.revokedAt) {
        status[r.consentType] = true;
      }
    }
    return { success: true, status };
  }
);
