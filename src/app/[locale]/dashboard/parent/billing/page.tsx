'use client';

import { ParentPaymentPanel } from "@/components/dashboard/harmonia/parent-payment-panel";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

export default function ParentBillingPage() {
    const { user } = useAuth();
    const t = useTranslations('DashboardPages');

    if (user?.role !== 'parent') {
        return <p>{t('noPermission')}</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('parentBilling.title')}</h1>
                <p className="text-muted-foreground">{t('parentBilling.description')}</p>
            </div>

            <ParentPaymentPanel />
        </div>
    );
}
