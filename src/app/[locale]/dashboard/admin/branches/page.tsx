
'use client';

import { AdminBranchesDashboard } from "@/components/dashboard/harmonia/admin-branches-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

export default function AdminBranchesPage() {
    const { user } = useAuth();
    const t = useTranslations('Sidebar');
    const tAdmin = useTranslations('AdminPages.branches');
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('branches')}</h1>
                    <p className="text-muted-foreground">{tAdmin('noPermission')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('branches')}</h1>
                <p className="text-muted-foreground">{tAdmin('subtitle')}</p>
            </div>
            <AdminBranchesDashboard />
        </div>
    );
}
