/**
 * @fileoverview Cloud Function spec for makeup lesson booking with atomic credit redemption.
 * SDD-P6 (QA) identifies RC-2: Double-spending makeup credits.
 * The fix: redeem the credit inside the same Firestore transaction
 * that creates the lesson slot.
 */

import { type MakeupBookingRequest } from '@/lib/validation/booking';

/**
 * bookMakeupLesson — Callable Cloud Function
 * 
 * Critical: The credit redemption and slot creation MUST be atomic.
 * Without a transaction, two concurrent bookings could both read
 * the same AVAILABLE credit and both succeed.
 * 
 * Transaction flow:
 * 1. Validate input with MakeupBookingRequestSchema
 * 2. Read the MakeupCredit document within the transaction
 * 3. Verify credit is AVAILABLE and not expired
 * 4. Check teacher availability at the requested time
 * 5. If roomId, acquire room lock (same as regular booking)
 * 6. Create LessonSlot with type: 'MAKEUP' and makeupCreditId
 * 7. Update MakeupCredit: status → 'REDEEMED', redeemedBySlotId, redeemedAt
 * 8. All within a single Firestore transaction
 * 
 * ```typescript
 * await db.runTransaction(async (tx) => {
 *   // Read credit — MUST be inside transaction for atomicity
 *   const creditRef = doc(db, `conservatoriums/${cid}/makeupCredits/${makeupCreditId}`);
 *   const creditSnap = await tx.get(creditRef);
 *   const credit = creditSnap.data() as MakeupCredit;
 * 
 *   if (credit.status !== 'AVAILABLE') {
 *     throw new HttpsError('failed-precondition', 'CREDIT_ALREADY_USED');
 *   }
 *   if (Timestamp.now() > Timestamp.fromDate(new Date(credit.expiresAt))) {
 *     throw new HttpsError('failed-precondition', 'CREDIT_EXPIRED');
 *   }
 *   if (credit.studentId !== studentId) {
 *     throw new HttpsError('permission-denied', 'CREDIT_NOT_OWNED');
 *   }
 * 
 *   // Create makeup slot
 *   const slotRef = doc(collection(db, `conservatoriums/${cid}/lessonSlots`));
 *   tx.set(slotRef, {
 *     ...slotData,
 *     type: 'MAKEUP',
 *     makeupCreditId,
 *     isCreditConsumed: true,
 *   });
 * 
 *   // Atomically redeem the credit
 *   tx.update(creditRef, {
 *     status: 'REDEEMED',
 *     redeemedBySlotId: slotRef.id,
 *     redeemedAt: Timestamp.now(),
 *   });
 * });
 * ```
 */
export interface BookMakeupLessonSpec {
    input: MakeupBookingRequest;
    raceConditionMitigation: 'FIRESTORE_TRANSACTION';
}
