import { describe, it, expect } from 'vitest';
import {
  BookingRequestSchema,
  MakeupBookingRequestSchema,
  RescheduleRequestSchema,
  CancelLessonRequestSchema,
} from '@/lib/validation/booking';

// ── BookingRequestSchema ──────────────────────────────────────────────────────

describe('BookingRequestSchema', () => {
  const validBooking = {
    teacherId: 'teacher-1',
    studentId: 'student-1',
    conservatoriumId: 'cons-1',
    startTime: '2026-06-01T10:00:00.000Z',
    durationMinutes: 45,
  };

  it('accepts a valid booking request', () => {
    const result = BookingRequestSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it('defaults isVirtual to false', () => {
    const result = BookingRequestSchema.parse(validBooking);
    expect(result.isVirtual).toBe(false);
  });

  it('defaults type to RECURRING', () => {
    const result = BookingRequestSchema.parse(validBooking);
    expect(result.type).toBe('RECURRING');
  });

  it('rejects empty teacherId', () => {
    const result = BookingRequestSchema.safeParse({ ...validBooking, teacherId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty studentId', () => {
    const result = BookingRequestSchema.safeParse({ ...validBooking, studentId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty conservatoriumId', () => {
    const result = BookingRequestSchema.safeParse({ ...validBooking, conservatoriumId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid ISO datetime for startTime', () => {
    const result = BookingRequestSchema.safeParse({ ...validBooking, startTime: '2026-06-01 10:00' });
    expect(result.success).toBe(false);
  });

  it('accepts duration 30', () => {
    const result = BookingRequestSchema.safeParse({ ...validBooking, durationMinutes: 30 });
    expect(result.success).toBe(true);
  });

  it('accepts duration 60', () => {
    const result = BookingRequestSchema.safeParse({ ...validBooking, durationMinutes: 60 });
    expect(result.success).toBe(true);
  });

  it('accepts duration 90 (configurable durations)', () => {
    const result = BookingRequestSchema.safeParse({ ...validBooking, durationMinutes: 90 });
    expect(result.success).toBe(true);
  });

  it('rejects duration below 15', () => {
    const result = BookingRequestSchema.safeParse({ ...validBooking, durationMinutes: 10 });
    expect(result.success).toBe(false);
  });

  it('rejects duration above 180', () => {
    const result = BookingRequestSchema.safeParse({ ...validBooking, durationMinutes: 200 });
    expect(result.success).toBe(false);
  });

  it('accepts valid meetingLink URL', () => {
    const result = BookingRequestSchema.safeParse({
      ...validBooking,
      meetingLink: 'https://zoom.us/j/123456',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid meetingLink (not a URL)', () => {
    const result = BookingRequestSchema.safeParse({
      ...validBooking,
      meetingLink: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid lesson types', () => {
    for (const type of ['RECURRING', 'MAKEUP', 'TRIAL', 'ADHOC', 'GROUP'] as const) {
      const result = BookingRequestSchema.safeParse({ ...validBooking, type });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid lesson type', () => {
    const result = BookingRequestSchema.safeParse({ ...validBooking, type: 'UNKNOWN' });
    expect(result.success).toBe(false);
  });
});

// ── MakeupBookingRequestSchema ────────────────────────────────────────────────

describe('MakeupBookingRequestSchema', () => {
  const validMakeup = {
    studentId: 'student-1',
    conservatoriumId: 'cons-1',
    makeupCreditId: 'credit-abc',
    teacherId: 'teacher-1',
    startTime: '2026-06-01T10:00:00.000Z',
    durationMinutes: 30,
  };

  it('accepts a valid makeup booking', () => {
    const result = MakeupBookingRequestSchema.safeParse(validMakeup);
    expect(result.success).toBe(true);
  });

  it('rejects empty makeupCreditId', () => {
    const result = MakeupBookingRequestSchema.safeParse({ ...validMakeup, makeupCreditId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid datetime', () => {
    const result = MakeupBookingRequestSchema.safeParse({ ...validMakeup, startTime: 'bad date' });
    expect(result.success).toBe(false);
  });

  it('accepts duration 120 (configurable durations)', () => {
    const result = MakeupBookingRequestSchema.safeParse({ ...validMakeup, durationMinutes: 120 });
    expect(result.success).toBe(true);
  });

  it('rejects duration below 15', () => {
    const result = MakeupBookingRequestSchema.safeParse({ ...validMakeup, durationMinutes: 5 });
    expect(result.success).toBe(false);
  });

  it('rejects duration above 180', () => {
    const result = MakeupBookingRequestSchema.safeParse({ ...validMakeup, durationMinutes: 200 });
    expect(result.success).toBe(false);
  });
});

// ── RescheduleRequestSchema ───────────────────────────────────────────────────

describe('RescheduleRequestSchema', () => {
  const validReschedule = {
    lessonSlotId: 'slot-1',
    newStartTime: '2026-06-02T14:00:00.000Z',
  };

  it('accepts a valid reschedule request', () => {
    const result = RescheduleRequestSchema.safeParse(validReschedule);
    expect(result.success).toBe(true);
  });

  it('rejects empty lessonSlotId', () => {
    const result = RescheduleRequestSchema.safeParse({ ...validReschedule, lessonSlotId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects reason exceeding 500 chars', () => {
    const result = RescheduleRequestSchema.safeParse({
      ...validReschedule,
      reason: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts reason of exactly 500 chars', () => {
    const result = RescheduleRequestSchema.safeParse({
      ...validReschedule,
      reason: 'x'.repeat(500),
    });
    expect(result.success).toBe(true);
  });
});

// ── CancelLessonRequestSchema ─────────────────────────────────────────────────

describe('CancelLessonRequestSchema', () => {
  const validCancel = {
    lessonSlotId: 'slot-1',
    cancelledBy: 'user-1',
  };

  it('accepts a valid cancel request', () => {
    const result = CancelLessonRequestSchema.safeParse(validCancel);
    expect(result.success).toBe(true);
  });

  it('rejects empty lessonSlotId', () => {
    const result = CancelLessonRequestSchema.safeParse({ ...validCancel, lessonSlotId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty cancelledBy', () => {
    const result = CancelLessonRequestSchema.safeParse({ ...validCancel, cancelledBy: '' });
    expect(result.success).toBe(false);
  });

  it('rejects reason exceeding 500 chars', () => {
    const result = CancelLessonRequestSchema.safeParse({
      ...validCancel,
      reason: 'y'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional reason within limit', () => {
    const result = CancelLessonRequestSchema.safeParse({
      ...validCancel,
      reason: 'Teacher is sick',
    });
    expect(result.success).toBe(true);
  });
});
