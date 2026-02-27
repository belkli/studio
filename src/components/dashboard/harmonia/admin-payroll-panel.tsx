'use client';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { PayrollSummary, PayrollStatus } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { he, enUS, ru, arSA } from 'date-fns/locale';
import { Check, Send, Download, Banknote, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { EmptyState } from '@/components/ui/empty-state';
import { useTranslations, useLocale } from 'next-intl';

const dateLocales: Record<string, any> = {
    he: he,
    en: enUS,
    ru: ru,
    ar: arSA,
};

/**
 * Renders a table of payroll summaries within an accordion.
 * Each item can be expanded to show a detailed list of completed lessons.
 * Provides actions (Approve, Mark as Paid, Export) based on the payroll status.
 */
const PayrollTable = ({ payrolls }: { payrolls: PayrollSummary[] }) => {
    const t = useTranslations('Payroll');
    const locale = useLocale();
    const dateLocale = dateLocales[locale] || he;
    const { updatePayrollStatus } = useAuth();
    const { toast } = useToast();

    const handleApprove = (id: string, teacherName: string) => {
        updatePayrollStatus(id, 'APPROVED');
        toast({ title: t('teacherApproveSuccess', { name: teacherName }) });
    }
    const handleMarkAsPaid = (id: string, teacherName: string) => {
        updatePayrollStatus(id, 'PAID');
        toast({ title: t('teacherPaidSuccess', { name: teacherName }) });
    }

    /**
     * Generates and downloads a PDF summary for a specific payroll period.
     * @param payroll The payroll summary object.
     */
    const handleExport = (payroll: PayrollSummary) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        const rtl = (text: string | number) => typeof text === 'string' ? text.split('').reverse().join('') : String(text);

        // PDF Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(rtl(`${t('pdf.title')} - ${payroll.teacherName}`), pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(rtl(`${t('pdf.period')}: ${format(new Date(payroll.periodStart), 'dd/MM/yyyy')} - ${format(new Date(payroll.periodEnd), 'dd/MM/yyyy')}`), pageWidth - 15, 35, { align: 'right' });
        doc.text(rtl(`${t('pdf.status')}: ${t(payroll.status.toLowerCase() as any)}`), pageWidth - 15, 42, { align: 'right' });

        // Table of completed lessons
        const head = [[rtl(t('pdf.amount')), rtl(t('pdf.rate')), rtl(t('pdf.duration')), rtl(t('pdf.student')), rtl(t('pdf.date'))]];
        const body = payroll.completedLessons.map(lesson => [
            rtl(`₪${lesson.subtotal.toFixed(2)}`),
            rtl(`₪${lesson.rate}`),
            rtl(lesson.durationMinutes),
            rtl(lesson.studentName),
            rtl(format(new Date(lesson.completedAt), 'dd/MM/yyyy'))
        ]);

        (doc as any).autoTable({
            startY: 55,
            head: head,
            body: body,
            styles: {
                halign: 'right',
                font: 'helvetica', // NOTE: jsPDF default fonts lack Hebrew support. A real app would need to embed a font.
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
            },
        });

        const finalY = (doc as any).lastAutoTable.finalY;

        // Totals
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(rtl(`${t('pdf.totalHours')}: ${payroll.totalHours.toFixed(2)}`), pageWidth - 15, finalY + 15, { align: 'right' });
        doc.text(rtl(`${t('pdf.grossPay')}: ₪${payroll.grossPay.toLocaleString()}`), pageWidth - 15, finalY + 25, { align: 'right' });

        doc.save(`payroll_${payroll.teacherId}_${payroll.periodStart.slice(0, 7)}.pdf`);
    }

    if (payrolls.length === 0) {
        return (
            <EmptyState
                icon={Banknote}
                title={t('emptyTitle')}
                description={t('emptyDesc')}
                className="py-12"
            />
        );
    }

    return (
        <Accordion type="single" collapsible className="w-full">
            {payrolls.map((payroll) => (
                <AccordionItem value={payroll.id} key={payroll.id}>
                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                        <div className="flex items-center gap-4 flex-1">
                            <Avatar>
                                <AvatarImage src={payroll.teacherName} />
                                <AvatarFallback>{payroll.teacherName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-right">
                                <p className="font-semibold">{payroll.teacherName}</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(payroll.periodStart), 'MMMM yyyy', { locale: dateLocale })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 me-4">
                            <div>
                                <span className="text-sm text-muted-foreground">{t('hours')}: </span>
                                <span className="font-bold">{payroll.totalHours.toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">{t('grossPay')}: </span>
                                <span className="font-bold text-green-600">₪{payroll.grossPay.toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2">
                                {payroll.status === 'DRAFT' && (
                                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleApprove(payroll.id, payroll.teacherName); }}>
                                        <Check className="ms-2 h-4 w-4" /> {t('approve')}
                                    </Button>
                                )}
                                {payroll.status === 'APPROVED' && (
                                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(payroll.id, payroll.teacherName); }}>
                                        <Send className="ms-2 h-4 w-4" /> {t('markAsPaid')}
                                    </Button>
                                )}
                                {payroll.status === 'PAID' && (
                                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleExport(payroll); }}>
                                        <Download className="ms-2 h-4 w-4" /> {t('export')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-muted/20">
                        <div className="p-4">
                            <h4 className="font-semibold mb-2">{t('lessonDetails', { count: payroll.completedLessons.length })}</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('pdf.date')}</TableHead>
                                        <TableHead>{t('pdf.student')}</TableHead>
                                        <TableHead>{t('pdf.duration')}</TableHead>
                                        <TableHead>{t('pdf.rate')}</TableHead>
                                        <TableHead className="text-left">{t('pdf.amount')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payroll.completedLessons.map(lesson => (
                                        <TableRow key={lesson.slotId}>
                                            <TableCell>{format(new Date(lesson.completedAt), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{lesson.studentName}</TableCell>
                                            <TableCell>{lesson.durationMinutes}</TableCell>
                                            <TableCell>₪{lesson.rate}</TableCell>
                                            <TableCell className="text-left font-medium">₪{lesson.subtotal.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

/**
 * Main component for the admin payroll panel. It organizes payrolls into a tabbed interface
 * based on their status, allowing for a clear and manageable workflow.
 */
export function AdminPayrollPanel() {
    const t = useTranslations('Payroll');
    const { mockPayrolls } = useAuth();

    const draftPayrolls = useMemo(() => mockPayrolls.filter(p => p.status === 'DRAFT'), [mockPayrolls]);
    const approvedPayrolls = useMemo(() => mockPayrolls.filter(p => p.status === 'APPROVED'), [mockPayrolls]);
    const paidPayrolls = useMemo(() => mockPayrolls.filter(p => p.status === 'PAID'), [mockPayrolls]);

    const { toast } = useToast();

    const handleHilanExport = (payrollsToExport: PayrollSummary[]) => {
        if (payrollsToExport.length === 0) {
            toast({ title: t('noDataExport'), variant: 'destructive' });
            return;
        }

        const headers = [
            t('csv.employeeId'),
            t('csv.employeeName'),
            t('csv.workHours'),
            t('csv.grossPay'),
            t('csv.periodStart'),
            t('csv.periodEnd'),
            t('csv.hilanCode')
        ];
        const rows = payrollsToExport.map(p => [
            p.teacherId, // In reality, this would be the ID number (Tz)
            p.teacherName,
            p.totalHours.toFixed(2),
            p.grossPay.toString(),
            format(new Date(p.periodStart), 'dd/MM/yyyy'),
            format(new Date(p.periodEnd), 'dd/MM/yyyy'),
            '101' // Standard Hilan code for hourly teaching
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(',') + '\n'
            + rows.map(e => e.join(',')).join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `hilan_export_${format(new Date(), 'yyyy_MM')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: t('hilanSuccess') });
    };

    return (
        <Tabs defaultValue="drafts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="drafts">
                    {t('drafts')}
                    {draftPayrolls.length > 0 && <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">{draftPayrolls.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="approved">
                    {t('pendingPayment')}
                    {approvedPayrolls.length > 0 && <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-yellow-500 rounded-full">{approvedPayrolls.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="paid">{t('paid')}</TabsTrigger>
            </TabsList>
            <Card className="mt-4">
                <TabsContent value="drafts" className="m-0">
                    <CardHeader>
                        <CardTitle>{t('draftTitle')}</CardTitle>
                        <CardDescription>{t('draftDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PayrollTable payrolls={draftPayrolls} />
                    </CardContent>
                </TabsContent>
                <TabsContent value="approved" className="m-0">
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle>{t('approvedTitle')}</CardTitle>
                            <CardDescription>{t('approvedDesc')}</CardDescription>
                        </div>
                        {approvedPayrolls.length > 0 && (
                            <Button variant="outline" onClick={() => handleHilanExport(approvedPayrolls)}>
                                <FileSpreadsheet className="me-2 h-4 w-4" /> {t('exportHilan')}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <PayrollTable payrolls={approvedPayrolls} />
                    </CardContent>
                </TabsContent>
                <TabsContent value="paid" className="m-0">
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle>{t('paidTitle')}</CardTitle>
                            <CardDescription>{t('paidDesc')}</CardDescription>
                        </div>
                        {paidPayrolls.length > 0 && (
                            <Button variant="outline" onClick={() => handleHilanExport(paidPayrolls)}>
                                <FileSpreadsheet className="me-2 h-4 w-4" /> {t('exportPast')}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <PayrollTable payrolls={paidPayrolls} />
                    </CardContent>
                </TabsContent>
            </Card>
        </Tabs>
    );
}
