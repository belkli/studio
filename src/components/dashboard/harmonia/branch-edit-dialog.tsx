
'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Branch } from '@/lib/types';
import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface BranchEditDialogProps {
  branch?: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; address: string }, branchId?: string) => void;
}

export function BranchEditDialog({ branch, open, onOpenChange, onSave }: BranchEditDialogProps) {
  const t = useTranslations('Branches');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const branchSchema = z.object({
    name: z.string().min(3, t('validation.nameMin', { min: 3 })),
    address: z.string().min(5, t('validation.addressMin', { min: 5 })),
  });

  type BranchFormData = z.infer<typeof branchSchema>;

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
      <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{branch ? t('editTitle') : t('addTitle')}</DialogTitle>
          <DialogDescription>
            {branch ? t('editDesc') : t('addDesc')}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('branchName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('namePlaceholder')} {...field} />
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
                  <FormLabel>{t('fullAddress')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('addressPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit">{t('saveBranch')}</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
