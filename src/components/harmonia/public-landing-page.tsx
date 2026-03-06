'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useMemo, useState } from 'react';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { getLocalizedConservatorium, getLocalizedUserProfile } from '@/lib/utils/localized-content';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Conservatorium, ConservatoriumInstrument, EventProduction, User } from '@/lib/types';
import { Search, ClipboardList, Music, CalendarDays, CalendarClock, UserRound, Star } from 'lucide-react';
import { collectInstrumentTokensFromConservatoriumInstrument, collectInstrumentTokensFromTeacherInstrument, tokenSetsIntersect } from '@/lib/instrument-matching';

const LANDING_HERO_IMAGE =
  'https://images.unsplash.com/photo-1460036521480-ff49c08c2781?q=80&w=2200&auto=format&fit=crop';

export function PublicLandingPage() {
  const t = useTranslations('Landing');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const router = useRouter();
  const { conservatoriums, conservatoriumInstruments, users, events } = useAuth();

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [instrumentId, setInstrumentId] = useState('');

  const placeholderImageMap = useMemo(
    () => new Map(PlaceHolderImages.map((image) => [image.id, image.imageUrl])),
    []
  );

  const resolveAvatarUrl = (value?: string) => {
    if (!value) return undefined;
    if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
    return placeholderImageMap.get(value);
  };

  const uniqueConservatoriums = useMemo(() => {
    const unique = new Map<string, Conservatorium>();
    for (const item of conservatoriums) {
      if (!unique.has(item.id)) unique.set(item.id, item);
    }
    return Array.from(unique.values()).map((item) => getLocalizedConservatorium(item, locale));
  }, [conservatoriums, locale]);

  const featuredConservatoriums = useMemo(() => uniqueConservatoriums.slice(0, 3), [uniqueConservatoriums]);

  const platformInstruments = useMemo(() => {
    const unique = new Map<string, ConservatoriumInstrument>();

    conservatoriumInstruments
      .filter((inst) => inst.isActive && inst.availableForRegistration)
      .forEach((inst) => {
        if (!unique.has(inst.id)) {
          unique.set(inst.id, inst);
        }
      });

    return Array.from(unique.values());
  }, [conservatoriumInstruments]);

  const featuredTeachers = useMemo(() => {
    const seen = new Set<string>();
    const cityQuery = city.trim().toLowerCase();
    const selectedInstrument = conservatoriumInstruments.find((inst) => inst.id === instrumentId);
    const selectedInstrumentTokens = selectedInstrument
      ? collectInstrumentTokensFromConservatoriumInstrument(selectedInstrument)
      : new Set<string>();

    const conservatoriumCityById = new Map(
      uniqueConservatoriums.map((cons) => [cons.id, (cons.location?.city || '').toLowerCase()])
    );

    const teachers = users
      .filter((user) => user.role === 'teacher' && user.approved)
      .map((user) => getLocalizedUserProfile(user, locale) as User & { localizedRole?: string; localizedBio?: string })
      .filter((user) => {
        if (seen.has(user.id)) return false;
        seen.add(user.id);
        return user.availableForNewStudents !== false;
      })
      .map((teacher) => {
        const teacherTokens = new Set<string>();
        (teacher.instruments || []).forEach((item) => {
          collectInstrumentTokensFromTeacherInstrument(
            item.instrument,
            conservatoriumInstruments,
            teacher.conservatoriumId
          ).forEach((token) => teacherTokens.add(token));
        });

        const hasInstrumentMatch =
          selectedInstrumentTokens.size === 0 || tokenSetsIntersect(selectedInstrumentTokens, teacherTokens);

        const teacherCity = (teacher.city || '').toLowerCase();
        const conservatoriumCity = conservatoriumCityById.get(teacher.conservatoriumId) || '';
        const hasCityMatch = !cityQuery || teacherCity.includes(cityQuery) || conservatoriumCity.includes(cityQuery);

        let score = 0;
        if (teacher.availableForNewStudents !== false) score += 80;
        if (hasInstrumentMatch && selectedInstrumentTokens.size > 0) score += 40;
        if (hasCityMatch && cityQuery) score += 30;
        if (Array.isArray(teacher.availability) && teacher.availability.length > 0) score += 20;
        if (typeof teacher.teacherRatingAvg === 'number') score += teacher.teacherRatingAvg * 15;
        if (typeof teacher.teacherRatingCount === 'number') score += Math.min(teacher.teacherRatingCount, 20);
        if ((teacher.localizedBio || teacher.bio || '').trim().length > 0) score += 10;
        if (teacher.avatarUrl) score += 8;
        if (Array.isArray(teacher.education) && teacher.education.length > 0) score += 5;

        return {
          teacher,
          score,
          hasCityMatch,
          hasInstrumentMatch,
        };
      })
      .filter((item) => item.hasCityMatch && item.hasInstrumentMatch)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.teacher);

    return teachers.slice(0, 4);
  }, [users, locale, city, instrumentId, conservatoriumInstruments, uniqueConservatoriums]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => {
        const when = new Date(event.eventDate);
        return Number.isFinite(when.getTime()) && when >= now;
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 3);
  }, [events]);

  const testimonials = useMemo(() => [t('testimonial1'), t('testimonial2'), t('testimonial3')], [t]);

  const stats = useMemo(
    () => ({
      conservatoriumCount: uniqueConservatoriums.length,
      totalLessons: 450000,
      parentSatisfaction: 75,
      studentCount: users.filter((user) => user.role === 'student').length,
    }),
    [uniqueConservatoriums.length, users]
  );

  const getInstrumentLabel = (item: ConservatoriumInstrument) => {
    if (locale === 'he') return item.names.he;
    if (locale === 'ar') return item.names.ar || item.names.en;
    if (locale === 'ru') return item.names.ru || item.names.en;
    return item.names.en;
  };

  const getEventTitle = (event: EventProduction) => {
    if (locale === 'he') return event.title?.he || event.name;
    if (locale === 'ar') return event.title?.ar || event.title?.en || event.name;
    if (locale === 'ru') return event.title?.ru || event.title?.en || event.name;
    return event.title?.en || event.name;
  };

  const handleSearch = () => {
    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (city.trim()) query.set('city', city.trim());
    if (instrumentId.trim()) query.set('instrument', instrumentId.trim());
    const suffix = query.toString();
    router.push(suffix ? '/about?' + suffix : '/about');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <PublicNavbar />

      <main className="flex-1 pt-14 text-start">
        <section className="relative overflow-hidden border-b">
          <Image src={LANDING_HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/55" />

          <div className="relative mx-auto flex min-h-[90vh] max-w-6xl items-center justify-center px-4 py-16">
            <div className="max-w-3xl text-center text-white">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">{t('heroTitle')}</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 md:text-lg">{t('heroSubtitle')}</p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button size="lg" asChild>
                  <Link href="/register">{t('registerCta')}</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white bg-white/10 text-white hover:bg-white/20"
                  asChild
                >
                  <Link href="/about">{t('findConservatory')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-background px-4 py-6">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold">{stats.conservatoriumCount}</p>
              <p className="text-xs text-muted-foreground">{t('statConservatories')}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold">{stats.totalLessons.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t('statLessons')}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold">{stats.parentSatisfaction}%</p>
              <p className="text-xs text-muted-foreground">{t('statSatisfaction')}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-2xl font-bold">+{stats.studentCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t('statStudents')}</p>
            </div>
          </div>
        </section>

        <section className="bg-muted/20 px-4 py-14">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold">{t('findTitle')}</h2>
              <p className="mt-2 text-muted-foreground">{t('findSubtitle')}</p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_180px_180px_auto]">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchPlaceholder')} />
              <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder={t('cityPlaceholder')} />
              <select
                value={instrumentId}
                onChange={(event) => setInstrumentId(event.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">{t('instrumentPlaceholder')}</option>
                {platformInstruments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {getInstrumentLabel(inst)}
                  </option>
                ))}
              </select>
              <Button onClick={handleSearch}>
                <Search className="me-2 h-4 w-4" />
                {t('search')}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredConservatoriums.map((cons) => (
                <Card key={cons.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-2 text-base">{cons.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p>{cons.location?.city}</p>
                    <p className="line-clamp-2">{cons.about || t('conservatoryFallback')}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button variant="outline" asChild>
                <Link href="/about">{t('viewAll', { count: uniqueConservatoriums.length })}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/20 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 text-center text-3xl font-bold">{t('howItWorksTitle')}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { step: 1, icon: Search, title: t('step1Title'), desc: t('step1Desc') },
                { step: 2, icon: ClipboardList, title: t('step2Title'), desc: t('step2Desc') },
                { step: 3, icon: Music, title: t('step3Title'), desc: t('step3Desc') },
              ].map(({ step, icon: Icon, title, desc }) => (
                <Card key={step} className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="mb-1 text-sm text-muted-foreground">0{step}</p>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 text-center text-3xl font-bold">{t('featuredTeachersTitle')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredTeachers.map((teacher) => (
                <Card key={teacher.id}>
                  <CardContent className="p-5 text-center">
                    <Avatar className="mx-auto h-20 w-20">
                      <AvatarImage src={resolveAvatarUrl(teacher.avatarUrl)} alt={teacher.name} />
                      <AvatarFallback>
                        <UserRound className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="mt-3 font-semibold">{teacher.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{teacher.localizedRole || teacher.role || t('teacherFallback')}</p>
                    {typeof teacher.teacherRatingAvg === 'number' && (teacher.teacherRatingCount || 0) > 0 && (
                      <p className="mt-2 flex items-center justify-center gap-1 text-sm text-amber-600">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{teacher.teacherRatingAvg.toFixed(1)} ({teacher.teacherRatingCount})</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/20 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 text-center text-3xl font-bold">{t('upcomingEventsTitle')}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-2 text-base">{getEventTitle(event)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      {new Date(event.eventDate).toLocaleDateString(locale)}
                    </p>
                    <p className="line-clamp-1">{event.venue}</p>
                  </CardContent>
                </Card>
              ))}
              {upcomingEvents.length === 0 && (
                <Card className="md:col-span-3">
                  <CardContent className="p-6 text-center text-muted-foreground">{t('openDaysFallback')}</CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        <section className="border-b px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 text-center text-3xl font-bold">{t('testimonialsTitle')}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {testimonials.map((quote, index) => (
                <Card key={'quote-' + index}>
                  <CardContent className="p-6">
                    <p className="text-sm leading-relaxed text-muted-foreground">{quote}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 rounded-xl border bg-card p-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-2xl font-bold">{t('donateTitle')}</h3>
              <p className="mt-1 text-muted-foreground">{t('donateSubtitle')}</p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/donate">{t('donateCta')}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/open-day">
                  <CalendarDays className="me-2 h-4 w-4" />
                  {t('openDaysCta')}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
