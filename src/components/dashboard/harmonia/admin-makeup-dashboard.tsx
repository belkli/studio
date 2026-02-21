'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/lib/types';
import { addDays, differenceInDays, isBefore } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, CalendarPlus, Coins } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';

interface StudentMakeupBalance {
    student: User;
    balance: number;
    earliestCreditDate: Date;
    teacherName?: string;
}

const MAKEUP_EXPIRY_DAYS = 60;
const EXPIRING_SOON_DAYS = 7;

export function AdminMakeupDashboard() {
    const { users, mockLessons } = useAuth();
    
    const makeupBalances = useMemo(() => {
        const studentUsers = users.filter(u => u.role === 'student' && u.approved);
        const balances: StudentMakeupBalance[] = [];

        studentUsers.forEach(student => {
            const grantedLessons = mockLessons.filter(l => 
                l.studentId === student.id && 
                (l.status === 'CANCELLED_TEACHER' || l.status === 'CANCELLED_CONSERVATORIUM' || l.status === 'CANCELLED_STUDENT_NOTICED')
            ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            const usedCredits = mockLessons.filter(l => 
                l.studentId === student.id && 
                l.type === 'MAKEUP'
            ).length;

            const balance = grantedLessons.length - usedCredits;

            if (balance > 0) {
                const earliestCreditLesson = grantedLessons[usedCredits]; // The first unused credit
                const teacher = users.find(u => u.id === earliestCreditLesson?.teacherId);

                balances.push({
                    student,
                    balance,
                    earliestCreditDate: new Date(earliestCreditLesson.createdAt),
                    teacherName: teacher?.name,
                });
            }
        });
        return balances;
    }, [users, mockLessons]);

    const expiringSoonBalances = useMemo(() => {
        const now = new Date();
        return makeupBalances.filter(item => {
            const expiryDate = addDays(item.earliestCreditDate, MAKEUP_EXPIRY_DAYS);
            return isBefore(expiryDate, addDays(now, EXPIRING_SOON_DAYS));
        });
    }, [makeupBalances]);


    const MakeupTable = ({ balancesToShow }: { balancesToShow: StudentMakeupBalance[] }) => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>תלמיד/ה</TableHead>
                    <TableHead>מורה</TableHead>
                    <TableHead>יתרת זיכויים</TableHead>
                    <TableHead>תוקף הזיכוי הקרוב</TableHead>
                    <TableHead className="text-left">פעולות</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {balancesToShow.length > 0 ? balancesToShow.map(item => {
                    const expiryDate = addDays(item.earliestCreditDate, MAKEUP_EXPIRY_DAYS);
                    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
                    const isExpiringSoon = daysUntilExpiry <= EXPIRING_SOON_DAYS;

                    return (
                        <TableRow key={item.student.id}>
                            <TableCell className="font-medium flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={item.student.avatarUrl} />
                                    <AvatarFallback>{item.student.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {item.student.name}
                            </TableCell>
                            <TableCell>{item.teacherName || 'לא משויך'}</TableCell>
                            <TableCell className="text-center font-semibold">{item.balance}</TableCell>
                            <TableCell>
                                <Badge variant={isExpiringSoon ? 'destructive' : 'secondary'}>
                                    פג בעוד {daysUntilExpiry} ימים
                                </Badge>
                            </TableCell>
                             <TableCell className="text-left">
                                <Button variant="outline" size="sm" disabled>
                                    <CalendarPlus className="ms-2 h-4 w-4" />
                                    קבע שיעור השלמה
                                </Button>
                                 <Button variant="ghost" size="sm" disabled className="me-2">
                                    <Clock className="ms-2 h-4 w-4" />
                                    הארך תוקף
                                </Button>
                            </TableCell>
                        </TableRow>
                    )
                }) : (
                     <TableRow>
                        <TableCell colSpan={5} className="p-0">
                           <EmptyState
                                icon={Coins}
                                title="אין יתרות להצגה"
                                description="נראה שכל התלמידים מנצלים את שיעורי ההשלמה שלהם בזמן."
                           />
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">כלל היתרות</TabsTrigger>
                <TabsTrigger value="expiring">
                    פג תוקף בקרוב
                    {expiringSoonBalances.length > 0 && <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-destructive rounded-full">{expiringSoonBalances.length}</span>}
                </TabsTrigger>
            </TabsList>
            <Card className="mt-4">
                 <TabsContent value="all" className="m-0">
                    <CardHeader>
                        <CardTitle>כלל יתרות שיעורי ההשלמה</CardTitle>
                        <CardDescription>רשימת כל התלמידים עם זיכויים לשיעורי השלמה.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MakeupTable balancesToShow={makeupBalances} />
                    </CardContent>
                 </TabsContent>
                 <TabsContent value="expiring" className="m-0">
                    <CardHeader>
                        <CardTitle>זיכויים שפג תוקפם בקרוב</CardTitle>
                        <CardDescription>זיכויים שיפוג תוקפם ב-{EXPIRING_SOON_DAYS} הימים הקרובים.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MakeupTable balancesToShow={expiringSoonBalances} />
                    </CardContent>
                 </TabsContent>
            </Card>
        </Tabs>
    );
}
