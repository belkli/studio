'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User, Composition, FormSubmission } from '@/lib/types';
import { PlusCircle, Send, Trash2 } from 'lucide-react';
import { searchComposers, searchCompositions } from '@/app/actions';
import { Combobox } from '../ui/combobox';
import { debounce } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { examLevels, examTypes, genres } from '@/lib/taxonomies';
import { Checkbox } from '../ui/checkbox';


import { useLocale, useTranslations } from 'next-intl';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getCompositionSchema = (t: any) => z.object({
    id: z.string().optional(),
    composer: z.string().min(1, t('validation.requiredComposer')),
    title: z.string().min(1, t('validation.requiredTitle')),
    duration: z.string().regex(/^\d{2}:\d{2}$/, t('validation.invalidDuration')),
    genre: z.string().min(1, t('validation.requiredGenre')),
    approved: z.boolean().optional(),
});


const MIN_REPERTOIRE_ITEMS = 1;
const MAX_REPERTOIRE_ITEMS = 10;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFormSchema = (t: any) => z.object({
    studentId: z.string(),
    studentName: z.string(),
    instrument: z.string().min(1, t('validation.requiredInstrument')),
    examLevel: z.string().min(1, t('validation.requiredLevel')),
    examType: z.string().min(1, t('validation.requiredType')),
    preferredExamDateRange: z.string().optional(),
    repertoire: z.array(getCompositionSchema(t)).min(MIN_REPERTOIRE_ITEMS, t('validation.minRepertoire')).max(MAX_REPERTOIRE_ITEMS, t('validation.maxRepertoire', { max: MAX_REPERTOIRE_ITEMS })),
    teacherDeclaration: z.boolean().refine(val => val === true, {
        message: t('validation.requiredDeclaration'),
    }),
});

type FormData = z.infer<ReturnType<typeof getFormSchema>>;

type ComposerOption = {
    id: string;
    name: string;
    names: { he: string; en: string; ru?: string; ar?: string };
};

