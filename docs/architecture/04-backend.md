# 04 — Backend

## 1. Backend Architecture Overview

> **Current reality:** The backend is a **server-action layer over in-memory mock data**. All "Cloud Functions" listed in the SDD documents are typed specification files in `src/lib/cloud-functions/` — they are not deployed Firebase Cloud Functions. Real Firestore, real payment processing, and real notification delivery are all stubbed.

| Layer | Technology | File(s) | Status |
|-------|-----------|---------|--------|
| **Server Actions** | Next.js `'use server'` | `src/app/actions.ts` (1283 lines) + `src/app/actions/*.ts` | ✅ Active — Zod-validated; auth via `verifyAuth()` layered strategy |
| **Additional Server Actions** | Next.js `'use server'` | `src/app/actions/auth.ts`, `consent.ts`, `signatures.ts`, `storage.ts`, `user-preferences.ts` | ✅ Active — domain-specific action modules |
| **Firebase Admin SDK** | `firebase-admin` | `src/lib/firebase-admin.ts` | ✅ `getAdminAuth()` — initialises from `FIREBASE_SERVICE_ACCOUNT_KEY`; returns null when absent |
| **Database** | `DatabaseAdapter` | `src/lib/db/` | ✅ Adapter layer real; default = in-memory mock |
| **Callable Cloud Functions** | Firebase CF specs | `src/lib/cloud-functions/` | ⚠️ Typed pseudocode specs — NOT deployed |
| **Triggered/Scheduled CFs** | Firebase CF specs | `src/lib/cloud-functions/lesson-triggers.ts` | ⚠️ Spec only |
| **Notification Dispatcher** | Twilio + SendGrid | `src/lib/notifications/dispatcher.ts` | ⚠️ Real code; falls back to `console.warn` when env vars absent |
| **Payment Gateway** | Cardcom + 4 others | `src/lib/payments/cardcom.ts` + `actions.ts` | ⚠️ Real API code; returns mock URL when terminal not configured |

---

## 2. Server Actions (`src/app/actions.ts`)

### 2.1 Auth Wrapper Pattern

Every action uses `withAuth()` HOC from `src/lib/auth-utils.ts`:

```typescript
// src/lib/auth-utils.ts (actual — layered auth strategy)
export async function verifyAuth(): Promise<HarmoniaClaims> {
  // 1. Try Admin SDK session cookie verification (production path)
  const adminAuth = getAdminAuth();
  if (adminAuth) {
    const sessionCookie = /* read __session cookie */;
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { uid, email, role, conservatoriumId, approved };
  }

  // 2. Fallback: read x-user-* headers injected by proxy.ts
  const claims = await getClaimsFromRequest();
  if (claims) return claims;

  // 3. Dev-only fallback: synthetic site_admin (NODE_ENV !== 'production')
  if (process.env.NODE_ENV !== 'production') {
    return { uid: 'dev-user', role: 'site_admin', ... };
  }

  throw new Error('UNAUTHENTICATED');
}

export function withAuth<Schema, R>(schema: Schema, action: (input) => Promise<R>) {
  return async (input) => {
    await verifyAuth();           // ✅ Real auth check — throws on failure
    const parsed = schema.parse(input);  // ✅ Zod validation
    return action(parsed);
  };
}
```

> ✅ **Production auth is active.** `verifyAuth()` performs cryptographic session cookie verification via `admin.auth().verifySessionCookie()` when `FIREBASE_SERVICE_ACCOUNT_KEY` is configured. The dev bypass only activates when the Admin SDK is absent AND `NODE_ENV !== 'production'` — this path is unreachable in production Firebase App Hosting (which sets `NODE_ENV='production'` at build time).

Additionally, `requireRole()` enforces RBAC:
```typescript
export async function requireRole(
  allowedRoles: UserRole[],
  conservatoriumIdMustMatch?: string
): Promise<HarmoniaClaims> {
  const claims = await verifyAuth();
  if (!claims.approved) throw new Error('ACCOUNT_NOT_APPROVED');
  if (!allowedRoles.includes(claims.role)) throw new Error('FORBIDDEN');
  // Global admins (site_admin, superadmin) bypass tenant isolation
  if (conservatoriumIdMustMatch && !GLOBAL_ADMIN_ROLES.includes(claims.role)
      && claims.conservatoriumId !== conservatoriumIdMustMatch) {
    throw new Error('TENANT_MISMATCH');
  }
  return claims;
}
```

