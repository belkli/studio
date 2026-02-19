'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";

export function AcademicReports() {
    const { mockPracticeLogs, users } = useAuth();
    
    const students = useMemo(() => users.filter(u => u.role === 'student'), [users]);
    
    const { practiceEngagementRate, averageMinutes, practiceByDayData, lowEngagementStudents } = useMemo(() => {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);

        const logsThisWeek = mockPracticeLogs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= oneWeekAgo && logDate <= today;
        });

        const studentsWhoPracticed = new Set(logsThisWeek.map(log => log.studentId));
        const engagementRate = students.length > 0 ? (studentsWhoPracticed.size / students.length) * 100 : 0;
        
        const avgMinutes = logsThisWeek.length > 0 && studentsWhoPracticed.size > 0
            ? logsThisWeek.reduce((sum, log) => sum + log.durationMinutes, 0) / studentsWhoPracticed.size
            : 0;

        const dailyData = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(new Date().getDate() - i);
            return { name: d.toLocaleDateString('he-IL', { weekday: 'short' }), date: d.toISOString().split('T')[0], minutes: 0 };
        }).reverse();

        logsThisWeek.forEach(log => {
            const dayData = dailyData.find(d => d.date === log.date.split('T')[0]);
            if (dayData) {
                dayData.minutes += log.durationMinutes;
            }
        });
        
        const studentsPractice = students.map(student => {
            const totalMinutes = mockPracticeLogs
                .filter(log => log.studentId === student.id)
                .reduce((sum, log) => sum + log.durationMinutes, 0);
            return { student, totalMinutes };
        });

        const lowEngagers = studentsPractice
            .filter(item => item.totalMinutes < 30) // Example threshold
            .sort((a,b) => a.totalMinutes - b.totalMinutes)
            .slice(0, 5);

        return { 
            practiceEngagementRate: engagementRate, 
            averageMinutes: avgMinutes, 
            practiceByDayData: dailyData,
            lowEngagementStudents: lowEngagers
        };
    }, [mockPracticeLogs, students]);


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
                        <div className="text-5xl font-bold">12</div>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>סה"כ דקות אימון לפי יום (שבוע אחרון)</CardTitle>
                </CardHeader>
                 <CardContent className="h-[350px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={practiceByDayData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} ד'`}/>
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    direction: 'rtl',
                                }}
                                 formatter={(value: number) => [`${value} דקות`, 'זמן אימון כולל']}
                            />
                            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
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
