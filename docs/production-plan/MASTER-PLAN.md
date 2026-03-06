# Harmonia — Master Execution Plan

> **Version:** 1.2 (Phase 1, 2, 6 complete; Phase 3, 5 in progress)
> **Author:** Architect
> **Date:** 2026-03-06
> **Status:** Active — Phases 1, 2, 6 COMPLETE; Phases 3, 5 IN PROGRESS; Phase 4 PENDING
> **PRD Reference:** `docs/production-plan/PRD.md` (Production Readiness Score: 35/100)

---

## Executive Summary

Harmonia is a fully functional multi-tenant SaaS prototype for Israeli music conservatoriums. The UI is comprehensive (35+ dashboard pages, 8 user roles, 17 modules), but the backend is running on **in-memory mock data** with **zero authentication enforcement**. This plan transforms the prototype into a production-ready platform across 6 phases with strict dependency ordering.

### Critical Architecture Gaps (P0)

| # | Gap | Current State | Risk |
|---|-----|--------------|------|
| 1 | **No server-side authentication** | `verifyAuth()` returns `true` unconditionally | Any HTTP request can invoke any Server Action |
| 2 | **No middleware** | `src/middleware.ts` does not exist | No session validation, no role injection for SSR |
| 3 | **Mock login** | Email-only lookup in mock array; `harmonia-user=1` cookie has no crypto | Anyone can impersonate any user |
| 4 | **FirebaseAdapter is a stub** | 7-line class extending `MemoryDatabaseAdapter` with no Firestore calls | Zero data persistence between restarts |
| 5 | **Cloud Functions not deployed** | 6 spec files in `src/lib/cloud-functions/` are pseudocode | No booking atomicity, no makeup credit issuance, no payroll export |
| 6 | **`z.any()` on 6+ critical schemas** | `FormSubmission`, `User`, `Lesson`, `Conservatorium`, `EventProduction`, `CreateEnrollment` accept any input | Arbitrary data injection; privilege escalation via `role: 'site_admin'` |
| 7 | **Monolithic context** | `use-auth.tsx` is 2,364 lines with 35+ state arrays and 170+ mutations | All roles download all data; cascading re-renders |
| 8 | **No Firestore Security Rules** | Template in repo is incomplete and not enforced | No tenant isolation at the database level |
| 9 | **Payment/notification stubs** | Cardcom, Twilio, SendGrid return mock responses when credentials absent | No real payments, no real notifications |
| 10 | **No CI/CD pipeline** | No `.github/workflows/` directory | Manual deploys only |
| 11 | **`ignoreBuildErrors: true`** | `next.config.ts` suppresses TypeScript errors in production builds | Type-unsafe code ships to production |
| 12 | **Digital signatures not captured** | `react-signature-canvas` in deps but no canvas UI | Ministry forms require parent/teacher signatures |
| 13 | **No RBAC on 45 server actions** | Zero role-based access control — any authenticated user can call any action | Cross-role privilege escalation trivial |
| 14 | **No tenant isolation on actions** | No `conservatoriumId` check on server actions | Cross-tenant data access trivial |

---

## Phase Dependency Graph

```
Phase 1: Security & Auth ──────────┐
  (BLOCKS everything)              │
                                   ▼
Phase 2: Data Persistence ─────────┐
  (Firestore adapter + CFs)       │
                                   ▼
Phase 3: Context Decomposition ────┐
  (React Query + domain hooks)    │
                                   ▼
Phase 4: Production Integrations ──┐
  (Payments + Notifications)      │
                                   ▼
Phase 5: UI/UX Polish ────────────┐
  (Landing page, a11y, RTL)      │
                                   ▼
Phase 6: Infrastructure & CI/CD
  (Pipeline, monitoring, deploys)

Cross-cutting: i18n audit runs in parallel from Phase 1
Cross-cutting: Performance audit runs in parallel from Phase 1
```

---

## Phase 1: Security & Auth Foundation

