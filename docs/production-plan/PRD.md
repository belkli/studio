# Harmonia Platform - Product Requirements Document (PRD)

**Version:** 1.0
**Author:** PM Agent
**Date:** 2026-03-06
**Status:** APPROVED - Drives Production Readiness Plan

---

## 1. Executive Summary

Harmonia is a multi-tenant SaaS platform that digitises Israeli music conservatorium operations. The system currently exists as a **high-fidelity functional prototype** with complete UI for all 17+ modules, 8 active Genkit AI flows, 4-locale i18n infrastructure (he/ar/en/ru), and a typed database abstraction layer supporting 5 backends. However, **zero real data persistence, authentication, payments, or notifications are functional** - the entire system runs on in-memory mock data with no security enforcement.

This PRD identifies the gaps between the current prototype and a production-ready system, prioritised by severity and business impact. The findings are informed by 7 architecture documents, 5 persona audits, 5 QA reports, 60+ SDD specifications, and direct source code review.

### Production Readiness Score: 35/100

| Area | Score | Reason |
|------|-------|--------|
| UI/UX Completeness | 85/100 | Full UI for all modules; some accessibility/RTL gaps |
| Authentication & Security | 5/100 | No real auth; `verifyAuth()` always returns true |
| Data Persistence | 10/100 | FirebaseAdapter is a MemoryDatabaseAdapter stub |
| Payments | 5/100 | Cardcom code exists but returns mock URLs |
| Notifications | 15/100 | Twilio dispatcher code is production-ready but inactive |
| i18n | 70/100 | Hebrew/English complete; Arabic 99.5%; Russian 59% |
| Performance | 20/100 | Monolithic 2364-line context causes universal re-renders |
| Infrastructure | 25/100 | apphosting.yaml present; no CI/CD, no Security Rules |
| AI Features | 90/100 | 8 Genkit flows active and wired to server actions |

---

## 2. Priority Framework

| Priority | Definition | Timeline |
|----------|-----------|----------|
| **P0 - Blocker** | Cannot launch without this. Security/legal/data-integrity risk. | Must be done first |
| **P1 - Critical** | Core user journey broken without this. Revenue or compliance impact. | Required for launch |
| **P2 - Important** | Significant UX friction or missing capability. Can launch without but degrades experience. | Sprint 2-3 |
| **P3 - Nice-to-Have** | Enhances experience. Can be post-launch. | Backlog |

---

## 3. P0 - Production Blockers

### 3.1 Authentication & Session Management

**Current State:** Login does email-only lookup in mock array. No password check. `harmonia-user=1` cookie has no cryptographic content. `verifyAuth()` returns `true` unconditionally. Any user can invoke any Server Action.

**Required:**
- [ ] Replace mock `login()` with Firebase `signInWithEmailAndPassword`
- [ ] Implement Firebase session cookies via `admin.auth().createSessionCookie()`
- [ ] Create `src/middleware.ts` that validates `__session` cookie on every request
- [ ] Deploy `onUserApproved` Cloud Function to set Custom Claims `{ role, conservatoriumId, approved }`
- [ ] Replace `verifyAuth(): return true` with real Claims validation
- [ ] Add `requireRole(allowedRoles, conservatoriumId?)` function for Server Actions
- [ ] Remove pre-filled mock password from login form

**Impact:** Without this, any person on the internet can access any data in the system, including PII of Israeli minors.

### 3.2 Firestore Security Rules & Data Persistence

**Current State:** `FirebaseAdapter` is an 8-line stub extending `MemoryDatabaseAdapter`. No data persists between server restarts. `firestore.rules` is an incomplete template.

**Required:**
- [ ] Implement real `FirebaseAdapter` with Firestore SDK calls for all 17 `DatabaseAdapter` repositories
- [ ] Deploy complete Firestore Security Rules with tenant isolation (`conservatoriumId`)
- [ ] Deploy Firebase Storage Security Rules (no public URLs for PII - practice videos, signatures)
- [ ] Deploy all 10 composite Firestore indexes
- [ ] Create Firestore-to-Firestore migration scripts from seed data

**Impact:** Without data persistence, the system resets on every deployment. Without Security Rules, all Firestore data is accessible to any authenticated user regardless of tenant.

### 3.3 Zod Schema Validation Gaps

