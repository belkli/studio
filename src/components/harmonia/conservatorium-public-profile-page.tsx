'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/hooks/use-auth';
import type { Conservatorium, ConservatoriumInstrument, User } from '@/lib/types';
import { getLocalizedConservatorium, getLocalizedUserProfile } from '@/lib/utils/localized-content';
import { buildConservatoriumSlug } from '@/lib/utils/conservatorium-slug';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Facebook, Globe, Instagram, Mail, MapPin, Phone, UserRound, Youtube } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type PublicProfile = {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  photoUrl?: string;
  instruments: string[];
  education?: string[];
  email?: string;
  phone?: string;
  teacherUserId?: string;
  availableForNewStudents?: boolean;
  source: 'teacher' | 'manager' | 'staff';
};

type ConservatoriumPublicProfilePageProps = {
  conservatoriumId: string | null;
  slug: string;
};

function getInstrumentName(inst: ConservatoriumInstrument, locale: string) {
  if (locale === 'he') return inst.names.he;
  if (locale === 'ar') return inst.names.ar || inst.names.en;
  if (locale === 'ru') return inst.names.ru || inst.names.en;
  return inst.names.en;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function looksCorruptedText(value?: string) {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^\?+$/.test(trimmed) || trimmed.includes('???')) return true;
  if (trimmed.includes('\uFFFD')) return true;
  if (/[\u00D0\u00D9\u00D7]/.test(trimmed)) return true;
  return false;
}

function getRoleLabel(role: string | undefined, locale: string) {
  if (!role || looksCorruptedText(role)) return undefined;
  const normalized = role.trim().toLowerCase();
  if (normalized === 'teacher') {
    if (locale === 'en') return 'Teacher';
    return undefined;
  }
  return role;
}

function getInstrumentLabelFromToken(token: string, locale: string) {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return '';
  if (looksCorruptedText(token)) return '';
  if (locale !== 'en' && /^[a-z0-9_ -]+$/i.test(normalized)) return '';
  return token;
}

function getLocalizedUserBio(user: User, locale: string) {
  if (locale === 'en') return user.translations?.en?.bio || user.bio;
  if (locale === 'ar') return user.translations?.ar?.bio || user.translations?.en?.bio || user.bio;
  if (locale === 'ru') return user.translations?.ru?.bio || user.translations?.en?.bio || user.bio;
  return user.bio;
}

function buildTeacherInstruments(teacher: User, allInstruments: ConservatoriumInstrument[], locale: string) {
  const names = (teacher.instruments || []).map((item) => {
    const match = allInstruments.find((inst) => inst.names.he === item.instrument || inst.names.en === item.instrument || inst.instrumentCatalogId === item.instrument || inst.id === item.instrument);
    if (match) return getInstrumentName(match, locale);
    return getInstrumentLabelFromToken(item.instrument, locale);
  });
  return Array.from(new Set(names.filter(Boolean)));
}

function getProgramLabel(program: unknown, locale: string): string {
  if (typeof program === 'string') return program;
  if (!program || typeof program !== 'object' || Array.isArray(program)) return '';

  const record = program as Record<string, unknown>;
  const nameField = record.name;

  if (typeof nameField === 'string') return nameField;
  if (nameField && typeof nameField === 'object' && !Array.isArray(nameField)) {
    const nameByLocale = nameField as Record<string, unknown>;
    const localized =
      (typeof nameByLocale[locale] === 'string' && String(nameByLocale[locale])) ||
      (typeof nameByLocale.he === 'string' && String(nameByLocale.he)) ||
      (typeof nameByLocale.en === 'string' && String(nameByLocale.en));
    if (localized) return localized;
  }

  if (typeof record.note === 'string' && record.note) return record.note;
  return '';
}

function getProgramKey(consId: string, program: unknown, index: number, locale: string): string {
  const label = getProgramLabel(program, locale);
  if (label) return `${consId}-${label}-${index}`;
  return `${consId}-program-${index}`;
}

