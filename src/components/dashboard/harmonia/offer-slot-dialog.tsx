'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import type { WaitlistEntry } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle } from 'lucide-react';
import { format, addHours } from 'date-fns';

export interface OfferSlotDialogProps {
  entry: WaitlistEntry & { studentName: string; teacherName: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (entryId: string, slotId: string, offerExpiresAt: string) => void;
}

export function OfferSlotDialog({ entry, open, onOpenChange, onConfirm }: OfferSlotDialogProps) {
  const tOffer = useTranslations('WaitlistOffer');
  const tCommon = useTranslations('Common');
  const { lessons, waitlist } = useAuth();

  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [skipReason, setSkipReason] = useState('');

  // Offer expires 48h from now (recalculated each time dialog opens)
  const offerExpiresAt = useMemo(
    () => addHours(new Date(), 48).toISOString(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open]
  );

  // FIFO check: is this entry the first WAITING entry for the conservatorium?
  const isFirstInQueue = useMemo(() => {
    const waitingEntries = waitlist
      .filter(e => e.status === 'WAITING' && e.conservatoriumId === entry.conservatoriumId)
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
    return waitingEntries.length === 0 || waitingEntries[0].id === entry.id;
  }, [waitlist, entry.id, entry.conservatoriumId]);

  // Available lesson slots for the teacher
  const availableSlots = useMemo(() => {
    return lessons.filter(slot => {
      if (slot.teacherId !== entry.teacherId) return false;
      if (slot.status !== 'SCHEDULED') return false;
      return true;
    });
  }, [lessons, entry.teacherId]);

  const handleConfirm = () => {
    if (!selectedSlotId) return;
    if (!isFirstInQueue && !skipReason.trim()) return;
    onConfirm(entry.id, selectedSlotId, offerExpiresAt);
  };

  const canConfirm = Boolean(selectedSlotId) && (isFirstInQueue || skipReason.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tOffer('offerDetails')}</DialogTitle>
          <DialogDescription>
            {entry.studentName} — {entry.instrument} ({entry.teacherName})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* FIFO skip warning */}
          {!isFirstInQueue && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">{tOffer('skipWarning')}</p>
            </div>
          )}

          {/* Slot selection */}
          {availableSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tOffer('noSlotsAvailable')}</p>
          ) : (
            <div className="space-y-2">
              <Label>{tOffer('selectSlot')}</Label>
              <RadioGroup value={selectedSlotId} onValueChange={setSelectedSlotId}>
                {availableSlots.map(slot => (
                  <div key={slot.id} className="flex items-center gap-2">
                    <RadioGroupItem value={slot.id} id={`slot-${slot.id}`} />
                    <Label htmlFor={`slot-${slot.id}`} className="font-normal cursor-pointer">
                      {format(new Date(slot.startTime), 'EEEE dd/MM/yyyy HH:mm')} — {slot.durationMinutes} min
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Skip reason (required when out of FIFO) */}
          {!isFirstInQueue && (
            <div className="space-y-1">
              <Label htmlFor="skip-reason">
                {tOffer('skipReason')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="skip-reason"
                value={skipReason}
                onChange={e => setSkipReason(e.target.value)}
                placeholder={tOffer('skipReasonRequired')}
                rows={2}
              />
            </div>
          )}

          {/* Offer expiry */}
          <p className="text-sm text-muted-foreground">
            {tOffer('expiresIn')}: {format(new Date(offerExpiresAt), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button disabled={!canConfirm} onClick={handleConfirm}>
            {tOffer('sendOffer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
