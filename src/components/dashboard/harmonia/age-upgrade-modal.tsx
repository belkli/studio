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

interface AgeUpgradeModalProps {
  child: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emailSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה.'),
});

export function AgeUpgradeModal({ child, open, onOpenChange }: AgeUpgradeModalProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

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
      title: 'הזמנה נשלחה!',
      description: `${child?.name} יקבל/תקבל בקרוב הזמנה במייל להצטרפות למערכת.`,
    });
    handleClose();
  };
  
  if (!child) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
            <div className="bg-primary/10 rounded-full p-3 mb-2">
                <PartyPopper className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl">{child.name} חוגג/ת 13!</DialogTitle>
            <DialogDescription className="text-balance">
                כעת באפשרותך להזמין את {child.name} לנהל את חשבון ההרמוניה שלו/ה באופן עצמאי.
            </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
            {step === 1 && (
                <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                >
                    <div className="p-4 text-sm text-center">
                        <p>הם יוכלו לראות את מערכת השעות, לתעד אימונים, ולתקשר עם המורה. את/ה תמשיכ/י לנהל את החיובים והתשלומים.</p>
                    </div>
                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4">
                        <Button variant="ghost" onClick={handleClose}>אנהל עבורו/ה בינתיים</Button>
                        <Button onClick={handleInvite}>הזמן עכשיו</Button>
                    </DialogFooter>
                </motion.div>
            )}

            {step === 2 && (
                <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="pt-4"
                >
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSendInvitation)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>כתובת המייל של {child.name}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input dir="ltr" className="text-left ps-10" placeholder="example@email.com" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setStep(1)}>חזרה</Button>
                                <Button type="submit">שלח הזמנה</Button>
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
