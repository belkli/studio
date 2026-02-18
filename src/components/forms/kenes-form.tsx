'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { User, Composition } from '@/lib/types';
import { PlusCircle, Send, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SaveStatusBar, type SaveState } from './save-status-bar';
import { conservatoriums, priceMatrix, initialCompositions, genres } from '@/lib/data';
import { Notice, NoticeDescription, NoticeTitle } from '../ui/notice';
import { searchComposers, searchCompositions } from '@/app/actions';
import { Combobox } from '../ui/combobox';
import { debounce } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const compositionSchema = z.object({
  id: z.string().optional(),
  composer: z.string().min(1, 'חובה להזין מלחין'),
  title: z.string().min(1, 'חובה להזין שם יצירה'),
  duration: z.string().regex(/^\d{2}:\d{2}$/, 'פורמט לא תקין (MM:SS)'),
  genre: z.string().optional(),
  approved: z.boolean().optional(),
});


const MIN_REPERTOIRE_ITEMS = 1;
const MAX_REPERTOIRE_ITEMS = 10;
const emptyComposition = { id: '', composer: '', title: '', genre: '', duration: '00:00', approved: true };


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
  repertoire: z.array(compositionSchema).min(MIN_REPERTOIRE_ITEMS, `חובה להוסיף לפחות יצירה אחת`).max(MAX_REPERTOIRE_ITEMS, `ניתן להוסיף עד ${MAX_REPERTOIRE_ITEMS} יצירות`),
  
  // Logistical Needs
  logisticalNeeds: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface KenesFormProps {
    user: User;
    onSubmit: (data: FormData) => void;
}

const formatDurationOnBlur = (value: string): string => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length === 0) return '00:00';
    if (cleanValue.length <= 2) return `00:${cleanValue.padStart(2, '0')}`;
    const seconds = cleanValue.slice(-2).padStart(2, '0');
    const minutes = cleanValue.slice(0, -2).padStart(2, '0');
    return `${minutes}:${seconds > '59' ? '59' : seconds}`;
}

const getEnsembleSizeCategory = (numParticipants: number): 'Small' | 'Medium' | 'Large' => {
  if (numParticipants <= 10) return 'Small';
  if (numParticipants <= 20) return 'Medium';
  return 'Large';
};

const getDurationBracket = (totalSeconds: number): 10 | 15 | 20 | 25 | 30 => {
  const totalMinutes = totalSeconds / 60;
  const brackets = [10, 15, 20, 25, 30];
  for (const bracket of brackets) {
    if (totalMinutes <= bracket) return bracket;
  }
  return 30; // Default to max bracket
};


const KenesRepertoireItem = ({ index, remove, fields }) => {
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
        debouncedCompositionSearch('');
    }, [selectedComposer, debouncedCompositionSearch]);
    
     useEffect(() => {
        debouncedComposerSearch('');
    }, [debouncedComposerSearch]);

    return (
         <div className="border rounded-lg relative">
            <div className="p-4 flex justify-between items-center lg:hidden border-b">
                <span className="font-medium text-muted-foreground">יצירה #{index + 1}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">מחק יצירה</span>
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1.5fr_2.5fr_1fr_auto] items-start gap-x-4 gap-y-2 p-4">
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
                                    selectedValue={currentRepertoireItem.id || ''}
                                    onSelectedValueChange={(id) => {
                                        const composition = initialCompositions.find(c => c.id === id);
                                        if (composition) {
                                            setValue(`repertoire.${index}.id`, composition.id);
                                            setValue(`repertoire.${index}.title`, composition.title);
                                            setValue(`repertoire.${index}.composer`, composition.composer);
                                            setValue(`repertoire.${index}.duration`, composition.duration);
                                            setValue(`repertoire.${index}.genre`, composition.genre);
                                            setValue(`repertoire.${index}.approved`, composition.approved);
                                        }
                                    }}
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


