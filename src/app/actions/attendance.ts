/**
 * @fileoverview Server action for marking lesson attendance.
 * SDD-P2 (Teacher) requires one-tap attendance marking with 4 actions:
 * MARK_PRESENT, MARK_NO_SHOW_STUDENT, MARK_ABSENT_NOTICED, MARK_VIRTUAL.
 *
 * This uses Zod validation and implements the business logic.
 * When Firebase is connected, this becomes a real server action
 * that writes to Firestore within a transaction.
 */
'use server';

import type { LessonSlot, SlotStatus } from '@/lib/types';
import { getDb } from '@/lib/db';

export type AttendanceAction = 'MARK_PRESENT' | 'MARK_NO_SHOW_STUDENT' | 'MARK_ABSENT_NOTICED' | 'MARK_VIRTUAL';

export interface MarkAttendanceInput {
    slotId: string;
    action: AttendanceAction;
    teacherNote?: string;
    teacherId: string;
    conservatoriumId: string;
}

interface MarkAttendanceResult {
    success: boolean;
    updatedSlot?: Partial<LessonSlot>;
    error?: string;
    makeupCreditIssued?: boolean;
}

/**
 * Maps an attendance action to the corresponding slot status.
 */
function actionToStatus(action: AttendanceAction): SlotStatus {
    switch (action) {
        case 'MARK_PRESENT': return 'COMPLETED';
        case 'MARK_VIRTUAL': return 'COMPLETED';
        case 'MARK_NO_SHOW_STUDENT': return 'NO_SHOW_STUDENT';
        case 'MARK_ABSENT_NOTICED': return 'CANCELLED_STUDENT_NOTICED';
        default: return 'COMPLETED';
    }
}

/**
 * Marks attendance for a lesson slot.
 *
 * TODO: If makeupCreditIssued, create a MakeupCredit document in a transaction
 *       once transactional batch writes are available in the adapter.
 * TODO: db.notifications — notify student/parent of no-show or cancellation
 *       once the notifications write path is exposed (currently Cloud Functions only).
 */
export async function markAttendance(input: MarkAttendanceInput): Promise<MarkAttendanceResult> {
    try {
        const { slotId, action, teacherNote, teacherId, conservatoriumId } = input;

        // Validation
        if (!slotId || !action || !teacherId || !conservatoriumId) {
            return { success: false, error: 'Missing required fields' };
        }

        const newStatus = actionToStatus(action);
        const now = new Date().toISOString();

        // Build the update payload
        const updatedSlot: Partial<LessonSlot> = {
            status: newStatus,
            attendanceMarkedAt: now,
            updatedAt: now,
        };

        if (teacherNote) {
            updatedSlot.teacherNote = teacherNote;
        }

        const makeupCreditIssued = action === 'MARK_ABSENT_NOTICED';

        const db = await getDb();
        await db.lessons.update(slotId, updatedSlot);

        // Notify relevant party for cancellations and no-shows (non-fatal)
        try {
            const lesson = await db.lessons.findById(slotId);
            if (lesson && (newStatus === 'CANCELLED_STUDENT_NOTICED' || newStatus === 'NO_SHOW_STUDENT' || newStatus === 'NO_SHOW_TEACHER')) {
                const notifyUserId = newStatus === 'NO_SHOW_TEACHER' ? lesson.studentId : lesson.teacherId;
                const title = newStatus === 'NO_SHOW_TEACHER'
                    ? 'Teacher no-show recorded'
                    : newStatus === 'NO_SHOW_STUDENT'
                        ? 'Student no-show recorded'
                        : 'Lesson cancelled by student';
                const message = newStatus === 'NO_SHOW_TEACHER'
                    ? 'Your teacher did not attend the scheduled lesson. A makeup credit may be issued.'
                    : newStatus === 'NO_SHOW_STUDENT'
                        ? 'The student did not attend the scheduled lesson.'
                        : 'The student cancelled the lesson with advance notice.';

                await db.notifications.create({
                    userId: notifyUserId,
                    conservatoriumId,
                    title,
                    message,
                    link: '/dashboard/schedule',
                    read: false,
                    timestamp: now,
                });
            }
        } catch (notifErr) {
            console.error('[markAttendance] Notification failed (non-fatal):', notifErr);
        }

        return {
            success: true,
            updatedSlot,
            makeupCreditIssued,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error marking attendance',
        };
    }
}
