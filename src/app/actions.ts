// @ts-nocheck
'use server';

import type { Composition } from '@/lib/types';
import fs from 'fs';
import path from 'path';
import {
  suggestCompositions,
  type SuggestCompositionsInput,
  type SuggestCompositionsOutput,
} from '@/ai/flows/suggest-compositions';


// Load and transform compositions from JSON file
// This is done once when the server module is loaded.
const loadCompositions = (): Composition[] => {
    try {
        const jsonPath = path.join(process.cwd(), 'docs', 'data.json');
        const jsonData = fs.readFileSync(jsonPath, 'utf-8');
        const rawCompositions = JSON.parse(jsonData);

        if (!Array.isArray(rawCompositions)) {
            console.error('Error: docs/data.json is not an array.');
            return [];
        }

        return rawCompositions.map((item: any, index: number) => ({
            id: `comp-db-${index}`,
            composer: item['מלחין'] || 'לא ידוע',
            title: item['יצירה'] || 'ללא כותרת',
            duration: '05:00', // Placeholder duration, as it's not in the JSON
            genre: item['תקופה'] || 'לא ידוע',
            instrument: item['כלי'] || undefined,
            approved: item['מאושר כיצירה מרכזית'] === 'כן',
            source: 'seed',
        })).filter(c => c.composer && c.title);
    } catch (error) {
        console.error('Failed to load or parse docs/data.json', error);
        return [];
    }
};

const allCompositions = loadCompositions();


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
