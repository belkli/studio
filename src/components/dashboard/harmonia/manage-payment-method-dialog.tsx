
'use client';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { CreditCard, Calendar, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

const paymentSchema = z.object({
  cardNumber: z.string().min(16, "מספר כרטיס לא תקין").max(16, "מספר כרטיס לא תקין"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "תאריך תפוגה לא תקין (MM/YY)"),
  cvc: z.string().min(3, "CVC לא תקין").max(4, "CVC לא תקין"),
  cardHolder: z.string().min(2, "חובה להזין שם בעל הכרטיס"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface ManagePaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { last4: string, expiryMonth: number, expiryYear: number }) => void;
}

export function ManagePaymentMethodDialog({ open, onOpenChange, onSave }: ManagePaymentMethodDialogProps) {
  const t = useTranslations('PaymentSettings');
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  const onSubmit = (data: PaymentFormData) => {
    const [month, year] = data.expiryDate.split('/');
    onSave({
      last4: data.cardNumber.slice(-4),
      expiryMonth: parseInt(month),
      expiryYear: 2000 + parseInt(year),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>{t('updateMethodTitle')}</DialogTitle>
          <DialogDescription>{t('updateMethodDesc')}</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="cardHolder" render={({ field }) => (
              <FormItem><FormLabel>{t('cardHolder')}</FormLabel><FormControl><Input placeholder="ישראל ישראלי" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="cardNumber" render={({ field }) => (
              <FormItem><FormLabel>{t('cardNumber')}</FormLabel><InputGroup><InputGroupText><CreditCard /></InputGroupText><FormControl><Input dir="ltr" className="rounded-s-none text-left" placeholder="•••• •••• •••• ••••" {...field} /></FormControl></InputGroup><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem><FormLabel>{t('expiryDate')}</FormLabel><InputGroup><InputGroupText><Calendar /></InputGroupText><FormControl><Input dir="ltr" className="rounded-s-none text-left" placeholder="MM/YY" {...field} /></FormControl></InputGroup><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cvc" render={({ field }) => (
                <FormItem><FormLabel>{t('cvc')}</FormLabel><InputGroup><InputGroupText><Lock /></InputGroupText><FormControl><Input dir="ltr" type="password" className="rounded-s-none text-left" placeholder="•••" {...field} /></FormControl></InputGroup><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
              <Button type="submit">{t('saveButton')}</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

