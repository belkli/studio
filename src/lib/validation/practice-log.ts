/**
 * @fileoverview Zod validation schema for practice log submissions.
 * Prevents students from logging negative durations, injecting
 * invalid mood values, or submitting future-dated logs.
 */
import { z } from 'zod';

export const PracticeLogSchema = z.object({
    studentId: z.string().min(1),
    conservatoriumId: z.string().optional(),
    teacherId: z.string().optional(),
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
        .refine((d) => new Date(d) <= new Date(), { message: 'Cannot log practice in the future' }),
    durationMinutes: z
        .number()
        .int()
        .min(1, 'Duration must be at least 1 minute')
        .max(480, 'Duration cannot exceed 8 hours'),
    pieces: z.array(
        z.object({
            title: z.string().min(1, 'Piece title is required'),
            composerId: z.string().optional(),
            focusArea: z.string().optional(),
        })
    ).min(1, 'At least one piece is required'),
    mood: z.enum(['GREAT', 'OKAY', 'HARD']),
    studentNote: z.string().max(1000).optional(),
});

export type PracticeLogInput = z.infer<typeof PracticeLogSchema>;

// Teacher comment addition
export const TeacherCommentSchema = z.object({
    logId: z.string().min(1),
    teacherComment: z.string().min(1).max(2000),
});

export type TeacherCommentInput = z.infer<typeof TeacherCommentSchema>;
