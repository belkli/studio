
'use client';

import { AdminBranchesDashboard } from "@/components/dashboard/harmonia/admin-branches-dashboard";
import { useTranslations, useLocale } from "next-intl";


import { useAdminGuard } from "@/hooks/use-admin-guard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBranchesPage() {
    const { user, isLoading } = useAdminGuard();
    const t = useTranslations('Sidebar');
    const tAdmin = useTranslations('AdminPages.branches');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    if (isLoading || !user) {
        return (
            <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold text-start">{t('branches')}</h1>
                <p className="text-muted-foreground text-start">{tAdmin('subtitle')}</p>
            </div>
            <AdminBranchesDashboard />
        </div>
    );
}
