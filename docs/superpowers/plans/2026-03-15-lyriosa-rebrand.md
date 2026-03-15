# Lyriosa Rebrand Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand from Harmonia to Lyriosa with dual-candidate A/B theme toggle for public pages, dashboard locked to Candidate A.

**Architecture:** Server-side `data-theme` attribute on `<html>` driven by `NEXT_PUBLIC_LANDING_THEME` env var. CSS variable cascade handles all theming. Dashboard forces `data-theme="a"`. Four Google Fonts loaded unconditionally, activated per theme via CSS variables.

**Tech Stack:** Next.js 16, Tailwind v4 (`@theme {}` in globals.css), next-intl, shadcn/ui, Playwright, Vitest

**Greenfield context:** No existing users/data. All renames are direct -- no migration scripts.

---

## Phase 1: Infrastructure (Foundation)

### Task 1: Create `src/lib/brand.ts`

**Files:**
- **Create:** `src/lib/brand.ts`
- **Test:** `npx tsc --noEmit` (type-check only)

- [ ] **Step 1:** Create `src/lib/brand.ts` with all brand constants:

```ts
// src/lib/brand.ts

/** Single source of truth for all brand strings. Import from here -- never hardcode. */

export const BRAND_NAME = 'Lyriosa'
export const BRAND_NAME_HE = 'ליריוסה'
export const BRAND_NAME_AR = 'ليريوسا'
export const BRAND_NAME_RU = 'Лириоса'

export const BRAND_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lyriosa.co.il'
export const BRAND_SUPPORT_EMAIL = 'support@lyriosa.co.il'
export const BRAND_PRIVACY_EMAIL = 'privacy@lyriosa.co.il'
export const BRAND_A11Y_EMAIL = 'accessibility@lyriosa.co.il'
export const BRAND_DEV_EMAIL = 'dev@lyriosa.local'
export const BRAND_NOREPLY_EMAIL = 'noreply@lyriosa.co.il'

export const AI_ASSISTANT_NAME = 'Lyria'

export const BRAND_STORAGE_BUCKET = 'lyriosa-private'
export const BRAND_COOKIE_NAME = 'lyriosa-user'
export const BRAND_LOCALE_STORAGE_KEY = 'lyriosa_locale'
export const BRAND_COOKIE_CONSENT_KEY = 'lyriosa_cookie_consent'
export const BRAND_A11Y_PREFS_KEY = 'lyriosa.a11y.prefs.v1'
export const BRAND_A11Y_POSITION_KEY = 'lyriosa.a11y.position.v1'
export const BRAND_A11Y_MINIMIZED_KEY = 'lyriosa.a11y.minimized.v1'
export const BRAND_HELP_FAB_POSITION_KEY = 'lyriosa.help.fab.position.v1'
export const BRAND_HELP_FAB_MINIMIZED_KEY = 'lyriosa.help.fab.minimized.v1'
export const BRAND_WALKTHROUGH_KEY = 'lyriosa-walkthrough-seen'

export const BRAND_PS_EMAIL_DOMAIN = '@playing-school.lyriosa.io'
```

- [ ] **Step 2:** Verify with `npx tsc --noEmit` -- expect zero new errors.

- [ ] **Step 3:** Commit: `feat(brand): create brand.ts single source of truth for all brand identifiers`

---

### Task 2: Create `src/lib/themes/active-theme.ts`

**Files:**
- **Create:** `src/lib/themes/active-theme.ts`

- [ ] **Step 1:** Create the directory and file:

```ts
// src/lib/themes/active-theme.ts

export type BrandTheme = 'a' | 'b'

/**
 * Reads the active theme from NEXT_PUBLIC_LANDING_THEME env var.
 * Returns 'a' for any value that is not exactly 'b'.
 * Safe for Server Components (no DOM access).
 */
export function getActiveTheme(): BrandTheme {
  const raw = process.env.NEXT_PUBLIC_LANDING_THEME
  return raw === 'b' ? 'b' : 'a'
}
```

- [ ] **Step 2:** Verify with `npx tsc --noEmit`.

- [ ] **Step 3:** Commit: `feat(theme): add active-theme.ts server-side theme reader`

---

### Task 3: Create `src/components/brand-theme-provider.tsx`

**Files:**
- **Create:** `src/components/brand-theme-provider.tsx`

- [ ] **Step 1:** Create the client context provider:

```tsx
// src/components/brand-theme-provider.tsx
'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'
import type { BrandTheme } from '@/lib/themes/active-theme'

const BrandThemeContext = createContext<BrandTheme>('a')

function getServerSnapshot(): BrandTheme {
  return 'a'
}

function getSnapshot(): BrandTheme {
  return (document.documentElement.dataset.theme as BrandTheme) || 'a'
}

function subscribe(onStoreChange: () => void): () => void {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') {
        onStoreChange()
        break
      }
    }
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return (
    <BrandThemeContext.Provider value={theme}>
      {children}
    </BrandThemeContext.Provider>
  )
}

/**
 * Returns the active brand theme ('a' or 'b').
 * Reads from the data-theme attribute on <html>, set server-side by layout.tsx.
 * Does NOT set data-theme -- that is the server's job.
 */
export function useBrandTheme(): BrandTheme {
  return useContext(BrandThemeContext)
}
```

- [ ] **Step 2:** Verify with `npx tsc --noEmit`.

- [ ] **Step 3:** Commit: `feat(theme): add BrandThemeProvider client context (reads data-theme from DOM)`

---

### Task 4: Wire BrandThemeProvider into layout.tsx

**Files:**
- **Modify:** `src/app/[locale]/layout.tsx`

This is the most complex infrastructure task. We replace Rubik with 4 Google Fonts, add `data-theme` on `<html>`, and wrap children in `BrandThemeProvider`.

- [ ] **Step 1:** Replace the font import and declaration. Remove:

```ts
import { Rubik } from 'next/font/google';

const rubik = Rubik({
    subsets: ['latin', 'hebrew', 'arabic', 'cyrillic'],
    weight: ['400', '700'],
    variable: '--font-rubik',
    display: 'swap',
});
```

Add:

```ts
import { Playfair_Display, Plus_Jakarta_Sans, Heebo, Frank_Ruhl_Libre } from 'next/font/google';
import { getActiveTheme } from '@/lib/themes/active-theme';
import { BrandThemeProvider } from '@/components/brand-theme-provider';
import { BRAND_NAME } from '@/lib/brand';

const playfairDisplay = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-heebo',
  display: 'swap',
});

const frankRuhlLibre = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '700'],
  variable: '--font-frank-ruhl',
  display: 'swap',
});
```

- [ ] **Step 2:** Update the fallback string in `generateMetadata`. Replace:

```ts
            : 'Harmonia';
```

With:

```ts
            : BRAND_NAME;
```

- [ ] **Step 3:** Update `<html>` to include `data-theme` and all font CSS variables. Inside `RootLayout`, add `const theme = getActiveTheme();` after the `dir` line. Then replace:

