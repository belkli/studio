# Master Schedule Navigation -- Day/Week/Month Views and Mobile

**Date:** 2026-03-15
**Status:** Spec Draft
**Owner:** PM + UX-UA + Architect
**SDD refs:** SDD-04 Section 7, SDD-FIX-11

---

## 1. Problem Statement

The master schedule at `/dashboard/master-schedule` is the admin's primary tool for seeing all lessons across all teachers and rooms. Currently:

1. **Single view only:** No day/week/month toggle. Admin sees a week view but cannot zoom in (day) or zoom out (month).
2. **No filtering:** All teachers shown at once. In a conservatorium with 50+ teachers, this is overwhelming.
3. **No mobile experience:** The wide calendar grid is unusable on phones. Admin cannot check schedule on the go.
4. **No room view:** Schedule is teacher-centric only. No way to see "what's happening in Room 3 today."
5. **No quick actions:** Cannot create/move/cancel lessons from the schedule view.

---

## 2. User Stories

### US-1: Admin views daily schedule
**As a** conservatorium admin,
**I want to** see all lessons for a single day in a clean timeline,
**so that** I can manage today's operations (room assignments, substitutes, visitor appointments).

### US-2: Admin views weekly schedule
**As a** conservatorium admin,
**I want to** see a week overview with all teachers' lessons,
**so that** I can spot scheduling gaps and capacity issues.

### US-3: Admin views monthly schedule
**As a** conservatorium admin,
**I want to** see a month overview showing lesson density per day,
**so that** I can plan ahead for busy periods, holidays, and events.

### US-4: Admin filters by teacher
**As a** conservatorium admin,
**I want to** filter the schedule to show only one teacher's lessons,
**so that** I can quickly check a specific teacher's availability.

### US-5: Admin filters by room
**As a** conservatorium admin,
**I want to** see the schedule from a room perspective,
**so that** I can manage room utilization and resolve double-bookings.

### US-6: Admin filters by instrument
**As a** conservatorium admin,
**I want to** filter by instrument to see all piano lessons (or violin, etc.),
**so that** I can coordinate instrument-specific scheduling.

### US-7: Admin uses schedule on mobile
**As a** conservatorium admin using my phone,
**I want to** see today's schedule in a compact list view,
**so that** I can check scheduling info while walking between rooms.

### US-8: Admin creates a lesson from the schedule
**As a** conservatorium admin,
**I want to** click an empty slot and create a new lesson directly,
**so that** I can fill gaps without navigating to a separate booking page.

### US-9: Teacher views their own schedule
**As a** teacher,
**I want to** see my weekly schedule with student names, times, and rooms,
**so that** I know where I need to be and when.

### US-10: Admin exports schedule
**As a** conservatorium admin,
**I want to** export the schedule as PDF or CSV,
**so that** I can print it for the reception desk or send it to teachers.

---

## 3. Proposed Design

### 3.1 View Modes

| View | Desktop Layout | Mobile Layout | Primary Use |
|------|---------------|---------------|-------------|
| **Day** | Time-grid (7:00-22:00) with teacher columns | Flat list sorted by time | "What's happening today" |
| **Week** | 7-column grid (Sun-Sat) with time rows | Day-by-day list (swipeable) | Weekly planning |
| **Month** | 30/31 day grid with lesson count dots | Calendar grid with tap-to-expand | Monthly overview |

### 3.2 Toolbar Layout

```
+------------------------------------------------------------------+
| Master Schedule                                  [Day|Week|Month] |
|                                                                    |
| [< Prev] [Today] [Next >]   March 15, 2026                      |
|                                                                    |
| Filters: [Teacher v] [Room v] [Instrument v] [Status v]          |
|          [Clear filters]                        [Export PDF] [CSV]|
+------------------------------------------------------------------+
```

### 3.3 Day View

Desktop:
```
         | Miriam Cohen (Piano) | David Levy (Violin) | Sarah A. (Cello) |
08:00    |                      |                      |                   |
08:30    | Yael S. (Piano)      |                      |                   |
09:00    | ^^^^^^^^^ 45min      | Noam L. (Violin)     |                   |
09:30    |                      | ^^^^^^^^^ 30min      | Group Lesson      |
10:00    | Ari K. (Piano)       |                      | ^^^^^^^^^ 60min   |
10:30    | ^^^^^^^^^ 45min      | [empty - available]  |                   |
```

