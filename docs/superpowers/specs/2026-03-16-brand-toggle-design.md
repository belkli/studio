# Brand Toggle — User Preference Design

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any visitor (authenticated or not) switch between the `indigo` and `gold` visual brand via a single icon button in the navbar, with the preference persisted in a cookie and (for logged-in users) also on their user record.

**Architecture:** A `lyriosa-brand` cookie is the single source of truth. `getActiveBrand()` reads it server-side on every request. A `BrandToggle` client component sets the cookie via a Server Action then calls `router.refresh()` to re-render. Authenticated users also have `preferredBrand` persisted to their `User` record so the preference roams across devices.

**Tech Stack:** Next.js Server Actions, `next/headers` cookies API, React client component, Lucide icons, next-intl, Tailwind/shadcn Button.

---

## Decisions

| Question | Answer |
|---|---|
| Who can toggle? | All users — authenticated and unauthenticated |
| How is it stored? | `lyriosa-brand` cookie (max-age 1 year) |
| Apply method | Server Action sets cookie → `router.refresh()` |
| Settings card? | No — icon button in navbar only |
| Icon | Two colored circles: indigo dot / gold dot showing current brand |
| Dashboard brand | Reads same cookie (removes hardcoded `data-brand="indigo"` from dashboard layout) |

---

## File Structure

| File | Change |
|---|---|
| `src/lib/themes/active-theme.ts` | `getActiveBrand()` reads `lyriosa-brand` cookie via `next/headers` |
| `src/lib/brand.ts` | Add `BRAND_THEME_COOKIE = 'lyriosa-brand'` constant. **This is distinct from the existing `BRAND_COOKIE_NAME = 'lyriosa-user'` (session cookie) — do not confuse or merge them.** |
| `src/lib/types.ts` | Add `preferredBrand?: 'indigo' \| 'gold'` to `User` type |
| `src/app/actions/user-preferences.ts` | Add `updateBrandPreferenceAction` Server Action |
| `src/components/brand-toggle.tsx` | New client component — icon button, calls action, `router.refresh()` |
| `src/components/layout/public-navbar.tsx` | Add `<BrandToggle />` between `LanguageSwitcher` and `ColorModeToggle` |
| `src/components/dashboard/header.tsx` | Add `<BrandToggle />` after `LanguageSwitcher` |
| `src/app/[locale]/dashboard/layout.tsx` | Remove hardcoded `data-brand="indigo"` from `SidebarProvider` |
| `src/messages/{he,en,ar,ru}/common.json` | Add `Common.shared.brandIndigoLabel` and `Common.shared.brandGoldLabel` |
| `tests/brand-toggle.test.tsx` | Unit tests for BrandToggle component |

---

## Component Design: `BrandToggle`

```tsx
// src/components/brand-toggle.tsx
'use client'

// Props: none
// Reads current brand from useBrandTheme() context
// On click: calls updateBrandPreferenceAction(next) → router.refresh()
// Icon: SVG with two circles — left circle colored indigo (#6366f1),
//       right circle colored gold (#C9A84C)
//       Active brand circle is filled/opaque, inactive is dimmed
// aria-label: i18n string describing what clicking will do
```

Visual sketch of the icon (both circles always shown, active one is bright):

```
indigo active:  [●  ○]   (filled indigo left, dim gold right)
gold active:    [○  ●]   (dim indigo left, filled gold right)
```

---

## Server Action: `updateBrandPreferenceAction`

```ts
// In src/app/actions/user-preferences.ts
// Input: { brand: 'indigo' | 'gold' }
// - Validates brand value
// - Sets cookie: (await cookies()).set(BRAND_THEME_COOKIE, brand, { maxAge: 60*60*24*365, path: '/', sameSite: 'lax' })
// - Attempts verifyAuth() — if authenticated, derives userId from session claims
//   and calls db.users.update(userId, { preferredBrand: brand })
// - If not authenticated (verifyAuth throws), only the cookie is set — no DB write
// - Returns { success: boolean }
// Note: userId is derived from the session, never accepted from the client,
// so no user can overwrite another user's preferredBrand.
//
// ⚠️ WARNING: Do NOT follow the pattern of updatePreferredLanguageAction in this
// same file — that action has an IDOR issue where userId comes from client input.
// The brand action must derive userId from verifyAuth() session claims only.
```

---

## `getActiveBrand()` Change

`getActiveBrand()` becomes `async` because `cookies()` from `next/headers` returns a Promise in Next.js 15+. All call sites must `await` it.

