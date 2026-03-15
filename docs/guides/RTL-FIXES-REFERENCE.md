# RTL Fixes Reference -- Lyriosa

> Last updated: 2026-03-15
> Covers the full RTL/i18n sweep performed across 10 commits on 2026-03-15.

---

## Why RTL Issues Keep Recurring

RTL (right-to-left) bugs are the most persistent class of UI regression in Lyriosa. The root causes are:

1. **New components added without RTL awareness.** Developers write components in LTR first and forget to add `dir` attributes, logical CSS properties, and locale detection.

2. **Shared UI primitives with hardcoded `dir="rtl"`.** The `table.tsx` and `combobox.tsx` shared components had `dir="rtl"` baked in, which broke LTR locales (English, Russian) and masked the absence of proper `dir` handling on consumer pages.

3. **Radix UI components require explicit `dir`.** The `<Tabs>`, `<Select>`, `<DropdownMenuContent>`, and `<Command>` primitives from Radix/shadcn do not inherit `dir` from the DOM tree -- they need it passed as a prop on the **primitive component** (not on child wrappers).

4. **Browser-native inputs are language-independent.** `<input type="date">`, `<input type="time">`, `<input type="month">`, and `<input type="number">` render browser-native widgets that always use LTR layout. Without `dir="ltr"`, they render backwards in RTL pages.

5. **Physical CSS properties instead of logical ones.** Tailwind classes like `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right` produce fixed-direction spacing that breaks when the page direction flips.

6. **Arabic locale forgotten.** Many components checked `locale === 'he'` but not `locale === 'ar'`, so Arabic pages rendered in LTR.

7. **Hardcoded Hebrew strings.** Components with Hebrew literals (`"ביטול"`, `"טוען..."`, `"השיעור בוטל"`) render gibberish in EN/RU locales and make i18n impossible.

8. **Enum values rendered directly.** Status codes like `PENDING_TEACHER`, `RECITAL`, `BOOKING_CONFIRMED` displayed as raw English strings instead of being mapped through `useTranslations()`.

---

## Mandatory RTL Rules (from CLAUDE.md)

These are the exact rules enforced project-wide. Every PR must comply.

### RTL Layout
- Every page-level root container: `<div dir={isRtl ? 'rtl' : 'ltr'}>` where `isRtl = locale === 'he' || locale === 'ar'`
- `<Tabs dir={isRtl ? 'rtl' : 'ltr'}>` -- `dir` goes on the Tabs PRIMITIVE, NEVER on `<TabsList>`
- All `<TableHead>` elements: must have `className="text-start"`
- All `<TableCell>` displaying labels: must have `className="text-start"`
- `<DropdownMenuContent align="end">` in all tables and toolbars
- Use logical CSS: `ms-`/`me-` not `ml-`/`mr-`, `ps-`/`pe-` not `pl-`/`pr-`, `text-start`/`text-end` not `text-left`/`text-right`

### i18n
- Date formatting: `toLocaleDateString(locale)` -- never hardcode locale, never call without locale arg
- Currency: always use the shekel symbol -- never `ILS`
- Enum values: NEVER render directly to users -- always use `useTranslations()` to get display label
- Mock data primary language is Hebrew -- all `type`, `displayName`, `instrument`, `name` fields in data.ts must be Hebrew strings

### Charts (Recharts)
- Pie/Donut charts with Hebrew labels: NEVER use inline `label` prop on `<Pie>` -- Hebrew text overflows slice boundaries
- Always use `<Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />` inside `<PieChart>` instead

### Date Pickers
- `<input type="month">` and native date pickers: always `dir="ltr"` (browser-native, language-independent)
- Add a Hebrew display label alongside the input: `new Date(value + '-01').toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })`
- react-day-picker / Calendar: RTL swap IconLeft/IconRight via `components` prop -- do NOT wrap in `<div dir="ltr">`

---

## Common RTL Violations and How to Fix Them

### 1. Missing `dir` on Tabs Primitive

**Problem:** Tabs render LTR even in Hebrew/Arabic. The selected-tab indicator slides in the wrong direction.

**Fix:**
```tsx
const locale = useLocale();
const isRtl = locale === 'he' || locale === 'ar';

<Tabs dir={isRtl ? 'rtl' : 'ltr'} defaultValue="tab1">
  <TabsList>  {/* NO dir here */}
    <TabsTrigger value="tab1">...</TabsTrigger>
  </TabsList>
</Tabs>
```

**Files fixed (across commits `c2484df`, `6f0467b`, `aa2e8f8`):**
- `src/components/dashboard/harmonia/book-lesson-wizard.tsx`
- `src/components/dashboard/harmonia/event-edit-form.tsx`
- `src/components/dashboard/harmonia/instrument-rental-dashboard.tsx`
- `src/components/dashboard/harmonia/ministry-inbox-panel.tsx`
- `src/components/dashboard/harmonia/open-day-admin-dashboard.tsx`
- `src/components/dashboard/harmonia/performance-booking-dashboard.tsx`
- `src/app/[locale]/dashboard/users/page.tsx`

---

### 2. Missing `dir="ltr"` on Native Inputs

