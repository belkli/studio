/**
 * @fileoverview Zod validation schema for Conservatorium upsert operations.
 * Based on Security team's schema spec (Security-Zod-fixes.md section 4).
 */
import { z } from 'zod';

export const ConservatoriumUpsertSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  nameEn: z.string().max(200).optional(),
  tier: z.enum(['A', 'B', 'C']),
  stampUrl: z.string().optional(),
  newFeaturesEnabled: z.boolean().optional(),
  aiAgentsConfig: z.record(z.string(), z.boolean()).optional(),

  pricingConfig: z.object({
    baseRatePerLesson: z.object({
      '30': z.number().min(0),
      '45': z.number().min(0),
      '60': z.number().min(0),
    }),
    discounts: z.object({
      pack5: z.number().min(0).max(100),
      pack10: z.number().min(0).max(100),
      yearly: z.number().min(0).max(100),
      sibling: z.number().min(0).max(100),
    }),
    adHocPremium: z.number().min(0).max(100),
    trialPrice: z.number().min(0),
  }).optional(),

  cancellationPolicy: z.object({
    studentNoticeHoursRequired: z.number().int().min(0),
    studentCancellationCredit: z.enum(['FULL', 'NONE']),
    studentLateCancelCredit: z.enum(['FULL', 'NONE']),
    noShowCredit: z.literal('NONE'),
    makeupCreditExpiryDays: z.number().int().min(0),
    maxMakeupsPerTerm: z.number().int().min(0),
  }).optional(),

  // Public profile fields
  about: z.string().max(10000).optional(),
  email: z.string().email().optional().or(z.literal('')),
  secondaryEmail: z.string().email().optional().or(z.literal('')),
  tel: z.string().optional(),
  officialSite: z.string().optional(),
  openingHours: z.string().optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),

  location: z.object({
    city: z.string(),
    cityEn: z.string().optional(),
    address: z.string().optional(),
    postalCode: z.string().optional(),
    googlePlaceId: z.string().optional(),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
    googleMapsUrl: z.string().optional(),
    branches: z.array(z.string()).optional(),
  }).optional(),

  programs: z.array(z.string()).optional(),
  ensembles: z.array(z.string()).optional(),
  photoUrls: z.array(z.string()).optional(),
}).passthrough();
// .passthrough() allows nested complex types (manager, departments,
// socialMedia, translations, etc.) to pass through.

export type ConservatoriumUpsertInput = z.infer<typeof ConservatoriumUpsertSchema>;
