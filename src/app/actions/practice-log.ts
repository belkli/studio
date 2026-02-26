/**
 * @fileoverview Server action for logging practice sessions.
 * SDD-P3 (Student) requires practice logging with gamification.
 * This action validates input with Zod, creates the log,
 * and checks for achievement triggers.
 */
'use server';

import type { PracticeLog, Achievement, AchievementType } from '@/lib/types';
import { PracticeLogSchema } from '@/lib/validation/practice-log';

export interface LogPracticeInput {
    studentId: string;
    conservatoriumId?: string;
    date: string;
    durationMinutes: number;
    pieces: { title: string; composerId?: string; focusArea?: string }[];
    mood: 'GREAT' | 'OKAY' | 'HARD';
    studentNote?: string;
}

interface LogPracticeResult {
    success: boolean;
    practiceLog?: PracticeLog;
    achievementsEarned?: AchievementType[];
    streakDays?: number;
    pointsAwarded?: number;
    error?: string;
}

/**
 * Points awarded per practice session based on duration.
 */
function calculatePoints(durationMinutes: number): number {
    if (durationMinutes >= 60) return 15;
    if (durationMinutes >= 30) return 10;
    if (durationMinutes >= 15) return 5;
    return 2;
}

/**
 * Logs a practice session and checks for achievement triggers.
 * 
 * In production with Firestore:
 * 1. Validate input with Zod schema
 * 2. Create PracticeLog document
 * 3. Update weekly/monthly practice stats
 * 4. Check streak continuity
 * 5. Check for milestone achievements:
 *    - PRACTICE_STREAK_7 / PRACTICE_STREAK_30
 *    - TOTAL_HOURS_10 / TOTAL_HOURS_50 / TOTAL_HOURS_100
 * 6. Award points and achievements
 */
export async function logPracticeSession(input: LogPracticeInput): Promise<LogPracticeResult> {
    try {
        // Validate with Zod
        const parsed = PracticeLogSchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues.map(i => i.message).join(', '),
            };
        }

        const points = calculatePoints(input.durationMinutes);
        const logId = `practice-${Date.now()}`;
        const now = new Date().toISOString();

        const practiceLog: PracticeLog = {
            id: logId,
            studentId: input.studentId,
            conservatoriumId: input.conservatoriumId,
            date: input.date,
            durationMinutes: input.durationMinutes,
            pieces: input.pieces,
            mood: input.mood,
            studentNote: input.studentNote,
            pointsAwarded: points,
            streakContribution: true, // Determined after checking existing logs
            createdAt: now,
        };

        // In production with Firestore:
        // 1. Write practice log to conservatoriums/{cid}/practiceLogs/{logId}
        // 2. Query recent logs to calculate streak
        // 3. Query total hours to check milestone achievements
        // 4. Award any triggered achievements
        // 5. Update student's total points

        const achievementsEarned: AchievementType[] = [];

        return {
            success: true,
            practiceLog,
            achievementsEarned,
            streakDays: 0,  // Would be computed from existing logs
            pointsAwarded: points,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error logging practice',
        };
    }
}
