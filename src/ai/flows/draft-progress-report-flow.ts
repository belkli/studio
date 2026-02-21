
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
import { compositions } from '@/lib/data';

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

Write the report in Hebrew, using a formal but encouraging tone suitable for both the student and their parents.
Use the provided data to write specific, personal observations — not generic statements.
Structure the output in Markdown with the following sections:

### סיכום התקדמות
*   Start with an opening paragraph about the student's overall impression and a key achievement this semester.

### התקדמות טכנית ומוזיקלית
*   Analyze the lesson notes and repertoire to describe what has improved technically and musically. Reference specific pieces.

### הרגלי אימון
*   Analyze the practice log data. Be constructive, not harsh. Mention total practice time, consistency, and any patterns you see (e.g., "ניכרת השקעה רבה לקראת הרסיטל").

### רפרטואר שנלמד
*   List the pieces the student worked on, especially those marked as 'COMPLETED' or 'PERFORMANCE_READY'.

### מטרות לסמסטר הבא
*   Based on the data, suggest 2-3 clear goals for the next semester.

### סיכום ומילים חמות
*   End with a short, encouraging closing statement.

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
    const repertoireWithDetails = input.repertoire.map(rep => {
      const composition = compositions.find(c => c.id === rep.compositionId);
      return {
        title: composition?.title || 'Unknown Piece',
        composer: composition?.composer || 'Unknown Composer',
        status: rep.status,
      }
    });

    const { output } = await prompt({
      ...input,
      repertoireWithDetails,
    });
    return output!;
  }
);
