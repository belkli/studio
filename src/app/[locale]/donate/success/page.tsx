'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { CheckCircle } from 'lucide-react';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';

function DonationSuccessContent() {
  const t = useTranslations('Donate');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount');
  const donationId = searchParams.get('donationId');

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">{t('successTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {amount && (
            <p className="text-lg text-muted-foreground">
              {t('successAmount', { amount })}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {t('successReceipt')}
          </p>
          {donationId && (
            <p className="text-xs text-muted-foreground font-mono">
              #{donationId}
            </p>
          )}
          <Button asChild className="w-full mt-4">
            <Link href="/donate">{t('backToDonate')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <PublicNavbar />
      <main className="flex-1 pt-14 flex">
        <Suspense fallback={<div className="flex-1" />}>
          <DonationSuccessContent />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
