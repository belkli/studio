'use server';

/**
 * @fileoverview DSAR (Data Subject Access Request) Server Actions — PDPPA compliance.
 *
 * Implements the three data-rights operations surfaced in /dashboard/settings:
 *   1. exportUserDataAction  — DATA_EXPORTED compliance log
 *   2. requestDataDeletionAction — PII_DELETED compliance log
 *   3. withdrawConsentAction — CONSENT_REVOKED compliance log
 *
 * Each action appends an immutable ComplianceLog entry AFTER the main
 * operation succeeds. The log write is wrapped in try/catch so that a
 * logging failure never blocks the user-facing operation.
 */

import { z } from 'zod';
import { withAuth, verifyAuth } from '@/lib/auth-utils';
import { getDb } from '@/lib/db';
import type { ComplianceLog } from '@/lib/types';

// ── Schemas ────────────────────────────────────────────────────────────────

const ExportUserDataSchema = z.object({
  userId: z.string().min(1),
  conservatoriumId: z.string().min(1),
});

const RequestDataDeletionSchema = z.object({
  userId: z.string().min(1),
  conservatoriumId: z.string().min(1),
  reason: z.string().optional(),
});

const WithdrawConsentSchema = z.object({
  userId: z.string().min(1),
  conservatoriumId: z.string().min(1),
  consentType: z.string().min(1),
});

// ── Helper ─────────────────────────────────────────────────────────────────

/**
 * Appends a ComplianceLog record without throwing — log failures are
 * non-fatal so the main user-facing operation is never blocked.
 */
async function appendComplianceLog(entry: Partial<ComplianceLog>): Promise<void> {
  try {
    const db = await getDb();
    await db.complianceLogs.create(entry);
  } catch (err) {
    console.error('[dsar] ComplianceLog write failed (non-fatal):', err);
  }
}

// ── 1. Export user data (DSAR export) ─────────────────────────────────────

/**
 * Compiles a portable data snapshot for the requesting user.
 *
 * Logs action: DATA_EXPORTED
 */
export const exportUserDataAction = withAuth(
  ExportUserDataSchema,
  async (data) => {
    const claims = await verifyAuth();

    // Users can only export their own data; admins can export for users in their conservatorium
    if (data.userId !== claims.uid) {
      if (!['site_admin', 'conservatorium_admin', 'delegated_admin'].includes(claims.role)) {
        throw new Error('FORBIDDEN');
      }
      if (data.conservatoriumId !== claims.conservatoriumId && !['site_admin', 'superadmin'].includes(claims.role)) {
        throw new Error('TENANT_MISMATCH');
      }
    }

    const db = await getDb();

    // Collect PII-bearing records for this user
    const [user, consentRecords, lessons] = await Promise.all([
      db.users.findById(data.userId),
      db.consentRecords.list().then((all) => all.filter((r) => r.userId === data.userId)),
      db.lessons.findByConservatorium(data.conservatoriumId).then((all) =>
        all.filter((l) => l.studentId === data.userId || l.teacherId === data.userId)
      ),
    ]);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      userId: data.userId,
      profile: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            conservatoriumId: user.conservatoriumId,
          }
        : null,
      consentRecords: consentRecords.map((r) => ({
        id: r.id,
        consentType: r.consentType,
        givenAt: r.givenAt,
        revokedAt: r.revokedAt ?? null,
        consentVersion: r.consentVersion,
      })),
      lessonCount: lessons.length,
    };

    // Append compliance audit entry
    await appendComplianceLog({
      id: `cl-${Date.now()}`,
      action: 'DATA_EXPORTED',
      subjectId: data.userId,
      performedBy: claims.uid,
      reason: 'DSAR data export requested via settings',
      performedAt: new Date().toISOString(),
    });

    return { success: true, data: exportPayload };
  }
);

// ── 2. Request data deletion ───────────────────────────────────────────────

/**
 * Records a data-deletion request. In production this would trigger a
 * Cloud Function to schedule erasure; here it logs the request and
 * marks the intent so an admin can action it.
 *
 * Logs action: PII_DELETED
 */
export const requestDataDeletionAction = withAuth(
  RequestDataDeletionSchema,
  async (data) => {
    const claims = await verifyAuth();

    // Users can only request deletion of their own data; admins can act for their conservatorium
    if (data.userId !== claims.uid) {
      if (!['site_admin', 'conservatorium_admin', 'delegated_admin'].includes(claims.role)) {
        throw new Error('FORBIDDEN');
      }
      if (data.conservatoriumId !== claims.conservatoriumId && !['site_admin', 'superadmin'].includes(claims.role)) {
        throw new Error('TENANT_MISMATCH');
      }
    }

    // In production: enqueue a deletion job / notify DPO.
    // For now we record the request in the compliance log.

    await appendComplianceLog({
      id: `cl-${Date.now()}`,
      action: 'PII_DELETED',
      subjectId: data.userId,
      performedBy: claims.uid,
      reason: data.reason ?? 'User requested account and data deletion via DSAR settings',
      performedAt: new Date().toISOString(),
    });

    return { success: true, message: 'Deletion request recorded. You will be contacted within 30 days.' };
  }
);

// ── 3. Withdraw consent ────────────────────────────────────────────────────

/**
 * Marks a specific consent type as revoked by setting `revokedAt` on all
 * matching ConsentRecord entries, then logs the withdrawal.
 *
 * Logs action: CONSENT_REVOKED
 */
export const withdrawConsentAction = withAuth(
  WithdrawConsentSchema,
  async (data) => {
    const claims = await verifyAuth();

    // Users can only withdraw their own consent; admins can act for their conservatorium
    if (data.userId !== claims.uid) {
      if (!['site_admin', 'conservatorium_admin', 'delegated_admin'].includes(claims.role)) {
        throw new Error('FORBIDDEN');
      }
      if (data.conservatoriumId !== claims.conservatoriumId && !['site_admin', 'superadmin'].includes(claims.role)) {
        throw new Error('TENANT_MISMATCH');
      }
    }

    const db = await getDb();

    // Find active consent records of the requested type
    const allRecords = await db.consentRecords.list();
    const matching = allRecords.filter(
      (r) =>
        r.userId === data.userId &&
        r.consentType === data.consentType &&
        !r.revokedAt
    );

    const revokedAt = new Date().toISOString();

    // Mark each matching record as revoked
    await Promise.all(
      matching.map((r) =>
        db.consentRecords.update(r.id, { revokedAt })
      )
    );

    await appendComplianceLog({
      id: `cl-${Date.now()}`,
      action: 'CONSENT_REVOKED',
      subjectId: data.userId,
      performedBy: claims.uid,
      reason: `Consent withdrawn for type: ${data.consentType}`,
      performedAt: revokedAt,
    });

    return { success: true, revokedCount: matching.length };
  }
);
