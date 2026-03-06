# 02 — Architecture

## 1. System Container Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                             HARMONIA PLATFORM                                │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                    NEXT.JS APP  (Firebase App Hosting)                 │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────────┐  ┌──────────────────┐   │  │
│  │  │   Public Site   │  │  Authenticated App  │  │   Admin Portal   │   │  │
│  │  │  /              │  │  /[locale]/dashboard│  │  /admin          │   │  │
│  │  │  /register      │  │  /schedule          │  │  /admin/teachers │   │  │
│  │  │  /try           │  │  /forms             │  │  /admin/billing  │   │  │
│  │  │  /about         │  │  /practice          │  │  /admin/reports  │   │  │
│  │  │  /book/:id      │  │  /family            │  │  /admin/payroll  │   │  │
│  │  └─────────────────┘  └─────────────────────┘  └──────────────────┘   │  │
│  │                                                                        │  │
│  │  Server Components (SSR / auth-validated)                              │  │
│  │  Client Components (real-time dashboards, booking calendar)            │  │
│  │  Server Actions (ALL data mutations — never client-direct Firestore)   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│                              ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │               CLOUD FUNCTIONS (2nd Gen — Cloud Run)                    │  │
│  │                                                                        │  │
│  │  CALLABLE (user-triggered):    TRIGGERED (event-driven):               │  │
│  │  bookLessonSlot                onUserApproved → set Custom Claims       │  │
│  │  bookMakeupLesson              onLessonCancelled → issue makeup credit  │  │
│  │  rescheduleLesson              onLessonCompleted → update stats         │  │
│  │  submitSickLeave               onPaymentWebhook → Cardcom callback      │  │
│  │  createPaymentPage             onSheetMusicUploaded → PDF optimise      │  │
│  │  getSignedUrl                  onPracticeVideoUploaded → transcode      │  │
│  │                                                                        │  │
│  │  SCHEDULED:                    PUBSUB (async AI):                      │  │
│  │  monthlyAutoCharge (1st, 06:00)  processAIJob (matchmaker, reports)    │  │
│  │  syncTeacherCalendars (15 min)                                         │  │
│  │  dailyAgeGateCheck (02:00)                                             │  │
│  │  expireCredits (03:00)                                                 │  │
│  │  sendLessonReminders (08:00)                                           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│                              ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                       FIREBASE SERVICES                                │  │
│  │  Firestore (DB) · Auth + Custom Claims · Storage · App Check · FCM    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│              ┌───────────────┼───────────────────────────────┐              │
│              ▼               ▼                               ▼              │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────────────┐ │
│  │  GENKIT AI   │  │  PAYMENT GATEWAY │  │     EXTERNAL SERVICES          │ │
│  │  Gemini      │  │  Cardcom (IL)    │  │  Twilio (SMS + WhatsApp)       │ │
│  │  Matchmaker  │  │  Hosted page     │  │  SendGrid (Email)              │ │
│  │  Reports     │  │  Webhooks        │  │  Google Calendar API           │ │
│  │  Help Agent  │  │  Recurring       │  │  Hebcal API (IL holidays)      │ │
│  └──────────────┘  └──────────────────┘  │  Israel Tax Authority (Sec.46) │ │
│                                          └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Patterns

### 2.1 Multi-Tenancy

Every entity in the system is scoped to a `conservatoriumId`. This is enforced at three layers:
1. **Data model:** every Firestore document includes `conservatoriumId`
2. **Firestore Security Rules:** every read/write rule validates `request.auth.token.conservatoriumId == resource.data.conservatoriumId`
3. **Server Actions / Cloud Functions:** all callable functions receive and validate `conservatoriumId` from Firebase Custom Claims — never from client input

### 2.2 Server Actions as the Mutation Boundary

All data writes flow through **Next.js Server Actions** or **Firebase Callable Cloud Functions**. Client components never write directly to Firestore. This boundary enforces:
- Server-side Zod schema validation on every mutation
- Role validation from Firebase Custom Claims (not localStorage)
- Audit logging before any write

### 2.3 Repository / Database Abstraction Layer

A `DatabaseAdapter` interface (defined in `src/lib/db/types.ts`) abstracts all data access. The active backend is selected via the `DB_BACKEND` environment variable:

