'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/use-auth';
import type { LessonSlot } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SickLeaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SickLeaveModal({ open, onOpenChange }: SickLeaveModalProps) {
  const { user, users, mockLessons, reportSickLeave } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);

  const affectedLessons = dateRange?.from && dateRange?.to
    ? mockLessons.filter(lesson => {
        const lessonDate = new Date(lesson.startTime);
        return lesson.teacherId === user?.id &&
               lesson.status === 'SCHEDULED' &&
               lessonDate >= startOfDay(dateRange.from!) &&
               lessonDate <= endOfDay(dateRange.to!);
      }).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    : [];

  const handleConfirm = () => {
    if (!user || !dateRange?.from || !dateRange.to) return;
    
    setIsLoading(true);

    setTimeout(() => { // Simulate API call
        const cancelledLessons = reportSickLeave(user.id, startOfDay(dateRange.from!), endOfDay(dateRange.to!));
        setIsLoading(false);
        onOpenChange(false);
        toast({
            title: 'דיווח מחלה התקבל',
            description: `${cancelledLessons.length} שיעורים בוטלו. הודעות נשלחו לתלמידים והונפקו זיכויים לשיעורי השלמה.`,
        });
        setDateRange({ from: new Date(), to: new Date() });
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>דיווח על היעדרות / מחלה</DialogTitle>
          <DialogDescription>
            בחר את טווח התאריכים שבו לא תהיה זמין/ה. כל השיעורים המתוכננים בתאריכים אלו יבוטלו אוטומטית.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 py-4">
          <div className="flex justify-center">
             <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                defaultMonth={dateRange?.from}
                numberOfMonths={1}
                disabled={{ before: new Date() }}
                locale={he}
              />
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">שיעורים שיבוטלו ({affectedLessons.length})</h4>
            {affectedLessons.length > 0 ? (
                 <ScrollArea className="h-64 border rounded-md p-2">
                     <div className="space-y-2">
                        {affectedLessons.map(lesson => {
                            const student = users.find(u => u.id === lesson.studentId);
                            return (
                                <div key={lesson.id} className="text-sm p-2 bg-muted/50 rounded-md">
                                    <p className="font-medium">{lesson.instrument} - {student?.name || 'תלמיד לא ידוע'}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(lesson.startTime), 'EEEE, dd/MM/yyyy HH:mm', {locale: he})}</p>
                                </div>
                            )
                        })}
                    </div>
                 </ScrollArea>
            ) : (
                <div className="flex items-center justify-center h-full border rounded-md text-sm text-muted-foreground">
                    <p>לא נמצאו שיעורים לביטול בטווח תאריכים זה.</p>
                </div>
            )}
          </div>
        </div>

        {affectedLessons.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                 <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                 <div>
                    <h5 className="font-semibold">שימו לב!</h5>
                    <p className="text-sm">פעולה זו תבטל את כל {affectedLessons.length} השיעורים המפורטים לעיל. התלמידים יקבלו הודעה וזיכוי לשיעור השלמה. אין אפשרות לבטל פעולה זו.</p>
                </div>
            </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={affectedLessons.length === 0 || isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin h-4 w-4 me-2" /> : null}
            אשר ביטול של {affectedLessons.length} שיעורים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
