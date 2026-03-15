# Lyriosa Rebrand -- Consolidated Design Specification

**Version:** 1.0
**Date:** 2026-03-15
**Status:** Implementation-ready
**Consolidated from:** Architect, UX Designer, Product Manager, QA Lead, UI Engineer

---

## 1. Overview

### What We Are Doing

Rebranding the platform from **Harmonia** to **Lyriosa** across all user-visible surfaces, with two visual identity candidates for public-facing pages (A/B tested via server-side toggle), while the dashboard remains locked to Candidate A.

| Locale | Old Brand | New Brand |
|--------|-----------|-----------|
| en | Harmonia | Lyriosa |
| he | הַרמוֹנְיָה | ליריוסה |
| ar | هارمونيا | ليريوسا |
| ru | Гармония | Лириоса |

### Greenfield Context

This is a pre-launch project with zero production users, no live data, and no migration concerns. All localStorage keys, cookie names, Supabase bucket names, and translation strings can be renamed directly -- no dual-key fallbacks, no migration scripts, no transition periods.

### Key Decisions

| Decision | Resolution |
|----------|-----------|
| Theme toggle mechanism | `NEXT_PUBLIC_LANDING_THEME='a'\|'b'` env var on `<html data-theme>` |
| Dashboard theming | Always Candidate A (`data-theme="a"` forced on dashboard layout wrapper) |
| AI assistant name | "Harmony" renamed to "Lyria" |
| Directory rename (`src/components/harmonia/`) | Deferred -- internal path, not user-visible |
| localStorage/cookie keys | Rename directly (greenfield -- no migration needed) |
| Domain | `lyriosa.co.il` (DNS setup is post-rebrand; use `NEXT_PUBLIC_SITE_URL` env var) |
| Supabase bucket | Rename `harmonia-private` to `lyriosa-private` (greenfield -- no data to migrate) |

---

## 2. Architecture

### Theme System

```
NEXT_PUBLIC_LANDING_THEME env var
        |
        v
src/lib/themes/active-theme.ts
  exports getActiveTheme(): 'a' | 'b'
        |
        v
layout.tsx (Server Component)
  reads getActiveTheme(), sets <html data-theme="a|b"> server-side
        |
        v
BrandThemeProvider (Client Component)
  reads existing data-theme from DOM, exposes useBrandTheme() hook
  (does NOT set data-theme — that is done server-side to avoid hydration mismatch)
        |
        +--> Public pages: read data-theme, apply CSS variables
        +--> Dashboard: data-theme="a" forced on wrapper div
```

### File Structure (New Files)

```
src/lib/
  brand.ts                    # BRAND_NAME, BRAND_DOMAIN, BRAND_SUPPORT_EMAIL
  themes/
    active-theme.ts           # getActiveTheme(): 'a' | 'b'

src/components/
  brand-theme-provider.tsx    # Client context: reads existing data-theme from DOM, exposes useBrandTheme() hook (does NOT set the attribute — layout.tsx Server Component does that)
  icons.tsx                   # Updated logo SVG with theme prop (32x32 A, 34x34 B)

src/app/globals.css           # Extended with theme CSS variables (see Section 3)

public/
  images/og-lyriosa.jpg       # New OG image
  favicon.ico                 # New favicon set
  favicon-16x16.png
  favicon-32x32.png
  apple-touch-icon.png
  site.webmanifest            # New web manifest
```

### Data Flow

```
Server Start
  |
  +-- Read NEXT_PUBLIC_LANDING_THEME (default: 'a')
  |
  +-- layout.tsx
  |     |
  |     +-- Load ALL 4 Google Fonts unconditionally (next/font/google)
  |     +-- Set CSS variables: --font-heading, --font-body, --font-rtl, --font-display
  |     +-- Render <html data-theme={theme} lang={locale} dir={dir}>
  |     |
  |     +-- Public routes: theme applied via CSS variable cascade
  |     +-- Dashboard routes: <div data-theme="a"> wrapper overrides
  |
  +-- globals.css
        |
        +-- :root { /* Candidate A defaults (light) */ }
        +-- .dark { /* Candidate A dark mode */ }
        +-- [data-theme="b"] { /* Candidate B overrides (light) */ }
        +-- .dark[data-theme="b"] { /* Candidate B dark mode */ }
        +-- [dir="rtl"] body { font-family: var(--font-rtl) }
```

---

## 3. Design System

### 3.1 Color Tokens

All values in HSL. Light mode shown; dark mode inverts foreground/background relationships.

> **Precision note:** Candidate A tokens must be copied verbatim from the existing `globals.css` `:root` block, preserving decimal precision (e.g., `222.2 84% 4.9%`). Do not use the rounded values from this summary table.

