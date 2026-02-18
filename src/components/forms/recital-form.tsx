// @ts-nocheck
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { schools, instruments, compositions as compositionsDB, genres } from '@/lib/data';
import type { User, Composition } from '@/lib/types';
import { PlusCircle, Send, Trash2, Music4 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';
import { Notice, NoticeDescription, NoticeTitle } from '../ui/notice';
import { Combobox } from '../ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { SaveStatusBar, type SaveState } from './save-status-bar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '../ui/dropdown-menu';

const compositionSchema = z.object({
  id: z.string().optional(),
  composer: z.string().min(1, 'חובה להזין מלחין'),
  title: z.string().min(1, 'חובה להזין שם יצירה'),
  genre: z.string().min(1, 'חובה לבחור ז\'אנר'),
  duration: z.string().regex(/^\d{2}:\d{2}$/, 'פורמט לא תקין (MM:SS)'),
  approved: z.boolean().optional(),
  movements: z.array(z.object({ title: z.string(), duration: z.string() })).optional(),
  selectedMovements: z.array(z.string()).optional(),
});

const MIN_REPERTOIRE_ITEMS = 1;
const MAX_REPERTOIRE_ITEMS = 10;

const formSchema = z.object({
  formType: z.string().min(1, "חובה לבחור סוג טופס"),
  academicYear: z.string().min(1, 'חובה לבחור שנת לימודים'),
  grade: z.enum(['י', 'יא', 'יב']),
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

const emptyComposition = { composer: '', title: '', genre: '', duration: '00:00', approved: true, movements: [], selectedMovements: [] };

const getHebrewAcademicYear = () => {
    const date = new Date();
    let gregorianYear = date.getFullYear();
    const month = date.getMonth();
    // Hebrew new year is in September/October. If we are before that, we are still in the previous Hebrew year's academic session.
    if (month < 8) { // Before September
        gregorianYear--;
    }
    const hebrewYear = 5700 + (gregorianYear - 1939); // Approximation
    const hebrewYearStr = `תשפ"${String.fromCharCode(1488 + (hebrewYear % 100) % 10 - 1)}`;
    return `${hebrewYearStr} (${gregorianYear}-${gregorianYear + 1})`;
}

const MovementSelector = ({ movements, selected, onSelectionChange, onDurationChange }) => {
    const handleSelect = (movementTitle: string) => {
        const newSelection = selected.includes(movementTitle)
            ? selected.filter(m => m !== movementTitle)
            : [...selected, movementTitle];
        onSelectionChange(newSelection);
    };

    useEffect(() => {
        const totalSeconds = selected.reduce((acc, selTitle) => {
            const movement = movements.find(m => m.title === selTitle);
            if (movement) {
                const [min, sec] = movement.duration.split(':').map(Number);
                return acc + (min * 60) + sec;
            }
            return acc;
        }, 0);
        
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        onDurationChange(`${minutes}:${seconds}`);

    }, [selected, movements, onDurationChange]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Music4 className="me-2"/>
                    בחר פרקים
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>פרקים לביצוע</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {movements.map(movement => (
                    <DropdownMenuCheckboxItem
                        key={movement.title}
                        checked={selected.includes(movement.title)}
                        onCheckedChange={() => handleSelect(movement.title)}
                        onSelect={(e) => e.preventDefault()} // Prevent closing
                    >
                        {movement.title} ({movement.duration})
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


export function RecitalForm({ user, student, onSubmit }: RecitalFormProps) {
    const { toast } = useToast();
    const firstInstrument = student.instruments?.[0];
    
    const [userCompositions, setUserCompositions] = useState<Composition[]>([]);
    const [customEntryOpen, setCustomEntryOpen] = useState(false);
    const [customEntryData, setCustomEntryData] = useState({ composer: '', title: '', genre: '', duration: '00:00' });
    
    const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formType: 'רסיטל בגרות',
      academicYear: getHebrewAcademicYear(),
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
      repertoire: Array.from({ length: MIN_REPERTOIRE_ITEMS }, () => ({ ...emptyComposition })),
      managerNotes: '',
    },
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
  
  const handleCustomEntrySave = () => {
    if (!customEntryData.composer || !customEntryData.title || !customEntryData.genre || !customEntryData.duration.match(/^\d{2}:\d{2}$/)) {
        toast({ variant: "destructive", title: "שדות חסרים", description: "יש למלא את כל פרטי היצירה." });
        return;
    }
    const newComposition: Composition = {
        id: `user-${Date.now()}`,
        ...customEntryData,
        approved: false,
        source: 'user_submitted',
    };
    setUserCompositions(prev => [...prev, newComposition]);
    toast({ title: "יצירה חדשה נוספה", description: `"${newComposition.title}" נוספה וממתינה לאישור מנהל.` });
    setCustomEntryOpen(false);
    setCustomEntryData({ composer: '', title: '', genre: '', duration: '00:00' });
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

  const areDetailsLocked = true;

  const allCompositions = useMemo(() => [...compositionsDB, ...userCompositions], [userCompositions]);

  const composerOptions = useMemo(() => 
    Array.from(new Set(allCompositions.map(c => c.composer))).map(c => ({ value: c, label: c }))
  , [allCompositions]);

  const getTitleOptions = useCallback((composer?: string) => {
      const source = composer ? allCompositions.filter(c => c.composer === composer) : allCompositions;
      return source.map(c => ({ value: c.id, label: c.title }));
  }, [allCompositions]);


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
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <FormField name="conservatoriumName" render={({ field }) => ( <FormItem> <FormLabel>קונסרבטוריון</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="formType" render={({ field }) => ( <FormItem><FormLabel>סוג הטופס</FormLabel><Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value} disabled><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="רסיטל בגרות">רסיטל בגרות</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField name="academicYear" render={({ field }) => ( <FormItem> <FormLabel>שנת לימודים</FormLabel> <FormControl><Input {...field} disabled /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField name="grade" render={({ field }) => ( <FormItem><FormLabel>כיתה</FormLabel><Select dir="rtl" onValueChange={field.onChange} value={field.value} disabled={areDetailsLocked}><FormControl><SelectTrigger><SelectValue placeholder="בחר כיתה"/></SelectTrigger></FormControl><SelectContent><SelectItem value="י">י'</SelectItem><SelectItem value="יא">י"א</SelectItem><SelectItem value="יב">י"ב</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
             </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>1. פרטים אישיים למועמד/ת</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
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
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    const currentRepertoireItem = repertoire[index];
                    const selectedComposer = currentRepertoireItem?.composer;

                    return (
                        <div key={field.id} className="border rounded-lg relative">
                            <div className="p-4 flex justify-between items-center md:hidden border-b">
                                <span className="font-medium text-muted-foreground">יצירה #{index + 1}</span>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">מחק יצירה</span>
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[auto_1fr_1fr] lg:grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-y-4 gap-x-4 p-4 md:items-start">
                                <div className="hidden md:block font-medium text-muted-foreground self-center pt-6">{index + 1}.</div>
                                
                                <FormField
                                    control={form.control}
                                    name={`repertoire.${index}.composer`}
                                    render={({ field: composerField }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>מלחין</FormLabel>
                                            <Combobox
                                                options={composerOptions}
                                                selectedValue={composerField.value}
                                                onSelectedValueChange={(value) => {
                                                    form.setValue(`repertoire.${index}.composer`, value);
                                                    form.setValue(`repertoire.${index}.title`, '');
                                                    form.setValue(`repertoire.${index}.duration`, '00:00');
                                                    form.setValue(`repertoire.${index}.genre`, '');
                                                    form.setValue(`repertoire.${index}.movements`, []);
                                                    form.setValue(`repertoire.${index}.selectedMovements`, []);
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
                                            <FormLabel>
                                                שם היצירה
                                                {currentRepertoireItem && currentRepertoireItem.approved === false && (
                                                    <span className="text-xs text-yellow-600 ms-2">(ממתין לאישור)</span>
                                                )}
                                            </FormLabel>
                                            <Combobox
                                                options={getTitleOptions(selectedComposer)}
                                                selectedValue={currentRepertoireItem.id || ''}
                                                onSelectedValueChange={(id) => {
                                                    const composition = allCompositions.find(c => c.id === id);
                                                    if (composition) {
                                                        form.setValue(`repertoire.${index}.id`, composition.id);
                                                        form.setValue(`repertoire.${index}.title`, composition.title);
                                                        form.setValue(`repertoire.${index}.composer`, composition.composer);
                                                        form.setValue(`repertoire.${index}.duration`, composition.duration);
                                                        form.setValue(`repertoire.${index}.genre`, composition.genre);
                                                        form.setValue(`repertoire.${index}.approved`, composition.approved);
                                                        form.setValue(`repertoire.${index}.movements`, composition.movements || []);
                                                        form.setValue(`repertoire.${index}.selectedMovements`, []);
                                                    }
                                                }}
                                                placeholder="בחר יצירה..."
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField control={form.control} name={`repertoire.${index}.genre`} render={({ field }) => ( <FormItem> <FormLabel>ז'אנר</FormLabel> <Select dir="rtl" onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="בחר ז'אנר"/></SelectTrigger></FormControl> <SelectContent>{genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent> </Select> <FormMessage /> </FormItem> )} />
                                
                                <div className='flex items-end gap-2'>
                                    {currentRepertoireItem.movements && currentRepertoireItem.movements.length > 0 && (
                                        <FormItem className='flex-grow'>
                                            <FormLabel>פרקים</FormLabel>
                                            <MovementSelector
                                                movements={currentRepertoireItem.movements}
                                                selected={currentRepertoireItem.selectedMovements || []}
                                                onSelectionChange={(newSelection) => {
                                                    form.setValue(`repertoire.${index}.selectedMovements`, newSelection);
                                                }}
                                                onDurationChange={(newDuration) => {
                                                    form.setValue(`repertoire.${index}.duration`, newDuration);
                                                }}
                                            />
                                        </FormItem>
                                    )}
                                    <FormField 
                                        control={form.control} 
                                        name={`repertoire.${index}.duration`} 
                                        render={({ field }) => ( 
                                            <FormItem className={cn(currentRepertoireItem.movements && currentRepertoireItem.movements.length > 0 ? "w-24" : "w-full")}> 
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
                                </div>
                                
                                <div className="hidden md:flex self-center pt-6 justify-self-end col-span-full sm:col-span-2 md:col-auto">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                        <span className="sr-only">מחק יצירה</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
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
                    <Dialog open={customEntryOpen} onOpenChange={setCustomEntryOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="secondary">הוסף יצירה מותאמת אישית</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>הוספת יצירה חדשה</DialogTitle>
                                <DialogDescription>
                                    היצירה תתווסף לספרייה ותמתין לאישור מנהל.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>שם המלחין</Label>
                                    <Input value={customEntryData.composer} onChange={(e) => setCustomEntryData(d => ({...d, composer: e.target.value}))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>שם היצירה</Label>
                                    <Input value={customEntryData.title} onChange={(e) => setCustomEntryData(d => ({...d, title: e.target.value}))} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>ז'אנר</Label>
                                        <Select dir="rtl" onValueChange={(value) => setCustomEntryData(d => ({...d, genre: value}))}>
                                            <SelectTrigger><SelectValue placeholder="בחר ז'אנר"/></SelectTrigger>
                                            <SelectContent>
                                                {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>זמן ביצוע</Label>
                                        <Input 
                                            dir="ltr" 
                                            placeholder="MM:SS" 
                                            maxLength={5}
                                            value={customEntryData.duration} 
                                            onChange={(e) => setCustomEntryData(d => ({...d, duration: e.target.value}))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setCustomEntryOpen(false)}>ביטול</Button>
                                <Button type="button" onClick={handleCustomEntrySave}>שמור יצירה</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
