'use client';

import { useLocale, useTranslations } from 'next-intl';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminGuard } from '@/hooks/use-admin-guard';

const PerformanceBookingDashboard = dynamic(
    () => import('@/components/dashboard/harmonia/performance-booking-dashboard').then(mod => ({ default: mod.PerformanceBookingDashboard })),
    { loading: () => <Skeleton className="h-96" /> }
);

export default function AdminPerformancesPage() {
  const { user, isLoading } = useAdminGuard();
  const t = useTranslations('Sidebar');
  const tAdmin = useTranslations('AdminPages.performances');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  if (isLoading || !user) {
    return (
      <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-start">{t('performances')}</h1>
        <p className="text-muted-foreground text-start">{tAdmin('subtitle')}</p>
      </div>
      <PerformanceBookingDashboard />
    </div>
  );
}
