/**
 * @fileoverview Server action for logging practice sessions.
 * SDD-P3 (Student) requires practice logging with gamification.
 * This action validates input with Zod, creates the log,
 * and checks for achievement triggers.
 */
'use server';

import type { PracticeLog, AchievementType } from '@/lib/types';
import { PracticeLogSchema } from '@/lib/validation/practice-log';
import { getDb } from '@/lib/db';

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

        const db = await getDb();
        await db.practiceLogs.create(practiceLog);

        // Compute streak from existing logs
        const allLogs = await db.practiceLogs.list();
        const studentLogs = allLogs
            .filter(l => l.studentId === input.studentId)
            .map(l => l.date)
            .sort();
        const uniqueDates = [...new Set(studentLogs)];
        let streakDays = 1;
        for (let i = uniqueDates.length - 2; i >= 0; i--) {
            const curr = new Date(uniqueDates[i + 1]);
            const prev = new Date(uniqueDates[i]);
            const diffMs = curr.getTime() - prev.getTime();
            if (diffMs <= 86400000) {
                streakDays++;
            } else {
                break;
            }
        }

        const achievementsEarned: AchievementType[] = [];

        // Award streak achievements when hitting a 7-day milestone
        if (streakDays > 0 && streakDays % 7 === 0) {
            try {
                const achievementType: AchievementType = streakDays >= 30
                    ? 'PRACTICE_STREAK_30'
                    : 'PRACTICE_STREAK_7';
                await db.achievements.create({
                    type: achievementType,
                    title: `${streakDays}-Day Practice Streak`,
                    titleHe: `רצף תרגול של ${streakDays} ימים`,
                    description: `Practiced for ${streakDays} consecutive days!`,
                    icon: '🔥',
                    achievedAt: now,
                    points: streakDays >= 30 ? 50 : 20,
                    studentId: input.studentId,
                    conservatoriumId: input.conservatoriumId,
                });
                achievementsEarned.push(achievementType);
            } catch (achErr) {
                console.error('[logPracticeSession] Achievement creation failed (non-fatal):', achErr);
            }
        }

        return {
            success: true,
            practiceLog,
            achievementsEarned,
            streakDays,
            pointsAwarded: points,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error logging practice',
        };
    }
}
