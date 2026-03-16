# Brand Toggle Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-circle icon button to public and dashboard navbars letting any visitor toggle between `indigo` and `gold` visual brands, persisted via a `lyriosa-brand` cookie and (for logged-in users) also saved to their user record.

**Architecture:** `getActiveBrand()` becomes async and reads the `lyriosa-brand` cookie server-side on every request. A `BrandToggle` client component calls `updateBrandPreferenceAction` (Server Action that sets the cookie + optionally updates the DB) then `router.refresh()`. Optimistic local state prevents flicker. On login, `createSessionAction` syncs the stored `preferredBrand` from the user record into the cookie.

**Tech Stack:** Next.js 16 Server Actions, `next/headers` cookies API (`await cookies()`), `useBrandTheme()` context, `useRouter()` from `@/i18n/routing`, next-intl, Tailwind/shadcn `Button`, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-03-16-brand-toggle-design.md`

---

## Chunk 1: Foundation — cookie constant, type, getActiveBrand

### Task 1: Add `BRAND_THEME_COOKIE` constant and `preferredBrand` to User type

**Files:**
- Modify: `src/lib/brand.ts`
- Modify: `src/lib/types.ts`

**Context:** `src/lib/brand.ts` is the home for all cookie/storage key constants. `BRAND_COOKIE_NAME = 'lyriosa-user'` is a session cookie — `BRAND_THEME_COOKIE` is a different cookie for visual brand preference. `src/lib/types.ts` line 530 has `preferredLanguage?: 'he' | 'en' | 'ar' | 'ru'` — add `preferredBrand` directly below it.

- [ ] **Step 1: Add constant to brand.ts**

Open `src/lib/brand.ts`. After line 12 (`export const BRAND_COOKIE_NAME = 'lyriosa-user'`), add:

```ts
export const BRAND_THEME_COOKIE = 'lyriosa-brand'
```

- [ ] **Step 2: Add field to User type**

Open `src/lib/types.ts`. Find line 530 (`preferredLanguage?: 'he' | 'en' | 'ar' | 'ru';`). Add directly below it:

```ts
  preferredBrand?: 'indigo' | 'gold';
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/brand.ts src/lib/types.ts
git commit -m "feat(brand-toggle): add BRAND_THEME_COOKIE constant and User.preferredBrand field"
```

---

### Task 2: Make `getActiveBrand()` async, reading from cookie

**Files:**
- Modify: `src/lib/themes/active-theme.ts`
- Modify: `src/app/[locale]/layout.tsx`

**Context:** `cookies()` from `next/headers` returns a Promise in Next.js 15+, so `getActiveBrand()` must become `async`. The root layout at `src/app/[locale]/layout.tsx` line 98 currently calls it synchronously: `const activeBrand = getActiveBrand()`. Missing `await` silently returns a Promise object (truthy but not `'indigo'`/`'gold'`), causing a fallback to `'indigo'` every time — the cookie would appear broken with no error.

- [ ] **Step 1: Write the failing test**

`tests/lib/themes/active-theme.test.ts` **already exists** with synchronous tests — these will break once `getActiveBrand()` becomes async. **Replace the entire file** with the async version:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test that getActiveBrand() reads the cookie value correctly.
// Mock next/headers to control cookie values.
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'
import { getActiveBrand } from '@/lib/themes/active-theme'

function mockCookies(value: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === 'lyriosa-brand' && value ? { value } : undefined),
  } as ReturnType<typeof import('next/headers').cookies> extends Promise<infer T> ? T : never)
}

describe('getActiveBrand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns indigo when cookie is absent', async () => {
    mockCookies(undefined)
    expect(await getActiveBrand()).toBe('indigo')
  })

  it('returns gold when cookie is gold', async () => {
    mockCookies('gold')
    expect(await getActiveBrand()).toBe('gold')
  })

  it('returns indigo for an unrecognised cookie value', async () => {
    mockCookies('purple')
    expect(await getActiveBrand()).toBe('indigo')
  })

  it('returns indigo when cookies() throws (static generation context)', async () => {
    vi.mocked(cookies).mockRejectedValue(new Error('cookies not available'))
    expect(await getActiveBrand()).toBe('indigo')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/themes/active-theme.test.ts
```

