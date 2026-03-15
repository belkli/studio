
'use client';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { LessonSlot } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations, useLocale } from "next-intl";

interface CancelLessonDialogProps {
    lesson: LessonSlot | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (withNotice: boolean) => void;
}

export function CancelLessonDialog({ lesson, open, onOpenChange, onConfirm }: CancelLessonDialogProps) {
    const { conservatoriums } = useAuth();
    const t = useTranslations('LessonManagement');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    if (!lesson) return null;

    const conservatorium = conservatoriums.find(c => c.id === lesson.conservatoriumId);
    const policy = conservatorium?.cancellationPolicy;
    const noticeHours = policy?.studentNoticeHoursRequired ?? 24;

    const lessonStartTime = new Date(lesson.startTime);
    const now = new Date();
    const hoursUntilLesson = (lessonStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const hasNotice = hoursUntilLesson > noticeHours;

    const title = t('cancelDialogTitle', { instrument: lesson.instrument });
    const description = t('cancelDialogDesc', {
        date: lessonStartTime.toLocaleDateString(locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar' : locale === 'ru' ? 'ru-RU' : 'en-US'),
        time: lessonStartTime.toLocaleTimeString(locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar' : locale === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    });

    const policyMessage = hasNotice
        ? t('cancelWithNoticePolicy', { hours: String(noticeHours) })
        : t('cancelWithoutNoticePolicy', { hours: String(noticeHours) });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className={`p-4 rounded-md text-sm ${hasNotice ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                    {policyMessage}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('backAction')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onConfirm(hasNotice)} className={!hasNotice ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
                        {hasNotice ? t('cancelWithCredit') : t('cancelAnyway')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
