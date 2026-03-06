'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";
import { instruments } from "@/lib/taxonomies";
import { useTranslations, useLocale } from 'next-intl';
import { userHasInstrument } from '@/lib/instrument-matching';

const RechartsTooltip = Tooltip as any;

export function AcademicReports() {
    const { practiceLogs, users, assignedRepertoire, conservatoriumInstruments } = useAuth();
    const t = useTranslations('AcademicReports');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const students = useMemo(() => users.filter(u => u.role === 'student'), [users]);
    const teachers = useMemo(() => users.filter(u => u.role === 'teacher'), [users]);

    const {
        practiceEngagementRate,
        averageMinutes,
        lowEngagementStudents,
        repertoireAdvancement,
        engagementByTeacher,
        avgMinutesByInstrument,
    } = useMemo(() => {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);

        const logsThisWeek = practiceLogs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= oneWeekAgo && logDate <= today;
        });

        const studentsWhoPracticedThisWeek = new Set(logsThisWeek.map(log => log.studentId));
        const engagementRate = students.length > 0 ? (studentsWhoPracticedThisWeek.size / students.length) * 100 : 0;

        const avgMinutes = logsThisWeek.length > 0 && studentsWhoPracticedThisWeek.size > 0
            ? logsThisWeek.reduce((sum, log) => sum + log.durationMinutes, 0) / studentsWhoPracticedThisWeek.size
            : 0;

        const studentsPractice = students.map(student => {
            const totalMinutes = practiceLogs
                .filter(log => log.studentId === student.id)
                .reduce((sum, log) => sum + log.durationMinutes, 0);
            return { student, totalMinutes };
        });

        const lowEngagers = studentsPractice
            .filter(item => item.totalMinutes < 30) // Example threshold
            .sort((a, b) => a.totalMinutes - b.totalMinutes)
            .slice(0, 5);

        const repAdvancement = assignedRepertoire.filter(rep => {
            if (!rep.completedAt) return false;
            const completedDate = new Date(rep.completedAt);
            return completedDate >= oneMonthAgo && completedDate <= today;
        }).length;

        const teacherEngagementData = teachers.map(teacher => {
            const teacherStudents = students.filter(s => s.instruments?.some(i => i.teacherName === teacher.name));
            if (teacherStudents.length === 0) return { name: teacher.name, [t('tooltipEngagement')]: 0 };

            const practicedStudents = new Set(
                practiceLogs
                    .filter(log => {
                        const logDate = new Date(log.date);
                        return logDate >= oneWeekAgo && teacherStudents.some(s => s.id === log.studentId);
                    })
                    .map(log => log.studentId)
            );

            return {
                name: teacher.name,
                [t('tooltipEngagement')]: (practicedStudents.size / teacherStudents.length) * 100
            };
        });

        const instrumentAvgMinutes = instruments.map(instrument => {
            const studentsWithInstrument = students.filter((s) => userHasInstrument((s.instruments || []).map((i) => i.instrument), instrument, conservatoriumInstruments, s.conservatoriumId));
            if (studentsWithInstrument.length === 0) return { name: instrument, [t('avgMinutesProp')]: 0 };

            const logsForInstrument = practiceLogs.filter(log => {
                const logDate = new Date(log.date);
                return logDate >= oneMonthAgo && studentsWithInstrument.some(s => s.id === log.studentId);
            });
            const totalMinutes = logsForInstrument.reduce((sum, log) => sum + log.durationMinutes, 0);
            return {
                name: instrument,
                [t('avgMinutesProp')]: studentsWithInstrument.length > 0 ? totalMinutes / studentsWithInstrument.length : 0,
            }
        });

        return {
            practiceEngagementRate: engagementRate,
            averageMinutes: avgMinutes,
            lowEngagementStudents: lowEngagers,
            repertoireAdvancement: repAdvancement,
            engagementByTeacher: teacherEngagementData,
            avgMinutesByInstrument: instrumentAvgMinutes,
        };
    }, [practiceLogs, students, teachers, assignedRepertoire, t]);


    return (
        <div className="space-y-6 mt-6">
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('engagementRateTitle')}</CardTitle>
                        <CardDescription>{t('engagementRateDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold text-primary">{practiceEngagementRate.toFixed(0)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('avgMinutesTitle')}</CardTitle>
                        <CardDescription>{t('avgMinutesDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold text-accent">{averageMinutes.toFixed(0)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('repertoireTitle')}</CardTitle>
                        <CardDescription>{t('repertoireDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold">{repertoireAdvancement}</div>
                    </CardContent>
                </Card>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('chartTeacherTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={engagementByTeacher} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', direction: isRtl ? 'rtl' : 'ltr', borderRadius: 'var(--radius)' }}
                                    formatter={(value: any) => [`${Number(value).toFixed(0)}%`, t('tooltipEngagement')]}
                                />
                                <Bar dataKey={t('tooltipEngagement')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('chartInstrumentTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={avgMinutesByInstrument} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', direction: isRtl ? 'rtl' : 'ltr', borderRadius: 'var(--radius)' }}
                                    formatter={(value: any) => [`${Number(value).toFixed(0)}`, t('tooltipAvgMinutes')]}
                                />
                                <Bar dataKey={t('avgMinutesProp')} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('lowEngagementTitle')}</CardTitle>
                    <CardDescription>{t('lowEngagementDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table dir={isRtl ? 'rtl' : 'ltr'}>
                        <TableHeader>
                            <TableRow>
                                <TableHead className={isRtl ? "text-right" : "text-left"}>{t('colStudent')}</TableHead>
                                <TableHead className={isRtl ? "text-right" : "text-left"}>{t('colTeacher')}</TableHead>
                                <TableHead className={isRtl ? "text-left" : "text-right"}>{t('colTotalMinutes')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lowEngagementStudents.map(({ student, totalMinutes }) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={student.avatarUrl} />
                                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {student.name}
                                    </TableCell>
                                    <TableCell>{student.instruments?.[0]?.teacherName}</TableCell>
                                    <TableCell className={isRtl ? "text-left font-mono" : "text-right font-mono"}>{totalMinutes} {t('minutesUnit')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
