'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Receipt, CreditCard, CalendarClock, Package, FileText, Download, PauseCircle, XCircle, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';
import { useMemo } from "react";
import { format, startOfMonth, addMonths } from 'date-fns';
import { he } from 'date-fns/locale';

export function StudentBillingDashboard() {
    const { user, mockInvoices, mockPackages, mockLessons, getMakeupCreditBalance } = useAuth();
    if (!user) return null;
    
    const userAndChildrenIds = useMemo(() => {
        if (!user) return [];
        return [user.id, ...(user.childIds || [])];
    }, [user]);

    const userInvoices = mockInvoices.filter(inv => userAndChildrenIds.some(id => inv.payerId === id));
    
    const makeupCreditBalance = getMakeupCreditBalance(userAndChildrenIds);


    const currentPackage = useMemo(() => {
        const studentForPackage = user.role === 'student' ? user : (user.childIds ? user.childIds[0] : null);
        if (!studentForPackage) return null;
        
        const pkg = mockPackages.find(p => p.id === studentForPackage.packageId);
        if (!pkg) return null;
        
        let creditsRemaining: number | undefined;
        if (pkg.totalCredits) {
             const lessonsUsed = mockLessons.filter(l => l.studentId === studentForPackage.id && l.packageId === pkg.id && l.status === 'COMPLETED').length;
             creditsRemaining = pkg.totalCredits - lessonsUsed;
        }

        let nextBillingDate: string | undefined = undefined;
        if (pkg.type === 'MONTHLY') {
            nextBillingDate = format(startOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd');
        }

        return {
            ...pkg,
            creditsRemaining,
            nextBillingDate,
        };
    }, [mockPackages, user, mockLessons]);

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary"/> סטטוס חבילה</CardTitle>
                                <CardDescription className="pt-1">{currentPackage?.title || 'אין חבילה פעילה'}</CardDescription>
                            </div>
                             <Button variant="outline" size="sm">שדרג חבילה</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {currentPackage?.totalCredits && currentPackage.creditsRemaining !== undefined ? (
                            <div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-sm font-medium">שיעורים נותרו</span>
                                    <span className="text-lg font-bold">{currentPackage.creditsRemaining} / {currentPackage.totalCredits}</span>
                                </div>
                                <Progress value={(currentPackage.creditsRemaining! / currentPackage.totalCredits) * 100} className="h-2" />
                            </div>
                        ) : currentPackage ? (
                            <div className="text-muted-foreground text-sm">מנוי חודשי ללא הגבלת שיעורים.</div>
                        ) : (
                             <div className="text-muted-foreground text-sm">לא משויכת חבילה.</div>
                        )}
                         <div className="flex justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground flex items-center gap-1"><CalendarClock className="h-4 w-4"/>
                            {currentPackage?.nextBillingDate ? 'חיוב הבא' : (currentPackage?.validUntil ? 'תוקף חבילה' : 'סטטוס')}</span>
                            <span className="font-semibold">
                                {currentPackage?.nextBillingDate ? `${new Date(currentPackage.nextBillingDate).toLocaleDateString('he-IL')} (${currentPackage.price} ₪)` 
                                : (currentPackage?.validUntil ? new Date(currentPackage.validUntil).toLocaleDateString('he-IL') : 'פעיל')}
                            </span>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="flex flex-col">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-accent"/> שיעורי השלמה</CardTitle>
                        <CardDescription>זיכויים זמינים עקב ביטולים.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold">{makeupCreditBalance}</div>
                        <p className="text-sm text-muted-foreground mt-1">זיכויים</p>
                    </CardContent>
                    <CardFooter>
                         <Button variant="secondary" className="w-full" asChild>
                            <Link href="/dashboard/makeups">
                                עבור לניהול שיעורי השלמה
                            </Link>
                         </Button>
                    </CardFooter>
                </Card>
            </div>
             <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>היסטוריית חיובים</CardTitle>
                        <CardDescription>להלן רשימת החשבוניות והתשלומים האחרונים שלך.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>מספר חשבונית</TableHead>
                                    <TableHead>תאריך</TableHead>
                                    <TableHead>פרטי חיוב</TableHead>
                                    <TableHead>סכום</TableHead>
                                    <TableHead>סטטוס</TableHead>
                                    <TableHead className="text-left">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userInvoices.map(invoice => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString('he-IL')}</TableCell>
                                        <TableCell>{invoice.lineItems[0].description}</TableCell>
                                        <TableCell>{invoice.total} ₪</TableCell>
                                        <TableCell><Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'} className={invoice.status === 'PAID' ? "bg-green-100 text-green-800" : (invoice.status === 'OVERDUE' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800")}>{invoice.status === 'PAID' ? 'שולם' : (invoice.status === 'OVERDUE' ? 'בפיגור' : 'ממתין')}</Badge></TableCell>
                                        <TableCell className="text-left">
                                            <Button variant="ghost" size="icon">
                                                <Download className="h-4 w-4"/>
                                                <span className="sr-only">הורד חשבונית</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {userInvoices.length === 0 && <TableRow><TableCell colSpan={6} className="text-center h-24">לא נמצאו חשבוניות.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="flex flex-col justify-center p-6 bg-muted/30">
                    <CardHeader className="p-0 pb-4">
                        <CardTitle>ניהול מנוי</CardTitle>
                    </CardHeader>
                     <CardContent className="p-0 flex-grow flex flex-col justify-center gap-2">
                        <Button className="w-full">נהל אמצעי תשלום</Button>
                        <Button variant="outline" className="w-full text-muted-foreground"><PauseCircle className="ms-2 h-4 w-4" />השהיית מנוי</Button>
                        <Button variant="ghost" className="w-full text-destructive hover:text-destructive"><XCircle className="ms-2 h-4 w-4" />ביטול מנוי</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
