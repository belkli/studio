'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Receipt, CreditCard, CalendarClock, Package, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AdminFinancialDashboard } from "@/components/dashboard/harmonia/admin-finance-dashboard";


function StudentBillingDashboard() {
    const { user, mockInvoices } = useAuth();
    if (!user) return null;

    const userInvoices = mockInvoices.filter(inv => inv.payerId === user.id || user.childIds?.includes(inv.payerId));

    const currentPackage = {
        name: "מנוי חודשי - פסנתר",
        creditsRemaining: 3,
        totalCredits: 4,
        nextBillingDate: "2024-07-01",
        price: 560,
    }

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">חבילה נוכחית</p>
                            <p className="font-bold text-lg">{currentPackage.name}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-full">
                            <CreditCard className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">שיעורים נותרים בחבילה</p>
                            <div className="flex items-baseline gap-2">
                                <p className="font-bold text-lg">{currentPackage.creditsRemaining} / {currentPackage.totalCredits}</p>
                            </div>
                                <Progress value={(currentPackage.creditsRemaining / currentPackage.totalCredits) * 100} className="h-2 mt-1" />
                        </div>
                    </div>
                </Card>
                    <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-full">
                            <CalendarClock className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">חיוב הבא</p>
                            <p className="font-bold text-lg">{new Date(currentPackage.nextBillingDate).toLocaleDateString('he-IL')}</p>
                            <p className="text-sm">{currentPackage.price} ₪</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 flex flex-col justify-center">
                    <Button className="w-full">שדרג חבילה</Button>
                    <Button variant="outline" className="w-full mt-2">נהל אמצעי תשלום</Button>
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
                                    <TableCell><Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'} className={invoice.status === 'PAID' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{invoice.status === 'PAID' ? 'שולם' : 'ממתין'}</Badge></TableCell>
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

export default function BillingPage() {
    const { user, newFeaturesEnabled } = useAuth();
    
    if (!user) {
         // Render a placeholder or legacy page if needed for non-feature-flagged users
         return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">חיובים</h1>
                    <p className="text-muted-foreground">טוען נתונים...</p>
                </div>
            </div>
        );
    }
    
    if (!newFeaturesEnabled) {
         return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">חיובים</h1>
                    <p className="text-muted-foreground">עמוד זה בבנייה.</p>
                </div>
            </div>
        );
    }

    const isAdmin = user.role === 'conservatorium_admin' || user.role === 'site_admin';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">
                    {isAdmin ? 'דשבורד פיננסי' : 'חיובים ותשלומים'}
                </h1>
                <p className="text-muted-foreground">
                    {isAdmin ? 'סקירה כללית של הכנסות, חשבוניות ונתונים פיננסיים.' : 'צפה ונהל את החבילות, החיובים, החשבוניות והתשלומים שלך.'}
                </p>
            </div>

            {isAdmin ? <AdminFinancialDashboard /> : <StudentBillingDashboard />}
        </div>
    )
}
