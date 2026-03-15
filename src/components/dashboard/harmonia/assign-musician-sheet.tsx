'use client';
import { useState, useMemo, useEffect } from 'react';
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import type { PerformanceBooking, PerformanceAssignment } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTranslations, useLocale } from 'next-intl';
import { tenantUsers } from '@/lib/tenant-filter';
import { checkMusicianAvailability, calculateBookingCost } from '@/lib/performance-utils';
import { Search } from 'lucide-react';

type MusicianRole = PerformanceAssignment['role'];

interface SelectedMusician {
  userId: string;
  role: MusicianRole | '';
}

interface AssignMusicianSheetProps {
  booking: PerformanceBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (bookingId: string, assignments: Pick<PerformanceAssignment, 'userId' | 'role'>[]) => void;
}

const ROLES: MusicianRole[] = ['soloist', 'ensemble', 'accompanist', 'conductor'];

function AvailabilityBadge({ conflicts }: { conflicts: { type: 'lesson' | 'performance' | 'unavailable'; detail: string }[] }) {
  const t = useTranslations('AssignMusicianSheet');
  if (conflicts.length === 0) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t('available')}</Badge>;
  }
  const type = conflicts[0].type;
  if (type === 'unavailable') {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t('unavailable')}</Badge>;
  }
  return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{t('conflict')}: {conflicts[0].detail}</Badge>;
}

