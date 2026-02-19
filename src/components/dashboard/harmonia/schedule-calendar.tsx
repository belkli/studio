'use client';

import React from 'react';
import type { LessonSlot, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

interface ScheduleCalendarProps {
  lessons: LessonSlot[];
}

const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const timeSlots = Array.from({ length: 13 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`); // 08:00 to 20:00

const LessonCard = ({ lesson }: { lesson: LessonSlot }) => {
    const { users, user: currentUser } = useAuth();
    const isTeacher = currentUser?.role === 'teacher';
    const otherUser = isTeacher 
        ? users.find(u => u.id === lesson.studentId)
        : users.find(u => u.id === lesson.teacherId);
    
    return (
        <div className="bg-primary/10 border-r-4 border-primary p-2 rounded-lg text-xs h-full overflow-hidden">
            <p className="font-bold truncate text-primary">{lesson.instrument}</p>
            <p className="truncate text-primary/80">{isTeacher ? otherUser?.name : `עם ${otherUser?.name}`}</p>
            <Badge variant="secondary" className="mt-1 bg-white/50 text-primary">{lesson.isVirtual ? "וירטואלי" : `חדר ${lesson.roomId || '?'}`}</Badge>
        </div>
    )
}

export function ScheduleCalendar({ lessons }: ScheduleCalendarProps) {
  
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
    <Card>
      <CardContent className="p-0">
         <div className="grid grid-cols-[auto_repeat(6,1fr)]">
             <div className="p-2 border-b border-s"></div>
              {days.map((day) => (
                <div key={day} className="text-center font-semibold p-2 border-b border-s text-sm">
                  {day}
                </div>
              ))}

            {timeSlots.map(time => (
                <React.Fragment key={time}>
                    <div className="text-center text-xs text-muted-foreground p-2 border-s h-24 flex items-center justify-center font-mono">
                        {time}
                    </div>
                     {days.map((day, dayIndex) => {
                        const slotLessons = getLessonsForSlot(dayIndex, time);
                        const lesson = slotLessons.length > 0 ? slotLessons[0] : null; // Simple case: take first lesson in slot
                        return (
                             <div key={`${day}-${time}`} className="border-b border-s p-1">
                                {lesson && <LessonCard lesson={lesson} />}
                            </div>
                        )
                    })}
                </React.Fragment>
            ))}
         </div>
      </CardContent>
    </Card>
  );
}
