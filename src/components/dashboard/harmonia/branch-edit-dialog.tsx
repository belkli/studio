'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Branch } from '@/lib/types';
import { useEffect } from 'react';

const branchSchema = z.object({
  name: z.string().min(3, 'שם הסניף חייב להכיל לפחות 3 תווים.'),
  address: z.string().min(5, 'כתובת חייבת להכיל לפחות 5 תווים.'),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface BranchEditDialogProps {
  branch?: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BranchFormData, branchId?: string) => void;
}

export function BranchEditDialog({ branch, open, onOpenChange, onSave }: BranchEditDialogProps) {
  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (branch) {
        form.reset({
          name: branch.name,
          address: branch.address,
        });
      } else {
        form.reset({
          name: '',
          address: '',
        });
      }
    }
  }, [branch, open, form]);

  const onSubmit = (data: BranchFormData) => {
    onSave(data, branch?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>{branch ? 'עריכת סניף' : 'הוספת סניף חדש'}</DialogTitle>
          <DialogDescription>
            {branch ? 'עדכן את פרטי הסניף.' : 'הזן את פרטי הסניף החדש שברצונך להוסיף.'}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם הסניף</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: שלוחת נווה עוז" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כתובת מלאה</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: רחוב הכלניות 15, פתח תקווה" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit">שמור סניף</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
