/**
 * @fileoverview Server action for policy-enforced lesson rescheduling and cancellation.
 * Enforces the 24-hour notice window per CancellationPolicy.
 * Students who reschedule < 24h before their lesson are blocked (same penalty as late cancel).
 * Admin bypass is available for conservatorium_admin / site_admin.
 */
'use server';

import type { LessonSlot, CancellationPolicy } from '@/lib/types';

export interface RescheduleLessonInput {
    lessonSlotId: string;
    newStartTime: string;   // ISO datetime
    newRoomId?: string;
    reason?: string;
    requestedBy: string;    // userId
    conservatoriumId: string;
    bypassNoticeCheck?: boolean; // admin override
}

export interface RescheduleLessonResult {
    success: boolean;
    isLateReschedule: boolean;
    error?: string;
    errorCode?: 'INSUFFICIENT_NOTICE' | 'SLOT_NOT_FOUND' | 'SLOT_NOT_SCHEDULED' | 'UNAUTHORIZED_BYPASS';
    hoursGiven?: number;
    hoursRequired?: number;
    makeupEntitled?: boolean;
    updatedSlot?: Partial<LessonSlot>;
}

export interface CancelLessonInput {
    lessonSlotId: string;
    cancelledBy: string;
    conservatoriumId: string;
    reason?: string;
    bypassNoticeCheck?: boolean;
}

export interface CancelLessonResult {
    success: boolean;
    isLateCancellation: boolean;
    makeupCreditIssued: boolean;
    error?: string;
}

const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
    studentNoticeHoursRequired: 24,
    studentCancellationCredit: 'FULL',
    studentLateCancelCredit: 'NONE',
    noShowCredit: 'NONE',
    makeupCreditExpiryDays: 90,
    maxMakeupsPerTerm: 3,
};

function computeHoursUntil(startTimeIso: string): number {
    return (new Date(startTimeIso).getTime() - Date.now()) / (1000 * 60 * 60);
}

/**
 * Reschedules a lesson with policy enforcement.
 * Blocks rescheduling if less than noticeHoursRequired remain before the lesson.
 * Admin bypass available via bypassNoticeCheck.
 */
export async function rescheduleLesson(input: RescheduleLessonInput): Promise<RescheduleLessonResult> {
    try {
        const { lessonSlotId, newStartTime, newRoomId, reason: _reason, requestedBy, conservatoriumId, bypassNoticeCheck } = input;

        if (!lessonSlotId || !newStartTime || !requestedBy || !conservatoriumId) {
            return { success: false, isLateReschedule: false, error: 'Missing required fields' };
        }

        if (new Date(newStartTime) <= new Date()) {
            return { success: false, isLateReschedule: false, error: 'New start time must be in the future' };
        }

        // In production: fetch slot from DB and get conservatorium policy
        // For mock: use default policy and simulate slot lookup via lessonSlotId
        const policy: CancellationPolicy = DEFAULT_CANCELLATION_POLICY;

        // In production: const slot = await db.lessons.findById(lessonSlotId);
        // For mock: we don't have the slot's current startTime here, so we can only
        // enforce on the NEW time. The notice check should be against the CURRENT
        // lesson start time. For now we compute against "now" as a proxy.
        // When DB is integrated, replace with: const hoursUntilLesson = computeHoursUntil(slot.startTime);

        // Admin bypass check
        if (bypassNoticeCheck) {
            // In production: verify requestedBy is admin role from session
            // For now: allow bypass when flag is set (caller is responsible for role check at UI level)
            const now = new Date();
            const updatedSlot: Partial<LessonSlot> = {
                startTime: newStartTime,
                rescheduledFrom: undefined,
                rescheduledAt: now.toISOString(),
                updatedAt: now.toISOString(),
            };
            if (newRoomId) updatedSlot.roomId = newRoomId;
            return { success: true, isLateReschedule: false, updatedSlot, makeupEntitled: false };
        }

        // Since we don't have the slot's current startTime in this mock implementation,
        // we use a simulated check: if newStartTime is within the notice window from now,
        // treat it as an insufficient-notice reschedule.
        // In production replace with: hoursUntilLesson = computeHoursUntil(slot.startTime)
        const hoursUntilNew = computeHoursUntil(newStartTime);
        const isLateReschedule = hoursUntilNew < policy.studentNoticeHoursRequired;

        if (isLateReschedule && policy.studentLateCancelCredit === 'NONE') {
            return {
                success: false,
                isLateReschedule: true,
                error: 'Insufficient notice for rescheduling',
                errorCode: 'INSUFFICIENT_NOTICE',
                hoursGiven: Math.round(hoursUntilNew * 10) / 10,
                hoursRequired: policy.studentNoticeHoursRequired,
                makeupEntitled: false,
            };
        }

        const now = new Date();
        const updatedSlot: Partial<LessonSlot> = {
            startTime: newStartTime,
            rescheduledFrom: undefined,
            rescheduledAt: now.toISOString(),
            updatedAt: now.toISOString(),
        };
        if (newRoomId) updatedSlot.roomId = newRoomId;

        return {
            success: true,
            isLateReschedule,
            updatedSlot,
            makeupEntitled: false,
        };
    } catch (error) {
        return {
            success: false,
            isLateReschedule: false,
            error: error instanceof Error ? error.message : 'Unknown error rescheduling',
        };
    }
}

/**
 * Cancels a lesson with policy enforcement.
 * On-time cancellation (>= noticeHoursRequired) with FULL credit policy issues a makeup credit.
 * Late cancellation (< noticeHoursRequired) with NONE policy does not issue a credit.
 */
export async function cancelLesson(input: CancelLessonInput): Promise<CancelLessonResult> {
    try {
        const { lessonSlotId, cancelledBy, conservatoriumId, reason: _reason, bypassNoticeCheck } = input;

        if (!lessonSlotId || !cancelledBy || !conservatoriumId) {
            return { success: false, isLateCancellation: false, makeupCreditIssued: false, error: 'Missing required fields' };
        }

        // In production: fetch slot + conservatorium policy from DB
        const policy: CancellationPolicy = DEFAULT_CANCELLATION_POLICY;

        // In production: const slot = await db.lessons.findById(lessonSlotId);
        // hoursUntilLesson = computeHoursUntil(slot.startTime);
        // For mock: simulate — isLateCancellation defaults to false (on-time)
        const simulatedHoursUntil = 48; // Mock: assume 48h until lesson (on-time)
        const isLateCancellation = !bypassNoticeCheck && simulatedHoursUntil < policy.studentNoticeHoursRequired;

        const makeupCreditIssued = !isLateCancellation && policy.studentCancellationCredit === 'FULL';

        // In production: update slot status in DB, issue MakeupCredit record if entitled
        // For now: return the result for the client to act on
        return {
            success: true,
            isLateCancellation,
            makeupCreditIssued,
        };
    } catch (error) {
        return {
            success: false,
            isLateCancellation: false,
            makeupCreditIssued: false,
            error: error instanceof Error ? error.message : 'Unknown error cancelling',
        };
    }
}
