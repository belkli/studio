# Backend Audit Report

> **Author:** @Backend | **Date:** 2026-03-06 | **Scope:** `src/app/actions.ts` (1283 lines), auth layer, Cloud Function specs, payment integration, notification dispatcher, database adapters.

---

## 1. Executive Summary

The Harmonia backend is a **Server Action layer** over an **in-memory mock database** with **no real authentication**. All 35+ exported server actions pass through a `withAuth()` wrapper that unconditionally returns `true`, and 5 critical Zod schemas use `z.any()`. Cloud Functions are typed pseudocode specs only -- none are deployed. Payment and notification integrations contain real API code but fall back to mocks when environment variables are absent.

**P0 (Security Blocking):** 3 issues -- `verifyAuth()` always true, `z.any()` schemas on User/Lesson/Conservatorium, no role-based access control.

**P1 (Data Integrity):** 5 issues -- no Firestore transactions for bookings, no makeup credit atomicity, Cardcom webhook unvalidated, no idempotency on payments, FirebaseAdapter is a MemoryDatabaseAdapter stub.

**P2 (Feature Gaps):** 6 issues -- Cloud Functions not deployed, Google Calendar sync unimplemented, payroll export unimplemented, monthly auto-charge missing, credit expiry scheduler missing, age-gate function missing.

---

## 2. Complete Server Actions Inventory

### 2.1 AI/Genkit Actions (8 total) -- All use dedicated schemas

| # | Action Name | Schema | Auth | DB Access | Status |
|---|-------------|--------|------|-----------|--------|
| 1 | `getCompositionSuggestions` | `SuggestCompositionsInputSchema` | `withAuth` (always true) | None (AI flow) | Schema OK; auth stub |
| 2 | `searchComposers` | `SearchComposersSchema` | `withAuth` (always true) | `db.repertoire.list()` | Schema OK; auth stub |
| 3 | `searchCompositions` | `SearchCompositionsSchema` | `withAuth` (always true) | `db.repertoire.list()` | Schema OK; auth stub |
| 4 | `getTeacherMatches` | `MatchTeacherInputSchema` | `withAuth` (always true) | None (AI flow) | Schema OK; auth stub |
| 5 | `draftProgressReport` | `DraftProgressReportInputSchema` | `withAuth` (always true) | None (AI flow) | Schema OK; auth stub |
| 6 | `processNlpRescheduleRequest` | `RescheduleRequestInputSchema` | `withAuth` (always true) | None (AI flow) | Schema OK; auth stub |
| 7 | `getAiHelpResponse` | `HelpAssistantInputSchema` | `withAuth` (always true) | None (AI flow) | Schema OK; auth stub |
| 8 | `getTargetedSlotSuggestions` | `TargetSlotsInputSchema` | `withAuth` (always true) | None (AI flow) | Schema OK; auth stub |

### 2.2 CRUD Server Actions (27 total)

