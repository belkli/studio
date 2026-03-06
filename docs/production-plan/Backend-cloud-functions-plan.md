# Firebase Cloud Functions Implementation Plan

> **Author:** @Backend | **Date:** 2026-03-06

---

## 1. Overview

All 6 files in `src/lib/cloud-functions/` are **typed pseudocode specifications**. This document maps each spec to its implementation requirements and prioritizes which to deploy first.

---

## 2. Proposed Firebase Functions Directory Structure

```
functions/
├── package.json                 # firebase-functions v2, firebase-admin
├── tsconfig.json                # ES2022 target, strict mode
├── src/
│   ├── index.ts                 # Central export of all functions
│   ├── callable/
│   │   ├── book-lesson-slot.ts          # bookLessonSlot
│   │   ├── book-makeup-lesson.ts        # bookMakeupLesson
│   │   ├── generate-payroll-export.ts   # generatePayrollExport
│   │   ├── get-israeli-holidays.ts      # getIsraeliHolidaysForYear
│   │   └── generate-yearly-slots.ts     # generateYearlySlots
│   ├── triggers/
│   │   ├── on-lesson-cancelled.ts       # onLessonCancelled
│   │   ├── on-lesson-completed.ts       # onLessonCompleted
│   │   └── on-user-approved.ts          # onUserApproved (Custom Claims)
│   ├── scheduled/
│   │   ├── expire-makeup-credits.ts     # daily 03:00 IST
│   │   ├── daily-age-gate-check.ts      # daily 02:00 IST
│   │   ├── send-lesson-reminders.ts     # daily 08:00 IST
│   │   ├── sync-teacher-calendars.ts    # every 15 minutes
│   │   └── monthly-auto-charge.ts       # 1st of month 10:00 IST
│   ├── lib/
│   │   ├── firestore-helpers.ts         # Shared Firestore transaction utilities
│   │   ├── notification-dispatch.ts     # Reusable notification dispatch
│   │   └── cardcom-client.ts            # Cardcom API client (from src/lib/payments/cardcom.ts)
│   └── types/                           # Shared types (symlink or copy from src/lib/types.ts)
└── .eslintrc.js
```

**Runtime:** Node.js 20 LTS
**Region:** `europe-west1` (PDPPA data residency)
**Generation:** Firebase Functions 2nd Gen (Cloud Run-backed)

---

## 3. Per-Function Implementation Analysis

### 3.1 bookLessonSlot (Callable) -- PRIORITY 1

**Spec file:** `src/lib/cloud-functions/booking.ts`
**Readiness:** High -- the spec is thorough with pseudocode for the 8-step transaction.

**Implementation requirements:**
1. Validate input with `BookingRequestSchema` (already exists in `src/lib/validation/booking.ts`)
2. Authorize caller: verify Custom Claims (`role`, `conservatoriumId`)
3. Firestore transaction with 5 reads + 3 writes:
   - Read: teacher conflict query, room lock document, package document, stats document, (optionally) student enrollment verification
   - Write: lesson slot document, room lock document, package credit increment, stats update
4. Return created slot ID or error code

**Significant work needed:**
- Room lock implementation (`conservatoriums/{cid}/roomLocks/{roomId}_{startTime}`)
- Package credit deduction with `FieldValue.increment(1)`
- Stats update with `FieldValue.increment()`
- Error handling for all race conditions

**Estimated complexity:** High -- the Firestore transaction with 5+ document reads is complex.

**Corresponding Server Action to modify:** `upsertLessonAction` should delegate to this Cloud Function for new bookings, or be replaced entirely.

### 3.2 bookMakeupLesson (Callable) -- PRIORITY 1

**Spec file:** `src/lib/cloud-functions/makeup-booking.ts`
**Readiness:** High -- clear transaction spec with RC-2 mitigation.

**Implementation requirements:**
1. Validate input with `MakeupBookingRequestSchema` (exists in `src/lib/validation/booking.ts`)
2. Transaction: read credit -> verify AVAILABLE -> check teacher availability -> create slot -> mark credit REDEEMED
3. All within single Firestore transaction

**Significant work needed:**
- Minimal beyond the booking.ts work -- reuses room lock and teacher conflict logic
- Credit status transition: AVAILABLE -> REDEEMED must be atomic

**Estimated complexity:** Medium -- similar to bookLessonSlot but simpler.

### 3.3 onLessonCancelled (Trigger) -- PRIORITY 1

**Spec file:** `src/lib/cloud-functions/lesson-triggers.ts`
**Readiness:** Medium -- spec defines 5 actions but no pseudocode for each.

**Implementation requirements:**
1. Firestore trigger on `conservatoriums/{cid}/lessonSlots/{slotId}` document update
2. Detect status change to `CANCELLED_*` or `NO_SHOW_*`
3. Determine if makeup credit should be issued (based on `CancellationPolicy`)
4. Create `MakeupCredit` document with status `AVAILABLE`
5. Update `conservatoriumStats/live`
6. Dispatch notifications
7. Release room lock if applicable

**Significant work needed:**
- CancellationPolicy lookup per conservatorium
- Notification dispatch integration (can reuse `dispatcher.ts`)
- Room lock release logic

