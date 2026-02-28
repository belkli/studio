'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { mockRooms } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations, useLocale } from 'next-intl';
import { format, startOfWeek } from 'date-fns';

const timeSlots = Array.from({ length: 13 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`); // 08:00 to 20:00
const totalRooms = mockRooms.length;

export function RoomOccupancyHeatmap() {
    const t = useTranslations('Reports');
    const { mockLessons } = useAuth();
    const locale = useLocale();

    const days = [
        { name: locale === 'he' ? "א" : locale === 'ru' ? "Пн" : locale === 'ar' ? "ح" : "Sun", key: 0 },
        { name: locale === 'he' ? "ב" : locale === 'ru' ? "Вт" : locale === 'ar' ? "ن" : "Mon", key: 1 },
        { name: locale === 'he' ? "ג" : locale === 'ru' ? "Ср" : locale === 'ar' ? "ث" : "Tue", key: 2 },
        { name: locale === 'he' ? "ד" : locale === 'ru' ? "Чт" : locale === 'ar' ? "ر" : "Wed", key: 3 },
        { name: locale === 'he' ? "ה" : locale === 'ru' ? "Пт" : locale === 'ar' ? "خ" : "Thu", key: 4 },
        { name: locale === 'he' ? "ו" : locale === 'ru' ? "Сб" : locale === 'ar' ? "ج" : "Fri", key: 5 },
    ];

    const occupancyData = useMemo(() => {
        const grid: Record<string, { booked: number, rooms: string[] }> = {};

        mockLessons.forEach(lesson => {
            if (lesson.status === 'SCHEDULED' || lesson.status === 'COMPLETED') {
                const lessonDate = new Date(lesson.startTime);
                const dayKey = lessonDate.getDay();
                const hourKey = `${lessonDate.getHours().toString().padStart(2, '0')}:00`;
                const gridKey = `${dayKey}-${hourKey}`;

                if (!grid[gridKey]) {
                    grid[gridKey] = { booked: 0, rooms: [] };
                }

                if (lesson.roomId && !grid[gridKey].rooms.includes(lesson.roomId)) {
                    grid[gridKey].booked++;
                    grid[gridKey].rooms.push(lesson.roomId);
                }
            }
        });
        return grid;

    }, [mockLessons]);

    const getOccupancyLevel = (bookedCount: number): 'none' | 'low' | 'medium' | 'high' | 'full' => {
        if (bookedCount === 0) return 'none';
        const percentage = (bookedCount / totalRooms) * 100;
        if (percentage < 25) return 'low';
        if (percentage < 50) return 'medium';
        if (percentage < 90) return 'high';
        return 'full';
    };

    const occupancyColors: Record<ReturnType<typeof getOccupancyLevel>, string> = {
        none: 'bg-muted/20 hover:bg-muted/40',
        low: 'bg-green-200 dark:bg-green-900/50 hover:bg-green-300',
        medium: 'bg-yellow-200 dark:bg-yellow-800/50 hover:bg-yellow-300',
        high: 'bg-orange-300 dark:bg-orange-700/50 hover:bg-orange-400',
        full: 'bg-red-400 dark:bg-red-600/50 hover:bg-red-500',
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('roomOccupancyHeatmap')}</CardTitle>
                <CardDescription>{t('roomOccupancyDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{t('free')}</span>
                        <div className="w-4 h-4 rounded-sm bg-green-200 border"></div>
                        <div className="w-4 h-4 rounded-sm bg-yellow-200 border"></div>
                        <div className="w-4 h-4 rounded-sm bg-orange-300 border"></div>
                        <div className="w-4 h-4 rounded-sm bg-red-400 border"></div>
                        <span>{t('full')}</span>
                    </div>
                </div>
                <div className="grid grid-cols-[auto_repeat(6,1fr)] text-center text-sm font-semibold min-w-[600px] border rounded-lg overflow-hidden">
                    <div className="p-2 border-s"></div>
                    {days.map(day => (
                        <div key={day.key} className="p-2 border-s bg-muted/50">{day.name}</div>
                    ))}
                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className="p-2 border-s border-t flex items-center justify-center text-xs text-muted-foreground font-mono bg-muted/30">{time}</div>
                            {days.map(day => {
                                const gridKey = `${day.key}-${time}`;
                                const data = occupancyData[gridKey] || { booked: 0, rooms: [] };
                                const occupancyLevel = getOccupancyLevel(data.booked);
                                const colorClass = occupancyColors[occupancyLevel];

                                return (
                                    <TooltipProvider key={`${day.key}-${time}`} delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className={cn("h-8 border-s border-t transition-colors", colorClass)}></div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-semibold">{day.name}, {time}</p>
                                                <p>{t('occupancyInfo', { booked: data.booked, total: totalRooms })}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
