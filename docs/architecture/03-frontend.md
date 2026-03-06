# 03 — Frontend

## 1. Technology Stack

| Concern | Technology | Notes |
|---------|-----------|-------|
| Framework | **Next.js 15** (App Router) | SSR + Server Actions + dynamic imports |
| Language | **TypeScript** | Strict mode |
| UI Components | **shadcn/ui** | Radix UI primitives + Tailwind variants |
| Styling | **Tailwind CSS v4** | RTL via logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`) |
| i18n | **next-intl** | Locale-prefixed routes `/[locale]/...` |
| Fonts | **Rubik** (Google Fonts) | Full Hebrew script support, RTL-native |
| Icons | **Lucide React** | Consistent icon set across all roles |
| Forms | **React Hook Form** + **Zod** | Client-side validation; mirrors server-side Zod schemas |
| Data Fetching | **React Query** (`@tanstack/react-query`) | Cache-first with stale-while-revalidate |
| Real-time | **Firestore `onSnapshot`** | Used only for live dashboard data and booking calendar |
| Charts | **Recharts** | Revenue charts, practice log visualisation |
| PDF Generation | **react-pdf** / server-side | Invoice PDFs, Ministry form exports |
| E-Signatures | > TODO: Requires manual documentation | Canvas-based e-sign component; audit timestamp |
| PWA / Offline | > TODO: Requires manual documentation | Practice log offline queue; background sync |

---

## 2. Application Structure

```
src/
├── app/
│   ├── actions.ts                    # Root-level Server Actions
│   ├── globals.css                   # Global styles + CSS variables
│   ├── robots.ts / sitemap.ts        # SEO
│   ├── [locale]/                     # All user-facing routes (locale-prefixed)
│   │   ├── layout.tsx                # Root layout with NextIntlClientProvider
│   │   ├── error.tsx                 # Global error boundary
│   │   ├── (public)/                 # Unauthenticated routes
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── register/             # Registration wizard
│   │   │   ├── login/                # Login (email, OAuth)
│   │   │   ├── about/                # Conservatorium directory + teacher bios
│   │   │   ├── try/                  # Trial lesson booking
│   │   │   └── book/[teacherId]/     # Public teacher booking page
│   │   └── dashboard/                # Authenticated shell
│   │       ├── layout.tsx            # Auth guard + sidebar shell
│   │       ├── page.tsx              # Role-router (redirects by role)
│   │       ├── schedule/             # Lesson calendar
│   │       ├── forms/                # Form submissions & approvals
│   │       ├── practice/             # Practice logs (LMS)
│   │       ├── family/               # Parent Family Hub
│   │       ├── teacher/              # Teacher-only pages (payroll, students, LMS)
│   │       ├── admin/                # Admin-only pages
│   │       │   ├── page.tsx          # Admin Command Centre
│   │       │   ├── teachers/
│   │       │   ├── billing/
│   │       │   ├── reports/
│   │       │   ├── payroll/
│   │       │   ├── rooms/
│   │       │   ├── events/
│   │       │   ├── scholarships/
│   │       │   └── settings/
│   │       └── ministry/             # Ministry Director read-only views
│   └── api/                          # API route handlers (webhooks etc.)
│       └── cardcom-webhook/          # Cardcom payment callback
├── components/
│   ├── ui/                           # shadcn/ui base components
│   ├── layout/                       # Sidebar, header, language switcher
│   ├── auth/                         # Login form, registration wizard
│   ├── dashboard/                    # Role-specific dashboards
│   │   └── harmonia/
│   │       ├── admin-command-center.tsx
│   │       ├── teacher-dashboard.tsx
│   │       └── family-hub.tsx
│   ├── enrollment/                   # Multi-step enrollment wizard
│   ├── forms/                        # Form builder, approvals UI
│   ├── payments/                     # Invoice display, payment flow
│   ├── registration/                 # Conservatorium discovery
│   ├── harmonia/                     # Domain-specific composed components
│   └── a11y/                         # Accessibility: skip links, ARIA helpers
├── hooks/
│   ├── use-auth.tsx                  # ⚠️ Currently monolithic — migration required
│   ├── use-admin-guard.ts            # Route guard for admin pages
│   ├── use-mobile.tsx                # Responsive breakpoint hook
│   └── data/                         # Domain-specific React Query hooks
│       ├── use-lessons.ts
│       ├── use-billing.ts
│       ├── use-forms.ts
│       └── use-users.ts
├── i18n/
│   ├── routing.ts                    # Locale list + default locale
│   └── request.ts                    # Per-request locale detection
├── messages/
│   ├── he.json                       # Hebrew (source of truth)
│   ├── ar.json                       # Arabic
│   ├── en.json                       # English
│   └── ru.json                       # Russian
└── lib/
    ├── types.ts                      # Shared TypeScript types (User, LessonSlot, etc.)
    ├── taxonomies.ts                 # Instruments, specialties, grade levels
    ├── utils.ts                      # cn(), formatCurrency(), formatDate()
    ├── firebase-client.ts            # Firebase client SDK initialisation
    ├── auth/                         # Auth utilities, OAuth helpers
    ├── services/                     # Service layer (lesson-service, billing-service…)
    ├── db/                           # Database adapter + implementations
    ├── notifications/                # Notification dispatcher
    ├── payments/                     # Cardcom integration helpers
    └── validation/                   # Zod schemas (shared client + server)