**Owner:** @Security
**Priority:** P0 — BLOCKS ALL OTHER PHASES
**Estimated scope:** 8 deliverables

### 1.1 Create `src/middleware.ts`

**File:** `src/middleware.ts` (CREATE — does not exist)

Requirements:
- Use Firebase Admin SDK `verifySessionCookie()` to validate the `__session` cookie on every request
- Protect all `/dashboard/*` routes — redirect to `/login` if no valid session
- Inject `x-user-id`, `x-user-role`, `x-conservatorium-id` headers into the request for Server Components
- Allow public routes without auth: `/`, `/login`, `/register`, `/[locale]/*` (public pages), `/api/cardcom-webhook` (with HMAC validation)
- Chain with next-intl middleware for locale routing (Hebrew at root `/`, others prefixed)
- Handle unapproved users: redirect to `/pending-approval` if `claims.approved !== true`

### 1.2 Replace Mock Login with Real Firebase Auth

**File:** `src/hooks/use-auth.tsx` → `login()` function

Current (lines 87-88 of `AuthContextType`):
```typescript
login: (email: string) => { user: User | null; status: 'approved' | 'pending' | 'not_found' };
```

Target:
- Call `signInWithEmailAndPassword(auth, email, password)` from Firebase client SDK
- On success: exchange Firebase ID token for a session cookie via a Server Action that calls `admin.auth().createSessionCookie()`
- Store session cookie as `__session` (HttpOnly, Secure, SameSite=Lax)
- Remove the `harmonia-user=1` cookie entirely

### 1.3 Deploy `onUserApproved` Cloud Function

When an admin approves a user registration:
- Set Firebase Custom Claims: `{ role, conservatoriumId, approved: true }`
- Force token refresh on the client via `getIdToken(true)`
- Claims payload: `{ role: UserRole, conservatoriumId: string, approved: boolean }`

### 1.4 Rewrite `src/lib/auth-utils.ts`

**File:** `src/lib/auth-utils.ts` (REWRITE — currently 28 lines, `verifyAuth()` returns `true`)

New exports:
- `verifyAuth()` — reads `__session` cookie, calls `admin.auth().verifySessionCookie()`, returns decoded claims
- `requireRole(allowedRoles: UserRole[], conservatoriumIdMustMatch?: string)` — validates role and tenant match
- `getClaimsFromRequest()` — reads injected headers from middleware (`x-user-id`, `x-user-role`, `x-conservatorium-id`)

### 1.5 Create `src/lib/firebase-admin.ts`

**File:** `src/lib/firebase-admin.ts` (CREATE or ENHANCE)

- Initialize Firebase Admin SDK with `FIREBASE_SERVICE_ACCOUNT_KEY` env var (base64 JSON)
- Export: `adminAuth`, `adminFirestore`, `adminStorage`
- Graceful degradation: `console.warn` when env var is not set (local dev without Firebase)

### 1.6 Replace `z.any()` Schemas

