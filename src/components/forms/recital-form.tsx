'use client';

import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { schools, instruments } from '@/lib/data';
import type { User } from '@/lib/types';
import { PlusCircle, Save, Send, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getCompositionSuggestions } from '@/app/actions';
import { useEffect, useState, useCallback } from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';
import { Notice, NoticeDescription, NoticeTitle } from '../ui/notice';

const compositionSchema = z.object({
  composer: z.string().min(1, 'חובה להזין מלחין'),
  title: z.string().min(1, 'חובה להזין שם יצירה'),
  genre: z.string().min(1, 'חובה לבחור ז\'אנר'),
  duration: z.string().regex(/^\d{2}:\d{2}$/, 'פורמט לא תקין (MM:SS)'),
});

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
  repertoire: z.array(compositionSchema).min(1, 'חובה להוסיף לפחות יצירה אחת'),
  managerNotes: z.string().optional(),
});


type FormData = z.infer<typeof formSchema>;
type Suggestion = { composer: string; title: string; duration: string; genre: string };

function CompositionSuggestions({ composer, onSelect }: { composer: string; onSelect: (suggestion: Suggestion) => void }) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = useCallback(async (composerName: string) => {
        if (composerName.length < 2) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        const result = await getCompositionSuggestions({ composer: composerName });
        setSuggestions(result as Suggestion[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchSuggestions(composer);
        }, 500);
        return () => clearTimeout(debounce);
    }, [composer, fetchSuggestions]);

    if(loading) return <div className="p-2 text-sm text-muted-foreground">טוען הצעות...</div>
    if (suggestions.length === 0) return null;

    return (
        <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
            {suggestions.map((s, i) => (
                <div key={i} onClick={() => onSelect(s)} className="p-2 hover:bg-muted cursor-pointer text-sm">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.composer} - {s.duration}</p>
                </div>
            ))}
        </div>
    )
}

interface RecitalFormProps {
    user: User;
    student: User;
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

const durationGuidelines = {
  'י': { min: 15, max: 20, label: "15-20 דקות" },
  'יא': { min: 20, max: 30, label: "20-30 דקות" },
  'יב': { min: 25, max: 35, label: "25-35 דקות" },
};


export function RecitalForm({ user, student, onSubmit, saveDraft }: RecitalFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formType: 'רסיטל בגרות',
      academicYear: `תשפ"${String.fromCharCode(1488 + (new Date().getFullYear() % 100) % 10 + 4)}`,
      grade: 'י',
      conservatoriumName: '',
      studentName: '',
      idNumber: '',
      birthDate: '',
      gender: '',
      city: '',
      phone: '',
      email: '',
      schoolName: '',
      hasMusicMajor: 'לא',
      isMajorParticipant: 'לא',
      plansTheoryExam: 'לא',
      instrument: '',
      yearsOfStudy: 0,
      teacherName: '',
      yearsWithTeacher: 0,
      repertoire: [{ composer: '', title: '', genre: 'קלאסי', duration: '00:00' }],
      managerNotes: '',
    },
  });

  // Effect to pre-fill form when student is selected
  useEffect(() => {
    if (student) {
        const firstInstrument = student.instruments?.[0];

        form.reset({
            ...form.getValues(), // Keep some defaults like academic year
            studentName: student.name || '',
            idNumber: student.idNumber || '',
            birthDate: student.birthDate || '',
            gender: student.gender || '',
            city: student.city || '',
            phone: student.phone || '',
            email: student.email || '',
            schoolName: student.schoolName || '',
            instrument: firstInstrument?.instrument || '',
            yearsOfStudy: firstInstrument?.yearsOfStudy || 0,
            teacherName: firstInstrument?.teacherName || '',
            yearsWithTeacher: firstInstrument?.yearsOfStudy || 0,
            grade: student.grade || 'י',
            conservatoriumName: student.conservatoriumName || user.conservatoriumName,
        });
    }
  }, [student, form, user.conservatoriumName]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'repertoire',
  });

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);

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

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
        
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
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 items-start p-4 border rounded-lg relative">
                        <FormField
                            control={form.control}
                            name={`repertoire.${index}.composer`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>מלחין</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input {...field} onFocus={() => setActiveSuggestionIndex(index)} onBlur={() => setTimeout(() => setActiveSuggestionIndex(null), 150)} />
                                        {activeSuggestionIndex === index && <CompositionSuggestions composer={field.value} onSelect={(s) => {
                                            form.setValue(`repertoire.${index}.composer`, s.composer);
                                            form.setValue(`repertoire.${index}.title`, s.title);
                                            form.setValue(`repertoire.${index}.duration`, s.duration);
                                            form.setValue(`repertoire.${index}.genre`, s.genre);
                                            setActiveSuggestionIndex(null);
                                        }} />}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField control={form.control} name={`repertoire.${index}.title`} render={({ field }) => ( <FormItem> <FormLabel>שם היצירה</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name={`repertoire.${index}.genre`} render={({ field }) => ( <FormItem> <FormLabel>ז'אנר</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField 
                            control={form.control} 
                            name={`repertoire.${index}.duration`} 
                            render={({ field }) => ( 
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
                            )} 
                        />
                        
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
                    onClick={() => append({ composer: '', title: '', genre: 'קלאסי', duration: '00:00' })}
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
