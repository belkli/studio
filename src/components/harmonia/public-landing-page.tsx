'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useMemo, useState, useEffect } from 'react';
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
import { Search, ClipboardList, Music, Music2, CalendarDays, CalendarClock, UserRound, Star, Building2, HeartHandshake, GraduationCap, ChevronLeft, Info } from 'lucide-react';
import { collectInstrumentTokensFromConservatoriumInstrument, collectInstrumentTokensFromTeacherInstrument, tokenSetsIntersect } from '@/lib/instrument-matching';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LANDING_HERO_IMAGE = '/images/landing-hero.jpg';

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

  /**
   * Teacher recommendation score:
   * +80  availableForNewStudents
   * +20  has availability slots defined
   * +teacherRatingAvg * 15  (quality signal — populated by admin after reviews)
   * +min(teacherRatingCount, 20)  (popularity signal)
   * +10  has bio (profile completeness)
   * +8   has avatar (profile completeness)
   * +5   has education entries
   * +40  instrument match with user's search
   * +30  city match with user's location
   *
   * How ratings are set: conservatorium_admin reviews teacher performance quarterly
   * and sets teacherRatingAvg in the admin panel. Future: student reviews after lessons.
   */
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

  const stats = useMemo(
    () => ({
      conservatoriumCount: uniqueConservatoriums.length,
      totalLessons: 450000,
      parentSatisfaction: 75,
      studentCount: users.filter((user) => user.role === 'student').length,
    }),
    [uniqueConservatoriums.length, users]
  );

  // Intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.section-animate').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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
        <style>{`
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideInFromStart {
    from { opacity: 0; transform: translateX(-24px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-fade-in-up { animation: fadeInUp 0.7s ease-out forwards; }
  .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
  .animate-slide-in { animation: slideInFromStart 0.6s ease-out forwards; }
  .animate-delay-100 { animation-delay: 0.1s; opacity: 0; }
  .animate-delay-200 { animation-delay: 0.2s; opacity: 0; }
  .animate-delay-300 { animation-delay: 0.3s; opacity: 0; }
  .animate-delay-400 { animation-delay: 0.4s; opacity: 0; }
  .animate-delay-500 { animation-delay: 0.5s; opacity: 0; }
  .section-animate { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
  .section-animate.in-view { opacity: 1; transform: translateY(0); }
`}</style>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b" aria-labelledby="hero-heading">
          <Image src={LANDING_HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent animate-pulse" style={{ animationDuration: '4s' }} />

          <div className="relative mx-auto flex min-h-[88vh] max-w-6xl items-center justify-center px-4 py-16">
            <div className="max-w-3xl text-center text-white">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm animate-fade-in">
                <Music className="h-4 w-4" />
                {t('heroBadge')}
              </div>
              <h1 id="hero-heading" className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl animate-fade-in-up animate-delay-200">
                {t('heroTitle')}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 md:text-lg animate-fade-in-up animate-delay-300">{t('heroSubtitle')}</p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in-up animate-delay-400">
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

        {/* Stats Bar */}
        <section className="border-y bg-primary px-4 py-8" aria-label={t('statConservatories')}>
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-0 divide-x divide-white/20 md:grid-cols-4">
            {[
              { value: stats.conservatoriumCount, label: t('statConservatories') },
              { value: stats.totalLessons.toLocaleString(), label: t('statLessons') },
              { value: `${stats.parentSatisfaction}%`, label: t('statSatisfaction') },
              { value: `+${stats.studentCount.toLocaleString()}`, label: t('statStudents') },
            ].map(({ value, label }) => (
              <div key={label} className="px-6 py-2 text-center first:ps-0 last:pe-0 section-animate">
                <p className="text-3xl font-extrabold text-white">{value}</p>
                <p className="mt-1 text-sm text-white/70">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Find a Conservatory Section */}
        <section id="find" className="bg-muted/20 px-4 py-14" aria-labelledby="find-heading">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="text-center">
              <h2 id="find-heading" className="text-3xl font-bold">{t('findTitle')}</h2>
              <p className="mt-2 text-muted-foreground">{t('findSubtitle')}</p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_180px_180px_auto]">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')} />
              <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder={t('cityPlaceholder')} aria-label={t('cityPlaceholder')} />
              <select
                value={instrumentId}
                onChange={(event) => setInstrumentId(event.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
                aria-label={t('instrumentPlaceholder')}
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 section-animate">
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

        {/* How It Works Section */}
        <section id="how" className="border-y bg-muted/20 px-4 py-14" aria-labelledby="how-heading">
          <div className="mx-auto max-w-6xl">
            <h2 id="how-heading" className="mb-10 text-center text-3xl font-bold">{t('howItWorksTitle')}</h2>
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

        {/* Featured Teachers Section */}
        <section className="px-4 py-14" aria-labelledby="teachers-heading">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex items-center justify-center gap-2">
              <h2 id="teachers-heading" className="text-center text-3xl font-bold">{t('featuredTeachersTitle')}</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                      <span className="sr-only">{t('recommendedTeachersTooltip')}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm">
                    {t('recommendedTeachersTooltip')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 section-animate">
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
                    <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                      <Link href="/register">{t('bookTrialLesson')}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Persona Cards Section */}
        <section className="bg-gradient-to-br from-primary/8 to-amber-50/50 px-4 py-16" aria-labelledby="personas-heading">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 id="personas-heading" className="text-3xl font-bold">{t('personasTitle')}</h2>
              <p className="mt-2 text-muted-foreground">{t('personasSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 section-animate">
              {[
                { icon: Building2, title: t('personaAdminTitle'), desc: t('personaAdminDesc'), href: '/register' },
                { icon: Music2, title: t('personaTeacherTitle'), desc: t('personaTeacherDesc'), href: '/register' },
                { icon: HeartHandshake, title: t('personaParentTitle'), desc: t('personaParentDesc'), href: '/register' },
                { icon: GraduationCap, title: t('personaStudentTitle'), desc: t('personaStudentDesc'), href: '/register' },
              ].map(({ icon: Icon, title, desc, href }) => (
                <Card key={title} className="group border-0 bg-white/80 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 font-bold text-foreground">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                    <Button variant="ghost" size="sm" className="mt-3 px-0 text-primary" asChild>
                      <Link href={href}>{t('personaCta')} <ChevronLeft className="ms-1 h-3 w-3" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Events Section */}
        <section className="border-y bg-muted/20 px-4 py-14" aria-labelledby="events-heading">
          <div className="mx-auto max-w-6xl">
            <h2 id="events-heading" className="mb-10 text-center text-3xl font-bold">{t('upcomingEventsTitle')}</h2>
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

        {/* Testimonials Section */}
        <section className="border-b px-4 py-14" aria-labelledby="testimonials-heading">
          <div className="mx-auto max-w-6xl">
            <h2 id="testimonials-heading" className="mb-10 text-center text-3xl font-bold">{t('testimonialsTitle')}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { quote: t('testimonial1'), author: t('testimonialAuthor1'), role: t('testimonialRole1') },
                { quote: t('testimonial2'), author: t('testimonialAuthor2'), role: t('testimonialRole2') },
                { quote: t('testimonial3'), author: t('testimonialAuthor3'), role: t('testimonialRole3') },
              ].map(({ quote, author, role }, index) => (
                <Card key={'quote-' + index} className="border-0 bg-muted/40">
                  <CardContent className="p-6">
                    <p className="mb-4 text-2xl text-primary/30 leading-none">&quot;</p>
                    <p className="text-sm leading-relaxed text-foreground">{quote}</p>
                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm font-semibold">{author}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Donate / Open Days CTA Section */}
        <section className="px-4 py-14" aria-labelledby="donate-heading">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 rounded-xl border bg-card p-6 md:flex-row md:items-center">
            <div>
              <h3 id="donate-heading" className="text-2xl font-bold">{t('donateTitle')}</h3>
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