| Token | Candidate A (Light) | Candidate A (Dark) | Candidate B (Light) | Candidate B (Dark) |
|-------|--------------------|--------------------|--------------------|--------------------|
| `--background` | 210 40% 98% | 224 71% 4% | 220 30% 96% | 222 47% 6% |
| `--foreground` | 222 84% 5% | 210 40% 98% | 222 84% 5% | 210 40% 98% |
| `--primary` | 240 59% 50% | 240 59% 66% | 43 50% 54% | 43 50% 54% |
| `--primary-foreground` | 210 40% 98% | 224 71% 4% | 222 47% 6% | 222 47% 6% |
| `--secondary` | 214 32% 91% | 215 28% 17% | 220 30% 92% | 215 28% 17% |
| `--secondary-foreground` | 222 47% 11% | 210 40% 98% | 222 47% 11% | 210 40% 98% |
| `--muted` | 214 32% 91% | 215 28% 17% | 220 30% 91% | 215 28% 17% |
| `--muted-foreground` | 215 16% 47% | 217 13% 64% | 215 16% 47% | 217 13% 64% |
| `--accent` | 214 32% 91% | 215 28% 17% | 240 59% 50% | 240 59% 66% |
| `--accent-foreground` | 222 47% 11% | 210 40% 98% | 210 40% 98% | 210 40% 98% |
| `--destructive` | 0 84% 60% | 0 63% 31% | 0 84% 60% | 0 63% 31% |
| `--ring` | 240 59% 50% | 240 59% 66% | 43 50% 54% | 43 50% 54% |
| `--border` | 214 32% 91% | 215 28% 17% | 214 32% 91% | 215 28% 17% |

**Key difference:** Candidate A uses indigo (`240 59% 50%` / `#6366f1`) as primary. Candidate B uses gold (`43 50% 54%` / `#C9A84C`) as primary with indigo as accent for CTAs.

### 3.2 Typography

| Role | Candidate A | Candidate B |
|------|-------------|-------------|
| Headings (Latin) | Playfair Display (serif) | Frank Ruhl Libre (serif) |
| Body (Latin) | Plus Jakarta Sans (sans-serif) | Heebo (sans-serif) |
| Logo / display (Latin) | Playfair Display | Playfair Display |
| Hebrew headings | Heebo (sans-serif) | Frank Ruhl Libre |
| Hebrew body | Heebo | Heebo |
| RTL override | `var(--font-rtl)` = Heebo | `var(--font-rtl)` = Heebo |
| Font scale (h1) | 3.5rem / 900 | 4rem / 700 |
| Font scale (h2) | 2.25rem / 700 | 2.5rem / 700 |
| Font scale (body) | 1rem / 400 | 1.125rem / 400 |

**CSS variable mapping:**

```css
:root {
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --font-rtl: 'Heebo', sans-serif;
  --font-display: 'Playfair Display', serif;
}
[data-theme="b"] {
  --font-heading: 'Frank Ruhl Libre', serif;
  --font-body: 'Heebo', sans-serif;
  --font-display: 'Playfair Display', serif;
}
```

### 3.3 CTA Hierarchy

| Level | Style | Candidate A | Candidate B |
|-------|-------|-------------|-------------|
| Primary | Filled | Indigo bg, white text | Gold bg, dark navy text |
| Secondary | Outline | Indigo border, indigo text | Gold border, gold text |
| Tertiary | Text + icon | Indigo text, underline on hover | Gold text, arrow icon |

### 3.4 Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape / small laptop |
| xl | 1280px | Desktop |

---

## 4. Page-by-Page Design

### Public Pages (Theme-Sensitive)

| Page | Route | Candidate A Key Treatment | Candidate B Key Treatment |
|------|-------|---------------------------|---------------------------|
| Landing | `/` | Clean sections, indigo stats bar, animated cards | Full-viewport cinematic hero, string texture overlay, grain effect, gold stats bar with semi-transparent bg |
| About | `/about` | Standard card grid | Gold accent borders on cards, serif headings |
| Conservatorium Profile | `/about/[slug]` | Standard profile layout | Concert-hall aesthetic, gold teacher cards |
| Available Now | `/available-now` | Indigo urgency badges | Gold urgency badges, navy card backgrounds |
| Musicians | `/musicians` | Standard listing | Gallery-style with hover gold reveal |
| Login | `/login` | Transitional page -- both themes use neutral palette with brand logo. Bridges public theme to dashboard. |
| Register | `/register` | Standard wizard | Serif headings, gold progress indicator |
| Playing School | `/playing-school` | Indigo badge + stats | Gold badge, cinematic hero |
| Donate | `/donate` | Standard form | Warm gold accent, testimonial cards |
| Open Day | `/open-day` | Event card layout | Concert poster aesthetic |
| Contact | `/contact` | Standard form | Subtle texture background |
| Privacy | `/privacy` | Standard legal text | Same (legal pages minimal theming) |
| Accessibility | `/accessibility` | Standard legal text | Same |
| Help | `/help` | Indigo accent | Gold accent, "Lyria" AI assistant branding |
| Apply for Aid | `/apply-for-aid` | Standard form | Serif headings, warm tones |
| Matchmaker | `/apply/matchmaker` | Standard | Hebrew-first serif layout |
| Try | `/try` | Standard | Gold-accented trial cards |
| Pending Approval | `/pending-approval` | Status card | Elegant waiting state with gold spinner |

