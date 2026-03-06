'use client';

import { Fragment, useMemo, useState } from 'react';
import { format, parseISO, startOfWeek, addDays, subDays, isWithinInterval, isValid } from 'date-fns';
import type { Locale } from 'date-fns';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDateLocale } from '@/hooks/use-date-locale';
import { useLocale, useTranslations } from 'next-intl';
import type { LessonSlot } from '@/lib/types';
import { userHasInstrument } from '@/lib/instrument-matching';

const timeSlots = Array.from({ length: 13 }, (_, index) => `${String(index + 8).padStart(2, '0')}:00`);

function colorByInstrument(instrument: string) {
  const normalized = instrument.toLowerCase();
  if (normalized.includes('piano') || normalized.includes('פסנתר')) return 'bg-blue-100 text-blue-900 border-blue-300';
  if (normalized.includes('violin') || normalized.includes('כינור')) return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  if (normalized.includes('drum') || normalized.includes('תופים')) return 'bg-amber-100 text-amber-900 border-amber-300';
  if (normalized.includes('voice') || normalized.includes('שירה')) return 'bg-rose-100 text-rose-900 border-rose-300';
  return 'bg-slate-100 text-slate-900 border-slate-300';
}

function formatWeekRange(weekStart: Date, localeDate: Locale) {
  if (!isValid(weekStart)) return '';
  const weekEnd = addDays(weekStart, 5);
  return `${format(weekStart, 'PPP', { locale: localeDate })} - ${format(weekEnd, 'PPP', { locale: localeDate })}`;
}

