'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from "next-intl";

import { useAdminGuard } from "@/hooks/use-admin-guard";
import { Skeleton } from "@/components/ui/skeleton";

const InstrumentRentalDashboard = dynamic(
    () => import("@/components/dashboard/harmonia/instrument-rental-dashboard").then(mod => ({ default: mod.InstrumentRentalDashboard })),
    { loading: () => <Skeleton className="h-96" /> }
);

export default function InstrumentRentalsPage() {
    const { user, isLoading } = useAdminGuard();
    const t = useTranslations('Sidebar');
    const tAdmin = useTranslations('AdminPages.rentals');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

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
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold text-start">{t('rentals')}</h1>
                <p className="text-muted-foreground text-start">{tAdmin('subtitle')}</p>
            </div>
            <InstrumentRentalDashboard />
        </div>
    );
}