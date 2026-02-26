'use client';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Clock, Check, UserX } from 'lucide-react';
import type { OpenDayAppointment } from '@/lib/types';
import { useTranslations } from 'next-intl';


export function OpenDayAdminDashboard() {
    const { user, mockOpenDayAppointments, mockOpenDayEvents } = useAuth();
    const t = useTranslations('AdminOpenDay');

    const appointments = useMemo(() => {
        if (!user) return [];
        const currentEvent = mockOpenDayEvents.find(e => e.conservatoriumId === user.conservatoriumId && e.isActive);
        if (!currentEvent) return [];

        return mockOpenDayAppointments
            .filter(appt => appt.eventId === currentEvent.id)
            .sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime());
    }, [user, mockOpenDayAppointments, mockOpenDayEvents]);

    const statusConfig: Record<OpenDayAppointment['status'], { label: string; icon: React.ElementType; className: string }> = {
        SCHEDULED: { label: t('statuses.SCHEDULED'), icon: Clock, className: 'bg-blue-100 text-blue-800' },
        ATTENDED: { label: t('statuses.ATTENDED'), icon: Check, className: 'bg-green-100 text-green-800' },
        NO_SHOW: { label: t('statuses.NO_SHOW'), icon: UserX, className: 'bg-red-100 text-red-800' },
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('appointmentTime')}</TableHead>
                            <TableHead>{t('familyName')}</TableHead>
                            <TableHead>{t('childName')}</TableHead>
                            <TableHead>{t('instrumentInterest')}</TableHead>
                            <TableHead>{t('contactDetails')}</TableHead>
                            <TableHead>{t('status')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    {t('noAppointments')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            appointments.map(appt => {
                                const StatusIcon = statusConfig[appt.status].icon;
                                const appointmentDate = new Date(appt.appointmentTime);
                                const isValidDate = !isNaN(appointmentDate.getTime());

                                return (
                                    <TableRow key={appt.id}>
                                        <TableCell className="font-mono font-semibold">
                                            {isValidDate ? format(appointmentDate, 'HH:mm') : '??:??'}
                                        </TableCell>
                                        <TableCell className="font-medium">{appt.familyName}</TableCell>
                                        <TableCell>{appt.childName} ({t('childAge', { age: appt.childAge })})</TableCell>
                                        <TableCell>{appt.instrumentInterest}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{appt.parentPhone}</span>
                                                <span className="text-xs text-muted-foreground">{appt.parentEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={statusConfig[appt.status].className}>
                                                <StatusIcon className="h-3 w-3 me-1.5" />
                                                {statusConfig[appt.status].label}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