### Dashboard Pages (Theme-Immune)

All 63+ dashboard routes always render with Candidate A tokens. `data-theme="a"` is forced on the dashboard layout wrapper div regardless of the env var setting.

---

## 5. Font Strategy

### Loading

All 4 Google Fonts are declared unconditionally in `layout.tsx` via `next/font/google` with `display: 'swap'`:

```
Playfair Display  -- weights: 400, 700, 900 -- subsets: latin, latin-ext
Plus Jakarta Sans -- weights: 400, 500, 600, 700 -- subsets: latin, latin-ext
Heebo             -- weights: 400, 500, 700 -- subsets: hebrew, latin
Frank Ruhl Libre  -- weights: 400, 700 -- subsets: hebrew, latin
```

### Activation

Fonts are activated via CSS variables. The `data-theme` attribute selects which CSS variable values are active. Only the fonts referenced by the active theme's CSS variables will render (unused fonts are loaded but idle -- acceptable tradeoff for instant theme switching without layout shift).

### RTL Handling

```css
[dir="rtl"] body {
  font-family: var(--font-rtl); /* Heebo for both candidates */
}
[dir="rtl"] h1, [dir="rtl"] h2, [dir="rtl"] h3 {
  font-family: var(--font-heading); /* Theme-dependent: Heebo (A) or Frank Ruhl Libre (B) */
}
```

### Performance Budget

| Metric | Budget |
|--------|--------|
| Total font file transfer | < 500KB |
| FCP regression vs. baseline | < 200ms |
| LCP regression vs. baseline | < 300ms |
| CLS regression | < 0.05 |
| Font display strategy | `swap` (FOUT acceptable, FOIT is not) |

---

## 6. Brand Name Changes

### 6.1 Brand Constants File

New file: `src/lib/brand.ts`

```typescript
export const BRAND_NAME = 'Lyriosa'
export const BRAND_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lyriosa.co.il'
export const BRAND_SUPPORT_EMAIL = 'support@lyriosa.co.il'
export const BRAND_PRIVACY_EMAIL = 'privacy@lyriosa.co.il'
export const BRAND_A11Y_EMAIL = 'accessibility@lyriosa.co.il'
export const BRAND_DEV_EMAIL = 'dev@lyriosa.local'
export const AI_ASSISTANT_NAME = 'Lyria'
```

All hardcoded brand strings in source code must import from this file instead of using string literals.

### 6.2 Translation File Inventory

**25 JSON files** across 4 locales x 6 namespaces + 1 locale x 1 namespace require brand name updates:

| Namespace | Files | Approximate String Count |
|-----------|-------|------------------------|
| `common.json` | he, en, ar, ru | ~9 keys/locale (siteName, privacy policy, accessibility, financial aid) |
| `public.json` | he, en, ar, ru | ~7 keys/locale (home title, about, musicians, help center, landing fallbacks) |
| `enrollment.json` | he, en, ar, ru | ~11 keys/locale (wizard subtitle, contract sections, playing school) |
| `admin.json` | he, en, ar, ru | ~2 keys/locale (logo, aid title, ministry title) |
| `student.json` | he, en, ar, ru | ~1 key/locale (schedule assistant greeting) |
| `settings.json` | he, en, ar, ru | ~1 key/locale (standard terms title) |
| `billing.json` | he only | ~1 key (security notice) |

**Total: ~105+ individual key-value pair updates across 25 files.**

**Known bug:** Arabic locale (`ar/student.json:471`, `ar/common.json:954,957,1002`) uses Latin "Harmonia" instead of Arabic script. Must be corrected to "ليريوسا" during the rename.

### 6.3 Source Code Hardcoded Strings

**19 source files** with hardcoded brand references (all must import from `brand.ts`):

