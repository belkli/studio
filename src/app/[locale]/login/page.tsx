'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { useBrandTheme } from '@/components/brand-theme-provider';
import { cn } from '@/lib/utils';

const LOGIN_PAGE_STYLES = {
  indigo: {
    container: 'bg-gradient-to-br from-indigo-50/50 via-background to-background',
    backLink: 'text-muted-foreground hover:text-foreground',
  },
  gold: {
    container: 'bg-gradient-to-br from-[hsl(210,50%,8%)] via-background to-background',
    backLink: 'text-foreground/60 hover:text-brand-gold',
  },
} as const;

export default function LoginPage() {
  const t = useTranslations('Common.errors');
  const { brand } = useBrandTheme();
  const s = LOGIN_PAGE_STYLES[brand];

  return (
    <div className={cn('relative flex items-center justify-center min-h-screen', s.container)}>
      <div className="absolute top-4 start-4">
        <Link href="/" className={cn('text-sm flex items-center gap-1', s.backLink)}>
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
