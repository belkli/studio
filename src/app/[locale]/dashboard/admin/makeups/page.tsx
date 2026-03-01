
'use client';

import { AdminMakeupDashboard } from "@/components/dashboard/harmonia/admin-makeup-dashboard";
import { useAdminGuard } from '@/hooks/use-admin-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from "next-intl";

export default function AdminMakeupsPage() {
    const { user, isLoading } = useAdminGuard();
    const t = useTranslations('Sidebar');
    const tAdmin = useTranslations('AdminPages.makeups');

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
                <h1 className="text-2xl font-bold">{t('adminMakeups')}</h1>
                <p className="text-muted-foreground">{tAdmin('subtitle')}</p>
            </div>
            <AdminMakeupDashboard />
        </div>
    );
}
