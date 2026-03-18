// SEC-H05/QA-M01: @ts-nocheck removed — TypeScript must remain active in this security-critical file.
'use server';
/**
 * @fileoverview Server Actions for the Lyriosa application.
 * This file centralizes all server-side functions that can be called from client components.
 * It uses a higher-order function `withAuth` to ensure that all actions are authenticated
 * and their inputs are validated using Zod schemas, providing a secure and robust API layer.
 */

import { BRAND_DOMAIN } from '@/lib/brand';
import type { Alumnus, Announcement, Branch, Composition, Conservatorium, ConservatoriumInstrument, DonationCause, DonationRecord, EventProduction, FormSubmission, LessonPackage, LessonSlot, Masterclass, Room, ScholarshipApplication, StudentMasterClassAllowance, User } from '@/lib/types';
import { getDb } from '@/lib/db';
import { withAuth, requireRole, verifyAuth } from '@/lib/auth-utils';
import { z } from 'zod';
import { FormSubmissionUpsertSchema } from '@/lib/validation/form-submission-upsert';
import { UserUpsertSchema } from '@/lib/validation/user-upsert';
import { LessonSlotUpsertSchema } from '@/lib/validation/lesson-slot';
import { ConservatoriumUpsertSchema } from '@/lib/validation/conservatorium';
import { EventProductionUpsertSchema } from '@/lib/validation/event-production';

type ComposerSearchResult = {
  id: string;
  name: string;
  names: {
    he: string;
    en: string;
    ru?: string;
    ar?: string;
  };
};


import {
  suggestCompositions,
  type SuggestCompositionsInput,
  type SuggestCompositionsOutput,
} from '@/ai/flows/suggest-compositions';
import { SuggestCompositionsInputSchema } from '@/ai/flows/suggest-compositions';

import {
  matchTeacher,
  type MatchTeacherInput,
  type MatchTeacherOutput
} from '@/ai/flows/match-teacher-flow';
import { MatchTeacherInputSchema } from '@/ai/flows/match-teacher-flow';

import {
  draftProgressReport as invokeDraftProgressReport,
  type DraftProgressReportInput,
  type DraftProgressReportOutput,
} from '@/ai/flows/draft-progress-report-flow';
import { DraftProgressReportInputSchema } from '@/ai/flows/draft-progress-report-flow';

import {
  handleRescheduleRequest,
  type RescheduleRequestInput,
  type RescheduleResponse,
} from '@/ai/flows/reschedule-flow';
import { RescheduleRequestInputSchema } from '@/ai/flows/reschedule-flow';

import {
  askHelpAssistant,
  type HelpAssistantInput,
  type HelpAssistantResponse
} from '@/ai/flows/help-assistant-flow';
import { HelpAssistantInputSchema } from '@/ai/flows/help-assistant-flow';

import {
  getTargetedSlots,
  type TargetSlotsInput,
  type TargetSlotsOutput,
} from '@/ai/flows/target-empty-slots-flow';
import { TargetSlotsInputSchema } from '@/ai/flows/target-empty-slots-flow';

import {
  nurtureLead,
  type NurtureLeadInput,
  type NurtureLeadOutput,
} from '@/ai/flows/nurture-lead-flow';
import { NurtureLeadInputSchema } from '@/ai/flows/nurture-lead-flow';

import {
  generateEventPoster,
  type GenerateEventPosterInput,
  type GenerateEventPosterOutput,
} from '@/ai/flows/generate-event-poster';


// Schemas for non-Genkit actions
const SearchComposersSchema = z.union([
  z.string(),
  z.object({
    query: z.string(),
    instrument: z.string().optional(),
  }),
]);
const SearchCompositionsSchema = z.object({
  query: z.string(),
  composer: z.string().optional(),
  composerId: z.string().optional(),
  instrument: z.string().optional(),
  locale: z.enum(['he', 'en', 'ar', 'ru']).optional(),
});

const AlumnusSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  conservatoriumId: z.string(),
  displayName: z.string().min(2),
  graduationYear: z.number().int().min(1900).max(new Date().getFullYear()),
  primaryInstrument: z.string().min(2),
  currentOccupation: z.string().optional(),
  bio: z.object({ he: z.string().optional(), en: z.string().optional(), ru: z.string().optional(), ar: z.string().optional() }).default({}),
  profilePhotoUrl: z.string().optional(),
  isPublic: z.boolean().default(false),
  achievements: z.array(z.string()).optional(),
  socialLinks: z.object({ website: z.string().optional(), youtube: z.string().optional(), spotify: z.string().optional(), instagram: z.string().optional() }).optional(),
  availableForMasterClasses: z.boolean().default(false),
});

const AnnouncementSchema = z.object({
  id: z.string().optional(),
  conservatoriumId: z.string(),
  title: z.string().min(1),
  body: z.string().min(1),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'PARENTS', 'TEACHERS']).default('ALL'),
  channels: z.array(z.enum(['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'])).default(['IN_APP']),
  sentAt: z.string().optional(),
});

const MasterClassSchema = z.object({
  id: z.string().optional(),
  conservatoriumId: z.string(),
  title: z.object({ he: z.string(), en: z.string(), ru: z.string().optional(), ar: z.string().optional() }),
  description: z.object({ he: z.string(), en: z.string(), ru: z.string().optional(), ar: z.string().optional() }),
  instructor: z.object({
    userId: z.string(),
    displayName: z.string(),
    instrument: z.string(),
    bio: z.string().optional(),
    photoUrl: z.string().optional(),
  }),
  instrument: z.string(),
  maxParticipants: z.number().int().positive().default(20),
  targetAudience: z.enum(['beginners', 'intermediate', 'advanced', 'all']).default('all'),
  date: z.string(),
  startTime: z.string(),
  durationMinutes: z.number().int().positive().default(90),
  location: z.string(),
  isOnline: z.boolean().default(false),
  streamUrl: z.string().optional(),
  includedInPackage: z.boolean().default(false),
  priceILS: z.number().optional(),
  packageMasterClassCount: z.number().optional(),
  status: z.enum(['draft', 'published', 'completed', 'cancelled']).default('draft'),
  registrations: z.array(z.object({
    studentId: z.string(),
    registeredAt: z.string(),
    attendanceStatus: z.enum(['registered','attended','no_show']),
    isPartOfPackage: z.boolean(),
  })).default([]),
});