**Current State:** Three high-impact Server Action schemas use `z.any()`: `FormSubmissionSchema`, `UserSchema`, `LessonSchema`. This means arbitrary payloads can be written to the database.

**Required:**
- [ ] Replace `FormSubmissionSchema = z.any()` with comprehensive schema
- [ ] Replace `UserSchema = z.any()` with comprehensive schema
- [ ] Replace `LessonSchema = z.any()` with comprehensive schema

**Impact:** Allows injection of arbitrary data structures, potential for data corruption and XSS payloads stored in the database.

### 3.4 PDPPA Compliance (Israeli Privacy Law)

**Current State:** Types defined for `ConsentRecord`, `SignatureAuditRecord`, `ComplianceLog` but none are wired to UI or backend. Harmonia stores Israeli ID numbers of minors, video recordings, financial data.

**Required:**
- [ ] Wire `ConsentRecord` collection to registration and data-processing consent UI
- [ ] Implement `ComplianceLog` audit trail for all PII access
- [ ] Implement right-to-erasure (data deletion) admin action
- [ ] Deploy Firebase project to `europe-west1` or `me-central1` for data residency
- [ ] Ensure under-13 data is never sent directly to the child (route to parent)
- [ ] Signed URLs only for practice videos, signatures, photos (no public Storage URLs)

**Impact:** Israeli privacy law violation carries regulatory penalties. Storing minors' PII without proper consent records and data protection is a legal blocker.

### 3.5 TypeScript Build Error Suppression

**Current State:** `next.config.ts` has `typescript.ignoreBuildErrors: true`. TypeScript errors are silently suppressed in production builds.

**Required:**
- [ ] Remove `ignoreBuildErrors: true` from next.config.ts
- [ ] Fix all underlying TypeScript errors (known: missing `school_coordinator` key in walkthrough config, @ts-nocheck on users page)

**Impact:** Type-unsafe code ships to production. Security-sensitive code paths (user management, forms) have no compile-time safety.

---

## 4. P1 - Critical for Launch

### 4.1 Payment Gateway Integration (Cardcom)

**Current State:** `src/lib/payments/cardcom.ts` has full Cardcom API integration code (hosted payment page, recurring token charge, webhook handler, installment calculator). All code paths return mock URLs when `CARDCOM_TERMINAL_NUMBER` is not set.

**Required:**
- [ ] Configure Cardcom sandbox terminal for staging
- [ ] Configure Cardcom production terminal
- [ ] Implement Cardcom webhook handler at `/api/cardcom-webhook` with HMAC-SHA256 validation
- [ ] Wire installment support (1-12 payments - critical for Israeli market)
- [ ] Add `subtotal`, `discounts`, `vatAmount` (17% Israeli VAT), `paidAmount`, `paymentMethod`, `installments`, `pdfUrl` to Invoice type
- [ ] Implement recurring monthly auto-charge scheduler (Cloud Function)

**Impact:** No revenue without payments. Installments (tashlumim) are culturally essential in Israel.

### 4.2 Notification Delivery (Twilio SMS/WhatsApp)

**Current State:** `src/lib/notifications/dispatcher.ts` is production-ready code (245 lines). Real Twilio REST API calls for SMS and WhatsApp. Falls back to `console.warn` when credentials missing. Quiet-hours logic, Israeli phone normalisation all implemented.

**Required:**
- [ ] Configure Twilio account (SID, Auth Token, phone numbers)
- [ ] Configure WhatsApp Business sender
- [ ] Test notification delivery for: teacher sick leave, payment failure, makeup credit expiry, form approval, lesson reminder

**Impact:** WhatsApp is Israel's primary communication channel. Parents expect instant cancellation notifications.

### 4.3 Cloud Functions Deployment

**Current State:** 6 Cloud Function specifications exist as typed pseudocode in `src/lib/cloud-functions/`. None are deployed.

**Required (priority order):**
- [ ] `bookLessonSlot` - Booking atomicity with Firestore transactions (prevents double-booking)
- [ ] `bookMakeupLesson` - Atomic credit redemption
- [ ] `onLessonCancelled` / `onLessonCompleted` - Auto-issue makeup credits, update stats
- [ ] `generatePayrollExport` - Teacher payroll CSV for Hilan/Merav Digital
- [ ] `getIsraeliHolidaysForYear` - Hebcal API integration for closure calendar
- [ ] `syncTeacherCalendars` - Google Calendar two-way sync (scheduled every 15min)