**Problem:** `<input type="date|time|month|number">` renders browser-native widgets that display incorrectly in RTL. Numbers appear reversed, date pickers flip the wrong way.

**Fix:**
```tsx
<Input type="date" dir="ltr" {...field} />
<Input type="time" dir="ltr" {...field} />
<Input type="number" dir="ltr" {...field} />
<Input type="month" dir="ltr" {...field} />
```

**Files fixed (commit `aa2e8f8` primarily, `9d3ff75` for payroll):**
- `src/app/[locale]/dashboard/admin/scholarships/page.tsx` -- number inputs
- `src/app/[locale]/dashboard/settings/conservatorium/profile/page.tsx` -- time + number inputs
- `src/app/[locale]/dashboard/settings/packages/page.tsx` -- number inputs
- `src/app/[locale]/dashboard/teacher/student/[id]/page.tsx` -- number input
- `src/app/[locale]/dashboard/users/page.tsx` -- number + time inputs
- `src/components/dashboard/harmonia/admin-makeup-dashboard.tsx` -- number input
- `src/components/dashboard/harmonia/cancellation-policy-settings.tsx` -- 3 number inputs
- `src/components/dashboard/harmonia/event-edit-form.tsx` -- date + time + number inputs
- `src/components/dashboard/harmonia/event-form.tsx` -- date + time + number inputs
- `src/components/dashboard/harmonia/instrument-rental-dashboard.tsx` -- date + number inputs (6 instances)
- `src/components/dashboard/harmonia/notification-preferences.tsx` -- time inputs
- `src/components/dashboard/harmonia/practice-log-form.tsx` -- date input
- `src/components/dashboard/harmonia/pricing-settings.tsx` -- number inputs
- `src/components/dashboard/harmonia/room-management-dialog.tsx` -- time input
- `src/components/dashboard/harmonia/schedule-redesign.tsx` -- date input
- `src/components/dashboard/harmonia/school-partnership-dashboard.tsx` -- date inputs
- `src/components/dashboard/harmonia/sound-check-scheduler.tsx` -- date input
- `src/components/dashboard/harmonia/student-practice-panel.tsx` -- date input
- `src/components/dashboard/harmonia/teacher-payroll-view.tsx` -- month input
- `src/components/dashboard/harmonia/admin-payroll-panel.tsx` -- month input (commit `9d3ff75`)

---

### 3. Hardcoded `text-left`/`text-right` Instead of `text-start`/`text-end`

**Problem:** `text-left` aligns text to the left regardless of direction. In RTL, labels in table cells or form fields end up on the wrong side.

**Fix:**
```tsx
// Before
<TableHead className="text-left">Name</TableHead>
<Input className="text-left" />

// After
<TableHead className="text-start">Name</TableHead>
<Input className="text-start" />
```

**Files fixed (commits `6f0467b`, `aa2e8f8`):**
- `src/components/dashboard/harmonia/age-upgrade-modal.tsx` -- `text-left` to `text-start`
- `src/components/dashboard/harmonia/manage-payment-method-dialog.tsx` -- 3x `text-left` to `text-start`
- `src/components/dashboard/harmonia/pricing-settings.tsx` -- 6x `text-[var(--text-align)]` to `text-start` on TableHead
- `src/components/dashboard/forms-list.tsx` -- 5x `text-start` added to TableHead + TableCell
- Plus every `<TableHead>` across 90+ components in the big sweep

---

### 4. Missing `align="end"` on DropdownMenuContent

**Problem:** Dropdown menus for table row actions open on the wrong side in RTL. The menu overflows outside the visible area.

**Fix:**
```tsx
<DropdownMenuContent align="end">
  <DropdownMenuItem>...</DropdownMenuItem>
</DropdownMenuContent>
```

**Files fixed (commit `6f0467b`):**
- `src/components/dashboard/harmonia/admin-waitlist-dashboard.tsx`
- `src/components/dashboard/harmonia/events-list.tsx`
- `src/components/dashboard/harmonia/student-billing-dashboard.tsx`
- `src/components/dashboard/harmonia/performance-booking-dashboard.tsx`
- And all other table components with action menus

---

### 5. Hardcoded `ml-`/`mr-`/`pl-`/`pr-` Instead of `ms-`/`me-`/`ps-`/`pe-`

**Problem:** `ml-2` always adds margin on the left. In RTL, the margin should be on the right.

**Fix:**
```tsx
// Before
<span className="ml-2">...</span>
<div className="pl-4">...</div>

// After
<span className="ms-2">...</span>
<div className="ps-4">...</div>
```

**Files fixed (commit `6f0467b`):**
- `src/components/dashboard/harmonia/reschedule-lesson-dialog.tsx` -- `space-x-reverse` to `gap-3`
- `src/components/dashboard/harmonia/schedule-calendar.tsx` -- icon margins
- `src/components/dashboard/harmonia/practice-coach.tsx`
- `src/components/dashboard/harmonia/multimedia-feedback-card.tsx`
- `src/components/dashboard/harmonia/playing-school-child-card.tsx`
- Many more across the 90+ component sweep (margin/padding classes)

---

### 6. Hardcoded `dir="rtl"` in Shared UI Components

