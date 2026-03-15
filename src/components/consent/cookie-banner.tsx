'use client';
import { useSyncExternalStore, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { BRAND_COOKIE_CONSENT_KEY } from '@/lib/brand';

const COOKIE_KEY = BRAND_COOKIE_CONSENT_KEY;

// Listeners for same-tab reactivity (storage event only fires cross-tab)
const listeners = new Set<() => void>();
function notify() { listeners.forEach((cb) => cb()); }

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => { listeners.delete(cb); window.removeEventListener('storage', cb); };
}
function getSnapshot() { return localStorage.getItem(COOKIE_KEY); }
function getServerSnapshot() { return 'accepted'; } // always hidden on SSR

export function CookieBanner() {
  const t = useTranslations('CookieBanner');
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const accept = useCallback(() => { localStorage.setItem(COOKIE_KEY, 'accepted'); notify(); }, []);
  const reject = useCallback(() => { localStorage.setItem(COOKIE_KEY, 'rejected'); notify(); }, []);

  if (consent) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-0 inset-x-0 z-50 bg-background border-t shadow-lg px-4 py-3 flex items-center gap-3 sm:p-4 sm:flex-row"
    >
      <div className="flex-1 min-w-0">
        <p id="cookie-banner-title" className="font-semibold text-sm leading-tight">{t('title')}</p>
        <p id="cookie-banner-desc" className="text-muted-foreground text-xs mt-0.5 line-clamp-2 sm:line-clamp-none">{t('description')}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button size="sm" variant="outline" onClick={reject}>{t('reject')}</Button>
        <Button size="sm" onClick={accept}>{t('accept')}</Button>
      </div>
    </div>
  );
}
