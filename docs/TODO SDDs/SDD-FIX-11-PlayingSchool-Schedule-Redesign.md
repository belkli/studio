# SDD-FIX-11: Playing School & Schedule Redesign

**PDF Issue:** #14  
**Priority:** P1

---

## 1. Playing School Fixes

### 1.1 Wrong Title
Find `src/app/[locale]/playing-school/page.tsx` or similar. The page title is either hardcoded or using the wrong i18n key. Fix:
```tsx
<h1 className="text-start">{t('PlayingSchool.adminTitle')}</h1>
// Add to messages: "adminTitle": "ניהול בית ספר מנגן"
```

### 1.2 Distribution Not Translated
The "Distribution" section (token distribution / enrollment funnel analytics) renders some labels in English regardless of locale. Audit all labels in the Token Distribution & Analytics component and replace hardcoded English strings with `t()` calls.

---

## 2. Full Schedule Redesign

### Problem
The master schedule has no filters, no teacher view, no instrument view — a busy admin cannot understand who teaches what when.

### 2.1 New Schedule Page Layout

**Route:** `/dashboard/schedule` (existing, redesigned)

**Toolbar:**
```tsx
<div className="flex flex-wrap items-center gap-3 mb-6">
  {/* View selector */}
  <ToggleGroup type="single" value={view} onValueChange={setView}>
    <ToggleGroupItem value="week">{t('Schedule.viewWeek')}</ToggleGroupItem>
    <ToggleGroupItem value="teacher">{t('Schedule.viewByTeacher')}</ToggleGroupItem>
    <ToggleGroupItem value="instrument">{t('Schedule.viewByInstrument')}</ToggleGroupItem>
    <ToggleGroupItem value="room">{t('Schedule.viewByRoom')}</ToggleGroupItem>
  </ToggleGroup>
  
  {/* Filters */}
  <DatePicker value={weekStart} onChange={setWeekStart} label={t('Schedule.week')} />
  <TeacherFilter value={teacherFilter} onChange={setTeacherFilter} />
  <InstrumentFilter value={instrumentFilter} onChange={setInstrumentFilter} />
  <RoomFilter value={roomFilter} onChange={setRoomFilter} />
  
  {/* Actions */}
  <Button variant="outline" onClick={exportToCsv}>
    <Download className="h-4 w-4 me-2" />
    {t('Schedule.export')}
  </Button>
</div>
```

### 2.2 View: By Teacher

```
Teacher: מרים כהן | Week: 3-7 March 2026

         Sun     Mon     Tue     Wed     Thu     Fri
09:00  [Ariel L] [      ] [Dana K] [      ] [Roi M ] [      ]
       Piano45  Piano45         Piano30
09:45  [      ] [Tamar Y][      ] [Yoni B] [      ] [      ]
       ...
```

Each cell shows: student name (truncated) + instrument + duration.
Color coded by instrument.
Click cell → lesson details popover.

### 2.3 View: By Instrument

Groups all lessons by instrument, shows which teacher and room per slot.

### 2.4 View: Week Grid (existing, enhanced)

Add color coding and teacher name display to existing week view.

---

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Playing School admin page loads | Correct Hebrew title displayed |
| 2 | Distribution section viewed in English | All labels in English |
| 3 | Schedule page — filter by teacher | Only that teacher's lessons visible |
| 4 | Schedule "By Teacher" view | Grid shows all teachers' weeks |
| 5 | Schedule "By Instrument" view | Lessons grouped by instrument |
