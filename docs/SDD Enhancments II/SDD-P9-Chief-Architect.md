# SDD-P9: Persona Audit — Chief Architect
## Master Technical Roadmap & Final Architectural Blueprint

**Harmonia 360° Architecture Audit**
**Persona:** Chief Architect (Synthesis of All 8 Personas)
**Auditor Role:** System Design Authority, Technical Due Diligence Lead
**Version:** 1.0 | **Date:** 2026-02-25

---

## 1. Executive Summary — The Honest Assessment

After reviewing the complete Harmonia codebase, all 17 SDD modules, and the findings from 8 specialist personas, here is the unvarnished truth:

**Harmonia is an excellent proof-of-concept prototype that correctly describes a production-grade system but does not yet implement one.**

The prototype demonstrates remarkable vision. The SDD documentation is thoughtful, the domain knowledge is genuine, and the technology choices are sound. The UI components in the prototype are polished and the user flows are well-designed. This is genuinely impressive for what appears to be a Firebase Studio AI-generated scaffold.

**But the prototype has a categorical architectural problem that cannot be incrementally fixed — it must be understood and addressed at the foundation level before a single production user is onboarded:**

> The entire application is a **single-tenant, in-memory, mock-data simulation** stored in React state and `localStorage`. There is no Firebase integration. There is no authentication. There is no database. There is no server. Every "feature" in the UI is a state mutation against fabricated data that resets on page reload.

This is not a criticism — it is the expected output of a Firebase Studio AI prototype. The prototype's purpose is to prove the concept and visualize the product. It succeeds at that. The question the Chief Architect must answer is: **Can this prototype be the foundation of a production system, and what is the minimum required to get there?**

**Verdict: Yes — but not by incrementally adding Firebase calls to the existing code.**

The path to production requires a deliberate architectural migration, not a patch. The good news: the data models, the UI components, the AI flows, and the i18n infrastructure are all worth keeping. The mock data layer, the auth mechanism, and the state management pattern must be replaced entirely.

---

## 2. Definitive Firestore Data Schema

The following represents the canonical, production-ready Firestore schema synthesizing all 9 persona requirements:

```
ROOT COLLECTIONS:
├── /users/{userId}                          — All user profiles (cross-conservatorium)
├── /conservatoriums/{cid}                   — Conservatorium master records
│   ├── /settings/{settingType}              — Config documents (cancellationPolicy, payroll, pricing)
│   ├── /stats/live                          — Real-time aggregated stats document
│   │
│   ├── /users/{userId}                      — Denormalized user refs per conservatorium
│   ├── /teachers/{teacherId}                — Teacher profiles (extends user)
│   ├── /teacherAvailability/{availId}       — Weekly availability templates
│   ├── /teacherExceptions/{exceptionId}     — Sick leave, holidays, overrides
│   │
│   ├── /lessonSlots/{slotId}                — All lesson slots
│   │   └── /notes/{noteId}                  — Per-lesson teacher notes (sub-collection)
│   ├── /roomLocks/{lockKey}                 — Optimistic room booking locks
│   ├── /rooms/{roomId}                      — Room catalog
│   │
│   ├── /packages/{packageId}                — Student lesson packages
│   ├── /makeupCredits/{creditId}            — Explicit makeup credit ledger
│   ├── /invoices/{invoiceId}                — All invoices
│   ├── /payrollPeriods/{periodId}           — Monthly payroll summaries
│   │
│   ├── /practiceLogs/{logId}                — Student practice sessions
│   ├── /assignedRepertoire/{repId}          — Teacher-assigned pieces
│   ├── /examPrepTrackers/{trackerId}        — Ministry exam preparation tracking
│   │
│   ├── /formSubmissions/{formId}            — Forms & approvals
│   ├── /formTemplates/{templateId}          — Reusable form templates
│   │
│   ├── /notifications/{notifId}             — In-app notification feed per user
│   ├── /notificationAuditLog/{logId}        — Delivery audit trail
│   ├── /messageThreads/{threadId}           — Direct messages
│   │
│   ├── /instruments/{instrumentId}          — Instrument inventory
│   ├── /instrumentCheckouts/{checkoutId}    — Active/historical checkouts
│   ├── /closureDates/{dateKey}              — Holiday & closure calendar
│   ├── /waitlistEntries/{entryId}           — Teacher waitlist
│   │
│   ├── /events/{eventId}                    — Recital/concert productions
│   ├── /scholarshipApplications/{appId}     — Financial aid applications
│   ├── /donationRecords/{donationId}        — Donation fund ledger
│   ├── /aiJobs/{jobId}                      — Async AI job queue
│   └── /complianceLogs/{logId}              — PDPPA compliance audit trail
│
├── /parentOf/{parentId_studentId}           — Denormalized parent-child links (for Security Rules)
├── /ageUpgradeInvitations/{inviteId}        — Pending age-upgrade invitations
├── /consentRecords/{recordId}               — PDPPA consent tracking
└── /signatureAuditRecords/{auditId}         — Digital signature audit trail
```

