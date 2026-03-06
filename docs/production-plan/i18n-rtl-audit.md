# RTL Logical Properties Audit Report

**Date:** 2026-03-06
**Auditor:** i18n Agent
**Scope:** `src/app/` and `src/components/` -- scanning for non-logical CSS properties

---

## 1. Summary

Hebrew and Arabic are RTL languages. Components must use CSS logical properties (e.g., `text-start` instead of `text-left`, `ps-4` instead of `pl-4`) to render correctly in both RTL and LTR layouts. This audit scans all TSX files and CSS files for physical direction properties that should be replaced with logical equivalents.

| Category | Violation Count | Severity |
|----------|----------------|----------|
| Tailwind physical classes in components | ~120+ instances | MEDIUM |
| Tailwind physical classes in UI primitives | ~25 instances | LOW (shadcn defaults) |
| CSS physical properties in globals.css | ~38 instances | LOW (mostly driver.js) |
| BarChart margin props (Recharts) | 7 instances | EXEMPT |
| Inline style `left`/`right` (JS positioning) | 3 instances | EXEMPT |

---

## 2. Tailwind Physical Classes in Application Components

These files use hardcoded `text-left`, `text-right`, `pl-`, `pr-`, `ml-`, `mr-`, `border-l-`, `border-r-`, `left-`, `right-`, or `rounded-l/r` classes instead of their logical equivalents.

### 2.1 CRITICAL -- Hardcoded direction without RTL awareness

These files use physical direction classes **without** checking `isRtl`:

| File | Line(s) | Violation | Fix |
|------|---------|-----------|-----|
| `src/components/dashboard/recent-forms.tsx` | 86 | `text-left` | `text-start` |
| `src/components/dashboard/harmonia/admin-branches-dashboard.tsx` | 78, 94 | `text-left` | `text-start` |
| `src/components/dashboard/harmonia/admin-finance-dashboard.tsx` | 136, 147 | `text-left` | `text-start` |
| `src/components/dashboard/harmonia/admin-waitlist-dashboard.tsx` | 89, 123 | `text-left` | `text-start` |
| `src/components/dashboard/harmonia/student-billing-dashboard.tsx` | 127, 206, 217, 248, 265 | `text-left`, `left-4` | `text-start`, `inset-inline-start-4` |
| `src/components/dashboard/harmonia/parent-payment-panel.tsx` | 109, 122, 123, 144, 155, 158, 159, 161 | `text-right`, `text-left`, `mr-`, `ml-` | `text-end`, `text-start`, `me-`, `ms-` |
| `src/components/dashboard/harmonia/lesson-detail-dialog.tsx` | 85, 99 | `text-right` | `text-start` (RTL default) |
| `src/components/dashboard/harmonia/lms-lesson-note-panel.tsx` | 96 | `border-l pl-6` | `border-s ps-6` |
| `src/components/dashboard/harmonia/multimedia-feedback-card.tsx` | 52, 72 | `pr-4`, `text-right` | `pe-4`, `text-start` |
| `src/components/dashboard/harmonia/promote-slot-dialog.tsx` | 100 | `pr-2` | `pe-2` |
| `src/components/dashboard/harmonia/master-schedule-calendar.tsx` | 29, 30 | `text-right`, `border-r-2`, `border-r-4` | `text-start`, `border-e-2`, `border-e-4` |
| `src/components/dashboard/harmonia/schedule-calendar.tsx` | 48, 65, 66 | `border-r-4` | `border-e-4` |
| `src/components/dashboard/harmonia/ministry-inbox-panel.tsx` | 86, 100, 118, 148, 215, 219 | `ml-auto`, `text-right`, `text-left`, `mr-2` | `ms-auto`, `text-start`, `text-start`, `me-2` |
| `src/components/dashboard/harmonia/exam-tracker-panel.tsx` | 135-138, 152, 215 | `mr-1`, `mr-2` | `me-1`, `me-2` |
| `src/components/dashboard/harmonia/student-practice-panel.tsx` | 180, 239, 240 | `mr-2`, `mr-1` | `me-2`, `me-1` |
| `src/components/dashboard/harmonia/parent-notification-panel.tsx` | 148 | `mr-2` | `me-2` |
| `src/components/dashboard/harmonia/parent-payment-panel.tsx` | 77 | `mr-2` | `me-2` |
| `src/app/[locale]/error.tsx` | 34 | `text-left` | `text-start` |
| `src/app/[locale]/dashboard/makeups/page.tsx` | 99, 114 | `text-right` | `text-end` or `text-start` |
| `src/app/[locale]/dashboard/ministry-export/page.tsx` | 146, 169 | `text-left` | `text-start` |
| `src/app/[locale]/dashboard/ministry/page.tsx` | 92, 96, 159, 173 | `right-3`, `pr-10`, `text-right`, `text-left` | `end-3`, `pe-10`, `text-start`, `text-start` |
| `src/app/[locale]/dashboard/teacher/student/[id]/page.tsx` | 363, 423, 431 | `pr-2`, `text-left` | `pe-2`, `text-start` |
| `src/app/[locale]/dashboard/forms/[id]/page.tsx` | 690 | `left-2` | `start-2` |
| `src/app/[locale]/enroll/playing-school/[token]/payment-return/page.tsx` | 78 | `text-right` | `text-start` |
| `src/app/[locale]/accept-invite/[inviteToken]/page.tsx` | 41 | `right-4` | `end-4` |
| `src/components/dashboard/harmonia/reports/academic-reports.tsx` | 194, 208 | `text-left` | `text-start` |
| `src/components/dashboard/harmonia/reports/financial-reports.tsx` | 178, 185 | `text-left` | `text-start` |
| `src/components/payments/InstallmentSelector.tsx` | 70 | `-right-1` | `-end-1` |
| `src/components/dashboard/harmonia/ai-matchmaker-form.tsx` | 55, 83, 91, 110, 129, 161, 189 | `left-4`, `slide-in-from-left`, `right-0` | See note 1 |
| `src/components/harmonia/aid-application-wizard.tsx` | 80, 81, 97, 133, 173 | `left-0`, `right-0`, `slide-in-from-right` | See note 1 |
| `src/components/harmonia/playing-school-finder.tsx` | 206 | `-right-10` | `-end-10` |
| `src/components/harmonia/excellence-track-offer-modal.tsx` | 60 | `right-4` | `end-4` |
| `src/components/dashboard/harmonia/admin-command-center.tsx` | 58, 65, 72 | `-right-2` | `-end-2` |
| `src/components/dashboard/sidebar-nav.tsx` | 490 | `right-1` | `end-1` |

