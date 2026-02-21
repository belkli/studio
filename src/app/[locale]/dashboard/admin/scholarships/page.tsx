'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HandCoins, Users, Banknote, Search, CheckCircle2, XCircle, Clock, Hourglass } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import type { ScholarshipApplication, ApplicationStatus } from '@/lib/types';

const statusConfig: Record<ApplicationStatus, { label: string; icon: React.ElementType, className: string }> = {
    DRAFT: { label: 'טיוטה', icon: Clock, className: 'bg-gray-100 text-gray-800' },
    SUBMITTED: { label: 'הוגשה', icon: Hourglass, className: 'bg-blue-100 text-blue-800' },
    DOCUMENTS_PENDING: { label: 'ממתין למסמכים', icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
    UNDER_REVIEW: { label: 'בבדיקה', icon: Hourglass, className: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { label: 'אושר', icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
    PARTIALLY_APPROVED: { label: 'אושר חלקית', icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
    WAITLISTED: { label: 'רשימת המתנה', icon: Clock, className: 'bg-purple-100 text-purple-800' },
    REJECTED: { label: 'נדחה', icon: XCircle, className: 'bg-red-100 text-red-800' },
    EXPIRED: { label: 'פג תוקף', icon: XCircle, className: 'bg-gray-100 text-gray-800' },
};


export default function AdminScholarshipsPage() {
    const { user, mockScholarshipApplications } = useAuth();
    
    if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
        return <p>אין לך הרשאה לצפות בעמוד זה.</p>
    }

    const applications = mockScholarshipApplications.filter(app => app.conservatoriumId === user.conservatoriumId);

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
                        <div className="text-2xl font-bold">{applications.filter(a => a.status === 'SUBMITTED').length}</div>
                        <p className="text-xs text-muted-foreground">סך דרישה: ₪12,000</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>בקשות למלגה</CardTitle>
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
                                    <TableHead className="text-right">תלמיד</TableHead>
                                    <TableHead className="text-right">כלי נגינה</TableHead>
                                    <TableHead className="text-right">תאריך הגשה</TableHead>
                                    <TableHead className="text-right">ניקוד עדיפות</TableHead>
                                    <TableHead className="text-right">סטטוס</TableHead>
                                    <TableHead className="text-right">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((app) => {
                                    const StatusIcon = statusConfig[app.status]?.icon || Clock;
                                    return (
                                    <TableRow key={app.id}>
                                        <TableCell className="font-medium">{app.studentName}</TableCell>
                                        <TableCell>{app.instrument}</TableCell>
                                        <TableCell>{new Date(app.submittedAt).toLocaleDateString('he-IL')}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">{app.priorityScore}</Badge>
                                        </TableCell>
                                        <TableCell>
                                             <Badge variant="outline" className={statusConfig[app.status].className}>
                                                <StatusIcon className="w-3 h-3 me-1.5" />
                                                {statusConfig[app.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">צפה בבקשה</Button>
                                        </TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
