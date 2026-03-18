# Lyriosa Rebrand -- QA Test Plan

**Version:** 1.0
**Date:** 2026-03-15
**Author:** QA Lead
**Status:** Draft -- Pre-implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Brand Name Verification](#2-brand-name-verification)
3. [Theme Toggle Testing](#3-theme-toggle-testing)
4. [Visual Regression Testing](#4-visual-regression-testing)
5. [Accessibility Audit](#5-accessibility-audit)
6. [Existing Test Updates](#6-existing-test-updates)
7. [Performance Testing](#7-performance-testing)
8. [Smoke Test Checklist](#8-smoke-test-checklist)
9. [Risk Register](#9-risk-register)

---

## 1. Executive Summary

This plan covers QA validation for the rebrand from "Lyriosa" to "Lyriosa" with a server-side A/B theme toggle (`NEXT_PUBLIC_LANDING_THEME='a'|'b'`). The rebrand touches:

- **User-visible brand name** across 4 locales (he, en, ar, ru) in both Latin and localized scripts
- **Typography**: Candidate B introduces Playfair Display + Plus Jakarta Sans + Heebo (per `lyriosa-brand-mockup.html`); Candidate A retains Rubik
- **Color palette**: Candidate B uses deep indigo family (#1e1b4b / #3730a3 / #6366f1 / #a5b4fc); Candidate A retains current HSL tokens
- **Dashboard pages**: must remain visually unaffected by the landing theme toggle
- **Internal identifiers**: localStorage keys (`harmonia-user`, `harmonia_cookie_consent`, `harmonia-walkthrough-seen`), cookie names (`harmonia-user`), email addresses (`*@harmonia.local`, `*@harmonia.dev`), storage buckets (`harmonia-private`), domain URLs (`harmonia.co.il`)

### Scope Boundary

Internal identifiers (localStorage keys, cookie names, Supabase bucket names, dev email addresses) are **infrastructure identifiers**, not user-visible brand strings. This plan explicitly categorizes them so the implementation team can decide which to rename (user-facing risk) vs. keep (safe to leave).

---

## 2. Brand Name Verification

### 2.1 Automated Grep Scan -- User-Visible Strings

A CI-runnable script must scan all user-visible text for residual "Lyriosa" references. The scan should cover two categories:

**Category A: Translation files (MUST change)**

| File | Occurrences | Localized form |
|------|-------------|----------------|
| `src/messages/en/common.json` | 9 | "Lyriosa" |
| `src/messages/en/public.json` | 7 | "Lyriosa" |
| `src/messages/en/enrollment.json` | 11 | "Lyriosa" |
| `src/messages/en/admin.json` | 2 | "Lyriosa" |
| `src/messages/en/student.json` | 1 | "Lyriosa" |
| `src/messages/en/settings.json` | 1 | "Lyriosa" |
| `src/messages/he/common.json` | ~8 | "הרמוניה" / "הַרמוֹנְיָה" |
| `src/messages/he/enrollment.json` | ~8 | "הרמוניה" |
| `src/messages/he/public.json` | ~5 | "הרמוניה" |
| `src/messages/he/admin.json` | 1 | "הרמוניה" |
| `src/messages/he/billing.json` | 1 | "הרמוניה" |
| `src/messages/he/settings.json` | 1 | "הרמוניה" |
| `src/messages/he/student.json` | 1 | "הרמוניה" |
| `src/messages/ar/common.json` | 5 | "هارمونيا" / "Lyriosa" |
| `src/messages/ar/enrollment.json` | ~7 | "هارمونيا" |
| `src/messages/ar/public.json` | ~6 | "هارمونيا" |
| `src/messages/ar/admin.json` | 3 | "هارمونيا" |
| `src/messages/ar/student.json` | 1 | "Lyriosa" (mixed!) |
| `src/messages/ar/settings.json` | 1 | "هارمونيا" |
| `src/messages/ru/common.json` | 8 | "Lyriosa" (Latin in Russian text) |
| `src/messages/ru/enrollment.json` | 10 | "Lyriosa" |
| `src/messages/ru/public.json` | 4 | "Lyriosa" |
| `src/messages/ru/admin.json` | 1 | "Lyriosa" |
| `src/messages/ru/student.json` | 1 | "Lyriosa" |
| `src/messages/ru/settings.json` | 1 | "Lyriosa" |

**NOTE -- Arabic inconsistency:** `src/messages/ar/student.json:471` and `src/messages/ar/common.json:954,957,1002` use Latin "Lyriosa" instead of Arabic "هارمونيا". These must be unified to the new Arabic-script brand name.

**Category B: Hardcoded strings in source code (MUST change)**

| File | Line | String | Context |
|------|------|--------|---------|
| `src/app/[locale]/page.tsx` | 6,9 | `'Lyriosa'`, `'Lyriosa - Music for Every Child'` | Page metadata |
| `src/app/[locale]/page.tsx` | 11 | `'/images/og-harmonia.jpg'` | OG image path |
| `src/app/[locale]/page.tsx` | 14-17 | `'https://harmonia.co.il'` | Canonical/alternate URLs |
| `src/app/[locale]/layout.tsx` | 33 | `': 'Lyriosa'` | Fallback site name |
| `src/app/robots.ts` | 12 | `'https://harmonia.co.il/sitemap.xml'` | Sitemap URL |
| `src/app/sitemap.ts` | 11 | `'https://harmonia.co.il/'` | Sitemap base URL |
| `src/lib/notifications/payment-notifications.ts` | 99 | `name: 'Lyriosa'` | Email sender name |
| `src/lib/db/adapters/supabase.ts` | 367 | `'Lyriosa'` | Fallback conservatorium name |
| `src/lib/db/adapters/postgres.ts` | 683-684, 1236 | `'Lyriosa'` | Fallback conservatorium name |
| `src/ai/flows/nurture-lead-flow.ts` | 35 | `"Lyriosa"` | AI prompt |
| `src/ai/flows/help-assistant-flow.ts` | 51 | `"Lyriosa"` | AI prompt |
| `src/components/dashboard/harmonia/admin-command-center.tsx` | 45 | `'Lyriosa'` | Fallback name |
| `src/app/api/invoice-pdf/[invoiceId]/route.ts` | 67 | `Lyriosa`, `harmonia.co.il` | PDF footer |
| `src/app/api/ps/qr/route.ts` | 6 | `'https://harmonia.co.il'` | QR code base URL |
| `src/components/harmonia/conservatorium-public-profile-page.tsx` | 308 | `'https://harmonia.co.il'` | Fallback site URL |

**Category C: Infrastructure identifiers (DECISION REQUIRED -- may keep or rename)**

| Identifier | Files | Risk if renamed |
|------------|-------|-----------------|
| `harmonia-user` (localStorage key) | `use-auth.tsx`, `auth-domain.tsx`, `users-domain.tsx`, `auth-cookie.ts`, 5 e2e test files | Breaking: all active sessions invalidated |
| `harmonia_cookie_consent` (localStorage key) | `cookie-banner.tsx`, `consent-banner.spec.ts`, `announcements.spec.ts` | Breaking: all users re-prompted for consent |
| `harmonia-walkthrough-seen` (localStorage key) | `screenshot-all-screens.spec.ts` | Low risk: walkthrough replays once |
| `harmonia-user` (cookie name) | `auth-cookie.ts`, `auth.ts` actions | Breaking: active sessions lost |
| `harmonia-private` (Supabase bucket) | `storage.ts` | Breaking: requires Supabase bucket rename |
| `dev@harmonia.local` / `admin@harmonia.dev` | `proxy.ts`, `auth-utils.ts`, 4 e2e files | Low risk: dev-only addresses |
| `harmonia.co.il` (domain) | `page.tsx`, `robots.ts`, `sitemap.ts`, `qr/route.ts`, `invoice-pdf`, `conservatorium-public-profile-page.tsx` | Depends on DNS: replace with env var |
| `noreply@harmonia.co.il` | `payment-notifications.ts` | Depends on email infrastructure |

**Recommendation:** Infrastructure identifiers in Category C should use an env var (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`) instead of hardcoded domains. localStorage keys and cookie names can be left as-is for backward compatibility (they are not user-visible), or migrated with a fallback-read strategy.

### 2.2 Translation Completeness Matrix

For each locale, verify the new brand name is rendered correctly:

| Locale | Brand name (Latin) | Brand name (localized script) | siteName key | HomePage.title key |
|--------|--------------------|-------------------------------|--------------|-------------------|
| en | Lyriosa | n/a | Lyriosa | Lyriosa |
| he | Lyriosa | לירִיוֹזָה (TBD) | (Hebrew form) | (Hebrew form) |
| ar | Lyriosa | ليريوسا (TBD) | (Arabic form) | (Arabic form) |
| ru | Lyriosa | Лириоза (TBD) | (Russian form) | (Russian form) |

**Test procedure:**
1. For each locale, load the landing page and verify the navbar brand text matches the expected name
2. Check the `<title>` tag in the HTML head
3. Check the footer copyright line
4. Check the OG meta tags via `document.querySelector('meta[property="og:site_name"]')`

### 2.3 Metadata Verification

| Item | File | Current value | Expected value |
|------|------|---------------|----------------|
| Default page title template | `layout.tsx:39` | `%s \| {t('siteName')}` | `%s \| Lyriosa` (via translation) |
| OG siteName | `layout.tsx:44` | `{t('siteName')}` | `Lyriosa` (via translation) |
| Landing page title | `page.tsx:6` | `'Lyriosa - Music for Every Child'` | `'Lyriosa - Music for Every Child'` |
| Landing OG title | `page.tsx:9` | `'Lyriosa'` | `'Lyriosa'` |
| OG image | `page.tsx:11` | `/images/og-harmonia.jpg` | `/images/og-lyriosa.jpg` (new asset needed) |
| Canonical URL | `page.tsx:14` | `https://harmonia.co.il` | New domain or env var |
| robots.txt sitemap | `robots.ts:12` | `https://harmonia.co.il/sitemap.xml` | New domain or env var |

### 2.4 Legal Pages

Pages to audit for brand name in rendered text:

- `/privacy` -- references "Lyriosa" ~12 times across 4 locales (privacy intro, general body, sub-processors, contact directory, retention schedule)
- `/accessibility` -- references "Lyriosa" in intro text across 4 locales
- `/register` (enrollment wizard) -- contract signing step mentions "Lyriosa" ~10 times per locale (terms title, terms body, legacy checkbox, definition clauses, data processing clause)
- `/playing-school` -- references "Lyriosa Playing School" in badge and subtitle
- `/help` -- help center title includes "Lyriosa"
- `/about` -- conservatory/teacher fallback text references "Lyriosa network"

---

## 3. Theme Toggle Testing

### 3.1 Test Matrix

The toggle is controlled by `NEXT_PUBLIC_LANDING_THEME` env var. Each cell below requires a separate test run.

| Theme | Locale | Viewport | Test ID |
|-------|--------|----------|---------|
| A (current) | he | Desktop 1440px | T-A-he-D |
| A (current) | he | Mobile 375px | T-A-he-M |
| A (current) | en | Desktop 1440px | T-A-en-D |
| A (current) | en | Mobile 375px | T-A-en-M |
| A (current) | ar | Desktop 1440px | T-A-ar-D |
| A (current) | ar | Mobile 375px | T-A-ar-M |
| A (current) | ru | Desktop 1440px | T-A-ru-D |
| A (current) | ru | Mobile 375px | T-A-ru-M |
| B (Lyriosa) | he | Desktop 1440px | T-B-he-D |
| B (Lyriosa) | he | Mobile 375px | T-B-he-M |
| B (Lyriosa) | en | Desktop 1440px | T-B-en-D |
| B (Lyriosa) | en | Mobile 375px | T-B-en-M |
| B (Lyriosa) | ar | Desktop 1440px | T-B-ar-D |
| B (Lyriosa) | ar | Mobile 375px | T-B-ar-M |
| B (Lyriosa) | ru | Desktop 1440px | T-B-ru-D |
| B (Lyriosa) | ru | Mobile 375px | T-B-ru-M |

**Total: 16 theme/locale/viewport combinations for public pages.**

### 3.2 Pages Affected by Theme Toggle

Only public-facing pages should change styling based on the theme toggle. The following routes must be tested:

**Theme-sensitive (public):**
- `/` (landing page)
- `/about`
- `/about/[slug]` (conservatorium profiles)
- `/available-now`
- `/musicians`
- `/login`
- `/register`
- `/playing-school`
- `/donate`
- `/open-day`
- `/contact`
- `/privacy`
- `/accessibility`
- `/help`
- `/apply-for-aid`
- `/apply/matchmaker`
- `/try`
- `/pending-approval`

**Theme-immune (dashboard) -- verify NO change:**
- `/dashboard` (and all sub-routes from `DASHBOARD_ROUTES` in smoke.spec.ts -- 63 routes)

### 3.3 Theme Toggle Verification Tests

| Test | Steps | Expected |
|------|-------|----------|
| T-TOGGLE-1: Default theme is A | Start dev server without `NEXT_PUBLIC_LANDING_THEME` set | Landing page renders with Candidate A styling (Rubik font, current indigo palette) |
| T-TOGGLE-2: Theme A explicit | Set `NEXT_PUBLIC_LANDING_THEME=a`, restart server | Same as T-TOGGLE-1 |
| T-TOGGLE-3: Theme B | Set `NEXT_PUBLIC_LANDING_THEME=b`, restart server | Landing page renders with Candidate B styling (Playfair Display headings, Plus Jakarta Sans body, deep indigo palette per brand mockup) |
| T-TOGGLE-4: Invalid value | Set `NEXT_PUBLIC_LANDING_THEME=x` | Falls back to Candidate A (no crash) |
| T-TOGGLE-5: Dashboard isolation (A) | Theme A active, navigate to /dashboard | Dashboard uses standard shadcn/ui tokens, NOT theme A public styling |
| T-TOGGLE-6: Dashboard isolation (B) | Theme B active, navigate to /dashboard | Dashboard identical to T-TOGGLE-5 |
| T-TOGGLE-7: No CSS variable leak | Theme B, inspect `:root` CSS variables on dashboard page | `--primary`, `--background` etc. match dashboard values, not Candidate B public values |

### 3.4 Font Loading Verification

| Test | Steps | Expected |
|------|-------|----------|
| T-FONT-1: Theme A fonts | Theme A, open Network tab, load landing page | Only Rubik woff2 files requested (latin, hebrew, arabic, cyrillic subsets) |
| T-FONT-2: Theme B fonts | Theme B, open Network tab, load landing page | Playfair Display + Plus Jakarta Sans + Heebo woff2 files requested |
| T-FONT-3: No unused font in A | Theme A active | No Playfair Display / Plus Jakarta Sans / Heebo requests |
| T-FONT-4: Dashboard fonts | Any theme, navigate to dashboard | Only Rubik loaded (dashboard is theme-independent) |
| T-FONT-5: Hebrew subset in B | Theme B, he locale | Heebo loaded for Hebrew text; Playfair Display for Latin headings |

---

## 4. Visual Regression Testing

### 4.1 Approach

Use Playwright's built-in screenshot comparison (`expect(page).toHaveScreenshot()`) with per-theme baseline directories.

**Baseline directory structure:**
```
e2e/screenshots/
  theme-a/
    desktop/
      he/ en/ ar/ ru/
    mobile/
      he/ en/ ar/ ru/
  theme-b/
    desktop/
      he/ en/ ar/ ru/
    mobile/
      he/ en/ ar/ ru/
```

**Recommended Playwright config addition:** A separate project per theme, setting the env var before launch and using `--update-snapshots` for initial baseline capture.

### 4.2 Key Pages to Capture

For each theme x locale x viewport combination:

| Page | Route | Why critical |
|------|-------|-------------|
| Landing hero | `/` | Primary brand impression; typography, colors, badge, CTA |
| Landing full | `/` (fullPage) | Stats bar, teacher cards, personas, testimonials, footer |
| About | `/about` | Alumni section, conservatorium list |
| Conservatorium profile | `/about/cons-15` | Public profile with teachers |
| Available Now | `/available-now` | Slot promotion cards |
| Login | `/login` | Brand logo, back-to-home link text |
| Register | `/register` | Enrollment wizard step 1 |
| Dashboard home | `/dashboard` | Must NOT change with theme toggle |
| Dashboard schedule | `/dashboard/schedule` | Must NOT change with theme toggle |
| Dashboard billing | `/dashboard/billing` | Must NOT change with theme toggle |

### 4.3 Breakpoints

| Name | Width | Device |
|------|-------|--------|
| Mobile | 375px | iPhone SE / small Android |
| Tablet | 768px | iPad Mini |
| Laptop | 1024px | Small laptop |
| Desktop | 1440px | Standard desktop |

### 4.4 RTL-Specific Visual Checks

For he and ar locales, the following must be visually confirmed:

| Check | What to look for |
|-------|-----------------|
| Layout mirroring | Navigation items flow right-to-left; search icon on correct side |
| Text alignment | Hero heading, card titles, footer text all `text-start` (right-aligned) |
| Icon direction | Chevron icons point correct direction (e.g., `ChevronLeft` in RTL context) |
| `dir` attribute | Root container has `dir="rtl"` |
| Tabs direction | Any tabs component has `dir="rtl"` on the Tabs primitive |
| Table headers | `text-start` class present |
| Dropdown menus | `align="end"` renders on correct side |
| Calendar | Month/year controls not broken by RTL; IconLeft/IconRight swapped |
| Date pickers | `<input type="month">` has `dir="ltr"` (browser-native) |
| Mobile menu | Sheet slides from correct side |

---

## 5. Accessibility Audit

### 5.1 Color Contrast (WCAG AA)

Both candidates must achieve minimum 4.5:1 contrast ratio for normal text and 3:1 for large text.

**Candidate A (current palette):**

| Token | Light mode HSL | Against | Check |
|-------|---------------|---------|-------|
| `--primary` | 240 59% 50% | `--primary-foreground` (210 40% 98%) | Verify >= 4.5:1 |
| `--foreground` | 222.2 84% 4.9% | `--background` (210 40% 98%) | Verify >= 4.5:1 |
| `--muted-foreground` | 215.4 16.3% 46.9% | `--background` (210 40% 98%) | Verify >= 4.5:1 (most likely to fail) |

**Candidate B (new palette from brand mockup):**

| Color | Hex | Against | Check |
|-------|-----|---------|-------|
| Primary indigo | #6366f1 | White (#fff) | Verify >= 4.5:1 |
| Light indigo | #a5b4fc | Dark bg (#0a0a1e) | Verify >= 4.5:1 |
| Muted text | #94a3b8 | Dark bg (#0a0a1e) | Verify >= 4.5:1 |
| Muted text | #94a3b8 | Light bg (#f8fafc) | Likely FAILS -- needs checking |
| Body text | #f8fafc | Dark bg (#0a0a1e) | Verify >= 4.5:1 |
| Secondary text | rgba(255,255,255,0.55) | Indigo bg (#3730a3) | Likely FAILS -- needs checking |

**Tool:** Run axe-core via `@axe-core/playwright` on all key pages for both themes.

### 5.2 Focus States

| Test | Steps | Expected |
|------|-------|----------|
| A11Y-FOCUS-1 | Tab through landing page in Theme A | Every interactive element shows visible focus ring (uses `--ring` CSS variable) |
| A11Y-FOCUS-2 | Tab through landing page in Theme B | Focus ring visible against new background colors |
| A11Y-FOCUS-3 | Tab through login form in Theme B | Input focus borders visible |
| A11Y-FOCUS-4 | Skip-to-content link | Press Tab on page load, verify skip link appears and works |

### 5.3 Screen Reader

| Test | Steps | Expected |
|------|-------|----------|
| A11Y-SR-1 | Navigate to landing page with NVDA/VoiceOver | Brand name "Lyriosa" announced correctly (not spelled letter-by-letter) |
| A11Y-SR-2 | Check `<html lang>` attribute | Matches locale (he/en/ar/ru) |
| A11Y-SR-3 | Check `aria-labelledby` on sections | All landmark sections still have correct IDs (hero-heading, find-heading, personas-heading) |
| A11Y-SR-4 | Hebrew brand name | Hebrew screen reader announces the Hebrew form naturally |

### 5.4 Keyboard Navigation

| Test | Steps | Expected |
|------|-------|----------|
| A11Y-KB-1 | Tab through navbar | All nav links reachable, brand logo link first |
| A11Y-KB-2 | Enter key on CTA buttons | Register CTA, Book Trial, Donate all activate |
| A11Y-KB-3 | Escape key on mobile menu | Sheet closes |
| A11Y-KB-4 | Arrow keys in dropdowns | Language switcher navigable |

---

## 6. Existing Test Updates

### 6.1 Tests That Will Break

**Vitest (unit tests):**

| File | What breaks | Fix |
|------|------------|-----|
| `tests/components/landing-page.test.tsx:54` | Imports from `@/components/harmonia/public-landing-page` | Update if component path changes (likely stays -- `harmonia/` is a directory name, not brand) |
| `tests/auth/callback-url-sanitization.test.ts:85-86` | Test string `'https://harmonia.co.il.evil.com'` | Update domain if production domain changes |
| `tests/auth/with-auth-roles.test.ts:21` | `'x-user-email': 'dev@harmonia.local'` | Update if dev email changes (Category C decision) |
| `tests/lib/auth-utils.test.ts` | References `dev@harmonia.local` | Same as above |

**Playwright (e2e tests):**

| File | What breaks | Fix |
|------|------------|-----|
| `e2e/flows/auth.spec.ts:24` | Selector `a:has-text("Lyriosa"), a:has-text("הרמוניה")` | Update to `a:has-text("Lyriosa"), a:has-text("(Hebrew brand)")` |
| `e2e/flows/auth.spec.ts:71,92` | `'admin@harmonia.local'` | Update if dev email changes |
| `e2e/flows/announcements.spec.ts:11` | `'admin@harmonia.dev'` | Update if dev email changes |
| `e2e/flows/announcements.spec.ts:20` | `localStorage.setItem('harmonia-user', ...)` | Update if localStorage key changes |
| `e2e/flows/consent-banner.spec.ts:11` | `harmonia_cookie_consent` key | Update if key changes |
| `e2e/security/tenant-isolation.spec.ts` | Multiple references to `harmonia-user`, `dev@harmonia.local` | Update if keys/emails change |
| `e2e/security/security.spec.ts:68,122` | `'admin@harmonia.local'` | Update if dev email changes |
| `e2e/integration/cross-feature.spec.ts:29,35` | `dev@harmonia.local`, `harmonia-user` | Update if keys/emails change |
| `e2e/full-audit/screenshot-all-screens.spec.ts` | Multiple `harmonia-user`, `harmonia-walkthrough-seen`, `dev@harmonia.local` | Update if keys/emails change |

### 6.2 Update Strategy

**Phase 1 -- Mandatory (brand-visible):**
1. Search-and-replace "Lyriosa" / "הרמוניה" / "هارمونيا" / "Гармония" in all `src/messages/` JSON files
2. Update hardcoded strings in Category B source files
3. Update `e2e/flows/auth.spec.ts:24` selector for brand text
4. Create new OG image `/images/og-lyriosa.jpg`

**Phase 2 -- Optional (infrastructure identifiers):**
1. If localStorage keys are renamed, add migration code in `use-auth.tsx` that reads old key, writes new key, deletes old
2. Update all e2e tests that reference old keys
3. If domain changes, update all hardcoded URLs to use `process.env.NEXT_PUBLIC_SITE_URL`

### 6.3 New Tests Needed

| Test | Type | Description |
|------|------|-------------|
| Brand name grep test | Vitest | Scan all `src/messages/**/*.json` files for residual "Lyriosa"/"הרמוניה"/"هارمونيا" strings; fail if any found |
| Theme toggle unit test | Vitest | Verify theme selection logic returns correct config for `'a'`, `'b'`, `undefined`, and invalid values |
| Theme A landing render | Vitest | Render `PublicLandingPage` with theme=a mock, verify Candidate A classes/tokens present |
| Theme B landing render | Vitest | Render `PublicLandingPage` with theme=b mock, verify Candidate B classes/tokens present |
| Dashboard theme isolation | Playwright | Load dashboard with theme=b, assert no Candidate B CSS classes on dashboard elements |
| Brand name in navbar | Playwright | For each locale, assert navbar brand text matches expected Lyriosa form |
| Brand name in footer | Playwright | For each locale, assert footer copyright contains Lyriosa form |
| OG meta tags | Playwright | Assert `meta[property="og:site_name"]` content is "Lyriosa" |
| Page title | Playwright | Assert `document.title` contains "Lyriosa" |
| Font loading (Theme A) | Playwright | Assert no Playfair Display font requests in network log |
| Font loading (Theme B) | Playwright | Assert Playfair Display font present in network log |
| Visual regression baseline | Playwright | Screenshot comparisons for all 16 matrix combinations (Section 4) |

---

## 7. Performance Testing

### 7.1 Font Loading Impact

| Metric | Candidate A | Candidate B | Budget |
|--------|------------|------------|--------|
| Font file count | 4 woff2 (Rubik x4 subsets) | 8-12 woff2 (Playfair Display + Plus Jakarta Sans + Heebo) | No more than 3x increase |
| Total font bytes | ~120KB (estimated) | ~300-400KB (estimated) | Measure; flag if >500KB |
| Font display strategy | `display: 'swap'` (via next/font) | Must also use `display: 'swap'` | FOUT acceptable; FOIT is not |
| First Contentful Paint delta | Baseline | Measure delta | Max +200ms regression |

**Test procedure:**
1. Run Lighthouse on `/` with Theme A; record FCP, LCP, CLS, font transfer size
2. Run Lighthouse on `/` with Theme B; record same metrics
3. Delta must not exceed: FCP +200ms, LCP +300ms, CLS +0.05

### 7.2 CSS Bundle Size

| Metric | Before rebrand | After rebrand | Budget |
|--------|---------------|---------------|--------|
| globals.css parsed size | Measure baseline | Measure after | Max +20% increase |
| Theme-specific CSS (if split) | 0 (single file) | Measure both variants | Each variant <= 1.2x baseline |
| Unused CSS on dashboard | 0 theme CSS | Must be 0 | No Candidate B CSS loaded on dashboard pages |

**Test procedure:**
1. Build production bundle: `npm run build`
2. Check `.next/static/css/` output sizes
3. Run `npx @next/bundle-analyzer` if available

### 7.3 Lighthouse Scores

| Page | Metric | Target |
|------|--------|--------|
| `/` (Theme A) | Performance | >= 90 |
| `/` (Theme B) | Performance | >= 85 (new fonts allowed small regression) |
| `/` (Theme A) | Accessibility | >= 95 |
| `/` (Theme B) | Accessibility | >= 95 |
| `/` (Theme A) | Best Practices | >= 90 |
| `/` (Theme B) | Best Practices | >= 90 |
| `/dashboard` | Performance | >= 80 (no regression from baseline) |

---

## 8. Smoke Test Checklist

### 8.1 Quick Manual Checklist (Both Candidates)

Run this for each theme candidate. Each item takes <30 seconds.

**Public pages (per locale -- he, en, ar, ru):**

- [ ] Landing page loads, brand name visible in navbar
- [ ] Landing page hero section renders with correct typography
- [ ] Footer shows correct brand name and copyright year
- [ ] Browser tab title contains "Lyriosa" (or localized equivalent)
- [ ] Mobile hamburger menu opens, shows brand name
- [ ] Language switcher works, brand name updates per locale
- [ ] `/login` page shows brand logo and back-to-home link with correct name
- [ ] `/register` page loads enrollment wizard
- [ ] `/privacy` page shows updated brand name in policy text
- [ ] `/accessibility` page shows updated brand name
- [ ] `/available-now` page loads slot cards
- [ ] `/about` page loads conservatorium list
- [ ] `/contact` page loads
- [ ] `/help` page shows updated help center title

**Critical user journeys (en locale, both themes):**

- [ ] Register flow: `/register` -> fill details -> see contract step -> brand name correct in contract
- [ ] Login flow: `/login` -> enter `admin@harmonia.local` -> reach dashboard
- [ ] Dashboard: Sidebar nav loads, no "Lyriosa" text visible in UI (unless part of conservatorium name)
- [ ] Book lesson: `/dashboard/schedule/book` -> select teacher -> select date -> confirm
- [ ] Billing: `/dashboard/billing` -> verify currency shows `(currency symbol)` not "ILS"
- [ ] Settings: `/dashboard/settings` -> DSAR section visible
- [ ] Cookie banner: Clear localStorage, reload `/` -> cookie banner appears with correct brand name
- [ ] Playing School: `/playing-school` -> badge text shows updated brand, not "Lyriosa"

### 8.2 Automated Smoke Test Extension

Extend the existing `e2e/smoke.spec.ts` with:

1. **Brand name assertion in public pages:** For each `PUBLIC_ROUTES` entry, assert that page body text does NOT contain the literal string "Lyriosa" (catches missed renames). Exception: conservatorium names that legitimately include "Lyriosa" (none currently exist).

2. **Locale-specific brand name check:** For each of the 4 locale landing pages, assert the navbar brand text matches the expected localized form.

3. **Theme-specific route assertion:** Add a test tag `@theme-b` that runs the public page smoke suite with `NEXT_PUBLIC_LANDING_THEME=b`.

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Residual "Lyriosa" in edge-case translation strings | High | Medium | Automated grep test in CI pipeline |
| Arabic locale has mixed Latin/Arabic brand references | Known | Medium | Fix all Arabic translation files consistently |
| localStorage key rename breaks active sessions | High (if renamed) | High | Use migration pattern or keep old keys |
| Cookie consent re-prompt after key rename | Medium (if renamed) | Low | Acceptable; or keep old key |
| Candidate B fonts fail to load for Hebrew/Arabic subsets | Medium | High | Test Heebo for Hebrew, verify Arabic coverage in Plus Jakarta Sans |
| Candidate B color contrast fails WCAG AA | Medium | High | Run axe-core on all pages before launch |
| OG image not updated | Low | Medium | Checklist item; CI check for file existence |
| AI prompts still say "Lyriosa" | Medium | Low | Grep-based scan covers these files |
| Invoice PDF footer still says "Lyriosa" | Medium | Medium | Hardcoded HTML string in route handler; covered in Category B scan |
| Supabase bucket name `harmonia-private` breaks storage | High (if renamed) | Critical | Do NOT rename bucket; or create alias |
| Dev server crashes under parallel visual regression runs | Known | Medium | Run with `--workers=1` as documented |
| Email sender name still says "Lyriosa" | Medium | Medium | Covered in Category B; requires SendGrid config update too |

---

## Appendix A: File Reference Index

All files requiring modification, grouped by change type:

**Translation files (28 files):**
- `src/messages/{he,en,ar,ru}/{common,public,enrollment,admin,student,settings,billing}.json`

**Source code -- hardcoded brand strings (15 files):**
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/app/api/invoice-pdf/[invoiceId]/route.ts`
- `src/app/api/ps/qr/route.ts`
- `src/lib/notifications/payment-notifications.ts`
- `src/lib/db/adapters/supabase.ts`
- `src/lib/db/adapters/postgres.ts`
- `src/ai/flows/nurture-lead-flow.ts`
- `src/ai/flows/help-assistant-flow.ts`
- `src/components/dashboard/harmonia/admin-command-center.tsx`
- `src/components/harmonia/conservatorium-public-profile-page.tsx`

**Test files requiring update (12 files):**
- `tests/auth/callback-url-sanitization.test.ts`
- `tests/auth/with-auth-roles.test.ts`
- `tests/lib/auth-utils.test.ts`
- `e2e/flows/auth.spec.ts`
- `e2e/flows/announcements.spec.ts`
- `e2e/flows/consent-banner.spec.ts`
- `e2e/security/tenant-isolation.spec.ts`
- `e2e/security/security.spec.ts`
- `e2e/integration/cross-feature.spec.ts`
- `e2e/full-audit/screenshot-all-screens.spec.ts`
- `tests/components/landing-page.test.tsx` (path import only, may not need change)
- `tests/lib/playing-school-utils.test.ts`

**Infrastructure identifiers (decision required, ~10 files):**
- `src/hooks/use-auth.tsx`
- `src/hooks/domains/auth-domain.tsx`
- `src/hooks/domains/users-domain.tsx`
- `src/lib/auth-cookie.ts`
- `src/app/actions/auth.ts`
- `src/app/actions/storage.ts`
- `src/proxy.ts`
- `src/lib/auth-utils.ts`
- `src/components/consent/cookie-banner.tsx`

---

## Appendix B: Automation Command Reference

```bash
# Run existing smoke tests
npx playwright test --grep @smoke --workers=1 --timeout=90000

# Run RTL regression tests
npx playwright test e2e/i18n-rtl-regression.spec.ts --workers=1

# Run Vitest unit tests
npx vitest run

# TypeScript check
npx tsc --noEmit

# Grep for residual Lyriosa strings (quick manual check)
# In translation files:
grep -r "Lyriosa\|הרמוניה\|هارمونيا\|Гармония" src/messages/
# In source code:
grep -rn "'Lyriosa'\|\"Lyriosa\"" src/ --include="*.ts" --include="*.tsx"
```