export function KenesForm({ user, onSubmit }: KenesFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      academicYear: `תשפ"${String.fromCharCode(1488 + (new Date().getFullYear() % 100) % 10 + 4)}`,
      repertoire: Array.from({ length: MIN_REPERTOIRE_ITEMS }, () => ({ ...emptyComposition })),
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
        form.reset(form.getValues());
        setTimeout(() => setSaveState('idle'), 3000);
    }, 1500);
  };

  const numParticipants = form.watch('numParticipants');
  const repertoire = form.watch('repertoire');
  
  const totalDurationSeconds = useMemo(() => (repertoire || []).reduce((total, item) => {
    if (!item?.duration) return total;
    const [minutes, seconds] = item.duration.split(':').map(Number);
    if(isNaN(minutes) || isNaN(seconds)) return total;
    return total + (minutes * 60) + seconds;
  }, 0), [repertoire]);
  
  const totalDurationFormatted = `${String(Math.floor(totalDurationSeconds / 60)).padStart(2, '0')}:${String(totalDurationSeconds % 60).padStart(2, '0')}`;

  const { tier, ensembleSize, durationMinutes, calculatedPrice } = useMemo(() => {
    const conservatorium = conservatoriums.find(c => c.id === user.conservatoriumId);
    if (!conservatorium) return { tier: null, ensembleSize: null, durationMinutes: 0, calculatedPrice: 0 };
    
    const tier = conservatorium.tier;
    const sizeCategory = getEnsembleSizeCategory(numParticipants || 1);
    const durationBracket = getDurationBracket(totalDurationSeconds);
    const price = priceMatrix[tier]?.[sizeCategory]?.[durationBracket] ?? 0;

    return {
        tier,
        ensembleSize: sizeCategory,
        durationMinutes: totalDurationSeconds / 60,
        calculatedPrice: price,
    }
  }, [user.conservatoriumId, numParticipants, totalDurationSeconds]);

  const ensembleSizeLabels = {
    'Small': 'קטנות',
    'Medium': 'בינוניות',
    'Large': 'גדולות',
  };


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
            <CardTitle>טופס פרטי משתתף בכנס / אירוע</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <FormField name="academicYear" render={({ field }) => ( <FormItem> <FormLabel>שנת לימודים</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="conservatoriumName" render={({ field }) => ( <FormItem> <FormLabel>קונסרבטוריון</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem> )} />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>1. פרטי האירוע</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FormField name="eventName" render={({ field }) => ( <FormItem><FormLabel>שם האירוע</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="eventDate" render={({ field }) => ( <FormItem><FormLabel>תאריך האירוע</FormLabel><FormControl><Input type="date" placeholder="dd/mm/yyyy" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="eventLocation" render={({ field }) => ( <FormItem><FormLabel>מיקום</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>2. פרטי ההרכב</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FormField name="conductor" render={({ field }) => ( <FormItem><FormLabel>מנצח/ת או מנהל/ת מוזיקלי</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="accompanist" render={({ field }) => ( <FormItem><FormLabel>פסנתרן/ית מלווה (אופציונלי)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
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
                     <KenesRepertoireItem 
                        key={field.id}
                        index={index} 
                        remove={remove}
                        fields={fields}
                    />
                ))}
                </div>
                 <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => append({ ...emptyComposition })}
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
        
        <Card>
            <CardHeader>
                <CardTitle>4. צרכים לוגיסטיים</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField name="logisticalNeeds" render={({ field }) => ( <FormItem><FormLabel>מלל חופשי (אופציונלי)</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>5. חישוב עלות</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Notice variant="info">
                        <NoticeTitle>כיצד העלות מחושבת?</NoticeTitle>
                        <NoticeDescription>
                            המחיר נקבע על פי שלושה גורמים: <strong>סיווג הקונסרבטוריון</strong> (שלב א', ב', או ג'), <strong>גודל ההרכב</strong> (קטן, בינוני, או גדול), ו<strong>משך זמן ההופעה</strong>.
                        </NoticeDescription>
                    </Notice>
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">סיווג קונסרבטוריון:</span>
                            <span className="font-medium">{tier ? `שלב ${tier}` : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">גודל הרכב:</span>
                            <span className="font-medium">{ensembleSize ? `${ensembleSizeLabels[ensembleSize]} (${numParticipants || 0} משתתפים)`: '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">משך זמן:</span>
                            <span className="font-medium">{durationMinutes.toFixed(2)} דקות</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <span>סה"כ לתשלום:</span>
                            <span>{calculatedPrice} ₪</span>
                        </div>
                    </div>
                </div>
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
