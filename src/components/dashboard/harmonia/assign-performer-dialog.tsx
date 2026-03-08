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

const schema = z.object({
  studentId: z.string().min(1, 'חובה לבחור תלמיד/ה.'),
  repertoireId: z.string().min(1, 'חובה לבחור יצירה.'),
});

type FormData = z.infer<typeof schema>;

interface AssignPerformerDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignPerformerDialog({ eventId, open, onOpenChange }: AssignPerformerDialogProps) {
  const { users, assignedRepertoire, compositions, addPerformanceToEvent } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedStudentId = form.watch('studentId');

  const students = useMemo(() => users.filter(u => u.role === 'student' && u.approved), [users]);
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
          label: composition ? `${composition.title} (${composition.composer})` : 'יצירה לא ידועה',
        };
      });
  }, [selectedStudentId, assignedRepertoire, compositions]);

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
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת מבצע/ת לאירוע</DialogTitle>
            <DialogDescription>בחר תלמיד/ה ויצירה מהרפרטואר שמוכן לביצוע.</DialogDescription>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תלמיד/ה</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="בחר תלמיד/ה..." /></SelectTrigger>
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
                                        <ImageOff className="h-3.5 w-3.5 text-amber-500" aria-label="ללא הסכמת צילום" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-56 text-xs">
                                      תלמיד/ה זה/זו לא אישר/ה פרסום תמונות/וידאו לצרכים מסחריים. יש להימנע מפרסום מזהה של תמונות אירוע.
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
                    תלמיד/ה זה/זו לא אישר/ה פרסום תמונות לצרכים מסחריים. בעת תיעוד האירוע יש להימנע מפרסום תמונות מזהות ברשתות חברתיות ובחומרי פרסום.
                    ניתן <button type="button" className="underline font-medium" onClick={() => {/* TODO: request-consent flow */}}>לבקש הסכמה</button> מההורה/תלמיד/ה.
                  </span>
                </div>
              )}

              <FormField
                control={form.control}
                name="repertoireId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>יצירה</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled={!selectedStudentId}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="בחר יצירה..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRepertoire.length > 0 ? (
                          availableRepertoire.map(rep => <SelectItem key={rep.id} value={rep.id}>{rep.label}</SelectItem>)
                        ) : (
                          <SelectItem value="none" disabled>אין יצירות מוכנות לביצוע</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                  ביטול
                </Button>
                <Button type="submit">הוסף לתוכנית</Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