| # | Action Name | Schema | Auth | DB Access | Notes |
|---|-------------|--------|------|-----------|-------|
| 9 | `generateNurtureMessage` | `NurtureLeadInputSchema` | `withAuth` (always true) | None (AI flow) | Schema OK |
| 10 | `saveAlumnus` | `AlumnusSchema` | `withAuth` (always true) | `db.alumni.create/update` | Schema OK (detailed) |
| 11 | `deleteAlumnus` | `z.string()` | `withAuth` (always true) | `db.alumni.delete` | Minimal schema |
| 12 | `createAnnouncement` | `AnnouncementSchema` | `withAuth` (always true) | `db.announcements.create` | Schema OK |
| 13 | `createMasterClassAction` | `MasterClassSchema` | `withAuth` (always true) | `db.masterClasses.create` | Schema OK (detailed) |
| 14 | `publishMasterClassAction` | `z.string()` | `withAuth` (always true) | `db.masterClasses.update` | Minimal schema |
| 15 | `registerToMasterClassAction` | `RegisterMasterClassSchema` | `withAuth` (always true) | `db.masterClasses.findById/update` | Schema OK; business logic present |
| 16 | `createScholarshipApplicationAction` | `ScholarshipApplicationSchema` | `withAuth` (always true) | `db.scholarships.create` | Schema OK |
| 17 | `updateScholarshipStatusAction` | `ScholarshipStatusUpdateSchema` | `withAuth` (always true) | `db.scholarships.findById/update` | Schema OK |
| 18 | `markScholarshipPaidAction` | `z.string()` | `withAuth` (always true) | `db.scholarships.findById/update` | Minimal schema |
| 19 | `createDonationCauseAction` | `DonationCauseSchema` | `withAuth` (always true) | `db.donationCauses.create` | Schema OK |
| 20 | `recordDonationAction` | `DonationRecordSchema` | `withAuth` (always true) | `db.donations.create` + `db.donationCauses.update` | Schema OK; composite operation |
| 21 | `createBranchAction` | `BranchSchema` | `withAuth` (always true) | `db.branches.create` | Schema OK |
| 22 | `updateBranchAction` | `BranchSchema.extend({id})` | `withAuth` (always true) | `db.branches.findById/update/create` | Schema OK |
| 23 | `createConservatoriumInstrumentAction` | `ConservatoriumInstrumentSchema` | `withAuth` (always true) | `db.conservatoriumInstruments.create` | Schema OK |
| 24 | `updateConservatoriumInstrumentAction` | `ConservatoriumInstrumentSchema.extend({id})` | `withAuth` (always true) | `db.conservatoriumInstruments.findById/update/create` | Schema OK |
| 25 | `deleteConservatoriumInstrumentAction` | `z.string()` | `withAuth` (always true) | `db.conservatoriumInstruments.delete` | Minimal schema |
| 26 | `createLessonPackageAction` | `LessonPackageSchema` | `withAuth` (always true) | `db.lessonPackages.create` | Schema OK |
| 27 | `updateLessonPackageAction` | `LessonPackageSchema.extend({id})` | `withAuth` (always true) | `db.lessonPackages.findById/update/create` | Schema OK |
| 28 | `deleteLessonPackageAction` | `z.string()` | `withAuth` (always true) | `db.lessonPackages.delete` | Minimal schema |
| 29 | `createRoomAction` | `RoomSchema` | `withAuth` (always true) | `db.rooms.create` | Schema OK |
| 30 | `updateRoomAction` | `RoomSchema.extend({id})` | `withAuth` (always true) | `db.rooms.findById/update/create` | Schema OK |
| 31 | `deleteRoomAction` | `z.string()` | `withAuth` (always true) | `db.rooms.delete` | Minimal schema |
| 32 | `upsertFormSubmissionAction` | **`z.any()`** | `withAuth` (always true) | `db.forms.create/update` | **P0: No validation** |
| 33 | `createEventAction` | **`z.any()`** (`EventProductionSchema`) | `withAuth` (always true) | `db.events.create` | **P0: No validation** |
| 34 | `updateEventAction` | **`z.any()`** (`EventProductionSchema`) | `withAuth` (always true) | `db.events.findById/update/create` | **P0: No validation** |
| 35 | `upsertUserAction` | **`z.any()`** (`UserSchema`) | `withAuth` (always true) | `db.users.create/update` | **P0: No validation** |
| 36 | `upsertLessonAction` | **`z.any()`** (`LessonSchema`) | `withAuth` (always true) | `db.lessons.create/update` | **P0: No validation** |
| 37 | `upsertConservatoriumAction` | **`z.any()`** (`ConservatoriumSchema`) | `withAuth` (always true) | `db.conservatoriums.create/update` | **P0: No validation** |

### 2.3 Playing School & Payment Actions (6 total)

| # | Action Name | Schema | Auth | DB Access | Notes |
|---|-------------|--------|------|-----------|-------|
| 38 | `resolvePlayingSchoolToken` | `ResolveTokenSchema` | `withAuth` (always true) | None (hardcoded map) | Hardcoded token map in file |
| 39 | `createPlayingSchoolEnrollment` | `CreateEnrollmentSchema` | `withAuth` (always true) | None (mock delay) | **Contains `z.any()` in studentDetails/parentDetails fields**; simulates API delay |
| 40 | `getPlayingSchoolPaymentUrl` | `z.string()` | `withAuth` (always true) | None | Payment URL generation; falls back to mock |
| 41 | `acceptExcellenceTrackOffer` | `ExcellenceTrackResponseSchema` | `withAuth` (always true) | None (mock delay) | Returns hardcoded success |
| 42 | `declineExcellenceTrackOffer` | `ExcellenceTrackResponseSchema` | `withAuth` (always true) | None (mock delay) | Returns hardcoded success |
| 43 | `inviteSchoolCoordinator` | `InviteCoordinatorSchema` | `withAuth` (always true) | None (mock delay) | Uses crypto.randomBytes (good) |
| 44 | `createDonationCheckout` | `CreateDonationCheckoutSchema` | `withAuth` (always true) | None | Payment URL generation |
| 45 | `generateAiEventPoster` | `GenerateEventPosterSchema` | `withAuth` (always true) | None (AI flow) | Schema OK |

