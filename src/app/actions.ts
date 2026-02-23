// @ts-nocheck
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
export const generateProgressReport = withAuth(
  DraftProgressReportInputSchema,
  async (input: DraftProgressReportInput): Promise<DraftProgressReportOutput> => {
    return await draftProgressReport(input);
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
