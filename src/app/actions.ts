// @ts-nocheck
'use server';

import {
  suggestCompositions,
  type SuggestCompositionsInput,
  type SuggestCompositionsOutput,
} from '@/ai/flows/suggest-compositions';
import { compositions as allCompositions } from '@/lib/data';
import type { Composition } from '@/lib/types';


export async function getCompositionSuggestions(
  input: SuggestCompositionsInput
): Promise<SuggestCompositionsOutput['suggestions']> {
  try {
    const result = await suggestCompositions(input);
    return result.suggestions;
  } catch (error) {
    console.error('Error getting composition suggestions:', error);
    // In a real app, you'd want more robust error handling.
    // For now, we'll return an empty array.
    return [];
  }
}

export async function searchComposers(query: string): Promise<string[]> {
    const lowerCaseQuery = query.toLowerCase();

    const allUniqueComposers = Array.from(new Set(allCompositions.map(c => c.composer)));

    if (!query) {
        return allUniqueComposers.slice(0, 20);
    }

    const filteredComposers = allUniqueComposers.filter(c => c.toLowerCase().includes(lowerCaseQuery));
    
    return filteredComposers.slice(0, 10);
}

type SearchCompositionsInput = {
    query: string;
    composer?: string;
};

export async function searchCompositions({ query, composer }: SearchCompositionsInput): Promise<Composition[]> {
  if (!query && !composer) {
    return allCompositions.slice(0, 20);
  }
  
  let source = allCompositions;
  if (composer) {
    source = allCompositions.filter(c => c.composer === composer);
  }
  
  const lowerCaseQuery = query?.toLowerCase() || '';

  if (!lowerCaseQuery) return source.slice(0, 20);

  const results = source.filter(c => 
    c.title.toLowerCase().includes(lowerCaseQuery)
  );
  
  return results.slice(0, 20);
}