| File | References |
|------|-----------|
| `src/app/[locale]/layout.tsx` | Fallback `'Harmonia'` in catch block |
| `src/app/[locale]/page.tsx` | `generateMetadata()`: title, OG title, OG image path, canonical URLs. **Note:** `generateMetadata()` is not locale-aware — should either be removed (deferring to `layout.tsx`) or updated to use `params.locale` |
| `src/app/[locale]/about/[slug]/page.tsx` | Fallback URL, description text |
| `src/app/[locale]/error.tsx` | Console log `[Harmonia Error]` |
| `src/app/robots.ts` | Sitemap URL |
| `src/app/sitemap.ts` | Base URL |
| `src/app/api/invoice-pdf/[invoiceId]/route.ts` | PDF footer: brand name + email |
| `src/app/api/ps/qr/route.ts` | QR code base URL. **Note:** Uses `NEXT_PUBLIC_APP_URL` — should be aligned with `BRAND_DOMAIN` from `brand.ts` |
| `src/ai/flows/help-assistant-flow.ts` | AI prompt: "Harmonia", "Harmony" |
| `src/ai/flows/nurture-lead-flow.ts` | AI prompt: "Harmonia" |
| `src/lib/notifications/payment-notifications.ts` | Email sender name |
| `src/lib/db/adapters/supabase.ts` | Fallback conservatorium name |
| `src/lib/db/adapters/postgres.ts` | Fallback conservatorium name |
| `src/components/dashboard/harmonia/admin-command-center.tsx` | Fallback name |
| `src/components/harmonia/conservatorium-public-profile-page.tsx` | Fallback site URL |
| `src/app/actions/auth.ts` | `harmonia-user` cookie name |
| `src/app/api/auth/login/route.ts` | `harmonia-user` cookie name |
| `src/app/api/auth/logout/route.ts` | `harmonia-user` cookie name |
| `src/lib/playing-school-utils.ts` | `@playing-school.harmonia.io` email domain |

### 6.4 Infrastructure Identifiers (Direct Rename -- Greenfield)

Since there are no existing users, all infrastructure identifiers are renamed directly with no migration logic:

| Old Identifier | New Identifier | Files |
|---------------|---------------|-------|
| `harmonia-user` (localStorage) | `lyriosa-user` | `use-auth.tsx`, `auth-domain.tsx`, `users-domain.tsx` |
| `harmonia-user` (cookie) | `lyriosa-user` | `auth-cookie.ts`, `auth.ts` actions |
| `harmonia_cookie_consent` | `lyriosa_cookie_consent` | `cookie-banner.tsx` |
| `harmonia_locale` | `lyriosa_locale` | `language-switcher.tsx` |
| `harmonia.a11y.*` | `lyriosa.a11y.*` | `accessibility-panel.tsx` |
| `harmonia.help.*` | `lyriosa.help.*` | `ai-help-assistant.tsx` |
| `harmonia-walkthrough-seen` | `lyriosa-walkthrough-seen` | E2E tests only |
| `harmonia-private` (Supabase bucket) | `lyriosa-private` | `storage.ts` |
| `HarmoniaClaims` (TypeScript) | `LyriosaClaims` | `auth-utils.ts` |
| `dev@harmonia.local` | `dev@lyriosa.local` | `proxy.ts`, `auth-utils.ts` |
| `admin@harmonia.dev` | `admin@lyriosa.dev` | E2E test files |
| `noreply@harmonia.co.il` | `noreply@lyriosa.co.il` | `payment-notifications.ts` |

### 6.5 Static Assets

| Asset | Action |
|-------|--------|
| OG image | Create `public/images/og-lyriosa.jpg` (delete old reference) |
| Favicon | Create `public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` |
| Web manifest | Create `public/site.webmanifest` with `"name": "Lyriosa"` |
| Logo SVG | Update `src/components/icons.tsx` with new `logoContainer` component (theme-aware: 32x32 A, 34x34 B, gradient backgrounds) |
| Mock data URLs | Update `websiteOverride` map in `data.ts` (`harmonia.co.il` references) |

---

## 7. Build Sequence

### Phase 1: Infrastructure (Foundation)

Create the theme system plumbing. No visual changes yet.

| # | Task | Files |
|---|------|-------|
| 1.1 | Create `src/lib/brand.ts` with all brand constants | New file |
| 1.2 | Create `src/lib/themes/active-theme.ts` | New file |
| 1.3 | Create `src/components/brand-theme-provider.tsx` | New file |
| 1.4 | Wire `BrandThemeProvider` into `src/app/[locale]/layout.tsx` | Modify |
| 1.5 | Add `data-theme="a"` force on dashboard layout wrapper | Modify `src/app/[locale]/dashboard/layout.tsx` |

**Checkpoint:** `npx tsc --noEmit` passes, theme provider renders, `getActiveTheme()` returns 'a' by default.

### Phase 2: CSS Variables

Add all theme tokens to `globals.css`. No visual changes on existing pages yet (`:root` defaults match current values).

| # | Task | Files |
|---|------|-------|
| 2.1 | Add Candidate A tokens as `:root` defaults | `src/app/globals.css` |
| 2.2 | Add Candidate B tokens under `[data-theme="b"]` | `src/app/globals.css` |
| 2.3 | Add dark mode variants (`.dark`, `.dark[data-theme="b"]`) | `src/app/globals.css` |
| 2.4 | Add `--color-brand-*` tokens, `--font-heading`/`--font-body`/etc. font families inside the `@theme {}` block (Tailwind v4 — no `tailwind.config.ts`) | `src/app/globals.css` |
| 2.5 | Add Candidate B keyframes (if any animations differ) inside the `@theme {}` block | `src/app/globals.css` |

