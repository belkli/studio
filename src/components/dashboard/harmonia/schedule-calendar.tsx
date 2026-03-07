
'use client';

import React, { useState, useMemo } from 'react';
import type { LessonSlot, User } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { CancelLessonDialog } from './cancel-lesson-dialog';
import { RescheduleLessonDialog } from './reschedule-lesson-dialog';
import { cn } from '@/lib/utils';
import { LessonDetailDialog } from './lesson-detail-dialog';
import { addDays, startOfWeek, endOfWeek, format, eachDayOfInterval, isSameDay } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface ScheduleCalendarProps {
    lessons: LessonSlot[];
}

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const timeSlots = Array.from({ length: 13 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`); // 08:00 to 20:00

const typeColorMap = {
    'RECURRING': 'border-blue-400 bg-blue-50 text-blue-800',
    'MAKEUP': 'border-indigo-400 bg-indigo-50 text-indigo-800',
    'TRIAL': 'border-green-400 bg-green-50 text-green-800',
    'ADHOC': 'border-orange-400 bg-orange-50 text-orange-800',
    'GROUP': 'border-teal-400 bg-teal-50 text-teal-800',
};

const LessonCard = ({ lesson, onClick }: { lesson: LessonSlot; onClick: () => void; }) => {
    const { users, user: currentUser } = useAuth();
    const isTeacher = currentUser?.role === 'teacher';
    const otherUser = users.find(u => u.id === (isTeacher ? lesson.studentId : lesson.teacherId));

    const isPast = new Date(lesson.startTime) < new Date();
    const isCancelled = lesson.status.startsWith('CANCELLED') || lesson.status.startsWith('NO_SHOW');

    if (isCancelled) {
        return (
            <div
                className="bg-gray-100 border-e-4 border-gray-400 p-2 rounded-lg text-xs h-full overflow-hidden text-gray-500 italic cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={onClick}
            >
                <p className="font-bold truncate">בוטל</p>
                <p className="truncate">{lesson.instrument}</p>
                <p className="truncate text-gray-400">{isTeacher ? otherUser?.name : `עם ${otherUser?.name}`}</p>
            </div>
        )
    }

    const typeClasses = typeColorMap[lesson.type] || typeColorMap['RECURRING'];

    return (
        <div
            className={cn(
                "p-2 rounded-lg text-xs h-full overflow-hidden flex flex-col justify-between cursor-pointer transition-all hover:shadow-md",
                lesson.status === 'COMPLETED' || isPast
                    ? 'bg-gray-100 border-e-4 border-gray-300 text-gray-500'
                    : cn('border-e-4', typeClasses)
            )}
            onClick={onClick}
        >
            <div>
                <p className={cn("font-bold truncate", lesson.status !== 'COMPLETED' && !isPast && "text-inherit")}>{lesson.instrument}</p>
                <p className={cn("truncate opacity-80")}>{isTeacher ? otherUser?.name : `עם ${otherUser?.name}`}</p>
                <Badge variant="secondary" className="mt-1 bg-white/50 text-inherit text-[10px] py-0 h-4 border-none">{lesson.isVirtual ? "וירטואלי" : `חדר ${lesson.roomId || '?'}`}</Badge>
            </div>
        </div>
    )
}

export function ScheduleCalendar({ lessons }: ScheduleCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedLesson, setSelectedLesson] = useState<LessonSlot | null>(null);
    const [lessonToCancel, setLessonToCancel] = useState<LessonSlot | null>(null);
    const [lessonToReschedule, setLessonToReschedule] = useState<LessonSlot | null>(null);

    const { user, users, cancelLesson, rescheduleLesson } = useAuth();
    const dateLocale = useDateLocale();
    const { toast } = useToast();
    const isTeacher = user?.role === 'teacher';

    const weekInterval = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 0 });
        const end = endOfWeek(currentDate, { weekStartsOn: 0 });
        return { start, end };
    }, [currentDate]);

    const daysOfWeek = useMemo(() => eachDayOfInterval(weekInterval), [weekInterval]);

    const handleWeekChange = (direction: 'next' | 'prev') => {
        setCurrentDate(current => addDays(current, direction === 'next' ? 7 : -7));
    };

    const handleConfirmCancel = (withNotice: boolean) => {
        if (lessonToCancel) {
            cancelLesson(lessonToCancel.id, withNotice);
            toast({ title: "השיעור בוטל", description: withNotice ? "זיכוי לשיעור השלמה נוסף לחשבונך." : "לא ניתן זיכוי על פי מדיניות הביטולים." });
            setLessonToCancel(null);
            setSelectedLesson(null);
        }
    }

    const handleConfirmReschedule = (newStartTime: string) => {
        if (lessonToReschedule) {
            rescheduleLesson(lessonToReschedule.id, newStartTime);
            setLessonToReschedule(null);
            setSelectedLesson(null);
        }
    }

    const getLessonsForSlot = (day: Date, time: string) => {
        const slotStartHour = parseInt(time.split(':')[0]);

        return lessons.filter(lesson => {
            const lessonDate = new Date(lesson.startTime);
            return isSameDay(lessonDate, day) && lessonDate.getHours() === slotStartHour;
        });
    }

    const selectedOtherUser = useMemo(() => {
        if (!selectedLesson) return null;
        return users.find(u => u.id === (isTeacher ? selectedLesson.studentId : selectedLesson.teacherId)) || null;
    }, [selectedLesson, users, isTeacher]);

    return (
        <>
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleWeekChange('prev')} className="h-8 w-8">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            <div className="flex flex-col items-center min-w-[140px]">
                                <span className="font-bold text-sm">
                                    {format(weekInterval.start, 'd בMMM')} - {format(weekInterval.end, 'd בMMM')}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {format(weekInterval.end, 'yyyy')}
                                </span>
                            </div>
                            <Button variant="outline" size="icon" onClick={() => handleWeekChange('next')} className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8 text-xs font-medium">
                            היום
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 border rounded-xl overflow-x-auto bg-card shadow-sm">
                    <div className="grid grid-cols-[60px_repeat(6,1fr)] min-w-[800px]">
                        <div className="p-2 border-b border-s bg-muted/30"></div>
                        {daysOfWeek.slice(0, 6).map((day: Date) => (
                            <div key={day.toISOString()} className="text-center p-3 border-b border-s bg-muted/30">
                                <div className="font-bold text-sm mb-0.5">{format(day, 'EEEE', { locale: dateLocale })}</div>
                                <div className="text-[10px] text-muted-foreground font-medium">{format(day, 'd/M')}</div>
                            </div>
                        ))}

                        {timeSlots.map(time => (
                            <React.Fragment key={time}>
                                <div className="text-center text-[10px] text-muted-foreground p-2 border-s h-28 flex items-center justify-center font-mono font-bold bg-muted/10">
                                    {time}
                                </div>
                                {daysOfWeek.slice(0, 6).map((day: Date, dayIndex: number) => {
                                    const slotLessons = getLessonsForSlot(day, time);
                                    return (
                                        <div key={`${dayIndex}-${time}`} className="border-b border-s p-1 relative group min-h-[112px]">
                                            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none" />
                                            {slotLessons.map(lesson => (
                                                <LessonCard
                                                    key={lesson.id}
                                                    lesson={lesson}
                                                    onClick={() => setSelectedLesson(lesson)}
                                                />
                                            ))}
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <LessonDetailDialog
                lesson={selectedLesson}
                otherUser={selectedOtherUser}
                open={!!selectedLesson}
                onOpenChange={(open) => !open && setSelectedLesson(null)}
                onCancelClick={(l) => setLessonToCancel(l)}
                onRescheduleClick={(l) => setLessonToReschedule(l)}
                isTeacher={isTeacher || false}
            />
            <CancelLessonDialog
                lesson={lessonToCancel}
                open={!!lessonToCancel}
                onOpenChange={(open) => !open && setLessonToCancel(null)}
                onConfirm={handleConfirmCancel}
            />
            <RescheduleLessonDialog
                lesson={lessonToReschedule}
                open={!!lessonToReschedule}
                onOpenChange={(open) => !open && setLessonToReschedule(null)}
                onConfirm={handleConfirmReschedule}
            />
        </>
    );
}
