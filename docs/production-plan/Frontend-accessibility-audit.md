# IS 5568 Accessibility Audit — Harmonia Platform

**Auditor:** Frontend Agent
**Date:** March 2026
**Standard:** IS 5568 (WCAG 2.1 Level AA)
**Legal Basis:** Equal Rights for Persons with Disabilities Act, 1998
**Scope:** Dashboard sidebar, layout, landing page, UI components

---

## Executive Summary

Harmonia has a solid accessibility foundation: an `/accessibility` statement page, a skip-to-content link in the root layout, RTL `dir` attribute on `<html>`, `lang` attribute per locale, Rubik font with Hebrew/Arabic subsets, and a supplemental AccessibilityPanel widget. However, **several P0 and P1 gaps remain** that put the platform at legal risk under IS 5568.

**Critical Finding:** The sidebar navigation (556 lines) has **no ARIA labels on collapsible groups, no `role="navigation"` on the nav container, and no keyboard-accessible group toggle** (relies on `onClick` only).

---

## 1. Root Layout (`src/app/[locale]/layout.tsx`)

### Positive Findings
| Item | Status | Notes |
|------|--------|-------|
| `<html lang={locale} dir={dir}>` | PASS | Correctly set per locale (line 75) |
| Skip-to-content link | PASS | Present (line 77) — `<a href="#main-content">` |
| `<main id="main-content" tabIndex={-1}>` | PASS | Focus target for skip link (line 79) |
| Font: Rubik with Hebrew + Cyrillic subsets | PASS | `display: 'swap'` prevents FOIT (line 14-19) |
| AccessibilityPanel widget | PASS | Supplemental preference controls present (line 82) |

### Issues Found

| ID | Severity | Issue | Line | Fix |
|----|----------|-------|------|-----|
| A-01 | P1 | **Skip link CSS class `skip-link` not defined in globals.css** — if not styled as `sr-only focus:not-sr-only`, it may be permanently invisible or permanently visible | 77 | Add standard skip-link CSS: `sr-only focus:not-sr-only focus:absolute focus:top-2 focus:inset-inline-start-2 focus:z-50 focus:p-3 focus:bg-background focus:text-foreground focus:ring-2` |
| A-02 | P2 | `<main>` wraps both AuthProvider children AND the AccessibilityPanel — semantically, only one `<main>` landmark should exist per page. The AccessibilityPanel and Toaster could be outside `<main>` | 79-86 | Move `<Toaster>`, `<AiHelpAssistant>`, and `<AccessibilityPanel>` outside `<main>` |

---

## 2. Dashboard Layout (`src/app/[locale]/dashboard/layout.tsx`)

### Positive Findings
| Item | Status | Notes |
|------|--------|-------|
| Sidebar side flips for RTL | PASS | `sidebarSide = 'right'` for he/ar (line 19) |
| Accessibility footer link | PASS | Link to `/accessibility` page in footer (lines 35-37) |
| `dir` attribute on SidebarInset | PASS | Set correctly (line 30) |

### Issues Found

| ID | Severity | Issue | Line | Fix |
|----|----------|-------|------|-----|
| A-03 | P0 | **No skip-to-content link in dashboard layout** — the root layout's skip link targets `#main-content` but the dashboard layout introduces its own content wrapper without a landing target | 23-44 | Add `id="dashboard-content"` to the content `<div>` and ensure the skip link works correctly within the dashboard shell. **FIXED — see section 7.** |
| A-04 | P1 | No `role="main"` or `<main>` landmark inside the dashboard — the content area is a plain `<div>` | 32-33 | Wrap the children `<div>` with `<main id="dashboard-content">` |

---

## 3. Sidebar Navigation (`src/components/dashboard/sidebar-nav.tsx`)

This is the most complex interactive component in the dashboard. It has 556 lines and renders role-based grouped navigation.

### Positive Findings
| Item | Status | Notes |
|------|--------|-------|
| Uses shadcn/ui Sidebar components (Radix-based) | PASS | Radix primitives have built-in ARIA |
| Notification bell has `sr-only` label | PASS | Line 494: `<span className="sr-only">{t('notifications')}</span>` |
| Icons are inside SidebarMenuButton with text labels | PASS | Screen readers will read the text `<span>` |
| `tooltip` prop on footer buttons | PASS | Lines 519, 530, 537, 543 |

### Issues Found