```tsx
    <html lang={locale} dir={dir}>
      <body className={`${rubik.variable} font-body antialiased`}>
```

With:

```tsx
    <html lang={locale} dir={dir} data-theme={theme}>
      <body className={`${playfairDisplay.variable} ${plusJakartaSans.variable} ${heebo.variable} ${frankRuhlLibre.variable} font-body antialiased`}>
```

- [ ] **Step 4:** Wrap the content with `BrandThemeProvider`. Add it inside `<NextIntlClientProvider>`:

```tsx
        <NextIntlClientProvider messages={messages}>
          <BrandThemeProvider>
            <AuthProvider>
              {/* ... existing content ... */}
            </AuthProvider>
          </BrandThemeProvider>
        </NextIntlClientProvider>
```

- [ ] **Step 5:** Verify with `npx tsc --noEmit`. Run `npm run dev` and confirm the page loads without errors. Check browser DevTools that `<html>` has `data-theme="a"`.

- [ ] **Step 6:** Commit: `feat(layout): wire 4 Google Fonts + data-theme attribute + BrandThemeProvider`

---

### Task 5: Force data-theme="a" on dashboard layout

**Files:**
- **Modify:** `src/app/[locale]/dashboard/layout.tsx`

- [ ] **Step 1:** Add `data-theme="a"` to the `<SidebarProvider>` wrapper. Replace:

```tsx
    <SidebarProvider dir={isRtl ? 'rtl' : 'ltr'}>
```

With:

```tsx
    <SidebarProvider dir={isRtl ? 'rtl' : 'ltr'} data-theme="a">
```

- [ ] **Step 2:** Verify with `npx tsc --noEmit`. The `SidebarProvider` accepts arbitrary HTML attributes via spread, so `data-theme` should be accepted.

- [ ] **Step 3:** Commit: `feat(dashboard): force data-theme="a" on dashboard layout wrapper`

---

## Phase 2: CSS Variables

### Task 6: Add brand color tokens and font variables to `@theme {}` block

**Files:**
- **Modify:** `src/app/globals.css`

The existing `@theme {}` block (lines 3-52) resolves Tailwind v4 color tokens from CSS custom properties. We add font family tokens and ensure the `:root` block has font variable defaults.

- [ ] **Step 1:** Add font family tokens inside the `@theme {}` block, after the `--radius` line (line 28) and before the keyframes. Add:

```css
  --font-body: var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif;
  --font-heading: var(--font-playfair), 'Playfair Display', serif;
  --font-display: var(--font-playfair), 'Playfair Display', serif;
  --font-rtl: var(--font-heebo), 'Heebo', sans-serif;

  --color-sidebar-background: hsl(var(--sidebar-background));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-primary: hsl(var(--sidebar-primary));
  --color-sidebar-primary-foreground: hsl(var(--sidebar-primary-foreground));
  --color-sidebar-accent: hsl(var(--sidebar-accent));
  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));
  --color-sidebar-border: hsl(var(--sidebar-border));
  --color-sidebar-ring: hsl(var(--sidebar-ring));
```

- [ ] **Step 2:** Add sidebar CSS variables to the `:root` block (after line 79, before the closing `}`):

```css
  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 222.2 84% 4.9%;
  --sidebar-primary: 240 59% 50%;
  --sidebar-primary-foreground: 210 40% 98%;
  --sidebar-accent: 210 40% 96.1%;
  --sidebar-accent-foreground: 222.2 47.4% 11.2%;
  --sidebar-border: 214.3 31.8% 91.4%;
  --sidebar-ring: 240 59% 50%;
```

- [ ] **Step 3:** Add sidebar CSS variables to the `.dark` block (after line 106, before the closing `}`):

```css
  --sidebar-background: 222.2 84% 4.9%;
  --sidebar-foreground: 210 40% 98%;
  --sidebar-primary: 235 86% 65%;
  --sidebar-primary-foreground: 222.2 47.4% 11.2%;
  --sidebar-accent: 217.2 32.6% 17.5%;
  --sidebar-accent-foreground: 210 40% 98%;
  --sidebar-border: 217.2 32.6% 17.5%;
  --sidebar-ring: 235 86% 65%;
```

- [ ] **Step 4: Check and update tailwind.config.ts font entries**

The existing `tailwind.config.ts` has `fontFamily.body: ['Rubik', 'sans-serif']` and `fontFamily.headline: ['Rubik', 'sans-serif']` which will conflict with the new `@theme {}` font variables. Since Tailwind v4 reads font families from `@theme { --font-* }`, the `tailwind.config.ts` `fontFamily` entries are now redundant.

```bash
grep -n "fontFamily\|Rubik\|body\|headline" tailwind.config.ts
```

Remove or comment out the `fontFamily.body` and `fontFamily.headline` entries from `tailwind.config.ts` to prevent conflicts:

```ts
// In tailwind.config.ts, remove these lines:
// body: ['Rubik', 'sans-serif'],
// headline: ['Rubik', 'sans-serif'],
```

If `tailwind.config.ts` has no remaining custom config beyond what `@theme {}` provides, it can be deleted entirely.

Run: `npx tsc --noEmit`
Expected: PASS (no type errors)

- [ ] **Step 5:** Verify with `npm run dev` -- page should render identically to before (`:root` values unchanged).

- [ ] **Step 6:** Commit: `feat(css): add font family tokens and sidebar variables to @theme block`

---

### Task 7: Add `[data-theme="b"]` CSS variable overrides

**Files:**
- **Modify:** `src/app/globals.css`

- [ ] **Step 1:** Add Candidate B light mode overrides. Insert after the `.dark { ... }` closing brace (after line 107):

```css
[data-theme="b"] {
  --background: 220 30% 96%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 43 50% 54%;
  --primary-foreground: 222 47% 6%;
  --secondary: 220 30% 92%;
  --secondary-foreground: 222 47% 11%;
  --muted: 220 30% 91%;
  --muted-foreground: 215 16% 47%;
  --accent: 240 59% 50%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 43 50% 54%;
  --chart-1: 43 50% 54%;
  --chart-2: 43 70% 69%;
  --chart-3: 160 84% 39%;
  --chart-4: 240 59% 50%;
  --chart-5: 0 84% 60%;

  --sidebar-background: 0 0% 100%;
  --sidebar-foreground: 222.2 84% 4.9%;
  --sidebar-primary: 43 50% 54%;
  --sidebar-primary-foreground: 222 47% 6%;
  --sidebar-accent: 220 30% 92%;
  --sidebar-accent-foreground: 222 47% 11%;
  --sidebar-border: 214 32% 91%;
  --sidebar-ring: 43 50% 54%;
}
```

- [ ] **Step 2:** Verify by toggling `data-theme="b"` in browser DevTools. The primary color should shift from indigo to gold.

- [ ] **Step 3:** Commit: `feat(css): add Candidate B light mode CSS variable overrides`

