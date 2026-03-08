'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import type { Conservatorium, ConservatoriumInstrument, User } from '@/lib/types';
import { getLocalizedConservatorium, getLocalizedUserProfile } from '@/lib/utils/localized-content';
import { buildConservatoriumSlug } from '@/lib/utils/conservatorium-slug';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import {
  Search,
  MapPin,
  Users,
  Music2,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Youtube,
  ArrowLeft,
  ChevronRight,
  UserRound,
  Star,
  LocateFixed,
  Loader2,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
  teacherConservatoriumId?: string;
  availableForNewStudents?: boolean;
  teacherRatingAvg?: number;
  teacherRatingCount?: number;
  isPremiumTeacher?: boolean;
  spokenLanguages?: string[];
  source: 'teacher' | 'manager' | 'staff';
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

function normalizeForSearch(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function getLocalizedUserBio(user: User, locale: string) {
  if (locale === 'en') return user.translations?.en?.bio || user.bio;
  if (locale === 'ar') return user.translations?.ar?.bio || user.translations?.en?.bio || user.bio;
  if (locale === 'ru') return user.translations?.ru?.bio || user.translations?.en?.bio || user.bio;
  return user.bio;
}

function buildTeacherInstruments(teacher: User, allInstruments: ConservatoriumInstrument[], locale: string) {
  const names = (teacher.instruments || []).map((item) => {
    const match = allInstruments.find(
      (inst) =>
        inst.names.he === item.instrument ||
        inst.names.en === item.instrument ||
        inst.instrumentCatalogId === item.instrument ||
        inst.id === item.instrument
    );
    if (match) return getInstrumentName(match, locale);
    return item.instrument;
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasLocaleConservatoriumTranslation(cons: Conservatorium, locale: string) {
  if (locale === 'he') return true;
  // Accept any conservatorium that has a translations entry OR a top-level nameEn
  // (scraped data stores English name in nameEn, not in translations object)
  if (cons.nameEn) return true;
  const translations = cons.translations as Record<string, unknown> | undefined;
  const byLocale = translations?.[locale] as Record<string, unknown> | undefined;
  if (!byLocale) {
    // No locale-specific translations — still include it; it will display Hebrew as fallback
    return true;
  }

  return (
    isNonEmptyString(byLocale.name) ||
    isNonEmptyString(byLocale.about) ||
    (Array.isArray(byLocale.programs) && byLocale.programs.length > 0) ||
    (Array.isArray(byLocale.departments) && byLocale.departments.length > 0)
  );
}

function conservatoriumQualityScore(cons: Conservatorium) {
  return (
    (cons.about?.trim().length || 0) +
    (cons.departments?.length || 0) * 20 +
    (cons.programs?.length || 0) * 12 +
    (cons.teachers?.length || 0) * 16 +
    (cons.photoUrls?.length || 0) * 10 +
    (cons.tel ? 6 : 0) +
    (cons.email ? 6 : 0) +
    (cons.officialSite ? 8 : 0)
  );
}

function buildConservatoriumDedupKey(cons: Conservatorium) {
  const normalizedName = normalizeName(cons.name || '');
  const normalizedCity = normalizeName(cons.location?.city || '');
  const normalizedSite = normalizeName(cons.officialSite || '');
  const normalizedPhone = normalizeName(cons.tel || '');

  // Require site + city to match — a shared municipal website alone is not enough
  if (normalizedSite && normalizedCity) return `site-city:${normalizedSite}-${normalizedCity}`;
  if (normalizedPhone && normalizedCity) return `phone-city:${normalizedPhone}-${normalizedCity}`;
  return `name-city:${normalizedName}-${normalizedCity}`;
}

const CONSERVATORIUM_FALLBACK_IMAGE_IDS = [
  'donate-hero',
  'musicians-hero',
  'open-day-hero',
  'available-now-hero',
  'student-story-1',
  'student-story-2',
  'student-story-3',
  'event-corporate',
  'event-private',
  'event-wedding',
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getConservatoriumFallbackImage(consId: string, imageById: Map<string, string>) {
  const candidates = CONSERVATORIUM_FALLBACK_IMAGE_IDS
    .map((id) => imageById.get(id))
    .filter((url): url is string => Boolean(url));

  if (candidates.length === 0) return undefined;
  const idx = hashString(consId || 'fallback') % candidates.length;
  return candidates[idx];
}

function ConservatoriumCard({
  cons,
  teacherCount,
  onOpen,
  viewLabel,
  fallbackHeroPhoto,
}: {
  cons: Conservatorium;
  teacherCount: number;
  onOpen: () => void;
  viewLabel: string;
  fallbackHeroPhoto?: string;
}) {
  const heroPhoto = cons.photoUrls?.[0] || fallbackHeroPhoto;

  return (
    <Card className="group overflow-hidden border-border/70 transition hover:border-primary/40 hover:shadow-lg">
      <button type="button" onClick={onOpen} className="w-full text-start">
        <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
          {heroPhoto ? (
            <Image src={heroPhoto} alt={cons.name} fill className="object-cover opacity-80 transition duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music2 className="h-12 w-12 text-primary/35" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent" />
        </div>

        <CardHeader className="space-y-2 pb-2">
          <CardTitle className="line-clamp-2 text-base leading-snug">{cons.name}</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {cons.location?.city || '-'}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {teacherCount}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <p className="line-clamp-3 text-sm text-muted-foreground">{cons.about || ''}</p>

          <div className="flex flex-wrap gap-1.5">
            {(cons.departments || []).slice(0, 3).map((department) => (
              <Badge key={`${cons.id}-${department.name}`} variant="secondary" className="max-w-full truncate text-[11px]">
                {department.name}
              </Badge>
            ))}
            {(cons.departments?.length || 0) > 3 && (
              <Badge variant="outline" className="text-[11px]">+{(cons.departments?.length || 0) - 3}</Badge>
            )}
          </div>

          <div className="flex items-center justify-end border-t pt-2 text-xs text-primary rtl:justify-start">
            <span className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              <span>{viewLabel}</span>
            </span>
          </div>
        </CardContent>
      </button>
    </Card>
  );
}

export default function AboutPage() {
  const t = useTranslations('AboutPage');
  const tAbout = useTranslations('About');
  const tCommon = useTranslations('Common.shared');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const searchParams = useSearchParams();
  const { conservatoriums, conservatoriumInstruments, users } = useAuth();

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [city, setCity] = useState(() => searchParams.get('city') || '');
  const [instrumentId, setInstrumentId] = useState(() => searchParams.get('instrument') || '');
  const [selectedCons, setSelectedCons] = useState<Conservatorium | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const applyLocation = useCallback((pos: GeolocationPosition) => {
    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setCity('');
    setLocating(false);
    setLocationDenied(false);
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      applyLocation,
      (err) => {
        setLocating(false);
        // Only show denied if user explicitly blocked (code 1 = PERMISSION_DENIED)
        if (err.code === 1) setLocationDenied(true);
      },
      { timeout: 10000 }
    );
  }, [applyLocation]);

  // Silently apply location on mount if permission was already granted — no prompt, no denied state
  useEffect(() => {
    if (!navigator.geolocation || !navigator.permissions) return;
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        navigator.geolocation.getCurrentPosition(applyLocation, () => {/* silent fail */});
      }
      // Listen for permission changes (e.g. user grants in browser settings while on page)
      result.onchange = () => {
        if (result.state === 'granted') {
          setLocationDenied(false);
          navigator.geolocation.getCurrentPosition(applyLocation, () => {});
        }
        if (result.state === 'denied') setLocationDenied(true);
      };
    }).catch(() => {/* permissions API not available in this browser */});
  }, [applyLocation]);

  const localizedConservatoriums = useMemo(() => {
    const uniqueById = new Map<string, Conservatorium>();
    for (const item of conservatoriums) {
      if (!uniqueById.has(item.id)) uniqueById.set(item.id, item);
    }

    const byLocalizedIdentity = new Map<string, Conservatorium>();
    for (const rawItem of Array.from(uniqueById.values())) {
      if (!hasLocaleConservatoriumTranslation(rawItem, locale)) continue;

      const localizedItem = getLocalizedConservatorium(rawItem, locale);
      const dedupKey = buildConservatoriumDedupKey(localizedItem);
      const existing = byLocalizedIdentity.get(dedupKey);

      if (!existing) {
        byLocalizedIdentity.set(dedupKey, localizedItem);
        continue;
      }

      if (conservatoriumQualityScore(localizedItem) > conservatoriumQualityScore(existing)) {
        byLocalizedIdentity.set(dedupKey, localizedItem);
      }
    }

    return Array.from(byLocalizedIdentity.values());
  }, [conservatoriums, locale]);

  // Sorted unique city list from conservatoriums that have coordinates
  const cities = useMemo(() => {
    const seen = new Set<string>();
    const result: { name: string; coords: { lat: number; lng: number } }[] = [];
    for (const cons of localizedConservatoriums) {
      const cityName = cons.location?.city;
      if (cityName && !seen.has(cityName) && cons.location?.coordinates) {
        seen.add(cityName);
        result.push({ name: cityName, coords: cons.location.coordinates });
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }, [localizedConservatoriums]);

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

  const conservatoriumFallbackImages = useMemo(() => {
    const byConservatoriumId = new Map<string, string>();
    for (const cons of localizedConservatoriums) {
      const fallback = getConservatoriumFallbackImage(cons.id, placeholderImageMap);
      if (fallback) byConservatoriumId.set(cons.id, fallback);
    }
    return byConservatoriumId;
  }, [localizedConservatoriums, placeholderImageMap]);

  const resolveAvatarUrl = (value?: string) => {
    if (!value) return undefined;
    return placeholderImageMap.get(value) || value;
  };

  const filteredConservatoriums = useMemo(() => {
    const searchNorm = normalizeForSearch(search);
    const cityNorm = normalizeForSearch(city);

    const filtered = localizedConservatoriums.filter((cons) => {
      const name = normalizeForSearch(cons.name || '');
      const cityName = normalizeForSearch(cons.location?.city || '');

      const bySearch = !searchNorm || name.includes(searchNorm) || cityName.includes(searchNorm);
      const byCity = !cityNorm || cityName.includes(cityNorm);

      const byInstrument =
        !instrumentId ||
        conservatoriumInstruments.some(
          (inst) =>
            inst.conservatoriumId === cons.id &&
            inst.id === instrumentId &&
            inst.isActive &&
            inst.availableForRegistration
        );

      return bySearch && byCity && byInstrument;
    });

    // Sort by GPS location if the user granted geolocation
    if (userLocation) {
      return filtered.slice().sort((a, b) => {
        const coordsA = a.location?.coordinates;
        const coordsB = b.location?.coordinates;
        const distA = coordsA ? haversineDistance(userLocation.lat, userLocation.lng, coordsA.lat, coordsA.lng) : Infinity;
        const distB = coordsB ? haversineDistance(userLocation.lat, userLocation.lng, coordsB.lat, coordsB.lng) : Infinity;
        return distA - distB;
      });
    }

    if (!cityNorm) return filtered;

    // Find coordinates for the searched city from any conservatorium that matches
    let referenceCoords: { lat: number; lng: number } | null = null;
    for (const cons of localizedConservatoriums) {
      const cityName = normalizeForSearch(cons.location?.city || '');
      if (cityName.includes(cityNorm) && cons.location?.coordinates) {
        referenceCoords = cons.location.coordinates;
        break;
      }
    }

    if (!referenceCoords) return filtered;

    return filtered.slice().sort((a, b) => {
      const coordsA = a.location?.coordinates;
      const coordsB = b.location?.coordinates;
      const distA = coordsA ? haversineDistance(referenceCoords.lat, referenceCoords.lng, coordsA.lat, coordsA.lng) : Infinity;
      const distB = coordsB ? haversineDistance(referenceCoords.lat, referenceCoords.lng, coordsB.lat, coordsB.lng) : Infinity;
      return distA - distB;
    });
  }, [localizedConservatoriums, conservatoriumInstruments, search, city, instrumentId, userLocation]);

  const teacherCountByConservatorium = useMemo(() => {
    const counts = new Map<string, number>();

    for (const cons of localizedConservatoriums) {
      const listCount = cons.teachers?.length || 0;
      const usersCount = localizedTeachers.filter((teacher) => teacher.conservatoriumId === cons.id).length;
      counts.set(cons.id, Math.max(listCount, usersCount));
    }

    return counts;
  }, [localizedConservatoriums, localizedTeachers]);

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

      const instruments = matched ? buildTeacherInstruments(matched, platformInstruments, locale) : [];
      const bio = dirTeacher.bio || (matched ? getLocalizedUserBio(matched, locale) : undefined);

      profiles.push({
        id: matched?.id || `dir-${selectedCons.id}-${dirTeacher.name}`,
        name: dirTeacher.name,
        role: dirTeacher.role || matched?.role,
        bio: bio || undefined,
        photoUrl: resolveAvatarUrl(dirTeacher.photoUrl || matched?.avatarUrl),
        instruments,
        education: matched?.education,
        email: matched?.email,
        phone: matched?.phone,
        teacherUserId: matched?.id,
        teacherConservatoriumId: matched?.conservatoriumId,
        availableForNewStudents: matched?.availableForNewStudents,
        teacherRatingAvg: matched?.teacherRatingAvg,
        teacherRatingCount: matched?.teacherRatingCount,
        isPremiumTeacher: matched?.isPremiumTeacher,
        spokenLanguages: matched?.spokenLanguages,
        source: 'teacher',
      });
    }

    for (const teacher of teachersInCons) {
      if (matchedTeacherIds.has(teacher.id)) continue;
      profiles.push({
        id: teacher.id,
        name: teacher.name,
        role: teacher.role,
        bio: getLocalizedUserBio(teacher, locale),
        photoUrl: resolveAvatarUrl(teacher.avatarUrl),
        instruments: buildTeacherInstruments(teacher, platformInstruments, locale),
        education: teacher.education,
        email: teacher.email,
        phone: teacher.phone,
        teacherUserId: teacher.id,
        teacherConservatoriumId: teacher.conservatoriumId,
        availableForNewStudents: teacher.availableForNewStudents,
        teacherRatingAvg: teacher.teacherRatingAvg,
        teacherRatingCount: teacher.teacherRatingCount,
        isPremiumTeacher: teacher.isPremiumTeacher,
        spokenLanguages: teacher.spokenLanguages,
        source: 'teacher',
      });
    }

    if (selectedCons.manager?.name) {
      profiles.push({
        id: `manager-${selectedCons.id}`,
        name: selectedCons.manager.name,
        role: selectedCons.manager.role,
        bio: selectedCons.manager.bio,
        photoUrl: resolveAvatarUrl(selectedCons.manager.photoUrl),
        instruments: [],
        source: 'manager',
      });
    }

    if (selectedCons.pedagogicalCoordinator?.name) {
      profiles.push({
        id: `pedagogical-${selectedCons.id}`,
        name: selectedCons.pedagogicalCoordinator.name,
        role: selectedCons.pedagogicalCoordinator.role,
        bio: selectedCons.pedagogicalCoordinator.bio,
        photoUrl: resolveAvatarUrl(selectedCons.pedagogicalCoordinator.photoUrl),
        instruments: [],
        source: 'staff',
      });
    }

    for (const member of selectedCons.leadingTeam || []) {
      profiles.push({
        id: `team-${selectedCons.id}-${member.name}`,
        name: member.name,
        role: member.role,
        bio: member.bio,
        photoUrl: resolveAvatarUrl(member.photoUrl),
        instruments: [],
        source: 'staff',
      });
    }

    const unique = new Map<string, PublicProfile>();
    for (const profile of profiles) {
      const key = `${profile.source}-${normalizeName(profile.name)}`;
      if (!unique.has(key)) unique.set(key, profile);
    }

    return Array.from(unique.values());
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="flex min-h-dvh flex-col bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <PublicNavbar />

      <main className="flex-1 pt-14 text-start">
        <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background px-4 py-16">
          <div className="mx-auto max-w-6xl space-y-4 text-center">
            <Badge variant="secondary" className="mx-auto">
              {t('showingCount', { count: localizedConservatoriums.length })}
            </Badge>
            <h1 className="text-4xl font-bold md:text-5xl">{t('title')}</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">{t('subtitle')}</p>
          </div>
        </section>

        <section className="sticky top-14 z-30 border-b bg-background/95 px-4 py-4 backdrop-blur">
          <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-[1fr_auto_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchPlaceholder')}
                className="ps-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setUserLocation(null);
                  setLocationDenied(false);
                }}
                className="h-10 w-[180px] rounded-md border bg-background px-3 text-sm md:w-[200px]"
              >
                <option value="">{t('citySortPlaceholder')}</option>
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <Button
                type="button"
                variant={userLocation ? 'default' : locationDenied ? 'destructive' : 'outline'}
                size="icon"
                onClick={handleLocate}
                disabled={locating}
                title={locating ? t('locating') : locationDenied ? t('locationDenied') : t('locateMe')}
                aria-label={locating ? t('locating') : locationDenied ? t('locationDenied') : t('locateMe')}
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              </Button>
            </div>
            <select
              value={instrumentId}
              onChange={(event) => setInstrumentId(event.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">{tAbout('allInstruments')}</option>
              {platformInstruments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {getInstrumentName(inst, locale)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                {t('foundCount', {
                  found: filteredConservatoriums.length,
                  total: localizedConservatoriums.length,
                })}
                {userLocation && (
                  <Badge variant="secondary" className="text-[11px]">
                    <LocateFixed className="me-1 h-3 w-3" />
                    {t('sortedByDistance')}
                  </Badge>
                )}
              </span>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setSearch('');
                  setCity('');
                  setInstrumentId('');
                  setUserLocation(null);
                }}
              >
                {t('clearFilters')}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredConservatoriums.map((cons) => (
                <ConservatoriumCard
                  key={cons.id}
                  cons={cons}
                  teacherCount={teacherCountByConservatorium.get(cons.id) || 0}
                  onOpen={() => {
                    setSelectedProfile(null);
                    setSelectedCons(cons);
                  }}
                  viewLabel={tCommon('view')}
                  fallbackHeroPhoto={conservatoriumFallbackImages.get(cons.id)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      <Dialog
        open={Boolean(selectedCons)}
        onOpenChange={(open) => {
          if (!open && selectedProfile) {
            setSelectedProfile(null);
            return;
          }
          if (!open) {
            setSelectedProfile(null);
            setSelectedCons(null);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-6xl overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{selectedCons?.name}</DialogTitle>
          </DialogHeader>

          {selectedCons && !selectedProfile && (
            <div className="space-y-5 text-sm">
              {selectedCons.about && <p className="text-muted-foreground">{selectedCons.about}</p>}

              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/contact">{t('contactThisCons')}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/about/${buildConservatoriumSlug({ id: selectedCons.id, name: selectedCons.name, nameEn: selectedCons.nameEn })}`}>
                    {tCommon('view')}
                  </Link>
                </Button>
                {selectedCons.officialSite && (
                  <Button variant="outline" asChild>
                    <a href={selectedCons.officialSite} target="_blank" rel="noopener noreferrer">
                      {t('officialSite')}
                    </a>
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('contactDetails')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-muted-foreground">
                    {selectedCons.location?.city && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {selectedCons.location.address || selectedCons.location.city}
                      </p>
                    )}
                    {selectedCons.tel && (
                      <a href={`tel:${selectedCons.tel}`} className="flex items-center gap-2 hover:underline" dir="ltr">
                        <Phone className="h-4 w-4" />
                        {selectedCons.tel}
                      </a>
                    )}
                    {selectedCons.email && (
                      <a href={`mailto:${selectedCons.email}`} className="flex items-center gap-2 break-all hover:underline" dir="ltr">
                        <Mail className="h-4 w-4" />
                        {selectedCons.email}
                      </a>
                    )}
                    {selectedCons.officialSite && (
                      <a
                        href={selectedCons.officialSite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 break-all hover:underline"
                        dir="ltr"
                      >
                        <Globe className="h-4 w-4" />
                        {selectedCons.officialSite}
                      </a>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('management')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedConsProfiles
                      .filter((profile) => profile.source !== 'teacher')
                      .map((profile) => (
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
              </div>

              {selectedCons.departments && selectedCons.departments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t('departments')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCons.departments.map((department) => (
                      <Badge key={`${selectedCons.id}-${department.name}`} variant="secondary">
                        {department.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedCons.programs && selectedCons.programs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t('programs')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCons.programs.map((program, index) => {
                      const label = getProgramLabel(program, locale);
                      if (!label) return null;
                      return (
                        <Badge key={getProgramKey(selectedCons.id, program, index, locale)} variant="outline">
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedCons.branchesInfo && selectedCons.branchesInfo.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t('branches')}</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedCons.branchesInfo.map((branch) => (
                      <Card key={`${selectedCons.id}-${branch.name}-${branch.address || ''}`}>
                        <CardContent className="space-y-1 p-3 text-muted-foreground">
                          <p className="font-medium text-foreground">{branch.name}</p>
                          {branch.address && <p>{branch.address}</p>}
                          {branch.tel && <p dir="ltr">{branch.tel}</p>}
                          {branch.email && <p dir="ltr">{branch.email}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedCons.socialMedia && (
                <div className="flex items-center gap-3">
                  {selectedCons.socialMedia.facebook && (
                    <a href={selectedCons.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {selectedCons.socialMedia.instagram && (
                    <a href={selectedCons.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {selectedCons.socialMedia.youtube && (
                    <a href={selectedCons.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <Youtube className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold">{t('teachers', { count: selectedConsProfiles.filter((item) => item.source === 'teacher').length })}</h3>
                {selectedTeacherGroups.map(([instrumentName, profiles]) => (
                  <div key={instrumentName} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{instrumentName}</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                              {profile.isPremiumTeacher && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-full px-1.5 py-0.5 mt-0.5">
                                  <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                                  Premium
                                </span>
                              )}
                            </div>
                          </div>
                          {profile.instruments.length > 0 && (
                            <p className="line-clamp-1 text-[11px] text-muted-foreground">{profile.instruments.join(', ')}</p>
                          )}
                          {typeof profile.teacherRatingAvg === 'number' && (profile.teacherRatingCount || 0) > 0 && (
                            <div className="mt-1">
                              <StarRating value={profile.teacherRatingAvg} size="sm" showCount count={profile.teacherRatingCount} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCons && selectedProfile && (
            <div className="space-y-5">
              <Button variant="ghost" className="ps-2 pe-2" onClick={() => setSelectedProfile(null)}>
                <ArrowLeft className="me-2 h-4 w-4" />
                {tCommon('back')}
              </Button>

              <div className="flex items-start gap-3">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={selectedProfile.photoUrl} alt={selectedProfile.name} />
                  <AvatarFallback>
                    <UserRound className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{selectedProfile.name}</p>
                  {selectedProfile.isPremiumTeacher && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      Premium
                    </span>
                  )}
                  {selectedProfile.role && <p className="text-sm text-muted-foreground">{selectedProfile.role}</p>}
                  {selectedProfile.instruments.length > 0 && (
                    <p className="text-sm text-muted-foreground">{selectedProfile.instruments.join(', ')}</p>
                  )}
                  {typeof selectedProfile.teacherRatingAvg === 'number' && (selectedProfile.teacherRatingCount || 0) > 0 && (
                    <StarRating value={selectedProfile.teacherRatingAvg} size="md" showCount count={selectedProfile.teacherRatingCount} />
                  )}
                </div>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {selectedProfile.bio || tAbout('bioUnavailable')}
              </p>

              {selectedProfile.spokenLanguages && selectedProfile.spokenLanguages.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{tAbout('speaks')}:</span>{' '}
                  {selectedProfile.spokenLanguages.map(lang => {
                    const labels: Record<string, string> = { HE: 'עברית', EN: 'English', AR: 'العربية', RU: 'Русский' };
                    return labels[lang] || lang;
                  }).join(', ')}
                </p>
              )}

              {selectedProfile.education && selectedProfile.education.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{tAbout('education')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    {selectedProfile.education.map((item) => (
                      <p key={`${selectedProfile.id}-${item}`}>{item}</p>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedProfile.phone && (
                  <Button variant="outline" asChild>
                    <a href={`tel:${selectedProfile.phone}`} dir="ltr">
                      <Phone className="me-2 h-4 w-4" />
                      {selectedProfile.phone}
                    </a>
                  </Button>
                )}
                {selectedProfile.email && (
                  <Button variant="outline" asChild>
                    <a href={`mailto:${selectedProfile.email}`} dir="ltr">
                      <Mail className="me-2 h-4 w-4" />
                      {selectedProfile.email}
                    </a>
                  </Button>
                )}
                {selectedProfile.source === 'teacher' && selectedProfile.teacherUserId && selectedProfile.availableForNewStudents && (
                  <Button asChild>
                    <Link href={`/register?teacher=${selectedProfile.teacherUserId}&conservatorium=${selectedProfile.teacherConservatoriumId || selectedCons.id}`}>{tAbout('bookWithTeacher')}</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
