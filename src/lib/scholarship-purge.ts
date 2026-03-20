/**
 * Pure helper for document purge scheduling logic.
 * Kept separate from the API route handler for testability.
 */
import type { ScholarshipApplication } from '@/lib/types';

const TWELVE_MONTHS_MS = 12 * 30 * 24 * 60 * 60 * 1000; // ~12 months

/**
 * Returns all applications that:
 * 1. Have a final decision (APPROVED or REJECTED)
 * 2. Have at least one document
 * 3. The decision date is more than 12 months before `now`
 */
export function selectApplicationsForDocumentPurge(
  applications: ScholarshipApplication[],
  now: Date
): ScholarshipApplication[] {
  return applications.filter((app) => {
    if (!app.documents || app.documents.length === 0) return false;
    const decisionDateStr = app.approvedAt ?? app.rejectedAt;
    if (!decisionDateStr) return false;
    const decisionDate = new Date(decisionDateStr);
    const ageMs = now.getTime() - decisionDate.getTime();
    return ageMs > TWELVE_MONTHS_MS;
  });
}
