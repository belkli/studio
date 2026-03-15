import { describe, it, expect } from 'vitest';
import {
  checkMusicianAvailability,
  calculateBookingCost,
} from '@/lib/performance-utils';
import type { User, LessonSlot, PerformanceBooking, PerformanceAssignment } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers to build test fixtures
// ---------------------------------------------------------------------------

function makeMusician(overrides: Partial<User> = {}): User {
  return {
    id: 'musician-1',
    name: 'Test Musician',
    email: 'test@example.com',
    role: 'teacher',
    conservatoriumId: 'cons-1',
    instruments: [{ instrument: 'Piano', level: 'advanced' }],
    availability: [
      { dayOfWeek: 'SUN', startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 'MON', startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 'TUE', startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 'WED', startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 'THU', startTime: '09:00', endTime: '17:00' },
    ],
    performanceProfile: {
      isOptedIn: true,
      adminApproved: true,
      performanceRatePerHour: 150,
    },
    ...overrides,
  } as User;
}

function makeLessonSlot(overrides: Partial<LessonSlot> = {}): LessonSlot {
  return {
    id: 'lesson-1',
    conservatoriumId: 'cons-1',
    teacherId: 'musician-1',
    studentId: 'student-1',
    instrument: 'Piano',
    startTime: '2026-04-06T10:00:00.000Z', // a Sunday
    durationMinutes: 45,
    type: 'RECURRING',
    bookingSource: 'ADMIN',
    isVirtual: false,
    isCreditConsumed: false,
    status: 'SCHEDULED',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as LessonSlot;
}

function makeBooking(overrides: Partial<PerformanceBooking> = {}): PerformanceBooking {
  return {
    id: 'booking-1',
    conservatoriumId: 'cons-1',
    status: 'MUSICIANS_NEEDED',
    inquiryReceivedAt: '2026-03-01T00:00:00.000Z',
    eventName: 'Spring Concert',
    eventType: 'CONCERT',
    eventDate: '2026-04-06', // same Sunday
    eventTime: '18:00',
    clientName: 'Client',
    clientEmail: 'client@example.com',
    clientPhone: '0500000000',
    totalQuote: 5000,
    assignedMusicians: [
      {
        userId: 'musician-1',
        name: 'Test Musician',
        instrument: 'Piano',
        role: 'soloist',
        status: 'pending',
        assignedAt: '2026-03-01T00:00:00.000Z',
        assignedBy: 'admin',
      },
    ],
    ...overrides,
  };
}

function makeAssignment(overrides: Partial<PerformanceAssignment> = {}): PerformanceAssignment {
  return {
    userId: 'musician-1',
    name: 'Test Musician',
    instrument: 'Piano',
    role: 'soloist',
    status: 'pending',
    ratePerHour: 150,
    assignedAt: '2026-03-01T00:00:00.000Z',
    assignedBy: 'admin',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// checkMusicianAvailability
// ---------------------------------------------------------------------------

describe('checkMusicianAvailability', () => {
  it('returns available=true when no conflicts exist', () => {
    const musician = makeMusician();
    // Event on a Sunday — musician has SUN availability, no lessons, no bookings
    const result = checkMusicianAvailability(
      musician,
      '2026-04-06', // Sunday
      '18:00',
      [],
      []
    );
    expect(result.available).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it('returns conflict when lesson slot overlaps on the same day', () => {
    const musician = makeMusician();
    const lessonOnSameDay = makeLessonSlot({
      teacherId: 'musician-1',
      startTime: '2026-04-06T10:00:00.000Z',
    });

    const result = checkMusicianAvailability(
      musician,
      '2026-04-06',
      '18:00',
      [],
      [lessonOnSameDay]
    );

    expect(result.available).toBe(false);
    expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
    expect(result.conflicts.some(c => c.type === 'lesson')).toBe(true);
  });

  it('ignores lesson slots for other teachers', () => {
    const musician = makeMusician({ id: 'musician-1' });
    const otherTeacherLesson = makeLessonSlot({
      teacherId: 'other-teacher',
      startTime: '2026-04-06T10:00:00.000Z',
    });

    const result = checkMusicianAvailability(
      musician,
      '2026-04-06',
      '18:00',
      [],
      [otherTeacherLesson]
    );

    expect(result.available).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it('ignores lesson slots on different days', () => {
    const musician = makeMusician();
    const lessonDifferentDay = makeLessonSlot({
      teacherId: 'musician-1',
      startTime: '2026-04-07T10:00:00.000Z', // Monday
    });

    const result = checkMusicianAvailability(
      musician,
      '2026-04-06', // Sunday
      '18:00',
      [],
      [lessonDifferentDay]
    );

    expect(result.available).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it('returns conflict when another performance booking exists on the same day', () => {
    const musician = makeMusician();
    const existingBooking = makeBooking({
      id: 'booking-other',
      eventDate: '2026-04-06',
      eventTime: '14:00',
      assignedMusicians: [
        {
          userId: 'musician-1',
          name: 'Test Musician',
          instrument: 'Piano',
          role: 'soloist',
          status: 'pending',
          assignedAt: '2026-03-01T00:00:00.000Z',
          assignedBy: 'admin',
        },
      ],
    });

    const result = checkMusicianAvailability(
      musician,
      '2026-04-06',
      '18:00',
      [existingBooking],
      []
    );

    expect(result.available).toBe(false);
    expect(result.conflicts.some(c => c.type === 'performance')).toBe(true);
    expect(result.conflicts[0].detail).toContain('Spring Concert');
  });

  it('ignores bookings for other musicians', () => {
    const musician = makeMusician({ id: 'musician-1' });
    const otherMusicianBooking = makeBooking({
      eventDate: '2026-04-06',
      assignedMusicians: [
        {
          userId: 'musician-other',
          name: 'Other',
          instrument: 'Violin',
          role: 'ensemble',
          status: 'pending',
          assignedAt: '2026-03-01T00:00:00.000Z',
          assignedBy: 'admin',
        },
      ],
    });

    const result = checkMusicianAvailability(
      musician,
      '2026-04-06',
      '18:00',
      [otherMusicianBooking],
      []
    );

    expect(result.available).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it('returns unavailable conflict when musician has no availability on event day-of-week', () => {
    // Musician only available SUN-THU, event is on Friday
    const musician = makeMusician();
    // 2026-04-10 is a Friday
    const result = checkMusicianAvailability(
      musician,
      '2026-04-10',
      '18:00',
      [],
      []
    );

    expect(result.available).toBe(false);
    expect(result.conflicts.some(c => c.type === 'unavailable')).toBe(true);
    expect(result.conflicts[0].detail).toContain('FRI');
  });

  it('skips availability check when musician has no availability schedule', () => {
    const musician = makeMusician({ availability: undefined });

    const result = checkMusicianAvailability(
      musician,
      '2026-04-10', // Friday
      '18:00',
      [],
      []
    );

    // No availability defined = no "unavailable" conflict
    expect(result.available).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it('skips availability check when musician has empty availability array', () => {
    const musician = makeMusician({ availability: [] });

    const result = checkMusicianAvailability(
      musician,
      '2026-04-10', // Friday
      '18:00',
      [],
      []
    );

    expect(result.available).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it('accumulates multiple conflict types', () => {
    // Musician available SUN-THU, event on Friday + has lesson + has booking
    const musician = makeMusician();
    const lesson = makeLessonSlot({
      teacherId: 'musician-1',
      startTime: '2026-04-10T10:00:00.000Z', // Friday
    });
    const booking = makeBooking({
      eventDate: '2026-04-10',
      assignedMusicians: [
        {
          userId: 'musician-1',
          name: 'Test Musician',
          instrument: 'Piano',
          role: 'soloist',
          status: 'pending',
          assignedAt: '2026-03-01T00:00:00.000Z',
          assignedBy: 'admin',
        },
      ],
    });

    const result = checkMusicianAvailability(
      musician,
      '2026-04-10',
      '18:00',
      [booking],
      [lesson]
    );

    expect(result.available).toBe(false);
    // lesson + performance + unavailable = 3
    const types = result.conflicts.map(c => c.type);
    expect(types).toContain('lesson');
    expect(types).toContain('performance');
    expect(types).toContain('unavailable');
  });
});

// ---------------------------------------------------------------------------
// calculateBookingCost
// ---------------------------------------------------------------------------

describe('calculateBookingCost', () => {
  it('multiplies ratePerHour by durationHours for a single assignment', () => {
    const assignments = [makeAssignment({ ratePerHour: 200 })];
    expect(calculateBookingCost(assignments, 3)).toBe(600);
  });

  it('sums cost across multiple assignments', () => {
    const assignments = [
      makeAssignment({ userId: 'a', ratePerHour: 100 }),
      makeAssignment({ userId: 'b', ratePerHour: 250 }),
    ];
    // (100*2) + (250*2) = 700
    expect(calculateBookingCost(assignments, 2)).toBe(700);
  });

  it('treats missing ratePerHour as 0', () => {
    const assignments = [
      makeAssignment({ ratePerHour: undefined }),
    ];
    expect(calculateBookingCost(assignments, 5)).toBe(0);
  });

  it('handles empty assignments array', () => {
    expect(calculateBookingCost([], 3)).toBe(0);
  });

  it('excludes declined assignments from cost', () => {
    const assignments = [
      makeAssignment({ userId: 'a', ratePerHour: 100, status: 'pending' }),
      makeAssignment({ userId: 'b', ratePerHour: 200, status: 'declined' }),
    ];
    // Only 'a' counts: 100 * 2 = 200
    expect(calculateBookingCost(assignments, 2)).toBe(200);
  });

  it('excludes opted_out assignments from cost', () => {
    const assignments = [
      makeAssignment({ userId: 'a', ratePerHour: 100, status: 'accepted' }),
      makeAssignment({ userId: 'b', ratePerHour: 200, status: 'opted_out' }),
    ];
    // Only 'a' counts: 100 * 4 = 400
    expect(calculateBookingCost(assignments, 4)).toBe(400);
  });

  it('includes pending and accepted assignments', () => {
    const assignments = [
      makeAssignment({ userId: 'a', ratePerHour: 100, status: 'pending' }),
      makeAssignment({ userId: 'b', ratePerHour: 200, status: 'accepted' }),
    ];
    // (100*1) + (200*1) = 300
    expect(calculateBookingCost(assignments, 1)).toBe(300);
  });

  it('handles zero duration', () => {
    const assignments = [makeAssignment({ ratePerHour: 500 })];
    expect(calculateBookingCost(assignments, 0)).toBe(0);
  });

  it('handles fractional duration hours', () => {
    const assignments = [makeAssignment({ ratePerHour: 200 })];
    expect(calculateBookingCost(assignments, 1.5)).toBe(300);
  });
});
