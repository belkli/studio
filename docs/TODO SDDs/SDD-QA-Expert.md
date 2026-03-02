# Software Design Document — QA Expert Review
## Harmonia Music Conservatory Management Platform

**Persona:** Expert QA Engineer  
**Review Scope:** All pages, components, hooks, actions, validation logic, and user flows  
**Date:** March 2026  
**Status:** Pre-Production — High-Fidelity Prototype on Mock Data

---

## Executive Summary

The Harmonia platform is a feature-complete prototype with excellent UI coverage, strong i18n scaffolding, and well-structured Zod validation schemas. However, **18 significant issues** were found spanning critical functional defects, broken user flows, missing error recovery, and UX consistency problems. The most critical issues are: TypeScript errors silently suppressed in production builds, duplicated components causing double-firing of UI logic, and several role-routing failures that cause users to land on wrong or inaccessible pages.

---

## CRITICAL ISSUES

---

### QA-C01 — TypeScript Build Errors Silently Suppressed

**Severity:** 🔴 Critical  
**Files:** `next.config.ts`, `src/hooks/use-walkthrough.tsx`  
**Impact:** Type-unsafe code ships to production. Runtime crashes or silent logic errors possible.

**Root Cause:**  
`next.config.ts` contains `typescript: {}` which previously had `ignoreBuildErrors: true`. The `typecheck_output.txt` file in the repo documents unresolved TS2741 errors in the legacy `use-walkthrough.tsx` file (missing `school_coordinator` key in `stepsConfig`). The old file was never deleted after the new `walkthrough-manager.tsx` was created.

**Evidence:**
```ts
// next.config.ts
typescript: {
  // ignoreBuildErrors: true  ← was here, masks real errors
},
```

```
// typecheck_output.txt — TS2741 error:
// src/hooks/use-walkthrough.tsx(72,3): error TS2741:
// Property 'school_coordinator' is missing in type ...
```

**Fix — Step 1: Delete the orphaned file**
```bash
rm src/hooks/use-walkthrough.tsx
```

**Fix — Step 2: Verify no remaining imports**
```bash
grep -rn "from.*use-walkthrough" src/
```

**Fix — Step 3: Enforce strict TypeScript in next.config.ts**
```ts
// next.config.ts
const nextConfig: NextConfig = {
  typescript: {
    // Do NOT add ignoreBuildErrors here — fix errors at source
  },
  // ...
};
```

**Fix — Step 4: Ensure walkthrough-manager.tsx covers all roles**
```tsx
// src/components/dashboard/walkthrough-manager.tsx
// Verify stepsConfig includes all UserRole values:
const stepsConfig: Record<UserRole, DriveStep[]> = {
  student: [...],
  teacher: [...],
  parent: [...],
  conservatorium_admin: [...],
  site_admin: [...],
  ministry_director: [...],
  school_coordinator: [...],  // ← must be present
  admin: [...],
  superadmin: [...],
};
```

---

### QA-C02 — WalkthroughManager Renders Twice on Every Dashboard Page

**Severity:** 🔴 Critical  
**Files:** `src/app/[locale]/layout.tsx` (line ~50), `src/app/[locale]/dashboard/layout.tsx` (line 24)  
**Impact:** Onboarding walkthrough fires twice simultaneously for new users. Double toasts, double DOM overlays, double state transitions.

**Evidence:**
```tsx
// src/app/[locale]/layout.tsx — has WalkthroughManager
<WalkthroughManager />  // ← instance #1

// src/app/[locale]/dashboard/layout.tsx — ALSO has it
<WalkthroughManager />  // ← instance #2 (duplicate)
```

**Fix:** Remove `WalkthroughManager` from the root locale layout entirely. The walkthrough only applies to authenticated dashboard users, so it belongs exclusively in the dashboard layout.

```tsx
// src/app/[locale]/layout.tsx — REMOVE these lines:
// import { WalkthroughManager } from '@/components/dashboard/walkthrough-manager';
// ...
// <WalkthroughManager />
```