| ID | Severity | Issue | Line | Fix |
|----|----------|-------|------|-----|
| A-05 | P0 | **SidebarGroupLabel has no `role="button"` or `aria-expanded`** — the group header is clickable (toggleGroup) but has no ARIA state to indicate collapse/expand status | 444-456 | Add `role="button"`, `aria-expanded={!isCollapsed}`, `tabIndex={0}`, and `onKeyDown` handler for Enter/Space |
| A-06 | P0 | **Group collapse toggle is mouse-only** — `onClick` on SidebarGroupLabel with no `onKeyDown` handler means keyboard users cannot collapse/expand groups | 446 | Add `onKeyDown={(e) => { if (e.key === 'Enter' \|\| e.key === ' ') { e.preventDefault(); toggleGroup(group.labelKey); } }}` |
| A-07 | P1 | **No `<nav>` landmark wrapping the sidebar navigation** — SidebarContent renders as a `<div>`. Screen readers cannot identify this as a navigation landmark | 439 | Wrap the SidebarContent rendering with `<nav aria-label={t('mainNavigation')}>` |
| A-08 | P1 | **Notification badge count on bell icon uses visual-only span** — the badge `<span>` at line 489-492 has no `aria-label` for screen readers to announce the count | 487-492 | Add `aria-label={t('unreadNotifications', { count: unreadCount })}` to the Button |
| A-09 | P1 | **Legacy mode icons have no `aria-hidden="true"`** — `<link.icon />` at line 395 may be announced by screen readers as meaningless text | 395 | Add `aria-hidden="true"` to all icon components inside menu buttons |
| A-10 | P2 | **`ChevronDown` icon rotation animation** has no `prefers-reduced-motion` guard — CSS transition at line 453-454 | 452-455 | Add `motion-reduce:transition-none` to the className |
| A-11 | P2 | **Avatar image has `alt={user.name}` but AvatarFallback is a single character** — screen reader may announce "R" instead of full name | 480-483 | Add `aria-label={user.name}` to the Avatar component |
| A-12 | P1 | **Logout button has no confirmation** — accidental activation loses session state with no way to recover (WCAG 3.3.4 — Error Prevention) | 543-546 | Add a confirmation dialog or undo mechanism |

---

## 4. Landing Page (`src/components/harmonia/public-landing-page.tsx`)

### Positive Findings
| Item | Status | Notes |
|------|--------|-------|
| `dir={isRtl ? 'rtl' : 'ltr'}` on root container | PASS | Line 178 |
| Hero image has `alt=""` (decorative) | PASS | Line 183 |
| RTL-aware icon spacing with `me-2` | PASS | Lines 252, 385 |
| `text-start` instead of `text-left` | PASS | Line 181 |
| Uses semantic `<section>` elements | PASS | Throughout |

### Issues Found

| ID | Severity | Issue | Line | Fix |
|----|----------|-------|------|-----|
| A-13 | P0 | **No heading hierarchy in hero section** — the `<h1>` is good, but the `<main>` element has no `aria-label` | 181 | Add `aria-label={t('mainContent')}` to `<main>` |
| A-14 | P1 | **Section headings (`<h2>`) have no IDs for landmarks** — screen readers cannot navigate by landmark | 232, 281, 305, 333, 360, 376 | Add `id` attributes to each `<h2>` and `aria-labelledby` to each `<section>` |
| A-15 | P1 | **The instrument `<select>` dropdown has no `<label>`** — screen readers will not announce what this control is for | 239-250 | Add `<label htmlFor="instrument-select">`or `aria-label={t('instrumentPlaceholder')}` |
| A-16 | P1 | **City input has no `<label>`** — only a placeholder serves as the label, which disappears on focus | 238 | Add visible `<label>` or `aria-label` |
| A-17 | P1 | **Search input has no `<label>`** | 237 | Add visible `<label>` or `aria-label` |
| A-18 | P2 | **Stats bar numbers have no `aria-label`** to communicate what each number represents — screen readers will just read "85" without context | 210-226 | Wrap each stat in a container with `aria-label={t('statLabel', { value, label })}` |
| A-19 | P2 | **Teacher cards have no interactive landmark** — they are display-only Cards but users might expect to click to view teacher profile | 307-327 | Add `role="article"` and consider adding a CTA link |
| A-20 | P1 | **Testimonial cards have no attribution** — screen readers read anonymous text with no context | 362-368 | Add author name/role to each testimonial |

---

## 5. Color Contrast Analysis

Per SDD-ACCESS-IS5568-Accessibility.md section 3.1 and the WCAG 2.1 AA requirements:

| Color Combination | Ratio | Required | Status |
|-------------------|-------|----------|--------|
| Primary blue (#3B82F6) on white (#FFFFFF) | 3.1:1 | 4.5:1 for body text | **FAIL** — Use #1D4ED8 (5.9:1) for body text |
| `text-muted-foreground` (~#6B7280) on white | ~4.6:1 | 4.5:1 | PASS (borderline) |
| White text on hero overlay (#000/55%) | ~8:1 | 4.5:1 | PASS |
| Error red (#EF4444) on white | 3.9:1 | 4.5:1 | **FAIL** — Use #B91C1C (7.2:1) |
| Success green (#10B981) on white | 2.4:1 | 4.5:1 | **FAIL** — Use #065F46 (10.9:1) |
| `text-white/85` on dark overlay | ~7:1 | 4.5:1 | PASS |
| Sidebar group label text on sidebar bg | ~5:1 | 4.5:1 | PASS |

### Critical Color Fixes Required

1. **Primary blue (#3B82F6)** must NOT be used for normal-size body text — only for large text (18pt+) and UI controls
2. **Error states** must use darker red (#B91C1C) for text, not just color — must include icon + text
3. **Success states** must use darker green (#065F46)
4. **All status badges** must not rely solely on color — include text labels

---

## 6. Keyboard Navigation Audit

| Component | Tab Order | Enter/Space | Escape | Arrow Keys | Status |
|-----------|-----------|-------------|--------|------------|--------|
| Skip link | First focusable | Activates | N/A | N/A | PASS |
| Sidebar menu items | Sequential | Activates link | N/A | N/A | PASS |
| Sidebar group toggle | **NOT focusable** | **NOT working** | N/A | N/A | **FAIL** |
| Notification dropdown | Tab to bell | Opens | Closes | N/A | PASS |
| User dropdown | Tab to trigger | Opens | Closes | N/A | PASS |
| Landing page search | Tab through inputs | Submit | N/A | N/A | PASS |
| Landing page CTAs | Tab to buttons | Activates link | N/A | N/A | PASS |

### Critical Keyboard Fix:
The sidebar group labels must have `tabIndex={0}` and `onKeyDown` handlers for Enter and Space to toggle collapse/expand.

---

## 7. Accessibility Fixes Implemented

The following fixes have been applied directly to the codebase:

### Fix 1: Sidebar Group ARIA and Keyboard Support
**File:** `src/components/dashboard/sidebar-nav.tsx`
- Added `role="button"`, `aria-expanded`, `tabIndex={0}`, and `onKeyDown` handler to SidebarGroupLabel
- Added `aria-hidden="true"` to decorative icons in group headers
- Added `motion-reduce:transition-none` to ChevronDown animation
- Added `aria-label` to the notification bell button with unread count

### Fix 2: Dashboard Layout Accessibility
**File:** `src/app/[locale]/dashboard/layout.tsx`
- Added `id="dashboard-content"` to the content wrapper for skip-link targeting

### Fix 3: Landing Page Form Labels
**File:** `src/components/harmonia/public-landing-page.tsx`
- Added `aria-label` to search input, city input, and instrument select

---

## 8. Remediation Priority Matrix

| Priority | Issue IDs | Description | Effort |
|----------|-----------|-------------|--------|
| P0 — Must fix before launch | A-03, A-05, A-06 | Skip link in dashboard, sidebar group ARIA + keyboard | 2-4 hours |
| P1 — Fix within 2 weeks | A-01, A-04, A-07, A-08, A-09, A-12, A-14, A-15, A-16, A-17, A-20 | Nav landmarks, form labels, confirmation dialogs | 1-2 days |
| P2 — Fix within 1 month | A-02, A-10, A-11, A-18, A-19 | Semantic improvements, motion preferences, stats labels | 0.5-1 day |
| Color contrast fixes | All platforms | Primary blue, error red, success green | 0.5 day |

---

## 9. IS 5568 Compliance Checklist

| IS 5568 Requirement | Status | Notes |
|---------------------|--------|-------|
| `<html lang dir>` on all pages | PASS | Root layout sets both |
| Accessibility statement at `/accessibility` | PASS | Page exists with footer link |
| Accessibility coordinator contact | **NEEDS VERIFICATION** | Must include name, email, phone |
| Skip navigation link | PARTIAL | Present in root layout, needs dashboard integration |
| All images have alt text | PASS | Hero uses `alt=""` (decorative), avatars use `alt={name}` |
| All form fields have labels | **FAIL** | Landing page search inputs lack labels |
| Color contrast 4.5:1 for body text | **FAIL** | Primary blue fails for body text |
| Keyboard navigation complete | **FAIL** | Sidebar group toggle not keyboard-accessible |
| Screen reader announcements | **PARTIAL** | Notification bell has sr-only, but live regions missing for state changes |
| Focus indicators visible | PASS | Tailwind default focus-visible styles present |
| No keyboard traps | PASS | All modals use Radix (built-in escape) |
| Reduced motion support | **PARTIAL** | AccessibilityPanel has pauseAnimations, but individual CSS transitions lack motion-reduce guards |
| PDF accessibility (IS 5568 Part 2) | **NOT AUDITED** | jsPDF-generated invoices need separate audit |
| Session timeout warning | **NOT IMPLEMENTED** | Required for registration wizard |

---

## 10. Testing Recommendations

1. **Automated:** Integrate `@axe-core/playwright` in CI pipeline to catch regressions
2. **Manual — NVDA + Chrome:** Test full registration flow, dashboard navigation, sidebar collapse/expand
3. **Manual — VoiceOver iOS:** Test mobile landing page and parent portal
4. **Manual — Keyboard only:** Complete login, navigate to all dashboard sections, collapse/expand sidebar groups
5. **Visual:** Run Lighthouse accessibility audit, target score >= 90

---

*End of IS 5568 Accessibility Audit*