**Impact:** Without booking atomicity, concurrent bookings will cause double-bookings and data corruption.

### 4.4 Context Decomposition & React Query

**Current State:** `src/hooks/use-auth.tsx` is a 2,364-line monolithic React Context holding 35+ state arrays and 170+ mutation functions. Every state change re-renders the entire app. `@tanstack/react-query` is not installed.

**Required:**
- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [ ] Split `useAuth()` into minimal auth context + domain-specific hooks
- [ ] Implement domain hooks with React Query: `useLessons`, `useInvoices`, `useForms`, etc.
- [ ] Add Firestore `onSnapshot` real-time listeners for booking calendar and admin live dashboard

**Impact:** A student currently downloads admin payroll data. Performance targets (LCP < 2.5s, INP < 200ms) are unachievable with the current architecture.

### 4.5 IS 5568 Accessibility Compliance

**Current State:** Accessibility statement page exists. Footer link present. Security headers configured. Some ARIA labels missing, focus management incomplete.

**Required:**
- [ ] Audit and fix all interactive elements for ARIA labels (especially sidebar-nav.tsx)
- [ ] Add skip-to-content link in dashboard layout
- [ ] Verify colour contrast ratios for Hebrew text (4.5:1 for normal, 3:1 for large)
- [ ] Ensure keyboard navigation in logical RTL tab order
- [ ] Test with NVDA (Windows) and VoiceOver (iOS)

**Impact:** IS 5568 compliance is legally mandatory for Israeli education providers. Penalty: up to NIS 50,000 per complaint with no proof of harm required.

### 4.6 Digital Signature Flow

**Current State:** `react-signature-canvas` package installed. `requiresSignature` flag exists on form workflow steps. `SignatureAuditRecord` type defined. No actual canvas component or audit trail implementation.

**Required:**
- [ ] Build signature capture component using `react-signature-canvas`
- [ ] Generate SHA-256 hash of signature + document content
- [ ] Store `SignatureAuditRecord` with timestamp and IP
- [ ] Embed signatures in exported PDF forms for Ministry submission

**Impact:** Ministry of Education forms require parent/teacher signatures to be legally valid.

### 4.7 RTL Logical Properties Audit

**Current State:** Most spacing uses CSS Logical Properties (ms-/me-, ps-/pe-). Some violations found: login form `dir="rtl"` hardcoded, signature dialog `dir="rtl"` hardcoded.

**Required:**
- [ ] Replace all hardcoded `dir="rtl"` with locale-aware direction
- [ ] Audit and fix: `margin-left/right` -> `margin-inline-start/end`, `padding-left/right` -> `padding-inline-start/end`, `text-align: left/right` -> `text-align: start/end`
- [ ] Fix login form tabs `dir` (BUG-05)

**Impact:** Arabic and English users experience broken layouts on specific components.

---

## 5. Feature Evaluation Per Persona

### 5.1 Conservatorium Administrator (Persona P1)

**Role:** `conservatorium_admin` / `site_admin` / `delegated_admin`

| Feature | UI Status | Data Status | Gaps |
|---------|-----------|-------------|------|
| Admin Command Center | Built | Mock aggregations | No real-time stats; needs Cloud Function-maintained `stats/live` doc |
| User Management & Approvals | Built | Mock CRUD | `@ts-nocheck` on users page; no server-side role validation |
| Scheduling & Master Schedule | Built | Mock | No booking atomicity; no room double-booking prevention |
| Payment & Billing | Built | Mock | No Cardcom integration; no real invoicing |
| Payroll Export | Built | Mock | CF spec only; no actual CSV generation |
| Room Management | Built | Mock | Room allocation algorithm active; no persistence |
| Instrument Inventory & Rentals | Built | Mock | Full UI present |
| Events & Open Day | Built | Mock | Full UI present |
| Scholarships & Donations | Built | Mock | Full UI present |
| Ministry Form Distribution | Built | Mock | Form builder present |
| Delegated Admin Permissions | Built | Mock | Section-level permissions working in sidebar |
| Playing School Management | Built | Mock | No admin role guard (SEC-03) |
| AI Alerts & Smart Slot Filling | Built | Active AI flows | Genkit flows working |

