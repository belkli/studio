'use client';

import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations, useLocale } from "next-intl";

const MasterScheduleCalendar = dynamic(
    () => import("@/components/dashboard/harmonia/master-schedule-calendar").then(mod => ({ default: mod.MasterScheduleCalendar })),
    { loading: () => <Skeleton className="h-[600px] w-full" /> }
);

export default function MasterSchedulePage() {
    const { user } = useAuth();
    const t = useTranslations('DashboardPages');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <div>
                    <h1 className="text-2xl font-bold">{t('masterSchedule.title')}</h1>
                    <p className="text-muted-foreground">{t('masterSchedule.noPermissionDesc')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold">{t('masterSchedule.title')}</h1>
                <p className="text-muted-foreground">{t('masterSchedule.description')}</p>
            </div>
            <MasterScheduleCalendar />
        </div>
    );
}
