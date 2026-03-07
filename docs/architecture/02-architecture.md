# 02 -- Architecture

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
│  │  │  /register      │  │  /schedule          │  │  /admin/payroll  │   │  │
│  │  │  /about         │  │  /practice          │  │  /admin/rentals  │   │  │
│  │  │  /available-now │  │  /family            │  │  /admin/open-day │   │  │
│  │  │  /musicians     │  │  /teacher/...       │  │  /admin/...      │   │  │
│  │  └─────────────────┘  └─────────────────────┘  └──────────────────┘   │  │
│  │                                                                        │  │
│  │  Edge Proxy (src/proxy.ts) — session validation + auth headers         │  │
│  │  Server Actions (src/app/actions.ts) — all mutations via withAuth+Zod  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │         DATABASE ADAPTER LAYER  (src/lib/db/)                          │  │
│  │                                                                        │  │
│  │  'mock'      -> MemoryDatabaseAdapter (default -- in-memory seed)      │  │
│  │  'firebase'  -> FirebaseAdapter  ✅ Full Firestore (fallback: memory)  │  │
│  │  'postgres'  -> PostgresAdapter  ✅ Full read-write (1749 lines)       │  │
│  │  'supabase'  -> SupabaseAdapter  ✅ Full implementation                │  │
│  │  'pocketbase'-> PocketBaseAdapter ✅ Full implementation               │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │         CLOUD FUNCTIONS  (functions/src/)   ✅ 6 DEPLOYED              │  │
│  │                                                                        │  │
│  │  auth/on-user-approved.ts     Custom Claims on approval          ✅   │  │
│  │  auth/on-user-created.ts      New user lifecycle                 ✅   │  │
│  │  auth/on-user-deleted.ts      User deletion cleanup              ✅   │  │
│  │  users/on-user-parent-sync.ts Parent-child link sync             ✅   │  │
│  │  booking/book-lesson-slot.ts  Atomic booking transaction         ✅   │  │
│  │  booking/book-makeup-lesson.ts Makeup credit redemption          ✅   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│              ┌───────────────┼───────────────────────────────┐              │
│              ▼               ▼                               ▼              │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │  GENKIT AI   │  │  PAYMENT GATEWAY │  │     EXTERNAL SERVICES        │  │
│  │  8 flows ✅  │  │  Cardcom  🚧    │  │  Twilio SMS/WhatsApp 🚧     │  │
│  │  Gemini API  │  │  +4 alternatives │  │  SendGrid Email      🚧     │  │
│  └──────────────┘  └──────────────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Patterns

### 2.1 Multi-Tenancy

Every entity is scoped to a `conservatoriumId`. Enforced at:
1. **Data model level:** every type includes `conservatoriumId`
2. **Server Actions:** `withAuth()` + Zod schemas
3. **RBAC:** `requireRole()` checks `conservatoriumId` match; global admins bypass
4. **Firestore Security Rules:** tenant isolation via Custom Claims

### 2.2 Edge Proxy (`src/proxy.ts`)

The Next.js 16 Edge Proxy replaces the traditional `middleware.ts`:
- **API routes (`/api/*`):** pass through directly -- no auth, no intl
- **Public routes:** apply next-intl middleware for locale routing only
- **Dashboard routes:** validate `__session` Firebase cookie (JWT decode), inject `x-user-*` headers, chain with intl middleware
- **Dev bypass:** when `NODE_ENV !== 'production'` and `FIREBASE_SERVICE_ACCOUNT_KEY` absent, inject synthetic `site_admin` claims

### 2.3 Server Actions as Mutation Boundary

All data writes flow through Server Actions in `src/app/actions.ts` plus domain modules in `src/app/actions/`. Every action is wrapped with `withAuth()` which calls `verifyAuth()` + Zod validation.

### 2.4 Database Abstraction Layer

`src/lib/db/index.ts` resolves `DB_BACKEND` env var and returns a singleton adapter. The `DatabaseAdapter` interface defines **26 typed repositories**.

```typescript
// src/lib/db/index.ts -- auto-detection logic
function resolveBackend(): string {
  const explicit = process.env.DB_BACKEND?.trim().toLowerCase();
  if (explicit) return explicit;
  if (process.env.DATABASE_URL) return 'postgres';
  return 'mock';
}
```

The **FirebaseAdapter** (`src/lib/db/adapters/firebase.ts`, 503 lines) is a full Firestore implementation with:
- Root-level repositories for `users` and `conservatoriums`
- Sub-collection repositories for per-conservatorium data (lessons, rooms, forms, etc.)
- Graceful fallback to `MemoryDatabaseAdapter` when `FIREBASE_SERVICE_ACCOUNT_KEY` is absent

### 2.5 Monolithic Context (Current Gap)

`src/hooks/use-auth.tsx` is a 2,364-line monolithic React Context holding 35+ state arrays and 170+ mutation functions. Domain hooks in `src/hooks/data/` wrap `useAuth()` but do not query a database directly. React Query is not yet installed.

---

## 3. AI Flows (Genkit 1.29)

All 8 Genkit flows in `src/ai/flows/` are implemented and called from Server Actions:

| Flow | Purpose |
|------|---------|
| `match-teacher-flow.ts` | Two-pass teacher matching (hard filter + LLM score) |
| `draft-progress-report-flow.ts` | AI progress report from practice logs |
| `help-assistant-flow.ts` | RAG-based help chat over curated articles |
| `suggest-compositions.ts` | Composition suggestions for form builder |
| `reschedule-flow.ts` | NLP rescheduling request handler |
| `generate-event-poster.ts` | AI event poster content generation |
| `target-empty-slots-flow.ts` | Smart slot filling advisor |
| `nurture-lead-flow.ts` | Playing School lead nurturing |

---

## 4. Locale Routing

`src/i18n/routing.ts` uses `localePrefix: 'as-needed'`:
- **Hebrew (`he`):** default locale, served at root `/`
- **English, Arabic, Russian:** prefixed (`/en/`, `/ar/`, `/ru/`)

Messages loaded from split files in `src/messages/{locale}/*.json` via static imports and deep-merged at runtime in `src/i18n/request.ts`. English is the fallback.

---

## 5. Development Mode

When running locally without Firebase credentials:

```
Browser -> Next.js App
    |
    +-- proxy.ts (Edge Proxy)
    |     Dev bypass: injects x-user-id=dev-user, x-user-role=site_admin
    |     API routes: pass through directly
    |
    +-- /api/bootstrap (API Route)
    |     -> MemoryDatabaseAdapter (seeded from buildDefaultMemorySeed())
    |     -> returns 85 conservatoriums + all mock data as JSON
    |
    +-- Server Actions
    |     -> verifyAuth() chain:
    |       1. Try Admin SDK verifySessionCookie() (production)
    |       2. Read x-user-* headers from proxy (dev with proxy)
    |       3. Synthetic site_admin session (dev, no Firebase)
    |
    +-- Client (use-auth.tsx)
          -> loadBootstrapData() fetches /api/bootstrap
```
