'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockInvoices } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const revenueData = [
  { name: 'ינו', revenue: 4000 },
  { name: 'פבר', revenue: 3000 },
  { name: 'מרץ', revenue: 5000 },
  { name: 'אפר', revenue: 4500 },
  { name: 'מאי', revenue: 6000 },
  { name: 'יוני', revenue: 5500 },
];

export function AdminFinancialDashboard() {
    const outstandingInvoices = mockInvoices.filter(inv => inv.status === 'SENT' || inv.status === 'OVERDUE');

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>הכנסות בחודשים האחרונים</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} tickFormatter={(value) => `₪${value}`}/>
                            <Tooltip formatter={(value) => [`₪${value}`, 'הכנסה']} cursor={{fill: 'hsl(var(--muted))'}}/>
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
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
                                    <TableCell>{invoice.payerId}</TableCell>
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
