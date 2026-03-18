'use client';

import { useAuth } from '@/hooks/use-auth';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { add, set, format, getDay, isBefore, isSameDay, isTomorrow as isTomorrowFn, isAfter, setHours, addDays } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import type { DayOfWeek, EmptySlot } from '@/lib/types';
import { Loader2, Zap, Clock, MapPin, Music, Calendar as CalendarIcon, CreditCard, PackageOpen, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Combobox } from '@/components/ui/combobox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { collectInstrumentTokensFromTeacherInstrument, normalizeInstrumentToken } from '@/lib/instrument-matching';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { tenantFilter, tenantUsers } from '@/lib/tenant-filter';

// ─── Discount matrix (same as public marketplace) ────────────────────────────
type SlotUrgency = 'SAME_DAY' | 'TOMORROW';
type SlotDemandLevel = 'HIGH_DEMAND' | 'MEDIUM_DEMAND' | 'LOW_DEMAND';

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

// ─── Booking schema ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getBookingSchema = (t: any) => z.object({
    studentId: z.string().min(1, t('studentRequired')),
    instrument: z.string().min(1, t('instrumentRequired')),
    teacherId: z.string().min(1, t('teacherRequired')),
    date: z.date(),
    time: z.string().min(1, t('timeRequired')),
    durationMinutes: z.coerce.number().default(45),
});

type BookingFormData = z.infer<ReturnType<typeof getBookingSchema>>;

// ─── Slot booking dialog ──────────────────────────────────────────────────────
interface SlotBookingDialogProps {
    slot: EmptySlot | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hasCredits: boolean;
    activePackageTitle: string;
    onBook: (slot: EmptySlot, paymentMode: 'package' | 'promotional') => void;
    isRtl: boolean;
}

