'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HandCoins, Users, Banknote, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';

const mockApplications = [
    { id: 'APP-001', student: 'אורי לוי', instrument: 'פסנתר', requested: 2500, status: 'pending', date: '2024-05-12' },
    { id: 'APP-002', student: 'נועה כהן', instrument: 'כינור', requested: 1800, status: 'approved', date: '2024-05-10' },
    { id: 'APP-003', student: 'איתי שפירא', instrument: 'תופים', requested: 3000, status: 'rejected', date: '2024-05-08' },
    { id: 'APP-004', student: 'מאיה גולן', instrument: 'פיתוח קול', requested: 1500, status: 'pending', date: '2024-05-15' },
];

const mockDonors = [
    { id: 'DON-1', name: 'משפחת אריאלי', amount: 50000, date: '2024-01-10', recurring: true },
    { id: 'DON-2', name: 'תורם אנונימי', amount: 15000, date: '2024-03-22', recurring: false },
    { id: 'DON-3', name: 'קרן ירושלים', amount: 120000, date: '2023-11-05', recurring: true },
];

export default function AdminScholarshipsPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between space-y-2 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">ניהול קרן מלגות</h2>
                    <p className="text-muted-foreground">מעקב אחר כספי תרומות ואישור בקשות סיוע כלכלי של תלמידים.</p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <Button variant="outline">ייצוא דוח תרומות (סעיף 46)</Button>
                    <Button>הוסף תרומה ידנית</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">סך הכל בקרן השנה</CardTitle>
                        <Banknote className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪185,000</div>
                        <p className="text-xs text-muted-foreground">+12% משנה שעברה</p>
                    </CardContent>
                </Card>
                <Card className="glass shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">מלגות שאושרו</CardTitle>
                        <HandCoins className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪42,500</div>
                        <p className="text-xs text-muted-foreground">ל-24 תלמידים שונים</p>
                    </CardContent>
                </Card>
                <Card className="glass shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">בקשות ממתינות לאישור</CardTitle>
                        <Users className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground">סך דרישה: ₪12,000</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="applications" className="space-y-4" dir="rtl">
                <TabsList>
                    <TabsTrigger value="applications">בקשות למלגה</TabsTrigger>
                    <TabsTrigger value="donors">חברי הקרן ותורמים</TabsTrigger>
                </TabsList>
                <TabsContent value="applications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>בקשות ממתינות ופעילות</CardTitle>
                            <CardDescription>
                                נהל את בקשות המלגה שהוגשו על ידי תלמידים. לחץ על בקשה לצפייה במסמכים המצורפים ונימוקי הבקשה.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center py-4 gap-2">
                                <Input placeholder="חפש שם תלמיד..." className="max-w-sm" />
                                <Button variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
                            </div>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">מזהה בקשה</TableHead>
                                            <TableHead className="text-right">תלמיד</TableHead>
                                            <TableHead className="text-right">כלי נגינה</TableHead>
                                            <TableHead className="text-right">תאריך הגשה</TableHead>
                                            <TableHead className="text-right">סכום מבוקש</TableHead>
                                            <TableHead className="text-right">סטטוס</TableHead>
                                            <TableHead className="text-right">פעולות</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockApplications.map((app) => (
                                            <TableRow key={app.id}>
                                                <TableCell className="font-medium">{app.id}</TableCell>
                                                <TableCell>{app.student}</TableCell>
                                                <TableCell>{app.instrument}</TableCell>
                                                <TableCell>{new Date(app.date).toLocaleDateString('he-IL')}</TableCell>
                                                <TableCell>₪{app.requested}</TableCell>
                                                <TableCell>
                                                    {app.status === 'pending' && <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200"><Clock className="w-3 h-3 me-1" /> ממתין לועדה</Badge>}
                                                    {app.status === 'approved' && <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200"><CheckCircle2 className="w-3 h-3 me-1" /> מאושר</Badge>}
                                                    {app.status === 'rejected' && <Badge variant="destructive" className="bg-destructive/10 text-destructive border-transparent"><XCircle className="w-3 h-3 me-1" /> נדחה</Badge>}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm">צפה בתיק</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="donors" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>רשימת תורמים</CardTitle>
                            <CardDescription>
                                היסטוריית תרומות לקופת המלגות, הפקת קבלות ומכתבי הוקרה.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">שם התורם / חברה</TableHead>
                                            <TableHead className="text-right">סכום</TableHead>
                                            <TableHead className="text-right">תאריך</TableHead>
                                            <TableHead className="text-right">סוג</TableHead>
                                            <TableHead className="text-right">מכתב תודה</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockDonors.map((donor) => (
                                            <TableRow key={donor.id}>
                                                <TableCell className="font-medium">{donor.name}</TableCell>
                                                <TableCell className="text-emerald-600 font-semibold">₪{donor.amount.toLocaleString()}</TableCell>
                                                <TableCell>{new Date(donor.date).toLocaleDateString('he-IL')}</TableCell>
                                                <TableCell>{donor.recurring ? <Badge variant="secondary">הוראת קבע</Badge> : <Badge variant="outline">חד-פעמי</Badge>}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">שלח הוקרה</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
