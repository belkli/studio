// @ts-nocheck
'use server';

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
  draftProgressReport,
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


// Secure Server Actions wrapped with Authentication & Zod Validation

export const getCompositionSuggestions = withAuth(
  SuggestCompositionsInputSchema,
  async (input: SuggestCompositionsInput): Promise<SuggestCompositionsOutput['suggestions']> => {
    const result = await suggestCompositions(input);
    return result.suggestions;
  }
);

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

export const getTeacherMatches = withAuth(
  MatchTeacherInputSchema,
  async (input: MatchTeacherInput): Promise<MatchTeacherOutput> => {
    return await matchTeacher(input);
  }
);

export const generateProgressReport = withAuth(
  DraftProgressReportInputSchema,
  async (input: DraftProgressReportInput): Promise<DraftProgressReportOutput> => {
    return await draftProgressReport(input);
  }
);

export const processNlpRescheduleRequest = withAuth(
  RescheduleRequestInputSchema,
  async (input: RescheduleRequestInput): Promise<RescheduleResponse> => {
    return await handleRescheduleRequest(input);
  }
);

export const getAiHelpResponse = withAuth(
  HelpAssistantInputSchema,
  async (input: HelpAssistantInput): Promise<HelpAssistantResponse> => {
    return await askHelpAssistant(input);
  }
);

export const getTargetedSlotSuggestions = withAuth(
  TargetSlotsInputSchema,
  async (input: TargetSlotsInput): Promise<TargetSlotsOutput> => {
    return await getTargetedSlots(input);
  }
);

export const generateNurtureMessage = withAuth(
  NurtureLeadInputSchema,
  async (input: NurtureLeadInput): Promise<NurtureLeadOutput> => {
    return await nurtureLead(input);
  }
);
