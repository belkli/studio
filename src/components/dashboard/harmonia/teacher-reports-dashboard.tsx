'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";
import { Users, Calendar, DollarSign, Activity } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export function TeacherReportsDashboard() {
    const { user: teacher, users, mockLessons, mockPracticeLogs, mockFormSubmissions } = useAuth();

    const assignedStudents = useMemo(() => {
        if (!teacher || !teacher.students) return [];
        return users.filter(u => teacher.students!.includes(u.id));
    }, [teacher, users]);

    const stats = useMemo(() => {
        if (!teacher) return { lessonsThisMonth: 0, cancellationsThisMonth: 0, earningsThisMonth: 0, practiceEngagement: 0, upcomingExams: [] };

        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const lessonsThisMonth = mockLessons.filter(l => {
            const lessonDate = new Date(l.startTime);
            return l.teacherId === teacher.id && isWithinInterval(lessonDate, { start, end }) && l.status === 'COMPLETED';
        });

        const cancellationsThisMonth = mockLessons.filter(l => {
            const lessonDate = new Date(l.startTime);
            return l.teacherId === teacher.id && isWithinInterval(lessonDate, { start, end }) && (l.status.startsWith('CANCELLED'));
        });

        // Mock earnings calculation
        const earningsThisMonth = lessonsThisMonth.length * 150; // Assuming 150 per lesson

        const studentsWhoPracticed = new Set(mockPracticeLogs.filter(log => {
            const logDate = new Date(log.date);
            return isWithinInterval(logDate, { start, end }) && assignedStudents.some(s => s.id === log.studentId);
        }).map(log => log.studentId));

        const practiceEngagement = assignedStudents.length > 0 ? (studentsWhoPracticed.size / assignedStudents.length) * 100 : 0;

        const upcomingExams = mockFormSubmissions.filter(f =>
            (f.formType === 'רסיטל בגרות' || f.formType === 'הרשמה לבחינה') &&
            assignedStudents.some(s => s.id === f.studentId) &&
            f.status !== 'נדחה' && f.status !== 'טיוטה'
        );

        return {
            lessonsThisMonth: lessonsThisMonth.length,
            cancellationsThisMonth: cancellationsThisMonth.length,
            earningsThisMonth: earningsThisMonth,
            practiceEngagement: practiceEngagement,
            upcomingExams: upcomingExams,
        }
    }, [teacher, mockLessons, mockPracticeLogs, assignedStudents, mockFormSubmissions]);

    const practiceEngagementData = useMemo(() => {
        return assignedStudents.map(student => {
            const totalMinutes = mockPracticeLogs
                .filter(log => log.studentId === student.id)
                .reduce((sum, log) => sum + log.durationMinutes, 0);
            return { name: student.name.split(' ')[0], minutes: totalMinutes };
        }).sort((a, b) => b.minutes - a.minutes);
    }, [assignedStudents, mockPracticeLogs]);

    if (!teacher) return null;

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">תלמידים פעילים</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assignedStudents.length}</div>
                        <p className="text-xs text-muted-foreground">תלמידים תחת הדרכתך</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">שיעורים החודש</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.lessonsThisMonth}</div>
                        <p className="text-xs text-muted-foreground">{stats.cancellationsThisMonth} ביטולים</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">הכנסות החודש (אומדן)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪{stats.earningsThisMonth.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">מבוסס על שיעורים שהושלמו</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">מעורבות באימונים</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.practiceEngagement.toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">תלמידים שרשמו אימון החודש</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>מעורבות תלמידים באימונים</CardTitle>
                    <CardDescription>סה"כ דקות אימון רשומות לכל תלמיד/ה.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={practiceEngagementData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${value}`} />
                            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', direction: 'rtl' }}
                                formatter={(value: any) => [`${Number(value)} דקות`, 'זמן אימון כולל']}
                            />
                            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>בחינות ובגרויות קרובות</CardTitle>
                    <CardDescription>סקירת סטטוס הגשות של תלמידיך.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>תלמיד/ה</TableHead>
                                <TableHead>סוג הגשה</TableHead>
                                <TableHead>תאריך הגשה</TableHead>
                                <TableHead>סטטוס</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.upcomingExams.length > 0 ? stats.upcomingExams.map((form) => (
                                <TableRow key={form.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={users.find(u => u.id === form.studentId)?.avatarUrl} />
                                            <AvatarFallback>{form.studentName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {form.studentName}
                                    </TableCell>
                                    <TableCell>{form.formType}</TableCell>
                                    <TableCell>{form.submissionDate}</TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">{form.status}</span>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        אין הגשות לבחינות בתקופה הקרובה.
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
