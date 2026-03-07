'use client';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations, useLocale } from 'next-intl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getEventSchema = (t: any) => z.object({
    name: z.string().min(5, t('errors.nameShort')),
    type: z.enum(['RECITAL', 'CONCERT', 'EXAM_PERFORMANCE', 'OPEN_DAY']),
    venue: z.string().min(3, t('errors.venueMissing')),
    eventDate: z.string().min(1, t('errors.dateMissing')),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, t('errors.timeFormat')),
    isPublic: z.boolean().default(false),
    ticketPrice: z.coerce.number().min(0).default(0),
});

type EventFormData = z.infer<ReturnType<typeof getEventSchema>>;

export function EventForm() {
    const { addEvent } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const t = useTranslations('EventForm');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const eventSchema = getEventSchema(t);

    const form = useForm<EventFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(eventSchema) as any,
        defaultValues: {
            isPublic: false,
            ticketPrice: 0,
            type: 'RECITAL',
        },
    });

    const onSubmit = (data: EventFormData) => {
        addEvent({ ...data });
        toast({ title: t('successToast') });
        router.push(`/${locale}/dashboard/events`);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem> <FormLabel>{t('nameLabel')}</FormLabel> <FormControl><Input placeholder={t('namePlaceholder')} {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                        <div className="grid md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="type" render={({ field }) => (<FormItem> <FormLabel>{t('typeLabel')}</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value} dir={isRtl ? 'rtl' : 'ltr'}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="RECITAL">{t('types.RECITAL')}</SelectItem><SelectItem value="CONCERT">{t('types.CONCERT')}</SelectItem><SelectItem value="EXAM_PERFORMANCE">{t('types.EXAM_PERFORMANCE')}</SelectItem><SelectItem value="OPEN_DAY">{t('types.OPEN_DAY')}</SelectItem></SelectContent></Select> <FormMessage /> </FormItem>)} />
                            <FormField control={form.control} name="eventDate" render={({ field }) => (<FormItem> <FormLabel>{t('dateLabel')}</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem> <FormLabel>{t('timeLabel')}</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                        </div>
                        <FormField control={form.control} name="venue" render={({ field }) => (<FormItem> <FormLabel>{t('venueLabel')}</FormLabel> <FormControl><Input placeholder={t('venuePlaceholder')} {...field} /></FormControl> <FormMessage /> </FormItem>)} />

                        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                            <FormField control={form.control} name="isPublic" render={({ field }) => (
                                <FormItem className="flex items-center gap-2 pt-6">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="isPublic" /></FormControl>
                                    <FormLabel htmlFor="isPublic" className="!mt-0">{t('isPublicLabel')}</FormLabel>
                                </FormItem>
                            )} />
                            {/* eslint-disable-next-line react-hooks/incompatible-library */}
                            <FormField control={form.control} name="ticketPrice" render={({ field }) => (<FormItem> <FormLabel>{t('ticketPriceLabel')}</FormLabel> <InputGroup><InputGroupText>₪</InputGroupText><FormControl><Input type="number" {...field} disabled={!form.watch('isPublic')} /></FormControl></InputGroup> <FormMessage /> </FormItem>)} />
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit">{t('submit')}</Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
