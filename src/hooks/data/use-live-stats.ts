/**
 * @fileoverview Admin dashboard live stats hook.
 * SDD-P1 specifies a single aggregated stats document to prevent
 * N+1 queries on the admin dashboard. This hook reads from mock data
 * and computes stats locally. In production, it will read from
 * conservatoriums/{cid}/stats/live — a single Firestore document.
 */
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { ConservatoriumLiveStats } from '@/lib/types';

export function useLiveStats(): { stats: ConservatoriumLiveStats | null; isLoading: boolean } {
    const { user, mockLessons, mockInvoices, mockFormSubmissions, mockMakeupCredits } = useAuth();

    const stats = useMemo((): ConservatoriumLiveStats | null => {
        if (!user || user.role !== 'conservatorium_admin') return null;

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const cid = user.conservatoriumId;
        const cidLessons = (mockLessons ?? []).filter(l => l.conservatoriumId === cid);
        const cidInvoices = (mockInvoices ?? []).filter(i => i.conservatoriumId === cid);

        const scheduledThisWeek = cidLessons.filter(l => {
            const d = new Date(l.startTime);
            return d >= weekStart && d < weekEnd && l.status === 'SCHEDULED';
        });

        const completedThisWeek = cidLessons.filter(l => {
            const d = new Date(l.startTime);
            return d >= weekStart && d < weekEnd && l.status === 'COMPLETED';
        });

        const completedThisMonth = cidLessons.filter(l => {
            const d = new Date(l.startTime);
            return d >= monthStart && d <= monthEnd && l.status === 'COMPLETED';
        });

        const lessonHoursThisMonth = completedThisMonth.reduce(
            (sum, l) => sum + (l.durationMinutes / 60), 0
        );

        const paidThisMonth = cidInvoices.filter(
            i => i.status === 'PAID' && i.paidAt && new Date(i.paidAt) >= monthStart
        );
        const revenueCollected = paidThisMonth.reduce((sum, i) => sum + i.total, 0);

        const pendingForms = (mockFormSubmissions ?? []).filter(
            f => f.conservatoriumId === cid && (f.status === 'ממתין לאישור מורה' || f.status === 'ממתין לאישור מנהל')
        );

        const openCredits = (mockMakeupCredits ?? []).filter(
            c => c.status === 'AVAILABLE'
        );

        return {
            activeStudents: 0, // Would need users collection scan — use counter
            lessonsScheduledThisWeek: scheduledThisWeek.length,
            lessonsCompletedThisWeek: completedThisWeek.length,
            lessonsCompletedThisMonth: completedThisMonth.length,
            lessonHoursThisMonth: Math.round(lessonHoursThisMonth * 10) / 10,
            revenueCollectedThisMonth: revenueCollected,
            revenueExpectedThisMonth: cidInvoices.filter(
                i => (i.status === 'SENT' || i.status === 'OVERDUE') && new Date(i.dueDate) <= monthEnd
            ).reduce((sum, i) => sum + i.total, 0),
            pendingApprovals: pendingForms.length,
            openMakeupCredits: openCredits.length,
            teachersSickToday: 0,
            paymentFailuresLast24h: 0,
            updatedAt: now.toISOString(),
        };
    }, [user, mockLessons, mockInvoices, mockFormSubmissions, mockMakeupCredits]);

    return { stats, isLoading: false };
}
