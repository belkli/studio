# SDD-P6: Persona Audit — QA Expert
**Lyriosa 360° Architecture Audit**
**Persona:** Senior QA Engineer / Test Architect
**Auditor Role:** Edge Case Hunter, Race Condition Analyst, Policy Loophole Finder
**Version:** 1.0 | **Date:** 2026-02-25

---

## 1. Executive Summary

A QA review of Lyriosa reveals a system with well-intentioned business rules and an implementation that is currently incapable of enforcing any of them. The prototype runs entirely on in-memory mock data — meaning every "test" of the system is a simulation against fabricated state that resets on page reload. There is no test suite, no integration tests, no end-to-end tests, and no data validation layer.

More critically, the transition from mock data to Firebase will surface a class of bugs that mock data can never catch: race conditions, concurrent booking conflicts, webhook delivery failures, eventual consistency issues, and policy enforcement gaps.

This audit catalogs the highest-priority bugs, edge cases, and race conditions that **will occur** in production and provides the test specifications and fixes required to prevent them.

**Structural Testing Problems:**
- Zero test files anywhere in the repository (`*.test.ts`, `*.spec.ts`) — not a single unit test
- No Firestore emulator configuration
- No CI/CD pipeline
- No data validation schemas (no Zod, no Yup, no Joi on any form or server action)
- `use-auth.tsx` stores the logged-in user in `localStorage` — trivially exploitable for role spoofing

---

## 2. Critical Race Conditions

### RC-1: Double-Booking a Room (Concurrent Students)
**Severity:** P0 — Will cause room double-bookings in production immediately

**Scenario:** Two parents open the booking calendar simultaneously and both select the same available slot for their child. Both see the slot as green (available). Both click "Book." Both transactions proceed. Room now has two lessons scheduled at the same time.

**Root cause:** The SDD acknowledges room conflict detection but does not implement database-level locking. The mock `addLesson` function in `use-auth.tsx` simply pushes to an array.

**Fix:** The `roomLocks` Firestore transaction from SDD-P1 Section 3.4. Must be applied before any self-service booking goes live.

**Test Spec:**
```typescript
// tests/integration/booking.test.ts
describe('Concurrent room booking', () => {
  it('should reject the second booking when two users book the same slot simultaneously', async () => {
    const room = await createTestRoom('Room 1');
    const teacher = await createTestTeacher({ rooms: [room.id] });
    const slot = { teacherId: teacher.id, roomId: room.id, startTime: tomorrowAt('15:00'), durationMinutes: 60 };

    // Fire both bookings with no await between them (simulating concurrency)
    const [result1, result2] = await Promise.all([
      bookLessonSlot({ ...slot, studentId: 'student-A' }),
      bookLessonSlot({ ...slot, studentId: 'student-B' }),
    ]);

    const successes = [result1, result2].filter(r => r.success).length;
    const failures = [result1, result2].filter(r => !r.success).length;

    expect(successes).toBe(1);
    expect(failures).toBe(1);

    // Verify only one slot exists
    const bookedSlots = await getSlotsByTimeAndRoom(slot.startTime, room.id);
    expect(bookedSlots).toHaveLength(1);
  });
});
```

---

### RC-2: Makeup Credit Double-Spending
**Severity:** P0**

**Scenario:** A student has 1 makeup credit. They open two browser tabs, both showing the makeup booking calendar. They book a makeup slot in each tab within milliseconds of each other. Both bookings consume the same credit — the student now has 2 makeup lessons for 1 credit.

**Root cause:** The `getMakeupCreditBalance` function in the mock computes credit balance by counting lesson statuses — it's not an atomic ledger. Two concurrent transactions can both read balance=1, both confirm booking, both write balance=0 without detecting the conflict.

**Fix:** Use Firestore transactions on the `MakeupCredit` document — the credit status must change from `AVAILABLE` to `REDEEMED` atomically within the same transaction that creates the makeup slot.