**Problem:** `table.tsx` had `dir="rtl"` hardcoded on the `<table>` element. `combobox.tsx` had `dir="rtl"` on `PopoverContent` and `Command`, plus a hardcoded Hebrew loading message. This broke every page for EN/RU locales.

**Root cause:** Shared components should NEVER set their own `dir`. Direction must come from the page/layout or be passed as a prop.

**Fix (commit `5cfe62c`):**

`table.tsx` -- removed hardcoded `dir="rtl"`:
```tsx
// Before
<table ref={ref} dir="rtl" className={cn("w-full caption-bottom text-sm", className)} {...props} />

// After
<table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
```

`combobox.tsx` -- added `dir` and `loadingMessage` props, removed hardcoded values:
```tsx
// Before
<PopoverContent dir="rtl" ...>
  <Command dir="rtl">
    {isLoading && <div>טוען...</div>}

// After
<PopoverContent dir={dir} ...>
  <Command dir={dir}>
    {isLoading && <div>{loadingMessage ?? '...'}</div>}
```

**Consumer files updated to pass `dir` prop (commit `5cfe62c`):**
- `src/app/[locale]/dashboard/ministry/page.tsx` -- 2 Combobox instances
- `src/components/dashboard/harmonia/assign-repertoire-dialog.tsx`
- `src/components/dashboard/harmonia/book-lesson-wizard.tsx` -- 4 Combobox instances
- `src/components/dashboard/harmonia/messaging-interface.tsx`
- `src/components/enrollment/enrollment-wizard.tsx` -- 5 Combobox instances
- `src/components/forms/exam-registration-form.tsx` -- 2 Combobox + 3 Select
- `src/components/forms/kenes-form.tsx` -- 2 Combobox + 1 Select
- `src/components/forms/recital-form.tsx` -- 2 Combobox + 1 Select
- `src/components/harmonia/trial-booking-widget.tsx` -- 2 Combobox instances
- `src/components/payments/InstallmentSelector.tsx` -- full i18n rewrite

---

### 7. Missing `dir` on SelectContent and Other Radix Primitives

**Problem:** `<Select>` components with `dir="rtl"` hardcoded do not adapt when the user switches to EN or RU.

**Fix:**
```tsx
<Select dir={isRtl ? 'rtl' : 'ltr'} onValueChange={field.onChange}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>
```

**Files fixed (commits `5cfe62c`, `6f0467b`, `aa2e8f8`):**
- `src/components/forms/exam-registration-form.tsx` -- 3 Select components
- `src/components/forms/kenes-form.tsx` -- 1 Select
- `src/components/forms/recital-form.tsx` -- 1 Select
- `src/components/dashboard/harmonia/practice-video-upload-form.tsx` -- 1 Select
- `src/components/dashboard/harmonia/open-day-admin-dashboard.tsx` -- SelectContent

---

### 8. Missing `dir` on Root Containers

**Problem:** Pages render without `dir` attribute on the root container. The browser defaults to LTR even for Hebrew/Arabic content.

**Fix:**
```tsx
const locale = useLocale();
const isRtl = locale === 'he' || locale === 'ar';

return (
  <div dir={isRtl ? 'rtl' : 'ltr'}>
    {/* page content */}
  </div>
);
```

**Files fixed (commits `6f0467b`, `e2f5a38`, `5cfe62c`):**
- `src/app/[locale]/dashboard/admin/branches/page.tsx` -- missing dir/isRtl entirely
- `src/app/[locale]/dashboard/admin/notifications/page.tsx`
- `src/app/[locale]/dashboard/admin/notifications/log/page.tsx`
- `src/app/[locale]/dashboard/admin/scholarships/page.tsx`
- `src/app/[locale]/dashboard/admin/waitlists/page.tsx`
- `src/app/[locale]/dashboard/events/new/page.tsx`
- `src/app/[locale]/dashboard/forms/page.tsx`
- `src/app/[locale]/dashboard/forms/new/page.tsx`
- `src/app/[locale]/dashboard/forms/[id]/page.tsx`
- `src/app/[locale]/dashboard/master-schedule/page.tsx`
- `src/app/[locale]/dashboard/ministry-export/page.tsx`
- `src/app/[locale]/dashboard/teacher/reports/page.tsx`
- `src/app/[locale]/events/[id]/page.tsx`
- `src/components/dashboard/harmonia/key-metrics-bar.tsx`
- `src/components/dashboard/harmonia/pricing-settings.tsx`
- `src/components/dashboard/harmonia/schedule-calendar.tsx`
- `src/components/dashboard/harmonia/practice-video-upload-form.tsx`
- `src/components/dashboard/harmonia/cancel-lesson-dialog.tsx`
- `src/components/dashboard/harmonia/reschedule-lesson-dialog.tsx`
- `src/components/dashboard/harmonia/manage-payment-method-dialog.tsx`
- `src/app/[locale]/enroll/playing-school/[token]/payment-return/page.tsx`

---

### 9. Arabic Locale Excluded from RTL Check

**Problem:** Many components had `isRtl = locale === 'he'` without including Arabic, so Arabic pages rendered LTR.

**Fix:**
```tsx
// Before
const isRtl = locale === 'he';

// After
const isRtl = locale === 'he' || locale === 'ar';
```

