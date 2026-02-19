'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Target, Medal, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";


export default function ProgressPage() {
    const { user, mockPracticeLogs } = useAuth();
    if (!user) return null;

    const weeklyPracticeData = useMemo(() => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return {
                date: d.toISOString().split('T')[0],
                name: d.toLocaleDateString('he-IL', { weekday: 'short' }),
                minutes: 0,
            };
        }).reverse();

        mockPracticeLogs.forEach(log => {
            const logDate = log.date.split('T')[0];
            const dayData = last7Days.find(d => d.date === logDate);
            if (dayData) {
                dayData.minutes += log.durationMinutes;
            }
        });
        
        return last7Days;

    }, [mockPracticeLogs]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">מעקב התקדמות</h1>
                <p className="text-muted-foreground">צפה בהתקדמות האימונים, המטרות וההישגים שלך.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">יעד אימון שבועי</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45 / 90 דקות</div>
                        <Progress value={50} className="mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">רצף אימונים</CardTitle>
                        <Medal className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">🔥 4 ימים</div>
                        <p className="text-xs text-muted-foreground">כל הכבוד על ההתמדה!</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">זמן אימון (החודש)</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8.5 שעות</div>
                         <p className="text-xs text-muted-foreground">+20% מהחודש שעבר</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>יומן אימונים - 7 ימים אחרונים</CardTitle>
                    <CardDescription>תרשים המציג את דקות האימון היומיות שלך.</CardDescription>
                </CardHeader>
                <CardContent className="ps-2 h-[350px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyPracticeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} ד'`}/>
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    direction: 'rtl',
                                }}
                                 formatter={(value) => [`${value} דקות`, 'זמן אימון']}
                            />
                            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
