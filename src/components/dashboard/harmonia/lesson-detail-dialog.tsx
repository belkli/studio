'use client';

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
import { he } from "date-fns/locale";
import type { LessonSlot, User as UserType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LessonDetailDialogProps {
    lesson: LessonSlot | null;
    otherUser: UserType | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCancelClick: (lesson: LessonSlot) => void;
    onRescheduleClick: (lesson: LessonSlot) => void;
    isTeacher: boolean;
}

const typeMap = {
    'RECURRING': { label: 'שיעור קבוע', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'MAKEUP': { label: 'שיעור השלמה', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    'TRIAL': { label: 'שיעור ניסיון', color: 'bg-green-100 text-green-700 border-green-200' },
    'ADHOC': { label: 'שיעור חד-פעמי', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    'GROUP': { label: 'שיעור קבוצתי', color: 'bg-teal-100 text-teal-700 border-teal-200' },
};

const statusMap = {
    'SCHEDULED': { label: 'מתוזמן', icon: Clock, color: 'text-blue-600' },
    'COMPLETED': { label: 'בוצע', icon: CheckCircle2, color: 'text-green-600' },
    'CANCELLED_STUDENT_NOTICED': { label: 'בוטל (בהודעה)', icon: XCircle, color: 'text-red-600' },
    'CANCELLED_STUDENT_NO_NOTICE': { label: 'בוטל (ללא הודעה)', icon: XCircle, color: 'text-red-700' },
    'CANCELLED_TEACHER': { label: 'בוטל ע"י מורה', icon: XCircle, color: 'text-red-600' },
    'CANCELLED_CONSERVATORIUM': { label: 'בוטל ע"י קונסרבטוריון', icon: XCircle, color: 'text-red-600' },
    'NO_SHOW_STUDENT': { label: 'תלמיד לא הגיע', icon: AlertCircle, color: 'text-orange-600' },
    'NO_SHOW_TEACHER': { label: 'מורה לא הגיע', icon: AlertCircle, color: 'text-orange-600' },
};

export function LessonDetailDialog({
    lesson,
    otherUser,
    open,
    onOpenChange,
    onCancelClick,
    onRescheduleClick,
    isTeacher
}: LessonDetailDialogProps) {
    if (!lesson) return null;

    const typeInfo = typeMap[lesson.type] || typeMap['RECURRING'];
    const statusInfo = statusMap[lesson.status] || statusMap['SCHEDULED'];
    const StatusIcon = statusInfo.icon;
    const startTime = new Date(lesson.startTime);
    const isPast = startTime < new Date();
    const isCancelled = lesson.status.startsWith('CANCELLED') || lesson.status.startsWith('NO_SHOW');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader className="text-right">
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
                        שיעור {lesson.instrument}
                    </DialogTitle>
                    <DialogDescription className="text-right">
                        פרטי השיעור המלאים
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-muted p-2 rounded-full">
                            <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">{isTeacher ? "תלמיד/ה" : "מורה"}</p>
                            <p className="font-medium">{otherUser?.name || "לא נמצא"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-muted p-2 rounded-full">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">תאריך</p>
                            <p className="font-medium">{format(startTime, 'EEEE, d בMMMM yyyy', { locale: he })}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-muted p-2 rounded-full">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">זמן ומשך</p>
                            <p className="font-medium">
                                {format(startTime, 'HH:mm')} ({lesson.durationMinutes} דקות)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-muted p-2 rounded-full">
                            {lesson.isVirtual ? <Video className="h-4 w-4 text-muted-foreground" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">מיקום</p>
                            <p className="font-medium">
                                {lesson.isVirtual ? (
                                    <a href={lesson.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                        קישור לשיעור וירטואלי
                                    </a>
                                ) : (
                                    `חדר ${lesson.roomId || 'לא נקבע'}`
                                )}
                            </p>
                        </div>
                    </div>

                    {lesson.teacherNote && (
                        <div className="bg-muted/50 p-3 rounded-lg mt-2 border border-muted">
                            <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground font-semibold">
                                <Info className="h-3 w-3" />
                                הערות מורה
                            </div>
                            <p className="text-sm italic">"{lesson.teacherNote}"</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex flex-row-reverse sm:justify-start gap-2 pt-2">
                    {!isPast && !isCancelled && (
                        <>
                            <Button variant="default" className="flex-1" onClick={() => onRescheduleClick(lesson)}>
                                שינוי מועד
                            </Button>
                            <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" onClick={() => onCancelClick(lesson)}>
                                ביטול שיעור
                            </Button>
                        </>
                    )}
                    <Button variant="secondary" className={cn((isPast || isCancelled) ? "w-full" : "hidden sm:inline-flex")} onClick={() => onOpenChange(false)}>
                        סגור
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
