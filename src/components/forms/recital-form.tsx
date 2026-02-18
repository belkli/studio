'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { schools, instruments, genres, compositions as initialCompositions } from '@/lib/data';
import type { User, Composition } from '@/lib/types';
import { PlusCircle, Send, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';
import { Notice, NoticeDescription, NoticeTitle } from '../ui/notice';
import { Combobox } from '../ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { SaveStatusBar, type SaveState } from './save-status-bar';
import { searchComposers, searchCompositions } from '@/app/actions';
import { debounce } from '@/lib/utils';


const compositionSchema = z.object({
  id: z.string().optional(),
  composer: z.string().min(1, 'חובה להזין מלחין'),
  title: z.string().min(1, 'חובה להזין שם יצירה'),
  genre: z.string().min(1, 'חובה לבחור ז\'אנר'),
  duration: z.string().regex(/^\d{2}:\d{2}$/, 'פורמט לא תקין (MM:SS)'),
  approved: z.boolean().optional(),
});

const MIN_REPERTOIRE_ITEMS = 1;
const MAX_REPERTOIRE_ITEMS = 10;

const formSchema = z.object({
  formType: z.string().min(1, "חובה לבחור סוג טופס"),
  academicYear: z.string().min(1, 'חובה לבחור שנת לימודים'),
  grade: z.enum(['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב']),
  conservatoriumName: z.string().min(1, "חובה לבחור קונסרבטוריון"),
  
  studentName: z.string(),
  idNumber: z.string().refine(val => /^\d{9}$/.test(val), "מספר ת.ז. חייב להכיל 9 ספרות."),
  birthDate: z.string().min(1, 'חובה להזין תאריך לידה'),
  gender: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("כתובת אימייל לא תקינה."),

  schoolName: z.string().optional(),
  hasMusicMajor: z.string().optional(),
  isMajorParticipant: z.string().optional(),
  plansTheoryExam: z.string().optional(),

  instrument: z.string().min(1, "חובה לבחור כלי נגינה"),
  yearsOfStudy: z.coerce.number().optional(),

  teacherName: z.string().min(1, 'חובה להזין שם מורה'),
  yearsWithTeacher: z.coerce.number().optional(),

  repertoire: z.array(compositionSchema).min(MIN_REPERTOIRE_ITEMS, `חובה להוסיף לפחות יצירה אחת`).max(MAX_REPERTOIRE_ITEMS, `ניתן להוסיף עד ${MAX_REPERTOIRE_ITEMS} יצירות`),
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

const emptyComposition = { id: '', composer: '', title: '', genre: '', duration: '00:00', approved: true };

const getHebrewAcademicYear = () => {
    const date = new Date();
    let gregorianYear = date.getFullYear();
    const month = date.getMonth();
    // Hebrew new year is in September/October. If we are before that, we are still in the previous Hebrew year's academic session.
    if (month < 8) { // Before September
        gregorianYear--;
    }
    const hebrewYearShort = (gregorianYear + 1) % 100;
    const hebrewYear = 5700 + hebrewYearShort + (gregorianYear - 2000) + 40; // Approximate
    const hebrewYearInChars = String.fromCharCode(1488 + ((hebrewYear % 100) - 1));
    return `תשפ"${hebrewYearInChars} (${gregorianYear}-${gregorianYear + 1})`;
}

const formatDurationOnBlur = (value: string): string => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length === 0) return '00:00';
    if (cleanValue.length <= 2) return `00:${cleanValue.padStart(2, '0')}`;
    const seconds = cleanValue.slice(-2).padStart(2, '0');
    const minutes = cleanValue.slice(0, -2).padStart(2, '0');
    return `${minutes}:${seconds > '59' ? '59' : seconds}`;
}

const RepertoireItem = ({ index, remove, fields }) => {
    const { control, setValue, watch } = useFormContext();
    const [composerOptions, setComposerOptions] = useState<string[]>([]);
    const [compositionOptions, setCompositionOptions] = useState<Composition[]>([]);
    const [isLoadingComposers, setIsLoadingComposers] = useState(false);
    const [isLoadingCompositions, setIsLoadingCompositions] = useState(false);

    const currentRepertoireItem = watch(`repertoire.${index}`);
    const selectedComposer = currentRepertoireItem?.composer;

    const debouncedComposerSearch = useCallback(debounce(async (query: string) => {
        setIsLoadingComposers(true);
        const results = await searchComposers(query);
        setComposerOptions(results);
        setIsLoadingComposers(false);
    }, 300), []);

    const debouncedCompositionSearch = useCallback(debounce(async (query: string) => {
        setIsLoadingCompositions(true);
        const results = await searchCompositions({ query, composer: selectedComposer });
        setCompositionOptions(results);
        setIsLoadingCompositions(false);
    }, 300), [selectedComposer]);
    
    useEffect(() => {
        if(selectedComposer) {
            debouncedCompositionSearch('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedComposer]);
    
     useEffect(() => {
        debouncedComposerSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectComposition = (id: string) => {
        const composition = initialCompositions.find(c => c.id === id);
        if (composition) {
            setValue(`repertoire.${index}.id`, composition.id);
            setValue(`repertoire.${index}.title`, composition.title);
            setValue(`repertoire.${index}.composer`, composition.composer);
            setValue(`repertoire.${index}.duration`, composition.duration);
            setValue(`repertoire.${index}.genre`, composition.genre);
            setValue(`repertoire.${index}.approved`, composition.approved);
        } else {
             setValue(`repertoire.${index}.title`, id);
        }
    }


    return (
         <div className="border rounded-lg relative">
            <div className="p-4 flex justify-between items-center lg:hidden border-b">
                <span className="font-medium text-muted-foreground">יצירה #{index + 1}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">מחק יצירה</span>
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1.5fr)_minmax(0,2.5fr)_minmax(0,1fr)_110px_auto] items-start gap-x-4 gap-y-2 p-4">
                <div className="hidden lg:flex items-center justify-center h-10 font-medium text-muted-foreground">{index + 1}.</div>
                
                <FormField
                    control={control}
                    name={`repertoire.${index}.composer`}
                    render={({ field: composerField }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>מלחין</FormLabel>
                            <FormControl>
                                <Combobox
                                    options={composerOptions.map(c => ({ value: c, label: c }))}
                                    selectedValue={composerField.value}
                                    onSelectedValueChange={(value) => {
                                        composerField.onChange(value);
                                        setValue(`repertoire.${index}.title`, '');
                                        setValue(`repertoire.${index}.duration`, '00:00');
                                        setValue(`repertoire.${index}.genre`, '');
                                    }}
                                    placeholder="בחר מלחין..."
                                    onInputChange={debouncedComposerSearch}
                                    isLoading={isLoadingComposers}
                                    filter={false}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name={`repertoire.${index}.title`}
                    render={({ field: titleField }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>שם היצירה</FormLabel>
                             <FormControl>
                                <Combobox
                                    options={compositionOptions.map(c => ({ value: c.id, label: c.title }))}
                                    selectedValue={currentRepertoireItem.id || titleField.value}
                                    onSelectedValueChange={handleSelectComposition}
                                    placeholder="בחר יצירה..."
                                    onInputChange={debouncedCompositionSearch}
                                    isLoading={isLoadingCompositions}
                                    filter={false}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField control={control} name={`repertoire.${index}.genre`} render={({ field }) => ( 
                    <FormItem> 
                        <FormLabel>ז'אנר</FormLabel> 
                        <Select dir="rtl" onValueChange={field.onChange} value={field.value}> 
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="בחר ז'אנר"/></SelectTrigger>
                            </FormControl> 
                            <SelectContent>{genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent> 
                        </Select> 
                        <FormMessage /> 
                    </FormItem> 
                )} />
                
                <FormField control={control} name={`repertoire.${index}.duration`} render={({ field }) => ( 
                    <FormItem> 
                        <FormLabel>זמן ביצוע</FormLabel> 
                        <FormControl>
                            <Input 
                                dir='ltr' 
                                placeholder="MM:SS"
                                {...field} 
                                onBlur={(e) => field.onChange(formatDurationOnBlur(e.target.value))}
                            />
                        </FormControl> 
                        <FormMessage /> 
                    </FormItem> 
                )} />
                
                <div className="hidden lg:flex items-center justify-center h-10">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">מחק יצירה</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}


export function RecitalForm({ user, student, onSubmit }: RecitalFormProps) {
  const { toast } = useToast();

  const defaultValues = useMemo(() => ({
    formType: 'רסיטל בגרות',
    academicYear: getHebrewAcademicYear(),
    grade: student?.grade || 'יב',
    conservatoriumName: student?.conservatoriumName || user.conservatoriumName,
    studentName: student?.name || '',
    idNumber: student?.idNumber || '',
    birthDate: student?.birthDate || '',
    gender: student?.gender || 'זכר',
    city: student?.city || '',
    phone: student?.phone || '',
    email: student?.email || '',
    schoolName: student?.schoolName || '',
    hasMusicMajor: 'לא',
    isMajorParticipant: 'לא',
    plansTheoryExam: 'לא',
    instrument: student?.instruments?.[0]?.instrument || '',
    yearsOfStudy: student?.instruments?.[0]?.yearsOfStudy || 0,
    teacherName: student?.instruments?.[0]?.teacherName || '',
    yearsWithTeacher: student?.instruments?.[0]?.yearsOfStudy || 0,
    repertoire: Array.from({ length: MIN_REPERTOIRE_ITEMS }, () => ({ ...emptyComposition })),
    managerNotes: '',
  }), [user, student]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'repertoire',
  });


  const { isDirty } = form.formState;
  const [saveState, setSaveState] = React.useState<SaveState>('idle');
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  const handleSaveDraft = () => {
    setSaveState('saving');
    setTimeout(() => {
        setSaveState('success');
        setLastSaved(new Date());
        toast({ title: "טיוטה נשמרה!" });
        form.reset(form.getValues());
        setTimeout(() => setSaveState('idle'), 3000);
    }, 1500);
  };

  const repertoire = form.watch('repertoire');
  const grade = form.watch('grade');

  const totalDuration = useMemo(() => (repertoire || []).reduce((total, item) => {
    if (!item?.duration) return total;
    const [minutes, seconds] = item.duration.split(':').map(Number);
    if(isNaN(minutes) || isNaN(seconds)) return total;
    return total + (minutes * 60) + seconds;
  }, 0), [repertoire]);

  const totalDurationFormatted = `${String(Math.floor(totalDuration / 60)).padStart(2, '0')}:${String(totalDuration % 60).padStart(2, '0')}`;
  
  const { guideline, isDurationOutsideGuidelines, isDurationUnder } = useMemo(() => {
    if (!grade) return { guideline: undefined, isDurationOutsideGuidelines: false, isDurationUnder: false };
    
    const guidelineForGrade = durationGuidelines[grade];
    if (!guidelineForGrade) return { guideline: undefined, isDurationOutsideGuidelines: false, isDurationUnder: false };

    const totalDurationInMinutes = totalDuration / 60;
    const under = totalDurationInMinutes > 0 && totalDurationInMinutes < guidelineForGrade.min;
    const over = totalDurationInMinutes > guidelineForGrade.max;
    
    return {
      guideline: guidelineForGrade,
      isDurationOutsideGuidelines: under || over,
      isDurationUnder: under
    };
  }, [grade, totalDuration]);


  const areDetailsLocked = true;

  return (
    <FormProvider {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8" key={student.id}>
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
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <FormField control={form.control} name="conservatoriumName" render={({ field }) => ( <FormItem> <FormLabel>קונסרבטוריון</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="formType" render={({ field }) => ( <FormItem><FormLabel>סוג הטופס</FormLabel><Select dir="rtl" onValueChange={field.onChange} value={field.value} disabled><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="רסיטל בגרות">רסיטל בגרות</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="academicYear" render={({ field }) => ( <FormItem> <FormLabel>שנת לימודים</FormLabel> <FormControl><Input {...field} disabled /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField 
                    control={form.control}
                    name="grade" 
                    render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>כיתה</FormLabel>
                            <Select dir="rtl" onValueChange={field.onChange} value={field.value} disabled={areDetailsLocked}>
                                <FormControl><SelectTrigger><SelectValue placeholder="בחר כיתה"/></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="יב">י"ב</SelectItem>
                                    <SelectItem value="יא">י"א</SelectItem>
                                    <SelectItem value="י">י'</SelectItem>
                                    <SelectItem value="ט">ט'</SelectItem>
                                    <SelectItem value="ח">ח'</SelectItem>
                                    <SelectItem value="ז">ז'</SelectItem>
                                    <SelectItem value="ו">ו'</SelectItem>
                                    <SelectItem value="ה">ה'</SelectItem>
                                    <SelectItem value="ד">ד'</SelectItem>
                                    <SelectItem value="ג">ג'</SelectItem>
                                    <SelectItem value="ב">ב'</SelectItem>
                                    <SelectItem value="א">א'</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem> 
                    )} 
                />
             </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>1. פרטים אישיים למועמד/ת</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="studentName" render={({ field }) => ( <FormItem><FormLabel>שם מלא</FormLabel><FormControl><Input {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="idNumber" render={({ field }) => ( <FormItem><FormLabel>מס' תעודת זהות</FormLabel><FormControl><Input {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="birthDate" render={({ field }) => ( <FormItem><FormLabel>תאריך לידה</FormLabel><FormControl><Input type="date" {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                <FormField 
                    control={form.control}
                    name="gender" 
                    render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>מין</FormLabel>
                            <Select dir="rtl" onValueChange={field.onChange} value={field.value || ''} disabled={areDetailsLocked}> 
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="בחר מין"/></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="זכר">זכר</SelectItem>
                                    <SelectItem value="נקבה">נקבה</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem> 
                    )} 
                />
                <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>עיר/יישוב מגורים</FormLabel><FormControl><Input {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>טלפון נייד</FormLabel><FormControl><Input type="tel" {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>דוא"ל</FormLabel><FormControl><Input type="email" {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>2. פרטי בית ספר תיכון למועמד/ת</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FormField 
                    control={form.control}
                    name="schoolName" 
                    render={({ field }) => ( 
                        <FormItem> 
                            <FormLabel>בית ספר</FormLabel> 
                            <Select dir="rtl" onValueChange={field.onChange} value={field.value || ''} disabled={areDetailsLocked}> 
                                <FormControl><SelectTrigger><SelectValue placeholder="בחר בית ספר" /></SelectTrigger></FormControl> 
                                <SelectContent> {schools.map(s => <SelectItem key={s.symbol} value={s.name}>{s.name}</SelectItem>)} </SelectContent> 
                            </Select> 
                            <FormMessage /> 
                        </FormItem> 
                    )} 
                />
                 <FormField name="hasMusicMajor" control={form.control} render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>האם קיימת מגמת מוזיקה בביה"ס?</FormLabel><FormControl><RadioGroup dir="rtl" onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="כן" /></FormControl><FormLabel className="font-normal">כן</FormLabel></FormItem><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="לא" /></FormControl><FormLabel className="font-normal">לא</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem> )} />
                 <FormField name="isMajorParticipant" control={form.control} render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>האם המועמד/ת משתתף/ת במגמה זו?</FormLabel><FormControl><RadioGroup dir="rtl" onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="כן" /></FormControl><FormLabel className="font-normal">כן</FormLabel></FormItem><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="לא" /></FormControl><FormLabel className="font-normal">לא</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem> )} />
                 <FormField name="plansTheoryExam" control={form.control} render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>מתוכנן/ת לבחינת בגרות עיונית במוזיקה?</FormLabel><FormControl><RadioGroup dir="rtl" onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="כן" /></FormControl><FormLabel className="font-normal">כן</FormLabel></FormItem><FormItem className="flex items-center gap-2 flex-row-reverse"><FormControl><RadioGroupItem value="לא" /></FormControl><FormLabel className="font-normal">לא</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>3 &amp; 4. פרטי לימוד והוראה</CardTitle>
            </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-medium text-muted-foreground">פרטי לימוד נגינה / שירה</h3>
                    <FormField 
                        control={form.control}
                        name="instrument" 
                        render={({ field }) => ( 
                            <FormItem> 
                                <FormLabel>כלי נגינה / שירה</FormLabel> 
                                <Select dir="rtl" onValueChange={field.onChange} value={field.value || ''} disabled={areDetailsLocked}> 
                                    <FormControl><SelectTrigger><SelectValue placeholder="בחר כלי" /></SelectTrigger></FormControl> 
                                    <SelectContent> {instruments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)} </SelectContent> 
                                </Select> 
                                <FormMessage /> 
                            </FormItem> 
                        )} 
                    />
                    <FormField control={form.control} name="yearsOfStudy" render={({ field }) => ( <FormItem><FormLabel>סך שנות לימוד בכלי הנגינה</FormLabel><FormControl><Input type="number" {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <div className="space-y-4">
                    <h3 className="font-medium text-muted-foreground">פרטי המורה</h3>
                    <FormField control={form.control} name="teacherName" render={({ field }) => ( <FormItem><FormLabel>שם פרטי ומשפחה</FormLabel><FormControl><Input {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="yearsWithTeacher" render={({ field }) => ( <FormItem><FormLabel>סך שנות לימוד עם המורה הנוכחי</FormLabel><FormControl><Input type="number" {...field} disabled={areDetailsLocked} /></FormControl><FormMessage /></FormItem> )} />
                </div>
             </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>6. רפרטואר</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {fields.map((item, index) => (
                    <RepertoireItem 
                        key={item.id}
                        index={index} 
                        remove={remove}
                        fields={fields}
                    />
                ))}
                </div>
                <div className="flex items-center gap-4 mt-4">
                     <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ ...emptyComposition })}
                        disabled={fields.length >= MAX_REPERTOIRE_ITEMS}
                    >
                        <PlusCircle className="me-2 h-4 w-4" />
                        הוסף יצירה
                    </Button>
                </div>
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
        
        {isDurationOutsideGuidelines && guideline && (
            <Notice variant={isDurationUnder ? 'info' : 'critical'}>
                <NoticeTitle>תשומת לב למשך הרסיטל</NoticeTitle>
                <NoticeDescription>
                {isDurationUnder
                    ? `משך הזמן הכולל (${totalDurationFormatted}) קצר מהמומלץ לכיתה ${grade} (${guideline.label}).`
                    : `משך הזמן הכולל (${totalDurationFormatted}) חורג מהמומלץ לכיתה ${grade} (${guideline.label}).`
                } אנא ודא/י שהרפרטואר מתאים.
                </NoticeDescription>
            </Notice>
        )}

        <Card>
            <CardHeader>
                <CardTitle>7. פרטים נוספים / הערות מנהל/ת</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField control={form.control} name="managerNotes" render={({ field }) => ( <FormItem><FormLabel>מלל חופשי</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem> )} />
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
