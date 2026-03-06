# QA Report — Part 4: Performance, SEO & Architecture Issues

---

## CRITICAL — PERF-01: Entire Application State in a Single 895-Line Client Context

**Severity:** 🔴 Critical  
**File:** `src/hooks/use-auth.tsx`

**Issue:**  
`useAuth` is a monolithic 895-line context that holds **every piece of application state** — users, lessons, forms, invoices, practice logs, events, repertoire, payroll, scholarships, open days, etc. — in a single React Context.

**Problems this causes:**
1. **Bundle size:** All mock data arrays are imported at the top via `import * as initialMockData from '@/lib/data'` — this entire dataset loads on **every page** for **every user**, regardless of their role.
2. **Re-renders:** Any state update (e.g., marking one notification as read) triggers a re-render of every component that calls `useAuth()` — which is most of the app.
3. **Scalability:** When replaced with real Firestore calls, this architecture will cause massive waterfall data fetching.
4. **Performance:** A student only needs their own data, but they download admin data, payroll data, etc.

**Fix:**  
Split the context into domain-specific contexts and lazy-load them:

```tsx
// Phase 1: Split by domain
// src/hooks/use-lessons.tsx — lessons state only
// src/hooks/use-billing.tsx — invoices and payments
// src/hooks/use-forms.tsx — form submissions
// src/hooks/use-users.tsx — user management (admin only)

// Phase 2: Use React Query or SWR for data fetching with caching
// npm install @tanstack/react-query

// Example:
import { useQuery } from '@tanstack/react-query';

export function useLessons(userId: string) {
    return useQuery({
        queryKey: ['lessons', userId],
        queryFn: () => fetchLessonsFromFirestore(userId),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
```

**Interim optimization:**  
Add `useMemo` to prevent unnecessary re-renders:

```tsx
// In use-auth.tsx, wrap context value in useMemo:
const contextValue = useMemo(() => ({
    user, users, login, logout,
    // ... all other values
}), [user, users, /* dependencies */]);

return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
```

---

## HIGH — PERF-02: No Dynamic Imports for Heavy Role-Specific Components

**Severity:** 🟠 High  
**File:** `src/app/[locale]/dashboard/page.tsx`

**Issue:**  
The main dashboard page imports ALL role-specific dashboards at the top:

```tsx
import { AdminCommandCenter } from "@/components/dashboard/harmonia/admin-command-center";
import { TeacherDashboard } from "@/components/dashboard/harmonia/teacher-dashboard";
import StudentProfilePage from "./profile/page"; // Imports the entire student profile
```

A student downloads the `AdminCommandCenter` bundle (likely 100KB+ including admin charts, forms, etc.) even though they'll never see it.

**Fix:**  
Use Next.js dynamic imports with loading states:

```tsx
import dynamic from 'next/dynamic';

const AdminCommandCenter = dynamic(
    () => import('@/components/dashboard/harmonia/admin-command-center').then(m => ({ default: m.AdminCommandCenter })),
    { loading: () => <AdminDashboardSkeleton />, ssr: false }
);

const TeacherDashboard = dynamic(
    () => import('@/components/dashboard/harmonia/teacher-dashboard').then(m => ({ default: m.TeacherDashboard })),
    { loading: () => <TeacherDashboardSkeleton />, ssr: false }
);
```

---

## HIGH — PERF-03: No HTTP Security Headers

**Severity:** 🟠 High  
**File:** `next.config.ts`

**Issue:**  
The Next.js config has no security headers. A production app handling student PII, payments, and role-based data should have:
- Content Security Policy
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

**Fix:**  
```ts
// next.config.ts
const securityHeaders = [
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ];
    },
    // ...rest of config
};
```

---

## HIGH — PERF-04: No SEO Metadata on 88 of 91 Pages

**Severity:** 🟠 High  
**Impact:** Search engines cannot index the public pages; social sharing shows no preview.

**Issue:**  
Only 3 of 91 pages define `generateMetadata()`. All public pages (`/`, `/about`, `/available-now`, `/donate`, `/open-day`, `/musicians`, `/events/[id]`) have no unique `title`, `description`, or Open Graph tags.

The root layout has:
```tsx
export const metadata: Metadata = {
    title: 'הַרמוֹנְיָה',
    description: 'מערכת ניהול קונסרבטוריונים למוזיקה',
};
```

This Hebrew-only metadata is shown for all locales, including English.

**Fix — Root layout with locale-aware metadata:**

