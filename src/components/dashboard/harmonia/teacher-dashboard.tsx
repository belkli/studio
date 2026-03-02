'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, PlusCircle, Calendar, CheckCircle, XCircle, Clock, Music } from "lucide-react";
import { useMemo, useState } from "react";
import type { User, PracticeLog, Package, LessonSlot, SlotStatus, EventProduction } from "@/lib/types";
import { mockEvents } from "@/lib/data";
import { format } from "date-fns";
import { useDateLocale } from '@/hooks/use-date-locale';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { SickLeaveModal } from "./sick-leave-modal";
import { WeeklyCalendar } from "./weekly-calendar";

function TodaysLessonCard({ lesson, student, onAttendance }: { lesson: LessonSlot; student: User | undefined; onAttendance: (lessonId: string, status: SlotStatus) => void }) {
    const isPast = new Date(lesson.startTime) < new Date();
    const isCancelled = lesson.status.startsWith('CANCELLED') || lesson.status.startsWith('NO_SHOW');
    const isCompleted = lesson.status === 'COMPLETED';

    const t = useTranslations("Dashboard.Teacher");

    const attendanceButtons = (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onAttendance(lesson.id, 'COMPLETED')}>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{t('markAttendance')}</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onAttendance(lesson.id, 'NO_SHOW_STUDENT')}>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{t('markNoShow')}</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onAttendance(lesson.id, 'CANCELLED_STUDENT_NOTICED')}>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{t('markAbsence')}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </>
    );

    return (
        <div className="flex items-center gap-4 p-3 rounded-lg border">
            <span className="font-mono text-muted-foreground">{new Date(lesson.startTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
            <Avatar>
                <AvatarImage src={student?.avatarUrl} />
                <AvatarFallback>{student?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold">{student?.name}</p>
                <p className="text-sm text-muted-foreground">
                    {lesson.instrument}, חדר {lesson.roomId || '?'}
                </p>
            </div>
            <div className="flex gap-2">
                {!isPast && !isCancelled && !isCompleted && attendanceButtons}
                {isCancelled && <Badge variant="destructive">{lesson.status === 'NO_SHOW_STUDENT' ? t('noShow') : t('cancelled')}</Badge>}
                {isCompleted && <Badge>{t('completed')}</Badge>}
                {isPast && !isCompleted && !isCancelled && <Badge variant="secondary">{t('waitingForMark')}</Badge>}
            </div>
        </div>
    );
}


function StudentRosterCard({ student, practiceLogs, mockPackages, lessons, id }: { student: User, practiceLogs: PracticeLog[], mockPackages: Package[], lessons: LessonSlot[], id?: string }) {

    const weeklyPractice = useMemo(() => {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);

        return practiceLogs.reduce((sum, log) => {
            const logDate = new Date(log.date);
            if (logDate >= oneWeekAgo && logDate <= today) {
                return sum + log.durationMinutes;
            }
            return sum;
        }, 0);
    }, [practiceLogs]);

    const studentPackage = mockPackages.find(p => p.id === student.packageId);

    const nextLesson = useMemo(() => {
        const now = new Date();
        return lessons
            .filter(l => l.studentId === student.id && new Date(l.startTime) >= now)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        [0];
    }, [lessons, student.id]);

    const dateLocale = useDateLocale();
    const t = useTranslations("Dashboard.Teacher");

    return (
        <Card id={id} className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={student.avatarUrl} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-lg">{student.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{student.instruments?.map(i => i.instrument).join(', ')}</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
                <div>
                    <p className="font-semibold">{t('nextLesson')}</p>
                    {nextLesson ? (
                        <p className="text-muted-foreground">{format(new Date(nextLesson.startTime), "EEEE, dd/MM 'בשעה' HH:mm", { locale: dateLocale })} ({nextLesson.instrument})</p>
                    ) : (
                        <p className="text-muted-foreground">{t('noNextLesson')}</p>
                    )}
                </div>
                <div>
                    <p className="font-semibold">{t('packageStatus')}</p>
                    <p className="text-muted-foreground">{studentPackage?.title || t('notAssigned')}</p>
                </div>
                <div>
                    <p className="font-semibold">{t('practiceProgress')}</p>
                    {weeklyPractice > 0 ? (
                        <p className="text-muted-foreground">{t('minutesPracticed', { min: weeklyPractice })}</p>
                    ) : (
                        <p className="text-muted-foreground text-orange-600">{t('noPractice')}</p>
                    )}
                </div>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/dashboard/teacher/student/${student.id}`}>
                            <ArrowLeft className="ms-2 h-4 w-4" />
                            {t('fullProfile')}
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/messages" title={t('sendMessage')}>
                            <MessageSquare className="h-4 w-4" />
                            <span className="sr-only">{t('sendMessage')}</span>
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function TeacherDashboard() {
    const { user, users, mockLessons, mockFormSubmissions, mockPracticeLogs, mockPackages, updateLessonStatus } = useAuth();
    const { toast } = useToast();
    const [isSickLeaveModalOpen, setIsSickLeaveModalOpen] = useState(false);

    if (!user) return null;

    const assignedStudents = users.filter(u => user.students?.includes(u.id));

    const teacherLessons = mockLessons.filter(lesson => lesson.teacherId === user.id);

    const pendingApprovals = useMemo(() => {
        return mockFormSubmissions.filter(form =>
            form.status === 'PENDING_TEACHER' &&
            user.students?.includes(form.studentId)
        )
    }, [mockFormSubmissions, user.students]);

    const t = useTranslations("Dashboard.Teacher");

    const handleAttendance = (lessonId: string, status: SlotStatus) => {
        updateLessonStatus(lessonId, status);
        toast({
            title: t('attendanceMarked'),
            description: t('lessonUpdated')
        });
    };


    const teacherPerformances = useMemo(() => {
        return mockEvents.filter(event =>
            event.program.some(slot => assignedStudents.some(s => s.id === slot.studentId))
        );
    }, [assignedStudents]);

    return (
        <div className="space-y-8 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t('welcomeTitle', { name: user.name.split(' ')[0] })}</h1>
                    <p className="text-muted-foreground">{t('welcomeSubtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button id="sick-leave-button" variant="destructive" onClick={() => setIsSickLeaveModalOpen(true)}>
                        <XCircle className="ms-2 h-4 w-4" />
                        {t('sickLeave')}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/forms/new">
                            <PlusCircle className="ms-2 h-4 w-4" />
                            {t('newForm')}
                        </Link>
                    </Button>
                    <Button variant="secondary" asChild>
                        <Link href="/dashboard/teacher/availability">{t('manageAvailability')}</Link>
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('weeklySchedule')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <WeeklyCalendar lessons={teacherLessons} students={assignedStudents} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between py-2">
                            <div>
                                <CardTitle className="text-lg font-bold">
                                    {t('pendingApprovals', { count: pendingApprovals.length })}
                                </CardTitle>
                                <CardDescription>{t('pendingApprovalsDesc')}</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/dashboard/forms?status=pending">{t('viewAllApprovals')}</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pendingApprovals.length > 0 ? (
                                    pendingApprovals.slice(0, 3).map((form) => {
                                        const student = users.find(u => u.id === form.studentId);
                                        return (
                                            <div key={form.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                                <div className="grid gap-1">
                                                    <p className="font-medium">{form.studentName}</p>
                                                    <p className="text-xs text-muted-foreground">{form.formType} - {form.submissionDate}</p>
                                                </div>
                                                <Button size="sm" variant="ghost" asChild>
                                                    <Link href={`/dashboard/forms/${form.id}`}>{t('view')}</Link>
                                                </Button>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-muted-foreground py-4 text-center">{t('noPendingApprovals')}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between py-2">
                            <div>
                                <CardTitle className="text-lg font-bold">
                                    {t('upcomingPerformances')}
                                </CardTitle>
                                <CardDescription>{t('upcomingPerformancesDesc')}</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/dashboard/performances">{t('viewAll')}</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {teacherPerformances.length > 0 ? (
                                    teacherPerformances.slice(0, 3).map((event) => (
                                        <div key={event.id} className="flex items-center gap-3 border-b pb-2 last:border-0 last:pb-0">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <Music className="h-5 w-5" />
                                            </div>
                                            <div className="grid gap-1">
                                                <p className="font-medium">{event.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {event.eventDate} | {event.startTime} | {event.venue}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground py-4 text-center">{t('noUpcomingPerformances')}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('myStudents', { count: assignedStudents.length })}</CardTitle>
                    <CardDescription>{t('myStudentsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {assignedStudents.map((student, index) => <StudentRosterCard key={student.id} id={index === 0 ? "student-roster-card" : undefined} student={student} practiceLogs={mockPracticeLogs.filter(log => log.studentId === student.id)} mockPackages={mockPackages} lessons={mockLessons} />)}
                </CardContent>
            </Card>
            <SickLeaveModal open={isSickLeaveModalOpen} onOpenChange={setIsSickLeaveModalOpen} />
        </div>
    );
}
