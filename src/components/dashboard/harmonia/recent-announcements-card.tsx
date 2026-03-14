
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Megaphone, Mail, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import type { Channel } from '@/lib/types';
import { useTranslations, useLocale } from 'next-intl';

export function RecentAnnouncementsCard() {
    const { announcements, user } = useAuth();
    const dateLocale = useDateLocale();
    const t = useTranslations('RecentAnnouncementsCard');
    const tComposer = useTranslations('AnnouncementComposer');
    const locale = useLocale();

    const relevantAnnouncements = announcements
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
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {relevantAnnouncements.length > 0 ? relevantAnnouncements.map(ann => {
                    const localizedTitle = (locale !== 'he' && ann.translations?.[locale as 'en' | 'ar' | 'ru']?.title)
                        ? ann.translations[locale as 'en' | 'ar' | 'ru']!.title
                        : ann.title;
                    const localizedBody = (locale !== 'he' && ann.translations?.[locale as 'en' | 'ar' | 'ru']?.body)
                        ? ann.translations[locale as 'en' | 'ar' | 'ru']!.body
                        : ann.body;
                    return (
                        <div key={ann.id} className="p-3 rounded-lg bg-muted/50">
                            <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-sm flex items-center gap-1.5" dir="auto">
                                    {localizedTitle}
                                    {ann.translatedByAI && locale !== 'he' && (
                                        <span
                                            className="text-xs font-normal text-muted-foreground bg-muted px-1 rounded cursor-help"
                                            title={tComposer('aiTranslatedBadge')}
                                        >
                                            (AI)
                                        </span>
                                    )}
                                </h4>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(ann.sentAt), { addSuffix: true, locale: dateLocale })}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2" dir="auto">{localizedBody}</p>
                            <div className="flex items-center gap-2 mt-2">
                                {ann.channels.map(channel => (
                                    <Badge key={channel} variant="secondary" className="text-xs">
                                        {getChannelIcon(channel)}
                                        <span className="ms-1">{channel}</span>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    );
                }) : (
                    <p className="text-sm text-center text-muted-foreground pt-8">{t('empty')}</p>
                )}
            </CardContent>
        </Card>
    );
}