```tsx
// src/app/[locale]/layout.tsx
export async function generateMetadata({ params }: { params: Promise<{locale: string}> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    
    return {
        title: {
            template: `%s | ${t('siteName')}`,
            default: t('siteName'),
        },
        description: t('siteDescription'),
        openGraph: {
            siteName: t('siteName'),
            locale: locale,
            type: 'website',
        },
        alternates: {
            languages: {
                'he': '/he',
                'en': '/en',
                'ar': '/ar',
                'ru': '/ru',
            },
        },
    };
}
```

Add `Metadata` namespace to all translation files with locale-appropriate content.

**Per-page example:**
```tsx
// src/app/[locale]/available-now/page.tsx
export async function generateMetadata({ params }: { params: Promise<{locale: string}> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'AvailableNow' });
    return {
        title: t('pageTitle'),
        description: t('pageDescription'),
    };
}
```

---

## HIGH — PERF-05: `layout.tsx` Loads Google Fonts via `<link>` in `<head>` Blocking Render

**Severity:** 🟠 High  
**File:** `src/app/[locale]/layout.tsx`

**Issue:**  
Fonts are loaded via standard HTML `<link>` tags, which block render until the font is fetched:

```tsx
<head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;700&display=swap" rel="stylesheet" />
</head>
```

**Fix:**  
Use Next.js `next/font/google` for automatic font optimization (subset loading, no layout shift, zero external network request at runtime):

```tsx
// src/app/[locale]/layout.tsx
import { Rubik } from 'next/font/google';

const rubik = Rubik({
    subsets: ['latin', 'hebrew', 'cyrillic'],
    weight: ['400', '700'],
    variable: '--font-rubik',
    display: 'swap',
});

// Remove the manual <head> links
// In the JSX:
<body className={`${rubik.variable} font-body antialiased`}>
```

```ts
// tailwind.config.ts — update fontFamily:
fontFamily: {
    body: ['var(--font-rubik)', 'sans-serif'],
    headline: ['var(--font-rubik)', 'sans-serif'],
},
```

---

## MEDIUM — PERF-06: No `robots.txt` or `sitemap.xml`

**Severity:** 🟡 Medium  
**Impact:** Search engines crawl randomly; public pages may not be indexed.

**Fix:**  

```tsx
// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/about', '/available-now', '/musicians', '/donate', '/open-day', '/contact', '/events'],
                disallow: ['/dashboard/', '/admin/', '/api/'],
            },
        ],
        sitemap: 'https://harmonia.co.il/sitemap.xml',
    };
}
```

```tsx
// src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const locales = ['he', 'en', 'ar', 'ru'];
    const publicRoutes = ['', '/about', '/available-now', '/musicians', '/donate', '/open-day', '/contact'];
    
    const entries: MetadataRoute.Sitemap = [];
    for (const locale of locales) {
        for (const route of publicRoutes) {
            entries.push({
                url: `https://harmonia.co.il/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: route === '' ? 1.0 : 0.8,
            });
        }
    }
    return entries;
}
```

---

## MEDIUM — ARCH-01: Entire Mock Backend in Client-Side React Context

**Severity:** 🟡 Medium (Architecture)

**Issue:**  
All business logic — lesson scheduling, invoice generation, approval workflows, PDF generation — lives in `use-auth.tsx` as client-side JavaScript. This means:

1. **No real-time updates** — Two admin users editing the same data don't see each other's changes
2. **Data loss on refresh** — All state changes (approvals, new users, lessons) reset when the page refreshes (only `user` is persisted in localStorage)
3. **No audit trail durability** — `mockAuditLog` resets on refresh
4. **No data isolation** — All users in the mock data share the same in-memory state

**Recommendation:**  
Per the `docs/Remaining-Tasks.md`, this is a known pre-production state. Prioritize:
1. Firebase Auth integration first
2. Then Firestore for user and form data
3. Then Cloud Functions for background operations

---

## MEDIUM — ARCH-02: PDF Generation Using Non-RTL Library

**Severity:** 🟡 Medium  
**File:** `src/app/dashboard/forms/[id]/page.tsx`

**Issue:**  
The PDF export uses `jsPDF` with manual character reversal for RTL text:

```tsx
const rtl = (text: any) => text ? String(text).split('').reverse().join('') : '';
// Used as:
doc.text(rtl(form.studentName), ...);
```

This character-level reversal is incorrect for Hebrew and Arabic — it doesn't handle:
- Bidirectional text mixing (Hebrew labels + English values)
- Combined characters in Arabic
- Proper number alignment in RTL context
- Diacritics (niqqud in Hebrew)

**Fix:**  
Use a proper RTL-aware PDF library:

```bash
npm install @react-pdf/renderer
```

Or use `pdfmake` with its built-in RTL support:

```bash
npm install pdfmake
```

Example with `@react-pdf/renderer`:
```tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
    family: 'Rubik',
    fonts: [
        { src: '/fonts/Rubik-Regular.ttf' },
        { src: '/fonts/Rubik-Bold.ttf', fontWeight: 'bold' },
    ],
});