Keep only in:
```tsx
// src/app/[locale]/dashboard/layout.tsx — KEEP:
<WalkthroughManager />
```

---

### QA-C03 — Ministry Director and School Coordinator Land on Wrong Dashboard

**Severity:** 🔴 Critical  
**File:** `src/app/[locale]/dashboard/page.tsx`  
**Impact:** `ministry_director` users see an irrelevant legacy dashboard with student-focused `OverviewCards` and `RecentForms`. `school_coordinator` has the same problem.

**Evidence:**
```tsx
// Current — ministry_director falls through to legacy render
if (newFeaturesEnabled) {
    if (user.role === 'conservatorium_admin' || user.role === 'site_admin') {
        return <AdminCommandCenter />;
    }
    if (user.role === 'teacher') {
        return <TeacherDashboard />;
    }
    // ministry_director falls here — shows legacy OverviewCards, WRONG
}
```

**Fix:**
```tsx
// src/app/[locale]/dashboard/page.tsx
'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/routing';

export default function DashboardPage() {
    const { user, isLoading, newFeaturesEnabled } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading || !user) return;
        if (user.role === 'parent') { router.replace('/dashboard/family'); return; }
        if (user.role === 'student') { router.replace('/dashboard/profile'); return; }
        if (user.role === 'ministry_director') { router.replace('/dashboard/ministry'); return; }
        if (user.role === 'school_coordinator') { router.replace('/dashboard/school'); return; }
    }, [user, isLoading, router]);

    if (isLoading || !user) return <DashboardSkeleton />;

    if (newFeaturesEnabled) {
        if (user.role === 'conservatorium_admin' || user.role === 'site_admin') {
            return <AdminCommandCenter />;
        }
        if (user.role === 'teacher') {
            return <TeacherDashboard />;
        }
    }

    // Legacy fallback (only for roles not yet migrated)
    return (
        <div className="space-y-6">
            <OverviewCards />
            <div className="grid gap-6 md:grid-cols-2">
                <RecentForms />
            </div>
        </div>
    );
}
```

---

### QA-C04 — Orphan `app/page.tsx` and `app/dashboard/` Conflict with Locale Routes

**Severity:** 🔴 Critical  
**Files:** `src/app/page.tsx`, `src/app/dashboard/` directory  
**Impact:** Non-locale routes (`/`, `/dashboard`) may intercept requests meant for `/{locale}/` routes. Middleware conflicts, unexpected 200 responses, and possibly bypassing auth guards.

**Fix:**
```bash
# Verify these exist and delete them:
ls src/app/page.tsx         # should be deleted — locale route handles /
ls src/app/dashboard/       # entire directory — delete if it exists

rm src/app/page.tsx
rm -rf src/app/dashboard/   # only if confirmed it duplicates locale routes
```

After deletion, verify the locale route handles `/` correctly:
```tsx
// src/app/[locale]/page.tsx — this should be the only root handler
export default function HomePage() {
    // ...
}
```

---

## HIGH SEVERITY ISSUES

---

### QA-H01 — Login Password Field Has No Validation

**Severity:** 🟠 High  
**File:** `src/components/auth/login-form.tsx`  
**Impact:** The `handleLogin` function submits with only an email check. Password is accepted as any string (or empty). No minimum length, no empty-field guard for the password field.

**Evidence:**
```tsx
const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {  // Only email is checked — password ignored
        toast({ variant: "destructive", title: t('toasts.missingEmail') });
        return;
    }
    // password is never validated
    const { user, status } = login(email); // password not even passed
```

**Fix:**
```tsx
// src/components/auth/login-form.tsx
const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        toast({ variant: "destructive", title: t('toasts.missingEmail'), description: t('toasts.missingEmailDesc') });
        return;
    }
    if (!password || password.length < 6) {
        toast({ variant: "destructive", title: t('toasts.missingPassword') ?? 'Password required', description: t('toasts.missingPasswordDesc') ?? 'Please enter your password.' });
        return;
    }
    setLoading(true);
    setTimeout(() => {
        const { user, status } = login(email); // Production: login(email, password)
        // ...
    }, 500);
};
```

