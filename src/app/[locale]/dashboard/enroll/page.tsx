'use client';

import { EnrollmentWizard } from '@/components/enrollment/enrollment-wizard';
import { useLocale, useTranslations } from 'next-intl';

export default function AdminEnrollmentPage() {
  const t = useTranslations('EnrollmentWizard.admin');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="text-start">
        <h1 className="text-2xl font-bold text-start">{t('title')}</h1>
        <p className="text-start text-muted-foreground">{t('subtitle')}</p>
      </div>
      <div className="flex items-center justify-center py-12">
        <EnrollmentWizard isAdminFlow />
      </div>
    </div>
  );
}
