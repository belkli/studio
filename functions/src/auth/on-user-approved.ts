/**
 * @fileoverview onUserApproved — Firestore trigger that sets Firebase Custom Claims.
 *
 * Triggers on updates to /users/{userId}. When a user's `approved`, `role`,
 * or `conservatoriumId` fields change, this function updates their Firebase
 * Custom Claims so that the middleware and Firestore Security Rules can
 * enforce role-based and tenant-scoped access.
 *
 * Also writes a `_claimsUpdatedAt` marker so the client can detect the change
 * and force-refresh its ID token via `getIdToken(true)`.
 *
 * Region: europe-west1 (PDPPA data residency)
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getAuth } from 'firebase-admin/auth';
import { logger } from 'firebase-functions/v2';
import { FUNCTIONS_REGION, type HarmoniaCustomClaims, type UserDocument } from '../types';

export const onUserApproved = onDocumentUpdated(
  {
    document: 'users/{userId}',
    region: FUNCTIONS_REGION,
  },
  async (event) => {
    const before = event.data?.before?.data() as UserDocument | undefined;
    const after = event.data?.after?.data() as UserDocument | undefined;
    const userId = event.params.userId;

    if (!before || !after) {
      logger.warn(`[onUserApproved] Missing before/after data for ${userId}`);
      return;
    }

    // Only update claims if relevant fields changed
    const claimsChanged =
      before.approved !== after.approved ||
      before.role !== after.role ||
      before.conservatoriumId !== after.conservatoriumId;

    if (!claimsChanged) {
      return;
    }

    const newClaims: HarmoniaCustomClaims = {
      role: after.role || 'student',
      conservatoriumId: after.conservatoriumId || '',
      approved: after.approved === true,
    };

    try {
      // Set the Custom Claims on the Firebase Auth user
      await getAuth().setCustomUserClaims(userId, newClaims);

      // Write a marker timestamp so the client knows to refresh its token.
      // The client listens to this field via onSnapshot and calls getIdToken(true)
      // when it changes, which picks up the new Custom Claims.
      await event.data!.after!.ref.update({
        _claimsUpdatedAt: new Date().toISOString(),
      });

      logger.info(`[onUserApproved] Updated claims for ${userId}:`, {
        role: newClaims.role,
        conservatoriumId: newClaims.conservatoriumId,
        approved: newClaims.approved,
        trigger: getChangeTrigger(before, after),
      });
    } catch (error) {
      // If the Firebase Auth user doesn't exist (e.g., created in Firestore
      // before Firebase Auth account), log the error but don't crash.
      logger.error(`[onUserApproved] Failed to set claims for ${userId}:`, error);
    }
  }
);

/**
 * Determine what triggered the claims update for logging purposes.
 */
function getChangeTrigger(before: UserDocument, after: UserDocument): string {
  const triggers: string[] = [];
  if (before.approved !== after.approved) {
    triggers.push(after.approved ? 'approved' : 'unapproved');
  }
  if (before.role !== after.role) {
    triggers.push(`role: ${before.role} -> ${after.role}`);
  }
  if (before.conservatoriumId !== after.conservatoriumId) {
    triggers.push(`tenant: ${before.conservatoriumId} -> ${after.conservatoriumId}`);
  }
  return triggers.join(', ');
}
