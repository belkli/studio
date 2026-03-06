/**
 * @fileoverview onUserDeleted — Auth trigger that cleans up user data on account deletion.
 *
 * Triggers when a Firebase Auth account is deleted. Marks the corresponding
 * Firestore /users/{userId} document as deleted and logs the event to the
 * compliance log for PDPPA audit trail.
 *
 * This does NOT delete the Firestore document — PDPPA requires a retention
 * period before permanent deletion. The document is marked with a
 * `deletedAt` timestamp and PII fields are removed immediately.
 *
 * Region: europe-west1 (PDPPA data residency)
 */

import * as functions from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { FUNCTIONS_REGION } from '../types';

export const onUserDeleted = functions
  .region(FUNCTIONS_REGION)
  .auth.user()
  .onDelete(async (user) => {
    const uid = user.uid;
    const email = user.email || 'unknown';
    const db = getFirestore();

    try {
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();

        // Mark as deleted but don't remove — PDPPA retention requirements
        await userRef.update({
          deletedAt: new Date().toISOString(),
          email: FieldValue.delete(),   // Remove PII immediately
          phone: FieldValue.delete(),
          israeliIdNumber: FieldValue.delete(),
        });

        // Write compliance log entry for PDPPA audit trail
        await db.collection('complianceLogs').add({
          action: 'PII_DELETED',
          entityType: 'User',
          entityId: uid,
          conservatoriumId: userData?.conservatoriumId || '',
          timestamp: new Date().toISOString(),
          details: {
            email,
            role: userData?.role,
            fieldsRemoved: ['email', 'phone', 'israeliIdNumber'],
          },
        });

        functions.logger.info(`[onUserDeleted] Marked user ${uid} as deleted, PII removed`, {
          conservatoriumId: userData?.conservatoriumId,
          role: userData?.role,
        });
      } else {
        functions.logger.warn(`[onUserDeleted] No Firestore document found for auth user ${uid}`);
      }
    } catch (error) {
      functions.logger.error(`[onUserDeleted] Failed to clean up user ${uid}:`, error);
      // Don't block the Auth deletion — the cleanup can be retried
    }
  });
