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
import { requireRole } from '@/lib/auth-utils';
import { getAdminFirestore } from '@/lib/firebase-admin';

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
  try {
    await requireRole([
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
