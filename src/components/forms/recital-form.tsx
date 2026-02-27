'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Checkbox } from '../ui/checkbox';
import { SuggestionButton } from './suggestion-button';
import { schools, genres } from '@/lib/data';


import { useTranslations } from 'next-intl';


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

const getRecitalFormSchema = (t: any) => z.object({
    studentId: z.string(),
    studentName: z.string(),
    academicYear: z.string().min(1, t('validation.requiredAcademicYear')),
    grade: z.enum(['י', 'יא', 'יב'], {
        errorMap: () => ({ message: t('validation.requiredGrade') })
    }),

    applicantDetails: z.object({
        city: z.string().optional(),
        phone: z.string().optional(),
        gender: z.string().optional(),
        birthDate: z.string().optional(),
    }),
    schoolDetails: z.object({
        schoolName: z.string().optional(),
        hasMusicMajor: z.boolean().default(false),
        isMajorParticipant: z.boolean().default(false),
    }),
    instrumentDetails: z.object({
        instrument: z.string().min(1, t('validation.requiredInstrument')),
        yearsOfStudy: z.coerce.number().optional(),
    }),
    teacherDetails: z.object({
        yearsWithTeacher: z.coerce.number().optional(),
    }),
    repertoire: z.array(getCompositionSchema(t)).min(MIN_REPERTOIRE_ITEMS, t('validation.minRepertoire')).max(MAX_REPERTOIRE_ITEMS, t('validation.maxRepertoire', { max: MAX_REPERTOIRE_ITEMS })),
});

type FormData = z.infer<ReturnType<typeof getRecitalFormSchema>>;

interface RecitalFormProps {
    user: User;
    student: User;
    onSubmit: (data: Partial<FormSubmission>) => void;
    initialData?: FormSubmission;
    isEditing?: boolean;
    onCancel?: () => void;
}

const schoolOptions = schools.map(s => ({ value: s.name, label: `${s.name} (סמל: ${s.symbol})` }));

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


