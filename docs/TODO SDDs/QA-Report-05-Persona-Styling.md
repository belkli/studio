# QA Report — Part 5: Persona-Based Access & Styling Issues

---

## Persona Audit Summary

The app supports 7 roles: `student`, `parent`, `teacher`, `conservatorium_admin`, `site_admin`, `ministry_director`, `school_coordinator`.

---

## HIGH — PERSONA-01: `school_coordinator` Has No Dashboard Redirect

**Severity:** 🟠 High  
**File:** `src/app/[locale]/dashboard/page.tsx`

**Issue:**  
When `newFeaturesEnabled` is true, the `school_coordinator` role is never redirected to their correct page (`/dashboard/school`). They land on the legacy dashboard with irrelevant generic widgets.

**Flow:**
1. School coordinator logs in → lands on `/dashboard`
2. No redirect case exists for `school_coordinator` in the `useEffect`
3. Coordinator sees generic `<OverviewCards />` and `<RecentForms />` (meant for admin/student use)

**Fix:**  
```tsx
// src/app/[locale]/dashboard/page.tsx — add to useEffect:
useEffect(() => {
    if (!isLoading && newFeaturesEnabled) {
        if (user?.role === 'parent') router.replace('/dashboard/family');
        else if (user?.role === 'student') router.replace('/dashboard/profile');
        else if (user?.role === 'ministry_director') router.replace('/dashboard/ministry');
        else if (user?.role === 'school_coordinator') router.replace('/dashboard/school'); // ← ADD
    }
}, [isLoading, newFeaturesEnabled, user, router]);
```

---

## HIGH — PERSONA-02: Student Can See Teacher-Only Pages via URL

**Severity:** 🟠 High  
**Files:** `src/app/[locale]/dashboard/teacher/profile/page.tsx`, `src/app/[locale]/dashboard/teacher/exams/page.tsx`, etc.

**Issue:**  
Most `teacher/*` pages redirect non-teachers correctly. However, `teacher/profile/page.tsx` and `teacher/performance-profile/page.tsx` have **no role check at all**:

```tsx
// src/app/[locale]/dashboard/teacher/profile/page.tsx
export default function TeacherProfilePage() {
    return <TeacherProfileEditor />;  // No auth check
}
```

A student navigating to `/dashboard/teacher/profile` sees the teacher's profile editor.

**Fix:**  
Add guards to all `teacher/*` pages lacking them:

```tsx
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/routing';
import { useEffect } from 'react';

export default function TeacherProfilePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'teacher')) {
            router.replace('/dashboard');
        }
    }, [user, isLoading, router]);
    
    if (!user || user.role !== 'teacher') return null;
    return <TeacherProfileEditor />;
}
```

Run this audit to find all unguarded teacher pages:
```bash
for f in src/app/\[locale\]/dashboard/teacher/*/page.tsx; do
  echo "=== $f ==="
  grep -c "role.*teacher\|useAuth" "$f" 2>/dev/null || echo "NO GUARD"
done
```

---

## HIGH — PERSONA-03: Parent Cannot See Playing School Child Enrollment

**Severity:** 🟠 High  
**File:** `src/app/[locale]/dashboard/family/page.tsx`, Playing School section

**Issue:**  
The family hub shows children but has limited visibility into their Playing School (pre-school program) enrollment details. The `ps-attendance/[enrollmentId]/page.tsx` exists but:
1. It uses **hardcoded mock attendance data** (not pulled from `useAuth`)
2. It has no parent role guard
3. The parent has no navigation path to this page from the family hub (no link shown)

**Fix:**  
1. Add a "View Attendance" link on the family hub for PS-enrolled children
2. Connect attendance data to `useAuth` state
3. Add a parent role guard:
```tsx
useEffect(() => {
    if (!isLoading && user?.role !== 'parent') {
        router.replace('/dashboard');
    }
}, [user, isLoading, router]);
```

---

## MEDIUM — PERSONA-04: `ministry_director` Sees "New Form" Button in Legacy Dashboard

**Severity:** 🟡 Medium  
**File:** `src/app/[locale]/dashboard/page.tsx`

**Issue:**  
The legacy dashboard shows a "New Form" button to all users except `ministry_director`:

