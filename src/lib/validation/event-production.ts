/**
 * @fileoverview Zod validation schema for EventProduction upsert operations.
 * Based on Security team's schema spec (Security-Zod-fixes.md section 5).
 */
import { z } from 'zod';

const EventProductionStatusSchema = z.enum([
  'PLANNING', 'OPEN_REGISTRATION', 'CLOSED', 'COMPLETED',
]);

const EventVisibilityStatusSchema = z.enum([
  'draft', 'published', 'cancelled', 'completed',
]);

const PerformanceSlotSchema = z.object({
  performerId: z.string().optional(),
  performerName: z.string().optional(),
  compositionTitle: z.string(),
  composer: z.string(),
  duration: z.string().regex(/^\d{1,3}:\d{2}$/),
}).passthrough();

const LocalizedTextSchema = z.object({
  he: z.string(),
  en: z.string(),
  ru: z.string().optional(),
  ar: z.string().optional(),
});

export const EventProductionUpsertSchema = z.object({
  id: z.string().min(1),
  conservatoriumId: z.string().min(1),
  name: z.string().min(1).max(300),
  title: LocalizedTextSchema.optional(),
  description: LocalizedTextSchema.optional(),
  type: z.enum(['RECITAL', 'CONCERT', 'EXAM_PERFORMANCE', 'OPEN_DAY']),
  venue: z.string().min(1),
  eventDate: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  status: EventProductionStatusSchema,
  visibilityStatus: EventVisibilityStatusSchema.optional(),
  program: z.array(PerformanceSlotSchema),
  isPublic: z.boolean().optional(),
  isFree: z.boolean().optional(),
  ticketPrice: z.number().min(0).optional(),
  totalSeats: z.number().int().min(0).optional(),
  posterUrl: z.string().optional(),
  publishedAt: z.string().optional(),
  dressRehearsalDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).passthrough();

export type EventProductionUpsertInput = z.infer<typeof EventProductionUpsertSchema>;
