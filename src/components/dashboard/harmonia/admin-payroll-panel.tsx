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
import { he } from 'date-fns/locale';
import { Check, Send, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const statusTranslations: Record<PayrollStatus, string> = {
    DRAFT: 'טיוטה',
    APPROVED: 'מאושר',
    PAID: 'שולם',
};

const PayrollTable = ({ payrolls }: { payrolls: PayrollSummary[] }) => {
    const { updatePayrollStatus } = useAuth();
    const { toast } = useToast();

    const handleApprove = (id: string, teacherName: string) => {
        updatePayrollStatus(id, 'APPROVED');
        toast({ title: `השכר של ${teacherName} אושר`});
    }
    const handleMarkAsPaid = (id: string, teacherName: string) => {
        updatePayrollStatus(id, 'PAID');
        toast({ title: `השכר של ${teacherName} סומן כ"שולם"`});
    }

    const handleExport = (payroll: PayrollSummary) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        const rtl = (text: string | number) => typeof text === 'string' ? text.split('').reverse().join('') : String(text);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(rtl(`דוח שכר - ${payroll.teacherName}`), pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(rtl(`תקופה: ${format(new Date(payroll.periodStart), 'dd/MM/yyyy')} - ${format(new Date(payroll.periodEnd), 'dd/MM/yyyy')}`), pageWidth - 15, 35, { align: 'right' });
        doc.text(rtl(`סטטוס: ${statusTranslations[payroll.status]}`), pageWidth - 15, 42, { align: 'right' });
        
        const head = [[rtl('סכום'), rtl('תעריף'), rtl('משך (דקות)'), rtl('תלמיד/ה'), rtl('תאריך')]];
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
        doc.text(rtl(`שעות סה"כ: ${payroll.totalHours.toFixed(2)}`), pageWidth - 15, finalY + 15, { align: 'right' });
        doc.text(rtl(`שכר ברוטו: ₪${payroll.grossPay.toLocaleString()}`), pageWidth - 15, finalY + 25, { align: 'right' });

        doc.save(`payroll_${payroll.teacherId}_${payroll.periodStart.slice(0, 7)}.pdf`);
    }

    if (payrolls.length === 0) {
        return <p className="text-center text-muted-foreground p-8">אין דוחות שכר להצגה.</p>
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
                                    {format(new Date(payroll.periodStart), 'MMMM yyyy', { locale: he })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 me-4">
                            <div>
                                <span className="text-sm text-muted-foreground">שעות: </span>
                                <span className="font-bold">{payroll.totalHours.toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">שכר ברוטו: </span>
                                <span className="font-bold text-green-600">₪{payroll.grossPay.toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2">
                                {payroll.status === 'DRAFT' && (
                                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleApprove(payroll.id, payroll.teacherName); }}>
                                        <Check className="ms-2 h-4 w-4" /> אשר
                                    </Button>
                                )}
                                {payroll.status === 'APPROVED' && (
                                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(payroll.id, payroll.teacherName); }}>
                                        <Send className="ms-2 h-4 w-4" /> סמן כשולם
                                    </Button>
                                )}
                                {payroll.status === 'PAID' && (
                                     <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleExport(payroll); }}>
                                        <Download className="ms-2 h-4 w-4" /> יצא
                                     </Button>
                                )}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-muted/20">
                        <div className="p-4">
                            <h4 className="font-semibold mb-2">פירוט שיעורים ({payroll.completedLessons.length})</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>תאריך</TableHead>
                                        <TableHead>תלמיד/ה</TableHead>
                                        <TableHead>משך (דקות)</TableHead>
                                        <TableHead>תעריף</TableHead>
                                        <TableHead className="text-left">סכום</TableHead>
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


export function AdminPayrollPanel() {
    const { mockPayrolls } = useAuth();
    
    const draftPayrolls = useMemo(() => mockPayrolls.filter(p => p.status === 'DRAFT'), [mockPayrolls]);
    const approvedPayrolls = useMemo(() => mockPayrolls.filter(p => p.status === 'APPROVED'), [mockPayrolls]);
    const paidPayrolls = useMemo(() => mockPayrolls.filter(p => p.status === 'PAID'), [mockPayrolls]);

    return (
        <Tabs defaultValue="drafts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="drafts">
                    טיוטות
                    {draftPayrolls.length > 0 && <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">{draftPayrolls.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="approved">
                    ממתין לתשלום
                     {approvedPayrolls.length > 0 && <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-yellow-500 rounded-full">{approvedPayrolls.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="paid">שולם</TabsTrigger>
            </TabsList>
            <Card className="mt-4">
                <TabsContent value="drafts" className="m-0">
                    <CardHeader>
                        <CardTitle>דוחות שכר בטיוטה</CardTitle>
                        <CardDescription>דוחות שכר שנוצרו אוטומטית וממתינים לבדיקה ואישור שלך.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PayrollTable payrolls={draftPayrolls} />
                    </CardContent>
                </TabsContent>
                <TabsContent value="approved" className="m-0">
                    <CardHeader>
                        <CardTitle>דוחות שאושרו</CardTitle>
                        <CardDescription>דוחות אלו אושרו על ידך וממתינים לביצוע התשלום וסימון כ"שולם".</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PayrollTable payrolls={approvedPayrolls} />
                    </CardContent>
                </TabsContent>
                <TabsContent value="paid" className="m-0">
                    <CardHeader>
                        <CardTitle>דוחות ששולמו</CardTitle>
                        <CardDescription>היסטוריית דוחות שכר ששולמו החודש.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PayrollTable payrolls={paidPayrolls} />
                    </CardContent>
                </TabsContent>
            </Card>
        </Tabs>
    );
}
