'use client';

import { OpenDayAdminDashboard } from '@/components/dashboard/harmonia/open-day-admin-dashboard';
import { useTranslations } from 'next-intl';


import { useAdminGuard } from '@/hooks/use-admin-guard';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOpenDayPage() {
    const { user, isLoading } = useAdminGuard();
    const t = useTranslations('Sidebar');
    const tAdmin = useTranslations('AdminPages.openDay');

    if (isLoading || !user) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('manageOpenDay')}</h1>
                <p className="text-muted-foreground">{tAdmin('subtitle')}</p>
            </div>
            <OpenDayAdminDashboard />
        </div>
    );
}