**Estimated complexity:** Medium

### 3.4 onLessonCompleted (Trigger) -- PRIORITY 2

**Spec file:** `src/lib/cloud-functions/lesson-triggers.ts`
**Readiness:** Medium

**Implementation requirements:**
1. Firestore trigger on `conservatoriums/{cid}/lessonSlots/{slotId}` document update
2. Detect status change to `COMPLETED`
3. Update stats (lessonsCompletedThisWeek, lessonHoursThisMonth)
4. Check for student achievements
5. Update teacher payroll tracking
6. Release room lock

**Significant work needed:**
- Achievement system implementation
- Payroll tracking document structure
- Stats document increments

**Estimated complexity:** Low-Medium

### 3.5 generatePayrollExport (Callable) -- PRIORITY 2

**Spec file:** `src/lib/cloud-functions/payroll-export.ts`
**Readiness:** High -- `buildPayrollRow()` helper function is already implemented.

**Implementation requirements:**
1. Admin-only authorization
2. Query COMPLETED lessons in date range
3. Group by teacher, calculate compensation
4. Generate CSV/Excel (use `exceljs` or `xlsx` library)
5. Upload to Firebase Storage
6. Return download URL

**Significant work needed:**
- Excel generation library integration
- Firebase Storage upload with signed URL
- UTF-8 BOM for Hebrew/Excel compatibility

**Estimated complexity:** Medium

### 3.6 Scheduled Functions -- PRIORITY 2-3

| Function | Schedule | Complexity | Priority |
|----------|----------|------------|----------|
| `expireMakeupCredits` | Daily 03:00 IST | Low -- query + batch update | P2 |
| `dailyAgeGateCheck` | Daily 02:00 IST | Low -- query users by age + update claims | P2 |
| `sendLessonReminders` | Daily 08:00 IST | Medium -- query tomorrow's lessons + dispatch | P2 |
| `syncTeacherCalendars` | Every 15 min | High -- OAuth + Google Calendar API | P3 |
| `monthlyAutoCharge` | 1st of month | High -- Cardcom token charge + idempotency | P2 |

### 3.7 getIsraeliHolidaysForYear (Callable) -- PRIORITY 3

**Spec file:** `src/lib/cloud-functions/holiday-calendar.ts`
**Readiness:** High -- `mapHebcalToClosureDate()` helper is implemented.

**Implementation requirements:**
1. HTTP GET to Hebcal API
2. Map response to `ClosureDate` documents
3. Batch write to Firestore

**Estimated complexity:** Low

### 3.8 generateYearlySlots (Callable) -- PRIORITY 3

**Spec file:** `src/lib/cloud-functions/holiday-calendar.ts`
**Readiness:** Medium -- spec defines steps but no implementation.

**Implementation requirements:**
1. Fetch teacher availability templates
2. Fetch closure dates for the year
3. Generate SCHEDULED slots per day per teacher (skip holidays, Shabbat)
4. Batch write in chunks of 400

**Estimated complexity:** Medium

---

## 4. Promotion Assessment

### Can be promoted to real Cloud Functions with minimal changes:

1. **`getIsraeliHolidaysForYear`** -- helper function exists, just needs Firestore batch write wrapper
2. **`buildPayrollRow`** -- helper exists, needs query + Excel generation wrapper
3. **`mapHebcalToClosureDate`** -- pure function, ready to use

### Require significant implementation:

1. **`bookLessonSlot`** -- needs full Firestore transaction (most complex)
2. **`bookMakeupLesson`** -- similar transaction complexity
3. **`syncTeacherCalendars`** -- needs OAuth flow, Google Calendar API client, two-way sync logic
4. **`monthlyAutoCharge`** -- needs Cardcom token charge integration + idempotency

### Require only boilerplate:

1. **`expireMakeupCredits`** -- simple query + batch update
2. **`dailyAgeGateCheck`** -- simple query + Custom Claims update
3. **`sendLessonReminders`** -- query + notification dispatch

---

## 5. Deployment Dependencies

```
Phase 1 (requires Firestore schema from @DBA):
  bookLessonSlot
  bookMakeupLesson
  onLessonCancelled
  onLessonCompleted

Phase 2 (requires Phase 1 + Cardcom HMAC from @Security):
  expireMakeupCredits
  generatePayrollExport
  monthlyAutoCharge
  sendLessonReminders
  dailyAgeGateCheck

Phase 3 (requires OAuth integration):
  syncTeacherCalendars
  getIsraeliHolidaysForYear
  generateYearlySlots
```

---

## 6. Shared Infrastructure Needed

1. **Firebase Admin SDK initialization** -- `functions/src/lib/firestore-helpers.ts` with `admin.initializeApp()`
2. **Notification dispatch** -- Port `src/lib/notifications/dispatcher.ts` into functions directory
3. **Cardcom client** -- Port `src/lib/payments/cardcom.ts` for webhook handling and token charges
4. **Type sharing** -- Either symlink `src/lib/types.ts` or publish as internal package

---

*End of Cloud Functions Implementation Plan*
