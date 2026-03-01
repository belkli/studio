# QA Report — Part 2: Functional Issues & Bugs

---

## CRITICAL — BUG-01: TypeScript Build Errors Silently Suppressed

**Severity:** 🔴 Critical  
**Files:** `next.config.ts`, `src/hooks/use-walkthrough.tsx`, `src/components/dashboard/walkthrough-manager.tsx`

**Issue:**  
The `typecheck_output.txt` in the repo documents TS2741 errors. The `use-walkthrough.tsx` (legacy file at `src/hooks/use-walkthrough.tsx`) defines a `stepsConfig` typed as `Record<UserRole, DriveStep[]>` but is missing the `school_coordinator` key (the new `walkthrough-manager.tsx` has fixed this, but the old file wasn't deleted).

Two walkthrough files exist simultaneously:
- `src/hooks/use-walkthrough.tsx` — legacy, has the TS error, not using i18n
- `src/components/dashboard/walkthrough-manager.tsx` — new, uses translations, correct

**Fix:**  
Delete the old file and ensure only the new component is used:

```bash
rm src/hooks/use-walkthrough.tsx
```

Verify no other files import from the old path:
```bash
grep -rn "from.*use-walkthrough" src/
```

---

## CRITICAL — BUG-02: `WalkthroughManager` Rendered Twice on Dashboard Pages

**Severity:** 🔴 Critical  
**Files:** `src/app/[locale]/layout.tsx` (line 50), `src/app/[locale]/dashboard/layout.tsx` (line 24)

**Issue:**  
`<WalkthroughManager />` is included in **both** the root locale layout AND the dashboard layout. On any dashboard page, it renders twice — firing the onboarding walkthrough twice simultaneously for new users.

```tsx
// src/app/[locale]/layout.tsx — also has WalkthroughManager
<WalkthroughManager />  // ← DUPLICATE

// src/app/[locale]/dashboard/layout.tsx — also has WalkthroughManager  
<WalkthroughManager />  // ← DUPLICATE
```

**Fix:**  
Remove it from the root layout. It only makes sense inside the authenticated dashboard context:

```tsx
// src/app/[locale]/layout.tsx — REMOVE this import and usage
// import { WalkthroughManager } from '@/components/dashboard/walkthrough-manager';
// ...
// <WalkthroughManager />  ← DELETE THIS LINE
```

Keep only the instance in `src/app/[locale]/dashboard/layout.tsx`.

---

## HIGH — BUG-03: Ministry Director Lands on Wrong Page

**Severity:** 🟠 High  
**File:** `src/app/[locale]/dashboard/page.tsx`

**Issue:**  
When `newFeaturesEnabled` is `true`, the `/dashboard` page handles redirects for `parent` → `/dashboard/family` and `student` → `/dashboard/profile`, and renders `AdminCommandCenter` for admins and `TeacherDashboard` for teachers. But `ministry_director` falls through to the **legacy dashboard** with `<OverviewCards />` and `<RecentForms />` — neither of which is relevant to them.

```tsx
if (newFeaturesEnabled) {
    if (user.role === 'conservatorium_admin' || user.role === 'site_admin') {
        return <AdminCommandCenter />;
    }
    if (user.role === 'teacher') {
        return <TeacherDashboard />;
    }
    // ministry_director falls through to legacy below — WRONG
}
```

**Fix:**  
```tsx
if (newFeaturesEnabled) {
    if (user.role === 'conservatorium_admin' || user.role === 'site_admin') {
        return <AdminCommandCenter />;
    }
    if (user.role === 'teacher') {
        return <TeacherDashboard />;
    }
    if (user.role === 'ministry_director') {
        router.replace('/dashboard/ministry');
        return null;
    }
    if (user.role === 'school_coordinator') {
        router.replace('/dashboard/school');
        return null;
    }
    if (user.role === 'student' || user.role === 'parent') {
        // already handled by useEffect above
    }
}
```

---

## HIGH — BUG-04: Orphan Non-Locale Route `src/app/page.tsx` Conflicts With Locale Router

**Severity:** 🟠 High  
**File:** `src/app/page.tsx`

**Issue:**  
There is a `src/app/page.tsx` file (root, non-locale) that renders a **full duplicate homepage** with its own inline header and footer, while the proper homepage lives at `src/app/[locale]/page.tsx`. This creates a routing conflict:
- Requests to `/` (without locale prefix) are served by `src/app/page.tsx` 
- This page has inline navigation with **dead `href="#"` links** (About, Privacy Policy)
- This page imports from `next-intl` without being wrapped in the locale provider, causing runtime errors in production

**Fix:**  
Delete `src/app/page.tsx` entirely. The middleware at `src/middleware.ts` is already configured to redirect `/` to the default locale:

```bash
rm src/app/page.tsx
```

Or replace it with a simple redirect:
```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation';
export default function RootPage() {
  redirect('/he'); // or let middleware handle it
}
```

---

## HIGH — BUG-05: Login Form `dir="rtl"` Hardcoded for All Locales

**Severity:** 🟠 High  
**File:** `src/components/auth/login-form.tsx` (line 80)

**Issue:**  
The Tabs component inside the login form has `dir="rtl"` hardcoded. When users visit in English or Russian (LTR locales), the tabs are rendered right-to-left. This is a visual and UX bug.

```tsx
<Tabs defaultValue="email" className="w-full" dir="rtl">  // ← HARDCODED
```

**Fix:**  
```tsx
'use client';
import { useLocale } from 'next-intl';

// Inside the component:
const locale = useLocale();
const dir = (locale === 'he' || locale === 'ar') ? 'rtl' : 'ltr';

<Tabs defaultValue="email" className="w-full" dir={dir}>
```

---

## HIGH — BUG-06: Orphan Dashboard Route Without Locale Context

**Severity:** 🟠 High  
**File:** `src/app/dashboard/forms/[id]/page.tsx`

**Issue:**  
A full page exists at `src/app/dashboard/forms/[id]/page.tsx` — outside the `[locale]` directory. This page:
- Has no i18n context (no `useTranslations`, hardcoded Hebrew strings throughout)
- Uses `import Link from 'next/link'` instead of i18n-aware link
- Has all UI labels hardcoded in Hebrew only
- Is a near-duplicate of `src/app/[locale]/dashboard/forms/[id]/page.tsx`

The route `/dashboard/forms/[id]` (without locale) is accessible and bypasses locale routing.

**Fix:**  
Delete this orphan file. The locale version is the canonical implementation:

```bash
rm -rf src/app/dashboard/
```

---

## HIGH — BUG-07: 20 Pages Using `import Link from 'next/link'` Instead of i18n Link

**Severity:** 🟠 High  
**Impact:** All locale-prefixed navigation (e.g., `/en/dashboard`) breaks — links strip the locale prefix, causing a redirect loop or landing on the wrong locale.

**Files affected (partial list):**  
- `src/app/[locale]/dashboard/approvals/page.tsx`  
- `src/app/[locale]/dashboard/forms/[id]/page.tsx`  
- `src/app/[locale]/dashboard/ministry/page.tsx`  
- `src/app/[locale]/dashboard/makeups/page.tsx`  
- `src/app/[locale]/dashboard/notifications/page.tsx`  
- And ~10 component files in `src/components/`

**Fix:**  
Search and replace across the codebase:

```bash
# Find all affected files
grep -rl "from 'next/link'" src/app/\[locale\]/ src/components/

# Each affected file: change:
import Link from 'next/link';
# To:
import { Link } from '@/i18n/routing';
```

Also check `useRouter` and `usePathname` from `next/navigation` vs `@/i18n/routing`.

---

## MEDIUM — BUG-08: Public Navbar Has No Mobile Menu

**Severity:** 🟡 Medium  
**File:** `src/components/layout/public-navbar.tsx`

**Issue:**  
The navigation bar has `className="hidden md:flex"` on the nav links — they disappear on mobile. There is no hamburger menu, drawer, or any mobile navigation fallback. On screens < 768px wide, users cannot navigate the public site.

**Fix:**  
Add a mobile menu using shadcn/ui Sheet component:

```tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useState } from 'react';

// Inside PublicNavbar:
const [mobileOpen, setMobileOpen] = useState(false);

// Mobile trigger (visible only on small screens):
<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
    <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
        </Button>
    </SheetTrigger>
    <SheetContent side={dir === 'rtl' ? 'right' : 'left'}>
        <nav className="flex flex-col gap-4 mt-8">
            {navItems.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                    className="text-lg font-medium">
                    {item.label}
                </Link>
            ))}
        </nav>
    </SheetContent>
</Sheet>
```

---

## MEDIUM — BUG-09: Dead Links on Events Page Footer

**Severity:** 🟡 Medium  
**File:** `src/app/[locale]/events/[id]/page.tsx` (lines 42, 45)

**Issue:**  
The event page has two footer links with `href="#"` — they do nothing when clicked. These appear to be meant for Privacy Policy and Contact pages.

**Fix:**  
```tsx
// Replace dead links with proper routes:
<Link href="/contact" ...>{tNav('contact')}</Link>
<Link href="/about" ...>{tNav('about')}</Link>
```

---

## MEDIUM — BUG-10: `@ts-nocheck` on Critical User Management Page

**Severity:** 🟡 Medium  
**Files:** `src/app/[locale]/dashboard/users/page.tsx`, `src/app/actions.ts`

**Issue:**  
`// @ts-nocheck` at the top of the users page completely disables TypeScript checks. This is the most sensitive admin page in the application (user approval, role changes, data editing) and it has zero type safety.

**Fix:**  
Remove `// @ts-nocheck` and fix the underlying TypeScript errors:

```tsx
// src/app/[locale]/dashboard/users/page.tsx
// DELETE: // @ts-nocheck
```

Then address any revealed type errors — common fixes include adding proper type assertions and ensuring all function parameters are typed.

---

## MEDIUM — BUG-11: School Coordinator Can Access All Admin URLs

**Severity:** 🟡 Medium  
**Files:** All admin pages under `src/app/[locale]/dashboard/admin/`

**Issue:**  
The sidebar correctly shows only `/dashboard/school` for `school_coordinator` role. However, if a school coordinator manually navigates to any `/dashboard/admin/*` URL, most pages will render their content because the role guard checks only for `conservatorium_admin` | `site_admin` but doesn't **redirect** the school coordinator.

**Fix:**  
Create a shared `useAdminGuard` hook and apply it consistently:

```tsx
// src/hooks/use-admin-guard.ts
import { useAuth } from './use-auth';
import { useRouter } from '@/i18n/routing';
import { useEffect } from 'react';

export function useAdminGuard() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
        if (!isLoading && (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin'))) {
            router.replace('/dashboard');
        }
    }, [user, isLoading, router]);
    
    return { user, isLoading, isAdmin: user?.role === 'conservatorium_admin' || user?.role === 'site_admin' };
}
```

Apply to all admin pages.

---

## LOW — BUG-12: `handleApprove` Function Uses Hook Inside Callback (React Rules Violation)

**Severity:** 🟢 Low  
**File:** `src/app/[locale]/dashboard/users/page.tsx` (line ~126)

**Issue:**  
The `handleApprove` function calls `useToast()` inside a regular function body — this violates React's Rules of Hooks:

```tsx
const handleApprove = (user: User) => {
    const { toast } = useToast(); // ← ILLEGAL: Hook called inside non-hook function
    approveUser(user.id);
    toast({ ... });
};
```

**Fix:**  
```tsx
// Move useToast to the component level
const { toast } = useToast(); // ← At component level

const handleApprove = (user: User) => {
    approveUser(user.id);
    toast({ title: t('userApproved'), description: t('userApprovedDesc', { name: user.name }) });
};
```

---

## LOW — BUG-13: No Error Boundary or Error Pages

**Severity:** 🟢 Low  
**Impact:** Runtime errors cause blank white screens with no recovery path.

**Issue:**  
There are no `error.tsx`, `loading.tsx`, or `not-found.tsx` files in the app. A single unhandled exception in any page will crash the entire screen.

**Fix:**  
Create global error handling files:

```tsx
// src/app/[locale]/error.tsx
'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => { console.error(error); }, [error]);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <Button onClick={reset}>Try again</Button>
        </div>
    );
}
```

```tsx
// src/app/[locale]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';
export default function Loading() {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;
}
```

```tsx
// src/app/[locale]/not-found.tsx
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-muted-foreground">Page not found</p>
            <Button asChild><Link href="/">Go Home</Link></Button>
        </div>
    );
}
```

---

## LOW — BUG-14: Signature Dialog Has `dir="rtl"` Hardcoded

**Severity:** 🟢 Low  
**File:** `src/app/dashboard/forms/[id]/page.tsx` (line ~310) and `src/app/[locale]/dashboard/forms/[id]/page.tsx`

**Issue:**  
Alert dialogs related to form signing have `dir="rtl"` hardcoded, breaking layout in LTR locales (English, Russian).

**Fix:**  
```tsx
import { useLocale } from 'next-intl';
const locale = useLocale();
const dir = (locale === 'he' || locale === 'ar') ? 'rtl' : 'ltr';

<AlertDialogContent dir={dir} className="sm:max-w-2xl">
```
