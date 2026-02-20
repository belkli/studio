
'use server';
/**
 * @fileOverview An AI agent for proactively targeting students to fill empty lesson slots.
 *
 * - getTargetedSlots - A function that finds the best student for a given empty slot.
 * - TargetSlotsInput - The input type for the function.
 * - TargetSlotsOutput - The return type for the function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { EmptySlot } from '@/lib/types';

const EligibleRecipientSchema = z.object({
    id: z.string(),
    name: z.string(),
    instrument: z.string(),
    pastBookingTimes: z.array(z.string()).describe("e.g., ['Tuesday-16:00', 'Thursday-17:00']"),
    makeupCreditBalance: z.number(),
    type: z.enum(['student', 'waitlist']),
});
export type EligibleRecipient = z.infer<typeof EligibleRecipientSchema>;


const EmptySlotSchema = z.object({
  id: z.string(),
  teacherName: z.string(),
  instrument: z.string(),
  startTime: z.string().describe("ISO 8601 format"),
  durationMinutes: z.number(),
  promotionalPrice: z.number(),
  basePrice: z.number(),
});


export const TargetSlotsInputSchema = z.object({
  emptySlot: EmptySlotSchema,
  eligibleRecipients: z.array(EligibleRecipientSchema),
});
export type TargetSlotsInput = z.infer<typeof TargetSlotsInputSchema>;

export const TargetSlotsOutputSchema = z.object({
  suggestions: z
    .array(
      z.object({
        recipientId: z.string(),
        affinityScore: z.number().min(0).max(100).describe('The calculated match score.'),
        personalizationHooks: z.array(z.string()).describe('Short, actionable reasons for the match in Hebrew.'),
      })
    )
    .describe('A sorted list of the top 3-5 recipients to target for the slot.'),
});
export type TargetSlotsOutput = z.infer<typeof TargetSlotsOutputSchema>;

export async function getTargetedSlots(input: TargetSlotsInput): Promise<TargetSlotsOutput> {
  return targetSlotsFlow(input);
}

const prompt = ai.definePrompt({
    name: 'targetSlotsPrompt',
    input: { schema: TargetSlotsInputSchema },
    output: { schema: TargetSlotsOutputSchema },
    prompt: `You are a savvy marketing assistant for a music conservatorium. Your goal is to find the best student to fill a specific empty lesson slot to maximize booking probability.

Analyze the empty slot and compare it against the list of eligible recipients. For each recipient, calculate an "affinity score" from 0 to 100 based on the following criteria:

1.  **Instrument Match (Crucial):** Must be an exact match. If not, the score is 0.
2.  **Makeup Credit Balance (High Priority):** Students with makeup credits are prime candidates. Add +40 to the score if their balance is > 0.
3.  **Past Booking Patterns:** Does the slot's day and time match their historical bookings? Add +30 for a strong match.
4.  **Waitlist Status:** If the recipient is on a waitlist for this instrument/teacher, add +20.
5.  **General Proximity:** Is the slot time generally convenient (e.g., after school hours)? Add +10 for peak times.

For the top 3-5 matches, provide a `personalizationHooks` array. These should be short, compelling, human-readable strings **in Hebrew** that an admin could use in an outreach message.

**Examples of good personalization hooks:**
- "יש לה יתרת שיעור השלמה לניצול"
- "השיעור מתקיים ביום ובשעה שקבעה בעבר"
- "נמצא/ת ברשימת ההמתנה למורה זה"
- "הזדמנות להתנסות בכלי נוסף במחיר מוזל"

EMPTY SLOT DETAILS:
- Teacher: {{{emptySlot.teacherName}}}
- Instrument: {{{emptySlot.instrument}}}
- Time: {{{emptySlot.startTime}}}
- Price: {{{emptySlot.promotionalPrice}}} (Original: {{{emptySlot.basePrice}}})

ELIGIBLE RECIPIENTS:
\`\`\`json
{{{json eligibleRecipients}}}
\`\`\`

Return a sorted list of the top 3-5 suggestions based on the calculated affinity score.
`,
});


const targetSlotsFlow = ai.defineFlow(
  {
    name: 'targetSlotsFlow',
    inputSchema: TargetSlotsInputSchema,
    outputSchema: TargetSlotsOutputSchema,
  },
  async (input) => {
    if (input.eligibleRecipients.length === 0) {
        return { suggestions: [] };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