**Backend audit (Task #4) identified 7 `z.any()` schemas** — more than the 3 originally known:

| Schema | File | Risk |
|--------|------|------|
| `FormSubmissionSchema = z.any()` | `src/app/actions.ts` | Arbitrary form data injection (proper schema exists in `src/lib/validation/forms.ts` but not imported!) |
| `UserSchema = z.any()` | `src/app/actions.ts` | Attacker can set `role: 'site_admin'` (proper schema exists in `src/lib/validation/user-schema.ts`) |
| `LessonSchema = z.any()` | `src/app/actions.ts` | Arbitrary lesson injection (proper schema exists in `src/lib/validation/booking.ts`) |
| `ConservatoriumSchema = z.any()` | `src/app/actions.ts` | Tenant data manipulation |
| `EventProductionSchema = z.any()` | `src/app/actions.ts` | Event data injection |
| `CreateEnrollmentSchema` (nested `z.any()`) | `src/app/actions.ts` | Enrollment data injection |

**Quick win:** 3 of these already have proper schemas in `src/lib/validation/` — they just need to be imported into `actions.ts`. The remaining 3 need new schemas written.

Write replacement schemas to `src/lib/validation/` and reference from `actions.ts`.

### 1.7 PDPPA Compliance Audit

Produce `docs/production-plan/Security-PDPPA-report.md`:
- Map every PDPPA obligation to implementation status
- `ConsentRecord` UI wiring plan
- `ComplianceLog` wiring plan
- `SignatureAuditRecord` wiring plan
- Right-to-erasure implementation plan
- Under-13 data protection audit
- Data residency: `europe-west1` vs `me-central1` recommendation

### 1.8 Custom Claims Cloud Function Spec

Produce `docs/production-plan/Security-CustomClaims-CF.md`:
- Implementation details for `onUserApproved`
- Claims refresh pattern (client-side `getIdToken(true)` after claims update)
- Trigger conditions: approval, role change, conservatorium reassignment

### 1.9 Remove `ignoreBuildErrors: true` (PRD §3.5)

**File:** `next.config.ts`

- Remove `typescript: { ignoreBuildErrors: true }` from Next.js config
- Fix all underlying TypeScript errors:
  - Missing `school_coordinator` key in walkthrough config
  - `@ts-nocheck` on users page
  - React Rules of Hooks violation in users page (PRD BUG-12)
- This is a P0 security concern — type-unsafe code ships to production

---

## Phase 2: Data Persistence

**Owner:** @DBA (schema + rules) + @Backend (adapter + Cloud Functions)
**Depends on:** Phase 1 (auth must be real before writing real data)
**Estimated scope:** 12 deliverables

### 2.1 Firestore Security Rules (DBA)

**File:** `firestore.rules` (REWRITE — current template is incomplete)

Full rules for ALL collections from `05-data-persistency.md` §2:
- Authentication required on all operations
- `conservatoriumId` tenant isolation via Custom Claims
- Role-based access per collection (admin reads all in tenant; teacher reads own students; parent reads children via `parentOf/`)
- All writes via Server Actions/Cloud Functions: `allow write: if false` on client-direct writes
- Under-13 protection via `parentOf/{parentId_studentId}` collection

### 2.2 Firebase Storage Security Rules (DBA)

**File:** `storage.rules` (CREATE)

- No public URLs for PII (practice videos, signatures, photos)
- Signed URLs only for invoice PDFs, Ministry form PDFs
- Per-conservatorium isolation: `/conservatoriums/{cid}/...`

### 2.3 Firestore Composite Indexes (DBA)

**File:** `firestore.indexes.json` (CREATE)

All 10 composite indexes from `05-data-persistency.md` §5:
- `lessonSlots`: 4 indexes (teacher schedule, student schedule, admin master, room availability)
- `invoices`: 2 indexes (family billing, admin overdue)
- `makeupCredits`: 2 indexes (student wallet, expiry job)
- `formSubmissions`: 1 index (admin approvals queue)
- `practiceLogs`: 1 index (practice history)

### 2.4 Type Model Fixes (DBA)

Document proposed changes to `src/lib/types.ts`:
- Add `conservatoriumId` and `installments` to `Package` interface
- Add `subtotal`, `discounts`, `vatAmount` (17% Israeli VAT), `paidAmount`, `paymentMethod`, `installments`, `pdfUrl` to `Invoice` interface

### 2.5 Implement Real FirebaseAdapter (Backend)

**File:** `src/lib/db/adapters/firebase.ts` (REWRITE — currently 7 lines)

Replace the `MemoryDatabaseAdapter` stub with real Firestore SDK calls:
- Map all 17 `DatabaseAdapter` interface repositories to Firestore collections
- Use `collection()`, `doc()`, `getDoc()`, `setDoc()`, `updateDoc()`, `query()`, `where()`, `orderBy()`
- Batch writes for bulk operations
- Transactions for atomic operations (booking, credit redemption)

### 2.6 Deploy Cloud Functions (Backend)

Promote 6 spec files to real Firebase Cloud Functions:

| Priority | Function | Type | Spec File |
|----------|----------|------|-----------|
| P0 | `bookLessonSlot` | Callable | `booking.ts` |
| P0 | `bookMakeupLesson` | Callable | `makeup-booking.ts` |
| P0 | `onLessonCancelled` | Trigger | `lesson-triggers.ts` |
| P1 | `onLessonCompleted` | Trigger | `lesson-triggers.ts` |
| P1 | `generatePayrollExport` | Callable | `payroll-export.ts` |
| P2 | `syncTeacherCalendars` | Scheduled | `calendar-sync.ts` |
| P2 | `getIsraeliHolidaysForYear` | Callable | `holiday-calendar.ts` |

All functions: Node.js 20, region `europe-west1`, Firebase Admin SDK.

### 2.7 Cardcom Webhook Handler (Backend)

**File:** `src/app/api/cardcom-webhook/route.ts`

- HMAC-SHA256 validation using `CARDCOM_WEBHOOK_SECRET`
- Update payment status in Firestore
- Trigger invoice generation
- Send receipt notification via dispatcher

### 2.8 Firebase Project Configuration (DBA)

**File:** `firebase.json` (CREATE)

- Configure: hosting, firestore, functions, storage, emulators
- Firestore rules and indexes files
- Functions: Node.js 20, region `europe-west1`
- Emulators: auth:9099, firestore:8080, functions:5001, storage:9199

---

## Phase 3: Context Decomposition (Performance)

**Owner:** @Performance
**Depends on:** Phase 2 (domain hooks need real data sources)
**Estimated scope:** 6 deliverables

### 3.1 Install React Query

Add `@tanstack/react-query` and `@tanstack/react-query-devtools` to `package.json`.
Create `QueryClientProvider` wrapper in the app layout.

### 3.2 Context Decomposition Map

Map all 35+ state arrays and 170+ mutation functions in `use-auth.tsx` to domain groups:
- **Auth domain:** user, login, logout, isLoading (keep in context)
- **Lessons domain:** lessons, addLesson, cancelLesson, rescheduleLesson, updateLessonStatus
- **Users domain:** users, approveUser, rejectUser, updateUser, addUser
- **Billing domain:** invoices, packages, payrolls
- **LMS domain:** practiceLogs, assignedRepertoire, lessonNotes, compositions, practiceVideos
- **Communication domain:** messageThreads, announcements, notifications
- **Forms domain:** formSubmissions, formTemplates
- **Events domain:** events, performanceBookings, openDayEvents
- **Inventory domain:** instrumentInventory, instrumentRentals
- **Scholarship domain:** scholarshipApplications, donationCauses, donations
- **Alumni domain:** alumni, masterClasses
- And others...

### 3.3 Migrate Domain Hooks to React Query

Priority order (by re-render impact):
1. `useMyLessons` — highest frequency, used by all roles
2. `useMyInvoices` — used by parents and admin
3. `useLiveStats` — admin dashboard aggregation
4. `useMakeupCredits` — booking flow critical path
5. `usePracticeLogs` — student LMS

Each hook: `useQuery` with appropriate `staleTime`, `queryKey` factory pattern, optimistic updates for mutations.

### 3.4 Dynamic Import Fixes

**File:** `src/app/[locale]/dashboard/admin/page.tsx`

Replace static `AdminCommandCenter` import with `next/dynamic`:
```typescript
const AdminCommandCenter = dynamic(() => import('@/components/dashboard/harmonia/admin-command-center'), {
  loading: () => <DashboardSkeleton />,
});
```

Audit all dashboard pages for heavy components that should be dynamically imported.

### 3.5 Firestore `onSnapshot` Listeners

For real-time requirements only:
- Booking calendar (teacher/student schedule views)
- Admin live dashboard (`/conservatoriums/{cid}/stats/live` document)
- Notification feed

### 3.6 LCP/INP Optimization

- Font loading strategy for Hebrew (Rubik) — verify `next/font` preloading
- Reduce initial JS bundle with dynamic imports per role
- Sub-200ms INP target via context splitting (eliminate cascading re-renders)
- Sub-2.5s LCP target via SSR + streaming for dashboard pages

---

## Phase 4: Production Integrations

**Owner:** @Backend + @Security
**Depends on:** Phase 2 (needs real data layer for payment/notification persistence)

### 4.1 Activate Cardcom Payment Gateway

**File:** `src/lib/payments/cardcom.ts` (already has full API code — needs credentials)

- Configure `CARDCOM_TERMINAL_NUMBER`, `CARDCOM_API_NAME`, `CARDCOM_API_PASSWORD` in Google Secret Manager
- Test sandbox mode first (`CARDCOM_SANDBOX=true`, `CARDCOM_SANDBOX_TERMINAL_NUMBER`)
- Verify hosted payment page redirect flow
- Test recurring token charge for monthly packages
- Test installment calculator (1-12 Israeli installments / תשלומים)

### 4.2 Activate Twilio SMS/WhatsApp

**File:** `src/lib/notifications/dispatcher.ts` (already has real Twilio API code)

- Configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, `TWILIO_WHATSAPP_FROM`
- Test quiet hours logic (Israel timezone)
- Test Israeli phone normalization (`050-1234567` to `+972501234567`)
- Verify under-13 routing (all notifications go to parent)

### 4.3 Cardcom Webhook HMAC Validation

**File:** `src/app/api/cardcom-webhook/route.ts`

- Validate `HMAC-SHA256` signature on every incoming webhook
- Reject requests with invalid signatures
- Update invoice status, trigger receipt notification

### 4.4 SendGrid Email Integration

- Configure `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
- Test email delivery for: invoice receipts, registration confirmations, lesson reminders

---

## Phase 5: UI/UX Polish

**Owner:** @Frontend + @i18n
**Depends on:** Phase 3 (needs React Query hooks for real data flow)

### 5.1 Landing Page Revamp (Frontend)

Per `SDD-FIX-18-PublicSite-LandingPage.md`:
- Hero section with Hebrew value proposition
- Features grid showcasing 6 key differentiators
- Persona cards (admin, teacher, parent, student)
- Call-to-action sections
- Testimonials section

### 5.2 IS 5568 Accessibility Compliance (Frontend)

Israeli accessibility law compliance (WCAG 2.1 AA):
- Audit sidebar navigation (556-line `sidebar-nav.tsx`) for ARIA labels, focus management, keyboard nav
- Add skip-to-content link at top of dashboard layout
- Verify color contrast ratios (4.5:1 for normal text, 3:1 for large text/UI)
- Ensure all form labels and error announcements work with screen readers
- Ensure all icon-only buttons have `aria-label`
- Test keyboard navigation in RTL tab order

### 5.3 RTL Logical Properties Audit (i18n)

Scan `src/app/` and `src/components/` for non-logical CSS properties:
- `margin-left/right` to `margin-inline-start/end`
- `padding-left/right` to `padding-inline-start/end`
- `left/right` CSS to `inset-inline-start/end`
- `text-align: left` to `text-align: start`

### 5.4 Translation Completeness (i18n)

- Run `npm run i18n:audit` to find missing keys per locale (he/ar/en/ru)
- Fill critical missing keys: navigation labels, error messages, payment/billing strings, form labels
- Generate localized seed data with realistic Israeli conservatorium names, teacher names, instruments
- Russian locale: 1,063 missing keys (41% incomplete) — requires dedicated attention (PRD §7.3)
- Arabic locale: 13 missing keys
- Replace Hebrew status strings used in business logic with locale-neutral keys (SEC-08)

### 5.5 Localized Seed Data (i18n)

Create `scripts/db/seed-i18n-demo.ts`:
- Hebrew conservatorium names, teacher and student names
- Arabic-speaking teachers
- Hebrew instrument names
- Sample lessons, invoices, practice logs

### 5.6 Digital Signature Flow (PRD §4.6)

**P1 — Required for Ministry form validity**

- Build signature capture component using `react-signature-canvas` (package already in deps)
- Generate SHA-256 hash of signature + document content
- Store `SignatureAuditRecord` with timestamp and IP
- Embed signatures in exported PDF forms for Ministry submission
- Wire signature step in form workflow (`requiresSignature` flag on `WorkflowStepDefinition`)

### 5.7 Bug Fixes from QA Reports (PRD §7.4)

| Bug | Fix | Owner |
|-----|-----|-------|
| BUG-01 | Delete legacy `src/hooks/use-walkthrough.tsx` | @Frontend |
| BUG-02 | Remove duplicate `WalkthroughManager` from root layout | @Frontend |
| BUG-04 | Delete orphan `src/app/page.tsx` | @Frontend |
| BUG-06 | Delete orphan `src/app/dashboard/` directory | @Frontend |
| BUG-07 | Fix 20+ pages using `import Link from 'next/link'` instead of i18n Link | @i18n |
| BUG-08 | No mobile menu on public navbar | @Frontend |
| BUG-12 | React Rules of Hooks violation in users page | @Frontend |
| BUG-13 | Add error boundaries and 404/loading pages | @Frontend |

---

## Phase 6: Infrastructure & CI/CD

**Owner:** @Infrastructure
**Status:** COMPLETED (Task #8)

All infrastructure deliverables have been implemented:

### 6.1 GitHub Actions CI/CD Pipeline -- DONE

**File:** `.github/workflows/ci.yml` (CREATED)

Pipeline stages:
1. Lint + TypeScript type check (`tsc --noEmit`)
2. Run Vitest tests (`npm run test`) + DB integration tests (parallel)
3. Next.js build (`next build`)
4. On PR: deploy to Firebase Hosting Preview Channel (7-day TTL)
5. On merge to main: deploy to Staging environment
6. On git tag `v*`: deploy to Production

### 6.2 `apphosting.yaml` -- DONE (updated)

Production configuration with all 10 secret references from Google Secret Manager:
- `FIREBASE_SERVICE_ACCOUNT_KEY`, `CARDCOM_TERMINAL_NUMBER`, `CARDCOM_API_NAME`, `CARDCOM_API_PASSWORD`, `CARDCOM_WEBHOOK_SECRET`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `SENDGRID_API_KEY`, `GOOGLE_API_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `cpu: 2`, `memoryMiB: 1024`, `minInstances: 1`, `maxInstances: 10`
- `DB_BACKEND: firebase`

### 6.3 `firebase.json` -- DONE (created)

Configured: hosting, firestore (rules + indexes), functions (Node.js 20, `europe-west1`), storage (rules), emulators (auth:9099, firestore:8080, functions:5001, storage:9199).

### 6.4 `.firebaserc` -- DONE (created)

Three Firebase projects for hard environment isolation:
- `default` → `harmonia-dev`
- `staging` → `harmonia-staging`
- `production` → `harmonia-production`

### 6.5 Infrastructure Decisions (Confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Region** | `europe-west1` (Belgium) | `me-central1` does not support Firebase App Hosting; Belgium is PDPPA-compliant (EU adequate protection), full Firebase service catalog, ~20ms more latency than Doha |
| **Zero-downtime** | Cloud Run rolling deploys (via Firebase App Hosting) | `minInstances: 1` ensures no cold starts; Firestore rules deploy atomically; rollback via revert+tag |
| **Backup** | Daily Firestore exports + PITR (7-day window) + cross-region EU bucket | Covers data loss, corruption, and disaster recovery |
| **Cost estimate** | $60-110/month Year 1 | 5 conservatoriums, ~1,000 users |
| **Secrets** | Google Secret Manager, replication: user-managed in `europe-west1` only | PDPPA data residency compliance |

**Detailed report:** `docs/production-plan/Infrastructure-report.md`

---

## Agent Assignment Matrix

| Agent | Task # | Phase | Primary Deliverables | Dependencies |
|-------|--------|-------|---------------------|--------------|
| @Security | #6 | 1 | `src/middleware.ts`, `auth-utils.ts` rewrite, `firebase-admin.ts`, PDPPA report, Zod schema fixes doc | None (start immediately) |
| @DBA | #5 | 2 | `firestore.rules`, `storage.rules`, `firestore.indexes.json`, type changes doc, schema report | None (start immediately) |
| @Backend | #4 | 2 | Backend audit, FirebaseAdapter plan, Cloud Functions plan, Cardcom webhook | Waits for @DBA schema + @Security Zod fixes |
| @Performance | #7 | 3 | Context decomposition map, React Query migration plan, dynamic imports, LCP/INP audit | None for audit (start immediately); implementation waits for Phase 2 |
| @Frontend | #3 | 5 | Accessibility audit, RTL audit, landing page plan, a11y fixes | None for audit (start immediately) |
| @Infrastructure | #8 | 6 | CI/CD pipeline, `apphosting.yaml` update, `firebase.json`, `.firebaserc`, infra report | None (start immediately) |
| @i18n | #9 | 5 | i18n audit, missing translations, RTL logical properties report, localized seed data | None (start immediately) |

### Parallel Work Streams

```
TIME ──────────────────────────────────────────────────────────────>

@Security:      [──── middleware + auth-utils + PDPPA ────]
@DBA:           [── firestore.rules + storage.rules + indexes ──]
@Backend:       [audit]  ···waits···  [adapter + CF plans]
@Performance:   [── context map + React Query plan + dynamic imports ──]
@Frontend:      [── a11y audit + RTL audit + landing page plan ──]
@Infrastructure:[── CI/CD + apphosting.yaml + firebase.json ──]
@i18n:          [── i18n audit + RTL scan + seed data ──]
```

---

## Success Criteria

### Phase 1 Complete When: -- COMPLETED
- [x] `src/middleware.ts` exists and validates session cookies (@Security — done)
- [x] `verifyAuth()` calls real Firebase Admin SDK (@Security — done)
- [x] `login()` calls `signInWithEmailAndPassword` (@Security Task #25 — done)
- [x] Login/logout API routes wired with session cookie flow (@Security Task #29 — done)
- [x] All 6+ `z.any()` schemas replaced (@Backend Task #20 — done; Zod fix spec in Security-Zod-fixes.md)
- [x] RBAC added to all 45 server actions via `requireRole()` (@Backend Task #35 — done)
- [x] `conservatoriumId` tenant isolation enforced on all 17 multi-tenant actions (@Backend Task #35 — done)
- [x] Cardcom webhook with HMAC-SHA256 validation (@Backend Task #31 — done)
- [x] PDPPA compliance report complete (@Security — Security-PDPPA-report.md)
- [x] PDPPA consent collection wired at registration (@Security Task #38 — done)
- [x] Custom Claims Cloud Functions implemented (@Architect — functions/src/auth/)
- [x] `firebase-admin.ts` created (@Security — done)
- [x] `ignoreBuildErrors: true` removed from next.config.ts (@Infrastructure Task #19 — done)

### Phase 2 Complete When: -- COMPLETED
- [x] `firestore.rules` deployed with full tenant isolation (@DBA — done, 40+ collections)
- [x] `storage.rules` deployed with no public PII URLs (@DBA — done)
- [x] `firestore.indexes.json` has all composite indexes (@DBA — done, 17 indexes)
- [x] `FirebaseAdapter` fully implemented with real Firestore calls (@DBA Task #22 — done)
- [x] `parentOf` sync Cloud Function implemented (@DBA Task #32 — done)
- [x] Booking Cloud Functions (bookLessonSlot, bookMakeupLesson) implemented (@Architect Task #37 — done)
- [x] Cardcom webhook handler with HMAC-SHA256 validation (@Backend Task #31 — done)
- [x] `Package` and `Invoice` type fixes applied (@PM Task #21 — done)

### Phase 3 Complete When: -- IN PROGRESS
- [x] `@tanstack/react-query` installed and QueryProvider wired into layout (@Performance Task #33 — done)
- [x] Context decomposition map shows all 35+ state arrays grouped by domain (@Performance Task #7 — done)
- [x] React Query migration plan with priority ordering (@Performance Task #7 — done)
- [x] First two domain hooks (useLessons, useInvoices) migrated to React Query (@Performance Task #33 — done)
- [ ] Dynamic imports implemented for `AdminCommandCenter`
- [x] LCP/INP audit with specific optimization recommendations (@Performance Task #7 — done)

### Phase 4 Complete When:
- [ ] Cardcom test transaction succeeds in sandbox
- [ ] Twilio test SMS/WhatsApp delivered
- [ ] Webhook HMAC validation active

### Phase 5 Complete When: -- IN PROGRESS
- [x] IS 5568 accessibility audit complete with fixes applied (@Frontend Task #3 — done)
- [x] RTL logical properties audit complete (@i18n Task #9 — done)
- [x] Top 20 hardcoded Hebrew strings replaced with i18n keys (@i18n Task #39 — done)
- [x] User.preferredLanguage persistence implemented (@i18n Task #39 — done)
- [x] Landing page redesign implemented (@Frontend Task #3 — done)
- [x] Digital signature capture component and SignatureAuditRecord wiring (@PM Task #28 — done)
- [ ] All 4 locales have complete navigation and error message translations (Russian: 1,063 keys remain)

### Phase 6 Complete When: -- COMPLETED
- [x] GitHub Actions pipeline runs on PR and merge
- [x] `apphosting.yaml` has all production secrets referenced
- [x] `firebase.json` configured for all Firebase services
- [x] Infrastructure report with region and cost recommendations

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Firebase project not yet created | High | Blocks Phase 2+ | MITIGATED: `europe-west1` confirmed by @Infrastructure; `.firebaserc` configured with 3 projects |
| Cardcom sandbox credentials not available | Medium | Blocks Phase 4 payments | Request from product owner; test with mock redirect in parallel |
| Monolithic context refactor breaks UI | Medium | Regression risk | Incremental migration: domain hooks wrap context first, then switch to React Query |
| Firestore costs exceed budget | Low | Operational | Use `stats/live` aggregation pattern; limit `onSnapshot` to 3 collections |
| PDPPA audit reveals additional requirements | Medium | Scope creep | Complete Phase 1 PDPPA report before committing Phase 2 timeline |

---

## Key File References

| File | Lines | Role in Plan |
|------|-------|-------------|
| `src/middleware.ts` | 0 (CREATE) | Phase 1 — route protection, session validation |
| `src/lib/auth-utils.ts` | 28 | Phase 1 — rewrite `verifyAuth()` |
| `src/hooks/use-auth.tsx` | 2,364 | Phase 3 — decompose into domain hooks |
| `src/app/actions.ts` | 1,283 | Phase 1 (Zod fixes) + Phase 2 (real DB calls) |
| `src/lib/db/adapters/firebase.ts` | 7 | Phase 2 — implement real Firestore adapter |
| `src/lib/db/types.ts` | 101 | Phase 2 — 17 repositories to implement |
| `src/lib/types.ts` | 1,964 | Phase 2 — type model fixes |
| `firestore.rules` | template | Phase 2 — complete rewrite |
| `src/lib/payments/cardcom.ts` | full | Phase 4 — activate with credentials |
| `src/lib/notifications/dispatcher.ts` | 245 | Phase 4 — activate with Twilio credentials |
| `apphosting.yaml` | 8 | Phase 6 — expand for production |
| `src/i18n/routing.ts` | 12 | Reference — locale config is correct |