### 2.2 Zod Validation Schemas (Verified Implemented)

Dedicated schemas exist in `src/lib/validation/`:

| File | Schemas |
|------|---------|
| `booking.ts` | `BookingRequestSchema`, `MakeupBookingRequestSchema`, `RescheduleRequestSchema`, `CancelLessonRequestSchema` |
| `forms.ts` | Form submission validation |
| `practice-log.ts` | Practice log submission |
| `user-schema.ts` | User create/update |
| `conservatorium.ts` | Conservatorium settings validation |
| `event-production.ts` | Event and performance production validation |
| `form-submission-upsert.ts` | Form submission upsert validation |
| `lesson-slot.ts` | Lesson slot creation/update validation |
| `user-upsert.ts` | User upsert validation |

Additionally, `actions.ts` itself contains inline Zod schemas for: `AnnouncementSchema`, `MasterClassSchema`, `ScholarshipApplicationSchema`, `DonationCauseSchema`, `DonationRecordSchema`, `BranchSchema`, `RoomSchema`, `LessonPackageSchema`, `ConservatoriumInstrumentSchema`, and more.

> ⚠️ **Note:** `FormSubmissionSchema = z.any()`, `UserSchema = z.any()`, `LessonSchema = z.any()` — these three high-impact schemas use `z.any()` and provide no input validation.

### 2.3 Payment Gateway — Multi-Provider (Verified)

The architecture is more flexible than originally documented. The active provider is selected via `PAYMENT_GATEWAY_PROVIDER` env var (default: `CARDCOM`):

| Provider | Env Var | Redirect URL |
|----------|---------|-------------|
| `CARDCOM` | `CARDCOM_TERMINAL_NUMBER` | `secure.cardcom.solutions/...` |
| `PELECARD` | `PELECARD_TERMINAL_NUMBER` | `gateway.pelecard.biz/...` |
| `HYP` | `HYP_TERMINAL_NUMBER` | `pay.hyp.co.il/...` |
| `TRANZILA` | `TRANZILA_TERMINAL_NUMBER` | `direct.tranzila.com/...` |
| `STRIPE` | `STRIPE_PUBLISHABLE_KEY` | `/payment/mock` (Stripe flow incomplete) |

If the terminal number is missing, all gateways fall back to `/payment/mock?token=...&gateway=...` with a `console.warn`.

`src/lib/payments/cardcom.ts` has full Cardcom API integration code (hosted payment page, recurring token charge, webhook handler, installment calculator) — but these code paths only execute when `CARDCOM_TERMINAL_NUMBER` is set.

---

## 3. Cloud Functions (`functions/src/`)

Firebase Cloud Functions are now partially implemented in the `functions/` directory (separate from the Next.js app). All functions are configured for `europe-west1` region (PDPPA data residency).

### 3.1 Implemented Functions

| Function | File | Type | Purpose |
|----------|------|------|---------|
| `onUserApproved` | `functions/src/auth/on-user-approved.ts` | Firestore trigger | Sets Firebase Custom Claims (`role`, `conservatoriumId`, `approved`) when a user's `approved` field changes to `true` |
| `onUserCreated` | `functions/src/auth/on-user-created.ts` | Firestore trigger | New user lifecycle — initial claims, welcome notification |
| `onUserDeleted` | `functions/src/auth/on-user-deleted.ts` | Firestore trigger | User deletion cleanup — revoke tokens, archive data |
| `onUserParentSync` | `functions/src/users/on-user-parent-sync.ts` | Firestore trigger | Syncs `parentOf/{parentId_studentId}` denormalised documents for Security Rules |
| `bookLessonSlot` | `functions/src/booking/book-lesson-slot.ts` | Callable | Atomic booking transaction: validate → check availability → acquire room lock → deduct package credit → create slot |
| `bookMakeupLesson` | `functions/src/booking/book-makeup-lesson.ts` | Callable | Atomic makeup credit redemption: read credit in transaction → verify AVAILABLE → create slot + mark REDEEMED atomically |

