
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Megaphone, Mail, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { Channel } from '@/lib/types';

export function RecentAnnouncementsCard() {
    const { mockAnnouncements, user } = useAuth();

    const relevantAnnouncements = mockAnnouncements
        .filter(ann => ann.conservatoriumId === user?.conservatoriumId)
        .slice(0, 3);

    const getChannelIcon = (channel: Channel) => {
        switch (channel) {
            case 'EMAIL': return <Mail className="h-3 w-3" />;
            case 'SMS': return <MessageSquare className="h-3 w-3" />;
            default: return <Megaphone className="h-3 w-3" />;
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>הכרזות אחרונות</CardTitle>
                <CardDescription>עדכונים חשובים מהקונסרבטוריון.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {relevantAnnouncements.length > 0 ? relevantAnnouncements.map(ann => (
                    <div key={ann.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm">{ann.title}</h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(ann.sentAt), { addSuffix: true, locale: he })}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.body}</p>
                        <div className="flex items-center gap-2 mt-2">
                            {ann.channels.map(channel => (
                                <Badge key={channel} variant="secondary" className="text-xs">
                                    {getChannelIcon(channel)}
                                    <span className="ms-1">{channel}</span>
                                </Badge>
                            ))}
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-center text-muted-foreground pt-8">אין הכרזות אחרונות.</p>
                )}
            </CardContent>
        </Card>
    );
}