Also remove the pre-filled password default:
```tsx
// BEFORE:
const [password, setPassword] = useState('password') // ← REMOVE
// AFTER:
const [password, setPassword] = useState('')
```

Add a dev-only demo mode banner:
```tsx
{process.env.NODE_ENV !== 'production' && (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-2 text-xs mb-4 text-center">
        ⚠️ Demo Mode: Enter any listed email to log in. Password is not checked.
    </div>
)}
```

---

### QA-H02 — Magic Link Flow Has No Loading State or Error Recovery

**Severity:** 🟠 High  
**File:** `src/components/auth/login-form.tsx`  
**Impact:** `handleMagicLink` sets `loading=true` but on failure the user is stuck in a loading spinner with no way to recover (loading never resets to `false`).

**Evidence:**
```tsx
const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // ... setTimeout with toast but loading state never reset on failure path
```

**Fix:**
```tsx
const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        toast({ variant: 'destructive', title: t('toasts.missingEmail') });
        return;
    }
    setLoading(true);
    setTimeout(() => {
        try {
            // Simulate magic link send
            toast({ title: t('toasts.magicLinkSent') ?? 'Magic link sent', description: t('toasts.magicLinkSentDesc') ?? 'Check your email.' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not send magic link. Try again.' });
        } finally {
            setLoading(false); // ← Always reset loading
        }
    }, 800);
};
```

---

### QA-H03 — `handleApprove` Calls `useToast` Inside a Regular Function (React Rules Violation)

**Severity:** 🟠 High  
**File:** `src/app/[locale]/dashboard/users/page.tsx`  
**Impact:** React will throw a runtime error ("Invalid hook call") in strict mode or future React versions. This is the most sensitive admin page in the application.

**Evidence:**
```tsx
const handleApprove = (user: User) => {
    const { toast } = useToast(); // ← ILLEGAL: Hook called inside a regular function
    approveUser(user.id);
    toast({ title: 'User Approved' });
};
```

**Fix:**
```tsx
// Move useToast to the component level, outside any function:
export default function UsersPage() {
    const { toast } = useToast(); // ← At component top level
    const { approveUser, rejectUser } = useAuth();
    const t = useTranslations('UserManagement');

    const handleApprove = (user: User) => {
        approveUser(user.id);
        toast({ title: t('userApproved'), description: t('userApprovedDesc', { name: user.name }) });
    };

    const handleReject = (user: User, reason: string) => {
        rejectUser(user.id, reason);
        toast({ variant: 'destructive', title: t('userRejected'), description: reason });
    };
    // ...
}
```

---

### QA-H04 — No Error Boundaries, error.tsx, loading.tsx, or not-found.tsx

**Severity:** 🟠 High  
**Impact:** A single unhandled runtime error (e.g., a null reference in a deeply nested component) causes a blank white screen with no recovery path. Users cannot retry or navigate back.

**Fix — Create `src/app/[locale]/error.tsx`:**
```tsx
'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => { console.error('[Harmonia Error]', error); }, [error]);
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-semibold">משהו השתבש</h2>
            <p className="text-muted-foreground max-w-md">
                אירעה שגיאה בלתי צפויה. ניתן לנסות שוב או לחזור לדף הבית.
            </p>
            <div className="flex gap-2">
                <Button onClick={reset}>נסה שוב</Button>
                <Button variant="outline" asChild>
                    <a href="/dashboard">חזרה לדשבורד</a>
                </Button>
            </div>
            {process.env.NODE_ENV !== 'production' && (
                <pre className="text-xs text-left bg-muted p-4 rounded max-w-lg overflow-auto">
                    {error.message}
                </pre>
            )}
        </div>
    );
}
```

