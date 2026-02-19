
'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import type { NotificationType, Channel, NotificationPreferences as NotificationPreferencesType } from '@/lib/types';

const notificationPreferencesSchema = z.object({
  preferences: z.object({
    lessonReminders: z.array(z.string()),
    lessonCancellation: z.array(z.string()),
    makeupCredits: z.array(z.string()),
    paymentDue: z.array(z.string()),
    formStatusChanges: z.array(z.string()),
    teacherMessages: z.array(z.string()),
    systemAnnouncements: z.array(z.string()),
  }),
  quietHours: z.object({
    enabled: z.boolean(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "פורמט לא תקין"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "פורמט לא תקין"),
  }),
  language: z.enum(['HE', 'EN', 'AR', 'RU']),
});

type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>;

const notificationTypes: { id: NotificationType, label: string }[] = [
    { id: 'lessonReminders', label: 'תזכורות על שיעורים' },
    { id: 'lessonCancellation', label: 'ביטולי שיעורים' },
    { id: 'makeupCredits', label: 'זיכויים לשיעורי השלמה' },
    { id: 'paymentDue', label: 'תשלומים וחיובים' },
    { id: 'formStatusChanges', label: 'שינויי סטטוס בטפסים' },
    { id: 'teacherMessages', label: 'הודעות מהמורה' },
    { id: 'systemAnnouncements', label: 'הכרזות מערכת' },
];

const channels: { id: Channel, label: string }[] = [
    { id: 'IN_APP', label: 'בתוך האפליקציה' },
    { id: 'EMAIL', label: 'אימייל' },
    { id: 'SMS', label: 'SMS' },
    { id: 'WHATSAPP', label: 'וואטסאפ' },
];

export function NotificationPreferences() {
    const { user, updateNotificationPreferences } = useAuth();
    const { toast } = useToast();

    const form = useForm<NotificationPreferencesFormData>({
        resolver: zodResolver(notificationPreferencesSchema),
        defaultValues: user?.notificationPreferences || {
            preferences: {
                lessonReminders: ['IN_APP', 'EMAIL'],
                lessonCancellation: ['IN_APP', 'EMAIL', 'SMS'],
                makeupCredits: ['IN_APP'],
                paymentDue: ['EMAIL'],
                formStatusChanges: ['IN_APP', 'EMAIL'],
                teacherMessages: ['IN_APP'],
                systemAnnouncements: ['IN_APP', 'EMAIL'],
            },
            quietHours: { enabled: false, startTime: "22:00", endTime: "08:00" },
            language: 'HE',
        },
    });

    const onSubmit = (data: NotificationPreferencesFormData) => {
        updateNotificationPreferences(data as NotificationPreferencesType);
        toast({ title: "העדפות עודכנו", description: "העדפות ההתראות שלך נשמרו." });
        form.reset(data); // reset dirty state
    };
    
    if (!user) return null;

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>העדפות ערוצים</CardTitle>
                        <CardDescription>בחר כיצד תרצה לקבל כל סוג של התראה.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>סוג התראה</TableHead>
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
                        <CardTitle>הגדרות נוספות</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="quietHours.enabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">הפעל שעות שקטות</FormLabel>
                                        <FormDescription>
                                            השהה התראות לא דחופות (SMS, וואטסאפ) בשעות שתגדיר.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        {form.watch('quietHours.enabled') && (
                             <div className="grid grid-cols-2 gap-4">
                                 <FormField control={form.control} name="quietHours.startTime" render={({ field }) => ( <FormItem> <FormLabel>שעת התחלה</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                 <FormField control={form.control} name="quietHours.endTime" render={({ field }) => ( <FormItem> <FormLabel>שעת סיום</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             </div>
                        )}
                        <FormField control={form.control} name="language" render={({ field }) => (
                            <FormItem>
                                <FormLabel>שפת התראות</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="HE">עברית</SelectItem>
                                        <SelectItem value="EN">English</SelectItem>
                                        <SelectItem value="AR">العربية</SelectItem>
                                        <SelectItem value="RU">Русский</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                    </CardContent>
                </Card>
                 <div className="flex justify-end">
                    <Button type="submit" disabled={!form.formState.isDirty}>
                        <Save className="me-2 h-4 w-4" />
                        שמור שינויים
                    </Button>
                </div>
            </form>
        </FormProvider>
    )
}
