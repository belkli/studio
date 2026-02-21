'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { PerformanceBooking } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

interface SendQuoteDialogProps {
  booking: PerformanceBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (bookingId: string, message: string) => void;
}

export function SendQuoteDialog({ booking, open, onOpenChange, onConfirm }: SendQuoteDialogProps) {
  const [message, setMessage] = useState('');

  if (!booking) return null;

  const handleConfirm = () => {
    onConfirm(booking.id, message);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>שליחת הצעת מחיר</DialogTitle>
          <DialogDescription>
            שלח הצעת מחיר רשמית עבור אירוע: {booking.eventName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
            <p><strong>לקוח:</strong> {booking.clientName}</p>
            <p><strong>אימייל:</strong> {booking.clientEmail}</p>
            <Separator />
            <p><strong>הרכב:</strong> {booking.assignedMusicians?.map(m => m.name).join(', ')}</p>
            <p className="text-xl font-bold">סה"כ הצעה: ₪{booking.totalQuote.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quote-message">הודעה אישית (אופציונלי)</Label>
            <Textarea
              id="quote-message"
              placeholder="לדוגמה: הצעת המחיר כוללת הגברה בסיסית. נשמח לעמוד לשירותכם..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleConfirm}>שלח הצעה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
