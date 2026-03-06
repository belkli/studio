'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const selectedStudentId = form.watch('studentId');

  const students = useMemo(() => users.filter(u => u.role === 'student' && u.approved), [users]);

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
                      {students.map(student => <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
  );
}
