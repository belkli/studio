'use client';
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations, useLocale } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

const AdminReportsDashboard = dynamic(
    () => import("@/components/dashboard/harmonia/admin-reports-dashboard").then(mod => ({ default: mod.AdminReportsDashboard })),
    { loading: () => <Skeleton className="h-[600px] w-full" /> }
);

export default function ReportsPage() {
    const { user } = useAuth();
    const t = useTranslations('Sidebar');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
             <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <div>
                    <h1 className="text-2xl font-bold">{t('reportsAnalytics')}</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold">{t('reportsAnalytics')}</h1>
            </div>
            <AdminReportsDashboard />
        </div>
    );
}
