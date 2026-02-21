'use client';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import type { PerformanceBooking, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AssignMusicianDialogProps {
  booking: PerformanceBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignMusicianDialog({ booking, open, onOpenChange }: AssignMusicianDialogProps) {
  const { users, assignMusiciansToPerformance } = useAuth();
  const { toast } = useToast();
  const [selectedMusicianIds, setSelectedMusicianIds] = useState<string[]>([]);

  const performers = useMemo(() => 
    users.filter(u => u.role === 'teacher' && u.performanceProfile?.isOptedIn && u.performanceProfile?.adminApproved)
  , [users]);

  // When dialog opens, pre-select already assigned musicians
  React.useEffect(() => {
    if (booking?.assignedMusicians) {
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
    
    assignMusiciansToPerformance(booking.id, selectedMusicianIds);
    toast({
      title: 'המוזיקאים שובצו בהצלחה!',
      description: `${selectedMusicianIds.length} מוזיקאים שובצו לאירוע "${booking.eventName}".`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>שיבוץ מוזיקאים לאירוע</DialogTitle>
          <DialogDescription>
            בחר את המוזיקאים שיופיעו באירוע: {booking?.eventName}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-80 my-4">
          <div className="space-y-2 p-1">
            {performers.map(performer => (
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
                    <AvatarImage src={performer.avatarUrl} />
                    <AvatarFallback>{performer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <Label htmlFor={`musician-${performer.id}`} className="font-medium cursor-pointer">{performer.name}</Label>
                    <p className="text-xs text-muted-foreground">{performer.instruments?.map(i => i.instrument).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleConfirm}>שמור שיבוץ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
