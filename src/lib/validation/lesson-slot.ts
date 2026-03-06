/**
 * @fileoverview Zod validation schema for LessonSlot upsert operations.
 * Based on Security team's schema spec (Security-Zod-fixes.md section 3).
 */
import { z } from 'zod';

const LessonTypeSchema = z.enum(['RECURRING', 'MAKEUP', 'TRIAL', 'ADHOC', 'GROUP']);

const SlotStatusSchema = z.enum([
  'SCHEDULED', 'COMPLETED',
  'CANCELLED_STUDENT_NOTICED', 'CANCELLED_STUDENT_NO_NOTICE',
  'CANCELLED_TEACHER', 'CANCELLED_CONSERVATORIUM',
  'NO_SHOW_STUDENT', 'NO_SHOW_TEACHER',
]);

const BookingSourceSchema = z.enum([
  'STUDENT_SELF', 'PARENT', 'TEACHER', 'ADMIN', 'AUTO_MAKEUP',
]);

export const LessonSlotUpsertSchema = z.object({
  id: z.string().min(1),
  conservatoriumId: z.string().min(1),
  teacherId: z.string().min(1),
  studentId: z.string().min(1),
  instrument: z.string().min(1),
  startTime: z.string(), // ISO Timestamp
  durationMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  recurrenceId: z.string().optional(),
  type: LessonTypeSchema,
  bookingSource: BookingSourceSchema,
  roomId: z.string().optional(),
  branchId: z.string().optional(),
  isVirtual: z.boolean(),
  meetingLink: z.string().optional(),
  packageId: z.string().optional(),
  isCreditConsumed: z.boolean(),
  makeupCreditId: z.string().optional(),
  status: SlotStatusSchema,
  attendanceMarkedAt: z.string().optional(),
  teacherNote: z.string().max(2000).optional(),
  cancelledAt: z.string().optional(),
  cancelledBy: z.string().optional(),
  cancellationReason: z.string().max(1000).optional(),
  rescheduledFrom: z.string().optional(),
  rescheduledAt: z.string().optional(),
  googleCalendarEventId: z.string().optional(),
  effectiveRate: z.number().min(0).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LessonSlotUpsertInput = z.infer<typeof LessonSlotUpsertSchema>;