---

### Task 8: Add dark mode variants and RTL font rules

**Files:**
- **Modify:** `src/app/globals.css`

- [ ] **Step 1:** Add Candidate B dark mode. Insert after the `[data-theme="b"]` block:

```css
.dark[data-theme="b"] {
  --background: 222 47% 6%;
  --foreground: 210 40% 98%;
  --card: 222 47% 6%;
  --card-foreground: 210 40% 98%;
  --popover: 222 47% 6%;
  --popover-foreground: 210 40% 98%;
  --primary: 43 50% 54%;
  --primary-foreground: 222 47% 6%;
  --secondary: 215 28% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted: 215 28% 17%;
  --muted-foreground: 217 13% 64%;
  --accent: 240 59% 66%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 98%;
  --border: 215 28% 17%;
  --input: 215 28% 17%;
  --ring: 43 50% 54%;
  --chart-1: 43 50% 54%;
  --chart-2: 43 70% 69%;
  --chart-3: 160 84% 39%;
  --chart-4: 240 59% 66%;
  --chart-5: 0 84% 60%;

  --sidebar-background: 222 47% 6%;
  --sidebar-foreground: 210 40% 98%;
  --sidebar-primary: 43 50% 54%;
  --sidebar-primary-foreground: 222 47% 6%;
  --sidebar-accent: 215 28% 17%;
  --sidebar-accent-foreground: 210 40% 98%;
  --sidebar-border: 215 28% 17%;
  --sidebar-ring: 43 50% 54%;
}
```

- [ ] **Step 2:** Add font variable overrides for Candidate B and RTL rules. Insert after the dark theme block:

```css
[data-theme="b"] {
  --font-heading: var(--font-frank-ruhl), 'Frank Ruhl Libre', serif;
  --font-body: var(--font-heebo), 'Heebo', sans-serif;
  --font-display: var(--font-playfair), 'Playfair Display', serif;
}

[dir="rtl"] body {
  font-family: var(--font-rtl);
}

[dir="rtl"] h1,
[dir="rtl"] h2,
[dir="rtl"] h3 {
  font-family: var(--font-heading);
}
```

> **Note:** The second `[data-theme="b"]` block only overrides font variables, not colors. CSS cascade will merge it with the earlier color block. Alternatively, the font variables can be placed in the same `[data-theme="b"]` block from Task 7 -- implementor's choice.

- [ ] **Step 3:** Verify in browser DevTools: toggle `data-theme` between `a` and `b`, verify font-family changes. For RTL pages (`/he`), verify `body` uses Heebo.

- [ ] **Step 4:** Commit: `feat(css): add Candidate B dark mode, font overrides, and RTL font rules`

---

## Phase 3: Brand Name Rename

### Task 9: Replace hardcoded strings in source files (import from brand.ts)

**Files:**
- **Modify:** 19 source files (listed below)
- **Test:** `npx tsc --noEmit`

Each file below has specific hardcoded brand strings to replace with imports from `@/lib/brand`.

- [ ] **Step 1:** `src/app/[locale]/layout.tsx` -- Already handled in Task 4 (fallback `'Harmonia'` replaced with `BRAND_NAME`). Verify it is done.

- [ ] **Step 2:** `src/app/[locale]/page.tsx` -- Update `generateMetadata()`. Import `BRAND_NAME` from `@/lib/brand`. Replace any hardcoded `'Harmonia'` fallback with `BRAND_NAME`. Update OG image path if referencing old image.

- [ ] **Step 3:** `src/app/[locale]/about/[slug]/page.tsx` -- Replace:
  - `'https://harmonia.co.il'` with `BRAND_DOMAIN` (import from `@/lib/brand`)
  - `'on Harmonia.'` with `` `on ${BRAND_NAME}.` ``

- [ ] **Step 4:** `src/app/[locale]/error.tsx` -- Replace `'[Harmonia Error]'` with `` `[${BRAND_NAME} Error]` ``

- [ ] **Step 5:** `src/app/robots.ts` -- Replace the sitemap URL domain. Import `BRAND_DOMAIN`.

- [ ] **Step 6:** `src/app/sitemap.ts` -- Replace the base URL domain. Import `BRAND_DOMAIN`.

- [ ] **Step 7:** `src/app/api/invoice-pdf/[invoiceId]/route.ts` -- Replace:
  - `'Harmonia'` logo text with `BRAND_NAME`
  - `'support@harmonia.co.il'` with `BRAND_SUPPORT_EMAIL`
  - Hebrew text `'מערכת Harmonia'` with `` `מערכת ${BRAND_NAME}` ``

- [ ] **Step 8:** `src/app/api/ps/qr/route.ts` -- Replace `'https://harmonia.co.il'` fallback with `BRAND_DOMAIN`.

- [ ] **Step 9:** `src/ai/flows/help-assistant-flow.ts` -- Replace:
  - `"Harmonia"` with `BRAND_NAME` (use template literal in prompt)
  - `"Harmony"` (AI name) with `AI_ASSISTANT_NAME` from brand.ts
  - Comment `@fileOverview The AI Help Assistant for Harmonia.` with `Lyriosa`

- [ ] **Step 10:** `src/ai/flows/nurture-lead-flow.ts` -- Replace `"Harmonia"` with `BRAND_NAME` in the prompt string.

- [ ] **Step 11:** `src/ai/flows/reschedule-flow.ts` -- Replace `"Harmonia"` with `BRAND_NAME` in the prompt string (line 75).

- [ ] **Step 12:** `src/lib/notifications/payment-notifications.ts` -- Replace:
  - `'noreply@harmonia.co.il'` with `BRAND_NOREPLY_EMAIL`
  - `'Harmonia'` sender name with `BRAND_NAME`
  - `'Harmonia'` in email body with `BRAND_NAME`

- [ ] **Step 13:** `src/lib/db/adapters/supabase.ts` -- Replace `'Harmonia'` fallback conservatorium name with `BRAND_NAME`.

- [ ] **Step 14:** `src/lib/db/adapters/postgres.ts` -- Replace all `'Harmonia'` fallback strings (3 occurrences) with `BRAND_NAME`.

- [ ] **Step 15:** `src/components/dashboard/harmonia/admin-command-center.tsx` -- Replace `'Harmonia'` fallback with `BRAND_NAME`.

- [ ] **Step 16:** `src/components/harmonia/conservatorium-public-profile-page.tsx` -- Replace fallback site URL with `BRAND_DOMAIN`.

- [ ] **Step 17:** `src/lib/playing-school-utils.ts` -- Replace `@playing-school.harmonia.io` with `BRAND_PS_EMAIL_DOMAIN`.

- [ ] **Step 18:** `src/lib/cloud-functions/calendar-sync.ts` -- Replace `'Harmonia Lesson'` with `` `${BRAND_NAME} Lesson` `` and update file comment.

