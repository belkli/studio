
'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { AuditLogEntry, Channel } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Mail, MessageSquare, Bell, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const channelConfig: Record<Channel, { icon: React.ElementType, label: string }> = {
    IN_APP: { icon: Bell, label: 'מערכת' },
    EMAIL: { icon: Mail, label: 'אימייל' },
    SMS: { icon: MessageSquare, label: 'SMS' },
    WHATSAPP: { icon: MessageSquare, label: 'וואטסאפ' },
};

const statusConfig: Record<AuditLogEntry['status'], { icon: React.ElementType, label: string, className: string }> = {
    SENT: { icon: CheckCircle, label: 'נשלח', className: 'text-yellow-600' },
    DELIVERED: { icon: CheckCircle, label: 'הגיע ליעד', className: 'text-green-600' },
    FAILED: { icon: XCircle, label: 'נכשל', className: 'text-red-600' },
    OPTED_OUT: { icon: Bell, label: 'המשתמש ביטל', className: 'text-gray-500' },
};

export function NotificationAuditLog() {
    const { mockAuditLog, users } = useAuth();

    const auditLogWithUsers = useMemo(() => {
        return mockAuditLog.map(log => ({
            ...log,
            user: users.find(u => u.id === log.userId)
        })).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    }, [mockAuditLog, users]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>יומן התראות יוצאות</CardTitle>
                <CardDescription>
                    רשימת כל ההתראות שנשלחו מהמערכת. הסטטוסים מדומים.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>משתמש</TableHead>
                            <TableHead>ערוץ</TableHead>
                            <TableHead>כותרת</TableHead>
                            <TableHead>סטטוס</TableHead>
                            <TableHead>זמן</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {auditLogWithUsers.map(log => {
                            const ChannelIcon = channelConfig[log.channel]?.icon;
                            const StatusIcon = statusConfig[log.status]?.icon;
                            return (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{log.user?.name || 'לא ידוע'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                                            {ChannelIcon && <ChannelIcon className="h-3.5 w-3.5" />}
                                            {channelConfig[log.channel]?.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{log.title}</TableCell>
                                    <TableCell>
                                        <div className={cn("flex items-center gap-1.5", statusConfig[log.status]?.className)}>
                                            {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
                                            {statusConfig[log.status]?.label}
                                        </div>
                                    </TableCell>
                                    <TableCell>{format(new Date(log.sentAt), "dd/MM/yy HH:mm:ss", { locale: he })}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
