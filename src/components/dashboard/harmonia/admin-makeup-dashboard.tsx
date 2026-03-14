'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/lib/types';
import { addDays, differenceInDays, format, isBefore } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, CalendarPlus, Coins } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useTranslations, useLocale } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { extendMakeupWindowAction } from '@/app/actions/makeup';
import { tenantFilter, tenantUsers } from '@/lib/tenant-filter';

interface StudentMakeupBalance {
    student: User;
    balance: number;
    earliestCreditDate: Date;
    teacherName?: string;
    creditId?: string;
    teacherId?: string;
}

const MAKEUP_EXPIRY_DAYS = 60;
const EXPIRING_SOON_DAYS = 7;

interface MakeupTableProps {
    balancesToShow: StudentMakeupBalance[];
    isRtl: boolean;
    t: ReturnType<typeof useTranslations>;
    onSchedule: (item: StudentMakeupBalance) => void;
    onExtend: (item: StudentMakeupBalance) => void;
}

function MakeupTable({ balancesToShow, isRtl, t, onSchedule, onExtend }: MakeupTableProps) {
    return (
        <Table dir={isRtl ? 'rtl' : 'ltr'}>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-start">{t('colStudent')}</TableHead>
                    <TableHead className="text-start">{t('colTeacher')}</TableHead>
                    <TableHead className="text-center">{t('colBalance')}</TableHead>
                    <TableHead className="text-start">{t('colExpiry')}</TableHead>
                    <TableHead className="text-end">{t('colActions')}</TableHead>
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
                            <TableCell className="text-start">{item.teacherName || t('unassigned')}</TableCell>
                            <TableCell className="text-center font-semibold">{item.balance}</TableCell>
                            <TableCell className="text-start">
                                <Badge variant={isExpiringSoon ? 'destructive' : 'secondary'}>
                                    {t('expiresInDays', { days: daysUntilExpiry })}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-end">
                                <Button variant="outline" size="sm" onClick={() => onSchedule(item)}>
                                    <CalendarPlus className="me-2 h-4 w-4" />
                                    {t('scheduleBtn')}
                                </Button>
                                <Button variant="ghost" size="sm" className="ms-2" onClick={() => onExtend(item)}>
                                    <Clock className="me-2 h-4 w-4" />
                                    {t('extendBtn')}
                                </Button>
                            </TableCell>
                        </TableRow>
                    )
                }) : (
                    <TableRow>
                        <TableCell colSpan={5} className="p-0">
                            <EmptyState
                                icon={Coins}
                                title={t('emptyTitle')}
                                description={t('emptyDesc')}
                            />
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

export function AdminMakeupDashboard() {
    const { user, users, lessons, getMakeupCreditBalance, getMakeupCreditsDetail, addLesson } = useAuth();
    const t = useTranslations('AdminMakeupDashboard');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const { toast } = useToast();

    const [scheduleTarget, setScheduleTarget] = useState<StudentMakeupBalance | null>(null);
    const [extendTarget, setExtendTarget] = useState<StudentMakeupBalance | null>(null);
    const [extendDays, setExtendDays] = useState(14);

    const makeupBalances = useMemo(() => {
        const tenantLessons = user ? tenantFilter(lessons, user) : lessons;
        const studentUsers = user
            ? tenantUsers(users, user, 'student').filter(u => u.approved)
            : users.filter(u => u.role === 'student' && u.approved);
        const balances: StudentMakeupBalance[] = [];

        studentUsers.forEach(student => {
            const studentIds = [student.id];
            const balance = getMakeupCreditBalance(studentIds);

            if (balance > 0) {
                const grantedLessons = tenantLessons.filter(l =>
                    l.studentId === student.id &&
                    (l.status === 'CANCELLED_TEACHER' || l.status === 'CANCELLED_CONSERVATORIUM' || l.status === 'CANCELLED_STUDENT_NOTICED')
                ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                const usedCredits = tenantLessons.filter(l =>
                    l.studentId === student.id &&
                    l.type === 'MAKEUP'
                ).length;

                const earliestCreditLesson = grantedLessons[usedCredits];
                const teacher = users.find(u => u.id === earliestCreditLesson?.teacherId);

                // Fetch credit detail for creditId
                const credits = getMakeupCreditsDetail(studentIds);
                const firstAvailableCredit = credits[usedCredits];

                balances.push({
                    student,
                    balance,
                    earliestCreditDate: new Date(earliestCreditLesson.createdAt),
                    teacherName: teacher?.name,
                    creditId: firstAvailableCredit?.id,
                    teacherId: earliestCreditLesson?.teacherId,
                });
            }
        });
        return balances;
    }, [user, users, lessons, getMakeupCreditBalance, getMakeupCreditsDetail]);

    const expiringSoonBalances = useMemo(() => {
        const now = new Date();
        return makeupBalances.filter(item => {
            const expiryDate = addDays(item.earliestCreditDate, MAKEUP_EXPIRY_DAYS);
            return isBefore(expiryDate, addDays(now, EXPIRING_SOON_DAYS));
        });
    }, [makeupBalances]);


    return (
        <>
            <Tabs defaultValue="all" dir={isRtl ? 'rtl' : 'ltr'}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">{t('tabAll')}</TabsTrigger>
                    <TabsTrigger value="expiring">
                        {t('tabExpiring')}
                        {expiringSoonBalances.length > 0 && <span className={isRtl ? "ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-destructive rounded-full" : "me-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-destructive rounded-full"}>{expiringSoonBalances.length}</span>}
                    </TabsTrigger>
                </TabsList>
                <Card className="mt-4">
                    <TabsContent value="all" className="m-0">
                        <CardHeader>
                            <CardTitle>{t('titleAll')}</CardTitle>
                            <CardDescription>{t('descAll')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MakeupTable balancesToShow={makeupBalances} isRtl={isRtl} t={t} onSchedule={setScheduleTarget} onExtend={setExtendTarget} />
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="expiring" className="m-0">
                        <CardHeader>
                            <CardTitle>{t('titleExpiring')}</CardTitle>
                            <CardDescription>{t('descExpiring', { days: EXPIRING_SOON_DAYS })}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MakeupTable balancesToShow={expiringSoonBalances} isRtl={isRtl} t={t} onSchedule={setScheduleTarget} onExtend={setExtendTarget} />
                        </CardContent>
                    </TabsContent>
                </Card>
            </Tabs>

            {/* Schedule Dialog */}
            <Dialog open={!!scheduleTarget} onOpenChange={(open) => !open && setScheduleTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('scheduleDialogTitle')}</DialogTitle>
                        <DialogDescription>{t('scheduleDialogDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm font-medium">{scheduleTarget?.student.name}</p>
                        <p className="text-sm text-muted-foreground">{scheduleTarget?.teacherName}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setScheduleTarget(null)}>{t('cancel')}</Button>
                        <Button onClick={() => {
                            if (!scheduleTarget) return;
                            addLesson({
                                type: 'MAKEUP',
                                studentId: scheduleTarget.student.id,
                                teacherId: scheduleTarget.teacherId || '',
                                instrument: (scheduleTarget.student.instruments as string[] | undefined)?.[0] || '',
                                bookingSource: 'ADMIN',
                                isVirtual: false,
                                isCreditConsumed: true,
                                makeupCreditId: scheduleTarget.creditId,
                            });
                            toast({ title: t('scheduleSuccess') });
                            setScheduleTarget(null);
                        }}>{t('scheduleConfirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Extend Dialog */}
            <Dialog open={!!extendTarget} onOpenChange={(open) => !open && setExtendTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('extendDialogTitle')}</DialogTitle>
                        <DialogDescription>{t('extendDialogDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm">{t('extendCurrentDeadline')}: {extendTarget ? format(addDays(extendTarget.earliestCreditDate, 60), 'dd/MM/yyyy') : ''}</p>
                        <div>
                            <label className="text-sm font-medium">{t('extendDaysLabel')}</label>
                            <input
                                type="number"
                                className="mt-1 block w-24 rounded border px-2 py-1 text-sm"
                                value={extendDays}
                                min={1}
                                max={90}
                                onChange={e => setExtendDays(Number(e.target.value))}
                            />
                        </div>
                        <p className="text-sm">{t('extendNewDeadline')}: {extendTarget ? format(addDays(extendTarget.earliestCreditDate, 60 + extendDays), 'dd/MM/yyyy') : ''}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExtendTarget(null)}>{t('cancel')}</Button>
                        <Button onClick={async () => {
                            if (!extendTarget?.creditId) return;
                            const newExpiresAt = addDays(extendTarget.earliestCreditDate, 60 + extendDays).toISOString();
                            await extendMakeupWindowAction({ creditId: extendTarget.creditId, newExpiresAt });
                            toast({ title: t('extendSuccess') });
                            setExtendTarget(null);
                        }}>{t('extendConfirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
