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

const assignSchema = z.object({
  compositionId: z.string().min(1, 'חובה לבחור יצירה.'),
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
  const [compositionOptions, setCompositionOptions] = useState<{ value: string, label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const student = useMemo(() => users.find((u) => u.id === studentId), [users, studentId]);
  const primaryInstrument = student?.instruments?.[0]?.instrument || '';

  const form = useForm<AssignFormData>({
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

  // eslint-disable-next-line react-hooks/use-memo
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
    toast({
      title: 'יצירה הוקצתה בהצלחה',
      description:
        targetStudents.length > 1
          ? `"${assignedComposition?.title}" נוספה לרפרטואר של ${targetStudents.length} תלמידים.`
          : `"${assignedComposition?.title}" נוספה לרפרטואר של התלמיד/ה.`,
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
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>הקצאת יצירה חדשה</DialogTitle>
          <DialogDescription>חפש יצירה מהספרייה והקצה אותה לתלמיד/ה או לקבוצת כלי.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>היקף הקצאה</FormLabel>
                  <Select dir="rtl" value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר היקף" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">תלמיד/ה זה/ו בלבד</SelectItem>
                      <SelectItem value="instrument_group">כל תלמידי המורה באותו כלי</SelectItem>
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
                  <FormLabel>חפש יצירה</FormLabel>
                  <Combobox
                    options={compositionOptions}
                    selectedValue={field.value}
                    onSelectedValueChange={field.onChange}
                    onInputChange={debouncedSearch}
                    isLoading={isLoading}
                    placeholder="הקלד/י לחיפוש מלחין או יצירה..."
                    searchPlaceholder="חיפוש..."
                    notFoundMessage="לא נמצאו יצירות."
                    filter={false}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit">הקצה יצירה</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
