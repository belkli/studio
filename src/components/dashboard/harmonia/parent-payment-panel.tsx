'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, FileText, CheckCircle2, AlertCircle, History, ExternalLink, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ParentPaymentPanel() {
    const { toast } = useToast();
    const t = useTranslations('ParentPayment');

    const MOCK_INVOICES = [
        { id: 'inv-101', month: t('sep2026'), amount: 800, status: 'PAID', date: '2026-09-01' },
        { id: 'inv-102', month: t('oct2026'), amount: 800, status: 'PAID', date: '2026-10-01' },
        { id: 'inv-103', month: t('nov2026'), amount: 850, status: 'PENDING', date: '2026-11-01', note: t('winterConcert') }
    ];

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
                title: t('redirectSecurePayment'),
                description: t('redirectSecurePaymentDesc')
            });
        }, 1500);
    };

    const handleSetupRecurring = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            toast({
                title: t('setupRecurring'),
                description: t('setupRecurringDesc')
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
                            <CreditCard className="w-5 h-5 text-blue-600" /> {t('billingSummary')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">{t('balanceDue')}</p>
                            <div className="text-4xl font-bold text-blue-900">₪{totalPending}</div>
                            {totalPending > 0 && <p className="text-sm text-red-500 font-medium mt-2">{t('payByTenth')}</p>}
                        </div>

                        <div className="space-y-3">
                            <Button className="w-full text-md h-12" onClick={handlePayNow} disabled={totalPending === 0 || isProcessing}>
                                {isProcessing ? t('processing') : t('proceedToPayment')}
                            </Button>
                            <Button variant="outline" className="w-full text-blue-700 border-blue-200 hover:bg-blue-50" onClick={handleSetupRecurring} disabled={isProcessing}>
                                <ShieldCheck className="w-4 h-4 me-2" />
                                {t('setupAltPayment')}
                            </Button>
                        </div>

                        <div className="bg-muted p-3 flex gap-3 rounded-lg items-start text-xs text-muted-foreground">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>{t('securityNotice')}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Invoices List */}
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-muted-foreground" /> {t('invoiceDetails')}</CardTitle>
                        <CardDescription>{t('viewInvoices')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">

                            {/* Pending */}
                            <div>
                                <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                                    {t('immediatePayment')} <Badge variant="destructive" className="rounded-full px-2 py-0 text-xs">{pendingInvoices.length}</Badge>
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('requestNo')}</TableHead>
                                            <TableHead>{t('month')}</TableHead>
                                            <TableHead>{t('details')}</TableHead>
                                            <TableHead className="text-end">{t('amount')}</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingInvoices.length === 0 ? (
                                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">{t('noOpenInvoices')}</TableCell></TableRow>
                                        ) : (
                                            pendingInvoices.map(inv => (
                                                <TableRow key={inv.id} className="bg-red-50/30">
                                                    <TableCell className="font-medium text-xs text-muted-foreground">{inv.id}</TableCell>
                                                    <TableCell>{inv.month}</TableCell>
                                                    <TableCell className="text-sm text-gray-600">{inv.note || t('conservatoryTuition')}</TableCell>
                                                    <TableCell className="text-end font-bold text-red-600">₪{inv.amount}</TableCell>
                                                    <TableCell className="text-start">
                                                        <Button size="sm" onClick={handlePayNow} className="px-3 rounded-full h-7 text-xs">{t('payBtn')}</Button>
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
                                    <History className="w-4 h-4 text-gray-500" /> {t('paymentHistory')} <span className="text-xs font-normal text-muted-foreground">{t('lastTwo')}</span>
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('receiptNo')}</TableHead>
                                            <TableHead>{t('month')}</TableHead>
                                            <TableHead>{t('status')}</TableHead>
                                            <TableHead className="text-end">{t('amount')}</TableHead>
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
                                                        <CheckCircle2 className="w-3 h-3 me-1" /> {t('paidStatus')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-end font-medium">₪{inv.amount}</TableCell>
                                                <TableCell className="text-start">
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 whitespace-nowrap">
                                                        {t('downloadReceipt')} <ExternalLink className="w-3 h-3 ms-1" />
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
