'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import type { NotificationType, Channel, NotificationPreferences as NotificationPreferencesType } from '@/lib/types';
import { useTranslations } from 'next-intl';

const getNotificationPreferencesSchema = (t: any) => z.object({
    preferences: z.object({
        lessonReminders: z.array(z.string()),
        lessonCancellation: z.array(z.string()),
        makeupCredits: z.array(z.string()),
        paymentDue: z.array(z.string()),
        formStatusChanges: z.array(z.string()),
        teacherMessages: z.array(z.string()),
        systemAnnouncements: z.array(z.string()),
        psLessonReminders: z.array(z.string()),
        psLessonCancellation: z.array(z.string()),
        psPaymentDue: z.array(z.string()),
        psExcellenceUpdates: z.array(z.string()),
        psNewEnrollment: z.array(z.string()),
        psPartnershipUpdate: z.array(z.string()),
        psCoordinatorAnnouncements: z.array(z.string()),
    }),
    quietHours: z.object({
        enabled: z.boolean(),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, t('invalidFormat')),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, t('invalidFormat')),
    }),
    language: z.enum(['HE', 'EN', 'AR', 'RU']),
});

type NotificationPreferencesFormData = z.infer<ReturnType<typeof getNotificationPreferencesSchema>>;

export function NotificationPreferences() {
    const { user, updateNotificationPreferences } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('NotificationPreferences');
    const formSchema = getNotificationPreferencesSchema(t);

    const notificationTypes: { id: NotificationType, label: string }[] = [
        { id: 'lessonReminders', label: t('lessonReminders') },
        { id: 'lessonCancellation', label: t('lessonCancellation') },
        { id: 'makeupCredits', label: t('makeupCredits') },
        { id: 'paymentDue', label: t('paymentDue') },
        { id: 'formStatusChanges', label: t('formStatusChanges') },
        { id: 'teacherMessages', label: t('teacherMessages') },
        { id: 'systemAnnouncements', label: t('systemAnnouncements') },
        { id: 'psLessonReminders', label: t('psLessonReminders') },
        { id: 'psLessonCancellation', label: t('psLessonCancellation') },
        { id: 'psPaymentDue', label: t('psPaymentDue') },
        { id: 'psExcellenceUpdates', label: t('psExcellenceUpdates') },
        { id: 'psNewEnrollment', label: t('psNewEnrollment') },
        { id: 'psPartnershipUpdate', label: t('psPartnershipUpdate') },
        { id: 'psCoordinatorAnnouncements', label: t('psCoordinatorAnnouncements') },
    ];

    const channels: { id: Channel, label: string }[] = [
        { id: 'IN_APP', label: t('channelInApp') },
        { id: 'EMAIL', label: t('channelEmail') },
        { id: 'SMS', label: t('channelSms') },
        { id: 'WHATSAPP', label: t('channelWhatsapp') },
    ];

    const form = useForm<NotificationPreferencesFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: user?.notificationPreferences || {
            preferences: {
                lessonReminders: ['IN_APP', 'EMAIL'],
                lessonCancellation: ['IN_APP', 'EMAIL', 'SMS'],
                makeupCredits: ['IN_APP'],
                paymentDue: ['EMAIL'],
                formStatusChanges: ['IN_APP', 'EMAIL'],
                teacherMessages: ['IN_APP'],
                systemAnnouncements: ['IN_APP', 'EMAIL'],
                psLessonReminders: ['IN_APP', 'WHATSAPP'],
                psLessonCancellation: ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'],
                psPaymentDue: ['EMAIL', 'WHATSAPP'],
                psExcellenceUpdates: ['IN_APP', 'EMAIL'],
                psNewEnrollment: ['IN_APP', 'EMAIL', 'WHATSAPP'],
                psPartnershipUpdate: ['IN_APP', 'EMAIL'],
                psCoordinatorAnnouncements: ['IN_APP', 'EMAIL', 'WHATSAPP'],
            },
            quietHours: { enabled: false, startTime: "22:00", endTime: "08:00" },
            language: 'HE',
        },
    });

    const onSubmit = (data: NotificationPreferencesFormData) => {
        updateNotificationPreferences(data as NotificationPreferencesType);
        toast({ title: t('preferencesUpdatedTitle'), description: t('preferencesUpdatedDesc') });
        form.reset(data); // reset dirty state
    };

    if (!user) return null;

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('channelPreferencesTitle')}</CardTitle>
                        <CardDescription>{t('channelPreferencesDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('notificationTypeHeader')}</TableHead>
                                    {channels.map(channel => <TableHead key={channel.id} className="text-center">{channel.label}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {notificationTypes.map(type => (
                                    <TableRow key={type.id}>
                                        <TableCell className="font-medium">{type.label}</TableCell>
                                        {channels.map(channel => (
                                            <TableCell key={channel.id} className="text-center">
                                                <FormField
                                                    control={form.control}
                                                    name={`preferences.${type.id}`}
                                                    render={({ field }) => (
                                                        <Checkbox
                                                            checked={field.value?.includes(channel.id)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), channel.id])
                                                                    : field.onChange(field.value?.filter(value => value !== channel.id))
                                                            }}
                                                        />
                                                    )}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('additionalSettingsTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="quietHours.enabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">{t('enableQuietHoursLabel')}</FormLabel>
                                        <FormDescription>
                                            {t('enableQuietHoursDesc')}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        {/* eslint-disable-next-line react-hooks/incompatible-library */}
                        {form.watch('quietHours.enabled') && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="quietHours.startTime" render={({ field }) => (<FormItem> <FormLabel>{t('startTimeLabel')}</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                                <FormField control={form.control} name="quietHours.endTime" render={({ field }) => (<FormItem> <FormLabel>{t('endTimeLabel')}</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            </div>
                        )}
                        <FormField control={form.control} name="language" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('notificationLanguageLabel')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="HE">{t('langHebrew')}</SelectItem>
                                        <SelectItem value="EN">{t('langEnglish')}</SelectItem>
                                        <SelectItem value="AR">{t('langArabic')}</SelectItem>
                                        <SelectItem value="RU">{t('langRussian')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>
                <div className="flex justify-end">
                    <Button type="submit" disabled={!form.formState.isDirty}>
                        <Save className="me-2 h-4 w-4" />
                        {t('saveChangesBtn')}
                    </Button>
                </div>
            </form>
        </FormProvider>
    )
}

