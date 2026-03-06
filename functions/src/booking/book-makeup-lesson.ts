/**
 * @fileoverview bookMakeupLesson — Callable Cloud Function for atomic makeup lesson booking.
 *
 * Uses a Firestore transaction to:
 * 1. Verify the makeup credit exists, belongs to the student, and is unused
 * 2. Verify no double-booking for teacher+student at the requested time
 * 3. Verify the room (if requested) is not already booked
 * 4. Create the LessonSlot document with type=MAKEUP atomically
 * 5. Mark the makeup credit as consumed
 *
 * Region: europe-west1 (PDPPA data residency)
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { z } from 'zod';
import { FUNCTIONS_REGION } from '../types';

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const MakeupBookingRequestSchema = z.object({
  studentId: z.string().min(1),
  conservatoriumId: z.string().min(1),
  makeupCreditId: z.string().min(1),
  teacherId: z.string().min(1),
  startTime: z.string().datetime(),
  durationMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  roomId: z.string().optional(),
  instrument: z.string().min(1),
  isVirtual: z.boolean().default(false),
  meetingLink: z.string().url().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function endTimeMs(startTimeIso: string, durationMinutes: number): number {
  return new Date(startTimeIso).getTime() + durationMinutes * 60 * 1000;
}

function overlaps(s1Ms: number, e1Ms: number, s2Ms: number, e2Ms: number): boolean {
  return s1Ms < e2Ms && s2Ms < e1Ms;
}

// ---------------------------------------------------------------------------
// Main callable function
// ---------------------------------------------------------------------------

export const bookMakeupLesson = onCall(
  {
    region: FUNCTIONS_REGION,
    enforceAppCheck: false,
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
    const parseResult = MakeupBookingRequestSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new HttpsError(
        'invalid-argument',
        `Invalid makeup booking request: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
      );
    }

    const {
      studentId,
      conservatoriumId,
      makeupCreditId,
      teacherId,
      startTime,
      durationMinutes,
      roomId,
      instrument,
      isVirtual,
      meetingLink,
    } = parseResult.data;

    // ── Role-based permission check ──────────────────────────────────────────
    const isAdmin = ['conservatorium_admin', 'delegated_admin', 'site_admin'].includes(callerRole);
    const isTeacher = callerRole === 'teacher';
    const isStudentOrParent = ['student', 'parent'].includes(callerRole);

    if (!isAdmin && !isTeacher && !isStudentOrParent) {
      throw new HttpsError('permission-denied', 'Insufficient role to book makeup lessons');
    }

    if (isStudentOrParent) {
      if (studentId !== callerUid && !await isParentOf(callerUid, studentId)) {
        throw new HttpsError('permission-denied', 'You may only book makeup lessons for yourself or your children');
      }
    }

    // Tenant isolation
    if (callerRole !== 'site_admin' && callerConservatoriumId !== conservatoriumId) {
      throw new HttpsError('permission-denied', 'Cross-conservatorium booking not allowed');
    }

    // ── Firestore transaction ────────────────────────────────────────────────
    const db = getFirestore();
    const conservatoriumRef = db.collection('conservatoriums').doc(conservatoriumId);
    const lessonSlotsCol = conservatoriumRef.collection('lessonSlots');
    const makeupCreditsCol = conservatoriumRef.collection('makeupCredits');

    const startMs = new Date(startTime).getTime();
    const endMs = endTimeMs(startTime, durationMinutes);
    const windowStartMs = startMs - 60 * 60 * 1000;
    const windowStartIso = new Date(windowStartMs).toISOString();
    const endIso = new Date(endMs).toISOString();

    let newSlotId: string;

    try {
      await db.runTransaction(async (tx) => {
        // ── 1. Verify makeup credit ──────────────────────────────────────────
        const creditRef = makeupCreditsCol.doc(makeupCreditId);
        const creditSnap = await tx.get(creditRef);

        if (!creditSnap.exists) {
          throw new HttpsError('not-found', `Makeup credit ${makeupCreditId} not found`);
        }

        const creditData = creditSnap.data()!;

        if (creditData['studentId'] !== studentId) {
          throw new HttpsError('permission-denied', 'Makeup credit does not belong to this student');
        }

        if (creditData['consumed'] === true) {
          throw new HttpsError('already-exists', 'Makeup credit has already been used');
        }

        if (creditData['expiresAt'] && new Date(creditData['expiresAt'] as string) < new Date()) {
          throw new HttpsError('deadline-exceeded', 'Makeup credit has expired');
        }

        // ── 2. Teacher double-booking check ─────────────────────────────────
        const cancelledStatuses = [
          'CANCELLED_STUDENT_NOTICED',
          'CANCELLED_STUDENT_NO_NOTICE',
          'CANCELLED_TEACHER',
          'CANCELLED_CONSERVATORIUM',
        ];

        const teacherConflictsSnap = await tx.get(
          lessonSlotsCol
            .where('teacherId', '==', teacherId)
            .where('startTime', '>=', windowStartIso)
            .where('startTime', '<', endIso)
            .where('status', 'not-in', cancelledStatuses),
        );

        for (const doc of teacherConflictsSnap.docs) {
          const data = doc.data();
          const existingStartMs = new Date(data['startTime'] as string).getTime();
          const existingEndMs = endTimeMs(data['startTime'] as string, data['durationMinutes'] as number);
          if (overlaps(startMs, endMs, existingStartMs, existingEndMs)) {
            throw new HttpsError('already-exists', `Teacher ${teacherId} already has a lesson at ${startTime}`);
          }
        }

        // ── 3. Student double-booking check ─────────────────────────────────
        const studentConflictsSnap = await tx.get(
          lessonSlotsCol
            .where('studentId', '==', studentId)
            .where('startTime', '>=', windowStartIso)
            .where('startTime', '<', endIso)
            .where('status', 'not-in', cancelledStatuses),
        );

        for (const doc of studentConflictsSnap.docs) {
          const data = doc.data();
          const existingStartMs = new Date(data['startTime'] as string).getTime();
          const existingEndMs = endTimeMs(data['startTime'] as string, data['durationMinutes'] as number);
          if (overlaps(startMs, endMs, existingStartMs, existingEndMs)) {
            throw new HttpsError('already-exists', `Student ${studentId} already has a lesson at ${startTime}`);
          }
        }

        // ── 4. Room availability check ───────────────────────────────────────
        if (roomId) {
          const roomConflictsSnap = await tx.get(
            lessonSlotsCol
              .where('roomId', '==', roomId)
              .where('startTime', '>=', windowStartIso)
              .where('startTime', '<', endIso)
              .where('status', 'not-in', cancelledStatuses),
          );

          for (const doc of roomConflictsSnap.docs) {
            const data = doc.data();
            const existingStartMs = new Date(data['startTime'] as string).getTime();
            const existingEndMs = endTimeMs(data['startTime'] as string, data['durationMinutes'] as number);
            if (overlaps(startMs, endMs, existingStartMs, existingEndMs)) {
              throw new HttpsError('already-exists', `Room ${roomId} is already booked at ${startTime}`);
            }
          }
        }

        // ── 5. Create LessonSlot + consume credit atomically ────────────────
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
          type: 'MAKEUP',
          bookingSource: isAdmin ? 'ADMIN' : isTeacher ? 'TEACHER' : 'STUDENT_SELF',
          isVirtual,
          status: 'SCHEDULED',
          isCreditConsumed: true,
          makeupCreditId,
          createdAt: now,
          updatedAt: now,
          createdBy: callerUid,
        };

        if (roomId) lessonSlot['roomId'] = roomId;
        if (meetingLink) lessonSlot['meetingLink'] = meetingLink;

        tx.set(newSlotRef, lessonSlot);

        // Mark the makeup credit as consumed
        tx.update(creditRef, {
          consumed: true,
          consumedAt: now,
          consumedBySlotId: newSlotId,
          updatedAt: now,
        });
      });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('[bookMakeupLesson] Transaction failed:', error);
      throw new HttpsError('internal', 'Failed to book makeup lesson. Please try again.');
    }

    logger.info(`[bookMakeupLesson] Created makeup slot ${newSlotId!} for student ${studentId}, credit ${makeupCreditId}`);

    return { slotId: newSlotId! };
  },
);

// ---------------------------------------------------------------------------
// Helper: check parentOf link
// ---------------------------------------------------------------------------

async function isParentOf(parentUid: string, studentUid: string): Promise<boolean> {
  const db = getFirestore();
  const snap = await db.collection('parentOf').doc(`${parentUid}_${studentUid}`).get();
  return snap.exists;
}