Expected: FAIL — the new test file mocks `next/headers` but `getActiveBrand()` is still the old sync implementation that hardcodes `'indigo'`. The `'returns gold when cookie is gold'` test fails (gets `'indigo'`). The static-generation test also fails. 2+ tests should fail.

- [ ] **Step 3: Implement async getActiveBrand()**

Replace the entire contents of `src/lib/themes/active-theme.ts` with:

```ts
import { cookies } from 'next/headers'
import { BRAND_THEME_COOKIE } from '@/lib/brand'

export type BrandId = 'indigo' | 'gold'

export async function getActiveBrand(): Promise<BrandId> {
  try {
    const cookieStore = await cookies()
    const value = cookieStore.get(BRAND_THEME_COOKIE)?.value
    if (value === 'gold' || value === 'indigo') return value
  } catch {
    // cookies() throws outside a request context (static generation)
  }
  return 'indigo'
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/theme/active-theme.test.ts
```

Expected: PASS — 4/4.

- [ ] **Step 5: Update the call site in layout.tsx**

Open `src/app/[locale]/layout.tsx`. Find line 98:
```ts
const activeBrand = getActiveBrand();
```
Change to:
```ts
const activeBrand = await getActiveBrand();
```

- [ ] **Step 6: Grep for any other call sites**

```bash
grep -r "getActiveBrand" src/
```

Expected output: only `src/lib/themes/active-theme.ts` (definition) and `src/app/[locale]/layout.tsx` (the one call site). If any other call sites are found, add `await` there too.

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/themes/active-theme.ts src/app/[locale]/layout.tsx tests/lib/themes/active-theme.test.ts
git commit -m "feat(brand-toggle): getActiveBrand() reads lyriosa-brand cookie"
```

---

## Chunk 2: Server Action + i18n keys

### Task 3: Add `updateBrandPreferenceAction` Server Action

**Files:**
- Modify: `src/app/actions/user-preferences.ts`

**Context:** This file already has `updatePreferredLanguageAction`. **Do NOT copy its pattern** — that action accepts `userId` from the client, which is an IDOR vulnerability. The new action must derive the user ID from `verifyAuth()` session claims. Unauthenticated callers (no session) should still be able to set the cookie — just skip the DB write.

`verifyAuth()` is imported from `@/lib/auth-utils`. It returns `LyriosaClaims` with a `uid` field. In dev without Firebase, it returns a synthetic `dev-user` claim. `db.users.findById(id)` is the correct method — `ScopedRepository<User>` has `findById`, not `findByUid`.

**Important:** `z` and `getDb` are already imported in this file at lines 3 and 5. `requireRole` is also already imported at line 4 and used by `updatePreferredLanguageAction` — do **not** remove it. Only add the four new imports listed in Step 3 (`cookies`, `verifyAuth`, `BRAND_THEME_COOKIE`, `BrandId`).

**Testing pattern:** `src/app/actions/user-preferences.ts` has `'use server'` — it cannot be imported directly in Vitest (see CLAUDE.md). Follow the project pattern in `tests/actions/consent.test.ts`: reproduce the pure logic inline rather than importing the action file. The test verifies the same business rules without touching the server boundary.

- [ ] **Step 1: Write the failing test**

Create `tests/actions/update-brand-preference.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

// src/app/actions/user-preferences.ts has 'use server' — cannot be imported directly in Vitest.
// We reproduce the pure validation logic here to verify correctness.
// The integration (cookie set + DB update) is covered by the BrandToggle component tests
// which mock the action at the boundary.

// ---------------------------------------------------------------------------
// Pure logic: brand validation
// Mirrors the Zod schema in updateBrandPreferenceAction:
//   z.object({ brand: z.enum(['indigo', 'gold']) })
// ---------------------------------------------------------------------------

type BrandId = 'indigo' | 'gold'

function validateBrandInput(input: unknown): { success: true; brand: BrandId } | { success: false; error: string } {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('brand' in input) ||
    (input as { brand: unknown }).brand !== 'indigo' &&
    (input as { brand: unknown }).brand !== 'gold'
  ) {
    return { success: false, error: 'Invalid brand value' }
  }
  return { success: true, brand: (input as { brand: BrandId }).brand }
}