export function ScheduleRedesign() {
  const { user, users, lessons, rooms, conservatoriumInstruments } = useAuth();
  const t = useTranslations('AdminPages.schedule');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const dateLocale = useDateLocale();

  const [view, setView] = useState<'week' | 'teacher' | 'instrument' | 'room'>('week');
  const [weekStartRaw, setWeekStartRaw] = useState(format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'));
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [instrumentFilter, setInstrumentFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');

  const goToPrevWeek = () => {
    const parsed = parseISO(`${weekStartRaw}T00:00:00`);
    if (isValid(parsed)) setWeekStartRaw(format(subDays(parsed, 7), 'yyyy-MM-dd'));
  };
  const goToNextWeek = () => {
    const parsed = parseISO(`${weekStartRaw}T00:00:00`);
    if (isValid(parsed)) setWeekStartRaw(format(addDays(parsed, 7), 'yyyy-MM-dd'));
  };

  const allTeachers = useMemo(() => users.filter((entry) => entry.role === 'teacher'), [users]);
  const allInstruments = useMemo(() => {
    const values = Array.from(new Set(lessons.map((lesson) => lesson.instrument))).filter(Boolean);
    return values.sort((a, b) => a.localeCompare(b));
  }, [lessons]);

  const weekStart = useMemo(() => {
    const parsed = parseISO(`${weekStartRaw}T00:00:00`);
    return isValid(parsed) ? parsed : startOfWeek(new Date(), { weekStartsOn: 0 });
  }, [weekStartRaw]);
  const weekEnd = addDays(weekStart, 6);

  const relevantLessons = useMemo(() => {
    if (!user) return [];
    return lessons.filter((lesson) => {
      if (user.role === 'student') return lesson.studentId === user.id;
      if (user.role === 'parent') return user.childIds?.includes(lesson.studentId) || false;
      if (user.role === 'teacher') return lesson.teacherId === user.id;
      return true;
    });
  }, [lessons, user]);

  const filteredLessons = useMemo(() => {
    return relevantLessons
      .filter((lesson) => {
        const lessonDate = new Date(lesson.startTime);
        return isWithinInterval(lessonDate, { start: weekStart, end: weekEnd });
      })
      .filter((lesson) => (teacherFilter === 'all' ? true : lesson.teacherId === teacherFilter))
      .filter((lesson) => userHasInstrument([lesson.instrument], instrumentFilter, conservatoriumInstruments, lesson.conservatoriumId))
      .filter((lesson) => (roomFilter === 'all' ? true : (lesson.roomId || '') === roomFilter))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [conservatoriumInstruments, instrumentFilter, relevantLessons, roomFilter, teacherFilter, weekEnd, weekStart]);

  const weekDays = useMemo(() => Array.from({ length: 6 }, (_, index) => addDays(weekStart, index)), [weekStart]);

  const lessonMeta = (lesson: LessonSlot) => {
    const teacher = users.find((entry) => entry.id === lesson.teacherId)?.name || t('unknown');
    const student = users.find((entry) => entry.id === lesson.studentId)?.name || t('unknown');
    const room = rooms.find((entry) => entry.id === lesson.roomId)?.name || lesson.roomId || t('notAssigned');
    return { teacher, student, room };
  };

  const byTeacher = useMemo(() => {
    const grouped = new Map<string, LessonSlot[]>();
    for (const lesson of filteredLessons) {
      const list = grouped.get(lesson.teacherId) || [];
      list.push(lesson);
      grouped.set(lesson.teacherId, list);
    }
    return grouped;
  }, [filteredLessons]);

  const byInstrument = useMemo(() => {
    const grouped = new Map<string, LessonSlot[]>();
    for (const lesson of filteredLessons) {
      const list = grouped.get(lesson.instrument) || [];
      list.push(lesson);
      grouped.set(lesson.instrument, list);
    }
    return grouped;
  }, [filteredLessons]);

  const byRoom = useMemo(() => {
    const grouped = new Map<string, LessonSlot[]>();
    for (const lesson of filteredLessons) {
      const key = lesson.roomId || t('notAssigned');
      const list = grouped.get(key) || [];
      list.push(lesson);
      grouped.set(key, list);
    }
    return grouped;
  }, [filteredLessons, t]);

  const exportToCsv = () => {
    const lines = [
      ['DateTime', 'Teacher', 'Student', 'Instrument', 'Room', 'Duration'].join(','),
      ...filteredLessons.map((lesson) => {
        const meta = lessonMeta(lesson);
        return [
          new Date(lesson.startTime).toISOString(),
          JSON.stringify(meta.teacher),
          JSON.stringify(meta.student),
          JSON.stringify(lesson.instrument),
          JSON.stringify(meta.room),
          String(lesson.durationMinutes),
        ].join(',');
      }),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `schedule-${weekStartRaw}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <ToggleGroup type="single" value={view} onValueChange={(nextValue) => setView((nextValue || 'week') as typeof view)}>
          <ToggleGroupItem value="week">{t('viewWeek')}</ToggleGroupItem>
          <ToggleGroupItem value="teacher">{t('viewByTeacher')}</ToggleGroupItem>
          <ToggleGroupItem value="instrument">{t('viewByInstrument')}</ToggleGroupItem>
          <ToggleGroupItem value="room">{t('viewByRoom')}</ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={isRtl ? goToNextWeek : goToPrevWeek} aria-label={t('prevWeek')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <label className="text-sm text-muted-foreground px-1">{t('weekLabel')}</label>
          <input type="date" className="h-9 rounded-md border px-3 bg-background" value={weekStartRaw} onChange={(event) => setWeekStartRaw(event.target.value)} />
          <Button variant="outline" size="icon" onClick={isRtl ? goToPrevWeek : goToNextWeek} aria-label={t('nextWeek')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select value={teacherFilter} onValueChange={setTeacherFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('filterTeacher')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTeachers')}</SelectItem>
            {allTeachers.map((teacher) => <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('filterInstrument')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allInstruments')}</SelectItem>
            {allInstruments.map((instrument) => <SelectItem key={instrument} value={instrument}>{instrument}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={roomFilter} onValueChange={setRoomFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('filterRoom')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allRooms')}</SelectItem>
            {rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={exportToCsv}>
          <Download className="h-4 w-4 me-2" />
          {t('export')}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-start">{formatWeekRange(weekStart, dateLocale)}</p>

      {view === 'week' && (
        <Card>
          <CardHeader><CardTitle className="text-start">{t('weeklySchedule')}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="grid grid-cols-[72px_repeat(6,minmax(150px,1fr))] border min-w-[980px]">
              <div className="border-b border-e p-2 text-xs text-muted-foreground">{t('time')}</div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="border-b border-e p-2 text-xs font-semibold text-start">
                  {format(day, 'EEE d/M', { locale: dateLocale })}
                </div>
              ))}

              {timeSlots.map((slot) => (
                <Fragment key={slot}>
                  <div className="border-b border-e p-2 text-xs text-muted-foreground">{slot}</div>
                  {weekDays.map((day) => {
                    const items = filteredLessons.filter((lesson) => {
                      const when = new Date(lesson.startTime);
                      return when.getHours() === Number(slot.split(':')[0]) && format(when, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                    });
                    return (
                      <div key={`${day.toISOString()}-${slot}`} className="border-b border-e p-1 space-y-1 min-h-[68px]">
                        {items.map((lesson) => {
                          const meta = lessonMeta(lesson);
                          return (
                            <div key={lesson.id} className={`rounded border p-1 text-[11px] ${colorByInstrument(lesson.instrument)}`}>
                              <div className="font-semibold truncate">{meta.student}</div>
                              <div className="truncate">{lesson.instrument} · {lesson.durationMinutes}</div>
                              <div className="truncate opacity-80">{meta.teacher}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'teacher' && (
        <div className="space-y-4">
          {Array.from(byTeacher.entries()).map(([teacherId, teacherLessons]) => {
            const teacherName = users.find((entry) => entry.id === teacherId)?.name || t('unknown');
            return (
              <Card key={teacherId}>
                <CardHeader><CardTitle className="text-start">{t('teacherHeading', { teacher: teacherName })}</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <div className="grid grid-cols-[72px_repeat(6,minmax(130px,1fr))] border min-w-[860px]">
                    <div className="border-b border-e p-2 text-xs text-muted-foreground">{t('time')}</div>
                    {weekDays.map((day) => (
                      <div key={day.toISOString()} className="border-b border-e p-2 text-xs font-semibold text-start">
                        {format(day, 'EEE d/M', { locale: dateLocale })}
                      </div>
                    ))}

                    {timeSlots.map((slot) => (
                      <Fragment key={`row-${teacherId}-${slot}`}>
                        <div className="border-b border-e p-2 text-xs text-muted-foreground">{slot}</div>
                        {weekDays.map((day) => {
                          const items = teacherLessons.filter((lesson) => {
                            const when = new Date(lesson.startTime);
                            return when.getHours() === Number(slot.split(':')[0]) && format(when, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                          });
                          return (
                            <div key={`${day.toISOString()}-${slot}`} className="border-b border-e p-1 space-y-1 min-h-[54px]">
                              {items.map((lesson) => {
                                const meta = lessonMeta(lesson);
                                return (
                                  <div key={lesson.id} className={`rounded border p-1 text-[11px] ${colorByInstrument(lesson.instrument)}`}>
                                    <div className="font-semibold truncate">{meta.student}</div>
                                    <div className="truncate">{lesson.instrument} · {lesson.durationMinutes}</div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {byTeacher.size === 0 && <p className="text-sm text-muted-foreground text-start">{t('noLessons')}</p>}
        </div>
      )}

      {view === 'instrument' && (
        <div className="space-y-4">
          {Array.from(byInstrument.entries()).map(([instrument, instrumentLessons]) => (
            <Card key={instrument}>
              <CardHeader><CardTitle className="text-start">{instrument}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {instrumentLessons.map((lesson) => {
                  const meta = lessonMeta(lesson);
                  return (
                    <div key={lesson.id} className="rounded border p-2 text-sm text-start">
                      <div className="font-medium">{format(new Date(lesson.startTime), 'EEE HH:mm', { locale: dateLocale })}</div>
                      <div>{meta.student} · {meta.teacher}</div>
                      <div className="text-muted-foreground">{meta.room}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
          {byInstrument.size === 0 && <p className="text-sm text-muted-foreground text-start">{t('noLessons')}</p>}
        </div>
      )}

      {view === 'room' && (
        <div className="space-y-4">
          {Array.from(byRoom.entries()).map(([roomName, roomLessons]) => (
            <Card key={roomName}>
              <CardHeader><CardTitle className="text-start">{roomName}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {roomLessons.map((lesson) => {
                  const meta = lessonMeta(lesson);
                  return (
                    <div key={lesson.id} className="rounded border p-2 text-sm text-start">
                      <div className="font-medium">{format(new Date(lesson.startTime), 'EEE HH:mm', { locale: dateLocale })}</div>
                      <div>{meta.student} · {lesson.instrument}</div>
                      <div className="text-muted-foreground">{meta.teacher}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
          {byRoom.size === 0 && <p className="text-sm text-muted-foreground text-start">{t('noLessons')}</p>}
        </div>
      )}
    </div>
  );
}
