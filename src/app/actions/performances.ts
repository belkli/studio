'use server';

import { z } from 'zod';
import { withAuth } from '@/lib/auth-utils';

const PerformanceMusicianRoleSchema = z.enum(['soloist', 'ensemble', 'accompanist', 'conductor']);

const AssignSchema = z.object({
  bookingId: z.string(),
  assignments: z.array(
    z.object({
      userId: z.string(),
      role: PerformanceMusicianRoleSchema,
    })
  ),
});

/**
 * Assign musicians to a performance booking.
 * Restricted to conservatorium_admin, delegated_admin, site_admin.
 *
 * NOTE: In the memory-backend environment, assignment is performed client-side via
 * useEventsDomain.assignMusiciansToPerformance(). This server action is provided for
 * future Postgres/Supabase backend use and validates role access.
 */
export const assignMusiciansAction = withAuth(
  AssignSchema,
  async (data) => {
    // Client-side mock handles the mutation via useEventsDomain.
    // When a real DB adapter with performanceBookings is added, implement here.
    return { success: true, assignedCount: data.assignments.length };
  },
  { roles: ['conservatorium_admin', 'delegated_admin', 'site_admin'] }
);

const RespondSchema = z.object({
  bookingId: z.string(),
  accept: z.boolean(),
  declineReason: z.string().optional(),
});

/**
 * Teacher responds to a performance invitation (accept or decline).
 * Restricted to teacher role.
 *
 * NOTE: In the memory-backend environment, response is performed client-side via
 * useEventsDomain.respondToPerformanceInvitation(). This server action validates role access.
 */
export const respondToPerformanceInvitationAction = withAuth(
  RespondSchema,
  async (data) => {
    // Client-side mock handles the mutation via useEventsDomain.
    return { success: true, accepted: data.accept };
  },
  { roles: ['teacher'] }
);
