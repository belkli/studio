'use client';

import { useLocale, useTranslations } from 'next-intl';

import { PublicFooter } from '@/components/layout/public-footer';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PublicAlumniPage() {
  const t = useTranslations('AlumniPage');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { mockAlumni, mockMasterclasses } = useAuth();

  const publicAlumni = mockAlumni.filter((item) => item.isPublic);
  const publishedMasterClasses = mockMasterclasses.filter((item) => item.status === 'published');

  return (
    <div className='flex min-h-dvh flex-col bg-background' dir={isRtl ? 'rtl' : 'ltr'}>
      <PublicNavbar />
      <main className='flex-1 pt-14'>
        <section className='mx-auto w-full max-w-6xl space-y-8 px-4 py-10'>
          <div className='space-y-2 text-start'>
            <h1 className='text-3xl font-bold'>{t('publicAlumniTitle')}</h1>
            <p className='text-muted-foreground'>{t('publicAlumniSubtitle')}</p>
          </div>

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {publicAlumni.length === 0 && <p className='text-sm text-muted-foreground'>{t('noPublicAlumni')}</p>}
            {publicAlumni.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className='text-lg'>{item.displayName}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2 text-sm'>
                  <p className='text-muted-foreground'>{item.graduationYear} ? {item.primaryInstrument}</p>
                  {item.currentOccupation && <p>{item.currentOccupation}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          <section className='space-y-3'>
            <h2 className='text-2xl font-semibold'>{t('publicMasterClassesTitle')}</h2>
            <div className='space-y-3'>
              {publishedMasterClasses.length === 0 && <p className='text-sm text-muted-foreground'>{t('noPublishedMasterClasses')}</p>}
              {publishedMasterClasses.map((item) => (
                <Card key={item.id}>
                  <CardContent className='flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                      <p className='font-medium'>{item.title.en}</p>
                      <p className='text-sm text-muted-foreground'>{item.instructor.displayName} ? {item.date} {item.startTime}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
