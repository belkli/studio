'use client';

import React, { useState } from 'react';
import type { LessonSlot, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { CancelLessonDialog } from './cancel-lesson-dialog';
import { cn } from '@/lib/utils';

interface ScheduleCalendarProps {
  lessons: LessonSlot[];
}

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const timeSlots = Array.from({ length: 13 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`); // 08:00 to 20:00

const LessonCard = ({ lesson, onCancelClick, onRescheduleClick }: { lesson: LessonSlot; onCancelClick: () => void; onRescheduleClick: () => void; }) => {
    const { users, user: currentUser } = useAuth();
    const { toast } = useToast();
    const isTeacher = currentUser?.role === 'teacher';
    
    const otherUser = users.find(u => u.id === (isTeacher ? lesson.studentId : lesson.teacherId));
    
    const isPast = new Date(lesson.startTime) < new Date();
    const isCancelled = lesson.status.startsWith('CANCELLED') || lesson.status.startsWith('NO_SHOW');

    if (isCancelled) {
        return (
            <div className="bg-gray-100 border-r-4 border-gray-400 p-2 rounded-lg text-xs h-full overflow-hidden text-gray-500 italic">
                <p className="font-bold truncate">בוטל</p>
                <p className="truncate">{lesson.instrument}</p>
                <p className="truncate text-gray-400">{isTeacher ? otherUser?.name : `עם ${otherUser?.name}`}</p>
            </div>
        )
    }

    return (
        <div className={cn(
            "p-2 rounded-lg text-xs h-full overflow-hidden flex flex-col justify-between",
            lesson.status === 'COMPLETED' || isPast
                ? 'bg-gray-100 border-r-4 border-gray-300 text-gray-500' 
                : 'bg-primary/10 border-r-4 border-primary text-primary'
        )}>
            <div>
                <p className={cn("font-bold truncate", lesson.status !== 'COMPLETED' && !isPast && "text-primary")}>{lesson.instrument}</p>
                <p className={cn("truncate", lesson.status !== 'COMPLETED' && !isPast ? "text-primary/80" : "text-gray-400")}>{isTeacher ? otherUser?.name : `עם ${otherUser?.name}`}</p>
                <Badge variant="secondary" className="mt-1 bg-white/50 text-primary">{lesson.isVirtual ? "וירטואלי" : `חדר ${lesson.roomId || '?'}`}</Badge>
            </div>
            
            {lesson.status === 'SCHEDULED' && !isPast && !isTeacher && (
                <div className="flex gap-1 mt-2">
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={onRescheduleClick} disabled>
                        שינוי מועד
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onCancelClick}>
                        ביטול
                    </Button>
                </div>
            )}
        </div>
    )
}

export function ScheduleCalendar({ lessons }: ScheduleCalendarProps) {
  const [lessonToCancel, setLessonToCancel] = useState<LessonSlot | null>(null);
  const { cancelLesson } = useAuth();
  const { toast } = useToast();

  const handleConfirmCancel = () => {
    if (lessonToCancel) {
        cancelLesson(lessonToCancel.id);
        toast({ title: "השיעור בוטל" });
        setLessonToCancel(null);
    }
  }
  
  const getLessonsForSlot = (dayIndex: number, time: string) => {
    const slotStartHour = parseInt(time.split(':')[0]);
    const dayToMatch = (dayIndex + 0) % 7; // Sunday is 0, Monday is 1... in JS Date
    
    return lessons.filter(lesson => {
        const lessonDate = new Date(lesson.startTime);
        const lessonDay = lessonDate.getDay();
        const lessonHour = lessonDate.getHours();
        return lessonDay === dayToMatch && lessonHour === slotStartHour;
    });
  }

  return (
    <>
    <Card>
      <CardContent className="p-0">
         <div className="grid grid-cols-[auto_repeat(6,1fr)] min-w-[800px] overflow-x-auto">
             <div className="p-2 border-b border-s"></div>
              {days.map((day) => (
                <div key={day} className="text-center font-semibold p-2 border-b border-s text-sm">
                  {day}
                </div>
              ))}

            {timeSlots.map(time => (
                <React.Fragment key={time}>
                    <div className="text-center text-xs text-muted-foreground p-2 border-s h-32 flex items-center justify-center font-mono">
                        {time}
                    </div>
                     {days.map((day, dayIndex) => {
                        const slotLessons = getLessonsForSlot(dayIndex, time);
                        const lesson = slotLessons.length > 0 ? slotLessons[0] : null; // Simple case: take first lesson in slot
                        return (
                             <div key={`${day}-${time}`} className="border-b border-s p-1">
                                {lesson && (
                                    <LessonCard 
                                        lesson={lesson} 
                                        onCancelClick={() => setLessonToCancel(lesson)}
                                        onRescheduleClick={() => toast({ title: "בקרוב...", description: "אפשרות לשינוי מועד תהיה זמינה בעתיד."})}
                                    />
                                )}
                            </div>
                        )
                    })}
                </React.Fragment>
            ))}
         </div>
      </CardContent>
    </Card>
    <CancelLessonDialog 
        lesson={lessonToCancel}
        open={!!lessonToCancel}
        onOpenChange={(open) => !open && setLessonToCancel(null)}
        onConfirm={handleConfirmCancel}
    />
    </>
  );
}
