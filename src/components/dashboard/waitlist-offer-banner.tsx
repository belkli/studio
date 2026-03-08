'use client';

import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export function WaitlistOfferBanner() {
  const { user, waitlist, acceptWaitlistOffer, declineWaitlistOffer, users } = useAuth();
  const t = useTranslations('Waitlist');

  if (!user) return null;

  const myOffers = waitlist.filter(e =>
    e.studentId === user.id &&
    e.status === 'OFFERED' &&
    e.offerExpiresAt &&
    new Date(e.offerExpiresAt) > new Date()
  );

  if (myOffers.length === 0) return null;

  return (
    <div className="space-y-3">
      {myOffers.map(offer => {
        const teacher = users.find(u => u.id === offer.teacherId);
        return (
          <Card key={offer.id} className="border-amber-300 bg-amber-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-amber-900">{t('offerBannerTitle')}</h4>
              <p className="text-sm text-amber-800 mt-1">
                {t('offerBannerDesc', {
                  instrument: offer.instrument,
                  teacher: teacher?.name ?? '',
                  time: offer.offeredSlotTime ?? '',
                  expiry: formatDistanceToNow(new Date(offer.offerExpiresAt!)),
                })}
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => acceptWaitlistOffer(offer.id)}>
                  {t('acceptOffer')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => declineWaitlistOffer(offer.id)}>
                  {t('declineOffer')}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
