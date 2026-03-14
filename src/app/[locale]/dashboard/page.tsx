'use client';

import dynamic from 'next/dynamic';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { RecentForms } from '@/components/dashboard/recent-forms';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useRouter } from '@/i18n/routing';
import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

const WhatsNewFeed = dynamic(
  () => import('@/components/dashboard/harmonia/whats-new-feed').then(m => ({ default: m.WhatsNewFeed })),
  { loading: () => <Skeleton className="h-48 w-full rounded-md bg-muted" /> }
);

export default function DashboardPage() {
  const t = useTranslations('Dashboard.welcome');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { user, newFeaturesEnabled, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && newFeaturesEnabled && user) {
      if (user.role === 'site_admin' || user.role === 'conservatorium_admin') {
        router.replace('/dashboard/admin');
      } else if (user.role === 'teacher') {
        router.replace('/dashboard/teacher');
      } else if (user.role === 'parent') {
        router.replace('/dashboard/family');
      } else if (user.role === 'student') {
        router.replace('/dashboard/profile');
      } else if (user.role === 'ministry_director') {
        router.replace('/dashboard/ministry');
      } else if (user.role === 'school_coordinator') {
        router.replace('/dashboard/school');
      }
    }
  }, [isLoading, newFeaturesEnabled, user, router]);

  if (isLoading || !user) {
    return (
      <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-5 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title', { name: user.name.split(' ')[0] })}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        {user.role !== 'ministry_director' && (
          <Button asChild>
            <Link href="/dashboard/forms/new">
              <PlusCircle className="me-2 h-4 w-4" />
              {t('newForm')}
            </Link>
          </Button>
        )}
      </div>
      <OverviewCards />
      <RecentForms />
      <WhatsNewFeed />
    </div>
  );
}
