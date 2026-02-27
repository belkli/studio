'use client';

import { useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FormField, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { searchCompositions } from '@/app/actions';
import { debounce } from '@/lib/utils';
import type { Composition } from '@/lib/types';

const assignSchema = z.object({
  compositionId: z.string().min(1, 'חובה לבחור יצירה.'),
});

type AssignFormData = z.infer<typeof assignSchema>;

interface AssignRepertoireDialogProps {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignRepertoireDialog({ studentId, open, onOpenChange }: AssignRepertoireDialogProps) {
  const { toast } = useToast();
  const { assignRepertoire, compositions } = useAuth();
  const [compositionOptions, setCompositionOptions] = useState<{ value: string, label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AssignFormData>({
    resolver: zodResolver(assignSchema) as any,
  });

  const debouncedSearch = useCallback(debounce(async (query: string) => {
    setIsLoading(true);
    const results = await searchCompositions({ query });
    setCompositionOptions(results.map(c => ({ value: c.id as string, label: `${c.title} - ${c.composer}` })));
    setIsLoading(false);
  }, 300), []);

  const onSubmit = (data: AssignFormData) => {
    assignRepertoire(studentId, data.compositionId);
    const assignedComposition = compositions.find(c => c.id === data.compositionId);
    toast({
      title: 'יצירה הוקצתה בהצלחה',
      description: `"${assignedComposition?.title}" נוספה לרפרטואר של התלמיד/ה.`,
    });
    onOpenChange(false);
    form.reset();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setCompositionOptions([]);
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>הקצאת יצירה חדשה</DialogTitle>
          <DialogDescription>חפש יצירה מהספרייה והקצה אותה לתלמיד/ה.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