---

## 3. `z.any()` Schema Audit

### 3.1 Schemas defined as `z.any()` in `actions.ts` (lines 269-275)

| Schema Name | Line | Used By | Impact |
|-------------|------|---------|--------|
| `FormSubmissionSchema` | 269 | `upsertFormSubmissionAction` | **P0** -- Ministry exam forms, teacher declarations; arbitrary data accepted |
| `EventProductionSchema` | 270 | `createEventAction`, `updateEventAction` | **P1** -- Event data; lower risk but still unvalidated |
| `UserSchema` | 273 | `upsertUserAction` | **P0** -- User creation/update; can inject arbitrary roles, IDs, PII |
| `LessonSchema` | 274 | `upsertLessonAction` | **P0** -- Lesson slot creation; can create lessons with invalid times, room conflicts |
| `ConservatoriumSchema` | 275 | `upsertConservatoriumAction` | **P1** -- Conservatorium entity; tenant-level data |

### 3.2 Partial `z.any()` in otherwise-typed schemas

| Schema | Field(s) | Line |
|--------|----------|------|
| `CreateEnrollmentSchema` | `studentDetails: z.any()`, `parentDetails: z.any()` | 291-292 |

### 3.3 Existing proper schemas in `src/lib/validation/`

| File | Schemas | Status |
|------|---------|--------|
| `booking.ts` | `BookingRequestSchema`, `MakeupBookingRequestSchema`, `RescheduleRequestSchema`, `CancelLessonRequestSchema` | Good -- but **not used by actions.ts** (used only by Cloud Function specs) |
| `forms.ts` | `FormSubmissionSchema` (proper), `SignatureSubmissionSchema`, `AttendanceMarkSchema`, `SickLeaveRequestSchema` | Good -- but **actions.ts uses its own `z.any()` instead** |
| `practice-log.ts` | `PracticeLogSchema`, `TeacherCommentSchema` | Good -- not referenced from actions.ts |
| `user-schema.ts` | `userBaseSchema` (Israeli ID validator only) | Partial -- only validates `nationalId` field |

**Key finding:** Well-typed validation schemas **already exist** in `src/lib/validation/` but are **not imported by `actions.ts`**. The `FormSubmissionSchema` in `validation/forms.ts` is comprehensive, yet `actions.ts` line 269 defines its own `FormSubmissionSchema = z.any()`.

---

## 4. Mock Data vs. Database Adapter Usage

### 4.1 Actions using the `DatabaseAdapter` (via `getDb()`)

All CRUD actions (items 10-37 in section 2.2) correctly call `getDb()` and use the adapter interface. However, the `FirebaseAdapter` in `src/lib/db/adapters/firebase.ts` is:

```typescript
export class FirebaseAdapter extends MemoryDatabaseAdapter {
  constructor() {
    super(buildDefaultSeed());
  }
}
```

This means **all "database" operations are in-memory array manipulations** -- data is lost on every server restart.

### 4.2 Actions with hardcoded mock data

| Action | Mock Pattern | File Location |
|--------|-------------|---------------|
| `resolvePlayingSchoolToken` | Hardcoded `PLAYING_SCHOOL_TOKEN_MAP` with 4 schools | `actions.ts` lines 420-521 |
| `createPlayingSchoolEnrollment` | `await new Promise(resolve => setTimeout(resolve, 1000))` simulated delay | `actions.ts` line 1137 |
| `acceptExcellenceTrackOffer` | `await new Promise(resolve => setTimeout(resolve, 800))` + hardcoded message | `actions.ts` lines 1197-1204 |
| `declineExcellenceTrackOffer` | `await new Promise(resolve => setTimeout(resolve, 500))` + hardcoded message | `actions.ts` lines 1215-1222 |
| `getPlayingSchoolPaymentUrl` | `await new Promise(resolve => setTimeout(resolve, 500))` simulated delay | `actions.ts` line 1161 |

### 4.3 Notification Dispatcher

`src/lib/notifications/dispatcher.ts` is **real, production-quality code** (245 lines) but:
- SMS/WhatsApp channels are **commented out** (lines 141, 150 just push to `delivered` without calling Twilio)
- Falls back to `console.warn` when `TWILIO_ACCOUNT_SID` is unset
- `sendSMS()` and `sendWhatsApp()` functions **do** contain real Twilio REST API calls

