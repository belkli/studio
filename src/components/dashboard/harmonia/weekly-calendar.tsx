'use client';

import type { LessonSlot, User } from "@/lib/types";
import { useCalendar } from "@/hooks/use-calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMinutes, format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import { useDateLocale } from "@/hooks/use-date-locale";

const timeSlots = Array.from({ length: 15 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`); // 8 AM to 10 PM


const CalendarEvent = ({ lesson, student }: { lesson: LessonSlot, student: User | undefined }) => {
    const start = new Date(lesson.startTime);
    const end = addMinutes(start, lesson.durationMinutes);
    const top = (start.getHours() - 8 + start.getMinutes() / 60) * 60; // 8 AM offset, in minutes
    const height = ((end.getTime() - start.getTime()) / (1000 * 60)); // duration in minutes

    return (
        <div
            className="absolute w-full p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs z-10 overflow-hidden"
            style={{
                top: `${top}px`,
                height: `${height}px`,
            }}
            title={`${student?.name} - ${lesson.instrument} (${format(start, 'HH:mm')} - ${format(end, 'HH:mm')})`}
        >
            <p className="font-bold truncate">{student?.name}</p>
            <p className="truncate">{lesson.instrument}</p>
        </div>
    );
};

export const WeeklyCalendar = ({ lessons, students }: { lessons: LessonSlot[], students: User[] }) => {
    const { days, weekDisplay, nextWeek, prevWeek, returnToToday } = useCalendar();
    const t = useTranslations('Dashboard.Teacher.Calendar');
    const locale = useLocale();
    const dateLocale = useDateLocale();
    const isRTL = locale === 'he' || locale === 'ar';

    const displayDays = isRTL ? [...days].reverse() : days;

    return (
        <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Button onClick={returnToToday} variant="outline">{t('today')}</Button>
                    <div className="flex items-center gap-2">
                        <Button onClick={prevWeek} variant="ghost" size="icon" aria-label={t('prevWeek')}>
                            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </Button>
                        <span className="text-lg font-semibold w-48 text-center">{weekDisplay}</span>
                        <Button onClick={nextWeek} variant="ghost" size="icon" aria-label={t('nextWeek')}>
                            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-7 border-t border-s rounded-lg overflow-hidden">
                {displayDays.map(day => (
                    <div key={day.toString()} className="border-e">
                        <div className={cn(
                            "text-center py-2 border-b",
                            isToday(day) && "bg-primary/10 text-primary font-bold"
                        )}>
                            <p className="text-xs uppercase text-muted-foreground">{format(day, 'EEE', { locale: dateLocale })}</p>
                            <p className="text-2xl">{format(day, 'd')}</p>
                        </div>
                        <div className="relative h-[720px]"> {/* 12 hours * 60px/hour */}
                            {/* Grid lines */}
                            {timeSlots.slice(1).map(time => (
                                <div key={time} className="h-[60px] border-t absolute w-full" style={{ top: `${(parseInt(time) - 8) * 60}px` }} />
                            ))}

                            {/* Events */}
                            {lessons
                                .filter(l => format(new Date(l.startTime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                                .map(lesson => (
                                    <CalendarEvent key={lesson.id} lesson={lesson} student={students.find(s => s.id === lesson.studentId)} />
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
