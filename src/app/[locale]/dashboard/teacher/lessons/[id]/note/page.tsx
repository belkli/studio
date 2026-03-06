'use client';

import { useAuth } from '@/hooks/use-auth';
import { LmsLessonNotePanel } from '@/components/dashboard/harmonia/lms-lesson-note-panel';
import { notFound } from 'next/navigation';

export default function LessonNotePage({ params }: { params: { id: string } }) {
    const { user, lessons } = useAuth();

    if (user?.role !== 'teacher') {
        return <p>אין לך הרשאות לגשת לעמוד זה.</p>;
    }

    // In a real app, this would be fetched from DB
    const lessonId = params.id;
    const lesson = lessons.find(l => l.id === lessonId);

    if (!lesson) {
        return notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">סיכום שיעור</h1>
                <p className="text-muted-foreground">תעד את השיעור, כתוב הערות ומשימות לתלמיד, והוסף הערות סטודיו אישיות.</p>
            </div>

            <LmsLessonNotePanel lessonId={lessonId} studentId={lesson.studentId} />
        </div>
    );
}