const RepertoireItem = ({ index, remove, fields }: { index: number, remove: (index: number) => void, fields: any[] }) => {
    const t = useTranslations('RecitalForm');
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
        const instrument = getValues('instrumentDetails.instrument');
        const results = await searchCompositions({ query, composer: selectedComposer, instrument });
        setCompositionOptions(results);
        setIsLoadingCompositions(false);
    }, 300), [selectedComposer, getValues]);

    useEffect(() => {
        if (selectedComposer) {
            debouncedCompositionSearch('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedComposer]);

    useEffect(() => {
        debouncedComposerSearch('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                                <Combobox
                                    options={composerOptions.map(c => ({ value: c, label: c }))}
                                    selectedValue={composerField.value}
                                    onSelectedValueChange={(value) => {
                                        composerField.onChange(value);
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
                                <Combobox
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
                    <FormItem> <FormLabel>{t('genre')}</FormLabel> <Select dir="rtl" onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue placeholder={t('selectGenre')} /></SelectTrigger></FormControl> <SelectContent>{genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent> </Select> <FormMessage /> </FormItem>
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

export function RecitalForm({ user, student, onSubmit, isEditing = false, onCancel, initialData }: RecitalFormProps) {
    const t = useTranslations('RecitalForm');
    const emptyComposition = { id: '', composer: '', title: '', genre: '', duration: '00:00', approved: true };

    const form = useForm<FormData>({
        resolver: zodResolver(getRecitalFormSchema(t)) as any,
        defaultValues: initialData ? {
            ...initialData,
            ...initialData.applicantDetails,
            ...initialData.schoolDetails,
            instrument: initialData.instrumentDetails?.instrument,
            yearsOfStudyInstrument: initialData.instrumentDetails?.yearsOfStudy,
            yearsWithTeacher: initialData.teacherDetails?.yearsWithTeacher,
        } as any : {
            studentId: student.id,
            studentName: student.name,
            academicYear: getHebrewAcademicYear(),
            grade: student.grade,
            applicantDetails: {
                city: student.city,
                phone: student.phone,
                gender: student.gender,
                birthDate: student.birthDate,
            },
            schoolDetails: {
                schoolName: student.schoolName,
            },
            instrumentDetails: {
                instrument: student.instruments?.[0]?.instrument,
                yearsOfStudy: student.instruments?.[0]?.yearsOfStudy,
            },
            teacherDetails: {
                yearsWithTeacher: student.instruments?.[0]?.yearsOfStudy,
            },
            repertoire: Array.from({ length: MIN_REPERTOIRE_ITEMS }, () => ({ ...emptyComposition })),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'repertoire',
    });

    const handleFormSubmit = (data: FormData) => {
        onSubmit(data);
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit as any)} className="space-y-8 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('studentDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField name="studentName" render={({ field }) => (<FormItem> <FormLabel>{t('studentName')}</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                        <FormItem> <FormLabel>{t('idNumber')}</FormLabel><Input value={student.idNumber} disabled /></FormItem>
                        <FormField control={form.control} name="grade" render={({ field }) => (<FormItem> <FormLabel>{t('grade')}</FormLabel> <FormControl><Input {...field} disabled={!isEditing} /></FormControl> <FormMessage /> </FormItem>)} />

                        <FormField control={form.control} name="applicantDetails.city" render={({ field }) => (<FormItem> <FormLabel>{t('city')}</FormLabel> <FormControl><Input {...field} disabled={!isEditing} /></FormControl> <FormMessage /> </FormItem>)} />
                        <FormField control={form.control} name="applicantDetails.phone" render={({ field }) => (<FormItem> <FormLabel>{t('phone')}</FormLabel> <FormControl><Input {...field} disabled={!isEditing} /></FormControl> <FormMessage /> </FormItem>)} />
                        <FormField control={form.control} name="applicantDetails.gender" render={({ field }) => (<FormItem> <FormLabel>{t('gender')}</FormLabel> <FormControl><Input {...field} disabled={!isEditing} /></FormControl> <FormMessage /> </FormItem>)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('schoolDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField control={form.control as any} name="schoolDetails.schoolName" render={({ field }) => (<FormItem> <FormLabel>{t('schoolName')}</FormLabel> <FormControl><Input {...field} disabled={!isEditing} /></FormControl> <FormMessage /> </FormItem>)} />
                        <FormField control={form.control as any} name="schoolDetails.hasMusicMajor" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!isEditing} /></FormControl> <div className="space-y-1 leading-none"><FormLabel>{t('hasMusicMajor')}</FormLabel></div> </FormItem>)} />
                        <FormField control={form.control as any} name="schoolDetails.isMajorParticipant" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!isEditing} /></FormControl> <div className="space-y-1 leading-none"><FormLabel>{t('isMajorParticipant')}</FormLabel></div> </FormItem>)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('instrumentDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField control={form.control as any} name="instrumentDetails.instrument" render={({ field }) => (<FormItem> <FormLabel>{t('instrument')}</FormLabel> <FormControl><Input {...field} disabled={!isEditing} /></FormControl> <FormMessage /> </FormItem>)} />
                        <FormField control={form.control as any} name="instrumentDetails.yearsOfStudy" render={({ field }) => (<FormItem> <FormLabel>{t('yearsOfStudy')}</FormLabel> <FormControl><Input type="number" {...field} disabled={!isEditing} /></FormControl> <FormMessage /> </FormItem>)} />
                        <FormField control={form.control as any} name="teacherDetails.yearsWithTeacher" render={({ field }) => (<FormItem> <FormLabel>{t('yearsWithTeacher')}</FormLabel> <FormControl><Input type="number" {...field} disabled={!isEditing} /></FormControl> <FormMessage /> </FormItem>)} />
                        <FormItem> <FormLabel>{t('teacherName')}</FormLabel><Input value={student.instruments?.[0]?.teacherName} disabled /></FormItem>
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
                            <Button type="button" variant="outline" onClick={() => append({ ...emptyComposition })} disabled={fields.length >= MAX_REPERTOIRE_ITEMS} >
                                <PlusCircle className="me-2 h-4 w-4" />
                                {t('addComposition')}
                            </Button>
                        </div>
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
