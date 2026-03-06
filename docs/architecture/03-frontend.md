# 03 — Frontend

## 1. Technology Stack

> **Verified from `package.json`** — versions are exact.

| Concern | Technology | Version | Status |
|---------|-----------|---------|--------|
| Framework | **Next.js** (App Router) | ^16.1.6 | ✅ Active |
| Runtime | **React** | ^19.2.4 | ✅ Active |
| Language | **TypeScript** | ^5.9.3 | ✅ Strict mode |
| UI Components | **shadcn/ui** (Radix UI) | various | ✅ Full set |
| Styling | **Tailwind CSS** | ^4.2.0 | ✅ RTL logical props |
| i18n | **next-intl** | ^4.8.3 | ✅ `localePrefix: 'as-needed'` |
| Fonts | **Rubik** (Google Fonts) | — | ✅ Hebrew RTL |
| Icons | **Lucide React** | ^0.575.0 | ✅ |
| Forms | **React Hook Form** + **Zod** | ^7.71.1 / ^4.3.6 | ✅ |
| Data Fetching | **React Query** | — | ❌ **Not installed** — all data from `useAuth()` context |
| Real-time | **Firestore `onSnapshot`** | — | ❌ **Not implemented** |
| Charts | **Recharts** | ^3.7.0 | ✅ |
| PDF Generation | **jsPDF** + **jspdf-autotable** | ^4.2.0 / ^5.0.7 | ✅ Client-side |
| E-Signatures | **react-signature-canvas** | ^1.0.6 | ✅ Present in form workflows |
| Onboarding Walkthrough | **driver.js** | ^1.4.0 | ✅ `WalkthroughManager` component |
| Carousels | **embla-carousel-react** | ^8.6.0 | ✅ |
| Animations | **framer-motion** | ^12.34.3 | ✅ |
| Date utilities | **date-fns** | ^4.1.0 | ✅ |
| AI Framework | **Genkit** + `@genkit-ai/google-genai` | ^1.29.0 | ✅ 8 flows |
| Firebase SDK | **firebase** | ^12.9.0 | ✅ Auth init only (no Firestore) |
| PWA / Offline | — | — | ❌ Not implemented |

---

## 2. Application Structure

> **Verified from codebase** — only directories/files confirmed to exist are listed.

