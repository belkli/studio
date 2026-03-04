'use client';

import { useTranslations, useLocale } from 'next-intl';

import { OpenDayAdminDashboard } from '@/components/dashboard/harmonia/open-day-admin-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminGuard } from '@/hooks/use-admin-guard';

export default function AdminOpenDayPage() {
  const { user, isLoading } = useAdminGuard();
  const t = useTranslations('Sidebar');
  const tAdmin = useTranslations('AdminPages.openDay');
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
        <h1 className="text-2xl font-bold text-start">{t('manageOpenDay')}</h1>
        <p className="text-muted-foreground text-start">{tAdmin('subtitle')}</p>
      </div>
      <OpenDayAdminDashboard />
    </div>
  );
}
