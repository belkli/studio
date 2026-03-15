'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations, useLocale } from 'next-intl';
import { useDateLocale } from '@/hooks/use-date-locale';
import { tenantFilter, tenantUsers } from '@/lib/tenant-filter';
import type { LessonSlot, SlotStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    ChevronLeft,
    ChevronRight,
    X,
    CalendarDays,
    Calendar,
} from 'lucide-react';
import {
    format,
    addDays,
    addWeeks,
    subDays,
    subWeeks,
    startOfWeek,
    eachDayOfInterval,
    isSameDay,
    parseISO,
} from 'date-fns';

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────
type ViewMode = 'day' | 'week';

interface FilterState {
    teacherId: string;
    room: string;
    instrument: string;
    status: string;
}

// ─────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────
const START_HOUR = 7;
const END_HOUR = 22;
const SLOT_MINUTES = 30;

const TIME_SLOTS: string[] = [];
for (let h = START_HOUR; h < END_HOUR; h++) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const STATUS_COLORS: Record<string, string> = {
    SCHEDULED: 'bg-blue-50 border-blue-400 text-blue-800',
    COMPLETED: 'bg-green-50 border-green-400 text-green-800',
    CANCELLED_STUDENT_NOTICED: 'bg-red-50 border-red-400 text-red-700',
    CANCELLED_STUDENT_NO_NOTICE: 'bg-red-50 border-red-400 text-red-700',
    CANCELLED_TEACHER: 'bg-red-50 border-red-400 text-red-700',
    CANCELLED_CONSERVATORIUM: 'bg-red-50 border-red-400 text-red-700',
    NO_SHOW_STUDENT: 'bg-orange-50 border-orange-400 text-orange-800',
    NO_SHOW_TEACHER: 'bg-orange-50 border-orange-400 text-orange-800',
};

const STATUS_DOT_COLORS: Record<string, string> = {
    SCHEDULED: 'bg-blue-500',
    COMPLETED: 'bg-green-500',
    CANCELLED_STUDENT_NOTICED: 'bg-red-500',
    CANCELLED_STUDENT_NO_NOTICE: 'bg-red-500',
    CANCELLED_TEACHER: 'bg-red-500',
    CANCELLED_CONSERVATORIUM: 'bg-red-500',
    NO_SHOW_STUDENT: 'bg-orange-500',
    NO_SHOW_TEACHER: 'bg-orange-500',
};

function getStatusGroup(status: SlotStatus): 'scheduled' | 'completed' | 'cancelled' | 'makeup' {
    if (status === 'SCHEDULED') return 'scheduled';
    if (status === 'COMPLETED') return 'completed';
    if (status.startsWith('NO_SHOW')) return 'makeup';
    return 'cancelled';
}