**Files fixed:** All 90+ components in commit `6f0467b` were updated to use the correct check.

---

### 10. RTL Arrow Direction in Navigation

**Problem:** Prev/Next buttons with `<ArrowLeft>` and `<ArrowRight>` icons pointed the wrong way in RTL.

**Fix:**
```tsx
// Navigation arrows must swap in RTL
<Button onClick={handlePrev}>
  {isRtl ? <ArrowRight /> : <ArrowLeft />}
</Button>
<Button onClick={handleNext}>
  {isRtl ? <ArrowLeft /> : <ArrowRight />}
</Button>

// For "go to details" arrows
const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
```

**Files fixed:**
- `src/components/dashboard/harmonia/schedule-calendar.tsx`
- `src/components/dashboard/harmonia/events-list.tsx`
- `src/components/dashboard/harmonia/master-schedule-calendar.tsx`

---

### 11. `ILS` Currency Prefix Instead of Shekel Symbol

**Problem:** Displaying `ILS 150` or `ILS ${amount}` instead of the proper shekel symbol.

**Fix:**
```tsx
// Before
<span>ILS {price}</span>

// After
<span>{price} &#x20AA;</span>
```

**Files fixed (commit `6f0467b`):**
- `src/components/enrollment/enrollment-wizard.tsx`
- `src/components/harmonia/event-booking-page.tsx`
- `src/components/dashboard/harmonia/instrument-rental-dashboard.tsx`
- `src/components/dashboard/harmonia/events-list.tsx`

---

### 12. Zod Validation Messages Hardcoded in Hebrew

**Problem:** Zod schemas defined at module scope with Hebrew validation messages. When the locale is EN/RU/AR, form errors still show Hebrew.

**Fix:** Use a schema factory function that receives `t()`:
```tsx
// Before
const schema = z.object({
  date: z.date().nullable().refine(val => !!val, { message: "חובה לבחור תאריך." }),
});

// After
const getSchema = (t: (key: string) => string) => z.object({
  date: z.date().nullable().refine(val => !!val, { message: t('dateRequired') }),
});

// In component
const t = useTranslations('MyNamespace');
const schema = getSchema(t);
```

**Files fixed (commit `6f0467b`):**
- `src/components/dashboard/harmonia/reschedule-lesson-dialog.tsx`
- `src/components/dashboard/harmonia/cancel-lesson-dialog.tsx`
- `src/components/dashboard/harmonia/manage-payment-method-dialog.tsx`
- `src/components/dashboard/harmonia/practice-video-upload-form.tsx`

---

### 13. Key Metrics Filtering by Hebrew Strings Instead of Enum Values

**Problem:** `key-metrics-bar.tsx` filtered form submissions using Hebrew string literals instead of enum constants. The pending approvals count was always 0 for non-Hebrew locales.

**Fix:**
```tsx
// Before
const pendingForms = formSubmissions.filter(f =>
  ['ממתין לאישור מורה', 'ממתין לאישור מנהל'].includes(f.status)
).length;

// After
const pendingForms = formSubmissions.filter(f =>
  f.status === 'PENDING_TEACHER' || f.status === 'PENDING_ADMIN'
).length;
```

**File fixed:** `src/components/dashboard/harmonia/key-metrics-bar.tsx`

---

### 14. Pie Charts with Inline Hebrew Labels

**Problem:** `<Pie label>` renders text labels inside or beside pie slices. Hebrew text is wider than slice boundaries, causing overflow and unreadable charts.

**Fix:**
```tsx
// Before
<Pie data={data} label>

// After
<Pie data={data}>
<Legend layout="horizontal" verticalAlign="bottom" align="center"
  iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
```

**Files fixed (commit `6f0467b`):**
- `src/components/dashboard/harmonia/reports/academic-reports.tsx`
- `src/components/dashboard/harmonia/reports/financial-reports.tsx`
- `src/components/dashboard/harmonia/reports/operational-reports.tsx`
- `src/components/dashboard/harmonia/reports/teacher-reports.tsx`

---

### 15. RTL Font Override in CSS

**Problem:** Latin fonts used for headings do not render Hebrew/Arabic glyphs properly.

**Fix (commit `70d1afe`):** Added RTL font rules in `globals.css`:
```css
[dir="rtl"] body {
  font-family: var(--font-rtl);
}
[dir="rtl"] h1, [dir="rtl"] h2, [dir="rtl"] h3 {
  font-family: var(--font-heading);
}
```

**File fixed:** `src/app/globals.css`

---

## Complete File List: All Files Modified for RTL (2026-03-15)

### Commit `9d3ff75` -- `fix(rtl): force dir=ltr on month input in payroll panel`
| File | Change |
|------|--------|
| `src/components/dashboard/harmonia/admin-payroll-panel.tsx` | Add `dir="ltr"` on `<input type="month">` |