```typescript
// functions/src/bookMakeupLesson.ts
export const bookMakeupLesson = onCall(async (request) => {
  const { creditId, newSlotData, conservatoriumId } = request.data;

  const creditRef = db.doc(`conservatoriums/${conservatoriumId}/makeupCredits/${creditId}`);
  const slotRef = db.collection(`conservatoriums/${conservatoriumId}/lessonSlots`).doc();

  await db.runTransaction(async (tx) => {
    const creditSnap = await tx.get(creditRef);
    const credit = creditSnap.data() as MakeupCredit;

    // Atomic check: credit must still be AVAILABLE
    if (credit.status !== 'AVAILABLE') {
      throw new HttpsError('failed-precondition', 'CREDIT_ALREADY_USED');
    }
    if (credit.expiresAt.toMillis() < Date.now()) {
      throw new HttpsError('failed-precondition', 'CREDIT_EXPIRED');
    }

    // Atomically mark as redeemed AND create the slot
    tx.update(creditRef, {
      status: 'REDEEMED',
      redeemedBySlotId: slotRef.id,
      redeemedAt: Timestamp.now(),
    });
    tx.set(slotRef, {
      id: slotRef.id,
      ...newSlotData,
      type: 'MAKEUP',
      isCreditConsumed: true,
      makeupCreditId: creditId,
    });
  });
});
```

**Test Spec:**
```typescript
it('should prevent double-spending a single makeup credit', async () => {
  const credit = await createMakeupCredit({ status: 'AVAILABLE' });
  const [r1, r2] = await Promise.all([
    bookMakeupLesson({ creditId: credit.id, newSlotData: slotA }),
    bookMakeupLesson({ creditId: credit.id, newSlotData: slotB }),
  ]);
  expect([r1, r2].filter(r => r.success)).toHaveLength(1);
  expect([r1, r2].filter(r => !r.success)).toHaveLength(1);
});
```

---

### RC-3: Monthly Auto-Charge Running Twice
**Severity:** P1**

**Scenario:** The Firebase Scheduled Function for monthly auto-charge (runs on the 1st) is triggered twice due to infrastructure retry (Cloud Scheduler guarantees at-least-once delivery). A parent's card is charged twice for the same month.

**Root cause:** Cloud Scheduler + Cloud Functions have at-least-once execution semantics. The monthly charge function has no idempotency key.

**Fix:** Add an idempotency check before charging — look for an existing PAID invoice for the current period:

```typescript
export const monthlyAutoCharge = onSchedule('0 6 1 * *', async () => {
  const monthKey = format(new Date(), 'yyyy-MM'); // e.g., "2026-03"

  const packages = await getActiveMonthlyPackages();
  for (const pkg of packages) {
    // Idempotency check: has this package already been charged for this month?
    const existingInvoice = await db
      .collection(`conservatoriums/${pkg.conservatoriumId}/invoices`)
      .where('packageId', '==', pkg.id)
      .where('billingPeriod', '==', monthKey)
      .where('status', 'in', ['PAID', 'PENDING'])
      .limit(1)
      .get();

    if (!existingInvoice.empty) {
      console.log(`Skipping ${pkg.id} — already invoiced for ${monthKey}`);
      continue;
    }
    // ... proceed with charge
  }
});
```

---

## 3. Policy Loopholes in Cancellation Module (SDD-06)

### PL-1: The "Reschedule as Late Cancellation Bypass" Loophole
**Severity:** P1

**Scenario:** A student wants to cancel a lesson 2 hours before it starts (within the 24-hour notice window, which would forfeit the credit). Instead, they use the "Reschedule" button, which the mock code allows unconditionally. By rescheduling to a far-future date, they effectively cancel without penalty, then cancel the rescheduled lesson later with full notice.

**Fix:** The reschedule action must check the original slot's notice window. If the original lesson is within the late-cancellation window, the reschedule must be treated as a late cancellation:

