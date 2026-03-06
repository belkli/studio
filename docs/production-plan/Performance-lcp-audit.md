# Performance: LCP / INP Audit Report

## 1. Executive Summary

The Harmonia platform has significant performance bottlenecks stemming from its monolithic `useAuth()` context (2,364 lines, 37 state arrays) and static imports of heavy dashboard components. This report identifies the specific bottlenecks and provides actionable recommendations to achieve the target metrics: **LCP < 2.5s** and **INP < 200ms**.

---

## 2. Current Architecture Performance Profile

### Critical Path: Page Load Sequence

```
1. Browser requests /dashboard/admin
2. Next.js SSR renders layout (Server Component - fast)
3. Client hydration begins
4. AuthProvider mounts, triggers bootstrap fetch to /api/bootstrap
5. Bootstrap returns ALL data for ALL domains (users, lessons, invoices, forms, etc.)
6. 37 useState calls fire sequentially, creating multiple render cascades
7. AdminCommandCenter imports (static - in main bundle)
8. AdminCommandCenter reads user, users, formSubmissions, payrolls from context
9. KeyMetricsBar, TodaySnapshotCard, AiAlertsCard all render
10. First meaningful paint
```

**Estimated LCP on 4G mobile: 3-5 seconds** (bootstrap fetch + hydration + re-renders)

### Root Causes

| Issue | Impact | Severity |
|-------|--------|----------|
| Monolithic context with 37 state arrays | Every mutation re-renders all consumers | CRITICAL |
| Bootstrap API returns ALL data at once | Large payload on initial load (~100-500KB JSON) | HIGH |
| Static imports for all dashboard components | Main bundle includes admin, teacher, student, parent code | HIGH |
| No code-splitting by role | Students download admin code, admins download student code | HIGH |
| useMemo dependency array has 36 entries | Context value recreated on any state change | CRITICAL |
| Cross-domain useEffect side effects | Rental eligibility check (line 226) triggers cascading updates | MEDIUM |
| No React.memo on child components | All children re-render when context changes | MEDIUM |

---

## 3. Heaviest Components by Initial Load (per persona)

### Admin Dashboard (`/dashboard/admin`)
| Component | File | Lines | Heavy Deps |
|-----------|------|-------|-----------|
| AdminCommandCenter | `admin-command-center.tsx` | 99 | KeyMetricsBar, TodaySnapshotCard, AiAlertsCard, RecentAnnouncementsCard |
| KeyMetricsBar | `key-metrics-bar.tsx` | ~150 | useLiveStats (reads users, forms, payrolls) |
| TodaySnapshotCard | `today-snapshot-card.tsx` | ~200 | useMyLessons (reads lessons) |
| SidebarNav | `sidebar-nav.tsx` | 555 | useAuth (reads user, forms, lessons) |

**Total admin initial render: ~1000+ lines of component code + sidebar**

### Teacher Dashboard (`/dashboard/teacher`)
| Component | File | Lines |
|-----------|------|-------|
| TeacherDashboard | `teacher-dashboard.tsx` | 322 |
| SidebarNav | `sidebar-nav.tsx` | 555 |

### Parent Dashboard (`/dashboard/family`)
| Component | File | Lines |
|-----------|------|-------|
| FamilyHub | `family-hub.tsx` | 77 |
| SidebarNav | `sidebar-nav.tsx` | 555 |

### Student Dashboard (`/dashboard/profile`)
| Component | File | Lines |
|-----------|------|-------|
| StudentProfilePageContent | `student-profile-content.tsx` | 380 |
| SidebarNav | `sidebar-nav.tsx` | 555 |

---

## 4. Re-Render Trigger Analysis

### Trigger: Bootstrap Data Load
- **Sequence:** 37 `setState` calls in `loadBootstrapData` (lines 436-483)
- **Impact:** Even with React batching, this creates a large render cycle
- **Mitigation:** Use `React.startTransition()` or batch via a single state update

### Trigger: Lesson Status Change
- **Current path:** `updateLessonStatus()` -> `setMockLessons()` -> `useMemo` dependency changes -> new context object -> ALL consumers re-render
- **Affected components:** ALL pages, not just schedule-related pages
- **Frequency:** Multiple times per day per teacher

