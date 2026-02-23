
'use server';
/**
 * @fileOverview An AI agent for nurturing enrollment leads after a trial lesson.
 *
 * - nurtureLead - A function that generates a personalized follow-up message.
 * - NurtureLeadInput - The input type for the nurtureLead function.
 * - NurtureLeadOutput - The return type for the nurtureLead function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const NurtureLeadInputSchema = z.object({
  trialStudentName: z.string().describe("The name of the student who took the trial."),
  teacherName: z.string().describe("The name of the teacher who gave the trial lesson."),
  instrument: z.string().describe("The instrument for the trial lesson."),
  teacherNote: z.string().optional().describe("The teacher's brief notes from after the lesson."),
  locale: z.string().default('he').describe("The locale for the output message."),
});
export type NurtureLeadInput = z.infer<typeof NurtureLeadInputSchema>;

const NurtureLeadOutputSchema = z.object({
  followUpMessage: z.string().describe("The personalized follow-up message to send to the student/parent."),
});
export type NurtureLeadOutput = z.infer<typeof NurtureLeadOutputSchema>;

export async function nurtureLead(input: NurtureLeadInput): Promise<NurtureLeadOutput> {
  return nurtureLeadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'nurtureLeadPrompt',
  input: { schema: NurtureLeadInputSchema },
  output: { schema: NurtureLeadOutputSchema },
  prompt: `You are a friendly and encouraging administrative assistant at a music conservatory called "Harmonia".
Your task is to write a short, personalized follow-up message to a student (or their parent) who recently had a trial lesson but has not yet enrolled in a full package.

The message should be warm, reference specific details from the trial, and gently encourage them to continue their musical journey. The response must be in the specified locale: {{{locale}}}.

Context:
- Student's Name: {{{trialStudentName}}}
- Teacher's Name: {{{teacherName}}}
- Instrument: {{{instrument}}}
- Teacher's post-lesson note: "{{#if teacherNote}}{{{teacherNote}}}{{else}}No specific note provided.{{/if}}"

Instructions:
1.  Start by referencing the trial lesson with {{{teacherName}}} for the {{{instrument}}}.
2.  If a teacher's note is available, incorporate a positive point from it. For example, if the note says "showed great rhythm", you can say " {{{teacherName}}} mentioned you have a great sense of rhythm!".
3.  If no note is available, just say something generally encouraging like "We hope you enjoyed the experience!".
4.  End with a gentle call to action, encouraging them to enroll and providing a placeholder for a link. For example: "Learning music is a journey, and you've already taken the first step. We'd love for you to continue with us."
5.  Keep the tone encouraging and not pushy.

Example output in Hebrew:
{
  "followUpMessage": "היי {{{trialStudentName}}}, מקווים שנהנית בשיעור הניסיון על {{{instrument}}} עם {{{teacherName}}}! {{{teacherName}}} ציין/ה שהפגנת חוש קצב מצוין. לימודי מוזיקה הם מסע, וכבר עשית את הצעד הראשון. נשמח שתמשיך/י איתנו! לפרטים נוספים ולהרשמה לחבילה, ניתן ללחוץ כאן."
}
`,
});

const nurtureLeadFlow = ai.defineFlow(
  {
    name: 'nurtureLeadFlow',
    inputSchema: NurtureLeadInputSchema,
    outputSchema: NurtureLeadOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
