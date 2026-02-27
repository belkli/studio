
/**
 * @fileOverview A Genkit flow for suggesting musical compositions.
 *
 * - suggestCompositions - A function that provides intelligent suggestions for musical compositions.
 * - SuggestCompositionsInput - The input type for the suggestCompositions function.
 * - SuggestCompositionsOutput - The return type for the suggestCompositions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SuggestCompositionsInputSchema = z.object({
  locale: z
    .string()
    .optional()
    .describe('The language locale to respond in. E.g. "he", "en", "ru", "ar". Default is "he".'),
  composer: z
    .string()
    .optional()
    .describe('The name of the composer to suggest pieces for. If not provided, suggest from various composers.'),
  instrument: z
    .string()
    .optional()
    .describe('The instrument the compositions are for. E.g., "פסנתר", "כינור".'),
  genre: z
    .string()
    .optional()
    .describe('The musical genre to suggest compositions from. E.g., "קלאסי", "ג\'אז".'),
  existingCompositions: z
    .array(z.string())
    .optional()
    .describe('A list of composition titles already selected, to avoid suggesting duplicates.'),
  context: z
    .string()
    .optional()
    .describe(
      'Any additional context or preferences for suggestions, such as skill level, mood, or specific event type.'
    ),
});
export type SuggestCompositionsInput = z.infer<typeof SuggestCompositionsInputSchema>;

const SuggestCompositionsOutputSchema = z.object({
  suggestions: z
    .array(
      z.object({
        composer: z.string().describe('The composer of the suggested piece.'),
        title: z.string().describe('The title of the suggested piece.'),
        duration: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .describe('The duration of the piece in MM:SS format.'),
        genre: z.string().describe('The genre of the piece.'),
        imslpUrl: z.string().optional().describe('A URL to the composition on IMSLP if available.'),
      })
    )
    .describe('An array of suggested compositions.'),
});
export type SuggestCompositionsOutput = z.infer<typeof SuggestCompositionsOutputSchema>;

export async function suggestCompositions(
  input: SuggestCompositionsInput
): Promise<SuggestCompositionsOutput> {
  return suggestCompositionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compositionSuggestionPrompt',
  input: { schema: SuggestCompositionsInputSchema },
  output: { schema: SuggestCompositionsOutputSchema },
  prompt: `You are a music expert and cataloger with extensive knowledge of musical compositions. Your task is to suggest appropriate musical compositions based on the user's criteria, for a recital or concert program.

Please respond in the following language locale: {{#if locale}}{{{locale}}}{{else}}he{{/if}}. Provide all text such as titles, genres, and composers in this language if possible, or keep original names if more appropriate.

Consider the following details:
{{#if composer}}Composer: {{{composer}}}{{/if}}
{{#if instrument}}Instrument: {{{instrument}}}{{/if}}
{{#if genre}}Genre: {{{genre}}}{{/if}}
{{#if context}}Context/Additional Preferences: {{{context}}}{{/if}}
{{#if existingCompositions}}Avoid suggesting the following pieces (already selected): {{{existingCompositions}}}{{/if}}

Please suggest 3-5 different compositions that fit the criteria. If the context implies building a full program, try to suggest a balanced repertoire (e.g., a fast piece, a slow piece, a virtuosic piece).

For each suggestion, provide the composer, title, duration in MM:SS format (estimate if necessary), and genre.
Additionally, if the piece is in the public domain, find and provide a URL to the composition's page on IMSLP in the 'imslpUrl' field.

Ensure the suggestions are diverse yet relevant. Prioritize well-known and recital-appropriate pieces.

Example JSON output format:
I want ONLY the JSON output, with NO other text before or after.

\`\`\`json
{
  "suggestions": [
    {
      "composer": "Johann Sebastian Bach",
      "title": "Prelude and Fugue in C major, BWV 846",
      "duration": "03:30",
      "genre": "Baroque",
      "imslpUrl": "https://imslp.org/wiki/Das_wohltemperirte_Clavier,_BWV_846-893_(Bach,_Johann_Sebastian)"
    }
  ]
}
\`\`\``,
});

const suggestCompositionsFlow = ai.defineFlow(
  {
    name: 'suggestCompositionsFlow',
    inputSchema: SuggestCompositionsInputSchema,
    outputSchema: SuggestCompositionsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
