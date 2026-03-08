/**
 * Marketing Consent Gate
 *
 * LEGAL: Israeli Spam Law (2008) §30a + Consumer Protection Law §30a impose
 * statutory damages of ₪1,000 per unsolicited message, no proof of harm needed.
 *
 * USAGE: Any code path that sends marketing emails, SMS, or push notifications
 * MUST call checkMarketingConsent(userId) before sending. If it returns false,
 * the message MUST NOT be sent and should be logged as suppressed.
 *
 * Adult students: consent required for commercial/promotional use.
 * Minor students: consent required for all uses including event photos.
 */

import { getDb } from '@/lib/db';
import type { ConsentType } from '@/lib/types';

/**
 * Returns true if the user has a non-revoked MARKETING ConsentRecord.
 *
 * @param userId - The user to check consent for
 * @returns true if marketing consent is active, false otherwise
 */
export async function checkMarketingConsent(userId: string): Promise<boolean> {
  return checkConsentType(userId, 'MARKETING');
}

/**
 * Generic consent check for any ConsentType.
 *
 * Returns true if the user has at least one non-revoked ConsentRecord of the
 * given type.
 *
 * @param userId     - The user to check consent for
 * @param type       - The ConsentType to check
 * @returns true if consent is active, false otherwise
 */
export async function checkConsentType(userId: string, type: ConsentType): Promise<boolean> {
  const db = await getDb();
  const all = await db.consentRecords.list();
  return all.some(
    (r) => r.userId === userId && r.consentType === type && !r.revokedAt
  );
}

/**
 * Returns a map of all ConsentTypes to their active consent status for the
 * given user.
 *
 * A type is true only if the user has at least one non-revoked record of that
 * type.
 *
 * @param userId - The user to check consent for
 * @returns Record mapping every ConsentType to a boolean
 */
export async function getUserConsentStatus(
  userId: string
): Promise<Record<ConsentType, boolean>> {
  const db = await getDb();
  const all = await db.consentRecords.list();
  const userRecords = all.filter((r) => r.userId === userId);

  const allTypes: ConsentType[] = [
    'DATA_PROCESSING',
    'TERMS',
    'MARKETING',
    'VIDEO_RECORDING',
    'SCHOLARSHIP_DATA',
    'PHOTOS',
  ];

  const status = {} as Record<ConsentType, boolean>;
  for (const type of allTypes) {
    status[type] = userRecords.some((r) => r.consentType === type && !r.revokedAt);
  }
  return status;
}
