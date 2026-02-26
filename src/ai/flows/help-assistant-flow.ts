/**
 * @fileOverview The AI Help Assistant for Harmonia.
 *
 * - askHelpAssistant - A function that processes a user's question and returns a helpful answer.
 * - HelpAssistantInput - The input type for the function.
 * - HelpAssistantResponse - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const HelpAssistantInputSchema = z.object({
  question: z.string(),
  userId: z.string(),
  locale: z.string().default('he'),
  conservatoriumId: z.string(),
  // For now, we don't have RAG, so context will be empty.
  // In the future, this would be populated with relevant help articles.
  context: z.string().optional(),
});
export type HelpAssistantInput = z.infer<typeof HelpAssistantInputSchema>;

export const HelpAssistantResponseSchema = z.object({
  answer: z
    .string()
    .describe(
      "The helpful, conversational answer to the user's question."
    ),
  suggestedActions: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
      })
    )
    .optional()
    .describe('Up to 2 suggested action buttons relevant to the answer.'),
});
export type HelpAssistantResponse = z.infer<typeof HelpAssistantResponseSchema>;

export async function askHelpAssistant(
  input: HelpAssistantInput
): Promise<HelpAssistantResponse> {
  return helpAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'helpAssistantPrompt',
  input: { schema: HelpAssistantInputSchema },
  output: { schema: HelpAssistantResponseSchema },
  prompt: `You are a friendly and knowledgeable AI assistant for "Harmonia", a music conservatorium management system. Your name is Harmony.
Your goal is to answer user questions about how to use the system. You must be polite, concise, and helpful. Always respond in the user's requested locale: {{{locale}}}.

You have been provided with the user's question and some context from our help articles. Use your general knowledge of the system (based on its features like scheduling, billing, forms, practice logs) and the provided context to formulate your answer.

IMPORTANT: You CANNOT perform actions for the user. You can only explain how THEY can perform actions. Guide them by mentioning the correct page or button to click.

USER'S QUESTION: "{{question}}"

{{#if context}}
RELEVANT HELP DOCUMENTATION:
---
{{{context}}}
---
{{/if}}

Based on the question, provide a clear answer. If the answer involves navigating the system, suggest an action button with a clear label and a valid href from the list below.

Valid hrefs:
- /dashboard/schedule
- /dashboard/schedule/book
- /dashboard/billing
- /dashboard/forms
- /dashboard/forms/new
- /dashboard/practice
- /dashboard/progress
- /dashboard/settings
- /dashboard/teacher/availability

Example for a good response in Hebrew:
{
  "answer": "כדי לבטל שיעור, יש לגשת לעמוד 'מערכת שעות'. שם, ליד השיעור המבוקש, יש ללחוץ על כפתור הביטול. שימי לב למדיניות הביטולים: ביטול עד 24 שעות לפני השיעור יזכה אותך בשיעור השלמה.",
  "suggestedActions": [
    { "label": "עבור למערכת השעות", "href": "/dashboard/schedule" }
  ]
}
`,
});

const helpAssistantFlow = ai.defineFlow(
  {
    name: 'helpAssistantFlow',
    inputSchema: HelpAssistantInputSchema,
    outputSchema: HelpAssistantResponseSchema,
  },
  async input => {
    // In a real implementation with RAG, we would first search for relevant articles
    // and populate the 'context' field for the prompt. For now, it's empty.
    const { output } = await prompt(input);
    return output!;
  }
);