**Critical Gaps:** No real auth (any email logs in), no data persistence, no financial operations, no payroll export.

**UX Friction:** Dashboard loads all data for all roles. Admin-specific pages accessible by non-admins via URL.

### 5.2 Music Teacher (Persona P2)

| Feature | UI Status | Data Status | Gaps |
|---------|-----------|-------------|------|
| Daily Lesson View | Built | Mock | No real-time schedule updates |
| Attendance Marking | Built | Mock | `teacherNote` exists but no structured notes UI |
| Availability Templates | Built | Mock | Weekly + exception model correct |
| Sick Leave & Substitute | Built | Mock | `SickLeaveModal` exists in UI; CF spec only |
| LMS & Practice Logs | Built | Mock | Practice log form exists; no sheet music viewer |
| Repertoire Assignment | Built | Mock | Full UI present |
| AI Progress Reports | Built | Active AI | `draft-progress-report-flow.ts` active |
| Payroll Statement | Built | Mock | Teacher can see payroll page; no real data |
| Musicians for Hire | Built | Mock | Profile editor + booking system present |
| Calendar Sync | Not Built | Spec only | No Google Calendar OAuth or sync function |
| Teacher Profile | Built | Mock | No role guard on profile page (PERSONA-02) |

**Critical Gaps:** No calendar sync (teachers work at multiple conservatoriums). No data persistence for lesson notes.

**UX Friction:** Teacher downloads student payment data and admin reports via monolithic context. Sick leave flow exists in UI but has no backend enforcement.

### 5.3 Student (Persona P3)

| Feature | UI Status | Data Status | Gaps |
|---------|-----------|-------------|------|
| Enrollment Wizard | Built | Mock | AI Matchmaker flow exists but not called from UI |
| Self-Service Booking | Built | Mock | No cancellation policy enforcement on reschedule |
| Practice Logs & Gamification | Built | Mock | 7-day streak detection works; only 2 achievement types |
| Assigned Repertoire | Built | Mock | Full UI present |
| Form Submission | Built | Mock | Recital + conference forms complete |
| Schedule View | Built | Mock | Calendar component working |
| Profile & Progress | Built | Mock | Student profile page present |
| Waitlist | Built | Mock | 48-hour priority offer model specified |
| Practice Video Upload | Type defined | Mock | No Firebase Storage upload, no playback component |
| Onboarding Walkthrough | Built | Mock | `WalkthroughManager` with `driver.js` present |

**Critical Gaps:** AI Matchmaker not connected to enrollment wizard. No real booking enforcement. No age-gate runtime enforcement for under-13.

**UX Friction:** Student downloads admin-level data through monolithic context. Walkthrough renders twice (BUG-02 - in both root layout and dashboard layout).

### 5.4 Parent / Guardian (Persona P4)

| Feature | UI Status | Data Status | Gaps |
|---------|-----------|-------------|------|
| Family Hub (multi-child) | Built | Mock | Aggregated view for `childIds` present |
| Invoice & Payment | Built | Mock | No real Cardcom payment processing |
| Installment Payments | Specified | Not built | Critical for Israeli market (tashlumim) |
| WhatsApp Notifications | Code ready | Inactive | Twilio code present, needs credentials |
| Digital Signatures | Package installed | Not wired | `react-signature-canvas` in deps; no canvas UI |
| Ministry Form Signing | Built | Mock | Signature step exists in workflow; no actual capture |
| Scholarship Application | Built | Mock | Application form working |
| Notification Preferences | Built | Mock | Channel selection (WhatsApp/SMS/Email) + quiet hours |
| Package Renewal | Built | Mock | Package browsing and selection present |

**Critical Gaps:** No real payment processing (P0 revenue blocker). No WhatsApp delivery. No signature capture. Under-13 child data protection enforcement missing.

**UX Friction:** No real-time balance updates. Invoice status never changes from mock values.

### 5.5 Ministry Director (Persona P5)

| Feature | UI Status | Data Status | Gaps |
|---------|-----------|-------------|------|
| Ministry Dashboard | Built | Mock | `/dashboard/ministry` page exists |
| Cross-Conservatorium Forms Inbox | Built | Mock | Unified view of submissions across conservatoriums |
| Form Template Creation | Built | Mock | Dynamic form builder present |
| Bulk PDF Export | Specified | Not built | Ministry Director needs batch download as ZIP |
| Approval/Rejection Workflow | Built | Mock | Multi-step approval chain implemented in UI |
| Ministry Role Definition | Implemented | Mock | `ministry_director` role in type system and sidebar |
| Dashboard Redirect | Fixed | Working | Redirect to `/dashboard/ministry` implemented |