const RegisterMasterClassSchema = z.object({
  masterClassId: z.string(),
  studentId: z.string(),
  allowances: z.array(
    z.object({
      studentId: z.string(),
      conservatoriumId: z.string(),
      academicYear: z.string(),
      totalAllowed: z.number().int(),
      used: z.number().int(),
      remaining: z.number().int(),
    })
  ).default([]),
});


const ScholarshipApplicationSchema = z.object({
  id: z.string().optional(),
  studentId: z.string(),
  studentName: z.string(),
  instrument: z.string(),
  conservatoriumId: z.string(),
  academicYear: z.string(),
  status: z.enum(['SUBMITTED','UNDER_REVIEW','APPROVED','PARTIALLY_APPROVED','WAITLISTED','REJECTED','EXPIRED']).default('SUBMITTED'),
  submittedAt: z.string(),
  priorityScore: z.number(),
  approvedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
  paymentStatus: z.enum(['UNPAID','PAID']).optional(),
  paidAt: z.string().optional(),
});

const ScholarshipStatusUpdateSchema = z.object({
  applicationId: z.string(),
  status: z.enum(['APPROVED','REJECTED']),
});

const DonationCauseSchema = z.object({
  id: z.string().optional(),
  conservatoriumId: z.string(),
  names: z.object({ he: z.string(), en: z.string(), ru: z.string().optional(), ar: z.string().optional() }),
  descriptions: z.object({ he: z.string(), en: z.string() }),
  category: z.enum(['financial_aid','excellence','equipment','events','general']),
  priority: z.number().int(),
  isActive: z.boolean().default(true),
  targetAmountILS: z.number().optional(),
  raisedAmountILS: z.number().default(0),
  imageUrl: z.string().optional(),
});

const DonationRecordSchema = z.object({
  id: z.string().optional(),
  conservatoriumId: z.string(),
  causeId: z.string(),
  amountILS: z.number(),
  frequency: z.enum(['once','monthly','yearly']),
  donorName: z.string().optional(),
  donorEmail: z.string().optional(),
  donorId: z.string().optional(),
  status: z.enum(['INITIATED','PAID','FAILED']).default('INITIATED'),
  createdAt: z.string(),
});

const BranchSchema = z.object({
  id: z.string().optional(),
  conservatoriumId: z.string(),
  name: z.string(),
  address: z.string(),
});

const ConservatoriumInstrumentSchema = z.object({
  id: z.string().optional(),
  conservatoriumId: z.string(),
  instrumentCatalogId: z.string().optional(),
  names: z.object({ he: z.string(), en: z.string(), ru: z.string().optional(), ar: z.string().optional() }),
  isActive: z.boolean(),
  teacherCount: z.number().int(),
  availableForRegistration: z.boolean(),
  availableForRental: z.boolean(),
});

const LessonPackageSchema = z.object({
  id: z.string().optional(),
  conservatoriumId: z.string(),
  names: z.object({ he: z.string(), en: z.string(), ru: z.string().optional(), ar: z.string().optional() }),
  type: z.enum(['monthly', 'semester', 'annual', 'single']),
  lessonCount: z.number().int().nullable(),
  durationMinutes: z.number().int().min(15).max(180),
  priceILS: z.number(),
  isActive: z.boolean(),
  instruments: z.array(z.string()).optional(),
  conservatoriumInstrumentIds: z.array(z.string()).optional(),
  instrumentCatalogIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const RoomSchema = z.object({
  id: z.string().optional(),
  conservatoriumId: z.string(),
  branchId: z.string(),
  name: z.string(),
  capacity: z.number().int(),
  instrumentEquipment: z.array(z.object({ instrumentId: z.string(), quantity: z.number().int(), notes: z.string().optional() })),
  blocks: z.array(z.object({ id: z.string(), startDateTime: z.string(), endDateTime: z.string(), reason: z.string(), blockedByUserId: z.string() })),
  isActive: z.boolean(),
  description: z.string().optional(),
  photoUrl: z.string().optional(),
  equipment: z.array(z.string()).optional(),
});


const FormSubmissionSchema = FormSubmissionUpsertSchema;
const EventProductionSchema = EventProductionUpsertSchema;


const UserSchema = UserUpsertSchema;
const LessonSchema = LessonSlotUpsertSchema;
const ConservatoriumSchema = ConservatoriumUpsertSchema;

const DeleteAlumnusSchema = z.string();

const AppLocaleSchema = z.enum(['he', 'en', 'ar', 'ru']);
const ResolveTokenSchema = z.union([
  z.string(),
  z.object({
    token: z.string(),
    locale: AppLocaleSchema.optional(),
  }),
]);
const StudentDetailsSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.string().optional(),
  grade: z.string().optional(),
  schoolName: z.string().optional(),
  schoolSymbol: z.string().optional(),
  idNumber: z.string().max(20).optional(),
});

const ParentDetailsSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(9).max(15),
  idNumber: z.string().max(20).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
});

const CreateEnrollmentSchema = z.object({
  token: z.string().min(1),
  registrationType: z.string().min(1),
  studentDetails: StudentDetailsSchema,
  parentDetails: ParentDetailsSchema,
  schoolId: z.string(),
  instrument: z.string().min(1),
  paymentMethod: z.string().optional(),
});

const SUPPORTED_PAYMENT_PROVIDERS = ['CARDCOM', 'PELECARD', 'HYP', 'TRANZILA', 'STRIPE'] as const;
type PaymentProvider = (typeof SUPPORTED_PAYMENT_PROVIDERS)[number];

