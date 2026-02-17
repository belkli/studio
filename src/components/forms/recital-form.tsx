'use client';

import React, { useMemo } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { schools, instruments, compositions as compositionsDB } from '@/lib/data';
import type { User } from '@/lib/types';
import { PlusCircle, Send, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';
import { Notice, NoticeDescription, NoticeTitle } from '../ui/notice';
import { Combobox } from '../ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { SaveStatusBar, type SaveState } from './save-status-bar';

const compositionSchema = z.object({
  composer: z.string().min(1, 'חובה להזין מלחין'),
  title: z.string().min(1, 'חובה להזין שם יצירה'),
  genre: z.string().min(1, 'חובה לבחור ז\'אנר'),
  duration: z.string().regex(/^\d{2}:\d{2}$/, 'פורמט לא תקין (MM:SS)'),
});

const MIN_REPERTOIRE_ITEMS = 3;
const MAX_REPERTOIRE_ITEMS = 10;

const formSchema = z.object({
  formType: z.string().min(1, "חובה לבחור סוג טופס"),
  academicYear: z.string().min(1, 'חובה לבחור שנת לימודים'),
  grade: z.enum(['י', 'יא', 'יב']),
  conservatoriumName: z.string().min(1, "חובה לבחור קונסרבטוריון"),
  
  // Applicant details
  studentName: z.string(),
  idNumber: z.string().refine(val => /^\d{9}$/.test(val), "מספר ת.ז. חייב להכיל 9 ספרות."),
  birthDate: z.string().min(1, 'חובה להזין תאריך לידה'),
  gender: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("כתובת אימייל לא תקינה."),

  // School
  schoolName: z.string().optional(),
  hasMusicMajor: z.string().optional(),
  isMajorParticipant: z.string().optional(),
  plansTheoryExam: z.string().optional(),

  // Instrument
  instrument: z.string().min(1, "חובה לבחור כלי נגינה"),
  yearsOfStudy: z.coerce.number().optional(),

  // Teacher
  teacherName: z.string().min(1, 'חובה להזין שם מורה'),
  yearsWithTeacher: z.coerce.number().optional(),

  // Repertoire
  repertoire: z.array(compositionSchema).min(MIN_REPERTOIRE_ITEMS, `חובה להוסיף לפחות ${MIN_REPERTOIRE_ITEMS} יצירות`).max(MAX_REPERTOIRE_ITEMS, `ניתן להוסיף עד ${MAX_REPERTOIRE_ITEMS} יצירות`),
  managerNotes: z.string().optional(),
});


type FormData = z.infer<typeof formSchema>;

interface RecitalFormProps {
    user: User;
    student: User;
    onSubmit: (data: FormData) => void;
}

const durationGuidelines = {
  'י': { min: 15, max: 20, label: "15-20 דקות" },
  'יא': { min: 20, max: 30, label: "20-30 דקות" },
  'יב': { min: 25, max: 35, label: "25-35 דקות" },
};


export function RecitalForm({ user, student, onSubmit }: RecitalFormProps) {
    const firstInstrument = student.instruments?.[0];
    
    const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formType: 'רסיטל בגרות',
      academicYear: `תשפ"${String.fromCharCode(1488 + (new Date().getFullYear() % 100) % 10 + 4)}`,
      grade: student.grade || 'י',
      conservatoriumName: student.conservatoriumName || user.conservatoriumName,
      studentName: student.name || '',
      idNumber: student.idNumber || '',
      birthDate: student.birthDate || '',
      gender: student.gender || 'זכר',
      city: student.city || '',
      phone: student.phone || '',
      email: student.email || '',
      schoolName: student.schoolName || '',
      hasMusicMajor: 'לא',
      isMajorParticipant: 'לא',
      plansTheoryExam: 'לא',
      instrument: firstInstrument?.instrument || '',
      yearsOfStudy: firstInstrument?.yearsOfStudy || 0,
      teacherName: firstInstrument?.teacherName || '',
      yearsWithTeacher: firstInstrument?.yearsOfStudy || 0,
      repertoire: Array.from({ length: MIN_REPERTOIRE_ITEMS }, () => ({ composer: '', title: '', genre: '', duration: '00:00' })),
      managerNotes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'repertoire',
  });

  const { toast } = useToast();
  const { isDirty } = form.formState;
  const [saveState, setSaveState] = React.useState<SaveState>('idle');
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  const handleSaveDraft = () => {
    setSaveState('saving');
    // In a real app, you would make an API call here.
    setTimeout(() => {
        // Simulate success
        setSaveState('success');
        setLastSaved(new Date());
        toast({ title: "טיוטה נשמרה!" });

        // Reset the dirty state of the form after saving
        form.reset(form.getValues());

        // Briefly show success message, then return to idle to show last saved time
        setTimeout(() => setSaveState('idle'), 3000);
    }, 1500);
  };

  const repertoire = form.watch('repertoire');
  const grade = form.watch('grade');

  const totalDuration = repertoire.reduce((total, item) => {
    const [minutes, seconds] = item.duration.split(':').map(Number);
    if(isNaN(minutes) || isNaN(seconds)) return total;
    return total + (minutes * 60) + seconds;
  }, 0);

  const totalDurationFormatted = `${String(Math.floor(totalDuration / 60)).padStart(2, '0')}:${String(totalDuration % 60).padStart(2, '0')}`;
  
  const guideline = grade ? durationGuidelines[grade] : undefined;
  const totalDurationInMinutes = totalDuration / 60;
  const isDurationOutsideGuidelines = guideline && (totalDurationInMinutes < guideline.min || totalDurationInMinutes > guideline.max) && totalDuration > 0;

  const areDetailsLocked = true; // Always locked once a student is selected

  const composerOptions = useMemo(() => 
    Array.from(new Set(compositionsDB.map(c => c.composer))).map(c => ({ value: c, label: c }))
  , []);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
        <SaveStatusBar 
            isDirty={isDirty}
            saveState={saveState}
            lastSaved={lastSaved}
            onSave={handleSaveDraft}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>טופס מועמד/ת לקראת בגרות במוזיקה - רסיטל</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid md:grid-cols-4 gap-4 pt-4">
                <FormField name="conservatoriumName" render={({ field }) => ( <FormItem> <FormLabel>קונסרבטוריון</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="formType" render={({ field }) => ( <FormItem><FormLabel>סוג הטופס</FormLabel><Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value} disabled><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="רסיטל בגרות">רסיטל בגרות</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField name="academicYear" render={({ field }) => ( <FormItem> <FormLabel>שנת לימודים</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField name="grade" render={({ field }) => ( <FormItem><FormLabel>כיתה</FormLabel><Select dir="rtl" onValueChange={field.onChange} value={field.value} disabled={areDetailsLocked}><FormControl><SelectTrigger><SelectValue placeholder="בחר כיתה"/></SelectTrigger></FormControl><SelectContent><SelectItem value="י">י'</SelectItem><SelectItem value="יא">י"א</SelectItem><SelectItem value="יב">י"ב</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
             </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>1. פרטים אישיים למועמד/ת</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-4">
                <FormField name="studentName" render={({ field }) => ( <FormItem><FormLabel>שם מלא</FormLabel><FormControl><Input {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="idNumber" render={({ field }) => ( <FormItem><FormLabel>מס' תעודת זהות</FormLabel><FormControl><Input {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="birthDate" render={({ field }) => ( <FormItem><FormLabel>תאריך לידה</FormLabel><FormControl><Input type="date" {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="gender" render={({ field }) => ( <FormItem><FormLabel>מין</FormLabel><Select dir="rtl" onValueChange={field.onChange} value={field.value || ''} disabled={areDetailsLocked}><FormControl><SelectTrigger><SelectValue placeholder="בחר מין"/></SelectTrigger></FormControl><SelectContent><SelectItem value="זכר">זכר</SelectItem><SelectItem value="נקבה">נקבה</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField name="city" render={({ field }) => ( <FormItem><FormLabel>עיר/יישוב מגורים</FormLabel><FormControl><Input {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="phone" render={({ field }) => ( <FormItem><FormLabel>טלפון נייד</FormLabel><FormControl><Input type="tel" {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="email" render={({ field }) => ( <FormItem><FormLabel>דוא"ל</FormLabel><FormControl><Input type="email" {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>2. פרטי בית ספר תיכון למועמד/ת</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                <FormField name="schoolName" render={({ field }) => ( <FormItem> <FormLabel>בית ספר</FormLabel> <Select dir="rtl" onValueChange={field.onChange} value={field.value || ''} disabled={areDetailsLocked}> <FormControl><SelectTrigger><SelectValue placeholder="בחר בית ספר" /></SelectTrigger></FormControl> <SelectContent> {schools.map(s => <SelectItem key={s.symbol} value={s.name}>{s.name}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                 <FormField name="hasMusicMajor" control={form.control} render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>האם קיימת מגמת מוזיקה בביה"ס?</FormLabel><FormControl><RadioGroup dir="rtl" onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="כן" /></FormControl><FormLabel className="font-normal">כן</FormLabel></FormItem><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="לא" /></FormControl><FormLabel className="font-normal">לא</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem> )} />
                 <FormField name="isMajorParticipant" control={form.control} render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>האם המועמד/ת משתתף/ת במגמה זו?</FormLabel><FormControl><RadioGroup dir="rtl" onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="כן" /></FormControl><FormLabel className="font-normal">כן</FormLabel></FormItem><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="לא" /></FormControl><FormLabel className="font-normal">לא</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem> )} />
                 <FormField name="plansTheoryExam" control={form.control} render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>מתוכנן/ת לבחינת בגרות עיונית במוזיקה?</FormLabel><FormControl><RadioGroup dir="rtl" onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="כן" /></FormControl><FormLabel className="font-normal">כן</FormLabel></FormItem><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="לא" /></FormControl><FormLabel className="font-normal">לא</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>3 &amp; 4. פרטי לימוד והוראה</CardTitle>
            </CardHeader>
             <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-medium text-muted-foreground">פרטי לימוד נגינה / שירה</h3>
                    <FormField name="instrument" render={({ field }) => ( <FormItem> <FormLabel>כלי נגינה / שירה</FormLabel> <Select dir="rtl" onValueChange={field.onChange} value={field.value || ''} disabled={areDetailsLocked}> <FormControl><SelectTrigger><SelectValue placeholder="בחר כלי" /></SelectTrigger></FormControl> <SelectContent> {instruments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                    <FormField name="yearsOfStudy" render={({ field }) => ( <FormItem><FormLabel>סך שנות לימוד בכלי הנגינה</FormLabel><FormControl><Input type="number" {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <div className="space-y-4">
                    <h3 className="font-medium text-muted-foreground">פרטי המורה</h3>
                    <FormField name="teacherName" render={({ field }) => ( <FormItem><FormLabel>שם פרטי ומשפחה</FormLabel><FormControl><Input {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField name="yearsWithTeacher" render={({ field }) => ( <FormItem><FormLabel>סך שנות לימוד עם המורה הנוכחי</FormLabel><FormControl><Input type="number" {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                </div>
             </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>6. רפרטואר</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {fields.map((field, index) => {
                    const selectedComposer = repertoire[index]?.composer;
                    const titleOptions = selectedComposer
                        ? compositionsDB
                            .filter(c => c.composer === selectedComposer)
                            .map(c => ({ value: c.id, label: c.title }))
                        : [];

                    return (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-x-4 gap-y-2 items-start p-4 border rounded-lg relative">
                            <div className="font-medium text-muted-foreground self-center pt-6">{index + 1}.</div>
                            
                            <FormField
                                control={form.control}
                                name={`repertoire.${index}.composer`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>מלחין</FormLabel>
                                        <Combobox
                                            options={composerOptions}
                                            selectedValue={field.value}
                                            onSelectedValueChange={(value) => {
                                                form.setValue(`repertoire.${index}.composer`, value);
                                                // Reset dependent fields
                                                form.setValue(`repertoire.${index}.title`, '');
                                                form.setValue(`repertoire.${index}.duration`, '00:00');
                                                form.setValue(`repertoire.${index}.genre`, '');
                                            }}
                                            placeholder="בחר מלחין..."
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={`repertoire.${index}.title`}
                                render={({ field: titleField }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>שם היצירה</FormLabel>
                                        <Combobox
                                            options={titleOptions}
                                            selectedValue={compositionsDB.find(c => c.title === titleField.value && c.composer === selectedComposer)?.id || ''}
                                            onSelectedValueChange={(id) => {
                                                const composition = compositionsDB.find(c => c.id === id);
                                                if (composition) {
                                                    form.setValue(`repertoire.${index}.title`, composition.title);
                                                    form.setValue(`repertoire.${index}.duration`, composition.duration);
                                                    form.setValue(`repertoire.${index}.genre`, composition.genre);
                                                }
                                            }}
                                            placeholder="בחר יצירה..."
                                            disabled={!selectedComposer}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField control={form.control} name={`repertoire.${index}.genre`} render={({ field }) => ( <FormItem> <FormLabel>ז'אנר</FormLabel> <FormControl><Input {...field} readOnly className="bg-muted/50" /></FormControl> <FormMessage /> </FormItem> )} />
                            
                            <FormField 
                                control={form.control} 
                                name={`repertoire.${index}.duration`} 
                                render={({ field }) => ( 
                                    <FormItem> 
                                        <FormLabel>זמן ביצוע</FormLabel> 
                                        <FormControl>
                                            <Input 
                                                dir='ltr'
                                                placeholder="MM:SS"
                                                maxLength={5} 
                                                {...field} 
                                                readOnly 
                                                className="bg-muted/50"
                                            />
                                        </FormControl> 
                                        <FormMessage /> 
                                    </FormItem> 
                                )} 
                            />
                            
                            <div className="self-center pt-6">
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">מחק יצירה</span>
                                </Button>
                            </div>
                        </div>
                    );
                })}
                </div>
                 <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => append({ composer: '', title: '', genre: '', duration: '00:00' })}
                    disabled={fields.length >= MAX_REPERTOIRE_ITEMS}
                >
                    <PlusCircle className="me-2 h-4 w-4" />
                    הוסף יצירה
                </Button>
                {fields.length >= MAX_REPERTOIRE_ITEMS && (
                    <p className="text-sm text-muted-foreground mt-2">הגעת למספר המקסימלי של {MAX_REPERTOIRE_ITEMS} יצירות.</p>
                )}
                 <FormMessage>{form.formState.errors.repertoire?.root?.message || form.formState.errors.repertoire?.message}</FormMessage>

            </CardContent>
            <Separator />
            <CardFooter className="flex justify-end pt-6">
                <div className="text-lg font-bold">
                    <span>סה"כ זמן ביצוע: </span>
                    <span>{totalDurationFormatted}</span>
                </div>
            </CardFooter>
        </Card>
        
        {isDurationOutsideGuidelines && (
            <Notice variant="critical">
                <NoticeTitle>תשומת לב למשך הרסיטל</NoticeTitle>
                <NoticeDescription>
                משך הזמן הכולל ({totalDurationFormatted}) חורג מהמומלץ לכיתה {grade} ({guideline?.label}). אנא ודא/י שהרפרטואר מתאים.
                </NoticeDescription>
            </Notice>
        )}

        <Card>
            <CardHeader>
                <CardTitle>7. פרטים נוספים / הערות מנהל/ת</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField name="managerNotes" render={({ field }) => ( <FormItem><FormLabel>מלל חופשי</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
            <Button type="submit">
                <Send className="me-2 h-4 w-4" />
                הגש לאישור
            </Button>
        </div>
      </form>
    </FormProvider>
  );
}