- [ ] **Step 19:** `src/app/actions.ts` -- Replace `'https://harmony.app/accept-invite/'` with `` `${BRAND_DOMAIN}/accept-invite/` `` (line ~1306).

- [ ] **Step 20:** `src/app/[locale]/accept-invite/[inviteToken]/page.tsx` -- Replace `'support@harmony.app'` with `BRAND_SUPPORT_EMAIL`.

- [ ] **Step 21:** `src/app/[locale]/pending-approval/page.tsx` -- Replace `'office@harmony.org.il'` with `BRAND_SUPPORT_EMAIL`.

- [ ] **Step 22:** `src/app/[locale]/dashboard/admin/playing-school/distribute/page.tsx` -- Replace `'https://harmony.app/'` with `BRAND_DOMAIN`.

- [ ] **Step 23:** `src/app/actions.ts`, `src/proxy.ts`, `src/lib/auth-utils.ts` -- Update comment references. Replace `Harmonia` with `Lyriosa` in JSDoc `@fileoverview` comments.

- [ ] **Step 24:** Run `npx tsc --noEmit` to verify all imports resolve.

- [ ] **Step 25:** Run a grep scan to verify no remaining source-code references:

```bash
grep -rn "Harmonia\|harmonia\.co\.il\|harmony\.app\|harmony\.org" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "\.d\.ts"
```

Expected: zero hits outside of `data.ts` (websiteOverride has external URLs -- those are real third-party sites, not our brand).

- [ ] **Step 26:** Commit: `refactor(brand): replace all hardcoded Harmonia strings with brand.ts imports`

---

### Task 10: Rename infrastructure identifiers (localStorage, cookies, etc.)

**Files:**
- **Modify:** ~12 files

All old keys are replaced with imports from `brand.ts` constants defined in Task 1.

- [ ] **Step 1:** `src/lib/auth-cookie.ts` -- Replace `'harmonia-user'` with `BRAND_COOKIE_NAME`:

```ts
import { BRAND_COOKIE_NAME } from '@/lib/brand';

export const setAuthCookie = () => {
  document.cookie = `${BRAND_COOKIE_NAME}=1; path=/; max-age=2592000; samesite=lax`;
};

export const clearAuthCookie = () => {
  document.cookie = `${BRAND_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
};
```

- [ ] **Step 2:** `src/app/actions/auth.ts` -- Replace `'harmonia-user'` with `BRAND_COOKIE_NAME` (2 occurrences: lines ~45 and ~71).

- [ ] **Step 3:** `src/app/api/auth/login/route.ts` -- Replace `'harmonia-user'` with `BRAND_COOKIE_NAME`.

- [ ] **Step 4:** `src/app/api/auth/logout/route.ts` -- Replace `'harmonia-user'` with `BRAND_COOKIE_NAME`.

- [ ] **Step 5:** `src/hooks/use-auth.tsx` -- Replace all `'harmonia-user'` localStorage references with `BRAND_COOKIE_NAME` (4 occurrences: lines ~653, ~689, ~698, ~702).

- [ ] **Step 6:** `src/hooks/domains/auth-domain.tsx` -- Replace `'harmonia-user'` with `BRAND_COOKIE_NAME` (2 occurrences: lines ~66, ~99).

- [ ] **Step 7:** `src/hooks/domains/users-domain.tsx` -- Replace `'harmonia-user'` with `BRAND_COOKIE_NAME` (3 occurrences: lines ~114, ~126, ~149).

- [ ] **Step 8:** `src/components/language-switcher.tsx` -- Replace `'harmonia_locale'` with `BRAND_LOCALE_STORAGE_KEY`.

- [ ] **Step 9:** `src/components/consent/cookie-banner.tsx` -- Replace `'harmonia_cookie_consent'` with `BRAND_COOKIE_CONSENT_KEY`.

- [ ] **Step 10:** `src/components/a11y/accessibility-panel.tsx` -- Replace:
  - `'harmonia.a11y.prefs.v1'` with `BRAND_A11Y_PREFS_KEY`
  - `'harmonia.a11y.position.v1'` with `BRAND_A11Y_POSITION_KEY`
  - `'harmonia.a11y.minimized.v1'` with `BRAND_A11Y_MINIMIZED_KEY`

- [ ] **Step 11:** `src/components/harmonia/ai-help-assistant.tsx` -- Replace:
  - `'harmonia.help.fab.position.v1'` with `BRAND_HELP_FAB_POSITION_KEY`
  - `'harmonia.help.fab.minimized.v1'` with `BRAND_HELP_FAB_MINIMIZED_KEY`

- [ ] **Step 12:** `src/app/actions/storage.ts` -- Replace `'harmonia-private'` with `BRAND_STORAGE_BUCKET` (2 occurrences: lines ~67 and ~298).

- [ ] **Step 13:** `src/lib/auth-utils.ts` -- Rename `HarmoniaClaims` interface to `LyriosaClaims`. Update all references:
  - The interface declaration (line ~16)
  - `getClaimsFromRequest()` return type (line ~27)
  - `verifyAuth()` return type (line ~63)
  - `verifyAuthWithRole()` return type (line ~118)
  - Replace `'dev@harmonia.local'` with `BRAND_DEV_EMAIL` (line ~91)
  - Update the comment on line ~15

- [ ] **Step 14:** `src/proxy.ts` -- Replace `'dev@harmonia.local'` with the string `'dev@lyriosa.local'` (line ~183). Since proxy.ts is edge middleware, avoid importing from brand.ts if it causes edge runtime issues -- use the string literal directly.

- [ ] **Step 15:** Grep for any remaining old identifiers:

```bash
grep -rn "harmonia-user\|harmonia_cookie\|harmonia_locale\|harmonia\.a11y\|harmonia\.help\|harmonia-walkthrough\|harmonia-private\|HarmoniaClaims\|dev@harmonia\|noreply@harmonia" src/ --include="*.ts" --include="*.tsx"
```

Expected: zero hits.

- [ ] **Step 16:** Verify with `npx tsc --noEmit`.

- [ ] **Step 17:** Commit: `refactor(brand): rename all infrastructure identifiers (cookies, localStorage, Supabase bucket)`

---

### Task 11: Update all 25 translation JSON files

**Files:**
- **Modify:** 25 files under `src/messages/{he,en,ar,ru}/`

**Approach:** Use a Node.js script for reliability on Windows (no `sed`/`xargs`). The script does simple string replacement across all JSON files.

- [ ] **Step 1:** Create a temporary script `scripts/rebrand-translations.mjs`:

```js
// scripts/rebrand-translations.mjs
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const messagesDir = join(process.cwd(), 'src', 'messages');

