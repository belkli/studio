
'use client';

import { useState, useMemo, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { add, set, format, getDay, isBefore } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, ArrowLeft, ArrowRight, User as UserIcon, Contact, Music, Calendar, HeartHandshake, Package as PackageIcon, ShieldCheck, Loader2, CalendarClock, UserPlus } from "lucide-react";
import { Combobox } from "../ui/combobox";
import { Stepper } from "@/components/ui/stepper";
import { instruments, mockTeachers } from "@/lib/data";
import { Calendar as UICalendar } from "@/components/ui/calendar";

const getTrialSchema = (t: ReturnType<typeof useTranslations>) => z.object({
    instrument: z.string().min(1, t('validation.instrumentRequired')),
    teacherId: z.string().optional(),
    date: z.date().nullable().refine(val => !!val, { message: t('validation.dateRequired') }),
    time: z.string().min(1, t('validation.timeRequired')),
    name: z.string().min(2, t('validation.nameRequired')),
    phone: z.string().min(9, t('validation.phoneInvalid')),
    email: z.string().email(t('validation.emailInvalid')),
});

type TrialFormData = z.infer<ReturnType<typeof getTrialSchema>>;

const stepIcons = [Music, HeartHandshake, Calendar, Contact, ShieldCheck];

export function TrialBookingWidget() {
    const t = useTranslations('TrialBooking');
    const locale = useLocale();
    const dateLocale = useDateLocale();
    const { toast } = useToast();
    const { addLesson, users } = useAuth();

    const steps = [
        { id: 'instrument', title: t('steps.instrument') },
        { id: 'teacher', title: t('steps.teacher') },
        { id: 'schedule', title: t('steps.schedule') },
        { id: 'details', title: t('steps.details') },
        { id: 'payment', title: t('steps.payment') },
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm<TrialFormData>({
        resolver: zodResolver(getTrialSchema(t)) as any,
        defaultValues: { date: new Date() },
    });

    const teacherId = form.watch('teacherId');
    const selectedDate = form.watch('date');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    useEffect(() => {
        if (!teacherId || !selectedDate) {
            setAvailableSlots([]);
            return;
        }

        setIsLoadingSlots(true);
        setTimeout(() => {
            const teacher = users.find(u => u.id === teacherId);
            if (!teacher?.availability) {
                setAvailableSlots([]);
                setIsLoadingSlots(false);
                return;
            }
            const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][getDay(selectedDate)];
            const availability = teacher.availability.find(a => a.dayOfWeek === dayOfWeek);
            if (!availability) {
                setAvailableSlots([]);
                setIsLoadingSlots(false);
                return;
            }
            // Generate mock slots
            const slots = [];
            for (let h = parseInt(availability.startTime); h < parseInt(availability.endTime); h++) {
                if (Math.random() > 0.3) { // Simulate some slots being taken
                    const slotTime = set(selectedDate, { hours: h, minutes: 0 });
                    if (isBefore(new Date(), slotTime)) slots.push(format(slotTime, 'HH:mm'));
                }
            }
            setAvailableSlots(slots);
            setIsLoadingSlots(false);
        }, 300);
    }, [teacherId, selectedDate, users]);

    const processStep = async () => {
        let fieldsToValidate: (keyof TrialFormData)[] = [];
        switch (currentStep) {
            case 0: fieldsToValidate = ['instrument']; break;
            case 1: fieldsToValidate = ['teacherId']; break;
            case 2: fieldsToValidate = ['date', 'time']; break;
            case 3: fieldsToValidate = ['name', 'phone', 'email']; break;
            default: break;
        }
        const isValid = fieldsToValidate.length > 0 ? await form.trigger(fieldsToValidate) : true;
        if (!isValid) return;

        if (currentStep < steps.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            onSubmit(form.getValues());
        }
    };

    const onSubmit = (data: TrialFormData) => {
        setIsSubmitted(true);
        // This is a mock submission
        toast({
            title: t('success.title'),
            description: t('success.description'),
        });
    };

    if (isSubmitted) {
        return (
            <Card className="w-full max-w-lg mx-4 text-center">
                <CardHeader>
                    <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3 w-fit">
                        <Check className="h-10 w-10 text-accent" />
                    </div>
                    <CardTitle className="text-2xl font-bold mt-4">{t('success.title')}</CardTitle>
                    <CardDescription>{t('success.confirmation')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{t('success.info')}</p>
                </CardContent>
            </Card>
        );
    }

    const teacherOptions = mockTeachers.map(t => ({ value: t.id!, label: t.name! }));

    return (
        <Card className="w-full max-w-3xl mx-4">
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('subtitle')}</CardDescription>
                <div className="pt-4">
                    <Stepper currentStep={currentStep} steps={steps.map((s, i) => ({ ...s, icon: stepIcons[i] }))} />
                </div>
            </CardHeader>
            <CardContent>
                <FormProvider {...form}>
                    <form className="space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                                dir="rtl"
                            >
                                {currentStep === 0 && <FormField name="instrument" render={({ field }) => (<FormItem className="flex flex-col"> <FormLabel>{t('instrument')}</FormLabel> <Combobox options={instruments.map(i => ({ value: i, label: i }))} selectedValue={field.value} onSelectedValueChange={field.onChange} placeholder={t('instrumentPlaceholder')} /> <FormMessage /> </FormItem>)} />}
                                {currentStep === 1 && <FormField name="teacherId" render={({ field }) => (<FormItem className="flex flex-col"> <FormLabel>{t('teacher')}</FormLabel> <Combobox options={teacherOptions} selectedValue={field.value} onSelectedValueChange={field.onChange} placeholder={t('teacherPlaceholder')} /> <FormMessage /> </FormItem>)} />}
                                {currentStep === 2 && (
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <FormField name="date" control={form.control} render={({ field }) => (<FormItem className="flex justify-center"><FormControl><UICalendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => isBefore(date, new Date())} initialFocus locale={dateLocale} className="rounded-md border" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField name="time" control={form.control} render={({ field }) => (<FormItem> <FormLabel>{t('availableSlots')}</FormLabel> <FormControl> <RadioGroup onValueChange={field.onChange} value={field.value} className="max-h-80 overflow-y-auto p-1 border rounded-md"> {isLoadingSlots ? <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : availableSlots.length === 0 ? <p className="text-center text-sm text-muted-foreground p-4">{t('noSlots')}</p> : availableSlots.map(slot => (<FormItem key={slot}> <FormControl> <label className="flex items-center space-x-3 space-x-reverse p-3 rounded-md hover:bg-muted cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground" dir="rtl"> <RadioGroupItem value={slot} id={`time-${slot}`} className="hidden" /> <span className="font-mono">{slot}</span> </label> </FormControl> </FormItem>))} </RadioGroup> </FormControl> <FormMessage /> </FormItem>)} />
                                    </div>
                                )}
                                {currentStep === 3 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField name="name" render={({ field }) => (<FormItem><FormLabel>{t('details.name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField name="phone" render={({ field }) => (<FormItem><FormLabel>{t('details.phone')}</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <div className="md:col-span-2"><FormField name="email" render={({ field }) => (<FormItem><FormLabel>{t('details.email')}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} /></div>
                                    </div>
                                )}
                                {currentStep === 4 && (
                                    <div className="text-center space-y-4">
                                        <h3 className="text-xl font-semibold">{t('payment.title')}</h3>
                                        <p className="text-muted-foreground">{t('payment.price', { price: 50 })}</p>
                                        <Card className="max-w-md mx-auto p-4">
                                            <p>{t('payment.mock')}</p>
                                        </Card>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </form>
                </FormProvider>
            </CardContent>
            <CardFooter>
                <div className="w-full flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 0}>
                        <ArrowRight className="h-4 w-4 me-2" />
                        {t('back')}
                    </Button>
                    <Button onClick={processStep}>
                        {currentStep === steps.length - 1 ? t('payment.button') : t('next')}
                        {currentStep < steps.length - 1 && <ArrowLeft className="h-4 w-4 ms-2" />}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