const FormPDF = ({ form }: { form: FormSubmission }) => (
    <Document>
        <Page style={{ fontFamily: 'Rubik', direction: 'rtl' }}>
            <Text>{form.studentName}</Text>
        </Page>
    </Document>
);
```

---

## LOW — PERF-07: No Image Optimization on Avatar/Placeholder Images

**Severity:** 🟢 Low

**Issue:**  
External placeholder images from `placehold.co`, `i.pravatar.cc`, `picsum.photos` are used throughout the app without `width`/`height` props on the Next.js `<Image>` component, causing layout shifts (CLS score).

**Fix:**  
Always specify dimensions on `<Image>`:

```tsx
// Before:
<Image src={user.avatarUrl} alt={user.name} fill />

// After — specify size to prevent layout shift:
<Image src={user.avatarUrl} alt={user.name} width={40} height={40} className="rounded-full object-cover" />
```

For avatar components, use a consistent size:
```tsx
// In AvatarImage wrapper:
<Avatar className="h-9 w-9">
    <AvatarImage src={user.avatarUrl} alt={user.name} />
    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
</Avatar>
```

---

## LOW — PERF-08: No Caching Strategy for Static Public Pages

**Severity:** 🟢 Low

**Issue:**  
Public pages (`/`, `/about`, `/available-now`, `/musicians`, etc.) are rendered with no cache headers. With mock/static content, they should be statically generated.

**Fix:**  
Add `export const revalidate = 3600;` (or a similar cache duration) to public pages:

```tsx
// src/app/[locale]/about/page.tsx
export const revalidate = 86400; // Re-generate every 24 hours

// Or for fully static pages:
export const dynamic = 'force-static';
```

---

## LOW — SEO-01: Language Switcher Not Accessible to Screen Readers

**Severity:** 🟢 Low  
**File:** `src/components/language-switcher.tsx`

**Issue:**  
The language switcher likely lacks proper `aria-label` to describe its purpose to screen readers. With only 5 `aria-label` attributes found in the entire codebase, accessibility is a systemic concern.

**Fix:**  
```tsx
<DropdownMenuTrigger aria-label={t('switchLanguage') ?? 'Switch language'}>
    <Languages className="h-4 w-4" />
</DropdownMenuTrigger>
```

Add `aria-label` to all interactive icon-only buttons throughout the app.

---

## SUMMARY — Quick Win Priority Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P1 | Integrate Firebase Auth (SEC-01, SEC-02, SEC-09) | High | Critical |
| 🔴 P1 | Add role guards to playing-school admin pages (SEC-03) | Low | Critical |
| 🔴 P1 | Delete duplicate WalkthroughManager (BUG-02) | Trivial | High |
| 🔴 P1 | Delete orphan app/page.tsx (BUG-04) | Trivial | High |
| 🔴 P1 | Delete orphan app/dashboard/ (BUG-06) | Trivial | High |
| 🟠 P2 | Fix Russian translations — 1063 keys (I18N-01) | Medium | High |
| 🟠 P2 | Replace `mr-`/`ml-` with `me-`/`ms-` (I18N-05) | Medium | High |
| 🟠 P2 | Remove `ignoreBuildErrors: true` (SEC-05) | Trivial | High |
| 🟠 P2 | Fix SSO buttons (SEC-06) | Low | Medium |
| 🟠 P2 | Fix mobile navigation (BUG-08) | Low | Medium |
| 🟠 P2 | Add security headers (PERF-03) | Low | High |
| 🟠 P2 | Use next/font for Google Fonts (PERF-05) | Low | Medium |
| 🟡 P3 | Fix all next/link imports (BUG-07) | Medium | High |
| 🟡 P3 | Add SEO metadata to public pages (PERF-04) | Medium | Medium |
| 🟡 P3 | Migrate FormStatus to English keys (SEC-08) | High | Medium |
| 🟢 P4 | Add error.tsx/loading.tsx/not-found.tsx (BUG-13) | Low | Medium |
| 🟢 P4 | Add robots.txt and sitemap.xml (PERF-06) | Low | Medium |
| 🟢 P4 | Fix copyright year 2024 (SEC-10) | Trivial | Low |