```typescript
// In the rescheduling server action (SDD-P3, Section 3.2 already specifies this)
if (hoursUntilLesson < policy.studentNoticeHoursRequired) {
  return { success: false, error: 'LATE_CANCEL' };
}
```

---

### PL-2: The "Fake Sick Leave" Teacher Loophole
**Severity:** P1

**Scenario:** A teacher who wants a day off (not sick) uses the "I'm sick — cancel today" button repeatedly, issuing makeup credits to all students and still getting paid for the cancelled lessons (per the SDD: "teacher is paid for teacher-cancelled lessons"). This costs the conservatorium credits without legitimate cause.

**Fix:** Rate-limit sick leave declarations. Add a `sickLeaveCount30Days` counter to teacher profiles, incremented by the `reportSickLeave` function. If count exceeds the configured threshold (e.g., 3 in 30 days), flag the event for admin review before cancellations are processed:

```typescript
interface TeacherProfile {
  // ...existing fields
  sickLeaveDeclaredLast30Days: number;  // maintained by Cloud Function
  sickLeaveAlertThreshold: number;      // default: 3
  sickLeaveUnderReview: boolean;        // admin flag
}
```

---

### PL-3: Makeup Credit Expiry Race at Midnight
**Severity:** P2

**Scenario:** A makeup credit expires at midnight. A student books a makeup lesson at 11:59 PM using the credit. The booking system checks expiry → valid. Midnight passes. The Cloud Function that expires credits runs and marks this credit as EXPIRED. But the lesson was already booked. What is the lesson's validity?

**Fix:** Expiry check must use the booking timestamp (server-side `Timestamp.now()`) against `credit.expiresAt`, and the comparison must happen inside the Firestore transaction. The nightly expiry job should not expire credits that have already been redeemed:

```typescript
// Nightly expiry Cloud Function
const expiredCredits = await db.collectionGroup('makeupCredits')
  .where('status', '==', 'AVAILABLE')  // Only expire AVAILABLE credits, not REDEEMED
  .where('expiresAt', '<', Timestamp.now())
  .get();
```

---

### PL-4: Package Credit Undercount on Concurrent Lesson Booking
**Severity:** P1

**Scenario:** A student has 1 remaining lesson in their `PACK_5`. They open two browser tabs and book two different lessons at the same time. Both bookings check `usedCredits` → 4 (one remaining). Both succeed. Package now shows 6 used credits out of 5.

**Fix:** Credit deduction must use a Firestore transaction with a precondition:

```typescript
await db.runTransaction(async (tx) => {
  const pkgRef = db.doc(`conservatoriums/${cid}/packages/${packageId}`);
  const pkg = (await tx.get(pkgRef)).data() as Package;

  const remainingCredits = pkg.totalCredits - pkg.usedCredits;
  if (remainingCredits < 1) {
    throw new HttpsError('failed-precondition', 'INSUFFICIENT_CREDITS');
  }

  tx.update(pkgRef, { usedCredits: FieldValue.increment(1) });
  // Create lesson slot in same transaction...
});
```

---

## 4. Edge Cases by Module

### Module 02: Registration Edge Cases

| Edge Case | Current Behavior | Required Behavior |
|-----------|-----------------|------------------|
| Student registers with an email already in the system | `addUser` creates a duplicate | Deduplicate on email before creating; show "account exists" flow |
| Parent registers, then student self-registers with same email | Two unlinked accounts | Detect overlap and prompt linking |
| Child turns 13 exactly at midnight on the server vs. client timezone | Cloud Function uses server time (UTC); client may show different date | All age-gate logic must use UTC consistently |
| Enrollment wizard abandoned at Step 5 (after payment page opened) | `NEW_LEAD` state hangs | Set payment timeout (30 min); auto-release slot held during checkout |

### Module 04: Scheduling Edge Cases