**Fix — Create `src/app/[locale]/loading.tsx`:**
```tsx
import { Skeleton } from '@/components/ui/skeleton';
export default function Loading() {
    return (
        <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-96" />
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );
}
```

**Fix — Create `src/app/[locale]/not-found.tsx`:**
```tsx
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
            <Music className="h-16 w-16 text-muted-foreground" />
            <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
            <p className="text-xl text-muted-foreground">הדף המבוקש לא נמצא</p>
            <Button asChild>
                <Link href="/">חזרה לדף הבית</Link>
            </Button>
        </div>
    );
}
```

---

### QA-H05 — Public Navbar Has No Mobile Menu

**Severity:** 🟠 High  
**File:** `src/components/layout/public-navbar.tsx`  
**Impact:** Navigation links are invisible and inaccessible on mobile screens (below `md` breakpoint). The hamburger menu icon is likely present but non-functional.

**Fix:**
```tsx
// src/components/layout/public-navbar.tsx
'use client';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useLocale } from 'next-intl';

export function PublicNavbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const locale = useLocale();
    const dir = (locale === 'he' || locale === 'ar') ? 'rtl' : 'ltr';

    const navItems = [
        { href: '/about', label: t('about') },
        { href: '/available-now', label: t('availableNow') },
        { href: '/musicians', label: t('musicians') },
        { href: '/contact', label: t('contact') },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
            <div className="container flex h-16 items-center justify-between">
                {/* Logo */}
                <Link href="/" className="font-bold text-xl">הַרמוֹנְיָה</Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navItems.map(item => (
                        <Link key={item.href} href={item.href} className="text-sm font-medium hover:text-primary transition-colors">
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Nav */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild className="md:hidden">
                        <Button variant="ghost" size="icon" aria-label="Open menu">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side={dir === 'rtl' ? 'right' : 'left'}>
                        <nav className="flex flex-col gap-4 mt-8">
                            {navItems.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-lg font-medium hover:text-primary"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
```

---

## MEDIUM SEVERITY ISSUES

---

### QA-M01 — `@ts-nocheck` on the Most Sensitive Admin Page

**Severity:** 🟡 Medium  
**Files:** `src/app/[locale]/dashboard/users/page.tsx`, `src/app/actions.ts`  
**Impact:** TypeScript is completely disabled on the user management and server actions files — the two most critical files in the application for security and data integrity.

**Fix:** Remove `// @ts-nocheck` from both files and resolve the underlying errors:
```tsx
// src/app/[locale]/dashboard/users/page.tsx — DELETE line 1:
// @ts-nocheck  ← REMOVE THIS

// src/app/actions.ts — DELETE line 1:
// @ts-nocheck  ← REMOVE THIS
```

Common underlying fixes needed:
```tsx
// Explicit type annotations on event handlers:
const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { ... };

// Explicit generic on useState:
const [selectedUser, setSelectedUser] = useState<User | null>(null);

// Type-safe filter callbacks:
const filteredUsers = users.filter((u: User) => u.role !== 'site_admin');
```

---

### QA-M02 — Cancellation Policy Not Enforced in Client-Side Lesson Cancel Flow

**Severity:** 🟡 Medium  
**File:** `src/components/dashboard/harmonia/cancel-lesson-dialog.tsx`  
**Impact:** The UI shows a `withNotice` vs `withoutNotice` toggle, but the actual notice window calculation happens only superficially. Students can cancel without-notice even when well within the notice window, bypassing the makeup credit policy.

**Evidence:**
```tsx
// cancel-lesson-dialog.tsx — no time-based guard
const handleCancel = (withNotice: boolean) => {
    cancelLesson(lesson.id, withNotice); // withNotice is user-selected, not policy-enforced
};
```