### 3.2 Specification Files (Phase 2 — Not Yet Deployed)

The following specification files remain in `src/lib/cloud-functions/` as typed pseudocode for future implementation:

| Spec File | Intended Function | Key Logic |
|-----------|------------------|-----------|
| `lesson-triggers.ts` | `onLessonCancelled` + `onLessonCompleted` (triggered) | Auto-issue makeup credits, update live stats, dispatch notifications |
| `calendar-sync.ts` | `syncTeacherCalendars` (scheduled, every 15min) | Two-way Google Calendar sync: outbound new/changed slots, inbound conflict detection |
| `holiday-calendar.ts` | `getIsraeliHolidaysForYear` (callable) | Hebcal API integration; maps Hebrew calendar holidays to `ClosureDate` documents |
| `payroll-export.ts` | `generatePayrollExport` (callable) | Aggregates completed lessons by teacher; calculates gross pay using `TeacherCompensation` rates; generates CSV/Excel |

---

## 4. Domain Logic — Core Business Rules

### 4.1 Cancellation Policy Engine

The `CancellationPolicy` type is defined and configured per conservatorium:

```typescript
type CancellationPolicy = {
  studentNoticeHoursRequired: number;      // e.g. 24
  studentCancellationCredit: 'FULL' | 'NONE';
  studentLateCancelCredit: 'FULL' | 'NONE';
  noShowCredit: 'NONE';
  makeupCreditExpiryDays: number;
  maxMakeupsPerTerm: number;
};
```

Current implementation (`use-auth.tsx` `cancelLesson`): cancellation runs in mock context. The Cloud Function spec in `lesson-triggers.ts` documents the production logic with Firestore transactions.

### 4.2 Makeup Credit Lifecycle (Verified Types)

```typescript
// MakeupCredit type (src/lib/types.ts — verified)
type MakeupCredit = {
  id: string;
  conservatoriumId: string;
  studentId: string;
  packageId?: string;
  issuedBySlotId: string;         // the cancelled lesson
  issuedReason: 'TEACHER_CANCELLATION' | 'CONSERVATORIUM_CANCELLATION' | 'STUDENT_NOTICED_CANCEL';
  issuedAt: string;               // ISO Timestamp
  expiresAt: string;              // issuedAt + policy.makeupCreditExpiryDays
  status: 'AVAILABLE' | 'REDEEMED' | 'EXPIRED';
  redeemedBySlotId?: string;
  redeemedAt?: string;
  amount: number;
};
```

### 4.3 Room Allocation Algorithm (Verified — Active Code)

✅ `src/lib/room-allocation.ts` is a real, active implementation (not a stub). It contains:
- `resolveInstrumentId()` — normalises raw instrument strings against `ConservatoriumInstrument` catalog using multi-language matching (Hebrew diacritics stripped, aliases resolved)
- `allocateRoomWithConflictResolution()` — selects the best-fit room based on instrument equipment compatibility, room blocks, and existing lesson conflicts
- Instrument compatibility matrix (`INSTRUMENT_ROOM_COMPATIBILITY`) — defines preferred/acceptable/incompatible room types per instrument
- Called from `use-auth.tsx` during lesson booking

### 4.4 Israeli VAT & Invoice Model (Verified Types)

```typescript
// Invoice type (src/lib/types.ts — verified)
type Invoice = {
  id: string;
  invoiceNumber: string;           // e.g. CON-2026-00142
  conservatoriumId: string;
  payerId: string;
  lineItems: { description: string; total: number }[];
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  paidAt?: string;
};
```

> ⚠️ **Gap vs. plan:** The `Invoice` type does not have explicit `subtotal`, `discounts`, `vatAmount` fields. VAT calculation and sibling discounts are not yet in the type model — they are applied at the payment gateway level only.

### 4.5 Payroll Export