function isPaymentProvider(value: string): value is PaymentProvider {
  return (SUPPORTED_PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

function getPaymentProvider(requestedProvider?: string): PaymentProvider {
  const normalizedRequested = (requestedProvider || '').trim().toUpperCase();
  if (isPaymentProvider(normalizedRequested)) return normalizedRequested;
  if (normalizedRequested && normalizedRequested !== 'ONLINE') {
    console.warn(`[Payment] Unsupported provider "${normalizedRequested}". Falling back to configured default.`);
  }

  const normalizedDefault = (process.env.PAYMENT_GATEWAY_PROVIDER || '').trim().toUpperCase();
  if (isPaymentProvider(normalizedDefault)) return normalizedDefault;

  return 'CARDCOM';
}

function buildPaymentRedirectUrl(provider: PaymentProvider, token: string) {
  const template = process.env.PAYMENT_GATEWAY_REDIRECT_TEMPLATE;
  if (template?.includes('{token}')) {
    return template
      .replaceAll('{provider}', provider.toLowerCase())
      .replaceAll('{token}', encodeURIComponent(token));
  }

  if (provider === 'CARDCOM') {
    const terminalNumber = process.env.CARDCOM_TERMINAL_NUMBER;
    if (!terminalNumber) {
      console.warn('[Cardcom] CARDCOM_TERMINAL_NUMBER is not configured - using mock redirect');
      return `/payment/mock?token=${token}&gateway=cardcom`;
    }
    return `https://secure.cardcom.solutions/External/LowProfile/Create.aspx?TerminalNumber=${encodeURIComponent(terminalNumber)}&ReturnValue=${encodeURIComponent(token)}`;
  }

  if (provider === 'PELECARD') {
    const terminalNumber = process.env.PELECARD_TERMINAL_NUMBER;
    if (!terminalNumber) {
      console.warn('[PeleCard] PELECARD_TERMINAL_NUMBER is not configured - using mock redirect');
      return `/payment/mock?token=${token}&gateway=pelecard`;
    }
    return `https://gateway.pelecard.biz/payment?TerminalNumber=${encodeURIComponent(terminalNumber)}&ReturnValue=${encodeURIComponent(token)}`;
  }

  if (provider === 'HYP') {
    const terminalNumber = process.env.HYP_TERMINAL_NUMBER;
    if (!terminalNumber) {
      console.warn('[HYP] HYP_TERMINAL_NUMBER is not configured - using mock redirect');
      return `/payment/mock?token=${token}&gateway=hyp`;
    }
    return `https://pay.hyp.co.il/?TerminalNumber=${encodeURIComponent(terminalNumber)}&ReturnValue=${encodeURIComponent(token)}`;
  }

  if (provider === 'STRIPE') {
    const publicKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publicKey) {
      console.warn('[Stripe] STRIPE_PUBLISHABLE_KEY is not configured - using mock redirect');
      return `/payment/mock?token=${token}&gateway=stripe`;
    }
    return `/payment/mock?token=${token}&gateway=stripe`;
  }

  const terminalNumber = process.env.TRANZILA_TERMINAL_NUMBER;
  if (!terminalNumber) {
    console.warn('[Tranzila] TRANZILA_TERMINAL_NUMBER is not configured - using mock redirect');
    return `/payment/mock?token=${token}&gateway=tranzila`;
  }
  return `https://direct.tranzila.com/${encodeURIComponent(terminalNumber)}/iframe.php?sum=0&user1=${encodeURIComponent(token)}`;
}
const GetPaymentUrlSchema = z.string();
const ExcellenceTrackResponseSchema = z.object({
  studentId: z.string(),
  reason: z.string().optional(),
});
const InviteCoordinatorSchema = z.object({
  partnershipId: z.string(),
  email: z.string().email(),
});
const CreateDonationCheckoutSchema = z.object({
  amount: z.number().positive(),
  frequency: z.enum(['once', 'monthly', 'yearly']).default('once'),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional(),
  donorId: z.string().optional(),
  causeId: z.string().optional(),
});

const GenerateEventPosterSchema = z.object({
  id: z.string(),
  title: z.object({
    he: z.string(),
    en: z.string(),
    ru: z.string().optional(),
    ar: z.string().optional(),
  }),
  eventDate: z.string(),
  startTime: z.string(),
  venueName: z.string(),
});

type AppLocale = z.infer<typeof AppLocaleSchema>;

type PlayingSchoolTokenRecord = {
  id: string;
  symbol: string;
  names: Record<AppLocale, string>;
  conservatorium: Record<AppLocale, string>;
  city: Record<AppLocale, string>;
  instrument: Record<AppLocale, string>;
  grades: Record<AppLocale, string>;
  gradeOptions: string[];
  lessonDay: Record<AppLocale, string>;
  basePrice: number;
  monthlyPrice: number;
  subsidies: {
    municipal: number;
    ministry: number;
  };
  parentContribution: number;
};

const PLAYING_SCHOOL_TOKEN_MAP: Record<string, PlayingSchoolTokenRecord> = {
  '44570001': {
    id: 'ps-44570001',
    symbol: '44570001',
    names: {
      he: 'תיכון הדרים',
      en: 'Hadarim High School',
      ar: 'ثانوية هدريم',
      ru: 'Школа Хадарим',
    },
    conservatorium: {
      he: 'הקונסרבטוריון הישראלי למוסיקה, תל אביב',
      en: 'Israeli Conservatory of Music, Tel Aviv',
      ar: 'المعهد الإسرائيلي للموسيقى - تل أبيب',
      ru: 'Израильская консерватория, Тель-Авив',
    },
    city: { he: 'הוד השרון', en: 'Hod HaSharon', ar: 'هود هشارون', ru: 'Ход-ха-Шарон' },
    instrument: { he: 'חליל', en: 'Flute', ar: 'فلوت', ru: 'Флейта' },
    grades: { he: 'כיתות ב׳-ו׳', en: '2nd-6th grade', ar: 'الصفوف 2-6', ru: '2-6 классы' },
    gradeOptions: ['2', '3', '4', '5', '6'],
    lessonDay: { he: 'שלישי', en: 'Tuesday', ar: 'الثلاثاء', ru: 'Вторник' },
    basePrice: 1800,
    monthlyPrice: 150,
    subsidies: { municipal: 500, ministry: 300 },
    parentContribution: 1000,
  },
  '12345678': {
    id: 'ps-12345678',
    symbol: '12345678',
    names: {
      he: 'תיכון חדש',
      en: 'Tichon Hadash',
      ar: 'ثانوية جديدة',
      ru: 'Тихон Хадаш',
    },
    conservatorium: {
      he: 'קונסרבטוריון הוד השרון - אלומה',
      en: 'Hod HaSharon Conservatory - Aluma',
      ar: 'كونسرفاتوار هود هشارون - ألوما',
      ru: 'Консерватория Ход-ха-Шарон - Алума',
    },
    city: { he: 'תל אביב', en: 'Tel Aviv', ar: 'تل أبيب', ru: 'Тель-Авив' },
    instrument: { he: 'גיטרה', en: 'Guitar', ar: 'غيتار', ru: 'Гитара' },
    grades: { he: 'כיתות ג׳-ו׳', en: '3rd-6th grade', ar: 'الصفوف 3-6', ru: '3-6 классы' },
    gradeOptions: ['3', '4', '5', '6'],
    lessonDay: { he: 'רביעי', en: 'Wednesday', ar: 'الأربعاء', ru: 'Среда' },
    basePrice: 1700,
    monthlyPrice: 140,
    subsidies: { municipal: 450, ministry: 300 },
    parentContribution: 950,
  },
  '87654321': {
    id: 'ps-87654321',
    symbol: '87654321',
    names: {
      he: 'תיכון הראשונים',
      en: 'Harishonim High School',
      ar: 'ثانوية هريشونيم',
      ru: 'Школа ХаРишоним',
    },
    conservatorium: {
      he: 'הקונסרבטוריון למוסיקה, רעננה',
      en: 'Raanana Music Conservatory',
      ar: 'كونسرفاتوار رعنانا للموسيقى',
      ru: 'Музыкальная консерватория Раананы',
    },
    city: { he: 'הרצליה', en: 'Herzliya', ar: 'هرتسليا', ru: 'Герцлия' },
    instrument: { he: 'צ׳לו', en: 'Cello', ar: 'تشيلو', ru: 'Виолончель' },
    grades: { he: 'כיתות ב׳-ה׳', en: '2nd-5th grade', ar: 'الصفوف 2-5', ru: '2-5 классы' },
    gradeOptions: ['2', '3', '4', '5'],
    lessonDay: { he: 'שני', en: 'Monday', ar: 'الاثنين', ru: 'Понедельник' },
    basePrice: 1600,
    monthlyPrice: 130,
    subsidies: { municipal: 450, ministry: 250 },
    parentContribution: 900,
  },
  '11223344': {
    id: 'ps-11223344',
    symbol: '11223344',
    names: {
      he: 'בית ספר לאמנויות',
      en: 'School of Arts',
      ar: 'مدرسة الفنون',
      ru: 'Школа искусств',
    },
    conservatorium: {
      he: 'מרכז פס למוסיקה רעננה',
      en: 'Pas Music Center Raanana',
      ar: 'مركز باس للموسيقى - رعنانا',
      ru: 'Музыкальный центр PAS, Раанана',
    },
    city: { he: 'ירושלים', en: 'Jerusalem', ar: 'القدس', ru: 'Иерусалим' },
    instrument: { he: 'פיתוח קול', en: 'Voice', ar: 'غناء', ru: 'Вокал' },
    grades: { he: 'כיתות ז׳-י׳', en: '7th-10th grade', ar: 'الصفوف 7-10', ru: '7-10 классы' },
    gradeOptions: ['7', '8', '9', '10'],
    lessonDay: { he: 'חמישי', en: 'Thursday', ar: 'الخميس', ru: 'Четверг' },
    basePrice: 2000,
    monthlyPrice: 170,
    subsidies: { municipal: 600, ministry: 350 },
    parentContribution: 1050,
  },
};

function parsePlayingSchoolToken(input: z.infer<typeof ResolveTokenSchema>) {
  if (typeof input === 'string') return { token: input, locale: 'he' as AppLocale };
  return { token: input.token, locale: (input.locale || 'he') as AppLocale };
}


// Secure Server Actions wrapped with Authentication & Zod Validation

/**
 * Invokes the Genkit AI flow to get intelligent composition suggestions.
 * @param input - The criteria for suggestions (instrument, genre, existing pieces, etc.).
 * @returns A promise that resolves to an array of suggested compositions.
 */
export const getCompositionSuggestions = withAuth(
  SuggestCompositionsInputSchema,
  async (input: SuggestCompositionsInput): Promise<SuggestCompositionsOutput['suggestions']> => {
    const result = await suggestCompositions(input);
    return result.suggestions;
  }
);

/**
 * Searches the mock database for composers matching a query string.
 * @param query - The search query for the composer's name.
 * @returns A promise that resolves to an array of matching composer names.
 */
const normalizeSearchValue = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const tokenizeInstrument = (value?: string) => {
  if (!value) return [] as string[];
  return value
    .split(/[\/,;|]+/)
    .map((token) => normalizeSearchValue(token))
    .filter(Boolean);
};

const matchesInstrument = (compositionInstrument: string | undefined, requestedInstrument: string | undefined) => {
  if (!requestedInstrument) return true;
  if (!compositionInstrument) return false;

  const requested = normalizeSearchValue(requestedInstrument);
  const tokens = tokenizeInstrument(compositionInstrument);
  if (tokens.length === 0) return false;

  return tokens.some((token) => token.includes(requested) || requested.includes(token));
};

/**
 * Searches the mock database for composers matching a query string.
 * @param query - The search query for the composer's name.
 * @returns A promise that resolves to an array of matching composer names.
 */
export const searchComposers = withAuth(
  SearchComposersSchema,
  async (input: z.infer<typeof SearchComposersSchema>): Promise<ComposerSearchResult[]> => {
    const query = typeof input === 'string' ? input : input.query;
    const instrument = typeof input === 'string' ? undefined : input.instrument;
    const lowerCaseQuery = query.toLowerCase();
    const db = await getDb();
    const allCompositions = await db.repertoire.list();

    const source = instrument
      ? allCompositions.filter((composition) => matchesInstrument(composition.instrument, instrument))
      : allCompositions;

    const allUniqueComposers = Array.from(
      new Map(
        source.map((composition) => {
          const id = composition.composerId || composition.composer;
          const names = composition.composerNames || { he: composition.composer, en: composition.composer };
          return [id, { id, name: names.he || composition.composer, names }];
        })
      ).values()
    );

    if (!query) return allUniqueComposers.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 100);

    const filteredComposers = allUniqueComposers.filter((composer) =>
      Object.values(composer.names).some((value) => value?.toLowerCase().includes(lowerCaseQuery))
    );

    return filteredComposers.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 50);
  }
);

