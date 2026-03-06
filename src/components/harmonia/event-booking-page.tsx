'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import type { TicketTier } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Link } from '@/i18n/routing';

export function EventBookingPage() {
  const { events, bookEventTickets, user } = useAuth();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('Events');
  const { toast } = useToast();
  const isRtl = locale === 'he' || locale === 'ar';

  const eventId = params.id as string;
  const event = useMemo(() => events.find((item) => item.id === eventId), [events, eventId]);
  const [step, setStep] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [attendee, setAttendee] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });

  const tiers = useMemo<TicketTier[]>(() => {
    if (!event) return [];
    if (event.ticketPrices && event.ticketPrices.length > 0) return event.ticketPrices;
    return [
      {
        id: 'tier-free',
        name: { he: 'General Admission', en: 'General Admission' },
        priceILS: 0,
        availableCount: Math.max(0, (event.totalSeats || 0) - (event.bookedSeats?.length || 0)),
      },
    ];
  }, [event]);

  const totalSelected = Object.values(quantities).reduce((acc, qty) => acc + qty, 0);
  const totalAmount = tiers.reduce((sum, tier) => sum + (quantities[tier.id] || 0) * tier.priceILS, 0);
  const isSoldOut = tiers.length > 0 && tiers.every((tier) => tier.availableCount <= 0);

  const setQuantity = (tierId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [tierId]: Math.max(0, qty) }));
  };

  const getTierName = (tier: TicketTier) => {
    const localized = (tier.name as Partial<Record<'he' | 'en' | 'ru' | 'ar', string>>)[locale as 'he' | 'en' | 'ru' | 'ar'];
    return localized || tier.name.en || tier.name.he || 'Tier';
  };

  const handleConfirm = () => {
    if (!event) return;
    const result = bookEventTickets(event.id, quantities, attendee, user?.id || 'guest');
    if (!result.success) {
      toast({ variant: 'destructive', title: t('soldOut') });
      return;
    }

    toast({
      title: t('bookingConfirmed'),
      description: t('bookingConfirmedEmail', { email: attendee.email, ref: result.bookingRef || '' }),
    });
    setStep(1);
    setQuantities({});
  };

  if (!event) {
    return <div dir={isRtl ? 'rtl' : 'ltr'} className="p-6 text-sm text-muted-foreground">{t('eventNotFound')}</div>;
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="container py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-start">{event.title?.[locale as 'he' | 'en' | 'ru' | 'ar'] || event.name}</h1>
        <p className="text-sm text-muted-foreground text-start">{t('bookingFlowTitle')}</p>
      </div>

      {isSoldOut && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-xl font-semibold">{t('soldOut')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('bookingDisabled')}</p>
          </CardContent>
        </Card>
      )}

      {!isSoldOut && (
        <>
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('stepSelectSeats')}</CardTitle>
                <CardDescription>{t('stepSelectSeatsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tiers.map((tier) => (
                  <div key={tier.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{getTierName(tier)}</p>
                      <p className="text-sm text-muted-foreground">{tier.priceILS === 0 ? t('free') : `ILS ${tier.priceILS}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setQuantity(tier.id, (quantities[tier.id] || 0) - 1)}>-</Button>
                      <span className="w-8 text-center">{quantities[tier.id] || 0}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => setQuantity(tier.id, Math.min(tier.availableCount, (quantities[tier.id] || 0) + 1))}>+</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="button" disabled={totalSelected <= 0} onClick={() => setStep(2)}>{t('nextStep')}</Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('stepAttendee')}</CardTitle>
                <CardDescription>{t('stepAttendeeDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>{t('attendeeName')}</Label><Input value={attendee.name} onChange={(e) => setAttendee((prev) => ({ ...prev, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{t('attendeeEmail')}</Label><Input type="email" value={attendee.email} onChange={(e) => setAttendee((prev) => ({ ...prev, email: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{t('attendeePhone')}</Label><Input value={attendee.phone} onChange={(e) => setAttendee((prev) => ({ ...prev, phone: e.target.value }))} /></div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>{t('backStep')}</Button>
                <Button type="button" onClick={() => setStep(event.isFree ? 3 : 3)}>{t('nextStep')}</Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>{event.isFree ? t('confirmBooking') : t('stepPayment')}</CardTitle>
                <CardDescription>{event.isFree ? t('freeBookingDesc') : t('paymentDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span>{t('ticketsCount')}</span><span>{totalSelected}</span></div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold"><span>{t('totalPayment')}</span><span>{event.isFree ? t('free') : `ILS ${totalAmount}`}</span></div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>{t('backStep')}</Button>
                <Button type="button" onClick={handleConfirm}>{event.isFree ? t('bookFree') : t('payAndBook')}</Button>
              </CardFooter>
            </Card>
          )}
        </>
      )}

      <div>
        <Button asChild variant="ghost"><Link href={`/events/${event.id}`}>{t('backToEvent')}</Link></Button>
      </div>
    </div>
  );
}
