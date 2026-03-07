'use client';

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PricingSettings } from "@/components/dashboard/harmonia/pricing-settings";
import { useLocale, useTranslations } from 'next-intl';

export default function PricingSettingsPage() {
    const { user, newFeaturesEnabled } = useAuth();
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const t = useTranslations('SettingsPage');
    const BackIcon = isRtl ? ChevronRight : ChevronLeft;

    if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin') || !newFeaturesEnabled) {
        return null;
    }

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="space-y-1">
                <Button variant="ghost" size="sm" className="gap-1 -ms-2 h-7 text-muted-foreground" asChild>
                    <Link href="/dashboard/settings">
                        <BackIcon className="h-4 w-4" />
                        {t('title')}
                    </Link>
                </Button>
            </div>
            <PricingSettings />
        </div>
    );
}