### Commit `c2484df` -- `fix(rtl): add dir prop to all Tabs components missing RTL support`
| File | Change |
|------|--------|
| `src/components/dashboard/harmonia/book-lesson-wizard.tsx` | Add `dir` on `<Tabs>` |
| `src/components/dashboard/harmonia/event-edit-form.tsx` | Add `dir` on `<Tabs>` |
| `src/components/dashboard/harmonia/instrument-rental-dashboard.tsx` | Add `dir` on `<Tabs>` |
| `src/components/dashboard/harmonia/ministry-inbox-panel.tsx` | Add `dir` on `<Tabs>` + `useLocale`/`isRtl` |
| `src/components/dashboard/harmonia/open-day-admin-dashboard.tsx` | Add `dir` on `<Tabs>` + `useLocale`/`isRtl` |
| `src/components/dashboard/harmonia/performance-booking-dashboard.tsx` | Add `dir` on `<Tabs>` + `useLocale`/`isRtl` |

### Commit `e2f5a38` -- `fix(ux): UX audit -- RTL, i18n, accessibility fixes`
| File | Change |
|------|--------|
| `src/app/[locale]/dashboard/admin/branches/page.tsx` | Add missing `dir`/`isRtl` |
| `src/app/[locale]/dashboard/announcements/page.tsx` | Add missing `'use client'` |
| `src/app/[locale]/dashboard/schedule/page.tsx` | Fix Link import |
| `src/components/dashboard/harmonia/admin-branches-dashboard.tsx` | Replace hardcoded Hebrew string |
| `src/components/dashboard/harmonia/admin-command-center.tsx` | Add `text-start` |
| `src/components/dashboard/harmonia/admin-payroll-panel.tsx` | Add `aria-label` |
| `src/components/dashboard/harmonia/announcement-composer.tsx` | Simplify CardFooter |
| `src/components/dashboard/harmonia/recent-announcements-card.tsx` | Add `dir="auto"` on title/body |

