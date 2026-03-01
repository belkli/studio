'use client';

import { AdminPayrollPanel } from "@/components/dashboard/harmonia/admin-payroll-panel";
import { useTranslations } from "next-intl";


import { useAdminGuard } from "@/hooks/use-admin-guard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPayrollPage() {
    const { user, isLoading } = useAdminGuard();
    const tAdmin = useTranslations('AdminPages.payroll');

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
                <h1 className="text-2xl font-bold">{tAdmin('header')}</h1>
                <p className="text-muted-foreground">{tAdmin('subtitle')}</p>
            </div>
            <AdminPayrollPanel />
        </div>
    );
}
