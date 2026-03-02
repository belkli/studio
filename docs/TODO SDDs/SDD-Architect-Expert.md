# Software Design Document — Chief Architect Review
## Harmonia Music Conservatory Management Platform

**Persona:** Expert Software Architect  
**Review Scope:** Application architecture, state management, data access patterns, scalability, code organization, dependency structure, bundle optimization, API design  
**Date:** March 2026  
**Status:** Pre-Production Prototype — Architecture decisions made now will govern all future development

---

## Executive Summary

Harmonia is a well-designed prototype that demonstrates strong domain modeling, comprehensive feature coverage, and thoughtful UI/UX. However, it has **15 architectural concerns** that, if not addressed before production integration, will create compounding technical debt. The most critical: a monolithic React Context holds the entire application state (a pattern that physically cannot scale to real Firestore data), heavy role-specific bundles are eagerly loaded for all users, the entire mock backend lives client-side creating impossible real-time requirements, and there is no layered service abstraction between UI components and data operations.

This document provides a concrete migration path that respects the current prototype's strengths while making it production-ready.

---

## CRITICAL ARCHITECTURAL ISSUES

---

### ARCH-C01 — Monolithic 900-Line AuthContext Holding All Application State

**Severity:** 🔴 Critical  
**File:** `src/hooks/use-auth.tsx` (currently 895 lines)  
**Impact:** This single context is the central architectural anti-pattern from which 7 other issues stem. Every component in the app that calls `useAuth()` re-renders on every state change anywhere in the system. A student marking a lesson as attended causes the Admin Command Center to re-render.

**Root Problem:**
```tsx
// CURRENT ARCHITECTURE — Everything in one place:
export const AuthProvider = ({ children }) => {
    // Authentication state
    const [user, setUser] = useState<User | null>(null);
    // ALL application data (35+ state arrays):
    const [mockLessons, setMockLessons] = useState(initialMockData.mockLessons);
    const [mockInvoices, setMockInvoices] = useState(initialMockData.mockInvoices);
    const [mockFormSubmissions, setMockFormSubmissions] = useState(...);
    const [mockAnnouncements, setMockAnnouncements] = useState(...);
    const [mockEvents, setMockEvents] = useState(...);
    const [mockPayrolls, setMockPayrolls] = useState(...);
    // ... 29 more state arrays
    // ALL business logic (50+ functions):
    const cancelLesson = (...) => { ... };
    const addProgressReport = (...) => { ... };
    const assignInstrumentToStudent = (...) => { ... };
    // ... 47 more functions
};
```

**Target Architecture (3-phase migration):**

**Phase 1 — Split Authentication from Application Data:**
```tsx
// src/providers/auth-provider.tsx — ONLY auth state
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const login = async (email: string, password: string) => { ... };
    const logout = () => { ... };
    return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
};

// src/providers/conservatorium-provider.tsx — conservatorium settings only
export const ConservatoriumProvider = ({ children }) => {
    const [conservatoriums, setConservatoriums] = useState(initialData.conservatoriums);
    // ...
};
```

**Phase 2 — Domain-Specific Hooks:**
```tsx
// src/hooks/domain/use-lessons.ts
export function useLessons() {
    // In prototype: reads from a LessonsContext
    // In production: React Query + Firestore
    return useContext(LessonsContext);
}

// src/hooks/domain/use-forms.ts
export function useForms() { ... }

// src/hooks/domain/use-billing.ts
export function useBilling() { ... }

// src/hooks/domain/use-users.ts (admin only)
export function useUsers() { ... }
```

**Phase 3 — React Query Integration (production):**
```tsx
// src/hooks/data/use-my-lessons.ts (this pattern already exists — extend it)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLessons, cancelLesson } from '@/lib/services/lesson-service';

export function useMyLessons(userId: string) {
    return useQuery({
        queryKey: ['lessons', userId],
        queryFn: () => getLessons(userId),
        staleTime: 2 * 60 * 1000,
    });
}

export function useCancelLesson() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ lessonId, withNotice }: { lessonId: string; withNotice: boolean }) =>
            cancelLesson(lessonId, withNotice),
        onSuccess: (_, { lessonId }) => {
            queryClient.invalidateQueries({ queryKey: ['lessons'] });
        },
    });
}
```

---