| Edge Case | Current Behavior | Required Behavior |
|-----------|-----------------|------------------|
| Lesson spans midnight (e.g., 23:30–00:30) | Slot date is ambiguous | Enforce max lesson start time (e.g., 22:00); or use UTC end timestamp |
| Teacher changes availability AFTER weekly slots are generated | Generated slots are not updated | Emit conflict alert; require admin resolution |
| Daylight Saving Time (Israel transitions in March/October) | Clock change causes 23- or 25-hour days | Store all times in UTC; convert to Israel/Jerusalem timezone for display only |
| Academic year slot generation produces 501+ slots (yearly + group) | Firestore batch limit is 500 | SDD-P1 Section 3.7 already handles this with chunked batches |

### Module 05: Payment Edge Cases

| Edge Case | Current Behavior | Required Behavior |
|-----------|-----------------|------------------|
| Cardcom webhook arrives before `lowProfileId` is saved to Firestore | Webhook lookup fails; invoice not marked paid | Implement webhook retry queue; idempotent webhook handler |
| Parent changes credit card mid-subscription cycle | Old token used for next charge; fails | Card update must update token on all active subscriptions |
| Refund requested for a lesson already marked COMPLETED | No refund flow exists | Refund must create a negative invoice line item and trigger Cardcom API void/refund call |
| Invoice currency mismatch (NIS vs. ILS) | Inconsistent field naming in mock | Standardize on `ILS`; validate at invoice creation |

### Module 06: Cancellation Edge Cases

| Edge Case | Current Behavior | Required Behavior |
|-----------|-----------------|------------------|
| Teacher cancels lesson, student books makeup, teacher then cancels the makeup lesson | Makeup of a makeup — policy unclear | Max 1 makeup per original cancelled lesson; second cancellation triggers cash refund |
| Student cancels a makeup lesson with notice | Mock gives credit → infinite makeup chain | Makeup credits are non-refundable; cancelling a makeup forfeits it |
| Admin changes `noticeHoursRequired` mid-week | Existing bookings use new policy retroactively | Policy changes must apply to future bookings only; snapshot policy at booking time onto the slot |

---

## 5. Test Infrastructure Requirements

```bash
# Install test dependencies
npm install -D jest @types/jest ts-jest \
  @firebase/rules-unit-testing \
  firebase-functions-test \
  @testing-library/react @testing-library/jest-dom

# jest.config.ts
export default {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testMatch: ['**/*.unit.test.ts'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testMatch: ['**/*.integration.test.ts'],
      globalSetup: './tests/setup/emulator-start.ts',
      globalTeardown: './tests/setup/emulator-stop.ts',
    },
    {
      displayName: 'components',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['**/*.component.test.tsx'],
    },
  ],
};

# firebase.json — add emulator config
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "storage": { "port": 9199 },
    "pubsub": { "port": 8085 },
    "scheduler": { "port": 9191 },
    "ui": { "enabled": true }
  }
}
```

**Minimum test coverage targets before production launch:**
- Cloud Functions (booking, cancellation, payment): 90% coverage
- Firestore Security Rules: 100% positive + negative case coverage
- UI components (enrollment wizard, lesson card): 70% coverage
- End-to-end flows (enroll → book → cancel → makeup): 100% happy path + 3 edge cases each

---

## 6. Summary: Top 10 Must-Fix Before Launch

| # | Issue | Module | Severity |
|---|-------|--------|----------|
| 1 | Room double-booking (no transaction locking) | 04 | P0 |
| 2 | Makeup credit double-spending | 06 | P0 |
| 3 | No real Firebase integration (all mock data) | ALL | P0 |
| 4 | localStorage role spoofing (no server validation) | 01 | P0 |
| 5 | Cardcom webhook idempotency missing | 05 | P0 |
| 6 | Package credit overdraft on concurrent booking | 05 | P1 |
| 7 | Reschedule as late-cancellation bypass | 06 | P1 |
| 8 | Monthly charge idempotency missing | 05 | P1 |
| 9 | No input validation (Zod schemas) on any form | ALL | P1 |
| 10 | Cancellation policy not snapshotted at booking time | 06 | P1 |
