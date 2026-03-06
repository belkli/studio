
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User, Composition, FormSubmission } from '@/lib/types';
import { PlusCircle, Send, Trash2 } from 'lucide-react';
import { searchComposers, searchCompositions } from '@/app/actions';
import { Combobox } from '../ui/combobox';
import { debounce } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { schools, genres } from '@/lib/taxonomies';
import { useLocale, useTranslations } from 'next-intl';

const getCompositionSchema = (t: any) => z.object({
    id: z.string().optional(),
    composerId: z.string().optional(),
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
    grade: z.string().min(1, t('validation.requiredGrade')),
    applicantDetails: z.object({
        city: z.string().optional(),
        phone: z.string().optional(),
        gender: z.string().optional(),
        birthDate: z.string().optional(),
    }),
    schoolDetails: z.object({
        schoolName: z.string().optional(),
        schoolSymbol: z.string().optional(),
        hasMusicMajor: z.boolean().default(false),
        isMajorParticipant: z.boolean().default(false),
        plansTheoryExam: z.boolean().default(false),
        schoolEmail: z.string().optional(),
    }),
    instrumentDetails: z.object({
        instrument: z.string().min(1, t('validation.requiredInstrument')),
        yearsOfStudy: z.coerce.number().optional(),
        recitalField: z.string().optional(),
        previousOrOtherInstrument: z.string().optional(),
    }),
    teacherDetails: z.object({
        name: z.string().optional(),
        idNumber: z.string().optional(),
        email: z.string().optional(),
        yearsWithTeacher: z.coerce.number().optional(),
    }),
    additionalMusicDetails: z.object({
        ensembleParticipation: z.string().optional(),
        theoryStudyYears: z.coerce.number().optional(),
        orchestraParticipation: z.string().optional(),
    }),
    managerNotes: z.string().optional(),
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

const getSchoolOptions = () => schools.map((s) => ({ value: s.name, label: s.name, symbol: s.symbol }));

type ComposerOption = {
    id: string;
    name: string;
    names: {
        he: string;
        en: string;
        ru?: string;
        ar?: string;
    };
};

const getHebrewAcademicYear = () => {
    const date = new Date();
    let gregorianYear = date.getFullYear();
    const month = date.getMonth();
    if (month < 8) {
        gregorianYear--;
    }

    const hebrewYearShort = (gregorianYear + 1) % 100;
    const hebrewYear = 5700 + hebrewYearShort + (gregorianYear - 2000) + 40;
    const hebrewYearInChars = String.fromCharCode(1488 + ((hebrewYear % 100) - 1));
    return `תשפ"${hebrewYearInChars} (${gregorianYear}-${gregorianYear + 1})`;
};

const RepertoireItem = ({ index, remove, fields }: { index: number, remove: (index: number) => void, fields: any[] }) => {
    const t = useTranslations('RecitalForm');
    const { control, setValue, watch, getValues } = useFormContext();
    const [composerOptions, setComposerOptions] = useState<ComposerOption[]>([]);
    const [compositionOptions, setCompositionOptions] = useState<Composition[]>([]);
    const [isLoadingComposers, setIsLoadingComposers] = useState(false);
    const [isLoadingCompositions, setIsLoadingCompositions] = useState(false);

    const currentRepertoireItem = watch(`repertoire.${index}`);
    const locale = useLocale() as 'he' | 'en' | 'ar' | 'ru';
    const selectedComposerId = currentRepertoireItem?.composerId || composerOptions.find(c => Object.values(c.names).includes(currentRepertoireItem?.composer))?.id || '';
    const selectedComposer = currentRepertoireItem?.composer;
    const selectedInstrument = watch('instrumentDetails.instrument');

    const debouncedComposerSearch = useCallback(debounce(async (query: string) => {
        setIsLoadingComposers(true);
        const results = await searchComposers({ query, instrument: selectedInstrument });
        setComposerOptions(results);
        setIsLoadingComposers(false);
    }, 300), [selectedInstrument]);

    const debouncedCompositionSearch = useCallback(debounce(async (query: string) => {
        setIsLoadingCompositions(true);
        const instrument = getValues('instrumentDetails.instrument');
        const results = await searchCompositions({ query, composer: selectedComposer, composerId: selectedComposerId, instrument, locale });
        setCompositionOptions(results);
        setIsLoadingCompositions(false);
    }, 300), [selectedComposer, selectedComposerId, getValues, locale]);

    useEffect(() => {
        debouncedCompositionSearch('');
    }, [selectedComposer, selectedComposerId, selectedInstrument, debouncedCompositionSearch]);

    useEffect(() => {
        debouncedComposerSearch('');
    }, [debouncedComposerSearch]);

    const handleSelectComposition = (id: string) => {
        const composition = compositionOptions.find(c => c.id === id);
        if (composition) {
            setValue(`repertoire.${index}.id`, composition.id);
            setValue(`repertoire.${index}.title`, composition.title);
            setValue(`repertoire.${index}.composerId`, composition.composerId || '');
            setValue(`repertoire.${index}.composer`, composition.composer);
            setValue(`repertoire.${index}.duration`, composition.duration);
            setValue(`repertoire.${index}.genre`, composition.genre);
            setValue(`repertoire.${index}.approved`, composition.approved);
        } else {
            setValue(`repertoire.${index}.title`, id);
        }
    };

    return (
        <div className="relative rounded-lg border">
            <div className="flex items-center justify-between border-b p-4 lg:hidden">
                <span className="font-medium text-muted-foreground">{t('compositionItem', { index: index + 1 })}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">{t('deleteItem')}</span>
                </Button>
            </div>
            <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 p-4 lg:grid-cols-[auto_minmax(0,1.5fr)_minmax(0,2.5fr)_minmax(0,1fr)_110px_auto]">
                <div className="hidden h-10 items-center justify-center font-medium text-muted-foreground lg:flex">{index + 1}.</div>

                <FormField
                    control={control}
                    name={`repertoire.${index}.composer`}
                    render={({ field: composerField }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>{t('composer')}</FormLabel>
                            <FormControl>
                                <Combobox
                                    options={composerOptions.map(c => ({ value: c.id, label: c.names[locale] || c.names.en || c.name }))}
                                    selectedValue={currentRepertoireItem?.composerId || composerOptions.find(c => Object.values(c.names).includes(composerField.value))?.id || ''}
                                    onSelectedValueChange={(value) => {
                                        const selectedOption = composerOptions.find((option) => option.id === value);
                                        setValue(`repertoire.${index}.composerId`, value);
                                        composerField.onChange(selectedOption?.names[locale] || selectedOption?.names.en || selectedOption?.name || '');
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
                                    options={compositionOptions.map(c => ({ value: c.id || c.title, label: c.title }))}
                                    selectedValue={currentRepertoireItem?.id || titleField.value}
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

                <FormField
                    control={control}
                    name={`repertoire.${index}.genre`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('genre')}</FormLabel>
                            <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectGenre')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {genres.map((g) => (
                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name={`repertoire.${index}.duration`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('duration')}</FormLabel>
                            <FormControl>
                                <Input dir="ltr" placeholder="MM:SS" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="hidden h-10 items-center justify-center lg:flex">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">{t('deleteItem')}</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export function RecitalForm({ user: _user, student, onSubmit, isEditing = false, onCancel, initialData }: RecitalFormProps) {
    const t = useTranslations('RecitalForm');
    const schoolOptions = getSchoolOptions();
    const initialSchoolSymbol = schoolOptions.find((s) => s.value === student.schoolName)?.symbol || '';

    const emptyComposition = { id: '', composerId: '', composer: '', title: '', genre: '', duration: '00:00', approved: true };

    const form = useForm<FormData>({
        resolver: zodResolver(getRecitalFormSchema(t)) as any,
        defaultValues: initialData ? {
            studentId: initialData.studentId,
            studentName: initialData.studentName,
            academicYear: initialData.academicYear || getHebrewAcademicYear(),
            grade: initialData.grade || student.grade || '',
            applicantDetails: {
                city: initialData.applicantDetails?.city || '',
                phone: initialData.applicantDetails?.phone || '',
                gender: initialData.applicantDetails?.gender || '',
                birthDate: initialData.applicantDetails?.birthDate || '',
            },
            schoolDetails: {
                schoolName: initialData.schoolDetails?.schoolName || student.schoolName || '',
                schoolSymbol: initialData.schoolDetails?.schoolSymbol || initialSchoolSymbol,
                hasMusicMajor: initialData.schoolDetails?.hasMusicMajor || false,
                isMajorParticipant: initialData.schoolDetails?.isMajorParticipant || false,
                plansTheoryExam: initialData.schoolDetails?.plansTheoryExam || false,
                schoolEmail: initialData.schoolDetails?.schoolEmail || '',
            },
            instrumentDetails: {
                instrument: initialData.instrumentDetails?.instrument || student.instruments?.[0]?.instrument || '',
                yearsOfStudy: initialData.instrumentDetails?.yearsOfStudy,
                recitalField: initialData.instrumentDetails?.recitalField || '',
                previousOrOtherInstrument: initialData.instrumentDetails?.previousOrOtherInstrument || '',
            },
            teacherDetails: {
                name: initialData.teacherDetails?.name || student.instruments?.[0]?.teacherName || '',
                idNumber: initialData.teacherDetails?.idNumber || '',
                email: initialData.teacherDetails?.email || '',
                yearsWithTeacher: initialData.teacherDetails?.yearsWithTeacher,
            },
            additionalMusicDetails: {
                ensembleParticipation: initialData.additionalMusicDetails?.ensembleParticipation || '',
                theoryStudyYears: initialData.additionalMusicDetails?.theoryStudyYears,
                orchestraParticipation: initialData.additionalMusicDetails?.orchestraParticipation || '',
            },
            managerNotes: initialData.managerNotes || '',
            repertoire: initialData.repertoire?.length ? initialData.repertoire : Array.from({ length: MIN_REPERTOIRE_ITEMS }, () => ({ ...emptyComposition })),
        } : {
            studentId: student.id,
            studentName: student.name,
            academicYear: getHebrewAcademicYear(),
            grade: student.grade || '',
            applicantDetails: {
                city: student.city || '',
                phone: student.phone || '',
                gender: student.gender || '',
                birthDate: student.birthDate || '',
            },
            schoolDetails: {
                schoolName: student.schoolName || '',
                schoolSymbol: initialSchoolSymbol,
                hasMusicMajor: false,
                isMajorParticipant: false,
                plansTheoryExam: false,
                schoolEmail: '',
            },
            instrumentDetails: {
                instrument: student.instruments?.[0]?.instrument || '',
                yearsOfStudy: student.instruments?.[0]?.yearsOfStudy,
                recitalField: '',
                previousOrOtherInstrument: '',
            },
            teacherDetails: {
                name: student.instruments?.[0]?.teacherName || '',
                idNumber: '',
                email: '',
                yearsWithTeacher: student.instruments?.[0]?.yearsOfStudy,
            },
            additionalMusicDetails: {
                ensembleParticipation: '',
                theoryStudyYears: undefined,
                orchestraParticipation: '',
            },
            managerNotes: '',
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
            <form onSubmit={form.handleSubmit(handleFormSubmit as any)} className="mt-8 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('studentDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        <FormField control={form.control} name="studentName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('studentName')}</FormLabel>
                                <FormControl><Input {...field} disabled /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormItem>
                            <FormLabel>{t('idNumber')}</FormLabel>
                            <Input value={student.idNumber} disabled />
                        </FormItem>
                        <FormField control={form.control} name="academicYear" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('academicYear')}</FormLabel>
                                <FormControl><Input {...field} disabled={isEditing} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="grade" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('grade')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectGrade')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="י">י</SelectItem>
                                        <SelectItem value={'י"א'}>י"א</SelectItem>
                                        <SelectItem value={'י"ב'}>י"ב</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="applicantDetails.city" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('city')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="applicantDetails.phone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('phone')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="applicantDetails.gender" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('gender')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="applicantDetails.birthDate" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('birthDate')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('schoolDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        <FormField control={form.control} name="schoolDetails.schoolName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('schoolName')}</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        const selectedSchool = schoolOptions.find((s) => s.value === value);
                                        form.setValue('schoolDetails.schoolSymbol', selectedSchool?.symbol || '');
                                    }}
                                    value={field.value || ''}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectSchool')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {schoolOptions.map((school) => (
                                            <SelectItem key={school.value} value={school.value}>{school.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="schoolDetails.schoolSymbol" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('schoolSymbol')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="schoolDetails.schoolEmail" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('schoolEmail')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="schoolDetails.hasMusicMajor" render={({ field }) => (
                            <FormItem className="rounded-md border p-4">
                                <div className="flex items-center gap-2.5">
                                    <FormControl><Checkbox id="schoolDetails.hasMusicMajor" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <FormLabel htmlFor="schoolDetails.hasMusicMajor" className="cursor-pointer leading-none">{t('hasMusicMajor')}</FormLabel>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="schoolDetails.isMajorParticipant" render={({ field }) => (
                            <FormItem className="rounded-md border p-4">
                                <div className="flex items-center gap-2.5">
                                    <FormControl><Checkbox id="schoolDetails.isMajorParticipant" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <FormLabel htmlFor="schoolDetails.isMajorParticipant" className="cursor-pointer leading-none">{t('isMajorParticipant')}</FormLabel>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="schoolDetails.plansTheoryExam" render={({ field }) => (
                            <FormItem className="rounded-md border p-4">
                                <div className="flex items-center gap-2.5">
                                    <FormControl><Checkbox id="schoolDetails.plansTheoryExam" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <FormLabel htmlFor="schoolDetails.plansTheoryExam" className="cursor-pointer leading-none">{t('plansTheoryExam')}</FormLabel>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('instrumentDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        <FormField control={form.control} name="instrumentDetails.instrument" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('instrument')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="instrumentDetails.yearsOfStudy" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('yearsOfStudy')}</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="instrumentDetails.recitalField" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('recitalField')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="instrumentDetails.previousOrOtherInstrument" render={({ field }) => (
                            <FormItem className="sm:col-span-2 md:col-span-3">
                                <FormLabel>{t('previousOrOtherInstrument')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('teacherDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <FormField control={form.control} name="teacherDetails.name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('teacherName')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="teacherDetails.idNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('teacherIdNumber')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="teacherDetails.email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('teacherEmail')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="teacherDetails.yearsWithTeacher" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('yearsWithTeacher')}</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('additionalMusicDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        <FormField control={form.control} name="additionalMusicDetails.ensembleParticipation" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('ensembleParticipation')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="additionalMusicDetails.theoryStudyYears" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('theoryStudyYears')}</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="additionalMusicDetails.orchestraParticipation" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('orchestraParticipation')}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
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
                                <RepertoireItem key={item.id} index={index} remove={remove} fields={fields} />
                            ))}
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            <Button type="button" variant="outline" onClick={() => append({ ...emptyComposition })} disabled={fields.length >= MAX_REPERTOIRE_ITEMS}>
                                <PlusCircle className="me-2 h-4 w-4" />
                                {t('addComposition')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('managerNotes')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField control={form.control} name="managerNotes" render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea rows={4} placeholder={t('managerNotesPlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
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

