'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";
import { Users, Calendar, DollarSign, Activity } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useTranslations, useLocale } from 'next-intl';
import type { User, PracticeLog, FormSubmission } from "@/lib/types";

export function TeacherReportsDashboard() {
    const { user: teacher, users, lessons, practiceLogs, formSubmissions }: { user: User | null, users: User[], lessons: any[], practiceLogs: PracticeLog[], formSubmissions: FormSubmission[] } = useAuth();
    const t = useTranslations('TeacherReports');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const assignedStudents = useMemo(() => {
        if (!teacher || !teacher.students) return [];
        return users.filter((u: User) => teacher.students!.includes(u.id));
    }, [teacher, users]);

    const stats = useMemo(() => {
        if (!teacher) return { lessonsThisMonth: 0, cancellationsThisMonth: 0, earningsThisMonth: 0, practiceEngagement: 0, upcomingExams: [] };

        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const lessonsThisMonth = lessons.filter((l: any) => {
            const lessonDate = new Date(l.startTime);
            return l.teacherId === teacher.id && isWithinInterval(lessonDate, { start, end }) && l.status === 'COMPLETED';
        });

        const cancellationsThisMonth = lessons.filter((l: any) => {
            const lessonDate = new Date(l.startTime);
            return l.teacherId === teacher.id && isWithinInterval(lessonDate, { start, end }) && (l.status.startsWith('CANCELLED'));
        });

        // Mock earnings calculation
        const earningsThisMonth = lessonsThisMonth.length * 150; // Assuming 150 per lesson

        const studentsWhoPracticed = new Set(practiceLogs.filter((log: PracticeLog) => {
            const logDate = new Date(log.date);
            return isWithinInterval(logDate, { start, end }) && assignedStudents.some((s: User) => s.id === log.studentId);
        }).map((log: PracticeLog) => log.studentId));

        const practiceEngagement = assignedStudents.length > 0 ? (studentsWhoPracticed.size / assignedStudents.length) * 100 : 0;

        const upcomingExams = formSubmissions.filter((f: FormSubmission) =>
            (f.formType === 'רסיטל בגרות' || f.formType === 'הרשמה לבחינה') &&
            assignedStudents.some((s: User) => s.id === f.studentId) &&
            f.status !== 'REJECTED' && f.status !== 'DRAFT'
        );

        return {
            lessonsThisMonth: lessonsThisMonth.length,
            cancellationsThisMonth: cancellationsThisMonth.length,
            earningsThisMonth: earningsThisMonth,
            practiceEngagement: practiceEngagement,
            upcomingExams: upcomingExams,
        }
    }, [teacher, lessons, practiceLogs, assignedStudents, formSubmissions]);

    const practiceEngagementData = useMemo(() => {
        return assignedStudents.map((student: User) => {
            const totalMinutes = practiceLogs
                .filter((log: PracticeLog) => log.studentId === student.id)
                .reduce((sum: number, log: PracticeLog) => sum + log.durationMinutes, 0);
            return { name: student.name.split(' ')[0], minutes: totalMinutes };
        }).sort((a: { name: string, minutes: number }, b: { name: string, minutes: number }) => b.minutes - a.minutes);
    }, [assignedStudents, practiceLogs]);

    if (!teacher) return null;

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('activeStudentsTitle')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assignedStudents.length}</div>
                        <p className="text-xs text-muted-foreground">{t('activeStudentsDesc')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('lessonsThisMonthTitle')}</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.lessonsThisMonth}</div>
                        <p className="text-xs text-muted-foreground">{t('cancellationsDesc', { count: stats.cancellationsThisMonth })}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('earningsThisMonthTitle')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{t('currencySymbol')}{stats.earningsThisMonth.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{t('earningsDesc')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('practiceEngagementTitle')}</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.practiceEngagement.toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">{t('practiceEngagementDesc')}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('barChartTitle')}</CardTitle>
                    <CardDescription>{t('barChartDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={practiceEngagementData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${value}`} />
                            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', direction: isRtl ? 'rtl' : 'ltr' }}
                                formatter={(value: any) => [`${Number(value)} ${t('minutesSuffix')}`, t('totalPracticeTimeTooltip')]}
                            />
                            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('upcomingExamsTitle')}</CardTitle>
                    <CardDescription>{t('upcomingExamsDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-start">{t('colStudent')}</TableHead>
                                <TableHead className="text-start">{t('colType')}</TableHead>
                                <TableHead className="text-start">{t('colDate')}</TableHead>
                                <TableHead className="text-start">{t('colStatus')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.upcomingExams.length > 0 ? stats.upcomingExams.map((form: FormSubmission) => (
                                <TableRow key={form.id}>
                                    <TableCell className="font-medium flex items-center gap-2 text-start">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={users.find((u: User) => u.id === form.studentId)?.avatarUrl} />
                                            <AvatarFallback>{form.studentName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {form.studentName}
                                    </TableCell>
                                    <TableCell className="text-start">{form.formType}</TableCell>
                                    <TableCell className="text-start">{form.submissionDate}</TableCell>
                                    <TableCell className="text-start">
                                        <span className="text-sm text-muted-foreground">{form.status}</span>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        {t('noUpcomingExams')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}
