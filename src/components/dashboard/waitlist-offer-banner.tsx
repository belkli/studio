'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { Clock } from 'lucide-react';

const MAX_DEFERS = 2;

function useCountdown(expiresAt: string | undefined) {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () => setMs(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return ms;
}

function CountdownDisplay({ expiresAt }: { expiresAt: string }) {
  const ms = useCountdown(expiresAt);
  const t = useTranslations('WaitlistOffer');

  if (ms === null) return null;
  if (ms <= 0) return <span className="text-red-600 font-semibold">{t('offerExpired')}</span>;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const urgency = ms < 2 * 60 * 60 * 1000 ? 'red' : ms < 24 * 60 * 60 * 1000 ? 'amber' : 'normal';
  const cls =
    urgency === 'red' ? 'text-red-600 font-bold' :
    urgency === 'amber' ? 'text-amber-700 font-semibold' :
    'text-amber-800';

  const text = hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;

  return (
    <span className={cls}>
      {t('expiresIn')}: {text}
    </span>
  );
}

export function WaitlistOfferBanner() {
  const { user, waitlist, users } = useAuth();
  const t = useTranslations('WaitlistOffer');

  if (!user) return null;

  const myOffers = waitlist.filter(e =>
    (e.studentId === user.id || (user.childIds && user.childIds.includes(e.studentId))) &&
    e.status === 'OFFERED' &&
    e.offerExpiresAt &&
    new Date(e.offerExpiresAt) > new Date()
  );

  if (myOffers.length === 0) return null;

  return (
    <div className="space-y-3">
      {myOffers.map(offer => {
        const teacher = users.find(u => u.id === offer.teacherId);
        const student = users.find(u => u.id === offer.studentId);
        return (
          <Card key={offer.id} className="border-amber-300 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h4 className="font-semibold text-amber-900 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {t('offerBanner')}
                  </h4>
                  <p className="text-sm text-amber-800">
                    {offer.instrument}
                    {teacher ? ` — ${teacher.name}` : ''}
                    {student && student.id !== user.id ? ` (${student.name})` : ''}
                    {offer.offeredSlotTime ? ` · ${offer.offeredSlotTime}` : ''}
                  </p>
                  {offer.offerExpiresAt && (
                    <p className="text-sm">
                      <CountdownDisplay expiresAt={offer.offerExpiresAt} />
                    </p>
                  )}
                  {(offer.deferredCount ?? 0) > 0 && (
                    <p className="text-xs text-amber-700">
                      {t('deferredCount', { count: offer.deferredCount ?? 0, max: MAX_DEFERS })}
                    </p>
                  )}
                </div>
                <Button asChild size="sm" className="shrink-0">
                  <Link href={`/dashboard/waitlist/offer/${offer.id}`}>
                    {t('reviewAndRespond')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
