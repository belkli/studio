'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function FinancialReports() {
    const { mockInvoices, users, mockPackages, mockLessons } = useAuth();

    const {
        revenueData,
        packageRevenueData,
        collectionRate,
        teacherRevenue
    } = useMemo(() => {
        // Monthly Revenue (last 6 months)
        const revenueByMonth: {[key: string]: number} = {};
        const now = new Date();
        for (let i=5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = format(date, 'MMM', { locale: he });
            revenueByMonth[monthKey] = 0;
        }
        
        mockInvoices.filter(inv => inv.status === 'PAID' && inv.paidAt).forEach(inv => {
            const paidDate = new Date(inv.paidAt!);
            const monthKey = format(paidDate, 'MMM', { locale: he });
            if (monthKey in revenueByMonth) {
                revenueByMonth[monthKey] += inv.total;
            }
        });

        const finalRevenueData = Object.keys(revenueByMonth).map(month => ({ name: month, revenue: revenueByMonth[month] }));

        // Package Revenue Breakdown
        let totalRevenue = 0;
        const revenueByPackageType: Record<string, number> = {
            'מנוי שנתי': 0, 'מנוי חודשי': 0, 'חבילות': 0, 'שיעורים בודדים': 0
        };

        mockInvoices.filter(i => i.status === 'PAID').forEach(invoice => {
            totalRevenue += invoice.total;
            // This is a simplified logic, a real app would link invoices to packages
            if (invoice.lineItems[0].description.includes('שנתי')) revenueByPackageType['מנוי שנתי'] += invoice.total;
            else if (invoice.lineItems[0].description.includes('חודשי')) revenueByPackageType['מנוי חודשי'] += invoice.total;
            else if (invoice.lineItems[0].description.includes('חבילת')) revenueByPackageType['חבילות'] += invoice.total;
            else revenueByPackageType['שיעורים בודדים'] += invoice.total;
        });

        const finalPackageRevenueData = Object.keys(revenueByPackageType).map(name => ({
            name,
            value: totalRevenue > 0 ? parseFloat(((revenueByPackageType[name] / totalRevenue) * 100).toFixed(1)) : 0
        }));

        // Collection Rate
        const collectionRate = mockInvoices.length > 0 ? (mockInvoices.filter(i => i.status === 'PAID').length / mockInvoices.length) * 100 : 0;
        
        // Teacher Revenue
        const teachers = users.filter(u => u.role === 'teacher');
        const teacherRevenueData = teachers.map(teacher => ({
            name: teacher.name,
            revenue: Math.floor(Math.random() * (20000 - 5000 + 1) + 5000), // Mocked for simplicity
        })).sort((a, b) => b.revenue - a.revenue);

        return {
            revenueData: finalRevenueData,
            packageRevenueData: finalPackageRevenueData,
            collectionRate,
            teacherRevenue: teacherRevenueData,
        }

    }, [mockInvoices, users]);

    const creditsIssuedThisMonth = useMemo(() => {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        return mockLessons.filter(lesson => {
            const lessonDate = new Date(lesson.startTime);
            return (lesson.status === 'CANCELLED_TEACHER' || lesson.status === 'CANCELLED_CONSERVATORIUM') &&
                   lessonDate.getMonth() === thisMonth &&
                   lessonDate.getFullYear() === thisYear;
        }).length;
    }, [mockLessons]);

    return (
        <div className="space-y-6 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>הכנסות חודשיות (חצי שנה אחרונה)</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₪${(value/1000)}k`}/>
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    direction: 'rtl',
                                }}
                                 formatter={(value: number) => [`₪${value.toLocaleString()}`, 'הכנסה']}
                            />
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>התפלגות הכנסות לפי חבילה</CardTitle>
                    </CardHeader>
                     <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={packageRevenueData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => `${entry.name} ${entry.value}%`}>
                                    {packageRevenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle>שיעור גבייה</CardTitle>
                        <CardDescription>אחוז החשבוניות ששולמו.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-600">{collectionRate.toFixed(1)}%</div>
                        <Progress value={collectionRate} className="mt-2 h-3" />
                        <p className="text-xs text-muted-foreground mt-2">
                           {mockInvoices.filter(i => i.status === 'OVERDUE').length} חשבוניות בפיגור.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                     <CardHeader>
                        <CardTitle>זיכויים וקרדיטים</CardTitle>
                        <CardDescription>זיכויים שהונפקו לתלמידים החודש.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{creditsIssuedThisMonth}</div>
                         <p className="text-xs text-muted-foreground mt-2">
                           זיכויים לשיעורי השלמה.
                        </p>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>מקורות הכנסה מובילים לפי מורה</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>מורה</TableHead>
                                <TableHead className="text-left">הכנסה חודשית (אומדן)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teacherRevenue.slice(0, 5).map((teacher) => (
                                <TableRow key={teacher.name}>
                                    <TableCell className="font-medium">{teacher.name}</TableCell>
                                    <TableCell className="text-left font-mono">₪{teacher.revenue.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