```
src/
├── app/
│   ├── actions.ts                    # ALL Server Actions (1283 lines, single file)
│   ├── globals.css
│   ├── robots.ts / sitemap.ts
│   ├── actions/                      # Additional server action modules
│   │   ├── auth.ts                  # Auth actions (login, logout, session)
│   │   ├── consent.ts               # PDPPA consent management
│   │   ├── signatures.ts            # Digital signature capture
│   │   ├── storage.ts               # File upload actions
│   │   └── user-preferences.ts      # User preference management
│   ├── api/                          # API route handlers
│   │   ├── auth/                    # /api/auth/login, /api/auth/logout
│   │   ├── bootstrap/               # /api/bootstrap — serves mock data
│   │   └── cardcom-webhook/         # /api/cardcom-webhook — payment callbacks
│   └── [locale]/                     # Locale-prefixed routes (he = root /)
│       ├── layout.tsx                # NextIntlClientProvider + dir attribute
│       ├── error.tsx
│       ├── page.tsx                  # Public landing page
│       ├── about/                    # Conservatorium directory + teacher bios
│       ├── accessibility/            # IS 5568 accessibility statement ✅
│       ├── apply/ · apply-for-aid/   # Registration + scholarship application
│       ├── available-now/            # Ad-hoc slot browser
│       ├── contact/ · privacy/       # Legal pages
│       ├── donate/                   # Public donation page
│       ├── enroll/                   # Enrollment wizard (public entry)
│       ├── events/                   # Public event listings
│       ├── help/                     # Help centre
│       ├── login/                    # Auth (email + OAuth)
│       ├── musicians/                # Musicians for Hire public microsite
│       ├── open-day/                 # Open day appointment booking
│       ├── pending-approval/         # Holding page for unapproved users
│       ├── playing-school/           # Playing School programme pages
│       ├── register/                 # Registration wizard
│       ├── rental-sign/              # Remote instrument rental signing
│       ├── try/                      # Trial lesson booking
│       └── dashboard/                # Authenticated shell
│           ├── layout.tsx            # Sidebar + WalkthroughManager (no server auth check)
│           ├── page.tsx              # Role-router → redirects by role + newFeaturesEnabled
│           ├── admin/                # conservatorium_admin / site_admin / delegated_admin
│           │   ├── page.tsx          # AdminCommandCenter (static import, not dynamic)
│           │   ├── branches/
│           │   ├── form-builder/
│           │   ├── makeups/
│           │   ├── ministry/
│           │   ├── notifications/
│           │   ├── open-day/
│           │   ├── payroll/
│           │   ├── performances/
│           │   ├── playing-school/
│           │   ├── rentals/
│           │   ├── scholarships/
│           │   ├── substitute/
│           │   └── waitlists/
│           ├── ai/ · ai-reschedule/  # AI agent UIs
│           ├── alumni/
│           ├── announcements/
│           ├── approvals/
│           ├── billing/
│           ├── enroll/
│           ├── events/
│           ├── family/               # Parent Family Hub
│           ├── forms/
│           ├── library/              # Composition library
│           ├── makeups/
│           ├── master-schedule/
│           ├── messages/
│           ├── ministry/ · ministry-export/
│           ├── notifications/
│           ├── parent/
│           ├── practice/             # Practice logs (LMS)
│           ├── profile/ · progress/
│           ├── reports/
│           ├── schedule/
│           ├── school/               # school_coordinator pages
│           ├── settings/
│           ├── student/
│           ├── teacher/              # teacher pages
│           │   ├── availability/
│           │   ├── exams/
│           │   ├── lessons/
│           │   ├── payroll/
│           │   ├── performance-profile/
│           │   ├── profile/
│           │   ├── reports/
│           │   └── student/
│           ├── users/
│           └── whats-new/
├── components/
│   ├── ui/                           # shadcn/ui (Radix) primitives
│   ├── a11y/                         # Accessibility components
│   ├── auth/                         # Login form, OAuth buttons
│   ├── dashboard/
│   │   ├── harmonia/                 # admin-command-center, teacher-dashboard etc.
│   │   ├── overview-cards.tsx
│   │   ├── sidebar-nav.tsx           # 556-line grouped nav (SDD-NAV-01)
│   │   └── walkthrough-manager.tsx   # driver.js walkthrough
│   ├── enrollment/
│   ├── forms/
│   ├── harmonia/                     # Domain-specific composed components
│   ├── layout/
│   ├── payments/
│   ├── registration/
│   ├── icons.tsx
│   └── language-switcher.tsx
├── hooks/
│   ├── use-auth.tsx                  # ⚠️ Monolithic 2364-line context — NOT yet split
│   ├── use-admin-guard.ts            # Client-side role check (redirects, not server auth)
│   ├── use-admin-alerts.ts
│   ├── use-calendar.tsx
│   ├── use-date-locale.ts
│   ├── use-mobile.tsx
│   ├── use-playing-school-enrollments.ts
│   ├── use-toast.ts
│   ├── use-whats-new.ts
│   └── data/                         # Domain hooks (all wrap useAuth() — no React Query)
│       ├── use-my-lessons.ts         # Role-scoped lesson filter
│       ├── use-my-invoices.ts        # Payer-scoped invoice filter
│       ├── use-live-stats.ts         # Admin dashboard aggregations
│       ├── use-makeup-credits.ts
│       ├── use-practice-logs.ts
│       └── use-pre-lesson-summary.ts
├── i18n/
│   ├── routing.ts                    # locales: [he,en,ar,ru], localePrefix: 'as-needed'
│   └── request.ts                    # Deep-merges split message files per locale
├── messages/
│   └── he/ · ar/ · en/ · ru/                   # Split files (statically imported & merged at runtime)
├── lib/
│   ├── types.ts                      # 1964-line master types file
│   ├── data.ts / data.json           # Mock seed data
│   ├── taxonomies.ts
│   ├── utils.ts
│   ├── firebase-client.ts            # Firebase Auth init only (no Firestore)
│   ├── firebase-admin.ts             # Firebase Admin SDK init (getAdminAuth) for server-side auth
│   ├── query-keys.ts                 # React Query key constants (future use)
│   ├── help-articles.ts              # RAG source for help-assistant-flow
│   ├── instrument-matching.ts
│   ├── legal-contacts.ts
│   ├── playing-school-utils.ts
│   ├── room-allocation.ts            # Smart room assignment algorithm
│   ├── auth/                         # OAuth helpers (google + microsoft)
│   ├── auth-utils.ts                 # verifyAuth() layered auth, requireRole() RBAC, withAuth() wrapper
│   ├── cloud-functions/              # ⚠️ Typed specs — NOT deployed Firebase CFs
│   ├── db/                           # Database adapter layer (5 implementations)
│   ├── notifications/                # Notification dispatcher (Twilio stub)
│   ├── payments/                     # Cardcom + 4 gateway stubs
│   ├── utils/                        # Utility sub-modules
│   └── validation/                   # Zod schemas: booking, forms, practice-log, user, conservatorium, event-production, lesson-slot, user-upsert, form-submission-upsert
└── ai/
    ├── genkit.ts                     # Genkit configuration
    ├── dev.ts                        # Dev server entry
    └── flows/                        # 8 Genkit flows (all active)

# Top-level directories outside src/:
e2e/                                   # Playwright end-to-end tests
├── landing.spec.ts
├── public-pages.spec.ts
├── register.spec.ts
├── playing-school.spec.ts
├── dashboard.spec.ts
└── api.spec.ts

functions/                             # Firebase Cloud Functions (separate deployment)
└── src/
    ├── index.ts                      # Entry point — exports all functions
    ├── types.ts                      # Shared types
    ├── auth/                         # onUserApproved, onUserCreated, onUserDeleted
    ├── users/                        # onUserParentSync
    └── booking/                      # bookLessonSlot, bookMakeupLesson
```