### 2.2 ACCEPTABLE -- RTL-aware conditional classes

These files already check `isRtl` or `isHe` and conditionally apply `text-right`/`text-left`. While not ideal (logical properties would be cleaner), they **function correctly** in both RTL and LTR:

| File | Pattern |
|------|---------|
| `academic-reports.tsx` | `isRtl ? "text-right" : "text-left"` |
| `admin-calendar-panel.tsx` | `isHe ? "text-right" : "text-left"` |
| `admin-makeup-dashboard.tsx` | `isRtl ? "text-right" : "text-left"` |
| `notification-audit-log.tsx` | `isRtl ? 'text-right' : 'text-left'` |
| `parent-notification-panel.tsx` | `isRtl ? 'text-right' : 'text-left'` |
| `school-partnership-dashboard.tsx` | `isRtl ? 'text-right' : 'text-left'` |
| `school-coordinator-dashboard.tsx` | `isRtl ? "text-right" : "text-left"` |
| `substitute-assignment-panel.tsx` | `isRtl ? 'text-right' : 'text-left'` |
| `teacher-reports-dashboard.tsx` | `isRtl ? "text-right" : "text-left"` |
| `availability-grid.tsx` | `isRtl ? "border-r-4 ... text-right" : "border-l-4 ... text-left"` |
| `cancellation-policy-settings.tsx` | `isRtl ? 'ml-2' : 'mr-2'` |
| `school-partnership-dashboard.tsx` | `isRtl ? "ml-2" : "mr-2"` |
| `sheet-music-viewer.tsx` | `isRtl ? 'text-right' : 'text-left'` |
| `age-upgrade-modal.tsx` | `isRtl ? 'right-3' : 'left-3'` |

**Recommendation:** Replace these with logical properties (`text-start`, `text-end`, `ps-`, `pe-`, `border-s-`, `border-e-`) to eliminate the RTL branching entirely.

### 2.3 INTENTIONAL -- LTR-forced inputs

These use `dir="ltr"` and `text-left` intentionally for LTR-only content like email addresses, phone numbers, and credit card fields:

| File | Line | Context |
|------|------|---------|
| `playing-school-enrollment-wizard.tsx` | 418, 423, 428 | Phone, email, ID number inputs |
| `manage-payment-method-dialog.tsx` | 59, 63, 66 | Credit card number, expiry, CVC |

These are **correct** and should NOT be changed.

---

## 3. UI Primitive Components (shadcn/ui)

These are base UI primitives from shadcn/ui. They use physical properties as part of the library defaults:

