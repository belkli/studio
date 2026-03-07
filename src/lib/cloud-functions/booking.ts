/**
 * @fileoverview Cloud Function spec for room-safe lesson booking.
 * SDD-P1 & SDD-P6 require Firestore transactions to prevent:
 * - RC-1: Room double-booking
 * - RC-4: Package credit undercount
 * 
 * This is a typed specification. Deploy as a Firebase Cloud Function
 * (2nd Gen / Cloud Run) when Firebase is configured.
 */

import { type BookingRequest } from '@/lib/validation/booking';

/**
 * bookLessonSlot — Callable Cloud Function
 * 
 * Transaction flow:
 * 1. Validate input with Zod BookingRequestSchema
 * 2. Authorize: caller must be student, their parent, their teacher, or admin
 * 3. If packageId provided, verify ownership and available credits
 * 4. Check teacher availability (no overlapping SCHEDULED slots)
 * 5. If roomId provided, acquire room lock via optimistic concurrency:
 *    - roomLocks/{roomId}_{startTime}_{duration} must not exist
 *    - Create lock document within transaction
 * 6. Create LessonSlot document
 * 7. Deduct package credit (increment usedCredits)
 * 8. Update conservatoriumStats/live (increment lessonsScheduledThisWeek)
 * 
 * All steps 3-8 happen within a single Firestore transaction
 * to prevent race conditions.
 */
export interface BookLessonSlotSpec {
    input: BookingRequest;

    /**
     * Firestore transaction steps (pseudocode):
     * 
     * ```typescript
     * await db.runTransaction(async (tx) => {
     *   // 1. Read teacher's existing slots at this time
     *   const conflictQuery = query(
     *     collection(db, `conservatoriums/${cid}/lessonSlots`),
     *     where('teacherId', '==', teacherId),
     *     where('startTime', '>=', startTime),
     *     where('startTime', '<', endTime),
     *     where('status', '==', 'SCHEDULED')
     *   );
     *   const conflicts = await tx.get(conflictQuery);
     *   if (!conflicts.empty) throw new HttpsError('already-exists', 'TEACHER_CONFLICT');
     * 
     *   // 2. Room lock
     *   if (roomId) {
     *     const lockRef = doc(db, `conservatoriums/${cid}/roomLocks/${roomId}_${startTime}`);
     *     const lockSnap = await tx.get(lockRef);
     *     if (lockSnap.exists()) throw new HttpsError('already-exists', 'ROOM_DOUBLE_BOOKED');
     *     tx.set(lockRef, { slotId, bookedAt: Timestamp.now(), releasedAt: endTimestamp });
     *   }
     * 
     *   // 3. Package credit deduction
     *   if (packageId) {
     *     const pkgRef = doc(db, `conservatoriums/${cid}/packages/${packageId}`);
     *     const pkgSnap = await tx.get(pkgRef);
     *     const pkg = pkgSnap.data() as Package;
     *     if (pkg.usedCredits >= pkg.totalCredits) throw new HttpsError('resource-exhausted', 'NO_CREDITS');
     *     tx.update(pkgRef, { usedCredits: FieldValue.increment(1) });
     *   }
     * 
     *   // 4. Create lesson slot
     *   const slotRef = doc(collection(db, `conservatoriums/${cid}/lessonSlots`));
     *   tx.set(slotRef, newSlotDocument);
     * 
     *   // 5. Update stats
     *   tx.update(statsRef, { lessonsScheduledThisWeek: FieldValue.increment(1) });
     * });
     * ```
     */
    transactionSteps: string;
}

/**
 * Room lock key format: {roomId}_{YYYY-MM-DDTHH:mm}_{durationMinutes}
 * This ensures uniqueness per room per time slot.
 */
export function generateRoomLockKey(roomId: string, startTime: string, durationMinutes: number): string {
    const dateKey = new Date(startTime).toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    return `${roomId}_${dateKey}_${durationMinutes}`;
}
