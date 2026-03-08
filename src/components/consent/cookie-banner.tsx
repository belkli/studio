'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

const COOKIE_KEY = 'harmonia_cookie_consent';

function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return true;
  return !!localStorage.getItem(COOKIE_KEY);
}

export function CookieBanner() {
  const t = useTranslations('CookieBanner');
  const [show, setShow] = useState(() => !hasCookieConsent());

  const accept = () => { localStorage.setItem(COOKIE_KEY, 'accepted'); setShow(false); };
  const reject = () => { localStorage.setItem(COOKIE_KEY, 'rejected'); setShow(false); };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-0 inset-x-0 z-50 bg-background border-t shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
    >
      <div className="flex-1">
        <p id="cookie-banner-title" className="font-semibold text-sm">{t('title')}</p>
        <p id="cookie-banner-desc" className="text-muted-foreground text-xs mt-1">{t('description')}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button size="sm" variant="outline" onClick={reject}>{t('reject')}</Button>
        <Button size="sm" onClick={accept}>{t('accept')}</Button>
      </div>
    </div>
  );
}