```ts
// src/lib/themes/active-theme.ts
import { cookies } from 'next/headers'
import { BRAND_THEME_COOKIE } from '@/lib/brand'

export async function getActiveBrand(): Promise<BrandId> {
  try {
    const cookieStore = await cookies()
    const value = cookieStore.get(BRAND_THEME_COOKIE)?.value
    if (value === 'gold' || value === 'indigo') return value
  } catch {
    // cookies() throws outside request context (e.g. during static generation)
  }
  return 'indigo'
}
```

Call sites — **grep for `getActiveBrand` across the entire codebase and `await` every call site**. Currently known:
- `src/app/[locale]/layout.tsx`: change line 98 from `const activeBrand = getActiveBrand()` to `const activeBrand = await getActiveBrand()`

> **Important:** a missing `await` here silently returns a Promise object (truthy, but not `'indigo'`/`'gold'`), triggering the default fallback and making the cookie appear not to work. This is the most likely silent failure mode.

---

## Dashboard Layout Change

Remove **only** `data-brand="indigo"` from `<SidebarProvider>` in `src/app/[locale]/dashboard/layout.tsx`. Preserve the `dir` prop — it is doing important RTL work. Result:

```tsx
// Before:
<SidebarProvider dir={isRtl ? 'rtl' : 'ltr'} data-brand="indigo">

// After:
<SidebarProvider dir={isRtl ? 'rtl' : 'ltr'}>
```

The root `<html data-brand={activeBrand}>` (set in `src/app/[locale]/layout.tsx`) already covers the whole page — the dashboard override was preventing cookie-based brand from working inside the dashboard.

---

## Login Flow (on sign-in)

When a user logs in and `user.preferredBrand` is set, the brand cookie should be synced so the preference applies immediately. The correct place is `createSessionAction` in `src/app/actions/auth.ts`.

`preferredBrand` is stored only on the mock `User` record (DB), not in Firebase custom claims. So the implementation must do a DB lookup:

```ts
// Inside createSessionAction, after verifying idToken and setting session cookie:
try {
  const db = await getDb()
  const user = await db.users.findByUid(uid)  // uid from verified token
  if (user?.preferredBrand) {
    const cookieStore = await cookies()
    cookieStore.set(BRAND_THEME_COOKIE, user.preferredBrand, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
    })
  }
} catch {
  // Non-fatal — user's existing cookie preference is preserved
}
```

- **`BRAND_THEME_COOKIE`** (`'lyriosa-brand'`) is distinct from `BRAND_COOKIE_NAME` (`'lyriosa-user'`). Do not delete the brand cookie in `signOutAction` (the session cookie is what gets deleted, not the brand preference).
- If `preferredBrand` is not set on the user record, the existing `lyriosa-brand` cookie is left unchanged (visitor's prior preference is preserved).
- No `router.refresh()` is needed in `use-auth.tsx` — the `router.push(callbackUrl)` navigation after login already triggers a full server render picking up the new cookie.

## BrandToggle Optimistic State

Because `router.refresh()` is fire-and-forget (does not return a Promise), the `BrandToggle` should update its visual state optimistically and reset it only once the context brand actually updates:

```tsx
const [optimisticBrand, setOptimisticBrand] = useState<BrandId | null>(null)
const displayBrand = optimisticBrand ?? brand  // brand from useBrandTheme()

// Reset optimistic state once server re-render propagates new brand through context
useEffect(() => { setOptimisticBrand(null) }, [brand])

const handleClick = async () => {
  const next = displayBrand === 'indigo' ? 'gold' : 'indigo'
  setOptimisticBrand(next)
  await updateBrandPreferenceAction({ brand: next })
  router.refresh()
  // Do NOT reset here — useEffect above handles it when brand context updates
}
```

---

## i18n Keys

Added to `Common.shared` in all 4 locale files:

```json
"brandIndigoLabel": "Switch to gold theme",
"brandGoldLabel": "Switch to indigo theme"
```

(Label describes what clicking does — same convention as `colorModeLightLabel` etc.)

---

## Testing

`tests/brand-toggle.test.tsx`:
- Renders with indigo brand → left circle opaque, right circle dim
- Renders with gold brand → left circle dim, right circle opaque
- Click calls `updateBrandPreferenceAction` with the opposite brand
- `aria-label` reflects current brand

---

## Out of Scope

- Conservatorium-level brand lock (Option C from brainstorming) — future
- Animated transition between brands — future
- Brand shown in Settings as a card — not needed, navbar toggle is sufficient