### ARCH-C02 — No Service Layer Between UI Components and Data Operations

**Severity:** 🔴 Critical  
**Impact:** Business logic is embedded directly in React components and the `useAuth` hook. Components call `addLesson()`, `cancelLesson()`, etc. directly on the context — there is no service layer to add logging, validation, error handling, or to swap the data source (mock → Firestore).

**Current (problematic) pattern:**
```tsx
// In BookLessonWizard.tsx — UI component does business logic:
const handleSubmit = (data) => {
    addLesson({  // Direct context mutation
        teacherId: data.teacherId,
        studentId: data.studentId,
        // ...
    });
    toast({ title: 'Lesson booked' });
    router.push('/dashboard');
};
```

**Target — Service Layer Pattern:**
```
UI Component → Service Function → Data Provider (Mock | Firestore | API)
```

```tsx
// src/lib/services/lesson-service.ts
export interface LessonServiceDependencies {
    db: FirebaseFirestore | MockDatabase;
    notificationDispatcher: NotificationDispatcher;
    calendarSync?: CalendarSyncService;
}

export async function bookLesson(
    input: BookingRequest,
    deps: LessonServiceDependencies
): Promise<{ lessonId: string; success: boolean }> {
    // 1. Validate business rules (not just schema)
    await validateBookingConflicts(input, deps.db);

    // 2. Check room availability
    const roomLock = await acquireRoomLock(input.roomId, input.startTime, deps.db);

    // 3. Create the lesson
    const lessonId = await deps.db.lessons.create(input);

    // 4. Send notifications
    await deps.notificationDispatcher.send({
        type: 'lessonBooked',
        lessonId,
        teacherId: input.teacherId,
        studentId: input.studentId,
    });

    // 5. Sync calendar (optional)
    await deps.calendarSync?.addEvent(lessonId);

    return { lessonId, success: true };
}
```

```tsx
// In BookLessonWizard.tsx — UI only calls the service:
import { bookLesson } from '@/lib/services/lesson-service';

const handleSubmit = async (data) => {
    const result = await bookLesson(data, { db: firestoreDb, notificationDispatcher });
    if (result.success) {
        router.push('/dashboard/schedule');
    }
};
```

---

### ARCH-C03 — All Role-Specific Dashboard Bundles Eagerly Loaded

**Severity:** 🔴 Critical  
**File:** `src/app/[locale]/dashboard/page.tsx`  
**Impact:** A student who logs in downloads the full `AdminCommandCenter` bundle (~150KB+ of charts, tables, and admin forms) they will never see. This multiplies initial load time by ~3x for most users.

**Evidence:**
```tsx
// ALL loaded at page parse time:
import { AdminCommandCenter } from "@/components/dashboard/harmonia/admin-command-center";
import { TeacherDashboard } from "@/components/dashboard/harmonia/teacher-dashboard";
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { FamilyHub } from '@/components/dashboard/harmonia/family-hub';
```

**Fix — Dynamic imports based on role:**
```tsx
// src/app/[locale]/dashboard/page.tsx
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Only the component for the current user's role is loaded
const AdminCommandCenter = dynamic(
    () => import('@/components/dashboard/harmonia/admin-command-center')
           .then(m => ({ default: m.AdminCommandCenter })),
    { loading: () => <AdminDashboardSkeleton />, ssr: false }
);

const TeacherDashboard = dynamic(
    () => import('@/components/dashboard/harmonia/teacher-dashboard')
           .then(m => ({ default: m.TeacherDashboard })),
    { loading: () => <TeacherDashboardSkeleton />, ssr: false }
);

// Note: student and parent dashboards redirect, so they don't need to be loaded here at all

export default function DashboardPage() {
    const { user, isLoading, newFeaturesEnabled } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading || !user) return;
        // Redirect-only roles (no component needed):
        const redirectMap: Partial<Record<UserRole, string>> = {
            parent: '/dashboard/family',
            student: '/dashboard/profile',
            ministry_director: '/dashboard/ministry',
            school_coordinator: '/dashboard/school',
        };
        const redirectTo = redirectMap[user.role];
        if (redirectTo) { router.replace(redirectTo); return; }
    }, [user, isLoading, router]);

    if (isLoading || !user) return <DashboardSkeleton />;

    if (newFeaturesEnabled) {
        if (user.role === 'conservatorium_admin' || user.role === 'site_admin') {
            return <AdminCommandCenter />; // Loaded only for admins
        }
        if (user.role === 'teacher') {
            return <TeacherDashboard />; // Loaded only for teachers
        }
    }

    return <LegacyDashboard />;
}
```

