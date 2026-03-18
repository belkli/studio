# Lyriosa — Master QA Plan

**Version:** 1.6
**Date:** 2026-03-14
**Status:** Ready for execution
**Compiled from:** 9 domain QA plans (auth, dashboard, scheduling, billing, repertoire, public, admin, legal, mock-data) + PM review (11-pm-review.md) + Security review (12-security-review.md) + Full SDD reading (55 documents: 9 architecture + 19 feature SDDs + 12 persona audits + 15 fix specs + SDD-NAV-01)
**v1.1 changes:** Added INT-18..INT-24 (7 new cross-persona lifecycle scenarios); extended INT-04, INT-06, INT-14; added FIX-19..FIX-21 for lesson notes and event booking; updated scenario count.
**v1.2 changes:** Expanded forms section per stakeholder correction — forms can be created by student/teacher/admin (not just admin). Replaced INT-14 with INT-14A..INT-14I; retired INT-18/INT-23. Added FIX-22.
**v1.3 changes:** Added INT-14J (recital form: 3-path creator test — student self-nominates vs teacher-nominates vs admin-creates, each producing different initial pipeline status).
**v1.4 changes:** Authoritative SDD reconciliation (SDD-08, SDD-P5, SDD-FIX-06). Added full 7-type form taxonomy table. Resolved two stakeholder/code conflicts: (1) student recital creation IS correct per SDD-08 §2; (2) ministry queue filter stub corrected — SDD-P5 §3.2 uses `requiresMinistryApproval` flag + `PENDING_MINISTRY_REVIEW` status, not generic `APPROVED`. Corrected INT-14F ministry step. Added INT-14K (non-EXAM_REGISTRATION forms do not enter ministry queue). Added FIX-23 (ministry formType filter not implemented in approvals/page.tsx), FIX-24 (COMPOSITION_SUBMISSION and SCHOLARSHIP_REQUEST form types missing from new-form.tsx). Added events admin-only creator note to INT-19.
**v1.5 changes:** Incorporated PM review (62 new scenarios, 8 blockers FIX-25..32, 6 integration scenarios INT-25..30) + Security review (12 SEC scenarios, 7 critical/high fixes FIX-33..39, 21 gate criteria) + SDD vs code gap analysis (Section 10). Total scenario count updated to ~557.
**v1.5.1 changes:** Stakeholder clarifications: (1) Student recital forms confirmed correct as-is. (2) Ministry sees ALL approved forms — this is intentional; FIX-23 removed, INT-14K demoted to P3-FUTURE. (3) Deployment target is **Vercel + Supabase**, not Firebase — auth provider abstraction (`AUTH_PROVIDER=firebase|supabase`) means tests must be provider-agnostic; DB-level security rules reframed from Firebase-specific to provider-agnostic (Supabase RLS); test environments updated. Total scenario count: ~556 (INT-14K demoted).
**v1.6 changes:** Complete SDD reading (all 55 documents) finalised. Section 10 expanded from 10 entries to comprehensive 60+ gap analysis across 8 categories. Changelog updated.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Pre-QA Fix List](#2-pre-qa-fix-list)
3. [Execution Phases](#3-execution-phases)
4. [Shared Test Utilities](#4-shared-test-utilities)
5. [Scenario Index](#5-scenario-index)
   - 5.1 Auth & Registration (A-)
   - 5.2 Dashboard & Navigation (DN-)
   - 5.3 Scheduling & Booking (SB-)
   - 5.4 Billing & Financial (BF-)
   - 5.5 Repertoire & Music (RM-)
   - 5.6 Public Pages (PP-)
   - 5.7 Admin Features (ADM-)
   - 5.8 Legal & Compliance (LC-)
6. [Deduplication Map](#6-deduplication-map)
7. [Cross-Feature Integration Tests](#7-cross-feature-integration-tests)
7b. [Security Test Scenarios](#7b-security-test-scenarios)
8. [QA Gate Criteria](#8-qa-gate-criteria)
9. [ID→UUID Mapping Reference](#9-iduuid-mapping-reference)
10. [SDD vs Code Gap Analysis](#10-sdd-vs-code-gap-analysis)
11. [Changelog](#11-changelog)

---

## 1. Executive Summary

### Scope

This plan covers **all QA scenarios** for the Lyriosa music education platform. It is the authoritative document for QA execution and supersedes individual domain plans where conflicts exist.

### Scenario Counts by Domain

| Domain Plan | Canonical Prefix | Scenario Count |
|-------------|-----------------|----------------|
| Auth & Registration | A- | ~60 scenarios (55 + 5 PM) |
| Dashboard & Navigation | DN- | ~86 scenarios (80 + 6 PM) |
| Scheduling & Booking | SB- | ~71 scenarios (65 + 6 PM) |
| Billing & Financial | BF- | ~47 scenarios (40 + 7 PM) |
| Repertoire & Music | RM- | ~57 scenarios (51 + 6 PM) |
| Public Pages | PP- | ~64 scenarios (60 + 4 PM) |
| Admin Features | ADM- | ~45 scenarios (40 + 5 PM) |
| Legal & Compliance | LC- | ~66 scenarios (60 + 6 PM) |
| **Cross-Feature Integration** | **INT-** | **38 scenarios (32 v1.4 + 6 PM: INT-25..30)** |
| **Security Tests** | **SEC-** | **12 scenarios (SEC-01..12 from Security review)** |
| **Total** | | **~557 scenarios** |

### Stack Under Test

- Next.js 16 + TypeScript + Tailwind
- next-intl — 4 locales: `he` (RTL, default), `en`, `ar` (RTL), `ru`
- Auth: Provider-agnostic via `AUTH_PROVIDER` env var — `supabase` (primary deployment target) or `firebase` (alternate). Auth provider abstraction in `src/lib/auth/provider.ts` (`IServerAuthProvider`, `IClientAuthProvider`). Dev bypass active when `NODE_ENV !== 'production'` and no auth credentials are set.
- DB backends: `mock` (default CI), `postgres` (primary deployment target via Supabase), `supabase` (Supabase client SDK), `pocketbase`
- Deployment target: **Vercel + Supabase** (not Firebase Hosting)
- Key env flags: `AUTH_PROVIDER`, `NEXT_PUBLIC_ALLOW_BOOTSTRAP_MOCK_FALLBACK=1`, `CARDCOM_WEBHOOK_SECRET`, `GEMINI_API_KEY`

### Test Environments

| Environment | Auth Mode | DB | Hosting | Use |
|-------------|----------|-----|---------|-----|
| Local dev | Dev bypass (no auth credentials) | mock | localhost | Unit + smoke |
| Staging | Supabase Auth (staging project) | postgres (Supabase) | Vercel Preview | Full E2E |
| Production | Supabase Auth (production project) | postgres (Supabase) | Vercel Production | Smoke only |
| Alt: Firebase | Firebase Auth (if `AUTH_PROVIDER=firebase`) | postgres or Firestore | Firebase Hosting | Provider compatibility tests |

> **v1.5.1 note:** The primary test path is `AUTH_PROVIDER=supabase` with Postgres via Supabase. Firebase is a secondary provider. All E2E tests should pass with both providers. Provider-specific tests (e.g., SEC-01 cookie attributes) must be run against both auth stacks.

---

## 2. Pre-QA Fix List

These are confirmed bugs or implementation gaps identified during planning that **must be fixed before QA can meaningfully execute** the affected scenarios.

### P0 — Blockers (fix before any QA begins)

| ID | Issue | Source Plan | Affected Scenarios | Fix |
|----|-------|------------|-------------------|-----|
| FIX-01 | `mockPackages` is empty array — book wizard, package guard, billing all broken | Plan 09 | SB-14, SB-16, BF-01, BF-03, INT-02 | Populate `mockPackages` with 4 records (spec in Plan 09 §3.1) |
| FIX-02 | `mockInvoices` is empty array — billing page always blank | Plan 09 | BF-01, BF-04, BF-05, BF-14 | Populate `mockInvoices` (spec in Plan 09 §3.2) |
| FIX-03 | `mockAssignedRepertoire` is empty — student repertoire always shows "No pieces" | Plan 09 | RM-02..RM-06, INT-05 | Populate 4 records (spec in Plan 09 §3.4) |
| FIX-04 | `mockMakeupCredits` is empty — makeup booking flow untestable | Plan 09 | SB-31..SB-35, SB-38, INT-06 | Populate 3 credits (spec in Plan 09 §3.7) |
| FIX-05 | `mockConservatoriumInstruments` missing for cons-66 — enrollment wizard fails for cons-66 users | Plan 09 | SB-10, INT-01 | Add 3 instruments for cons-66 (spec in Plan 09 §3.12) |

### P1 — Critical (fix before P1 scenario execution)

| ID | Issue | Source Plan | Affected Scenarios | Fix / Note |
|----|-------|------------|-------------------|----|
| FIX-06 | VAT rate in billing plan scenarios states 18% but `vat.ts` uses `VAT_RATE=0.18` (changed from 0.17 Jan 2025) — `makeInvoice` factory still uses 0.17 | Plans 04, 09 | BF-04 | Update `makeInvoice` factory to use `VAT_RATE=0.18`; verify `vat.ts` constant |
| FIX-07 | `cancelPackageAction` always returns `withinCoolingOff: true` — BF-07 and LC-41 cannot test the outside-cooling-off path | Plans 04, 08 | BF-07, LC-41 | Add `purchasedAt` field to Package; implement real date comparison in `cancelPackageAction` |
| FIX-08 | Package upgrade dialog shows hardcoded prices (₪450, ₪850, ₪320) — not driven by `lessonPackages` data | Plan 04 | BF-03 | Document as known stub; mark test as "verify stub matches current hardcoded values" |
| FIX-09 | Parent billing page (`parent-payment-panel.tsx`) uses internal `MOCK_INVOICES` — not connected to `useAuth().invoices` | Plan 04 | BF-09 | Mark BF-09 as stub-level test; note real integration pending |
| FIX-10 | Admin scholarships search input not wired (no `onChange` handler) | Plan 04 | ADM-14 (scholarship search) | Mark as known gap; add TODO to implementation |
| FIX-11 | `mockFormTemplates` is empty — form builder has no templates | Plan 09 | ADM-21 | Add at least 1 `FormTemplate` record |
| FIX-12 | `mockPracticeLogs` is empty — practice tracking always empty | Plan 09 | RM-29 (save flow is OK; history view broken) | Populate 4 records (spec in Plan 09 §3.3) |
| FIX-13 | callbackUrl open redirect vulnerability: `login-form.tsx` does not validate that `callbackUrl` is same-origin | Plan 01 | A-25 | Validate `callbackUrl` starts with `/` before using it as a redirect target |

### P2 — Major (fix before P2 scenario execution)

| ID | Issue | Source Plan | Note |
|----|-------|------------|------|
| FIX-14 | `mockFormSubmissions` has no `PENDING_TEACHER` status form | Plan 09 | Blocks ADM-08 |
| FIX-15 | `EventProduction.title` i18n object missing from `mockEvents[0]` | Plan 09 | Event details show Hebrew-only in all locales |
| FIX-16 | No `school_coordinator` user in mock data | Plan 09 | Blocks ADM-40 |
| FIX-17 | `mockAnnouncements` is empty | Plan 09 | Blocks ADM-20 verification |
| FIX-18 | `mockInstrumentRentals` is empty | Plan 09 | Blocks BF-28, BF-29, LC-43..LC-47 |
| FIX-19 | `mockLessonNotes` is empty — teacher note cross-persona visibility untestable | Plan 09 | Blocks INT-24 | Populate 2 lesson notes (spec in Plan 09 §3.5): one shared with student+parent, one private (studioNote) |
| FIX-20 | `mockEvents` has only 1 event and no event-ticket/booking records — event booking flow untestable | Plan 09 | Blocks INT-22 | Add 2–3 events (spec in Plan 09 §3.10); add mock event RSVP/ticket records |
| FIX-21 | No `FormTemplate` with `status: 'published'` in mock data — form template → submission pipeline untestable | Plan 09 | Blocks INT-14A, INT-14F | Add 1 published FormTemplate record (spec FIX-11 covers creation; ensure `status: 'published'` field) |
| FIX-22 | No `FormSubmission` seeded with `submittedBy` = teacher, type = `exam_registration` — INT-14C and INT-14D teacher isolation tests have no seed to work from | v1.2 | Blocks INT-14C, INT-14D | Add 2 exam_registration form records: one submitted by `teacher-user-1` for `student-user-1`, one by `teacher-user-2` for `student-user-2` |
| FIX-23 | ~~Ministry director queue filter in `approvals/page.tsx`~~ | ~~SDD-P5~~ | ~~Blocks INT-14F, INT-14K~~ | **REMOVED in v1.5.1** — Stakeholder confirmed that ministry seeing ALL approved forms is intentional. No filter needed. INT-14K demoted to P3-FUTURE. |
| FIX-24 | `COMPOSITION_SUBMISSION` and `SCHOLARSHIP_REQUEST` form types are defined in SDD-08 §2 and `INSTRUMENT_REQUEST` is teacher-only — none of these exist in `new-form.tsx` `formOptions` array; `CONFERENCE` type also missing for teacher/admin | SDD-08 | Blocks INT-14B–INT-14F for these types | Add missing standard form types to `new-form.tsx` `allStandardForms` array with correct role guards per SDD-08 §2: `COMPOSITION_SUBMISSION` (student), `SCHOLARSHIP_REQUEST` (student + parent — note: parent currently cannot create forms; this requires `canCreateForm` logic update too), `INSTRUMENT_REQUEST` (teacher), `CONFERENCE` (teacher + admin) |

### PM Review Blockers (v1.5) — FIX-25..FIX-32

> **Source:** `docs/plans/qa/11-pm-review.md` — PM review identified 8 blocking issues (B-01..B-08) that must be resolved before QA gate.

| ID | Issue | Source | Affected Scenarios | Fix / Note |
|----|-------|--------|-------------------|-----|
| FIX-25 | BF-06/BF-07 must be marked BLOCKED-STUB — cooling-off logic (`cancelPackageAction`) always returns `withinCoolingOff: true`; outside-cooling-off path is untestable | PM B-01, Plan 04 | BF-06, BF-07, LC-41 | Mark BF-06/BF-07 as `[BLOCKED-STUB]` in test results. Implement real date comparison using `purchasedAt` field (FIX-07 related). These scenarios cannot be claimed as passing until the implementation is production-ready. |
| FIX-26 | BF-18 (delete package) lacks confirmation dialog — admins can accidentally delete a package with active students enrolled | PM B-02, Plan 04 | BF-18 | Add `AlertDialog` confirmation to package delete action: "X students are currently on this package. Are you sure?" Must ship before billing GA. |
| FIX-27 | LC-20 (DSAR export) must be marked BLOCKED-STUB — "Export My Data" triggers a UI toast but no actual data export | PM B-03, Plan 08 | LC-20, INT-12, SEC-11 | Mark LC-20 as `[BLOCKED-STUB]`. Wire export button to a Server Action that collects all PII for `claims.uid` and returns a downloadable JSON/ZIP. Required for PDPPA Section 13 compliance. |
| FIX-28 | LC-41 (cooling-off check) must be marked BLOCKED-STUB — same root cause as FIX-25 | PM B-04, Plan 08 | LC-41 | Mark LC-41 as `[BLOCKED-STUB]`. Same fix as FIX-25/FIX-07. |
| FIX-29 | RM-21 (delete composition) lacks confirmation dialog — ministry director deleting a composition assigned to 200+ students causes silent data loss | PM B-05, Plan 05 | RM-21 | Add confirmation dialog: "This composition is assigned to X students. Confirm deletion?" Must ship before ministry repertoire GA. |
| FIX-30 | ADM-52 (ministry director billing access) — no explicit permission restriction test for compliance; ministry_director should receive "No permission" on `/dashboard/billing` | PM B-06, Plan 07 | ADM-52 (new) | Add explicit route guard test: ministry_director navigating to `/dashboard/billing` or `/dashboard/users` receives permission denial. Blocking for compliance. |
| FIX-31 | SB-18 banner color discrepancy — QA plan says `bg-blue-600` for tomorrow/later slots but CLAUDE.md project notes say `bg-indigo-500` | PM B-07, Plan 03 | SB-18 | Verify actual code in `slot-promotion-card.tsx`. The correct value per project memory is `bg-indigo-500` (tomorrow/upcoming). Update the scenario expected result accordingly. |
| FIX-32 | PP-58 (hreflang tags) — `<link rel="alternate" hreflang="xx">` tags missing for all 4 locales on the landing page; required for multi-language SEO | PM B-08, Plan 06 | PP-58 (new) | Add `hreflang` tags for `he`, `en`, `ar`, `ru` to the landing page `<head>`. Blocking for multi-language SEO before launch. |

### Security Review Findings (v1.5) — FIX-33..FIX-39

> **Source:** `docs/plans/qa/12-security-review.md` — Security Architect review identified 2 CRITICAL and 5 HIGH findings.

#### P0 — Critical (pre-launch blockers)

| ID | Issue | Finding | Affected Scenarios | Fix / Note |
|----|-------|---------|-------------------|-----|
| FIX-33 | DB-level security rules not deployed — all tenant isolation, RBAC, and parent-child isolation exist only in Server Actions code, not at the database layer. For **Supabase** (primary target): Row Level Security (RLS) policies must be defined and enabled on all tables. For **Firebase** (alternate): Firestore Security Rules must be deployed. Without DB-level rules, any authenticated user with direct DB access can bypass application-level RBAC. | FINDING-INFRA-01 (CRITICAL) | SEC-03, SEC-04, all cross-tenant tests | **Supabase path:** Define and enable RLS policies on all Supabase tables (users, lessons, forms, invoices, etc.) that enforce tenant isolation (`conservatoriumId` match) and role-based access. Verify with `supabase db test`. **Firebase path:** Deploy `firestore.rules` from repo template. Both paths: SEC-03/SEC-04 must pass. |
| FIX-34 | Storage-level security rules not deployed — practice videos, signed agreements, invoice PDFs, and profile photos rely on storage rules that exist in template but are not deployed. Prior audit found a rule draft allowing any teacher in the same conservatorium to read any student's feedback videos. | FINDING-INFRA-02 (CRITICAL) | SEC-01, all file-access tests | **Supabase path:** Configure Supabase Storage bucket policies with RLS to enforce per-user and per-role access. **Firebase path:** Deploy Firebase Storage Security Rules. Both paths: Fix the teacher-video isolation rule (store `teacherId` in file metadata at upload time). Ensure signed URLs are used for all download links. |

#### P1 — High (fix before public beta)

| ID | Issue | Finding | Affected Scenarios | Fix / Note |
|----|-------|---------|-------------------|-----|
| FIX-35 | `withAuth()` verifies authentication but NOT authorization — Server Actions wrapped with `withAuth()` alone are accessible to any authenticated user regardless of role. `saveConsentRecord` in `consent.ts:133` accepts arbitrary `userId` with no ownership check. | FINDING-AUTHZ-01, FINDING-AUTHZ-02 (HIGH) | SEC-02 | 1. `saveConsentRecord` must validate `data.userId === claims.uid` (or valid parental relationship for minor consent). 2. Audit ALL `withAuth()` calls — actions touching cross-user data must use `requireRole()` plus ownership checks. |
| FIX-36 | DSAR export is UI-only toast — `Export My Data` produces no actual data export (PDPPA Section 13 compliance gap) | FINDING-DATA-03 (HIGH) | LC-20, SEC-11, INT-12 | Wire export button to Server Action that collects all PII for `claims.uid` and returns downloadable JSON/CSV. Related to FIX-27. |
| FIX-37 | DSAR deletion request is UI-only — `Request Data Deletion` shows a destructive toast but does not trigger any backend purge job or tracked deletion request | FINDING-DATA-04 (HIGH) | LC-21 (delete request) | At minimum, create a Server Action that writes a `DELETION_REQUEST` entry to `ComplianceLog` with requester `uid`, timestamp, and reason. Fully automated purge job can come post-launch, but the request must be trackable. |
| FIX-38 | ComplianceLog audit trail not wired — only `saveConsentRecord` writes a compliance log entry (and that write is `non-fatal`). No other PII-accessing operation writes to the compliance log. PDPPA Information Security Regulations (Regulation 10) requires audit log of all access to sensitive data. | FINDING-INFRA-06 (HIGH) | SEC-11, LC-20, LC-21, LC-22 | Wire `ComplianceLog` writes to: every DSAR operation (export, deletion, consent withdrawal), every admin access to student PII, invoice downloads. |
| FIX-39 | `getConsentStatus` leaks another user's consent map — accepts `{ userId }` from caller with no ownership check; any authenticated user can retrieve any other user's consent status | FINDING-AUTHZ-03 (MEDIUM, but gate G-12) | SEC-02, LC-18 | Enforce `data.userId === claims.uid` inside the action, or allow admins/parents to query on behalf of linked users only. |

---

## 3. Execution Phases

Phases must be executed in order. A phase may not begin until its prerequisite phases have no P0/P1 failures.

### Phase 0 — Mock Data Population

**Prerequisites:** None
**Responsible:** Developer
**Acceptance:** All FIX-01 through FIX-05 resolved; `buildFullCoverageSeed()` factory function available

Actions:
1. Add mock data per Plan 09 §3.1–§3.14 specifications
2. Create `tests/factories/` directory with factories from Plan 09 §7
3. Verify `buildFullCoverageSeed()` returns non-empty arrays for all previously-empty entities
4. Run `npx vitest run tests/lib/db/memory-adapter.test.ts` — must pass

### Phase 1 — Unit Tests

**Prerequisites:** Phase 0 complete
**Tool:** Vitest
**Run:** `npx vitest run tests/`
**Acceptance:** 100% pass rate

| Test File | Scenarios |
|-----------|-----------|
| `tests/lib/auth-utils.test.ts` | Auth utility pure logic |
| `tests/lib/instrument-matching.test.ts` | Instrument matching |
| `tests/lib/db/memory-adapter.test.ts` | DB adapter CRUD |
| `tests/components/signature-capture.test.ts` | LC-50..LC-54 (new) |
| `tests/components/consent-checkboxes.test.ts` | LC-10..LC-15 (new) |
| `tests/components/registration-agreement.test.ts` | LC-58..LC-60 (new) |
| `tests/actions/consent.test.ts` | LC-16..LC-18 (new) |
| `tests/actions/billing.test.ts` | LC-40, LC-41 (new) |
| `tests/lib/vat.test.ts` | VAT rate verification (FIX-06) |
| `tests/lib/landing-page.test.ts` | Landing page unit tests |
| `tests/lib/i18n-landing-keys.test.ts` | i18n key completeness |

### Phase 2 — Smoke Tests

**Prerequisites:** Phase 1 complete
**Tool:** Playwright
**Run:** `npx playwright test --grep @smoke`
**Acceptance:** All ~100 smoke tests pass; no route returns 404 or 500

Coverage: All routes listed in `e2e/smoke.spec.ts` load without errors in `he` locale using dev bypass (site_admin).

### Phase 3 — Feature E2E Tests (by domain)

**Prerequisites:** Phase 2 complete
**Tool:** Playwright
**Run domain-by-domain; each must pass before next begins**

| Order | Domain | Run Command | Key Spec Files |
|-------|--------|-------------|----------------|
| 3.1 | Auth & Registration | `npx playwright test e2e/personas/` | `admin.spec.ts`, `student.spec.ts`, `teacher.spec.ts`, etc. |
| 3.2 | Dashboard & Navigation | `npx playwright test e2e/personas/` | All persona specs |
| 3.3 | Public Pages | `npx playwright test e2e/public/` | Landing, about, available-now |
| 3.4 | Legal & Compliance | `npx playwright test e2e/flows/consent-banner.spec.ts e2e/flows/dsar.spec.ts e2e/flows/privacy-page.spec.ts e2e/flows/rental-signing.spec.ts e2e/flows/enrollment-contract.spec.ts` | New specs needed |
| 3.5 | Scheduling & Booking | `npx playwright test e2e/flows/booking-flow.spec.ts e2e/flows/teacher-makeup.spec.ts e2e/available-now-to-book.spec.ts` | |
| 3.6 | Repertoire & Music | `npx playwright test e2e/flows/repertoire.spec.ts` | New spec needed |
| 3.7 | Billing & Financial | `npx playwright test e2e/flows/billing.spec.ts` | New spec needed |
| 3.8 | Admin Features | `npx playwright test e2e/flows/admin-approve-flow.spec.ts` | |

### Phase 4 — Cross-Feature Integration Tests

**Prerequisites:** Phase 3 complete (all domains pass)
**Tool:** Playwright
**Run:** `npx playwright test e2e/integration/`
**Spec files to create:** `e2e/integration/` directory (all INT- scenarios below)

See Section 7 for full scenario details.

### Phase 5 — Security Tests

**Prerequisites:** Phase 4 complete
**Tool:** Manual + automated (axe, OWASP ZAP lite)

| Check | Method |
|-------|--------|
| callbackUrl open redirect (FIX-13) | Automated: attempt `?callbackUrl=https://evil.com` |
| Auth bypass with forged headers | Manual: attempt to inject `x-user-role` without proxy |
| HMAC webhook validation | Unit test (BF-31..BF-35) |
| DSAR actions scoped to own user | Manual: attempt to call DSAR action with another user's ID |
| OTP single-use enforcement | LC-43 step: reuse OTP after verify |
| ConsentRecord immutability | Direct Firestore write attempt (staging only) |
| Admin conservatorium isolation | ADM-37: cons-15 admin cannot see cons-66 data |
| Server Actions `withAuth()` guards | LC-17: unauthenticated server action call |
| Role escalation via URL | ADM-36: non-admin navigating to `/dashboard/admin` routes |
| **SEC-01..SEC-12 (v1.5)** | **Full security test suite — see Section 7b for 12 scenario details** |
| **Security Gate Criteria G-01..G-21 (v1.5)** | **See Section 8.4..8.7 for tiered gate criteria** |

### Phase 6 — i18n + RTL Full Sweep

**Prerequisites:** Phase 3 complete
**Tool:** Playwright (locale matrix helper — see Section 4)

For each of the 4 locales (`he`, `en`, `ar`, `ru`), verify:
1. No `[NamespaceName.keyName]` placeholder text visible on any page
2. `dir="rtl"` set for `he` and `ar` on all page-level containers
3. All `<Link>` components use `@/i18n/routing` (not `<a href>`) — ESLint enforces this
4. Date formatting uses locale-aware date-fns locale
5. Currency always shows `₪` symbol with correct ILS formatting
6. RTL logical CSS classes used: `ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end` (not `ml-`, `mr-`, `text-left`, `text-right`)

Specific locale-critical scenarios: A-01, DN-77..DN-80, SB-03, SB-29, BF-40, RM-06, RM-47, RM-48..RM-49, LC-08, LC-31, LC-32, LC-35, PP-* locale matrix.

### Phase 7 — Mobile Responsive Sweep

**Prerequisites:** Phase 3 complete
**Viewports:** 375×667 (iPhone SE), 768×1024 (iPad), 1280×800 (desktop)

| Area | Check |
|------|-------|
| Landing page | Hero, stats bar, teacher cards, persona cards, testimonials all reflow correctly |
| Dashboard sidebar | Hamburger menu works; sidebar collapses on mobile |
| Book wizard | Tabs and form fields usable on 375px |
| Billing page | Tables scroll horizontally; not truncated |
| Slot promotion cards | Card grid reflows to 1 column |
| Cookie banner | Not obscuring content |

### Phase 8 — Performance + Accessibility Audit

**Prerequisites:** Phase 7 complete
**Tools:** Lighthouse CI, axe-core via Playwright

| Target | Lighthouse Score Target | axe Violations |
|--------|------------------------|----------------|
| Landing page (`/`) | Performance ≥ 80, A11y ≥ 95 | 0 critical |
| Dashboard home (`/dashboard`) | Performance ≥ 75, A11y ≥ 95 | 0 critical |
| Book wizard | A11y ≥ 90 | 0 critical |
| Privacy page | A11y ≥ 95 | 0 critical |
| Accessibility page | A11y ≥ 98 | 0 critical, 0 serious |

IS 5568 specific checks (Israeli accessibility standard):
- Cookie banner ARIA: `role=dialog`, `aria-labelledby`, `aria-describedby`
- Consent checkboxes: `aria-required`, `aria-invalid`, `aria-describedby`
- Signature canvas: `role=img`, `aria-label`
- Privacy/Accessibility tables: `<th scope>` attributes
- Error messages: `role=alert`

---

## 4. Shared Test Utilities

These utilities **must be implemented** before Phase 3 begins. Create in `tests/helpers/` or `e2e/helpers/`.

### 4.1 Locale Helper

```typescript
// e2e/helpers/locale.ts
// Run a Playwright test in all 4 locales
export const LOCALES = ['he', 'en', 'ar', 'ru'] as const;
export const RTL_LOCALES = ['he', 'ar'] as const;

export function localePath(locale: string, path: string): string {
  return locale === 'he' ? path : `/${locale}${path}`;
}

export async function runInAllLocales(
  page: Page,
  path: string,
  assertions: (locale: string) => Promise<void>
) {
  for (const locale of LOCALES) {
    await page.goto(localePath(locale, path));
    await assertions(locale);
  }
}
```

### 4.2 RTL Checker

```typescript
// e2e/helpers/rtl-checker.ts
export async function assertRtlLayout(page: Page, containerSelector = 'main') {
  const dir = await page.locator(containerSelector).getAttribute('dir');
  expect(dir).toBe('rtl');
}

export async function assertLtrLayout(page: Page, containerSelector = 'main') {
  const dir = await page.locator(containerSelector).getAttribute('dir');
  expect(['ltr', null]).toContain(dir); // null = inherits ltr from html
}

// Check that no ml-/mr-/pl-/pr-/text-left/text-right classes are used in key containers
export async function assertNoPhysicalCssInRtl(page: Page) {
  const violations = await page.evaluate(() => {
    const elements = document.querySelectorAll('[class]');
    const bad: string[] = [];
    elements.forEach(el => {
      const cls = el.className;
      if (/\b(ml-|mr-|pl-|pr-|text-left|text-right)\d/.test(cls)) {
        bad.push(`${el.tagName}#${el.id || '?'}: ${cls}`);
      }
    });
    return bad;
  });
  // Report violations but don't fail — some may be intentional
  if (violations.length > 0) {
    console.warn('Physical CSS classes found in RTL context:', violations);
  }
}
```

### 4.3 Auth Bypass Helper

```typescript
// e2e/helpers/auth.ts
// Dev bypass: proxy injects site_admin when FIREBASE_SERVICE_ACCOUNT_KEY absent
// To simulate a specific role, use the setUserRole helper

export type TestRole =
  | 'student' | 'teacher' | 'parent'
  | 'conservatorium_admin' | 'site_admin'
  | 'ministry_director' | 'school_coordinator' | 'delegated_admin';

// Sets the dev bypass persona via a test-only API endpoint
// (requires a test-only route /api/test/set-persona that only exists when NODE_ENV=test)
export async function setPersona(page: Page, role: TestRole, userId: string) {
  await page.request.post('/api/test/set-persona', {
    data: { role, userId },
  });
}

// Navigate to login with dev bypass active (works in local/staging with no auth credentials)
export async function loginAsDevUser(page: Page) {
  await page.goto('/dashboard');
  // Dev bypass auto-injects site_admin; just wait for dashboard to load
  await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 5000 });
}
```

### 4.4 Mock Data Factory Functions

Location: `tests/factories/`

| File | Factory Functions | Priority |
|------|------------------|----------|
| `user.factory.ts` | `makeUser`, `makeStudent`, `makeTeacher`, `makeParent`, `makeAdmin`, `makeSiteAdmin`, `makeMinistryDirector` | P0 |
| `lesson.factory.ts` | `makeLessonSlot`, `makeCompletedLesson`, `makeCancelledLesson`, `makeMakeupLesson` | P0 |
| `package.factory.ts` | `makePackage`, `makeExpiredPackage`, `makeTrialPackage` | P0 |
| `invoice.factory.ts` | `makeInvoice` | P1 |
| `form.factory.ts` | `makeFormSubmission` | P1 |
| `makeup-credit.factory.ts` | `makeMakeupCredit` | P0 |
| `memory-seed.factory.ts` | `buildFullCoverageSeed` | P0 |

Full factory implementations are specified in Plan 09 §7.

### 4.5 CardCom Webhook Test Helper

```typescript
// tests/helpers/cardcom-stub.ts
import { createHmac } from 'crypto';

export function buildCardcomPayload(secret: string, fields: Record<string, string>) {
  const body = new URLSearchParams(fields).toString();
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  return { body, sig };
}
```

### 4.6 Screenshot Comparison Helper

```typescript
// e2e/helpers/screenshot.ts
// Used for visual regression on RTL/LTR layout comparisons
export async function compareScreenshot(page: Page, name: string) {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    maxDiffPixelRatio: 0.02, // 2% tolerance
  });
}
```

### 4.7 localStorage Reset Helper

```typescript
// e2e/helpers/storage.ts
// Per CLAUDE.md: use evaluate to reset localStorage before first-visit tests
export async function clearCookieConsent(page: Page) {
  await page.evaluate(() => localStorage.removeItem('harmonia_cookie_consent'));
}

export async function setCookieConsent(page: Page, value: 'accepted' | 'rejected') {
  await page.evaluate((v) => localStorage.setItem('harmonia_cookie_consent', v), value);
}

export async function clearPendingSlot(page: Page) {
  await page.evaluate(() => sessionStorage.removeItem('pending_slot'));
}
```

---

## 5. Scenario Index

Format: `[ID] Scenario Name [DB] [LOCALE] [PRIORITY] [STUB]`

Tags:
- **DB:** `[MEMORY]` `[POSTGRES]` `[BOTH]`
- **Locale:** `[ALL-LOCALES]` `[HE-ONLY]` `[HE+AR]` `[HE+EN]` `[EN-ONLY]`
- **Priority:** `[P0-BLOCKER]` `[P1-CRITICAL]` `[P2-MAJOR]` `[P3-MINOR]`
- **Stub:** `[STUB:cardcom]` `[STUB:gemini]` `[STUB:ai-coach]` `[STUB:otp]`

### 5.1 Auth & Registration

See full details in `docs/plans/qa/01-auth-registration.md`.

| ID | Scenario Name | DB | Locale | Priority | Stub |
|----|--------------|-----|--------|----------|------|
| A-01 | Login page renders in all locales | BOTH | ALL-LOCALES | P1-CRITICAL | — |
| A-02 | Login form validation — empty fields | MEMORY | HE+EN | P1-CRITICAL | — |
| A-03 | Login form validation — invalid email format | MEMORY | HE | P2-MAJOR | — |
| A-04 | Login redirect preserves callbackUrl (same-origin only) | MEMORY | HE | P1-CRITICAL | — |
| A-05 | Logout redirects to `/` | MEMORY | HE | P1-CRITICAL | — |
| A-06 | Dev bypass auto-injects site_admin | MEMORY | HE | P0-BLOCKER | — |
| A-07 | Dev bypass absent → real auth provider required | POSTGRES | HE | P1-CRITICAL | — |
| A-08 | Registration page renders all locales | MEMORY | ALL-LOCALES | P1-CRITICAL | — |
| A-09 | Registration form — Israeli ID validation | MEMORY | HE | P1-CRITICAL | — |
| A-10 | Registration form — phone validation | MEMORY | HE | P2-MAJOR | — |
| A-11 | Registration form — consent checkboxes required | MEMORY | HE+EN | P1-CRITICAL | — |
| A-12 | Registration form — minor flag shows parental consent | MEMORY | HE | P1-CRITICAL | — |
| A-13 | Registration form — custom terms per conservatorium | MEMORY | HE+EN | P2-MAJOR | — |
| A-14 | Registration form — successful submission creates pending user | MEMORY | HE | P1-CRITICAL | — |
| A-15 | Playing school enrollment wizard — 5-step flow | MEMORY | HE | P1-CRITICAL | — |
| A-16 | Playing school wizard — contract signing step (step 5) | MEMORY | HE | P1-CRITICAL | — |
| A-17 | Playing school wizard — invalid token shows expired | MEMORY | HE+EN | P1-CRITICAL | — |
| A-18 | Invite acceptance — valid token creates account | MEMORY | HE | P1-CRITICAL | — |
| A-19 | Invite acceptance — expired token shows error | MEMORY | HE | P2-MAJOR | — |
| A-20 | Pending approval screen shown after registration | MEMORY | HE | P1-CRITICAL | — |
| A-21 | Forgot password flow | MEMORY | HE | P2-MAJOR | STUB:auth-provider |
| A-22 | Password strength indicator | MEMORY | HE | P3-MINOR | — |
| A-23 | Rate limiting on login attempts | POSTGRES | HE | P2-MAJOR | — |
| A-24 | Session expiry redirects to login | POSTGRES | HE | P1-CRITICAL | — |
| A-25 | callbackUrl validated as same-origin only (FIX-13) | MEMORY | HE | P0-BLOCKER | — |
| A-26 | Registration RTL layout (he, ar) | MEMORY | HE+AR | P2-MAJOR | — |
| A-27 | Login page back-to-home link | MEMORY | HE | P2-MAJOR | — |
| A-56 | Register with already-registered email — error toast with link to login | MEMORY | HE+EN | P1-CRITICAL | — |
| A-57 | Student first login after approval — walkthrough overlay shown, `markWalkthroughAsSeen()` called on dismiss | MEMORY | HE | P1-CRITICAL | — |
| A-58 | Under-13 registration flow — child DOB < 13 years → role = `STUDENT_UNDER_13`; parental consent step shown | MEMORY | HE | P1-CRITICAL | — |
| A-59 | Expired invite link — "Invitation Expired" card rendered; no registration form; link to contact conservatorium | MEMORY | HE+EN | P2-MAJOR | — |
| A-60 | Session expiry mid-navigation — next API call redirects to `/login?reason=session_expired` with message | POSTGRES | HE | P1-CRITICAL | — |

### 5.2 Dashboard & Navigation

See full details in `docs/plans/qa/02-dashboard-navigation.md`.

| ID | Scenario Name | DB | Locale | Priority | Stub |
|----|--------------|-----|--------|----------|------|
| DN-01..04 | Auth gate and redirect | MEMORY | HE | P0-BLOCKER | — |
| DN-05..10 | Dashboard root routing per role (6 roles) | MEMORY | HE | P1-CRITICAL | — |
| DN-11..13 | Sidebar nav admin groups | MEMORY | HE | P1-CRITICAL | — |
| DN-14..15 | Sidebar nav teacher groups | MEMORY | HE | P1-CRITICAL | — |
| DN-16..17 | Sidebar nav student groups | MEMORY | HE | P1-CRITICAL | — |
| DN-18..19 | Sidebar nav parent groups | MEMORY | HE | P1-CRITICAL | — |
| DN-20 | Sidebar nav ministry group | MEMORY | HE | P1-CRITICAL | — |
| DN-21 | Sidebar school_coordinator (FIX-16) | MEMORY | HE | P2-MAJOR | — |
| DN-22 | Sidebar delegated_admin scoping | MEMORY | HE | P2-MAJOR | — |
| DN-23..24 | Sidebar collapsible groups | MEMORY | HE | P2-MAJOR | — |
| DN-25 | Sidebar active state | MEMORY | HE | P2-MAJOR | — |
| DN-26..31 | Sidebar footer (notifications, What's New, settings, logout) | MEMORY | HE | P2-MAJOR | — |
| DN-32..35 | Header (search, language switcher, user menu) | MEMORY | ALL-LOCALES | P1-CRITICAL | — |
| DN-36..37 | Mobile sidebar hamburger | MEMORY | HE | P2-MAJOR | — |
| DN-38..40 | Deep-linking / direct URL access | MEMORY | HE | P2-MAJOR | — |
| DN-41..43 | Dashboard home page | MEMORY | HE+EN | P2-MAJOR | — |
| DN-44..45 | Profile page (student) | MEMORY | HE | P2-MAJOR | — |
| DN-46..47 | What's New feed | MEMORY | HE | P3-MINOR | — |
| DN-48..52 | Notifications page | MEMORY | HE | P2-MAJOR | — |
| DN-53..54 | Messages page | MEMORY | HE | P2-MAJOR | — |
| DN-55..62 | Settings main page | MEMORY | HE+EN | P1-CRITICAL | — |
| DN-63..64 | Settings notification preferences | MEMORY | HE | P2-MAJOR | — |
| DN-65..69 | Settings conservatorium sub-pages (admin) | MEMORY | HE | P2-MAJOR | — |
| DN-70 | Settings calendar sub-page (admin) | MEMORY | HE | P2-MAJOR | — |
| DN-71..76 | DSAR section (all roles) | MEMORY | HE+EN | P1-CRITICAL | — |
| DN-77..80 | RTL/LTR layout | MEMORY | HE+AR | P1-CRITICAL | — |
| DN-81 | Student dashboard — all-empty state (no lessons/logs/repertoire/messages: each widget shows empty-state CTA) | MEMORY | HE | P1-CRITICAL | — |
| DN-82 | Parent dashboard — all-empty state (no children enrolled: "Add your child" CTA shown) | MEMORY | HE | P1-CRITICAL | — |
| DN-83 | Notification bell badge clears after mark-all-read (count shows 0, badge disappears) | MEMORY | HE | P2-MAJOR | — |
| DN-84 | Logout redirects to `/` home, not `/login` | MEMORY | HE+EN | P1-CRITICAL | — |
| DN-85 | Parent navigates to `/dashboard/users` (admin-only page) — "No permission" message, no crash | MEMORY | HE | P1-CRITICAL | — |
| DN-86 | Mobile hamburger closes on outside-overlay click | MEMORY | HE | P2-MAJOR | — |

### 5.3 Scheduling & Booking

See full details in `docs/plans/qa/03-scheduling-booking.md`.

| ID | Scenario Name | DB | Locale | Priority | Stub |
|----|--------------|-----|--------|----------|------|
| SB-01 | Weekly calendar renders for student | MEMORY | HE+EN | P1-CRITICAL | — |
| SB-02 | Weekly calendar week navigation | MEMORY | HE+EN | P2-MAJOR | — |
| SB-03 | Weekly calendar RTL layout | MEMORY | HE+AR | P1-CRITICAL | — |
| SB-04 | Schedule view filters (teacher/instrument/room) | MEMORY | HE | P2-MAJOR | — |
| SB-05 | Schedule role scoping | MEMORY | HE | P1-CRITICAL | — |
| SB-06 | Schedule inaccessible without auth | MEMORY | HE | P0-BLOCKER | — |
| SB-07 | Book wizard page loads | MEMORY | HE+EN | P1-CRITICAL | — |
| SB-08 | Regular tab is default | MEMORY | HE | P2-MAJOR | — |
| SB-09 | Instrument selector shows student's instruments first | MEMORY | HE | P2-MAJOR | — |
| SB-10 | Teacher scope toggle (own vs all) | MEMORY | HE | P1-CRITICAL | — |
| SB-11 | Premium-only filter | MEMORY | HE | P2-MAJOR | — |
| SB-12 | Time slots load for selected teacher + date | MEMORY | HE | P1-CRITICAL | — |
| SB-13 | Booked slots excluded from time slots | MEMORY | HE | P1-CRITICAL | — |
| SB-14 | Package guard for student without package | MEMORY | HE+EN | P0-BLOCKER | — |
| SB-15 | Admin bypasses package guard | MEMORY | HE | P1-CRITICAL | — |
| SB-16 | Successful booking creates lesson | BOTH | HE | P1-CRITICAL | — |
| SB-17 | Deals tab activated via `?tab=deals` | MEMORY | HE+EN | P1-CRITICAL | — |
| SB-18 | Slot cards show correct urgency banner color | MEMORY | HE | P2-MAJOR | — |
| SB-19 | Deals tab instrument filter | MEMORY | HE | P2-MAJOR | — |
| SB-20 | Clicking slot card opens booking dialog | MEMORY | HE | P1-CRITICAL | — |
| SB-21 | Package credit disabled when no credits | MEMORY | HE | P1-CRITICAL | — |
| SB-22 | Book via promotional price | MEMORY | HE | P1-CRITICAL | — |
| SB-23 | Book via package credit | MEMORY | HE | P1-CRITICAL | — |
| SB-24 | pending_slot auto-opens dialog | MEMORY | HE | P1-CRITICAL | — |
| SB-25 | Teacher availability page access control | MEMORY | HE | P1-CRITICAL | — |
| SB-26 | Availability grid displays existing availability | MEMORY | HE | P1-CRITICAL | — |
| SB-27 | Availability grid toggle and save | BOTH | HE | P1-CRITICAL | — |
| SB-28 | Cannot toggle a booked slot | MEMORY | HE | P1-CRITICAL | — |
| SB-29 | Availability grid RTL day ordering | MEMORY | HE+AR | P2-MAJOR | — |
| SB-30 | Save re-merges consecutive slots | MEMORY | HE | P2-MAJOR | — |
| SB-31 | Makeups page: credit balance for student | MEMORY | HE+EN | P1-CRITICAL | — |
| SB-32 | Makeups page RTL layout | MEMORY | HE | P2-MAJOR | — |
| SB-33 | Book Makeup button disabled when zero credits | MEMORY | HE | P1-CRITICAL | — |
| SB-34 | Book Makeup button links to book wizard | MEMORY | HE | P2-MAJOR | — |
| SB-35 | Parent sees combined balance for all children | MEMORY | HE | P1-CRITICAL | — |
| SB-36..39 | Admin makeups dashboard | MEMORY | HE+EN | P2-MAJOR | — |
| SB-40..44 | Admin substitute management | MEMORY | HE+EN | P2-MAJOR | — |
| SB-45..49 | AI reschedule chat widget | MEMORY | ALL-LOCALES | P2-MAJOR | STUB:ai-coach |
| SB-50..54 | Master schedule (admin view) | MEMORY | HE+EN | P2-MAJOR | — |
| SB-55..60 | Available-Now public page | MEMORY | ALL-LOCALES | P1-CRITICAL | — |
| SB-61..65 | Available-Now → register → book pipeline | MEMORY | HE | P1-CRITICAL | — |
| SB-66 | Teacher cancels lesson from schedule — status → CANCELLED_TEACHER; student/parent notified; makeup credit issued | MEMORY | HE | P0-BLOCKER | — |
| SB-67 | Student attempts late reschedule (within `studentNoticeHoursRequired` window) — error message, reschedule blocked | MEMORY | HE | P1-CRITICAL | — |
| SB-68 | Makeup credit lifecycle E2E — teacher cancels → credit appears → student books makeup → balance decreases | BOTH | HE | P1-CRITICAL | — |
| SB-69 | Deal slot already taken (race condition) — booking dialog shows "slot taken" message | MEMORY | HE | P2-MAJOR | — |
| SB-70 | New user completes full registration then arrives at deals tab with pending_slot auto-opened | MEMORY | HE | P1-CRITICAL | — |
| SB-71 | Substitute assigned — cross-persona notifications (teacher-user-2 sees lesson in schedule; student receives notification) | MEMORY | HE | P1-CRITICAL | — |

### 5.4 Billing & Financial

See full details in `docs/plans/qa/04-billing-financial.md`.

| ID | Scenario Name | DB | Locale | Priority | Stub |
|----|--------------|-----|--------|----------|------|
| BF-01 | Student billing page renders package status | MEMORY | HE+EN | P1-CRITICAL | — |
| BF-02 | Admin billing page renders financial dashboard | MEMORY | HE+EN | P1-CRITICAL | — |
| BF-03 | Package upgrade dialog | MEMORY | HE+EN | P1-CRITICAL | STUB:cardcom |
| BF-04 | VAT display on billing page (18%) | MEMORY | ALL-LOCALES | P1-CRITICAL | — |
| BF-05 | Invoice PDF download via /api/invoice-pdf | MEMORY | HE-ONLY | P1-CRITICAL | — |
| BF-06 | Cancellation within 14-day cooling-off | MEMORY | HE | P1-CRITICAL | — |
| BF-07 | Cancellation outside 14-day cooling-off | MEMORY | HE | P1-CRITICAL | — |
| BF-08 | Pause subscription | MEMORY | HE+EN | P2-MAJOR | — |
| BF-09 | Parent billing — pending invoices and pay-now | MEMORY | HE+EN | P1-CRITICAL | STUB:cardcom |
| BF-10 | Parent billing — setup recurring payment | MEMORY | HE+EN | P2-MAJOR | STUB:cardcom |
| BF-11 | Admin payroll page renders | MEMORY | HE+EN | P1-CRITICAL | — |
| BF-12 | Teacher payroll — period filter and CSV export | MEMORY | HE+EN | P1-CRITICAL | — |
| BF-13 | Admin financial dashboard — revenue chart | MEMORY | HE+EN | P2-MAJOR | — |
| BF-14 | Admin financial dashboard — outstanding invoices | MEMORY | HE | P1-CRITICAL | — |
| BF-15 | Packages settings — create new package | MEMORY | HE+EN | P1-CRITICAL | — |
| BF-16 | Packages settings — edit existing package | MEMORY | HE | P1-CRITICAL | — |
| BF-17 | Packages settings — toggle active/inactive | MEMORY | HE | P2-MAJOR | — |
| BF-18 | Packages settings — delete package | MEMORY | HE | P2-MAJOR | — |
| BF-19 | Packages settings — premium package flag | MEMORY | HE+EN | P2-MAJOR | — |
| BF-20 | Pricing settings — access guard | MEMORY | HE | P2-MAJOR | — |
| BF-21 | Cancellation policy settings — access guard | MEMORY | HE | P2-MAJOR | — |
| BF-22 | Aid application wizard — 3-step | MEMORY | ALL-LOCALES | P1-CRITICAL | — |
| BF-23 | Aid application wizard — public route | MEMORY | HE+EN | P1-CRITICAL | — |
| BF-24 | Admin scholarships — approve | MEMORY | HE | P1-CRITICAL | — |
| BF-25 | Admin scholarships — reject | MEMORY | HE | P1-CRITICAL | — |
| BF-26 | Admin scholarships — mark paid | MEMORY | HE | P1-CRITICAL | — |
| BF-27 | Admin scholarships — add donation cause | MEMORY | HE | P2-MAJOR | — |
| BF-28 | Instrument rental — create with OTP/signature | MEMORY | HE | P1-CRITICAL | STUB:otp |
| BF-29 | Instrument rental — return | MEMORY | HE | P2-MAJOR | — |
| BF-30 | Instrument rental — inventory tab | MEMORY | HE | P2-MAJOR | — |
| BF-31 | CardCom webhook — valid HMAC success | BOTH | N/A | P1-CRITICAL | STUB:cardcom |
| BF-32 | CardCom webhook — invalid HMAC returns 401 | BOTH | N/A | P1-CRITICAL | STUB:cardcom |
| BF-33 | CardCom webhook — missing signature returns 401 | BOTH | N/A | P1-CRITICAL | STUB:cardcom |
| BF-34 | CardCom webhook — failed payment marks OVERDUE | BOTH | N/A | P1-CRITICAL | STUB:cardcom |
| BF-35 | CardCom webhook — missing invoiceId returns 400 | BOTH | N/A | P1-CRITICAL | STUB:cardcom |
| BF-36 | CardCom webhook — GET ping returns 200 | MEMORY | N/A | P2-MAJOR | STUB:cardcom |
| BF-37 | Playing school billing redirect | MEMORY | HE | P3-MINOR | — |
| BF-38 | Makeup credit balance on billing page | MEMORY | HE | P2-MAJOR | — |
| BF-39 | Package expiry warning notice | MEMORY | HE | P2-MAJOR | — |
| BF-40 | RTL layout billing pages | MEMORY | HE+AR | P2-MAJOR | — |
| BF-41 | Payment failure — user-visible error message in user's language; "Try another card" link shown | MEMORY | HE+EN | P1-CRITICAL | STUB:cardcom |
| BF-42 | Sibling discount — two children, discount applied to second child invoice; discount line item visible | MEMORY | HE | P1-CRITICAL | — |
| BF-43 | Package expired — post-expiry state: `validUntil` = yesterday → "Expired" badge; book lesson disabled | MEMORY | HE | P1-CRITICAL | — |
| BF-44 | Teacher payroll — zero lessons in period: "No lessons recorded for this period" shown | MEMORY | HE | P2-MAJOR | — |
| BF-45 | Delete package with active students — confirmation AlertDialog required (FIX-26) | MEMORY | HE | P0-BLOCKER | — |
| BF-46 | Webhook idempotency — second POST for same InternalDealNumber returns 200 but no duplicate PAID record | BOTH | N/A | P1-CRITICAL | STUB:cardcom |
| BF-47 | Installment payment — NumOfPayments=6 in webhook stores installment plan; billing page shows "6 installments" | BOTH | N/A | P1-CRITICAL | STUB:cardcom |

### 5.5 Repertoire & Music

See full details in `docs/plans/qa/05-repertoire-music.md`.

| ID | Scenario Name | DB | Locale | Priority | Stub |
|----|--------------|-----|--------|----------|------|
| RM-01 | Student views empty repertoire | MEMORY | HE | P1-CRITICAL | — |
| RM-02 | Student views assigned repertoire list | MEMORY | HE+EN | P1-CRITICAL | — |
| RM-03..05 | Sheet music viewer (no PDF, with PDF, fullscreen) | MEMORY | HE | P1-CRITICAL | — |
| RM-06 | Fullscreen viewer RTL (Arabic) | MEMORY | AR | P2-MAJOR | — |
| RM-07 | Teacher assigns repertoire — single student | MEMORY | HE | P1-CRITICAL | — |
| RM-08 | Teacher assigns — instrument group | MEMORY | HE | P1-CRITICAL | — |
| RM-09 | Instrument group falls back to single | MEMORY | HE | P2-MAJOR | — |
| RM-10 | Locale-aware composition title in assign dialog | MEMORY | RU | P2-MAJOR | — |
| RM-11 | Ministry director views repertoire list | MEMORY | HE | P1-CRITICAL | — |
| RM-12 | Ministry repertoire access control (teacher blocked) | MEMORY | HE | P1-CRITICAL | — |
| RM-13..16 | Ministry search, pagination, load more | MEMORY | HE+EN | P1-CRITICAL | — |
| RM-17..19 | Ministry add composition (partial and full locales) | MEMORY | HE | P1-CRITICAL | — |
| RM-20..21 | Ministry edit/delete composition | MEMORY | HE | P1-CRITICAL | — |
| RM-22 | Ministry approved toggle | MEMORY | HE | P2-MAJOR | — |
| RM-23 | Auto-translate — stub (no API key) | MEMORY | HE | P1-CRITICAL | STUB:gemini |
| RM-24 | Auto-translate — success | MEMORY | HE | P2-MAJOR | STUB:gemini |
| RM-25..26 | Locale display + back link | MEMORY | HE+EN | P2-MAJOR | — |
| RM-27 | Library page under-construction state | MEMORY | HE+EN | P3-MINOR | — |
| RM-28..33 | Practice log form (student, parent) | MEMORY | HE | P2-MAJOR | — |
| RM-34 | Video upload page renders | MEMORY | HE | P2-MAJOR | — |
| RM-35..36 | AI practice coach stub UI | MEMORY | HE | P2-MAJOR | STUB:ai-coach |
| RM-37 | Student practice panel | MEMORY | HE | P2-MAJOR | — |
| RM-38 | Teacher performance profile access | MEMORY | HE | P2-MAJOR | — |
| RM-39 | Teacher reports access | MEMORY | HE | P2-MAJOR | — |
| RM-40..46 | Exam tracker CRUD | MEMORY | HE | P2-MAJOR | — |
| RM-47 | Exam tracker date locale | MEMORY | EN+RU | P2-MAJOR | — |
| RM-48..49 | Locale fallback + RTL (Arabic) | MEMORY | AR | P2-MAJOR | — |
| RM-50..51 | Dialog reset + pagination reset | MEMORY | HE | P3-MINOR | — |
| RM-52 | Teacher updates assigned piece status to PERFORMANCE_READY — student sees badge update; parent sees same | MEMORY | HE | P1-CRITICAL | — |
| RM-53 | Parent views child's practice log — sees log entries and teacher notes; cannot submit (read-only) | MEMORY | HE | P1-CRITICAL | — |
| RM-54 | Practice streak — 7-day achievement trigger: student submits 7 consecutive days → `PRACTICE_STREAK_7` awarded | MEMORY | HE | P2-MAJOR | — |
| RM-55 | Delete composition — confirmation dialog required: "This composition is assigned to X students. Confirm deletion?" (FIX-29) | MEMORY | HE | P0-BLOCKER | — |
| RM-56 | Practice log — retroactive date (within policy): yesterday accepted; > 30 days ago rejected | MEMORY | HE | P2-MAJOR | — |
| RM-57 | Composition search — Hebrew diacritic insensitivity: searching "ב" matches "בּ" in title | MEMORY | HE | P2-MAJOR | — |

### 5.6 Public Pages

See full details in `docs/plans/qa/06-public-pages.md`.

| ID | Scenario Name | DB | Locale | Priority | Stub |
|----|--------------|-----|--------|----------|------|
| PP-01..12 | Landing page sections (hero, stats, search, how-it-works, teachers, personas, events, testimonials, donate, multi-locale, SEO, mobile) | MEMORY | ALL-LOCALES | P1-CRITICAL | — |
| PP-13..18 | Cookie consent banner | MEMORY | HE+EN | P1-CRITICAL | — |
| PP-19..28 | About / conservatorium directory | MEMORY | ALL-LOCALES | P1-CRITICAL | — |
| PP-29..38 | Conservatorium public profile pages | MEMORY | HE+EN | P1-CRITICAL | — |
| PP-39..44 | Contact page | MEMORY | HE+EN | P2-MAJOR | — |
| PP-45..50 | Donate page | MEMORY | HE+EN | P2-MAJOR | STUB:cardcom |
| PP-51..56 | Open Day public page | MEMORY | HE+EN | P2-MAJOR | — |
| PP-57..62 | Available Now / slot marketplace | MEMORY | ALL-LOCALES | P1-CRITICAL | — |
| PP-63 | Conservatorium profile — no upcoming events: "No upcoming events" placeholder, no crash | MEMORY | HE | P2-MAJOR | — |
| PP-64 | Teacher card — no profile photo: initials avatar fallback rendered; no broken image | MEMORY | HE | P2-MAJOR | — |
| PP-65 | hreflang tags in landing page `<head>` — `<link rel="alternate" hreflang="xx">` for all 4 locales (FIX-32) | MEMORY | ALL-LOCALES | P0-BLOCKER | — |
| PP-66 | Contact form — API call verification: submit form; verify POST to `/api/contact` is made, not just toast | MEMORY | HE | P2-MAJOR | — |

### 5.7 Admin Features

See full details in `docs/plans/qa/07-admin-features.md`.

| ID | Scenario Name | DB | Locale | Priority | Stub |
|----|--------------|-----|--------|----------|------|
| ADM-01 | Admin command center stats | MEMORY | HE+EN | P1-CRITICAL | — |
| ADM-02 | User management tabs and search | MEMORY | HE | P1-CRITICAL | — |
| ADM-03 | Approve pending user | BOTH | HE+EN | P1-CRITICAL | — |
| ADM-04 | Reject pending user with reason | MEMORY | HE | P1-CRITICAL | — |
| ADM-05 | Edit user profile | MEMORY | HE+EN | P1-CRITICAL | — |
| ADM-06 | Premium teacher toggle | MEMORY | HE | P2-MAJOR | — |
| ADM-07 | Admin enrollment wizard | MEMORY | HE+EN | P1-CRITICAL | — |
| ADM-08 | Approvals queue — teacher approves | MEMORY | HE | P1-CRITICAL | — |
| ADM-09 | Approvals queue — admin signs | BOTH | HE+EN | P1-CRITICAL | — |
| ADM-10 | Approvals queue — bulk approve | MEMORY | HE | P1-CRITICAL | — |
| ADM-11 | Approvals queue — request revision | MEMORY | HE | P2-MAJOR | — |
| ADM-12 | Ministry director final approval | MEMORY | HE | P1-CRITICAL | — |
| ADM-13 | Ministry director request changes | MEMORY | HE | P2-MAJOR | — |
| ADM-14 | Ministry dashboard filtering | MEMORY | HE+EN | P1-CRITICAL | — |
| ADM-15 | Ministry export CSV | MEMORY | HE | P1-CRITICAL | — |
| ADM-16 | Ministry export — empty state guard | MEMORY | HE | P2-MAJOR | — |
| ADM-17 | Event create | MEMORY | HE+EN | P1-CRITICAL | — |
| ADM-18 | Event edit | MEMORY | HE | P2-MAJOR | — |
| ADM-19 | Event detail view | MEMORY | HE+EN | P2-MAJOR | — |
| ADM-20 | Announcements — compose and send | MEMORY | HE+AR | P2-MAJOR | — |
| ADM-21 | Form builder — create custom template | MEMORY | HE | P2-MAJOR | — |
| ADM-22 | Open Day management | MEMORY | HE+AR | P2-MAJOR | — |
| ADM-23 | Waitlists management | MEMORY | HE | P2-MAJOR | — |
| ADM-24 | Substitute management (→ see also SB-42..44) | MEMORY | HE | P2-MAJOR | — |
| ADM-25 | Branches management | MEMORY | HE | P2-MAJOR | — |
| ADM-26 | Performances booking dashboard | MEMORY | HE+AR | P2-MAJOR | — |
| ADM-27 | Notifications — send system notification | MEMORY | HE | P2-MAJOR | — |
| ADM-28 | Notification audit log | MEMORY | HE | P3-MINOR | — |
| ADM-29 | Ministry inbox (admin side) | MEMORY | HE | P2-MAJOR | — |
| ADM-30 | Playing school admin dashboard | MEMORY | HE | P2-MAJOR | — |
| ADM-31 | Playing school token distribution | MEMORY | HE+EN | P2-MAJOR | — |
| ADM-32 | Forms list — role-aware visibility | MEMORY | HE | P1-CRITICAL | — |
| ADM-33 | Forms list — tab filtering | MEMORY | HE | P2-MAJOR | — |
| ADM-34 | Form detail — download PDF | MEMORY | HE | P2-MAJOR | — |
| ADM-35 | Form detail — custom template display | MEMORY | HE+EN | P2-MAJOR | — |
| ADM-36 | Role-based access guard (non-admin blocked) | MEMORY | HE | P0-BLOCKER | — |
| ADM-37 | Conservatorium admin scope isolation | MEMORY | HE | P0-BLOCKER | — |
| ADM-38 | Site admin cross-conservatorium view | MEMORY | HE | P1-CRITICAL | — |
| ADM-39 | RTL layout correctness for admin pages | MEMORY | HE+AR+EN | P1-CRITICAL | — |
| ADM-40 | School coordinator dashboard | MEMORY | HE | P2-MAJOR | — |
| ADM-51 | Admin marks lesson complete on behalf of teacher — status → COMPLETED; credit balance decremented | MEMORY | HE | P1-CRITICAL | — |
| ADM-52 | Ministry director cannot access `/dashboard/billing` — "No permission" page; no financial data exposed (FIX-30) | MEMORY | HE | P0-BLOCKER | — |
| ADM-53 | Broadcast announcement appears in student/parent notification feed (cross-persona verification) | MEMORY | HE | P1-CRITICAL | — |
| ADM-54 | Playing school E2E: student enrollment (all 6 steps) + admin receives registration in dashboard | MEMORY | HE | P1-CRITICAL | — |
| ADM-55 | Command center — zero-data state: new conservatorium with no students/lessons; all stats show "0", no null errors | MEMORY | HE | P2-MAJOR | — |

### 5.8 Legal & Compliance

See full details in `docs/plans/qa/08-legal-compliance.md`.

| ID | Scenario Name | DB | Locale | Priority | Stub |
|----|--------------|-----|--------|----------|------|
| LC-01..05 | Cookie banner first-visit, accept, reject, reload state | MEMORY | HE+EN | P1-CRITICAL | — |
| LC-06..07 | Cookie banner persistence across navigation | MEMORY | HE | P1-CRITICAL | — |
| LC-08..09 | Cookie banner RTL + ARIA | MEMORY | HE+AR | P1-CRITICAL | — |
| LC-10..15 | Consent checkboxes (adult/minor, validation, ARIA) | MEMORY | HE+EN | P1-CRITICAL | — |
| LC-16..18 | Consent server actions (save, auth guard, parental) | MEMORY | HE | P1-CRITICAL | — |
| LC-19..25 | DSAR section (all roles, export, delete, withdraw) | MEMORY | HE+EN | P1-CRITICAL | — |
| LC-26..32 | Privacy page (all sections, sub-processors, retention, RTL) | MEMORY | ALL-LOCALES | P1-CRITICAL | — |
| LC-33..35 | Accessibility page (all sections, locales) | MEMORY | HE+EN | P1-CRITICAL | — |
| LC-36..39 | Cancellation settings (auth guard, validation, save) | MEMORY | HE | P2-MAJOR | — |
| LC-40..41 | cancelPackageAction (mark inactive, cooling-off) | MEMORY | HE | P1-CRITICAL | — |
| LC-42..49 | Rental signing flow (steps 1–4, OTP, errors) | MEMORY | HE+EN | P1-CRITICAL | STUB:otp |
| LC-50..54 | SignatureCapture (empty guard, clear, hash, ARIA, RTL) | MEMORY | HE+EN | P1-CRITICAL | — |
| LC-55..57 | Enrollment wizard step 5 contract signing | MEMORY | HE | P1-CRITICAL | — |
| LC-58..60 | RegistrationAgreement (custom addendum, default, admin-preview) | MEMORY | HE+EN | P2-MAJOR | — |
| LC-61 | DSAR export — actual file delivery: download starts, ZIP/JSON contains user's personal data records (FIX-27) | MEMORY | HE | P0-BLOCKER | — |
| LC-62 | Consent version bump — existing consent user sees cookie banner again when `consent_version` increments | MEMORY | HE | P1-CRITICAL | — |
| LC-63 | Signature audit record written to DB — query DB after signing: record exists with `signedAt`, `signatureHash`, `documentHash` | MEMORY | HE | P1-CRITICAL | — |
| LC-64 | Cancellation policy applied to next cancellation — save policy (4 hours notice) → student cancels within 4 hours → system blocks | MEMORY | HE | P1-CRITICAL | — |
| LC-65 | Minor consent withdrawal — downstream restrictions: parent withdraws → child's practice video upload and messaging disabled | MEMORY | HE | P1-CRITICAL | — |
| LC-66 | Privacy page Arabic locale — RTL and legal terminology correctly rendered at `/ar/privacy` | MEMORY | AR | P1-CRITICAL | — |

---

## 6. Deduplication Map

The following scenarios appear in multiple domain plans. The canonical location is specified; other plans reference back to it.

| Topic | Canonical Plan | Canonical IDs | Referenced By |
|-------|--------------|---------------|---------------|
| DSAR section on settings page | Legal (Plan 08) | LC-19..LC-25 | Dashboard (Plan 02) DN-71..DN-76 — **use LC- IDs** |
| Cancellation billing action | Legal (Plan 08) | LC-40..LC-41 | Billing (Plan 04) BF-06..BF-07 — **run both; LC tests pure action, BF tests full UI flow** |
| Cookie banner | Legal (Plan 08) | LC-01..LC-09 | Public (Plan 06) PP-13..PP-18 — **use LC- IDs** |
| Substitute management | Scheduling (Plan 03) | SB-40..SB-44 | Admin (Plan 07) ADM-24 — **use SB- IDs; ADM-24 is a smoke-level re-check** |
| Available-Now marketplace | Scheduling (Plan 03) | SB-55..SB-60 | Public (Plan 06) PP-57..PP-62 — **use SB- IDs; PP tests public nav wrapper** |
| Consent checkboxes | Legal (Plan 08) | LC-10..LC-15 | Auth (Plan 01) A-11..A-12 — **use LC- for component tests; A- for full registration E2E** |
| SignatureCapture | Legal (Plan 08) | LC-50..LC-54 | Admin (Plan 07) ADM-09 — **use LC- for component tests; ADM-09 for admin approval flow** |
| Admin form approval (teacher stage) | Admin (Plan 07) | ADM-08 | Auth (Plan 01) — **use ADM- IDs** |
| Ministry director final approval | Admin (Plan 07) | ADM-12 | Repertoire (Plan 05) INT-05 — **ADM-12 = UI test; INT-05 = integration cross-check** |
| Full form lifecycle (cross-persona) | Integration (this doc) | INT-14A..INT-14I, INT-14b, INT-18, INT-23 | Admin (Plan 07) ADM-08..ADM-13, ADM-21, ADM-32..ADM-35 — **ADM- IDs = isolated domain tests; INT-14x IDs = end-to-end with all personas and form types** |
| Announcement targeting | Integration (this doc) | INT-20, INT-24 | Admin (Plan 07) ADM-20, ADM-27 — **ADM-20/27 = send-side only; INT-20/24 = full cross-persona receive verification** |
| Lesson notes cross-persona visibility | Integration (this doc) | INT-21, INT-22 | No existing domain plan covers the receive side — INT- scenarios are the only coverage |
| VAT calculation | Billing (Plan 04) | BF-04 | All locales in BF-04 cover ALL-LOCALES; Phase 1 unit test in `tests/lib/vat.test.ts` |

---

## 7. Cross-Feature Integration Tests

These scenarios require **multiple domains to be functional simultaneously** and cannot be covered by any single domain plan. They are gated on Phase 3 completing cleanly.

**Location:** `e2e/integration/`

### INT-01 — Registration → Admin Approval → First Login → Dashboard

**Domains:** Auth + Admin
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None

**Flow:**
1. New user completes registration form (A-14 pre-condition)
2. User sees "Pending approval" screen (A-20)
3. Admin logs in → navigates to `/dashboard/users?tab=pending` → approves the user (ADM-03)
4. Approved user logs in again
5. User lands on their role-appropriate dashboard page (DN-05..10)

**Expected:** Registration → approval → login → correct dashboard all work as a chain without data loss between steps.

---

### INT-02 — Booking → Package Deduction → Schedule Update

**Domains:** Scheduling + Billing
**DB:** BOTH
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None

**Flow:**
1. `student-user-1` has `pkg-active-1` (PACK_10, usedCredits=3)
2. Student books a lesson (SB-16)
3. Navigate to `/dashboard/billing` — verify package `usedCredits` is now 4
4. Navigate to `/dashboard/schedule` — new lesson block is visible
5. Navigate to `/dashboard/billing` — invoice created for the new lesson

**Expected:** Single booking action atomically updates package credit count, lesson schedule, and billing.

---

### INT-03 — Admin Changes User Role → User's Sidebar Changes

**Domains:** Admin + Dashboard
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None

**Flow:**
1. `student-user-1` logged in; sidebar shows student navigation groups (DN-16..17)
2. Admin changes `student-user-1` role to `teacher` (ADM-05)
3. `student-user-1` logs out and logs back in (or session refreshes)
4. Sidebar now shows teacher navigation groups (DN-14..15)
5. Student routes (`/dashboard/student/repertoire`) are no longer in sidebar

**Expected:** Role change is immediately reflected in navigation after re-auth.

---

### INT-04 — Teacher Sets Availability → Student Sees Slots → Books → Both See Lesson

**Domains:** Scheduling (availability) + Scheduling (booking) + Dashboard
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None

**Flow:**
1. `teacher-user-2` has NO availability set
2. Teacher logs in → `/dashboard/teacher/availability` → adds MON 10:00–12:00 → saves (SB-27)
3. Student logs in → book wizard → selects `teacher-user-2` → picks next Monday
4. Time slots 10:00 and 11:00 are visible; student books the 10:00 slot (SB-16)
5. Student navigates to `/dashboard/schedule` → new lesson block visible on Monday 10:00
6. Teacher logs back in → navigates to `/dashboard/schedule` → **same lesson block visible on their schedule**
7. Teacher's 10:00 slot is now marked as booked in the availability grid (SB-28)

**Expected:** Availability → booking → both personas' schedules updated; booked slot no longer togglable in availability grid.

---

### INT-05 — Ministry Approves Composition → Appears in Student Repertoire Assignment

**Domains:** Repertoire + Admin
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None

**Flow:**
1. Ministry director adds a new composition with `approved: false` (RM-17 but with approved OFF)
2. Ministry director edits the composition → toggles `approved: ON` (RM-22)
3. Teacher opens `AssignRepertoireDialog` → searches for the newly approved composition
4. Composition appears in search results
5. Teacher assigns to `student-user-1` (RM-07)
6. Student navigates to `/dashboard/student/repertoire` → new piece visible (RM-02)

**Expected:** Approval status gates composition visibility; assignment propagates to student view.

---

### INT-06 — Parent Books Lesson for Child → Child, Parent, and Teacher All See Lesson

**Domains:** Scheduling + Dashboard (parent + student + teacher personas)
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None

**Flow:**
1. `parent-user-1` (childIds: [student-user-1, student-user-2]) logs in
2. Parent navigates to book wizard → selects student-user-1 as the student → completes booking with `teacher-user-1`
3. Parent navigates to schedule → lesson visible labelled with student-user-1's name
4. `student-user-1` logs in → navigates to schedule → same lesson visible in their own schedule
5. `student-user-2` logs in → navigates to schedule → lesson NOT visible (belongs to sibling)
6. `teacher-user-1` logs in → navigates to `/dashboard/schedule` → lesson visible as a booking on their calendar

**Expected:** Booking by parent creates lesson scoped to child; schedule filters correctly per viewer; teacher also sees the new appointment on their calendar.

---

### INT-07 — Cancellation → Makeup Credit → Booking with Credit

**Domains:** Scheduling + Billing
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None

**Flow:**
1. Teacher cancels lesson (lesson-16 `CANCELLED_TEACHER` pre-exists; or admin marks cancelled)
2. Makeup credit appears for `student-user-1` on `/dashboard/makeups` (SB-31)
3. Student clicks "Book Makeup Lesson" → navigates to book wizard with `?type=makeup`
4. Student completes booking using makeup credit (SB-23 flow)
5. Makeup credit status changes from AVAILABLE → REDEEMED
6. Makeup balance on `/dashboard/billing` decrements by 1

**Expected:** Cancellation → credit generation → credit redemption forms a coherent chain.

---

### INT-08 — Cookie Consent Accepted → Analytics Permitted; Rejected → Analytics Blocked

**Domains:** Legal + Public Pages
**DB:** MEMORY
**Locale:** HE
**Priority:** P2-MAJOR
**Stub:** None

**Flow:**
1. Clear localStorage; navigate to `/`; accept cookie banner (LC-02)
2. Verify `harmonia_cookie_consent = 'accepted'` in localStorage
3. Navigate to several pages; verify no CORS errors or blocked analytics calls (analytics may be stub in dev)
4. Reload with `'rejected'` value; navigate same pages
5. Verify that any analytics events that check consent do NOT fire when `'rejected'`

**Expected:** Cookie consent value gates downstream analytics/tracking behavior.

---

### INT-09 — Invoice Payment → Invoice Status Update → PDF Available

**Domains:** Billing
**DB:** BOTH
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** STUB:cardcom

**Flow:**
1. Invoice `inv-2` has status SENT
2. Send CardCom webhook POST with valid HMAC, `ReturnValue=inv-2`, `ResponseCode=0` (BF-31)
3. HTTP 200 returned; invoice status is now PAID, `paidAt` set
4. Student navigates to `/dashboard/billing` — invoice row shows PAID badge
5. Student clicks download icon → `/api/invoice-pdf/inv-2` returns 200 with HTML

**Expected:** Webhook → DB update → UI update → PDF download are all linked correctly.

---

### INT-10 — Enrollment → Conservatorium Data Complete → Teacher Cards Show

**Domains:** Public Pages + Auth
**DB:** MEMORY
**Locale:** HE
**Priority:** P2-MAJOR
**Stub:** None

**Flow:**
1. Unauthenticated visitor navigates to `/about` → finds conservatorium (cons-15 Hoд Ha-Sharon)
2. Clicks on conservatorium → public profile page shows director teacher cards
3. Clicks "Book trial lesson" CTA on a teacher card (about page CTA)
4. `pending_slot` set; redirected to `/register?teacher=X&conservatorium=cons-15`
5. Completes registration
6. Pending approval screen shown

**Expected:** Public directory → teacher CTA → enrollment pipeline is coherent.

---

### INT-11 — Admin Role-Change Security: Conservatorium Scoping Preserved

**Domains:** Admin + Security
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None

**Flow:**
1. Admin for cons-15 (`admin-user-1`) is logged in
2. Attempts to access a user from cons-66 via direct URL (e.g., `/dashboard/users/student-user-6`)
3. Attempts to edit a form from cons-66 via direct URL
4. Verifies that both return access-denied or redirect, not the cons-66 data

**Expected:** Conservatorium scoping is enforced at the data layer, not just in the UI.

---

### INT-12 — DSAR Data Export Contains All User Data

**Domains:** Legal + Dashboard
**DB:** MEMORY
**Locale:** HE
**Priority:** P2-MAJOR
**Stub:** None

**Flow:**
1. `student-user-1` is logged in; has packages, invoices, practice logs, assigned repertoire, makeup credits
2. Student navigates to `/dashboard/settings` → clicks "Export My Data"
3. Toast confirms export (LC-20); when backend wired, verify downloaded JSON contains all entity types
4. Verify no other user's data appears in the export

**Expected:** DSAR export is scoped to the requesting user's own data.

---

### INT-13 — Playing School Enrollment → Playing School Admin Dashboard

**Domains:** Auth + Admin
**DB:** MEMORY
**Locale:** HE
**Priority:** P2-MAJOR
**Stub:** None

**Flow:**
1. New user completes playing school enrollment wizard (A-15, A-16) via token `ps-token-test`
2. User is created with `accountType: 'PLAYING_SCHOOL'`
3. Conservatorium admin navigates to `/dashboard/admin/playing-school`
4. New playing school student appears in the student count KPI

**Expected:** Enrollment creates a correctly-typed account that appears in the admin dashboard.

---

---

## Forms Lifecycle — P0 Cross-Feature Section (INT-14A..INT-14K)

> **Authoritative source (v1.5.1):** SDD-08 §2 (form types and creators), SDD-P5 §3.2 (ministry inbox), SDD-FIX-06 (events admin-only). All previous stakeholder corrections that contradicted SDD are resolved in favour of the SDD. Ministry form visibility clarified in v1.5.1: ministry sees ALL approved forms (stakeholder-confirmed). See conflict resolutions below.

### Conflict resolutions (v1.4)

| Stakeholder instruction | SDD verdict | Plan action |
|-------------------------|-------------|-------------|
| "Students cannot create recital forms" | SDD-08 §2 explicitly lists Student as a valid submitter of RECITAL forms. Current code (`new-form.tsx:140`) matches SDD. | **No change.** INT-14B (student creates recital) and INT-14J Path A are correct as written. |
| "Ministry only sees recital/event forms" | ~~SDD-P5 §3.2 defines the ministry queue by `requiresMinistryApproval: true` flag.~~ **v1.5.1 stakeholder clarification:** Ministry seeing ALL approved forms is intentional for now. No filter needed. | **FIX-23 removed in v1.5.1.** INT-14K demoted to P3-FUTURE. INT-14F Part C updated — ministry sees all approved forms without filtering. |
| "Teachers can create events" | SDD-FIX-06 does not list teachers as event creators. Events are admin-created only. | **No change.** INT-19 admin-creates-event is correct. |

### Authoritative form type matrix (SDD-08 §2)

| Form Type | Hebrew | Valid Submitters | Initial Status | Approval Chain | Ministry involved? |
|-----------|--------|-----------------|----------------|----------------|--------------------|
| `RECITAL` | טופס נגינה | Student / Teacher / **Admin** (on behalf of student) (/ Parent on child's behalf — FIX-24) | Student → `PENDING_TEACHER`; Teacher/Admin → `PENDING_ADMIN` | → Teacher → Admin | No |
| `CONFERENCE` | כנס / אירוע | Teacher / Admin | `PENDING_ADMIN` | → Admin | No |
| `EXAM_REGISTRATION` | הרשמה לבחינה | Teacher | `PENDING_ADMIN` | → Admin → Ministry Export | Yes (`requiresMinistryApproval: true`) |
| `COMPOSITION_SUBMISSION` | הגשת יצירה | Student | `PENDING_TEACHER` | → Teacher → Admin | Yes (optional export) |
| `SCHOLARSHIP_REQUEST` | בקשת מלגה | Student / Parent | Student → `PENDING_TEACHER`(?); Parent → `PENDING_ADMIN` | → Admin → Committee | No |
| `INSTRUMENT_REQUEST` | בקשת כלי נגינה | Teacher | `PENDING_ADMIN` | → Admin | No |
| `CUSTOM` | מותאם אישית | Configurable | Configurable | Configurable | Configurable |

> **Implementation gap (FIX-24):** Only `RECITAL`, `KENES` (conference), and `EXAM_REGISTRATION` exist in `new-form.tsx`. `COMPOSITION_SUBMISSION`, `SCHOLARSHIP_REQUEST`, `INSTRUMENT_REQUEST`, and `CONFERENCE` (as a distinct type) are SDD-defined but not yet built. Scenarios for these types are marked `[STUB — FIX-24 required]`.

### Current as-built form creation rights (from `new-form.tsx` and `forms/page.tsx`)

| Role | Can create forms? | Initial status | Form types currently available in UI |
|------|------------------|----------------|---------------------------------------|
| `student` | Yes | `PENDING_TEACHER` | recital, kenes, custom templates |
| `teacher` | Yes | `PENDING_ADMIN` | recital, kenes, exam_registration, custom templates |
| `conservatorium_admin` | Yes | `PENDING_ADMIN` | recital, kenes, exam_registration, custom templates |
| `site_admin` | Yes | `PENDING_ADMIN` | recital, kenes, exam_registration, custom templates |
| `parent` | No — "New Form" button absent | N/A | read-only viewer of child's forms (FIX-24: parent SHOULD be able to create RECITAL and SCHOLARSHIP_REQUEST per SDD) |
| `ministry_director` | No | N/A | approver only |

### Summary of form visibility (as-built from `forms-list.tsx`)

| Role | Forms visible in `/dashboard/forms` |
|------|-------------------------------------|
| `conservatorium_admin` / `delegated_admin` | All forms with matching `conservatoriumId` |
| `teacher` | Forms where `teacherId === user.id` OR `formData.assignedToTeacherId === user.id` |
| `student` | Forms where `submittedBy === user.id` OR `studentId === user.id` |
| `parent` | Forms where `submittedBy === user.id` OR `studentId` is one of `user.childIds` |
| `ministry_director` | All forms with `status === 'APPROVED'` (ministry sees all approved forms — confirmed intentional by stakeholder v1.5.1) |

---

### INT-14A — Admin Creates Custom Form Template → Template Appears in All Eligible Submitters' New Form Selector

**Domains:** Admin + Auth (student, teacher)
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None
**Mock data required:** FIX-11 (at least one published FormTemplate), FIX-21

**Flow:**
1. `admin-user-1` logs in → navigates to `/dashboard/admin/form-builder`
2. Creates new template: title "בקשת פטור מביצוע", adds fields: text "סיבת הבקשה" (required), checkbox "קראתי את התנאים" (required), textarea "פרטים נוספים" (optional)
3. Sets template visibility to `published`
4. Saves template
5. Assert template appears in admin's own `/dashboard/forms/new` selector under custom forms section
6. `student-user-1` logs in → navigates to `/dashboard/forms/new` → opens form-type dropdown
7. Assert "בקשת פטור מביצוע" is selectable
8. `teacher-user-1` logs in → navigates to `/dashboard/forms/new` → opens form-type dropdown
9. Assert same template is selectable
10. `parent-user-1` logs in → navigates to `/dashboard/forms`
11. Assert **"New Form" button is absent** — parents cannot create forms

**Expected:** Published custom template appears for student and teacher; admin can also use it; parent is excluded from form creation.

---

### INT-14B — Student Creates Recital Form → Initial Status is PENDING_TEACHER → Teacher Reviews

**Domains:** Auth (student + teacher) + Admin
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None
**Mock data required:** FIX-11, student-user-1 and teacher-user-1 in same conservatorium (cons-15)

**Flow:**

**Part A — Student creates recital form:**
1. `student-user-1` logs in → navigates to `/dashboard/forms/new`
2. Selects "Recital" (רסיטל) from the form type dropdown
3. Adds at least one repertoire piece: title "Nocturne in E♭ Op.9 No.2", duration "04:30"
4. Submits form
5. Assert redirect to `/dashboard/forms`
6. Assert new form appears with status `PENDING_TEACHER` (he: "ממתין לאישור מורה")
7. Assert student cannot see a "Reject" or "Approve" action button on this form

**Part B — Teacher receives and reviews:**
8. `teacher-user-1` logs in → navigates to `/dashboard/forms`
9. Assert the student's recital form appears in teacher's list (filtered by `teacherId` or `assignedToTeacherId`)
10. Teacher navigates to `/dashboard/approvals` → asserts form is in the "For Your Handling" queue
11. Teacher opens form detail → reviews repertoire → clicks "Approve & Forward"
12. Assert toast: form approved

**Part C — Student sees updated status:**
13. `student-user-1` navigates to `/dashboard/forms`
14. Assert form status is now `PENDING_ADMIN`
15. Assert approval history shows teacher stage as complete with timestamp

**Expected:** Student recital form begins at PENDING_TEACHER; teacher reviews from their forms list AND approvals queue; student sees status advance after approval.

---

### INT-14C — Teacher Creates Exam Registration Form → Initial Status is PENDING_ADMIN (No Teacher Stage)

**Domains:** Auth (teacher + admin)
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None
**Mock data required:** FIX-22 (exam_registration form seed with teacher-user-1 as submitter), student-user-1 linked to teacher-user-1

**Flow:**
1. `teacher-user-1` logs in → navigates to `/dashboard/forms/new`
2. Assert "exam_registration" is visible in form type dropdown (available to teacher role; NOT available to student)
3. Selects "Exam Registration" (רישום לבחינה)
4. Selects `student-user-1` from the student dropdown (teacher sees their own students only)
5. Fills required fields: exam date, instrument, grade level
6. Submits form
7. Assert redirect to `/dashboard/forms`
8. Assert form appears with status `PENDING_ADMIN` (he: "ממתין לאישור מנהל") — teacher-submitted forms skip the PENDING_TEACHER stage
9. `student-user-1` logs in → navigates to `/dashboard/forms`
10. Assert the exam_registration form is visible in student's list (studentId === student-user-1)
11. Assert student sees the form as read-only (no action buttons)

**Part B — Admin approves directly:**
12. `admin-user-1` logs in → navigates to `/dashboard/approvals`
13. Assert exam_registration form from teacher-user-1 is in queue at `PENDING_ADMIN`
14. Admin approves → status → `APPROVED`
15. `teacher-user-1` navigates to `/dashboard/forms` → form status is `APPROVED`
16. `student-user-1` navigates to `/dashboard/forms` → same form shows `APPROVED`

**Expected:** Exam registration (teacher-created form) enters the pipeline at PENDING_ADMIN — not PENDING_TEACHER — because the teacher IS the submitter and is not their own reviewer. Student sees the form as a read-only participant. Admin approves without teacher stage.

---

### INT-14D — Teacher Cannot See Another Teacher's Forms

**Domains:** Auth (teacher isolation)
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None
**Mock data required:** FIX-22 — two form submissions: one by teacher-user-1, one by teacher-user-2, different students

**Flow:**
1. Seed data: `form-teacher-1` submitted by `teacher-user-1` for `student-user-1`; `form-teacher-2` submitted by `teacher-user-2` for `student-user-2`
2. `teacher-user-1` logs in → navigates to `/dashboard/forms`
3. Assert `form-teacher-1` is visible (own form)
4. Assert `form-teacher-2` is **NOT** visible (another teacher's form, not assigned to teacher-user-1)
5. `teacher-user-1` attempts to navigate directly to `/dashboard/forms/[form-teacher-2-id]`
6. Assert redirect to 403/not-found OR empty state — no form data exposed

**Expected:** Teacher form list is scoped to forms they created or are assigned to; direct URL access to another teacher's form is blocked.

---

### INT-14E — Admin Sees All Forms in Their Conservatorium; Site Admin Sees All

**Domains:** Admin (conservatorium_admin vs site_admin scoping)
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None
**Mock data required:** FIX-11, FIX-22 — forms from both cons-15 and cons-66

**Flow:**
1. Seed data: `form-cons15-1` (cons-15), `form-cons66-1` (cons-66)
2. `admin-user-1` (`conservatorium_admin` for cons-15) logs in → navigates to `/dashboard/forms`
3. Assert `form-cons15-1` is visible (same conservatorium)
4. Assert `form-cons66-1` is **NOT** visible (different conservatorium)
5. `site-admin-user-1` logs in → navigates to `/dashboard/forms`
6. Assert BOTH forms are visible
7. `delegated-admin-user-1` (delegated_admin for cons-15) — if exists — logs in → same scoping as conservatorium_admin step 3/4

**Expected:** Conservatorium admin sees only their own conservatorium's forms; site_admin has global visibility across all conservatoriums.

---

### INT-14F — Full Approval Chain: Student Submits EXAM_REGISTRATION (via Teacher) → Teacher → Admin → Ministry Queue → FINAL_APPROVED

**Domains:** Admin + Auth + Dashboard (all personas)
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None
**Mock data required:** FIX-22 (exam_registration seed)

> **v1.5.1 note:** FIX-23 has been removed per stakeholder clarification — ministry seeing ALL approved forms is intentional. INT-14F Part C now verifies that ministry sees the EXAM_REGISTRATION form among all approved forms (without requiring a filter). The `requiresMinistryApproval` field is no longer a prerequisite.

**Flow:**

**Part A — Teacher creates and submits exam registration for student:**
1. `teacher-user-1` logs in → navigates to `/dashboard/forms/new`
2. Selects "Exam Registration" (הרשמה לבחינה)
3. Selects `student-user-1` from their student roster
4. Fills required fields: exam level, instrument, preferred exam date
5. Submits
6. Assert status = `PENDING_ADMIN` (teacher-submitted, no teacher-review stage)
7. Assert form is visible in `student-user-1`'s `/dashboard/forms` list as read-only

**Part B — Admin approves:**
8. `admin-user-1` logs in → navigates to `/dashboard/approvals` → "For Your Handling" tab
9. Form at `PENDING_ADMIN` visible
10. Admin clicks "Approve & Sign" → draws signature → confirms
11. Assert status = `APPROVED`
12. `student-user-1` navigates to `/dashboard/forms` → status = `APPROVED`

**Part C — Ministry receives and reviews:**
14. `ministry-director-user` logs in → navigates to `/dashboard/approvals` (or `/ministry/inbox` if implemented per SDD-P5 §3.2)
15. Assert the EXAM_REGISTRATION form is visible in ministry queue (ministry sees all approved forms)
16. Ministry clicks "Final Approve"
17. Assert status → `FINAL_APPROVED`
18. `student-user-1` navigates to `/dashboard/forms` → status = `FINAL_APPROVED`

**Part D — Originator sees full history and downloads PDF:**
19. Student opens form detail page (`/dashboard/forms/[id]`)
20. Assert status badge = `FINAL_APPROVED`
21. Assert approval history timeline shows all 2 stages (admin, ministry) with timestamps
22. Assert "Download PDF" button is visible → clicking triggers PDF download

**Part E — Admin batch ministry export:**
23. `admin-user-1` navigates to `/dashboard/ministry-export`
24. Selects exam period → asserts the `FINAL_APPROVED` EXAM_REGISTRATION form appears in the export list
25. Clicks export → asserts CSV/Excel download triggered with UTF-8 BOM and Hebrew-language column headers

**Expected:** EXAM_REGISTRATION forms flow through teacher → admin → ministry. Ministry sees all approved forms (confirmed intentional — no `requiresMinistryApproval` filter). Status is visible to the student at each stage.

---

### INT-14G — Revision Cycle: Admin Requests Revision → Originator Resubmits → Re-approved

**Domains:** Admin + Auth + Dashboard
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None

**Flow:**
1. Start from INT-14F Part C with form at `PENDING_ADMIN`
2. Admin clicks "Request Revision" on the form
3. Form status → `REVISION_REQUIRED`
4. `student-user-1` navigates to `/dashboard/forms` → sees `REVISION_REQUIRED` status badge
5. Assert a revision comment from admin is visible on the form detail page
6. Student clicks "Fix & Resubmit" → edits a field → resubmits
7. Assert form re-enters approval queue (status = `PENDING_TEACHER` or `PENDING_ADMIN` depending on implementation)
8. Assert the revised field values are persisted
9. Admin re-approves → form reaches `APPROVED`
10. Assert revision history shows the revision request comment and the re-approval timestamp

**Expected:** Revision cycle is coherent; originator can see revision request and act on it; resubmission persists edits and re-enters the approval queue.

---

### INT-14H — Form Type Availability Is Role-Gated: exam_registration Not Available to Student

**Domains:** Auth (student vs teacher role gating)
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None
**Mock data required:** None (tests form selector options)

**Flow:**
1. `student-user-1` logs in → navigates to `/dashboard/forms/new`
2. Opens the form type dropdown
3. Assert "recital" option is present
4. Assert "kenes" option is present
5. Assert **"exam_registration" option is NOT present** (only available to teacher/admin)
6. `teacher-user-1` logs in → navigates to `/dashboard/forms/new`
7. Opens the form type dropdown
8. Assert "recital" present, "kenes" present, "exam_registration" **present**
9. `parent-user-1` navigates to `/dashboard/forms`
10. Assert no "New Form" button exists — parent cannot access `/dashboard/forms/new`

**Expected:** Form type availability is correctly role-gated per `new-form.tsx` `formOptions` logic; no role can access form types outside their allowed set.

---

### INT-14I — Parent Has Read-Only Access to Child's Forms; Cannot Create or Approve

**Domains:** Auth (parent persona) + Admin
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None
**Mock data required:** FIX-22 — form with `studentId = student-user-1` where `parent-user-1.childIds` includes `student-user-1`

**Flow:**
1. Seed data: form `form-student1-recital` submitted by `student-user-1` (`studentId = student-user-1`)
2. `parent-user-1` logs in → navigates to `/dashboard/forms`
3. Assert `form-student1-recital` is visible (child's form visible to parent via `childIds` filter)
4. Assert "New Form" button is **NOT present** (parent cannot create forms)
5. Parent clicks "View" on the form → opens detail page
6. Assert form fields are populated and status badge is visible
7. Assert NO "Approve", "Reject", or "Request Revision" action buttons present
8. Admin approves form (via `/dashboard/approvals`)
9. `parent-user-1` navigates to `/dashboard/forms` → form status now reflects `APPROVED`

**Expected:** Parent has pure read-only visibility into their child's form submissions; they see status updates; they cannot create, approve, or reject any form.

---

### INT-14J — Recital Form: All Three Creators (Student Self-Nominates / Teacher Nominates / Admin Creates) Produce Different Initial Statuses

**Domains:** Auth (student + teacher + admin personas) + Admin approvals
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None
**Mock data required:** `student-user-1` and `student-user-2` both linked to `teacher-user-1` (cons-15)

**Background:** The `RecitalForm` component accepts separate `user` (creator) and `student` (subject) props. The submission handler in `new-form.tsx` (line 102) sets the initial status based on the **creator's role**: `student` → `PENDING_TEACHER`; any other role → `PENDING_ADMIN`. The same form type therefore creates three different pipeline entry points.

**Path A — Student self-nominates:**
1. `student-user-1` logs in → navigates to `/dashboard/forms/new`
2. Selects "Recital" (רסיטל) form type
3. Assert student-name field auto-populates with their own name (read-only); no student-selection dropdown is shown
4. Fills in instrument, grade, teacher details, adds 1 repertoire piece
5. Submits
6. Assert status = `PENDING_TEACHER`
7. Assert form is visible in `teacher-user-1`'s `/dashboard/forms` list (scoped by `teacherId` or `assignedToTeacherId`)
8. Assert form is visible in student's own `/dashboard/forms` list

**Path B — Teacher nominates a student:**
9. `teacher-user-1` logs in → navigates to `/dashboard/forms/new`
10. Selects "Recital" form type
11. Assert a student-selection dropdown is visible — teacher selects `student-user-2` from their own student roster
12. Assert form pre-fills with `student-user-2`'s data (instrument, teacher name pre-populated from `student.instruments`)
13. Teacher completes required fields and submits
14. Assert status = `PENDING_ADMIN` (teacher-submitted forms bypass the teacher-review stage)
15. Assert form is visible in `teacher-user-1`'s `/dashboard/forms` list (they are the creator)
16. Assert form is visible in `student-user-2`'s `/dashboard/forms` list (they are the `studentId` subject)
17. Assert form is **NOT** in `teacher-user-1`'s `/dashboard/approvals` "For Your Handling" queue — a teacher cannot be both creator and approver of the same form

**Path C — Admin creates recital form:**
18. `admin-user-1` logs in → navigates to `/dashboard/forms/new`
19. Selects "Recital" form type
20. Assert student-selection dropdown shows all students in the conservatorium (admin scope — all students with matching `conservatoriumId`)
21. Admin selects `student-user-1`, completes all required fields, submits
22. Assert status = `PENDING_ADMIN`
23. Assert form is visible in admin's `/dashboard/forms` list (scoped by `conservatoriumId`)
24. Assert form is visible in `student-user-1`'s `/dashboard/forms` list

**Cross-path assertion — approval queue routing:**
25. `teacher-user-1` logs in → navigates to `/dashboard/approvals`
26. Assert Path A form (student self-nomination, `PENDING_TEACHER`) IS in the queue
27. Assert Path B form (teacher-nominated, `PENDING_ADMIN`) is NOT in teacher's queue — teacher was the submitter
28. Assert Path C form (admin-created, `PENDING_ADMIN`) is NOT in teacher's queue — admin submissions skip teacher stage
29. `admin-user-1` navigates to `/dashboard/approvals` → asserts Path B and Path C forms are both visible at `PENDING_ADMIN`

**Expected:** The same recital form type produces three distinct pipeline entry points based on who submits it. Student self-nomination requires teacher review; teacher and admin nominations bypass the teacher stage and enter directly at `PENDING_ADMIN`. The approvals queue routes correctly: only `PENDING_TEACHER` forms appear in the teacher's queue.

> **Implementation note (self-approval edge case):** If an admin creates a recital form for a student, the system routes it to `PENDING_ADMIN`. Verify that the admin approvals queue does not create a dead-end where the admin must approve their own submission. Document the observed behaviour. If self-approval is blocked by the UI or causes an error, add it to the pre-QA fix list.

---

---

### INT-14K — [DEFERRED to P3-FUTURE] Ministry Queue Filtering by `requiresMinistryApproval`

**Domains:** Admin + Auth (ministry_director persona)
**DB:** MEMORY
**Locale:** HE
**Priority:** P3-FUTURE (demoted from P0-BLOCKER in v1.5.1)
**Status:** DEFERRED — Stakeholder confirmed that ministry seeing ALL approved forms is intentional for now. This scenario is retained as a future enhancement if the ministry queue becomes too noisy and filtering is needed.

> **v1.5.1 note:** FIX-23 was removed per stakeholder clarification. The ministry director's approvals queue intentionally shows all approved forms regardless of type. If in the future the ministry requests filtering by `requiresMinistryApproval`, this scenario can be re-activated by restoring FIX-23 and promoting this back to P1-CRITICAL.

**Original purpose (retained for reference):** Verify that the ministry queue correctly filters by `requiresMinistryApproval: true` — so RECITAL and custom-template forms approved at admin level do NOT clutter the ministry inbox.

---

> **Retired scenarios:** INT-14 (single-flow) and INT-18 and INT-23 from v1.1 are superseded by INT-14A..INT-14K above. The content of INT-18 is now INT-14A; the content of INT-23 is now INT-14I; the content of INT-14 (v1.1) is now INT-14F (corrected in v1.4 to use EXAM_REGISTRATION). INT-14b (revision cycle) is now INT-14G. INT-14J is new in v1.3. INT-14K is deferred to P3-FUTURE in v1.5.1 (ministry queue filtering deemed unnecessary by stakeholder).

---

### INT-14b — [Retired — see INT-14G]

*This scenario is superseded by INT-14G (Revision Cycle) above.*

---

---

### INT-15 — Scholarship Approved → Donation Cause Updated → Student Notified

**Domains:** Billing + Admin
**DB:** MEMORY
**Locale:** HE
**Priority:** P2-MAJOR
**Stub:** None

**Flow:**
1. Student submits aid application via `/dashboard/apply-for-aid` (BF-22)
2. Admin approves the application (BF-24) → marks paid (BF-26)
3. Admin verifies the donation cause balance updated (BF-27)
4. Student navigates to billing → scholarship amount visible or credit applied

**Expected:** Aid application approval to scholarship payment is traceable.

---

### INT-16 — Teacher Premium Status → Badge Shows Across All Touch Points

**Domains:** Admin + Scheduling + Public
**DB:** MEMORY
**Locale:** HE
**Priority:** P2-MAJOR
**Stub:** None

**Flow:**
1. Admin sets `teacher-user-1.isPremiumTeacher = true` (ADM-06)
2. Student opens book wizard → teacher combobox shows ⭐ prefix for teacher-user-1 (SB-10)
3. Student opens Deals tab → slot card for teacher-user-1 shows premium badge (SB-58)
4. Unauthenticated visitor navigates to `/available-now` → `teacher-user-1` card shows "Premium" badge (SB-58)
5. Landing page featured teachers section shows premium indicator (PP-05)

**Expected:** Single `isPremiumTeacher` flag propagates correctly to all 4 display contexts.

---

### INT-17 — Rental Signing Flow → Rental Active → Admin Can See Rental

**Domains:** Legal + Billing + Admin
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** STUB:otp

**Flow:**
1. Admin creates instrument rental for student-user-4 → `status: pending_signature` (BF-28)
2. Parent receives signing link → navigates to `/rental-sign/[token]`
3. Parent completes OTP → reviews terms → draws signature → submits (LC-43..LC-47)
4. Rental status changes to `active` (LC-47)
5. Admin navigates to `/dashboard/admin/rentals` → rental appears as ACTIVE
6. Instrument inventory shows instrument as RENTED

**Expected:** Rental creation → signature → activation forms a complete traceable workflow.

---

### INT-18 — [Retired — see INT-14A]

*This scenario (Form Template Published by Admin → Available to All Submitter Roles) is superseded by INT-14A above, which adds verification that exam_registration is gated to teacher/admin only and that parents cannot access New Form.*

---

---

### INT-19 — Admin Creates Event → Public Page Shows Event → Authenticated User RSVPs

**Domains:** Admin + Public Pages + Auth
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None
**Mock data required:** FIX-20 (additional event records)

**Flow:**

**Part A — Admin creates event:**
1. `admin-user-1` logs in → navigates to `/dashboard/events/new` (ADM-17)
2. Fills in: title "קונצרט קיץ 2026", date 2026-06-15, venue "אולם הגדול", description, `isPublic: true`, ticket price ₪50
3. Submits form
4. Assert redirect to events list → new event visible with status OPEN_REGISTRATION
5. Assert event detail page `/dashboard/events/[id]` shows all entered data (ADM-19)

**Part B — Public page shows event:**
6. Unauthenticated visitor navigates to `/` (landing page)
7. Assert the "Upcoming Events" section shows the new event (or a known upcoming event from mock data)
8. Visitor navigates to the public events/open day page
9. Assert event card shows correct title, date, venue

**Part C — Authenticated user sees event and can interact:**
10. `student-user-1` logs in → navigates to `/dashboard` or dashboard events list
11. Assert new event appears in their events feed
12. Student navigates to event detail page → asserts all fields visible
13. Assert "Edit" button is NOT visible for student role (ADM-19 step 5)

**Expected:** Admin creates event → it propagates to public-facing landing page and to authenticated users' dashboards; role-gated edit button correct.

---

### INT-20 — Admin Sends Announcement → Target Users See It; Non-Target Users Do Not

**Domains:** Admin + Dashboard (all personas)
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None
**Mock data required:** FIX-17 (mockAnnouncements populated, or create dynamically in test)

**Flow:**

**Part A — Admin sends targeted announcement:**
1. `admin-user-1` logs in → navigates to `/dashboard/announcements` (ADM-20)
2. Fills in: title "חזרה לסטודנטים", body "חזרה לפיאנו ביום שני 09:00", target audience = **STUDENTS**
3. Clicks Send → assert success toast

**Part B — Target users (students) see the announcement:**
4. `student-user-1` logs in → navigates to `/dashboard` or notifications area
5. Assert the announcement "חזרה לסטודנטים" appears in their notification/announcement feed
6. `student-user-2` (same conservatorium) logs in → assert same announcement visible

**Part C — Non-target users do NOT see this announcement:**
7. `teacher-user-1` logs in → navigates to notifications/dashboard
8. Assert the STUDENTS-only announcement is NOT visible in their feed
9. `parent-user-1` logs in → assert announcement NOT visible
10. `admin-user-1` themselves: may see it in the audit log but not in the student-targeted feed

**Part D — Locale: announcement in Hebrew locale:**
11. `student-user-1` switches locale to `/en/dashboard`
12. Assert announcement still visible (announcements are locale-agnostic; same content shown)

**Expected:** Target audience filtering works; STUDENTS announcement reaches only students in the same conservatorium; teachers/parents do not see it; announcement persists across sessions.

---

### INT-21 — Teacher Creates Lesson Note → Parent and Student Can View It; Other Teacher Cannot

**Domains:** Scheduling + Dashboard (teacher + student + parent personas)
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None
**Mock data required:** FIX-19 (mockLessonNotes populated)

**Flow:**

**Part A — Teacher writes lesson note:**
1. `teacher-user-1` logs in → navigates to a completed lesson detail (lesson-11)
2. Opens the lesson note editor (within lesson detail or teacher reports)
3. Fills in: `lessonSummary` = "עבדנו על נוקטורן שופן — פרזה ופדלים", `homeworkAssignment` = "תרגול עמ׳ 1–16 לאט", `isSharedWithStudent: true`, `isSharedWithParent: true`
4. Optionally adds a private `studioNote` = "מתקשה עם עצמאות יד שמאל" — this should NOT be visible to student/parent
5. Saves note → assert success toast

**Part B — Student sees shared note:**
6. `student-user-1` (the lesson's student) logs in → navigates to lesson detail or practice area
7. Assert `lessonSummary` and `homeworkAssignment` are visible
8. Assert `studioNote` (private) is NOT visible
9. `student-user-2` (different student, same teacher) logs in → assert they do NOT see student-user-1's lesson note

**Part C — Parent sees shared note:**
10. `parent-user-1` (parent of student-user-1) logs in → navigates to lesson history or child's progress
11. Assert same `lessonSummary` and `homeworkAssignment` visible
12. Assert `studioNote` NOT visible

**Part D — Other teacher cannot see private note:**
13. `teacher-user-2` logs in → attempts to navigate to lesson-11 detail
14. Assert they cannot access lesson-11 (belongs to teacher-user-1) — redirect or empty state

**Expected:** Lesson note with `isSharedWithStudent/Parent: true` is visible to the correct linked parties; private `studioNote` is never exposed to student/parent; other teachers have no access to lessons not assigned to them.

---

### INT-22 — Teacher Creates Lesson Note with isShared=false → Student Sees Nothing

**Domains:** Scheduling + Dashboard (teacher + student)
**DB:** MEMORY
**Locale:** HE
**Priority:** P2-MAJOR
**Stub:** None
**Mock data required:** FIX-19

**Flow:**
1. `teacher-user-1` creates a lesson note for lesson-12 with `isSharedWithStudent: false`, `isSharedWithParent: false`
2. `student-user-2` (lesson-12's student) logs in → navigates to lesson detail
3. Assert NO lesson note summary or homework is shown (sharing is off)
4. `parent-user-1` (student-user-2's parent) logs in → same check — no note visible
5. Teacher logs in → can see their own note including private `studioNote`

**Expected:** Notes with sharing disabled are never visible to students or parents; teacher retains full read access to their own notes.

---

### INT-23 — [Retired — see INT-14I]

*This scenario (Full Form Lifecycle via Parent: Parent Submits on Behalf of Child) is superseded by INT-14I, which adds the correct constraint that parents cannot submit forms at all (no "New Form" button), and focuses on parent read-only visibility of their child's forms.*

---

### INT-24 — Admin Sends Announcement with All Audiences → Each User Type Sees Exactly Their Content

**Domains:** Admin + Dashboard (all 4 non-admin personas)
**DB:** MEMORY
**Locale:** HE+EN
**Priority:** P2-MAJOR
**Stub:** None
**Mock data required:** FIX-17 (or create announcements dynamically in test)

**Flow:**
1. Admin sends 4 separate announcements (re-use ADM-20 pattern):
   - ann-A: targetAudience = ALL → "ברוכים הבאים לסמסטר ב׳"
   - ann-B: targetAudience = TEACHERS → "ישיבת צוות יום שני"
   - ann-C: targetAudience = PARENTS → "חשבוניות שנשלחו"
   - ann-D: targetAudience = STUDENTS → "אתגר התרגול"

2. `student-user-1` logs in: assert ann-A (ALL) and ann-D (STUDENTS) visible; ann-B (TEACHERS) and ann-C (PARENTS) NOT visible
3. `teacher-user-1` logs in: assert ann-A and ann-B visible; ann-C and ann-D NOT visible
4. `parent-user-1` logs in: assert ann-A and ann-C visible; ann-B and ann-D NOT visible
5. `admin-user-1` logs in: assert audit log shows all 4 announcements sent; dashboard does not show user-targeted announcements in admin's own feed (admin is not a target persona)

6. Switch `student-user-1` to `/en/dashboard` — assert announcement text shows in Hebrew (not translated, as Announcement type lacks i18n fields — known gap FIX-15 equivalent for announcements)

**Expected:** Audience filtering is precise — each user type sees exactly the announcements targeted at them plus ALL-audience announcements. Cross-contamination between audience groups does not occur.

---

### INT-25 — Teacher Sick Leave → Student Notified → Admin Sees Affected Lessons → Substitute Assigned → Student Sees Substitute

**Domains:** Scheduling + Admin + Dashboard (teacher + student + parent + admin)
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None

**Flow:**
1. `teacher-user-1` cancels a lesson due to illness (SB-66 trigger)
2. `student-user-1` receives a notification: "Your lesson with [teacher] has been cancelled"
3. `parent-user-1` (parent of student-user-1) also receives a notification
4. `admin-user-1` sees the affected lesson in the admin dashboard / substitute management view
5. Admin assigns `teacher-user-2` as substitute (SB-42 flow)
6. `student-user-1` receives a notification: "Your lesson will be with [substitute teacher]"
7. `teacher-user-2` sees the new substitute lesson in their schedule
8. Makeup credit issued to `student-user-1` (balance increments)

**Expected:** Teacher sick leave triggers a complete notification chain across all affected personas; substitute assignment updates both the new teacher's and student's schedules; makeup credit is issued for the original cancelled lesson.

---

### INT-26 — Parent Pays Invoice (Cardcom) → Student Package Activates → Student Can Book Lesson

**Domains:** Billing + Scheduling + Auth (parent + student)
**DB:** BOTH
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** STUB:cardcom

**Flow:**
1. `parent-user-1` sees a pending invoice on their billing page for `student-user-1`'s package
2. Parent clicks "Pay Now" → Cardcom redirect (simulated)
3. Cardcom webhook fires with `ResponseCode=0` → invoice status → PAID
4. `student-user-1`'s package status changes to ACTIVE
5. `student-user-1` logs in → navigates to book wizard → package guard passes (no "purchase package" blocker)
6. Student successfully books a lesson using the newly activated package credit

**Expected:** Payment by parent triggers package activation for the child; child can immediately book lessons using the activated package credits.

---

### INT-27 — Ministry Director Creates Form Template → Admin Distributes → Student Fills → Teacher Countersigns → Admin Approves → Ministry Sees in Inbox

**Domains:** Admin + Auth + Dashboard (all 4 personas + ministry)
**DB:** MEMORY
**Locale:** HE
**Priority:** P0-BLOCKER
**Stub:** None

**Flow:**
1. `ministry-director-user` requests a new form template (or admin creates one at ministry's request)
2. `admin-user-1` creates the form template in form builder, publishes it
3. `student-user-1` fills out the form and submits → status = `PENDING_TEACHER`
4. `teacher-user-1` reviews and approves → status = `PENDING_ADMIN`
5. `admin-user-1` approves and signs → status = `APPROVED`
6. Form appears in ministry queue (ministry sees all approved forms)
7. `ministry-director-user` sees the form in their approvals inbox
8. Ministry director approves → status = `FINAL_APPROVED`
9. `student-user-1` sees `FINAL_APPROVED` status in their forms list

**Expected:** Full 5-persona form lifecycle from creation through ministry final approval. Ministry sees all approved forms in their queue.

---

### INT-28 — Student Earns PRACTICE_STREAK_7 Achievement → Parent Sees Achievement Badge in Family Hub

**Domains:** Repertoire + Dashboard (student + parent)
**DB:** MEMORY
**Locale:** HE
**Priority:** P2-MAJOR
**Stub:** None

**Flow:**
1. `student-user-1` submits practice logs for 7 consecutive days (7 calls to `addPracticeLog`)
2. After the 7th log, assert `PRACTICE_STREAK_7` achievement is awarded (toast notification appears)
3. Student navigates to their dashboard or achievements area → badge visible
4. `parent-user-1` logs in → navigates to family hub / child's progress view
5. Assert the same `PRACTICE_STREAK_7` achievement badge is visible for their child

**Expected:** Practice streak achievement triggers correctly after 7 consecutive days; both student and parent see the badge.

---

### INT-29 — Admin Creates Event → Event Appears on Public Landing Page → Parent Registers → Confirmation Received

**Domains:** Admin + Public Pages + Auth (admin + anonymous visitor + parent)
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None
**Mock data required:** FIX-20

**Flow:**
1. `admin-user-1` creates a public event: "יום פתוח 2026" with registration enabled (ADM-17)
2. Unauthenticated visitor navigates to `/` → "Upcoming Events" section shows the new event
3. Visitor clicks on event → event detail page renders
4. `parent-user-1` logs in → navigates to the open day / events page
5. Parent clicks "Register" for the event
6. Assert confirmation toast or success state
7. Assert registered attendee count increments on the admin event detail page

**Expected:** Event creation by admin propagates to public-facing pages; parent can register; registration is tracked in admin dashboard.

---

### INT-30 — Student Package Expires → Student Cannot Book → Admin Notified → Admin Renews → Student Can Book Again

**Domains:** Billing + Scheduling + Admin (student + admin)
**DB:** MEMORY
**Locale:** HE
**Priority:** P1-CRITICAL
**Stub:** None

**Flow:**
1. `student-user-1`'s package has `validUntil` set to yesterday (expired)
2. Student navigates to book wizard → package guard fires: "Your package has expired. Renew to book lessons."
3. Book button is disabled
4. Admin is notified (or sees the expired package in the billing dashboard)
5. Admin creates/renews a package for the student with a new `validUntil` in the future
6. Student refreshes → package guard passes → student can book a lesson

**Expected:** Package expiry blocks booking; renewal by admin immediately unblocks the student.

---

## 7b. Security Test Scenarios

> **Source:** `docs/plans/qa/12-security-review.md` — Security Architect review.
> These 12 scenarios are not present in any domain plan and must be added as a dedicated security test suite.
> **Phase:** Phase 5 (Security Tests)
> **Location:** `e2e/security/` or manual execution per scenario

---

### SEC-01 — Session Cookie Attributes Verification

**Category:** Authentication & Session Management
**Priority:** P1-CRITICAL
**Backend:** Staging environment with real auth provider (Supabase primary, Firebase alternate — run against both)

**Steps:**
1. Complete a login flow in a staging environment (with `AUTH_PROVIDER=supabase` and Supabase credentials present; repeat with `AUTH_PROVIDER=firebase`).
2. Using browser DevTools, Application tab, Cookies panel, inspect the `__session` cookie.
3. Assert: `HttpOnly` flag is set.
4. Assert: `Secure` flag is set.
5. Assert: `SameSite` attribute is `lax` or `strict`.
6. Assert: `Path` is `/`.
7. Assert: Expiry is approximately 14 days from now (within +-5 minutes).
8. Assert: The cookie value cannot be read via `document.cookie` in the browser console.

**Expected result:** All assertions pass. `document.cookie` does not include `__session`.

---

### SEC-02 — `saveConsentRecord` Cannot Record Consent for a Different User

**Category:** Authorization & Access Control
**Priority:** P0-BLOCKER
**Backend:** MEMORY
**Related fix:** FIX-35

**Steps:**
1. Log in as `student-user-1` (or simulate via dev bypass with a modified `x-user-id` header).
2. Call `saveConsentRecord` with `userId: 'conservatorium_admin_user_id'`.
3. Assert that the action returns `{ success: false, error: ... }` or throws FORBIDDEN.
4. Verify no ConsentRecord with `userId = 'conservatorium_admin_user_id'` was written.

**Expected result:** Action is rejected. Only the caller's own `userId` is accepted.

**Notes:** Currently no such check exists (FINDING-AUTHZ-01). This test will FAIL until FIX-35 is applied.

---

### SEC-03 — Cross-Tenant Data Access Blocked for `conservatorium_admin`

**Category:** Tenant Isolation
**Priority:** P0-BLOCKER
**Backend:** MEMORY and POSTGRES
**Related fix:** FIX-33 (DB-level security rules), ADM-37

**Steps:**
1. Authenticate as a `conservatorium_admin` for cons-15.
2. Attempt to call a Server Action that accepts a `conservatoriumId` parameter (e.g., `getTeacherList({ conservatoriumId: 'cons-66' })`).
3. Assert that the action returns TENANT_MISMATCH error.
4. Attempt to navigate to `/dashboard/admin/users?conservatoriumId=cons-66`.
5. Assert that only cons-15 users are returned.

**Expected result:** All cross-tenant accesses are rejected. `requireRole()` TENANT_MISMATCH fires.

---

### SEC-04 — Cross-Tenant Data Access Allowed for `site_admin`

**Category:** Tenant Isolation (positive case)
**Priority:** P1-CRITICAL
**Backend:** MEMORY and POSTGRES

**Steps:**
1. Authenticate as `site_admin` (dev bypass includes this).
2. Call the same Server Action with `conservatoriumId: 'cons-66'`.
3. Assert that data is returned without TENANT_MISMATCH.

**Expected result:** `site_admin` bypasses tenant isolation and sees cons-66 data.

---

### SEC-05 — XSS: Lesson Note Content Rendered Safely

**Category:** Input Validation / XSS
**Priority:** P1-CRITICAL
**Backend:** MEMORY

**Steps:**
1. As a teacher, create a lesson note with content: `<img src=x onerror="alert('XSS')">`
2. As the student, navigate to the lesson history view where notes are displayed.
3. Assert: The string is rendered as escaped text, not as an HTML element.
4. Assert: No `alert()` dialog appears.
5. Repeat with: `<script>document.cookie</script>`, `javascript:void(0)`, and a 10,000-character string.

**Expected result:** All XSS payloads are rendered as literal text. No script execution.

---

### SEC-06 — OTP: Injection and Boundary Inputs Rejected

**Category:** Input Validation
**Priority:** P2-MAJOR
**Backend:** MEMORY
**Stub:** STUB:otp

**Steps:**
1. Navigate to `/rental-sign/[valid-token]` and send OTP.
2. In the OTP field, enter: `' OR 1=1 --`
3. Assert: Error shown; step does not advance.
4. Enter: `<script>alert(1)</script>`
5. Assert: Error shown; no script execution.
6. Enter: A string of 1,000 characters.
7. Assert: Input is truncated or rejected before reaching the server.
8. Enter: The correct 6-digit OTP with surrounding whitespace (e.g., `  123456  `).
9. Assert: Either the whitespace is stripped and the OTP is accepted, or a clear error is shown.

**Expected result:** All non-numeric and out-of-range inputs are rejected gracefully. No injection strings reach the backend.

---

### SEC-07 — Dev Bypass Absent in Production-Like Environment

**Category:** Dev Bypass Safety
**Priority:** P0-BLOCKER
**Backend:** Must run against a built production bundle, not `next dev`

**Steps:**
1. Build and start the Next.js server with `NODE_ENV=production` and `FIREBASE_SERVICE_ACCOUNT_KEY` unset (intentional misconfiguration).
2. Attempt to access `/dashboard`.
3. Assert: The request is NOT served as `site_admin`. Expected: redirect to `/login` or HTTP 500.

**Expected result:** Dev bypass does not activate when `NODE_ENV=production`. Server either redirects to login or fails with a configuration error rather than granting unauthenticated admin access.

---

### SEC-08 — Rate Limiting on Login Endpoint (11th Attempt is Rejected)

**Category:** API Security / Brute Force Protection
**Priority:** P1-CRITICAL
**Backend:** Staging

**Steps:**
1. Against a staging environment, send 10 consecutive POST requests to `/api/auth/login` with invalid `idToken` values from the same IP.
2. Send the 11th request.
3. Assert: HTTP 429 response with `Retry-After` header.
4. Wait for the reset window to expire.
5. Send one more request.
6. Assert: HTTP 401 (not 429) — rate limit has reset.

**Expected result:** 429 on the 11th request; rate limit resets after `windowMs`.

**Notes:** If the limiter is in-memory (FINDING-API-02), also test after restarting the server to confirm the counter resets (reveals bypass-via-restart vulnerability).

---

### SEC-09 — Consent Withdrawal: `'rejected'` Value Not Treated as Truthy by Analytics

**Category:** Consent Data Integrity
**Priority:** P2-MAJOR
**Backend:** MEMORY

**Steps:**
1. Set `localStorage.setItem('harmonia_cookie_consent', 'rejected')`.
2. Navigate to all tracked pages.
3. Using the browser Network tab, assert that no analytics events are fired.
4. Using the browser Console, assert no analytics-related scripts execute.

**Expected result:** A `'rejected'` consent value is never treated as truthy by any conditional analytics check.

---

### SEC-10 — Cardcom Webhook Rejected Without Valid HMAC

**Category:** Webhook Security
**Priority:** P1-CRITICAL
**Backend:** BOTH
**Stub:** STUB:cardcom

**Steps:**
1. Send a POST request to `/api/cardcom-webhook` with a valid-looking JSON body but:
   a. No `x-cardcom-signature` header — assert HTTP 401.
   b. Incorrect signature value — assert HTTP 401.
   c. Correct signature but `CARDCOM_WEBHOOK_SECRET` not set in env — assert HTTP 500.
2. Send a valid request with correct HMAC — assert HTTP 200.

**Expected result:** Unauthenticated webhook requests are rejected. Correct HMAC passes. Missing secret configuration is surfaced as 500.

---

### SEC-11 — DSAR Export: User Can Only Export Own Data

**Category:** Data Protection / DSAR
**Priority:** P0-BLOCKER
**Backend:** MEMORY
**Related fix:** FIX-27, FIX-36

**Steps:**
1. Log in as `student-user-1`.
2. Call the DSAR export Server Action (once implemented) with `userId: 'student-user-1'`.
3. Assert: Export contains only data belonging to `student-user-1`.
4. Attempt to call the export action with `userId: 'admin-user-id'`.
5. Assert: Action rejects with FORBIDDEN or TENANT_MISMATCH.

**Expected result:** Users can only export their own data. Cross-user data export is rejected.

**Notes:** Currently the export is UI-only (FIX-27/FIX-36). This test must gate the launch of the real export feature.

---

### SEC-12 — Unauthenticated Access to `/dashboard` Routes is Redirected to Login

**Category:** Route Protection
**Priority:** P0-BLOCKER
**Backend:** Must run against a real auth stack (not dev bypass). Staging environment with `AUTH_PROVIDER=supabase` (primary) and `AUTH_PROVIDER=firebase` (alternate).

**Steps:**
1. Clear all cookies (ensure no `__session` cookie).
2. Directly navigate to:
   - `/dashboard`
   - `/dashboard/admin/users`
   - `/dashboard/ministry/repertoire`
   - `/dashboard/settings`
   - `/he/dashboard`
3. For each path, assert: HTTP redirect to the locale-appropriate `/login` (with `callbackUrl` param set).
4. Assert: None of the dashboard pages render any content before the redirect.

**Expected result:** All dashboard routes redirect to login when unauthenticated.

---

## 8. QA Gate Criteria

The following conditions **must all pass** before the application is considered ready for production launch.

### 8.1 Mandatory Pass Conditions

| Criterion | Threshold | Verification |
|-----------|-----------|-------------|
| All P0-BLOCKER scenarios | 100% pass | Phase 3 execution |
| All P1-CRITICAL scenarios | 100% pass | Phase 3 execution |
| All cross-feature INT- scenarios | 100% pass | Phase 4 execution |
| All SEC- security scenarios | 100% pass (P0-BLOCKER + P1-CRITICAL) | Phase 5 execution |
| All pre-QA fixes FIX-01..FIX-05 | Implemented and verified | Phase 0 |
| FIX-19 (mockLessonNotes) and FIX-20 (event booking records) | Implemented | Phase 0 |
| FIX-21 (published FormTemplate), FIX-22 (exam_registration seed), FIX-24 (missing form types) | Implemented | Phase 0 |
| FIX-13 (callbackUrl open redirect) | Fixed and verified | Phase 5 security |
| PM blockers FIX-25..FIX-32 | All 8 resolved or formally deferred with rationale | Pre-QA gate |
| Security CRITICAL findings FIX-33, FIX-34 (DB/Storage security rules) | Deployed for active auth provider (Supabase RLS or Firestore rules) | Pre-launch blocker |
| Security HIGH findings FIX-35..FIX-39 | All 5 resolved | Pre-public-beta |
| All security gate criteria G-01..G-07 (Blockers) | All pass | Pre-launch |
| All security gate criteria G-08..G-12 (High) | All pass | Pre-public-beta |
| All 4 locales render without missing translation keys | 0 placeholder keys visible | Phase 6 |
| RTL layout correct for `he` and `ar` | dir=rtl set; logical CSS used | Phase 6 |
| No security vulnerabilities: CRITICAL or HIGH severity | 0 found | Phase 5 |
| Lighthouse accessibility score | >= 95 on landing and privacy pages | Phase 8 |

### 8.2 Acceptable-with-Documentation Conditions

These conditions do not block launch but must be **documented** in a known-issues register:

| Condition | Acceptability |
|-----------|---------------|
| P2-MAJOR scenarios with failing tests | Must be tracked as issues with target fix date |
| STUB features not fully implemented (STUB:cardcom, STUB:gemini, STUB:ai-coach, STUB:otp) | Must be documented as stubs; real implementation required before GA launch |
| `cancelPackageAction` (FIX-07) always returns `withinCoolingOff: true` | Must note this in compliance register; fix before real user cancellations |
| `parent-payment-panel.tsx` uses hardcoded MOCK_INVOICES (FIX-09) | Document as stub; real CardCom integration required before billing GA |
| Memory-only entities (makeup credits, payroll, rentals) not in seed.sql | Postgres tests for these features must use memory adapter only |
| ID incompatibility between memory and Postgres adapters | QA team must use UUID mapping (Section 9) for Postgres tests |

### 8.3 Stub Inventory

All stubs must be clearly documented before launch:

| Stub | Feature | Status | Required Before |
|------|---------|--------|-----------------|
| STUB:cardcom | Payment processing (parent billing, package purchase, CardCom redirect) | Redirects simulated via setTimeout | GA billing launch |
| STUB:gemini | Auto-translate compositions | API key required; fails gracefully | Ministry repertoire GA |
| STUB:ai-coach | Practice coach audio analysis | 5-second mock recording + hardcoded feedback | AI features GA |
| STUB:otp | Rental signing OTP delivery | OTP shown in UI (dev mode only) | Rental feature GA |
| STUB:auth-provider | Auth provider abstraction (dev bypass active locally; `AUTH_PROVIDER=supabase` or `firebase` in staging/prod) | Real auth provider required in staging/prod | Always |
| STUB:pdf | Invoice PDF / form PDF generation | HTML stub; real PDF generation TBD | Billing GA |

### 8.4 Security Gate — BLOCKERS (Must Pass Before Any Real User Data)

> **Source:** `docs/plans/qa/12-security-review.md` §8 — 21 gate criteria organized by tier.

| # | Gate | Acceptance Criterion |
|---|------|----------------------|
| G-01 | DB-level security rules deployed (FIX-33) | **Supabase:** RLS policies enabled on all tables; cross-tenant access tests (SEC-03, SEC-04) pass. **Firebase:** `firestore.rules` deployed in production project; version matches repo. Whichever provider is active, DB-level access control must supplement application-level checks. |
| G-02 | Storage-level security rules deployed (FIX-34) | **Supabase:** Storage bucket policies with RLS configured; practice video, invoice, and agreement paths are not publicly accessible. **Firebase:** Storage Security Rules deployed. Both: Signed URLs used for all download links. |
| G-03 | DSAR Export is functional (FIX-27, FIX-36) | `Export My Data` produces an actual downloadable file containing the user's PII. SEC-11 passes. |
| G-04 | DSAR Deletion Request is tracked (FIX-37) | `Request Data Deletion` writes a `DELETION_REQUEST` ComplianceLog entry. At minimum a human-visible record is created. |
| G-05 | `saveConsentRecord` ownership check (FIX-35) | Action rejects `userId` that does not match `claims.uid` (unless valid parental consent flow). SEC-02 passes. |
| G-06 | Session cookie is HttpOnly and Secure in production | SEC-01 passes on the staging/production environment. |
| G-07 | Dev bypass cannot activate in production | SEC-07 passes: `NODE_ENV=production` with no auth credentials does NOT grant `site_admin` access. |

### 8.5 Security Gate — HIGH (Must Pass Before Public Beta)

| # | Gate | Acceptance Criterion |
|---|------|----------------------|
| G-08 | Cross-tenant isolation verified (FIX-33) | SEC-03 and SEC-04 pass. `conservatorium_admin` cannot read or write data from another conservatorium. |
| G-09 | XSS on user-generated content | SEC-05 passes for all known rich-text fields (lesson notes, announcements, teacher bios). No raw HTML injection renders unsanitized content. |
| G-10 | Rate limiting is distributed | Login rate limiter backed by a shared store (Redis/Upstash/KV), not in-process memory. SEC-08 passes across multiple server restarts. |
| G-11 | ComplianceLog wired to DSAR operations (FIX-38) | All three DSAR actions (export, delete, withdraw consent) write `ComplianceLog` entries. Logs are queryable by admin. |
| G-12 | `getConsentStatus` ownership check (FIX-39) | Action rejects queries for `userId !== claims.uid` unless the caller is an admin or parent of the queried user. |

### 8.6 Security Gate — MEDIUM (Must Pass Before General Availability)

| # | Gate | Acceptance Criterion |
|---|------|----------------------|
| G-13 | Client-side API abuse prevention configured | **Supabase:** Supabase anon key + RLS enforces row-level security; API rate limits configured in Supabase dashboard. **Firebase:** App Check enabled with reCAPTCHA Enterprise. Automated queries without valid credentials are rejected. |
| G-14 | Webhook HMAC enforcement in all environments | `CARDCOM_WEBHOOK_SECRET` is set in staging and production. SEC-10 passes (no bypass when secret is set). |
| G-15 | IP address captured server-side in consent records | `ipAddress` in ConsentRecord is populated from server-side `x-forwarded-for`, not client input. |
| G-16 | Consent version is dynamically sourced | Privacy policy version stored outside hardcoded string; bumped when privacy policy changes. |
| G-17 | Israeli Registrar of Databases registration | Application submitted to the Registrar before any data collection from users outside of test accounts. |
| G-18 | Data Security Officer appointed | Named DSO documented in internal governance records. Contact email publicly listed in privacy policy. |

### 8.7 Security Gate — MONITORING (Required Post-Launch)

| # | Gate | Acceptance Criterion |
|---|------|----------------------|
| G-19 | Breach notification procedure documented | Written procedure exists naming who is notified within 72 hours, with contact details for the Israeli Registrar. |
| G-20 | Penetration test by external firm | Independent pentest conducted within 90 days of launch. All CRITICAL and HIGH findings remediated. |
| G-21 | Data retention automation | Practice recording auto-delete (1 year) and financial record archiving (7 years) are scheduled jobs (Supabase pg_cron, Vercel Cron, or equivalent) that run and can be verified in audit logs. |

---

## 9. ID→UUID Mapping Reference

For tests targeting the Postgres adapter, use UUID format IDs from `seed.sql`. The memory adapter uses human-readable IDs.

| Memory ID | Postgres UUID | Role |
|-----------|--------------|------|
| `student-user-1` | `e1000000-0000-0000-0000-000000000001` | student |
| `student-user-2` | `e1000000-0000-0000-0000-000000000002` | student |
| `student-user-3` | `e1000000-0000-0000-0000-000000000003` | student |
| `student-user-4` | `e1000000-0000-0000-0000-000000000004` | student |
| `student-user-5` | `e1000000-0000-0000-0000-000000000005` | student |
| `other-student-1` | `e1000000-0000-0000-0000-000000000009` | student |
| `parent-user-1` | `f1000000-0000-0000-0000-000000000001` | parent |
| `parent-user-2` | `f1000000-0000-0000-0000-000000000002` | parent |
| `teacher-user-1` | `c1000000-0000-0000-0000-000000000001` | teacher (premium) |
| `teacher-user-2` | `c1000000-0000-0000-0000-000000000002` | teacher |
| `dir-teacher-001..018` | `c1000000-...-000001` through `...-000018` | teacher (cons-15) |
| `dir-teacher-019..068` | `c1000000-...-000019` through `...-000068` | teacher (cons-66) |
| `cons-15` | `a1000000-0000-0000-0000-000000000015` | conservatorium |
| `cons-66` | `a1000000-0000-0000-0000-000000000066` | conservatorium |
| `cons-12` | `a1000000-0000-0000-0000-000000000012` | conservatorium |
| `dev-user` | _(not in Postgres seed)_ | site_admin |
| `site-admin-user-1` | _(not in Postgres seed)_ | site_admin |
| `ministry-director-user-1` | _(not in Postgres seed)_ | ministry_director |

> **Note:** For Postgres tests, `dev-user` and `site-admin-user-1` must be inserted manually or the test must use the dev bypass. Cross-adapter tests should isolate on entities that exist in both adapters (students, teachers, conservatoriums, lessons, forms).

---

*End of Section 9.*

---

## 10. SDD vs Code Gap Analysis

> **Purpose:** Features specified in SDDs but not yet implemented in the codebase. These are tagged `[NOT-YET-IMPLEMENTED]` and should NOT be tested in the current QA cycle — they are documented here to prevent false-positive test failures and to inform the product roadmap.
>
> **Source:** Complete reading of all 55 SDD documents completed 2026-03-14. Gaps are categorised by priority and grouped by domain. Any existing QA scenarios that touch a `[NOT-YET-IMPLEMENTED]` area must be tagged `[DEFERRED — SDD gap]` and skipped during execution.

---

### 10.1 P0 — Security & Infrastructure Gaps (pre-launch blockers)

These gaps mean the application is **not production-safe** in its current state. Any QA test touching security or tenant isolation in Firestore/Supabase should be marked `[BLOCKED — infrastructure gap]` until resolved.

| Gap ID | Feature | SDD Source | Gap Description | Status |
|--------|---------|-----------|-----------------|--------|
| GAP-S01 | DB Security Rules not deployed | SDD-06 §4, SDD-P7 | Firestore Security Rules exist as a template in `firestore.rules` but have never been deployed to the production Firebase project. Without deployed rules, all tenant isolation, RBAC enforcement, and parent-child isolation exist only in Server Actions code, not at the database layer. Any client with direct Firestore access can read/write cross-tenant data. | `[NOT-YET-DEPLOYED]` — P0 |
| GAP-S02 | Firebase App Check not configured | SDD-06 §2.2 | Firebase App Check is listed as planned. Without it, there is no attestation that requests come from the real Lyriosa app — any script can call the Firestore API directly. | `[NOT-YET-IMPLEMENTED]` — P0 |
| GAP-S03 | `verifyAuth()` returns synthetic session unconditionally in dev | SDD-06 §2.3, SDD-P7 SEC-C03 | In dev mode (`NODE_ENV !== 'production'` AND no `FIREBASE_SERVICE_ACCOUNT_KEY`), `verifyAuth()` in `auth-utils.ts` always returns a synthetic `site_admin` session. This is correct for local dev but means ALL Server Actions are unauthenticated in that mode. The SDD documents this as intentional for dev but categorises it as P0 security risk if this code path is ever reachable in production. | `[BY-DESIGN-DEV-ONLY]` — verify production cannot reach this path |
| GAP-S04 | Role stored in mutable localStorage | SDD-P7 SEC-C02 | The auth domain stores `role` in `localStorage`. A user can open the browser console and escalate to `site_admin` in 2 seconds. The custom claims from the Firebase session cookie are the authoritative source. localStorage should store display state only, never auth-relevant role/conservatoriumId. | `[NOT-YET-FIXED]` — P0 |
| GAP-S05 | Playing School admin pages have zero auth guards | SDD-P7 SEC-C04 | All Playing School admin routes under `/dashboard/playing-school/admin/` have no `verifyAuth()` or `requireRole()` guard — any user who knows the URL can access them without authentication. | `[NOT-YET-FIXED]` — P0 |
| GAP-S06 | QR code API injects `token` into URL without sanitisation | SDD-P7 SEC-C05 | The QR code generation API accepts a `token` parameter and injects it into a URL string without sanitisation, creating a QR injection / SSRF risk. | `[NOT-YET-FIXED]` — P0 |
| GAP-S07 | Hardcoded Cardcom terminal `12345` in Playing School action | SDD-P7 SEC-H04 | `createPlayingSchoolEnrollment` action contains hardcoded `cardcomTerminal: '12345'` — a credential stub that would be submitted to the real Cardcom gateway in production. | `[NOT-YET-FIXED]` — P0 |
| GAP-S08 | No CSP header | SDD-P7 SEC-H02 | `next.config.ts` security headers are present (HSTS, X-Frame-Options, etc.) but `Content-Security-Policy` header is missing. Without CSP, XSS attacks can exfiltrate session cookies or impersonate API calls. | `[NOT-YET-IMPLEMENTED]` — P0 |
| GAP-S09 | Auth cookie HttpOnly/Secure flags not verified | SDD-P7 SEC-H03 | The `__session` Firebase session cookie must have `HttpOnly` and `Secure` flags. The login API route must explicitly set these flags; there is no verification that they are present. | `[NOT-YET-VERIFIED]` — P0 |

---

### 10.2 P0 — Architectural Gaps (required before scale)

These gaps will cause production failures under real multi-user load. QA in mock mode will not expose them. Mark any scenario relying on real-time data aggregation as `[WILL-FAIL-AT-SCALE]`.

| Gap ID | Feature | SDD Source | Gap Description | Status |
|--------|---------|-----------|-----------------|--------|
| GAP-A01 | Monolithic context hook fires 25+ Firestore reads on mount | SDD-P9, SDD-P8 PP-1, SDD-Architect ARCH-C01 | `use-auth.tsx` creates 35+ state arrays and 50+ functions; at cold start it fires 25+ simultaneous Firestore reads. At 100 concurrent users this generates 2,500 reads/second. The hook has been partially decomposed to 881 lines + 8 domain context files, but the root initialisation issue is not resolved. | `[PARTIAL — decomposed but not lazy]` — P0 |
| GAP-A02 | No service layer — business logic in React components | SDD-Architect ARCH-C02 | Business logic (booking eligibility, makeup credit calculation, package expiry) is embedded directly in React components and context hooks. There is no server-side service layer. This makes unit testing impossible without mounting a full component. | `[NOT-YET-IMPLEMENTED]` — P0 architectural |
| GAP-A03 | No Firestore composite indexes | SDD-P8 PP-5 | Five composite indexes required by query patterns do not exist in `firestore.indexes.json`. Queries that use multi-field ordering/filtering will fail with `FAILED_PRECONDITION` errors in production Firebase. The 5 required indexes: `lessonSlots (conservatoriumId + startTime)`, `lessonSlots (teacherId + status + startTime)`, `lessonSlots (studentId + status)`, `practiceLogs (studentId + logDate)`, `practiceLogs (conservatoriumId + teacherId + logDate)`. | `[NOT-YET-CREATED]` — P0 |
| GAP-A04 | Orphan routes conflict with locale-prefixed routes | SDD-QA QA-C04 | `src/app/page.tsx` and `src/app/dashboard/` exist alongside `src/app/[locale]/page.tsx` and `src/app/[locale]/dashboard/`. Next.js route matching may be ambiguous. | `[NOT-YET-FIXED]` — P0 |
| GAP-A05 | `ministry_director` and `school_coordinator` fall through to legacy dashboard | SDD-QA QA-C03 | These two roles are handled by a generic fallback that shows the legacy admin dashboard. Both roles need dedicated dashboard pages. | `[NOT-YET-IMPLEMENTED]` — P0 |
| GAP-A06 | Eager bundle loading — all role bundles loaded for all users | SDD-Architect ARCH-C03 | The admin bundle (~150KB of admin-only components) is loaded for every user including students. Role-specific code should be lazy-loaded via `next/dynamic`. | `[NOT-YET-IMPLEMENTED]` — architectural |
| GAP-A07 | `// @ts-nocheck` on `src/app/actions.ts` | SDD-QA QA-M01 | The main Server Actions file has `// @ts-nocheck` at the top, disabling all TypeScript type safety on the file. | `[NOT-YET-FIXED]` — code quality |
| GAP-A08 | Hebrew PDF uses character-reversal algorithm (fundamentally broken Unicode) | SDD-Architect ARCH-H03 | `src/lib/pdf/` uses `text.split('').reverse().join('')` to handle RTL Hebrew in PDF output. This is functionally incorrect for Unicode — it breaks multi-byte characters, digits, and punctuation. | `[NOT-YET-FIXED]` — P0 for any PDF export feature |
| GAP-A09 | No error.tsx, loading.tsx, or not-found.tsx | SDD-QA QA-H04 | The entire application has no Next.js error boundary pages, loading skeleton pages, or 404 pages. Any unhandled error shows a blank screen or raw Next.js error overlay. | `[NOT-YET-IMPLEMENTED]` |
| GAP-A10 | Duplicate `.ts`/`.tsx` hook files | SDD-Architect ARCH-M01, ARCH-M02 | At least two domain hook files exist in both `.ts` and `.tsx` variants. The duplicate files will cause TypeScript module resolution ambiguity. | `[NOT-YET-FIXED]` |
| GAP-A11 | `tailwind.config.ts.bak` committed to repo | SDD-Architect ARCH-L03 | A `.bak` backup file is committed in the repository root. | `[NOT-YET-REMOVED]` |
| GAP-A12 | Multi-tenant user identity requires junction table | SDD-P9 | A teacher at two conservatoriums shares one Firebase Auth identity but the current `users` collection stores a single `conservatoriumId`. SDD-P9 requires a `userConservatoriumRoles` junction collection to support teachers with roles at multiple conservatoriums. | `[NOT-YET-IMPLEMENTED]` |

---

### 10.3 P1 — Core Workflow Gaps (must be implemented before first paying user)

| Gap ID | Feature | SDD Source | Gap Description | Status |
|--------|---------|-----------|-----------------|--------|
| GAP-W01 | Attendance marking | SDD-P2 §3.2 | Teachers must mark student attendance (present / absent / excused). There is no `markAttendance` Server Action, no UI in the teacher schedule view, and no `attendanceStatus` field on `LessonSlot`. | `[NOT-YET-IMPLEMENTED]` — P0 for teacher |
| GAP-W02 | Sick leave emergency batch cancellation | SDD-P2 §3.3 | When a teacher calls in sick, admin must trigger batch cancellation of all that teacher's lessons for the day, issue makeup credits to all affected students, and notify all affected families in one action. The `submitSickLeave` batch action does not exist. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-W03 | Self-service rescheduling — no policy enforcement | SDD-P3 §4.1, SDD-P1 §3.5 | Students can reschedule lessons via the UI but there is no enforcement of the cancellation/rescheduling policy (48-hour notice required, maximum reschedules per month, late-cancel = no credit). The `withNotice` field is user-supplied not policy-enforced. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-W04 | Academic year slot generator | SDD-P1 §2 | Admin must generate all recurring lesson slots for the academic year in one batch operation with Israeli national holiday exclusion. The `generateYearlySlots()` function does not exist. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-W05 | Israeli national holiday calendar | SDD-P1 §2 | Scheduling must be aware of Jewish holidays and the Israeli academic year calendar. No holiday calendar source exists. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-W06 | Waitlist management | SDD-P1 §5 | When all teacher slots are full, students join a `WaitlistEntry`. When a slot opens, the system offers it to the next waitlisted student with a 48-hour priority acceptance window. The `WaitlistEntry` type is defined but there is no waitlist UI, no Cloud Function trigger, and no priority-offer notification. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-W07 | Practice log UI — real implementation | SDD-P2 §5, SDD-P3 §5 | The `PracticeLog` type and mock data exist but the practice log page has no working save/read path connected to the real database adapter. | `[PARTIAL — type + mock only]` — P1 |
| GAP-W08 | Structured lesson notes sub-collection | SDD-P2 §4.2 | The SDD specifies `LessonNote` as a sub-collection under `lessonSlots/{slotId}/notes/` with a `studioNote` field (private, never shown to student/parent). Current implementation stores notes as a single string on `LessonSlot`. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-W09 | Substitute teacher matching | SDD-P2 §3.4 | When a teacher is unavailable, admin should search for available substitute teachers who teach the same instrument. There is no substitute matching UI or algorithm. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-W10 | Age-gate birthday upgrade Cloud Function | SDD-P3 §3.1 | When a student under 13 turns 13, the system must upgrade their account type to allow direct login and update Custom Claims. The `dailyAgeGateCheck` scheduled Cloud Function does not exist. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-W11 | AI Matchmaker not wired to enrollment wizard | SDD-P3 §4.2 | `match-teacher-flow.ts` (Genkit flow) exists but the enrollment wizard does not call it. Students complete enrollment without AI teacher recommendations. | `[PARTIAL — flow exists, not wired]` — P1 |
| GAP-W12 | Room double-booking prevention — no Firestore transaction | SDD-P1 §2.3, SDD-P8 RC-1 | The SDD specifies an atomic Firestore transaction using `roomLocks` as coordination primitives to prevent room double-booking. The `roomLocks` collection is in the schema but no code uses it for atomic booking operations. Two concurrent bookings of the same room at the same time will both succeed. | `[NOT-YET-IMPLEMENTED]` — P0 race condition |
| GAP-W13 | Makeup credit double-spending prevention | SDD-P1 §3.2, SDD-P8 RC-2 | Makeup credit redemption is not atomic — a student could theoretically use the same credit for two simultaneous booking requests before either commits. | `[NOT-YET-IMPLEMENTED]` — P0 race condition |
| GAP-W14 | Monthly auto-charge idempotency | SDD-P1 §4.1, SDD-P8 RC-3 | The `monthlyAutoCharge` Cloud Function must be idempotent — running it twice must not charge twice. No idempotency key or execution log exists. | `[NOT-YET-IMPLEMENTED]` |
| GAP-W15 | Dashboard live stats aggregation | SDD-P1 §2.1 | Admin dashboard live stats must come from a `conservatoriumStats/live` document maintained by Cloud Functions, not computed from full collection scans on every page load. No such document or maintenance function exists. | `[NOT-YET-IMPLEMENTED]` — P0 for production scale |

---

### 10.4 P1 — Payment & Financial Gaps

| Gap ID | Feature | SDD Source | Gap Description | Status |
|--------|---------|-----------|-----------------|--------|
| GAP-P01 | Cardcom payment integration — zero real code | SDD-P4 §3, SDD-FIX-18 §5.4 | `src/lib/payments/cardcom.ts` exists but contains placeholder/stub code only. No real Cardcom API calls are made anywhere. All payment flows are UI-only. | `[NOT-YET-IMPLEMENTED]` — P0 for any paid enrollment |
| GAP-P02 | Tranzila, Pelecard, HYP payment providers | SDD-09 §5 | Three of the four Israeli payment providers have only redirect URL stubs. Only Cardcom has documented integration (also not implemented — see GAP-P01). | `[NOT-YET-IMPLEMENTED]` |
| GAP-P03 | BYOD per-tenant secrets (Secret Manager) | SDD-09 full | Google Secret Manager integration for per-tenant payment credentials (`cons_{id}_{service}_{field}` naming) is fully designed but not implemented. `@google-cloud/secret-manager` package not installed. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-P04 | Installment payments (תשלומים) | SDD-P4 §3.2 | Israeli parents expect to split annual fees into monthly instalments (1–12 payments). Cardcom supports `MaxPayments` parameter. No instalments UI or logic exists. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-P05 | Cardcom webhook HMAC verification | SDD-06 §6 | `/api/cardcom-webhook` exists but HMAC body verification of the webhook payload is not implemented. Any HTTP request to this endpoint can fake a successful payment. | `[NOT-YET-IMPLEMENTED]` — P0 security |
| GAP-P06 | Section 46 Tax API (donation reporting) | Israeli law | Israeli law mandates donation receipts be reported to the Tax Authority via the Section 46 API from January 1, 2026. No implementation exists. | `[NOT-YET-IMPLEMENTED]` — P0 legal obligation (already past deadline) |
| GAP-P07 | Teacher payroll CSV export | SDD-FIX-12, SDD-P1 §4 | Admin must export a UTF-8 BOM CSV of teacher hours per month for external HR systems (Hilan/Merav Digital). The payroll page exists but export functionality is not implemented. Note: Lyriosa is NOT a payroll/tax calculation system — CSV export only. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-P08 | Teacher payroll self-view | SDD-FIX-12 §4 | Teachers must be able to view their own payroll report at `/dashboard/teacher/payroll`. No such route exists. | `[NOT-YET-IMPLEMENTED]` |

---

### 10.5 P1 — Integration Gaps (SMS/Email/Calendar/OAuth)

| Gap ID | Feature | SDD Source | Gap Description | Status |
|--------|---------|-----------|-----------------|--------|
| GAP-I01 | WhatsApp / SMS notifications — no real integration | SDD-P4 §4, SDD-P2 §3 | The notification dispatcher code exists (`src/lib/notifications/dispatcher.ts`) but has no Twilio credentials. No SMS or WhatsApp message is ever actually sent. | `[NOT-YET-INTEGRATED]` — P1 |
| GAP-I02 | Email notifications — no real integration | SDD-09 §1 | SendGrid/Resend integration for email sending has no credentials configured. No transactional email is ever sent. | `[NOT-YET-INTEGRATED]` — P1 |
| GAP-I03 | Google Calendar sync | SDD-P2 §5 | `calendar-sync.ts` Cloud Function spec exists in `functions/` but is not deployed. Teachers' lesson schedules are never synced to Google Calendar. | `[NOT-YET-DEPLOYED]` — P2 |
| GAP-I04 | Google/Microsoft OAuth — buttons show "Coming Soon" | SDD-FIX-17 | Login page shows disabled OAuth buttons. Full progressive registration OAuth flow is designed (check if Lyriosa user exists for OAuth email; if not, redirect to wizard with pre-filled fields; skip password step for OAuth registrations). Firebase Auth providers are built-in but not configured. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-I05 | Google Maps / Places API for conservatorium addresses | SDD-FIX-15 §2.4 | Conservatorium profile address field is free text. SDD specifies Google Places Autocomplete with `googlePlaceId` and `coordinates` stored. | `[NOT-YET-IMPLEMENTED]` — P2 |
| GAP-I06 | Remote rental signature via OTP link | SDD-FIX-09 | Admin currently signs rental agreements on the admin screen — this is legally invalid. SDD specifies: admin creates rental → system sends a WhatsApp/SMS link with a signed token to the parent → parent opens `/rental-sign/[token]` on their phone, verifies via OTP, and signs digitally. The `signingToken` field exists in the type but the route, OTP flow, and mobile signature UI do not exist. | `[NOT-YET-IMPLEMENTED]` — P1 legal requirement |

---

### 10.6 P2 — Module Completeness Gaps

Features that have UI and mock data but are not connected to real functionality.

| Gap ID | Feature | SDD Source | Gap Description | Status |
|--------|---------|-----------|-----------------|--------|
| GAP-M01 | Gamification — only 2 of 15+ achievement types | SDD-P3 §5 | `AchievementType` union in the SDD has 15+ values. Code only implements 2. Achievement checking logic does not exist. | `[PARTIAL]` — P2 |
| GAP-M02 | Sheet music PDF viewer | SDD-P3 §4 | The `SheetMusicViewer` component exists but PDF rendering is not implemented. | `[PARTIAL — UI shell only]` — P2 |
| GAP-M03 | Multimedia practice feedback (audio/video) | SDD-P2 §5, SDD-P3 §5 | Teachers can record audio/video feedback for student practice logs. Storage upload and playback exist in the type system but UI is not implemented. | `[NOT-YET-IMPLEMENTED]` — P2 |
| GAP-M04 | Exam curriculum tracker | SDD-P3 §4.3 | Students working toward Israeli national music exams need an `ExamPrepTracker` tracking required repertoire items, completed exercises, and exam eligibility. Not implemented. | `[NOT-YET-IMPLEMENTED]` — P2 |
| GAP-M05 | Group/ensemble lesson data model | SDD-P1 §3 | `LessonSlot.type` includes `GROUP` but there is no `EnsembleGroup` entity, no multi-student slot booking UI, and no ensemble-aware billing. | `[NOT-YET-IMPLEMENTED]` — P2 |
| GAP-M06 | Playing School — full implementation | SDD-PS | Playing School has a distinct `school_coordinator` role, 3 new Firestore collections, and a full schedule redesign (4 view modes). Current code has UI + mock data only. | `[PARTIAL — UI + mock only]` — P2 |
| GAP-M07 | Alumni auto-creation on graduation + self-service portal | SDD-FIX-14 | When admin marks a student as "Graduated", an `AlumniProfile` must be created automatically (private by default). Alumni self-service portal at `/dashboard/alumni/profile`. Current alumni page shows mock data only. | `[PARTIAL — mock data only]` — P2 |
| GAP-M08 | Master classes — package allowance tracking | SDD-FIX-14 §2.3 | `StudentMasterClassAllowance` type is defined but not tracked. Students with packages get X master classes per term — no allocation logic or counter UI exists. | `[NOT-YET-IMPLEMENTED]` — P2 |
| GAP-M09 | Form builder — conditional field logic | SDD-FIX-13 §1.2 | The dynamic form builder lacks `conditional_group` fields (show/hide based on another field value), the `signature` field type, and the recital form pre-built template. | `[PARTIAL]` — P2 |
| GAP-M10 | Forms section — visibility bug (shows only drafts) | SDD-FIX-13 §1.1 | `/dashboard/forms/page.tsx` filters to `status === 'draft'` only. Submitted forms appear in Approvals but not in Forms. The filter should show all forms relevant to the user's role and conservatorium. | `[NOT-YET-FIXED]` — P1 bug |
| GAP-M11 | Messages — no "Compose New Message" when inbox is empty | SDD-FIX-13 §2 | If a user has no conversation history, the Messages page shows an empty state with no way to start a new conversation. The "New Message" button and compose dialog are not implemented. | `[NOT-YET-IMPLEMENTED]` — P1 UX |
| GAP-M12 | Scholarship action buttons non-functional | SDD-FIX-07 | Scholarship application approve/reject/mark-paid buttons in the admin UI do not call any Server Action — they are UI-only. | `[NOT-YET-WIRED]` — P1 |
| GAP-M13 | Events — not editable after creation | SDD-FIX-06 | Created events cannot be edited. There is no event edit form, no `updateEvent` Server Action, and no venue/location field on the `Event` type. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-M14 | Open Day admin — no session management or teacher assignment | SDD-FIX-08 | Open Day admin view only shows visitor registrations. SDD requires session slot management (time slots, capacity) and teacher assignment to sessions. | `[NOT-YET-IMPLEMENTED]` — P2 |
| GAP-M15 | AI Agents (scheduling, practice, lesson-prep, admin) | SDD-10 | SDD specifies 4 AI agents with tool-calling capabilities, conversational UIs, and context retrieval from DB. Current code has stubs only (`STUB:ai-coach` for practice, `STUB:ai-reschedule` for scheduling). No real AI tool integration exists. | `[NOT-YET-IMPLEMENTED]` — stubs only |
| GAP-M16 | Smart Slot Filling | SDD-12 | SDD specifies AI-driven slot optimization that analyzes teacher availability patterns, student preferences, and historical data to suggest optimal slot assignments. No implementation exists beyond a Genkit flow stub. | `[NOT-YET-IMPLEMENTED]` |
| GAP-M17 | Musicians for Hire | SDD-13 | SDD specifies a marketplace for hiring musicians for events with booking calendar, portfolio pages, and payment integration. Current code is UI + mock data only. | `[PARTIAL — UI + mock only]` |
| GAP-M18 | Seat booking with SVG map | SDD-FIX-06 §5 | SDD specifies interactive seat selection for event/performance booking using an SVG venue map with zoom, section highlighting, and real-time availability. No implementation exists. | `[NOT-YET-IMPLEMENTED]` |
| GAP-M19 | AI poster generation | SDD-FIX-06 §4 | SDD specifies AI-generated event posters using Gemini/Imagen 3.0. Current code has a stub placeholder only. | `[NOT-YET-IMPLEMENTED]` — stub only |
| GAP-M20 | Board Director dashboard | SDD-P5 §Gap 5 | SDD specifies a Board Director (`board_director`) persona with a dedicated dashboard showing financial summaries, KPIs, budget vs. actual. No role or dashboard exists in code. | `[NOT-YET-IMPLEMENTED]` |
| GAP-M21 | Data archival engine | SDD-P5 §Gap 4 | SDD specifies automated data archival with configurable retention policies per entity type, graduated student record anonymization (7-year rule), and archival Cloud Functions. No automation exists. | `[NOT-YET-IMPLEMENTED]` |
| GAP-M22 | Real-time collaborative editing on forms | SDD-08 §6 | SDD mentions real-time collaborative editing for multi-person form workflows. Current implementation is sequential approval, not collaborative. | `[NOT-YET-IMPLEMENTED]` |

---

### 10.7 P2 — UI/UX Spec Compliance Gaps

| Gap ID | Feature | SDD Source | Gap Description | Status |
|--------|---------|-----------|-----------------|--------|
| GAP-U01 | Sidebar navigation — flat list (26 items for admin) | SDD-NAV-01 | The admin sidebar has 26 ungrouped flat links. SDD-NAV-01 specifies 7 collapsible groups using the existing `SidebarGroup`/`SidebarGroupLabel`/`SidebarGroupContent` components that are exported but unused. The Intelligence group should collapse by default. `newFeaturesEnabled` feature flag gates the rollout. | `[NOT-YET-IMPLEMENTED]` — P2 |
| GAP-U02 | Icon ambiguity — 3x BrainCircuit, 3x Calendar in nav | SDD-NAV-01 §1.2.1 | Three nav items use `BrainCircuit` and three use `Calendar`. SDD-NAV-01 provides a canonical icon assignment table with unique icons per feature. | `[NOT-YET-FIXED]` — P2 |
| GAP-U03 | Conservatorium profile — structured opening hours | SDD-FIX-15 §2.3 | Opening hours is a free-text field. SDD specifies a structured day-by-day editor with open/closed toggle and time pickers stored as `OpeningHours` interface. | `[NOT-YET-IMPLEMENTED]` |
| GAP-U04 | "What's New" feed not working | SDD-FIX-15 §1 | The dashboard "What's New" section exists but shows nothing. SDD specifies a `WhatsNewFeed` component aggregating announcements, events, pending forms, schedule changes, and payment reminders. | `[NOT-YET-IMPLEMENTED]` — P2 |
| GAP-U05 | About page — partial teacher display + no bio expansion | SDD-FIX-18 §2 | About page shows only a subset of teachers. No teacher bio expansion sheet (click card → full bio modal/sheet). SDD specifies a `TeacherCard` with hover overlay and expandable `Sheet` component. | `[PARTIAL]` — P2 |
| GAP-U06 | Landing page missing full redesign sections | SDD-FIX-18 §3 | Landing page is missing: Find Conservatory inline search, "How It Works" 3-step section, Upcoming Events section, Open Days banner, and Donate CTA. | `[PARTIAL]` — P2 |
| GAP-U07 | SEO metadata missing on public pages | SDD-FIX-18 §5.3, SDD-Architect ARCH-H04 | Public pages have no `generateMetadata()` export, no `<title>` tags, no Open Graph tags, and no `hreflang` alternate links for the 4 locales. | `[NOT-YET-IMPLEMENTED]` — P1 for launch |
| GAP-U08 | No mobile menu on public navbar | SDD-QA QA-H05 | The public-facing navbar has no mobile hamburger menu. On screens < 768px the navigation links are either hidden or overflow. | `[NOT-YET-IMPLEMENTED]` — P1 |
| GAP-U09 | Password field pre-filled with literal `'password'` | SDD-QA QA-H01 | The login form `defaultValues` includes `password: 'password'` — the literal string "password" is pre-filled in the password field. | `[NOT-YET-FIXED]` — P1 bug |
| GAP-U10 | Smart room assignment — instrument free text mismatch | SDD-FIX-10 | Room instrument equipment is stored as free text, causing matching failures. SDD specifies a `RoomInstrumentEquipment` interface with `ConservatoriumInstrument.id` references and a scoring algorithm `scoreRoom()` / `allocateRoom()`. | `[NOT-YET-IMPLEMENTED]` — P2 |
| GAP-U11 | Israeli ID validation missing | SDD-FIX-04 §3 | Israeli ID (ת"ז) validation with the Luhn-like 9-digit checksum (`validateIsraeliId()`) is specified as mandatory for all persons but does not exist. Registration wizards accept any input for ID number. | `[NOT-YET-IMPLEMENTED]` — P1 legal requirement |
| GAP-U12 | `delegated_admin` role — configurable permissions | SDD-FIX-02 | The `delegated_admin` role exists in the type system but has no configurable `AdminSection[]` permissions. All admin pages treat `delegated_admin` identically to `conservatorium_admin`. | `[NOT-YET-IMPLEMENTED]` — P2 |
| GAP-U13 | Approvals — bulk actions broken | SDD-FIX-05 §3 | The bulk action checkboxes exist but the handler does not read the `selectedIds` state — bulk approve/reject calls are never made. | `[NOT-YET-FIXED]` — P1 bug |
| GAP-U14 | Approvals — "For Your Treatment" tab shows nothing | SDD-FIX-05 §2 | The "לטיפולך" tab in approvals is empty because the filter uses a wrong field or mock data is missing `requiredApproverRole` values. | `[NOT-YET-FIXED]` — P1 bug |
| GAP-U15 | Composer dropdown shows nothing (value/id mismatch) | SDD-FIX-03 §3 | Composer search dropdown uses `value={c.name}` but the form field stores `composerId` — the value never matches. Composer selection always fails silently. | `[NOT-YET-FIXED]` — P1 bug |
| GAP-U16 | `Status.REVISION_REQUIRED` i18n key missing — crashes Hebrew locale | SDD-FIX-03 §4, SDD-FIX-05 §4 | The `Status.REVISION_REQUIRED` translation key is absent from all locale files. Any form/approval with this status crashes the Hebrew rendering with an `[Status.REVISION_REQUIRED]` placeholder visible in the UI. | `[NOT-YET-FIXED]` — P0 crash bug |
| GAP-U17 | Translation tooling — PowerShell encoding corruption | SDD-FIX-16 | Translation files modified via PowerShell are corrupted (UTF-16 LE encoding destroys Hebrew/Arabic multi-byte characters). SDD-FIX-16 specifies a `scripts/i18n/` directory of Node.js `.mjs` scripts. The CI audit script (`i18n:audit`) and batch status-key fixer (`i18n:fix-status`) are not implemented. | `[NOT-YET-IMPLEMENTED]` — P0 infrastructure |
| GAP-U18 | Magic link loading state never resets on failure | SDD-QA QA-H02 | When magic link sending fails, the loading spinner never stops — the login button is permanently disabled. | `[NOT-YET-FIXED]` — P1 bug |

---

### 10.8 P2 — Code Quality & Correctness Issues

| Gap ID | Issue | SDD Source | Description | Status |
|--------|-------|-----------|-------------|--------|
| GAP-Q01 | `useToast()` called inside a regular function (React rules violation) | SDD-QA QA-H03 | `useToast()` is invoked inside `handleApprove()` — a regular event handler function. React Hooks must only be called at the top level of a component. This will throw in React Strict Mode and in any React 19 runtime check. | `[NOT-YET-FIXED]` — P1 crash |
| GAP-Q02 | All public pages lack `generateMetadata()` | SDD-Architect ARCH-H04 | Landing page, About page, Open Day page, and all public conservatorium pages have no `title`, `description`, `openGraph`, or `alternates` metadata exports. | `[NOT-YET-IMPLEMENTED]` |
| GAP-Q03 | Mock data bundled to client | SDD-Architect ARCH-M03 | `src/lib/data.ts` (500KB+) is imported client-side, inflating the initial JS bundle. In production, mock data should only be served server-side. | `[NOT-YET-FIXED]` |
| GAP-Q04 | Makeup credit balance does not check expiry | SDD-QA QA-M05 | `getMakeupCreditBalance()` returns the total of all `AVAILABLE` credits regardless of `expiresAt`. The 60-day expiry exists in `getMakeupCreditsDetail()` but is not applied to the balance calculation. | `[NOT-YET-FIXED]` — P1 correctness |
| GAP-Q05 | `getConsentStatus` leaks another user's consent data | SDD-P7 SEC finding | `getConsentStatus` server action accepts `{ userId }` from the caller with no ownership validation. Already listed as FIX-39. | See FIX-39 |
| GAP-Q06 | Composer/composition names not multilingual | SDD-FIX-03 §5 | `Composer` and `Composition` types have single-language names. SDD specifies `names: { he, en, ru?, ar? }` for full multilingual support. Currently all compositions display Hebrew names regardless of locale. | `[NOT-YET-IMPLEMENTED]` |
| GAP-Q07 | Admin registration does not auto-select conservatorium | SDD-FIX-04 §1 | When a `conservatorium_admin` creates a new user, the conservatorium field is not pre-populated from the admin's own `conservatoriumId`. Admin must manually select it each time. | `[NOT-YET-FIXED]` — P2 UX |

---

> **QA Note on deferred scenarios:** Any existing QA scenario that touches an area listed above should be annotated with the relevant `GAP-` ID and status tag. During execution, scenarios marked `[BLOCKED — infrastructure gap]`, `[NOT-YET-IMPLEMENTED]`, or `[WILL-FAIL-AT-SCALE]` should be logged to the gap tracker and not counted as failures against the QA gate criteria (Section 8). They should be counted as deferred items for the implementation sprint that follows QA.

---

> **Scenario correction note (v1.6):** The following previously-authored test scenarios assume behaviour that contradicts the SDD and should be corrected during test execution:
>
> - **All SEC-* scenarios assuming Firestore rules are deployed** (SEC-03, SEC-04, any cross-tenant Firestore test): tag as `[BLOCKED — GAP-S01]` until rules are deployed.
> - **SB-* scenarios testing attendance marking** (if any): tag as `[BLOCKED — GAP-W01]` — no server action exists.
> - **BF-* scenarios testing real Cardcom payment flow**: tag as `[BLOCKED — GAP-P01]` — all payment code is stub-only.
> - **Any scenario testing "For Your Treatment" tab in approvals**: tag as `[BLOCKED — GAP-U14]`.
> - **Any scenario testing bulk approve/reject in approvals**: tag as `[BLOCKED — GAP-U13]`.
> - **Any scenario relying on `Status.REVISION_REQUIRED` rendering in Hebrew**: tag as `[BLOCKED — GAP-U16]` — will crash with i18n key placeholder.
> - **LC-20 and LC-21 (DSAR export/delete)**: already tagged `[BLOCKED-STUB]` per FIX-27/FIX-37; root SDD gap is GAP-M21.
> - **Any AI flow scenarios for practice coach, reschedule assistant**: tag as `[PARTIAL — UI stub only]` per GAP-M15 through GAP-M16.

---

## 11. Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-03-14 | Initial consolidation from 9 domain plans (468 scenarios, 17 INT, 18 FIX) |
| v1.1 | 2026-03-14 | Added INT-18..24, extended INT-04/06/14, FIX-19..21 |
| v1.2 | 2026-03-14 | Forms lifecycle rewrite (INT-14A..I), FIX-22 |
| v1.3 | 2026-03-14 | INT-14J (recital 3-path creator test) |
| v1.4 | 2026-03-14 | SDD reconciliation, INT-14K, FIX-23/24 |
| v1.5 | 2026-03-14 | Incorporated PM review (62 scenarios across 8 domains, 8 PM blockers FIX-25..32, 6 integration scenarios INT-25..30) + Security review (12 SEC scenarios, 2 CRITICAL + 5 HIGH findings as FIX-33..39, 21 security gate criteria G-01..G-21) + SDD vs code gap analysis (Section 10, 10 features). Total scenario count: ~557. |
| v1.5.1 | 2026-03-14 | Stakeholder clarifications: (1) Student recital forms confirmed correct. (2) Ministry sees ALL approved forms — FIX-23 removed, INT-14K demoted to P3-FUTURE. (3) Deployment target is Vercel + Supabase, not Firebase — all Firebase-specific assumptions removed; auth provider abstraction (`AUTH_PROVIDER=firebase\|supabase`) documented; test environments updated to Vercel + Supabase primary; security findings FIX-33/34 and gates G-01/G-02/G-13 reframed as provider-agnostic (Supabase RLS + Firebase rules); SEC-01/SEC-12 updated for dual-provider testing. |
| v1.6 | 2026-03-14 | Complete reading of all 55 SDD documents finalised (9 architecture docs + 19 feature SDDs + 12 persona audits + 15 fix specs + SDD-NAV-01). Section 10 expanded from 10 entries to 60+ gaps across 8 categories (GAP-S01..S09 security, GAP-A01..A12 architecture, GAP-W01..W15 workflows, GAP-P01..P08 payments, GAP-I01..I06 integrations, GAP-M01..M22 modules, GAP-U01..U18 UI/UX, GAP-Q01..Q07 code quality). Scenario correction notes added for 8 categories of previously-authored tests that must be tagged as blocked/deferred. No new test scenarios added in v1.6 (gap analysis and corrections only). Total scenario count: ~556 (unchanged from v1.5.1). |

---

*End of Master QA Plan — version 1.6 — 2026-03-14*
