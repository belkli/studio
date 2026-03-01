'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay } from 'date-fns';
import { AlertTriangle, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations, useLocale } from 'next-intl';
import { useDateLocale } from '@/hooks/use-date-locale';

interface SickLeaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SickLeaveModal({ open, onOpenChange }: SickLeaveModalProps) {
  const t = useTranslations('SickLeaveModal');
  const locale = useLocale();
  const dateLocale = useDateLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const { toast } = useToast();
  const { mockLessons, reportSickLeave, user } = useAuth();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: new Date(),
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const lessonsToCancel = mockLessons.filter((lesson: any) => {
    if (!dateRange.from || !dateRange.to || !user) return false;
    const lessonDate = new Date(lesson.startTime);
    return lesson.teacherId === user.id && lessonDate >= dateRange.from && lessonDate <= new Date(dateRange.to.getTime() + 86399999);
  });

  const handleReport = async () => {
    if (!dateRange.from || !dateRange.to || !user) return;

    setIsDeleting(true);
    try {
      await reportSickLeave(user.id, dateRange.from, dateRange.to);
      toast({
        title: t('reportSubmitted'),
        description: t('lessonsCancelled', { count: lessonsToCancel.length }),
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת הגשת הדיווח. אנא נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="sm:max-w-[600px] gap-6">
        <DialogHeader className="text-start">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="rounded-xl border border-border overflow-hidden">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                locale={dateLocale}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{t('lessonsToCancel', { count: lessonsToCancel.length })}</h4>
              <Badge variant="secondary" className="rounded-full">
                {lessonsToCancel.length}
              </Badge>
            </div>

            <ScrollArea className="h-[280px] rounded-xl border border-border p-4 bg-muted/30">
              {lessonsToCancel.length > 0 ? (
                <div className="space-y-3">
                  {lessonsToCancel.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((lesson: any) => (
                    <div key={lesson.id} className="flex flex-col gap-1 p-3 rounded-lg bg-card border border-border/50 shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm">{lesson.studentName || t('unknownStudent')}</span>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {format(new Date(lesson.startTime), 'HH:mm')}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(lesson.startTime), 'EEEE, d MMM', { locale: dateLocale })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                  <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">{t('noLessonsToCancel')}</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {lessonsToCancel.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">{t('attentionTitle')}</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                {t('attentionDesc', { count: lessonsToCancel.length })}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className={`gap-2 ${isRtl ? 'sm:justify-start' : 'sm:justify-end'}`}>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            {t('cancelBtn')}
          </Button>
          <Button
            onClick={handleReport}
            disabled={!dateRange.from || !dateRange.to || isDeleting}
            className="min-w-[140px]"
          >
            {isDeleting ? (
              <>
                <Loader2 className={`${isRtl ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                {t('confirmCancel', { count: lessonsToCancel.length })}
              </>
            ) : (
              t('confirmCancel', { count: lessonsToCancel.length })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