/**
 * Searches the mock database for compositions matching a query and optional filters.
 * @param {object} params - The search parameters.
 * @param {string} params.query - The search query for title or composer.
 * @param {string} [params.composer] - An optional composer to filter by.
 * @param {string} [params.instrument] - An optional instrument to filter by.
 * @returns A promise that resolves to an array of matching Composition objects.
 */
export const searchCompositions = withAuth(
  SearchCompositionsSchema,
  async ({ query, composer, composerId, instrument, locale = 'he' }: z.infer<typeof SearchCompositionsSchema>): Promise<Composition[]> => {
    const db = await getDb();
    let source = await db.repertoire.list();

    if (composerId) source = source.filter(c => c.composerId === composerId);
    if (composer) source = source.filter(c => c.composer === composer);
    if (instrument) source = source.filter(c => matchesInstrument(c.instrument, instrument));

    const localized = (composition: Composition): Composition => ({
      ...composition,
      composer: composition.composerNames?.[locale] || composition.composerNames?.en || composition.composer,
      title: composition.titles?.[locale] || composition.titles?.en || composition.title,
    });

    if (!query && !composer && !composerId && !instrument) return source.slice(0, 20).map(localized);
    if (!query) return source.slice(0, 20).map(localized);

    const lowerCaseQuery = query.toLowerCase();
    const results = source.filter(c =>
      c.title.toLowerCase().includes(lowerCaseQuery) ||
      c.composer.toLowerCase().includes(lowerCaseQuery) ||
      Object.values(c.titles || {}).some(value => value?.toLowerCase().includes(lowerCaseQuery)) ||
      Object.values(c.composerNames || {}).some(value => value?.toLowerCase().includes(lowerCaseQuery)) ||
      (c.instrument || '').toLowerCase().includes(lowerCaseQuery)
    );

    return results.slice(0, 20).map(localized);
  }
);

