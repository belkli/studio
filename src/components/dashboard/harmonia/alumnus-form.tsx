'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alumnus } from '@/lib/types';
import { useTranslations } from 'next-intl';

const AlumnusSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    avatarUrl: z.string().optional(),
    graduationYear: z.coerce.number().int(),
    instrument: z.string().min(2, { message: 'Instrument must be at least 2 characters.' }),
    currentRole: z.string().min(2, { message: 'Current role must be at least 2 characters.' }),
    achievements: z.string().optional(),
});

type AlumnusFormValues = z.infer<typeof AlumnusSchema>;

interface AlumnusFormProps {
    initialData?: Alumnus | null;
    onSubmit: (data: Alumnus) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export function AlumnusForm({ initialData, onSubmit, onCancel, isSubmitting }: AlumnusFormProps) {
    const t = useTranslations('AlumniPage.form');
    const commonT = useTranslations('Common');

    const form = useForm<AlumnusFormValues>({
        resolver: zodResolver(AlumnusSchema) as any,
        defaultValues: {
            name: initialData?.name || '',
            avatarUrl: initialData?.avatarUrl || '',
            graduationYear: initialData?.graduationYear || new Date().getFullYear(),
            instrument: initialData?.instrument || '',
            currentRole: initialData?.currentRole || '',
            achievements: initialData?.achievements || '',
            id: initialData?.id || undefined,
        },
    });

    const handleFormSubmit = (data: AlumnusFormValues) => {
        onSubmit(data as Alumnus);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <FormField
                    control={form.control as any}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{commonT('name')}</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...(field as any)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="graduationYear"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('graduationYear')}</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="instrument"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('instrument')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('instrumentPlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="currentRole"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('currentRole')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('rolePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="achievements"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('achievements')}</FormLabel>
                            <FormControl>
                                <Textarea placeholder={t('achievementsPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('avatarUrl')}</FormLabel>
                            <FormControl>
                                <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormDescription>{t('avatarDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {commonT('cancel')}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? commonT('saving') : commonT('save')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