**Critical Design Decisions:**

1. **Single `users` collection at root** — Users can potentially be associated with multiple conservatoriums (a teacher who works at two). Their core identity is global; their role *within* a conservatorium is specified in the `/conservatoriums/{cid}/teachers/{id}` sub-document.

2. **Explicit `makeupCredits` collection** — Not implicit in `Package.usedCredits`. Each credit is a first-class document with full lifecycle: AVAILABLE → REDEEMED | EXPIRED.

3. **`roomLocks` as a performance primitive** — Not a business entity; a coordination mechanism. Documents have short TTLs and are deleted after lesson end.

4. **Stats document for O(1) dashboard queries** — The admin dashboard must never trigger collection scans.

5. **Sub-collection for lesson notes** — Keeps the hot `lessonSlots` collection lean; notes are loaded only when needed.

---

## 3. Final API / Serverless Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HARMONIA PRODUCTION STACK                     │
├─────────────────────────────────────────────────────────────────┤
│  NEXT.JS APP (Firebase App Hosting)                             │
│  ├── Server Components — Auth-validated, SSR for SEO pages      │
│  ├── Client Components — Real-time dashboards, booking calendar │
│  └── Server Actions — All data mutations (never client direct)  │
├─────────────────────────────────────────────────────────────────┤
│  CLOUD FUNCTIONS (2nd Gen — Cloud Run based)                    │
│                                                                  │
│  CALLABLE FUNCTIONS (user-triggered):                           │
│  ├── bookLessonSlot          — With transaction + room lock      │
│  ├── bookMakeupLesson        — With credit atomicity             │
│  ├── rescheduleLesson        — With policy enforcement           │
│  ├── submitSickLeave         — Batch cancel + credit issuance    │
│  ├── createPaymentPage       — Cardcom hosted page               │
│  └── getSignedUrl            — Secure file access               │
│                                                                  │
│  TRIGGERED FUNCTIONS (event-driven):                            │
│  ├── onUserApproved          — Set Firebase Custom Claims        │
│  ├── onLessonCancelled       — Issue makeup credits              │
│  ├── onLessonCompleted       — Update stats, award achievements  │
│  ├── onPaymentWebhook        — Cardcom callback handler          │
│  ├── onSheetMusicUploaded    — PDF optimization pipeline         │
│  └── onPracticeVideoUploaded — FFmpeg transcoding pipeline       │
│                                                                  │
│  SCHEDULED FUNCTIONS:                                           │
│  ├── monthlyAutoCharge       — 1st of month, 06:00              │
│  ├── syncTeacherCalendars    — Every 15 minutes                  │
│  ├── dailyAgeGateCheck       — Daily, 02:00                      │
│  ├── expireCredits           — Daily, 03:00                      │
│  ├── sendLessonReminders     — Daily, 08:00                      │
│  └── archiveExpiredRecords   — Yearly, September 1               │
│                                                                  │
│  PUBSUB WORKERS (async AI):                                     │
│  └── processAIJob            — Matchmaker, progress reports      │
├─────────────────────────────────────────────────────────────────┤
│  FIREBASE SERVICES                                              │
│  ├── Firestore           — Primary database                      │
│  ├── Auth                — Firebase Auth + Custom Claims         │
│  ├── Storage             — PDFs, videos, signatures, invoices    │
│  ├── App Check           — Anti-abuse on all callable functions  │
│  └── FCM                 — In-app push notifications             │
├─────────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                              │
│  ├── Cardcom             — Israeli payment gateway               │
│  ├── Twilio              — SMS + WhatsApp (Israel: +972)         │
│  ├── SendGrid            — Transactional email                   │
│  ├── Google Calendar API — Two-way teacher sync                  │
│  ├── Hebcal API          — Israeli holiday calendar              │
│  └── Genkit / Gemini     — AI agents (matchmaker, reports)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. State Management Migration Plan

