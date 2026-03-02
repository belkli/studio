# QA Report — Part 1: Security & Authentication Issues

> **Project:** Harmonia — Music Conservatory Management Platform  
> **Status:** High-fidelity prototype on mock data, pre-production  
> **Audited by:** QA + Architecture Review  
> **Date:** March 2026

---

## CRITICAL — SEC-01: No Password Validation on Login

**Severity:** 🔴 Critical  
**File:** `src/components/auth/login-form.tsx`

**Issue:**  
The password field is initialized with a hardcoded `'password'` value and the `login()` function in `use-auth.tsx` **never checks the password** — authentication is by email alone. Any user can log in as any other user by knowing their email address.

```tsx
// CURRENT (BROKEN)
const [password, setPassword] = useState('password') // Mock password
// ...
const login = (email: string) => { // no password param!
  const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
```

**Fix:**  
When integrating Firebase Auth, remove the mock entirely. Until then, at minimum remove the pre-filled default and add a visible warning:

```tsx
// INTERIM FIX
const [password, setPassword] = useState('') // Remove pre-filled value

// In login-form.tsx — add a dev-only banner
{process.env.NODE_ENV !== 'production' && (
  <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded p-2 text-xs mb-4">
    ⚠️ Demo mode: Any email from the mock list logs in. No password is checked.
  </div>
)}
```

For production, replace with `signInWithEmailAndPassword(auth, email, password)` from Firebase Auth.

---

## CRITICAL — SEC-02: Authentication State Stored in `localStorage` Without Integrity Check

**Severity:** 🔴 Critical  
**File:** `src/hooks/use-auth.tsx` (line 179–186)

**Issue:**  
User session (including `role`) is stored in `localStorage` as plain JSON. Any client-side script can elevate privileges by modifying `localStorage`:

```js
localStorage.setItem('harmonia-user', JSON.stringify({ ...user, role: 'site_admin' }));
```

```tsx
// CURRENT (VULNERABLE)
const storedUser = localStorage.getItem('harmonia-user');
if (storedUser) {
  setUser(JSON.parse(storedUser)); // role from localStorage — not verified server-side
}
```

**Fix:**  
In production: use Firebase Auth tokens + Firestore for role lookups. Never trust client-stored role data. Until Firebase is integrated, add a role validation guard:

```tsx
const storedUser = localStorage.getItem('harmonia-user');
if (storedUser) {
  const parsed = JSON.parse(storedUser);
  const VALID_ROLES = ['student','teacher','parent','conservatorium_admin','site_admin','ministry_director','school_coordinator'];
  // Verify against server-side data when available
  if (VALID_ROLES.includes(parsed?.role)) {
    setUser(parsed);
  } else {
    localStorage.removeItem('harmonia-user');
  }
  setIsLoading(false);
}
```

---

## CRITICAL — SEC-03: Admin Pages Accessible Without Role Guard (Playing School)

**Severity:** 🔴 Critical  
**Files:**  
- `src/app/[locale]/dashboard/admin/playing-school/page.tsx`  
- `src/app/[locale]/dashboard/admin/playing-school/distribute/page.tsx`

**Issue:**  
These pages render their component without **any role check**. A student or teacher who navigates directly to the URL sees full admin functionality (school partnership management, distribution controls):

```tsx
// CURRENT (NO AUTH GUARD)
export default function PlayingSchoolAdminPage() {
    return <SchoolPartnershipDashboard />;
}
```

The `SchoolPartnershipDashboard` component itself also has **zero** `useAuth` or role checks.

**Fix:**  
```tsx
// src/app/[locale]/dashboard/admin/playing-school/page.tsx
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/routing';
import { useEffect } from 'react';
import { SchoolPartnershipDashboard } from '@/components/dashboard/harmonia/school-partnership-dashboard';

export default function PlayingSchoolAdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin'))) {
            router.replace('/dashboard');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;
    if (user.role !== 'conservatorium_admin' && user.role !== 'site_admin') return null;

    return <SchoolPartnershipDashboard />;
}
```

Apply the **same pattern** to `distribute/page.tsx`.

---

## HIGH — SEC-04: Users Page Renders Empty for Non-Admins Instead of Redirecting

**Severity:** 🟠 High  
**File:** `src/app/[locale]/dashboard/users/page.tsx`

**Issue:**  
When a non-admin accesses `/dashboard/users`, the page renders with an empty `baseUsers = []` array — no redirect, no error message. The page silently shows an empty state which is confusing and a UX/security smell.

**Fix:**  
Add a role guard at the top of the component:

```tsx
useEffect(() => {
    if (!isLoading && currentUser && currentUser.role !== 'conservatorium_admin' && currentUser.role !== 'site_admin') {
        router.replace('/dashboard');
    }
}, [currentUser, isLoading, router]);

if (!currentUser) return null;
if (currentUser.role !== 'conservatorium_admin' && currentUser.role !== 'site_admin') return null;
```

---

## HIGH — SEC-05: `typescript.ignoreBuildErrors: true` in Production Config

**Severity:** 🟠 High  
**File:** `next.config.ts` (line 9)

**Issue:**  
TypeScript build errors are silently suppressed. This means type-unsafe code ships to production without warning. The `typecheck_output.txt` already documents known TS errors that are being hidden.

