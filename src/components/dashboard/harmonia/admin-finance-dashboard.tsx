'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, FileWarning, Users, TrendingUp } from "lucide-react";

import { useTranslations } from "next-intl";
import { tenantUsers } from '@/lib/tenant-filter';

export function AdminFinancialDashboard() {
    const { invoices, users, user } = useAuth();
    const t = useTranslations('FinancialDashboard');
    const ti = useTranslations('Invoices');

    const revenueData = [
        { name: t('months.jan'), revenue: 41200 },
        { name: t('months.feb'), revenue: 38900 },
        { name: t('months.mar'), revenue: 50500 },
        { name: t('months.apr'), revenue: 47800 },
        { name: t('months.may'), revenue: 62300 },
        { name: t('months.jun'), revenue: 58100 },
    ];

    const packageRevenueData = [
        { name: t('revenueByPackage'), value: 100 }, // Using existing key for simplicity as mock
    ];

    const outstandingInvoices = invoices.filter(inv => inv.status === 'SENT' || inv.status === 'OVERDUE');
    const collectionRate = invoices.length > 0 ? (invoices.filter(i => i.status === 'PAID').length / invoices.length) * 100 : 0;

    const teachers = useMemo(() => user ? tenantUsers(users, user, 'teacher') : [], [users, user]);
    const _teacherRevenue = useMemo(() => {
        return teachers.map(teacher => ({
            name: teacher.name,
            // eslint-disable-next-line react-hooks/purity
            revenue: Math.floor(Math.random() * (20000 - 5000 + 1) + 5000), // Mock revenue
        })).sort((a, b) => b.revenue - a.revenue);
    }, [teachers]);


    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('revenueMonth')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪62,300</div>
                        <p className="text-xs text-muted-foreground">{t('revenueVsLastMonth', { percent: 20.1 })}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('overdueCharges')}</CardTitle>
                        <FileWarning className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{invoices.filter(i => i.status === 'OVERDUE').length}</div>
                        <p className="text-xs text-muted-foreground">{t('totalOverdueAmount', { amount: '1,840' })}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('collectionRate')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{collectionRate.toFixed(1)}%</div>
                        <Progress value={collectionRate} className="mt-2 h-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('activeStudents')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{user ? tenantUsers(users, user, 'student').filter(u => u.approved).length : 0}</div>
                        <p className="text-xs text-muted-foreground">{t('studentsChange', { count: 3 })}</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>{t('monthlyRevenue')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] ps-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickFormatter={(value) => `₪${(value / 1000)}k`} tickLine={false} axisLine={false} />
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <Tooltip formatter={(value: any) => [`₪${Number(value).toLocaleString()}`, t('revenueLabel')]} cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('revenueByPackage')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[300px]">
                        <PieChart width={300} height={280}>
                                <Pie data={packageRevenueData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => `${entry.name} (${entry.value}%)`}>
                                    {packageRevenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <Tooltip formatter={(value: any, name: any) => [`${value}%`, name]} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                            </PieChart>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('openInvoices')}</CardTitle>
                    <CardDescription>{t('openInvoicesDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{ti('invoiceNumber')}</TableHead>
                                <TableHead>{ti('payer')}</TableHead>
                                <TableHead>{ti('dueDate')}</TableHead>
                                <TableHead>{ti('amount')}</TableHead>
                                <TableHead>{ti('status')}</TableHead>
                                <TableHead className="text-start">{ti('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {outstandingInvoices.map(invoice => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                                    <TableCell>{users.find(u => u.id === invoice.payerId)?.name}</TableCell>
                                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                                    <TableCell>{invoice.total} ₪</TableCell>
                                    <TableCell><Badge variant={invoice.status === 'OVERDUE' ? 'destructive' : 'secondary'}>{ti(`statuses.${invoice.status}`)}</Badge></TableCell>
                                    <TableCell className="text-start">
                                        <Button variant="outline" size="sm">{ti('sendReminder')}</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
