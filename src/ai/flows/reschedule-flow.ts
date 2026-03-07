
/**
 * @fileOverview An AI agent for handling lesson rescheduling requests conversationally.
 *
 * - handleRescheduleRequest - A function that processes a user's natural language message.
 * - RescheduleRequestInput - The input type for the function.
 * - RescheduleResponse - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { isBefore, parseISO } from 'date-fns';

const LessonSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  instrument: z.string(),
  teacherId: z.string(),
});

const _AvailabilitySlotSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
});

export const RescheduleRequestInputSchema = z.object({
  userId: z.string(),
  userMessage: z.string(),
  upcomingLessons: z.array(LessonSchema),
  // For simplicity, we'll just pass a list of available date strings
  teacherAvailability: z.array(z.string()).describe("A list of available slots in ISO 8601 format."),
  currentTime: z.string().describe("The current time in ISO 8601 format."),
  locale: z.string().default('he'),
});
export type RescheduleRequestInput = z.infer<typeof RescheduleRequestInputSchema>;

const ProposedChangeSchema = z.union([
  z.object({
    type: z.literal('RESCHEDULE'),
    lessonId: z.string(),
    newStartTime: z.string(),
    reason: z.string(),
  }),
  z.object({
    type: z.literal('CANCEL'),
    lessonId: z.string(),
    reason: z.string(),
    isWithinPolicy: z.boolean(),
  }),
  z.object({
    type: z.literal('INFO'),
    lessonId: z.string().optional(),
    reason: z.string(),
  }),
]);

export const RescheduleResponseSchema = z.object({
  responseText: z.string().describe('The natural language response to show to the user.'),
  actionType: z.enum(['CONFIRMATION_NEEDED', 'CLARIFICATION', 'ESCALATION', 'INFO_PROVIDED']),
  proposedChange: ProposedChangeSchema.optional(),
});
export type RescheduleResponse = z.infer<typeof RescheduleResponseSchema>;

export async function handleRescheduleRequest(
  input: RescheduleRequestInput
): Promise<RescheduleResponse> {
  return rescheduleConciergeFlow(input);
}


const prompt = ai.definePrompt({
  name: 'rescheduleConciergePrompt',
  input: { schema: RescheduleRequestInputSchema },
  output: { schema: RescheduleResponseSchema },
  prompt: `You are a helpful and friendly AI assistant for a music conservatorium named Harmonia. Your goal is to help students reschedule or cancel lessons conversationally based on their messages.

Current Time: {{{currentTime}}}

User's upcoming lessons:
\`\`\`json
{{{json upcomingLessons}}}
\`\`\`

Available slots for the user's teacher(s):
\`\`\`json
{{{json teacherAvailability}}}
\`\`\`

The user sent the following message: "{{userMessage}}"

Analyze the user's message and determine their intent (e.g., cancel a specific lesson, reschedule a lesson, ask about their schedule).

RULES:
1.  **Identify the target lesson:** Match the user's message to one of their upcoming lessons. Be specific (e.g., "your piano lesson on Tuesday"). If it's ambiguous which lesson they mean, ask for clarification.
2.  **Cancellation Policy:** A lesson can be cancelled with a credit if it's more than 24 hours away from the current time. If it's less than 24 hours away, the cancellation is "late" and no credit is given. ALWAYS inform the user of the policy outcome.
3.  **Rescheduling:** If the user wants to reschedule, find the SOONEST available slot from the teacher's availability that works and offer it. If no slots are available, inform them and suggest they try another day.
4.  **Response Language:** Respond in the following language: {{{locale}}}. The tone should be clear, friendly, and helpful.
5.  **Action Type:**
    *   If you are proposing a specific cancellation or reschedule, set 'actionType' to 'CONFIRMATION_NEEDED'.
    *   If you need more information from the user (e.g., which lesson to cancel), set 'actionType' to 'CLARIFICATION'.
    *   If you are just providing information (e.g., "Your next lesson is on..."), set 'actionType' to 'INFO_PROVIDED'.
    *   If the request is complex or you cannot understand it, set 'actionType' to 'ESCALATION' and your 'responseText' should say you're transferring them to a human assistant.
6.  **Proposed Change Object:**
    *   For CANCELLATIONS, populate 'proposedChange' with \`type: 'CANCEL'\`, the 'lessonId', a 'reason' summarizing your action, and whether it's 'isWithinPolicy'.
    *   For RESCHEDULING, populate 'proposedChange' with \`type: 'RESCHEDULE'\`, the 'lessonId', the 'newStartTime' you are proposing, and a 'reason'.
    *   For INFO or CLARIFICATION, 'proposedChange' can be omitted or have type: 'INFO'.

Example Response for "I can't make it tomorrow" (if locale is 'he'):
\`\`\`json
{
  "responseText": "בטח, אני יכול/ה לבטל עבורך את שיעור הפסנתר של מחר. מאחר שהביטול הוא פחות מ-24 שעות לפני השיעור, שיעור ההשלמה יחויב על פי המדיניות. האם לבטל בכל זאת?",
  "actionType": "CONFIRMATION_NEEDED",
  "proposedChange": {
    "type": "CANCEL",
    "lessonId": "lesson-1",
    "reason": "User requested to cancel lesson less than 24 hours in advance.",
    "isWithinPolicy": false
  }
}
\`\`\`

Example Response for "I can't make it tomorrow" (if locale is 'en'):
\`\`\`json
{
  "responseText": "Sure, I can cancel your piano lesson for tomorrow. Since the cancellation is less than 24 hours before the lesson, it will be considered a late cancellation according to our policy. Should I proceed with the cancellation?",
  "actionType": "CONFIRMATION_NEEDED",
  "proposedChange": {
    "type": "CANCEL",
    "lessonId": "lesson-1",
    "reason": "User requested to cancel lesson less than 24 hours in advance.",
    "isWithinPolicy": false
  }
}
\`\`\`
`,
});


const rescheduleConciergeFlow = ai.defineFlow(
  {
    name: 'rescheduleConciergeFlow',
    inputSchema: RescheduleRequestInputSchema,
    outputSchema: RescheduleResponseSchema,
  },
  async (input) => {
    // Add logic to sort availability and filter past slots if needed.
    const sortedAvailability = input.teacherAvailability
      .filter(slot => isBefore(parseISO(input.currentTime), parseISO(slot)))
      .sort((a, b) => parseISO(a).getTime() - parseISO(b).getTime());

    const { output } = await prompt({
      ...input,
      teacherAvailability: sortedAvailability,
    });
    return output!;
  }
);