```

---

## 3. Routing & Locale Strategy

All authenticated and public routes are nested under the `[locale]` dynamic segment:

```
/he/dashboard          → Hebrew (default, can also be served at /)
/ar/dashboard          → Arabic
/en/dashboard          → English
/ru/dashboard          → Russian
```

**Locale detection priority:**
1. User's saved `User.preferredLanguage` from Firestore
2. Browser `Accept-Language` header
3. Conservatorium's configured default language
4. System fallback: `he`

The **middleware** (`src/middleware.ts`) handles:
- Locale detection and redirect
- Session cookie validation (Firebase session cookie `__session`)
- Role-based route protection (injecting `x-user-role` header for Server Components)
- Redirect of unapproved users to `/pending-approval`

---

## 4. State Management

### Current State (Prototype)

> ⚠️ **Critical architectural debt:** `src/hooks/use-auth.tsx` is a ~900-line monolithic React Context holding the entire application state (35+ state arrays, 50+ mutation functions, all mock data). Every component that calls `useAuth()` re-renders on any state change anywhere in the system.

### Target Architecture (Production)

State is split across three tiers:

**Tier 1 — Auth Context (minimal)**
```tsx
// src/providers/auth-provider.tsx
interface AuthContextType {
  user: User | null;
  conservatoriumId: string | null;
  role: UserRole | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}
```

**Tier 2 — Domain Hooks (React Query)**
Each domain has its own hook, loaded only when the relevant component mounts:

```tsx
// src/hooks/data/use-lessons.ts
export function useMyLessons(userId: string, role: UserRole) {
  return useQuery({
    queryKey: ['lessons', userId],
    queryFn: () => getLessons(userId, role),
    staleTime: 30_000,   // 30 seconds
    gcTime: 5 * 60_000,  // 5 minutes cache
  });
}

// src/hooks/data/use-billing.ts  — invoices and packages
// src/hooks/data/use-forms.ts    — form submissions
// src/hooks/data/use-users.ts    — user management (admin only)
```

**Tier 3 — Real-Time Listeners (Firestore `onSnapshot`)**
Used only for data that must update in < 1 second:

```tsx
// src/hooks/realtime/use-live-schedule.ts
export function useLiveSchedule(conservatoriumId: string, date: Date) {
  // onSnapshot listener on lessonSlots collection — for booking calendar
}

// src/hooks/realtime/use-live-stats.ts
// onSnapshot listener on /conservatoriums/{cid}/stats/live — for admin dashboard
```

---

## 5. i18n & RTL Implementation

### Translation File Structure

```json
// src/messages/he.json (source of truth)
{
  "common": { "save": "שמור", "cancel": "ביטול" },
  "Auth": { "login": "התחברות", "register": "הרשמה" },
  "Dashboard": { "title": "לוח הבקרה" },
  "Schedule": { ... },
  "Billing": { ... }
}
```

Keys follow the convention: `Namespace.screen.element`

### RTL Application Rule

```tsx
// Applied at the layout level:
<html lang={locale} dir={locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr'}>
```

All spacing uses **CSS Logical Properties** to avoid per-locale overrides:
- `ms-` / `me-` instead of `ml-` / `mr-`
- `ps-` / `pe-` instead of `pl-` / `pr-`
- `text-start` / `text-end` instead of `text-left` / `text-right`

### Translation File Generation

> ⚠️ **Critical rule:** Translation files must **never** be written with PowerShell (`Set-Content` / `Out-File`). PowerShell corrupts UTF-8 Hebrew characters. All i18n tooling uses the Node.js scripts in `scripts/i18n/`.

---

## 6. Accessibility (IS 5568 / WCAG 2.1 AA)

Harmonia is legally obligated to comply with **Israeli Standard IS 5568** (based on WCAG 2.1 Level AA). Education providers are always covered, regardless of revenue. Penalty for non-compliance: up to **₪50,000 per complaint** with no proof of harm required.

Key requirements:
- All interactive elements have visible focus rings and ARIA labels
- Colour contrast meets 4.5:1 (normal text) and 3:1 (large text/UI)
- All forms are keyboard-navigable in logical RTL tab order
- Screen reader testing with NVDA (Windows), VoiceOver (iOS/macOS)
- An **accessibility statement** page (`/accessibility`) is legally required
- Dynamic content updates use `aria-live` regions
- All images have meaningful `alt` text; decorative images use `alt=""`

---

## 7. Performance Targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s on 4G mobile |
| FID / INP | < 200ms |
| CLS | < 0.1 |
| Dashboard initial load (student) | < 1.5s |
| Dashboard initial load (admin) | < 2.5s |
| Booking calendar open | < 800ms |
| Firestore reads per page load | ≤ 5 (role-scoped, paginated) |

> Traffic profile: thundering-herd spikes at 15:00–17:00 and 19:00–20:00 on weekdays. Architecture must handle 10× normal load in 2-hour windows using Firebase's serverless auto-scaling.

