/**
 * @fileoverview bookLessonSlot — Callable Cloud Function for atomic lesson booking.
 *
 * Uses a Firestore transaction to:
 * 1. Verify no double-booking exists for teacher+student at the requested time
 * 2. Verify the room (if requested) is not already booked
 * 3. If a packageId is supplied, verify the package has remaining credits
 * 4. Create the LessonSlot document atomically
 * 5. Decrement the package credit count (if applicable)
 *
 * Input validation is performed via Zod before the transaction executes.
 * Returns the created LessonSlot ID on success.
 *
 * Region: europe-west1 (PDPPA data residency)
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { z } from 'zod';
import { FUNCTIONS_REGION } from '../types';

// ---------------------------------------------------------------------------
// Input schema — mirrors src/lib/validation/booking.ts BookingRequestSchema
// ---------------------------------------------------------------------------

const BookingRequestSchema = z.object({
  teacherId: z.string().min(1),
  studentId: z.string().min(1),
  conservatoriumId: z.string().min(1),
  startTime: z.string().datetime(),
  durationMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  roomId: z.string().optional(),
  packageId: z.string().optional(),
  isVirtual: z.boolean().default(false),
  meetingLink: z.string().url().optional(),
  instrument: z.string().min(1),
  type: z.enum(['RECURRING', 'MAKEUP', 'TRIAL', 'ADHOC', 'GROUP']).default('RECURRING'),
});

// ---------------------------------------------------------------------------
// Collision window helper
// ---------------------------------------------------------------------------

/**
 * Returns the millisecond end time of a lesson given its start ISO string and duration.
 */
function endTimeMs(startTimeIso: string, durationMinutes: number): number {
  return new Date(startTimeIso).getTime() + durationMinutes * 60 * 1000;
}

/**
 * Returns true if two time windows overlap.
 * [s1, e1) overlaps [s2, e2) iff s1 < e2 && s2 < e1
 */
function overlaps(
  s1Ms: number, e1Ms: number,
  s2Ms: number, e2Ms: number,
): boolean {
  return s1Ms < e2Ms && s2Ms < e1Ms;
}

// ---------------------------------------------------------------------------
// Main callable function
// ---------------------------------------------------------------------------

