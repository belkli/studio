'use client';

import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

const AdminFinancialDashboard = dynamic(
    () => import("@/components/dashboard/harmonia/admin-finance-dashboard").then(mod => ({ default: mod.AdminFinancialDashboard })),
    { loading: () => <Skeleton className="h-[600px] w-full" /> }
);

const StudentBillingDashboard = dynamic(
    () => import("@/components/dashboard/harmonia/student-billing-dashboard").then(mod => ({ default: mod.StudentBillingDashboard })),
    { loading: () => <Skeleton className="h-[600px] w-full" /> }
);

export default function BillingPage() {
    const { user, isLoading } = useAuth();
    const t = useTranslations('BillingPage');

    if (isLoading || !user) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    const isAdmin = user.role === 'conservatorium_admin' || user.role === 'site_admin';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">
                    {isAdmin ? t('adminTitle') : t('studentTitle')}
                </h1>
                <p className="text-muted-foreground">
                    {isAdmin ? t('adminSubtitle') : t('studentSubtitle')}
                </p>
            </div>

            {isAdmin ? <AdminFinancialDashboard /> : <StudentBillingDashboard />}
        </div>
    )
}
