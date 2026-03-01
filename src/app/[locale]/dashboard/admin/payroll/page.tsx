'use client';

import { AdminPayrollPanel } from "@/components/dashboard/harmonia/admin-payroll-panel";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

export default function AdminPayrollPage() {
    const { user } = useAuth();
    const tAdmin = useTranslations('AdminPages.payroll');
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">{tAdmin('title')}</h1>
                    <p className="text-muted-foreground">{tAdmin('noPermission')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{tAdmin('header')}</h1>
                <p className="text-muted-foreground">{tAdmin('subtitle')}</p>
            </div>
            <AdminPayrollPanel />
        </div>
    );
}