/**
 * Invokes the Genkit AI flow to match a student with suitable teachers.
 * @param input - The student's profile and list of available teachers.
 * @returns A promise that resolves to an object containing the top teacher matches.
 */
export const getTeacherMatches = withAuth(
  MatchTeacherInputSchema,
  async (input: MatchTeacherInput): Promise<MatchTeacherOutput> => {
    return await matchTeacher(input);
  }
);

/**
 * Invokes the Genkit AI flow to draft a student's progress report.
 * @param input - The student's data, including practice logs, notes, and repertoire.
 * @returns A promise that resolves to the drafted report text in Markdown.
 */
export const draftProgressReport = withAuth(
  DraftProgressReportInputSchema,
  async (input: DraftProgressReportInput): Promise<DraftProgressReportOutput> => {
    await requireRole(['teacher', 'conservatorium_admin', 'delegated_admin', 'site_admin']);
    return await invokeDraftProgressReport(input);
  },
  { roles: ['teacher', 'conservatorium_admin', 'delegated_admin', 'site_admin'] }
);

/**
 * Invokes the Genkit AI flow to handle a natural language rescheduling request.
 * @param input - The user's message and scheduling context (upcoming lessons, availability).
 * @returns A promise that resolves to a conversational response and a proposed action.
 */
export const processNlpRescheduleRequest = withAuth(
  RescheduleRequestInputSchema,
  async (input: RescheduleRequestInput): Promise<RescheduleResponse> => {
    return await handleRescheduleRequest(input);
  }
);

/**
 * Invokes the Genkit AI flow to get a response from the help assistant.
 * @param input - The user's question and context.
 * @returns A promise that resolves to a helpful answer and suggested actions.
 */
export const getAiHelpResponse = withAuth(
  HelpAssistantInputSchema,
  async (input: HelpAssistantInput): Promise<HelpAssistantResponse> => {
    return await askHelpAssistant(input);
  }
);

/**
 * Invokes the Genkit AI flow to find the best students to target for an empty lesson slot.
 * @param input - The details of the empty slot and a list of eligible recipients.
 * @returns A promise that resolves to a list of targeted suggestions.
 */
export const getTargetedSlotSuggestions = withAuth(
  TargetSlotsInputSchema,
  async (input: TargetSlotsInput): Promise<TargetSlotsOutput> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    return await getTargetedSlots(input);
  },
  { roles: ['conservatorium_admin', 'delegated_admin', 'site_admin'] }
);

/**
 * Invokes the Genkit AI flow to generate a personalized follow-up message for an enrollment lead.
 * @param input - Context from the trial lesson (student, teacher, instrument, notes).
 * @returns A promise that resolves to the generated follow-up message.
 */
export const generateNurtureMessage = withAuth(
  NurtureLeadInputSchema,
  async (input: NurtureLeadInput): Promise<NurtureLeadOutput> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    return await nurtureLead(input);
  },
  { roles: ['conservatorium_admin', 'delegated_admin', 'site_admin'] }
);

/**
 * Saves (creates or updates) an alumnus record.
 * @param alumnus - The alumnus data to save.
 * @returns A promise that resolves to the saved Alumnus object.
 */
export const saveAlumnus = withAuth(
  AlumnusSchema,
  async (alumnus: z.infer<typeof AlumnusSchema>) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], alumnus.conservatoriumId);
    const db = await getDb();
    if (alumnus.id) {
      return await db.alumni.update(alumnus.id, alumnus as Partial<Alumnus>);
    }
    return await db.alumni.create(alumnus as Partial<Alumnus>);
  }
);

