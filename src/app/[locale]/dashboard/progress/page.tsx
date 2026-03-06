'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Target, Medal, Clock, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import { useMemo } from "react";


export default function ProgressPage() {
    const { user, practiceLogs } = useAuth();
    const t = useTranslations("ProgressPage");
    if (!user) return null;

    const userLogs = useMemo(() => {
        if (!user) return [];
        return practiceLogs.filter(log => log.studentId === user.id);
    }, [practiceLogs, user]);

    const { weeklyPracticeData, totalMinutesThisWeek, weeklyGoal, totalMinutesThisMonth, streak } = useMemo(() => {
        const today = new Date();

        // Weekly chart data (last 7 days)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return {
                date: d.toISOString().split('T')[0],
                name: d.toLocaleDateString('he-IL', { weekday: 'short' }),
                minutes: 0,
            };
        }).reverse();

        userLogs.forEach(log => {
            const logDate = log.date.split('T')[0];
            const dayData = last7Days.find(d => d.date === logDate);
            if (dayData) {
                dayData.minutes += log.durationMinutes;
            }
        });

        // Weekly goal calculation
        const weeklyGoal = 120;
        const totalMinutesThisWeek = last7Days.slice(-7).reduce((sum, day) => sum + day.minutes, 0);

        // Monthly total calculation
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();
        const totalMinutesThisMonth = userLogs.reduce((sum, log) => {
            const logDate = new Date(log.date);
            if (logDate.getMonth() === thisMonth && logDate.getFullYear() === thisYear) {
                return sum + log.durationMinutes;
            }
            return sum;
        }, 0);

        // Streak calculation
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


        return { weeklyPracticeData: last7Days, totalMinutesThisWeek, weeklyGoal, totalMinutesThisMonth, streak: currentStreak };

    }, [userLogs]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('titleExtended')}</h1>
                <p className="text-muted-foreground">{t('subtitleExtended')}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('weeklyPracticeGoal')}</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{t('minutesXofY', { x: String(totalMinutesThisWeek), y: String(weeklyGoal) })}</div>
                        <Progress value={(totalMinutesThisWeek / weeklyGoal) * 100} className="mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('practiceStreak')}</CardTitle>
                        <Flame className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{t('daysStreak', { count: String(streak) })}</div>
                        <p className="text-xs text-muted-foreground">{t('keepItUp')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('practiceTimeMonth')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{t('hoursCount', { count: (totalMinutesThisMonth / 60).toFixed(1) })}</div>
                        <p className="text-xs text-muted-foreground">{t('totalMinutesCount', { count: String(totalMinutesThisMonth) })}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('practiceLog7Days')}</CardTitle>
                    <CardDescription>{t('practiceLogChartDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="ps-2 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyPracticeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => t('minShort', { value: String(value) })} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    direction: 'rtl',
                                }}
                                formatter={(value) => [t('minutesCount', { count: String(value) }), t('practiceTime')]}
                            />
                            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
