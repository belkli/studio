/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import type { Alumnus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const AlumnusSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  conservatoriumId: z.string(),
  displayName: z.string().min(2),
  graduationYear: z.coerce.number().int(),
  primaryInstrument: z.string().min(2),
  currentOccupation: z.string().optional(),
  isPublic: z.boolean(),
  availableForMasterClasses: z.boolean(),
});

type AlumnusFormValues = z.infer<typeof AlumnusSchema>;

interface AlumnusFormProps {
  initialData?: Alumnus | null;
  onSubmit: (data: Alumnus) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AlumnusForm({ initialData, onSubmit, onCancel, isSubmitting }: AlumnusFormProps) {
  const t = useTranslations('AlumniPage');
  const commonT = useTranslations('Common');

  const form = useForm<AlumnusFormValues>({
    resolver: zodResolver(AlumnusSchema) as any,
    defaultValues: {
      id: initialData?.id,
      userId: initialData?.userId || '',
      conservatoriumId: initialData?.conservatoriumId || '',
      displayName: initialData?.displayName || '',
      graduationYear: initialData?.graduationYear || new Date().getFullYear(),
      primaryInstrument: initialData?.primaryInstrument || '',
      currentOccupation: initialData?.currentOccupation || '',
      isPublic: initialData?.isPublic || false,
      availableForMasterClasses: initialData?.availableForMasterClasses || false,
    },
  });

  const handleFormSubmit = (values: AlumnusFormValues) => {
    onSubmit({
      id: values.id || 'alumni-' + values.userId,
      userId: values.userId,
      conservatoriumId: values.conservatoriumId,
      displayName: values.displayName,
      graduationYear: values.graduationYear,
      primaryInstrument: values.primaryInstrument,
      currentOccupation: values.currentOccupation,
      isPublic: values.isPublic,
      availableForMasterClasses: values.availableForMasterClasses,
      bio: initialData?.bio || {},
      profilePhotoUrl: initialData?.profilePhotoUrl,
      achievements: initialData?.achievements,
      socialLinks: initialData?.socialLinks,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit as any)} className='space-y-4'>
        <FormField control={form.control as any} name='displayName' render={({ field }) => (
          <FormItem><FormLabel>{t('displayName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className='grid grid-cols-2 gap-4'>
          <FormField control={form.control as any} name='graduationYear' render={({ field }) => (
            <FormItem><FormLabel>{t('graduationYear')}</FormLabel><FormControl><Input type='number' {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control as any} name='primaryInstrument' render={({ field }) => (
            <FormItem><FormLabel>{t('primaryInstrument')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control as any} name='currentOccupation' render={({ field }) => (
          <FormItem><FormLabel>{t('currentOccupation')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control as any} name='isPublic' render={({ field }) => (
          <FormItem className='flex items-center gap-2 rounded-md border p-3'>
            <FormControl><Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} /></FormControl>
            <FormLabel>{t('isPublic')}</FormLabel>
          </FormItem>
        )} />
        <FormField control={form.control as any} name='availableForMasterClasses' render={({ field }) => (
          <FormItem className='flex items-center gap-2 rounded-md border p-3'>
            <FormControl><Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} /></FormControl>
            <FormLabel>{t('availableForMasterClasses')}</FormLabel>
          </FormItem>
        )} />
        <div className='flex justify-end gap-2 pt-4'>
          <Button type='button' variant='outline' onClick={onCancel}>{commonT('cancel')}</Button>
          <Button type='submit' disabled={isSubmitting}>{isSubmitting ? commonT('saving') : commonT('save')}</Button>
        </div>
      </form>
    </Form>
  );
}