### Commit `6f0467b` -- `fix(i18n): full RTL/i18n sweep -- 90+ components`
| File | Change |
|------|--------|
| `CLAUDE.md` | Add mandatory RTL/i18n rules |
| `e2e/i18n-rtl-regression.spec.ts` | New: 20 E2E regression tests |
| `tests/i18n-regression.test.ts` | New: 5 Vitest regression tests |
| `src/app/[locale]/dashboard/admin/notifications/log/page.tsx` | `dir`, `isRtl`, Arabic |
| `src/app/[locale]/dashboard/admin/notifications/page.tsx` | `dir`, `isRtl`, Arabic |
| `src/app/[locale]/dashboard/admin/scholarships/page.tsx` | `dir`, `text-start`, `align="end"` |
| `src/app/[locale]/dashboard/admin/waitlists/page.tsx` | `dir`, `isRtl` |
| `src/app/[locale]/dashboard/events/new/page.tsx` | `dir`, `isRtl` |
| `src/app/[locale]/dashboard/forms/[id]/page.tsx` | `dir`, `text-start`, i18n |
| `src/app/[locale]/dashboard/forms/new/page.tsx` | `dir`, `isRtl` |
| `src/app/[locale]/dashboard/forms/page.tsx` | `dir`, `isRtl` |
| `src/app/[locale]/dashboard/master-schedule/page.tsx` | `dir`, `isRtl` |
| `src/app/[locale]/dashboard/ministry-export/page.tsx` | `dir`, `text-start`, `toLocaleDateString(locale)` |
| `src/app/[locale]/dashboard/notifications/page.tsx` | Minor `dir` fix |
| `src/app/[locale]/dashboard/page.tsx` | Minor fix |
| `src/app/[locale]/dashboard/settings/conservatorium/profile/page.tsx` | `dir` fix |
| `src/app/[locale]/dashboard/teacher/reports/page.tsx` | `dir`, `text-start`, charts |
| `src/app/[locale]/events/[id]/page.tsx` | `dir`, `isRtl` |
| `src/components/dashboard/harmonia/academic-reports.tsx` | Minor fix |
| `src/components/dashboard/harmonia/admin-branches-dashboard.tsx` | `dir`, `text-start`, i18n |
| `src/components/dashboard/harmonia/admin-calendar-panel.tsx` | `dir`, `isRtl` |
| `src/components/dashboard/harmonia/admin-command-center.tsx` | `text-start`, `dir` |
| `src/components/dashboard/harmonia/admin-finance-dashboard.tsx` | `dir`, `text-start`, `Legend` |
| `src/components/dashboard/harmonia/admin-payroll-panel.tsx` | Full i18n, `dir`, `text-start` |
| `src/components/dashboard/harmonia/admin-reports-dashboard.tsx` | `dir`, `isRtl` |
| `src/components/dashboard/harmonia/admin-waitlist-dashboard.tsx` | `dir`, `text-start`, `align="end"` |
| `src/components/dashboard/harmonia/ai-alerts-card.tsx` | `dir`, `isRtl` |
| `src/components/dashboard/harmonia/alumnus-form.tsx` | `dir`, `isRtl` |
| `src/components/dashboard/harmonia/assign-musician-dialog.tsx` | `dir`, `isRtl` |
| `src/components/dashboard/harmonia/assign-performer-dialog.tsx` | `dir`, `text-start`, i18n |
| `src/components/dashboard/harmonia/availability-grid.tsx` | Minor fix |
| `src/components/dashboard/harmonia/book-lesson-wizard.tsx` | Minor fix |
| `src/components/dashboard/harmonia/branch-edit-dialog.tsx` | `dir`, `isRtl` |
| `src/components/dashboard/harmonia/cancel-lesson-dialog.tsx` | Full i18n, `dir`, Zod factory |
| `src/components/dashboard/harmonia/cancellation-policy-settings.tsx` | Minor fix |
| `src/components/dashboard/harmonia/event-details.tsx` | `text-start`, arrow swap |
| `src/components/dashboard/harmonia/events-list.tsx` | Full i18n, arrow swap, currency |
| `src/components/dashboard/harmonia/exam-tracker-panel.tsx` | `dir`, `text-start`, i18n |
| `src/components/dashboard/harmonia/family-hub.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/form-builder.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/instrument-rental-dashboard.tsx` | Currency fix |
| `src/components/dashboard/harmonia/key-metrics-bar.tsx` | Enum filter bug fix, `dir` |
| `src/components/dashboard/harmonia/lesson-detail-dialog.tsx` | `dir`, `isRtl` |
| `src/components/dashboard/harmonia/lms-lesson-note-panel.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/manage-payment-method-dialog.tsx` | Full i18n, `dir`, Zod factory |
| `src/components/dashboard/harmonia/master-schedule-calendar.tsx` | `dir`, arrow swap, i18n |
| `src/components/dashboard/harmonia/messaging-interface.tsx` | Minor fix |
| `src/components/dashboard/harmonia/ministry-inbox-panel.tsx` | Minor fix |
| `src/components/dashboard/harmonia/multimedia-feedback-card.tsx` | `dir`, `ms-`/`me-`, i18n |
| `src/components/dashboard/harmonia/notification-preferences.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/open-day-admin-dashboard.tsx` | `dir`, `text-start`, i18n |
| `src/components/dashboard/harmonia/parent-notification-panel.tsx` | Minor fix |
| `src/components/dashboard/harmonia/parent-payment-panel.tsx` | `text-start`, i18n |
| `src/components/dashboard/harmonia/performance-booking-dashboard.tsx` | `text-start`, i18n |
| `src/components/dashboard/harmonia/performance-profile-editor.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/playing-school-child-card.tsx` | `dir`, `ms-`/`me-`, i18n |
| `src/components/dashboard/harmonia/practice-coach.tsx` | `dir`, `ms-`/`me-`, i18n |
| `src/components/dashboard/harmonia/practice-log-form.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/practice-video-upload-form.tsx` | Full i18n, `dir`, Zod factory |
| `src/components/dashboard/harmonia/pricing-settings.tsx` | `dir`, `text-start` |
| `src/components/dashboard/harmonia/promote-slot-dialog.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/recent-announcements-card.tsx` | Minor fix |
| `src/components/dashboard/harmonia/reports/academic-reports.tsx` | `Legend` instead of `label` |
| `src/components/dashboard/harmonia/reports/financial-reports.tsx` | `Legend` instead of `label` |
| `src/components/dashboard/harmonia/reports/operational-reports.tsx` | `Legend` instead of `label` |
| `src/components/dashboard/harmonia/reports/room-occupancy-heatmap.tsx` | `dir` |
| `src/components/dashboard/harmonia/reports/teacher-reports.tsx` | `Legend` + i18n |
| `src/components/dashboard/harmonia/reschedule-lesson-dialog.tsx` | Full i18n, `dir`, Zod factory |
| `src/components/dashboard/harmonia/rescheduling-chat-widget.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/schedule-calendar.tsx` | `dir`, arrow swap, i18n |
| `src/components/dashboard/harmonia/school-coordinator-dashboard.tsx` | Minor fix |
| `src/components/dashboard/harmonia/school-partnership-dashboard.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/send-quote-dialog.tsx` | `dir`, `isRtl` |
| `src/components/dashboard/harmonia/sound-check-scheduler.tsx` | `dir`, `text-start`, i18n |
| `src/components/dashboard/harmonia/student-billing-dashboard.tsx` | `text-start`, currency, i18n |
| `src/components/dashboard/harmonia/student-practice-panel.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/student-profile-content.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/teacher-dashboard.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/teacher-payroll-view.tsx` | Minor fix |
| `src/components/dashboard/harmonia/teacher-profile-editor.tsx` | Minor fix |
| `src/components/dashboard/harmonia/teacher-reports-dashboard.tsx` | Minor fix |
| `src/components/dashboard/harmonia/today-snapshot-card.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/translation-coverage-card.tsx` | `dir`, `text-start` |
| `src/components/dashboard/harmonia/weekly-calendar.tsx` | `dir`, i18n |
| `src/components/dashboard/harmonia/weekly-digest-card.tsx` | `dir`, i18n |
| `src/components/enrollment/enrollment-wizard.tsx` | Currency fix |
| `src/components/harmonia/aid-application-wizard.tsx` | `dir`, i18n |
| `src/components/harmonia/event-booking-page.tsx` | Currency fix |
| `src/components/harmonia/excellence-track-offer-modal.tsx` | `dir`, i18n |
| `src/components/harmonia/musicians-for-hire.tsx` | `dir`, i18n |
| `src/components/harmonia/open-day-landing.tsx` | `dir`, i18n |
| `src/components/harmonia/playing-school-enrollment-wizard.tsx` | `dir`, i18n |
| `src/components/harmonia/playing-school-finder.tsx` | Minor fix |
| `src/components/harmonia/public-event-page.tsx` | Minor fix |
| `src/components/harmonia/rental-signing-flow.tsx` | `dir`, i18n |
| `src/components/harmonia/slot-promotion-card.tsx` | Minor fix |
| `src/components/harmonia/trial-booking-widget.tsx` | `dir`, i18n |
| `src/hooks/use-whats-new.ts` | i18n |
| `src/lib/data.ts` | Hebrew mock data for instruments |

