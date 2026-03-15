'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";
import { isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useTranslations, useLocale } from "next-intl";
import { tenantUsers } from '@/lib/tenant-filter';

export function TeacherReports() {
    const t = useTranslations('Reports');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const { users, lessons, practiceLogs, user } = useAuth();

    const teacherStats = useMemo(() => {
        const teachers = user ? tenantUsers(users, user, 'teacher') : [];
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        return teachers.map(teacher => {
            const assignedStudents = teacher.students || [];

            const lessonsThisMonth = lessons.filter(l =>
                l.teacherId === teacher.id &&
                isWithinInterval(new Date(l.startTime), { start, end })
            );

            const taughtLessons = lessonsThisMonth.filter(l => l.status === 'COMPLETED').length;
            const scheduledLessons = lessonsThisMonth.filter(l => l.status === 'SCHEDULED' || l.status === 'COMPLETED').length;
            const teacherCancellations = lessonsThisMonth.filter(l => l.status === 'CANCELLED_TEACHER').length;

            const attendanceRate = scheduledLessons > 0 ? (taughtLessons / scheduledLessons) * 100 : 0;
            const cancellationRate = (scheduledLessons + teacherCancellations) > 0 ? (teacherCancellations / (scheduledLessons + teacherCancellations)) * 100 : 0;

            const studentsWhoPracticed = new Set(
                practiceLogs.filter(log => {
                    const logDate = new Date(log.date);
                    return isWithinInterval(logDate, { start, end }) && assignedStudents.includes(log.studentId);
                }).map(log => log.studentId)
            );
            const practiceEngagement = assignedStudents.length > 0 ? (studentsWhoPracticed.size / assignedStudents.length) * 100 : 0;

            return {
                teacher,
                studentCount: assignedStudents.length,
                capacity: teacher.maxStudents ? (assignedStudents.length / teacher.maxStudents) * 100 : 0,
                taughtLessons,
                attendanceRate,
                cancellationRate,
                practiceEngagement,
            };
        });
    }, [users, user, lessons, practiceLogs]);

    return (
        <div className="space-y-6 mt-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Card>
                <CardHeader>
                    <CardTitle>{t('teacherPerformance')}</CardTitle>
                    <CardDescription>{t('teacherPerformanceDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-start">{t('teacher')}</TableHead>
                                <TableHead className="text-start">{t('studentsCapacity')}</TableHead>
                                <TableHead className="text-start">{t('lessonsThisMonth')}</TableHead>
                                <TableHead className="text-start">{t('attendanceRate')}</TableHead>
                                <TableHead className="text-start">{t('teacherCancellations')}</TableHead>
                                <TableHead className="text-start">{t('studentPracticeEngagement')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teacherStats.map(stat => (
                                <TableRow key={stat.teacher.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={stat.teacher.avatarUrl} />
                                            <AvatarFallback>{stat.teacher.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {stat.teacher.name}
                                    </TableCell>
                                    <TableCell>
                                        <div>{stat.studentCount} / {stat.teacher.maxStudents || 'N/A'}</div>
                                        {stat.teacher.maxStudents && <Progress value={stat.capacity} className="h-2 mt-1" />}
                                    </TableCell>
                                    <TableCell>{stat.taughtLessons}</TableCell>
                                    <TableCell>{stat.attendanceRate.toFixed(0)}%</TableCell>
                                    <TableCell>{stat.cancellationRate.toFixed(0)}%</TableCell>
                                    <TableCell>{stat.practiceEngagement.toFixed(0)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