**Critical Gaps:** No real cross-conservatorium data access (all mock). No bulk PDF export. Ministry role lands on wrong page when `newFeaturesEnabled` is true (BUG-03 - now appears fixed in code).

### 5.6 School Coordinator (Persona P6 - Playing School)

| Feature | UI Status | Data Status | Gaps |
|---------|-----------|-------------|------|
| School Partnership Dashboard | Built | Mock | `/dashboard/school` pages present |
| Group Lesson Scheduling | Built | Mock | Group lesson model exists |
| QR Token Enrollment | Built | Mock | Playing School enrollment flow present |
| Instrument Loan Management | Built | Mock | Digital consent workflow present |
| Excellence Track Nomination | Built | Mock | Nomination UI present |
| Dashboard Redirect | Fixed | Working | Redirect to `/dashboard/school` implemented |

**Critical Gaps:** No role guard on admin Playing School pages (SEC-03). School coordinator can access admin URLs by direct navigation (BUG-11).

### 5.7 Delegated Admin (Sub-persona of P1)

| Feature | UI Status | Data Status | Gaps |
|---------|-----------|-------------|------|
| Section-Scoped Access | Built | Mock | `delegatedAdminPermissions: AdminSection[]` filtering works in sidebar |
| Admin Functionality | Same as Admin | Mock | Full admin features within permitted sections |

**Status:** Well-implemented at the UI level. Sidebar correctly filters by permitted sections. Server-side enforcement of section permissions is missing (all Server Actions pass auth).

### 5.8 Site Admin (Super-Admin)

| Feature | UI Status | Data Status | Gaps |
|---------|-----------|-------------|------|
| Cross-Conservatorium Access | Built | Mock | `site_admin` role has full access |
| Conservatorium Creation | Built | Mock | Conservatorium management UI present |

**Status:** UI works. No server-side enforcement that this is truly a site-level admin.

---

## 6. Critical Blocker Summary

### 6.1 Security Blockers (Must Fix First)

| # | Blocker | File(s) | Severity |
|---|---------|---------|----------|
| 1 | `verifyAuth()` always returns `true` | `src/lib/auth-utils.ts` | Critical |
| 2 | Mock email-only login (no password) | `src/hooks/use-auth.tsx`, `login-form.tsx` | Critical |
| 3 | `harmonia-user=1` cookie (no crypto) | `src/hooks/use-auth.tsx` | Critical |
| 4 | No `src/middleware.ts` (no server-side route protection) | Missing file | Critical |
| 5 | `FormSubmissionSchema = z.any()` | `src/app/actions.ts` | High |
| 6 | `UserSchema = z.any()` | `src/app/actions.ts` | High |
| 7 | `LessonSchema = z.any()` | `src/app/actions.ts` | High |
| 8 | Admin pages accessible without role guard | Multiple pages | High |
| 9 | `ignoreBuildErrors: true` in next.config.ts | `next.config.ts` | High |
| 10 | No Firestore Security Rules deployed | `firestore.rules` (template) | Critical |
| 11 | No Firebase Storage Security Rules | Missing | Critical |

### 6.2 Data Persistence Blockers

| # | Blocker | Impact |
|---|---------|--------|
| 1 | FirebaseAdapter is MemoryDatabaseAdapter stub | No data survives restart |
| 2 | No Firestore composite indexes | Queries will fail in production |
| 3 | Package type missing `conservatoriumId` | No tenant isolation on packages |
| 4 | Invoice type missing VAT/installment fields | Cannot generate compliant invoices |

### 6.3 Revenue Blockers

| # | Blocker | Impact |
|---|---------|--------|
| 1 | No real payment processing | Zero revenue |
| 2 | No webhook HMAC validation | Payment fraud risk |
| 3 | No recurring charge scheduler | Manual billing required |
| 4 | No installment support | Unaffordable yearly packages |

### 6.4 Legal/Compliance Blockers

