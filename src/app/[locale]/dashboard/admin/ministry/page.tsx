'use client';

import { MinistryInboxPanel } from "@/components/dashboard/harmonia/ministry-inbox-panel";
import { useAdminGuard } from '@/hooks/use-admin-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from "next-intl";

export default function MinistryDashboardPage() {
    const { user, isLoading } = useAdminGuard();
    const t = useTranslations('AdminPages.ministry');

    if (isLoading || !user) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-5 w-96 mt-2" />
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>

            <MinistryInboxPanel />
        </div>
    );
}