**Fix:**
```tsx
// src/components/dashboard/harmonia/cancel-lesson-dialog.tsx
import { differenceInHours } from 'date-fns';

export function CancelLessonDialog({ lesson, conservatoriumPolicy }: Props) {
    const hoursUntilLesson = differenceInHours(new Date(lesson.startTime), new Date());
    const requiredNoticeHours = conservatoriumPolicy?.studentNoticeHoursRequired ?? 24;
    const isWithinNoticeWindow = hoursUntilLesson < requiredNoticeHours;

    // Force the correct value based on policy — don't let user choose
    const effectiveWithNotice = !isWithinNoticeWindow;

    const handleCancel = () => {
        cancelLesson(lesson.id, effectiveWithNotice);
    };

    return (
        <AlertDialog>
            <AlertDialogContent>
                {isWithinNoticeWindow && (
                    <Alert variant="destructive">
                        <AlertTitle>ביטול מאוחר</AlertTitle>
                        <AlertDescription>
                            הביטול מתבצע פחות מ-{requiredNoticeHours} שעות לפני השיעור.
                            לא תצבור קרדיט איפור.
                        </AlertDescription>
                    </Alert>
                )}
                <AlertDialogFooter>
                    <AlertDialogAction onClick={handleCancel}>
                        {isWithinNoticeWindow ? 'בטל ללא קרדיט' : 'בטל (תקבל קרדיט איפור)'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
```

---

### QA-M03 — Dead Links on Event Page Footer

**Severity:** 🟡 Medium  
**File:** `src/app/[locale]/events/[id]/page.tsx`  
**Impact:** Footer privacy policy and contact links use `href="#"` — they navigate nowhere and the `#` causes a jarring scroll-to-top on mobile.

**Fix:**
```tsx
// src/app/[locale]/events/[id]/page.tsx
// BEFORE:
<Link href="#">{tNav('privacyPolicy')}</Link>
<Link href="#">{tNav('contact')}</Link>

// AFTER:
<Link href="/about">{tNav('about')}</Link>
<Link href="/contact">{tNav('contact')}</Link>
```

---

### QA-M04 — Hardcoded `dir="rtl"` in Signature Dialog

**Severity:** 🟡 Medium  
**File:** `src/app/[locale]/dashboard/forms/[id]/page.tsx`  
**Impact:** Signature-related alert dialogs have `dir="rtl"` hardcoded, breaking layout for English and Russian locale users.

**Fix:**
```tsx
// src/app/[locale]/dashboard/forms/[id]/page.tsx
import { useLocale } from 'next-intl';

export default function FormDetailPage() {
    const locale = useLocale();
    const dir = (locale === 'he' || locale === 'ar') ? 'rtl' : 'ltr';

    return (
        // ...
        <AlertDialogContent dir={dir} className="sm:max-w-2xl">
            {/* ... */}
        </AlertDialogContent>
    );
}
```

---

### QA-M05 — Makeup Credit Balance Calculation Does Not Account for Expired Credits

**Severity:** 🟡 Medium  
**File:** `src/hooks/use-auth.tsx` — `getMakeupCreditBalance` function  
**Impact:** Credits older than 60 days (per `getMakeupCreditsDetail`) should expire. But `getMakeupCreditBalance` returns a count of all granted lessons without checking expiry, so students may see a non-zero balance for expired credits they cannot use.

**Evidence:**
```tsx
// getMakeupCreditsDetail correctly computes expiry:
expiresAt: addDays(new Date(l.createdAt), 60).toISOString(),
status: 'AVAILABLE'  // ← But always 'AVAILABLE', never 'EXPIRED'

// getMakeupCreditBalance ignores expiry entirely:
const granted = mockLessons.filter(l =>
    studentIds.includes(l.studentId) &&
    (l.status === 'CANCELLED_TEACHER' || l.status === 'CANCELLED_CONSERVATORIUM' || l.status === 'CANCELLED_STUDENT_NOTICED')
).length;
// No expiry check here ↑
```

