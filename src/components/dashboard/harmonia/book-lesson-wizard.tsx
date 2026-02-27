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
import { he } from 'date-fns/locale';
import type { LessonSlot, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Combobox } from '@/components/ui/combobox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';

const bookingSchema = z.object({
    studentId: z.string().min(1, "חובה לבחור תלמיד."),
    instrument: z.string().min(1, "חובה לבחור כלי נגינה."),
    teacherId: z.string().min(1, "חובה לבחור מורה."),
    date: z.date(),
    time: z.string().min(1, "חובה לבחור שעה."),
    durationMinutes: z.coerce.number().default(45),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export function BookLessonWizard() {
    const { user, users, mockLessons, addLesson, mockPackages } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const teachers = useMemo(() => users.filter(u => u.role === 'teacher'), [users]);

    const form = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema) as any,
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

            const dayLessons = mockLessons.filter(l =>
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

    }, [selectedTeacherId, selectedDate, duration, users, mockLessons]);

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
            title: 'השיעור נקבע בהצלחה!',
            description: `נקבע שיעור ${data.instrument} עם ${teachers.find(t => t.id === data.teacherId)?.name} ב-${format(lessonStartTime, 'dd/MM/yy HH:mm')}.`
        });
        router.push('/dashboard/schedule');
    };

    const studentInstruments = useMemo(() => {
        const student = users.find(u => u.id === selectedStudentId);
        return student?.instruments?.map(i => i.instrument) || [];
    }, [selectedStudentId, users]);

    const activePackage = useMemo(() => {
        return mockPackages?.find(p => p.studentId === selectedStudentId);
    }, [selectedStudentId, mockPackages]);

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
                                <h3 className="font-semibold">1. סנן ובחר</h3>

                                {user?.role === 'parent' && (
                                    <FormField name="studentId" control={form.control} render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>בחר תלמיד</FormLabel>
                                            <Combobox
                                                options={childrenOptions}
                                                selectedValue={field.value}
                                                onSelectedValueChange={field.onChange}
                                                placeholder="בחר ילד/ה..."
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}

                                <FormField name="instrument" control={form.control} render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>כלי נגינה</FormLabel>
                                        <Combobox
                                            options={studentInstruments.map(i => ({ value: i, label: i }))}
                                            selectedValue={field.value}
                                            onSelectedValueChange={field.onChange}
                                            placeholder="בחר כלי..."
                                            disabled={!selectedStudentId}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="teacherId" control={form.control} render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>מורה</FormLabel>
                                        <Combobox
                                            options={teachers.map(t => ({ value: t.id, label: t.name! }))}
                                            selectedValue={field.value}
                                            onSelectedValueChange={field.onChange}
                                            placeholder="בחר מורה..."
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="durationMinutes" control={form.control} render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>אורך שיעור</FormLabel>
                                        <Combobox
                                            options={[
                                                { value: "30", label: "30 דקות" },
                                                { value: "45", label: "45 דקות" },
                                                { value: "60", label: "60 דקות" },
                                            ]}
                                            selectedValue={String(field.value)}
                                            onSelectedValueChange={v => field.onChange(Number(v))}
                                            placeholder="בחר אורך..."
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
                                                        ? `יתרת קרדיטים: ${activePackage.totalCredits! - activePackage.usedCredits!} מתוך ${activePackage.totalCredits}`
                                                        : "נגמרו הקרדיטים בחבילה זו. יש לרכוש חבילה חדשה."}
                                                </AlertDescription>
                                            </Alert>
                                        ) : (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>אין חבילה פעילה</AlertTitle>
                                                <AlertDescription>לא נמצאה חבילת שיעורים פעילה עבור תלמיד זה.</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Date & Time Column */}
                            <div className="md:col-span-2 grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="font-semibold">2. בחר תאריך ושעה</h3>
                                    <FormField name="date" control={form.control} render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => isBefore(date, new Date())}
                                                    initialFocus
                                                    locale={he}
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
                                            <FormLabel>שעות פנויות</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} value={field.value} className="max-h-80 overflow-y-auto p-1 border rounded-md">
                                                    {isLoadingSlots && <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
                                                    {!isLoadingSlots && availableSlots.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">לא נמצאו שעות פנויות למורה בתאריך זה.</p>}
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
                        <Button type="submit" disabled={!form.formState.isValid || !hasCredits}>הזמן שיעור</Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