`src/lib/cloud-functions/payroll-export.ts` documents the export format. The `PayrollExportRow` type (in `types.ts`) is comprehensive: lesson details, sick leave days, event hours, gross total. Export is UTF-8 BOM for Hilan/Excel compatibility.

---

## 5. AI Agents (Genkit 1.29 / Gemini)

✅ **All 8 flows are implemented and actively called from `src/app/actions.ts`.**

| Flow | Verified Input → Output |
|------|------------------------|
| `match-teacher-flow.ts` | `MatchTeacherInput` (student prefs + available teachers) → top 3 teachers with match reasons |
| `draft-progress-report-flow.ts` | `DraftProgressReportInput` (practice logs + notes) → Hebrew progress narrative text |
| `help-assistant-flow.ts` | `HelpAssistantInput` (question + locale) → answer grounded in `help-articles.ts` |
| `suggest-compositions.ts` | `SuggestCompositionsInput` (instrument + level) → composition suggestions |
| `reschedule-flow.ts` | `RescheduleRequestInput` (natural language request) → structured reschedule options |
| `generate-event-poster.ts` | Event metadata → poster content/layout suggestions |
| `target-empty-slots-flow.ts` | `TargetSlotsInput` (empty slots) → prioritised outreach targets |
| `nurture-lead-flow.ts` | `NurtureLeadInput` (Playing School lead) → personalised follow-up message |

All flows run **server-side only** (called from `actions.ts` which is `'use server'`).

---

## 6. Notification Dispatcher (Verified — Active Code)

✅ `src/lib/notifications/dispatcher.ts` is a real implementation (245 lines), not a stub.

- `dispatchNotification()` — routes to correct channel based on `NotificationPreferences`
- `isQuietHours()` — Israel timezone aware (Asia/Jerusalem); handles overnight ranges
- `normalizeIsraeliPhone()` — converts `050-1234567` → `+972501234567`
- `sendSMS()` — real Twilio REST API call; falls back to `console.warn` when `TWILIO_ACCOUNT_SID` is not set
- `sendWhatsApp()` — real Twilio WhatsApp API call; same fallback behaviour

**The dispatcher is production-ready code; it is inactive because Twilio credentials are not configured in the current environment.**

---

## 7. What Is NOT Yet Implemented (Backend Gaps)

| Gap | Severity | What's Missing |
|-----|----------|---------------|
| Real Firestore reads/writes | 🔴 Critical | `FirebaseAdapter` is a `MemoryDatabaseAdapter` stub |
| `FormSubmissionSchema = z.any()` | 🟠 High | No input validation on form submissions |
| Cloud Functions Phase 2 not deployed | 🟠 High | Lesson triggers, calendar sync, payroll export, holiday calendar still undeployed |
| Cardcom webhook handler | 🟠 High | `/api/cardcom-webhook` route exists but handler logic is stubbed |
| Monthly auto-charge scheduler | 🟠 High | No deployed scheduled function |
| Age-gate nightly function | 🟡 Medium | Under-13 enforcement unimplemented |
| Credit expiry scheduler | 🟡 Medium | `MakeupCredit.expiresAt` not enforced automatically |
| Google Calendar sync | 🟡 Medium | Spec exists; no OAuth token flow or API calls |

### Resolved Since Last Audit

| Previously a Gap | Resolution |
|------------------|-----------|
| `verifyAuth()` always returns `true` | ✅ Now implements layered auth: Admin SDK `verifySessionCookie()` → proxy header fallback → dev-only synthetic session |
| No `src/middleware.ts` | ✅ Replaced by `src/proxy.ts` (Next.js 16 Edge Proxy) which validates `__session` cookies and injects auth headers |
| Firebase Auth not called on login | ✅ `/api/auth/login` route creates session cookies via `admin.auth().createSessionCookie()` |
| Cloud Functions not deployed | ✅ Partially deployed: `onUserApproved`, `onUserCreated`, `onUserDeleted`, `onUserParentSync`, `bookLessonSlot`, `bookMakeupLesson` in `functions/src/` |
| Custom Claims not set on approval | ✅ `onUserApproved` Cloud Function sets Custom Claims when user is approved |