**Checkpoint:** Toggle `data-theme` in browser DevTools, verify CSS variables change.

### Phase 3: Fonts

Load all 4 Google Fonts; activate via CSS variables.

| # | Task | Files |
|---|------|-------|
| 3.1 | Declare all 4 fonts via `next/font/google` in layout.tsx | `src/app/[locale]/layout.tsx` |
| 3.2 | Remove `Rubik` font declaration from layout.tsx. Update `@theme {}` block in `globals.css` to define `--font-body: var(--font-plus-jakarta)`, `--font-heading: var(--font-playfair)`, etc. The existing `font-body` Tailwind utility class on `<body>` will resolve through the CSS variable instead of the hardcoded Rubik reference in the now-obsolete `tailwind.config.ts` `fontFamily`. | `src/app/[locale]/layout.tsx`, `src/app/globals.css` |
| 3.3 | Add `--font-heading`, `--font-body`, `--font-rtl`, `--font-display` CSS variables | `src/app/globals.css` |
| 3.4 | Add `[data-theme="b"]` font overrides | `src/app/globals.css` |
| 3.5 | Add `[dir="rtl"] body` font override rule | `src/app/globals.css` |

**Checkpoint:** Both themes render correct fonts; Hebrew pages use Heebo body.

### Phase 4: Brand Constants

Replace all hardcoded brand strings with imports from `brand.ts`.

| # | Task | Files |
|---|------|-------|
| 4.1 | Replace hardcoded strings in 19 source files (Section 6.3) | See file list above |
| 4.2 | Rename all infrastructure identifiers (Section 6.4) | ~12 files |
| 4.3 | Create static assets (OG image, favicons, manifest) | `public/` directory |
| 4.4 | Update logo in `icons.tsx` with theme-aware component | `src/components/icons.tsx` |
| 4.5 | Update `data.ts` mock conservatorium URLs | `src/lib/data.ts` |

**Checkpoint:** Grep for "Harmonia" in source code returns zero hits outside `CLAUDE.md` / docs.

### Phase 5: Translation JSON

Update all 25 translation files across 4 locales.

| # | Task | Files |
|---|------|-------|
| 5.1 | Update `common.json` (all 4 locales) | 4 files |
| 5.2 | Update `public.json` (all 4 locales) | 4 files |
| 5.3 | Update `enrollment.json` (all 4 locales) | 4 files |
| 5.4 | Update `admin.json` (all 4 locales) | 4 files |
| 5.5 | Update `student.json` (all 4 locales) | 4 files |
| 5.6 | Update `settings.json` (all 4 locales) | 4 files |
| 5.7 | Update `billing.json` (he only -- other locales have no brand strings) | 1 file |
| 5.8 | Fix Arabic locale inconsistencies (Latin "Harmonia" in Arabic text) | `ar/student.json`, `ar/common.json` |

**Checkpoint:** `grep -r "Harmonia\|הרמוניה\|هارمونيا\|Гармония" src/messages/` returns zero hits.

### Phase 6: Component Theming

Apply theme-conditional styles to public page components. Single component pattern with theme-keyed style maps (NOT separate A/B component files).

| # | Task | Files |
|---|------|-------|
| 6.1 | Theme the landing page hero section | `public-landing-page.tsx` |
| 6.2 | Theme the stats bar | `public-landing-page.tsx` |
| 6.3 | Theme navigation (navbar, footer) | `public-navbar.tsx`, `public-footer.tsx` |
| 6.4 | Theme login page (transitional) | Login page component |
| 6.5 | Theme remaining public pages (about, register, etc.) | Various components |
| 6.6 | Add Candidate B-specific elements (texture overlay, grain, vignette) | New CSS / component additions |

**Component pattern:**
```tsx
const themeStyles = {
  a: { hero: 'bg-background', heading: 'font-heading text-4xl' },
  b: { hero: 'bg-navy-950 bg-texture', heading: 'font-display text-5xl' },
}
const theme = useBrandTheme()
// Use themeStyles[theme].hero etc.
```

**Checkpoint:** Both themes render correctly on all public pages across all 4 locales.

### Phase 7: Tests

Update broken tests, add new tests, capture visual baselines.

| # | Task | Files |
|---|------|-------|
| 7.1 | Update ~20 broken test files (Section 8.2) | See test file list |
| 7.2 | Add brand name grep CI test (Vitest) | New test file |
| 7.3 | Add theme toggle unit tests (Vitest) | New test file |
| 7.4 | Add dashboard theme isolation test (Playwright) | New test file |
| 7.5 | Add brand name navbar/footer/OG tests per locale (Playwright) | New test file |
| 7.6 | Capture visual regression baselines (16 matrix combinations) | `e2e/screenshots/` |
| 7.7 | Run full existing test suite | All existing test files |

