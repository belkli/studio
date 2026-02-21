// This is a new file
'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { User, Composition, FormSubmission } from '@/lib/types';
import { PlusCircle, Send, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { SaveStatusBar, type SaveState } from './save-status-bar';
import { searchComposers, searchCompositions } from '@/app/actions';
import { Combobox } from '../ui/combobox';
import { debounce } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SuggestionButton } from './suggestion-button';
import { examLevels, examTypes, genres } from '@/lib/data';
import { Checkbox } from '../ui/checkbox';


const compositionSchema = z.object({
    id: z.string().optional(),
    composer: z.string().min(1, 'חובה להזין מלחין'),
    title: z.string().min(1, 'חובה להזין שם יצירה'),
    duration: z.string().regex(/^\d{2}:\d{2}$/, 'פורמט לא תקין (MM:SS)'),
    genre: z.string().min(1, 'חובה לבחור ז\'אנר'),
    approved: z.boolean().optional(),
});


const MIN_REPERTOIRE_ITEMS = 1;
const MAX_REPERTOIRE_ITEMS = 10;
const emptyComposition = { id: '', composer: '', title: '', genre: '', duration: '00:00', approved: true };


const formSchema = z.object({
    studentId: z.string(),
    studentName: z.string(),
    instrument: z.string().min(1, "חובה לבחור כלי נגינה"),
    examLevel: z.string().min(1, "חובה לבחור רמת בחינה."),
    examType: z.string().min(1, "חובה לבחור סוג בחינה."),
    preferredExamDateRange: z.string().optional(),
    repertoire: z.array(compositionSchema).min(MIN_REPERTOIRE_ITEMS, `חובה להוסיף לפחות יצירה אחת`).max(MAX_REPERTOIRE_ITEMS, `ניתן להוסיף עד ${MAX_REPERTOIRE_ITEMS} יצירות`),
    teacherDeclaration: z.boolean().refine(val => val === true, {
        message: "חובה לאשר את הצהרת המורה.",
    }),
});

type FormData = z.infer<typeof formSchema>;

interface ExamRegistrationFormProps {
    user: User;
    student: User;
    onSubmit: (data: Partial<FormSubmission>) => void;
    initialData?: FormSubmission;
    isEditing?: boolean;
    onCancel?: () => void;
}

const RepertoireItem = ({ index, remove, fields }: { index: number, remove: (index: number) => void, fields: any[] }) => {
    const { control, setValue, watch, getValues } = useFormContext();
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
        const instrument = getValues('instrument');
        const results = await searchCompositions({ query, composer: selectedComposer, instrument });
        setCompositionOptions(results);
        setIsLoadingCompositions(false);
    }, 300), [selectedComposer, getValues]);

    useEffect(() => {
        if (selectedComposer) {
            debouncedCompositionSearch('');
        }
    }, [selectedComposer, debouncedCompositionSearch]);

    const handleSelectComposition = (id: string) => {
        const composition = compositionOptions.find(c => c.id === id);
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
                    <FormItem> <FormLabel>ז'אנר</FormLabel> <Select dir="rtl" onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="בחר ז'אנר" /></SelectTrigger></FormControl> <SelectContent>{genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent> </Select> <FormMessage /> </FormItem>
                )} />

                <FormField control={control} name={`repertoire.${index}.duration`} render={({ field }) => (<FormItem> <FormLabel>זמן ביצוע</FormLabel> <FormControl><Input dir='ltr' placeholder="MM:SS" {...field} /></FormControl> <FormMessage /> </FormItem>)} />

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

const getHebrewAcademicYear = () => {
    const date = new Date();
    let gregorianYear = date.getFullYear();
    const month = date.getMonth();
    if (month < 8) {
        gregorianYear--;
    }
    const hebrewYearShort = (gregorianYear + 1) % 100;
    const hebrewYear = 5700 + hebrewYearShort + (gregorianYear - 2000) + 40; // Approximate
    const hebrewYearInChars = String.fromCharCode(1488 + ((hebrewYear % 100) - 1));
    return `תשפ"${hebrewYearInChars} (${gregorianYear}-${gregorianYear + 1})`;
}

export function ExamRegistrationForm({ user, student, onSubmit, isEditing = false, onCancel, initialData }: ExamRegistrationFormProps) {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            studentId: student.id,
            studentName: student.name,
            instrument: student.instruments?.[0]?.instrument || '',
            examLevel: initialData.examLevel,
            examType: initialData.examType,
            preferredExamDateRange: initialData.preferredExamDateRange,
            repertoire: initialData.repertoire,
            teacherDeclaration: initialData.teacherDeclaration ?? false,
        } : {
            studentId: student.id,
            studentName: student.name,
            instrument: student.instruments?.[0]?.instrument || '',
            repertoire: Array.from({ length: MIN_REPERTOIRE_ITEMS }, () => ({ ...emptyComposition })),
            teacherDeclaration: false,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'repertoire',
    });

    const handleFormSubmit = (data: FormData) => {
        const totalDurationSeconds = data.repertoire.reduce((total, item) => {
            if (!item?.duration) return total;
            const [minutes, seconds] = item.duration.split(':').map(Number);
            if (isNaN(minutes) || isNaN(seconds)) return total;
            return total + (minutes * 60) + seconds;
        }, 0);

        const totalDurationFormatted = `${String(Math.floor(totalDurationSeconds / 60)).padStart(2, '0')}:${String(totalDurationSeconds % 60).padStart(2, '0')}`;

        const submissionData = {
            ...data,
            formType: 'הרשמה לבחינה',
            totalDuration: totalDurationFormatted,
            academicYear: getHebrewAcademicYear(),
        } as any;

        onSubmit(submissionData);
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit as any)} className="space-y-8 mt-8" key={student.id}>

                <Card>
                    <CardHeader>
                        <CardTitle>פרטי תלמיד/ה וכלי</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField name="studentName" render={({ field }) => (<FormItem> <FormLabel>שם התלמיד/ה</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                        <FormItem> <FormLabel>ת.ז.</FormLabel><Input value={student.idNumber} disabled /></FormItem>
                        <FormField control={form.control} name="instrument" render={({ field }) => (<FormItem> <FormLabel>כלי</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>פרטי הבחינה</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="examLevel" render={({ field }) => (
                            <FormItem>
                                <FormLabel>רמת בחינה</FormLabel>
                                <Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="בחר רמת בחינה" /></SelectTrigger></FormControl>
                                    <SelectContent>{examLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="examType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>סוג בחינה</FormLabel>
                                <Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="בחר סוג בחינה" /></SelectTrigger></FormControl>
                                    <SelectContent>{examTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="preferredExamDateRange" render={({ field }) => (
                            <FormItem>
                                <FormLabel>טווח תאריכים מועדף</FormLabel>
                                <FormControl><Input placeholder="לדוגמה: 1-15 ביוני" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>רפרטואר</CardTitle>
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
                        <FormMessage>{form.formState.errors.repertoire?.root?.message || form.formState.errors.repertoire?.message}</FormMessage>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>הצהרת המורה</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="teacherDeclaration"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            אני, {user.name}, מצהיר/ה כי התלמיד/ה {student.name} מוכן/ה לגשת לבחינה ברמה ובסוג המצוינים לעיל.
                                        </FormLabel>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    {isEditing && onCancel && (
                        <Button type="button" variant="ghost" onClick={onCancel}>
                            ביטול
                        </Button>
                    )}
                    <Button type="submit">
                        <Send className="me-2 h-4 w-4" />
                        {isEditing ? 'שלח מחדש לאישור' : 'הגש לאישור'}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
