/**
 * @fileoverview Practice log query hook with gamification aggregations.
 * SDD-P3 (Student) requires practice tracking with streaks, total hours,
 * and mood trends for the gamification system.
 */
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { PracticeLog } from '@/lib/types';

export interface PracticeStats {
    totalMinutes: number;
    totalHours: number;
    sessionCount: number;
    currentStreak: number;        // consecutive days
    longestStreak: number;
    averageSessionMinutes: number;
    moodDistribution: Record<'GREAT' | 'OKAY' | 'HARD', number>;
    weeklyMinutes: number;        // current week
    monthlyMinutes: number;       // current month
}

export interface UsePracticeLogsReturn {
    logs: PracticeLog[];
    stats: PracticeStats;
    isLoading: boolean;
    recentLogs: PracticeLog[];
}

function calculateStreak(logs: PracticeLog[]): { current: number; longest: number } {
    if (!logs.length) return { current: 0, longest: 0 };

    const uniqueDays = [...new Set(logs.map(l => l.date))].sort().reverse();
    let current = 0;
    let longest = 0;
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < uniqueDays.length; i++) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        const expected = expectedDate.toISOString().slice(0, 10);

        if (uniqueDays[i] === expected || (i === 0 && uniqueDays[0] === today)) {
            streak++;
        } else if (i === 0) {
            // If today hasn't been logged yet, check yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (uniqueDays[0] === yesterday.toISOString().slice(0, 10)) {
                streak = 1;
                continue;
            }
            break;
        } else {
            break;
        }
    }
    current = streak;

    // Calculate longest streak
    streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
        const prev = new Date(uniqueDays[i - 1]);
        const curr = new Date(uniqueDays[i]);
        const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (Math.round(diffDays) === 1) {
            streak++;
        } else {
            longest = Math.max(longest, streak);
            streak = 1;
        }
    }
    longest = Math.max(longest, streak, current);

    return { current, longest };
}

export function usePracticeLogs(studentId?: string): UsePracticeLogsReturn {
    const { user, mockPracticeLogs } = useAuth();

    const result = useMemo(() => {
        const targetId = studentId || user?.id;
        if (!targetId || !mockPracticeLogs) {
            return {
                logs: [],
                stats: {
                    totalMinutes: 0, totalHours: 0, sessionCount: 0,
                    currentStreak: 0, longestStreak: 0, averageSessionMinutes: 0,
                    moodDistribution: { GREAT: 0, OKAY: 0, HARD: 0 },
                    weeklyMinutes: 0, monthlyMinutes: 0,
                },
                recentLogs: [],
            };
        }

        const logs = mockPracticeLogs
            .filter(l => l.studentId === targetId)
            .sort((a, b) => b.date.localeCompare(a.date));

        const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0);
        const { current, longest } = calculateStreak(logs);

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const weeklyMinutes = logs
            .filter(l => new Date(l.date) >= weekStart)
            .reduce((s, l) => s + l.durationMinutes, 0);

        const monthlyMinutes = logs
            .filter(l => new Date(l.date) >= monthStart)
            .reduce((s, l) => s + l.durationMinutes, 0);

        const moodDistribution = { GREAT: 0, OKAY: 0, HARD: 0 };
        logs.forEach(l => { moodDistribution[l.mood]++; });

        return {
            logs,
            stats: {
                totalMinutes,
                totalHours: Math.round((totalMinutes / 60) * 10) / 10,
                sessionCount: logs.length,
                currentStreak: current,
                longestStreak: longest,
                averageSessionMinutes: logs.length ? Math.round(totalMinutes / logs.length) : 0,
                moodDistribution,
                weeklyMinutes,
                monthlyMinutes,
            },
            recentLogs: logs.slice(0, 10),
        };
    }, [user, studentId, mockPracticeLogs]);

    return { ...result, isLoading: false };
}
