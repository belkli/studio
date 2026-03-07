'use client';

import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { differenceInCalendarDays, format } from 'date-fns';
import { AlertTriangle, Calendar as CalendarIcon, FileText, Loader2, Upload } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useDateLocale } from '@/hooks/use-date-locale';

interface SickLeaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_MEDICAL_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MEDICAL_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export function SickLeaveModal({ open, onOpenChange }: SickLeaveModalProps) {
  const t = useTranslations('SickLeaveModal');
  const locale = useLocale();
  const dateLocale = useDateLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const { toast } = useToast();
  const { lessons, reportSickLeave, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          dateRange: z.object({
            from: z.date().optional(),
            to: z.date().optional(),
          }),
          medicalFile: z.custom<FileList | undefined>().optional(),
          medicalNote: z.string().max(500, t('validation.noteTooLong')).optional(),
        })
        .superRefine((values, ctx) => {
          const from = values.dateRange.from;
          const to = values.dateRange.to;

          if (!from || !to) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['dateRange'],
              message: t('validation.dateRequired'),
            });
            return;
          }

          const selectedFile = values.medicalFile?.[0];
          const selectedDays = differenceInCalendarDays(to, from) + 1;

          if (selectedDays >= 2 && !selectedFile) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['medicalFile'],
              message: t('validation.medicalFileRequired'),
            });
          }

          if (selectedFile) {
            if (selectedFile.size > MAX_MEDICAL_FILE_SIZE_BYTES) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['medicalFile'],
                message: t('validation.fileTooLarge'),
              });
            }

            if (!ACCEPTED_MEDICAL_MIME_TYPES.has(selectedFile.type)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['medicalFile'],
                message: t('validation.fileTypeInvalid'),
              });
            }
          }
        }),
    [t]
  );

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
      medicalNote: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
      medicalFile: undefined,
      medicalNote: '',
    });
  }, [form, open]);

  const dateRange = form.watch('dateRange');
  const from = dateRange?.from;
  const to = dateRange?.to;
  const selectedFile = form.watch('medicalFile')?.[0];

  const selectedDays = useMemo(() => {
    if (!from || !to) return 0;
    return differenceInCalendarDays(to, from) + 1;
  }, [from, to]);

  const requiresMedicalFile = selectedDays >= 2;

  const lessonsToCancel = useMemo(() => {
    if (!from || !to || !user) return [];
    const toInclusive = new Date(to.getTime() + 86399999);

    return lessons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((lesson: any) => {
        const lessonDate = new Date(lesson.startTime);
        return lesson.teacherId === user.id && lessonDate >= from && lessonDate <= toInclusive;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [from, to, user, lessons]);

  const onSubmit = async (values: FormValues) => {
    if (!values.dateRange.from || !values.dateRange.to || !user) return;

    setIsSubmitting(true);
    try {
      const toInclusive = new Date(values.dateRange.to.getTime() + 86399999);
      const cancelled = reportSickLeave(user.id, values.dateRange.from, toInclusive);

      toast({
        title: t('reportSubmitted'),
        description: t('lessonsCancelled', { count: cancelled.length }),
      });

      onOpenChange(false);
    } catch {
      toast({
        title: t('submitErrorTitle'),
        description: t('submitErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="max-h-[90vh] sm:max-w-[860px]">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <CalendarIcon className="h-6 w-6 text-primary" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-base">{t('description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3 rounded-xl border p-4">
                <FormField
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dateRangeLabel')}</FormLabel>
                      <FormControl>
                        <Calendar
                          mode="range"
                          selected={field.value ? { from: field.value.from, to: field.value.to } : undefined}
                          onSelect={(range) => field.onChange({ from: range?.from, to: range?.to })}
                          locale={dateLocale}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{t('lessonsToCancel', { count: lessonsToCancel.length })}</h4>
                    <Badge variant="secondary" className="rounded-full">{lessonsToCancel.length}</Badge>
                  </div>

                  <ScrollArea className="h-[260px] rounded-lg border bg-muted/20 p-3">
                    {lessonsToCancel.length > 0 ? (
                      <div className="space-y-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {lessonsToCancel.map((lesson: any) => (
                          <div key={lesson.id} className="rounded-md border bg-card p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">{lesson.studentName || t('unknownStudent')}</p>
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {format(new Date(lesson.startTime), 'HH:mm')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(lesson.startTime), 'EEEE, d MMM', { locale: dateLocale })}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                        <CalendarIcon className="mb-2 h-8 w-8 opacity-30" />
                        <p className="text-sm">{t('noLessonsToCancel')}</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">{t('medicalSectionTitle')}</h4>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    {requiresMedicalFile ? t('medicalFileHintRequired') : t('medicalFileHintOptional')}
                  </p>

                  <FormField
                    control={form.control}
                    name="medicalFile"
                    render={({ field: { onChange } }) => (
                      <FormItem>
                        <FormLabel>{t('medicalFileLabel')}</FormLabel>
                        <FormControl>
                          <div className="rounded-md border border-dashed p-3">
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(event) => onChange(event.target.files ?? undefined)}
                              className="cursor-pointer"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">{t('medicalFileFormats')}</p>
                            {selectedFile && (
                              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                                <Upload className="h-3.5 w-3.5" />
                                {t('medicalFileSelected', { name: selectedFile.name })}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="medicalNote"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormLabel>{t('medicalNoteLabel')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ''}
                            placeholder={t('medicalNotePlaceholder')}
                            className="min-h-[72px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {lessonsToCancel.length > 0 && (
              <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{t('attentionTitle')}</p>
                  <p className="text-xs">{t('attentionDesc', { count: lessonsToCancel.length })}</p>
                </div>
              </div>
            )}

            <DialogFooter className={isRtl ? 'sm:justify-start' : 'sm:justify-end'}>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                {t('cancelBtn')}
              </Button>
              <Button type="submit" disabled={isSubmitting || !from || !to} className="min-w-[180px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t('confirmCancel', { count: lessonsToCancel.length })}
                  </>
                ) : (
                  t('confirmCancel', { count: lessonsToCancel.length })
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