### Commit `b60da57` -- `fix(i18n): fix forms-list RTL and raw formType enum rendering`
| File | Change |
|------|--------|
| `src/components/dashboard/forms-list.tsx` | `dir`, `text-start`, translate formType enum |

### Commit `5cfe62c` -- `fix(i18n/rtl): eliminate hardcoded dir="rtl" from shared components`
| File | Change |
|------|--------|
| `src/components/ui/table.tsx` | Remove hardcoded `dir="rtl"` |
| `src/components/ui/combobox.tsx` | Add `dir`/`loadingMessage` props, remove hardcoded values |
| `src/app/[locale]/dashboard/ministry/page.tsx` | Pass `dir` to 2 Combobox instances |
| `src/app/[locale]/enroll/playing-school/[token]/payment-return/page.tsx` | Full i18n, dynamic `dir` |
| `src/components/dashboard/harmonia/assign-repertoire-dialog.tsx` | Pass `dir` to Combobox |
| `src/components/dashboard/harmonia/book-lesson-wizard.tsx` | Pass `dir` to 4 Combobox instances |
| `src/components/dashboard/harmonia/messaging-interface.tsx` | Pass `dir` to Combobox |
| `src/components/enrollment/enrollment-wizard.tsx` | Pass `dir` to 5 Combobox instances |
| `src/components/forms/exam-registration-form.tsx` | Pass `dir` to 2 Combobox + 3 Select |
| `src/components/forms/kenes-form.tsx` | Pass `dir` to 2 Combobox + 1 Select |
| `src/components/forms/recital-form.tsx` | Pass `dir` to 2 Combobox + 1 Select |
| `src/components/harmonia/trial-booking-widget.tsx` | Pass `dir` to 2 Combobox instances |
| `src/components/payments/InstallmentSelector.tsx` | Full i18n rewrite, remove 4x `dir="rtl"` |

### Commit `aa2e8f8` -- `fix(rtl): sweep dashboard components for RTL violations`
| File | Change |
|------|--------|
| `src/app/[locale]/dashboard/admin/scholarships/page.tsx` | `dir="ltr"` on number input |
| `src/app/[locale]/dashboard/settings/conservatorium/profile/page.tsx` | `dir="ltr"` on time + number inputs |
| `src/app/[locale]/dashboard/settings/packages/page.tsx` | `dir="ltr"` on number inputs |
| `src/app/[locale]/dashboard/teacher/student/[id]/page.tsx` | `dir="ltr"` on number input |
| `src/app/[locale]/dashboard/users/page.tsx` | `dir` on Tabs + `dir="ltr"` on inputs |
| `src/components/dashboard/harmonia/admin-makeup-dashboard.tsx` | `dir="ltr"` on number input |
| `src/components/dashboard/harmonia/age-upgrade-modal.tsx` | `text-left` to `text-start` |
| `src/components/dashboard/harmonia/cancellation-policy-settings.tsx` | `dir="ltr"` on 3 number inputs |
| `src/components/dashboard/harmonia/event-edit-form.tsx` | `dir="ltr"` on date/time/number inputs |
| `src/components/dashboard/harmonia/event-form.tsx` | `dir="ltr"` on date/time/number inputs |
| `src/components/dashboard/harmonia/instrument-rental-dashboard.tsx` | `dir="ltr"` on 6 date/number inputs |
| `src/components/dashboard/harmonia/notification-preferences.tsx` | `dir="ltr"` on time inputs |
| `src/components/dashboard/harmonia/open-day-admin-dashboard.tsx` | `dir` on Card/SelectContent |
| `src/components/dashboard/harmonia/practice-log-form.tsx` | `dir="ltr"` on date input |
| `src/components/dashboard/harmonia/pricing-settings.tsx` | `dir="ltr"` on number inputs |
| `src/components/dashboard/harmonia/room-management-dialog.tsx` | `dir="ltr"` on time input |
| `src/components/dashboard/harmonia/schedule-redesign.tsx` | `dir="ltr"` on date input |
| `src/components/dashboard/harmonia/school-partnership-dashboard.tsx` | `dir="ltr"` on date inputs |
| `src/components/dashboard/harmonia/sound-check-scheduler.tsx` | `dir="ltr"` on date input |
| `src/components/dashboard/harmonia/student-practice-panel.tsx` | `dir="ltr"` on date input |
| `src/components/dashboard/harmonia/teacher-payroll-view.tsx` | `dir="ltr"` on month input |

### Commit `70d1afe` -- `feat(rebrand): add dark mode, RTL font rules`
| File | Change |
|------|--------|
| `src/app/globals.css` | RTL font override rules for `[dir="rtl"]` |

