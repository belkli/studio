'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { TeacherPayrollView } from '@/components/dashboard/harmonia/teacher-payroll-view';
import { useAuth } from '@/hooks/use-auth';

export default function TeacherPayrollPage() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('TeacherPayrollPage');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  useEffect(() => {
    if (user && user.role !== 'teacher') {
      router.replace('/403');
    }
  }, [router, user]);

  if (!user || user.role !== 'teacher') {
    return null;
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-start">{t('title')}</h1>
        <p className="text-muted-foreground text-start">{t('subtitle')}</p>
      </div>
      <TeacherPayrollView />
    </div>
  );
}
