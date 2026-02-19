'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, FileWarning, Users, TrendingUp } from "lucide-react";

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
  { name: 'בודדים', value: 5 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function AdminFinancialDashboard() {
    const { mockInvoices, users } = useAuth();
    const outstandingInvoices = mockInvoices.filter(inv => inv.status === 'SENT' || inv.status === 'OVERDUE');
    const collectionRate = (mockInvoices.filter(i => i.status === 'PAID').length / mockInvoices.length) * 100;
    
    const teachers = users.filter(u => u.role === 'teacher');
    const teacherRevenue = teachers.map(teacher => ({
        name: teacher.name,
        revenue: Math.floor(Math.random() * (20000 - 5000 + 1) + 5000), // Mock revenue
    })).sort((a, b) => b.revenue - a.revenue);


    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">סה"כ הכנסות (החודש)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪62,300</div>
                        <p className="text-xs text-muted-foreground">+20.1% מהחודש שעבר</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">חיובים בפיגור</CardTitle>
                        <FileWarning className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockInvoices.filter(i => i.status === 'OVERDUE').length}</div>
                        <p className="text-xs text-muted-foreground">סה"כ ₪1,840 בפיגור</p>
                    </CardContent>
                </Card>
                 <Card>
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">שיעור גבייה</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{collectionRate.toFixed(1)}%</div>
                         <Progress value={collectionRate} className="mt-2 h-2" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">תלמידים פעילים</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u=>u.role==='student' && u.approved).length}</div>
                        <p className="text-xs text-muted-foreground">+3 מהחודש שעבר</p>
                    </CardContent>
                </Card>
            </div>
             <div className="grid lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>הכנסות חודשיות</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] ps-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickFormatter={(value) => `₪${(value/1000)}k`} tickLine={false} axisLine={false}/>
                                <Tooltip formatter={(value: number) => [`₪${value.toLocaleString()}`, 'הכנסה']} cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}/>
                                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>התפלגות הכנסות לפי חבילה</CardTitle>
                    </CardHeader>
                     <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={packageRevenueData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => `${entry.name} (${entry.value}%)`}>
                                    {packageRevenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>חשבוניות פתוחות</CardTitle>
                    <CardDescription>חשבוניות שטרם שולמו וממתינות לטיפול.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>מספר חשבונית</TableHead>
                                <TableHead>משלם</TableHead>
                                <TableHead>תאריך יעד</TableHead>
                                <TableHead>סכום</TableHead>
                                <TableHead>סטטוס</TableHead>
                                <TableHead className="text-left">פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {outstandingInvoices.map(invoice => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                                    <TableCell>{users.find(u => u.id === invoice.payerId)?.name}</TableCell>
                                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString('he-IL')}</TableCell>
                                    <TableCell>{invoice.total} ₪</TableCell>
                                    <TableCell><Badge variant={invoice.status === 'OVERDUE' ? 'destructive' : 'secondary'}>{invoice.status === 'OVERDUE' ? 'בפיגור' : 'נשלחה'}</Badge></TableCell>
                                    <TableCell className="text-left">
                                        <Button variant="outline" size="sm">שלח תזכורת</Button>
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
