'use client';

import { Button } from "@/components/ui/button";
import { NotificationPreferences } from "@/components/dashboard/harmonia/notification-preferences";
import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from 'next-intl';

export default function NotificationSettingsPage() {
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const t = useTranslations('SettingsPage');
    const tN = useTranslations('NotificationPreferences');
    const BackIcon = isRtl ? ChevronRight : ChevronLeft;

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <Button variant="ghost" size="sm" className="gap-1 -ms-2 h-7 text-muted-foreground" asChild>
                        <Link href="/dashboard/settings">
                            <BackIcon className="h-4 w-4" />
                            {t('title')}
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">{tN('title')}</h1>
                    <p className="text-muted-foreground">{tN('subtitle')}</p>
                </div>
            </div>
            <NotificationPreferences />
        </div>
    );
}
