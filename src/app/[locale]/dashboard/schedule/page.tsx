'use client';

import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ScheduleRedesign } from '@/components/dashboard/harmonia/schedule-redesign';

export default function SchedulePage() {
  const { user } = useAuth();
  const t = useTranslations('AdminPages.schedule');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  if (!user) return null;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-start">{t('weeklySchedule')}</h1>
          <p className="text-muted-foreground text-start">{t('subtitle')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/schedule/book">
            <PlusCircle className="me-2 h-4 w-4" />
            {t('bookNewLesson')}
          </Link>
        </Button>
      </div>

      <ScheduleRedesign />
    </div>
  );
}