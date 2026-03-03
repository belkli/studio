// SEC-H05/QA-M01: @ts-nocheck removed — TypeScript must remain active in this security-critical file.
'use server';
/**
 * @fileoverview Server Actions for the Harmonia application.
 * This file centralizes all server-side functions that can be called from client components.
 * It uses a higher-order function `withAuth` to ensure that all actions are authenticated
 * and their inputs are validated using Zod schemas, providing a secure and robust API layer.
 */

import type { Composition } from '@/lib/types';
import { compositions as allCompositions } from '@/lib/data';
import { withAuth } from '@/lib/auth-utils';
import { z } from 'zod';

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


// Schemas for non-Genkit actions
const SearchComposersSchema = z.string();
const SearchCompositionsSchema = z.object({
  query: z.string(),
  composer: z.string().optional(),
  instrument: z.string().optional(),
});

const AlumnusSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  avatarUrl: z.string().optional(),
  graduationYear: z.number().int().min(1900).max(new Date().getFullYear()),
  instrument: z.string().min(2),
  currentRole: z.string().min(2),
  achievements: z.string().optional(),
});

const DeleteAlumnusSchema = z.string();

const AppLocaleSchema = z.enum(['he', 'en', 'ar', 'ru']);
const ResolveTokenSchema = z.union([
  z.string(),
  z.object({
    token: z.string(),
    locale: AppLocaleSchema.optional(),
  }),
]);
const CreateEnrollmentSchema = z.object({
  token: z.string(),
  registrationType: z.string(),
  studentDetails: z.any(),
  parentDetails: z.any(),
  schoolId: z.string(),
  instrument: z.string(),
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
export const searchComposers = withAuth(
  SearchComposersSchema,
  async (query: string): Promise<string[]> => {
    const lowerCaseQuery = query.toLowerCase();
    const allUniqueComposers = Array.from(new Set(allCompositions.map(c => c.composer)));

    if (!query) return allUniqueComposers.sort().slice(0, 50);

    const filteredComposers = allUniqueComposers.filter(c => c.toLowerCase().includes(lowerCaseQuery));
    return filteredComposers.sort().slice(0, 20);
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
  async ({ query, composer, instrument }: z.infer<typeof SearchCompositionsSchema>): Promise<Composition[]> => {
    let source = allCompositions;

    if (composer) source = source.filter(c => c.composer === composer);
    if (instrument) source = source.filter(c => c.instrument === instrument);
    if (!query && !composer && !instrument) return source.slice(0, 20);
    if (!query) return source.slice(0, 20);

    const lowerCaseQuery = query.toLowerCase();
    const results = source.filter(c =>
      c.title.toLowerCase().includes(lowerCaseQuery) ||
      c.composer.toLowerCase().includes(lowerCaseQuery)
    );
    return results.slice(0, 20);
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
    return await invokeDraftProgressReport(input);
  }
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
    return await getTargetedSlots(input);
  }
);

/**
 * Invokes the Genkit AI flow to generate a personalized follow-up message for an enrollment lead.
 * @param input - Context from the trial lesson (student, teacher, instrument, notes).
 * @returns A promise that resolves to the generated follow-up message.
 */
export const generateNurtureMessage = withAuth(
  NurtureLeadInputSchema,
  async (input: NurtureLeadInput): Promise<NurtureLeadOutput> => {
    return await nurtureLead(input);
  }
);

/**
 * Saves (creates or updates) an alumnus record.
 * @param alumnus - The alumnus data to save.
 * @returns A promise that resolves to the saved Alumnus object.
 */
export const saveAlumnus = withAuth(
  AlumnusSchema,
  async (alumnus: z.infer<typeof AlumnusSchema>) => {
    // In a real app, this would perform a database operation.
    // For now, we simulate a successful save.
    console.log('Saving alumnus:', alumnus);
    return { ...alumnus, id: alumnus.id || `alumni-${Math.random().toString(36).substr(2, 9)}` };
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
    // In a real app, this would perform a database operation.
    // For now, we simulate a successful deletion.
    console.log('Deleting alumnus with ID:', id);
    return { success: true };
  }
);

/**
 * Resolves a Playing School registration token to program details.
 */
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
    console.log('Inviting coordinator:', data.email, 'for partnership:', data.partnershipId);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // SEC-L01: Use cryptographically secure random bytes — Math.random() is NOT cryptographically secure
    const { randomBytes } = await import('crypto');
    const token = `INV_${randomBytes(16).toString('hex').toUpperCase()}`;

    return {
      success: true,
      invitationUrl: `https://harmony.app/accept-invite/${token}`,
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
    });

    return { url, provider };
  }
);