**From:** Single monolithic React context with 25+ in-memory arrays
**To:** Role-scoped, lazy-loaded, cache-first data access

```typescript
// Migration strategy: Replace use-auth.tsx in 3 phases

// PHASE 1: Keep context for auth state only; remove all mock data
// src/contexts/auth-context.tsx (new, minimal)
interface AuthContextType {
  user: User | null;           // From Firebase Auth + Firestore user doc
  conservatoriumId: string | null;
  role: UserRole | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}
// ALL data access moves to domain-specific hooks

// PHASE 2: Domain hooks with React Query
// npm install @tanstack/react-query
// Provider setup in root layout:
// <QueryClientProvider client={queryClient}>

// src/hooks/data/use-lessons.ts
export function useLessons(filters: LessonFilters) {
  const { user, conservatoriumId } = useAuth();
  return useQuery({
    queryKey: ['lessons', conservatoriumId, user?.id, filters],
    queryFn: () => fetchLessons(conservatoriumId!, user!.id, user!.role, filters),
    staleTime: 30_000,          // 30 seconds — lesson data changes infrequently
    gcTime: 5 * 60_000,         // 5 min cache
  });
}

// For truly real-time data (admin dashboard, booking calendar), use Firestore onSnapshot:
// src/hooks/realtime/use-live-schedule.ts
export function useLiveSchedule(conservatoriumId: string, date: Date) {
  const [slots, setSlots] = useState<LessonSlot[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, `conservatoriums/${conservatoriumId}/lessonSlots`),
      where('startTime', '>=', startOfDay(date)),
      where('startTime', '<', endOfDay(date)),
      orderBy('startTime')
    );
    return onSnapshot(q, (snap) => {
      setSlots(snap.docs.map(d => d.data() as LessonSlot));
    });
  }, [conservatoriumId, date]);

  return slots;
}

// PHASE 3: Server actions for all mutations (replace context functions)
// All write operations go through Next.js Server Actions validated server-side
// Client never writes to Firestore directly
```

---

## 5. The Production Migration Roadmap

### Sprint 0 — Security Foundation (2 weeks, non-negotiable)
Before a single real user is onboarded:
- [ ] Deploy Firebase Custom Claims (replace localStorage auth)
- [ ] Deploy all Firestore Security Rules
- [ ] Deploy all Firebase Storage Security Rules
- [ ] Enable Firebase App Check
- [ ] Set up environment variables for all API keys
- [ ] Configure Firebase Emulator Suite for development

### Sprint 1 — Data Foundation (3 weeks)
- [ ] Migrate from mock data to real Firestore reads
- [ ] Decompose monolithic context into role-scoped hooks
- [ ] Implement `conservatoriumStats/live` document + maintenance functions
- [ ] Implement `makeupCredits` collection
- [ ] Deploy all required composite Firestore indexes
- [ ] Implement `closureDates` + Israeli holiday import (Hebcal)

### Sprint 2 — Core Booking Engine (3 weeks)
- [ ] Implement `bookLessonSlot` callable function with room lock transaction
- [ ] Implement academic year slot generator (batch write with 400-doc chunks)
- [ ] Implement `bookMakeupLesson` with atomic credit redemption
- [ ] Implement policy-enforced reschedule server action
- [ ] Implement `submitSickLeave` batch cancellation + credit issuance
- [ ] Wire `match-teacher-flow.ts` to enrollment wizard Step 5

