'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { format, add, isBefore, setHours, setMinutes } from 'date-fns';
import { Calendar, Clock, CheckCircle2, Guitar, LocateFixed, Music, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useDateLocale } from '@/hooks/use-date-locale';
import { collectInstrumentTokensFromConservatoriumInstrument, normalizeInstrumentToken } from '@/lib/instrument-matching';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex flex-col items-center gap-4 text-center">
    <div className="rounded-full bg-primary/10 p-4">{icon}</div>
    <div className="space-y-1">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function OpenDayLandingPage() {
  const { openDayEvents, openDayAppointments, addOpenDayAppointment, conservatoriums, conservatoriumInstruments } = useAuth();
  const t = useTranslations('OpenDay');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { toast } = useToast();
  const dateLocale = useDateLocale();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [city, setCity] = useState('all');
  const [distance, setDistance] = useState('all');
  const [instrument, setInstrument] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const activeEvents = useMemo(() => openDayEvents.filter((item) => item.isActive), [openDayEvents]);
  const activeEvent = useMemo(() => activeEvents.find((item) => item.id === selectedEventId), [activeEvents, selectedEventId]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    conservatoriums.forEach((item) => {
      if (item.location?.city) set.add(item.location.city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, locale));
  }, [conservatoriums, locale]);

  const instrumentOptions = useMemo(() => {
    const localeName = (item: (typeof conservatoriumInstruments)[number]) => {
      if (locale === 'he') return item.names.he;
      if (locale === 'ar') return item.names.ar || item.names.en;
      if (locale === 'ru') return item.names.ru || item.names.en;
      return item.names.en;
    };

    return conservatoriumInstruments
      .filter((item) => item.isActive)
      .map((item) => ({ value: item.id, label: localeName(item) }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [conservatoriumInstruments, locale]);

  const filteredEvents = useMemo(() => {
    return activeEvents.filter((event) => {
      const cons = conservatoriums.find((item) => item.id === event.conservatoriumId);
      const consCity = cons?.location?.city || '';

      const byCity = city === 'all' || consCity === city;

      const byDistance = (() => {
        if (distance === 'all') return true;
        if (!userLocation || !cons?.location?.coordinates) return false;
        const d = haversineDistance(userLocation.lat, userLocation.lng, cons.location.coordinates.lat, cons.location.coordinates.lng);
        return d <= Number(distance);
      })();

      const byInstrument = (() => {
        if (instrument === 'all') return true;
        const selectedToken = normalizeInstrumentToken(instrument);
        return conservatoriumInstruments.some((item) => {
          if (item.conservatoriumId !== event.conservatoriumId || !item.isActive) return false;
          const tokens = collectInstrumentTokensFromConservatoriumInstrument(item);
          return tokens.has(selectedToken);
        });
      })();

      const byDate = (() => {
        const eventDate = new Date(event.date);
        if (dateFrom && eventDate < new Date(dateFrom)) return false;
        if (dateTo && eventDate > new Date(dateTo)) return false;
        return true;
      })();

      return byCity && byDistance && byInstrument && byDate;
    });
  }, [activeEvents, city, conservatoriumInstruments, conservatoriums, dateFrom, dateTo, distance, instrument, userLocation]);

  const availableSlots = useMemo(() => {
    if (!activeEvent) return [] as string[];

    const slots: string[] = [];
    let currentTime = setMinutes(
      setHours(new Date(activeEvent.date), Number(activeEvent.startTime.split(':')[0])),
      Number(activeEvent.startTime.split(':')[1])
    );
    const endTime = setMinutes(
      setHours(new Date(activeEvent.date), Number(activeEvent.endTime.split(':')[0])),
      Number(activeEvent.endTime.split(':')[1])
    );

    while (isBefore(currentTime, endTime)) {
      const slotIso = currentTime.toISOString();
      const isBooked = openDayAppointments.some((item) => item.eventId === activeEvent.id && item.appointmentTime === slotIso);
      if (!isBooked) slots.push(slotIso);
      currentTime = add(currentTime, { minutes: activeEvent.appointmentDuration });
    }

    return slots;
  }, [activeEvent, openDayAppointments]);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeEvent || !selectedTime) {
      toast({ variant: 'destructive', title: t('missingDetails'), description: t('missingDetailsDesc') });
      return;
    }

    const formData = new FormData(event.currentTarget);
    addOpenDayAppointment({
      eventId: activeEvent.id,
      familyName: String(formData.get('familyName') || ''),
      parentEmail: String(formData.get('parentEmail') || ''),
      parentPhone: String(formData.get('parentPhone') || ''),
      childName: String(formData.get('childName') || ''),
      childAge: Number(formData.get('childAge') || 0),
      instrumentInterest: String(formData.get('instrumentInterest') || ''),
      appointmentTime: selectedTime,
    });

    setIsSubmitted(true);
  };

  if (activeEvents.length === 0) {
    return <div className="py-20 text-center">{t('noOpenDays')}</div>;
  }

  if (isSubmitted) {
    return (
      <Card className="mx-auto my-20 w-full max-w-2xl text-center shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
        <CardContent className="flex flex-col items-center space-y-4 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t('successTitle')}</h2>
          <p className="max-w-md text-muted-foreground">{t('successDesc')}</p>
          <Button className="mt-4" onClick={() => window.location.assign('/')}>{t('backToHome')}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden text-white">
        <Image
          src="/images/open-day-hero-vibrant.jpg"
          alt="Children discovering music at an open day"
          fill
          style={{ objectFit: 'cover' }}
          className="z-0"
          priority
        />
        <div className="absolute inset-0 bg-black/55 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-indigo-900/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-teal-900/20 z-10" />

        <style>{`
          @keyframes openDayUp {
            from { opacity: 0; transform: translateY(32px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          .od-hero-1 { animation: openDayUp 0.8s ease-out 0.1s both; }
          .od-hero-2 { animation: openDayUp 0.8s ease-out 0.3s both; }
          .od-hero-3 { animation: openDayUp 0.8s ease-out 0.5s both; }
          .od-hero-cta { animation: openDayUp 0.8s ease-out 0.7s both; }
          .sparkle-1 { animation: sparkle 2s ease-in-out infinite; animation-delay: 0s; }
          .sparkle-2 { animation: sparkle 2s ease-in-out infinite; animation-delay: 0.7s; }
          .sparkle-3 { animation: sparkle 2s ease-in-out infinite; animation-delay: 1.4s; }
          @keyframes cardSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .feature-chip { animation: cardSlideUp 0.5s ease-out forwards; opacity: 0; }
          .feature-chip:nth-child(1) { animation-delay: 0.1s; }
          .feature-chip:nth-child(2) { animation-delay: 0.2s; }
          .feature-chip:nth-child(3) { animation-delay: 0.3s; }
          .feature-chip:nth-child(4) { animation-delay: 0.4s; }
          .event-card-enter { animation: cardSlideUp 0.5s ease-out both; }
          .event-card-enter:nth-child(1) { animation-delay: 0.05s; }
          .event-card-enter:nth-child(2) { animation-delay: 0.15s; }
          .event-card-enter:nth-child(3) { animation-delay: 0.25s; }
          .event-card-enter:nth-child(4) { animation-delay: 0.35s; }
        `}</style>

        {/* Sparkle decorations */}
        <div className="absolute top-20 start-16 text-yellow-300 text-3xl sparkle-1 z-20 select-none">✦</div>
        <div className="absolute top-32 end-24 text-teal-300 text-2xl sparkle-2 z-20 select-none">✦</div>
        <div className="absolute top-48 start-1/3 text-purple-300 text-xl sparkle-3 z-20 select-none">✦</div>

        <div className="relative z-20 px-4 py-24 max-w-5xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="od-hero-1 inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-400/10 px-5 py-2 text-sm text-teal-200 backdrop-blur-sm">
            <Calendar className="h-4 w-4" />
            {t('openDayBadge', { fallback: 'ימים פתוחים ברחבי הארץ' })}
          </div>

          <h1 className="od-hero-2 text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
            {t('heroTitle')}
          </h1>

          <p className="od-hero-3 max-w-2xl mx-auto text-lg md:text-xl text-white/85 leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Feature chips */}
          <div className="od-hero-cta flex flex-wrap justify-center gap-3 pt-2">
            {[
              { icon: '🎵', label: t('featureChip1', { fallback: 'נסו כלי נגינה' }) },
              { icon: '👩‍🏫', label: t('featureChip2', { fallback: 'הכירו מורים' }) },
              { icon: '🎓', label: t('featureChip3', { fallback: 'גלו תוכניות לימוד' }) },
              { icon: '🆓', label: t('featureChip4', { fallback: 'כניסה חופשית' }) },
            ].map(({ icon, label }) => (
              <span key={label} className="feature-chip inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur-sm border border-white/20">
                <span>{icon}</span> {label}
              </span>
            ))}
          </div>

          <div className="od-hero-cta flex flex-wrap justify-center gap-4 pt-2">
            <Button size="lg" className="bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg px-8 py-6 shadow-lg shadow-teal-500/30 transition-all hover:scale-105 rounded-full" asChild>
              <a href="#events">{t('registerBtn')}</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-12 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="mb-12 space-y-4 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">{t('featuresTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-12 text-center md:grid-cols-3">
            <FeatureCard icon={<Users className="h-8 w-8 text-primary" />} title={t('feature1Title')} description={t('feature1Desc')} />
            <FeatureCard icon={<Guitar className="h-8 w-8 text-primary" />} title={t('feature2Title')} description={t('feature2Desc')} />
            <FeatureCard icon={<Music className="h-8 w-8 text-primary" />} title={t('feature3Title')} description={t('feature3Desc')} />
          </div>
        </div>
      </section>

      {/* How open day works */}
      <section className="bg-gradient-to-br from-indigo-50/50 to-teal-50/30 py-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-center mb-8">{t('howItWorksTitle', { fallback: 'מה קורה ביום פתוח?' })}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: <Guitar className="h-6 w-6 text-teal-600" />, title: t('step1Title', { fallback: 'נסו כלים' }), desc: t('step1Desc', { fallback: 'ניסיון חופשי עם מגוון כלי נגינה.' }) },
              { step: '02', icon: <Users className="h-6 w-6 text-indigo-600" />, title: t('step2Title', { fallback: 'הכירו מורים' }), desc: t('step2Desc', { fallback: 'שיחה אישית עם מורים ומנהל הקונסרבטוריון.' }) },
              { step: '03', icon: <Music className="h-6 w-6 text-purple-600" />, title: t('step3Title', { fallback: 'הרשמו לשיעור ניסיון' }), desc: t('step3Desc', { fallback: 'קבלת שיעור ניסיון חינמי ממורה מקצועי.' }) },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex gap-4 rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur-sm">
                <div>
                  <div className="text-3xl font-black text-muted-foreground/20 leading-none mb-2">{step}</div>
                  <div className="rounded-xl bg-muted/60 p-2.5 w-fit">{icon}</div>
                </div>
                <div>
                  <h3 className="font-bold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24" id="events">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="mb-8 space-y-4 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">{t('formTitle')}</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">{t('formSubtitle')}</p>
          </div>

          {!activeEvent ? (
            <div className="space-y-6">
              <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-5">
                <Select value={city} onValueChange={setCity} dir={isRtl ? 'rtl' : 'ltr'}>
                  <SelectTrigger><SelectValue placeholder={t('filterCity')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allCities')}</SelectItem>
                    {cityOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={distance} onValueChange={setDistance} dir={isRtl ? 'rtl' : 'ltr'}>
                  <SelectTrigger><SelectValue placeholder={t('filterDistance')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allDistances')}</SelectItem>
                    <SelectItem value="10">{t('distance10')}</SelectItem>
                    <SelectItem value="25">{t('distance25')}</SelectItem>
                    <SelectItem value="50">{t('distance50')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={instrument} onValueChange={setInstrument} dir={isRtl ? 'rtl' : 'ltr'}>
                  <SelectTrigger><SelectValue placeholder={t('filterInstrument')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allInstruments')}</SelectItem>
                    {instrumentOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Input type="date" dir="ltr" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label={t('dateFrom')} />
                <Input type="date" dir="ltr" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label={t('dateTo')} />

                <Button type="button" variant="outline" onClick={handleLocate} disabled={locating}>
                  <LocateFixed className="me-2 h-4 w-4" />
                  {locating ? t('locating') : t('useMyLocation')}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event) => {
                  const cons = conservatoriums.find((item) => item.id === event.conservatoriumId);
                  return (
                    <Card key={event.id} className="event-card-enter flex cursor-pointer flex-col transition-colors hover:border-primary" onClick={() => setSelectedEventId(event.id)}>
                      <CardHeader>
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <CardDescription>{cons?.name}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                        <p className="flex items-center"><Calendar className="me-2 h-4 w-4" />{format(new Date(event.date), 'dd/MM/yyyy', { locale: dateLocale })}</p>
                        <p className="flex items-center"><Clock className="me-2 h-4 w-4" />{event.startTime} - {event.endTime}</p>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" variant="outline">{t('selectOpenDay')}</Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>

              {filteredEvents.length === 0 && (
                <div className="rounded-lg border bg-muted/20 py-12 text-center text-muted-foreground">
                  <p>{t('noEventsForFilters')}</p>
                </div>
              )}
            </div>
          ) : (
            <Card className="relative mx-auto max-w-4xl">
              <Button
                variant="ghost"
                className="absolute end-4 top-4 text-muted-foreground"
                onClick={() => {
                  setSelectedEventId(null);
                  setSelectedTime('');
                }}
              >
                {t('backToList')}
              </Button>
              <form onSubmit={handleSubmit}>
                <CardHeader className="mb-6 border-b pb-6 pt-12 text-center">
                  <CardTitle>
                    {t('registerForEvent', { name: activeEvent.name })}
                    <br />
                    <span className="mt-2 block text-xl text-primary">{conservatoriums.find((item) => item.id === activeEvent.conservatoriumId)?.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-8 p-6 md:grid-cols-2">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">{t('registrationDetails')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="familyName">{t('familyName')}</Label><Input id="familyName" name="familyName" required /></div>
                      <div className="space-y-2"><Label htmlFor="parentEmail">{t('parentEmail')}</Label><Input id="parentEmail" name="parentEmail" type="email" required /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="parentPhone">{t('parentPhone')}</Label><Input id="parentPhone" name="parentPhone" type="tel" required /></div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="childName">{t('childName')}</Label><Input id="childName" name="childName" required /></div>
                      <div className="space-y-2"><Label htmlFor="childAge">{t('childAge')}</Label><Input id="childAge" name="childAge" type="number" required /></div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instrumentInterest">{t('instrumentInterest')}</Label>
                      <Select dir={isRtl ? 'rtl' : 'ltr'} name="instrumentInterest" required>
                        <SelectTrigger><SelectValue placeholder={t('selectInstrument')} /></SelectTrigger>
                        <SelectContent>{instrumentOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">{t('selectTime')}</h3>
                    <RadioGroup value={selectedTime} onValueChange={setSelectedTime} className="max-h-96 overflow-y-auto rounded-md border p-1">
                      {availableSlots.length > 0 ? (
                        availableSlots.map((slot) => (
                          <Label key={slot} htmlFor={slot} className="flex cursor-pointer items-center rounded-md p-3 hover:bg-muted has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                            <RadioGroupItem value={slot} id={slot} className="hidden" />
                            <Clock className="me-3 h-4 w-4" />
                            <span className="font-mono text-lg">{format(new Date(slot), 'HH:mm')}</span>
                          </Label>
                        ))
                      ) : (
                        <p className="p-8 text-center text-muted-foreground">{t('noSlots')}</p>
                      )}
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" size="lg" className="w-full">{t('submit')}</Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