```tsx
{user.role !== 'ministry_director' && (
    <Button asChild>
        <Link href="/dashboard/forms/new">
```

This is correct — but in new features mode, `ministry_director` can still reach this code path (before the redirect fires). The button momentarily appears.

**Fix:**  
The BUG-03 fix (redirecting `ministry_director` in `useEffect`) solves this. Ensure the redirect fires before any render.

---

## MEDIUM — PERSONA-05: Teacher Missing `student/repertoire` Navigation

**Severity:** 🟡 Medium

**Issue:**  
Teachers can view student profiles at `/dashboard/teacher/student/[id]`, but there's no navigation in the teacher sidebar to the `student/repertoire` page. Students can access their own repertoire at `/dashboard/student/repertoire`, but teachers need to navigate there too.

**Review:** The teacher sidebar has no link to student repertoire — teachers must either know the URL or reach it from a student profile page.

**Fix:**  
Add repertoire to the teacher's student view, or add a quick-access link in the student profile page teachers see.

---

## MEDIUM — STYLE-01: Sidebar RTL — Chevron Arrow Direction

**Severity:** 🟡 Medium  
**File:** `src/components/dashboard/sidebar-nav.tsx`

**Issue:**  
The sidebar group collapse chevron uses `rotate-90` to indicate "expanded":

```tsx
<ChevronRight className={cn(
    'h-3.5 w-3.5 transition-transform duration-200',
    !isCollapsed && 'rotate-90'
)} />
```

In RTL, `ChevronRight` points LEFT (which is the "closed" direction). When expanded, it should rotate to point DOWN in both LTR and RTL. The current rotation logic works visually in LTR but in RTL `ChevronRight` already points toward the content, making the closed/open states confusing.

**Fix:**  
```tsx
import { ChevronDown } from 'lucide-react'; // Use ChevronDown — direction-neutral

<ChevronDown className={cn(
    'h-3.5 w-3.5 transition-transform duration-200',
    isCollapsed && '-rotate-90'
)} />
```

Or use inline styles with RTL awareness:
```tsx
const isRtl = dir === 'rtl';
<ChevronRight className={cn(
    'h-3.5 w-3.5 transition-transform duration-200',
    !isCollapsed && 'rotate-90',
    isRtl && isCollapsed && 'rotate-180'
)} />
```

---

## MEDIUM — STYLE-02: Sidebar Left/Right Split — `side="left"` for RTL

**Severity:** 🟡 Medium  
**File:** `src/app/[locale]/dashboard/layout.tsx`

**Issue:**  
The sidebar is always rendered on the left:

```tsx
<Sidebar side="left" collapsible="icon">
```

In RTL (Hebrew, Arabic), the sidebar should appear on the **right** side. Having it on the left is technically functional but feels unnatural for RTL users.

**Fix:**  
```tsx
// src/app/[locale]/dashboard/layout.tsx
// Make this a client component or pass locale as a prop
'use client';
import { useLocale } from 'next-intl';

export default function DashboardLayout({ children }) {
    const locale = useLocale();
    const sidebarSide = (locale === 'he' || locale === 'ar') ? 'right' : 'left';
    
    return (
        <SidebarProvider>
            <Sidebar side={sidebarSide} collapsible="icon">
                <SidebarNav />
            </Sidebar>
            <SidebarInset>
                {/* ... */}
            </SidebarInset>
        </SidebarProvider>
    );
}
```

---

## MEDIUM — STYLE-03: Inconsistent Button Icon Placement in Approval History

**Severity:** 🟡 Medium  
**File:** `src/app/dashboard/forms/[id]/page.tsx` (approval history section)

**Issue:**  
The approval history renders timeline items with colored circle icons. The circles use hardcoded color classes that mix Tailwind color utilities inconsistently:
- Some use `bg-primary text-primary-foreground` (theme-aware)
- Others use `bg-green-100 text-green-700`, `bg-blue-100 text-blue-700` (hardcoded colors)

This causes inconsistency in dark mode (if implemented) and doesn't respect the design system.

**Fix:**  
Use CSS variables or define semantic status tokens in `globals.css`:

```css
/* globals.css */
:root {
    --status-approved: 142.1 70.6% 45.3%;
    --status-pending: 47.9 95.8% 53.1%;
    --status-rejected: 0 84.2% 60.2%;
    --status-ministry: 262.1 83.3% 57.8%;
}
```

