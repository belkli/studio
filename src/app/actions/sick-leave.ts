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
import { getDb } from '@/lib/db';

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
 * Wired DB calls:
 * - db.teacherExceptions.create()  — persists the exception record
 * - db.lessons.findByConservatorium() + db.lessons.update() — cancels affected slots
 *
 * TODO: db.makeupCredits.create() per cancelled slot — no batch/transaction API yet.
 * TODO: db.notifications.create() for admin + parent notifications.
 * TODO: Rate-limit check (sick leave count in window) requires a date-range query
 *       method on teacherExceptions — add when interface is extended.
 */
export async function submitSickLeave(input: SubmitSickLeaveInput): Promise<SubmitSickLeaveResult> {
    try {
        const { teacherId, conservatoriumId, fromDate, toDate, note } = input;

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

        const exceptionId = `exception-${Date.now()}`;
        const now = new Date().toISOString();

        const exception: TeacherException = {
            id: exceptionId,
            teacherId,
            dateFrom: `${fromDate}T00:00:00.000Z`,
            dateTo: `${toDate}T23:59:59.999Z`,
            type: 'SICK_LEAVE',
            note,
            createdAt: now,
        };

        const db = await getDb();

        // 1. Persist the exception record
        // Cast via unknown: conservatoriumId is not in TeacherException type but is
        // needed by the adapter's findByConservatorium() to scope the document.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.teacherExceptions.create({ ...exception, conservatoriumId } as any);

        // 2. Cancel affected scheduled lessons in the date range
        const allSlots = await db.lessons.findByConservatorium(conservatoriumId);
        const rangeStart = new Date(`${fromDate}T00:00:00.000Z`).getTime();
        const rangeEnd = new Date(`${toDate}T23:59:59.999Z`).getTime();

        const affectedSlots = allSlots.filter(slot => {
            const slotStart = new Date(slot.startTime).getTime();
            return (
                slot.teacherId === teacherId &&
                slot.status === 'SCHEDULED' &&
                slotStart >= rangeStart &&
                slotStart <= rangeEnd
            );
        });

        await Promise.all(
            affectedSlots.map(slot =>
                db.lessons.update(slot.id, {
                    status: 'CANCELLED_TEACHER',
                    cancelledAt: now,
                    cancelledBy: teacherId,
                    cancellationReason: note ?? 'Teacher sick leave',
                })
            )
        );

        // TODO: db.makeupCredits.create() for each affected slot when batch
        //       transaction support is available in the adapter.
        // TODO: adminFlagRaised — needs date-range query on teacherExceptions.

        return {
            success: true,
            affectedSlotsCount: affectedSlots.length,
            makeupCreditsIssued: 0,
            exceptionId,
            adminFlagRaised: false,
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