export function AssignMusicianSheet({ booking, open, onOpenChange, onConfirm }: AssignMusicianSheetProps) {
  const { users, user, lessons, performanceBookings } = useAuth();
  const t = useTranslations('AssignMusicianSheet');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const [selectedMusicians, setSelectedMusicians] = useState<SelectedMusician[]>([]);
  const [instrumentFilter, setInstrumentFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const performers = useMemo(() =>
    (user ? tenantUsers(users, user, 'teacher') : []).filter(u =>
      u.performanceProfile?.isOptedIn && u.performanceProfile?.adminApproved
    ),
    [users, user]
  );

  const instruments = useMemo(() => {
    const set = new Set<string>();
    performers.forEach(p => p.instruments?.forEach(i => set.add(i.instrument)));
    return Array.from(set).sort();
  }, [performers]);

  // Precompute availability for each performer
  const availabilityMap = useMemo(() => {
    if (!booking) return new Map<string, ReturnType<typeof checkMusicianAvailability>>();
    const map = new Map<string, ReturnType<typeof checkMusicianAvailability>>();
    const otherBookings = performanceBookings.filter(b => b.id !== booking.id);
    performers.forEach(p => {
      map.set(p.id, checkMusicianAvailability(p, booking.eventDate, booking.eventTime, otherBookings, lessons));
    });
    return map;
  }, [booking, performers, performanceBookings, lessons]);

  // Pre-select already assigned musicians when sheet opens
  useEffect(() => {
    if (booking?.assignedMusicians) {
      setSelectedMusicians(
        booking.assignedMusicians.map(m => ({
          userId: m.userId,
          role: m.role,
        }))
      );
    } else {
      setSelectedMusicians([]);
    }
    setSearchQuery('');
    setInstrumentFilter('all');
    setAvailabilityFilter('all');
  }, [booking]);

  const filteredPerformers = useMemo(() => {
    return performers.filter(p => {
      if (instrumentFilter !== 'all') {
        const hasInstrument = p.instruments?.some(i => i.instrument === instrumentFilter);
        if (!hasInstrument) return false;
      }
      if (availabilityFilter === 'available') {
        const avail = availabilityMap.get(p.id);
        if (!avail?.available) return false;
      } else if (availabilityFilter === 'conflicts') {
        const avail = availabilityMap.get(p.id);
        if (avail?.available) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [performers, instrumentFilter, availabilityFilter, availabilityMap, searchQuery]);

  const handleToggleMusician = (id: string) => {
    setSelectedMusicians(prev => {
      const exists = prev.find(m => m.userId === id);
      if (exists) return prev.filter(m => m.userId !== id);
      return [...prev, { userId: id, role: '' }];
    });
  };

  const handleRoleChange = (userId: string, role: MusicianRole) => {
    setSelectedMusicians(prev =>
      prev.map(m => m.userId === userId ? { ...m, role } : m)
    );
  };

  const isSelected = (id: string) => selectedMusicians.some(m => m.userId === id);

  const canConfirm = selectedMusicians.length > 0 &&
    selectedMusicians.every(m => m.role !== '');

  // Cost summary
  const durationHours = booking?.eventDurationHours ?? 2;
  const estimatedCost = useMemo(() => {
    const assigned = selectedMusicians
      .filter(m => m.role !== '')
      .map(m => {
        const performer = performers.find(p => p.id === m.userId);
        return {
          userId: m.userId,
          name: performer?.name ?? '',
          instrument: performer?.instruments?.[0]?.instrument ?? '',
          role: m.role as MusicianRole,
          status: 'pending' as const,
          assignedAt: new Date().toISOString(),
          assignedBy: user?.id ?? '',
          ratePerHour: performer?.performanceProfile?.performanceRatePerHour ?? 0,
        };
      });
    return calculateBookingCost(assigned, durationHours);
  }, [selectedMusicians, performers, durationHours, user]);

  const handleConfirm = () => {
    if (!booking || !canConfirm) return;
    const assignments = selectedMusicians
      .filter(m => m.role !== '')
      .map(m => ({ userId: m.userId, role: m.role as MusicianRole }));
    onConfirm(booking.id, assignments);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl ? 'left' : 'right'}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        {/* Header */}
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{t('title')}</SheetTitle>
          {booking && (
            <SheetDescription>
              <span className="font-medium text-foreground">{booking.eventName}</span>
              <span className="ms-2 text-muted-foreground">
                {booking.eventDate} · {booking.eventTime}
                {booking.eventDurationHours ? ` · ${booking.eventDurationHours}h` : ''}
              </span>
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Filters */}
          <div className="space-y-3 border-b px-6 py-4">
            <p className="text-sm font-medium text-muted-foreground">{t('filters')}</p>
            <div className="flex flex-wrap gap-2">
              <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
                <SelectTrigger className="h-8 w-auto min-w-[120px] text-sm">
                  <SelectValue placeholder={t('instrumentAll')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('instrumentAll')}</SelectItem>
                  {instruments.map(inst => (
                    <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="h-8 w-auto min-w-[140px] text-sm">
                  <SelectValue placeholder={t('availabilityAll')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('availabilityAll')}</SelectItem>
                  <SelectItem value="available">{t('available')}</SelectItem>
                  <SelectItem value="conflicts">{t('hasConflicts')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-8 h-8 text-sm"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Musicians list */}
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-2 py-4">
              {filteredPerformers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">{t('noMusicians')}</p>
              )}
              {filteredPerformers.map(performer => {
                const image = PlaceHolderImages.find(img => img.id === performer.avatarUrl);
                const selected = isSelected(performer.id);
                const selectedData = selectedMusicians.find(m => m.userId === performer.id);
                const avail = availabilityMap.get(performer.id);
                const rate = performer.performanceProfile?.performanceRatePerHour;

                return (
                  <div
                    key={performer.id}
                    className={`rounded-lg border p-3 transition-colors ${selected ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`musician-sheet-${performer.id}`}
                        checked={selected}
                        onCheckedChange={() => handleToggleMusician(performer.id)}
                        className="mt-1"
                      />
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={image?.imageUrl || performer.avatarUrl} />
                        <AvatarFallback>{performer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Label
                            htmlFor={`musician-sheet-${performer.id}`}
                            className="font-medium cursor-pointer text-sm"
                          >
                            {performer.name}
                          </Label>
                          {avail && <AvailabilityBadge conflicts={avail.conflicts} />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {performer.instruments?.map(i => i.instrument).join(', ')}
                          {rate ? ` · ₪${rate}/${t('perHour')}` : ''}
                        </p>

                        {selected && (
                          <div className="pt-1">
                            <Select
                              value={selectedData?.role || ''}
                              onValueChange={(v) => handleRoleChange(performer.id, v as MusicianRole)}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder={t('selectRole')} />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map(role => (
                                  <SelectItem key={role} value={role} className="text-xs">
                                    {t(`role_${role}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Cost summary + footer */}
          <div className="border-t px-6 py-4 space-y-3">
            {selectedMusicians.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {t('costSummary', {
                  count: selectedMusicians.length,
                  hours: durationHours,
                  cost: estimatedCost.toLocaleString(),
                })}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('cancelBtn')}
              </Button>
              <Button onClick={handleConfirm} disabled={!canConfirm}>
                {t('confirmBtn', { count: selectedMusicians.length })}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
