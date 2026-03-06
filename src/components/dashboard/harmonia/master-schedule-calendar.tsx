'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { LessonSlot, User, Room } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, SlidersHorizontal, User as UserIcon, DoorOpen, Music, Building2 } from 'lucide-react';
import { addDays, startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const timeSlots = Array.from({ length: 13 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

const LessonItem = ({ lesson }: { lesson: LessonSlot }) => {
    const { users } = useAuth();
    const student = users.find(u => u.id === lesson.studentId);
    const teacher = users.find(u => u.id === lesson.teacherId);
    const isCancelled = lesson.status.startsWith('CANCELLED') || lesson.status.startsWith('NO_SHOW');

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "p-1.5 rounded-md text-[10px] h-full overflow-hidden text-right leading-tight",
                        isCancelled ? "bg-gray-100 border-r-2 border-gray-400 text-gray-500 italic" : "bg-blue-50 border-r-2 border-blue-400 text-blue-800"
                    )}>
                        <p className="font-bold truncate">{student?.name}</p>
                        <p className="truncate text-blue-700/80">{teacher?.name}</p>
                        <p className="truncate text-blue-700/60">{lesson.instrument}</p>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{lesson.instrument} with {teacher?.name}</p>
                    <p>Student: {student?.name}</p>
                    <p>Status: {lesson.status}</p>
                    <p>Room: {lesson.roomId}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export function MasterScheduleCalendar() {
    const { user, users, lessons, branches, rooms, conservatoriumInstruments } = useAuth();
    const dateLocale = useDateLocale();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filters, setFilters] = useState({
        branchId: 'all',
        teacherId: 'all',
        roomId: 'all',
        instrument: 'all',
    });

    const teachers = useMemo(() => users.filter(u => u.role === 'teacher'), [users]);

    const instrumentOptions = useMemo(() => {
        const fromDb = conservatoriumInstruments
            .map((entry) => entry.names.he || entry.names.en)
            .filter(Boolean) as string[];
        return Array.from(new Set(fromDb));
    }, [conservatoriumInstruments]);

    const weekInterval = {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
    };

    const daysOfWeek = eachDayOfInterval(weekInterval);

    const filteredRooms = useMemo(() => {
        if (filters.branchId === 'all') return rooms;
        return rooms.filter(r => r.branchId === filters.branchId);
    }, [filters.branchId]);

    const filteredLessons = useMemo(() => {
        return lessons.filter(lesson => {
            const lessonDate = new Date(lesson.startTime);
            const inCurrentWeek = lessonDate >= weekInterval.start && lessonDate <= weekInterval.end;
            if (!inCurrentWeek) return false;

            if (filters.branchId !== 'all' && lesson.branchId !== filters.branchId) return false;
            if (filters.teacherId !== 'all' && lesson.teacherId !== filters.teacherId) return false;
            if (filters.roomId !== 'all' && lesson.roomId !== filters.roomId) return false;
            if (filters.instrument !== 'all' && lesson.instrument !== filters.instrument) return false;

            return true;
        });
    }, [lessons, weekInterval, filters]);

    const getLessonsForSlot = (day: Date, time: string) => {
        const slotStartHour = parseInt(time.split(':')[0]);
        return filteredLessons.filter(lesson => {
            const lessonDate = new Date(lesson.startTime);
            return lessonDate.toDateString() === day.toDateString() && lessonDate.getHours() === slotStartHour;
        });
    };

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => {
            const newFilters = { ...prev, [filterName]: value };
            if (filterName === 'branchId') {
                // Reset room filter when branch changes
                newFilters.roomId = 'all';
            }
            return newFilters;
        });
    };

    const handleWeekChange = (direction: 'next' | 'prev') => {
        setCurrentDate(current => addDays(current, direction === 'next' ? 7 : -7));
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleWeekChange('prev')}><ArrowRight className="h-4 w-4" /></Button>
                        <span className="font-semibold text-lg">{format(weekInterval.start, 'd בMMM')} - {format(weekInterval.end, 'd בMMM yyyy', { locale: dateLocale })}</span>
                        <Button variant="outline" size="icon" onClick={() => handleWeekChange('next')}><ArrowLeft className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
                        <Select dir="rtl" value={filters.branchId} onValueChange={(v) => handleFilterChange('branchId', v)}><SelectTrigger className="w-[180px]"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><SelectValue placeholder="כל הסניפים" /></div></SelectTrigger><SelectContent><SelectItem value="all">כל הסניפים</SelectItem>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>
                        <Select dir="rtl" value={filters.teacherId} onValueChange={(v) => handleFilterChange('teacherId', v)}><SelectTrigger className="w-[180px]"><div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" /><SelectValue placeholder="כל המורים" /></div></SelectTrigger><SelectContent><SelectItem value="all">כל המורים</SelectItem>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                        <Select dir="rtl" value={filters.roomId} onValueChange={(v) => handleFilterChange('roomId', v)}><SelectTrigger className="w-[180px]"><div className="flex items-center gap-2"><DoorOpen className="h-4 w-4 text-muted-foreground" /><SelectValue placeholder="כל החדרים" /></div></SelectTrigger><SelectContent><SelectItem value="all">כל החדרים</SelectItem>{filteredRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select>
                        <Select dir="rtl" value={filters.instrument} onValueChange={(v) => handleFilterChange('instrument', v)}><SelectTrigger className="w-[180px]"><div className="flex items-center gap-2"><Music className="h-4 w-4 text-muted-foreground" /><SelectValue placeholder="כל הכלים" /></div></SelectTrigger><SelectContent><SelectItem value="all">כל הכלים</SelectItem>{instrumentOptions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-[auto_repeat(7,1fr)] min-w-[900px] overflow-x-auto">
                    <div className="p-2 border-b border-s"></div>
                    {daysOfWeek.map((day) => (
                        <div key={day.toISOString()} className="text-center font-semibold p-2 border-b border-s text-sm">
                            {format(day, 'EEE', { locale: dateLocale })}
                            <div className="font-normal text-xs text-muted-foreground">{format(day, 'd/M')}</div>
                        </div>
                    ))}

                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className="text-center text-xs text-muted-foreground p-2 border-s h-24 flex items-center justify-center font-mono">
                                {time}
                            </div>
                            {daysOfWeek.map((day, dayIndex) => {
                                const slotLessons = getLessonsForSlot(day, time);
                                return (
                                    <div key={`${dayIndex}-${time}`} className="border-b border-s p-1 space-y-1">
                                        {slotLessons.map(lesson => (
                                            <LessonItem key={lesson.id} lesson={lesson} />
                                        ))}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}