'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { usePhotoConsent } from '@/hooks/use-photo-consent';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageOff, AlertTriangle } from 'lucide-react';
import { useMemo, useEffect } from 'react';
import { saveConsentRecord } from '@/app/actions/consent';
import { tenantUsers } from '@/lib/tenant-filter';
import { useTranslations, useLocale } from 'next-intl';

const getSchema = (t: (key: string) => string) => z.object({
  studentId: z.string().min(1, t('studentRequired')),
  repertoireId: z.string().min(1, t('repertoireRequired')),
});

type FormData = z.infer<ReturnType<typeof getSchema>>;

interface AssignPerformerDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignPerformerDialog({ eventId, open, onOpenChange }: AssignPerformerDialogProps) {
  const { users, user, assignedRepertoire, compositions, addPerformanceToEvent } = useAuth();
  const t = useTranslations('AssignPerformer');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const form = useForm<FormData>({
    resolver: zodResolver(getSchema(t)),
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedStudentId = form.watch('studentId');

  const students = useMemo(() => (user ? tenantUsers(users, user, 'student') : []).filter(u => u.approved), [users, user]);
  const studentIds = useMemo(() => students.map(s => s.id), [students]);

  // Fetch PHOTOS consent for all students in this dialog
  const { consentMap } = usePhotoConsent(open ? studentIds : []);

  const selectedStudentNoConsent = selectedStudentId && consentMap[selectedStudentId] === false;

  const availableRepertoire = useMemo(() => {
    if (!selectedStudentId) return [];
    return assignedRepertoire
      .filter(r => r.studentId === selectedStudentId && r.status === 'PERFORMANCE_READY')
      .map(r => {
        const composition = compositions.find(c => c.id === r.compositionId);
        return {
          id: r.id,
          label: composition ? `${composition.title} (${composition.composer})` : t('unknownComposition'),
        };
      });
  }, [selectedStudentId, assignedRepertoire, compositions, t]);

  useEffect(() => {
    form.resetField('repertoireId');
  }, [selectedStudentId, form]);

  const onSubmit = (data: FormData) => {
    addPerformanceToEvent(eventId, data.studentId, data.repertoireId);
    onOpenChange(false);
    form.reset();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('dialogTitle')}</DialogTitle>
            <DialogDescription>{t('dialogDesc')}</DialogDescription>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('studentLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir={isRtl ? 'rtl' : 'ltr'}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t('studentPlaceholder')} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map(student => {
                          const hasConsent = consentMap[student.id];
                          // undefined = not yet loaded; false = explicitly no consent
                          const noConsent = hasConsent === false;
                          return (
                            <SelectItem key={student.id} value={student.id}>
                              <span className="flex items-center gap-2">
                                {student.name}
                                {noConsent && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center">
                                        <ImageOff className="h-3.5 w-3.5 text-amber-500" aria-label={t('noPhotoConsent')} />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-56 text-xs">
                                      {t('noPhotoConsentTooltip')}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Warning banner when selected student has no photo consent */}
              {selectedStudentNoConsent && (
                <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {t('noConsentWarning')}{' '}
                    <button type="button" className="underline font-medium" onClick={() => {
                        const student = students.find(s => s.id === selectedStudentId);
                        if (!student) return;
                        saveConsentRecord({
                          userId: student.id,
                          conservatoriumId: student.conservatoriumId ?? '',
                          consentDataProcessing: false,
                          consentTerms: false,
                          consentVideoRecording: true,
                        });
                      }}>{t('requestConsent')}</button>
                  </span>
                </div>
              )}

              <FormField
                control={form.control}
                name="repertoireId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('compositionLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir={isRtl ? 'rtl' : 'ltr'} disabled={!selectedStudentId}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t('compositionPlaceholder')} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRepertoire.length > 0 ? (
                          availableRepertoire.map(rep => <SelectItem key={rep.id} value={rep.id}>{rep.label}</SelectItem>)
                        ) : (
                          <SelectItem value="none" disabled>{t('noReadyCompositions')}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                  {t('cancelBtn')}
                </Button>
                <Button type="submit">{t('addToProgram')}</Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
