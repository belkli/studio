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
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SaveStatusBar, type SaveState } from './save-status-bar';
import { priceMatrix, genres } from '@/lib/taxonomies';
import { Notice, NoticeDescription, NoticeTitle } from '../ui/notice';
import { searchComposers, searchCompositions } from '@/app/actions';
import { Combobox } from '../ui/combobox';
import { debounce } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SuggestionButton } from './suggestion-button';
import { useLocale, useTranslations } from 'next-intl';


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

const getFormSchema = (t: any) => z.object({
    academicYear: z.string().min(1, t('validation.requiredAcademicYear')),
    conservatoriumName: z.string().min(1, t('validation.requiredConservatorium')),

    // Event Details
    eventName: z.string().min(1, t('validation.requiredEventName')),
    eventDate: z.string().min(1, t('validation.requiredEventDate')),
    eventLocation: z.string().min(1, t('validation.requiredLocation')),

    // Ensemble Details
    conductor: z.string().min(1, t('validation.requiredConductor')),
    accompanist: z.string().optional(),
    numParticipants: z.coerce.number().min(1, t('validation.requiredNumParticipants')),

    // Repertoire
    repertoire: z.array(getCompositionSchema(t)).min(MIN_REPERTOIRE_ITEMS, t('validation.minRepertoire')).max(MAX_REPERTOIRE_ITEMS, t('validation.maxRepertoire', { max: MAX_REPERTOIRE_ITEMS })),

    // Logistical Needs
    logisticalNeeds: z.string().optional(),
});

type FormData = z.infer<ReturnType<typeof getFormSchema>> & {
    numParticipants: number;
};

type ComposerOption = {
    id: string;
    name: string;
    names: { he: string; en: string; ru?: string; ar?: string };
};

interface KenesFormProps {
    user: User;
    onSubmit: (data: Partial<FormSubmission>) => void;
    initialData?: FormSubmission;
    isEditing?: boolean;
    onCancel?: () => void;
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
        if (totalMinutes <= bracket) return bracket as 10 | 15 | 20 | 25 | 30;
    }
    return 30 as 10 | 15 | 20 | 25 | 30; // Default to max bracket
};


