'use client';

import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { RentalSigningFlow } from '@/components/harmonia/rental-signing-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RentalSignPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const t = useTranslations('InstrumentRental');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { getRentalByToken } = useAuth();

  const rental = token ? getRentalByToken(token) : undefined;

  if (!token || !rental || rental.status !== 'pending_signature') {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="mx-auto w-full max-w-2xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-start">{t('tokenExpiredTitle')}</CardTitle>
            <CardDescription className="text-start">{t('tokenExpired')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-start">{t('tokenExpiredHelp')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <RentalSigningFlow rental={rental} token={token} />;
}