**Fix:**  
```ts
// next.config.ts — REMOVE this option before deploying to production
typescript: {
  // ignoreBuildErrors: true, // ← REMOVE THIS LINE
},
```

Fix the underlying TypeScript errors (see BUG-01 in the Bugs report).

---

## HIGH — SEC-06: Google & Microsoft SSO Buttons Do Nothing

**Severity:** 🟠 High  
**File:** `src/components/auth/login-form.tsx` (lines 126–135)

**Issue:**  
Both OAuth login buttons are rendered without any `onClick` handler. Users who click them expect to be authenticated — instead nothing happens, creating a trust issue.

```tsx
// CURRENT (NO HANDLER)
<Button variant="outline" disabled={loading}>
    <Icons.google className="me-2 h-4 w-4" />
    Google
</Button>
```

**Fix (temporary):**  
Either remove the buttons or add an explicit toast:

```tsx
const handleOAuthNotAvailable = () => {
    toast({ 
        title: t('oauthComingSoon') ?? 'Coming Soon',
        description: t('oauthComingSoonDesc') ?? 'Google/Microsoft login is not yet available.',
    });
};

<Button variant="outline" onClick={handleOAuthNotAvailable} disabled={loading}>
```

**Fix (production):** Implement Firebase `signInWithPopup(auth, new GoogleAuthProvider())`.

---

## MEDIUM — SEC-07: "Forgot Password" Link Is a Dead `href="#"`

**Severity:** 🟡 Medium  
**File:** `src/components/auth/login-form.tsx` (line 94)

**Issue:**  
The forgot password link does nothing. Users who click it expect a password reset flow.

```tsx
<Link href="#" className="ms-auto inline-block text-sm underline">
    {t('forgotPassword')}
</Link>
```

**Fix:**  
Implement a `handleForgotPassword` function using Firebase Auth's `sendPasswordResetEmail`, or navigate to a dedicated `/forgot-password` page:

```tsx
// Interim: open a modal or show a toast
const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
        toast({ title: t('enterEmailFirst'), variant: 'destructive' });
        return;
    }
    // sendPasswordResetEmail(auth, email)
    toast({ title: t('passwordResetSent'), description: t('passwordResetSentDesc') });
};

<Link href="#" onClick={handleForgotPassword} className="ms-auto inline-block text-sm underline">
```

---

## MEDIUM — SEC-08: Hardcoded Hebrew Status Strings Used in Business Logic

**Severity:** 🟡 Medium  
**Files:** 42 instances across `src/lib/types.ts`, `src/app/[locale]/dashboard/approvals/page.tsx`, `src/app/[locale]/dashboard/forms/[id]/page.tsx`, and others.

**Issue:**  
`FormStatus` values are Hebrew strings hardcoded in the type definition and used in conditional logic throughout the app. This creates a tight coupling between locale and business logic:

```ts
// src/lib/types.ts
export type FormStatus = 'טיוטה' | 'ממתין לאישור מורה' | 'ממתין לאישור מנהל' | 'מאושר' | 'נדחה' | 'נדרש תיקון' | 'מאושר סופית';
```

If the app is ever used in Arabic or Russian, status comparisons will fail silently.

**Fix:**  
Use locale-neutral enum keys and display translated labels separately:

```ts
// src/lib/types.ts — REPLACE Hebrew strings with English keys
export type FormStatus = 'DRAFT' | 'PENDING_TEACHER' | 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED' | 'FINAL_APPROVED';
```

Then in the status badge component, map to translations:
```tsx
// src/components/ui/status-badge.tsx
const statusLabelMap: Record<FormStatus, string> = {
    DRAFT: t('statusDraft'),
    PENDING_TEACHER: t('statusPendingTeacher'),
    // ...
};
```

Update all comparison logic:
```tsx
// Before:
if (form.status === 'ממתין לאישור מורה')
// After:
if (form.status === 'PENDING_TEACHER')
```

---

## MEDIUM — SEC-09: No Route Protection in Middleware

**Severity:** 🟡 Medium  
**File:** `src/middleware.ts`

**Issue:**  
The middleware only handles i18n locale routing. There is **no server-side authentication check** — any unauthenticated user can access `/dashboard/*` routes at the network level. Protection is entirely client-side.

**Fix:**  
Add authentication checks to middleware:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix,
});

const PROTECTED_PATHS = ['/dashboard'];
const PUBLIC_PATHS = ['/login', '/register', '/pending-approval'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some(p => pathname.includes(p));
  
  if (isProtected) {
    // In production: verify Firebase auth token from cookies
    // const session = request.cookies.get('session');
    // if (!session) return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return intlMiddleware(request);
}
```

---

## LOW — SEC-10: Copyright Year Hardcoded as 2024

**Severity:** 🟢 Low  
**Files:** `src/app/[locale]/events/[id]/page.tsx` (line 40), `src/app/page.tsx` (line 62)

**Issue:**  
Two files have `&copy; 2024` hardcoded. The public footer correctly uses `new Date().getFullYear()`, but these pages do not.

**Fix:**  
```tsx
// Replace: &copy; 2024
// With:
&copy; {new Date().getFullYear()}
```
