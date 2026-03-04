'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import type { DayOfWeek, EmptySlot } from '@/lib/types';
import { addDays, getDay, isAfter, isSameDay, setHours } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlotPromotionCard } from './slot-promotion-card';
import { Loader2 } from 'lucide-react';

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

export function AvailableSlotsMarketplace() {
  const t = useTranslations('AvailableNow');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { users, mockLessons, conservatoriums, conservatoriumInstruments } = useAuth();
  const [filters, setFilters] = useState({
    city: 'all',
    distance: 'all',
    instrument: 'all',
    duration: 'all',
    conservatoriumId: 'all',
  });
  const [isLoading, setIsLoading] = useState(true);

  const uniqueConservatoriums = useMemo(
    () => Array.from(new Map(conservatoriums.map((item) => [item.id, item])).values()),
    [conservatoriums]
  );

  const emptySlots = useMemo(() => {
    const teachers = users.filter((u) => u.role === 'teacher' && u.availability);
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const searchDates = [today, tomorrow];
    const slots: EmptySlot[] = [];

    teachers.forEach((teacher) => {
      const teacherInstruments = teacher.instruments?.map((i) => i.instrument) || [];

      searchDates.forEach((date) => {
        const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][getDay(date)] as DayOfWeek;
        const teacherDayAvailability = teacher.availability?.find((a) => a.dayOfWeek === dayOfWeek);
        if (!teacherDayAvailability) return;

        const dayLessons = mockLessons.filter(
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
            [45, 60].forEach((duration) => {
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
          });
        }
      });
    });

    return Array.from(new Map(slots.map((item) => [item.id, item])).values()).sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }, [users, mockLessons]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const cityOptions = useMemo(
    () => Array.from(new Set(uniqueConservatoriums.map((c) => c.location?.city || c.name))).filter(Boolean),
    [uniqueConservatoriums]
  );

  const visibleInstrumentOptions = useMemo(() => {
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

  const filteredSlots = useMemo(() => {
    return emptySlots.filter((slot) => {
      const slotConservatorium = uniqueConservatoriums.find((c) => c.id === slot.teacher.conservatoriumId);
      const slotCity = slotConservatorium?.location?.city || slotConservatorium?.name;

      const conservatoriumMatch =
        filters.conservatoriumId === 'all' || slot.teacher.conservatoriumId === filters.conservatoriumId;
      const cityMatch = filters.city === 'all' || slotCity === filters.city;
      const distanceMatch =
        filters.distance === 'all' || filters.city === 'all' || filters.distance === '10' ? cityMatch : true;
      const instrumentMatch = filters.instrument === 'all' || slot.instrument === filters.instrument;
      const durationMatch = filters.duration === 'all' || slot.durationMinutes === Number(filters.duration);

      return conservatoriumMatch && cityMatch && distanceMatch && instrumentMatch && durationMatch;
    });
  }, [emptySlots, filters, uniqueConservatoriums]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mb-4 h-10 w-10 animate-spin" />
        <p>{t('loadingSlots')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mb-6 rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-center text-lg font-semibold">{t('filterResults')}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select dir={isRtl ? 'rtl' : 'ltr'} value={filters.city} onValueChange={(v) => handleFilterChange('city', v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder={t('city')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allCities')}</SelectItem>
              {cityOptions.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select dir={isRtl ? 'rtl' : 'ltr'} value={filters.distance} onValueChange={(v) => handleFilterChange('distance', v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder={t('distance')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allDistances')}</SelectItem>
              <SelectItem value="10">{t('distance10')}</SelectItem>
              <SelectItem value="25">{t('distance25')}</SelectItem>
            </SelectContent>
          </Select>

          <Select dir={isRtl ? 'rtl' : 'ltr'} value={filters.conservatoriumId} onValueChange={(v) => handleFilterChange('conservatoriumId', v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder={t('allConservatoriums')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allConservatoriums')}</SelectItem>
              {uniqueConservatoriums.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select dir={isRtl ? 'rtl' : 'ltr'} value={filters.instrument} onValueChange={(v) => handleFilterChange('instrument', v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder={t('allInstruments')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allInstruments')}</SelectItem>
              {visibleInstrumentOptions.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select dir={isRtl ? 'rtl' : 'ltr'} value={filters.duration} onValueChange={(v) => handleFilterChange('duration', v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder={t('allDurations')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allDurations')}</SelectItem>
              <SelectItem value="45">{t('duration45')}</SelectItem>
              <SelectItem value="60">{t('duration60')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredSlots.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSlots.map((slot) => (
            <SlotPromotionCard key={slot.id} slot={slot} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <h3 className="text-xl font-semibold">{t('noSlotsFound')}</h3>
          <p className="mt-2">{t('noSlotsDesc')}</p>
        </div>
      )}
    </div>
  );
}
