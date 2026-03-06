
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { add, set, format, getDay, isBefore, isToday } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import type { LessonSlot } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const rescheduleSchema = z.object({
    date: z.date().nullable().refine(val => !!val, { message: "חובה לבחור תאריך." }),
    time: z.string().min(1, "חובה לבחור שעה."),
});

type RescheduleFormData = z.infer<typeof rescheduleSchema>;

interface RescheduleLessonDialogProps {
    lesson: LessonSlot | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (newStartTime: string) => void;
}

export function RescheduleLessonDialog({ lesson, open, onOpenChange, onConfirm }: RescheduleLessonDialogProps) {
    const { users, lessons } = useAuth();
    const dateLocale = useDateLocale();
    const { toast } = useToast();
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const form = useForm<RescheduleFormData>({
        resolver: zodResolver(rescheduleSchema) as any,
        defaultValues: {
            date: new Date(),
        },
    });

    const selectedDate = form.watch('date');

    useEffect(() => {
        if (lesson) {
            form.reset({
                date: new Date(lesson.startTime),
                time: undefined,
            });
        }
    }, [lesson, form]);

    useEffect(() => {
        if (!lesson || !selectedDate) {
            setAvailableSlots([]);
            return;
        }

        setIsLoadingSlots(true);
        // Simulate fetching slots
        setTimeout(() => {
            const teacher = users.find(u => u.id === lesson.teacherId);
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

            const dayLessons = lessons.filter(l =>
                l.teacherId === lesson.teacherId &&
                l.id !== lesson.id && // Exclude the lesson being rescheduled
                format(new Date(l.startTime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            );

            const slots: string[] = [];
            let currentTime = set(new Date(), { hours: parseInt(teacherDayAvailability.startTime.split(':')[0]), minutes: 0 });
            const endTime = set(new Date(), { hours: parseInt(teacherDayAvailability.endTime.split(':')[0]), minutes: 0 });

            while (isBefore(currentTime, endTime)) {
                const slotTimeStr = format(currentTime, 'HH:mm');
                const isBooked = dayLessons.some(l => format(new Date(l.startTime), 'HH:mm') === slotTimeStr);

                if (!isBooked) {
                    // Don't show slots in the past
                    const potentialSlotTime = set(selectedDate, { hours: parseInt(slotTimeStr.split(':')[0]), minutes: parseInt(slotTimeStr.split(':')[1]) });
                    if (isBefore(new Date(), potentialSlotTime)) {
                        slots.push(slotTimeStr);
                    }
                }
                currentTime = add(currentTime, { minutes: lesson.durationMinutes });
            }

            setAvailableSlots(slots);
            setIsLoadingSlots(false);
        }, 300);

    }, [lesson, selectedDate, users, lessons]);

    const onSubmit = (data: RescheduleFormData) => {
        if (!lesson) return;

        const [hours, minutes] = data.time.split(':');
        const newStartTime = set(data.date, { hours: parseInt(hours), minutes: parseInt(minutes) });

        onConfirm(newStartTime.toISOString());

        toast({
            title: 'השיעור נקבע מחדש!',
            description: `השיעור עודכן למועד: ${format(newStartTime, 'dd/MM/yy HH:mm')}.`
        });
        onOpenChange(false);
    };

    if (!lesson) return null;

    const teacher = users.find(u => u.id === lesson.teacherId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>שינוי מועד שיעור - {lesson.instrument}</DialogTitle>
                    <DialogDescription>
                        בחר/י תאריך ושעה חדשים לשיעור עם {teacher?.name}.
                        אורך השיעור: {lesson.durationMinutes} דקות.
                    </DialogDescription>
                </DialogHeader>
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="grid md:grid-cols-2 gap-8 py-4">
                            <FormField name="date" control={form.control} render={({ field }) => (
                                <FormItem className="flex justify-center">
                                    <FormControl>
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => isBefore(date, new Date()) && !isToday(date)}
                                            initialFocus
                                            locale={dateLocale}
                                            className="rounded-md border"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField name="time" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>שעות פנויות</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} value={field.value} className="max-h-80 overflow-y-auto p-2 border rounded-md">
                                            {isLoadingSlots && <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
                                            {!isLoadingSlots && availableSlots.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">לא נמצאו שעות פנויות בתאריך זה.</p>}
                                            {!isLoadingSlots && availableSlots.map(slot => (
                                                <FormItem key={slot}>
                                                    <FormControl>
                                                        <label className="flex items-center space-x-3 space-x-reverse p-3 rounded-md hover:bg-muted cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                                            <RadioGroupItem value={slot} id={slot} className="hidden" />
                                                            <span className="font-mono">{slot}</span>
                                                        </label>
                                                    </FormControl>
                                                </FormItem>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                ביטול
                            </Button>
                            <Button type="submit" disabled={!form.formState.isValid}>
                                קבע מועד חדש
                            </Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}