/**
 * Deletes an alumnus record by ID.
 * @param id - The ID of the alumnus to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteAlumnus = withAuth(
  DeleteAlumnusSchema,
  async (id: string) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    const db = await getDb();
    await db.alumni.delete(id);
    return { success: true };
  }
);

export const createAnnouncement = withAuth(
  AnnouncementSchema,
  async (payload: z.infer<typeof AnnouncementSchema>): Promise<Announcement> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    return await db.announcements.create(payload as Partial<Announcement>);
  }
);

export const createMasterClassAction = withAuth(
  MasterClassSchema,
  async (payload: z.infer<typeof MasterClassSchema>): Promise<Masterclass> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    return await db.masterClasses.create(payload as Partial<Masterclass>);
  }
);

export const publishMasterClassAction = withAuth(
  z.string(),
  async (masterClassId: string): Promise<Masterclass> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    const db = await getDb();
    return await db.masterClasses.update(masterClassId, { status: 'published' } as Partial<Masterclass>);
  }
);

export const registerToMasterClassAction = withAuth(
  RegisterMasterClassSchema,
  async (payload: z.infer<typeof RegisterMasterClassSchema>) => {
    await requireRole(['student', 'parent', 'conservatorium_admin', 'delegated_admin', 'site_admin']);
    const db = await getDb();
    const target = await db.masterClasses.findById(payload.masterClassId);
    if (!target) return { success: false as const, reason: 'not_found' as const };
    if (target.status !== 'published') return { success: false as const, reason: 'not_published' as const };
    if (target.registrations.some((entry) => entry.studentId === payload.studentId)) {
      return { success: false as const, reason: 'already_registered' as const };
    }
    if (target.registrations.length >= target.maxParticipants) {
      return { success: false as const, reason: 'full' as const };
    }

    const allowance = payload.allowances.find((item) =>
      item.studentId === payload.studentId && item.conservatoriumId === target.conservatoriumId
    );

    const isPartOfPackage = Boolean(target.includedInPackage && allowance && allowance.remaining > 0);
    const registration = {
      studentId: payload.studentId,
      registeredAt: new Date().toISOString(),
      attendanceStatus: 'registered' as const,
      isPartOfPackage,
    };

    const updatedMasterClass = await db.masterClasses.update(payload.masterClassId, {
      registrations: [...target.registrations, registration],
    } as Partial<Masterclass>);

    const updatedAllowances: StudentMasterClassAllowance[] =
      isPartOfPackage && allowance
        ? payload.allowances.map((item) =>
            item.studentId === allowance.studentId && item.conservatoriumId === allowance.conservatoriumId
              ? { ...item, used: item.used + 1, remaining: Math.max(0, item.remaining - 1) }
              : item
          )
        : payload.allowances;

    const nextAllowance = isPartOfPackage && allowance ? Math.max(0, allowance.remaining - 1) : allowance?.remaining;
    const chargedILS = !isPartOfPackage && (target.priceILS || 0) > 0 ? target.priceILS || 0 : 0;

    return {
      success: true as const,
      chargedILS,
      remaining: nextAllowance,
      masterClass: updatedMasterClass,
      allowances: updatedAllowances,
    };
  }
);

export const createScholarshipApplicationAction = withAuth(
  ScholarshipApplicationSchema,
  async (payload: z.infer<typeof ScholarshipApplicationSchema>) => {
    await requireRole(['student', 'parent', 'conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    return await db.scholarships.create(payload as Partial<ScholarshipApplication>);
  }
);

export const updateScholarshipStatusAction = withAuth(
  ScholarshipStatusUpdateSchema,
  async ({ applicationId, status }: z.infer<typeof ScholarshipStatusUpdateSchema>) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    const db = await getDb();
    const existing = await db.scholarships.findById(applicationId);
    if (!existing) {
      return { success: false as const, reason: 'not_found' as const };
    }
    const now = new Date().toISOString();
    const updated = await db.scholarships.update(applicationId, {
      status,
      approvedAt: status === 'APPROVED' ? now : existing.approvedAt,
      rejectedAt: status === 'REJECTED' ? now : existing.rejectedAt,
    } as Partial<ScholarshipApplication>);
    return { success: true as const, scholarship: updated };
  }
);

export const markScholarshipPaidAction = withAuth(
  z.string(),
  async (applicationId: string) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    const db = await getDb();
    const existing = await db.scholarships.findById(applicationId);
    if (!existing) {
      return { success: false as const, reason: 'not_found' as const };
    }
    const updated = await db.scholarships.update(applicationId, {
      paymentStatus: 'PAID',
      paidAt: new Date().toISOString(),
    } as Partial<ScholarshipApplication>);
    return { success: true as const, scholarship: updated };
  }
);

export const createDonationCauseAction = withAuth(
  DonationCauseSchema,
  async (payload: z.infer<typeof DonationCauseSchema>) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    return await db.donationCauses.create(payload as Partial<DonationCause>);
  }
);

export const recordDonationAction = withAuth(
  DonationRecordSchema,
  async (payload: z.infer<typeof DonationRecordSchema>) => {
    const db = await getDb();
    const donation = await db.donations.create(payload as Partial<DonationRecord>);
    const cause = await db.donationCauses.findById(payload.causeId);
    if (cause) {
      await db.donationCauses.update(cause.id, {
        raisedAmountILS: (cause.raisedAmountILS || 0) + payload.amountILS,
      } as Partial<DonationCause>);
    }
    return donation;
  }
);
/**
 * Resolves a Playing School registration token to program details.
 */

export const createBranchAction = withAuth(
  BranchSchema,
  async (payload: z.infer<typeof BranchSchema>): Promise<Branch> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    return await db.branches.create(payload as Partial<Branch>);
  }
);

export const updateBranchAction = withAuth(
  BranchSchema.extend({ id: z.string() }),
  async (payload: z.infer<typeof BranchSchema> & { id: string }): Promise<Branch> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    const existing = await db.branches.findById(payload.id);
    if (existing) {
      return await db.branches.update(payload.id, payload as Partial<Branch>);
    }
    return await db.branches.create(payload as Partial<Branch>);
  }
);

