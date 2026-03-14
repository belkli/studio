'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { useTranslations } from 'next-intl';
import { tenantFilter, tenantUsers } from '@/lib/tenant-filter';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function FinancialReports() {
    const t = useTranslations('Reports');
    const { invoices, users, lessons, user } = useAuth();
    const dateLocale = useDateLocale();

    const {
        revenueData,
        packageRevenueData,
        collectionRate,
        teacherRevenue
    } = useMemo(() => {
        // Monthly Revenue (last 6 months)
        const revenueByMonth: { [key: string]: number } = {};
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = format(date, 'MMM', { locale: dateLocale });
            revenueByMonth[monthKey] = 0;
        }

        invoices.filter(inv => inv.status === 'PAID' && inv.paidAt).forEach(inv => {
            const paidDate = new Date(inv.paidAt!);
            const monthKey = format(paidDate, 'MMM', { locale: dateLocale });
            if (monthKey in revenueByMonth) {
                revenueByMonth[monthKey] += inv.total;
            }
        });

        const finalRevenueData = Object.keys(revenueByMonth).map(month => ({ name: month, revenue: revenueByMonth[month] }));

        // Package Revenue Breakdown
        let totalRevenue = 0;
        const revenueByPackageType: Record<string, number> = {
            'ANNUAL_SUB': 0, 'MONTHLY_SUB': 0, 'PACKAGES': 0, 'SINGLE_LESSONS': 0
        };

        invoices.filter(i => i.status === 'PAID').forEach(invoice => {
            totalRevenue += invoice.total;
            const desc = invoice.lineItems[0].description;
            if (desc.includes('שנתי') || desc.includes('Annual')) revenueByPackageType['ANNUAL_SUB'] += invoice.total;
            else if (desc.includes('חודשי') || desc.includes('Monthly')) revenueByPackageType['MONTHLY_SUB'] += invoice.total;
            else if (desc.includes('חבילת') || desc.includes('Package')) revenueByPackageType['PACKAGES'] += invoice.total;
            else revenueByPackageType['SINGLE_LESSONS'] += invoice.total;
        });

        const finalPackageRevenueData = Object.keys(revenueByPackageType).map(key => ({
            name: t(`packageTypes.${key}`),
            value: totalRevenue > 0 ? parseFloat(((revenueByPackageType[key] / totalRevenue) * 100).toFixed(1)) : 0
        }));

        // Collection Rate
        const collectionRate = invoices.length > 0 ? (invoices.filter(i => i.status === 'PAID').length / invoices.length) * 100 : 0;

        // Teacher Revenue
        const teachers = user ? tenantUsers(users, user, 'teacher') : [];
        const teacherRevenueData = teachers.map(teacher => ({
            name: teacher.name,
            revenue: 5000 + (teacher.name.split('').reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0) % 15001), // Deterministic mock
        })).sort((a, b) => b.revenue - a.revenue);

        return {
            revenueData: finalRevenueData,
            packageRevenueData: finalPackageRevenueData,
            collectionRate,
            teacherRevenue: teacherRevenueData,
        }

    }, [invoices, users, user, t, dateLocale]);

    const creditsIssuedThisMonth = useMemo(() => {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        return (user ? tenantFilter(lessons, user) : lessons).filter(lesson => {
            const lessonDate = new Date(lesson.startTime);
            return (lesson.status === 'CANCELLED_TEACHER' || lesson.status === 'CANCELLED_CONSERVATORIUM') &&
                lessonDate.getMonth() === thisMonth &&
                lessonDate.getFullYear() === thisYear;
        }).length;
    }, [user, lessons]);

    return (
        <div className="space-y-6 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('financialTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₪${(value / 1000)}k`} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                                formatter={(value: any) => [`₪${Number(value).toLocaleString()}`, t('revenue')]}
                            />
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('revenueByPackage')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={packageRevenueData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => `${entry.name} ${entry.value}%`}>
                                    {packageRevenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any, name: any) => [`${value}%`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('collectionRate')}</CardTitle>
                        <CardDescription>{t('collectionRateDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-600">{collectionRate.toFixed(1)}%</div>
                        <Progress value={collectionRate} className="mt-2 h-3" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {t('overdueInvoices', { count: invoices.filter(i => i.status === 'OVERDUE').length })}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('creditsIssued')}</CardTitle>
                        <CardDescription>{t('creditsIssuedDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{creditsIssuedThisMonth}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {t('makeupCredits')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('topTeacherRevenue')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('teacher')}</TableHead>
                                <TableHead className="text-start">{t('monthlyRevenueEstimate')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teacherRevenue.slice(0, 5).map((teacher) => (
                                <TableRow key={teacher.name}>
                                    <TableCell className="font-medium">{teacher.name}</TableCell>
                                    <TableCell className="text-start font-mono">₪{teacher.revenue.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