interface ExamRegistrationFormProps {
    user: User;
    student: User;
    onSubmit: (data: Partial<FormSubmission>) => void;
    initialData?: FormSubmission;
    isEditing?: boolean;
    onCancel?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RepertoireItem = ({ index, remove, fields }: { index: number, remove: (index: number) => void, fields: any[] }) => {
    const t = useTranslations('ExamRegistrationForm');
    const { control, setValue, watch, getValues } = useFormContext();
    const [composerOptions, setComposerOptions] = useState<ComposerOption[]>([]);
    const [compositionOptions, setCompositionOptions] = useState<Composition[]>([]);
    const [isLoadingComposers, setIsLoadingComposers] = useState(false);
    const [isLoadingCompositions, setIsLoadingCompositions] = useState(false);

    const currentRepertoireItem = watch(`repertoire.${index}`);
    const locale = useLocale() as "he" | "en" | "ar" | "ru";
    const selectedComposerId = currentRepertoireItem?.composerId || composerOptions.find(c => Object.values(c.names).includes(currentRepertoireItem?.composer))?.id || '';
    const selectedComposer = currentRepertoireItem?.composer;
    const selectedInstrument = watch('instrument');

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedComposerSearch = useCallback(debounce(async (query: string) => {
        setIsLoadingComposers(true);
        try {
            const results = await searchComposers({ query, instrument: selectedInstrument });
            setComposerOptions(results);
        } catch (error) {
            console.error('[ExamRegistrationForm] searchComposers failed:', error);
        } finally {
            setIsLoadingComposers(false);
        }
    }, 300), [selectedInstrument]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedCompositionSearch = useCallback(debounce(async (query: string) => {
        setIsLoadingCompositions(true);
        try {
            const instrument = getValues('instrument');
            const results = await searchCompositions({ query, composer: selectedComposer, composerId: selectedComposerId, instrument, locale });
            setCompositionOptions(results);
        } catch (error) {
            console.error('[ExamRegistrationForm] searchCompositions failed:', error);
        } finally {
            setIsLoadingCompositions(false);
        }
    }, 300), [selectedComposer, selectedComposerId, getValues, locale]);

    useEffect(() => {
        debouncedCompositionSearch('');
    }, [selectedComposerId, selectedComposer, selectedInstrument, debouncedCompositionSearch]);

    const handleSelectComposition = (id: string) => {
        const composition = compositionOptions.find(c => c.id === id);
        if (composition) {
            setValue(`repertoire.${index}.id`, composition.id);
            setValue(`repertoire.${index}.title`, composition.title);
            setValue(`repertoire.${index}.composerId`, composition.composerId || "");
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
                <span className="font-medium text-muted-foreground">{t('compositionItem', { index: index + 1 })}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">{t('deleteItem')}</span>
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1.5fr)_minmax(0,2.5fr)_minmax(0,1fr)_110px_auto] items-start gap-x-4 gap-y-2 p-4">
                <div className="hidden lg:flex items-center justify-center h-10 font-medium text-muted-foreground">{index + 1}.</div>

                <FormField
                    control={control}
                    name={`repertoire.${index}.composer`}
                    render={({ field: composerField }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>{t('composer')}</FormLabel>
                            <FormControl>
                                <Combobox dir={(locale === "he" || locale === "ar") ? "rtl" : "ltr"}
                                    options={composerOptions.map(c => ({ value: c.id, label: c.names[locale] || c.names.en || c.name }))}
                                    selectedValue={currentRepertoireItem?.composerId || composerOptions.find(c => Object.values(c.names).includes(composerField.value))?.id || ""}
                                    onSelectedValueChange={(value) => {
                                        const selectedOption = composerOptions.find(option => option.id === value);
                                        setValue(`repertoire.${index}.composerId`, value);
                                        composerField.onChange(selectedOption?.names[locale] || selectedOption?.names.en || selectedOption?.name || "");
                                        setValue(`repertoire.${index}.title`, '');
                                        setValue(`repertoire.${index}.duration`, '00:00');
                                        setValue(`repertoire.${index}.genre`, '');
                                    }}
                                    placeholder={t('selectComposer')}
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
                            <FormLabel>{t('compositionTitle')}</FormLabel>
                            <FormControl>
                                <Combobox dir={(locale === "he" || locale === "ar") ? "rtl" : "ltr"}
                                    options={compositionOptions.map(c => ({ value: c.id || '', label: c.title }))}
                                    selectedValue={currentRepertoireItem.id || titleField.value}
                                    onSelectedValueChange={handleSelectComposition}
                                    placeholder={t('selectComposition')}
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
                    <FormItem> <FormLabel>{t('genre')}</FormLabel> <Select dir={(locale === "he" || locale === "ar") ? "rtl" : "ltr"} onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue placeholder={t('selectGenre')} /></SelectTrigger></FormControl> <SelectContent>{genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent> </Select> <FormMessage /> </FormItem>
                )} />

                <FormField control={control} name={`repertoire.${index}.duration`} render={({ field }) => (<FormItem> <FormLabel>{t('duration')}</FormLabel> <FormControl><Input dir='ltr' placeholder="MM:SS" {...field} /></FormControl> <FormMessage /> </FormItem>)} />

                <div className="hidden lg:flex items-center justify-center h-10">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">{t('deleteItem')}</span>
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
    const t = useTranslations('ExamRegistrationForm');
    const nt = useTranslations('NewForm');
    const locale = useLocale();
    const emptyComposition = { id: '', composerId: '', composer: '', title: '', genre: '', duration: '00:00', approved: true };

    const form = useForm<FormData>({
        resolver: zodResolver(getFormSchema(t)),
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalDurationSeconds = data.repertoire.reduce((total: number, item: any) => {
            if (!item?.duration) return total;
            const [minutes, seconds] = item.duration.split(':').map(Number);
            if (isNaN(minutes) || isNaN(seconds)) return total;
            return total + (minutes * 60) + seconds;
        }, 0);

        const totalDurationFormatted = `${String(Math.floor(totalDurationSeconds / 60)).padStart(2, '0')}:${String(totalDurationSeconds % 60).padStart(2, '0')}`;

        const submissionData = {
            ...data,
            formType: nt('types.exam_registration'),
            totalDuration: totalDurationFormatted,
            academicYear: getHebrewAcademicYear(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        onSubmit(submissionData);
    };

    return (
        <FormProvider {...form}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <form onSubmit={form.handleSubmit(handleFormSubmit as any)} className="space-y-8 mt-8" key={student.id}>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('studentAndInstrument')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField name="studentName" render={({ field }) => (<FormItem> <FormLabel>{t('studentName')}</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                        <FormItem> <FormLabel>{t('idNumber')}</FormLabel><Input value={student.idNumber} disabled /></FormItem>
                        <FormField control={form.control} name="instrument" render={({ field }) => (<FormItem> <FormLabel>{t('instrument')}</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('examDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="examLevel" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('examLevel')}</FormLabel>
                                <Select dir={(locale === "he" || locale === "ar") ? "rtl" : "ltr"} onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder={t('selectLevel')} /></SelectTrigger></FormControl>
                                    <SelectContent>{examLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="examType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('examType')}</FormLabel>
                                <Select dir={(locale === "he" || locale === "ar") ? "rtl" : "ltr"} onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder={t('selectType')} /></SelectTrigger></FormControl>
                                    <SelectContent>{examTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="preferredExamDateRange" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('preferredDateRange')}</FormLabel>
                                <FormControl><Input placeholder={t('dateRangePlaceholder')} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('repertoire')}</CardTitle>
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
                                {t('addComposition')}
                            </Button>
                        </div>
                        <FormMessage>{form.formState.errors.repertoire?.root?.message || form.formState.errors.repertoire?.message}</FormMessage>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('teacherDeclarationTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="teacherDeclaration"
                            render={({ field }) => (
                                <FormItem className="flex items-start gap-3 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            {t('teacherDeclarationText', { teacherName: user.name, studentName: student.name })}
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
                            {t('cancel')}
                        </Button>
                    )}
                    <Button type="submit">
                        <Send className="me-2 h-4 w-4" />
                        {isEditing ? t('resubmit') : t('submit')}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}