**Checkpoint:** `npx vitest run` all pass, `npx playwright test --grep @smoke --workers=1` all pass, `npx tsc --noEmit` zero errors.

---

## 8. Test Plan

### 8.1 Theme Toggle Test Matrix

16 combinations (2 themes x 4 locales x 2 viewports):

| Theme | he Desktop | he Mobile | en Desktop | en Mobile | ar Desktop | ar Mobile | ru Desktop | ru Mobile |
|-------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| A | T-A-he-D | T-A-he-M | T-A-en-D | T-A-en-M | T-A-ar-D | T-A-ar-M | T-A-ru-D | T-A-ru-M |
| B | T-B-he-D | T-B-he-M | T-B-en-D | T-B-en-M | T-B-ar-D | T-B-ar-M | T-B-ru-D | T-B-ru-M |

Each cell requires: landing page renders, correct fonts load, correct colors apply, brand name correct, RTL layout correct (he/ar).

### 8.2 Existing Tests That Will Break (~20 Files)

> **Note:** This list covers the known cases. The Phase 7 grep checkpoint (`grep -r "harmonia\|Harmonia" tests/ e2e/`) will catch any remaining files not listed here.

**Vitest (4 files):**

| File | What Breaks | Fix |
|------|------------|-----|
| `tests/components/landing-page.test.tsx` | Import path (if renamed) | Update import if component path changes |
| `tests/auth/callback-url-sanitization.test.ts` | `'https://harmonia.co.il.evil.com'` test URL | Replace domain |
| `tests/auth/with-auth-roles.test.ts` | `'dev@harmonia.local'` | Replace with `dev@lyriosa.local` |
| `tests/lib/auth-utils.test.ts` | `'dev@harmonia.local'` | Replace with `dev@lyriosa.local` |

**Playwright (8 files):**

| File | What Breaks | Fix |
|------|------------|-----|
| `e2e/flows/auth.spec.ts` | `a:has-text("Harmonia")` selector, `admin@harmonia.local` | Update brand text, email |
| `e2e/flows/announcements.spec.ts` | `admin@harmonia.dev`, `harmonia-user` localStorage | Replace identifiers |
| `e2e/flows/consent-banner.spec.ts` | `harmonia_cookie_consent` key | Replace key |
| `e2e/security/tenant-isolation.spec.ts` | Multiple `harmonia-user`, `dev@harmonia.local` | Replace all |
| `e2e/security/security.spec.ts` | `admin@harmonia.local` | Replace email |
| `e2e/integration/cross-feature.spec.ts` | `dev@harmonia.local`, `harmonia-user` | Replace all |
| `e2e/full-audit/screenshot-all-screens.spec.ts` | `harmonia-user`, `harmonia-walkthrough-seen`, `dev@harmonia.local` | Replace all |
| `tests/lib/playing-school-utils.test.ts` | Potential brand reference | Check and update |

### 8.3 New Tests Required

| Test | Type | Purpose |
|------|------|---------|
| Brand name grep scan | Vitest | CI-runnable scan of `src/messages/**/*.json` for residual old brand strings; fail if any found |
| Theme selection logic | Vitest | `getActiveTheme()` returns correct value for `'a'`, `'b'`, `undefined`, `'invalid'` |
| Theme A landing render | Vitest | Render landing page with theme=a, verify Candidate A CSS classes |
| Theme B landing render | Vitest | Render landing page with theme=b, verify Candidate B CSS classes |
| Dashboard theme isolation | Playwright | Load dashboard with theme=b, assert zero Candidate B CSS on dashboard elements |
| Brand name in navbar (x4 locales) | Playwright | Assert navbar brand text matches expected localized Lyriosa form |
| Brand name in footer (x4 locales) | Playwright | Assert footer copyright contains Lyriosa form |
| OG meta tags | Playwright | Assert `meta[property="og:site_name"]` is "Lyriosa" |
| Page title | Playwright | Assert `document.title` contains "Lyriosa" |
| Font loading (Theme A) | Playwright | Assert correct font network requests |
| Font loading (Theme B) | Playwright | Assert Playfair Display + Frank Ruhl Libre in network log |
| Visual regression (16 combos) | Playwright | Screenshot baselines for all theme/locale/viewport combinations |
| No-CSS-variable-leak | Playwright | Theme B, inspect `:root` vars on dashboard -- must match dashboard values |

### 8.4 Smoke Checklist Per Theme Per Locale (22 Items)

For each of the 8 theme+locale combinations:

