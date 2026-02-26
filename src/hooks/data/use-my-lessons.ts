/**
 * @fileoverview Role-scoped lesson query hook.
 * SDD-P8 (Performance) requires decomposing the monolithic context.
 * Teachers see only their lessons; students see only theirs.
 * 
 * Currently reads from the mock data context. When Firebase is connected,
 * replace the data source with Firestore onSnapshot queries.
 */
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
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

export function useMyLessons(filters?: LessonFilters): UseMyLessonsReturn {
    const { user, mockLessons } = useAuth();

    const result = useMemo(() => {
        if (!user || !mockLessons) {
            return {
                lessons: [],
                todayLessons: [],
                thisWeekLessons: [],
                upcomingLessons: [],
                completedLessons: [],
                cancelledLessons: [],
            };
        }

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
        const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
        const rangeEnd = addWeeks(now, filters?.dateRangeWeeks ?? 4);

        // Role-scoped filtering
        let scopedLessons = mockLessons.filter((lesson) => {
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
                    return true; // cross-conservatorium visibility
                default:
                    return false;
            }
        });

        // Apply additional filters
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

        const todayLessons = scopedLessons.filter(l =>
            l.startTime.slice(0, 10) === today
        ).sort((a, b) => a.startTime.localeCompare(b.startTime));

        const thisWeekLessons = scopedLessons.filter(l => {
            const lessonDate = new Date(l.startTime);
            return isWithinInterval(lessonDate, { start: weekStart, end: weekEnd });
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));

        const upcomingLessons = scopedLessons.filter(l => {
            const lessonDate = new Date(l.startTime);
            return lessonDate > now && lessonDate <= rangeEnd && l.status === 'SCHEDULED';
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));

        const completedLessons = scopedLessons.filter(l =>
            l.status === 'COMPLETED'
        ).sort((a, b) => b.startTime.localeCompare(a.startTime));

        const cancelledLessons = scopedLessons.filter(l =>
            l.status.startsWith('CANCELLED_')
        );

        return {
            lessons: scopedLessons,
            todayLessons,
            thisWeekLessons,
            upcomingLessons,
            completedLessons,
            cancelledLessons,
        };
    }, [user, mockLessons, filters?.dateRangeWeeks, filters?.statusFilter, filters?.teacherIdFilter, filters?.studentIdFilter]);

    return {
        ...result,
        isLoading: false, // With mock data, loading is instant
    };
}