### Trigger: User Approval
- **Current path:** `approveUser()` -> `setUsers()` -> context value recreated -> ALL consumers re-render
- **Affected components:** Admin + all pages (users array is a dependency)

### Trigger: Instrument Rental Eligibility Check (useEffect, line 226)
- **Current path:** On every mount, checks all rent-to-own rentals for purchase eligibility
- **If triggered:** Updates `mockInstrumentRentals` AND `users` (notifications)
- **Impact:** Two separate state updates, two re-render cascades on initial load

---

## 5. INP (Interaction to Next Paint) Analysis

### At-Risk Interactions

| Interaction | Component | Risk Level | Issue |
|-------------|----------|------------|-------|
| Approve user button | Admin approvals page | HIGH | `approveUser()` triggers `upsertUserAction` (server action) + optimistic `setUsers()` + context re-render |
| Mark lesson complete | Teacher lesson list | HIGH | `updateLessonStatus()` triggers server action + state update + full context re-render |
| Book a lesson | Book Lesson Wizard | CRITICAL | `addLesson()` involves room allocation computation + state update + server action |
| Send announcement | Announcement composer | MEDIUM | `addAnnouncement()` updates 2 state arrays |
| Filter forms (Ministry) | Ministry dashboard | HIGH | `useMemo` re-computation on large `formSubmissions` array with 5 filter dimensions |

### Estimated INP
- Simple button clicks: ~50-100ms (acceptable)
- Context-triggering mutations: ~200-500ms (over threshold)
- Heavy filtering with large datasets: ~300-800ms (over threshold)

---

## 6. Dynamic Import Fixes (IMPLEMENTED)

The following components have been converted from static to dynamic imports with loading skeletons:

| Page | Component | Lines | File Modified |
|------|-----------|-------|--------------|
| `/dashboard/admin` | AdminCommandCenter | 99 (+ sub-components) | `admin/page.tsx` |
| `/dashboard/teacher` | TeacherDashboard | 322 | `teacher/page.tsx` |
| `/dashboard/admin/rentals` | InstrumentRentalDashboard | 564 | `admin/rentals/page.tsx` |
| `/dashboard/alumni` | AlumniPortal | 487 | `alumni/page.tsx` |
| `/dashboard/admin/playing-school` | SchoolPartnershipDashboard | 418 | `admin/playing-school/page.tsx` |
| `/dashboard/schedule` | ScheduleRedesign | 330 | `schedule/page.tsx` |
| `/dashboard/messages` | MessagingInterface | 327 | `messages/page.tsx` |
| `/dashboard/schedule/book` | BookLessonWizard | 309 | `schedule/book/page.tsx` |
| `/dashboard/admin/payroll` | AdminPayrollPanel | ~250 | `admin/payroll/page.tsx` |

**Estimated bundle size reduction for initial load: ~3,000+ lines of JS removed from main chunk.**

### Additional Dynamic Import Candidates (not yet implemented)

| Page | Component | Lines | Priority |
|------|-----------|-------|----------|
| `/dashboard/admin/performances` | PerformanceBookingDashboard | 272 | MEDIUM |
| `/dashboard/admin/form-builder` | FormBuilder | 267 | MEDIUM |
| `/dashboard/events/[id]/edit` | EventEditForm | 264 | LOW |
| `/dashboard/admin/ministry` | MinistryInboxPanel | 258 | MEDIUM |
| `/dashboard/student/practice` | StudentPracticePanel | 255 | LOW |
| `/dashboard/admin/open-day` | OpenDayAdminDashboard | 250 | LOW |
| `/dashboard/billing` | AdminFinancialDashboard / StudentBillingDashboard | 313 | MEDIUM |
| `/dashboard/reports` | AdminReportsDashboard | ~200 | LOW |

---

## 7. Font Loading Strategy

### Current Setup (Good)
```tsx
// src/app/[locale]/layout.tsx, line 14
const rubik = Rubik({
    subsets: ['latin', 'hebrew', 'cyrillic'],
    weight: ['400', '700'],
    display: 'swap',
});
```

