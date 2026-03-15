'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type TeacherLessonRow = {
  id: string;
  date: string;
  studentName: string;
  instrument: string;
  durationMinutes: number;
  status: string;
};

const HEBREW_EXPORT_HEADERS = ['שם עובד', 'ת.ז.', 'שעות בפועל', 'שעות נוספות', 'היעדרויות', 'הערות'];

const csvEscape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

function downloadCsvRow(row: [string, string, string, string, string, string], filename: string) {
  const bom = '\uFEFF';
  const csv =
    bom +
    [HEBREW_EXPORT_HEADERS, row]
      .map((line) => line.map((cell) => csvEscape(cell)).join(','))
      .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function TeacherPayrollView() {
  const { user, users, lessons: allLessons } = useAuth();
  const t = useTranslations('TeacherPayroll');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const [period, setPeriod] = useState<string>('2026-03');

  const report = useMemo(() => {
    if (!user) {
      return { lessonsCount: 0, totalMinutes: 0, absentCount: 0, lessons: [] as TeacherLessonRow[] };
    }

    const monthStart = new Date(`${period}-01T00:00:00`);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

    const lessons = allLessons
      .filter((lesson) => lesson.teacherId === user.id)
      .filter((lesson) => {
        const when = new Date(lesson.startTime);
        return when >= monthStart && when <= monthEnd;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const completed = lessons.filter((lesson) => lesson.status === 'COMPLETED');
    const totalMinutes = completed.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
    const absentCount = lessons.filter((lesson) => lesson.status === 'CANCELLED_TEACHER' || lesson.status === 'NO_SHOW_TEACHER').length;

    const rows: TeacherLessonRow[] = lessons.map((lesson) => ({
      id: lesson.id,
      date: format(new Date(lesson.startTime), 'dd/MM/yyyy'),
      studentName: users.find((entry) => entry.id === lesson.studentId)?.name || '-',
      instrument: lesson.instrument,
      durationMinutes: lesson.durationMinutes,
      status: lesson.status,
    }));

    return {
      lessonsCount: completed.length,
      totalMinutes,
      absentCount,
      lessons: rows,
    };
  }, [allLessons, period, user, users]);

  const exportMyPayroll = () => {
    if (!user) return;
    const row: [string, string, string, string, string, string] = [
      user.name,
      user.idNumber || '',
      (report.totalMinutes / 60).toFixed(2),
      '0.00',
      String(report.absentCount),
      period,
    ];
    downloadCsvRow(row, `payroll-${user.id}-${period}.csv`);
  };

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">{t('period')}</label>
        <input
          type="month" dir="ltr"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="h-9 rounded-md border bg-background px-3"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-start">{t('myLessons')}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-start">{report.lessonsCount}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-start">{t('myHours')}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-start">{formatMinutes(report.totalMinutes)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('date')}</TableHead>
                <TableHead className="text-start">{t('student')}</TableHead>
                <TableHead className="text-start">{t('instrument')}</TableHead>
                <TableHead className="text-start">{t('duration')}</TableHead>
                <TableHead className="text-start">{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="text-start">{lesson.date}</TableCell>
                  <TableCell className="text-start">{lesson.studentName}</TableCell>
                  <TableCell className="text-start">{lesson.instrument}</TableCell>
                  <TableCell className="text-start">{lesson.durationMinutes} {t('minutes')}</TableCell>
                  <TableCell className="text-start">{t(`lessonStatuses.${lesson.status}`)}</TableCell>
                </TableRow>
              ))}
              {report.lessons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-start text-muted-foreground">{t('noLessons')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={exportMyPayroll}>
        <Download className="h-4 w-4 me-2" />
        {t('downloadMyReport')}
      </Button>
    </div>
  );
}
