# SDD-FIX-12: Payroll Module — RTL, Hours Report & CSV Export

**PDF Issue:** #15  
**Priority:** P1

---

## 1. Overview

The payroll module's initial scope (per product decision) is:
- **NOT** full payroll calculation with tax deductions (that's for a future phase, possibly Hilan/Meirav integration).
- **YES** to: hours report per teacher, exportable CSV for the external payroll department.

---

## 2. RTL Fix

Apply standard RTL fixes to `src/app/[locale]/dashboard/teacher/payroll/page.tsx` and admin-facing payroll pages. Use `text-start`, `justify-start`, logical CSS margins.

---

## 3. Hours Report

### 3.1 Admin View — All Teachers

**Route:** `/dashboard/payroll`

```tsx
<div className="space-y-6">
  {/* Period selector */}
  <div className="flex gap-4 items-end">
    <MonthYearPicker value={period} onChange={setPeriod} />
    <Button onClick={generateReport} disabled={isLoading}>
      {isLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      {t('Payroll.generateReport')}
    </Button>
    <Button variant="outline" onClick={exportAllToCsv}>
      <Download className="h-4 w-4 me-2" />
      {t('Payroll.exportAll')}
    </Button>
  </div>
  
  {/* Summary stats */}
  <div className="grid grid-cols-3 gap-4">
    <StatCard title={t('Payroll.totalTeachers')} value={report.teacherCount} />
    <StatCard title={t('Payroll.totalLessons')} value={report.totalLessons} />
    <StatCard title={t('Payroll.totalHours')} value={`${report.totalHours}h`} />
  </div>
  
  {/* Per-teacher table */}
  <DataTable
    columns={[
      { key: 'teacherName', label: t('Payroll.teacher') },
      { key: 'instrument', label: t('Payroll.instrument') },
      { key: 'lessonsCount', label: t('Payroll.lessonsCount') },
      { key: 'totalMinutes', label: t('Payroll.hours'), render: (v) => `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}` },
      { key: 'absentCount', label: t('Payroll.absences') },
      { key: 'makeupCount', label: t('Payroll.makeups') },
      { key: 'actions', render: (_, row) => (
        <Button size="sm" variant="ghost" onClick={() => exportTeacherCsv(row.teacherId)}>
          <Download className="h-4 w-4" />
        </Button>
      )}
    ]}
    data={report.byTeacher}
  />
</div>
```

### 3.2 CSV Export Format

The exported CSV must be compatible with standard Israeli payroll systems:

```
// All-teachers CSV (monthly):
עובד,ת.ז.,שעות בפועל,שעות נוספות,היעדרויות,הערות
מרים כהן,012345678,42.5,2.5,1,שיעורי פסנתר
דוד המלך,023456789,38.0,0,0,שיעורי כינור
...

// Headers (must be exactly):
["teacherName", "nationalId", "actualHours", "overtimeHours", "absences", "notes"]
```

```typescript
function exportPayrollCsv(report: PayrollReport, filename: string): void {
  // Use NodeJS-style Buffer or browser Blob — always UTF-8 with BOM for Excel
  const BOM = '\uFEFF';
  const headers = ['שם עובד', 'ת.ז.', 'שעות בפועל', 'שעות נוספות', 'היעדרויות', 'הערות'];
  
  const rows = report.byTeacher.map(t => [
    t.teacherName,
    t.nationalId,
    (t.totalMinutes / 60).toFixed(2),
    (t.overtimeMinutes / 60).toFixed(2),
    t.absentCount,
    t.notes ?? ''
  ]);
  
  const csv = BOM + [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}
```

### 3.3 Teacher Self-View

**Route:** `/dashboard/teacher/payroll`

Teacher sees only their own data:
```tsx
<div className="space-y-4">
  <MonthYearPicker value={period} onChange={setPeriod} />
  
  <div className="grid grid-cols-2 gap-4">
    <StatCard title={t('Payroll.myLessons')} value={myReport.lessonsCount} />
    <StatCard title={t('Payroll.myHours')} value={`${Math.floor(myReport.totalMinutes/60)}:${String(myReport.totalMinutes%60).padStart(2,'0')}`} />
  </div>
  
  {/* Lesson-by-lesson breakdown */}
  <DataTable
    columns={[
      { key: 'date', label: t('Payroll.date') },
      { key: 'studentName', label: t('Payroll.student') },
      { key: 'instrument', label: t('Payroll.instrument') },
      { key: 'durationMinutes', label: t('Payroll.duration'), render: (v) => `${v} ${t('Common.minutes')}` },
      { key: 'status', label: t('Payroll.status') },
    ]}
    data={myReport.lessons}
  />
  
  <Button variant="outline" onClick={exportMyPayroll}>
    <Download className="h-4 w-4 me-2" />
    {t('Payroll.downloadMyReport')}
  </Button>
</div>
```

---

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Admin opens Payroll in Hebrew | RTL layout, correct alignment |
| 2 | Admin selects March 2026 → Generate | Report shows all teachers' hours for that month |
| 3 | Admin clicks "Export All" | Downloads UTF-8 CSV with BOM, Hebrew headers, all teachers |
| 4 | Admin clicks row-level export for one teacher | Downloads CSV for that teacher only |
| 5 | Teacher opens their payroll view | Only sees their own lessons and hours |
| 6 | CSV opened in Excel | Hebrew text renders correctly (BOM ensures proper encoding) |