const KenesRepertoireItem = ({ index, remove, fields }: { index: number, remove: (index: number) => void, fields: any[] }) => {
    const t = useTranslations('KenesForm');
    const { control, setValue, watch, getValues } = useFormContext();
    const [composerOptions, setComposerOptions] = useState<ComposerOption[]>([]);
    const [compositionOptions, setCompositionOptions] = useState<Composition[]>([]);
    const [isLoadingComposers, setIsLoadingComposers] = useState(false);
    const [isLoadingCompositions, setIsLoadingCompositions] = useState(false);

    const currentRepertoireItem = watch(`repertoire.${index}`);
    const locale = useLocale() as "he" | "en" | "ar" | "ru";
    const selectedComposerId = currentRepertoireItem?.composerId || composerOptions.find(c => Object.values(c.names).includes(currentRepertoireItem?.composer))?.id || '';
    const selectedComposer = currentRepertoireItem?.composer;

    const debouncedComposerSearch = useCallback(debounce(async (query: string) => {
        setIsLoadingComposers(true);
        const results = await searchComposers(query);
        setComposerOptions(results);
        setIsLoadingComposers(false);
    }, 300), []);

    const debouncedCompositionSearch = useCallback(debounce(async (query: string) => {
        setIsLoadingCompositions(true);
        const results = await searchCompositions({ query, composer: selectedComposer, composerId: selectedComposerId, locale });
        setCompositionOptions(results);
        setIsLoadingCompositions(false);
    }, 300), [selectedComposer, selectedComposerId, locale]);

    useEffect(() => {
        debouncedCompositionSearch('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedComposer, selectedComposerId]);

    useEffect(() => {
        debouncedComposerSearch('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS} onMouseDown={(e) => e.preventDefault()}>
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
                                <Combobox
                                    options={compositionOptions.map(c => ({ value: c.id!, label: c.title }))}
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
                    <FormItem>
                        <FormLabel>{t('genre')}</FormLabel>
                        <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder={t('selectGenre')} /></SelectTrigger>
                            </FormControl>
                            <SelectContent>{genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />


                <FormField control={control} name={`repertoire.${index}.duration`} render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('duration')}</FormLabel>
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
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= MIN_REPERTOIRE_ITEMS} onMouseDown={(e) => e.preventDefault()}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">{t('deleteItem')}</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}


export function KenesForm({ user, onSubmit, initialData, isEditing = false, onCancel }: KenesFormProps) {
    const t = useTranslations('KenesForm');
    const tForms = useTranslations('Forms');
    const emptyComposition = { id: '', composerId: '', composer: '', title: '', genre: '', duration: '00:00', approved: true };

    const form = useForm<FormData>({
        resolver: zodResolver(getFormSchema(t)) as any,
        defaultValues: initialData || {
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
    const { conservatoriums } = useAuth();
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
            toast({ title: tForms('draftSaved') });
            form.reset(form.getValues());
            setTimeout(() => setSaveState('idle'), 3000);
        }, 1500);
    };

    const numParticipants = form.watch('numParticipants');
    const repertoire = form.watch('repertoire');

    const totalDurationSeconds = useMemo(() => (repertoire || []).reduce((total: number, item: any) => {
        if (!item?.duration) return total;
        const [minutes, seconds] = item.duration.split(':').map(Number);
        if (isNaN(minutes) || isNaN(seconds)) return total;
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
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8 mt-8">
                {!isEditing && <SaveStatusBar
                    isDirty={isDirty}
                    saveState={saveState}
                    lastSaved={lastSaved}
                    onSave={handleSaveDraft}
                />}

                <Card>
                    <CardHeader>
                        <CardTitle>{t('title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField name="academicYear" render={({ field }) => (<FormItem> <FormLabel>{t('academicYear')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                        <FormField name="conservatoriumName" render={({ field }) => (<FormItem> <FormLabel>{t('conservatorium')}</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('eventDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField name="eventName" render={({ field }) => (<FormItem><FormLabel>{t('eventName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="eventDate" render={({ field }) => (<FormItem><FormLabel>{t('eventDate')}</FormLabel><FormControl><Input type="date" placeholder="dd/mm/yyyy" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="eventLocation" render={({ field }) => (<FormItem><FormLabel>{t('location')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('ensembleDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField name="conductor" render={({ field }) => (<FormItem><FormLabel>{t('conductor')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="accompanist" render={({ field }) => (<FormItem><FormLabel>{t('accompanist')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="numParticipants" render={({ field }) => (<FormItem><FormLabel>{t('numParticipants')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('program')}</CardTitle>
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
                            <SuggestionButton
                                fields={fields}
                                append={append as any}
                                getValues={form.getValues}
                            />

                        </div>
                        {fields.length >= MAX_REPERTOIRE_ITEMS && (
                            <p className="text-sm text-muted-foreground mt-2">{t('maxReached', { max: MAX_REPERTOIRE_ITEMS })}</p>
                        )}
                        <FormMessage>{form.formState.errors.repertoire?.root?.message || form.formState.errors.repertoire?.message}</FormMessage>

                    </CardContent>
                    <Separator />
                    <CardFooter className="flex justify-end pt-6">
                        <div className="text-lg font-bold">
                            <span>{t('totalDuration')} </span>
                            <span>{totalDurationFormatted}</span>
                        </div>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('logisticalNeeds')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField name="logisticalNeeds" render={({ field }) => (<FormItem><FormLabel>{t('logisticalNeedsPlaceholder')}</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('pricing')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Notice variant="info">
                                <NoticeTitle>{t('pricingExplainTitle')}</NoticeTitle>
                                <NoticeDescription>
                                    {t('pricingExplainDesc')}
                                </NoticeDescription>
                            </Notice>
                            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('conservatoriumTier')}</span>
                                    <span className="font-medium">{tier ? `${t('tierPrefix')}${tier}` : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('ensembleSize')}</span>
                                    <span className="font-medium">{ensembleSize ? `${t(`sizeLabels.${ensembleSize}`)} (${numParticipants || 0} ${t('numParticipants')})` : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('durationLabel')}</span>
                                    <span className="font-medium">{durationMinutes.toFixed(2)} {t('minutes')}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>{t('totalPrice')}</span>
                                    <span>{calculatedPrice} ₪</span>
                                </div>
                            </div>
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