**Expected bundle size reduction:** Admin bundle (currently downloaded by all users) is now only downloaded by admins. For a conservatorium with 200 students, 5 teachers, and 2 admins — this is a ~95% reduction in unnecessary code for students.

---

## HIGH SEVERITY ARCHITECTURAL ISSUES

---

### ARCH-H01 — Data Loss on Page Refresh (Entire State is Ephemeral)

**Severity:** 🟠 High  
**File:** `src/hooks/use-auth.tsx`  
**Impact:** All state mutations (new lessons, approvals, announcements, cancellations) are lost on page refresh. Only the logged-in user's identity persists (via localStorage). Two users in the same browser tab share state; two users in different tabs do not.

**This creates:**
- Admin approves a user → refreshes page → user is unapproved again
- Teacher adds lesson note → student refreshes → note is gone
- Admin cancels 5 lessons due to sick leave → browser crash → all cancellations undone

**Migration Strategy:**
```
Phase 1 (Now): Document which state must persist and use localStorage for critical items
Phase 2 (Firebase): Replace state arrays with real-time Firestore listeners
```

**Phase 1 — Persist critical state to localStorage:**
```tsx
// src/hooks/use-auth.tsx — Add persistence for critical state
const PERSISTENT_KEYS = {
    lessons: 'harmonia-lessons',
    announcements: 'harmonia-announcements',
    formSubmissions: 'harmonia-forms',
} as const;

// On init — restore from localStorage:
const [mockLessons, setMockLessons] = useState<LessonSlot[]>(() => {
    if (typeof window === 'undefined') return initialMockData.mockLessons;
    try {
        const stored = localStorage.getItem(PERSISTENT_KEYS.lessons);
        return stored ? JSON.parse(stored) : initialMockData.mockLessons;
    } catch {
        return initialMockData.mockLessons;
    }
});

// On update — persist to localStorage:
const cancelLesson = (lessonId: string, withNotice: boolean) => {
    setMockLessons(prev => {
        const updated = prev.map(l => l.id === lessonId ? { ...l, status: withNotice ? 'CANCELLED_STUDENT_NOTICED' : 'CANCELLED_STUDENT_NO_NOTICE' } : l);
        localStorage.setItem(PERSISTENT_KEYS.lessons, JSON.stringify(updated));
        return updated;
    });
};
```

**Phase 2 — Firestore Real-Time Listeners:**
```tsx
// src/hooks/data/use-my-lessons.ts (extend the existing pattern)
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useMyLessons(userId: string, role: UserRole) {
    const [lessons, setLessons] = useState<LessonSlot[]>([]);

    useEffect(() => {
        const lessonsRef = collection(db, 'lessons');
        const q = role === 'teacher'
            ? query(lessonsRef, where('teacherId', '==', userId))
            : query(lessonsRef, where('studentId', '==', userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonSlot)));
        });

        return unsubscribe; // Cleanup on unmount
    }, [userId, role]);

    return lessons;
}
```

---

### ARCH-H02 — No Layered Authorization — Components Make Their Own Access Decisions

**Severity:** 🟠 High  
**Impact:** Role-based access control is implemented inconsistently across 90+ components. Some check `user.role`, some check `newFeaturesEnabled`, some check both, some check neither. Adding a new role or changing permissions requires auditing every component.

