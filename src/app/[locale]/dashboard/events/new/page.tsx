'use client';

import { EventForm } from "@/components/dashboard/harmonia/event-form";
import { useAuth } from "@/hooks/use-auth";
import { useLocale, useTranslations } from "next-intl";

export default function NewEventPage() {
    const { user } = useAuth();
    const t = useTranslations('DashboardPages');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return <p>{t('noPermission')}</p>
    }

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold">{t('newEvent.title')}</h1>
                <p className="text-muted-foreground">{t('newEvent.description')}</p>
            </div>
            <EventForm />
        </div>
    );
}