| # | Blocker | Law/Standard |
|---|---------|-------------|
| 1 | PDPPA consent not collected | Israeli Privacy Law 5741-1981 |
| 2 | IS 5568 accessibility gaps | Israeli Standard IS 5568 (WCAG 2.1 AA) |
| 3 | Digital signatures not captured | Ministry of Education form requirements |
| 4 | No data residency enforcement | PDPPA data storage requirements |
| 5 | Under-13 data protection not enforced | PDPPA minors protection |

---

## 7. P2 - Important Improvements

### 7.1 Performance Optimization
- [ ] Dynamic imports for role-specific dashboard components (AdminCommandCenter loaded for students)
- [ ] Self-hosted Rubik font (currently Google Fonts CDN)
- [ ] Image optimization with `next/image` for teacher photos
- [ ] Lazy loading for below-fold content on landing page

### 7.2 Landing Page Revamp
- [ ] Hero section with Hebrew value proposition
- [ ] Feature grid showcasing key differentiators
- [ ] Persona-specific CTA cards (admin, teacher, parent, student)
- [ ] Testimonials section
- [ ] Mobile responsive navigation (BUG-08: no mobile menu on public navbar)

### 7.3 Missing Translations
- [ ] Russian locale: 1,063 missing keys (41% incomplete)
- [ ] Arabic locale: 13 missing keys
- [ ] Hebrew status strings used in business logic (SEC-08) - replace with locale-neutral keys

### 7.4 Bug Fixes from QA Reports
- [ ] Delete orphan `src/app/page.tsx` (BUG-04)
- [ ] Delete orphan `src/app/dashboard/` directory (BUG-06)
- [ ] Fix 20+ pages using `import Link from 'next/link'` instead of i18n Link (BUG-07)
- [ ] Delete legacy `src/hooks/use-walkthrough.tsx` (BUG-01)
- [ ] Remove duplicate `WalkthroughManager` from root layout (BUG-02)
- [ ] Fix React Rules of Hooks violation in users page (BUG-12)
- [ ] Add error boundaries and 404/loading pages (BUG-13)