export const createConservatoriumInstrumentAction = withAuth(
  ConservatoriumInstrumentSchema,
  async (payload: z.infer<typeof ConservatoriumInstrumentSchema>): Promise<ConservatoriumInstrument> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    return await db.conservatoriumInstruments.create(payload as Partial<ConservatoriumInstrument>);
  }
);

export const updateConservatoriumInstrumentAction = withAuth(
  ConservatoriumInstrumentSchema.extend({ id: z.string() }),
  async (payload: z.infer<typeof ConservatoriumInstrumentSchema> & { id: string }): Promise<ConservatoriumInstrument> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    const existing = await db.conservatoriumInstruments.findById(payload.id);
    if (existing) {
      return await db.conservatoriumInstruments.update(payload.id, payload as Partial<ConservatoriumInstrument>);
    }
    return await db.conservatoriumInstruments.create(payload as Partial<ConservatoriumInstrument>);
  }
);

export const deleteConservatoriumInstrumentAction = withAuth(
  z.string(),
  async (id: string) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    const db = await getDb();
    await db.conservatoriumInstruments.delete(id);
    return { success: true as const };
  }
);

export const createLessonPackageAction = withAuth(
  LessonPackageSchema,
  async (payload: z.infer<typeof LessonPackageSchema>): Promise<LessonPackage> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    return await db.lessonPackages.create(payload as Partial<LessonPackage>);
  }
);

export const updateLessonPackageAction = withAuth(
  LessonPackageSchema.extend({ id: z.string() }),
  async (payload: z.infer<typeof LessonPackageSchema> & { id: string }): Promise<LessonPackage> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    const existing = await db.lessonPackages.findById(payload.id);
    if (existing) {
      return await db.lessonPackages.update(payload.id, payload as Partial<LessonPackage>);
    }
    return await db.lessonPackages.create(payload as Partial<LessonPackage>);
  }
);

export const deleteLessonPackageAction = withAuth(
  z.string(),
  async (id: string) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    const db = await getDb();
    await db.lessonPackages.delete(id);
    return { success: true as const };
  }
);

export const createRoomAction = withAuth(
  RoomSchema,
  async (payload: z.infer<typeof RoomSchema>): Promise<Room> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    return await db.rooms.create(payload as Partial<Room>);
  }
);

export const updateRoomAction = withAuth(
  RoomSchema.extend({ id: z.string() }),
  async (payload: z.infer<typeof RoomSchema> & { id: string }): Promise<Room> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    const existing = await db.rooms.findById(payload.id);
    if (existing) {
      return await db.rooms.update(payload.id, payload as Partial<Room>);
    }
    return await db.rooms.create(payload as Partial<Room>);
  }
);

export const deleteRoomAction = withAuth(
  z.string(),
  async (id: string) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    const db = await getDb();
    await db.rooms.delete(id);
    return { success: true as const };
  }
);


export const upsertFormSubmissionAction = withAuth(
  FormSubmissionSchema,
  async (payload: FormSubmission): Promise<FormSubmission> => {
    await requireRole(['student', 'teacher', 'parent', 'conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    if (!payload?.id) {
      return await db.forms.create(payload as Partial<FormSubmission>);
    }
    const existing = await db.forms.findById(payload.id);
    if (existing) {
      return await db.forms.update(payload.id, payload as Partial<FormSubmission>);
    }
    return await db.forms.create(payload as Partial<FormSubmission>);
  }
);

export const createEventAction = withAuth(
  EventProductionSchema,
  async (payload) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    return await db.events.create(payload as Partial<EventProduction>);
  }
);

export const updateEventAction = withAuth(
  EventProductionSchema,
  async (payload) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    if (!payload?.id) {
      return await db.events.create(payload as Partial<EventProduction>);
    }
    const existing = await db.events.findById(payload.id);
    if (existing) {
      return await db.events.update(payload.id, payload as Partial<EventProduction>);
    }
    return await db.events.create(payload as Partial<EventProduction>);
  }
);


export const upsertUserAction = withAuth(
  UserSchema,
  async (payload) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    if (!payload?.id) {
      return await db.users.create(payload as Partial<User>);
    }
    const existing = await db.users.findById(payload.id);
    if (existing) {
      return await db.users.update(payload.id, payload as Partial<User>);
    }
    return await db.users.create(payload as Partial<User>);
  }
);

export const upsertLessonAction = withAuth(
  LessonSchema,
  async (payload: LessonSlot): Promise<LessonSlot> => {
    await requireRole(['teacher', 'conservatorium_admin', 'delegated_admin', 'site_admin'], payload.conservatoriumId);
    const db = await getDb();
    if (!payload?.id) {
      return await db.lessons.create(payload as Partial<LessonSlot>);
    }
    const existing = await db.lessons.findById(payload.id);
    if (existing) {
      return await db.lessons.update(payload.id, payload as Partial<LessonSlot>);
    }
    return await db.lessons.create(payload as Partial<LessonSlot>);
  }
);

export const upsertConservatoriumAction = withAuth(
  ConservatoriumSchema,
  async (payload: Conservatorium): Promise<Conservatorium> => {
    await requireRole(['site_admin', 'superadmin']);
    const db = await getDb();

    if (!payload?.id) {
      return await db.conservatoriums.create(payload as Partial<Conservatorium>);
    }
    const existing = await db.conservatoriums.findById(payload.id);
    if (existing) {
      return await db.conservatoriums.update(payload.id, payload as Partial<Conservatorium>);
    }
    return await db.conservatoriums.create(payload as Partial<Conservatorium>);
  },
  { roles: ['site_admin', 'superadmin'] }
);

