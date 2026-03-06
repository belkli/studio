'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import type { DayOfWeek, EmptySlot } from '@/lib/types';
import { addDays, format, getDay, isAfter, isSameDay, setHours } from 'date-fns';
import { SlotPromotionCard } from './slot-promotion-card';
import { Loader2, X, ChevronsUpDown, Check, SlidersHorizontal, LocateFixed, CalendarDays, Star } from 'lucide-react';
import { collectInstrumentTokensFromTeacherInstrument, normalizeInstrumentToken } from '@/lib/instrument-matching';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useDateLocale } from '@/hooks/use-date-locale';

export type SlotUrgency = 'SAME_DAY' | 'TOMORROW';
export type SlotDemandLevel = 'HIGH_DEMAND' | 'MEDIUM_DEMAND' | 'LOW_DEMAND';

const DISCOUNT_MATRIX: Record<SlotUrgency, Record<SlotDemandLevel, number>> = {
  SAME_DAY: { HIGH_DEMAND: 20, MEDIUM_DEMAND: 30, LOW_DEMAND: 40 },
  TOMORROW: { HIGH_DEMAND: 10, MEDIUM_DEMAND: 15, LOW_DEMAND: 25 },
};

function getDemandLevel(date: Date): SlotDemandLevel {
  const hour = date.getHours();
  const day = date.getDay();
  if (hour >= 15 && hour < 19 && day >= 0 && day <= 4) return 'HIGH_DEMAND';
  if (day === 5 || hour < 13) return 'LOW_DEMAND';
  return 'MEDIUM_DEMAND';
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface FilterOption { value: string; label: string; }

interface SearchableSelectProps {
  value: string;
  onValueChange: (v: string) => void;
  options: FilterOption[];
  placeholder: string;
  allLabel: string;
  isRtl?: boolean;
}

function SearchableSelect({ value, onValueChange, options, placeholder, allLabel, isRtl }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = value === 'all' ? null : options.find(o => o.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-10", !selectedLabel && "text-muted-foreground")}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" dir={isRtl ? 'rtl' : 'ltr'}>
        <Command filter={(itemValue, search) =>
          options.find(o => o.value === itemValue)?.label.toLowerCase().includes(search.toLowerCase()) || itemValue === 'all' ? 1 : 0
        }>
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandList>
            <CommandEmpty>—</CommandEmpty>
            <CommandGroup>
              <CommandItem value="all" onSelect={() => { onValueChange('all'); setOpen(false); }}>
                <Check className={cn("me-2 h-4 w-4", value !== 'all' && "opacity-0")} />
                {allLabel}
              </CommandItem>
              {options.map(opt => (
                <CommandItem key={opt.value} value={opt.value} onSelect={() => { onValueChange(opt.value); setOpen(false); }}>
                  <Check className={cn("me-2 h-4 w-4", value !== opt.value && "opacity-0")} />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function AvailableSlotsMarketplace() {
  const t = useTranslations('AvailableNow');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const dateLocale = useDateLocale();
  const { users, lessons, conservatoriums, conservatoriumInstruments } = useAuth();

  const [filters, setFilters] = useState({
    conservatoriumId: 'all',
    instrument: 'all',
    duration: 'all',
    dateStr: 'all',       // 'all' | ISO date string YYYY-MM-DD
    maxDistanceKm: 'all', // 'all' | '10' | '25' | '50'
  });
  const [teacherSearch, setTeacherSearch] = useState('');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const uniqueConservatoriums = useMemo(
    () => Array.from(new Map(conservatoriums.map((item) => [item.id, item])).values()),
    [conservatoriums]
  );

  // Next 7 days for the date filter
  const today = useMemo(() => new Date(), []);
  const dateOptions = useMemo<FilterOption[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i);
      const iso = format(d, 'yyyy-MM-dd');
      const label = i === 0 ? t('today') : i === 1 ? t('tomorrow') : format(d, 'EEE d/M', { locale: dateLocale });
      return { value: iso, label };
    });
  }, [today, t, dateLocale]);

  const emptySlots = useMemo(() => {
    const teachers = users.filter((u) => u.role === 'teacher' && u.availability);
    const searchDates = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    const slots: EmptySlot[] = [];

    teachers.forEach((teacher) => {
      const mapped = teacher.instruments?.map((i) => i.instrument) || [];
      const teacherInstruments = mapped.length > 0 ? mapped : teacher.bio ? [teacher.bio] : [];

      searchDates.forEach((date) => {
        const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][getDay(date)] as DayOfWeek;
        const teacherDayAvailability = teacher.availability?.find((a) => a.dayOfWeek === dayOfWeek);
        if (!teacherDayAvailability) return;

        const dayLessons = lessons.filter(
          (l) => l.teacherId === teacher.id && isSameDay(new Date(l.startTime), date)
        );

        for (
          let hour = parseInt(teacherDayAvailability.startTime.split(':')[0], 10);
          hour < parseInt(teacherDayAvailability.endTime.split(':')[0], 10);
          hour += 1
        ) {
          const slotStartTime = setHours(date, hour);
          slotStartTime.setMinutes(0, 0, 0);

          if (isAfter(new Date(), slotStartTime)) continue;

          const isBooked = dayLessons.some((l) => new Date(l.startTime).getHours() === hour);
          if (isBooked) continue;

          teacherInstruments.forEach((instrument) => {
            const duration = teacher.ratePerDuration?.['60'] != null ? 60 : 45;
            const basePrice = teacher.ratePerDuration?.[duration.toString() as '45' | '60'] || 120;
            const urgency = isSameDay(date, today) ? 'SAME_DAY' : 'TOMORROW';
            const demandLevel = getDemandLevel(slotStartTime);
            const discount = DISCOUNT_MATRIX[urgency][demandLevel];
            const promotionalPrice = Math.round(basePrice * (1 - discount / 100));

            slots.push({
              id: `${teacher.id}-${instrument}-${slotStartTime.toISOString()}-${duration}`,
              teacher,
              instrument,
              startTime: slotStartTime,
              durationMinutes: duration,
              urgency,
              demandLevel,
              basePrice,
              promotionalPrice,
              discount,
            });
          });
        }
      });
    });

    return Array.from(new Map(slots.map((item) => [item.id, item])).values()).sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }, [users, lessons, today]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    setLocating(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError(true);
      },
      { timeout: 8000 }
    );
  }, []);

  const conservatoriumOptions = useMemo<FilterOption[]>(
    () => uniqueConservatoriums.map(c => ({ value: c.id, label: c.name })),
    [uniqueConservatoriums]
  );

  const visibleInstrumentOptions = useMemo<FilterOption[]>(() => {
    const localeName = (item: (typeof conservatoriumInstruments)[number]) => {
      if (locale === 'he') return item.names.he;
      if (locale === 'ar') return item.names.ar || item.names.en;
      if (locale === 'ru') return item.names.ru || item.names.en;
      return item.names.en;
    };

    if (filters.conservatoriumId !== 'all') {
      return conservatoriumInstruments
        .filter((i) => i.conservatoriumId === filters.conservatoriumId && i.isActive && i.availableForRegistration)
        .map((i) => ({ value: i.names.he, label: localeName(i) }));
    }

    return Array.from(new Set(emptySlots.map((slot) => slot.instrument))).map((name) => ({ value: name, label: name }));
  }, [conservatoriumInstruments, emptySlots, filters.conservatoriumId, locale]);

  const durationOptions = useMemo<FilterOption[]>(() => [
    { value: '45', label: t('duration45') },
    { value: '60', label: t('duration60') },
  ], [t]);

  const distanceOptions = useMemo<FilterOption[]>(() => [
    { value: '10', label: t('distance10') },
    { value: '25', label: t('distance25') },
    { value: '50', label: t('distance50') },
  ], [t]);

  // Build a map of conservatoriumId → distance from user (km)
  const consDistanceMap = useMemo(() => {
    if (!userLocation) return new Map<string, number>();
    const map = new Map<string, number>();
    uniqueConservatoriums.forEach(c => {
      const lat = c.location?.coordinates?.lat;
      const lon = c.location?.coordinates?.lng ?? (c.location?.coordinates as any)?.lon;
      if (lat != null && lon != null) {
        map.set(c.id, haversineDistance(userLocation.lat, userLocation.lon, lat, lon));
      }
    });
    return map;
  }, [userLocation, uniqueConservatoriums]);

  const filteredSlots = useMemo(() => {
    let result = emptySlots.filter((slot) => {
      const conservatoriumMatch = filters.conservatoriumId === 'all' || slot.teacher.conservatoriumId === filters.conservatoriumId;

      const instrumentMatch = (() => {
        if (filters.instrument === 'all') return true;
        const selected = normalizeInstrumentToken(filters.instrument);
        const slotTokens = collectInstrumentTokensFromTeacherInstrument(
          slot.instrument,
          conservatoriumInstruments,
          slot.teacher.conservatoriumId
        );
        return slotTokens.has(selected);
      })();

      const durationMatch = filters.duration === 'all' || slot.durationMinutes === Number(filters.duration);

      const dateMatch = filters.dateStr === 'all' || format(slot.startTime, 'yyyy-MM-dd') === filters.dateStr;

      const distanceMatch = (() => {
        if (filters.maxDistanceKm === 'all' || !userLocation) return true;
        const dist = consDistanceMap.get(slot.teacher.conservatoriumId);
        if (dist == null) return true; // no coords → don't exclude
        return dist <= Number(filters.maxDistanceKm);
      })();

      const teacherMatch = !teacherSearch.trim() ||
        slot.teacher.name.toLowerCase().includes(teacherSearch.toLowerCase());

      const premiumMatch = !premiumOnly || slot.teacher.isPremiumTeacher === true;

      return conservatoriumMatch && instrumentMatch && durationMatch && dateMatch && distanceMatch && teacherMatch && premiumMatch;
    });

    // Sort by distance when GPS is active
    if (userLocation && consDistanceMap.size > 0) {
      result = [...result].sort((a, b) => {
        const da = consDistanceMap.get(a.teacher.conservatoriumId) ?? 999;
        const db = consDistanceMap.get(b.teacher.conservatoriumId) ?? 999;
        if (da !== db) return da - db;
        return a.startTime.getTime() - b.startTime.getTime();
      });
    }

    return result;
  }, [emptySlots, filters, conservatoriumInstruments, teacherSearch, premiumOnly, userLocation, consDistanceMap]);

  const handleFilterChange = useCallback((filterName: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  }, []);

  const activeFilters = useMemo(() => {
    const chips: { key: keyof typeof filters | 'teacher' | 'location' | 'premium'; label: string }[] = [];
    if (filters.conservatoriumId !== 'all') chips.push({ key: 'conservatoriumId', label: conservatoriumOptions.find(o => o.value === filters.conservatoriumId)?.label ?? filters.conservatoriumId });
    if (filters.instrument !== 'all') chips.push({ key: 'instrument', label: filters.instrument });
    if (filters.duration !== 'all') chips.push({ key: 'duration', label: durationOptions.find(o => o.value === filters.duration)?.label ?? filters.duration });
    if (filters.dateStr !== 'all') chips.push({ key: 'dateStr', label: dateOptions.find(o => o.value === filters.dateStr)?.label ?? filters.dateStr });
    if (filters.maxDistanceKm !== 'all') chips.push({ key: 'maxDistanceKm', label: distanceOptions.find(o => o.value === filters.maxDistanceKm)?.label ?? filters.maxDistanceKm });
    if (teacherSearch.trim()) chips.push({ key: 'teacher', label: teacherSearch });
    if (premiumOnly) chips.push({ key: 'premium', label: t('premiumOnly') });
    if (userLocation) chips.push({ key: 'location', label: t('sortedByDistance') });
    return chips;
  }, [filters, conservatoriumOptions, durationOptions, dateOptions, distanceOptions, teacherSearch, premiumOnly, userLocation, t]);

  const clearAll = useCallback(() => {
    setFilters({ conservatoriumId: 'all', instrument: 'all', duration: 'all', dateStr: 'all', maxDistanceKm: 'all' });
    setTeacherSearch('');
    setPremiumOnly(false);
    setUserLocation(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-muted-foreground">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
        <p className="text-base">{t('loadingSlots')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary shrink-0" />
          <h3 className="text-base font-semibold text-foreground">{t('filterResults')}</h3>
          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="ms-auto h-7 text-xs text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3 me-1" />
              {t('clearAll')}
            </Button>
          )}
        </div>

        {/* Row 1: date, conservatorium, instrument, duration */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SearchableSelect
            value={filters.dateStr}
            onValueChange={(v) => handleFilterChange('dateStr', v)}
            options={dateOptions}
            placeholder={t('anyDate')}
            allLabel={t('anyDate')}
            isRtl={isRtl}
          />
          <SearchableSelect
            value={filters.conservatoriumId}
            onValueChange={(v) => handleFilterChange('conservatoriumId', v)}
            options={conservatoriumOptions}
            placeholder={t('allConservatoriums')}
            allLabel={t('allConservatoriums')}
            isRtl={isRtl}
          />
          <SearchableSelect
            value={filters.instrument}
            onValueChange={(v) => handleFilterChange('instrument', v)}
            options={visibleInstrumentOptions}
            placeholder={t('allInstruments')}
            allLabel={t('allInstruments')}
            isRtl={isRtl}
          />
          <SearchableSelect
            value={filters.duration}
            onValueChange={(v) => handleFilterChange('duration', v)}
            options={durationOptions}
            placeholder={t('allDurations')}
            allLabel={t('allDurations')}
            isRtl={isRtl}
          />
        </div>

        {/* Row 2: teacher search + premium toggle + location distance */}
        <div className="flex flex-wrap gap-3">
          {/* Teacher name search */}
          <div className="relative flex-1 min-w-[200px]">
            <Input
              value={teacherSearch}
              onChange={e => setTeacherSearch(e.target.value)}
              placeholder={t('searchTeacher')}
              className="h-10 pe-8"
            />
            {teacherSearch && (
              <button
                className="absolute inset-y-0 end-2 flex items-center text-muted-foreground hover:text-foreground"
                onClick={() => setTeacherSearch('')}
                aria-label={t('clearAll')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Premium only toggle */}
          <button
            onClick={() => setPremiumOnly(p => !p)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors h-10",
              premiumOnly
                ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                : "bg-background border-border text-muted-foreground hover:border-yellow-300"
            )}
          >
            <Star className={cn("h-3.5 w-3.5", premiumOnly ? "fill-yellow-500 text-yellow-500" : "")} />
            {t('premiumOnly')}
          </button>

          {/* GPS locate + distance filter */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Button
                variant={userLocation ? 'default' : 'outline'}
                size="sm"
                className="h-10 gap-1.5 shrink-0"
                onClick={handleLocate}
                disabled={locating}
              >
                {locating
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <LocateFixed className="h-4 w-4" />}
                <span className="hidden sm:inline">{locating ? t('locating') : userLocation ? t('sortedByDistance') : t('useMyLocation')}</span>
              </Button>

              {userLocation && (
                <SearchableSelect
                  value={filters.maxDistanceKm}
                  onValueChange={(v) => handleFilterChange('maxDistanceKm', v)}
                  options={distanceOptions}
                  placeholder={t('allDistances')}
                  allLabel={t('allDistances')}
                  isRtl={isRtl}
                />
              )}
            </div>
            {locationError && (
              <p className="text-xs text-destructive">{t('locationError')}</p>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(({ key, label }) => (
              <Badge
                key={key}
                variant="secondary"
                className="gap-1 pe-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => {
                  if (key === 'teacher') setTeacherSearch('');
                  else if (key === 'premium') setPremiumOnly(false);
                  else if (key === 'location') { setUserLocation(null); handleFilterChange('maxDistanceKm', 'all'); }
                  else handleFilterChange(key as keyof typeof filters, 'all');
                }}
              >
                {label}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {filteredSlots.length > 0 && (
        <p className="text-sm text-muted-foreground px-1">
          {t('resultsCount', { count: String(filteredSlots.length) })}
          {userLocation && <span className="ms-2 text-primary text-xs font-medium">↕ {t('sortedByDistance')}</span>}
        </p>
      )}

      {filteredSlots.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSlots.map((slot) => (
            <SlotPromotionCard key={slot.id} slot={slot} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <CalendarDays className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">{t('noSlotsFound')}</h3>
          <p className="mt-2 text-muted-foreground max-w-sm mx-auto">{t('noSlotsDesc')}</p>
          {activeFilters.length > 0 && (
            <Button variant="outline" className="mt-4" onClick={clearAll}>
              {t('clearAll')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
