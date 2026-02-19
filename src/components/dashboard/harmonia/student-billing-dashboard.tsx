'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Receipt, CreditCard, CalendarClock, Package, FileText, Download, PauseCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';
import { useMemo } from "react";

export function StudentBillingDashboard() {
    const { user, mockInvoices, mockPackages } = useAuth();
    if (!user) return null;

    const userInvoices = mockInvoices.filter(inv => inv.payerId === user.id || user.childIds?.includes(inv.payerId));

    const currentPackage = useMemo(() => {
        const pkg = mockPackages.find(p => p.id === user.packageId);
        if (!pkg) return null;
        
        // Mock dynamic credits for demo
        const creditsRemaining = pkg.totalCredits ? Math.floor(Math.random() * (pkg.totalCredits)) + 1 : undefined;

        return {
            ...pkg,
            creditsRemaining,
            nextBillingDate: "2024-07-01", // Mock next billing
        };
    }, [mockPackages, user.packageId]);


    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">חבילה נוכחית</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currentPackage?.title || 'אין חבילה פעילה'}</div>
                        <p className="text-xs text-muted-foreground">{currentPackage?.description}</p>
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">שיעורים נותרו</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {currentPackage?.totalCredits ? (
                            <>
                                <div className="text-2xl font-bold">{currentPackage.creditsRemaining} / {currentPackage.totalCredits}</div>
                                <Progress value={(currentPackage.creditsRemaining! / currentPackage.totalCredits) * 100} className="h-2 mt-2" />
                            </>
                        ) : (
                            <div className="text-2xl font-bold">ללא הגבלה</div>
                        )}
                    </CardContent>
                </Card>
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">חיוב הבא</CardTitle>
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                     <CardContent>
                        {currentPackage?.nextBillingDate ? (
                             <>
                                <div className="text-2xl font-bold">{new Date(currentPackage.nextBillingDate).toLocaleDateString('he-IL')}</div>
                                <p className="text-xs text-muted-foreground">{currentPackage.price} ₪</p>
                             </>
                        ): (
                            <div className="text-2xl font-bold">-</div>
                        )}
                    </CardContent>
                </Card>
                <Card className="flex flex-col justify-center p-6 bg-muted/30">
                    <Button className="w-full">נהל אמצעי תשלום</Button>
                    <div className="flex gap-2 mt-2">
                        <Button variant="ghost" size="sm" className="w-full text-muted-foreground"><PauseCircle className="ms-2 h-4 w-4" />השהיית מנוי</Button>
                        <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive"><XCircle className="ms-2 h-4 w-4" />ביטול מנוי</Button>
                    </div>
                </Card>
            </div>

            <Card>
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
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