---

## Regression Tests

### Vitest: `tests/i18n-regression.test.ts`

5 automated checks that run on every commit:

1. **TabsList dir= check** -- Fails if any `<TabsList>` has a `dir` attribute (it must be on `<Tabs>`)
2. **Physical margin check** -- Warns if `className` contains `ml-` or `mr-` (should be `ms-`/`me-`)
3. **ILS currency check** -- Fails if user-visible `ILS` prefix appears in components
4. **Raw enum rendering check** -- Warns if `{x.status}` or `{x.type}` patterns appear in JSX
5. **toLocaleDateString() without locale** -- Fails if `.toLocaleDateString()` is called without arguments

### Playwright E2E: `e2e/i18n-rtl-regression.spec.ts`

20 runtime checks across 16 dashboard routes:

- 16 route tests verifying `dir="rtl"` container exists on each page
- 1 test verifying Tabs have correct `dir` inside an RTL container
- 1 test verifying no raw enum text (`EXAM_PERFORMANCE`, `RECITAL`) is visible
- 1 test verifying no `ILS` currency prefix is visible
- 1 test verifying no English-only strings appear in Hebrew locale

---

## How to Prevent RTL Issues

### For New Components

1. **Always** add `const locale = useLocale()` and `const isRtl = locale === 'he' || locale === 'ar'`
2. **Always** add `dir={isRtl ? 'rtl' : 'ltr'}` on the root container
3. **Use logical CSS properties**: `ms-`/`me-`/`ps-`/`pe-`/`text-start`/`text-end`
4. **Never** use `text-left`/`text-right`/`ml-`/`mr-`/`pl-`/`pr-`
5. **Always** add `dir="ltr"` on native `date`/`time`/`month`/`number` inputs
6. **Always** add `dir` on `<Tabs>` primitive, `<Select>`, `<Combobox>`, `<DropdownMenuContent>`
7. **Never** hardcode `dir="rtl"` in shared UI components -- pass it as a prop
8. **Never** hardcode Hebrew strings -- use `useTranslations()`
9. **Never** render enum values directly -- map through `t()` first
10. **Always** pass `locale` to `toLocaleDateString()` and `toLocaleTimeString()`
11. **Use shekel symbol** -- never `ILS` prefix
12. **Swap navigation arrows** in RTL: prev=ArrowRight, next=ArrowLeft

### Code Review Checklist

Before approving any PR that touches UI components:

- [ ] Every page root has `dir={isRtl ? 'rtl' : 'ltr'}`
- [ ] `isRtl` includes both `'he'` and `'ar'`
- [ ] No `text-left`/`text-right` in className strings
- [ ] No `ml-`/`mr-`/`pl-`/`pr-` in className strings
- [ ] All `<Tabs>` have `dir` prop (not on `<TabsList>`)
- [ ] All `<TableHead>` have `className="text-start"`
- [ ] All `<DropdownMenuContent>` in tables have `align="end"`
- [ ] All native inputs (`date`/`time`/`month`/`number`) have `dir="ltr"`
- [ ] No hardcoded Hebrew strings
- [ ] No raw enum values in JSX
- [ ] Date formatting uses `locale` argument
- [ ] Currency uses shekel symbol, not `ILS`
- [ ] Pie charts use `<Legend>`, not inline `label`

### Grep Commands to Audit RTL

```bash
# Find hardcoded LTR classes
grep -rn 'text-left\|text-right\|ml-\|mr-\|pl-\|pr-' src/components/ --include="*.tsx"

# Find native inputs without dir="ltr"
grep -rn 'type="date"\|type="time"\|type="month"\|type="number"' src/components/ --include="*.tsx" | grep -v 'dir='

# Find Tabs without dir
grep -rn '<Tabs ' src/components/ --include="*.tsx" | grep -v 'dir='

# Find TabsList with dir (should be zero)
grep -rn '<TabsList.*dir=' src/components/ --include="*.tsx"

# Find hardcoded dir="rtl" (should only be in specific overrides)
grep -rn 'dir="rtl"' src/components/ --include="*.tsx"

# Find ILS currency prefix in user-visible code
grep -rn 'ILS' src/components/ --include="*.tsx" | grep -v 'priceILS\|amountILS\|currency.*ILS\|//.*ILS'

# Find toLocaleDateString without locale
grep -rn 'toLocaleDateString()' src/components/ --include="*.tsx"

# Find Select without dir
grep -rn '<Select ' src/components/ --include="*.tsx" | grep -v 'dir='

# Find components missing isRtl that use useLocale
grep -rn 'useLocale' src/components/ --include="*.tsx" -l | xargs grep -L 'isRtl'
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| RTL-related commits (2026-03-15) | 10 |
| Unique source files modified | 120+ |
| Translation files updated | 24 |
| Regression tests added (Vitest) | 5 |
| Regression tests added (Playwright) | 20 |
| Shared UI components fixed | 2 (table.tsx, combobox.tsx) |
| Combobox consumers updated | 9 |
| Native inputs given `dir="ltr"` | 40+ |
| Zod schemas converted to factory pattern | 4 |
| Hardcoded Hebrew strings removed | 100+ |