// ─────────────────────────────────────────────────────────
//  LessonBlock
// ─────────────────────────────────────────────────────────
function LessonBlock({ lesson, compact = false }: { lesson: LessonSlot; compact?: boolean }) {
    const { users } = useAuth();
    const t = useTranslations('MasterSchedule');
    const student = users.find(u => u.id === lesson.studentId);
    const teacher = users.find(u => u.id === lesson.teacherId);
    const colorClass = STATUS_COLORS[lesson.status] ?? STATUS_COLORS.SCHEDULED;
    const startDate = parseISO(lesson.startTime);
    const startHHMM = format(startDate, 'HH:mm');
    const endDate = new Date(startDate.getTime() + lesson.durationMinutes * 60000);
    const endHHMM = format(endDate, 'HH:mm');

    const content = (
        <div
            className={cn(
                'rounded border-e-2 text-start overflow-hidden cursor-default select-none',
                colorClass,
                compact ? 'p-0.5 text-[9px] leading-tight' : 'p-1.5 text-[10px] leading-tight',
            )}
        >
            <div className={cn('font-semibold truncate', compact ? 'text-[9px]' : 'text-[10px]')}>
                {student?.name ?? t('unknown')}
            </div>
            {!compact && (
                <>
                    <div className="truncate opacity-80">{teacher?.name ?? t('unknown')}</div>
                    <div className="truncate opacity-60">{lesson.instrument}</div>
                </>
            )}
        </div>
    );

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-start">
                    <p className="font-semibold">{student?.name ?? t('unknown')}</p>
                    <p>{t('tooltipTeacher')}: {teacher?.name ?? t('unknown')}</p>
                    <p>{t('tooltipInstrument')}: {lesson.instrument}</p>
                    <p>{t('tooltipTime')}: {startHHMM}–{endHHMM}</p>
                    <p>{t('tooltipStatus')}: {lesson.status}</p>
                    {lesson.roomId && <p>{t('tooltipRoom')}: {lesson.roomId}</p>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// ─────────────────────────────────────────────────────────
//  DayViewDesktop — time grid with teacher columns
// ─────────────────────────────────────────────────────────
function DayViewDesktop({
    date,
    lessons,
    teachers,
    isRtl,
}: {
    date: Date;
    lessons: LessonSlot[];
    teachers: { id: string; name: string; instrument?: string }[];
    isRtl: boolean;
}) {
    const t = useTranslations('MasterSchedule');

    const getLessonsForSlot = useCallback(
        (teacherId: string, timeSlot: string) => {
            const [h, m] = timeSlot.split(':').map(Number);
            return lessons.filter(l => {
                const d = parseISO(l.startTime);
                return (
                    l.teacherId === teacherId &&
                    isSameDay(d, date) &&
                    d.getHours() === h &&
                    d.getMinutes() === m
                );
            });
        },
        [lessons, date],
    );

    const displayedTeachers = teachers.length > 0
        ? teachers
        : [{ id: '_none', name: t('noTeachersFound') }];

    // For RTL, reverse teacher columns
    const orderedTeachers = isRtl ? [...displayedTeachers].reverse() : displayedTeachers;

    const colCount = orderedTeachers.length;
    const gridCols = `80px repeat(${colCount}, minmax(120px, 1fr))`;

    return (
        <div className="overflow-x-auto">
            <div
                style={{ display: 'grid', gridTemplateColumns: gridCols, minWidth: 400 }}
                className="border rounded-md"
            >
                {/* Header row */}
                <div className="p-2 border-b border-e bg-muted/40 text-xs font-mono text-muted-foreground sticky start-0 z-10">
                    {t('time')}
                </div>
                {orderedTeachers.map(teacher => (
                    <div
                        key={teacher.id}
                        className="p-2 border-b border-e bg-muted/40 text-xs font-semibold text-center truncate"
                    >
                        {teacher.name}
                        {teacher.instrument && (
                            <span className="block font-normal opacity-60 text-[10px]">
                                {teacher.instrument}
                            </span>
                        )}
                    </div>
                ))}

                {/* Time rows */}
                {TIME_SLOTS.map(slot => (
                    <React.Fragment key={slot}>
                        <div
                            className={cn(
                                'p-1 border-b border-e text-xs font-mono text-muted-foreground flex items-start justify-center sticky start-0 bg-background z-10 h-12',
                                slot.endsWith(':00') ? 'font-semibold text-foreground/80' : 'opacity-50',
                            )}
                        >
                            {slot}
                        </div>
                        {orderedTeachers.map(teacher => {
                            const slotLessons =
                                teacher.id === '_none' ? [] : getLessonsForSlot(teacher.id, slot);
                            return (
                                <div key={teacher.id} className="border-b border-e p-0.5 h-12 space-y-0.5">
                                    {slotLessons.map(l => (
                                        <LessonBlock key={l.id} lesson={l} />
                                    ))}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
//  DayViewMobile — flat list
// ─────────────────────────────────────────────────────────
function DayViewMobile({ date, lessons }: { date: Date; lessons: LessonSlot[] }) {
    const { users } = useAuth();
    const t = useTranslations('MasterSchedule');
    const dateLocale = useDateLocale();

    const dayLessons = lessons
        .filter(l => isSameDay(parseISO(l.startTime), date))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const statusDot = (status: SlotStatus) =>
        STATUS_DOT_COLORS[status] ?? STATUS_DOT_COLORS.SCHEDULED;

    if (dayLessons.length === 0) {
        return (
            <div className="py-12 text-center text-muted-foreground text-sm">
                {t('noLessons')}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {dayLessons.map(lesson => {
                const student = users.find(u => u.id === lesson.studentId);
                const teacher = users.find(u => u.id === lesson.teacherId);
                const d = parseISO(lesson.startTime);
                const startStr = format(d, 'HH:mm');
                const endDate = new Date(d.getTime() + lesson.durationMinutes * 60000);
                const endStr = format(endDate, 'HH:mm');

                return (
                    <div
                        key={lesson.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                        <div className="text-xs font-mono text-muted-foreground pt-0.5 shrink-0 w-16 text-end">
                            <div>{startStr}</div>
                            <div className="opacity-60">–{endStr}</div>
                        </div>
                        <div
                            className={cn(
                                'w-1 self-stretch rounded-full shrink-0',
                                statusDot(lesson.status),
                            )}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                                {student?.name ?? t('unknown')}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {teacher?.name ?? t('unknown')} · {lesson.instrument}
                            </p>
                            {lesson.roomId && (
                                <p className="text-xs text-muted-foreground">
                                    {t('tooltipRoom')}: {lesson.roomId}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────
//  WeekViewDesktop
// ─────────────────────────────────────────────────────────
function WeekViewDesktop({
    weekStart,
    lessons,
    isRtl,
}: {
    weekStart: Date;
    lessons: LessonSlot[];
    isRtl: boolean;
}) {
    const t = useTranslations('MasterSchedule');
    const dateLocale = useDateLocale();

    const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
    const orderedDays = isRtl ? [...days].reverse() : days;
    const colCount = 7;
    const gridCols = `64px repeat(${colCount}, minmax(80px, 1fr))`;
    const today = new Date();

    const getLessonsForDaySlot = useCallback(
        (day: Date, slot: string) => {
            const [h, m] = slot.split(':').map(Number);
            return lessons.filter(l => {
                const d = parseISO(l.startTime);
                return isSameDay(d, day) && d.getHours() === h && d.getMinutes() === m;
            });
        },
        [lessons],
    );

    return (
        <div className="overflow-x-auto">
            <div
                style={{ display: 'grid', gridTemplateColumns: gridCols, minWidth: 640 }}
                className="border rounded-md"
            >
                {/* Header */}
                <div className="p-2 border-b border-e bg-muted/40 sticky start-0 z-10" />
                {orderedDays.map(day => (
                    <div
                        key={day.toISOString()}
                        className={cn(
                            'p-2 border-b border-e text-center text-xs font-semibold',
                            isSameDay(day, today) && 'bg-blue-50 text-blue-700',
                        )}
                    >
                        <div>{format(day, 'EEE', { locale: dateLocale })}</div>
                        <div className="font-normal opacity-70">{format(day, 'd/M')}</div>
                    </div>
                ))}

                {TIME_SLOTS.map(slot => (
                    <React.Fragment key={slot}>
                        <div
                            className={cn(
                                'p-1 border-b border-e text-[10px] font-mono text-muted-foreground flex items-start justify-end pe-1 sticky start-0 bg-background z-10 h-8',
                                slot.endsWith(':30') && 'opacity-40',
                            )}
                        >
                            {slot.endsWith(':00') ? slot : ''}
                        </div>
                        {orderedDays.map(day => {
                            const slotLessons = getLessonsForDaySlot(day, slot);
                            return (
                                <div
                                    key={day.toISOString()}
                                    className={cn(
                                        'border-b border-e p-0.5 h-8 space-y-px',
                                        isSameDay(day, today) && 'bg-blue-50/30',
                                    )}
                                >
                                    {slotLessons.map(l => (
                                        <LessonBlock key={l.id} lesson={l} compact />
                                    ))}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
//  WeekViewMobile — day-by-day accordion style
// ─────────────────────────────────────────────────────────
function WeekViewMobile({
    weekStart,
    lessons,
}: {
    weekStart: Date;
    lessons: LessonSlot[];
}) {
    const t = useTranslations('MasterSchedule');
    const dateLocale = useDateLocale();
    const today = new Date();

    const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    return (
        <div className="space-y-3">
            {days.map(day => {
                const dayLessons = lessons
                    .filter(l => isSameDay(parseISO(l.startTime), day))
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                    <div key={day.toISOString()} className="border rounded-lg overflow-hidden">
                        <div
                            className={cn(
                                'px-3 py-2 text-sm font-semibold',
                                isSameDay(day, today)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-muted/50 text-muted-foreground',
                            )}
                        >
                            {format(day, 'EEEE, d MMMM', { locale: dateLocale })}
                            {dayLessons.length > 0 && (
                                <Badge variant="secondary" className="ms-2 text-[10px]">
                                    {dayLessons.length}
                                </Badge>
                            )}
                        </div>
                        {dayLessons.length === 0 ? (
                            <p className="px-3 py-4 text-xs text-muted-foreground">
                                {t('noLessons')}
                            </p>
                        ) : (
                            <div className="divide-y">
                                {dayLessons.map(lesson => (
                                    <MobileLessonRow key={lesson.id} lesson={lesson} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function MobileLessonRow({ lesson }: { lesson: LessonSlot }) {
    const { users } = useAuth();
    const t = useTranslations('MasterSchedule');
    const student = users.find(u => u.id === lesson.studentId);
    const teacher = users.find(u => u.id === lesson.teacherId);
    const d = parseISO(lesson.startTime);
    const startStr = format(d, 'HH:mm');
    const endDate = new Date(d.getTime() + lesson.durationMinutes * 60000);
    const endStr = format(endDate, 'HH:mm');
    const dotColor = STATUS_DOT_COLORS[lesson.status] ?? STATUS_DOT_COLORS.SCHEDULED;

    return (
        <div className="flex items-center gap-3 px-3 py-2">
            <div className="text-xs font-mono text-muted-foreground shrink-0 w-14 text-end">
                {startStr}–{endStr}
            </div>
            <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{student?.name ?? t('unknown')}</p>
                <p className="text-xs text-muted-foreground truncate">
                    {teacher?.name ?? t('unknown')} · {lesson.instrument}
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
//  FilterChips
// ─────────────────────────────────────────────────────────
function FilterChips({
    filters,
    teachers,
    rooms,
    instruments,
    onRemove,
    onClear,
}: {
    filters: FilterState;
    teachers: { id: string; name: string }[];
    rooms: string[];
    instruments: string[];
    onRemove: (key: keyof FilterState) => void;
    onClear: () => void;
}) {
    const t = useTranslations('MasterSchedule');

    const active = [
        filters.teacherId !== 'all' && {
            key: 'teacherId' as const,
            label: `${t('filterTeacher')}: ${teachers.find(tc => tc.id === filters.teacherId)?.name ?? filters.teacherId}`,
        },
        filters.room !== 'all' && {
            key: 'room' as const,
            label: `${t('filterRoom')}: ${filters.room}`,
        },
        filters.instrument !== 'all' && {
            key: 'instrument' as const,
            label: `${t('filterInstrument')}: ${filters.instrument}`,
        },
        filters.status !== 'all' && {
            key: 'status' as const,
            label: `${t('filterStatus')}: ${filters.status}`,
        },
    ].filter(Boolean) as { key: keyof FilterState; label: string }[];

    if (active.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5 items-center">
            {active.map(chip => (
                <Badge
                    key={chip.key}
                    variant="secondary"
                    className="flex items-center gap-1 pe-1 text-xs cursor-default"
                >
                    {chip.label}
                    <button
                        type="button"
                        aria-label={`Remove ${chip.label} filter`}
                        className="ms-0.5 rounded hover:bg-muted p-0.5"
                        onClick={() => onRemove(chip.key)}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
            <button
                type="button"
                className="text-xs text-muted-foreground underline hover:text-foreground"
                onClick={onClear}
            >
                {t('clearFilters')}
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
//  useMediaQuery
// ─────────────────────────────────────────────────────────
function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mql = window.matchMedia(query);
        setMatches(mql.matches);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

// ─────────────────────────────────────────────────────────
//  MasterScheduleView — main export
// ─────────────────────────────────────────────────────────
export function MasterScheduleView() {
    const { user, users, lessons } = useAuth();
    const t = useTranslations('MasterSchedule');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const dateLocale = useDateLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const isMobile = useMediaQuery('(max-width: 767px)');

    // ── Derive initial state from URL params ──
    const [initialised, setInitialised] = useState(false);
    const [view, setView] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [filters, setFilters] = useState<FilterState>({
        teacherId: 'all',
        room: 'all',
        instrument: 'all',
        status: 'all',
    });

    // Sync URL → state on mount
    useEffect(() => {
        const v = searchParams.get('view') as ViewMode | null;
        const d = searchParams.get('date');
        const teacher = searchParams.get('teacher');
        const room = searchParams.get('room');
        const instrument = searchParams.get('instrument');
        const status = searchParams.get('status');

        if (v === 'day' || v === 'week') setView(v);
        if (d) {
            const parsed = new Date(d);
            if (!isNaN(parsed.getTime())) setCurrentDate(parsed);
        }
        setFilters({
            teacherId: teacher ?? 'all',
            room: room ?? 'all',
            instrument: instrument ?? 'all',
            status: status ?? 'all',
        });
        setInitialised(true);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-default to day view on mobile
    useEffect(() => {
        if (isMobile && view === 'week') {
            setView('day');
        }
    }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync state → URL
    const syncUrl = useCallback(
        (
            nextView: ViewMode,
            nextDate: Date,
            nextFilters: FilterState,
        ) => {
            const params = new URLSearchParams();
            params.set('view', nextView);
            params.set('date', format(nextDate, 'yyyy-MM-dd'));
            if (nextFilters.teacherId !== 'all') params.set('teacher', nextFilters.teacherId);
            if (nextFilters.room !== 'all') params.set('room', nextFilters.room);
            if (nextFilters.instrument !== 'all') params.set('instrument', nextFilters.instrument);
            if (nextFilters.status !== 'all') params.set('status', nextFilters.status);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [pathname, router],
    );

    const handleViewChange = (newView: ViewMode) => {
        setView(newView);
        syncUrl(newView, currentDate, filters);
    };

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        let next: Date;
        if (direction === 'today') {
            next = new Date();
        } else if (view === 'day') {
            next = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
        } else {
            next = direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1);
        }
        setCurrentDate(next);
        syncUrl(view, next, filters);
    };

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        const next = { ...filters, [key]: value };
        setFilters(next);
        syncUrl(view, currentDate, next);
    };

    const handleRemoveFilter = (key: keyof FilterState) => {
        handleFilterChange(key, 'all');
    };

    const handleClearFilters = () => {
        const empty: FilterState = { teacherId: 'all', room: 'all', instrument: 'all', status: 'all' };
        setFilters(empty);
        syncUrl(view, currentDate, empty);
    };

    // ── Data ──
    const teachers = useMemo(
        () => (user ? tenantUsers(users, user, 'teacher') : []),
        [users, user],
    );

    const allInstruments = useMemo(() => {
        const set = new Set<string>();
        lessons.forEach(l => l.instrument && set.add(l.instrument));
        return Array.from(set).sort();
    }, [lessons]);

    const allRooms = useMemo(() => {
        const set = new Set<string>();
        lessons.forEach(l => l.roomId && set.add(l.roomId));
        return Array.from(set).sort();
    }, [lessons]);

    const filteredLessons = useMemo(() => {
        const tenantLessons = user ? tenantFilter(lessons, user) : lessons;
        return tenantLessons.filter(l => {
            if (filters.teacherId !== 'all' && l.teacherId !== filters.teacherId) return false;
            if (filters.room !== 'all' && l.roomId !== filters.room) return false;
            if (filters.instrument !== 'all' && l.instrument !== filters.instrument) return false;
            if (filters.status !== 'all' && getStatusGroup(l.status) !== filters.status) return false;
            return true;
        });
    }, [user, lessons, filters]);

    // Teachers to display in day view (apply teacher filter)
    const visibleTeachers = useMemo(() => {
        const base = teachers.map(u => ({
            id: u.id,
            name: u.name,
            instrument: undefined as string | undefined,
        }));
        if (filters.teacherId !== 'all') {
            return base.filter(t => t.id === filters.teacherId);
        }
        return base;
    }, [teachers, filters.teacherId]);

    // Compute week start (Sunday)
    const weekStart = useMemo(
        () => startOfWeek(currentDate, { weekStartsOn: 0 }),
        [currentDate],
    );

    // ── Date label ──
    const dateLabel = useMemo(() => {
        if (view === 'day') {
            return format(currentDate, 'EEEE, d MMMM yyyy', { locale: dateLocale });
        }
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, 'd MMM', { locale: dateLocale })} – ${format(weekEnd, 'd MMM yyyy', { locale: dateLocale })}`;
    }, [view, currentDate, weekStart, dateLocale]);

    const isToday = view === 'day' && isSameDay(currentDate, new Date());

    // ── Navigation arrow direction ──
    const prevIcon = isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />;
    const nextIcon = isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />;

    return (
        <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* ── Toolbar row 1: title + view toggle ── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-xl font-bold">{t('title')}</h1>
                <ToggleGroup
                    type="single"
                    value={view}
                    onValueChange={v => v && handleViewChange(v as ViewMode)}
                    className="border rounded-md overflow-hidden"
                >
                    <ToggleGroupItem value="day" aria-label={t('viewDay')} className="px-3 py-1.5 text-sm gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        {t('viewDay')}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="week" aria-label={t('viewWeek')} className="px-3 py-1.5 text-sm gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {t('viewWeek')}
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            {/* ── Toolbar row 2: navigation ── */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="icon" onClick={() => handleNavigate('prev')} aria-label={t('prev')}>
                    {prevIcon}
                </Button>
                <Button
                    variant={isToday ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleNavigate('today')}
                >
                    {t('today')}
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleNavigate('next')} aria-label={t('next')}>
                    {nextIcon}
                </Button>
                <span className="ms-2 text-sm font-medium text-muted-foreground">{dateLabel}</span>
            </div>

            {/* ── Toolbar row 3: filters ── */}
            <div className="flex flex-wrap items-center gap-2">
                <Select
                    dir={isRtl ? 'rtl' : 'ltr'}
                    value={filters.teacherId}
                    onValueChange={v => handleFilterChange('teacherId', v)}
                >
                    <SelectTrigger className="w-[160px] text-sm">
                        <SelectValue placeholder={t('filterTeacher')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('allTeachers')}</SelectItem>
                        {teachers.map(tc => (
                            <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    dir={isRtl ? 'rtl' : 'ltr'}
                    value={filters.room}
                    onValueChange={v => handleFilterChange('room', v)}
                >
                    <SelectTrigger className="w-[140px] text-sm">
                        <SelectValue placeholder={t('filterRoom')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('allRooms')}</SelectItem>
                        {allRooms.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    dir={isRtl ? 'rtl' : 'ltr'}
                    value={filters.instrument}
                    onValueChange={v => handleFilterChange('instrument', v)}
                >
                    <SelectTrigger className="w-[160px] text-sm">
                        <SelectValue placeholder={t('filterInstrument')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('allInstruments')}</SelectItem>
                        {allInstruments.map(i => (
                            <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    dir={isRtl ? 'rtl' : 'ltr'}
                    value={filters.status}
                    onValueChange={v => handleFilterChange('status', v)}
                >
                    <SelectTrigger className="w-[140px] text-sm">
                        <SelectValue placeholder={t('filterStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('allStatuses')}</SelectItem>
                        <SelectItem value="scheduled">{t('statusScheduled')}</SelectItem>
                        <SelectItem value="completed">{t('statusCompleted')}</SelectItem>
                        <SelectItem value="cancelled">{t('statusCancelled')}</SelectItem>
                        <SelectItem value="makeup">{t('statusMakeup')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ── Active filter chips ── */}
            <FilterChips
                filters={filters}
                teachers={teachers}
                rooms={allRooms}
                instruments={allInstruments}
                onRemove={handleRemoveFilter}
                onClear={handleClearFilters}
            />

            {/* ── Calendar body ── */}
            {view === 'day' ? (
                isMobile ? (
                    <DayViewMobile date={currentDate} lessons={filteredLessons} />
                ) : (
                    <DayViewDesktop
                        date={currentDate}
                        lessons={filteredLessons}
                        teachers={visibleTeachers}
                        isRtl={isRtl}
                    />
                )
            ) : isMobile ? (
                <WeekViewMobile weekStart={weekStart} lessons={filteredLessons} />
            ) : (
                <WeekViewDesktop
                    weekStart={weekStart}
                    lessons={filteredLessons}
                    isRtl={isRtl}
                />
            )}
        </div>
    );
}
