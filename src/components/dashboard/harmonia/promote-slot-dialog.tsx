'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import type { EmptySlot, User } from '@/lib/types';
import { getTargetedSlotSuggestions } from '@/app/actions';
import type { TargetSlotsOutput } from '@/ai/flows/target-empty-slots-flow';
import { Loader2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { useLocale } from 'next-intl';
import { userHasInstrument } from '@/lib/instrument-matching';



interface PromoteSlotDialogProps {
  slot: EmptySlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromoteSlotDialog({ slot, open, onOpenChange }: PromoteSlotDialogProps) {
  const { users, conservatoriumInstruments } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TargetSlotsOutput['suggestions']>([]);
  const locale = useLocale();
  const dateLocale = useDateLocale();

  useEffect(() => {
    if (open && slot) {
      const fetchSuggestions = async () => {
        setIsLoading(true);
        const eligibleRecipients = users.filter((u) => u.role === 'student' && userHasInstrument((u.instruments || []).map((i) => i.instrument), slot.instrument, conservatoriumInstruments, u.conservatoriumId));

        const result = await getTargetedSlotSuggestions({
          emptySlot: {
            id: slot.id,
            teacherName: slot.teacher.name,
            instrument: slot.instrument,
            startTime: slot.startTime.toISOString(),
            durationMinutes: slot.durationMinutes,
            promotionalPrice: slot.promotionalPrice,
            basePrice: slot.basePrice,
          },
          eligibleRecipients: eligibleRecipients.map(u => ({
            id: u.id,
            name: u.name,
            instrument: u.instruments?.[0]?.instrument || '',
            pastBookingTimes: [], // Mock
            makeupCreditBalance: 0, // Mock
            type: 'student',
          })),
          locale,
        });

        setSuggestions(result.suggestions);
        setIsLoading(false);
      };
      fetchSuggestions();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
    }
  }, [open, slot, users, conservatoriumInstruments]);

  const handleSendPromotions = () => {
    toast({
      title: "ההצעות נשלחו!",
      description: "הודעות SMS מותאמות אישית נשלחו לתלמידים המוצעים."
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>קידום שיעור פנוי</DialogTitle>
          <DialogDescription>
            {slot && `שיעור ${slot.instrument} עם ${slot.teacher.name} ביום ${format(slot.startTime, 'EEEE, HH:mm', { locale: dateLocale })}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <h4 className="font-semibold mb-2">הצעות ממוקדות של AI</h4>
          <p className="text-sm text-muted-foreground mb-4">
            רשימת התלמידים עם הסיכוי הגבוה ביותר להזמין שיעור זה.
          </p>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2 pe-2">
                {suggestions.map(suggestion => {
                  const student = users.find(u => u.id === suggestion.recipientId);
                  if (!student) return null;
                  return (
                    <div key={suggestion.recipientId} className="flex items-center gap-3 p-2 rounded-md border bg-muted/50">
                      <Avatar>
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{student.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.personalizationHooks.map((hook, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{hook}</Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono">{suggestion.affinityScore}</Badge>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleSendPromotions} disabled={isLoading || suggestions.length === 0}>
            <Send className="h-4 w-4 me-2" />
            שלח הצעות ל-{suggestions.length} תלמידים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}