**Fix:**
```tsx
const getMakeupCreditBalance = (studentIds: string[]) => {
    if (!studentIds.length) return 0;
    const now = new Date();
    const EXPIRY_DAYS = 60;

    const granted = mockLessons.filter(l =>
        studentIds.includes(l.studentId) &&
        (l.status === 'CANCELLED_TEACHER' || l.status === 'CANCELLED_CONSERVATORIUM' || l.status === 'CANCELLED_STUDENT_NOTICED') &&
        differenceInCalendarDays(now, new Date(l.createdAt)) <= EXPIRY_DAYS // ← Add expiry check
    ).length;

    const used = mockLessons.filter(l =>
        studentIds.includes(l.studentId) && l.type === 'MAKEUP'
    ).length;

    return Math.max(0, granted - used);
};
```

---

### QA-M06 — Hardcoded Hebrew Status Strings in Business Logic

**Severity:** 🟡 Medium  
**File:** `src/lib/types.ts`, multiple comparison sites  
**Impact:** `FormStatus` is defined as Hebrew string literals (`'ממתין לאישור מורה'`). These are used in 42+ conditional comparisons. Any locale change or typo silently breaks approval workflows.

**Fix — Update `src/lib/types.ts`:**
```ts
// BEFORE:
export type FormStatus = 'טיוטה' | 'ממתין לאישור מורה' | 'ממתין לאישור מנהל' | 'מאושר' | 'נדחה' | 'נדרש תיקון' | 'מאושר סופית';

// AFTER:
export type FormStatus =
    | 'DRAFT'
    | 'PENDING_TEACHER'
    | 'PENDING_ADMIN'
    | 'APPROVED'
    | 'REJECTED'
    | 'REVISION_REQUIRED'
    | 'FINAL_APPROVED';
```

**Fix — Create a translation map (used in display only):**
```tsx
// src/lib/utils/form-status.ts
export const FORM_STATUS_KEYS: Record<FormStatus, string> = {
    DRAFT: 'formStatus.draft',
    PENDING_TEACHER: 'formStatus.pendingTeacher',
    PENDING_ADMIN: 'formStatus.pendingAdmin',
    APPROVED: 'formStatus.approved',
    REJECTED: 'formStatus.rejected',
    REVISION_REQUIRED: 'formStatus.revisionRequired',
    FINAL_APPROVED: 'formStatus.finalApproved',
};
```

**Fix — Update all comparison sites (42 instances):**
```tsx
// BEFORE:
if (form.status === 'ממתין לאישור מורה') { ... }

// AFTER:
if (form.status === 'PENDING_TEACHER') { ... }
```

**Fix — Update `src/lib/data.ts` mock data:**
```ts
// All mock form submissions must use the new keys
{ id: 'form-1', status: 'PENDING_TEACHER', ... }
```

---

## LOW SEVERITY ISSUES

---

### QA-L01 — Copyright Year Hardcoded as 2024

**Severity:** 🟢 Low  
**Files:** `src/app/[locale]/events/[id]/page.tsx`, `src/app/page.tsx`

**Fix:**
```tsx
// BEFORE: &copy; 2024
// AFTER:
&copy; {new Date().getFullYear()}
```

---

### QA-L02 — `next/link` Imported Directly Instead of i18n-Aware Version

**Severity:** 🟢 Low  
**Impact:** Direct `next/link` imports bypass locale-aware routing. Links to `/dashboard` from a Hebrew session will navigate to `/dashboard` instead of `/he/dashboard`.

**Fix:** Replace all `from 'next/link'` with `from '@/i18n/routing'` throughout the codebase:
```bash
# Audit:
grep -rn "from 'next/link'" src/
grep -rn 'from "next/link"' src/

# Each instance needs replacing with:
import { Link } from '@/i18n/routing';
```

---

### QA-L03 — Practice Streak Calculation Has Off-By-One on Today/Yesterday

**Severity:** 🟢 Low  
**File:** `src/hooks/use-auth.tsx` — `checkAndAwardPracticeStreak`

**Evidence:**
```tsx
if (logDates[0] === today.getTime() || logDates[0] === yesterday.getTime()) {
    streak = 1;
    // ...
}
```

