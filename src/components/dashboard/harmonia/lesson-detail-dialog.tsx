'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    MapPin,
    Music,
    User,
    Video,
    AlertCircle,
    Info,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { format } from "date-fns";
import type { LessonSlot, User as UserType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import { useDateLocale } from "@/hooks/use-date-locale";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { StarRating } from "@/components/ui/star-rating";

interface LessonDetailDialogProps {
    lesson: LessonSlot | null;
    otherUser: UserType | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCancelClick: (lesson: LessonSlot) => void;
    onRescheduleClick: (lesson: LessonSlot) => void;
    isTeacher: boolean;
}

export function LessonDetailDialog({
    lesson,
    otherUser,
    open,
    onOpenChange,
    onCancelClick,
    onRescheduleClick,
    isTeacher
}: LessonDetailDialogProps) {
    const t = useTranslations('LessonManagement');
    const dateLocale = useDateLocale();
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const { submitTeacherRating } = useAuth();
    const { toast } = useToast();
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    if (!lesson) return null;

    const typeMap: Record<string, any> = {
        'RECURRING': { label: t('typeRecurring'), color: 'bg-blue-100 text-blue-700 border-blue-200' },
        'MAKEUP': { label: t('typeMakeup'), color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
        'TRIAL': { label: t('typeTrial'), color: 'bg-green-100 text-green-700 border-green-200' },
        'ADHOC': { label: t('typeAdhoc'), color: 'bg-orange-100 text-orange-700 border-orange-200' },
        'GROUP': { label: t('typeGroup'), color: 'bg-teal-100 text-teal-700 border-teal-200' },
    };

    const statusMap: Record<string, any> = {
        'SCHEDULED': { label: t('statusScheduled'), icon: Clock, color: 'text-blue-600' },
        'COMPLETED': { label: t('statusCompleted'), icon: CheckCircle2, color: 'text-green-600' },
        'CANCELLED_STUDENT_NOTICED': { label: t('statusCancelledStudentNotified'), icon: XCircle, color: 'text-red-600' },
        'CANCELLED_STUDENT_NO_NOTICE': { label: t('statusCancelledStudentNoNotice'), icon: XCircle, color: 'text-red-700' },
        'CANCELLED_TEACHER': { label: t('statusCancelledTeacher'), icon: XCircle, color: 'text-red-600' },
        'CANCELLED_CONSERVATORIUM': { label: t('statusCancelledConservatorium'), icon: XCircle, color: 'text-red-600' },
        'NO_SHOW_STUDENT': { label: t('statusNoShowStudent'), icon: AlertCircle, color: 'text-orange-600' },
        'NO_SHOW_TEACHER': { label: t('statusNoShowTeacher'), icon: AlertCircle, color: 'text-orange-600' },
    };

    const typeInfo = typeMap[lesson.type] || typeMap['RECURRING'];
    const statusInfo = statusMap[lesson.status] || statusMap['SCHEDULED'];
    const StatusIcon = statusInfo.icon;
    const startTime = new Date(lesson.startTime);
    const isPast = startTime < new Date();
    const isCancelled = lesson.status.startsWith('CANCELLED') || lesson.status.startsWith('NO_SHOW');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]" dir={isRtl ? 'rtl' : 'ltr'}>
                <DialogHeader className="text-start">
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={cn("font-medium", typeInfo.color)}>
                            {typeInfo.label}
                        </Badge>
                        <div className={cn("flex items-center gap-1 text-sm font-medium", statusInfo.color)}>
                            <StatusIcon className="h-4 w-4" />
                            {statusInfo.label}
                        </div>
                    </div>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Music className="h-5 w-5 text-muted-foreground" />
                        {t('instrumentLesson', { instrument: lesson.instrument })}
                    </DialogTitle>
                    <DialogDescription className="text-start">
                        {t('fullLessonDetails')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-muted p-2 rounded-full">
                            <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">{isTeacher ? t('studentLabel') : t('teacherLabel')}</p>
                            <p className="font-medium">{otherUser?.name || t('notFound')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-muted p-2 rounded-full">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">{t('dateLabel')}</p>
                            <p className="font-medium">{format(startTime, 'EEEE, d MMMM yyyy', { locale: dateLocale })}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-muted p-2 rounded-full">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">{t('timeAndDuration')}</p>
                            <p className="font-medium">
                                {format(startTime, 'HH:mm')} {t('durationMinutesStr', { durationMinutes: lesson.durationMinutes })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-muted p-2 rounded-full">
                            {lesson.isVirtual ? <Video className="h-4 w-4 text-muted-foreground" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">{t('locationLabel')}</p>
                            <p className="font-medium">
                                {lesson.isVirtual ? (
                                    <a href={lesson.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                        {t('virtualLessonLink')}
                                    </a>
                                ) : (
                                    lesson.roomId ? t('roomSet', { roomId: lesson.roomId }) : t('roomNotSet')
                                )}
                            </p>
                        </div>
                    </div>

                    {lesson.teacherNote && (
                        <div className="bg-muted/50 p-3 rounded-lg mt-2 border border-muted">
                            <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground font-semibold">
                                <Info className="h-3 w-3" />
                                {t('teacherNotes')}
                            </div>
                            <p className="text-sm italic">&quot;{lesson.teacherNote}&quot;</p>
                        </div>
                    )}
                </div>

                {/* Rate lesson — shown for completed lessons viewed by student */}
                {lesson.status === 'COMPLETED' && !isTeacher && !lesson.studentRating && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                        {ratingSubmitted ? (
                            <p className="text-sm text-amber-700 font-medium text-center">{t('ratingThanks')}</p>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-amber-700 mb-2">{t('rateLesson')}</p>
                                <div className="flex items-center gap-3">
                                    <StarRating
                                        value={ratingValue}
                                        onChange={setRatingValue}
                                        size="lg"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={ratingValue === 0}
                                        onClick={() => {
                                            submitTeacherRating(
                                                lesson.teacherId,
                                                ratingValue as 1|2|3|4|5,
                                                ''
                                            );
                                            setRatingSubmitted(true);
                                            toast({ title: t('ratingThanks') });
                                        }}
                                    >
                                        {t('submitRating')}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <DialogFooter className="flex flex-row-reverse sm:justify-start gap-2 pt-2">
                    {!isPast && !isCancelled && (
                        <>
                            <Button variant="default" className="flex-1" onClick={() => onRescheduleClick(lesson)}>
                                {t('rescheduleAction')}
                            </Button>
                            <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" onClick={() => onCancelClick(lesson)}>
                                {t('cancelLessonAction')}
                            </Button>
                        </>
                    )}
                    <Button variant="secondary" className={cn((isPast || isCancelled) ? "w-full" : "hidden sm:inline-flex")} onClick={() => onOpenChange(false)}>
                        {t('closeAction')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