### 4.4 Cardcom Payment Integration

`src/lib/payments/cardcom.ts` is **real API code** but:
- `createCardcomPaymentPage()` returns mock URL when `CARDCOM_TERMINAL_NUMBER` is unset
- `chargeStoredCard()` returns `{ success: false, error: 'Cardcom not configured' }` in production path
- `handleCardcomWebhook()` has **no HMAC validation** -- just checks `responseCode`
- No `/api/cardcom-webhook/route.ts` file exists (webhook route not created)

---

## 5. Cloud Function Specs to Server Action Mapping

| Cloud Function Spec | File | Corresponding Server Action | Gap |
|---------------------|------|----------------------------|-----|
| `bookLessonSlot` (callable) | `booking.ts` | `upsertLessonAction` (z.any!) | **No transaction, no room lock, no credit deduction** |
| `bookMakeupLesson` (callable) | `makeup-booking.ts` | `upsertLessonAction` (z.any!) | **No atomic credit redemption** |
| `onLessonCancelled` (trigger) | `lesson-triggers.ts` | None | **No trigger exists; cancellation in use-auth.tsx mock context** |
| `onLessonCompleted` (trigger) | `lesson-triggers.ts` | None | **No trigger exists; stats not updated** |
| `expireMakeupCredits` (scheduled) | `lesson-triggers.ts` | None | **No scheduler; credits never expire** |
| `dailyAgeGateCheck` (scheduled) | `lesson-triggers.ts` | None | **Under-13 role never upgrades** |
| `sendLessonReminders` (scheduled) | `lesson-triggers.ts` | None | **No reminder notifications** |
| `syncTeacherCalendars` (scheduled) | `calendar-sync.ts` | None | **No Google Calendar integration** |
| `getIsraeliHolidaysForYear` (callable) | `holiday-calendar.ts` | None | **Holiday data not fetched from Hebcal** |
| `generateYearlySlots` (callable) | `holiday-calendar.ts` | None | **No bulk slot generation** |
| `generatePayrollExport` (callable) | `payroll-export.ts` | None | **No payroll export** |

---

## 6. Auth Layer Analysis

### `src/lib/auth-utils.ts` (29 lines)

```typescript
export async function verifyAuth(): Promise<boolean> {
    return true;  // ALWAYS TRUE
}
```

- **No session cookie verification** -- should use Firebase Admin `verifySessionCookie()`
- **No role checking** -- no `requireRole()` function
- **No conservatoriumId scoping** -- actions can operate on any tenant's data
- **No user identity extraction** -- actions don't know WHO is calling them

### Missing: `src/middleware.ts`

This file does not exist. Without middleware:
- Dashboard routes are publicly accessible
- No role/conservatoriumId injection into request headers
- No session validation before Server Component rendering

---

## 7. Priority Matrix

### P0 -- Security Blocking (must fix before any production traffic)

| ID | Issue | Impact | Remediation |
|----|-------|--------|-------------|
| P0-1 | `verifyAuth()` always returns `true` | Any unauthenticated request can invoke any server action | Replace with Firebase Admin `verifySessionCookie()` + Custom Claims check |
| P0-2 | `UserSchema = z.any()` | Arbitrary user creation: attacker can set `role: 'site_admin'` | Import and use real schema from `src/lib/validation/user-schema.ts` (extend it) |
| P0-3 | `LessonSchema = z.any()` | Lesson injection with arbitrary times, rooms, student IDs | Create proper LessonSlot schema in `src/lib/validation/` |
| P0-4 | `FormSubmissionSchema = z.any()` (in actions.ts) | Ministry exam form injection; overwrite existing forms | Replace with import from `src/lib/validation/forms.ts` |
| P0-5 | `ConservatoriumSchema = z.any()` | Tenant data manipulation; create fake conservatoriums | Create proper Conservatorium schema |
| P0-6 | No role-based access control | Teacher can invoke admin-only actions; parent can modify other students | Add `requireRole()` to each action with appropriate role list |
| P0-7 | No conservatoriumId tenant isolation | Cross-tenant data access possible | Enforce `conservatoriumId` from authenticated user claims, not client input |

### P1 -- Data Integrity (must fix before storing real student/financial data)