| Component | File | Violations | Notes |
|-----------|------|------------|-------|
| `alert-dialog.tsx` | 39 | `left-[50%]` | Centering -- EXEMPT |
| `alert.tsx` | 7 | `pl-7`, `left-4` | Icon positioning |
| `carousel.tsx` | 165, 188, 211, 240 | `-ml-4`, `pl-4`, `-left-12`, `-right-12` | Navigation arrows |
| `command.tsx` | 45, 136 | `mr-2`, `ml-auto` | Search icon, shortcut |
| `dialog.tsx` | 41, 47 | `left-[50%]`, `right-4` | Centering, close button |
| `scroll-area.tsx` | 36 | `border-l` | Scrollbar track |
| `sheet.tsx` | 41-43, 68, 83 | `left-0`, `right-0`, `border-l`, `border-r`, `text-left` | Sheet positioning |
| `sidebar.tsx` | 528 | Various | Sidebar layout |
| `table.tsx` | 77 | `text-right` | Default table header alignment |
| `toast.tsx` | 19, 80 | `right-0`, `right-2` | Toast positioning |
| `tooltip.tsx` | 22 | `slide-in-from-right/left` | Animation |

**Priority:** LOW. These are generated by shadcn/ui. Modifying them requires careful testing. The `table.tsx` `text-right` default is specifically set for Hebrew-first RTL alignment.

---

## 4. CSS File Violations (globals.css)

`src/app/globals.css` has **~38 physical direction properties**:

### 4.1 Driver.js Popover Styles (Lines 160-360)

The driver.js walkthrough overlay uses physical positioning. This is a third-party CSS integration. The file already includes RTL overrides in `[dir="rtl"]` selectors (lines 314-357).

**Status:** ACCEPTABLE -- RTL is already handled with dedicated `[dir="rtl"]` rules.

### 4.2 Skip Link (Line 122)

```css
.skip-link { left: 0.5rem; }
```

Should be: `inset-inline-start: 0.5rem;`

### 4.3 Progress Text (Line 305)

```css
#driver-progress-text { left: 0; right: 0; }
```

Should be: `inset-inline: 0;`

---

## 5. EXEMPT Categories

### 5.1 Recharts BarChart margin prop

Recharts requires a `margin` object with `top`, `right`, `bottom`, `left` physical values. These are Recharts API requirements and cannot use logical properties:

- `src/app/[locale]/dashboard/progress/page.tsx:133`
- `src/components/dashboard/harmonia/academic-reports.tsx:150, 170`
- `src/app/[locale]/dashboard/teacher/student/[id]/page.tsx:341`
- `src/components/dashboard/harmonia/reports/financial-reports.tsx:105`
- `src/components/dashboard/harmonia/reports/operational-reports.tsx:144`
- `src/components/dashboard/harmonia/student-practice-panel.tsx:191`
- `src/components/dashboard/harmonia/teacher-reports-dashboard.tsx:129`

### 5.2 JavaScript positioning (inline styles)

FAB drag positioning and accessibility panel positioning use computed `left`/`top` values:

- `src/components/a11y/accessibility-panel.tsx:51, 231, 268`
- `src/components/harmonia/ai-help-assistant.tsx:308`

These use dynamic JavaScript calculations and are direction-agnostic.

---

## 6. Recommended Fix Order

### Phase 1 -- Critical Application Components (20 files, ~50 violations)
Fix files from Section 2.1 that use hardcoded physical classes without RTL awareness.

**Mapping cheat sheet:**
| Physical (replace) | Logical (use) |
|-------|---------|
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `pl-N` / `pr-N` | `ps-N` / `pe-N` |
| `ml-N` / `mr-N` | `ms-N` / `me-N` |
| `border-l` / `border-r` | `border-s` / `border-e` |
| `left-N` / `right-N` | `start-N` / `end-N` |
| `rounded-l` / `rounded-r` | `rounded-s` / `rounded-e` |
| `border-l-N` / `border-r-N` | `border-s-N` / `border-e-N` |

### Phase 2 -- Simplify RTL-conditional patterns (14 files)
Replace `isRtl ? "text-right" : "text-left"` patterns with `text-start` (automatic).

### Phase 3 -- UI Primitives (11 files)
Audit and fix shadcn/ui components where safe to do so.

### Phase 4 -- CSS globals
Fix `skip-link` positioning. Driver.js styles are acceptable as-is.

---

## 7. Slide Animation Direction Note

Several components use `slide-in-from-left-4` or `slide-in-from-right-4` for step transitions. In RTL mode, these animate in the wrong direction. Consider using `rtl:slide-in-from-right-4` / `ltr:slide-in-from-left-4` variant modifiers.

Affected files:
- `src/components/dashboard/harmonia/ai-matchmaker-form.tsx` (3 instances)
- `src/components/harmonia/aid-application-wizard.tsx` (3 instances)
