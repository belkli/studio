'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, FileText, CheckCircle2, AlertCircle, History, ExternalLink, ShieldCheck } from 'lucide-react';

const MOCK_INVOICES = [
    { id: 'inv-101', month: 'ספטמבר 2026', amount: 800, status: 'PAID', date: '2026-09-01' },
    { id: 'inv-102', month: 'אוקטובר 2026', amount: 800, status: 'PAID', date: '2026-10-01' },
    { id: 'inv-103', month: 'נובמבר 2026', amount: 850, status: 'PENDING', date: '2026-11-01', note: 'כולל השתתפות כינוס חורף (50 ₪)' }
];

export function ParentPaymentPanel() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const pendingInvoices = MOCK_INVOICES.filter(i => i.status === 'PENDING');
    const pastInvoices = MOCK_INVOICES.filter(i => i.status === 'PAID');

    const totalPending = pendingInvoices.reduce((acc, curr) => acc + curr.amount, 0);

    const handlePayNow = () => {
        setIsProcessing(true);
        // Simulate redirecting to Cardcom Low-Profile Page
        setTimeout(() => {
            setIsProcessing(false);
            toast({
                title: 'הופנית לעמוד התשלום המאובטח (Cardcom)',
                description: 'בפועל בחלון זה ייפתח דף תשלום מאובטח בתקן PCI-DSS.'
            });
        }, 1500);
    };

    const handleSetupRecurring = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            toast({
                title: 'הגדרת הוראת קבע באשראי',
                description: 'הבקשה להוראת קבע (Tokens) נשלחה לשרתי קארדקום.'
            });
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Billing Summary */}
                <Card className="md:col-span-1 border-t-4 border-t-blue-600 shadow-sm">
                    <CardHeader className="bg-blue-50/50 pb-4">
                        <CardTitle className="text-blue-900 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-600" /> סיכום חיובים
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">יתרה לתשלום</p>
                            <div className="text-4xl font-bold text-blue-900">₪{totalPending}</div>
                            {totalPending > 0 && <p className="text-sm text-red-500 font-medium mt-2">יש לשלם עד 10 לחודש</p>}
                        </div>

                        <div className="space-y-3">
                            <Button className="w-full text-md h-12" onClick={handlePayNow} disabled={totalPending === 0 || isProcessing}>
                                {isProcessing ? 'מעבד...' : 'לתשלום מאובטח כעת'}
                            </Button>
                            <Button variant="outline" className="w-full text-blue-700 border-blue-200 hover:bg-blue-50" onClick={handleSetupRecurring} disabled={isProcessing}>
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                הגדרת חלופת תשלום / הוראת קבע
                            </Button>
                        </div>

                        <div className="bg-muted p-3 flex gap-3 rounded-lg items-start text-xs text-muted-foreground">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>כל התשלומים מבוצעים דרך מערכת CardCom העומדת בתקן האבטחה המחמיר PCI-DSS. פרטי האשראי אינם נשמרים במערכות "הרמוניה".</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Invoices List */}
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-muted-foreground" /> פירוט חשבוניות</CardTitle>
                        <CardDescription>צפה בחשבוניות פתוחות והיסטוריית תשלומים.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">

                            {/* Pending */}
                            <div>
                                <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                                    לתשלום מידי <Badge variant="destructive" className="rounded-full px-2 py-0 text-xs">{pendingInvoices.length}</Badge>
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>מס' דרישה</TableHead>
                                            <TableHead>חודש</TableHead>
                                            <TableHead>פירוט</TableHead>
                                            <TableHead className="text-right">סכום</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingInvoices.length === 0 ? (
                                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">אין חשבוניות פתוחות לתשלום.</TableCell></TableRow>
                                        ) : (
                                            pendingInvoices.map(inv => (
                                                <TableRow key={inv.id} className="bg-red-50/30">
                                                    <TableCell className="font-medium text-xs text-muted-foreground">{inv.id}</TableCell>
                                                    <TableCell>{inv.month}</TableCell>
                                                    <TableCell className="text-sm text-gray-600">{inv.note || 'שכר לימוד לקונסרבטוריון'}</TableCell>
                                                    <TableCell className="text-right font-bold text-red-600">₪{inv.amount}</TableCell>
                                                    <TableCell className="text-left">
                                                        <Button size="sm" onClick={handlePayNow} className="px-3 rounded-full h-7 text-xs">שלם</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* History */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <History className="w-4 h-4 text-gray-500" /> היסטוריית תשלומים <span className="text-xs font-normal text-muted-foreground">(2 האחרונים)</span>
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>מס' קבלה</TableHead>
                                            <TableHead>חודש</TableHead>
                                            <TableHead>סטטוס</TableHead>
                                            <TableHead className="text-right">סכום</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pastInvoices.map(inv => (
                                            <TableRow key={inv.id}>
                                                <TableCell className="font-medium text-xs text-muted-foreground">{inv.id.replace('inv', 'rcpt')}</TableCell>
                                                <TableCell>{inv.month}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" /> שולם
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">₪{inv.amount}</TableCell>
                                                <TableCell className="text-left">
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 whitespace-nowrap">
                                                        הורד קבלה <ExternalLink className="w-3 h-3 ml-1" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
