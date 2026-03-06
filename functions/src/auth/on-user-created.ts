/**
 * @fileoverview onUserCreated — Firestore trigger that sets initial Custom Claims.
 *
 * Triggers when a new /users/{userId} document is created. Sets the initial
 * Custom Claims with approved: false so that the middleware redirects the user
 * to /pending-approval until an admin approves them.
 *
 * This handles the case where a user registers (Firebase Auth account created)
 * and their Firestore user document is written — we immediately set claims
 * so the middleware can enforce the unapproved state.
 *
 * Region: europe-west1 (PDPPA data residency)
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getAuth } from 'firebase-admin/auth';
import { logger } from 'firebase-functions/v2';
import { FUNCTIONS_REGION, type HarmoniaCustomClaims, type UserDocument } from '../types';

export const onUserCreated = onDocumentCreated(
  {
    document: 'users/{userId}',
    region: FUNCTIONS_REGION,
  },
  async (event) => {
    const data = event.data?.data() as UserDocument | undefined;
    const userId = event.params.userId;

    if (!data) {
      logger.warn(`[onUserCreated] No data for new user ${userId}`);
      return;
    }

    // Admin-created users (via the admin dashboard) may already be approved.
    // Respect the approved field from the document.
    const initialClaims: HarmoniaCustomClaims = {
      role: data.role || 'student',
      conservatoriumId: data.conservatoriumId || '',
      approved: data.approved === true,
    };

    try {
      await getAuth().setCustomUserClaims(userId, initialClaims);

      logger.info(`[onUserCreated] Set initial claims for ${userId}:`, {
        role: initialClaims.role,
        conservatoriumId: initialClaims.conservatoriumId,
        approved: initialClaims.approved,
      });
    } catch (error) {
      // The Firebase Auth user may not exist yet if the Firestore document
      // was created before the Auth account (e.g., admin pre-creating a user).
      // In this case, onUserApproved will handle claims when the document
      // is updated after the Auth account is created.
      logger.error(
        `[onUserCreated] Failed to set initial claims for ${userId}. ` +
        `The Auth account may not exist yet — claims will be set when the ` +
        `document is next updated.`,
        error
      );
    }
  }
);