export const resolvePlayingSchoolToken = withAuth(
  ResolveTokenSchema,
  async (input: z.infer<typeof ResolveTokenSchema>) => {
    const { token, locale } = parsePlayingSchoolToken(input);
    console.log('Resolving token:', token, 'locale:', locale);

    if (token === 'INVALID') {
      throw new Error('Invalid token');
    }

    const symbolFromToken = token.startsWith('mock-token-') ? token.replace('mock-token-', '') : token;
    const resolved = PLAYING_SCHOOL_TOKEN_MAP[symbolFromToken];
    if (!resolved) {
      throw new Error('Invalid token');
    }

    return {
      id: resolved.id,
      name: resolved.names[locale],
      conservatorium: resolved.conservatorium[locale],
      symbol: resolved.symbol,
      city: resolved.city[locale],
      instrument: resolved.instrument[locale],
      grades: resolved.grades[locale],
      gradeOptions: resolved.gradeOptions,
      lessonDay: resolved.lessonDay[locale],
      basePrice: resolved.basePrice,
      monthlyPrice: resolved.monthlyPrice,
      subsidies: {
        municipal: resolved.subsidies.municipal,
        ministry: resolved.subsidies.ministry,
      },
      parentContribution: resolved.parentContribution,
    };
  }
);

/**
 * Creates a new Playing School enrollment.
 */
export const createPlayingSchoolEnrollment = withAuth(
  CreateEnrollmentSchema,
  async (data: z.infer<typeof CreateEnrollmentSchema>) => {
    console.log('Creating enrollment:', data);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const paymentMethod = (data.paymentMethod || '').trim().toUpperCase();
    const redirectUrl =
      paymentMethod && paymentMethod !== 'SCHOOL_FEES'
        ? buildPaymentRedirectUrl(getPaymentProvider(paymentMethod), data.token)
        : undefined;

    return {
      success: true,
      enrollmentId: `enr-${Date.now()}`,
      redirectUrl,
    };
  }
);

/**
 * Gets a payment URL for an outstanding Playing School invoice.
 */
export const getPlayingSchoolPaymentUrl = withAuth(
  GetPaymentUrlSchema,
  async (invoiceId: string) => {
    console.log('Generating payment URL for invoice:', invoiceId);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Production: Use CARDCOM_TERMINAL_NUMBER from environment — never hardcode credentials
    const provider = getPaymentProvider();
    const invoiceTemplate = process.env.PAYMENT_GATEWAY_INVOICE_TEMPLATE;
    if (invoiceTemplate?.includes('{invoiceId}')) {
      return {
        url: invoiceTemplate
          .replaceAll('{provider}', provider.toLowerCase())
          .replaceAll('{invoiceId}', encodeURIComponent(invoiceId)),
      };
    }

    if (provider === 'CARDCOM') {
      const terminalNumber = process.env.CARDCOM_TERMINAL_NUMBER;
      return {
        url: terminalNumber
          ? `https://secure.cardcom.solutions/External/LowProfile/Create.aspx?TerminalNumber=${encodeURIComponent(terminalNumber)}&InvoiceId=${invoiceId}&Operation=Payment`
          : `/payment/mock?invoice=${invoiceId}&gateway=cardcom`,
      };
    }

    return {
      url: `/payment/mock?invoice=${invoiceId}&gateway=${provider.toLowerCase()}`,
    };
  }
);

/**
 * Accepts an excellence track offer for a student.
 */
export const acceptExcellenceTrackOffer = withAuth(
  ExcellenceTrackResponseSchema,
  async (data: { studentId: string }) => {
    await requireRole(['student', 'parent']);
    console.log('Accepting excellence track for student:', data.studentId);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      message: 'Excellent! Your child has been enrolled in the Excellence Track.',
    };
  }
);

/**
 * Declines an excellence track offer for a student.
 */
export const declineExcellenceTrackOffer = withAuth(
  ExcellenceTrackResponseSchema,
  async (data: { studentId: string; reason?: string }) => {
    await requireRole(['student', 'parent']);
    console.log('Declining excellence track for student:', data.studentId, 'Reason:', data.reason);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'Offer declined. Your child will continue in the regular program.',
    };
  }
);

/**
 * Invites a school coordinator to join a partnership.
 */
export const inviteSchoolCoordinator = withAuth(
  InviteCoordinatorSchema,
  async (data: { partnershipId: string; email: string }) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    console.log('Inviting coordinator:', data.email, 'for partnership:', data.partnershipId);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // SEC-L01: Use cryptographically secure random bytes — Math.random() is NOT cryptographically secure
    const { randomBytes } = await import('crypto');
    const token = `INV_${randomBytes(16).toString('hex').toUpperCase()}`;

    return {
      success: true,
      invitationUrl: `${BRAND_DOMAIN}/accept-invite/${token}`,
      message: `Invitation sent successfully to ${data.email}`,
    };
  }
);

/**
 * Creates a checkout URL for public donation payments using the configured gateway provider.
 */
export const createDonationCheckout = withAuth(
  CreateDonationCheckoutSchema,
  async (data: z.infer<typeof CreateDonationCheckoutSchema>) => {
    const provider = getPaymentProvider();
    const donationToken = `donation-${Date.now()}`;
    const url = buildPaymentRedirectUrl(provider, donationToken);

    console.log('[Donation] Checkout created', {
      provider,
      amount: data.amount,
      frequency: data.frequency,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      causeId: data.causeId || 'general',
    });

    return { url, provider };
  }
);


/**
 * Generates an event poster background image using the AI poster flow.
 */
export const generateAiEventPoster = withAuth(
  GenerateEventPosterSchema,
  async (input: z.infer<typeof GenerateEventPosterSchema>): Promise<GenerateEventPosterOutput> => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    return await generateEventPoster(input as GenerateEventPosterInput);
  },
  { roles: ['conservatorium_admin', 'delegated_admin', 'site_admin'] }
);

// ── User Language Preference ──────────────────────────────────

const UpdateLanguagePreferenceSchema = z.object({
  locale: z.enum(['he', 'en', 'ar', 'ru']),
});

/**
 * Updates the current user's preferredLanguage in their Firestore profile.
 * Any authenticated user can update their own preference.
 */
export const updateUserLanguagePreference = withAuth(
  UpdateLanguagePreferenceSchema,
  async (input: z.infer<typeof UpdateLanguagePreferenceSchema>): Promise<{ success: boolean }> => {
    const claims = await verifyAuth();
    // Skip DB update for synthetic dev session (no real user record)
    if (claims.uid === 'dev-user') return { success: true };
    const db = await getDb();
    await db.users.update(claims.uid, { preferredLanguage: input.locale } as Partial<User>);
    return { success: true };
  }
);


