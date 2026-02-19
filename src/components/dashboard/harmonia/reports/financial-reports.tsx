'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const revenueData = [
  { name: 'ינו׳', revenue: 41200 },
  { name: 'פבר׳', revenue: 38900 },
  { name: 'מרץ', revenue: 50500 },
  { name: 'אפר׳', revenue: 47800 },
  { name: 'מאי', revenue: 62300 },
  { name: 'יוני', revenue: 58100 },
];

const packageRevenueData = [
  { name: 'מנוי שנתי', value: 45 },
  { name: 'מנוי חודשי', value: 35 },
  { name: 'חבילות', value: 15 },
  { name: 'שיעורים בודדים', value: 5 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function FinancialReports() {
    const { mockInvoices, users } = useAuth();

    const collectionRate = (mockInvoices.filter(i => i.status === 'PAID').length / mockInvoices.length) * 100;
    
    const teachers = users.filter(u => u.role === 'teacher');
    const teacherRevenue = teachers.map(teacher => ({
        name: teacher.name,
        revenue: Math.floor(Math.random() * (20000 - 5000 + 1) + 5000), // Mock revenue
    })).sort((a, b) => b.revenue - a.revenue);

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

            <div className="grid md:grid-cols-2 gap-6">
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
                        <CardDescription>אחוז החשבוניות ששולמו בזמן.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-600">{collectionRate.toFixed(1)}%</div>
                        <Progress value={collectionRate} className="mt-2 h-3" />
                        <p className="text-xs text-muted-foreground mt-2">
                           {mockInvoices.filter(i => i.status === 'OVERDUE').length} חשבוניות בפיגור.
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
                                <TableHead className="text-left">הכנסה חודשית</TableHead>
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
