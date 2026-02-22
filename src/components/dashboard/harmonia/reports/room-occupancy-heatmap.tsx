'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { mockRooms } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const days = [
    { he: "א", key: 0 }, // Sunday
    { he: "ב", key: 1 }, // Monday
    { he: "ג", key: 2 }, // Tuesday
    { he: "ד", key: 3 }, // Wednesday
    { he: "ה", key: 4 }, // Thursday
    { he: "ו", key: 5 }, // Friday
];
const timeSlots = Array.from({ length: 13 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`); // 08:00 to 20:00
const totalRooms = mockRooms.length;

export function RoomOccupancyHeatmap() {
    const { mockLessons } = useAuth();

    const occupancyData = useMemo(() => {
        const grid: Record<string, { booked: number, rooms: string[] }> = {};

        // This is a mock for a "typical week". In a real app, this would be based on a selected week.
        mockLessons.forEach(lesson => {
            if (lesson.status === 'SCHEDULED' || lesson.status === 'COMPLETED') {
                const lessonDate = new Date(lesson.startTime);
                const dayKey = lessonDate.getDay();
                const hourKey = `${lessonDate.getHours().toString().padStart(2, '0')}:00`;
                const gridKey = `${dayKey}-${hourKey}`;
                
                if (!grid[gridKey]) {
                    grid[gridKey] = { booked: 0, rooms: [] };
                }
                
                // Avoid double counting if multiple lessons are in the same room at the same time (data issue)
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
                <CardTitle>מפת חום - תפוסת חדרים</CardTitle>
                <CardDescription>תפוסה שעתית של כלל חדרי הלימוד במהלך השבוע. צבע כהה יותר מסמן תפוסה גבוהה יותר.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>פנוי</span>
                        <div className="w-4 h-4 rounded-sm bg-green-200 border"></div>
                        <div className="w-4 h-4 rounded-sm bg-yellow-200 border"></div>
                        <div className="w-4 h-4 rounded-sm bg-orange-300 border"></div>
                        <div className="w-4 h-4 rounded-sm bg-red-400 border"></div>
                        <span>תפוסה מלאה</span>
                    </div>
                </div>
                 <div className="grid grid-cols-[auto_repeat(6,1fr)] text-center text-sm font-semibold min-w-[600px] border rounded-lg overflow-hidden">
                    <div className="p-2 border-s"></div>
                    {days.map(day => (
                        <div key={day.key} className="p-2 border-s bg-muted/50">{day.he}</div>
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
                                                <p className="font-semibold">{days.find(d=>d.key === day.key)?.he}, {time}</p>
                                                <p>תפוסה: {data.booked} מתוך {totalRooms} חדרים</p>
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
