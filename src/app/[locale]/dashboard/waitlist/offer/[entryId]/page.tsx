'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/routing';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { acceptWaitlistOfferAction, declineWaitlistOfferAction, deferWaitlistOfferAction } from '@/app/actions/waitlist';

const MAX_DEFERS = 2;

function formatCountdown(ms: number): { text: string; urgency: 'normal' | 'amber' | 'red' } {
  if (ms <= 0) return { text: '0s', urgency: 'red' };

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let text: string;
  if (hours > 0) {
    text = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    text = `${minutes}m ${seconds}s`;
  } else {
    text = `${seconds}s`;
  }

  const urgency: 'normal' | 'amber' | 'red' =
    ms < 2 * 60 * 60 * 1000 ? 'red' : ms < 24 * 60 * 60 * 1000 ? 'amber' : 'normal';

  return { text, urgency };
}

export default function WaitlistOfferPage() {
  const params = useParams();
  const entryId = params.entryId as string;
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const t = useTranslations('WaitlistOffer');
  const tCommon = useTranslations('Common');
  const { user, waitlist, users, declineWaitlistOffer, deferWaitlistOffer, acceptWaitlistOffer } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [msRemaining, setMsRemaining] = useState<number | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isDeferring, setIsDeferring] = useState(false);

  const entry = waitlist.find(e => e.id === entryId);
  const teacher = entry ? users.find(u => u.id === entry.teacherId) : null;

  const expiresAt = entry?.offerExpiresAt ? new Date(entry.offerExpiresAt) : null;

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const remaining = expiresAt.getTime() - Date.now();
      setMsRemaining(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = msRemaining !== null && msRemaining <= 0;
  const deferCount = entry?.deferredCount ?? 0;
  const canDefer = deferCount < MAX_DEFERS && !isExpired;

  const handleAccept = useCallback(async () => {
    if (!entry) return;
    setIsAccepting(true);
    try {
      const result = await acceptWaitlistOfferAction({ entryId });
      if (!result?.success) {
        toast({
          variant: 'destructive',
          title: tCommon('error'),
          description: result?.error ?? 'Failed to accept offer',
        });
        return;
      }
      // Optimistic update
      acceptWaitlistOffer(entryId);
      router.push(`/dashboard/billing?action=purchase&waitlistEntryId=${entryId}`);
    } finally {
      setIsAccepting(false);
    }
  }, [entry, entryId, acceptWaitlistOffer, router, toast, tCommon]);

  const handleDecline = useCallback(async () => {
    if (!entry) return;
    setIsDeclining(true);
    try {
      const result = await declineWaitlistOfferAction({ entryId });
      if (!result?.success) {
        toast({
          variant: 'destructive',
          title: tCommon('error'),
          description: result?.error ?? 'Failed to decline offer',
        });
        return;
      }
      declineWaitlistOffer(entryId);
      toast({ description: t('declineSuccess') });
      router.push('/dashboard');
    } finally {
      setIsDeclining(false);
    }
  }, [entry, entryId, declineWaitlistOffer, router, toast, t, tCommon]);

  const handleDefer = useCallback(async () => {
    if (!entry || !canDefer) return;
    setIsDeferring(true);
    try {
      const result = await deferWaitlistOfferAction({ entryId });
      if (!result?.success) {
        toast({
          variant: 'destructive',
          title: tCommon('error'),
          description: result?.error ?? 'Failed to defer offer',
        });
        return;
      }
      deferWaitlistOffer(entryId);
      toast({ description: t('deferDescription') });
      router.push('/dashboard');
    } finally {
      setIsDeferring(false);
    }
  }, [entry, canDefer, entryId, deferWaitlistOffer, router, toast, t, tCommon]);

  if (!user) return null;

  if (!entry) {
    return (
      <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { text: countdown, urgency } = msRemaining !== null
    ? formatCountdown(msRemaining)
    : { text: '...', urgency: 'normal' as const };

  const urgencyClass =
    urgency === 'red' ? 'text-red-600 font-bold' :
    urgency === 'amber' ? 'text-amber-600 font-semibold' :
    'text-foreground';

  return (
    <div className="space-y-6 max-w-lg mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <CardTitle>{t('offerDetails')}</CardTitle>
          <CardDescription>
            {entry.instrument} — {teacher?.name ?? entry.teacherId}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Offer details */}
          <div className="space-y-1">
            {entry.offeredSlotTime && (
              <p className="text-sm">
                <span className="font-medium">{t('proposedTime')}:</span>{' '}
                {entry.offeredSlotTime}
              </p>
            )}
            {expiresAt && (
              <p className="text-sm">
                <span className="font-medium">{t('offerExpires')}:</span>{' '}
                {format(expiresAt, 'dd/MM/yyyy HH:mm')}
              </p>
            )}
          </div>

          {/* Countdown */}
          {msRemaining !== null && (
            <div className="rounded-md border p-3">
              {isExpired ? (
                <p className="text-destructive font-semibold">{t('offerExpired')}</p>
              ) : (
                <p className={urgencyClass}>
                  {t('expiresIn')}: {countdown}
                </p>
              )}
            </div>
          )}

          {/* Deferred count badge */}
          {deferCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('deferredCount', { count: deferCount, max: MAX_DEFERS })}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={handleAccept}
              disabled={isExpired || isAccepting}
              className="flex-1"
            >
              {t('acceptOffer')}
            </Button>

            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={isExpired || isDeclining}
              className="flex-1"
            >
              {t('declineOffer')}
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-1">
                    <Button
                      variant="ghost"
                      onClick={handleDefer}
                      disabled={!canDefer || isDeferring}
                      className="w-full"
                    >
                      {t('deferOffer')}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canDefer && !isExpired && (
                  <TooltipContent>
                    {t('maxDefersReached', { max: MAX_DEFERS })}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
