'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

const AlumniPortal = dynamic(
  () => import('@/components/dashboard/harmonia/alumni-portal').then(mod => ({ default: mod.AlumniPortal })),
  { loading: () => <Skeleton className="h-96" /> }
);

export default function AlumniPage() {
  const t = useTranslations('AlumniPage');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/403');
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return <div className='h-48' dir={isRtl ? 'rtl' : 'ltr'} />;
  }

  return (
    <div className='space-y-6' dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h1 className='text-2xl font-bold text-start'>{t('title')}</h1>
        <p className='text-muted-foreground text-start'>{t('subtitle')}</p>
      </div>
      <AlumniPortal />
    </div>
  );
}
