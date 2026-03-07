'use client';

import { ParentNotificationPanel } from "@/components/dashboard/harmonia/parent-notification-panel";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations, useLocale } from "next-intl";

export default function ParentSettingsPage() {
    const { user } = useAuth();
    const t = useTranslations('DashboardPages');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    if (user?.role !== 'parent') {
        return <p>{t('noPermission')}</p>;
    }

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold">{t('parentSettings.title')}</h1>
                <p className="text-muted-foreground">{t('parentSettings.description')}</p>
            </div>

            <ParentNotificationPanel />
        </div>
    );
}
