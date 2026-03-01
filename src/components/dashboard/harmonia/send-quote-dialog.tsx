'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { PerformanceBooking } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

interface SendQuoteDialogProps {
  booking: PerformanceBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (bookingId: string, message: string) => void;
}

export function SendQuoteDialog({ booking, open, onOpenChange, onConfirm }: SendQuoteDialogProps) {
  const [message, setMessage] = useState('');
  const t = useTranslations('PerformanceBooking');

  if (!booking) return null;

  const handleConfirm = () => {
    onConfirm(booking.id, message);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('dialogSendQuoteTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialogSendQuoteDesc', { eventName: booking.eventName })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
            <p><strong>{t('dialogClientLabel')}</strong> {booking.clientName}</p>
            <p><strong>{t('dialogEmailLabel')}</strong> {booking.clientEmail}</p>
            <Separator />
            <p><strong>{t('dialogEnsembleLabel')}</strong> {booking.assignedMusicians?.map(m => m.name).join(', ')}</p>
            <p className="text-xl font-bold">{t('dialogTotalQuoteLabel')} {t('currencySymbol')}{booking.totalQuote.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quote-message">{t('dialogPersonalMsgLabel')}</Label>
            <Textarea
              id="quote-message"
              placeholder={t('dialogPersonalMsgPlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('dialogCancelBtn')}</Button>
          <Button onClick={handleConfirm}>{t('dialogSendQuoteBtn')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