// NOTE: 'Harmony' → 'Lyria' is NOT in this list because 'Harmony' may appear
// in legitimate music theory contexts. Run grep manually after this script
// and fix AI assistant name occurrences by hand.
const replacements = [
  // English
  ['Harmonia', 'Lyriosa'],
  ['harmony.app', 'lyriosa.co.il'],
  ['harmonia.co.il', 'lyriosa.co.il'],
  // Hebrew
  ['הרמוניה', 'ליריוסה'],
  ['הַרמוֹנְיָה', 'ליריוסה'],
  // Arabic
  ['هارمونيا', 'ليريوسا'],
  // Russian
  ['Гармония', 'Лириоса'],
];

function processDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.name.endsWith('.json')) {
      let content = readFileSync(fullPath, 'utf-8');
      let changed = false;
      for (const [from, to] of replacements) {
        if (content.includes(from)) {
          content = content.replaceAll(from, to);
          changed = true;
        }
      }
      if (changed) {
        writeFileSync(fullPath, content, 'utf-8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDir(messagesDir);
console.log('Done.');
```

- [ ] **Step 2:** Run the script:

```bash
node scripts/rebrand-translations.mjs
```

- [ ] **Step 2b:** Manually grep for 'Harmony' occurrences (not handled by the script):

```bash
grep -rn "Harmony" src/messages/ --include="*.json"
```

Review each hit. Replace only AI assistant name references with 'Lyria'. Leave music theory references (e.g., "harmony", "harmonic") intact.

- [ ] **Step 3:** Verify zero residual references:

```bash
grep -rn "Harmonia\|הרמוניה\|הַרמוֹנְיָה\|هارمونيا\|Гармония\|Harmony" src/messages/
```

Expected output: zero hits. **Note:** "Harmony" may appear in non-brand contexts (e.g., music theory terms). If any hits remain, manually review each to determine if it is the AI assistant name (replace with "Lyria") or a legitimate music term (keep as-is).

- [ ] **Step 4:** Fix known Arabic locale bug: verify `ar/student.json` and `ar/common.json` no longer contain Latin "Harmonia" -- should have been caught by the script replacing "Harmonia" with "Lyriosa", but double-check they now say "ليريوسا" in Arabic context.

- [ ] **Step 5:** Also fix `ru/billing.json`, `ar/billing.json`, `en/billing.json` which reference "Harmony" (the old AI assistant name in payment security notice). These should now read "Lyria" after the script, but verify.

- [ ] **Step 6:** Delete the temporary script: `rm scripts/rebrand-translations.mjs`

- [ ] **Step 7:** Commit: `refactor(i18n): rebrand all 25 translation files from Harmonia to Lyriosa`

---

### Task 12: Create static assets (favicon placeholder, manifest, OG image placeholder)

**Files:**
- **Create:** `public/site.webmanifest`
- **Create:** `public/images/og-lyriosa.jpg` (placeholder)
- **Create:** `public/favicon.ico`, `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/apple-touch-icon.png` (placeholders)
- **Modify:** `src/lib/data.ts` (websiteOverride map)

- [ ] **Step 1:** Create `public/site.webmanifest`:

```json
{
  "name": "Lyriosa",
  "short_name": "Lyriosa",
  "description": "Music education management platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f1f5f9",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/favicon-16x16.png", "sizes": "16x16", "type": "image/png" },
    { "src": "/favicon-32x32.png", "sizes": "32x32", "type": "image/png" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" }
  ]
}
```

- [ ] **Step 2:** Create placeholder favicon files. For now, generate minimal PNGs (single-pixel indigo). The real assets will be provided by the design team. Use a simple Node script or copy existing assets if available:

```bash
# Create minimal placeholder files (these will be replaced with real assets)
# For now, just ensure the files exist so the manifest doesn't 404
touch public/favicon.ico public/favicon-16x16.png public/favicon-32x32.png public/apple-touch-icon.png
```

- [ ] **Step 3:** Create placeholder OG image:

```bash
touch public/images/og-lyriosa.jpg
```

> **Note:** Real OG image and favicons should be created by a designer. These placeholders prevent 404s in the meantime.

- [ ] **Step 4:** Update `src/lib/data.ts` -- Replace any `harmonia.co.il` references in the `websiteOverride` map. Grep first to check:

```bash
grep -n "harmonia" src/lib/data.ts
```

The `websiteOverride` map uses real external URLs (wixsite, akadma, etc.), not harmonia.co.il, so this step may be a no-op. However, check for `dev@harmonia.local` in the devUser object (line ~1227) and replace with `'dev@lyriosa.local'`.

- [ ] **Step 5:** Commit: `feat(assets): add placeholder favicon, OG image, and web manifest for Lyriosa`

---

## Phase 4: Component Theming

### Task 13: Update Icons.tsx with theme-aware logo container

**Files:**
- **Modify:** `src/components/icons.tsx`

- [ ] **Step 1:** Update the logo to be theme-aware. The existing SVG is a simple music note. Add a theme-aware wrapper:

```tsx
import type { SVGProps } from 'react';

export type LogoTheme = 'a' | 'b';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement> & { theme?: LogoTheme }) => {
    const { theme = 'a', ...svgProps } = props;
    const size = theme === 'b' ? 34 : 32;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...svgProps}
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    );
  },
  // ... google, microsoft, help icons remain unchanged