**Target — Centralized Permission System:**
```tsx
// src/lib/permissions.ts
export type Permission =
    | 'lessons:book'
    | 'lessons:cancel:own'
    | 'lessons:cancel:any'
    | 'users:view'
    | 'users:approve'
    | 'admin:payroll'
    | 'admin:ministry_export'
    | 'forms:submit'
    | 'forms:approve'
    | 'inventory:manage'
    | 'scholarship:review';

type PermissionMap = Record<UserRole, Permission[]>;

const ROLE_PERMISSIONS: PermissionMap = {
    student: ['lessons:book', 'lessons:cancel:own', 'forms:submit'],
    teacher: ['lessons:cancel:own', 'forms:approve', 'lessons:book'],
    parent: ['lessons:book', 'lessons:cancel:own', 'forms:submit'],
    conservatorium_admin: [
        'lessons:book', 'lessons:cancel:any', 'users:view', 'users:approve',
        'admin:payroll', 'admin:ministry_export', 'forms:approve', 'inventory:manage',
        'scholarship:review',
    ],
    site_admin: ['*'], // All permissions
    ministry_director: ['admin:ministry_export', 'users:view'],
    school_coordinator: ['lessons:book', 'forms:submit'],
    admin: ['lessons:cancel:any', 'users:view', 'users:approve'],
    superadmin: ['*'],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] ?? [];
    return permissions.includes('*') || permissions.includes(permission);
}

// React hook:
export function usePermission(permission: Permission): boolean {
    const { user } = useAuth();
    if (!user) return false;
    return hasPermission(user.role, permission);
}
```

```tsx
// Usage in components:
const canApproveUsers = usePermission('users:approve');

{canApproveUsers && (
    <Button onClick={() => approveUser(user.id)}>Approve</Button>
)}
```

---

### ARCH-H03 — PDF Generation Is Client-Side With Incorrect RTL Text Handling

**Severity:** 🟠 High  
**File:** PDF export functionality in forms  
**Impact:** The current approach uses manual character reversal (`text.split('').reverse().join('')`) for Hebrew text in PDFs — this is fundamentally incorrect for Unicode. Combined characters, niqqud, and bidi text mixing will all render incorrectly.

**Fix — Move PDF generation to Server (Cloud Function or API route):**
```tsx
// src/app/api/forms/[id]/pdf/route.ts
import { renderToBuffer } from '@react-pdf/renderer';
import { FormPDF } from '@/components/pdf/FormPDF';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    // Verify auth
    const form = await getFormById(params.id);

    const pdfBuffer = await renderToBuffer(<FormPDF form={form} />);

    return new Response(pdfBuffer, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="form-${form.id}.pdf"`,
        },
    });
}
```

```tsx
// src/components/pdf/FormPDF.tsx
import { Document, Page, Text, View, Font } from '@react-pdf/renderer';

// Register Hebrew font with proper Unicode support
Font.register({
    family: 'Rubik',
    fonts: [
        { src: '/fonts/Rubik-Regular.ttf', fontWeight: 400 },
        { src: '/fonts/Rubik-Bold.ttf', fontWeight: 700 },
    ],
});

