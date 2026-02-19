'use client';

import type { User, LessonSlot, PracticeLog, AssignedRepertoire, LessonNote } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Music, Pencil, Activity, Target, MessageSquare } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const statusTranslations: Record<AssignedRepertoire['status'], string> = {
    LEARNING: 'למידה',
    POLISHING: 'ליטוש',
    PERFORMANCE_READY: 'מוכן להופעה',
    COMPLETED: 'הושלם'
};

export function WeeklyDigestCard({ child }: { child: User }) {
    const { users, mockLessons, mockPracticeLogs, mockAssignedRepertoire, mockLessonNotes } = useAuth();
    
    const childData = useMemo(() => {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
        const end = endOfWeek(now, { weekStartsOn: 0 });

        const upcomingLessons = mockLessons
            .filter(l => l.studentId === child.id && new Date(l.startTime) >= now)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        const nextLesson = upcomingLessons.length > 0 ? upcomingLessons[0] : null;
        
        const teacher = nextLesson ? users.find(u => u.id === nextLesson!.teacherId) : null;
        
        const repertoire = mockAssignedRepertoire.filter(r => r.studentId === child.id && r.status !== 'COMPLETED');
        
        const recentNotes = mockLessonNotes
            .filter(n => n.studentId === child.id && (n.isSharedWithParent || n.isSharedWithStudent))
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const lastNote = recentNotes.length > 0 ? recentNotes[0] : null;

        const practiceThisWeek = mockPracticeLogs.filter(log => {
            const logDate = new Date(log.date);
            return log.studentId === child.id && isWithinInterval(logDate, { start, end });
        });

        const totalMinutesThisWeek = practiceThisWeek.reduce((sum, log) => sum + log.durationMinutes, 0);
        const weeklyGoal = child.weeklyPracticeGoal || 120; // Default goal
        const practiceSessions = practiceThisWeek.length;

        return {
            nextLesson,
            teacher,
            repertoire,
            lastNote,
            totalMinutesThisWeek,
            weeklyGoal,
            practiceSessions,
        }

    }, [child, users, mockLessons, mockPracticeLogs, mockAssignedRepertoire, mockLessonNotes]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>
                    השבוע במוזיקה של {child.name.split(' ')[0]}
                </CardTitle>
                <CardDescription>
                    סיכום שבועי - {format(startOfWeek(new Date(), {weekStartsOn: 0}), "d בMMM")} - {format(endOfWeek(new Date(), {weekStartsOn: 0}), "d בMMM yyyy", {locale: he})}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div>
                    <p className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary"/>השיעור הבא:</p>
                    {childData.nextLesson && childData.teacher ? (
                        <p className="text-muted-foreground pe-2">
                            {format(new Date(childData.nextLesson.startTime), "EEEE, dd/MM 'בשעה' HH:mm", { locale: he })} - {childData.nextLesson.instrument} עם {childData.teacher.name}
                        </p>
                    ) : (
                        <p className="text-muted-foreground pe-2">אין שיעורים קרובים במערכת.</p>
                    )}
                </div>

                 <div>
                    <p className="font-semibold flex items-center gap-2"><Music className="h-4 w-4 text-purple-500"/>רפרטואר נוכחי:</p>
                    {childData.repertoire.length > 0 ? (
                        <ul className="list-disc list-inside pe-2 text-muted-foreground">
                            {childData.repertoire.map(rep => {
                                const composition = useAuth().compositions.find(c => c.id === rep.compositionId);
                                return <li key={rep.id}>{composition?.title} ({statusTranslations[rep.status]})</li>
                            })}
                        </ul>
                    ) : (
                         <p className="text-muted-foreground pe-2">לא הוגדר רפרטואר.</p>
                    )}
                </div>

                <div>
                    <p className="font-semibold flex items-center gap-2"><Pencil className="h-4 w-4 text-orange-500"/>מהשיעור האחרון עם {childData.teacher?.name.split(' ')[0] || 'המורה'}:</p>
                    {childData.lastNote ? (
                        <p className="text-muted-foreground italic pe-2">"{childData.lastNote.summary}"</p>
                    ) : (
                         <p className="text-muted-foreground pe-2">אין הערות מהשיעור האחרון.</p>
                    )}
                </div>

                <div>
                    <p className="font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-green-500"/>סיכום אימונים השבוע:</p>
                    <div className="pe-2">
                        <p className="text-muted-foreground">{childData.practiceSessions} אימונים, סה"כ {childData.totalMinutesThisWeek} דקות.</p>
                         <div className="flex items-center gap-2 mt-1">
                            <Target className="h-4 w-4 text-muted-foreground" />
                             <Progress value={(childData.totalMinutesThisWeek / childData.weeklyGoal) * 100} className="h-2 flex-1" />
                             <span className="text-xs font-mono">{childData.totalMinutesThisWeek}/{childData.weeklyGoal} דק'</span>
                        </div>
                    </div>
                </div>

                 <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/30 border-s-4 border-blue-400">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">איך לעזור בבית?</h4>
                    <p className="text-blue-700/90 dark:text-blue-300/90 text-xs mt-1">בקשו מ{child.name.split(' ')[0]} לנגן עבורכם את היצירה שהוא/היא הכי נהנה/ית ממנה כרגע, וחגגו איתו/ה את ההתקדמות!</p>
                </div>
                 <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                       <Link href={`/dashboard/student/${child.id}`}>
                           לפרופיל המלא
                       </Link>
                    </Button>
                     <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href="/dashboard/messages" title="שלח הודעה">
                             <MessageSquare className="ms-2 h-4 w-4" />
                            שלח/י הודעה למורה
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
