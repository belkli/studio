'use client';

import { useAuth } from '@/hooks/use-auth';
import { useParams, notFound } from 'next/navigation';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Ticket, Minus, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useLocale, useTranslations } from 'next-intl';
import { useDateLocale } from '@/hooks/use-date-locale';
import { Link } from '@/i18n/routing';

export function PublicEventPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { events } = useAuth();
  const [ticketCount, setTicketCount] = useState(1);
  const t = useTranslations('PublicEventPage');
  const locale = useLocale();
  const dateLocale = useDateLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const event = useMemo(() => events.find((item) => item.id === eventId), [events, eventId]);
  const heroImage = PlaceHolderImages.find((img) => img.id === 'event-wedding');

  if (!event) {
    return notFound();
  }

  return (
    <div className="bg-muted/20" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="relative w-full h-[50vh] flex items-center justify-center text-center text-white bg-slate-800">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            style={{ objectFit: 'cover' }}
            className="z-0 brightness-50"
            data-ai-hint={heroImage.imageHint}
            priority
          />
        )}
        <div className="relative z-10 p-4 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">{event.title?.[locale as 'he' | 'en' | 'ru' | 'ar'] || event.name}</h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-neutral-200">
            {event.type === 'RECITAL' ? t('recitalDesc') : t('concertDesc')}
          </p>
        </div>
      </section>

      <div className="container -mt-20 z-20 relative pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('eventProgram')}</CardTitle>
                <CardDescription>{t('programDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {event.program.length > 0 ? (
                  <ul className="space-y-4">
                    {event.program.map((perf) => (
                      <li key={perf.id} className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                        <div>
                          <p className="font-semibold">{perf.compositionTitle}</p>
                          <p className="text-sm text-muted-foreground">{perf.composer}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-medium">{perf.studentName}</p>
                          <p className="text-xs text-muted-foreground">{t('performer')}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{t('programTBA')}</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('eventDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{format(new Date(event.eventDate), 'EEEE, dd MMMM yyyy', { locale: dateLocale })}</span></div>
                <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><span>{event.startTime}</span></div>
                <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{event.venue}</span></div>
                {event.venueDetails?.googleMapsUrl && (
                  <div className="text-sm">
                    <a className="text-primary underline" href={event.venueDetails.googleMapsUrl} target="_blank" rel="noreferrer">{t('openInMaps')}</a>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('buyTickets')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(event.ticketPrice ?? 0) > 0 ? (
                  <>
                    <div className="flex items-center justify-center gap-4">
                      <Button variant="outline" size="icon" onClick={() => setTicketCount((count) => Math.max(1, count - 1))}><Minus className="h-4 w-4" /></Button>
                      <span className="text-2xl font-bold w-12 text-center">{ticketCount}</span>
                      <Button variant="outline" size="icon" onClick={() => setTicketCount((count) => count + 1)}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <Separator />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t('totalPayment')}</p>
                      <p className="text-3xl font-bold">₪{(event.ticketPrice ?? 0) * ticketCount}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-center font-medium text-lg">{t('freeEntrance')}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" asChild disabled={event.status === 'CLOSED'}>
                  <Link href={`/events/${event.id}/book`}>
                    <Ticket className="me-2 h-5 w-5" /> {event.status === 'CLOSED' ? t('soldOut') : t('bookTicketsBtn')}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
