/**
 * @fileoverview Utility functions for performance booking management.
 * Provides availability checking and cost calculation helpers.
 */

import type { User, LessonSlot, PerformanceBooking, PerformanceAssignment } from '@/lib/types';

export type AvailabilityConflict = {
  type: 'lesson' | 'performance' | 'unavailable';
  detail: string;
};

export type AvailabilityResult = {
  available: boolean;
  conflicts: AvailabilityConflict[];
};

/**
 * Check whether a musician is available for a given event date/time.
 *
 * Conflicts are detected against:
 * 1. Existing lesson slots for that day
 * 2. Other performance bookings on the same day
 *
 * "Unavailable" means the musician's availabilitySchedule does not include that day.
 */
export function checkMusicianAvailability(
  musician: User,
  eventDate: string,
  eventTime: string,
  existingBookings: PerformanceBooking[],
  lessonSlots: LessonSlot[]
): AvailabilityResult {
  const conflicts: AvailabilityConflict[] = [];

  // Parse event date
  const eventDay = new Date(eventDate).toISOString().slice(0, 10);

  // Check lesson slots on the same day
  const lessonConflicts = lessonSlots.filter(slot => {
    if (slot.teacherId !== musician.id) return false;
    const slotDay = new Date(slot.startTime).toISOString().slice(0, 10);
    return slotDay === eventDay;
  });

  for (const slot of lessonConflicts) {
    const slotTime = new Date(slot.startTime).toLocaleTimeString('he', { hour: '2-digit', minute: '2-digit' });
    conflicts.push({
      type: 'lesson',
      detail: `שיעור בשעה ${slotTime}`,
    });
  }

  // Check other performance bookings on the same day
  const perfConflicts = existingBookings.filter(booking => {
    if (booking.eventDate !== eventDay) return false;
    return booking.assignedMusicians?.some(m => m.userId === musician.id);
  });

  for (const booking of perfConflicts) {
    conflicts.push({
      type: 'performance',
      detail: `${booking.eventName} בשעה ${booking.eventTime}`,
    });
  }

  // Check availability schedule (day-of-week)
  if (musician.availability && musician.availability.length > 0) {
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
    const eventDayOfWeek = dayNames[new Date(eventDate).getDay()];
    const hasAvailabilityOnDay = musician.availability.some(
      (slot: { dayOfWeek: string }) => slot.dayOfWeek === eventDayOfWeek
    );
    if (!hasAvailabilityOnDay) {
      conflicts.push({
        type: 'unavailable',
        detail: `אין זמינות ביום ${eventDayOfWeek}`,
      });
    }
  }

  return {
    available: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Calculate the estimated total cost of all musician assignments for a booking.
 * Only counts non-declined assignments. Falls back to 0 if ratePerHour is missing.
 */
export function calculateBookingCost(
  assignments: PerformanceAssignment[],
  durationHours: number
): number {
  return assignments
    .filter(a => a.status !== 'declined' && a.status !== 'opted_out')
    .reduce((total, assignment) => {
      const rate = assignment.ratePerHour ?? 0;
      return total + rate * durationHours;
    }, 0);
}
