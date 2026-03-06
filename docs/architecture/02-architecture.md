# 02 — Architecture

## 1. System Container Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                             HARMONIA PLATFORM                                │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                    NEXT.JS 16 APP  (Firebase App Hosting)              │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────────┐  ┌──────────────────┐   │  │
│  │  │   Public Site   │  │  Authenticated App  │  │   Admin Portal   │   │  │
│  │  │  / (root = he)  │  │  /[locale]/dashboard│  │  /dashboard/admin│   │  │
│  │  │  /register      │  │  /schedule          │  │  /admin/branches │   │  │
│  │  │  /try           │  │  /forms             │  │  /admin/payroll  │   │  │
│  │  │  /about         │  │  /practice          │  │  /admin/rentals  │   │  │
│  │  │  /enroll        │  │  /family            │  │  /admin/open-day │   │  │
│  │  │  /musicians     │  │  /teacher/...       │  │  /admin/...      │   │  │
│  │  │  /playing-school│  │  /school/...        │  │                  │   │  │
│  │  └─────────────────┘  └─────────────────────┘  └──────────────────┘   │  │
│  │                                                                        │  │
│  │  Server Components (SSR / auth-validated)                              │  │
│  │  Client Components (dashboards, booking calendar)                      │  │
│  │  Server Actions in src/app/actions.ts (all data mutations)             │  │
│  │  ⚠️  Auth guard is client-side useAdminGuard() hook — NOT middleware   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│                              ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │         DATABASE ADAPTER LAYER  (src/lib/db/)                          │  │
│  │                                                                        │  │
│  │  DB_BACKEND env var selects adapter at startup (singleton)             │  │
│  │  'mock'      → MemoryDatabaseAdapter (default — no env var needed)     │  │
│  │  'firebase'  → FirebaseAdapter   ⚠️ IS A MemoryDatabaseAdapter STUB   │  │
│  │  'postgres'  → PostgresAdapter   ✅ Full read-write implementation     │  │
│  │  'supabase'  → SupabaseAdapter   ✅ Full implementation                │  │
│  │  'pocketbase'→ PocketBaseAdapter ✅ Full implementation                │  │
│  │                                                                        │  │
│  │  Auto-detection: if DATABASE_URL env set → postgres; else → mock      │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │         CLOUD FUNCTIONS SPECS  (src/lib/cloud-functions/)              │  │
│  │         ⚠️  TYPED SPECS / PSEUDOCODE — NOT DEPLOYED                   │  │
│  │                                                                        │  │
│  │  booking.ts         bookLessonSlot (transaction spec)                  │  │
│  │  makeup-booking.ts  bookMakeupLesson (atomic credit redemption spec)   │  │
│  │  lesson-triggers.ts onLessonCancelled / onLessonCompleted (trigger spec│  │
│  │  calendar-sync.ts   syncTeacherCalendars (every 15min spec)            │  │
│  │  holiday-calendar.ts getIsraeliHolidaysForYear (Hebcal spec)           │  │
│  │  payroll-export.ts  generatePayrollExport (callable spec)              │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│              ┌───────────────┼───────────────────────────────┐              │
│              ▼               ▼                               ▼              │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────────────┐ │
│  │  GENKIT AI   │  │  PAYMENT GATEWAY │  │     EXTERNAL SERVICES          │ │
│  │  Genkit 1.29 │  │  Cardcom  ⚠️stub │  │  Twilio SMS/WhatsApp ⚠️stub   │ │
│  │  ✅ 8 flows  │  │  Pelecard ⚠️stub │  │  SendGrid Email      ⚠️stub   │ │
│  │  match-teacher│  │  HYP      ⚠️stub │  │  Google Calendar     ⚠️spec  │ │
│  │  draft-report │  │  Tranzila ⚠️stub │  │  Hebcal API          ⚠️spec  │ │
│  │  help-asst   │  │  Stripe   ⚠️stub │  │                                │ │
│  │  suggest-comp│  │  Via PAYMENT_    │  │                                │ │
│  │  nurture-lead│  │  GATEWAY_PROVIDER│  │                                │ │
│  │  event-poster│  │  env var         │  │                                │ │
│  │  target-slots│  │                  │  │                                │ │
│  └──────────────┘  └──────────────────┘  └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
LEGEND: ✅ Implemented & active  ⚠️ Stub/spec only  ❌ Not started
```

---

## 2. Core Architectural Patterns

### 2.1 Multi-Tenancy

Every entity is scoped to a `conservatoriumId`. Currently enforced at:
1. **Data model level:** every type includes `conservatoriumId`
2. **Server Actions:** `src/app/actions.ts` uses the `withAuth()` wrapper and Zod schemas

> ⚠️ **Gap vs. plan:** Firestore Security Rules are **not deployed** (no `firestore.rules` that enforces `conservatoriumId` isolation — the repo contains a template `firestore.rules` but it is incomplete). Middleware-level auth guard (`src/middleware.ts`) does **not exist** — auth is enforced client-side via `useAdminGuard()` hook only.

### 2.2 Server Actions as the Mutation Boundary

All data writes flow through **Next.js Server Actions** (`src/app/actions.ts`, 1283 lines) and are validated using Zod schemas via the `withAuth()` HOC wrapper.

> ⚠️ **Gap:** `verifyAuth()` in `src/lib/auth-utils.ts` unconditionally returns `true`. Role is not validated server-side — only via client `useAdminGuard()`.

### 2.3 Repository / Database Abstraction Layer

✅ **Fully implemented.** `src/lib/db/index.ts` resolves the `DB_BACKEND` env var and returns the matching adapter as a singleton. The `DatabaseAdapter` interface in `src/lib/db/types.ts` defines 17 typed repositories.

Key distinction from the SDD plan: the **`firebase` backend is currently a `MemoryDatabaseAdapter` stub** (8 lines, no Firestore SDK calls). Postgres, Supabase, and PocketBase adapters are real implementations.

```typescript
// src/lib/db/adapters/firebase.ts (actual)
export class FirebaseAdapter extends MemoryDatabaseAdapter {
  constructor() { super(buildDefaultSeed()); } // No Firestore — just in-memory seed
}
```

### 2.4 Monolithic Context — Current Reality

> ⚠️ **Critical gap:** `src/hooks/use-auth.tsx` is a **2,364-line monolithic React Context** holding the entire application state (35+ state arrays, 170+ mutation functions). This is the architecture the SDD documents identified as needing replacement, and it has **not been replaced yet**.

Domain-specific hooks (`src/hooks/data/`) do exist and are partially built:

| Hook | File | Status |
|------|------|--------|
| `useMyLessons` | `hooks/data/use-my-lessons.ts` | ✅ Exists — wraps `useAuth()` context |
| `useMyInvoices` | `hooks/data/use-my-invoices.ts` | ✅ Exists — wraps `useAuth()` context |
| `useLiveStats` | `hooks/data/use-live-stats.ts` | ✅ Exists — wraps `useAuth()` context |
| `useMakeupCredits` | `hooks/data/use-makeup-credits.ts` | ✅ Exists |
| `usePracticeLogs` | `hooks/data/use-practice-logs.ts` | ✅ Exists |
| `usePreLessonSummary` | `hooks/data/use-pre-lesson-summary.ts` | ✅ Exists |
| React Query (`@tanstack/react-query`) | — | ❌ **Not installed** |
| Firestore `onSnapshot` listeners | — | ❌ **Not implemented** |

All domain hooks read from the monolithic `useAuth()` context — they do not yet query a database directly.

### 2.5 Real-Time vs. Cache-First Data

> ⚠️ **Gap vs. plan:** The planned React Query + Firestore `onSnapshot` architecture is not yet implemented. All data is served from the in-memory mock context synchronously. There is no stale-while-revalidate, no cache, and no real-time listener.

### 2.6 Dynamic Imports for Role Dashboards

> ⚠️ **Gap vs. plan:** Role-specific dashboard components are **not dynamically imported**. `AdminCommandCenter` is imported statically in `dashboard/admin/page.tsx`. The `dynamic()` pattern from the SDD plan is not in use.

---

## 3. AI Flows — Verified Implementation

✅ All 8 Genkit flows in `src/ai/flows/` are implemented and wired to server actions:

| Flow File | Purpose | Wired In |
|-----------|---------|---------|
| `match-teacher-flow.ts` | Two-pass teacher matching (hard filter + LLM score) | `actions.ts` → `matchTeacherAction` |
| `draft-progress-report-flow.ts` | AI progress report draft from practice logs | `actions.ts` → `draftProgressReportAction` |
| `help-assistant-flow.ts` | RAG-based help chat over `help-articles.ts` | `actions.ts` → `askHelpAssistantAction` |
| `suggest-compositions.ts` | Composition suggestions for form builder | `actions.ts` → `suggestCompositionsAction` |
| `reschedule-flow.ts` | NLP rescheduling request handler | `actions.ts` → `handleRescheduleRequestAction` |
| `generate-event-poster.ts` | AI event poster content generation | `actions.ts` → `generateEventPosterAction` |
| `target-empty-slots-flow.ts` | Smart slot filling advisor | `actions.ts` → `getTargetedSlotsAction` |
| `nurture-lead-flow.ts` | Playing School lead nurturing | `actions.ts` → `nurtureLead` |

---

## 4. Navigation Architecture

✅ **Fully implemented** per SDD-NAV-01. The sidebar (`src/components/dashboard/sidebar-nav.tsx`, 556 lines) uses `SidebarGroup` / `SidebarGroupContent` components with role-scoped collapsible groups:

| Persona | Groups | Implementation |
|---------|--------|---------------|
| `conservatorium_admin` / `site_admin` | Overview · People · Schedule & Lessons · Programs & Events · Finance · Intelligence · Communication | ✅ |
| `delegated_admin` | Same as admin, filtered by `delegatedAdminPermissions` | ✅ |
| `teacher` | My Workspace · My Profile · Finance · Communication | ✅ |
| `student` | My Learning · Practice · Communication · Account | ✅ |
| `parent` | Family Hub · Finance · Communication · Account | ✅ |
| `ministry_director` | Ministry Dashboard only | ✅ |
| `school_coordinator` | School Dashboard | ✅ |

Both `newFeaturesEnabled` (new grouped nav) and legacy flat-list rendering are supported via a feature flag on the conservatorium.

---

## 5. Locale Routing

✅ **Implemented.** `src/i18n/routing.ts` uses `localePrefix: 'as-needed'` — Hebrew (`he`) is the default and served at root `/`; other locales are prefixed (`/en/`, `/ar/`, `/ru/`). Locale detection reads a multi-file split-directory structure per locale (`src/messages/{locale}/*.json`) and deep-merges them.

---

## 6. Key Design Principles (Verified)

| Principle | Status |
|-----------|--------|
| Mobile-First, RTL-Always | ✅ `dir` applied in layout.tsx based on locale |
| Server Actions as mutation boundary | ✅ All writes via `src/app/actions.ts` with Zod |
| Database Abstraction Layer | ✅ `src/lib/db/` with 5 adapter implementations |
| AI as Invisible Staff | ✅ 8 Genkit flows active |
| Composable Modules | ✅ `newFeaturesEnabled` flag gates new nav/UX |
| Server-Side Role Authority (Firebase Custom Claims) | ❌ Not implemented — auth is mock/cookie |
| No trust in client-provided data (Zod) | ✅ Server actions use Zod; ⚠️ `verifyAuth()` always true |
