'use client';

import { useLocale, useTranslations } from 'next-intl';
import { AnnouncementComposer } from "@/components/dashboard/harmonia/announcement-composer";

export default function AnnouncementsPage() {
  const t = useTranslations('AnnouncementComposer');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="text-start">
        <h1 className="text-2xl font-bold text-start">{t('title')}</h1>
        <p className="text-muted-foreground text-start">{t('description')}</p>
      </div>
      <AnnouncementComposer />
    </div>
  );
}