---

## 3. Routing & Locale Strategy

All authenticated and public routes are nested under the `[locale]` dynamic segment, with Hebrew served at the root:

```
/dashboard               → Hebrew (default — localePrefix: 'as-needed')
/en/dashboard            → English
/ar/dashboard            → Arabic
/ru/dashboard            → Russian
```

**Locale detection (actual implementation in `src/i18n/request.ts`):**
1. next-intl built-in locale negotiation (cookie / `Accept-Language`)
2. Fallback to `he` (default locale)
3. Messages loaded by deep-merging all `.json` files under `src/messages/{locale}/`

> ✅ **Auth architecture via Edge Proxy:** `src/proxy.ts` (Next.js 16 Edge Proxy, replaces the deleted `middleware.ts`) validates the `__session` Firebase cookie on dashboard routes and injects `x-user-id`, `x-user-role`, `x-user-conservatorium-id`, `x-user-approved`, and `x-user-email` headers for Server Components. In dev mode (no `FIREBASE_SERVICE_ACCOUNT_KEY`), synthetic `site_admin` claims are injected automatically.
>
> API routes (`/api/*`) pass through the proxy directly without intl middleware or auth checks. Public routes only get intl locale routing.

---

## 4. State Management

### Current Reality (⚠️ Monolithic Context)

`src/hooks/use-auth.tsx` is a **2,364-line monolithic React Context** holding:
- 35+ `useState` arrays (users, lessons, invoices, practice logs, events, rentals, etc.)
- 170+ mutation functions
- All mock data populated from `src/lib/data.ts`
- `useMemo` wrapping the context value (prevents re-renders on unchanged references ✅)
- Login: In mock mode, email-only lookup in mock users array — **no password check, no Firebase Auth call**. In production, Firebase Auth `signInWithEmailAndPassword` is used, and session cookies are created via `/api/auth/login`.

All domain hooks in `src/hooks/data/` wrap `useAuth()` — they apply filtering/memoisation but **do not fetch from any database**.

### Target Architecture (Planned — Not Yet Implemented)

State should be split into three tiers once Firebase is wired:

**Tier 1 — Minimal Auth Context**
```tsx
interface AuthContextType {
  user: User | null;
  conservatoriumId: string | null;
  role: UserRole | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}
```

**Tier 2 — Domain Hooks (requires installing `@tanstack/react-query`)**
```tsx
// e.g., src/hooks/data/use-my-lessons.ts (future)
export function useMyLessons(userId: string) {
  return useQuery({
    queryKey: ['lessons', userId],
    queryFn: () => getLessons(userId),
    staleTime: 30_000,
  });
}
```

**Tier 3 — Real-Time Firestore Listeners** (for booking calendar and admin live dashboard only)

---

## 5. i18n & RTL Implementation

### Translation File Structure (Verified)

Messages are loaded from split files via **static imports** in `src/i18n/request.ts` (Edge-compatible — no `node:fs`). Each locale has 10 namespaced JSON files that are deep-merged at runtime. English is the fallback: `deepMerge(fallbackMessages, messages)`.

> **Legacy flat `{locale}.json` files have been deleted.** Only the split directory files are authoritative.

```
src/messages/
├── he/ · ar/ · en/ · ru/           # Split files (statically imported & merged at runtime)
│   ├── admin.json                   (Namespace: admin keys)
│   ├── alumni.json                  (Namespace: alumni)
│   ├── billing.json                 (Namespace: billing)
│   ├── common.json                  (Namespace: common)
│   ├── enrollment.json              (Namespace: enrollment)
│   ├── forms.json                   (Namespace: forms)
│   ├── OpenDay.json                 (Namespace: OpenDay)
│   ├── public.json                  (Namespace: public — landing page, about, etc.)
│   ├── settings.json                (Namespace: settings)
│   └── student.json                 (Namespace: student)
```

