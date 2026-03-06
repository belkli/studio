/**
 * @fileoverview onUserParentSync — Firestore trigger that maintains the
 * /parentOf/{parentId}_{studentId} denormalized collection.
 *
 * The Firestore Security Rules use `exists(/parentOf/{parentId}_{studentId})`
 * for O(1) parent-child access checks (isParentOfStudent()). This function
 * keeps that collection in sync whenever a user's `parentId` or `childIds`
 * fields change.
 *
 * Trigger: onDocumentWritten on /users/{userId}
 * Handles: create, update, and delete events
 *
 * Region: europe-west1 (PDPPA data residency)
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { FUNCTIONS_REGION, type UserDocument } from '../types';

/** Shape of a /parentOf/{linkId} document. */
interface ParentOfDocument {
  parentId: string;
  studentId: string;
  conservatoriumId: string;
  createdAt: string;
}

/**
 * Build the deterministic document ID for a parent-child link.
 * Format: "{parentId}_{studentId}"
 */
function linkId(parentId: string, studentId: string): string {
  return `${parentId}_${studentId}`;
}

export const onUserParentSync = onDocumentWritten(
  {
    document: 'users/{userId}',
    region: FUNCTIONS_REGION,
  },
  async (event) => {
    const userId = event.params.userId;
    const db = getFirestore();
    const parentOfCol = db.collection('parentOf');

    const before = event.data?.before?.data() as UserDocument | undefined;
    const after = event.data?.after?.data() as UserDocument | undefined;

    // Collect all write operations to execute in a single batch
    const batch = db.batch();
    let hasChanges = false;

    // ── Handle parentId changes on student documents ──
    // When a student's parentId changes, update the link
    const oldParentId = before?.parentId;
    const newParentId = after?.parentId;

    if (oldParentId !== newParentId) {
      // Remove old link
      if (oldParentId) {
        batch.delete(parentOfCol.doc(linkId(oldParentId, userId)));
        hasChanges = true;
        logger.info(`[onUserParentSync] Removing parentOf link: ${oldParentId} -> ${userId}`);
      }

      // Create new link
      if (newParentId) {
        const doc: ParentOfDocument = {
          parentId: newParentId,
          studentId: userId,
          conservatoriumId: after?.conservatoriumId || '',
          createdAt: new Date().toISOString(),
        };
        batch.set(parentOfCol.doc(linkId(newParentId, userId)), doc);
        hasChanges = true;
        logger.info(`[onUserParentSync] Creating parentOf link: ${newParentId} -> ${userId}`);
      }
    }

    // ── Handle childIds changes on parent documents ──
    // When a parent's childIds array changes, update the links
    const oldChildIds = new Set(before?.childIds || []);
    const newChildIds = new Set(after?.childIds || []);

    // Children removed from this parent
    for (const removedChildId of oldChildIds) {
      if (!newChildIds.has(removedChildId)) {
        batch.delete(parentOfCol.doc(linkId(userId, removedChildId)));
        hasChanges = true;
        logger.info(`[onUserParentSync] Removing parentOf link (child removed): ${userId} -> ${removedChildId}`);
      }
    }

    // Children added to this parent
    for (const addedChildId of newChildIds) {
      if (!oldChildIds.has(addedChildId)) {
        const doc: ParentOfDocument = {
          parentId: userId,
          studentId: addedChildId,
          conservatoriumId: after?.conservatoriumId || '',
          createdAt: new Date().toISOString(),
        };
        batch.set(parentOfCol.doc(linkId(userId, addedChildId)), doc);
        hasChanges = true;
        logger.info(`[onUserParentSync] Creating parentOf link (child added): ${userId} -> ${addedChildId}`);
      }
    }

    // ── Handle user deletion ──
    // If user was deleted, clean up all parentOf documents referencing them
    if (before && !after) {
      // If deleted user was a student with a parent
      if (before.parentId) {
        batch.delete(parentOfCol.doc(linkId(before.parentId, userId)));
        hasChanges = true;
        logger.info(`[onUserParentSync] Cleaning up parentOf on student delete: ${before.parentId} -> ${userId}`);
      }
      // If deleted user was a parent with children
      for (const childId of before.childIds || []) {
        batch.delete(parentOfCol.doc(linkId(userId, childId)));
        hasChanges = true;
        logger.info(`[onUserParentSync] Cleaning up parentOf on parent delete: ${userId} -> ${childId}`);
      }
    }

    if (hasChanges) {
      await batch.commit();
      logger.info(`[onUserParentSync] Batch committed for user ${userId}`);
    }
  }
);
