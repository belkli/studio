'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Copy, PlusCircle, Save } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { LessonSlot, WeeklyAvailabilityBlock, DayOfWeek } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTranslations, useLocale } from 'next-intl';

const DAY_KEYS: DayOfWeek[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI"];
const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

export function AvailabilityGrid() {
    const { user, users, mockLessons, updateUser } = useAuth();
    const { toast } = useToast();
    const [availableSlots, setAvailableSlots] = useState<Record<string, boolean>>({});
    const [isDirty, setIsDirty] = useState(false);
    const t = useTranslations('AvailabilityGrid');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    useEffect(() => {
        if (user?.availability) {
            const grid: Record<string, boolean> = {};
            user.availability.forEach(block => {
                const startHour = parseInt(block.startTime.split(':')[0]);
                const endHour = parseInt(block.endTime.split(':')[0]);
                for (let hour = startHour; hour < endHour; hour++) {
                    const time = `${String(hour).padStart(2, '0')}:00`;
                    grid[`${block.dayOfWeek}-${time}`] = true;
                }
            });
            setAvailableSlots(grid);
        }
    }, [user?.availability]);

    const teacherLessons = useMemo(() => {
        if (!user) return {};
        const lessonMap: Record<string, LessonSlot> = {};
        mockLessons.filter(l => l.teacherId === user.id).forEach(lesson => {
            const date = new Date(lesson.startTime);
            const dayIndex = date.getDay();
            const dayKey = (DAY_KEYS[dayIndex] || ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][dayIndex]) as DayOfWeek;
            const time = `${String(date.getHours()).padStart(2, '0')}:00`;
            if (dayKey) {
                lessonMap[`${dayKey}-${time}`] = lesson;
            }
        });
        return lessonMap;
    }, [user, mockLessons]);

    const handleSlotClick = (day: DayOfWeek, time: string) => {
        const key = `${day}-${time}`;
        if (teacherLessons[key]) return; // Don't toggle booked slots

        setAvailableSlots(prev => ({ ...prev, [key]: !prev[key] }));
        setIsDirty(true);
    };

    const handleSaveChanges = () => {
        if (!user) return;

        const newAvailability: WeeklyAvailabilityBlock[] = [];
        DAY_KEYS.forEach(day => {
            let currentBlock: WeeklyAvailabilityBlock | null = null;
            for (let i = 0; i < times.length; i++) {
                const time = times[i];
                const key = `${day}-${time}`;
                if (availableSlots[key]) {
                    if (!currentBlock) {
                        currentBlock = { dayOfWeek: day, startTime: time, endTime: '' };
                    }
                } else {
                    if (currentBlock) {
                        const endHour = parseInt(time.split(':')[0]);
                        currentBlock.endTime = `${String(endHour).padStart(2, '0')}:00`;
                        newAvailability.push(currentBlock);
                        currentBlock = null;
                    }
                }
            }
            if (currentBlock) {
                currentBlock.endTime = '21:00'; // End of the grid
                newAvailability.push(currentBlock);
            }
        });

        updateUser({ ...user, availability: newAvailability });
        setIsDirty(false);
        toast({ title: t('saveSuccess') });
    };

    return (
        <Card dir={isRtl ? 'rtl' : 'ltr'}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" disabled><Copy className={isRtl ? "ms-2 h-4 w-4" : "me-2 h-4 w-4"} /> {t('copyLastWeek')}</Button>
                        <Button disabled><PlusCircle className={isRtl ? "ms-2 h-4 w-4" : "me-2 h-4 w-4"} /> {t('addException')}</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                    <div className="grid grid-cols-[auto_repeat(6,1fr)] text-center text-sm font-semibold min-w-[800px]" dir={isRtl ? 'rtl' : 'ltr'}>
                        <div className="p-2 border-b border-s sticky start-0 bg-card"></div>
                        {DAY_KEYS.map(dayKey => (
                            <div key={dayKey} className="p-2 border-b border-s bg-card">{t(`days.${dayKey}`)}</div>
                        ))}
                        {times.map(time => (
                            <React.Fragment key={time}>
                                <div className="p-2 border-s flex items-center justify-center text-xs text-muted-foreground sticky start-0 bg-card font-mono">{time}</div>
                                {DAY_KEYS.map(dayKey => {
                                    const key = `${dayKey}-${time}`;
                                    const isBooked = teacherLessons[key];
                                    const isAvailable = availableSlots[key];
                                    return (
                                        <div
                                            key={key}
                                            className={cn(
                                                "h-16 border-b border-s p-1 transition-colors",
                                                isBooked ? 'bg-blue-100 dark:bg-blue-900/50 cursor-not-allowed' : 'hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer',
                                                isAvailable && !isBooked && 'bg-green-200/70 dark:bg-green-500/30'
                                            )}
                                            onClick={() => handleSlotClick(dayKey, time)}
                                        >
                                            {isBooked && (
                                                <div className={cn("bg-blue-500/10 p-1 rounded-sm text-xs h-full overflow-hidden", isRtl ? "border-r-4 border-blue-500 text-right" : "border-l-4 border-blue-500 text-left")}>
                                                    <p className="font-bold truncate text-blue-800 dark:text-blue-200">{isBooked.instrument}</p>
                                                    <p className="truncate text-blue-700 dark:text-blue-300">{user?.students?.find(s => s === isBooked.studentId) ? users.find(u => u.id === isBooked.studentId)?.name : t('studentFallback')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="mt-6 flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold">{t('syncTitle')}</h4>
                        <p className="text-sm text-muted-foreground">{t('syncDesc')}</p>
                        <Button variant="secondary" className="mt-2" disabled>{t('connectBtn')}</Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveChanges} disabled={!isDirty}>
                    <Save className={isRtl ? "ms-2 h-4 w-4" : "me-2 h-4 w-4"} />
                    {t('saveBtn')}
                </Button>
            </CardFooter>
        </Card>
    );
}
