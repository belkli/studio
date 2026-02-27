'use client';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { Checkbox } from '@/components/ui/checkbox';
import type { EventProduction } from '@/lib/types';


const eventSchema = z.object({
    name: z.string().min(5, "שם האירוע חייב להכיל לפחות 5 תווים."),
    type: z.enum(['RECITAL', 'CONCERT', 'EXAM_PERFORMANCE', 'OPEN_DAY']),
    venue: z.string().min(3, "חובה לציין מיקום."),
    eventDate: z.string().min(1, "חובה לבחור תאריך."),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "פורמט שעה לא תקין (HH:mm)."),
    isPublic: z.boolean().default(false),
    ticketPrice: z.coerce.number().min(0).default(0),
});

type EventFormData = z.infer<typeof eventSchema>;

export function EventForm() {
    const { addEvent } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<EventFormData>({
        resolver: zodResolver(eventSchema) as any,
        defaultValues: {
            isPublic: false,
            ticketPrice: 0,
            type: 'RECITAL',
        },
    });

    const onSubmit = (data: EventFormData) => {
        addEvent({ ...data });
        toast({ title: 'אירוע נוצר בהצלחה!' });
        router.push('/dashboard/events');
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>פרטי אירוע</CardTitle>
                        <CardDescription>מלא את פרטי האירוע הבסיסיים. תוכל להוסיף משתתפים ולנהל את התוכניה לאחר היצירה.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem> <FormLabel>שם האירוע</FormLabel> <FormControl><Input placeholder="לדוגמה: רסיטל סוף שנה - כלי קשת" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                        <div className="grid md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="type" render={({ field }) => (<FormItem> <FormLabel>סוג אירוע</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="RECITAL">רסיטל</SelectItem><SelectItem value="CONCERT">קונצרט</SelectItem><SelectItem value="EXAM_PERFORMANCE">בחינת במה</SelectItem><SelectItem value="OPEN_DAY">יום פתוח</SelectItem></SelectContent></Select> <FormMessage /> </FormItem>)} />
                            <FormField control={form.control} name="eventDate" render={({ field }) => (<FormItem> <FormLabel>תאריך</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem> <FormLabel>שעת התחלה</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                        </div>
                        <FormField control={form.control} name="venue" render={({ field }) => (<FormItem> <FormLabel>מיקום</FormLabel> <FormControl><Input placeholder="לדוגמה: אולם קונצרטים עירוני" {...field} /></FormControl> <FormMessage /> </FormItem>)} />

                        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                            <FormField control={form.control} name="isPublic" render={({ field }) => (
                                <FormItem className="flex items-center gap-2 pt-6">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="isPublic" /></FormControl>
                                    <FormLabel htmlFor="isPublic" className="!mt-0">אירוע פתוח לקהל הרחב?</FormLabel>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="ticketPrice" render={({ field }) => (<FormItem> <FormLabel>מחיר כרטיס (0 אם בחינם)</FormLabel> <InputGroup><InputGroupText>₪</InputGroupText><FormControl><Input type="number" {...field} disabled={!form.watch('isPublic')} /></FormControl></InputGroup> <FormMessage /> </FormItem>)} />
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit">צור אירוע</Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
