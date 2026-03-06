'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const BookLessonWizard = dynamic(
  () => import('@/components/dashboard/harmonia/book-lesson-wizard').then(mod => ({ default: mod.BookLessonWizard })),
  { ssr: false }
);

export default function BookLessonPage() {
  const t = useTranslations('LessonManagement');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('bookPageTitle')}</h1>
        <p className="text-muted-foreground">{t('bookPageSubtitle')}</p>
      </div>
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
        <BookLessonWizard />
      </Suspense>
    </div>
  );
}
