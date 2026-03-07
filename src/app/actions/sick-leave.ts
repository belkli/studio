/**
 * @fileoverview Server action for teacher sick leave.
 * SDD-P2 (Teacher) specifies: teacher reports sick → batch cancel
 * affected slots → issue makeup credits → notify admin + parents.
 * 
 * SDD-P6 (QA) flags a rate-limit check: if a teacher has >3 sick leaves
 * in 30 days, an admin review flag should be raised.
 */
'use server';

import type { TeacherException } from '@/lib/types';

const _MAX_SICK_LEAVES_BEFORE_FLAG = 3;
const _SICK_LEAVE_WINDOW_DAYS = 30;

export interface SubmitSickLeaveInput {
    teacherId: string;
    conservatoriumId: string;
    fromDate: string; // ISO Date 'YYYY-MM-DD'
    toDate: string;   // ISO Date 'YYYY-MM-DD'
    note?: string;
}

interface SubmitSickLeaveResult {
    success: boolean;
    affectedSlotsCount: number;
    makeupCreditsIssued: number;
    exceptionId: string;
    adminFlagRaised: boolean;
    error?: string;
}

/**
 * Submits a sick leave request for a teacher.
 * 
 * Business logic (to be implemented with Firestore transactions):
 * 1. Create TeacherException document
 * 2. Query all SCHEDULED slots for this teacher in the date range
 * 3. Batch cancel each slot (status → CANCELLED_TEACHER)
 * 4. For each cancelled slot, issue a MakeupCredit to the student
 * 5. Notify admin about the sick leave
 * 6. Notify each affected student/parent about the cancellation
 * 7. Check rate limit — raise admin flag if >3 in 30 days
 * 
 * SDD-P6 race condition mitigation:
 * - All credit issuance happens inside a Firestore transaction
 * - Slot status change and credit creation are atomic
 */
export async function submitSickLeave(input: SubmitSickLeaveInput): Promise<SubmitSickLeaveResult> {
    try {
        const { teacherId, conservatoriumId: _conservatoriumId, fromDate, toDate, note } = input;

        // Validate dates
        if (new Date(fromDate) > new Date(toDate)) {
            return {
                success: false,
                affectedSlotsCount: 0,
                makeupCreditsIssued: 0,
                exceptionId: '',
                adminFlagRaised: false,
                error: 'From date must be before or equal to To date',
            };
        }

        // Generate exception ID
        const exceptionId = `exception-${Date.now()}`;
        const now = new Date().toISOString();

        // Create the teacher exception record
        const _exception: TeacherException = {
            id: exceptionId,
            teacherId,
            dateFrom: `${fromDate}T00:00:00.000Z`,
            dateTo: `${toDate}T23:59:59.999Z`,
            type: 'SICK_LEAVE',
            note,
            createdAt: now,
        };

        // In production with Firestore:
        // 1. Write exception to conservatoriums/{cid}/teacherExceptions/{exceptionId}
        // 2. Query lessonSlots where teacherId == input.teacherId 
        //    AND startTime >= fromDate AND startTime <= toDate+1day
        //    AND status == 'SCHEDULED'
        // 3. For each affected slot, within a batch write:
        //    a. Update slot status to 'CANCELLED_TEACHER'
        //    b. Create MakeupCredit for that student
        //    c. Send notification to student/parent via dispatcher
        // 4. Check recent sick leaves (last 30 days) — flag if > 3
        // 5. Notify admin via dispatcher

        // Simulated result (with mock data, actual slot cancellation
        // would be done in the AuthProvider context)
        const affectedSlotsCount = 0; // Will be computed from Firestore query
        const makeupCreditsIssued = 0;

        // Rate limit check (simulated)
        const adminFlagRaised = false;

        return {
            success: true,
            affectedSlotsCount,
            makeupCreditsIssued,
            exceptionId,
            adminFlagRaised,
        };
    } catch (error) {
        return {
            success: false,
            affectedSlotsCount: 0,
            makeupCreditsIssued: 0,
            exceptionId: '',
            adminFlagRaised: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
