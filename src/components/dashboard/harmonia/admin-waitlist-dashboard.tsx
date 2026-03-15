import { useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { WaitlistEntry, WaitlistStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { Send, Trash2, ListChecks, Undo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState } from '@/components/ui/empty-state';
import { useTranslations } from 'next-intl';



const statusClasses: Record<WaitlistStatus, string> = {
    WAITING: 'bg-blue-100 text-blue-800',
    OFFERED: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    ENROLLED: 'bg-green-200 text-green-900',
    DECLINED: 'bg-gray-100 text-gray-800',
    DEFERRED: 'bg-orange-100 text-orange-800',
    EXPIRED: 'bg-red-100 text-red-800',
    WITHDRAWN: 'bg-gray-200 text-gray-600',
};

export function AdminWaitlistDashboard() {
    const t = useTranslations('Waitlist');
    const tCommon = useTranslations('Common');
    const dateLocale = useDateLocale();

    const { user, waitlist: waitlistEntries, updateWaitlistStatus, offerSlotToWaitlisted, expireWaitlistOffers, revokeWaitlistOffer, users } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        expireWaitlistOffers();
        const interval = setInterval(expireWaitlistOffers, 60000);
        return () => clearInterval(interval);
    }, [expireWaitlistOffers]);

    const visibleWaitlist = useMemo(() => {
        if (!user) return [];
        return waitlistEntries.map(entry => {
            const student = users.find(u => u.id === entry.studentId);
            const teacher = users.find(u => u.id === entry.teacherId);
            return {
                ...entry,
                studentName: student?.name || t('unknown'),
                teacherName: teacher?.name || t('unknown'),
            }
        }).filter(entry => entry.status === 'WAITING' || entry.status === 'OFFERED')
            .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
    }, [user, waitlistEntries, users, t]);

    const handleOffer = (entry: WaitlistEntry & { studentName: string }, studentName: string) => {
        const day = entry.preferredDays?.[0] ?? 'SUN';
        const time = entry.preferredTimes?.[0];
        const slotLabel = time ? `${day} ${time}` : day;
        offerSlotToWaitlisted(entry.id, `slot-${entry.id}-offer`, slotLabel);
        toast({
            title: t('offerSent'),
            description: t('offerSentDesc', { name: studentName }),
        });
    }

    const handleRemove = (entryId: string) => {
        updateWaitlistStatus(entryId, 'DECLINED'); // Or a new "REMOVED" status
        toast({
            variant: "destructive",
            title: t('removed'),
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-start">{t('student')}</TableHead>
                            <TableHead className="text-start">{t('requestedTeacher')}</TableHead>
                            <TableHead className="text-start">{t('instrument')}</TableHead>
                            <TableHead className="text-start">{t('joinedDate')}</TableHead>
                            <TableHead className="text-start">{t('status')}</TableHead>
                            <TableHead className="text-start">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleWaitlist.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="p-0">
                                    <EmptyState
                                        icon={ListChecks}
                                        title={t('emptyTitle')}
                                        description={t('emptyDesc')}
                                        className="py-12"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleWaitlist.map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium">{entry.studentName}</TableCell>
                                    <TableCell>{entry.teacherName}</TableCell>
                                    <TableCell>{entry.instrument}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{format(new Date(entry.joinedAt), 'dd/MM/yyyy')}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({formatDistanceToNow(new Date(entry.joinedAt), { locale: dateLocale, addSuffix: true })})
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusClasses[entry.status]}>
                                            {t(`statuses.${entry.status}`)}
                                        </Badge>
                                        {entry.status === 'OFFERED' && (
                                            <>
                                                {entry.offeredSlotTime && (
                                                    <div className="text-xs text-muted-foreground mt-1">{entry.offeredSlotTime}</div>
                                                )}
                                                {entry.offerExpiresAt && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {t('offerExpiresIn', { time: formatDistanceToNow(new Date(entry.offerExpiresAt)) })}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-start">
                                        <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={entry.status === 'OFFERED'}
                                            onClick={() => handleOffer(entry, entry.studentName)}
                                        >
                                            <Send className="me-1 h-3 w-3" />
                                            {t('sendOffer')}
                                        </Button>
                                        {entry.status === 'OFFERED' && (
                                            <Button variant="ghost" size="sm" onClick={() => { revokeWaitlistOffer(entry.id); toast({ title: t('offerRevoked') }); }}>
                                                <Undo className="me-1 h-3 w-3" />
                                                {t('revokeOffer')}
                                            </Button>
                                        )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="me-1 h-3 w-3" />
                                                    {t('remove')}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t('removeTitle')}</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {t('removeConfirm', { name: entry.studentName })}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRemove(entry.id)} className="bg-destructive hover:bg-destructive/90">
                                                        {t('confirmRemove')}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
