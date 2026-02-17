'use client';

import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { User } from '@/lib/types';
import { PlusCircle, Save, Send, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '../ui/textarea';

const compositionSchema = z.object({
  composer: z.string().min(1, 'חובה להזין מלחין'),
  title: z.string().min(1, 'חובה להזין שם יצירה'),
  duration: z.string().regex(/^\d{2}:\d{2}$/, 'פורמט לא תקין (MM:SS)'),
});

const formSchema = z.object({
  academicYear: z.string().min(1, 'חובה לבחור שנת לימודים'),
  conservatoriumName: z.string().min(1, "חובה לבחור קונסרבטוריון"),
  
  // Event Details
  eventName: z.string().min(1, 'חובה להזין שם אירוע'),
  eventDate: z.string().min(1, 'חובה להזין תאריך אירוע'),
  eventLocation: z.string().min(1, 'חובה להזין מיקום'),

  // Ensemble Details
  conductor: z.string().min(1, 'חובה להזין שם מנצח/ת'),
  accompanist: z.string().optional(),
  numParticipants: z.coerce.number().min(1, 'חובה להזין מספר משתתפים'),

  // Repertoire
  repertoire: z.array(compositionSchema).min(1, 'חובה להוסיף לפחות יצירה אחת'),
  
  // Logistical Needs
  logisticalNeeds: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface KenesFormProps {
    user: User;
    onSubmit: (data: FormData) => void;
    saveDraft: () => void;
}

const formatDurationOnBlur = (value: string): string => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length === 0) return '00:00';
    if (cleanValue.length <= 2) return `00:${cleanValue.padStart(2, '0')}`;
    const seconds = cleanValue.slice(-2).padStart(2, '0');
    const minutes = cleanValue.slice(0, -2).padStart(2, '0');
    return `${minutes}:${seconds > '59' ? '59' : seconds}`;
}

export function KenesForm({ user, onSubmit, saveDraft }: KenesFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      academicYear: `תשפ"${String.fromCharCode(1488 + (new Date().getFullYear() % 100) % 10 + 4)}`,
      repertoire: [{ composer: '', title: '', duration: '00:00' }],
      conservatoriumName: user.conservatoriumName,
      eventName: '',
      eventDate: '',
      eventLocation: '',
      conductor: '',
      accompanist: '',
      numParticipants: 1,
      logisticalNeeds: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'repertoire',
  });
  
  const repertoire = form.watch('repertoire');
  const totalDuration = repertoire.reduce((total, item) => {
    const [minutes, seconds] = item.duration.split(':').map(Number);
    if(isNaN(minutes) || isNaN(seconds)) return total;
    return total + (minutes * 60) + seconds;
  }, 0);
  const totalDurationFormatted = `${String(Math.floor(totalDuration / 60)).padStart(2, '0')}:${String(totalDuration % 60).padStart(2, '0')}`;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
        
        <Card>
          <CardHeader>
            <CardTitle>טופס פרטי משתתף בכנס / אירוע</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <FormField name="academicYear" render={({ field }) => ( <FormItem> <FormLabel>שנת לימודים</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="conservatoriumName" render={({ field }) => ( <FormItem> <FormLabel>קונסרבטוריון</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem> )} />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>1. פרטי האירוע</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
                <FormField name="eventName" render={({ field }) => ( <FormItem><FormLabel>שם האירוע</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="eventDate" render={({ field }) => ( <FormItem><FormLabel>תאריך האירוע</FormLabel><FormControl><Input type="date" placeholder="dd/mm/yyyy" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="eventLocation" render={({ field }) => ( <FormItem><FormLabel>מיקום</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>2. פרטי ההרכב</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
                <FormField name="conductor" render={({ field }) => ( <FormItem><FormLabel>מנצח/ת או מנהל/ת מוזיקלי</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="accompanist" render={({ field }) => ( <FormItem><FormLabel>פסנתרן/ית מלווה</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="numParticipants" render={({ field }) => ( <FormItem><FormLabel>מספר משתתפים</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>3. תוכנית לביצוע</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-4 items-end p-4 border rounded-lg relative">
                        <FormField control={form.control} name={`repertoire.${index}.composer`} render={({ field }) => ( <FormItem> <FormLabel>מלחין</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name={`repertoire.${index}.title`} render={({ field }) => ( <FormItem> <FormLabel>שם היצירה</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name={`repertoire.${index}.duration`} render={({ field }) => ( 
                            <FormItem> 
                                <FormLabel>זמן ביצוע</FormLabel> 
                                <FormControl>
                                    <Input 
                                        dir='ltr' 
                                        {...field} 
                                        onBlur={(e) => field.onChange(formatDurationOnBlur(e.target.value))}
                                    />
                                </FormControl> 
                                <FormMessage /> 
                            </FormItem> 
                        )} />
                        
                        <div className="flex items-end h-full">
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">מחק יצירה</span>
                            </Button>
                        </div>
                    </div>
                ))}
                </div>
                 <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => append({ composer: '', title: '', duration: '00:00' })}
                >
                    <PlusCircle className="me-2 h-4 w-4" />
                    הוסף יצירה
                </Button>
                 <FormMessage>{form.formState.errors.repertoire?.root?.message}</FormMessage>

            </CardContent>
            <Separator />
            <CardFooter className="flex justify-end pt-6">
                <div className="text-lg font-bold">
                    <span>סה"כ זמן ביצוע: </span>
                    <span>{totalDurationFormatted}</span>
                </div>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>4. צרכים לוגיסטיים</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField name="logisticalNeeds" render={({ field }) => ( <FormItem><FormLabel>מלל חופשי</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={saveDraft}>
                <Save className="me-2 h-4 w-4" />
                שמור כטיוטה
            </Button>
            <Button type="submit">
                <Send className="me-2 h-4 w-4" />
                הגש לאישור
            </Button>
        </div>
      </form>
    </FormProvider>
  );
}
