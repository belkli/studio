'use client';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Edit, BookOpen, Clock, Music, UserCircle, Flame, Target, Star, Pencil, Trophy, CalendarCheck2, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { Link } from "@/i18n/routing";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RepertoireStatus, User, AchievementType, Achievement } from "@/lib/types";
import { format, formatDistanceToNow } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { useMemo, useState } from "react";
import { useTranslations, useLocale } from 'next-intl';

const AchievementIcon = ({ type }: { type: AchievementType }) => {
    switch (type) {
        case 'PRACTICE_STREAK_7':
        case 'PRACTICE_STREAK_30':
            return <Flame className="h-6 w-6 text-orange-500" />;
        case 'PIECE_COMPLETED':
            return <Trophy className="h-6 w-6 text-yellow-500" />;
        case 'YEARS_ENROLLED_1':
            return <CalendarCheck2 className="h-6 w-6 text-blue-500" />;
        case 'FIRST_PLAYING_SCHOOL_LESSON':
            return <School className="h-6 w-6 text-indigo-500" />;
        case 'INSTRUMENT_COLLECTED':
            return <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
        default:
            return <Star className="h-6 w-6 text-gray-500" />;
    }
};

import { School, Building, MapPin } from 'lucide-react';

export function StudentProfilePageContent({ student, isParentView = false }: { student: User, isParentView?: boolean }) {
    const { practiceLogs, packages, assignedRepertoire, compositions, lessonNotes, lessons, conservatoriums } = useAuth();
    const [_activeTab, _setActiveTab] = useState('overview');
    const dateLocale = useDateLocale();
    const locale = useLocale();
    const t = useTranslations("StudentDashboard");

    const userLogs = useMemo(() => practiceLogs.filter(log => log.studentId === student.id), [practiceLogs, student.id]);
    const userRepertoire = useMemo(() => assignedRepertoire.filter(rep => rep.studentId === student.id), [assignedRepertoire, student.id]);
    const currentPackage = useMemo(() => packages.find(p => p.id === student.packageId), [packages, student.packageId]);
    const currentConservatorium = useMemo(() => conservatoriums.find(c => c.id === student.conservatoriumId), [conservatoriums, student.conservatoriumId]);
    const userNotes = useMemo(() => {
        return lessonNotes
            .filter(note => note.studentId === student.id && (note.isSharedWithStudent || note.isSharedWithParent))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [lessonNotes, student.id]);


    const { totalMinutesThisWeek, weeklyGoal } = useMemo(() => {
        const weeklyGoal = student.weeklyPracticeGoal || 120;

        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);

        const totalMinutes = userLogs.reduce((sum, log) => {
            const logDate = new Date(log.date);
            if (logDate >= oneWeekAgo && logDate <= today) {
                return sum + log.durationMinutes;
            }
            return sum;
        }, 0);

        // Calculate streak
        const logDates = [...new Set(userLogs.map(log => new Date(log.date.split('T')[0]).getTime()))].sort((a, b) => b - a);

        let currentStreak = 0;
        if (logDates.length > 0) {
            const todayTime = new Date();
            todayTime.setHours(0, 0, 0, 0);
            const yesterdayTime = new Date(todayTime);
            yesterdayTime.setDate(todayTime.getDate() - 1);

            if (logDates[0] === todayTime.getTime() || logDates[0] === yesterdayTime.getTime()) {
                currentStreak = 1;
                for (let i = 0; i < logDates.length - 1; i++) {
                    const diff = (logDates[i] - logDates[i + 1]) / (1000 * 60 * 60 * 24);
                    if (diff === 1) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
        }

        return { totalMinutesThisWeek: totalMinutes, weeklyGoal, streak: currentStreak };
    }, [userLogs, student.weeklyPracticeGoal]);

    const upcomingLessons = useMemo(() => {
        if (!student) return [];
        const now = new Date();
        return lessons
            .filter(l => l.studentId === student.id && new Date(l.startTime) >= now && l.status === 'SCHEDULED')
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 3); // show next 3
    }, [lessons, student]);

    const getStatusColor = (status: RepertoireStatus) => {
        switch (status) {
            case 'LEARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'POLISHING': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'PERFORMANCE_READY': return 'bg-green-100 text-green-800 border-green-200';
            case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: RepertoireStatus) => {
        switch (status) {
            case 'LEARNING': return t('statusLearning');
            case 'POLISHING': return t('statusPolishing');
            case 'PERFORMANCE_READY': return t('statusReady');
            case 'COMPLETED': return t('statusCompleted');
            default: return status;
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{isParentView ? t('parentViewTitle', { studentName: student.name.split(' ')[0] }) : t('welcomeTitle', { studentName: student.name.split(' ')[0] })}</h1>
                    <p className="text-muted-foreground">{t('controlCenter')}</p>
                </div>
            </div>
            <Card>
                <CardHeader className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={student.avatarUrl} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle>{student.name}</CardTitle>
                    <CardDescription>{student.email}</CardDescription>
                    {!isParentView && (
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                            <Link href="/dashboard/settings">
                                <Edit className="ms-2 h-4 w-4" />
                                {t('editProfile')}
                            </Link>
                        </Button>
                    )}
                </CardHeader>
            </Card>

            {student.accountType === 'PLAYING_SCHOOL' && student.playingSchoolInfo && (
                <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
                            <School className="h-5 w-5" />
                            {t('schoolProgram')}
                        </CardTitle>
                        <CardDescription>
                            {student.playingSchoolInfo.schoolName} — {student.playingSchoolInfo.programType} Program
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('schoolSymbol')}</p>
                            <p className="text-sm font-semibold flex items-center gap-1.5">
                                <Building className="h-3.5 w-3.5 text-indigo-400" />
                                {student.playingSchoolInfo.schoolSymbol}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('instrumentStatus')}</p>
                            <div className="flex items-center gap-1.5">
                                {student.playingSchoolInfo.instrumentReceived ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <span className="text-sm font-medium">{t('received')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Clock className="h-4 w-4 text-orange-400" />
                                        <span className="text-sm font-medium">{t('pendingCollection')}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        {student.playingSchoolInfo.lessonDay && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('lessonDay')}</p>
                                <p className="text-sm font-semibold flex items-center gap-1.5">
                                    <CalendarIcon className="h-3.5 w-3.5 text-indigo-400" />
                                    {student.playingSchoolInfo.lessonDay}
                                </p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('programType')}</p>
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200">
                                {student.playingSchoolInfo.programType}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building className="text-indigo-500" /> {t('myConservatorium')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentConservatorium ? (
                            <>
                                <p className="text-lg font-medium">{currentConservatorium.name}</p>
                                {currentConservatorium.location?.city && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {currentConservatorium.location.city}
                                    </p>
                                )}
                                {currentConservatorium.location?.address && (
                                    <p className="text-xs text-muted-foreground mt-1">{currentConservatorium.location.address}</p>
                                )}
                            </>
                        ) : (
                            <p className="text-muted-foreground">{t('noConservatoriumAssigned')}</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserCircle className="text-primary" /> {t('myTeacher')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-medium">{student.instruments?.[0]?.teacherName || t('noTeacherAssigned')}</p>
                        <p className="text-muted-foreground">{student.instruments?.[0]?.instrument}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Music className="text-accent" /> {t('myPackage')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentPackage ? (
                            <>
                                <p className="text-lg font-medium">{currentPackage.title}</p>
                                <p className="text-sm text-muted-foreground">{currentPackage.description}</p>
                            </>
                        ) : (
                            <p className="text-muted-foreground">{t('noPackageAssigned')}</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Target className="text-red-500" /> {t('weeklyGoal')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-medium">{t('weeklyGoalProgress', { current: totalMinutesThisWeek, goal: weeklyGoal })}</p>
                        <p className="text-sm text-muted-foreground">{t('weeklyGoalDesc')}</p>
                        <Progress value={(totalMinutesThisWeek / weeklyGoal) * 100} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star /> {t('myRepertoire')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('piece')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userRepertoire.map(rep => {
                                    const composition = compositions.find(c => c.id === rep.compositionId);
                                    return (
                                        <TableRow key={rep.id}>
                                            <TableCell>
                                                <p className="font-medium">{composition?.title}</p>
                                                <p className="text-xs text-muted-foreground">{composition?.composer}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(rep.status)}>{getStatusLabel(rep.status)}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {userRepertoire.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4">{t('noRepertoire')}</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CalendarIcon /> {t('upcomingLessons')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {upcomingLessons.length > 0 ? upcomingLessons.map(lesson => (
                                <div key={lesson.id} className="flex items-start gap-3 text-sm">
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-muted w-12 h-12 rounded-md">
                                        <span className="text-xs font-bold uppercase text-red-600">{format(new Date(lesson.startTime), 'MMM', { locale: dateLocale })}</span>
                                        <span className="text-lg font-bold">{format(new Date(lesson.startTime), 'dd')}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{lesson.instrument}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(lesson.startTime), 'EEEE, HH:mm', { locale: dateLocale })}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">{t('noUpcomingLessons')}</p>
                            )}
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/dashboard/schedule">{t('fullSchedule')}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BookOpen /> {t('recentPractices')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {userLogs.slice(0, 3).map(log => (
                                <div key={log.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                    <div>
                                        <p className="font-medium">{new Date(log.date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                        <p className="text-xs text-muted-foreground">{(log.pieces ?? []).map(p => p.title).join(', ')}</p>
                                    </div>
                                    <Badge variant={log.mood === 'GREAT' ? 'default' : 'secondary'} className={log.mood === 'HARD' ? 'bg-red-100 text-red-800' : ''}>
                                        {t('minutes', { min: log.durationMinutes })}
                                    </Badge>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/dashboard/progress">{t('allPractices')}</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Pencil /> {t('teacherNotes')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {userNotes.length > 0 ? userNotes.slice(0, 2).map(note => (
                                <div key={note.id} className="text-sm border-b pb-3 last:border-b-0 last:pb-0">
                                    <p className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: dateLocale })}</p>
                                    <p className="mt-1">{note.summary}</p>
                                    {note.homeworkAssignments && note.homeworkAssignments.length > 0 && (
                                        <ul className="mt-2 text-xs list-disc list-inside text-muted-foreground marker:text-primary/50">
                                            {note.homeworkAssignments.map((hw, i) => <li key={i}>{hw}</li>)}
                                        </ul>
                                    )}
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">{t('noRecentTeacherNotes')}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Trophy /> {t('achievementsAndCertificates')}</CardTitle>
                    <CardDescription>{t('achievementsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {student.achievements && student.achievements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {student.achievements.map((ach: Achievement) => (
                                <div key={ach.id} className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                                    <AchievementIcon type={ach.type} />
                                    <div className="flex-1">
                                        <p className="font-semibold">{ach.title}</p>
                                        <p className="text-xs text-muted-foreground">{ach.description}</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(ach.achievedAt), { addSuffix: true, locale: dateLocale })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">{t('noAchievements')}</p>
                    )}
                </CardContent>
            </Card>
        </>
    )
}
