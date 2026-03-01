'use client';

import type { User, LessonSlot, PracticeLog, AssignedRepertoire, LessonNote } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Music, Pencil, Activity, Target, MessageSquare, Package as PackageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useDateLocale } from '@/hooks/use-date-locale';

export function WeeklyDigestCard({ child }: { child: User }) {
    const { users, mockLessons, mockPracticeLogs, mockAssignedRepertoire, mockLessonNotes, compositions } = useAuth();
    const t = useTranslations('WeeklyDigestCard');
    const dateLocale = useDateLocale();

    const statusTranslations: Record<AssignedRepertoire['status'], string> = useMemo(() => ({
        LEARNING: t('statusLearning'),
        POLISHING: t('statusPolishing'),
        PERFORMANCE_READY: t('statusPerformanceReady'),
        COMPLETED: t('statusCompleted')
    }), [t]);

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
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
                    {t('cardTitle', { childName: child.name.split(' ')[0] })}
                </CardTitle>
                <CardDescription>
                    {t('cardSubtitle', {
                        start: format(startOfWeek(new Date(), { weekStartsOn: 0 }), t('dateFormatStart'), { locale: dateLocale }),
                        end: format(endOfWeek(new Date(), { weekStartsOn: 0 }), t('dateFormatEnd'), { locale: dateLocale })
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div>
                    <p className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{t('nextLessonTitle')}</p>
                    {childData.nextLesson && childData.teacher ? (
                        <p className="text-muted-foreground pe-2">
                            {t('nextLessonDetails', {
                                date: format(new Date(childData.nextLesson.startTime), t('nextLessonTimeFormat'), { locale: dateLocale }),
                                instrument: childData.nextLesson.instrument,
                                teacherName: childData.teacher.name
                            })}
                        </p>
                    ) : (
                        <p className="text-muted-foreground pe-2">{t('noUpcomingLessons')}</p>
                    )}
                </div>

                <div>
                    <p className="font-semibold flex items-center gap-2"><Music className="h-4 w-4 text-purple-500" />{t('currentRepertoireTitle')}</p>
                    {childData.repertoire.length > 0 ? (
                        <ul className="list-disc list-inside pe-2 text-muted-foreground">
                            {childData.repertoire.map(rep => {
                                const composition = compositions.find(c => c.id === rep.compositionId);
                                return <li key={rep.id}>{composition?.title} ({statusTranslations[rep.status]})</li>
                            })}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground pe-2">{t('noRepertoire')}</p>
                    )}
                </div>

                <div>
                    <p className="font-semibold flex items-center gap-2"><Pencil className="h-4 w-4 text-orange-500" />{t('lastLessonNotesTitle', { teacherName: childData.teacher?.name.split(' ')[0] || t('genericTeacherName') })}</p>
                    {childData.lastNote ? (
                        <p className="text-muted-foreground italic pe-2">"{childData.lastNote.summary}"</p>
                    ) : (
                        <p className="text-muted-foreground pe-2">{t('noLastLessonNotes')}</p>
                    )}
                </div>

                <div>
                    <p className="font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-green-500" />{t('weeklyPracticeTitle')}</p>
                    <div className="pe-2">
                        <p className="text-muted-foreground">{t('practiceSummary', { sessions: childData.practiceSessions, minutes: childData.totalMinutesThisWeek })}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <Progress value={(childData.totalMinutesThisWeek / childData.weeklyGoal) * 100} className="h-2 flex-1" />
                            <span className="text-xs font-mono">{t('practiceGoalProgress', { minutes: childData.totalMinutesThisWeek, goal: childData.weeklyGoal })}</span>
                        </div>
                    </div>
                </div>

                {child.playingSchoolInfo && (
                    <div className="p-3 rounded-md bg-orange-50 dark:bg-orange-900/30 border-s-4 border-orange-400">
                        <h4 className="font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
                            <PackageIcon className="h-4 w-4" />
                            {t('schoolProgramTitle')}
                        </h4>
                        <div className="mt-2 space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-orange-700/70 dark:text-orange-300/70">{t('instrumentStatus')}:</span>
                                <span className={cn(
                                    "font-medium px-1.5 py-0.5 rounded",
                                    child.playingSchoolInfo.instrumentReceived
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                        : "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
                                )}>
                                    {child.playingSchoolInfo.instrumentReceived ? t('instrumentReceived') : t('instrumentPending')}
                                </span>
                            </div>
                            {!child.playingSchoolInfo.instrumentReceived && (
                                <p className="text-orange-700/90 dark:text-orange-300/90 text-[10px] italic">
                                    {t('pickupNote')}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/30 border-s-4 border-blue-400">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">{t('helpAtHomeTitle')}</h4>
                    <p className="text-blue-700/90 dark:text-blue-300/90 text-xs mt-1">{t('helpAtHomeDesc', { childName: child.name.split(' ')[0] })}</p>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/dashboard/student/${child.id}`}>
                            {t('fullProfileBtn')}
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href="/dashboard/messages" title={t('sendMessageTitle')}>
                            <MessageSquare className="ms-2 h-4 w-4" />
                            {t('sendMessageBtn')}
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
