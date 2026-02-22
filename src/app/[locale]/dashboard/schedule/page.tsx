'use client';
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { ScheduleCalendar } from "@/components/dashboard/harmonia/schedule-calendar";
import { EmptyState } from "@/components/ui/empty-state";

export default function SchedulePage() {
    const { user, mockLessons } = useAuth();
    if (!user) return null;

    const relevantLessons = useMemo(() => {
        const userIsStudent = user.role === 'student';
        const userIsParent = user.role === 'parent';
        const userIsTeacher = user.role === 'teacher';

        return mockLessons.filter(lesson => {
            if(userIsStudent) return lesson.studentId === user.id;
            if(userIsParent) return user.childIds?.includes(lesson.studentId);
            if(userIsTeacher) return lesson.teacherId === user.id;
            return true; // for admins, show all
        });

    }, [user, mockLessons]);

    // For now, we'll just show lessons for the current week.
    // A real implementation would have date navigation.
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    const weekLessons = relevantLessons.filter(l => {
        const lessonDate = new Date(l.startTime);
        return lessonDate >= startOfWeek && lessonDate <= endOfWeek;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-2xl font-bold">מערכת שעות שבועית</h1>
                    <p className="text-muted-foreground">צפה ונהל את השיעורים, ההזמנות והזמינות שלך.</p>
                </div>
                 <Button asChild>
                    <Link href="/dashboard/schedule/book">
                        <PlusCircle className="ms-2 h-4 w-4" />
                        הזמן שיעור חדש
                    </Link>
                </Button>
            </div>
            
            {weekLessons.length > 0 ? (
                <ScheduleCalendar lessons={weekLessons} />
            ) : (
                <EmptyState
                    icon={Calendar}
                    title="אין שיעורים מתוכננים"
                    description="מערכת השעות שלך לשבוע הקרוב ריקה. אפשר להזמין שיעור חדש."
                    action={
                        <Button asChild>
                            <Link href="/dashboard/schedule/book">
                                <PlusCircle className="ms-2 h-4 w-4" />
                                הזמן שיעור חדש
                            </Link>
                        </Button>
                    }
                />
            )}
        </div>
    );
}
