# SDD-FIX-01: Admin UI — Language Selector, Chat Icon & Navigation RTL

**PDF Issues:** #1, #2, #24  
**Priority:** P0  
**Status:** ✅ Components exist — bugs to fix

---

## 1. Overview

Three navigation/shell-level bugs affect the admin panel and the public site:
1. The admin UI has no language selector — the user is locked into the server's default locale.
2. The floating chat/support icon overlaps the left navigation sidebar and cannot be repositioned.
3. The public registration page shows RTL layout issues in English mode, and the Hebrew navbar is not aligned with the logo the same way the English one is.

---

## 2. Issue #1 — Admin Language Selector

### Problem
The admin dashboard shell (`src/components/layout/admin-shell.tsx` or equivalent) does not render a `<LanguageSelector>` component, even though the main public site does. Admins who speak Russian or Arabic are stuck with Hebrew.

### Required Behaviour
- The same `<LanguageSelector>` dropdown used in the main site's top navbar must appear in the admin shell header bar, positioned to the left of the notification bell and user avatar (RTL: right side visually = left in DOM order for LTR positioning, so place it on the `start` side of the header action cluster).
- Switching language in admin must persist to `localStorage` under the key `harmonia_locale` and cause a `next-intl` locale redirect exactly as the main site does.
- The selector must show flags + locale code: 🇮🇱 עב | 🇬🇧 EN | 🇷🇺 RU | 🇸🇦 AR.

### Implementation Steps

**Step 1 — Locate the admin header component**
```
src/components/layout/admin-header.tsx   (or dashboard-header / top-bar)
```
Identify where the notification bell and avatar are rendered.

**Step 2 — Import and insert LanguageSelector**
```tsx
// In admin-header.tsx
import { LanguageSelector } from '@/components/layout/language-selector';

// Inside the header action cluster:
<div className="flex items-center gap-2">
  <LanguageSelector />          {/* ← ADD THIS */}
  <NotificationBell />
  <UserAvatar />
</div>
```

**Step 3 — Verify LanguageSelector is locale-redirect-aware**
The component should call `router.replace(pathname, { locale: newLocale })` using `next-intl`'s `useRouter`. Confirm this is already the case. If the component only sets a cookie without redirect, add the redirect.

**Step 4 — Test**
- Log in as admin in Hebrew → switch to English → confirm all admin strings change.
- Confirm the user's role/session is not affected by the locale switch.

---

## 3. Issue #2 — Chat Icon Z-index / Position Conflict

### Problem
A floating chat/support button (likely a third-party widget or custom `<ChatFab>` component) is rendered at `position: fixed` and overlaps the left sidebar navigation (`z-index` conflict). It cannot be dragged or moved.

### Root Cause
The sidebar uses a `z-index` around 40 (shadcn default for sheets/sidebars). The chat FAB likely uses `z-index: 9999` (third-party default), which draws it on top. Additionally, the `right: 0` / `bottom: 0` placement clashes with sidebar width in desktop layout.

### Required Behaviour
- The chat FAB must never overlap any navigation element.
- On desktop (≥ 1024px): FAB sits at `bottom: 24px`, `inset-inline-end: 24px` (RTL-safe), with enough `margin-inline-end` to clear the sidebar width when the sidebar is open (sidebar width = 240px in open state, 64px in collapsed state). Use a CSS variable `--sidebar-width` already defined in the theme.
- On mobile (< 1024px): FAB sits at `bottom: 80px` (above the mobile bottom tab bar if present), `inset-inline-end: 16px`.
- The FAB z-index must be set to `z-50` (Tailwind) = `50` — below any modal/drawer (`z-[100]`) but above page content.

### Implementation Steps

**Step 1 — Find the FAB**
```
grep -r "ChatFab\|chat-fab\|floating-chat\|intercom\|crisp\|tawk" src/
```

**Step 2 — If custom component** (`src/components/chat-fab.tsx` or similar):
```tsx
// Replace static positioning with dynamic CSS variable awareness
<div
  className={cn(
    "fixed z-50 transition-all",
    "bottom-6 md:bottom-6",
    "end-4 md:end-6",          // RTL-safe: 'end' = right in LTR, left in RTL
    // Push away from sidebar on desktop
    "md:me-[var(--sidebar-offset,0px)]"
  )}
  style={{
    '--sidebar-offset': sidebarOpen ? '240px' : '64px'
  } as React.CSSProperties}
>
```

**Step 3 — If third-party widget** (e.g., Tawk.to, Crisp):
Add CSS override in `globals.css`:
```css
/* Chat widget position fix */
#tawkchat-status-circle,
.crisp-client .cc-nsge {
  bottom: 80px !important;
  inset-inline-end: 24px !important;
  inset-inline-start: unset !important;
  z-index: 50 !important;
}
```

**Step 4 — Sidebar open/close state**
Pass sidebar state from the layout context:
```tsx
// In AdminShell, where sidebar open state is managed:
const { sidebarOpen } = useSidebar(); // shadcn sidebar hook
// Pass to ChatFab or set CSS variable on document.documentElement
```

---

## 4. Issue #24 — Registration Page RTL & Navbar Alignment

### Problem A — English Registration has RTL Issues
When the locale is `en`, the `/register` page renders some elements with RTL direction inherited from a parent `dir="rtl"` wrapper that should only apply to Hebrew/Arabic.

### Problem B — Hebrew Navbar Logo Misalignment
In Hebrew mode, the main site navbar's logo is not flush with the navigation links the way it is in English — there's a gap or the flexbox is not mirrored correctly.

### Implementation Steps

**Fix A — Scoped RTL Direction**

Locate the root layout: `src/app/[locale]/layout.tsx`

```tsx
// Current (likely):
<html lang={locale}>
  <body dir="rtl">   {/* ← WRONG — always RTL */}

// Fix:
const rtlLocales = ['he', 'ar'];
<html lang={locale} dir={rtlLocales.includes(locale) ? 'rtl' : 'ltr'}>
  <body>
```

Also check any intermediate layout files under `[locale]/` that might hardcode `dir`.

**Fix B — Navbar Logo Alignment in Hebrew**

Locate `src/components/layout/navbar.tsx` (public site).

```tsx
// The logo and nav links are in a flex row.
// In RTL the logo should be on the RIGHT (end), links on the LEFT (start).
// Use logical CSS properties:

<nav className="flex items-center justify-between">
  {/* Logo — always on the inline-start side */}
  <Link href="/" className="flex-shrink-0 me-8">
    <Logo />
  </Link>
  
  {/* Nav links — grow to fill remaining space, justify start */}
  <div className="flex items-center gap-6 flex-1">
    {navLinks.map(...)}
  </div>
  
  {/* Actions — inline-end */}
  <div className="flex items-center gap-2 ms-4">
    <LanguageSelector />
    <LoginButton />
  </div>
</nav>
```

Key: replace any `ml-`, `mr-`, `pl-`, `pr-` with their logical equivalents `ms-`, `me-`, `ps-`, `pe-` throughout `navbar.tsx`.

---

## 5. Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Admin logs in → looks at header | Language selector visible, same as main site |
| 2 | Admin switches to English | All admin strings switch to English, no page reload required |
| 3 | Admin opens sidebar → chat FAB visible | FAB does not overlap sidebar, sits at bottom-end corner |
| 4 | Mobile admin view → chat FAB | FAB above bottom tab bar, does not cover any nav element |
| 5 | Navigate to `/en/register` | All elements are LTR, no RTL artifacts |
| 6 | Navigate to `/he/register` | All elements RTL, logo flush with nav links |
