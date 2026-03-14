'use client';
import { useState, useMemo, useEffect } from 'react';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import type { PerformanceBooking } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTranslations } from 'next-intl';
import { tenantUsers } from '@/lib/tenant-filter';

interface AssignMusicianDialogProps {
  booking: PerformanceBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (bookingId: string, musicianIds: string[]) => void;
}

export function AssignMusicianDialog({ booking, open, onOpenChange, onConfirm }: AssignMusicianDialogProps) {
  const { users, user } = useAuth();
  const t = useTranslations('PerformanceBooking');
  const [selectedMusicianIds, setSelectedMusicianIds] = useState<string[]>([]);

  const performers = useMemo(() =>
    (user ? tenantUsers(users, user, 'teacher') : []).filter(u => u.performanceProfile?.isOptedIn && u.performanceProfile?.adminApproved)
    , [users, user]);

  // When dialog opens, pre-select already assigned musicians
  useEffect(() => {
    if (booking?.assignedMusicians) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMusicianIds(booking.assignedMusicians.map(m => m.userId));
    } else {
      setSelectedMusicianIds([]);
    }
  }, [booking]);

  const handleToggleMusician = (id: string) => {
    setSelectedMusicianIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (!booking) return;
    onConfirm(booking.id, selectedMusicianIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialogAssignTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialogAssignDesc', { eventName: booking?.eventName || '' })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-80 my-4">
          <div className="space-y-2 p-1">
            {performers.map(performer => {
              const image = PlaceHolderImages.find(img => img.id === performer.avatarUrl)
              return (
                <div
                  key={performer.id}
                  className="flex items-center gap-3 p-2 rounded-md border"
                >
                  <Checkbox
                    id={`musician-${performer.id}`}
                    checked={selectedMusicianIds.includes(performer.id)}
                    onCheckedChange={() => handleToggleMusician(performer.id)}
                  />
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={image?.imageUrl || performer.avatarUrl} />
                    <AvatarFallback>{performer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor={`musician-${performer.id}`} className="font-medium cursor-pointer">{performer.name}</Label>
                    <p className="text-xs text-muted-foreground">{performer.instruments?.map(i => i.instrument).join(', ')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('dialogCancelBtn')}</Button>
          <Button onClick={handleConfirm}>{t('dialogSaveAssignBtn')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
