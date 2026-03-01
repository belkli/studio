
'use client';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { PayrollSummary, PayrollStatus } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';
import { useDateLocale } from '@/hooks/use-date-locale';

export function TeacherPayrollView() {
    const { user, mockPayrolls } = useAuth();
    const t = useTranslations('TeacherPayroll');
    const locale = useLocale();
    const dateLocale = useDateLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const statusConfig: Record<PayrollStatus, { label: string; className: string }> = {
        DRAFT: { label: t('statusDraft'), className: 'bg-yellow-100 text-yellow-800' },
        APPROVED: { label: t('statusApproved'), className: 'bg-blue-100 text-blue-800' },
        PAID: { label: t('statusPaid'), className: 'bg-green-100 text-green-800' },
    };

    const teacherPayrolls = useMemo(() => {
        if (!user) return [];
        return mockPayrolls
            .filter(p => p.teacherId === user.id)
            .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
    }, [mockPayrolls, user]);

    const handleExport = (payroll: PayrollSummary) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        const rtl = (text: string | number) => {
            if (typeof text !== 'string') return String(text);
            return isRtl ? text.split('').reverse().join('') : text;
        };

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(rtl(t('payrollReportTitle', { teacherName: payroll.teacherName })), pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        const periodStr = t('periodLabel', {
            start: format(new Date(payroll.periodStart), 'dd/MM/yyyy'),
            end: format(new Date(payroll.periodEnd), 'dd/MM/yyyy')
        });
        const statusStr = t('statusLabel', { status: statusConfig[payroll.status].label });

        doc.text(rtl(periodStr), isRtl ? pageWidth - 15 : 15, 35, { align: isRtl ? 'right' : 'left' });
        doc.text(rtl(statusStr), isRtl ? pageWidth - 15 : 15, 42, { align: isRtl ? 'right' : 'left' });

        const head = isRtl
            ? [[rtl(t('amountCol')), rtl(t('rateCol')), rtl(t('durationCol')), rtl(t('studentCol')), rtl(t('dateCol'))]]
            : [[t('dateCol'), t('studentCol'), t('durationCol'), t('rateCol'), t('amountCol')]];

        const body = payroll.completedLessons.map(lesson => {
            const row = [
                format(new Date(lesson.completedAt), 'dd/MM/yyyy'),
                lesson.studentName,
                lesson.durationMinutes,
                `${t('currencySymbol')}${lesson.rate}`,
                `${t('currencySymbol')}${lesson.subtotal.toFixed(2)}`
            ];
            if (isRtl) {
                return [rtl(row[4]), rtl(row[3]), rtl(row[2]), rtl(row[1]), rtl(row[0])];
            }
            return row;
        });

        (doc as any).autoTable({
            startY: 55,
            head: head,
            body: body,
            styles: {
                halign: isRtl ? 'right' : 'left',
                font: 'helvetica',
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
            },
        });

        const finalY = (doc as any).lastAutoTable.finalY;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');

        const totalHoursStr = t('totalHoursLabel', { hours: payroll.totalHours.toFixed(2) });
        const grossPayStr = t('grossPayLabel', { amount: payroll.grossPay.toLocaleString() });

        doc.text(rtl(totalHoursStr), isRtl ? pageWidth - 15 : 15, finalY + 15, { align: isRtl ? 'right' : 'left' });
        doc.text(rtl(grossPayStr), isRtl ? pageWidth - 15 : 15, finalY + 25, { align: isRtl ? 'right' : 'left' });

        doc.save(`payroll_${payroll.teacherId}_${payroll.periodStart.slice(0, 7)}.pdf`);
    }

    if (teacherPayrolls.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('noPayrollDataTitle')}</CardTitle>
                    <CardDescription>{t('noPayrollDataDesc')}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Accordion type="single" collapsible className="w-full" defaultValue={teacherPayrolls[0]?.id}>
            {teacherPayrolls.map((payroll) => (
                <AccordionItem value={payroll.id} key={payroll.id}>
                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md text-lg">
                        <div className={isRtl ? "flex items-center gap-4 flex-1 text-right" : "flex items-center gap-4 flex-1 text-left"}>
                            <div className={isRtl ? "text-right" : "text-left"}>
                                <p className="font-semibold">
                                    {t('payslipForMonth', { month: format(new Date(payroll.periodStart), 'MMMM yyyy', { locale: dateLocale }) })}
                                </p>
                                <Badge variant="outline" className={statusConfig[payroll.status].className}>
                                    {statusConfig[payroll.status].label}
                                </Badge>
                            </div>
                        </div>
                        <div className={`text-xl font-bold text-green-600 ${isRtl ? 'me-4' : 'ms-4'}`}>
                            {t('currencySymbol')}{payroll.grossPay.toLocaleString()}
                        </div>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleExport(payroll); }} className={isRtl ? 'me-4' : 'ms-4'}>
                            <Download className={`${isRtl ? 'ms-2' : 'me-2'} h-4 w-4`} /> {t('exportPdfBtn')}
                        </Button>
                    </AccordionTrigger>
                    <AccordionContent className="bg-muted/20">
                        <div className="p-4">
                            <h4 className="font-semibold mb-2">{t('lessonDetailsTitle', { count: payroll.completedLessons.length })}</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('dateCol')}</TableHead>
                                        <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('studentCol')}</TableHead>
                                        <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('durationCol')}</TableHead>
                                        <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('rateCol')}</TableHead>
                                        <TableHead className={isRtl ? 'text-left' : 'text-right'}>{t('amountCol')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payroll.completedLessons.map(lesson => (
                                        <TableRow key={lesson.slotId}>
                                            <TableCell className={isRtl ? 'text-right' : 'text-left'}>{format(new Date(lesson.completedAt), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className={isRtl ? 'text-right' : 'text-left'}>{lesson.studentName}</TableCell>
                                            <TableCell className={isRtl ? 'text-right' : 'text-left'}>{lesson.durationMinutes}</TableCell>
                                            <TableCell className={isRtl ? 'text-right' : 'text-left'}>{t('currencySymbol')}{lesson.rate}</TableCell>
                                            <TableCell className={`${isRtl ? 'text-left' : 'text-right'} font-medium`}>{t('currencySymbol')}{lesson.subtotal.toFixed(2)}</TableCell>
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