```

- [ ] **Step 2:** Verify with `npx tsc --noEmit`. Existing callsites that pass no `theme` prop will default to `'a'`.

- [ ] **Step 3:** Commit: `feat(icons): add theme-aware logo size support`

---

### Task 14: Theme PublicNavbar

**Files:**
- **Modify:** `src/components/layout/public-navbar.tsx`

Use the theme-keyed style maps pattern.

- [ ] **Step 1:** Import `useBrandTheme`:

```ts
import { useBrandTheme } from '@/components/brand-theme-provider';
```

- [ ] **Step 2:** Add theme-keyed style maps at the top of the component:

```ts
const navbarThemeStyles = {
  a: {
    header: 'bg-background/80 backdrop-blur-sm border-b',
    logoText: 'text-xl font-bold',
    navLink: 'text-sm font-medium',
    ctaPrimary: '',  // default Button styles
    ctaSecondary: '', // default ghost variant
  },
  b: {
    header: 'bg-background/90 backdrop-blur-md border-b border-primary/10',
    logoText: 'text-xl font-bold font-[family-name:var(--font-display)]',
    navLink: 'text-sm font-medium',
    ctaPrimary: '',
    ctaSecondary: '',
  },
} as const;
```

- [ ] **Step 3:** Inside `PublicNavbar`, add:

```ts
const theme = useBrandTheme();
const styles = navbarThemeStyles[theme];
```

- [ ] **Step 4:** Apply theme styles to the `<header>`:

Replace:
```tsx
<header className="fixed top-0 z-50 flex h-14 w-full items-center border-b bg-background/80 px-4 backdrop-blur-sm lg:px-6">
```

With:
```tsx
<header className={cn("fixed top-0 z-50 flex h-14 w-full items-center px-4 lg:px-6", styles.header)}>
```

- [ ] **Step 5:** Pass theme to `Icons.logo`:

Replace:
```tsx
<Icons.logo className="h-6 w-6 text-primary" />
```

With (both desktop and mobile instances):
```tsx
<Icons.logo className="h-6 w-6 text-primary" theme={theme} />
```

- [ ] **Step 6:** Apply `styles.logoText` to the brand name `<span>`.

- [ ] **Step 7:** Verify with `npm run dev` -- both themes should render correctly on the navbar.

- [ ] **Step 8:** Commit: `feat(navbar): apply theme-keyed styles to PublicNavbar`

---

### Task 15: Theme PublicFooter

**Files:**
- **Modify:** `src/components/layout/public-footer.tsx`

- [ ] **Step 1:** Import `useBrandTheme`:

```ts
import { useBrandTheme } from '@/components/brand-theme-provider';
```

- [ ] **Step 2:** Add theme styles and use them:

```ts
const footerThemeStyles = {
  a: {
    wrapper: 'border-t',
    copyright: 'text-xs text-muted-foreground',
  },
  b: {
    wrapper: 'border-t border-primary/10',
    copyright: 'text-xs text-muted-foreground font-[family-name:var(--font-body)]',
  },
} as const;
```

- [ ] **Step 3:** Inside the component:

```ts
const theme = useBrandTheme();
const styles = footerThemeStyles[theme];
```

- [ ] **Step 4:** Apply styles to the `<footer>` and copyright `<p>`.

- [ ] **Step 5:** Commit: `feat(footer): apply theme-keyed styles to PublicFooter`

---

### Task 16: Theme PublicLandingPage hero + stats bar

**Files:**
- **Modify:** `src/components/harmonia/public-landing-page.tsx`

The landing page is the most visually different between themes. Use theme-keyed style maps for each section.

- [ ] **Step 1:** Import `useBrandTheme`:

```ts
import { useBrandTheme } from '@/components/brand-theme-provider';
```

- [ ] **Step 2:** Define theme-keyed style maps for the landing page sections:

```ts
const landingThemeStyles = {
  a: {
    heroBg: 'bg-background',
    heroHeading: 'font-[family-name:var(--font-heading)] text-4xl sm:text-5xl lg:text-6xl font-black',
    heroBadge: 'bg-primary/10 text-primary',
    statsBar: 'bg-primary text-primary-foreground',
    statValue: 'text-3xl font-bold',
    sectionHeading: 'font-[family-name:var(--font-heading)] text-3xl font-bold',
    cardBorder: 'border',
  },
  b: {
    heroBg: 'bg-[hsl(210,50%,11%)] text-[hsl(40,43%,96%)]',
    heroHeading: 'font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-7xl font-bold',
    heroBadge: 'bg-primary/20 text-primary border border-primary/30',
    statsBar: 'bg-primary/90 text-primary-foreground',
    statValue: 'text-3xl font-bold',
    sectionHeading: 'font-[family-name:var(--font-heading)] text-3xl font-bold',
    cardBorder: 'border border-primary/20',
  },
} as const;
```

- [ ] **Step 3:** Inside `PublicLandingPage`, add:

```ts
const theme = useBrandTheme();
const styles = landingThemeStyles[theme];
```

- [ ] **Step 4:** Apply `styles.heroBg` and `styles.heroHeading` to the hero section. Apply `styles.statsBar` to the stats bar. Apply `styles.sectionHeading` to section headings.

- [ ] **Step 5:** For Candidate B-specific elements (texture overlay, grain effect), add CSS utility classes that only activate under `[data-theme="b"]`:

Add to `globals.css` in the `@layer utilities` block:

```css
  .texture-overlay {
    position: relative;
  }

  [data-theme="b"] .texture-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
  }
```

- [ ] **Step 6:** Verify both themes render the landing page correctly by toggling `NEXT_PUBLIC_LANDING_THEME` in `.env.local`.

- [ ] **Step 7:** Commit: `feat(landing): apply theme-keyed styles to hero section and stats bar`

---

## Phase 5: Remaining Public Page Theming

### Task 17: Theme login/register pages

**Files:**
- **Modify:** Login page component (find at `src/app/[locale]/login/page.tsx` or `src/components/harmonia/login-form.tsx`)
- **Modify:** Register page / enrollment wizard

- [ ] **Step 1:** Identify the login page component path:

```bash
find src -name "*login*" -type f | grep -v node_modules
```

- [ ] **Step 2:** Import `useBrandTheme` (if client component) or read theme from context. Login is a transitional page -- both themes use a neutral palette with brand logo. The primary difference is the logo and font treatment.

- [ ] **Step 3:** Add theme-keyed styles for login:

```ts
const loginThemeStyles = {
  a: {
    logo: 'text-primary',
    heading: 'font-[family-name:var(--font-heading)]',
    card: 'border',
  },
  b: {
    logo: 'text-primary',
    heading: 'font-[family-name:var(--font-display)]',
    card: 'border border-primary/10',
  },
} as const;
```

- [ ] **Step 4:** Apply to the login form. Pass `theme` prop to `Icons.logo`.

- [ ] **Step 5:** Repeat for registration / enrollment wizard pages. The enrollment wizard uses serif headings and gold progress indicator in Candidate B.

- [ ] **Step 6:** Commit: `feat(auth-pages): apply theme-keyed styles to login and register pages`

---

### Task 18: Theme remaining public pages

**Files:**
- **Modify:** About, Available Now, Musicians, Help, Contact, Privacy, Accessibility, Playing School, Donate, Open Day, Apply for Aid, Matchmaker, Try, Pending Approval pages

- [ ] **Step 1:** For each public page, the pattern is the same:
  1. Import `useBrandTheme` (if client component)
  2. Define a small `themeStyles` map for that page
  3. Apply the styles

- [ ] **Step 2:** Minimal-theming pages (Privacy, Accessibility, Contact) -- only need heading font change and subtle border accent for Candidate B. These can share a common pattern:

```ts
const pageThemeStyles = {
  a: { heading: 'font-[family-name:var(--font-heading)]' },
  b: { heading: 'font-[family-name:var(--font-heading)]' },  // font-heading is already theme-dependent via CSS variable
} as const;
```

For these pages, the CSS variable cascade handles most of the theming automatically (colors, fonts via `var(--font-heading)`). Only add explicit style maps if there are Candidate B-specific visual elements.

- [ ] **Step 3:** Higher-impact pages:
  - **About:** Gold accent borders on cards for Candidate B
  - **Available Now:** Gold urgency badges for Candidate B (replace `bg-amber-500` with `bg-primary` which resolves to gold)
  - **Help:** Update "Harmony" AI assistant name references to use `AI_ASSISTANT_NAME` from brand.ts
  - **Playing School:** Gold badge, serif heading for Candidate B

- [ ] **Step 4:** Verify all pages by navigating through them in the browser with each theme.

- [ ] **Step 5:** Commit: `feat(public-pages): apply theme-keyed styles to all remaining public pages`

---

## Phase 6: Tests

### Task 19: Create brand name grep test

**Files:**
- **Create:** `tests/rebrand/brand-name-grep.test.ts`

- [ ] **Step 1:** Create the test file:

```ts
// tests/rebrand/brand-name-grep.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MESSAGES_DIR = join(process.cwd(), 'src', 'messages');
const OLD_BRAND_PATTERNS = [
  'Harmonia',
  'Harmony',   // AI assistant old name — may also appear as music theory term, review manually
  'הרמוניה',
  'הַרמוֹנְיָה',
  'هارمونيا',
  'Гармония',
];

function collectJsonFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(fullPath));
    } else if (entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Brand name grep scan', () => {
  const jsonFiles = collectJsonFiles(MESSAGES_DIR);

  it('should find translation JSON files', () => {
    expect(jsonFiles.length).toBeGreaterThanOrEqual(24);
  });

  for (const pattern of OLD_BRAND_PATTERNS) {
    it(`should have zero occurrences of "${pattern}" in translation files`, () => {
      const hits: string[] = [];
      for (const file of jsonFiles) {
        const content = readFileSync(file, 'utf-8');
        if (content.includes(pattern)) {
          hits.push(file.replace(process.cwd(), ''));
        }
      }
      expect(hits).toEqual([]);
    });
  }
});
```

- [ ] **Step 2:** Run: `npx vitest run tests/rebrand/brand-name-grep.test.ts` -- expect all pass.

- [ ] **Step 3:** Commit: `test(brand): add CI brand name grep scan for residual old brand strings`

---

### Task 20: Create theme toggle unit tests

**Files:**
- **Create:** `tests/rebrand/theme-toggle.test.ts`

- [ ] **Step 1:** Create the test file:

```ts
// tests/rebrand/theme-toggle.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getActiveTheme } from '@/lib/themes/active-theme';

describe('getActiveTheme', () => {
  const originalEnv = process.env.NEXT_PUBLIC_LANDING_THEME;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_LANDING_THEME;
    } else {
      process.env.NEXT_PUBLIC_LANDING_THEME = originalEnv;
    }
  });

  it('returns "a" when env var is undefined', () => {
    delete process.env.NEXT_PUBLIC_LANDING_THEME;
    expect(getActiveTheme()).toBe('a');
  });

  it('returns "a" when env var is "a"', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = 'a';
    expect(getActiveTheme()).toBe('a');
  });

  it('returns "b" when env var is "b"', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = 'b';
    expect(getActiveTheme()).toBe('b');
  });

  it('returns "a" for invalid value "c"', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = 'c';
    expect(getActiveTheme()).toBe('a');
  });

  it('returns "a" for empty string', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = '';
    expect(getActiveTheme()).toBe('a');
  });
});
```

- [ ] **Step 2:** Run: `npx vitest run tests/rebrand/theme-toggle.test.ts` -- expect 5/5 pass.

- [ ] **Step 3:** Commit: `test(theme): add unit tests for getActiveTheme() theme selection logic`

---

### Task 21: Fix ~20 broken existing test files

**Files:**
- **Modify:** ~12 test files (4 Vitest + 8 Playwright)

All fixes follow the same pattern: replace old brand identifiers with new ones.

- [ ] **Step 1:** Fix Vitest files:

| File | Find | Replace |
|------|------|---------|
| `tests/auth/callback-url-sanitization.test.ts` | `'https://harmonia.co.il.evil.com'` | `'https://lyriosa.co.il.evil.com'` |
| `tests/auth/with-auth-roles.test.ts` | `'dev@harmonia.local'` | `'dev@lyriosa.local'` |
| `tests/lib/auth-utils.test.ts` | `'dev@harmonia.local'` | `'dev@lyriosa.local'` |
| `tests/lib/auth-utils.test.ts` | `HarmoniaClaims` | `LyriosaClaims` |
| `tests/lib/playing-school-utils.test.ts` | `'@playing-school.harmonia.io'` | `'@playing-school.lyriosa.io'` |

- [ ] **Step 2:** Fix Playwright files:

| File | Find | Replace |
|------|------|---------|
| `e2e/flows/auth.spec.ts` | `a:has-text("Harmonia")` | `a:has-text("Lyriosa")` (or localized form) |
| `e2e/flows/auth.spec.ts` | `admin@harmonia.local` | `admin@lyriosa.local` |
| `e2e/flows/announcements.spec.ts` | `admin@harmonia.dev` | `admin@lyriosa.dev` |
| `e2e/flows/announcements.spec.ts` | `harmonia-user` | `lyriosa-user` |
| `e2e/flows/consent-banner.spec.ts` | `harmonia_cookie_consent` | `lyriosa_cookie_consent` |
| `e2e/security/tenant-isolation.spec.ts` | `harmonia-user` (multiple) | `lyriosa-user` |
| `e2e/security/tenant-isolation.spec.ts` | `dev@harmonia.local` | `dev@lyriosa.local` |
| `e2e/security/security.spec.ts` | `admin@harmonia.local` | `admin@lyriosa.local` |
| `e2e/integration/cross-feature.spec.ts` | `dev@harmonia.local` | `dev@lyriosa.local` |
| `e2e/integration/cross-feature.spec.ts` | `harmonia-user` | `lyriosa-user` |
| `e2e/full-audit/screenshot-all-screens.spec.ts` | `harmonia-user` | `lyriosa-user` |
| `e2e/full-audit/screenshot-all-screens.spec.ts` | `harmonia-walkthrough-seen` | `lyriosa-walkthrough-seen` |
| `e2e/full-audit/screenshot-all-screens.spec.ts` | `dev@harmonia.local` | `dev@lyriosa.local` |

- [ ] **Step 3:** Run a comprehensive grep to catch any remaining test references:

```bash
grep -rn "harmonia\|Harmonia\|HarmoniaClaims" tests/ e2e/ --include="*.ts" --include="*.spec.ts"
```

Fix any remaining hits.

- [ ] **Step 4:** Commit: `fix(tests): update all test files with new Lyriosa brand identifiers`

---

### Task 22: Create dashboard isolation Playwright test

**Files:**
- **Create:** `e2e/rebrand/dashboard-theme-isolation.spec.ts`

- [ ] **Step 1:** Create the test:

```ts
// e2e/rebrand/dashboard-theme-isolation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard theme isolation', () => {
  test('dashboard always uses Candidate A theme regardless of env', async ({ page }) => {
    // Navigate to dashboard (dev bypass auto-login)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check that data-theme="a" is set on the SidebarProvider wrapper
    const sidebarProvider = page.locator('[data-theme="a"]');
    await expect(sidebarProvider).toBeVisible();

    // Verify primary color is indigo (Candidate A), not gold (Candidate B)
    const primaryColor = await page.evaluate(() => {
      const el = document.querySelector('[data-theme="a"]');
      if (!el) return null;
      return getComputedStyle(el).getPropertyValue('--primary').trim();
    });

    // Candidate A primary is "240 59% 50%" (indigo)
    expect(primaryColor).toContain('240');
  });

  test('brand name shows Lyriosa in dashboard sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // The sidebar should not contain "Harmonia"
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Harmonia');
  });
});
```

- [ ] **Step 2:** Run: `npx playwright test e2e/rebrand/dashboard-theme-isolation.spec.ts --workers=1`

- [ ] **Step 3:** Commit: `test(dashboard): add Playwright test for theme isolation`

---

### Task 23: Run full test suite verification

**Files:** All existing test files

- [ ] **Step 1:** Run TypeScript compilation:

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2:** Run Vitest:

```bash
npx vitest run
```

Expected: All tests pass (skip count may remain at ~18 for firebase adapter tests).

- [ ] **Step 3:** Run Playwright smoke tests:

```bash
npx playwright test --grep @smoke --workers=1 --timeout=90000
```

Expected: All ~103 smoke tests pass.

- [ ] **Step 4:** If any tests fail, diagnose and fix. Common failure modes:
  - **Selector mismatch:** Test looks for "Harmonia" text that is now "Lyriosa"
  - **localStorage key changed:** Test sets old key name
  - **Import path changed:** `HarmoniaClaims` renamed to `LyriosaClaims`
  - **Cookie name changed:** Test reads/writes old cookie name

- [ ] **Step 5:** Commit any remaining fixes: `fix(tests): resolve remaining test failures after rebrand`

---

## Phase 7: Final Verification

### Task 24: Smoke test checklist, tsc, grep scan, commit

- [ ] **Step 1:** Run final TypeScript check:

```bash
npx tsc --noEmit
```

- [ ] **Step 2:** Run brand name residual scan across entire source:

```bash
grep -rn "Harmonia\|harmonia\|Harmony" src/ --include="*.ts" --include="*.tsx" --include="*.json" --include="*.css" | grep -v "node_modules" | grep -v "\.d\.ts" | grep -v "components/harmonia/" | grep -v "dashboard/harmonia/" | grep -v "websiteOverride" | grep -v "CLAUDE.md"
```

Expected: zero hits in source code. The only acceptable exceptions are:
- Internal directory names like `src/components/harmonia/` (deferred rename per spec)
- Comments that are purely historical / architectural notes
- The `websiteOverride` map in `data.ts` (external URLs)

- [ ] **Step 3:** Verify with grep for old infrastructure identifiers:

```bash
grep -rn "harmonia-user\|harmonia_cookie\|harmonia_locale\|harmonia\.a11y\|harmonia\.help\|harmonia-walkthrough\|harmonia-private\|HarmoniaClaims\|playing-school\.harmonia" src/ tests/ e2e/ --include="*.ts" --include="*.tsx"
```

Expected: zero hits.

- [ ] **Step 4:** Manual smoke check (quick browser walkthrough):
  1. Start dev server: `npm run dev`
  2. Open `http://localhost:9002/` -- verify "Lyriosa" (or "ליריוסה" in Hebrew) in navbar
  3. Open browser DevTools, verify `<html data-theme="a">`
  4. Check footer copyright says "Lyriosa"
  5. Navigate to `/en` -- verify English "Lyriosa"
  6. Navigate to `/dashboard` -- verify `data-theme="a"` on wrapper
  7. Check `/login` -- verify brand logo and name
  8. Check `/privacy` -- verify "Lyriosa" in policy text