| Value | Backend | Use Case |
|-------|---------|----------|
| `firebase` | Cloud Firestore | Production cloud default |
| `postgres` | PostgreSQL via Docker | Local development |
| `supabase` | Supabase (PostgreSQL + Auth + Realtime) | Low-cost cloud alternative |
| `pocketbase` | PocketBase (SQLite) | Single-conservatorium ultra-light installs |

### 2.4 Service Layer Pattern

UI components do not call data adapters or context functions directly. The call chain is:

```
UI Component → Server Action / Service Function → DatabaseAdapter → Firestore / Postgres
                    ↓
             NotificationDispatcher → FCM / Twilio / SendGrid
                    ↓
             CalendarSyncService (optional) → Google Calendar API
```

### 2.5 Real-Time vs. Cache-First Data

| Data Type | Strategy | Implementation |
|-----------|----------|---------------|
| Admin live dashboard (lesson count, alerts) | Real-time `onSnapshot` | Firestore listener on `/conservatoriums/{cid}/stats/live` |
| Booking calendar (slot availability) | Real-time `onSnapshot` | Firestore listener on `lessonSlots` collection |
| User's own schedule | Cache-first | React Query, `staleTime: 30s` |
| Invoices and billing history | Cache-first | React Query, `staleTime: 5min` |
| Practice logs | Cache-first | React Query, `staleTime: 2min` |
| Notifications | Real-time | FCM push + Firestore listener |

### 2.6 Role-Scoped, Lazy-Loaded Data

Each authenticated page loads only the data relevant to the current user's role. There is no shared global data context. Domain-specific hooks (`useLessons`, `useBilling`, `useForms`) load only when the component requiring them mounts.

Role-specific dashboard bundles are loaded via **Next.js `dynamic()`** to prevent cross-role bundle pollution:

```tsx
const AdminCommandCenter = dynamic(() => import('@/components/dashboard/harmonia/admin-command-center'), { ssr: false });
const TeacherDashboard    = dynamic(() => import('@/components/dashboard/harmonia/teacher-dashboard'),    { ssr: false });
```

---

## 3. Module Dependency Graph

```
Module 01 (Identity)  ──────────────────────────────────────────────┐
    └── Module 02 (Registration) ──────────────────────────────────┐ │
    └── Module 03 (Teachers)   ────────────────────────────────────┤ │
        └── Module 04 (Scheduling) ────────────────────────────┐   │ │
            └── Module 05 (Billing)  ────────────────────┐     │   │ │
            └── Module 06 (Cancellation/Makeup) ─────────┤     │   │ │
            └── Module 07 (Notifications)  ──────────────┘     │   │ │
        └── Module 09 (LMS)  ──────────────────────────────────┘   │ │
Module 08 (Forms)  ─────────────────────── depends on 01, 07       │ │
Module 10 (AI)     ─────────────────────── depends on all          │ │
Module 11 (Reporting) ───────────────────── depends on all         │ │
Module 13 (Musicians for Hire) ─────────── depends on 01, 03, 05   │ │
Module 17 (Scholarships) ───────────────── depends on 01, 02, 05   ┘ │
Module 15 (i18n)   ─────────────────────── cross-cutting concern     ┘
```

---

## 4. Navigation Architecture

The sidebar navigation is grouped into **role-specific sections** using the existing `SidebarGroup` / `SidebarGroupContent` components from `sidebar.tsx`. Each persona sees a different set of grouped links:

| Persona | Groups |
|---------|--------|
| Admin | Overview · People · Schedule & Lessons · Programs & Events · Finance · Intelligence · Communication |
| Teacher | My Workspace · My Profile · Finance · Communication |
| Student | My Learning · Practice · Communication · Account |
| Parent | Family Hub · Finance · Communication · Account |

---

## 5. Key Design Principles

1. **Mobile-First, RTL-Always** — All interfaces designed for Hebrew/Arabic on mobile. `dir="rtl"` applied when `locale ∈ {he, ar}`.
2. **Self-Service Over Phone Calls** — Every action a parent currently calls about must be completable in the app.
3. **Zero Paperwork** — All forms, signatures, and approvals are digital; PDFs are generated server-side.
4. **Automation Over Manual Labour** — If a rule can determine the outcome, a human shouldn't have to.
5. **AI as Invisible Staff** — AI handles matching, scheduling suggestions, progress reports, and routine communications with human override always available.
6. **Composable Modules** — A conservatorium can start with modules 01+02+04+05 and activate others incrementally.
7. **Server-Side Authority** — No trust in client-provided roles, amounts, or IDs. Firebase Custom Claims are the sole role authority.

