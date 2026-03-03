'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RegistrationSessionGuardProps {
  children: React.ReactNode;
  storageKey: string;
  durationMinutes?: number;
  warningMinutes?: number;
}

const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_WARNING_MINUTES = 10;

function formatCountdown(seconds: number) {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mm}:${ss}`;
}

export function RegistrationSessionGuard({
  children,
  storageKey,
  durationMinutes = DEFAULT_DURATION_MINUTES,
  warningMinutes = DEFAULT_WARNING_MINUTES,
}: RegistrationSessionGuardProps) {
  const t = useTranslations('RegistrationSession');
  const durationMs = durationMinutes * 60 * 1000;
  const warningSeconds = warningMinutes * 60;

  const [now, setNow] = useState(Date.now());
  const [endAt, setEndAt] = useState<number | null>(null);
  const [dismissedWarning, setDismissedWarning] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey);
    const parsed = raw ? Number(raw) : NaN;
    const nextEndAt = Number.isFinite(parsed) && parsed > Date.now() ? parsed : Date.now() + durationMs;
    sessionStorage.setItem(storageKey, String(nextEndAt));
    setEndAt(nextEndAt);
  }, [durationMs, storageKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsLeft = useMemo(() => {
    if (!endAt) return durationMinutes * 60;
    return Math.max(0, Math.floor((endAt - now) / 1000));
  }, [durationMinutes, endAt, now]);

  const isExpired = secondsLeft <= 0;
  const shouldShowWarning = !isExpired && secondsLeft <= warningSeconds && !dismissedWarning;

  const extendSession = () => {
    const nextEndAt = Date.now() + durationMs;
    sessionStorage.setItem(storageKey, String(nextEndAt));
    setEndAt(nextEndAt);
    setDismissedWarning(false);
  };

  const dismissWarning = () => {
    setDismissedWarning(true);
  };

  const restartSession = () => {
    const nextEndAt = Date.now() + durationMs;
    sessionStorage.setItem(storageKey, String(nextEndAt));
    setEndAt(nextEndAt);
    setDismissedWarning(false);
    setNow(Date.now());
  };

  if (isExpired) {
    return (
      <Card className="w-full max-w-xl mx-4">
        <CardHeader>
          <CardTitle>{t('expiredTitle')}</CardTitle>
          <CardDescription>{t('expiredDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={restartSession}>{t('restart')}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative w-full">
      <div
        className="absolute top-2 right-2 z-20 inline-flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1 text-xs font-medium shadow"
        aria-live="polite"
      >
        <Clock3 className="h-3.5 w-3.5" />
        <span>{t('remaining', { time: formatCountdown(secondsLeft) })}</span>
      </div>

      <Dialog open={shouldShowWarning} onOpenChange={(open) => (open ? setDismissedWarning(false) : dismissWarning())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('warningTitle')}</DialogTitle>
            <DialogDescription>{t('warningDescription', { minutes: warningMinutes })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={dismissWarning}>
              {t('continueWithoutExtending')}
            </Button>
            <Button onClick={extendSession}>{t('extend')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {children}
    </div>
  );
}
