/**
 * Pure helper functions for scholarship RBAC logic.
 * Kept separate from Server Actions so Vitest can import them directly.
 */
import type { ScholarshipApplication, User } from '@/lib/types';

const GLOBAL_ADMIN_ROLES: User['role'][] = ['site_admin', 'superadmin'];

/**
 * Returns true if the user may see sensitive scholarship data
 * (documents array, AI score, income figures).
 *
 * Grants access when:
 * - User has role site_admin or superadmin (global bypass), OR
 * - User has role conservatorium_admin AND scholarshipCommittee === true
 */
export function isCommitteeMember(
  user: Pick<User, 'role' | 'scholarshipCommittee'>
): boolean {
  if (GLOBAL_ADMIN_ROLES.includes(user.role)) return true;
  return user.role === 'conservatorium_admin' && user.scholarshipCommittee === true;
}

/**
 * Returns a redacted copy for non-committee admins:
 * removes documents, aiScore, aiScoredAt, committeeOverrideNote.
 */
export function redactScholarshipForNonCommittee(
  app: ScholarshipApplication
): Omit<ScholarshipApplication, 'documents' | 'aiScore' | 'aiScoredAt' | 'committeeOverrideNote'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { documents, aiScore, aiScoredAt, committeeOverrideNote, ...safe } = app;
  return safe;
}
