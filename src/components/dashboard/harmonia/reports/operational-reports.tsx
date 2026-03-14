'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';
import { getDay, format, startOfWeek } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { useTranslations } from 'next-intl';
import { RoomOccupancyHeatmap } from "./room-occupancy-heatmap";
import { tenantFilter, tenantUsers } from '@/lib/tenant-filter';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function OperationalReports() {
    const t = useTranslations('Reports');
    const { lessons, users, user } = useAuth();
    const teachersList = useMemo(() => user ? tenantUsers(users, user, 'teacher') : [], [users, user]);
    const dateLocale = useDateLocale();

    const {
        cancellationData,
        cancellationsByDay,
        capacityData,
        trialConversionRate,
        makeupUtilizationRate
    } = useMemo(() => {
        const tenantLessons = user ? tenantFilter(lessons, user) : lessons;
        // Cancellation breakdown
        const cancellationData = [
            { name: t('cancellationTypes.STUDENT_NOTICED'), value: tenantLessons.filter(l => l.status === 'CANCELLED_STUDENT_NOTICED').length },
            { name: t('cancellationTypes.STUDENT_NO_NOTICE'), value: tenantLessons.filter(l => l.status === 'CANCELLED_STUDENT_NO_NOTICE').length },
            { name: t('cancellationTypes.TEACHER'), value: tenantLessons.filter(l => l.status === 'CANCELLED_TEACHER').length },
            { name: t('cancellationTypes.NO_SHOW_STUDENT'), value: tenantLessons.filter(l => l.status === 'NO_SHOW_STUDENT').length },
        ];

        // Cancellations by day
        const now = new Date();
        const days = [];

        for (let i = 0; i < 7; i++) {
            days.push(format(startOfWeek(now, { weekStartsOn: 0 }).setDate(startOfWeek(now, { weekStartsOn: 0 }).getDate() + i), 'EEEE', { locale: dateLocale }));
        }

        const dailyCancellations = days.map(day => ({ name: day, cancellations: 0 }));
        tenantLessons.forEach(lesson => {
            if (lesson.status.startsWith('CANCELLED') || lesson.status.startsWith('NO_SHOW')) {
                const dayIndex = getDay(new Date(lesson.startTime));
                dailyCancellations[dayIndex].cancellations++;
            }
        });

        // Teacher capacity
        const teacherCapacity = teachersList.map(teacher => {
            if (!teacher.students || !teacher.maxStudents) {
                return { name: teacher.name, capacity: 0 };
            }
            const capacityPercentage = (teacher.students.length / teacher.maxStudents) * 100;
            return {
                name: teacher.name,
                capacity: Math.min(100, Math.floor(capacityPercentage)), // Cap at 100%
            };
        }).sort((a, b) => b.capacity - a.capacity);

        // Makeup utilization
        const issuedCredits = tenantLessons.filter(l => ['CANCELLED_TEACHER', 'CANCELLED_CONSERVATORIUM'].includes(l.status)).length;
        const usedCredits = tenantLessons.filter(l => l.type === 'MAKEUP' && l.status === 'COMPLETED').length;
        const makeupUtilization = issuedCredits > 0 ? (usedCredits / issuedCredits) * 100 : 0;

        return {
            cancellationData,
            cancellationsByDay: dailyCancellations,
            capacityData: teacherCapacity,
            trialConversionRate: 68, // Mocked for now
            makeupUtilizationRate: makeupUtilization
        }

    }, [lessons, teachersList, user, t, dateLocale]);

    return (
        <div className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>{t('cancellationDistribution')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={cancellationData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => `${entry.name} (${entry.value})`}>
                                    {cancellationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => [value, t('lessonCount')]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('cancellationsByDay')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] ps-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cancellationsByDay}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip formatter={(value: any) => [value, t('cancellations')]} cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                                <Bar dataKey="cancellations" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('conversionRate')}</CardTitle>
                        <CardDescription>{t('trialToEnrollment')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-[200px]">
                        <div className="text-5xl font-bold text-primary">{trialConversionRate}%</div>
                        <p className="text-muted-foreground mt-2 text-center">{t('trialConversionDesc')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('makeupUtilization')}</CardTitle>
                        <CardDescription>{t('makeupUtilizationDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-[200px]">
                        <div className="text-5xl font-bold text-accent">{makeupUtilizationRate.toFixed(0)}%</div>
                        <p className="text-muted-foreground mt-2 text-center">{t('makeupCreditsContext')}</p>
                    </CardContent>
                </Card>
            </div>
            <RoomOccupancyHeatmap />
            <Card>
                <CardHeader>
                    <CardTitle>{t('teacherCapacity')}</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={capacityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${value}%`} />
                            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                                formatter={(value: any) => [t('capacityLabel', { percent: Number(value).toFixed(0) }), t('capacity')]}
                            />
                            <Bar dataKey="capacity" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