### 7.5 Teacher Experience Gaps
- [ ] Two-way Google Calendar sync (CF spec exists)
- [ ] Structured lesson notes (sub-collection model designed)
- [ ] Sick leave emergency flow (one-tap cancel today's lessons)

### 7.6 Student Experience Gaps
- [ ] Connect AI Matchmaker flow to enrollment wizard
- [ ] Enforce cancellation policy on rescheduling
- [ ] Expand gamification beyond 2 achievement types
- [ ] Practice video upload to Firebase Storage

---

## 8. P3 - Nice-to-Have (Post-Launch)

- [ ] PWA / Offline support for practice logs
- [ ] Multimedia feedback (teacher audio/video annotations)
- [ ] Board Director strategic dashboard (separate from operational admin)
- [ ] Full gamification system with levels, points, and leaderboards
- [ ] Ministry XML export integration with `pop.education.gov.il`
- [ ] Data archival and retention engine (7-year Israeli legal requirement)
- [ ] Firebase App Check for anti-abuse on callable functions
- [ ] SendGrid email integration (Twilio Email addon)
- [ ] Teacher studio notes / private pedagogical journal
- [ ] Group/ensemble lesson attendance sheet
- [ ] Israeli exam curriculum tracker (Ministry exam preparation)
- [ ] Bulk Ministry form PDF export as ZIP
- [ ] Parent communication logging per student

---

## 9. Success Metrics Per Persona

### 9.1 Conservatorium Administrator
| Metric | Target | Measurement |
|--------|--------|-------------|
| Secretary time reduction | >= 60% | Time-per-task before/after |
| Self-service booking rate | >= 80% of bookings | Bookings without staff intervention / total |
| Invoice collection rate | >= 90% paid within 30 days | Paid invoices / total invoices |
| Payroll export accuracy | 100% match to actual hours | Audit against manual records |

### 9.2 Music Teacher
| Metric | Target | Measurement |
|--------|--------|-------------|
| Lesson completion recording | < 30s per lesson | Time from lesson end to attendance marked |
| Sick leave filing | < 30s emergency cancellation | Time to cancel all day's lessons |
| Calendar sync freshness | < 15 min lag | Scheduled function interval |
| AI progress report adoption | >= 50% of teachers use monthly | Reports generated / active teachers |

### 9.3 Student
| Metric | Target | Measurement |
|--------|--------|-------------|
| Practice log adoption | >= 60% of students log weekly | Active loggers / total students |
| Self-service booking adoption | >= 70% of bookings by student/parent | Booking source breakdown |
| Practice streak engagement | >= 30% maintain 7-day streak | Students with active streak / total |
| Form submission time | < 5 minutes | Time from form start to submit |

### 9.4 Parent / Guardian
| Metric | Target | Measurement |
|--------|--------|-------------|
| Payment success rate | >= 95% | Successful charges / attempts |
| WhatsApp notification delivery | >= 98% delivery rate | Twilio delivery receipts |
| Form signing completion | >= 90% within 48 hours | Signed / total requiring signature |
| Family Hub engagement | >= 70% weekly active parents | DAU parents / total parents |

### 9.5 Ministry Director
| Metric | Target | Measurement |
|--------|--------|-------------|
| Form submission turnaround | < 5 days end-to-end | Time from form creation to Ministry approval |
| Cross-conservatorium visibility | 100% of forms visible | Forms in inbox / total submitted |
| PDF export completeness | 100% of approved forms exportable | Exportable / approved |

### 9.6 School Coordinator
| Metric | Target | Measurement |
|--------|--------|-------------|
| Enrollment completion rate | >= 80% | Completed enrollments / started |
| Instrument loan tracking | 100% of loans recorded | Digital records / physical loans |

---

## 10. Technical Dependencies & Sequencing

```
Phase 1: Security & Auth Foundation (BLOCKS EVERYTHING)
  ├── Create src/middleware.ts
  ├── Wire Firebase signInWithEmailAndPassword
  ├── Deploy onUserApproved Cloud Function (Custom Claims)
  ├── Replace verifyAuth() stub
  └── Fix z.any() schemas

Phase 2: Data Persistence (BLOCKS Phases 3-5)
  ├── Implement real FirebaseAdapter
  ├── Deploy Firestore + Storage Security Rules
  ├── Deploy composite indexes
  ├── Fix Package/Invoice type gaps
  └── Deploy 6 Cloud Function specs

Phase 3: Context Decomposition (BLOCKS performance targets)
  ├── Install @tanstack/react-query
  ├── Decompose useAuth() into domain hooks
  └── Add Firestore onSnapshot listeners

Phase 4: Production Integrations (BLOCKS revenue)
  ├── Activate Cardcom with real terminal
  ├── Activate Twilio SMS/WhatsApp
  ├── Deploy Cardcom webhook HMAC validation
  └── Deploy recurring charge scheduler

Phase 5: UI/UX Polish
  ├── Landing page revamp
  ├── IS 5568 accessibility fixes
  ├── RTL logical properties audit
  ├── Russian translation completion
  └── Bug fixes from QA reports

Phase 6: Infrastructure & CI/CD
  ├── GitHub Actions pipeline
  ├── Firebase project setup (region: europe-west1)
  ├── Secret Manager configuration
  └── Zero-downtime deployment strategy
```

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Firebase cost overrun | Medium | High | Set budget alerts; use Firestore read optimizations (stats doc, indexes) |
| PDPPA audit before launch | Low | Critical | Prioritize consent collection and data residency |
| Cardcom sandbox rate limits | Medium | Medium | Use dedicated test terminals; mock for unit tests |
| Hebrew font rendering on Safari iOS | Low | Medium | Test on real devices; self-host Rubik font |
| Teacher adoption resistance | Medium | High | Invest in onboarding walkthrough; mobile-first UX |
| Russian translation quality | High | Low | Hire native Russian translator; Russian user base is secondary |

---

## 12. Out of Scope for V1

The following are explicitly deferred to post-launch:
- Full in-house payroll calculation engine (Hilan/Merav Digital handles this)
- Integration with `pop.education.gov.il` national portal
- PWA / offline mode
- Multi-branch capacity matrix views
- Board Director strategic dashboard (separate from admin)
- Teacher studio notes / private journal
- Multimedia feedback system (audio/video annotations)
- Israel Tax Authority Section 46 donation reporting API

---

*This PRD was produced from analysis of 7 architecture documents, 5 persona audits (SDD-P1 through SDD-P5), 5 QA reports, 60+ SDD specifications, and direct source code review of key implementation files.*