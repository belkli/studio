'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/use-auth';
import { WhatsNewFeed } from '@/components/dashboard/harmonia/whats-new-feed';

export default function WhatsNewPage() {
  const t = useTranslations('Dashboard.whatsNewFeed');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/403');
    }
  }, [router, user]);

  if (!user) return null;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="text-start">
        <h1 className="text-2xl font-bold text-start">{t('title')}</h1>
        <p className="text-muted-foreground text-start">{t('description')}</p>
      </div>
      <WhatsNewFeed />
    </div>
  );
}
