/**
 * @fileoverview Zod validation schemas for booking-related actions.
 * SDD-P6 (QA) and SDD-P7 (Security) require server-side validation
 * on every callable function / server action. These schemas prevent
 * injection of invalid data (e.g., amount: 0, wrong packageId).
 */
import { z } from 'zod';

// ── Book Lesson Slot ─────────────────────────────────────────
export const BookingRequestSchema = z.object({
    teacherId: z.string().min(1, 'Teacher ID is required'),
    studentId: z.string().min(1, 'Student ID is required'),
    conservatoriumId: z.string().min(1, 'Conservatorium ID is required'),
    startTime: z.string().datetime({ message: 'Invalid ISO datetime for startTime' }),
    durationMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)], {
        errorMap: () => ({ message: 'Duration must be 30, 45, or 60 minutes' }),
    }),
    roomId: z.string().optional(),
    packageId: z.string().optional(),
    isVirtual: z.boolean().default(false),
    meetingLink: z.string().url().optional(),
    type: z.enum(['RECURRING', 'MAKEUP', 'TRIAL', 'ADHOC', 'GROUP']).default('RECURRING'),
});

export type BookingRequest = z.infer<typeof BookingRequestSchema>;

// ── Book Makeup Lesson ───────────────────────────────────────
export const MakeupBookingRequestSchema = z.object({
    studentId: z.string().min(1),
    conservatoriumId: z.string().min(1),
    makeupCreditId: z.string().min(1, 'Makeup credit ID is required'),
    teacherId: z.string().min(1),
    startTime: z.string().datetime(),
    durationMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
    roomId: z.string().optional(),
});

export type MakeupBookingRequest = z.infer<typeof MakeupBookingRequestSchema>;

// ── Reschedule Lesson ────────────────────────────────────────
export const RescheduleRequestSchema = z.object({
    lessonSlotId: z.string().min(1),
    newStartTime: z.string().datetime(),
    newRoomId: z.string().optional(),
    reason: z.string().max(500).optional(),
});

export type RescheduleRequest = z.infer<typeof RescheduleRequestSchema>;

// ── Cancel Lesson ────────────────────────────────────────────
export const CancelLessonRequestSchema = z.object({
    lessonSlotId: z.string().min(1),
    reason: z.string().max(500).optional(),
    cancelledBy: z.string().min(1),
});

export type CancelLessonRequest = z.infer<typeof CancelLessonRequestSchema>;
