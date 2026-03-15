'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { vatBreakdown, VAT_RATE } from '@/lib/vat';
import { tenantFilter, tenantUsers } from '@/lib/tenant-filter';

type TeacherMonthlyRow = {
  teacherId: string;
  teacherName: string;
  nationalId: string;
  instrument: string;
  lessonsCount: number;
  totalMinutes: number;
  overtimeMinutes: number;
  absentCount: number;
  makeupCount: number;
  notes: string;
  ratePerHour?: number;  // ILS per hour
};

type PayrollReport = {
  teacherCount: number;
  totalLessons: number;
  totalHours: number;
  byTeacher: TeacherMonthlyRow[];
};

const HEBREW_EXPORT_HEADERS = [
  'שם מורה', 'ת.ז.', 'מספר שיעורים', 'שעות בפועל', 'תעריף לשעה',
  'סכום לפני מע"מ', 'שיעור מע"מ', 'מע"מ', 'סה"כ כולל מע"מ',
  'שעות נוספות', 'היעדרויות', 'הערות',
];

const _toMonthValue = (date: Date) => format(date, 'yyyy-MM');

const csvEscape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

function downloadPayrollCsv(rows: TeacherMonthlyRow[], filename: string) {
  const bom = '\uFEFF';
  const csvRows = rows.map((row) => {
    const totalHours = row.totalMinutes / 60;
    const rate = row.ratePerHour ?? 0;
    const subtotal = Math.round(totalHours * rate);
    const { vat, total } = vatBreakdown(subtotal);
    return [
      row.teacherName,
      row.nationalId,
      String(row.lessonsCount),
      totalHours.toFixed(2),
      rate > 0 ? String(rate) : '',
      rate > 0 ? String(subtotal) : '',
      rate > 0 ? `${Math.round(VAT_RATE * 100)}%` : '',
      rate > 0 ? String(vat) : '',
      rate > 0 ? String(total) : '',
      (row.overtimeMinutes / 60).toFixed(2),
      String(row.absentCount),
      row.notes,
    ];
  });

  const csv =
    bom +
    [HEBREW_EXPORT_HEADERS, ...csvRows]
      .map((row) => row.map((cell) => csvEscape(cell)).join(','))
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

export function AdminPayrollPanel() {
  const { user, users, lessons, conservatoriums } = useAuth();
  const t = useTranslations('Payroll');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const isSiteAdmin = user?.role === 'site_admin';
  const [period, setPeriod] = useState<string>('2026-03');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConsId, setSelectedConsId] = useState<string>(user?.conservatoriumId ?? '');

  // For site_admin: act as if we are scoped to selectedConsId; for others: own conservatorium
  const effectiveConsId = isSiteAdmin ? selectedConsId : (user?.conservatoriumId ?? '');

  const report = useMemo<PayrollReport>(() => {
    const monthStart = new Date(`${period}-01T00:00:00`);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

    const teachers = effectiveConsId
      ? users.filter(u => u.role === 'teacher' && u.conservatoriumId === effectiveConsId)
      : (user ? tenantUsers(users, user, 'teacher') : []);

    const scopedLessons = effectiveConsId
      ? lessons.filter(l => l.conservatoriumId === effectiveConsId)
      : (user ? tenantFilter(lessons, user) : lessons);
    const byTeacher = teachers.map((teacher) => {
      const teacherLessons = scopedLessons.filter((lesson) => {
        const when = new Date(lesson.startTime);
        return lesson.teacherId === teacher.id && when >= monthStart && when <= monthEnd;
      });

      const completed = teacherLessons.filter((lesson) => lesson.status === 'COMPLETED');
      const totalMinutes = completed.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
      const overtimeMinutes = Math.max(0, totalMinutes - 2400);
      const absentCount = teacherLessons.filter((lesson) => lesson.status === 'CANCELLED_TEACHER' || lesson.status === 'NO_SHOW_TEACHER').length;
      const makeupCount = completed.filter((lesson) => lesson.type === 'MAKEUP').length;
      const instrument = Array.from(new Set(teacherLessons.map((lesson) => lesson.instrument))).join(', ');

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        nationalId: teacher.idNumber || '',
        instrument,
        lessonsCount: completed.length,
        totalMinutes,
        overtimeMinutes,
        absentCount,
        makeupCount,
        notes: instrument,
      } satisfies TeacherMonthlyRow;
    });

    const totalLessons = byTeacher.reduce((sum, row) => sum + row.lessonsCount, 0);
    const totalMinutes = byTeacher.reduce((sum, row) => sum + row.totalMinutes, 0);

    return {
      teacherCount: byTeacher.length,
      totalLessons,
      totalHours: Number((totalMinutes / 60).toFixed(2)),
      byTeacher,
    };
  }, [lessons, period, users, user, effectiveConsId]);

  const generateReport = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setIsLoading(false);
  };

  const exportAllToCsv = () => {
    downloadPayrollCsv(report.byTeacher, `payroll-${period}.csv`);
  };

  const exportTeacherCsv = (teacherId: string) => {
    const row = report.byTeacher.find((entry) => entry.teacherId === teacherId);
    if (!row) return;
    downloadPayrollCsv([row], `payroll-${teacherId}-${period}.csv`);
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-end gap-4">
        {isSiteAdmin && (
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">{t('conservatorium')}</label>
            <Select value={selectedConsId} onValueChange={setSelectedConsId} dir={isRtl ? 'rtl' : 'ltr'}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={t('allConservatoriums')} />
              </SelectTrigger>
              <SelectContent>
                {conservatoriums.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">{t('period')}</label>
          <input
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="h-9 rounded-md border bg-background px-3"
            dir="ltr"
          />
          {period && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(period + '-01').toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        <Button onClick={generateReport} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <RefreshCw className="h-4 w-4 me-2" />}
          {t('generateReport')}
        </Button>

        <Button variant="outline" onClick={exportAllToCsv}>
          <Download className="h-4 w-4 me-2" />
          {t('exportAll')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-start">{t('totalTeachers')}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-start">{report.teacherCount}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-start">{t('totalLessons')}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-start">{report.totalLessons}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-start">{t('totalHours')}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-start">{report.totalHours} {t('hours')}</CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('teacher')}</TableHead>
                <TableHead className="text-start">{t('instrument')}</TableHead>
                <TableHead className="text-start">{t('lessonsCount')}</TableHead>
                <TableHead className="text-start">{t('hours')}</TableHead>
                <TableHead className="text-start">{t('absences')}</TableHead>
                <TableHead className="text-start">{t('makeups')}</TableHead>
                <TableHead className="text-start">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byTeacher.map((row) => (
                <TableRow key={row.teacherId}>
                  <TableCell className="text-start">{row.teacherName}</TableCell>
                  <TableCell className="text-start">{row.instrument || '-'}</TableCell>
                  <TableCell className="text-start">{row.lessonsCount}</TableCell>
                  <TableCell className="text-start">{formatMinutes(row.totalMinutes)}</TableCell>
                  <TableCell className="text-start">{row.absentCount}</TableCell>
                  <TableCell className="text-start">{row.makeupCount}</TableCell>
                  <TableCell className="text-start">
                    <Button size="sm" variant="ghost" onClick={() => exportTeacherCsv(row.teacherId)} aria-label={t('exportTeacher')}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
