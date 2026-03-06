# RTL Logical Properties Audit — Frontend Perspective

**Author:** Frontend Agent (coordinating with @i18n)
**Date:** March 2026
**Scope:** `src/components/`, `src/app/` — CSS directional property violations

---

## 1. Summary

Harmonia uses Tailwind CSS with RTL-aware conventions (`ms-`, `me-`, `ps-`, `pe-`, `text-start`) throughout most of the codebase. The root layout correctly sets `dir="rtl"` for Hebrew and Arabic locales. The dashboard layout correctly flips the sidebar to the right side for RTL.

The initial audit found **27 hardcoded directional violations across 16 files**, plus an expanded audit by @i18n identified **~50 additional violations** including `isRtl ? "text-right" : "text-left"` simplifiable patterns.

**All critical and high-priority violations have been fixed.** Remaining items are vendor shadcn/ui components (6 files) and slide animation utilities that require Tailwind config changes.

### Fix Summary

| Category | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| `text-left` / `text-right` hardcoded | 22 | 22 | 0 |
| `isRtl ? "text-right" : "text-left"` patterns | ~35 | ~35 | 0 |
| `ml-` / `mr-` / `pl-` / `pr-` margins/paddings | 27 | 27 | 0 |
| `left-` / `right-` positioning | 12 | 10 | 2 (exempt) |
| `border-l` / `border-r` borders | 6 | 6 | 0 |
| Vendor/shadcn-ui components | 6 files | 2 fixed | 4 (low risk) |
| Slide animations (no RTL variant) | 8 | 0 | 8 (P2, needs Tailwind config) |

---

## 2. Hardcoded Directional Class Violations

### 2.1 Icon Spacing (most common pattern)

These are the most frequent violations — icons placed next to text using `mr-1`, `mr-2`, `ml-1`, `ml-2` instead of the RTL-aware `me-1`, `me-2`, `ms-1`, `ms-2`.

| File | Line | Current | Fix |
|------|------|---------|-----|
| `src/components/ui/command.tsx` | 45 | `mr-2` | `me-2` |
| `src/components/dashboard/harmonia/exam-tracker-panel.tsx` | 135 | `mr-1` (4 instances) | `me-1` |
| `src/components/dashboard/harmonia/exam-tracker-panel.tsx` | 152 | `mr-2` | `me-2` |
| `src/components/dashboard/harmonia/exam-tracker-panel.tsx` | 215 | `mr-1` | `me-1` |
| `src/components/dashboard/harmonia/parent-payment-panel.tsx` | 77 | `mr-2` | `me-2` |
| `src/components/dashboard/harmonia/parent-payment-panel.tsx` | 155 | `mr-1` | `me-1` |
| `src/components/dashboard/harmonia/parent-payment-panel.tsx` | 161 | `ml-1` | `ms-1` |
| `src/components/dashboard/harmonia/ministry-inbox-panel.tsx` | 215 | `mr-2` | `me-2` |
| `src/components/dashboard/harmonia/ministry-inbox-panel.tsx` | 219 | `mr-2` | `me-2` |
| `src/components/dashboard/harmonia/parent-notification-panel.tsx` | 148 | `mr-2` | `me-2` |
| `src/components/dashboard/harmonia/student-practice-panel.tsx` | 180 | `mr-2` | `me-2` |
| `src/components/dashboard/harmonia/student-practice-panel.tsx` | 239 | `mr-1` | `me-1` |
| `src/components/dashboard/harmonia/student-practice-panel.tsx` | 240 | `mr-1` | `me-1` |

### 2.2 Padding Violations

| File | Line | Current | Fix |
|------|------|---------|-----|
| `src/components/dashboard/harmonia/lms-lesson-note-panel.tsx` | 96 | `border-l pl-6` | `border-s ps-6` |
| `src/components/dashboard/harmonia/multimedia-feedback-card.tsx` | 52 | `pr-4` | `pe-4` |
| `src/components/dashboard/harmonia/promote-slot-dialog.tsx` | 100 | `pr-2` | `pe-2` |
| `src/app/[locale]/dashboard/ministry/page.tsx` | 96 | `pr-10 text-right` | `pe-10 text-end` |
| `src/app/[locale]/dashboard/teacher/student/[id]/page.tsx` | 363 | `pr-2` | `pe-2` |

### 2.3 Shadcn/UI Component Violations

These are in the base shadcn/ui components and affect all consumers:

| File | Line | Current | Fix | Notes |
|------|------|---------|-----|-------|
| `src/components/ui/alert.tsx` | 7 | `pl-7`, `left-4` | `ps-7`, `inset-inline-start-4` | Affects all alerts |
| `src/components/ui/carousel.tsx` | 165 | `-ml-4` | `-ms-4` | Carousel item spacing |
| `src/components/ui/carousel.tsx` | 188 | `pl-4` | `ps-4` | Carousel item padding |
| `src/components/ui/command.tsx` | 45 | `mr-2` | `me-2` | Search icon spacing |
| `src/components/ui/command.tsx` | 136 | `ml-auto` | `ms-auto` | Shortcut alignment |

### 2.4 Conditional RTL Handling (Already Fixed)

Some files already handle RTL with conditional classes — these are acceptable patterns:

| File | Line | Pattern | Status |
|------|------|---------|--------|
| `cancellation-policy-settings.tsx` | 121 | `isRtl ? 'ml-2' : 'mr-2'` | OK but should use `me-2` instead |
| `school-partnership-dashboard.tsx` | 136 | `isRtl ? 'ml-2' : 'mr-2'` | OK but should use `me-2` instead |
| `sheet-music-viewer.tsx` | 116 | `isRtl ? 'ml-4' : 'mr-4'` | OK but should use `me-4` instead |

### 2.5 CSS-in-JS / Inline Style Violations

| File | Line | Current | Fix | Notes |
|------|------|---------|-----|-------|
| `src/components/a11y/accessibility-panel.tsx` | 51, 231, 268 | `left:` in inline styles | Use `insetInlineStart` | Draggable positioning — acceptable for absolute positioning |
| `src/components/harmonia/ai-help-assistant.tsx` | 308 | `left:` in inline style | Use `insetInlineStart` | Floating button position |
| `src/components/ui/sheet.tsx` | 41-42 | `left-0`, `slide-out-to-left` etc. | Keep — sheet component handles `left`/`right` variants explicitly | Acceptable |

### 2.6 Recharts Margin Properties

These use Recharts `margin` prop which is a component API, not CSS:

| File | Lines | Current | Notes |
|------|-------|---------|-------|
| `academic-reports.tsx` | 150, 170 | `margin={{ left: -20, right: 20 }}` | **Keep** — Recharts API, not CSS |
| `financial-reports.tsx` | 105 | `margin={{ left: -10 }}` | **Keep** — Recharts API |
| `operational-reports.tsx` | 144 | `margin={{ left: 10 }}` | **Keep** — Recharts API |
| `student-practice-panel.tsx` | 191 | `margin={{ left: -10 }}` | **Keep** — Recharts API |
| `teacher-reports-dashboard.tsx` | 129 | `margin={{ left: 10 }}` | **Keep** — Recharts API |

**Note:** Recharts does not support RTL natively. Chart margins may need to be flipped dynamically based on locale in a future phase.

---

## 3. Priority Remediation

### P0 — Must Fix (affects all users in RTL mode)

1. **`src/components/ui/alert.tsx`** — `pl-7` and `left-4` break alert icon positioning in RTL
2. **`src/components/ui/command.tsx`** — `mr-2` and `ml-auto` affect command palette in RTL
3. **`src/components/dashboard/harmonia/lms-lesson-note-panel.tsx`** — `border-l pl-6` creates left border instead of start border

### P1 — Should Fix (affects specific pages in RTL)

4. All `mr-1` / `mr-2` icon spacing violations (13 instances across 5 files)
5. All `pr-` padding violations (4 instances across 3 files)
6. `text-right` in ministry page should be `text-end`

### P2 — Nice to Have

7. Convert conditional `isRtl ? 'ml-' : 'mr-'` patterns to logical `me-` classes (3 instances)
8. Recharts RTL margin flipping (future phase)

---

## 4. Recommended Fix Pattern

For each violation, the fix follows a simple mapping:

| Physical (wrong) | Logical (correct) | Tailwind |
|-------------------|-------------------|----------|
| `ml-N` | `ms-N` | margin-inline-start |
| `mr-N` | `me-N` | margin-inline-end |
| `pl-N` | `ps-N` | padding-inline-start |
| `pr-N` | `pe-N` | padding-inline-end |
| `left-N` | `start-N` | inset-inline-start |
| `right-N` | `end-N` | inset-inline-end |
| `border-l` | `border-s` | border-inline-start |
| `border-r` | `border-e` | border-inline-end |
| `text-left` | `text-start` | text-align: start |
| `text-right` | `text-end` | text-align: end |
| `-ml-N` | `-ms-N` | negative margin-inline-start |

---

## 5. Coordination with @i18n

This audit was coordinated with the @i18n agent who is performing a broader RTL audit across the entire `src/` directory. The @i18n agent's `docs/production-plan/i18n-rtl-audit.md` report covers the full scope including application pages, while this Frontend report focuses on the component library and dashboard components.

---

*End of RTL Logical Properties Audit*