### Sprint 3 — Payments (3 weeks)
- [ ] Implement Cardcom hosted payment page creation
- [ ] Implement Cardcom webhook handler (idempotent)
- [ ] Implement recurring monthly auto-charge (with idempotency key)
- [ ] Implement installment payment UI and Cardcom configuration
- [ ] Implement card expiry detection and update flow
- [ ] Test all payment scenarios in Cardcom sandbox

### Sprint 4 — Communications (2 weeks)
- [ ] Implement Twilio SMS integration
- [ ] Implement Twilio WhatsApp integration
- [ ] Implement email via SendGrid (invoices, approvals, reminders)
- [ ] Implement notification dispatcher with quiet hours
- [ ] Implement in-app notification center with FCM
- [ ] Connect `onLessonCancelled` trigger to notification dispatcher

### Sprint 5 — Teacher Tools (2 weeks)
- [ ] Implement attendance marking server action
- [ ] Implement structured lesson notes sub-collection
- [ ] Implement practice log UI (student-facing + teacher review)
- [ ] Implement repertoire assignment and tracking
- [ ] Implement payroll generation Cloud Function
- [ ] Implement Google Calendar OAuth flow and sync function

### Sprint 6 — Forms & Ministry (2 weeks)
- [ ] Implement form submission workflow engine
- [ ] Implement digital signature canvas + audit trail
- [ ] Implement Ministry exam export (Excel format)
- [ ] Implement enrollment statistics report generator
- [ ] Implement record retention policy engine

### Sprint 7 — Polish & Launch (2 weeks)
- [ ] Load testing (simulate 500 concurrent users)
- [ ] Deploy Firestore security rules regression tests
- [ ] End-to-end test all critical flows
- [ ] Accessibility audit (WCAG 2.1 AA, Hebrew RTL)
- [ ] Firebase Performance Monitoring instrumentation
- [ ] Privacy policy + consent screens

**Total estimated time to production-ready MVP: 19 weeks (solo developer) / 10 weeks (2-developer team)**

---

## 6. What to Keep, What to Rebuild, What to Discard

### KEEP (High value, production-ready or near-ready):
- All SDD documentation (the specification is excellent)
- All UI components in `/src/components` (polished, RTL-aware, accessible)
- All AI flow files in `/src/ai/flows` (architecturally correct, need real data wiring)
- All message files in `/messages` (he/ar/en/ru — i18n is properly structured)
- All TypeScript type definitions (comprehensive, well-named)
- The gamification `awardAchievement` logic (correct algorithm, needs real DB)
- The `checkAndAwardPracticeStreak` logic (correct algorithm, needs real DB)
- `next.config.ts`, `tailwind.config.ts`, `components.json` (correctly configured)

### REBUILD (Architecture is correct but implementation layer is wrong):
- `use-auth.tsx` → Split into minimal auth context + domain-specific hooks
- All "server actions" that currently mutate React state → Real Cloud Functions + Server Actions
- The enrollment wizard (wire AI Matchmaker, add real Cardcom payment step)
- The scheduling calendar (needs real availability engine, not mock data)

### DISCARD (Mock infrastructure that has no production value):
- `initialMockData` (all 25+ mock arrays in `/lib/data.ts`)
- `localStorage.getItem('harmonia-user')` authentication
- The `addXxx` / `updateXxx` functions in `use-auth.tsx` (all 40+ of them)

---

## 7. Multi-Tenant Architecture Assessment

The system was designed multi-tenant from day one (`conservatoriumId` on every document). This is the correct decision and must be preserved. However, the current design has one multi-tenancy gap:

**The `users` collection is a single root collection, not per-conservatorium.** This means a teacher who works at two conservatoriums has one user record with one primary `conservatoriumId`. This won't scale to a true multi-conservatorium SaaS model.

**Recommended fix:** Introduce a `userRoles` junction collection:

```typescript
// /userConservatoriumRoles/{userId}_{cid}
interface UserConservatoriumRole {
  userId: string;
  conservatoriumId: string;
  role: UserRole;
  approved: boolean;
  joinedAt: Timestamp;
}
// A teacher teaching at two conservatoriums has two documents here
// Firebase Custom Claims stores an array: conservatoriumIds: ['cid-1', 'cid-2']
```

---

## 8. Scalability Verdict

**Question: Can this Firebase prototype scale to a production-grade, multi-tenant conservatorium platform?**

**Answer: Yes — with the following conditions:**

| Condition | Effort | Blocker? |
|-----------|--------|----------|
| Security hardening (Custom Claims, Security Rules) | 2 weeks | YES — hard blocker |
| Firebase migration (mock → real DB) | 3 weeks | YES — hard blocker |
| Cardcom payment integration | 3 weeks | YES — no revenue without it |
| Room booking transaction safety | 1 week | YES — data corruption risk |
| Decompose monolithic context | 2 weeks | YES — performance collapse at scale |
| Communications (Twilio/SendGrid) | 2 weeks | Soft blocker — ops not viable without |
| AI flows (already written) | 1 week to wire | No — but high value |
| Ministry forms / compliance | 3 weeks | No for MVP; required for government clients |

**Firebase's limits at conservatorium scale:**
- 500 students × 4 lessons/month = 2,000 lesson slots/month → trivial for Firestore
- 10 teachers × 15 min calendar sync = ~100 Google Calendar API calls/hour → within free tier
- 500 monthly invoice PDFs → ~50MB Storage/month → trivial
- Peak 500 concurrent users → ~50 Cloud Function invocations/second → well within Cloud Run autoscaling

Firebase is the right choice for this scale and this team. The serverless model handles the conservatorium's thundering-herd usage pattern elegantly. The only scenario where Firebase would become a limitation is a 50,000+ student multi-national platform — by which point the product would have revenue to migrate to a more customized infrastructure.

---

## 9. The Absolute Minimum to Reach Production

If forced to prioritize ruthlessly, these are the **12 items** that must be completed before a single paying student is onboarded:

1. **Firebase Custom Claims auth** (replaces localStorage role spoofing)
2. **Firestore Security Rules** (prevents unauthorized data access)
3. **Monolithic context decomposition** (prevents performance collapse)
4. **Room booking transaction** (prevents double-booking)
5. **Makeup credit atomic ledger** (prevents double-spending)
6. **Cardcom payment integration + webhook** (enables revenue)
7. **Monthly auto-charge with idempotency** (enables recurring revenue)
8. **`onLessonCancelled` Cloud Function** (enables makeup credit flow)
9. **Twilio SMS/WhatsApp** (enables teacher sick leave notifications — parents need this)
10. **Attendance marking server action** (teachers need to mark attendance)
11. **Sick leave batch cancellation** (teachers need emergency cancel)
12. **Invoice PDF generation + email** (legal requirement for חשבונית מס)

Everything else — the LMS, gamification, AI Matchmaker, Ministry forms, calendar sync, instrument inventory — is competitive differentiation that can follow in subsequent sprints. The 12 items above constitute the **minimum viable conservatorium management system**.

---

## 10. Final Recommendation

**Do not attempt to "add Firebase" to the existing prototype incrementally.** The monolithic context is woven too deeply into every component. Instead:

1. **Freeze the prototype** as a visual/UX reference and stakeholder demo tool
2. **Start a parallel production branch** using the prototype's UI components, types, and AI flows
3. **Build bottom-up:** Security → Database → API layer → UI integration
4. **Use the SDD documentation** (now augmented by this 9-persona audit) as the specification
5. **Target Sprint 3 (Week 10)** as the first private beta with real data and real payments

The Harmonia vision is commercially sound, technically achievable, and genuinely differentiated in the Israeli market. The prototype proves the concept convincingly. The path from prototype to production is clear, 19 weeks long, and requires disciplined execution rather than heroic engineering.

**The system can scale. The question is whether the team will build the foundation it deserves.**