1. Landing page loads, brand name visible in navbar
2. Hero section renders with correct typography (serif/sans per theme)
3. Footer shows correct brand name and copyright year
4. Browser tab title contains "Lyriosa" (or localized form)
5. Mobile hamburger menu opens, shows brand name
6. Language switcher works, brand name updates per locale
7. `/login` shows brand logo and back-to-home link with correct name
8. `/register` loads enrollment wizard
9. `/privacy` shows updated brand name in policy text
10. `/accessibility` shows updated brand name
11. `/available-now` loads slot cards
12. `/about` loads conservatorium list
13. `/contact` loads
14. `/help` shows updated help center title with "Lyria" AI name
15. Register flow: contract step shows "Lyriosa" (not "Harmonia")
16. Dashboard: no "Harmonia" text visible in UI
17. Book lesson flow: teacher select -> date -> confirm works
18. Billing: currency shows symbol not "ILS"
19. Settings: DSAR section visible
20. Cookie banner: clear localStorage, reload, banner appears
21. Playing School: badge and subtitle show updated brand
22. AI assistant: greeting says "Lyria" not "Harmony"

### 8.5 Accessibility Verification

| Check | Target | Tool |
|-------|--------|------|
| Color contrast (both themes, light + dark) | WCAG AA (4.5:1 normal, 3:1 large) | axe-core via `@axe-core/playwright` |
| Focus states visible against both theme backgrounds | All interactive elements | Manual tab-through |
| Screen reader brand pronunciation | "Lyriosa" not spelled letter-by-letter | NVDA / VoiceOver |
| `<html lang>` attribute | Matches locale | Automated check |
| Skip-to-content link | Present and functional | Manual |

**Known contrast risk:** Candidate B muted text `#94a3b8` against light bg `#f8fafc` may fail AA. Verify and adjust.

### 8.6 Performance Verification

| Metric | Page | Theme A Target | Theme B Target |
|--------|------|---------------|---------------|
| Lighthouse Performance | `/` | >= 90 | >= 85 |
| Lighthouse Accessibility | `/` | >= 95 | >= 95 |
| Lighthouse Best Practices | `/` | >= 90 | >= 90 |
| Lighthouse Performance | `/dashboard` | >= 80 | >= 80 (same -- forced A) |
| CSS bundle size delta | All | Baseline | <= 1.2x baseline |
| Font transfer total | All | Baseline | < 500KB |

---

## 9. Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | Residual "Harmonia" in edge-case translation strings | High | Medium | Automated grep test in CI; fail build if found |
| R2 | Arabic locale mixed Latin/Arabic brand references | Known | Medium | Fix all Arabic files; grep scan catches this |
| R3 | Candidate B fonts fail for Hebrew/Arabic subsets | Medium | High | Test Heebo Hebrew, verify Arabic coverage in Plus Jakarta Sans; fallback chain in CSS |
| R4 | Candidate B color contrast fails WCAG AA | Medium | High | Run axe-core on all pages pre-launch; known risk with muted text on light bg |
| R5 | Font loading adds >200ms to FCP | Medium | Medium | All fonts use `display: 'swap'`; measure with Lighthouse; budget 500KB total |
| R6 | Dashboard CSS leaks from Candidate B | Medium | High | `data-theme="a"` forced on dashboard wrapper; dedicated isolation test |
| R7 | OG image not created/deployed | Low | Medium | Checklist item; CI check for file existence |
| R8 | AI prompts still reference "Harmonia"/"Harmony" | Medium | Low | Covered by source code grep scan |
| R9 | Invoice PDF still says "Harmonia" | Medium | Medium | Hardcoded string in route handler; covered in Phase 4 |
| R10 | Supabase bucket rename fails | Low | Critical | Greenfield -- create new bucket directly, no rename needed |
| R11 | Dev server memory crash under parallel visual regression | Known | Medium | Run with `--workers=1` as per project convention |
| R12 | Email sender name still shows "Harmonia" | Medium | Medium | Covered in Phase 4; also requires SendGrid/email provider config update |
| R13 | SEO ranking drop after domain change | Medium | Medium | 301 redirects, 12-month `harmonia.co.il` redirect maintenance, Google Search Console change-of-address |
| R14 | Invalid `NEXT_PUBLIC_LANDING_THEME` value crashes app | Low | High | `getActiveTheme()` defaults to 'a' for any non-'b' value |
| R15 | next/font/google loads all 4 fonts on every page (performance) | Known | Low | Acceptable tradeoff for instant theme switching; fonts are cached by browser |

---

## 10. Files Reference

### New Files to Create (11)

| File | Purpose |
|------|---------|
| `src/lib/brand.ts` | Brand constants (name, domain, emails) |
| `src/lib/themes/active-theme.ts` | Theme reader: `getActiveTheme(): 'a' \| 'b'` |
| `src/components/brand-theme-provider.tsx` | Client context: reads `data-theme` from DOM, exposes `useBrandTheme()` |
| `public/images/og-lyriosa.jpg` | Open Graph image |
| `public/favicon.ico` | Favicon |
| `public/favicon-16x16.png` | Favicon 16px |
| `public/favicon-32x32.png` | Favicon 32px |
| `public/apple-touch-icon.png` | Apple touch icon |
| `public/site.webmanifest` | Web app manifest |
| `tests/rebrand/brand-name-grep.test.ts` | CI test: no residual old brand strings |
| `tests/rebrand/theme-toggle.test.ts` | Unit tests for theme selection logic |

