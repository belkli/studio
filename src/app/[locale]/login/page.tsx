'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('Common.errors');

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50/50 via-background to-background">
      <div className="absolute top-4 start-4">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-0 ltr:rotate-180" />
          {t('backToHome')}
        </Link>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
