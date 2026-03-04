'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { TeacherProfileEditor } from '@/components/dashboard/harmonia/teacher-profile-editor';
import { useAuth } from '@/hooks/use-auth';

export default function TeacherProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('TeacherProfile');
  const isRtl = locale === 'he' || locale === 'ar';

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.replace('/403');
    }
  }, [isLoading, router, user]);

  if (!user || user.role !== 'teacher') {
    return null;
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-start">{t('title')}</h1>
        <p className="text-muted-foreground text-start">{t('subtitle')}</p>
      </div>
      <div className="flex justify-center">
        <TeacherProfileEditor />
      </div>
    </div>
  );
}

