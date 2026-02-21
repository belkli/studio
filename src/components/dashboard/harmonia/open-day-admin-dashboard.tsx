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

const statusConfig: Record<OpenDayAppointment['status'], { label: string; icon: React.ElementType; className: string }> = {
    SCHEDULED: { label: 'מתוכנן', icon: Clock, className: 'bg-blue-100 text-blue-800' },
    ATTENDED: { label: 'הגיע/ה', icon: Check, className: 'bg-green-100 text-green-800' },
    NO_SHOW: { label: 'לא הגיע/ה', icon: UserX, className: 'bg-red-100 text-red-800' },
};

export function OpenDayAdminDashboard() {
    const { user, mockOpenDayAppointments } = useAuth();

    const appointments = useMemo(() => {
        if (!user) return [];
        const currentEvent = useAuth().mockOpenDayEvents.find(e => e.conservatoriumId === user.conservatoriumId && e.isActive);
        if (!currentEvent) return [];

        return mockOpenDayAppointments
            .filter(appt => appt.eventId === currentEvent.id)
            .sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime());
    }, [user, mockOpenDayAppointments]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>נרשמים ליום הפתוח</CardTitle>
                <CardDescription>רשימת כל המשפחות שנרשמו לפגישת היכרות.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>שעת פגישה</TableHead>
                            <TableHead>שם משפחה</TableHead>
                            <TableHead>שם הילד/ה</TableHead>
                            <TableHead>כלי עניין</TableHead>
                            <TableHead>פרטי קשר</TableHead>
                            <TableHead>סטטוס</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    טרם נרשמו משפחות.
                                </TableCell>
                            </TableRow>
                        ) : (
                            appointments.map(appt => {
                                const StatusIcon = statusConfig[appt.status].icon;
                                return (
                                <TableRow key={appt.id}>
                                    <TableCell className="font-mono font-semibold">{format(new Date(appt.appointmentTime), 'HH:mm')}</TableCell>
                                    <TableCell className="font-medium">{appt.familyName}</TableCell>
                                    <TableCell>{appt.childName} (גיל {appt.childAge})</TableCell>
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
                            )})
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