Each lesson block shows:
- Student name
- Instrument (if multi-instrument teacher)
- Duration
- Room number
- Status indicator (color: blue=scheduled, green=completed, red=cancelled, orange=makeup)

Empty slots for teachers with availability show a dashed outline with "+" button for quick booking.

### 3.4 Week View

Desktop: Standard 7-column grid (Sun-Sat for Israel) with time rows (30-min increments). Condensed lesson blocks show student initial + instrument icon.

Mobile: Show one day at a time with swipe gesture to move between days. Day header shows date and lesson count.

### 3.5 Month View

Desktop: Calendar grid with colored dots for lesson density (light = few, dark = many). Click a day to expand to day view.

Mobile: Same calendar grid but tappable. Tap a day to see that day's list below the calendar.

### 3.6 Filter System

| Filter | Options | Default |
|--------|---------|---------|
| Teacher | All teachers (searchable dropdown) | All |
| Room | All rooms | All |
| Instrument | All instruments (from conservatorium's instrument list) | All |
| Status | All / Scheduled / Completed / Cancelled | All |
| Lesson Type | Recurring / Makeup / Trial / Ad-hoc / Group | All |

Filters are composable (AND logic). Active filters show as chips below the toolbar. URL params store filter state for bookmarkability: `/dashboard/master-schedule?view=day&date=2026-03-15&teacher=teacher-user-1`.

### 3.7 Quick Actions (from schedule)

Right-click (desktop) or long-press (mobile) a lesson block:
- **View details** -> opens lesson detail panel
- **Reschedule** -> opens reschedule dialog
- **Cancel** -> opens cancel confirmation with reason input
- **Mark as complete** -> marks attendance
- **Assign room** -> room picker dropdown

Click an empty slot (where teacher has availability):
- Opens a quick-book dialog: pre-filled with teacher, date, time. Select student + duration.

---

## 4. Acceptance Criteria

### AC-1: Day view shows all lessons
- **Given** an admin opens the master schedule on Day view for March 15
- **When** the page loads
- **Then** all lessons for March 15 are shown in a time-grid with teacher columns
- **And** empty available slots are visible as dashed outlines

### AC-2: Week view with navigation
- **Given** an admin on the Week view
- **When** they click "Next"
- **Then** the view moves to the next week
- **And** the URL updates to reflect the new date

### AC-3: Month view with density
- **Given** an admin on Month view
- **When** they look at the calendar
- **Then** each day shows colored dots indicating lesson count (e.g., 12 lessons = dark dot)
- **And** clicking a day navigates to Day view for that date

### AC-4: Teacher filter
- **Given** an admin viewing the week schedule
- **When** they select "Miriam Cohen" in the teacher filter
- **Then** only Miriam's lessons are shown
- **And** other teacher columns disappear (Day view) or other lessons are hidden (Week view)

### AC-5: Room filter
- **Given** an admin who selects "Room 3" in the room filter
- **When** the filter is applied
- **Then** only lessons in Room 3 are shown
- **And** the view title updates to "Room 3 - March 15"

### AC-6: Mobile day view
- **Given** an admin on a 375px-wide mobile device
- **When** they open the master schedule
- **Then** the default view is Day (not Week)
- **And** lessons are shown as a flat list sorted by time
- **And** each lesson card shows: time, teacher, student, instrument, room

### AC-7: Quick-book from empty slot
- **Given** an admin viewing Day view with an empty 10:30 slot for David Levy
- **When** they click the "+" button on the empty slot
- **Then** a quick-book dialog opens pre-filled with teacher: David Levy, date: March 15, time: 10:30
- **And** they can select a student and duration to create the lesson

### AC-8: Export schedule
- **Given** an admin viewing the week schedule with filters applied
- **When** they click "Export PDF"
- **Then** a PDF is generated showing the current view (filtered) with conservatorium letterhead

### AC-9: Today button
- **Given** an admin who has navigated to a date 3 weeks in the future
- **When** they click "Today"
- **Then** the view jumps back to the current date

### AC-10: URL persistence
- **Given** an admin viewing Day view for March 20 with teacher filter = Miriam
- **When** they refresh the page
- **Then** the same view, date, and filters are restored from URL params

---

## 5. State Machine (View Navigation)

```
DAY_VIEW
  |-- click "Week" tab --> WEEK_VIEW (same week containing current day)
  |-- click "Month" tab --> MONTH_VIEW (same month)
  |-- click "Next" --> DAY_VIEW (next day)
  |-- click "Prev" --> DAY_VIEW (previous day)

WEEK_VIEW
  |-- click "Day" tab --> DAY_VIEW (Monday of current week)
  |-- click "Month" tab --> MONTH_VIEW (same month)
  |-- click "Next" --> WEEK_VIEW (next week)
  |-- click "Prev" --> WEEK_VIEW (previous week)
  |-- click a specific day --> DAY_VIEW (that day)

MONTH_VIEW
  |-- click "Day" tab --> DAY_VIEW (1st of month)
  |-- click "Week" tab --> WEEK_VIEW (1st week of month)
  |-- click "Next" --> MONTH_VIEW (next month)
  |-- click "Prev" --> MONTH_VIEW (previous month)
  |-- click a day cell --> DAY_VIEW (that day)
```

---

## 6. Edge Cases

| Edge Case | Handling |
|-----------|---------|
| Conservatorium has 50+ teachers | Day view: horizontal scroll with sticky time column. Teacher columns are virtualized. |
| No lessons on a day | Show "No lessons scheduled" empty state with link to create one |
| Holiday/closure day | Day cell in month view shows "Closed" badge. Day view shows closure banner. |
| Overlapping lessons (double-booking) | Show both lessons with a red warning overlay. Click for conflict details. |
| Teacher teaches at two branches | Show branch name on each lesson block. Filter by branch. |
| Very early/late lessons (6am or 10pm) | Time grid starts at the earliest lesson time for that day (min 7:00, max 22:00). Auto-adjusts. |
| RTL layout | Week columns go right-to-left (Sunday on the right for Hebrew). Navigation arrows swap. |
| Admin is also a teacher | Schedule shows all teachers by default (admin view). "My schedule" toggle filters to just their lessons. |
| Group lessons | Group lesson block shows all enrolled students (expandable) |
| Virtual lessons | Lesson block shows a camera icon and "Join" link if within 15 min of start |

---

## 7. v1 vs v2

### v1 (ship now)
- Day view (time-grid, teacher columns on desktop, flat list on mobile)
- Week view (7-column grid on desktop, day-by-day swipe on mobile)
- Basic filters: teacher, room, instrument
- Navigation: prev/next/today
- URL param persistence
- Color-coded status (scheduled/completed/cancelled/makeup)
- "Today" button
- Mobile: auto-default to Day view on small screens

### v2 (future)
- Month view with density dots
- Quick-book from empty slots
- Drag-and-drop lesson rescheduling (desktop only)
- Export PDF/CSV
- Room occupancy heatmap
- Capacity dashboard (teacher utilization %)
- Conflict detection and resolution
- Zoom/Google Meet join button for virtual lessons
- Attendance marking from schedule
- Multi-branch toggle

---

## 8. Technical Notes (for Architect)

### Routing
- `/dashboard/master-schedule?view=day|week|month&date=YYYY-MM-DD&teacher=X&room=Y&instrument=Z`
- Default: `view=week` on desktop, `view=day` on mobile (detect via `useMediaQuery`)

### Data requirements
- Lessons for the visible date range (e.g., 7 days for week view)
- Teacher availability templates (to compute empty slots)
- Room list
- Holiday/closure dates

### Performance
- Week view: max ~350 lesson slots (50 teachers * 7 days). Should render in <500ms.
- Month view: only counts per day needed (not full lesson data). Lightweight query.
- Day view: ~50 lessons max. No performance concern.
- Consider virtual scrolling for teacher columns if >20 teachers visible.

### RTL
- Week starts on Sunday (Israel standard)
- In RTL locales: day columns go right-to-left
- Navigation arrows: "Next" arrow points left in RTL, right in LTR
- Use `ms-` / `me-` for all spacing (already established pattern)

---

## 9. Security Considerations

- Tenant isolation: all schedule data filtered by conservatoriumId
- Teacher view: can only see their own lessons (no other teachers' students visible)
- Parent/student view: not applicable -- master schedule is admin-only
- Delegated admin: only sees lessons for their delegated section permissions
- Export: PDF/CSV includes conservatorium watermark, no student PII in exported filenames

---

## UX & Accessibility Addendum (UX-UA Agent)

### D1. View Toggle Decision: Day + Week for v1 (No Month)

Agree with PM's US-3 for month view, but recommend deferring to v2. Rationale:
- Month view with 50+ teachers is a density visualization problem, not a schedule management problem
- The existing PM wireframe for month shows "lesson count dots" -- this is analytics, not schedule management
- Day + Week cover the admin's core workflow: "What is happening today/this week?"
- Month view adds significant implementation complexity for a secondary use case

**v1 deliverable:** `ToggleGroup` with Day | Week. Month is hidden/disabled.

### D2. Detailed Mobile Wireframe (375px) — Day View

```
+------------------------------------+
| Master Schedule                    |
| Sun 10 Mar 2026                    |
+------------------------------------+
| [<] [Today] [>]       [Filters v] |
+------------------------------------+
| 08:00                              |
| +--------------------------------+ |
| | Yael Cohen -- Piano            | |
| | T: Miriam K. | Room B          | |
| | [Scheduled]         08:00-08:45| |
| +--------------------------------+ |
|                                    |
| 09:00                              |
| +--------------------------------+ |
| | Noa Stern -- Guitar            | |
| | T: David L. | Room A           | |
| | [Completed]         09:00-09:45| |
| +--------------------------------+ |
| +--------------------------------+ |
| | Dan Levy -- Violin             | |
| | T: Sarah B. | Room C           | |
| | [Cancelled]         09:00-09:30| |
| +--------------------------------+ |
|                                    |
| 10:00                              |
| (no lessons)                       |
+------------------------------------+
```

**Mobile design rules:**
- Auto-detect mobile via CSS `md:` breakpoint (not JavaScript)
- Default to Day view on <768px
- Lesson cards are full-width `Card` components with status color accent (`border-s-4`)
- Time headers are sticky (`sticky top-0 bg-background`)
- No horizontal grid (unlike desktop)
- "Filters" button opens `Sheet` from bottom

### D3. Mobile Filter Sheet

```
+------------------------------------+
| Filters                      [X]  |
+------------------------------------+
| Branch:     [Hod HaSharon v]      |
| Teacher:    [All v]               |
| Room:       [All v]               |
| Instrument: [Piano v]             |
|                                    |
| Active: 2 filters                  |
| [Clear all]          [Apply]       |
+------------------------------------+
```

- Uses `Sheet` side="bottom" on mobile
- "Active: N filters" text shows count of non-default selections
- "Apply" closes sheet and updates URL params

### D4. Desktop Day View — Room-Column Layout

```
+----------------------------------------------------------------------+
|       | Room A        | Room B        | Room C        | Unassigned   |
|-------+---------------+---------------+---------------+--------------|
| 08:00 |               | Yael Cohen    |               |              |
|       |               | Piano         |               |              |
|       |               | T: Miriam K.  |               |              |
|-------+---------------+---------------+---------------+--------------|
| 09:00 | Noa Stern     |               | Dan Levy      |              |
|       | Guitar        |               | Violin        |              |
|       | T: David L.   |               | T: Sarah B.   |              |
|-------+---------------+---------------+---------------+--------------|
```

- Columns = rooms (filtered by branch if branch filter is active)
- "Unassigned" column for lessons without a room
- If room filter is active, only that room's column is shown
- Teacher name shown per lesson (unlike PM's design which has teacher columns — rooms are more useful for admin's space management)

### D5. Status Color Coding

| Status | Tile Color | Border Accent | Mobile Card |
|--------|-----------|---------------|-------------|
| SCHEDULED | `bg-blue-50` | `border-e-2 border-blue-400` | `border-s-4 border-blue-400` |
| COMPLETED | `bg-green-50` | `border-e-2 border-green-400` | `border-s-4 border-green-400` |
| CANCELLED_* | `bg-gray-100` | `border-e-2 border-gray-400 italic` | `border-s-4 border-gray-400` |
| NO_SHOW_* | `bg-red-50` | `border-e-2 border-red-400` | `border-s-4 border-red-400` |
| MAKEUP | `bg-amber-50` | `border-e-2 border-amber-400` | `border-s-4 border-amber-400` |

**Legend bar** (desktop only, hidden on mobile):
```
[blue dot] Scheduled  [green dot] Completed  [gray dot] Cancelled  [red dot] No-show  [amber dot] Makeup
```

### D6. Day Summary Bar (desktop only)

```
| Mon 12 | Tue 8 | Wed 15 | Thu 10 | Fri 6 | Sat 0 | Sun 14 |
```

- Shows lesson count per day of the current week
- Clickable: clicking a day switches to Day view for that date
- Current day highlighted: `bg-primary/10 font-bold rounded`
- Hidden on mobile (<768px) -- insufficient space

### D7. Date Navigation Controls

Desktop:
```
[< prev] [Today] [15 Mar 2026 v] [next >]    [Day | Week]
```

Mobile:
```
[<] [Today] [>]                    [Filters v]
```

- "Today" button: `Button variant="outline"`, always visible
- Date label on desktop: clickable, opens `Popover` with `Calendar` component
- Date label on mobile: non-clickable text (date picker too cramped for 375px)
- View toggle: `ToggleGroup` with "Day" and "Week"

### D8. Empty States

Week view empty:
```
+------------------------------------------+
|     (Calendar icon, large)               |
|                                          |
|    No lessons this week                  |
|    Try adjusting your filters or         |
|    navigate to a different date.         |
|                                          |
|    [Go to today]                         |
+------------------------------------------+
```

Day view empty:
```
+------------------------------------------+
|     (Calendar icon, large)               |
|                                          |
|    No lessons today                      |
|    Check other days or adjust your       |
|    filters.                              |
|                                          |
|    [Go to today]                         |
+------------------------------------------+
```

Uses `EmptyState` component (existing).

### D9. RTL Behavior (Detailed)

- **Week grid column order:** Sunday-Saturday in both LTR and RTL (calendar convention). In RTL, the grid itself mirrors via `dir="rtl"` so Sunday appears on the right.
- **Navigation arrows:** already handled (`isRtl` swaps ArrowLeft/ArrowRight)
- **Filter dropdowns:** each `Select` gets `dir={isRtl ? 'rtl' : 'ltr'}`
- **Lesson tiles:** `text-start`, `border-e-2` (end-side accent adapts to direction)
- **Mobile cards:** `text-start` throughout, `border-s-4` (start-side accent)
- **Day summary bar:** grid auto-mirrors in RTL
- **Date format:** locale-aware via `date-fns` + `dateLocale`
- **Time column:** `font-mono`, numbers do not reverse

### D10. Loading States

- **Initial:** filter bar skeleton (4 rectangles) + grid skeleton (shimmer cells matching the grid layout)
- **Filter change:** instant re-render (all data is client-side from `useAuth().lessons`)
- **Week/day navigation:** instant (no API call, just date arithmetic)
- **No full-page skeleton on navigation** (data is pre-loaded)

### D11. Security-Driven UX Constraints (Data Minimization)

**SEC-CONSTRAINT-3: Per-role data display rules.**

The master schedule page is admin-only. However, if the codebase later exposes a schedule view to other roles, the following rules apply:

| Role | What they see in schedule tiles |
|------|-------------------------------|
| **Admin / Site Admin** | Full student name, full teacher name, instrument, room, status |
| **Teacher** | Student **first name + last initial** only (e.g., "Yael C." not "Yael Cohen"). Only their own lessons are visible. |
| **Student** | Only their own lessons. No other students visible. |
| **Parent** | Only their children's lessons. No other students visible. |

**Implementation:** The lesson tile component must accept a `nameDisplayMode` prop:
- `'full'` -- admin view, shows full name
- `'abbreviated'` -- teacher view, shows first name + last initial
- `'own'` -- student/parent view, shows "My lesson" or child's first name

The `aria-label` on lesson tiles must also use the abbreviated form for teacher view (no full student name in screen reader output).

**Route guard:** The `/dashboard/master-schedule` route must verify `user.role` is `conservatorium_admin`, `delegated_admin`, or `site_admin`. Teachers, students, and parents must not be able to access this URL. They have their own `/dashboard/schedule` route.

### D12. Accessibility

- **View toggle:** `ToggleGroup` with `aria-label={t('viewToggle')}`
- **Today indicator:** `aria-current="date"` on today's column header
- **Lesson tiles:** each has `role="button"` + `aria-label` with context appropriate to the viewer's role:
  Admin: `aria-label={t('lessonAria', { student, teacher, time, instrument, status })}`
  Teacher: `aria-label={t('lessonAriaAbbrev', { student: 'Yael C.', time, instrument, status })}`
- **Navigation buttons:** `aria-label` on prev/next/today
- **Keyboard navigation:** Tab through filters, then grid. Arrow keys to move between days/times. Enter to open lesson detail.
- **Color legend:** text + color (not color-only distinction)
- **Screen reader for summary:** `aria-label={t('daySummary', { day, count })}` per badge
- **Mobile filter sheet:** focus trapped when open, Escape to close
- **High contrast:** all status colors meet WCAG AA contrast against white background

### D12. URL Search Params Schema

```
?view=week|day
&date=2026-03-15           (ISO date)
&branch=all|<branchId>
&teacher=all|<teacherId>
&room=all|<roomId>
&instrument=all|<name>
```

All optional. Defaults: `view=week` (desktop) / `day` (mobile), `date=today`, all filters = `all`.

Sync pattern:
```tsx
const searchParams = useSearchParams();
const router = useRouter();
const updateParam = (key: string, value: string) => {
  const params = new URLSearchParams(searchParams.toString());
  if (value === 'all' || !value) params.delete(key);
  else params.set(key, value);
  router.replace(`?${params.toString()}`, { scroll: false });
};
```

### D13. i18n String Keys (New in `AdminPages.schedule`)

- `viewDay`, `viewWeek`, `viewToggle`
- `today`, `datePicker`, `dayViewTitle`
- `lessonCount`, `noLessonsDay`, `noLessonsWeek`
- `emptyFilterHint`, `goToToday`
- `legendTitle`, `statusScheduled`, `statusCompleted`, `statusCancelled`, `statusNoShow`, `statusMakeup`
- `filtersButton`, `filtersActive`, `clearFilters`, `applyFilters`
- `summaryLabel`, `roomLabel`, `unassignedRoom`
- `lessonAria`, `daySummary`

### D14. Component Mapping

| UI Element | shadcn Component | Notes |
|-----------|---------|-------|
| Week grid | CSS grid `grid-cols-[auto_repeat(7,1fr)]` | Existing, keep |
| Day grid (desktop) | CSS grid `grid-cols-[auto_repeat(N,1fr)]` | New, N = rooms |
| Day list (mobile) | Vertical `Card` list | New |
| View toggle | `ToggleGroup` | Day/Week |
| Date picker | `Popover` + `Calendar` | Desktop only |
| Today button | `Button` variant="outline" | New |
| Filters (desktop) | 4x `Select` inline | Existing, add URL sync |
| Filters (mobile) | `Sheet` side="bottom" | New |
| Legend bar | Inline `Badge` list | New, desktop only |
| Summary bar | Clickable badge row | New, desktop only |
| Lesson tile (week) | Custom div + status colors | Existing, add color variants |
| Lesson card (mobile) | `Card` + `border-s-4` accent | New |
| Empty state | `EmptyState` | Existing component |

---

## UI/UX Pro Max Review (Main Session)

**Design System Applied:** Data-Dense Dashboard · Lyriosa palette · shadcn/ui

### UX Quality Checklist

| Check | Status |
|---|---|
| 44px min touch targets on all day/week toggle buttons | ⚠️ enforce `min-h-[44px]` on `ToggleGroup` items |
| `cursor-pointer` on lesson tiles | ⚠️ add to all clickable tiles |
| Skeleton loader while fetching schedule data | ⚠️ missing — add `<Skeleton>` grid placeholder |
| `prefers-reduced-motion` on view transitions | ⚠️ add `motion-reduce:transition-none` |
| `transition-colors duration-150` on lesson tile hover | ⚠️ specify in component spec |
| `aria-label` on prev/next navigation buttons | ✅ in spec |
| Keyboard navigation between time slots | ⚠️ add `tabIndex={0}` + `onKeyDown` to lesson tiles |
| Color not sole indicator of status | ⚠️ add status icon alongside color (COMPLETED: ✓, CANCELLED: ×) |

### Greenfield Design: Room-Column Day View (PREFERRED over teacher-column)

The UX-UA agent correctly chose room-column as the admin's primary mental model. Reinforcing with precise layout spec:

```
Desktop Day View (room-column grid):
┌─────────┬──────────────┬──────────────┬──────────────┐
│  Time   │   Room 1     │   Room 2     │   Room 3     │
├─────────┼──────────────┼──────────────┼──────────────┤
│  08:00  │              │              │              │
│  08:30  │ ┌──────────┐ │              │              │
│  09:00  │ │Violin    │ │ ┌──────────┐ │              │
│  09:30  │ │A. Cohen  │ │ │Piano     │ │              │
│  10:00  │ │SCHEDULED │ │ │M. Levi   │ │              │
│  10:30  │ └──────────┘ │ └──────────┘ │ ┌──────────┐ │
│  11:00  │              │              │ │Guitar    │ │
└─────────┴──────────────┴──────────────┴──────────────┘
```

- Lesson tile height = proportional to duration (30min = 1 row, 45min = 1.5 rows, 60min = 2 rows)
- Tile uses `border-s-4` with status color, white background, instrument + teacher name
- Empty cell: subtle `hover:bg-muted/30 cursor-pointer` — clicking opens quick-book dialog (v2)
- Time column: sticky `position: sticky; left: 0` (LTR) / `right: 0` (RTL)

### View Toggle: `ToggleGroup` not `Tabs`

Use `<ToggleGroup type="single">` (shadcn) for Day/Week toggle — `Tabs` implies different content areas, `ToggleGroup` implies same content with different zoom level. Correct semantics matter for screen readers.

```tsx
<ToggleGroup type="single" value={view} onValueChange={setView} 
  className="rounded-lg border" dir={isRtl ? 'rtl' : 'ltr'}>
  <ToggleGroupItem value="day" className="min-h-[44px] px-4">{t('dayView')}</ToggleGroupItem>
  <ToggleGroupItem value="week" className="min-h-[44px] px-4">{t('weekView')}</ToggleGroupItem>
</ToggleGroup>
```

### Status Color + Icon (accessibility fix)

Don't rely on color alone. Add micro-icons alongside the `border-s-4` color accent:

| Status | Color | Icon | Tailwind |
|---|---|---|---|
| SCHEDULED | `border-blue-500` | `Clock` 12px | `text-blue-600` |
| COMPLETED | `border-green-500` | `CheckCircle` 12px | `text-green-600` |
| CANCELLED_* | `border-gray-400` | `X` 12px | `text-gray-500` |
| NO_SHOW_* | `border-red-500` | `AlertCircle` 12px | `text-red-600` |
| MAKEUP | `border-amber-500` | `RefreshCw` 12px | `text-amber-600` |

### Skeleton Loader (missing from spec)

While fetching schedule data, show a grid skeleton:
```tsx
// Day view skeleton
Array.from({ length: 8 }).map((_, i) => (
  <div key={i} className="grid grid-cols-4 gap-2 p-2">
    <Skeleton className="h-4 w-12" /> {/* time */}
    {[1,2,3].map(j => <Skeleton key={j} className="h-16 w-full rounded-md" />)}
  </div>
))
```

### Mobile Lesson Card (375px) — Enhanced

The UX-UA wireframe is correct. Add these refinements:
- `min-h-[72px]` on each card (comfortable touch target with room for instrument + teacher + time)
- Long-press on mobile = context menu (cancel, reschedule) — defer to v2 but spec it now
- Swipe-to-dismiss pattern: NOT recommended (too easy to accidentally cancel lessons)

### URL Schema Validation

Confirm URL params schema (already in spec D12 but adding types):
```
/dashboard/master-schedule?view=day&date=2026-03-15&teacher=teacher-user-1&room=room-1
```
- `view`: `'day' | 'week'` — default `'week'` on desktop, `'day'` on mobile (detected via `useMediaQuery`)
- `date`: ISO 8601 date string — default today
- `teacher`: userId or `'all'` — default `'all'`
- `room`: roomId or `'all'` — default `'all'`