function SlotBookingDialog({ slot, open, onOpenChange, hasCredits, activePackageTitle, onBook, isRtl }: SlotBookingDialogProps) {
    const t = useTranslations('LessonManagement');
    const dateLocale = useDateLocale();
    const { conservatoriums } = useAuth();

    if (!slot) return null;

    const conservatorium = conservatoriums.find(c => c.id === slot.teacher.conservatoriumId);
    const city = conservatorium?.location?.city || slot.teacher.conservatoriumName || '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
                <DialogHeader>
                    <DialogTitle>{t('bookDealTitle')}</DialogTitle>
                    <DialogDescription>{t('bookDealDesc')}</DialogDescription>
                </DialogHeader>

                {/* Slot summary */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={slot.teacher.avatarUrl} alt={slot.teacher.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {slot.teacher.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{slot.teacher.name}</p>
                            <p className="text-xs text-muted-foreground">{conservatorium?.name || slot.teacher.conservatoriumName}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Music className="h-3.5 w-3.5" />
                            {slot.instrument}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(slot.startTime, 'HH:mm')} · {slot.durationMinutes} {t('minutesShort')}
                        </span>
                        <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {format(slot.startTime, 'EEEE, d/M', { locale: dateLocale })}
                        </span>
                        {city && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {city}
                            </span>
                        )}
                    </div>
                </div>

                {/* Payment options */}
                <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">{t('choosePaymentMethod')}</p>

                    {/* Option A: package credit */}
                    <button
                        disabled={!hasCredits}
                        onClick={() => { onBook(slot, 'package'); onOpenChange(false); }}
                        className={cn(
                            "w-full rounded-lg border-2 p-4 text-start transition-colors",
                            hasCredits
                                ? "border-primary/30 hover:border-primary hover:bg-primary/5 cursor-pointer"
                                : "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <PackageOpen className="h-5 w-5 text-primary shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">{t('usePackageCredit')}</p>
                                <p className="text-xs text-muted-foreground">
                                    {hasCredits
                                        ? t('usePackageCreditDesc', { package: activePackageTitle })
                                        : t('noCreditsLeft')}
                                </p>
                            </div>
                            <Badge variant="outline" className="ms-auto shrink-0 text-xs">
                                ₪{slot.basePrice}
                            </Badge>
                        </div>
                    </button>

                    {/* Option B: promotional price */}
                    <button
                        onClick={() => { onBook(slot, 'promotional'); onOpenChange(false); }}
                        className="w-full rounded-lg border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-emerald-800 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/30 p-4 text-start transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-emerald-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">{t('payPromotionalPrice')}</p>
                                <p className="text-xs text-muted-foreground">{t('payPromotionalPriceDesc')}</p>
                            </div>
                            <div className="ms-auto shrink-0 text-end">
                                <p className="text-base font-bold text-emerald-600">₪{slot.promotionalPrice}</p>
                                <p className="text-xs text-muted-foreground line-through">₪{slot.basePrice}</p>
                            </div>
                        </div>
                    </button>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Last-minute deals tab content ───────────────────────────────────────────
interface DealsTabProps {
    studentId: string;
    hasCredits: boolean;
    activePackageTitle: string;
    onBook: (slot: EmptySlot, paymentMode: 'package' | 'promotional') => void;
    isRtl: boolean;
    pendingSlotId?: string | null;
}

function DealsTabContent({ studentId, hasCredits, activePackageTitle, onBook, isRtl, pendingSlotId }: DealsTabProps) {
    const t = useTranslations('LessonManagement');
    const dateLocale = useDateLocale();
    const { user, users, lessons, conservatoriums, conservatoriumInstruments } = useAuth();

    const [selectedSlot, setSelectedSlot] = useState<EmptySlot | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [filterInstrument, setFilterInstrument] = useState<string>('all');

    const today = useMemo(() => new Date(), []);

    // Student's instruments for filtering
    const student = users.find(u => u.id === studentId);
    const studentInstruments = student?.instruments?.map(i => i.instrument) || [];

    // Generate empty slots (next 5 days — today + 4)
    const emptySlots = useMemo(() => {
        const teachers = user ? tenantUsers(users, user, 'teacher').filter((u) => u.availability) : [];
        const tenantLessons = user ? tenantFilter(lessons, user) : lessons;
        const searchDates = [today, addDays(today, 1), addDays(today, 2), addDays(today, 3), addDays(today, 4)];
        const slots: EmptySlot[] = [];

        teachers.forEach((teacher) => {
            const mapped = teacher.instruments?.map((i) => i.instrument) || [];
            const teacherInstruments = mapped.length > 0 ? mapped : teacher.bio ? [teacher.bio] : [];

            searchDates.forEach((date) => {
                const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][getDay(date)] as DayOfWeek;
                const teacherDayAvailability = teacher.availability?.find((a) => a.dayOfWeek === dayOfWeek);
                if (!teacherDayAvailability) return;

                const dayLessons = tenantLessons.filter(
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

        return Array.from(new Map(slots.map((s) => [s.id, s])).values())
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }, [user, users, lessons, today]);

    // Filter to student's instruments if available
    const filteredSlots = useMemo(() => {
        return emptySlots.filter(slot => {
            if (filterInstrument === 'all') return true;
            const selected = normalizeInstrumentToken(filterInstrument);
            const slotTokens = collectInstrumentTokensFromTeacherInstrument(
                slot.instrument,
                conservatoriumInstruments,
                slot.teacher.conservatoriumId
            );
            return slotTokens.has(selected);
        });
    }, [emptySlots, filterInstrument, conservatoriumInstruments]);

    const instrumentOptions = useMemo(() => {
        const instruments = Array.from(new Set(emptySlots.map(s => s.instrument)));
        return instruments.map(i => ({ value: i, label: i }));
    }, [emptySlots]);

    const handleSlotClick = (slot: EmptySlot) => {
        setSelectedSlot(slot);
        setDialogOpen(true);
    };

    // Auto-open the dialog if a pending slot was stored in sessionStorage
    useEffect(() => {
        if (!pendingSlotId || emptySlots.length === 0) return;
        const match = emptySlots.find(s => s.id === pendingSlotId);
        if (match) {
            setTimeout(() => {
                setSelectedSlot(match);
                setDialogOpen(true);
            }, 0);
            sessionStorage.removeItem('pending_slot');
        }
    }, [pendingSlotId, emptySlots]);

    if (emptySlots.length === 0) {
        return (
            <div className="py-12 text-center text-muted-foreground">
                <Zap className="mx-auto h-8 w-8 mb-3 opacity-40" />
                <p className="font-medium">{t('noDealsAvailable')}</p>
                <p className="text-sm mt-1">{t('noDealsAvailableDesc')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Student instruments hint */}
            {studentInstruments.length > 0 && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        {t('dealsFilteredForStudent', { instruments: studentInstruments.join(', ') })}
                    </AlertDescription>
                </Alert>
            )}

            {/* Instrument filter */}
            {instrumentOptions.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant={filterInstrument === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterInstrument('all')}
                    >
                        {t('allInstruments')}
                    </Button>
                    {instrumentOptions.map(opt => (
                        <Button
                            key={opt.value}
                            variant={filterInstrument === opt.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterInstrument(opt.value)}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
            )}

            {/* Slot cards grid */}
            <div className="grid gap-3 sm:grid-cols-2">
                {filteredSlots.map(slot => {
                    const conservatorium = conservatoriums.find(c => c.id === slot.teacher.conservatoriumId);
                    const city = conservatorium?.location?.city || slot.teacher.conservatoriumName || '';
                    const isSlotToday = isSameDay(slot.startTime, today);
                    const isSlotTomorrow = isTomorrowFn(slot.startTime);
                    const bannerLabel = isSlotToday
                        ? t('today')
                        : isSlotTomorrow
                        ? t('tomorrow')
                        : format(slot.startTime, 'EEE d/M', { locale: dateLocale });

                    return (
                        <button
                            key={slot.id}
                            onClick={() => handleSlotClick(slot)}
                            className="group flex flex-col rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 overflow-hidden text-start cursor-pointer"
                        >
                            {/* Urgency banner */}
                            <div className={cn(
                                "flex items-center justify-between px-3 py-1.5 text-xs font-semibold",
                                isSlotToday ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                            )}>
                                <div className="flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    <span>{bannerLabel}</span>
                                </div>
                                <span className="font-bold">{format(slot.startTime, 'HH:mm')}</span>
                            </div>

                            {/* Content */}
                            <div className="flex items-center gap-3 p-3">
                                <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarImage src={slot.teacher.avatarUrl} alt={slot.teacher.name} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                        {slot.teacher.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-semibold text-sm truncate">{slot.teacher.name}</p>
                                        {slot.teacher.isPremiumTeacher && (
                                            <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-1.5 py-0 h-5">
                                            {slot.instrument}
                                        </Badge>
                                        {city && (
                                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                {city}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="shrink-0 text-end">
                                    <p className="text-base font-bold text-emerald-600">₪{slot.promotionalPrice}</p>
                                    <div className="flex items-center gap-1 justify-end">
                                        <p className="text-xs text-muted-foreground line-through">₪{slot.basePrice}</p>
                                        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs px-1 py-0 h-4 font-bold">
                                            -{slot.discount}%
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <SlotBookingDialog
                slot={selectedSlot}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                hasCredits={hasCredits}
                activePackageTitle={activePackageTitle}
                onBook={onBook}
                isRtl={isRtl}
            />
        </div>
    );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export function BookLessonWizard() {
    const { user, users, lessons, addLesson, packages, conservatoriums } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const searchParams = useSearchParams();
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
    const defaultTab = searchParams.get('tab') === 'deals' ? 'deals' : 'regular';

    // On mount: read any pending slot from sessionStorage
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('pending_slot');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.id) setPendingSlotId(parsed.id);
            }
        } catch {}
    }, []);

    const t = useTranslations('LessonManagement');
    const dateLocale = useDateLocale();

    const userConservatorium = conservatoriums?.find(c => c.id === user?.conservatoriumId);
    const durationOptions = useMemo(() => {
        const durations = userConservatorium?.allowedLessonDurations?.length
            ? userConservatorium.allowedLessonDurations
            : [30, 45, 60];
        return [...durations].sort((a, b) => a - b).map(d => ({
            value: String(d),
            label: t('duration', { min: d }),
        }));
    }, [userConservatorium?.allowedLessonDurations, t]);

    const teachers = useMemo(() => user ? tenantUsers(users, user, 'teacher') : [], [users, user]);

    const [teacherScope, setTeacherScope] = useState<'own' | 'all'>('own');
    const [premiumOnly, setPremiumOnly] = useState(false);

    const filteredTeachers = useMemo(() => {
        let list = teachers;
        if (teacherScope !== 'all') {
            const ownId = user?.conservatoriumId;
            const own = teachers.filter(t2 => t2.conservatoriumId === ownId);
            list = own.length > 0 ? own : teachers;
        }
        if (premiumOnly) {
            list = list.filter(t2 => t2.isPremiumTeacher);
        }
        return list;
    }, [teachers, teacherScope, premiumOnly, user]);

    const form = useForm<BookingFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(getBookingSchema(t)) as any,
        defaultValues: {
            studentId: user?.role === 'student' ? user.id : '',
            date: new Date(),
            durationMinutes: 45,
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const selectedStudentId = form.watch('studentId');
    const selectedTeacherId = form.watch('teacherId');
    const selectedDate = form.watch('date');
    const duration = form.watch('durationMinutes');

    useEffect(() => {
        if (!selectedTeacherId || !selectedDate) {
            setAvailableSlots([]);
            return;
        }

        setIsLoadingSlots(true);
        setTimeout(() => {
            const teacher = users.find(u => u.id === selectedTeacherId);
            if (!teacher?.availability) {
                setAvailableSlots([]);
                setIsLoadingSlots(false);
                return;
            }

            const dayIndex = getDay(selectedDate);
            const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dayIndex];
            const teacherDayAvailability = teacher.availability.find(a => a.dayOfWeek === dayOfWeek);

            if (!teacherDayAvailability) {
                setAvailableSlots([]);
                setIsLoadingSlots(false);
                return;
            }

            const tenantLessons = user ? tenantFilter(lessons, user) : lessons;
            const dayLessons = tenantLessons.filter(l =>
                l.teacherId === selectedTeacherId &&
                format(new Date(l.startTime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            );

            const slots: string[] = [];
            let currentTime = set(selectedDate, { hours: parseInt(teacherDayAvailability.startTime.split(':')[0]), minutes: 0, seconds: 0, milliseconds: 0 });
            const endTime = set(selectedDate, { hours: parseInt(teacherDayAvailability.endTime.split(':')[0]), minutes: 0, seconds: 0, milliseconds: 0 });

            while (isBefore(currentTime, endTime)) {
                const slotTimeStr = format(currentTime, 'HH:mm');
                const isBooked = dayLessons.some(l => format(new Date(l.startTime), 'HH:mm') === slotTimeStr);
                if (!isBooked) slots.push(slotTimeStr);
                currentTime = add(currentTime, { minutes: duration });
            }

            setAvailableSlots(slots);
            setIsLoadingSlots(false);
        }, 300);
    }, [selectedTeacherId, selectedDate, duration, users, lessons, user]);

    const onSubmit = (data: BookingFormData) => {
        const [hours, minutes] = data.time.split(':');
        const lessonStartTime = set(data.date, { hours: parseInt(hours), minutes: parseInt(minutes) });

        addLesson({
            studentId: data.studentId,
            teacherId: data.teacherId,
            instrument: data.instrument,
            startTime: lessonStartTime.toISOString(),
            durationMinutes: data.durationMinutes,
            bookingSource: user!.role === 'parent' ? 'PARENT' : 'STUDENT_SELF',
        });

        toast({
            title: t('lessonBookedSuccess'),
            description: t('lessonBookedDesc', {
                instrument: data.instrument,
                teacherName: teachers.find(t1 => t1.id === data.teacherId)?.name || 'Teacher',
                dateTime: format(lessonStartTime, 'dd/MM/yy HH:mm'),
            }),
        });
        router.push('/dashboard/schedule');
    };

    const studentInstruments = useMemo(() => {
        const student = users.find(u => u.id === selectedStudentId);
        return student?.instruments?.map(i => i.instrument) || [];
    }, [selectedStudentId, users]);

    // All instruments taught by teachers (for "explore other instruments" option)
    const allTeacherInstruments = useMemo(() => {
        const instrumentSet = new Set<string>();
        (user ? tenantUsers(users, user, 'teacher') : []).forEach(teacher => {
            teacher.instruments?.forEach(i => instrumentSet.add(i.instrument));
        });
        return Array.from(instrumentSet).sort();
    }, [users, user]);

    // Instrument combobox options: registered instruments first (marked), then others
    const instrumentOptions = useMemo(() => {
        const registered = new Set(studentInstruments);
        const registeredOptions = studentInstruments.map(i => ({ value: i, label: i }));
        const otherOptions = allTeacherInstruments
            .filter(i => !registered.has(i))
            .map(i => ({ value: i, label: i }));
        return [...registeredOptions, ...otherOptions];
    }, [studentInstruments, allTeacherInstruments]);

    const activePackage = useMemo(
        () => packages?.find(p => p.studentId === selectedStudentId),
        [selectedStudentId, packages]
    );

    const hasCredits = useMemo(() => {
        if (!activePackage) return false;
        if (activePackage.type === 'MONTHLY' || activePackage.type === 'YEARLY') return true;
        return (activePackage.totalCredits || 0) > (activePackage.usedCredits || 0);
    }, [activePackage]);

    const childrenOptions = useMemo(() => {
        if (user?.role !== 'parent' || !user.childIds) return [];
        return user.childIds.map(id => {
            const child = users.find(u => u.id === id);
            return { value: id, label: child?.name || id };
        });
    }, [user, users]);

    const handleBookDeal = useCallback((slot: EmptySlot, paymentMode: 'package' | 'promotional') => {
        const [_hoursStr] = format(slot.startTime, 'HH:mm').split(':');
        const studentId = user?.role === 'student' ? user.id : (childrenOptions[0]?.value || '');

        addLesson({
            studentId,
            teacherId: slot.teacher.id,
            instrument: slot.instrument,
            startTime: slot.startTime.toISOString(),
            durationMinutes: slot.durationMinutes,
            bookingSource: 'STUDENT_SELF',
        });

        const isPromo = paymentMode === 'promotional';
        toast({
            title: t('dealBookedSuccess'),
            description: isPromo
                ? t('dealBookedDescPromo', { price: String(slot.promotionalPrice), discount: String(slot.discount) })
                : t('dealBookedDescPackage'),
        });
        router.push('/dashboard/schedule');
    }, [user, childrenOptions, addLesson, toast, t, router]);

    return (
        <Card dir={isRtl ? 'rtl' : 'ltr'}>
            <CardContent className="pt-6">
                <Tabs defaultValue={defaultTab} dir={isRtl ? 'rtl' : 'ltr'}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="regular">{t('regularBookingTab')}</TabsTrigger>
                        <TabsTrigger value="deals" className="gap-1.5">
                            <Zap className="h-3.5 w-3.5" />
                            {t('lastMinuteDealsTab')}
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Regular booking ── */}
                    <TabsContent value="regular">
                        <FormProvider {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                                <div className="flex flex-col xl:grid xl:grid-cols-[280px_1fr] gap-8">
                                    {/* Filters Column */}
                                    <div className="space-y-6">
                                        <h3 className="font-semibold">{t('step1Filter')}</h3>

                                        {user?.role === 'parent' && (
                                            <FormField name="studentId" control={form.control} render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>{t('selectStudent')}</FormLabel>
                                                    <Combobox dir={isRtl ? "rtl" : "ltr"}
                                                        options={childrenOptions}
                                                        selectedValue={field.value}
                                                        onSelectedValueChange={field.onChange}
                                                        placeholder={t('selectChildPlaceholder')}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        )}

                                        <FormField name="instrument" control={form.control} render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>{t('instrument')}</FormLabel>
                                                <Combobox dir={isRtl ? "rtl" : "ltr"}
                                                    options={instrumentOptions}
                                                    selectedValue={field.value}
                                                    onSelectedValueChange={field.onChange}
                                                    placeholder={t('selectInstrumentPlaceholder')}
                                                    disabled={!selectedStudentId}
                                                />
                                                {studentInstruments.length > 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('instrumentHint')}
                                                    </p>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField name="teacherId" control={form.control} render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>{t('teacher')}</FormLabel>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <ToggleGroup type="single" value={teacherScope} onValueChange={v => setTeacherScope((v || 'own') as 'own' | 'all')} size="sm">
                                                        <ToggleGroupItem value="own" className="text-xs">{t('myConservatorium')}</ToggleGroupItem>
                                                        <ToggleGroupItem value="all" className="text-xs">{t('allTeachers')}</ToggleGroupItem>
                                                    </ToggleGroup>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPremiumOnly(v => !v)}
                                                        className={cn(
                                                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors",
                                                            premiumOnly
                                                                ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                                                                : "bg-transparent border-slate-200 text-slate-500 hover:border-slate-300"
                                                        )}
                                                    >
                                                        <Star className={cn("h-3 w-3", premiumOnly ? "fill-yellow-500 text-yellow-500" : "text-slate-400")} />
                                                        {t('premiumLabel')}
                                                    </button>
                                                </div>
                                                <Combobox dir={isRtl ? "rtl" : "ltr"}
                                                    options={filteredTeachers.map(t2 => ({ value: t2.id, label: t2.isPremiumTeacher ? `⭐ ${t2.name!}` : t2.name! }))}
                                                    selectedValue={field.value}
                                                    onSelectedValueChange={field.onChange}
                                                    placeholder={t('selectTeacherPlaceholder')}
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField name="durationMinutes" control={form.control} render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>{t('lessonDuration')}</FormLabel>
                                                <Combobox dir={isRtl ? "rtl" : "ltr"}
                                                    options={durationOptions}
                                                    selectedValue={String(field.value)}
                                                    onSelectedValueChange={v => field.onChange(Number(v))}
                                                    placeholder={t('selectDurationPlaceholder')}
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        {selectedStudentId && (user?.role === 'student' || user?.role === 'parent') && (
                                            <div className="pt-4 border-t">
                                                {activePackage ? (
                                                    <Alert variant={hasCredits ? 'default' : 'destructive'}>
                                                        {hasCredits ? <Info className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                                        <AlertTitle>{activePackage.title}</AlertTitle>
                                                        <AlertDescription>
                                                            {hasCredits
                                                                ? t('creditBalance', { remaining: String((activePackage.totalCredits || 0) - (activePackage.usedCredits || 0)), total: String(activePackage.totalCredits || 0) })
                                                                : t('noCreditsLeft')}
                                                        </AlertDescription>
                                                    </Alert>
                                                ) : (
                                                    <Alert variant="destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <AlertTitle>{t('noActivePackage')}</AlertTitle>
                                                        <AlertDescription>{t('noActivePackageDesc')}</AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Calendar + Time Slots */}
                                    <div className="grid sm:grid-cols-[auto_1fr] gap-8">
                                        {/* Calendar Column */}
                                        <div className="space-y-4">
                                            <h3 className="font-semibold">{t('step2DateTime')}</h3>
                                            <FormField name="date" control={form.control} render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => isBefore(date, new Date())}
                                                            initialFocus
                                                            fixedWeeks
                                                            locale={dateLocale}
                                                            className="rounded-md border"
                                                            components={isRtl ? {
                                                                Chevron: ({ orientation, ...props }) =>
                                                                    orientation === 'left'
                                                                        ? <ChevronRight {...props} className="h-4 w-4" />
                                                                        : <ChevronLeft {...props} className="h-4 w-4" />,
                                                            } : undefined}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        {/* Time Slots Column */}
                                        <div className="space-y-4">
                                            <h3 className="font-semibold">{t('step3Time')}</h3>
                                            <FormField name="time" control={form.control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('availableTimeSlots')}</FormLabel>
                                                    <FormControl>
                                                        <div>
                                                            {!selectedTeacherId && (
                                                                <p className="text-center text-sm text-muted-foreground p-8 border rounded-md">
                                                                    {t('selectTeacherFirst')}
                                                                </p>
                                                            )}
                                                            {selectedTeacherId && isLoadingSlots && (
                                                                <div className="flex justify-center items-center h-48 border rounded-md">
                                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            {selectedTeacherId && !isLoadingSlots && availableSlots.length === 0 && (
                                                                <p className="text-center text-sm text-muted-foreground p-8 border rounded-md">{t('noAvailableTimeSlots')}</p>
                                                            )}
                                                            {selectedTeacherId && !isLoadingSlots && availableSlots.length > 0 && (
                                                                <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1">
                                                                    {availableSlots.map(slot => (
                                                                        <button
                                                                            key={slot}
                                                                            type="button"
                                                                            onClick={() => form.setValue('time', slot, { shouldValidate: true })}
                                                                            className={cn(
                                                                                "rounded-lg border px-3 py-2 text-sm font-mono font-medium transition-colors cursor-pointer",
                                                                                field.value === slot
                                                                                    ? "bg-primary text-primary-foreground border-primary"
                                                                                    : "border-border hover:border-primary hover:bg-primary/5"
                                                                            )}
                                                                        >
                                                                            {slot}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>{/* end calendar+slots sub-grid */}
                                </div>{/* end outer grid */}

                                <div>
                                    <Button type="submit" disabled={!form.formState.isValid || (user?.role === 'student' || user?.role === 'parent' ? !activePackage : false)}>
                                        {t('bookLesson')}
                                    </Button>
                                    {!activePackage && (user?.role === 'student' || user?.role === 'parent') && (
                                        <p className="text-xs text-destructive text-center mt-1">{t('noActivePackage')}</p>
                                    )}
                                </div>
                            </form>
                        </FormProvider>
                    </TabsContent>

                    {/* ── Last-minute deals ── */}
                    <TabsContent value="deals">
                        <DealsTabContent
                            studentId={selectedStudentId || (user?.role === 'student' ? user.id : '')}
                            hasCredits={hasCredits}
                            activePackageTitle={activePackage?.title || ''}
                            onBook={handleBookDeal}
                            isRtl={isRtl}
                            pendingSlotId={pendingSlotId}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