export const bookLessonSlot = onCall(
  {
    region: FUNCTIONS_REGION,
    enforceAppCheck: false, // set to true when App Check is configured
  },
  async (request) => {
    // ── Auth check ───────────────────────────────────────────────────────────
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const callerUid = request.auth.uid;
    const callerClaims = request.auth.token;
    const callerRole: string = (callerClaims['role'] as string) || '';
    const callerConservatoriumId: string = (callerClaims['conservatoriumId'] as string) || '';
    const callerApproved: boolean = (callerClaims['approved'] as boolean) === true;

    if (!callerApproved) {
      throw new HttpsError('permission-denied', 'Account not approved');
    }

    // ── Input validation ─────────────────────────────────────────────────────
    const parseResult = BookingRequestSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new HttpsError(
        'invalid-argument',
        `Invalid booking request: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
      );
    }

    const {
      teacherId,
      studentId,
      conservatoriumId,
      startTime,
      durationMinutes,
      roomId,
      packageId,
      isVirtual,
      meetingLink,
      instrument,
      type,
    } = parseResult.data;

    // ── Role-based permission check ──────────────────────────────────────────
    // Allowed callers:
    //   - conservatorium_admin / delegated_admin / site_admin (can book for anyone)
    //   - teacher (can book their own lessons)
    //   - student/parent (can book for themselves/their child — only TRIAL/MAKEUP/ADHOC)
    const isAdmin = ['conservatorium_admin', 'delegated_admin', 'site_admin'].includes(callerRole);
    const isTeacher = callerRole === 'teacher';
    const isStudentOrParent = ['student', 'parent'].includes(callerRole);

    if (!isAdmin && !isTeacher && !isStudentOrParent) {
      throw new HttpsError('permission-denied', 'Insufficient role to book lessons');
    }

    // Teachers may only book their own lessons
    if (isTeacher && teacherId !== callerUid) {
      throw new HttpsError('permission-denied', 'Teachers may only book their own lessons');
    }

    // Students may only book their own lessons; only non-recurring types
    if (isStudentOrParent) {
      if (studentId !== callerUid && !await isParentOf(callerUid, studentId)) {
        throw new HttpsError('permission-denied', 'You may only book lessons for yourself or your children');
      }
      if (type === 'RECURRING') {
        throw new HttpsError('permission-denied', 'Students and parents may not create recurring lessons');
      }
    }

    // Tenant isolation: non-site_admin callers must belong to the target conservatorium
    if (callerRole !== 'site_admin' && callerConservatoriumId !== conservatoriumId) {
      throw new HttpsError('permission-denied', 'Cross-conservatorium booking not allowed');
    }

    // ── Firestore transaction ────────────────────────────────────────────────
    const db = getFirestore();
    const conservatoriumRef = db.collection('conservatoriums').doc(conservatoriumId);
    const lessonSlotsCol = conservatoriumRef.collection('lessonSlots');

    const startMs = new Date(startTime).getTime();
    const endMs = endTimeMs(startTime, durationMinutes);

    // Look-back window: query lessons starting up to 60 minutes before our slot
    // (max lesson duration = 60 min, so a lesson starting 60 min before could still be running)
    const windowStartMs = startMs - 60 * 60 * 1000;
    const windowStartIso = new Date(windowStartMs).toISOString();

    let newSlotId: string;

    try {
      await db.runTransaction(async (tx) => {
        // ── 1. Teacher double-booking check ─────────────────────────────────
        const teacherConflictsSnap = await tx.get(
          lessonSlotsCol
            .where('teacherId', '==', teacherId)
            .where('startTime', '>=', windowStartIso)
            .where('startTime', '<', new Date(endMs).toISOString())
            .where('status', 'not-in', ['CANCELLED_STUDENT_NOTICED', 'CANCELLED_STUDENT_NO_NOTICE', 'CANCELLED_TEACHER', 'CANCELLED_CONSERVATORIUM']),
        );

        for (const doc of teacherConflictsSnap.docs) {
          const data = doc.data();
          const existingStartMs = new Date(data.startTime as string).getTime();
          const existingEndMs = endTimeMs(data.startTime as string, data.durationMinutes as number);
          if (overlaps(startMs, endMs, existingStartMs, existingEndMs)) {
            throw new HttpsError(
              'already-exists',
              `Teacher ${teacherId} already has a lesson at ${startTime}`,
            );
          }
        }

        // ── 2. Student double-booking check ─────────────────────────────────
        const studentConflictsSnap = await tx.get(
          lessonSlotsCol
            .where('studentId', '==', studentId)
            .where('startTime', '>=', windowStartIso)
            .where('startTime', '<', new Date(endMs).toISOString())
            .where('status', 'not-in', ['CANCELLED_STUDENT_NOTICED', 'CANCELLED_STUDENT_NO_NOTICE', 'CANCELLED_TEACHER', 'CANCELLED_CONSERVATORIUM']),
        );

        for (const doc of studentConflictsSnap.docs) {
          const data = doc.data();
          const existingStartMs = new Date(data.startTime as string).getTime();
          const existingEndMs = endTimeMs(data.startTime as string, data.durationMinutes as number);
          if (overlaps(startMs, endMs, existingStartMs, existingEndMs)) {
            throw new HttpsError(
              'already-exists',
              `Student ${studentId} already has a lesson at ${startTime}`,
            );
          }
        }

        // ── 3. Room availability check ───────────────────────────────────────
        if (roomId) {
          const roomConflictsSnap = await tx.get(
            lessonSlotsCol
              .where('roomId', '==', roomId)
              .where('startTime', '>=', windowStartIso)
              .where('startTime', '<', new Date(endMs).toISOString())
              .where('status', 'not-in', ['CANCELLED_STUDENT_NOTICED', 'CANCELLED_STUDENT_NO_NOTICE', 'CANCELLED_TEACHER', 'CANCELLED_CONSERVATORIUM']),
          );

          for (const doc of roomConflictsSnap.docs) {
            const data = doc.data();
            const existingStartMs = new Date(data.startTime as string).getTime();
            const existingEndMs = endTimeMs(data.startTime as string, data.durationMinutes as number);
            if (overlaps(startMs, endMs, existingStartMs, existingEndMs)) {
              throw new HttpsError(
                'already-exists',
                `Room ${roomId} is already booked at ${startTime}`,
              );
            }
          }
        }

        // ── 4. Package credit check ──────────────────────────────────────────
        let isCreditConsumed = false;
        let packageRef;

        if (packageId) {
          packageRef = conservatoriumRef.collection('lessonPackages').doc(packageId);
          const packageSnap = await tx.get(packageRef);

          if (!packageSnap.exists) {
            throw new HttpsError('not-found', `Package ${packageId} not found`);
          }

          const packageData = packageSnap.data()!;
          const remainingCredits = (packageData['remainingCredits'] as number) ?? 0;

          if (remainingCredits <= 0) {
            throw new HttpsError('resource-exhausted', `Package ${packageId} has no remaining credits`);
          }

          // Decrement credits atomically
          tx.update(packageRef, {
            remainingCredits: FieldValue.increment(-1),
            updatedAt: new Date().toISOString(),
          });

          isCreditConsumed = true;
        }

        // ── 5. Create the LessonSlot document ───────────────────────────────
        const newSlotRef = lessonSlotsCol.doc();
        newSlotId = newSlotRef.id;
        const now = new Date().toISOString();

        const lessonSlot: Record<string, unknown> = {
          id: newSlotId,
          conservatoriumId,
          teacherId,
          studentId,
          instrument,
          startTime,
          durationMinutes,
          type,
          bookingSource: isAdmin ? 'ADMIN' : isTeacher ? 'TEACHER' : 'STUDENT_SELF',
          isVirtual,
          status: 'SCHEDULED',
          isCreditConsumed,
          createdAt: now,
          updatedAt: now,
          createdBy: callerUid,
        };

        if (roomId) lessonSlot['roomId'] = roomId;
        if (packageId) lessonSlot['packageId'] = packageId;
        if (meetingLink) lessonSlot['meetingLink'] = meetingLink;

        tx.set(newSlotRef, lessonSlot);
      });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('[bookLessonSlot] Transaction failed:', error);
      throw new HttpsError('internal', 'Failed to book lesson slot. Please try again.');
    }

    logger.info(`[bookLessonSlot] Created slot ${newSlotId!} for student ${studentId} with teacher ${teacherId}`);

    return { slotId: newSlotId! };
  },
);

// ---------------------------------------------------------------------------
// Helper: check parentOf link
// ---------------------------------------------------------------------------

async function isParentOf(parentUid: string, studentUid: string): Promise<boolean> {
  const db = getFirestore();
  const parentOfRef = db.collection('parentOf').doc(`${parentUid}_${studentUid}`);
  const snap = await parentOfRef.get();
  return snap.exists;
}
