import { getDb } from '@/lib/db';
import type { ComplianceLog } from '@/lib/types';

interface LogAccessParams {
  userId: string;
  conservatoriumId: string;
  resourceType: string;
  resourceId: string;
  action: ComplianceLog['action'];
  reason?: string;
}

/**
 * Fire-and-forget compliance audit log.
 * Never throws — logging failures must not break the calling operation.
 */
export async function logAccess(params: LogAccessParams): Promise<void> {
  try {
    const db = await getDb();
    await db.complianceLogs.create({
      id: crypto.randomUUID(),
      action: params.action,
      subjectId: params.resourceId,
      reason: params.reason ?? `${params.resourceType} accessed`,
      performedAt: new Date().toISOString(),
      performedBy: params.userId,
      conservatoriumId: params.conservatoriumId,
    });
  } catch (err) {
    console.error('[ComplianceLog] Failed to write audit entry:', err);
  }
}