**Analysis:**
- **Font:** Rubik from Google Fonts, loaded via `next/font/google`
- **Subsets:** `latin`, `hebrew`, `cyrillic` (covers he, en, ru locales)
- **Missing:** Arabic subset is not included. Arabic users may get system fallback fonts.
- **display: 'swap':** Correct - prevents FOIT (Flash of Invisible Text), allows FOUT
- **Self-hosted:** Yes - `next/font/google` automatically self-hosts the font files at build time. No CDN dependency at runtime.
- **Weights:** Only 400 and 700. If medium weight (500, 600) is used in Tailwind classes, it will fall back.

### Recommendations
1. **Add Arabic subset:** Change to `subsets: ['latin', 'hebrew', 'cyrillic', 'arabic']`
2. **Consider adding weight 500/600:** If `font-medium` or `font-semibold` Tailwind classes are used (they likely are)
3. **Preload optimization:** Next.js already handles `<link rel="preload">` for `next/font` fonts. No action needed.
4. **Font file size estimate:** Rubik with 4 subsets and 4 weights: ~200-300KB total (self-hosted, only loads what's needed per page)

---

## 8. Specific Recommendations

### For sub-200ms INP

1. **Decompose `useAuth()` into domain contexts** (see Context Decomposition Map)
   - Mutation in one domain will not re-render consumers of other domains
   - Expected INP improvement: 60-80% reduction for most interactions

2. **Use `React.startTransition()` for non-urgent mutations**
   ```tsx
   const approveUser = (userId: string) => {
     startTransition(() => {
       setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: true } : u));
     });
   };
   ```

3. **Add `React.memo()` to heavy leaf components**
   - `KeyMetricsBar`, `TodaySnapshotCard`, `RecentAnnouncementsCard`
   - These should only re-render when their specific data changes

4. **Virtualize long lists** (Ministry forms table, user management table)
   - Use `@tanstack/react-virtual` for tables with 100+ rows

### For < 2.5s LCP

1. **Dynamic imports (DONE)** - Removes ~3,000+ lines from initial bundle
2. **Lazy-load below-the-fold components**
   - `RecentAnnouncementsCard` (below initial viewport on admin dashboard)
   - `WhatsNewFeed` (below fold on main dashboard)

3. **Defer bootstrap data loading**
   - Load auth session first (fast - just user object)
   - Load domain-specific data on demand via React Query
   - Admin dashboard only loads users + forms + payrolls (not instruments, alumni, events, etc.)

4. **Add Suspense boundaries around dynamic imports**
   - Already partially done with loading skeletons
   - Add `<Suspense>` wrappers in layout for progressive rendering

5. **Optimize bootstrap API**
   - Current: Single `/api/bootstrap` returns ALL data for ALL domains
   - Proposed: Split into domain-specific endpoints or use React Query to fetch on demand
   - Minimum: Return only user + conservatorium data in bootstrap, fetch rest on demand

### For CLS < 0.1

- Current skeleton structure (fixed heights) already mitigates CLS
- Ensure all `<Skeleton>` components match the final rendered dimensions
- Font `display: 'swap'` may cause minor CLS if font metrics differ significantly from fallback

---

## 9. Priority Implementation Roadmap

| Priority | Action | Expected Impact | Effort |
|----------|--------|----------------|--------|
| P0 | Dynamic imports (DONE) | -30% bundle size for initial load | Completed |
| P0 | Install React Query (DONE) | Foundation for decomposition | Completed |
| P1 | Create QueryProvider + query key factory | Enable incremental migration | 1 day |
| P1 | Decompose `useAuth()` into `useAuthSession()` + `useUsers()` | -60% unnecessary re-renders | 2-3 days |
| P1 | Migrate `useLiveStats` to React Query | Admin dashboard perf improvement | 1 day |
| P2 | Migrate `useMyLessons` to React Query | Schedule page perf improvement | 1 day |
| P2 | Add `React.memo` to heavy leaf components | -20% unnecessary re-renders | 0.5 day |
| P2 | Add Arabic font subset | Fix Arabic font rendering | 5 minutes |
| P3 | Migrate remaining domain hooks | Full decomposition | 3-5 days |
| P3 | Wire Firestore `onSnapshot` listeners | Real-time data | After FirebaseAdapter |
| P3 | Virtualize long tables | Handles 1000+ row lists | 1 day |
