'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { searchCompositions } from '@/app/actions';
import { debounce } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';

const assignSchema = z.object({
  compositionId: z.string().min(1),
  scope: z.enum(['single', 'instrument_group']),
});

type AssignFormData = z.infer<typeof assignSchema>;

interface AssignRepertoireDialogProps {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignRepertoireDialog({ studentId, open, onOpenChange }: AssignRepertoireDialogProps) {
  const { toast } = useToast();
  const { assignRepertoire, compositions, users, user } = useAuth();
  const t = useTranslations('AssignRepertoireDialog');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const [compositionOptions, setCompositionOptions] = useState<{ value: string, label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const student = useMemo(() => users.find((u) => u.id === studentId), [users, studentId]);
  const primaryInstrument = student?.instruments?.[0]?.instrument || '';

  const form = useForm<AssignFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(assignSchema) as any,
    defaultValues: {
      compositionId: '',
      scope: 'single',
    },
  });

  const getTargetStudents = useCallback((scope: AssignFormData['scope']): string[] => {
    if (scope === 'single' || !user?.students?.length) {
      return [studentId];
    }

    const pool = users.filter((candidate) => user.students?.includes(candidate.id));
    if (!primaryInstrument) {
      return [studentId];
    }

    const normalized = primaryInstrument.trim().toLowerCase();
    const group = pool.filter((candidate) =>
      candidate.instruments?.some((item) => item.instrument?.trim().toLowerCase() === normalized)
    );

    if (group.length === 0) {
      return [studentId];
    }

    return Array.from(new Set(group.map((item) => item.id)));
  }, [primaryInstrument, studentId, user?.students, users]);

  const runSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const results = await searchCompositions({ query, instrument: primaryInstrument || undefined });
      setCompositionOptions(results.map((c) => ({ value: String(c.id), label: `${c.title} - ${c.composer}` })));
    } catch (error) {
      console.error('[AssignRepertoireDialog] searchCompositions failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [primaryInstrument]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce(async (query: string) => {
    await runSearch(query);
  }, 250), [runSearch]);

  useEffect(() => {
    if (!open) return;
    void runSearch('');
  }, [open, runSearch]);

  const onSubmit = (data: AssignFormData) => {
    const targetStudents = getTargetStudents(data.scope);
    assignRepertoire(targetStudents, data.compositionId);

    const assignedComposition = compositions.find((c) => c.id === data.compositionId);
    const localeKey = locale as 'he' | 'en' | 'ar' | 'ru';
    const compositionTitle =
      assignedComposition?.titles?.[localeKey] ||
      assignedComposition?.titles?.en ||
      assignedComposition?.title ||
      '';

    toast({
      title: t('successTitle'),
      description:
        targetStudents.length > 1
          ? t('successGroup', { title: compositionTitle, count: String(targetStudents.length) })
          : t('successSingle', { title: compositionTitle }),
    });

    onOpenChange(false);
    form.reset({ compositionId: '', scope: 'single' });
    setCompositionOptions([]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset({ compositionId: '', scope: 'single' });
      setCompositionOptions([]);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('scopeLabel')}</FormLabel>
                  <Select dir={isRtl ? 'rtl' : 'ltr'} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('scopePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">{t('scopeSingle')}</SelectItem>
                      <SelectItem value="instrument_group">{t('scopeGroup')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compositionId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('searchLabel')}</FormLabel>
                  <Combobox
                    options={compositionOptions}
                    selectedValue={field.value}
                    onSelectedValueChange={field.onChange}
                    onInputChange={debouncedSearch}
                    isLoading={isLoading}
                    placeholder={t('searchPlaceholder')}
                    searchPlaceholder={t('searchBoxPlaceholder')}
                    notFoundMessage={t('notFound')}
                    filter={false}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">{t('submit')}</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
