
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { add, set, format, getDay, isBefore, isToday } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import type { LessonSlot } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getRescheduleSchema = (t: any) => z.object({
    date: z.date().nullable().refine(val => !!val, { message: t('dateRequired') }),
    time: z.string().min(1, t('timeRequired')),
});

type RescheduleFormData = z.infer<ReturnType<typeof getRescheduleSchema>>;

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
    const t = useTranslations('LessonManagement');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const form = useForm<RescheduleFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(getRescheduleSchema(t)) as any,
        defaultValues: {
            date: new Date(),
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
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
            title: t('rescheduleSuccess'),
            description: t('rescheduleSuccessDesc', { dateTime: format(newStartTime, 'dd/MM/yy HH:mm') }),
        });
        onOpenChange(false);
    };

    if (!lesson) return null;

    const teacher = users.find(u => u.id === lesson.teacherId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t('rescheduleDialogTitle', { instrument: lesson.instrument })}</DialogTitle>
                    <DialogDescription>
                        {t('rescheduleDialogDesc', { teacherName: teacher?.name || '', durationMinutes: String(lesson.durationMinutes) })}
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
                                    <FormLabel>{t('availableHours')}</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} value={field.value} className="max-h-80 overflow-y-auto p-2 border rounded-md">
                                            {isLoadingSlots && <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
                                            {!isLoadingSlots && availableSlots.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">{t('noSlotsForDate')}</p>}
                                            {!isLoadingSlots && availableSlots.map(slot => (
                                                <FormItem key={slot}>
                                                    <FormControl>
                                                        <label className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
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
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={!form.formState.isValid}>
                                {t('setNewDate')}
                            </Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}