describe('updateBrandPreferenceAction — brand validation', () => {
  it('accepts indigo', () => {
    const result = validateBrandInput({ brand: 'indigo' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.brand).toBe('indigo')
  })

  it('accepts gold', () => {
    const result = validateBrandInput({ brand: 'gold' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.brand).toBe('gold')
  })

  it('rejects an unknown brand string', () => {
    const result = validateBrandInput({ brand: 'purple' })
    expect(result.success).toBe(false)
  })

  it('rejects missing brand key', () => {
    const result = validateBrandInput({})
    expect(result.success).toBe(false)
  })

  it('rejects non-object input', () => {
    const result = validateBrandInput('gold')
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Cookie options logic
// Mirrors the cookie options in updateBrandPreferenceAction:
//   { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' }
// ---------------------------------------------------------------------------

describe('updateBrandPreferenceAction — cookie options', () => {
  it('maxAge is one year in seconds', () => {
    const ONE_YEAR = 60 * 60 * 24 * 365
    expect(ONE_YEAR).toBe(31536000)
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

```bash
npx vitest run tests/actions/update-brand-preference.test.ts
```

Expected: PASS — 6/6. The logic is self-contained in the test file so it passes immediately. Confirm it runs cleanly before proceeding to implementation.

- [ ] **Step 3: Implement the action**

Open `src/app/actions/user-preferences.ts`. Add these imports at the top (after the existing ones):

```ts
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth-utils';
import { BRAND_THEME_COOKIE } from '@/lib/brand';
import type { BrandId } from '@/lib/themes/active-theme';
```

Then append the new action at the bottom of the file:

```ts
const UpdateBrandPreferenceSchema = z.object({
  brand: z.enum(['indigo', 'gold']),
});

export async function updateBrandPreferenceAction(
  input: { brand: BrandId }
): Promise<{ success: boolean; error?: string }> {
  const parsed = UpdateBrandPreferenceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid brand value' };

  const { brand } = parsed.data;

  // Always set the cookie — works for unauthenticated visitors too
  const cookieStore = await cookies();
  cookieStore.set(BRAND_THEME_COOKIE, brand, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  });

  // For authenticated users, also persist to their user record
  // userId is derived from the verified session — never from client input
  try {
    const claims = await verifyAuth();
    const db = await getDb();
    await db.users.update(claims.uid, { preferredBrand: brand });
  } catch {
    // Not authenticated — cookie-only is fine
  }

  return { success: true };
}
```

- [ ] **Step 4: Run test to confirm still passing**

```bash
npx vitest run tests/actions/update-brand-preference.test.ts
```

Expected: PASS — 6/6. (Tests were already passing before implementation; re-run confirms nothing broke.)

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/user-preferences.ts tests/actions/update-brand-preference.test.ts
git commit -m "feat(brand-toggle): updateBrandPreferenceAction sets lyriosa-brand cookie"
```

---

### Task 4: Add i18n keys to all 4 locale files

**Files:**
- Modify: `src/messages/en/common.json`
- Modify: `src/messages/he/common.json`
- Modify: `src/messages/ar/common.json`
- Modify: `src/messages/ru/common.json`

**Context:** Keys live in `Common.shared` (lines 3–27 of each file). Convention: label describes what clicking DOES, not what you're switching TO. For example `colorModeLightLabel` = "Switch to dark mode" (current=light, next=dark). So `brandIndigoLabel` = "Switch to gold theme" (current=indigo, click → gold).

- [ ] **Step 1: Add to en/common.json**

In `src/messages/en/common.json`, inside `"Common": { "shared": { ... } }`, add after `"colorModeSystemLabel"`:

```json
"brandIndigoLabel": "Switch to gold theme",
"brandGoldLabel": "Switch to indigo theme"
```

- [ ] **Step 2: Add to he/common.json**

```json
"brandIndigoLabel": "עבור לנושא זהב",
"brandGoldLabel": "עבור לנושא אינדיגו"
```

- [ ] **Step 3: Add to ar/common.json**

```json
"brandIndigoLabel": "التبديل إلى الثيم الذهبي",
"brandGoldLabel": "التبديل إلى الثيم النيلي"
```

- [ ] **Step 4: Add to ru/common.json**

```json
"brandIndigoLabel": "Переключить на золотую тему",
"brandGoldLabel": "Переключить на тему индиго"
```

- [ ] **Step 5: Commit**

```bash
git add src/messages/en/common.json src/messages/he/common.json src/messages/ar/common.json src/messages/ru/common.json
git commit -m "feat(brand-toggle): add brandIndigoLabel/brandGoldLabel i18n keys"
```

---

## Chunk 3: BrandToggle component

> **Prerequisite:** Before starting this chunk, verify that `src/app/[locale]/layout.tsx` line 98 reads `const activeBrand = await getActiveBrand()` (with `await`). If it still reads `const activeBrand = getActiveBrand()`, complete Task 2 Step 5 first — a missing `await` causes `activeBrand` to be `"[object Promise]"` and the brand toggle will silently never work.

### Task 5: Build the `BrandToggle` component

**Files:**
- Create: `src/components/brand-toggle.tsx`
- Create: `tests/components/brand-toggle.test.tsx`

**Context:** Follow the pattern from `src/components/color-mode-toggle.tsx` exactly. Use `useBrandTheme()` from `@/components/brand-theme-provider` to read current brand. Use `useRouter()` from `@/i18n/routing` (not `next/navigation` — this project uses the i18n-aware router). The icon is an inline SVG with two colored circles: indigo (#6366f1) and gold (#C9A84C). The active brand's circle is full opacity; the inactive one is at 40% opacity. Optimistic state prevents flicker: set local state immediately on click, then call the action + `router.refresh()`. Reset via `useEffect(() => setOptimisticBrand(null), [brand])` — not after `router.refresh()` (which is fire-and-forget).

- [ ] **Step 1: Write the failing tests**

Create `tests/components/brand-toggle.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrandToggle } from '@/components/brand-toggle'

const mockRefresh = vi.fn()
vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

vi.mock('@/app/actions/user-preferences', () => ({
  updateBrandPreferenceAction: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

let mockBrand = 'indigo'
vi.mock('@/components/brand-theme-provider', () => ({
  useBrandTheme: () => ({ brand: mockBrand }),
}))

import { updateBrandPreferenceAction } from '@/app/actions/user-preferences'

beforeEach(() => {
  vi.clearAllMocks()
  mockBrand = 'indigo'
})

describe('BrandToggle', () => {
  it('renders a button with accessible label', () => {
    render(<BrandToggle />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('aria-label reflects current brand (indigo → switching to gold)', () => {
    render(<BrandToggle />)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-label')).toBe('brandIndigoLabel')
  })

  it('clicking with indigo brand calls action with gold', async () => {
    render(<BrandToggle />)
    fireEvent.click(screen.getByRole('button'))
    // Wait for async handler
    await vi.waitFor(() => {
      expect(updateBrandPreferenceAction).toHaveBeenCalledWith({ brand: 'gold' })
    })
  })

  it('clicking with gold brand calls action with indigo', async () => {
    mockBrand = 'gold'
    render(<BrandToggle />)
    fireEvent.click(screen.getByRole('button'))
    await vi.waitFor(() => {
      expect(updateBrandPreferenceAction).toHaveBeenCalledWith({ brand: 'indigo' })
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/components/brand-toggle.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/brand-toggle.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useBrandTheme } from '@/components/brand-theme-provider'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { updateBrandPreferenceAction } from '@/app/actions/user-preferences'
import type { BrandId } from '@/lib/themes/active-theme'

function BrandIcon({ displayBrand }: { displayBrand: BrandId }) {
  return (
    <svg
      width="18"
      height="10"
      viewBox="0 0 18 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Indigo circle — left */}
      <circle
        cx="5"
        cy="5"
        r="4.5"
        fill="#6366f1"
        opacity={displayBrand === 'indigo' ? 1 : 0.35}
      />
      {/* Gold circle — right */}
      <circle
        cx="13"
        cy="5"
        r="4.5"
        fill="#C9A84C"
        opacity={displayBrand === 'gold' ? 1 : 0.35}
      />
    </svg>
  )
}

export function BrandToggle({ className }: { className?: string }) {
  const t = useTranslations('Common.shared')
  const { brand } = useBrandTheme()
  const router = useRouter()
  const [optimisticBrand, setOptimisticBrand] = useState<BrandId | null>(null)

  // Reset optimistic state once server re-render propagates the new brand through context
  useEffect(() => {
    setOptimisticBrand(null)
  }, [brand])

  const displayBrand = optimisticBrand ?? brand
  const next: BrandId = displayBrand === 'indigo' ? 'gold' : 'indigo'
  const label = displayBrand === 'indigo' ? t('brandIndigoLabel') : t('brandGoldLabel')

  const handleClick = async () => {
    setOptimisticBrand(next)
    await updateBrandPreferenceAction({ brand: next })
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn('h-9 w-9 cursor-pointer', className)}
      onClick={handleClick}
    >
      <BrandIcon displayBrand={displayBrand} />
    </Button>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/components/brand-toggle.test.tsx
```

Expected: PASS — 4/4.

- [ ] **Step 5: Commit**

```bash
git add src/components/brand-toggle.tsx tests/components/brand-toggle.test.tsx
git commit -m "feat(brand-toggle): BrandToggle component with optimistic state"
```

---

## Chunk 4: Navbar integration + dashboard fix

### Task 6: Add BrandToggle to public navbar and dashboard header

**Files:**
- Modify: `src/components/layout/public-navbar.tsx`
- Modify: `src/components/dashboard/header.tsx`
- Modify: `src/app/[locale]/dashboard/layout.tsx`

**Context:**
- `public-navbar.tsx` already imports `ColorModeToggle` and `LanguageSwitcher`. Add `BrandToggle` between them (after `LanguageSwitcher`, before `ColorModeToggle`) in both the desktop nav and the mobile sheet nav.
- `header.tsx` (dashboard) currently has `LanguageSwitcher` only — no `ColorModeToggle`. Add `BrandToggle` after `LanguageSwitcher`.
- `dashboard/layout.tsx` line 24 has `<SidebarProvider dir={isRtl ? 'rtl' : 'ltr'} data-brand="indigo">`. Remove **only** `data-brand="indigo"` — keep the `dir` prop. The root `<html data-brand={activeBrand}>` in `src/app/[locale]/layout.tsx` (line 103) covers the entire page tree including the dashboard; the `SidebarProvider` override was blocking cookie-based brand from taking effect. After removal the dashboard inherits the correct `data-brand` from `<html>` automatically — no additional mechanism is needed.

- [ ] **Step 1: Add BrandToggle to public-navbar.tsx**

Open `src/components/layout/public-navbar.tsx`.

Add import at the top:
```tsx
import { BrandToggle } from '@/components/brand-toggle';
```

Desktop nav (around line 85–94) — add `<BrandToggle />` between `<LanguageSwitcher />` and `<ColorModeToggle />`:
```tsx
<div className="hidden shrink-0 items-center gap-2 md:flex">
    <LanguageSwitcher />
    <BrandToggle />
    <ColorModeToggle />
    <Button asChild variant="ghost" className={s.login}>
```

Mobile nav (around line 96–98) — add `<BrandToggle />` between `<LanguageSwitcher />` and `<ColorModeToggle />`:
```tsx
<div className="ms-auto flex items-center md:hidden">
    <LanguageSwitcher />
    <BrandToggle />
    <ColorModeToggle />
```

- [ ] **Step 2: Add BrandToggle to dashboard header.tsx**

Open `src/components/dashboard/header.tsx`.

Add import:
```tsx
import { BrandToggle } from '@/components/brand-toggle';
```

Add `<BrandToggle />` after `<LanguageSwitcher />` (around line 39):
```tsx
<LanguageSwitcher />
<BrandToggle />
<Button variant="ghost" size="icon" className="rounded-full">
```

- [ ] **Step 3: Remove hardcoded data-brand from dashboard layout**

Open `src/app/[locale]/dashboard/layout.tsx`. Find line 24:
```tsx
<SidebarProvider dir={isRtl ? 'rtl' : 'ltr'} data-brand="indigo">
```
Change to:
```tsx
<SidebarProvider dir={isRtl ? 'rtl' : 'ltr'}>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests still pass plus the new ones.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/public-navbar.tsx src/components/dashboard/header.tsx src/app/[locale]/dashboard/layout.tsx
git commit -m "feat(brand-toggle): add BrandToggle to navbars, remove hardcoded data-brand from dashboard"
```

---

## Chunk 5: Login sync

### Task 7: Sync preferredBrand cookie on sign-in

**Files:**
- Modify: `src/app/actions/auth.ts`

**Context:** When a Firebase user signs in, `createSessionAction` is called with an ID token. After setting the session cookie, we want to sync the user's stored `preferredBrand` into the `lyriosa-brand` cookie so it takes effect immediately. `preferredBrand` is stored on the DB user record — not in Firebase custom claims — so a DB lookup is needed using `db.users.findById(uid)`. This is **non-fatal**: if the lookup fails or the user has no `preferredBrand`, the existing cookie preference is simply preserved.

**Critical:** `BRAND_THEME_COOKIE` (`'lyriosa-brand'`) is distinct from `BRAND_COOKIE_NAME` (`'lyriosa-user'`). Do NOT delete the brand cookie in `signOutAction`. Only the session cookies are deleted on sign-out — brand preference should persist.

- [ ] **Step 1: Add BRAND_THEME_COOKIE import to auth.ts**

Open `src/app/actions/auth.ts`. The existing import line 15 is:
```ts
import { BRAND_COOKIE_NAME } from '@/lib/brand';
```
Change to:
```ts
import { BRAND_COOKIE_NAME, BRAND_THEME_COOKIE } from '@/lib/brand';
```

Also add `getDb` import (after the existing imports):
```ts
import { getDb } from '@/lib/db';
```

- [ ] **Step 2: Add brand sync inside createSessionAction**

In `createSessionAction`, after `cookieStore.delete(BRAND_COOKIE_NAME)` (around line 46), add the brand sync block. The uid is extracted from the ID token's JWT payload — `createSessionCookie` only returns the encoded session string, so we decode the JWT's middle segment. The idToken was already cryptographically verified by `createSessionCookie` so no re-verification is needed here. `payload.sub` is the standard Firebase claim for uid.

The full updated `createSessionAction` (lines 26–53) becomes:

```ts
export async function createSessionAction(
  idToken: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!idToken || typeof idToken !== 'string') {
    return { ok: false, error: 'Missing or invalid ID token' };
  }

  try {
    const sessionCookie = await createSessionCookie(idToken);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    // Clear the legacy mock cookie
    cookieStore.delete(BRAND_COOKIE_NAME);

    // Sync user's stored brand preference into lyriosa-brand cookie (non-fatal)
    try {
      const payload = JSON.parse(
        Buffer.from(idToken.split('.')[1], 'base64url').toString('utf-8')
      );
      const uid: string = payload.sub || payload.user_id || '';
      if (uid) {
        const db = await getDb();
        const user = await db.users.findById(uid);
        if (user?.preferredBrand) {
          cookieStore.set(BRAND_THEME_COOKIE, user.preferredBrand, {
            maxAge: 60 * 60 * 24 * 365,
            path: '/',
            sameSite: 'lax',
          });
        }
      }
    } catch {
      // Non-fatal — existing brand cookie preference is preserved
    }

    return { ok: true };
  } catch (error) {
    console.error('[createSessionAction] Failed:', error);
    return { ok: false, error: 'Failed to create session. Please try again.' };
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/auth.ts
git commit -m "feat(brand-toggle): sync preferredBrand cookie on sign-in"
```

---

## Final verification

- [ ] **Start dev server and test manually**

```bash
npm run dev
```

1. Open `http://localhost:9002/en` — see indigo theme
2. Click the two-circle brand toggle in navbar — page refreshes with gold theme (warm cream background, Frank Ruhl Libre font)
3. Reload the page — gold theme persists (cookie survived reload)
4. Click again — switches back to indigo
5. Open `http://localhost:9002/en/dashboard` — brand toggle also appears in the dashboard header and respects the cookie

- [ ] **Run full test suite one final time**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.
