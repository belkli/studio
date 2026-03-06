'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Common.errors');

  useEffect(() => {
    console.error('[Harmonia Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-2xl font-semibold">{t('generalTitle')}</h2>
      <p className="text-muted-foreground max-w-md">{t('generalDescription')}</p>
      <div className="flex gap-2">
        <Button onClick={reset}>{t('tryAgain')}</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">{t('backToDashboard')}</Link>
        </Button>
      </div>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="text-xs text-start bg-muted p-4 rounded max-w-lg overflow-auto mt-4">
          {error.message}
          {error.digest && `\n\nDigest: ${error.digest}`}
        </pre>
      )}
    </div>
  );
}