export function ConservatoriumPublicProfilePage({ conservatoriumId, slug }: ConservatoriumPublicProfilePageProps) {
  const t = useTranslations('AboutPage');
  const tAbout = useTranslations('About');
  const tCommon = useTranslations('Common.shared');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { conservatoriums, conservatoriumInstruments, users } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);

  const localizedConservatoriums = useMemo(() => {
    const uniqueById = new Map<string, Conservatorium>();
    for (const item of conservatoriums) {
      if (!uniqueById.has(item.id)) uniqueById.set(item.id, item);
    }
    return Array.from(uniqueById.values()).map((item) => getLocalizedConservatorium(item, locale));
  }, [conservatoriums, locale]);

  const selectedCons = useMemo(() => {
    if (!conservatoriumId) return null;
    return localizedConservatoriums.find((item) => item.id === conservatoriumId) || null;
  }, [localizedConservatoriums, conservatoriumId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedProfile(null);
  }, [selectedCons?.id]);

  const localizedTeachers = useMemo(() => {
    const unique = new Map<string, User>();
    for (const user of users) {
      if (user.role !== 'teacher' || !user.approved) continue;
      if (!unique.has(user.id)) unique.set(user.id, getLocalizedUserProfile(user, locale));
    }
    return Array.from(unique.values());
  }, [users, locale]);

  const platformInstruments = useMemo(() => {
    const unique = new Map<string, ConservatoriumInstrument>();
    conservatoriumInstruments
      .filter((inst) => inst.isActive && inst.availableForRegistration)
      .forEach((inst) => {
        if (!unique.has(inst.id)) unique.set(inst.id, inst);
      });

    return Array.from(unique.values()).sort((a, b) =>
      getInstrumentName(a, 'he').localeCompare(getInstrumentName(b, 'he'), 'he')
    );
  }, [conservatoriumInstruments]);

  const placeholderImageMap = useMemo(
    () => new Map(PlaceHolderImages.map((image) => [image.id, image.imageUrl])),
    []
  );

  const resolveAvatarUrl = (value?: string) => {
    if (!value) return undefined;
    return placeholderImageMap.get(value) || value;
  };

  const selectedConsProfiles = useMemo(() => {
    if (!selectedCons) return [] as PublicProfile[];

    const profiles: PublicProfile[] = [];
    const matchedTeacherIds = new Set<string>();

    const teachersInCons = localizedTeachers.filter((teacher) => teacher.conservatoriumId === selectedCons.id);
    const teacherByName = new Map<string, User>();
    for (const teacher of teachersInCons) {
      teacherByName.set(normalizeName(teacher.name), teacher);
    }

    for (const dirTeacher of selectedCons.teachers || []) {
      const matched = teacherByName.get(normalizeName(dirTeacher.name));
      if (matched) matchedTeacherIds.add(matched.id);

      const instruments = matched
        ? buildTeacherInstruments(matched, platformInstruments, locale)
        : (dirTeacher.instruments || [])
            .map((token) => getInstrumentLabelFromToken(token, locale))
            .filter(Boolean);
      const bio = dirTeacher.bio || (matched ? getLocalizedUserBio(matched, locale) : undefined);
      const normalizedBio = looksCorruptedText(bio) ? undefined : bio;

      profiles.push({
        id: matched?.id || 'dir-' + selectedCons.id + '-' + dirTeacher.name,
        name: dirTeacher.name,
        role: getRoleLabel(dirTeacher.role || matched?.role, locale),
        bio: normalizedBio || undefined,
        photoUrl: resolveAvatarUrl(dirTeacher.photoUrl || matched?.avatarUrl),
        instruments,
        education: matched?.education,
        email: matched?.email,
        phone: matched?.phone,
        teacherUserId: matched?.id,
        availableForNewStudents: matched?.availableForNewStudents,
        source: 'teacher',
      });
    }

    for (const teacher of teachersInCons) {
      if (matchedTeacherIds.has(teacher.id)) continue;
      profiles.push({
        id: teacher.id,
        name: teacher.name,
        role: getRoleLabel(teacher.role, locale),
        bio: looksCorruptedText(getLocalizedUserBio(teacher, locale)) ? undefined : getLocalizedUserBio(teacher, locale),
        photoUrl: resolveAvatarUrl(teacher.avatarUrl),
        instruments: buildTeacherInstruments(teacher, platformInstruments, locale),
        education: teacher.education,
        email: teacher.email,
        phone: teacher.phone,
        teacherUserId: teacher.id,
        availableForNewStudents: teacher.availableForNewStudents,
        source: 'teacher',
      });
    }

    if (selectedCons.manager?.name) {
      profiles.push({
        id: 'manager-' + selectedCons.id,
        name: selectedCons.manager.name,
        role: getRoleLabel(selectedCons.manager.role, locale),
        bio: looksCorruptedText(selectedCons.manager.bio) ? undefined : selectedCons.manager.bio,
        photoUrl: resolveAvatarUrl(selectedCons.manager.photoUrl),
        instruments: [],
        source: 'manager',
      });
    }

    for (const member of selectedCons.leadingTeam || []) {
      profiles.push({
        id: 'team-' + selectedCons.id + '-' + member.name,
        name: member.name,
        role: getRoleLabel(member.role, locale),
        bio: looksCorruptedText(member.bio) ? undefined : member.bio,
        photoUrl: resolveAvatarUrl(member.photoUrl),
        instruments: [],
        source: 'staff',
      });
    }

    const unique = new Map<string, PublicProfile>();
    for (const profile of profiles) {
      const key = profile.source + '-' + normalizeName(profile.name);
      if (!unique.has(key)) unique.set(key, profile);
    }

    return Array.from(unique.values());
  }, [selectedCons, localizedTeachers, platformInstruments, locale]);

  const selectedTeacherGroups = useMemo(() => {
    const groups = new Map<string, PublicProfile[]>();

    for (const profile of selectedConsProfiles.filter((item) => item.source === 'teacher')) {
      const key = profile.instruments[0] || tAbout('instrumentUnknown');
      const list = groups.get(key) || [];
      list.push(profile);
      groups.set(key, list);
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, locale));
  }, [selectedConsProfiles, tAbout, locale]);

  const seoJsonLd = useMemo(() => {
    if (!selectedCons) return null;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://harmonia.co.il';
    const url = siteUrl + '/' + locale + '/about/' + slug;

    return {
      '@context': 'https://schema.org',
      '@type': 'MusicSchool',
      name: selectedCons.name,
      description: selectedCons.about || '',
      url,
      image: selectedCons.photoUrls?.[0],
      telephone: selectedCons.tel,
      email: selectedCons.email,
      address: {
        '@type': 'PostalAddress',
        addressLocality: selectedCons.location?.city,
        streetAddress: selectedCons.location?.address,
      },
      sameAs: [
        selectedCons.officialSite,
        selectedCons.socialMedia?.facebook,
        selectedCons.socialMedia?.instagram,
        selectedCons.socialMedia?.youtube,
      ].filter(Boolean),
      potentialAction: {
        '@type': 'ContactAction',
        target: siteUrl + '/' + locale + '/contact',
      },
    };
  }, [selectedCons, locale, slug]);

  if (!selectedCons) {
    return (
      <div className="flex min-h-dvh flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <PublicNavbar />
        <main className="flex-1 pt-14">
          <section className="px-4 py-20">
            <div className="mx-auto max-w-3xl rounded-xl border bg-card p-8 text-center">
              <h1 className="text-2xl font-bold">{t('noResults')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t('noResultsSub')}</p>
              <Button asChild className="mt-6">
                <Link href="/about">{tCommon('back')}</Link>
              </Button>
            </div>
          </section>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const mappedSlug = buildConservatoriumSlug({ id: selectedCons.id, name: selectedCons.name, nameEn: selectedCons.nameEn });

  return (
    <div className="flex min-h-dvh flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      {seoJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seoJsonLd) }} />
      )}

      <PublicNavbar />

      <main className="flex-1 pt-14 text-start">
        <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background px-4 py-12">
          <div className="mx-auto max-w-6xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" asChild className="ps-2 pe-2">
                <Link href="/about">
                  <ArrowLeft className="me-2 h-4 w-4" />
                  {tCommon('back')}
                </Link>
              </Button>
              <Badge variant="outline">{selectedCons.location?.city || '-'}</Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold md:text-4xl">{selectedCons.name}</h1>
                {selectedCons.about && <p className="max-w-3xl text-muted-foreground">{selectedCons.about}</p>}

                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/contact">{t('contactThisCons')}</Link>
                  </Button>
                  {selectedCons.officialSite && (
                    <Button variant="outline" asChild>
                      <a href={selectedCons.officialSite} target="_blank" rel="noopener noreferrer">{t('officialSite')}</a>
                    </Button>
                  )}
                  {mappedSlug !== slug && (
                    <Button variant="ghost" asChild>
                      <Link href={'/about/' + mappedSlug}>{tCommon('view')}</Link>
                    </Button>
                  )}
                </div>
              </div>

              <Card className="overflow-hidden">
                {selectedCons.photoUrls?.[0] && (
                  <img src={selectedCons.photoUrls[0]} alt={selectedCons.name} className="h-44 w-full object-cover" />
                )}
                {!selectedCons.photoUrls?.[0] && <div className="h-44 w-full bg-muted" />}
                <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
                  {selectedCons.location?.city && (
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{selectedCons.location.address || selectedCons.location.city}</p>
                  )}
                  {selectedCons.tel && (
                    <a href={'tel:' + selectedCons.tel} className="flex items-center gap-2 hover:underline" dir="ltr"><Phone className="h-4 w-4" />{selectedCons.tel}</a>
                  )}
                  {selectedCons.email && (
                    <a href={'mailto:' + selectedCons.email} className="flex items-center gap-2 break-all hover:underline" dir="ltr"><Mail className="h-4 w-4" />{selectedCons.email}</a>
                  )}
                  {selectedCons.officialSite && (
                    <a href={selectedCons.officialSite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 break-all hover:underline" dir="ltr"><Globe className="h-4 w-4" />{selectedCons.officialSite}</a>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('management')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedConsProfiles.filter((profile) => profile.source !== 'teacher').map((profile) => (
                    <button
                      type="button"
                      key={profile.id}
                      onClick={() => setSelectedProfile(profile)}
                      className="flex w-full items-center gap-3 rounded-md border p-2 text-start transition hover:border-primary/40"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.photoUrl} alt={profile.name} />
                        <AvatarFallback>
                          {profile.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.name}</p>
                        {profile.role && <p className="text-xs text-muted-foreground">{profile.role}</p>}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {selectedCons.departments && selectedCons.departments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('departments')}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {selectedCons.departments.map((department) => (
                      <Badge key={selectedCons.id + '-' + department.name} variant="secondary">{department.name}</Badge>
                    ))}
                  </CardContent>
                </Card>
              )}

              {selectedCons.programs && selectedCons.programs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('programs')}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {selectedCons.programs.map((program, index) => {
                      const label = getProgramLabel(program, locale);
                      if (!label) return null;
                      return <Badge key={getProgramKey(selectedCons.id, program, index, locale)} variant="outline">{label}</Badge>;
                    })}
                  </CardContent>
                </Card>
              )}

              {selectedCons.branchesInfo && selectedCons.branchesInfo.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('branches')}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {selectedCons.branchesInfo.map((branch) => (
                      <div key={selectedCons.id + '-' + branch.name + '-' + (branch.address || '')} className="rounded-md border p-3 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{branch.name}</p>
                        {branch.address && <p>{branch.address}</p>}
                        {branch.tel && <p dir="ltr">{branch.tel}</p>}
                        {branch.email && <p dir="ltr">{branch.email}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {selectedCons.socialMedia && (
                <div className="flex items-center gap-3">
                  {selectedCons.socialMedia.facebook && (
                    <a href={selectedCons.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Facebook className="h-4 w-4" /></a>
                  )}
                  {selectedCons.socialMedia.instagram && (
                    <a href={selectedCons.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Instagram className="h-4 w-4" /></a>
                  )}
                  {selectedCons.socialMedia.youtube && (
                    <a href={selectedCons.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Youtube className="h-4 w-4" /></a>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-5">
              {selectedProfile && (
                <Card>
                  <CardHeader className="space-y-3">
                    <Button variant="ghost" className="w-fit ps-2 pe-2" onClick={() => setSelectedProfile(null)}>
                      <ArrowLeft className="me-2 h-4 w-4" />
                      {tCommon('back')}
                    </Button>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={selectedProfile.photoUrl} alt={selectedProfile.name} />
                        <AvatarFallback>
                          <UserRound className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">{selectedProfile.name}</p>
                        {selectedProfile.role && <p className="text-sm text-muted-foreground">{selectedProfile.role}</p>}
                        {selectedProfile.instruments.length > 0 && (
                          <p className="text-sm text-muted-foreground">{selectedProfile.instruments.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {selectedProfile.bio || tAbout('bioUnavailable')}
                    </p>

                    {selectedProfile.education && selectedProfile.education.length > 0 && (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{tAbout('education')}</p>
                        {selectedProfile.education.map((item) => (
                          <p key={selectedProfile.id + '-' + item}>{item}</p>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.phone && (
                        <Button variant="outline" asChild>
                          <a href={'tel:' + selectedProfile.phone} dir="ltr">
                            <Phone className="me-2 h-4 w-4" />
                            {selectedProfile.phone}
                          </a>
                        </Button>
                      )}
                      {selectedProfile.email && (
                        <Button variant="outline" asChild>
                          <a href={'mailto:' + selectedProfile.email} dir="ltr">
                            <Mail className="me-2 h-4 w-4" />
                            {selectedProfile.email}
                          </a>
                        </Button>
                      )}
                      {selectedProfile.source === 'teacher' && selectedProfile.teacherUserId && selectedProfile.availableForNewStudents && (
                        <Button asChild>
                          <Link href={'/register?teacher=' + selectedProfile.teacherUserId + '&conservatorium=' + selectedCons.id}>{tAbout('bookWithTeacher')}</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('teachers', { count: selectedConsProfiles.filter((item) => item.source === 'teacher').length })}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTeacherGroups.map(([instrumentName, profiles]) => (
                    <div key={instrumentName} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{instrumentName}</p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {profiles.map((profile) => (
                          <button
                            type="button"
                            key={profile.id}
                            onClick={() => setSelectedProfile(profile)}
                            className="rounded-md border p-2 text-start transition hover:border-primary/50 hover:shadow-sm"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={profile.photoUrl} alt={profile.name} />
                                <AvatarFallback>
                                  {profile.name
                                    .split(' ')
                                    .map((part) => part[0])
                                    .join('')
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="line-clamp-2 text-xs font-medium">{profile.name}</p>
                                {profile.role && <p className="line-clamp-1 text-[11px] text-muted-foreground">{profile.role}</p>}
                              </div>
                            </div>
                            {profile.instruments.length > 0 && (
                              <p className="line-clamp-1 text-[11px] text-muted-foreground">{profile.instruments.join(', ')}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