The comparison `logDates[0] === today.getTime()` uses `===` on timestamps, which is fragile — `startOfDay` normalizes to midnight but timezone-edge cases can cause a mismatch.

**Fix:**
```tsx
const checkAndAwardPracticeStreak = (studentId: string, allLogs: PracticeLog[]) => {
    const studentLogs = allLogs.filter(log => log.studentId === studentId);
    const logDates = [...new Set(
        studentLogs.map(log => startOfDay(new Date(log.date)).toISOString()) // Use ISO string comparison
    )].sort().reverse();

    if (logDates.length < 7) return;

    const today = startOfDay(new Date()).toISOString();
    const yesterday = startOfDay(addDays(new Date(), -1)).toISOString();

    if (logDates[0] !== today && logDates[0] !== yesterday) return;

    let streak = 1;
    for (let i = 0; i < logDates.length - 1; i++) {
        const diff = differenceInCalendarDays(new Date(logDates[i]), new Date(logDates[i + 1]));
        if (diff === 1) { streak++; } else { break; }
    }

    if (streak >= 7) {
        awardAchievement(studentId, 'PRACTICE_STREAK_7');
    }
};
```

---

### QA-L04 — No Confirmation on Instrument Deletion

**Severity:** 🟢 Low  
**File:** `src/components/dashboard/harmonia/instrument-rental-dashboard.tsx`  
**Impact:** `deleteInstrument` is called directly with no confirmation dialog. Deleting an instrument that is currently checked out would remove the rental record.

**Fix:**
```tsx
const handleDeleteInstrument = (instrument: InstrumentInventory) => {
    if (instrument.currentRenterId) {
        toast({
            variant: 'destructive',
            title: 'לא ניתן למחוק',
            description: 'הכלי מושאל כרגע. יש להחזיר אותו לפני המחיקה.',
        });
        return;
    }
    // Show confirmation dialog before deleting
    setInstrumentToDelete(instrument);
    setDeleteDialogOpen(true);
};
```

---

## Issue Summary Table

| ID | Severity | Category | File(s) | Effort |
|----|----------|----------|---------|--------|
| QA-C01 | 🔴 Critical | Build | `next.config.ts`, `use-walkthrough.tsx` | Low |
| QA-C02 | 🔴 Critical | Rendering | Both layouts | Trivial |
| QA-C03 | 🔴 Critical | Routing | `dashboard/page.tsx` | Low |
| QA-C04 | 🔴 Critical | Routing | `app/page.tsx`, `app/dashboard/` | Trivial |
| QA-H01 | 🟠 High | Auth | `login-form.tsx` | Low |
| QA-H02 | 🟠 High | UX | `login-form.tsx` | Low |
| QA-H03 | 🟠 High | React | `users/page.tsx` | Low |
| QA-H04 | 🟠 High | Reliability | All pages | Medium |
| QA-H05 | 🟠 High | UX/Mobile | `public-navbar.tsx` | Low |
| QA-M01 | 🟡 Medium | Type Safety | `users/page.tsx`, `actions.ts` | Medium |
| QA-M02 | 🟡 Medium | Business Logic | `cancel-lesson-dialog.tsx` | Medium |
| QA-M03 | 🟡 Medium | UX | `events/[id]/page.tsx` | Trivial |
| QA-M04 | 🟡 Medium | i18n | `forms/[id]/page.tsx` | Low |
| QA-M05 | 🟡 Medium | Business Logic | `use-auth.tsx` | Low |
| QA-M06 | 🟡 Medium | i18n/Logic | `types.ts` + 42 sites | High |
| QA-L01 | 🟢 Low | Content | Events/Home pages | Trivial |
| QA-L02 | 🟢 Low | Routing | Multiple | Medium |
| QA-L03 | 🟢 Low | Logic | `use-auth.tsx` | Low |
| QA-L04 | 🟢 Low | UX | Instrument dashboard | Low |

---

*Document prepared by: Expert QA Engineer Persona — Harmonia Platform Review, March 2026*
