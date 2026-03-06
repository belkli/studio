'use client';
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

const AdminReportsDashboard = dynamic(
    () => import("@/components/dashboard/harmonia/admin-reports-dashboard").then(mod => ({ default: mod.AdminReportsDashboard })),
    { loading: () => <Skeleton className="h-[600px] w-full" /> }
);

export default function ReportsPage() {
    const { user } = useAuth();
    const t = useTranslations('Sidebar');
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
             <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('reportsAnalytics')}</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('reportsAnalytics')}</h1>
                <p className="text-muted-foreground">נתח את ביצועי הקונסרבטוריון וקבל תובנות עסקיות.</p>
            </div>
            <AdminReportsDashboard />
        </div>
    );
}
