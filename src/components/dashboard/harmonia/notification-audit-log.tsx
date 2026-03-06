
'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { AuditLogEntry, Channel } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { Mail, MessageSquare, Bell, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';

const getChannelConfig = (t: any): Record<Channel, { icon: React.ElementType, label: string }> => ({
    IN_APP: { icon: Bell, label: t('channels.IN_APP') },
    EMAIL: { icon: Mail, label: t('channels.EMAIL') },
    SMS: { icon: MessageSquare, label: t('channels.SMS') },
    WHATSAPP: { icon: MessageSquare, label: t('channels.WHATSAPP') },
});

const getStatusConfig = (t: any): Record<AuditLogEntry['status'], { icon: React.ElementType, label: string, className: string }> => ({
    SENT: { icon: CheckCircle, label: t('statuses.SENT'), className: 'text-yellow-600' },
    DELIVERED: { icon: CheckCircle, label: t('statuses.DELIVERED'), className: 'text-green-600' },
    FAILED: { icon: XCircle, label: t('statuses.FAILED'), className: 'text-red-600' },
    OPTED_OUT: { icon: Bell, label: t('statuses.OPTED_OUT'), className: 'text-gray-500' },
});

export function NotificationAuditLog() {
    const { auditLog, users } = useAuth();
    const t = useTranslations('NotificationAuditLog');
    const locale = useLocale();
    const dateLocale = useDateLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const channelConfig = getChannelConfig(t);
    const statusConfig = getStatusConfig(t);

    const auditLogWithUsers = useMemo(() => {
        return auditLog.map(log => ({
            ...log,
            user: users.find(u => u.id === log.userId)
        })).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    }, [auditLog, users]);

    return (
        <Card dir={isRtl ? 'rtl' : 'ltr'}>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>
                    {t('description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table dir={isRtl ? 'rtl' : 'ltr'}>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-start">{t('table.user')}</TableHead>
                            <TableHead className="text-start">{t('table.channel')}</TableHead>
                            <TableHead className="text-start">{t('table.subject')}</TableHead>
                            <TableHead className="text-start">{t('table.status')}</TableHead>
                            <TableHead className="text-start">{t('table.time')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {auditLogWithUsers.map(log => {
                            const ChannelIcon = channelConfig[log.channel]?.icon;
                            const StatusIcon = statusConfig[log.status]?.icon;
                            return (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{log.user?.name || t('unknownUser')}</TableCell>
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
                                    <TableCell>{format(new Date(log.sentAt), "dd/MM/yy HH:mm:ss", { locale: dateLocale })}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