### RTL Application Rule (Verified)

```tsx
// src/app/[locale]/dashboard/layout.tsx (actual)
const sidebarSide = locale === 'he' || locale === 'ar' ? 'right' : 'left';
// ...
<SidebarInset dir={locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr'}>
```

All spacing uses CSS Logical Properties: `ms-` / `me-`, `ps-` / `pe-`, `text-start` / `text-end`.

### Premium Teacher Badges

Teachers with `isPremiumTeacher: true` display a visual badge on:
- Slot tiles on the `/available-now` page (`slot-promotion-card.tsx`)
- Teacher cards on the public landing page and `/about` directory
- The book-lesson wizard (`book-lesson-wizard.tsx`) — Deals tab

Premium packages (`PACK_5_PREMIUM`, `PACK_10_PREMIUM`, `PACK_DUET`) appear in the package selection step of the booking wizard when a premium teacher is selected.

### Available-Now Slot Marketplace

The `/available-now` page (`src/app/[locale]/available-now/page.tsx`) is a public browsing page listing open teacher slots. The `slot-promotion-card.tsx` component renders each slot tile with teacher name, instrument, time, and a "Book Now" CTA. Clicking "Book Now" saves the slot to `sessionStorage` as `pending_slot` and routes the user through the registration or login flow back to the authenticated booking wizard.

### Book Lesson Wizard — Deals Tab

`src/components/dashboard/harmonia/book-lesson-wizard.tsx` includes a "Deals" tab that reads `pending_slot` from `sessionStorage` and auto-opens the booking dialog pre-filled with the selected teacher, slot time, and conservatorium. This connects the public browsing funnel to the authenticated booking experience.

### i18n Tooling Scripts

```json
"i18n:audit":      "node scripts/i18n/audit.mjs"         // find missing keys
"i18n:add-key":    "node scripts/i18n/add-key.mjs"        // add key to all locales
"i18n:normalize":  "node scripts/i18n/normalize-locales.mjs"
"i18n:sync":       "node scripts/i18n/sync-from-en.mjs"   // propagate EN → other locales
```

> ⚠️ **Critical rule:** Translation files must **never** be written with PowerShell (`Set-Content` / `Out-File`). PowerShell corrupts UTF-8 Hebrew/Arabic characters. All i18n tooling uses Node.js scripts only.

---

## 6. Accessibility (IS 5568 / WCAG 2.1 AA)

✅ An `/accessibility` page exists (`src/app/[locale]/accessibility/`) — the legally required accessibility statement is present. A footer link to it is present in `dashboard/layout.tsx`.

Harmonia is legally obligated to comply with **Israeli Standard IS 5568** (WCAG 2.1 Level AA). Education providers are always covered, regardless of revenue. Penalty for non-compliance: up to **₪50,000 per complaint** with no proof of harm required.

Key requirements:
- All interactive elements have visible focus rings and ARIA labels
- Colour contrast meets 4.5:1 (normal text) and 3:1 (large text/UI)
- All forms are keyboard-navigable in logical RTL tab order
- Screen reader testing with NVDA (Windows), VoiceOver (iOS/macOS)
- Dynamic content updates use `aria-live` regions

---

## 7. Performance Targets

> ⚠️ **Current performance reality:** The monolithic `useAuth()` context loads all mock data for all roles on every page load. A student downloads admin payroll data. All performance targets below are aspirational and require the context migration to be completed first.

| Metric | Target | Current Status |
|--------|--------|----------------|
| LCP (Largest Contentful Paint) | < 2.5s on 4G mobile | Unmeasured — depends on mock data size |
| FID / INP | < 200ms | At risk due to monolithic context re-renders |
| CLS | < 0.1 | Likely OK |
| Dashboard initial load (student) | < 1.5s | At risk — loads all domains' data |
| Dashboard initial load (admin) | < 2.5s | At risk — 35+ state arrays |
| Role-specific bundle isolation | Required | ❌ No dynamic imports in use |
| React Query caching | Required | ❌ Not installed |

---

## 8. End-to-End Testing (Playwright)

✅ **Playwright e2e tests** exist in the `e2e/` directory at the project root. Configuration is in `playwright.config.ts`.

| Test File | Coverage |
|-----------|----------|
| `e2e/landing.spec.ts` | Public landing page rendering and navigation |
| `e2e/public-pages.spec.ts` | Public routes: about, accessibility, contact, privacy |
| `e2e/register.spec.ts` | Registration wizard flow |
| `e2e/playing-school.spec.ts` | Playing School enrollment wizard |
| `e2e/dashboard.spec.ts` | Authenticated dashboard smoke tests |
| `e2e/api.spec.ts` | API route health checks |

