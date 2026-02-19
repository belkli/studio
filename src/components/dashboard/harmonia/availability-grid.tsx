'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Copy, PlusCircle, Save } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { LessonSlot, WeeklyAvailabilityBlock, DayOfWeek } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const days: { he: string, key: DayOfWeek }[] = [
    { he: "ראשון", key: "SUN" },
    { he: "שני", key: "MON" },
    { he: "שלישי", key: "TUE" },
    { he: "רביעי", key: "WED" },
    { he: "חמישי", key: "THU" },
    { he: "שישי", key: "FRI" },
];
const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

export function AvailabilityGrid() {
    const { user, mockLessons, updateUser } = useAuth();
    const { toast } = useToast();
    const [availableSlots, setAvailableSlots] = useState<Record<string, boolean>>({});
    const [isDirty, setIsDirty] = useState(false);

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
            const dayKey = days[date.getDay()]?.key;
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
        days.forEach(day => {
            let currentBlock: WeeklyAvailabilityBlock | null = null;
            for (let i = 0; i < times.length; i++) {
                const time = times[i];
                const key = `${day.key}-${time}`;
                if (availableSlots[key]) {
                    if (!currentBlock) {
                        currentBlock = { dayOfWeek: day.key, startTime: time, endTime: '' };
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
        toast({ title: 'הזמינות נשמרה בהצלחה' });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>תבנית זמינות שבועית</CardTitle>
                        <CardDescription>לחץ על משבצות זמן כדי לסמן אותן כפנויות. אלו השעות שיוצגו לתלמידים להזמנת שיעורים.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" disabled><Copy className="ms-2 h-4 w-4" /> העתק משבוע שעבר</Button>
                        <Button disabled><PlusCircle className="ms-2 h-4 w-4" /> הוסף חריגה</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                    <div className="grid grid-cols-[auto_repeat(6,1fr)] text-center text-sm font-semibold min-w-[800px]">
                        <div className="p-2 border-b border-s sticky start-0 bg-card"></div>
                        {days.map(day => (
                            <div key={day.key} className="p-2 border-b border-s bg-card">{day.he}</div>
                        ))}
                        {times.map(time => (
                            <React.Fragment key={time}>
                                <div className="p-2 border-s flex items-center justify-center text-xs text-muted-foreground sticky start-0 bg-card font-mono">{time}</div>
                                {days.map(day => {
                                    const key = `${day.key}-${time}`;
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
                                            onClick={() => handleSlotClick(day.key, time)}
                                        >
                                            {isBooked && (
                                                 <div className="bg-blue-500/10 border-r-4 border-blue-500 p-1 rounded-sm text-xs h-full overflow-hidden text-right">
                                                    <p className="font-bold truncate text-blue-800 dark:text-blue-200">{isBooked.instrument}</p>
                                                    <p className="truncate text-blue-700 dark:text-blue-300">{user?.students?.find(s => s === isBooked.studentId) ? users.find(u => u.id === isBooked.studentId)?.name : 'תלמיד'}
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
                    <Calendar className="h-6 w-6 text-primary mt-1"/>
                    <div>
                        <h4 className="font-semibold">סנכרון יומן חיצוני</h4>
                        <p className="text-sm text-muted-foreground">חבר את יומן Google או Apple שלך כדי לחסום אוטומטית זמנים שאינך פנוי/ה בהם, ולהציג את שיעורי הרמוניה ביומן האישי שלך.</p>
                        <Button variant="secondary" className="mt-2" disabled>חבר יומן</Button>
                    </div>
                </div>
            </CardContent>
             <CardFooter>
                <Button onClick={handleSaveChanges} disabled={!isDirty}>
                    <Save className="me-2 h-4 w-4" />
                    שמור שינויים
                </Button>
            </CardFooter>
        </Card>
    );
}
