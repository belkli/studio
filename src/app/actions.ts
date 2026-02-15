// @ts-nocheck
'use server';

import {
  suggestCompositions,
  type SuggestCompositionsInput,
  type SuggestCompositionsOutput,
} from '@/ai/flows/suggest-compositions';

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
