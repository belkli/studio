'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, PartyPopper } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

const getEmailSchema = (t: any) => z.object({
  email: z.string().email(t('errorEmail')),
});

interface AgeUpgradeModalProps {
  child: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgeUpgradeModal({ child, open, onOpenChange }: AgeUpgradeModalProps) {
  const t = useTranslations('AgeUpgradeModal');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const emailSchema = getEmailSchema(t);

  const form = useForm<{ email: string }>({
    resolver: zodResolver(emailSchema),
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      form.reset();
    }, 300);
  }

  const handleInvite = () => {
    setStep(2);
  };

  const handleSendInvitation = (data: { email: string }) => {
    console.log(`Sending invitation to ${child?.name} at ${data.email}`);
    // In a real app, this would trigger a backend process to create an account/send email.
    toast({
      title: t('toastTitle'),
      description: t('toastDesc', { name: child?.name ?? '' }),
    });
    handleClose();
  };

  if (!child) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="bg-primary/10 rounded-full p-3 mb-2">
            <PartyPopper className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">{t('title', { name: child.name })}</DialogTitle>
          <DialogDescription className="text-balance">
            {t('description', { name: child.name })}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
            >
              <div className="p-4 text-sm text-center">
                <p>{t('step1Desc')}</p>
              </div>
              <DialogFooter className={`flex-col-reverse sm:flex-row gap-2 pt-4 ${isRtl ? 'sm:justify-start' : 'sm:justify-end'}`}>
                <Button variant="ghost" onClick={handleClose}>{t('manageMyselfBtn')}</Button>
                <Button onClick={handleInvite}>{t('inviteNowBtn')}</Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
              className="pt-4"
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSendInvitation)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="text-start">
                        <FormLabel>{t('formLabel', { name: child.name })}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                            <Input dir="ltr" className={`text-left ${isRtl ? 'pe-10' : 'ps-10'}`} placeholder="example@email.com" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className={isRtl ? 'sm:justify-start' : 'sm:justify-end'}>
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>{t('backBtn')}</Button>
                    <Button type="submit">{t('submitBtn')}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