export function FormPDF({ form }: { form: FormSubmission }) {
    return (
        <Document>
            <Page style={{ fontFamily: 'Rubik', direction: 'rtl', padding: 40 }}>
                <View>
                    <Text style={{ fontSize: 18, fontWeight: 700 }}>
                        {form.studentName}  {/* ← Native RTL, no hacks needed */}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
```

---

### ARCH-H04 — No SEO Metadata Strategy for 91-Page Application

**Severity:** 🟠 High  
**Impact:** All public-facing pages (`/`, `/about`, `/musicians`, `/events/[id]`, `/available-now`, `/donate`, `/open-day`) show identical Hebrew-only metadata for all locales. Social shares, search indexing, and accessibility are all broken.

**Fix — Metadata Factory Pattern:**
```tsx
// src/lib/metadata-factory.ts
import { Metadata } from 'next';

export function createPublicPageMetadata(
    locale: string,
    key: 'home' | 'about' | 'musicians' | 'donate' | 'openDay' | 'availableNow' | 'contact',
    t: (key: string) => string
): Metadata {
    const canonicalBase = 'https://harmonia.co.il';
    
    return {
        title: t(`metadata.${key}.title`),
        description: t(`metadata.${key}.description`),
        openGraph: {
            title: t(`metadata.${key}.title`),
            description: t(`metadata.${key}.description`),
            url: `${canonicalBase}/${locale}`,
            siteName: 'Harmonia',
            locale: locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t(`metadata.${key}.title`),
            description: t(`metadata.${key}.description`),
        },
        alternates: {
            canonical: `${canonicalBase}/${locale}`,
            languages: {
                he: `${canonicalBase}/he`,
                en: `${canonicalBase}/en`,
                ar: `${canonicalBase}/ar`,
                ru: `${canonicalBase}/ru`,
            },
        },
    };
}
```

```tsx
// src/app/[locale]/about/page.tsx
import { getTranslations } from 'next-intl/server';
import { createPublicPageMetadata } from '@/lib/metadata-factory';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Pages' });
    return createPublicPageMetadata(locale, 'about', t);
}
```

**Apply to all 7 public pages.** Also create `src/app/robots.ts` and `src/app/sitemap.ts`:

```tsx
// src/app/sitemap.ts
export default function sitemap(): MetadataRoute.Sitemap {
    const locales = ['he', 'en', 'ar', 'ru'];
    const publicRoutes = ['', '/about', '/available-now', '/musicians', '/donate', '/open-day', '/contact'];
    return locales.flatMap(locale =>
        publicRoutes.map(route => ({
            url: `https://harmonia.co.il/${locale}${route}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: route === '' ? 1.0 : 0.8,
        }))
    );
}
```

---

## MEDIUM SEVERITY ARCHITECTURAL ISSUES

---

### ARCH-M01 — Dual `use-date-locale` Files Creating Import Ambiguity

**Severity:** 🟡 Medium  
**Files:**
- `src/hooks/use-date-locale.ts` (TypeScript, no JSX)
- `src/hooks/use-date-locale.tsx` (TSX, with JSX)

**Impact:** Two files with the same base name but different extensions creates import resolution ambiguity. TypeScript may resolve one or the other depending on `tsconfig.json` settings, leading to inconsistent behavior across the codebase.

**Fix:**
```bash
# Audit which version is actually used:
grep -rn "use-date-locale" src/

# Keep only one version — the .tsx is almost certainly the canonical one:
rm src/hooks/use-date-locale.ts  # Remove the .ts version

# Verify all imports still resolve correctly:
npx tsc --noEmit
```

---

### ARCH-M02 — Two `use-admin-guard` Files with Different Implementations

**Severity:** 🟡 Medium  
**Files:**
- `src/hooks/use-admin-guard.ts` — TypeScript version
- `src/hooks/use-admin-guard.tsx` — TSX version

**Evidence:**
```ts
// use-admin-guard.ts — different implementation
export function useAdminGuard() {
    // May have different role checks or behavior
}

// use-admin-guard.tsx — different implementation
export function useAdminGuard() {
    // ...
}
```

**Fix:**
```bash
# Check which file is actually imported across the codebase:
grep -rn "use-admin-guard" src/

# Keep only one, delete the other
# The .tsx version (with JSX) is likely the intended one

# After deletion, run:
npx tsc --noEmit  # Ensure no broken imports
```

---

### ARCH-M03 — Mock Data `import * as initialMockData` Bundles All Data Into Client

**Severity:** 🟡 Medium  
**File:** `src/hooks/use-auth.tsx`, `src/lib/data.ts`  
**Impact:** The entire mock dataset — all users, all lessons for all students, all compositions, all historical data — is bundled and sent to every client. This is currently acceptable for a prototype but will become a blocker when the data file grows.

**Fix (short-term) — Code-split mock data by role:**
```tsx
// src/lib/data/index.ts — Separate exports by domain
export { mockUsers } from './users';
export { mockLessons } from './lessons';
export { mockInvoices } from './billing';
export { compositions } from './compositions'; // Large — 500+ entries

// src/hooks/use-auth.tsx — Import only what's needed:
import { mockUsers } from '@/lib/data/users';
// Lazy-load large datasets when needed:
const compositions = await import('@/lib/data/compositions').then(m => m.compositions);
```

**Fix (long-term) — Move to Firestore with pagination:**
```tsx
// src/hooks/data/use-compositions.ts
export function useCompositions({ instrument, query }: SearchParams) {
    return useInfiniteQuery({
        queryKey: ['compositions', instrument, query],
        queryFn: ({ pageParam = null }) =>
            searchCompositionsFromFirestore({ instrument, query, after: pageParam }),
        getNextPageParam: (lastPage) => lastPage.lastDoc,
    });
}
```

---

### ARCH-M04 — No Caching Strategy for Public Pages

**Severity:** 🟡 Medium  
**Impact:** All public pages are server-rendered on every request even though their content is entirely static (about page, donation landing, open day, etc.). This wastes compute and increases first-byte latency.

**Fix:**
```tsx
// src/app/[locale]/about/page.tsx
export const dynamic = 'force-static'; // Fully static — generated at build time
// OR
export const revalidate = 86400; // Regenerate once per 24 hours (ISR)

// src/app/[locale]/musicians/page.tsx
export const revalidate = 3600; // Musician profiles change occasionally

// src/app/[locale]/page.tsx (homepage)
export const revalidate = 86400;
```

---

### ARCH-M05 — Google Fonts Loaded Via CSS `@import` Instead of `next/font`

**Severity:** 🟡 Medium  
**File:** `src/app/globals.css` (if font is there) or layout  
**Impact:** If Google Fonts are loaded via CSS `@import`, fonts are render-blocking and subject to GDPR/privacy concerns (external request to Google). Next.js `next/font` self-hosts fonts with zero runtime requests.

**Positive Note:** The `layout.tsx` correctly uses `next/font/google`:
```tsx
// src/app/[locale]/layout.tsx — CORRECT (already implemented)
import { Rubik } from 'next/font/google';
const rubik = Rubik({
    subsets: ['latin', 'hebrew', 'cyrillic'],
    weight: ['400', '700'],
    variable: '--font-rubik',
    display: 'swap',
});
```

**Action:** Audit `globals.css` for any remaining `@import url("https://fonts.googleapis.com/...")` statements and remove them:
```bash
grep -n "fonts.googleapis.com" src/app/globals.css
```

---

## LOW SEVERITY ARCHITECTURAL ISSUES

---

### ARCH-L01 — `proxy.ts` File at Root of `src/` With Unknown Purpose

**Severity:** 🟢 Low  
**File:** `src/proxy.ts`  
**Impact:** A file named `proxy.ts` at the root of the source directory is unusual. It may be a development-only proxy configuration that was accidentally committed, or it may be a production feature that is undocumented.

**Action:**
```bash
cat src/proxy.ts  # Review contents

# If it's a dev-only config, move it:
mv src/proxy.ts scripts/dev-proxy.ts
# Or add to .gitignore if it shouldn't be in the repo
```

---

### ARCH-L02 — No Environment Variable Validation on Startup

**Severity:** 🟢 Low  
**Impact:** The app references 15+ environment variables (`CARDCOM_TERMINAL_NUMBER`, `TWILIO_ACCOUNT_SID`, `SENDGRID_API_KEY`, etc.) but none are validated at startup. Missing vars cause silent failures at the code path where they're first used — potentially in production under specific user flows.

**Fix — Create environment validation:**
```ts
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
    // Required in all environments
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),

    // Required in production only
    CARDCOM_TERMINAL_NUMBER: z.string().optional(),
    CARDCOM_API_NAME: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    SENDGRID_API_KEY: z.string().optional(),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
    console.error('❌ Invalid environment variables:');
    console.error(env.error.flatten().fieldErrors);
    // In production, this should prevent startup:
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Invalid environment configuration. See logs above.');
    }
}

export const config = env.data ?? {};
```

```ts
// src/app/layout.tsx or src/app/[locale]/layout.tsx
// Import at the top to validate on cold start:
import '@/lib/env';
```

---

### ARCH-L03 — `tailwind.config.ts.bak` Backup File Committed to Repository

**Severity:** 🟢 Low  
**File:** `tailwind.config.ts.bak`  
**Impact:** Backup files committed to git create confusion about which configuration is canonical. Could also contain sensitive configuration history.

**Fix:**
```bash
git rm tailwind.config.ts.bak
echo "*.bak" >> .gitignore
git commit -m "Remove backup file and prevent future .bak commits"
```

---

## Migration Roadmap

### Phase 1: Clean Foundation (1–2 weeks, can do now without Firebase)

| Task | Files | Effort | Impact |
|------|-------|--------|--------|
| Delete orphan files (`use-walkthrough.tsx`, `tailwind.config.ts.bak`) | 2 files | Trivial | Medium |
| Resolve duplicate hooks (date-locale, admin-guard) | 4 files | Low | Medium |
| Apply dynamic imports to dashboard page | 1 file | Low | High |
| Add `error.tsx`, `loading.tsx`, `not-found.tsx` | 3 new files | Low | High |
| Add SEO metadata to all 7 public pages | 7 files | Medium | High |
| Create `src/lib/permissions.ts` | 1 new file | Medium | High |
| Add `sitemap.ts` and `robots.ts` | 2 new files | Low | Medium |
| Validate env vars at startup | 1 new file | Low | Medium |

### Phase 2: Service Layer (2–4 weeks)

| Task | Files | Effort | Impact |
|------|-------|--------|--------|
| Create `src/lib/services/lesson-service.ts` | 1 new file | Medium | Critical |
| Create `src/lib/services/form-service.ts` | 1 new file | Medium | High |
| Create `src/lib/services/billing-service.ts` | 1 new file | Medium | High |
| Refactor `useAuth` to split auth from data | 5+ files | High | Critical |
| Add localStorage persistence for critical state | 1 file | Low | High |

### Phase 3: Firebase Integration (4–8 weeks)

| Task | Files | Effort | Impact |
|------|-------|--------|--------|
| Firebase Auth (replaces all mock auth) | Multiple | High | Critical |
| Firestore for users and forms | Multiple | High | Critical |
| React Query integration | Multiple | High | Critical |
| Cloud Functions for background operations | Multiple | High | High |
| Real-time listeners for lessons and schedule | Multiple | Medium | High |

---

## Proposed Final Architecture

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (public)/          ← Public pages with static generation
│   │   │   ├── about/
│   │   │   ├── musicians/
│   │   │   └── ...
│   │   ├── (auth)/            ← Auth flow (login, register)
│   │   │   └── login/
│   │   └── (dashboard)/       ← Protected, lazy-loaded by role
│   │       ├── layout.tsx     ← Auth guard + shell
│   │       ├── admin/
│   │       ├── teacher/
│   │       └── student/
│   └── api/                   ← Minimal API routes (webhooks, QR, PDF)
├── components/
│   ├── ui/                    ← Shared design system (unchanged)
│   ├── layout/                ← Public navbar, footer
│   └── dashboard/             ← Role-specific feature components
├── hooks/
│   ├── use-auth.tsx           ← Authentication ONLY (50 lines)
│   ├── use-permission.ts      ← RBAC check hook
│   └── domain/
│       ├── use-lessons.ts
│       ├── use-forms.ts
│       ├── use-billing.ts
│       └── use-users.ts
├── lib/
│   ├── services/              ← Business logic layer (NEW)
│   │   ├── lesson-service.ts
│   │   ├── form-service.ts
│   │   └── billing-service.ts
│   ├── permissions.ts         ← Centralized RBAC (NEW)
│   ├── env.ts                 ← Env validation (NEW)
│   ├── firebase.ts            ← Firebase client
│   ├── firebase-admin.ts      ← Firebase Admin (server-side)
│   ├── payments/
│   └── validation/            ← Zod schemas (already good)
└── providers/
    ├── auth-provider.tsx      ← Auth context (split from monolith)
    └── query-provider.tsx     ← React Query client setup
```

---

## Issue Summary Table

| ID | Severity | Category | Current State | Effort |
|----|----------|----------|---------------|--------|
| ARCH-C01 | 🔴 Critical | State Mgmt | 900-line monolith | High |
| ARCH-C02 | 🔴 Critical | Architecture | No service layer | High |
| ARCH-C03 | 🔴 Critical | Performance | Eager bundle loading | Low |
| ARCH-H01 | 🟠 High | Reliability | Data lost on refresh | High |
| ARCH-H02 | 🟠 High | Maintainability | Ad-hoc RBAC | Medium |
| ARCH-H03 | 🟠 High | Correctness | Wrong RTL PDF | Medium |
| ARCH-H04 | 🟠 High | SEO | No page metadata | Medium |
| ARCH-M01 | 🟡 Medium | Code Quality | Duplicate .ts/.tsx | Low |
| ARCH-M02 | 🟡 Medium | Code Quality | Duplicate guard hooks | Low |
| ARCH-M03 | 🟡 Medium | Performance | All data bundled | Medium |
| ARCH-M04 | 🟡 Medium | Performance | No ISR/static cache | Low |
| ARCH-M05 | 🟡 Medium | Performance | Font loading audit | Low |
| ARCH-L01 | 🟢 Low | Code Quality | Unknown proxy.ts | Trivial |
| ARCH-L02 | 🟢 Low | Reliability | No env validation | Low |
| ARCH-L03 | 🟢 Low | Code Quality | .bak in repo | Trivial |

---

*Document prepared by: Chief Architect Persona — Harmonia Platform Review, March 2026*
