'use client';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { PayrollSummary, PayrollStatus } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<PayrollStatus, { label: string; className: string }> = {
    DRAFT: { label: 'בבדיקה', className: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { label: 'אושר, ממתין לתשלום', className: 'bg-blue-100 text-blue-800' },
    PAID: { label: 'שולם', className: 'bg-green-100 text-green-800' },
};

export function TeacherPayrollView() {
    const { user, mockPayrolls } = useAuth();
    
    const teacherPayrolls = useMemo(() => {
        if (!user) return [];
        return mockPayrolls
            .filter(p => p.teacherId === user.id)
            .sort((a,b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
    }, [mockPayrolls, user]);

    if (teacherPayrolls.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>אין נתוני שכר</CardTitle>
                    <CardDescription>לא נוצרו עדיין דוחות שכר עבורך החודש.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Accordion type="single" collapsible className="w-full" defaultValue={teacherPayrolls[0]?.id}>
            {teacherPayrolls.map((payroll) => (
                <AccordionItem value={payroll.id} key={payroll.id}>
                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md text-lg">
                        <div className="flex items-center gap-4 flex-1 text-right">
                           <div className="text-right">
                                <p className="font-semibold">
                                    תלוש עבור חודש {format(new Date(payroll.periodStart), 'MMMM yyyy', { locale: he })}
                                </p>
                                <Badge variant="outline" className={statusConfig[payroll.status].className}>
                                    {statusConfig[payroll.status].label}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-xl font-bold text-green-600 me-4">
                           ₪{payroll.grossPay.toLocaleString()}
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