Then use consistent classes:
```tsx
// Replace hardcoded colors with semantic classes:
const statusStyles = {
    submitted: 'bg-primary text-primary-foreground',
    approved: 'bg-[hsl(var(--status-approved)/0.15)] text-[hsl(var(--status-approved))]',
    rejected: 'bg-destructive/15 text-destructive',
    ministry: 'bg-[hsl(var(--status-ministry)/0.15)] text-[hsl(var(--status-ministry))]',
};
```

---

## LOW — STYLE-04: Dashboard Layout Max-Width Clips Wide Tables

**Severity:** 🟢 Low  
**File:** `src/app/[locale]/dashboard/layout.tsx`

**Issue:**  
The dashboard content wrapper has `max-w-7xl`:

```tsx
<div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
```

On very wide screens, the master schedule, user management table, and payroll table need more horizontal space. The 7xl (1280px) cap causes horizontal scrollbars on these pages.

**Fix:**  
For data-heavy pages, allow them to override the max-width:

```tsx
// src/app/[locale]/dashboard/layout.tsx — pass a wider class when needed
// Option 1: Remove max-w entirely (tables handle their own scroll)
<div className="mx-auto w-full p-4 sm:p-6 lg:p-8">

// Option 2: Use overflow-x-auto in table containers
<div className="overflow-x-auto">
    <Table>...
```

---

## LOW — STYLE-05: `space-x-4 space-x-reverse` Used on Hero Buttons

**Severity:** 🟢 Low  
**File:** `src/app/[locale]/page.tsx`

**Issue:**  
The hero CTA buttons use `space-x-4 space-x-reverse`:

```tsx
<div className="space-x-4 space-x-reverse">
    <Button asChild size="lg">...</Button>
    <Button asChild variant="secondary" size="lg">...</Button>
</div>
```

`space-x-reverse` is the old Tailwind RTL approach. It works in RTL but `gap-4` with `flex-row` is more predictable:

**Fix:**  
```tsx
<div className="flex gap-4 flex-wrap justify-center">
    <Button asChild size="lg">...</Button>
    <Button asChild variant="secondary" size="lg">...</Button>
</div>
```

---

## LOW — STYLE-06: `@react-pdf/renderer` `layout="fill"` Deprecated Prop

**Severity:** 🟢 Low  
**File:** `src/components/harmonia/donation-landing-page.tsx`

**Issue:**  
Uses the deprecated `layout="fill"` prop:
```tsx
<Image src={image.imageUrl} alt={image.description} layout="fill" objectFit="cover" />
```

In Next.js 13+, `layout` and `objectFit` props are removed in favor of `fill` and `className="object-cover"`.

**Fix:**  
```tsx
<Image 
    src={image.imageUrl} 
    alt={image.description} 
    fill 
    className="object-cover" 
/>
```

---

## LOW — A11Y-01: Accessibility — Very Few `aria-label` Attributes (5 Total)

**Severity:** 🟢 Low  
**Impact:** Screen reader users cannot navigate the application.

**Issue:**  
The entire codebase has only **5 `aria-label` attributes** across all components. Key missing areas:
- All icon-only buttons (Settings, Bell, Logout)
- All navigation menus
- All dialog close buttons
- Data table action buttons (approve, reject, edit)
- Form inputs without visible labels

**Fix — Apply systematically:**

```tsx
// Icon-only buttons MUST have aria-label:
<Button variant="ghost" size="icon" aria-label={t('editUser')}>
    <Edit className="h-4 w-4" />
</Button>

// Navigation should use semantic HTML:
<nav aria-label={t('mainNavigation')}>
    {/* nav items */}
</nav>

// Tables need proper scope attributes:
<TableHead scope="col">{t('studentName')}</TableHead>

// Dialogs need aria-describedby:
<Dialog aria-describedby="dialog-description">
    <p id="dialog-description">...</p>
</Dialog>
```

Priority items:
1. All `<Button size="icon">` elements — add `aria-label`
2. All `<Input>` elements without visible `<Label>` — add `aria-label`
3. All `<Table>` headers — add `scope="col"`
4. All modals/dialogs — add proper `aria-labelledby` and `aria-describedby`
