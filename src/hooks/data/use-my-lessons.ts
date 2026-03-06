/**
 * @fileoverview Role-scoped lesson query hook backed by React Query.
 *
 * During the migration from the monolithic useAuth() context, this hook
 * seeds React Query's cache with the lessons already loaded in the
 * AuthProvider. Once a dedicated /api/lessons endpoint exists, the
 * queryFn can be swapped to fetch directly.
 *
 * Benefits over the previous pure-useMemo version:
 *  - Lessons data has its own cache entry — mutations in other domains
 *    (invoices, users, forms) do NOT cause this hook to re-compute.
 *  - React Query DevTools visibility for debugging staleness.
 *  - Consumers can call `queryClient.invalidateQueries(queryKeys.lessons.all)`
 *    to force a refetch after a mutation.
 */
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryKeys } from '@/lib/query-keys';
import type { LessonSlot, UserRole } from '@/lib/types';
import { startOfWeek, endOfWeek, addWeeks, isWithinInterval } from 'date-fns';

export interface LessonFilters {
    dateRangeWeeks?: number;   // how many weeks ahead to load (default: 4)
    statusFilter?: LessonSlot['status'][];
    teacherIdFilter?: string;
    studentIdFilter?: string;
}

export interface UseMyLessonsReturn {
    lessons: LessonSlot[];
    isLoading: boolean;
    todayLessons: LessonSlot[];
    thisWeekLessons: LessonSlot[];
    upcomingLessons: LessonSlot[];
    completedLessons: LessonSlot[];
    cancelledLessons: LessonSlot[];
}

function scopeAndCategorizeLessons(
    allLessons: LessonSlot[],
    user: { id: string; role: string; childIds?: string[]; conservatoriumId?: string },
    filters?: LessonFilters,
) {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const rangeEnd = addWeeks(now, filters?.dateRangeWeeks ?? 4);

    // Role-scoped filtering
    let scopedLessons = allLessons.filter((lesson) => {
        switch (user.role as UserRole) {
            case 'teacher':
                return lesson.teacherId === user.id;
            case 'student':
                return lesson.studentId === user.id;
            case 'parent':
                return user.childIds?.includes(lesson.studentId);
            case 'conservatorium_admin':
            case 'site_admin':
                return lesson.conservatoriumId === user.conservatoriumId;
            case 'ministry_director':
                return true;
            default:
                return false;
        }
    });

    // Additional filters
    if (filters?.statusFilter?.length) {
        scopedLessons = scopedLessons.filter(l => filters.statusFilter!.includes(l.status));
    }
    if (filters?.teacherIdFilter) {
        scopedLessons = scopedLessons.filter(l => l.teacherId === filters.teacherIdFilter);
    }
    if (filters?.studentIdFilter) {
        scopedLessons = scopedLessons.filter(l => l.studentId === filters.studentIdFilter);
    }

    // Time-based categorization
    const today = now.toISOString().slice(0, 10);

    const todayLessons = scopedLessons
        .filter(l => l.startTime.slice(0, 10) === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const thisWeekLessons = scopedLessons
        .filter(l => isWithinInterval(new Date(l.startTime), { start: weekStart, end: weekEnd }))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const upcomingLessons = scopedLessons
        .filter(l => {
            const d = new Date(l.startTime);
            return d > now && d <= rangeEnd && l.status === 'SCHEDULED';
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const completedLessons = scopedLessons
        .filter(l => l.status === 'COMPLETED')
        .sort((a, b) => b.startTime.localeCompare(a.startTime));

    const cancelledLessons = scopedLessons.filter(l => l.status.startsWith('CANCELLED_'));

    return { lessons: scopedLessons, todayLessons, thisWeekLessons, upcomingLessons, completedLessons, cancelledLessons };
}

export function useMyLessons(filters?: LessonFilters): UseMyLessonsReturn {
    const { user, lessons: contextLessons } = useAuth();

    // Seed the React Query cache from the AuthProvider context data.
    // The queryFn returns the context data for now; swap to a fetch()
    // call when a dedicated endpoint is available.
    const { data: allLessons, isLoading: queryLoading } = useQuery<LessonSlot[]>({
        queryKey: queryKeys.lessons.all,
        queryFn: () => contextLessons ?? [],
        initialData: contextLessons ?? [],
        staleTime: 15 * 1000,
    });

    const result = useMemo(() => {
        if (!user || !allLessons?.length) {
            return {
                lessons: [],
                todayLessons: [],
                thisWeekLessons: [],
                upcomingLessons: [],
                completedLessons: [],
                cancelledLessons: [],
            };
        }
        return scopeAndCategorizeLessons(allLessons, user, filters);
    }, [user, allLessons, filters]);

    return {
        ...result,
        isLoading: queryLoading,
    };
}
