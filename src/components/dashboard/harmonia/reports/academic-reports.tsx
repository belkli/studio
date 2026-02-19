'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AcademicReports() {
    const { mockPracticeLogs, users } = useAuth();
    
    const students = users.filter(u => u.role === 'student');
    const logsThisWeek = mockPracticeLogs.filter(log => {
        const logDate = new Date(log.date);
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        return logDate >= oneWeekAgo && logDate <= today;
    });

    const studentsWhoPracticed = new Set(logsThisWeek.map(log => log.studentId));
    const practiceEngagementRate = (studentsWhoPracticed.size / students.length) * 100;
    
    const averageMinutes = logsThisWeek.length > 0 
        ? logsThisWeek.reduce((sum, log) => sum + log.durationMinutes, 0) / studentsWhoPracticed.size
        : 0;

    const practiceByDayData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(new Date().getDate() - i);
        return { name: d.toLocaleDateString('he-IL', { weekday: 'short' }), date: d.toISOString().split('T')[0], minutes: 0 };
    }).reverse();

    logsThisWeek.forEach(log => {
        const dayData = practiceByDayData.find(d => d.date === log.date.split('T')[0]);
        if (dayData) {
            dayData.minutes += log.durationMinutes;
        }
    });

    return (
        <div className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>שיעור מעורבות באימונים (שבוע אחרון)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-[200px]">
                        <div className="text-5xl font-bold text-primary">{practiceEngagementRate.toFixed(0)}%</div>
                        <p className="text-muted-foreground mt-2">{studentsWhoPracticed.size} מתוך {students.length} תלמידים רשמו אימון השבוע.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>ממוצע דקות אימון (לתלמיד מתאמן)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-[200px]">
                        <div className="text-5xl font-bold text-accent">{averageMinutes.toFixed(0)}</div>
                        <p className="text-muted-foreground mt-2">דקות בממוצע לתלמיד שרשם אימון השבוע.</p>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>סה"כ דקות אימון לפי יום</CardTitle>
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
        </div>
    );
}