- [ ] **Step 5:** Test Candidate B theme:
  1. Set `NEXT_PUBLIC_LANDING_THEME=b` in `.env.local`
  2. Restart dev server
  3. Verify gold primary color on landing page
  4. Verify dashboard still uses indigo (Candidate A)
  5. Navigate through all public pages -- verify gold theme
  6. Reset to `NEXT_PUBLIC_LANDING_THEME=a` in `.env.local`

- [ ] **Step 6:** Final commit:

```bash
git add -A
git commit -m "feat: complete Lyriosa rebrand with dual-candidate A/B theme system

- Renamed all brand references from Harmonia to Lyriosa across 94+ files
- Implemented server-side theme toggle via NEXT_PUBLIC_LANDING_THEME env var
- Added 4 Google Fonts (Playfair Display, Plus Jakarta Sans, Heebo, Frank Ruhl Libre)
- Created BrandThemeProvider client context for theme-aware components
- Added Candidate B CSS variable overrides (gold primary, navy accents)
- Dashboard locked to Candidate A via data-theme=\"a\" on layout wrapper
- Updated all 25 translation files across 4 locales
- Renamed all infrastructure identifiers (cookies, localStorage, Supabase bucket)
- Added theme toggle unit tests and brand name grep CI test
- Added dashboard theme isolation Playwright test"
```

---

## Quick Reference

### Candidate B Colors (HSL for CSS)

| Name | Hex | HSL |
|------|-----|-----|
| Gold primary | `#C9A84C` | `43 50% 54%` |
| Deep navy | `#0D1B2A` | `210 50% 11%` |
| Navy surface | `#1A2E44` | `210 44% 18%` |
| Indigo CTA | `#2D3F8F` | `229 52% 37%` |
| Off-white bg | `#F9F6F0` | `40 43% 96%` |
| Gold light | `#E8CC7A` | `43 70% 69%` |

### Theme-Keyed Style Maps Pattern (mandatory for all themed components)

```tsx
const themeStyles = {
  a: { wrapper: 'bg-background border', heading: 'font-[family-name:var(--font-heading)] text-3xl font-bold' },
  b: { wrapper: 'bg-[hsl(210,50%,11%)] border border-primary/20', heading: 'font-[family-name:var(--font-display)] text-4xl font-bold' },
} as const;

const theme = useBrandTheme(); // 'a' | 'b'
const styles = themeStyles[theme];
```

Do NOT use separate A/B component files. Do NOT scatter ternary expressions through JSX.

### Key Architecture Rules
- Candidate A `:root` values in `globals.css` must be preserved **verbatim** (decimal precision matters)
- `@theme {}` block in `globals.css` is the Tailwind v4 config -- NOT `tailwind.config.ts`
- `layout.tsx` sets `data-theme` server-side on `<html>` (NOT via client provider)
- `BrandThemeProvider` reads `data-theme` from DOM -- it does NOT set it
- Dashboard forces `data-theme="a"` on `<SidebarProvider>` wrapper
- All 4 Google Fonts loaded unconditionally; activated per theme via CSS variables
- Fonts: Playfair Display (400/700/900, latin), Plus Jakarta Sans (400/500/600/700, latin), Heebo (400/500/700, hebrew+latin), Frank Ruhl Libre (400/700, hebrew+latin)
- All files under `src/components/harmonia/` keep their directory name (deferred rename per spec)

### File Counts: 11 new + ~43 source mods + 25 translation + ~15 test = **~94 files**

---

*24 tasks, 7 phases. Estimated: 3-5 hours (developer) or 1-2 hours (coordinated agents).*
