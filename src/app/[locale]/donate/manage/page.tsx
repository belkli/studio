'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { AlertCircle, Heart } from 'lucide-react';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * Recurring donation management stub.
 * V1: shows the cancellation UI — actual backend integration is future work.
 * Token is passed via ?token= query param (would be emailed to donor).
 */
function ManageRecurringContent() {
  const t = useTranslations('Donate');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle>{t('invalidToken')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/donate">{t('backToDonate')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Heart className="h-12 w-12 text-rose-500" />
          </div>
          <CardTitle className="text-center">{t('manageTitle')}</CardTitle>
          <CardDescription className="text-center text-xs font-mono">
            #{token.slice(0, 8)}...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                {t('cancelRecurring')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('cancelRecurring')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {/* V1 stub — cancellation webhook not yet wired */}
                  {t('cancelRecurring')}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('backToDonate')}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    /* TODO: call cancelRecurringDonationAction(token) */
                    window.location.href = '/donate';
                  }}
                >
                  {t('cancelRecurring')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button asChild variant="outline" className="w-full">
            <Link href="/donate">{t('backToDonate')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ManageRecurringPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <PublicNavbar />
      <main className="flex-1 pt-14 flex">
        <Suspense fallback={<div className="flex-1" />}>
          <ManageRecurringContent />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
