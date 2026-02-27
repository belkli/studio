/**
 * @fileoverview Pre-lesson summary hook for teachers.
 * SDD-P2 specifies that teachers should see a summary of student's
 * activity since the last lesson before each session starts.
 * Aggregates practice logs, recent notes, and repertoire status.
 */
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { PracticeLog, LessonNote, AssignedRepertoire, LessonSlot } from '@/lib/types';

export interface PreLessonSummary {
    studentName: string;
    lastLessonDate: string | null;
    daysSinceLastLesson: number;
    practiceSinceLastLesson: {
        totalMinutes: number;
        sessionCount: number;
        averageMood: string;
        pieces: string[];
        studentNotes: string[];
    };
    currentRepertoire: AssignedRepertoire[];
    lastLessonNotes: LessonNote | null;
    unreadStudentMessages: number;
}

export function usePreLessonSummary(
    studentId: string,
    teacherId: string
): { summary: PreLessonSummary | null; isLoading: boolean } {
    const { users, mockLessons, mockPracticeLogs, mockAssignedRepertoire, mockLessonNotes } = useAuth();

    const summary = useMemo((): PreLessonSummary | null => {
        if (!studentId || !teacherId) return null;

        const student = (users ?? []).find(u => u.id === studentId);
        if (!student) return null;

        // Find the last completed lesson with this teacher
        const pastLessons = (mockLessons ?? [])
            .filter(l =>
                l.studentId === studentId &&
                l.teacherId === teacherId &&
                l.status === 'COMPLETED'
            )
            .sort((a, b) => b.startTime.localeCompare(a.startTime));

        const lastLesson = pastLessons[0] ?? null;
        const lastLessonDate = lastLesson?.startTime ?? null;

        const daysSince = lastLessonDate
            ? Math.floor((Date.now() - new Date(lastLessonDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        // Practice since last lesson
        const practiceAfterLastLesson = (mockPracticeLogs ?? []).filter(l =>
            l.studentId === studentId &&
            (!lastLessonDate || l.date > lastLessonDate.slice(0, 10))
        );

        const totalPracticeMinutes = practiceAfterLastLesson.reduce((s, l) => s + l.durationMinutes, 0);
        const pieces = [...new Set(practiceAfterLastLesson.flatMap(l => (l.pieces ?? []).map(p => p.title)))];
        const studentNotes = practiceAfterLastLesson
            .filter(l => l.studentNote || l.notes)
            .map(l => (l.studentNote || l.notes)!);

        const moods = practiceAfterLastLesson.map(l => l.mood).filter(Boolean);
        const moodScore = (moods as any[]).reduce((s, m) => s + (m === 'GREAT' ? 3 : m === 'OKAY' ? 2 : 1), 0);
        const avgMood = moods.length ? (moodScore / moods.length >= 2.5 ? 'GREAT' : moodScore / moods.length >= 1.5 ? 'OKAY' : 'HARD') : 'N/A';

        // Current repertoire
        const currentRepertoire = (mockAssignedRepertoire ?? []).filter(r =>
            r.studentId === studentId && r.status !== 'COMPLETED'
        );

        // Last lesson notes
        const lastNote = lastLesson
            ? (mockLessonNotes ?? []).find(n => n.lessonSlotId === lastLesson.id) ?? null
            : null;

        return {
            studentName: student.name,
            lastLessonDate,
            daysSinceLastLesson: daysSince,
            practiceSinceLastLesson: {
                totalMinutes: totalPracticeMinutes,
                sessionCount: practiceAfterLastLesson.length,
                averageMood: avgMood,
                pieces,
                studentNotes,
            },
            currentRepertoire,
            lastLessonNotes: lastNote,
            unreadStudentMessages: 0,
        };
    }, [studentId, teacherId, users, mockLessons, mockPracticeLogs, mockAssignedRepertoire, mockLessonNotes]);

    return { summary, isLoading: false };
}
