'use server';
/**
 * @fileOverview An AI agent for matching students with the best available teacher.
 *
 * - matchTeacher - A function that handles the teacher matching process.
 * - MatchTeacherInput - The input type for the matchTeacher function.
 * - MatchTeacherOutput - The return type for the matchTeacher function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { User, TeacherSpecialty, DayOfWeek, TimeRange } from '@/lib/types';

// Schemas based on types, but simplified for the prompt
const StudentProfileSchema = z.object({
  instrument: z.string(),
  level: z.string(),
  goals: z.array(z.string()).optional(),
  preferredDays: z.array(z.string()).optional(),
  preferredTimes: z.array(z.string()).optional(),
  isVirtualOk: z.string().optional(),
  birthDate: z.string(),
});

const TeacherProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  teachingLanguages: z.array(z.string()).optional(),
});

export const MatchTeacherInputSchema = z.object({
  studentProfile: StudentProfileSchema,
  availableTeachers: z.array(TeacherProfileSchema),
});
export type MatchTeacherInput = z.infer<typeof MatchTeacherInputSchema>;

export const MatchTeacherOutputSchema = z.object({
  matches: z
    .array(
      z.object({
        teacherId: z.string(),
        score: z.number().min(0).max(100),
        matchReasons: z.array(z.string()),
      })
    )
    .describe('An array of the top 3 teacher matches, sorted by score descending.'),
});
export type MatchTeacherOutput = z.infer<typeof MatchTeacherOutputSchema>;


export async function matchTeacher(input: MatchTeacherInput): Promise<MatchTeacherOutput> {
  return matchTeacherFlow(input);
}


const matchPrompt = ai.definePrompt({
    name: 'teacherMatchPrompt',
    input: { schema: MatchTeacherInputSchema },
    output: { schema: MatchTeacherOutputSchema },
    prompt: `You are an expert AI assistant for a music conservatorium, specializing in matching students with the most suitable teachers. Your task is to analyze a student's profile and compare it against a list of available teachers to find the best possible matches.

Return the top 3 matches, scored from 0-100, with clear, concise reasons for each match.

STUDENT PROFILE:
- Instrument: {{{studentProfile.instrument}}}
- Current Level: {{{studentProfile.level}}}
- Goals: {{#if studentProfile.goals}}{{#each studentProfile.goals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
- Availability: {{#if studentProfile.preferredDays}}{{#each studentProfile.preferredDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{#if studentProfile.preferredTimes}} during {{#each studentProfile.preferredTimes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}{{else}}Flexible{{/if}}
- Date of Birth: {{{studentProfile.birthDate}}}

AVAILABLE TEACHERS:
\`\`\`json
{{{json availableTeachers}}}
\`\`\`

SCORING CRITERIA (weights are suggestions, use your expert judgment):
1.  **Specialty Alignment (40%):** How well do the teacher's specialties (e.g., 'EXAM_PREP', 'JAZZ', 'EARLY_CHILDHOOD') align with the student's stated goals? This is the most important factor.
2.  **Level Appropriateness (30%):** Does the teacher have experience with the student's level (Beginner, Intermediate, Advanced)?
3.  **Age Group Experience (20%):** Based on the student's date of birth, determine their age group (Child, Teen, Adult) and assess if the teacher's profile indicates experience with that group (e.g., 'EARLY_CHILDHOOD' for young children, 'BEGINNER_ADULTS' for adults).
4.  **Bio/General Impression (10%):** Does the teacher's bio suggest a teaching philosophy that would resonate with the student's goals (e.g., performance-focused vs. enjoyment-focused)?

For each of the top 3 teachers, provide a score and a 'matchReasons' array containing 2-3 short, human-readable strings explaining WHY they are a good match. For example: "מתמחה בהכנה לבחינות", "מעולה עם מתחילים", "זמינה בשעות אחר הצהריים".

Sort the final list by score in descending order.
`,
});


const matchTeacherFlow = ai.defineFlow(
  {
    name: 'matchTeacherFlow',
    inputSchema: MatchTeacherInputSchema,
    outputSchema: MatchTeacherOutputSchema,
  },
  async (input) => {
    // In a real application, we would first do a hard filter based on availability, instrument, etc.
    // For this mock, we pass all available teachers to the LLM for scoring.
    
    const { output } = await matchPrompt(input);
    return output!;
  }
);
