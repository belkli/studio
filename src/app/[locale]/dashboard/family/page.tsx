'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { WaitlistOfferBanner } from '@/components/dashboard/waitlist-offer-banner';

function FamilyHubSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Skeleton className="h-[450px] w-full" />
            <Skeleton className="h-[450px] w-full" />
        </div>
    );
}

const FamilyHub = dynamic(
    () => import('@/components/dashboard/harmonia/family-hub').then(m => ({ default: m.FamilyHub })),
    { loading: () => <FamilyHubSkeleton /> }
);

export default function FamilyPage() {
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const t = useTranslations('DashboardPages');

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold">{t('family.title')}</h1>
                <p className="text-muted-foreground">{t('family.description')}</p>
            </div>
            <WaitlistOfferBanner />
            <FamilyHub />
        </div>
    );
}
