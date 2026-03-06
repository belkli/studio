
/**
 * @fileOverview An AI agent for drafting student progress reports.
 *
 * - draftProgressReport - A function that handles the report drafting process.
 * - DraftProgressReportInput - The input type for the draftProgressReport function.
 * - DraftProgressReportOutput - The return type for the draftProgressReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { PracticeLog, LessonNote, AssignedRepertoire } from '@/lib/types';
import { getDb } from '@/lib/db';

const PracticeLogSchema = z.object({
  date: z.string(),
  durationMinutes: z.number(),
  pieces: z.array(z.object({ title: z.string() })),
  studentNote: z.string().optional(),
  mood: z.enum(['GREAT', 'OKAY', 'HARD']),
});

const LessonNoteSchema = z.object({
  createdAt: z.string(),
  summary: z.string(),
  homeworkAssignments: z.array(z.string()).optional(),
});

const RepertoireItemSchema = z.object({
  compositionId: z.string(),
  status: z.string(),
});

export const DraftProgressReportInputSchema = z.object({
  studentName: z.string(),
  teacherName: z.string(),
  instrument: z.string(),
  period: z.string(),
  practiceLogs: z.array(PracticeLogSchema),
  lessonNotes: z.array(LessonNoteSchema),
  repertoire: z.array(RepertoireItemSchema),
  locale: z.string().default('he'),
});
export type DraftProgressReportInput = z.infer<typeof DraftProgressReportInputSchema>;

const DraftProgressReportOutputSchema = z.object({
  reportText: z.string().describe('The full, drafted progress report text in Markdown format.'),
});
export type DraftProgressReportOutput = z.infer<typeof DraftProgressReportOutputSchema>;


export async function draftProgressReport(input: DraftProgressReportInput): Promise<DraftProgressReportOutput> {
  return draftProgressReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'progressReportDraftPrompt',
  input: {
    schema: DraftProgressReportInputSchema.extend({
      repertoireWithDetails: z.array(z.object({ title: z.string(), composer: z.string(), status: z.string() }))
    })
  },
  output: { schema: DraftProgressReportOutputSchema },
  prompt: `You are helping a music teacher, {{{teacherName}}}, write a warm, professional end-of-semester progress report for their student, {{{studentName}}}, who plays {{{instrument}}}. The report is for the {{{period}}} period.

Write the report in the following language: {{{locale}}}. Use a formal but encouraging tone suitable for both the student and their parents.
Use the provided data to write specific, personal observations — not generic statements.

Ensure the report has appropriate section headers for:
1. Overall progress summary
2. Technical and musical progress (mentioning specific pieces)
3. Practice habits (constructive analysis of logs and consistency)
4. Repertoire studied (especially completed pieces)
5. Goals for next semester
6. Warm closing statement

If the locale is 'he', use these headers:
### סיכום התקדמות
### התקדמות טכנית ומוזיקלית
### הרגלי אימון
### רפרטואר שנלמד
### מטרות לסמסטר הבא
### סיכום ומילים חמות

AVAILABLE DATA:

**Lesson Notes from this semester:**
\`\`\`json
{{{json lessonNotes}}}
\`\`\`

**Practice Log Summary (last 30 days):**
\`\`\`json
{{{json practiceLogs}}}
\`\`\`

**Student's Current Repertoire:**
\`\`\`json
{{{json repertoireWithDetails}}}
\`\`\`

Output only the report text in Markdown format, with no other introductory text.
`,
});


const draftProgressReportFlow = ai.defineFlow(
  {
    name: 'draftProgressReportFlow',
    inputSchema: DraftProgressReportInputSchema,
    outputSchema: DraftProgressReportOutputSchema,
  },
  async (input) => {
    const db = await getDb();
    const compositions = await db.repertoire.list();

    const repertoireWithDetails = input.repertoire.map(rep => {
      const composition = compositions.find(c => c.id === rep.compositionId);
      return {
        title: composition?.title || 'Unknown Piece',
        composer: composition?.composer || 'Unknown Composer',
        status: rep.status,
      };
    });

    const { output } = await prompt({
      ...input,
      repertoireWithDetails,
    });
    return output!;
  }
);
