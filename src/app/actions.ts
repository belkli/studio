// @ts-nocheck
'use server';

import type { Composition } from '@/lib/types';
import { compositions as allCompositions } from '@/lib/data';
import {
  suggestCompositions,
  type SuggestCompositionsInput,
  type SuggestCompositionsOutput,
} from '@/ai/flows/suggest-compositions';
import {
  matchTeacher,
  type MatchTeacherInput,
  type MatchTeacherOutput
} from '@/ai/flows/match-teacher-flow';
import {
    draftProgressReport,
    type DraftProgressReportInput,
    type DraftProgressReportOutput,
} from '@/ai/flows/draft-progress-report-flow';


export async function getCompositionSuggestions(
  input: SuggestCompositionsInput
): Promise<SuggestCompositionsOutput['suggestions']> {
  try {
    const result = await suggestCompositions(input);
    return result.suggestions;
  } catch (error) {
    console.error('Error getting composition suggestions:', error);
    return [];
  }
}

export async function searchComposers(query: string): Promise<string[]> {
    const lowerCaseQuery = query.toLowerCase();
    const allUniqueComposers = Array.from(new Set(allCompositions.map(c => c.composer)));

    if (!query) {
        return allUniqueComposers.sort().slice(0, 50);
    }

    const filteredComposers = allUniqueComposers.filter(c => c.toLowerCase().includes(lowerCaseQuery));
    
    return filteredComposers.sort().slice(0, 20);
}

type SearchCompositionsInput = {
    query: string;
    composer?: string;
    instrument?: string;
};

export async function searchCompositions({ query, composer, instrument }: SearchCompositionsInput): Promise<Composition[]> {
  
  let source = allCompositions;

  if (composer) {
    source = source.filter(c => c.composer === composer);
  }
  
  if (instrument) {
      source = source.filter(c => c.instrument === instrument);
  }
  
  if (!query && !composer && !instrument) {
    return source.slice(0, 20);
  }

  if (!query) return source.slice(0, 20);

  const lowerCaseQuery = query.toLowerCase();

  const results = source.filter(c => 
    c.title.toLowerCase().includes(lowerCaseQuery) || 
    c.composer.toLowerCase().includes(lowerCaseQuery)
  );
  
  return results.slice(0, 20);
}

export async function getTeacherMatches(
  input: MatchTeacherInput
): Promise<MatchTeacherOutput> {
  try {
    const result = await matchTeacher(input);
    return result;
  } catch (error) {
    console.error('Error getting teacher matches:', error);
    return { matches: [] };
  }
}

export async function generateProgressReport(
  input: DraftProgressReportInput
): Promise<DraftProgressReportOutput> {
    try {
        const result = await draftProgressReport(input);
        return result;
    } catch (error) {
        console.error('Error drafting progress report:', error);
        return { reportText: 'שגיאה ביצירת טיוטת הדוח.' };
    }
}