| ID | Issue | Impact | Remediation |
|----|-------|--------|-------------|
| P1-1 | FirebaseAdapter is MemoryDatabaseAdapter | All data lost on restart; no persistence | Implement real Firestore reads/writes |
| P1-2 | No Firestore transactions for booking | Room double-booking (RC-1), credit undercount (RC-4) | Implement `bookLessonSlot` as Cloud Function with transaction |
| P1-3 | No atomic makeup credit redemption | Double-spending makeup credits (RC-2) | Implement `bookMakeupLesson` with transaction |
| P1-4 | Cardcom webhook no HMAC validation | Payment status forgery | Implement HMAC-SHA256 in `/api/cardcom-webhook/route.ts` |
| P1-5 | No payment idempotency | Double-charging on monthly auto-charge (RC-3) | Implement idempotency keys per `cardcom.ts` spec |
| P1-6 | `EventProductionSchema = z.any()` | Event data corruption | Create proper EventProduction schema |
| P1-7 | `CreateEnrollmentSchema` has `studentDetails: z.any()` | PII injection in enrollment | Type the nested objects properly |

### P2 -- Feature Gaps (required for full functionality)

| ID | Issue | Impact | Remediation |
|----|-------|--------|-------------|
| P2-1 | Cloud Functions not deployed | No event-driven automation | Deploy as Firebase Cloud Functions (2nd Gen) |
| P2-2 | Google Calendar sync unimplemented | Teachers can't sync calendars | Implement OAuth flow + Calendar API |
| P2-3 | Payroll export unimplemented | Admin can't generate payroll reports | Implement `generatePayrollExport` callable |
| P2-4 | Monthly auto-charge missing | Parents not charged automatically | Implement scheduled function |
| P2-5 | Credit expiry scheduler missing | Expired credits remain AVAILABLE | Implement `expireMakeupCredits` scheduled function |
| P2-6 | Age-gate function missing | Under-13 students never upgrade | Implement `dailyAgeGateCheck` |
| P2-7 | Playing School token map hardcoded | Can't add new schools dynamically | Move to database |
| P2-8 | Holiday calendar not fetched | Manual closure date entry needed | Implement Hebcal API integration |

---

## 8. DatabaseAdapter Interface Coverage

The `DatabaseAdapter` interface in `src/lib/db/types.ts` defines 18 repositories:

| Repository | Entity Type | Used in actions.ts | Notes |
|------------|-------------|-------------------|-------|
| `users` | `User` | `upsertUserAction` | via z.any() |
| `conservatoriums` | `Conservatorium` | `upsertConservatoriumAction` | via z.any() |
| `conservatoriumInstruments` | `ConservatoriumInstrument` | 3 actions | Properly typed |
| `lessonPackages` | `LessonPackage` | 3 actions | Properly typed |
| `lessons` | `LessonSlot` | `upsertLessonAction` | via z.any() |
| `branches` | `Branch` | 2 actions | Properly typed |
| `rooms` | `Room` | 3 actions | Properly typed |
| `events` | `EventProduction` | 2 actions | via z.any() |
| `forms` | `FormSubmission` | `upsertFormSubmissionAction` | via z.any() |
| `approvals` | `FormSubmission` | Not used in actions.ts | Only in MemoryAdapter |
| `scholarships` | `ScholarshipApplication` | 3 actions | Properly typed |
| `rentals` | `RentalRecord` | Not used in actions.ts | -- |
| `payments` | `Invoice` | Not used in actions.ts | Payments go through Cardcom directly |
| `payrolls` | `PayrollSummary` | Not used in actions.ts | -- |
| `announcements` | `Announcement` | `createAnnouncement` | Properly typed |
| `alumni` | `Alumnus` | 2 actions | Properly typed |
| `masterClasses` | `Masterclass` | 3 actions | Properly typed |
| `repertoire` | `RepertoireEntry` | 2 search actions | Properly typed |
| `donationCauses` | `DonationCause` | 2 actions | Properly typed |
| `donations` | `DonationRecord` | `recordDonationAction` | Properly typed |

**Missing from DatabaseAdapter:** `makeupCredits`, `practiceLogs`, `notifications`, `roomLocks`, `teacherExceptions`, `consentRecords`, `complianceLogs`.

---

## 9. Recommendations Summary

1. **Immediate (P0):** @Security must deliver `verifyAuth()` replacement and middleware. @Backend must replace all `z.any()` schemas using existing validation schemas + new ones from @Security.

2. **Short-term (P1):** @DBA must deliver Firestore schema and rules. @Backend then implements FirebaseAdapter with real Firestore SDK calls. Cardcom webhook handler must be created.

3. **Medium-term (P2):** Cloud Functions deployment, Google Calendar OAuth, payroll export, scheduled functions.

---

*End of Backend Audit Report*
