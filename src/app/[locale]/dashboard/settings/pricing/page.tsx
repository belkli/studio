'use client';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from 'next/link';
import { ArrowLeft } from "lucide-react";
import { PricingSettings } from "@/components/dashboard/harmonia/pricing-settings";
import { useTranslations } from "next-intl";

export default function PricingSettingsPage() {
    const { user, newFeaturesEnabled } = useAuth();
    const t = useTranslations('PricingPage');
    const commonT = useTranslations('Common');

    if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin') || !newFeaturesEnabled) {
        return <p>{commonT('noData')}</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/settings">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
            </div>

            <PricingSettings />
        </div>
    );
}
