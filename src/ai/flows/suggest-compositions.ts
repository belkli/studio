
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
  prompt: `אתה קטלוגר ומומחה למוזיקה, בעל ידע נרחב בספריית יצירות מוזיקליות. המשימה שלך היא להציע יצירות מוזיקליות מתאימות על סמך הקריטריונים של המשתמש, עבור רסיטל או תוכנית קונצרט.

קח בחשבון את הפרטים הבאים:
{{#if composer}}מלחין: {{{composer}}}{{/if}}
{{#if instrument}}כלי נגינה: {{{instrument}}}{{/if}}
{{#if genre}}ז'אנר: {{{genre}}}{{/if}}
{{#if context}}הקשר/העדפות נוספות (לדוגמה, מטרות התלמיד, רמת קושי, אווירה): {{{context}}}{{/if}}
{{#if existingCompositions}}הימנע מהצעת היצירות הבאות (כבר נבחרו): {{{existingCompositions}}}{{/if}}

אנא הצע 3-5 יצירות שונות המתאימות לקריטריונים. אם ההקשר מרמז על בניית תוכנית מלאה, נסה להציע רפרטואר מאוזן (לדוגמה, יצירה מהירה, יצירה איטית, יצירה וירטואוזית).

עבור כל הצעה, ציין את המלחין, הכותרת, משך הזמן בפורמט MM:SS (הערך במידת הצורך), והז'אנר.
בנוסף, אם היצירה היא ברשות הציבור, חפש וספק קישור (URL) לדף היצירה באתר IMSLP בשדה 'imslpUrl'.

ודא שההצעות מגוונות אך רלוונטיות. תעדף יצירות ידועות ומתאימות לרסיטלים או קונצרטים.

דוגמת פורמט פלט (JSON):
אני רוצה רק את ה-JSON בפלט, ושום טקסט אחר לפני או אחרי.

\`\`\`json
{
  "suggestions": [
    {
      "composer": "יוהאן סבסטיאן באך",
      "title": "פרלוד ופוגה בדו מז'ור (מתוך הפסנתר המושווה, ספר א')",
      "duration": "03:30",
      "genre": "בארוק",
      "imslpUrl": "https://imslp.org/wiki/Das_wohltemperirte_Clavier,_BWV_846-893_(Bach,_Johann_Sebastian)"
    },
    {
      "composer": "פרדריק שופן",
      "title": "נוקטורן במי במול מז'ור, אופ. 9 מס' 2",
      "duration": "04:00",
      "genre": "רומנטי",
      "imslpUrl": "https://imslp.org/wiki/Nocturnes,_Op.9_(Chopin,_Fr%C3%A9d%C3%A9ric)"
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