### Files to Modify -- Source Code (38)

| File | Change Type |
|------|------------|
| `src/app/[locale]/layout.tsx` | Font loading, BrandThemeProvider, fallback string |
| `src/app/[locale]/page.tsx` | Metadata: title, OG, canonical URLs |
| `src/app/[locale]/error.tsx` | Console log string |
| `src/app/[locale]/about/[slug]/page.tsx` | Fallback URL, description |
| `src/app/[locale]/dashboard/layout.tsx` | Force `data-theme="a"` |
| `src/app/globals.css` | All theme CSS variables |
| `src/app/robots.ts` | Sitemap URL |
| `src/app/sitemap.ts` | Base URL |
| `src/app/api/invoice-pdf/[invoiceId]/route.ts` | Brand name, email |
| `src/app/api/ps/qr/route.ts` | Base URL |
| `src/app/actions/storage.ts` | Supabase bucket name |
| `src/ai/flows/help-assistant-flow.ts` | AI prompt, assistant name |
| `src/ai/flows/nurture-lead-flow.ts` | AI prompt |
| `src/proxy.ts` | Dev email |
| `src/lib/auth-utils.ts` | Interface name, dev email |
| `src/lib/auth-cookie.ts` | Cookie name |
| `src/lib/notifications/payment-notifications.ts` | Sender name, email |
| `src/lib/db/adapters/supabase.ts` | Fallback name, bucket name |
| `src/lib/db/adapters/postgres.ts` | Fallback name |
| `src/lib/playing-school-utils.ts` | Email domain (`@playing-school.harmonia.io`) |
| `src/lib/data.ts` | Mock conservatorium URLs |
| `src/hooks/use-auth.tsx` | localStorage key |
| `src/hooks/domains/auth-domain.tsx` | localStorage key |
| `src/hooks/domains/users-domain.tsx` | localStorage key |
| `src/components/icons.tsx` | Logo SVG, theme-aware container |
| `src/components/language-switcher.tsx` | localStorage key |
| `src/components/consent/cookie-banner.tsx` | localStorage key |
| `src/components/a11y/accessibility-panel.tsx` | localStorage keys |
| `src/components/harmonia/ai-help-assistant.tsx` | localStorage keys |
| `src/components/harmonia/conservatorium-public-profile-page.tsx` | Fallback URL |
| `src/app/actions/auth.ts` | Cookie name (`harmonia-user`) |
| `src/app/api/auth/login/route.ts` | Cookie name (`harmonia-user`) |
| `src/app/api/auth/logout/route.ts` | Cookie name (`harmonia-user`) |
| `src/components/harmonia/public-landing-page.tsx` | Theme-conditional styles |
| `src/components/dashboard/harmonia/admin-command-center.tsx` | Fallback name |
| `src/components/layout/public-navbar.tsx` | Theme-aware logo |
| `src/components/layout/public-footer.tsx` | Brand name (via translations) |
| `tailwind.config.ts` | Remove if fully migrated to Tailwind v4 `@theme {}` in globals.css |

### Files to Modify -- Translations (25)

All files under `src/messages/{he,en,ar,ru}/`:
- `common.json` (x4)
- `public.json` (x4)
- `enrollment.json` (x4)
- `admin.json` (x4)
- `student.json` (x4)
- `settings.json` (x4)
- `billing.json` (x1 — he only)

### Files to Modify -- Tests (~20)

| File | Change |
|------|--------|
| `tests/components/landing-page.test.tsx` | Import path (if component renamed) |
| `tests/auth/callback-url-sanitization.test.ts` | Domain URL |
| `tests/auth/with-auth-roles.test.ts` | Dev email |
| `tests/lib/auth-utils.test.ts` | Dev email |
| `e2e/flows/auth.spec.ts` | Brand text selector, dev email |
| `e2e/flows/announcements.spec.ts` | Dev email, localStorage key |
| `e2e/flows/consent-banner.spec.ts` | Cookie consent key |
| `e2e/security/tenant-isolation.spec.ts` | localStorage keys, dev email |
| `e2e/security/security.spec.ts` | Dev email |
| `e2e/integration/cross-feature.spec.ts` | Dev email, localStorage key |
| `e2e/full-audit/screenshot-all-screens.spec.ts` | All localStorage keys, dev email |
| `tests/lib/playing-school-utils.test.ts` | Potential brand reference |

### Summary Counts

| Category | File Count |
|----------|-----------|
| New files to create | 11 |
| Source code to modify | ~38 |
| Translation files to modify | 25 |
| Test files to modify | ~20 |
| **Total files touched** | **~94** |

---

*End of consolidated design specification.*
