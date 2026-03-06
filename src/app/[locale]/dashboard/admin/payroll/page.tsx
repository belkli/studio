'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';

import { useAdminGuard } from '@/hooks/use-admin-guard';
import { Skeleton } from '@/components/ui/skeleton';

const AdminPayrollPanel = dynamic(
  () => import('@/components/dashboard/harmonia/admin-payroll-panel').then(mod => ({ default: mod.AdminPayrollPanel })),
  { loading: () => <Skeleton className="h-96" /> }
);

export default function AdminPayrollPage() {
  const { user, isLoading } = useAdminGuard();
  const tAdmin = useTranslations('AdminPages.payroll');
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
        <h1 className="text-2xl font-bold text-start">{tAdmin('header')}</h1>
        <p className="text-muted-foreground text-start">{tAdmin('subtitle')}</p>
      </div>
      <AdminPayrollPanel />
    </div>
  );
}
