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

interface CancelLessonDialogProps {
    lesson: LessonSlot | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (withNotice: boolean) => void;
}

export function CancelLessonDialog({ lesson, open, onOpenChange, onConfirm }: CancelLessonDialogProps) {
    if (!lesson) return null;

    const lessonStartTime = new Date(lesson.startTime);
    const now = new Date();
    const hoursUntilLesson = (lessonStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const hasNotice = hoursUntilLesson > 24; // Mock policy

    const title = `ביטול שיעור ${lesson.instrument}`;
    const description = `האם לבטל את השיעור בתאריך ${lessonStartTime.toLocaleDateString('he-IL')} בשעה ${lessonStartTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}?`;

    const policyMessage = hasNotice
        ? "מכיוון שהביטול מתבצע יותר מ-24 שעות לפני השיעור, תזוכה/י בשיעור השלמה."
        : "שימו לב: מכיוון שהביטול מתבצע פחות מ-24 שעות לפני השיעור, לא יינתן זיכוי על פי מדיניות הקונסרבטוריון.";

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
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
                    <AlertDialogCancel>חזרה</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onConfirm(hasNotice)} className={!hasNotice ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
                        {hasNotice ? "כן, בטל וקבל זיכוי" : "כן, בטל בכל זאת"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
