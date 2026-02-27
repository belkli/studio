'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";
import { instruments } from "@/lib/data";

const RechartsTooltip = Tooltip as any;

export function AcademicReports() {
    const { mockPracticeLogs, users, mockAssignedRepertoire } = useAuth();

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

        const logsThisWeek = mockPracticeLogs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= oneWeekAgo && logDate <= today;
        });

        const studentsWhoPracticedThisWeek = new Set(logsThisWeek.map(log => log.studentId));
        const engagementRate = students.length > 0 ? (studentsWhoPracticedThisWeek.size / students.length) * 100 : 0;

        const avgMinutes = logsThisWeek.length > 0 && studentsWhoPracticedThisWeek.size > 0
            ? logsThisWeek.reduce((sum, log) => sum + log.durationMinutes, 0) / studentsWhoPracticedThisWeek.size
            : 0;

        const studentsPractice = students.map(student => {
            const totalMinutes = mockPracticeLogs
                .filter(log => log.studentId === student.id)
                .reduce((sum, log) => sum + log.durationMinutes, 0);
            return { student, totalMinutes };
        });

        const lowEngagers = studentsPractice
            .filter(item => item.totalMinutes < 30) // Example threshold
            .sort((a, b) => a.totalMinutes - b.totalMinutes)
            .slice(0, 5);

        const repAdvancement = mockAssignedRepertoire.filter(rep => {
            if (!rep.completedAt) return false;
            const completedDate = new Date(rep.completedAt);
            return completedDate >= oneMonthAgo && completedDate <= today;
        }).length;

        const teacherEngagementData = teachers.map(teacher => {
            const teacherStudents = students.filter(s => s.instruments?.some(i => i.teacherName === teacher.name));
            if (teacherStudents.length === 0) return { name: teacher.name, engagement: 0 };

            const practicedStudents = new Set(
                mockPracticeLogs
                    .filter(log => {
                        const logDate = new Date(log.date);
                        return logDate >= oneWeekAgo && teacherStudents.some(s => s.id === log.studentId);
                    })
                    .map(log => log.studentId)
            );

            return {
                name: teacher.name,
                engagement: (practicedStudents.size / teacherStudents.length) * 100
            };
        });

        const instrumentAvgMinutes = instruments.map(instrument => {
            const studentsWithInstrument = students.filter(s => s.instruments?.some(i => i.instrument === instrument));
            if (studentsWithInstrument.length === 0) return { name: instrument, 'ממוצע דקות': 0 };

            const logsForInstrument = mockPracticeLogs.filter(log => {
                const logDate = new Date(log.date);
                return logDate >= oneMonthAgo && studentsWithInstrument.some(s => s.id === log.studentId);
            });
            const totalMinutes = logsForInstrument.reduce((sum, log) => sum + log.durationMinutes, 0);
            return {
                name: instrument,
                'ממוצע דקות': studentsWithInstrument.length > 0 ? totalMinutes / studentsWithInstrument.length : 0,
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
    }, [mockPracticeLogs, students, teachers, mockAssignedRepertoire]);


    return (
        <div className="space-y-6 mt-6">
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>שיעור מעורבות באימונים</CardTitle>
                        <CardDescription>אחוז התלמידים שרשמו אימון בשבוע האחרון.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold text-primary">{practiceEngagementRate.toFixed(0)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>ממוצע דקות אימון</CardTitle>
                        <CardDescription>לתלמיד מתאמן בשבוע האחרון.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold text-accent">{averageMinutes.toFixed(0)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>התקדמות רפרטואר</CardTitle>
                        <CardDescription>יצירות שהושלמו החודש.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold">{repertoireAdvancement}</div>
                    </CardContent>
                </Card>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>מעורבות באימונים לפי מורה (שבוע אחרון)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={engagementByTeacher} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', direction: 'rtl', borderRadius: 'var(--radius)' }}
                                    formatter={(value: any) => [`${Number(value).toFixed(0)}%`, 'מעורבות']}
                                />
                                <Bar dataKey="engagement" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>ממוצע דקות אימון חודשי לפי כלי</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={avgMinutesByInstrument} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', direction: 'rtl', borderRadius: 'var(--radius)' }}
                                    formatter={(value: any) => [`${Number(value).toFixed(0)}`, 'ממוצע דקות']}
                                />
                                <Bar dataKey="ממוצע דקות" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>תלמידים עם מעורבות נמוכה</CardTitle>
                    <CardDescription>תלמידים שרשמו הכי פחות זמן אימון בסך הכל.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>תלמיד/ה</TableHead>
                                <TableHead>מורה</TableHead>
                                <TableHead className="text-left">סה"כ דקות אימון</TableHead>
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
                                    <TableCell className="text-left font-mono">{totalMinutes} דקות</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
