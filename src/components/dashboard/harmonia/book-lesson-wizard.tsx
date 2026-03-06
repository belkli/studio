'use client';

import { useAuth } from '@/hooks/use-auth';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { add, set, format, getDay, isBefore } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import type { LessonSlot, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Combobox } from '@/components/ui/combobox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

const getBookingSchema = (t: any) => z.object({
    studentId: z.string().min(1, t("studentRequired")),
    instrument: z.string().min(1, t("instrumentRequired")),
    teacherId: z.string().min(1, t("teacherRequired")),
    date: z.date(),
    time: z.string().min(1, t("timeRequired")),
    durationMinutes: z.coerce.number().default(45),
});

type BookingFormData = z.infer<ReturnType<typeof getBookingSchema>>;

export function BookLessonWizard() {
    const { user, users, lessons, addLesson, packages } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const t = useTranslations("LessonManagement");
    const dateLocale = useDateLocale();

    const teachers = useMemo(() => users.filter(u => u.role === 'teacher'), [users]);

    const form = useForm<BookingFormData>({
        resolver: zodResolver(getBookingSchema(t)) as any,
        defaultValues: {
            studentId: user?.role === 'student' ? user.id : '',
            date: new Date(),
            durationMinutes: 45,
        },
    });

    const selectedStudentId = form.watch('studentId');

    const selectedTeacherId = form.watch('teacherId');
    const selectedDate = form.watch('date');
    const duration = form.watch('durationMinutes');

    useEffect(() => {
        if (!selectedTeacherId || !selectedDate) {
            setAvailableSlots([]);
            return;
        }

        setIsLoadingSlots(true);
        // Simulate fetching slots
        setTimeout(() => {
            const teacher = users.find(u => u.id === selectedTeacherId);
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
                l.teacherId === selectedTeacherId &&
                format(new Date(l.startTime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            );

            const slots: string[] = [];
            let currentTime = set(new Date(), { hours: parseInt(teacherDayAvailability.startTime.split(':')[0]), minutes: 0 });
            const endTime = set(new Date(), { hours: parseInt(teacherDayAvailability.endTime.split(':')[0]), minutes: 0 });

            while (isBefore(currentTime, endTime)) {
                const slotTimeStr = format(currentTime, 'HH:mm');
                const isBooked = dayLessons.some(l => format(new Date(l.startTime), 'HH:mm') === slotTimeStr);

                if (!isBooked) {
                    slots.push(slotTimeStr);
                }
                currentTime = add(currentTime, { minutes: duration });
            }

            setAvailableSlots(slots);
            setIsLoadingSlots(false);
        }, 300); // Debounce/throttle in real app

    }, [selectedTeacherId, selectedDate, duration, users, lessons]);

    const onSubmit = (data: BookingFormData) => {
        const studentId = data.studentId;

        const [hours, minutes] = data.time.split(':');
        const lessonStartTime = set(data.date, { hours: parseInt(hours), minutes: parseInt(minutes) });

        addLesson({
            studentId,
            teacherId: data.teacherId,
            instrument: data.instrument,
            startTime: lessonStartTime.toISOString(),
            durationMinutes: data.durationMinutes as 30 | 45 | 60,
            bookingSource: user!.role === 'parent' ? 'PARENT' : 'STUDENT_SELF',
        });

        toast({
            title: t('lessonBookedSuccess'),
            description: t('lessonBookedDesc', {
                instrument: data.instrument,
                teacherName: teachers.find(t1 => t1.id === data.teacherId)?.name || 'Teacher',
                dateTime: format(lessonStartTime, 'dd/MM/yy HH:mm')
            })
        });
        router.push('/dashboard/schedule');
    };

    const studentInstruments = useMemo(() => {
        const student = users.find(u => u.id === selectedStudentId);
        return student?.instruments?.map(i => i.instrument) || [];
    }, [selectedStudentId, users]);

    const activePackage = useMemo(() => {
        return packages?.find(p => p.studentId === selectedStudentId);
    }, [selectedStudentId, packages]);

    const hasCredits = useMemo(() => {
        if (!activePackage) return false;
        if (activePackage.type === 'MONTHLY' || activePackage.type === 'YEARLY') return true;
        return (activePackage.totalCredits || 0) > (activePackage.usedCredits || 0);
    }, [activePackage]);

    const childrenOptions = useMemo(() => {
        if (user?.role !== 'parent' || !user.childIds) return [];
        return user.childIds.map(id => {
            const child = users.find(u => u.id === id);
            return { value: id, label: child?.name || id };
        });
    }, [user, users]);


    return (
        <Card>
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Filters Column */}
                            <div className="space-y-6">
                                <h3 className="font-semibold">{t('step1Filter')}</h3>

                                {user?.role === 'parent' && (
                                    <FormField name="studentId" control={form.control} render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{t('selectStudent')}</FormLabel>
                                            <Combobox
                                                options={childrenOptions}
                                                selectedValue={field.value}
                                                onSelectedValueChange={field.onChange}
                                                placeholder={t('selectChildPlaceholder')}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}

                                <FormField name="instrument" control={form.control} render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('instrument')}</FormLabel>
                                        <Combobox
                                            options={studentInstruments.map(i => ({ value: i, label: i }))}
                                            selectedValue={field.value}
                                            onSelectedValueChange={field.onChange}
                                            placeholder={t('selectInstrumentPlaceholder')}
                                            disabled={!selectedStudentId}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="teacherId" control={form.control} render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('teacher')}</FormLabel>
                                        <Combobox
                                            options={teachers.map(t2 => ({ value: t2.id, label: t2.name! }))}
                                            selectedValue={field.value}
                                            onSelectedValueChange={field.onChange}
                                            placeholder={t('selectTeacherPlaceholder')}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="durationMinutes" control={form.control} render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('lessonDuration')}</FormLabel>
                                        <Combobox
                                            options={[
                                                { value: "30", label: t('duration30') },
                                                { value: "45", label: t('duration45') },
                                                { value: "60", label: t('duration60') },
                                            ]}
                                            selectedValue={String(field.value)}
                                            onSelectedValueChange={v => field.onChange(Number(v))}
                                            placeholder={t('selectDurationPlaceholder')}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {selectedStudentId && (
                                    <div className="pt-4 border-t">
                                        {activePackage ? (
                                            <Alert variant={hasCredits ? "default" : "destructive"}>
                                                {hasCredits ? <Info className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                                <AlertTitle>{activePackage.title}</AlertTitle>
                                                <AlertDescription>
                                                    {hasCredits
                                                        ? t('creditBalance', { remaining: String((activePackage.totalCredits || 0) - (activePackage.usedCredits || 0)), total: String(activePackage.totalCredits || 0) })
                                                        : t('noCreditsLeft')}
                                                </AlertDescription>
                                            </Alert>
                                        ) : (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>{t('noActivePackage')}</AlertTitle>
                                                <AlertDescription>{t('noActivePackageDesc')}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Date & Time Column */}
                            <div className="md:col-span-2 grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="font-semibold">{t('step2DateTime')}</h3>
                                    <FormField name="date" control={form.control} render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => isBefore(date, new Date())}
                                                    initialFocus
                                                    locale={dateLocale}
                                                    className="rounded-md border w-full"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="space-y-6">
                                    <FormField name="time" control={form.control} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('availableTimeSlots')}</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} value={field.value} className="max-h-80 overflow-y-auto p-1 border rounded-md">
                                                    {isLoadingSlots && <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
                                                    {!isLoadingSlots && availableSlots.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">{t('noAvailableTimeSlots')}</p>}
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
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button type="submit" disabled={!form.formState.isValid || !hasCredits}>{t('bookLesson')}</Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
