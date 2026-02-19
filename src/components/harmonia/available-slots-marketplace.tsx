'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { DayOfWeek, TimeRange, User, Room } from '@/lib/types';
import { addDays, getDay, startOfHour, isAfter, isSameDay, setHours, setMinutes } from 'date-fns';
import { instruments } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlotPromotionCard } from './slot-promotion-card';
import { Loader2 } from 'lucide-react';

export type SlotUrgency = 'SAME_DAY' | 'TOMORROW';
export type SlotDemandLevel = 'HIGH_DEMAND' | 'MEDIUM_DEMAND' | 'LOW_DEMAND';

export interface EmptySlot {
    id: string;
    teacher: User;
    instrument: string;
    startTime: Date;
    durationMinutes: number;
    urgency: SlotUrgency;
    demandLevel: SlotDemandLevel;
    basePrice: number;
    promotionalPrice: number;
    discount: number;
}

const DISCOUNT_MATRIX: Record<SlotUrgency, Record<SlotDemandLevel, number>> = {
    SAME_DAY: { HIGH_DEMAND: 20, MEDIUM_DEMAND: 30, LOW_DEMAND: 40 },
    TOMORROW: { HIGH_DEMAND: 10, MEDIUM_DEMAND: 15, LOW_DEMAND: 25 },
};

function getDemandLevel(date: Date): SlotDemandLevel {
    const hour = date.getHours();
    const day = date.getDay(); // Sunday - 0, Saturday - 6

    if (hour >= 15 && hour < 19 && day >= 0 && day <= 4) { // Sun-Thu afternoon
        return 'HIGH_DEMAND';
    }
    if (day === 5 || hour < 13) { // Friday or mornings
        return 'LOW_DEMAND';
    }
    return 'MEDIUM_DEMAND';
}

export function AvailableSlotsMarketplace() {
    const { users, mockLessons } = useAuth();
    const [filters, setFilters] = useState({ instrument: 'all', duration: 'all' });
    const [isLoading, setIsLoading] = useState(true);

    const emptySlots = useMemo(() => {
        const teachers = users.filter(u => u.role === 'teacher' && u.availability);
        const today = new Date();
        const tomorrow = addDays(today, 1);
        const searchDates = [today, tomorrow];
        const slots: EmptySlot[] = [];

        teachers.forEach(teacher => {
            const teacherInstruments = teacher.instruments?.map(i => i.instrument) || [];

            searchDates.forEach(date => {
                const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][getDay(date)] as DayOfWeek;
                const teacherDayAvailability = teacher.availability?.find(a => a.dayOfWeek === dayOfWeek);

                if (!teacherDayAvailability) return;
                
                const dayLessons = mockLessons.filter(l => 
                    l.teacherId === teacher.id && 
                    isSameDay(new Date(l.startTime), date)
                );

                for (let hour = parseInt(teacherDayAvailability.startTime.split(':')[0]); hour < parseInt(teacherDayAvailability.endTime.split(':')[0]); hour++) {
                    for (let minute = 0; minute < 60; minute += 30) {
                        const slotStartTime = setMinutes(setHours(date, hour), minute);
                        
                        if (isAfter(new Date(), slotStartTime)) continue;

                        const isBooked = dayLessons.some(l => {
                            const lessonStart = startOfHour(new Date(l.startTime));
                            return isSameDay(lessonStart, slotStartTime) && lessonStart.getHours() === slotStartTime.getHours();
                        });

                        if (!isBooked) {
                            teacherInstruments.forEach(instrument => {
                                [45, 60].forEach(duration => { // Offer 45 and 60 min slots
                                    const basePrice = teacher.ratePerDuration?.[duration] || 120;
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
                    }
                }
            });
        });
        
        // Remove duplicate slots that might arise from 30 min increments but offering 45/60 min lessons
        const uniqueSlots = Array.from(new Map(slots.map(item => [item.id, item])).values());
        
        return uniqueSlots.sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
    }, [users, mockLessons]);

    // Simulate loading
    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const filteredSlots = useMemo(() => {
        return emptySlots.filter(slot => {
            const instrumentMatch = filters.instrument === 'all' || slot.instrument === filters.instrument;
            const durationMatch = filters.duration === 'all' || slot.durationMinutes === parseInt(filters.duration);
            return instrumentMatch && durationMatch;
        });
    }, [emptySlots, filters]);

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-muted-foreground p-12">
                <Loader2 className="h-10 w-10 animate-spin mb-4" />
                <p>מחפש הזדמנויות של הרגע האחרון...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center p-4 rounded-lg border bg-card">
                 <h3 className="font-semibold text-lg flex-shrink-0">סינון תוצאות</h3>
                 <div className="flex flex-wrap items-center gap-4">
                    <Select dir="rtl" value={filters.instrument} onValueChange={(v) => handleFilterChange('instrument', v)}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="כל הכלים" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">כל הכלים</SelectItem>{instruments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                     <Select dir="rtl" value={filters.duration} onValueChange={(v) => handleFilterChange('duration', v)}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="כל אורך שיעור" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">כל אורך שיעור</SelectItem>
                            <SelectItem value="45">45 דקות</SelectItem>
                            <SelectItem value="60">60 דקות</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </div>

            {filteredSlots.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSlots.map(slot => (
                        <SlotPromotionCard key={slot.id} slot={slot} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <h3 className="text-xl font-semibold">לא נמצאו שיעורים פנויים כרגע</h3>
                    <p className="mt-2">נסה/י לשנות את אפשרויות הסינון או לחזור מאוחר יותר.</p>
                </div>
            )}
        </div>
    );
}
