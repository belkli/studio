# SDD-P1: Persona Audit — Conservatorium Administrator
**Lyriosa 360° Architecture Audit**
**Persona:** Conservatorium Administrator (מנהל/ת קונסרבטוריון)
**Auditor Role:** Senior Full-Stack Architect + Domain Expert
**Version:** 1.0 | **Date:** 2026-02-25
**Source:** Studio-main prototype + SDD Enhancements v2.0 (Modules 00–17)

---

## 1. Executive Summary

The Lyriosa SDD documentation paints an ambitious and largely coherent picture of an administrator's command center. The architectural intent is strong: a real-time dashboard, automated billing, payroll generation, room management, and AI-assisted alerts. However, after auditing the actual prototype code against the SDD specifications, a significant gap exists between *what is documented* and *what is implemented*.

**What Is Good:**
- The `LessonSlot` and `Package` data models are well-structured and cover the core scheduling lifecycle.
- SDD-11 (Reporting & Analytics) correctly identifies the key admin metrics (active students, revenue, pending approvals, open makeups).
- SDD-03 payroll model is thoughtfully designed — the `PayrollPeriod` structure with per-lesson line items and freelance vs. employee distinction is production-grade on paper.
- SDD-06 cancellation policy configuration is flexible and covers the right axes (notice hours, credit type, teacher vs. student cancellations).
- Multi-tenant `conservatoriumId` is baked into every model from the start — a critical architectural win.

**What Is Lacking or Thin:**
- **Capacity Dashboard:** The SDD references a "Command Center" at `/admin` but the prototype contains no implementation of real-time aggregations. Firestore doesn't auto-aggregate — without Cloud Functions writing to summary documents, every admin page load would trigger expensive collection-group queries across potentially thousands of documents.
- **Payroll Data Export:** Documented in SDD-03 Section 9 but zero implementation exists in the prototype. No Cloud Function, no payroll summary writer. Note: full salary calculation (tax deductions, ביטוח לאומי, etc.) is out of scope for Phase 1 — that responsibility sits with dedicated HR/payroll software (e.g., Hilan, Merav Digital). Lyriosa's role is to produce a structured export of the raw attendance and compensation data that feeds those external systems.
- **Instrument Inventory:** Not present in any SDD module or prototype code. High-value instrument checkout (Yamaha CP88, brass, orchestral strings) is a critical operational need for most conservatoriums and is completely absent.
- **Complex Scheduling Matrix:** The SDD covers individual lesson booking well but is silent on: room double-booking prevention with real database-level locking, ensemble/group lesson scheduling, national holiday calendars (עלה of Israel), and academic year template generation.
- **Teacher Payroll Data Export:** The SDD defines the distinction (`employmentType: 'EMPLOYEE' | 'FREELANCE'`) but Lyriosa is not intended to be a payroll system. Israeli social employment calculations (ניכוי מס במקור, ביטוח לאומי, Bituach Leumi, health tax) are handled by dedicated external software — Hilan (hilan.co.il) and Merav Digital (meravdigital.co.il) are the market-standard tools. Lyriosa's responsibility is to export a clean, structured data file (CSV/Excel) containing: employee identity, lesson records with timestamps, configured hourly rate, sick leave days, and events — everything the accounting department needs to feed into their HR system. A full in-house payroll engine may be considered for a later phase.
- **Makeup Credit Tracking:** The SDD correctly defines makeup credits but the audit trail across the `Package`, `LessonSlot`, and `MakeupCredit` collections is ambiguous — there is no explicit `MakeupCredit` collection defined, meaning credits are implicit in the package's `usedCredits` counter, which creates reconciliation nightmares.

**What Is Redundant:**
- SDD-12 (Smart Slot Filling) and SDD-04 (Scheduling Engine) have significant conceptual overlap in the "ad-hoc pool" logic. The AI-assisted slot-filling agent in SDD-12 duplicates the availability engine in SDD-04 Section 4. These should be merged into a single scheduling service with an optional AI enhancement layer.
- SDD-16 (Guidance & AI Assistant) overlaps with SDD-10 (AI Agents) on the "Help Assistant" functionality. The `help-assistant-flow.ts` already exists in the prototype; SDD-16 adds a UI wrapper that should be a component of SDD-10, not a separate module.

---

## 2. Functional Gap Analysis

### Gap 1: Real-Time Dashboard Aggregations
**Severity:** Critical (P0)

The admin dashboard requires up-to-the-minute numbers. Firestore does not support SQL-style COUNT, SUM, or GROUP BY. Without a denormalized summary layer, every metric card on the dashboard would require a full collection scan.

**Missing:** A `conservatoriumStats` summary document and the Cloud Functions that maintain it.

---

### Gap 2: Instrument Inventory Management
**Severity:** High (P1)

Israeli conservatoriums routinely loan instruments to students — particularly stage pianos (Yamaha CP88, Roland RD-88), brass (trumpets, trombones), and orchestral strings (cellos, violins). There is no data model, UI, or workflow for:
- Instrument catalog with serial numbers, purchase dates, and insured values
- Checkout/return workflow with parent signature
- Maintenance scheduling and repair tracking
- Depreciation tracking for accounting

---

### Gap 3: Makeup Credit Ledger
**Severity:** High (P1)

The current model implies makeup credits are tracked via `Package.usedCredits` decrements, but this is ambiguous. When a teacher cancels and a makeup credit is issued, what document is written? What happens if a makeup credit expires? How does the admin see all students currently holding un-redeemed makeup credits?

**Missing:** An explicit `MakeupCredit` collection and a credit ledger pattern.

---

### Gap 4: Payroll Data Export for External HR Systems
**Severity:** Medium (P1)

Lyriosa is **not** a payroll system. Israeli social employment obligations (ניכוי מס במקור, ביטוח לאומי, health tax) are handled by dedicated HR/payroll platforms — the Israeli market standard tools are **Hilan** (hilan.co.il) and **Merav Digital** (meravdigital.co.il). The accounting department owns this responsibility and already uses one of these systems.

What Lyriosa must provide is a clean, structured **payroll data export** that the accounting department can import into their system of record without any manual rekeying. The export must contain:
- Employee name, ID, and employment type (employee vs. freelance)
- Per-lesson records: date, duration (minutes), student, hourly/per-lesson rate (as configured per teacher by the cost admin)
- Sick leave dates and affected lesson count
- Events attended with applicable rates
- Gross compensation total for the period

Payment transparency for teachers (viewing their own earnings breakdown) also remains in the external HR system for Phase 1. A future phase may consider integrating a full payroll module within Lyriosa if there is sufficient demand.

---

### Gap 5: National Holiday & Academic Year Calendar
**Severity:** Medium (P1)

The scheduling engine must auto-skip Israeli national holidays (Rosh Hashana, Yom Kippur, Sukkot, Pesach, etc.) and conservatorium-specific closure dates. The SDD mentions this but no implementation is specified: no `closureDates` collection, no holiday feed integration, and no academic year template generator.

---

### Gap 6: Room Double-Booking Prevention
**Severity:** Critical (P0)

The SDD states "Room conflicts are detected and flagged at booking time" but provides no implementation spec. In a concurrent system where multiple admins or self-booking students may attempt to book the same room simultaneously, a Firestore transaction or optimistic locking pattern is required. Without this, double-bookings will occur.

---

### Gap 7: Multi-Branch / Multi-Room Capacity Matrix
**Severity:** Medium (P2)

Larger conservatoriums operate across multiple physical locations or branches. The current schema uses `conservatoriumId` as the sole tenant discriminator, but there's no `branchId` or `locationId` concept. Rooms are flat under the conservatorium. A capacity matrix view across branches is not possible.

---

## 3. Actionable Technical Specifications

### 3.1 Firestore: Add `MakeupCredit` Collection

The makeup credit system requires a first-class collection, not an implicit counter delta.

```typescript
// Collection: /conservatoriums/{cid}/makeupCredits/{creditId}
interface MakeupCredit {
  id: string;
  conservatoriumId: string;
  studentId: string;
  packageId?: string;           // the package this credit belongs to (if applicable)
  issuedBySlotId: string;      // the cancelled lesson that triggered this credit
  issuedReason: 'TEACHER_CANCELLATION' | 'CONSERVATORIUM_CANCELLATION' | 'STUDENT_NOTICED_CANCEL';
  issuedAt: Timestamp;
  expiresAt: Timestamp;        // issuedAt + policy.makeupCreditExpiryDays
  status: 'AVAILABLE' | 'REDEEMED' | 'EXPIRED';
  redeemedBySlotId?: string;   // the makeup lesson that consumed this credit
  redeemedAt?: Timestamp;
  amount: number;               // monetary value for accounting (0 if credit-only)
}
```

**Cloud Function: `onLessonCancelled`**
```typescript
// functions/src/onLessonCancelled.ts
export const onLessonCancelled = onDocumentUpdated(
  'conservatoriums/{cid}/lessonSlots/{slotId}',
  async (event) => {
    const before = event.data.before.data() as LessonSlot;
    const after = event.data.after.data() as LessonSlot;

    const creditTriggerStatuses = [
      'CANCELLED_TEACHER',
      'CANCELLED_CONSERVATORIUM',
      'CANCELLED_STUDENT_NOTICED',
    ];

    if (creditTriggerStatuses.includes(after.status) && before.status === 'SCHEDULED') {
      const policy = await getCancellationPolicy(event.params.cid);
      const expiresAt = Timestamp.fromDate(
        addDays(new Date(), policy.makeupCreditExpiryDays)
      );

      const creditRef = db
        .collection(`conservatoriums/${event.params.cid}/makeupCredits`)
        .doc();

      await creditRef.set({
        id: creditRef.id,
        conservatoriumId: event.params.cid,
        studentId: after.studentId,
        packageId: after.packageId ?? null,
        issuedBySlotId: event.params.slotId,
        issuedReason: mapStatusToReason(after.status),
        issuedAt: Timestamp.now(),
        expiresAt,
        status: 'AVAILABLE',
        amount: calculateCreditValue(after, policy),
      } as MakeupCredit);
    }
  }
);
```

---

### 3.2 Firestore: Real-Time Dashboard Aggregations

Add a `stats` document per conservatorium, maintained by Cloud Functions using transactions:

```typescript
// Document: /conservatoriums/{cid}/stats/live
interface ConservatoriumLiveStats {
  activeStudents: number;
  lessonsScheduledThisWeek: number;
  lessonsCompletedThisWeek: number;
  revenueCollectedThisMonth: number;    // in agorot (cents)
  revenueExpectedThisMonth: number;
  pendingApprovals: number;             // forms + registration requests
  openMakeupCredits: number;            // count of AVAILABLE makeup credits
  teachersSickToday: number;
  paymentFailuresLast24h: number;
  updatedAt: Timestamp;
}
```

**Cloud Function: Increment on slot completion**
```typescript
// Triggered by onLessonUpdated — status changed to COMPLETED
await db.runTransaction(async (tx) => {
  const statsRef = db.doc(`conservatoriums/${cid}/stats/live`);
  tx.update(statsRef, {
    lessonsCompletedThisWeek: FieldValue.increment(1),
    updatedAt: Timestamp.now(),
  });
});
```

**Admin Dashboard component should use `onSnapshot`:**
```typescript
// src/hooks/use-live-stats.ts
export function useLiveStats(conservatoriumId: string) {
  const [stats, setStats] = useState<ConservatoriumLiveStats | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, `conservatoriums/${conservatoriumId}/stats/live`),
      (snap) => setStats(snap.data() as ConservatoriumLiveStats)
    );
    return unsub;
  }, [conservatoriumId]);

  return stats;
}
```

---

### 3.3 Firestore: Instrument Inventory Schema

```typescript
// Collection: /conservatoriums/{cid}/instruments/{instrumentId}
interface InstrumentAsset {
  id: string;
  conservatoriumId: string;
  name: string;                     // e.g. "Yamaha CP88 Stage Piano"
  category: 'PIANO' | 'BRASS' | 'WOODWIND' | 'STRINGS' | 'PERCUSSION' | 'OTHER';
  serialNumber: string;
  purchaseDate: Date;
  purchasePrice: number;            // in agorot
  insuredValue: number;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'RETIRED';
  locationRoomId?: string;          // where it normally lives
  status: 'AVAILABLE' | 'CHECKED_OUT' | 'IN_REPAIR' | 'RETIRED';
  currentCheckout?: {
    studentId: string;
    checkedOutAt: Timestamp;
    expectedReturnDate: Date;
    parentSignatureUrl: string;     // Firebase Storage URL of signed agreement
    depositAmount?: number;
  };
  maintenanceHistory: {
    date: Date;
    description: string;
    cost?: number;
    technician?: string;
  }[];
  notes?: string;
}

// Collection: /conservatoriums/{cid}/instrumentCheckouts/{checkoutId}
interface InstrumentCheckout {
  id: string;
  instrumentId: string;
  studentId: string;
  checkedOutAt: Timestamp;
  checkedOutByAdminId: string;
  expectedReturnDate: Date;
  actualReturnDate?: Timestamp;
  returnCondition?: string;
  depositAmount: number;
  depositRefunded: boolean;
  agreementDocUrl: string;          // signed PDF in Storage
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST';
}
```

**Admin UI Route:** `/admin/inventory`
- Table of all instruments with status badges (color-coded)
- "Check Out" button → modal: select student, set return date, upload signed agreement, record deposit
- "Return" button → set condition, issue deposit refund if applicable
- "Schedule Maintenance" → create maintenance record, temporarily set status to `IN_REPAIR`
- Overdue returns → automatically surfaced in admin alerts (Agent 4 in SDD-10 should monitor this)

---

### 3.4 Room Double-Booking Prevention with Firestore Transactions

The current SDD says rooms are assigned at booking time. Without a locking mechanism, two concurrent bookings can claim the same room.

**Solution: Firestore Transaction with optimistic concurrency on a `roomOccupancy` document per time slot:**

```typescript
// functions/src/bookLessonSlot.ts
export const bookLessonSlot = onCall(async (request) => {
  const { teacherId, roomId, startTime, durationMinutes, studentId, conservatoriumId } = request.data;

  const startTs = Timestamp.fromDate(new Date(startTime));
  const endTs = Timestamp.fromDate(new Date(startTime + durationMinutes * 60 * 1000));

  // Composite key: roomId + date + startTime (30-min grid buckets)
  const lockKey = `${roomId}_${formatSlotKey(startTs)}`;
  const lockRef = db.doc(`conservatoriums/${conservatoriumId}/roomLocks/${lockKey}`);
  const slotRef = db.collection(`conservatoriums/${conservatoriumId}/lessonSlots`).doc();

  try {
    await db.runTransaction(async (tx) => {
      const lockSnap = await tx.get(lockRef);
      if (lockSnap.exists()) {
        throw new HttpsError('already-exists', 'ROOM_CONFLICT');
      }

      // Also check teacher availability within transaction
      const teacherConflict = await checkTeacherConflict(tx, teacherId, startTs, endTs, conservatoriumId);
      if (teacherConflict) {
        throw new HttpsError('already-exists', 'TEACHER_CONFLICT');
      }

      tx.set(lockRef, {
        slotId: slotRef.id,
        bookedAt: Timestamp.now(),
        releasedAt: endTs,
      });

      tx.set(slotRef, {
        id: slotRef.id,
        conservatoriumId,
        teacherId,
        studentId,
        roomId,
        startTime: startTs,
        durationMinutes,
        status: 'SCHEDULED',
        // ... other fields
      } as LessonSlot);
    });

    return { slotId: slotRef.id };
  } catch (error) {
    throw error;
  }
});

function formatSlotKey(ts: Timestamp): string {
  const d = ts.toDate();
  return `${d.toISOString().split('T')[0]}_${Math.floor(d.getHours() * 2 + d.getMinutes() / 30)}`;
}
```

---

### 3.5 Payroll Data Export for External HR Systems

Lyriosa produces a structured export file that the accounting department imports into their HR/payroll platform (Hilan, Merav Digital, or equivalent). No tax calculations happen inside Lyriosa.

**Admin UI:** `/admin/payroll` — at the end of each month, admin reviews the draft and clicks **ייצא לגיליון** to download the export file.

**Firestore: Teacher Rate Configuration**

The cost admin sets the compensation rate for each teacher at `/admin/teachers/:id/compensation`:

```typescript
// /conservatoriums/{cid}/teachers/{teacherId} — compensation sub-fields
interface TeacherCompensation {
  employmentType: 'EMPLOYEE' | 'FREELANCE';
  ratePerLesson: {
    duration30: number;    // NIS per 30-min lesson
    duration45: number;
    duration60: number;
  };
  eventHourlyRate?: number;       // NIS per hour for events / rehearsals
  sickLeavePaidPolicy: 'FULL' | 'NONE' | 'PARTIAL';
  sickLeavePartialPercent?: number;
  notes?: string;                  // e.g., "collective agreement rate"
  rateLastUpdatedAt: Timestamp;
  rateLastUpdatedBy: string;       // admin userId
}
```

**Export Function**

```typescript
// src/lib/payroll/export.ts
export interface PayrollExportRow {
  // Identity
  employeeId: string;              // Lyriosa teacher ID
  employeeName: string;
  idNumber?: string;               // ת"ז — if stored; HR system needs this
  employmentType: 'EMPLOYEE' | 'FREELANCE';

  // Period
  periodStart: string;             // 'YYYY-MM-DD'
  periodEnd: string;

  // Lessons
  lessonDate: string;              // 'YYYY-MM-DD'
  lessonStartTime: string;         // 'HH:mm'
  durationMinutes: number;
  studentName: string;
  rateApplied: number;             // NIS for this lesson
  lessonSubtotal: number;

  // Events
  eventDate?: string;
  eventName?: string;
  eventHours?: number;
  eventRate?: number;
  eventSubtotal?: number;

  // Sick leave (summary row per day)
  sickLeaveDate?: string;
  sickLeavePaidAmount?: number;    // 0 if policy is NONE

  // Totals (summary row only)
  grossTotal?: number;
}

export async function generatePayrollExport(
  conservatoriumId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<Buffer> {
  const teachers = await getActiveTeachers(conservatoriumId);
  const rows: PayrollExportRow[] = [];

  for (const teacher of teachers) {
    // Completed lessons in period
    const lessons = await getCompletedLessons(teacher.id, conservatoriumId, periodStart, periodEnd);
    for (const lesson of lessons) {
      const student = await getStudent(lesson.studentId);
      const rate = getRateForDuration(teacher.compensation, lesson.durationMinutes);
      rows.push({
        employeeId: teacher.id,
        employeeName: `${teacher.firstName} ${teacher.lastName}`,
        idNumber: teacher.idNumber,
        employmentType: teacher.compensation.employmentType,
        periodStart: formatDate(periodStart),
        periodEnd: formatDate(periodEnd),
        lessonDate: formatDate(lesson.startTime.toDate()),
        lessonStartTime: formatTime(lesson.startTime.toDate()),
        durationMinutes: lesson.durationMinutes,
        studentName: `${student.firstName} ${student.lastName}`,
        rateApplied: rate,
        lessonSubtotal: rate,
      });
    }

    // Events in period
    const events = await getTeacherEvents(teacher.id, conservatoriumId, periodStart, periodEnd);
    for (const event of events) {
      rows.push({
        employeeId: teacher.id,
        employeeName: `${teacher.firstName} ${teacher.lastName}`,
        idNumber: teacher.idNumber,
        employmentType: teacher.compensation.employmentType,
        periodStart: formatDate(periodStart),
        periodEnd: formatDate(periodEnd),
        lessonDate: '',
        lessonStartTime: '',
        durationMinutes: 0,
        studentName: '',
        rateApplied: 0,
        lessonSubtotal: 0,
        eventDate: formatDate(event.date),
        eventName: event.name,
        eventHours: event.durationHours,
        eventRate: teacher.compensation.eventHourlyRate ?? 0,
        eventSubtotal: (teacher.compensation.eventHourlyRate ?? 0) * event.durationHours,
      });
    }

    // Sick leave days in period
    const sickDays = await getTeacherSickLeave(teacher.id, conservatoriumId, periodStart, periodEnd);
    for (const day of sickDays) {
      const paidAmount = calculateSickLeavePay(day, teacher.compensation);
      rows.push({
        employeeId: teacher.id,
        employeeName: `${teacher.firstName} ${teacher.lastName}`,
        idNumber: teacher.idNumber,
        employmentType: teacher.compensation.employmentType,
        periodStart: formatDate(periodStart),
        periodEnd: formatDate(periodEnd),
        lessonDate: '',
        lessonStartTime: '',
        durationMinutes: 0,
        studentName: '',
        rateApplied: 0,
        lessonSubtotal: 0,
        sickLeaveDate: formatDate(day.date),
        sickLeavePaidAmount: paidAmount,
      });
    }
  }

  // Write as Excel using xlsx library
  const XLSX = require('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows, { header: PAYROLL_EXPORT_COLUMN_ORDER });
  applyHebrewHeaders(ws);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `שכר ${formatHebrewMonth(periodStart)}`);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
```

**The accounting department receives this file and imports it directly into Hilan or Merav Digital.** No further processing is required inside Lyriosa.

> **Future Phase:** If demand warrants, a full in-house payroll module with Israeli tax bracket calculations, ביטוח לאומי contributions, and Hilan/Merav API integration (direct push without file export) can be added as a premium module.

---

### 3.6 National Holiday Calendar Integration

```typescript
// Collection: /conservatoriums/{cid}/closureDates/{dateKey}
interface ClosureDate {
  date: string;            // 'YYYY-MM-DD'
  type: 'NATIONAL_HOLIDAY' | 'CONSERVATORIUM_CLOSURE' | 'EXAM_PERIOD' | 'OTHER';
  name: string;            // e.g., "יום כיפור"
  nameHe: string;
  affectsAllTeachers: boolean;
  affectedTeacherIds?: string[];  // if partial closure
  isRecurring: boolean;           // Gregorian recurrence or Jewish calendar
  jewishCalendarRef?: string;     // e.g., "10_TISHRI" for Yom Kippur
  createdAt: Timestamp;
}

// src/lib/scheduling/holiday-calendar.ts
// Integrate with the @date-fns/hebrew-calendar or a Hebcal API call
export async function getIsraeliHolidaysForYear(year: number): Promise<ClosureDate[]> {
  // Option A: Hebcal API (free, open source)
  const response = await fetch(
    `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&maj=on&min=off&mod=off&nx=on&mf=on&ss=on&s=on&c=on&geo=il`
  );
  const data = await response.json();
  return data.items
    .filter((item: any) => item.category === 'holiday')
    .map((item: any) => ({
      date: item.date,
      type: 'NATIONAL_HOLIDAY',
      name: item.title,
      nameHe: item.hebrew,
      affectsAllTeachers: true,
      isRecurring: true,
      jewishCalendarRef: item.subcat,
    } as ClosureDate));
}

// Admin UI: /admin/settings/calendar
// - Import holidays for current academic year button → calls above function → writes to Firestore
// - Manual add/remove closure dates
// - Preview: "These holidays will be skipped in all recurring schedules"
```

---

### 3.7 Scheduling Matrix: Academic Year Slot Generator

When a yearly subscription is confirmed, the system must generate ~40 lesson slots while respecting holidays:

```typescript
// functions/src/generateAcademicYearSlots.ts
export async function generateYearlySlots(
  conservatoriumId: string,
  teacherId: string,
  studentId: string,
  packageId: string,
  baseSlot: {
    dayOfWeek: number;       // 0=Sun, 1=Mon, ...
    startHour: number;
    startMinute: number;
    durationMinutes: 30 | 45 | 60;
    roomId: string;
  },
  academicYear: { start: Date; end: Date }
): Promise<string[]> {
  const closures = await getClosureDatesForRange(
    conservatoriumId,
    academicYear.start,
    academicYear.end
  );
  const closureDates = new Set(closures.map(c => c.date));

  const slots: LessonSlot[] = [];
  let current = nextDayOfWeek(academicYear.start, baseSlot.dayOfWeek);

  while (current <= academicYear.end) {
    const dateKey = formatDate(current); // 'YYYY-MM-DD'

    if (!closureDates.has(dateKey)) {
      const startTime = Timestamp.fromDate(
        setTime(current, baseSlot.startHour, baseSlot.startMinute)
      );
      slots.push({
        conservatoriumId,
        teacherId,
        studentId,
        packageId,
        startTime,
        durationMinutes: baseSlot.durationMinutes,
        roomId: baseSlot.roomId,
        type: 'RECURRING',
        status: 'SCHEDULED',
        isCreditConsumed: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      } as LessonSlot);
    }
    current = addWeeks(current, 1);
  }

  // Write in batches (Firestore batch limit = 500)
  const slotIds: string[] = [];
  const BATCH_SIZE = 400;
  for (let i = 0; i < slots.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = slots.slice(i, i + BATCH_SIZE);
    for (const slot of chunk) {
      const ref = db.collection(`conservatoriums/${conservatoriumId}/lessonSlots`).doc();
      batch.set(ref, { ...slot, id: ref.id });
      slotIds.push(ref.id);
    }
    await batch.commit();
  }
  return slotIds;
}
```

---

### 3.8 Enhanced Admin Payroll Panel — UI Spec

Route: `/admin/payroll`

**State Machine for Payroll Period:**
```
DRAFT → UNDER_REVIEW → APPROVED → PAID → ARCHIVED
```

**Components Required:**
```typescript
// src/components/admin/payroll/PayrollPanel.tsx
// - Month/period selector (Hebrew calendar aware)
// - Table: Teacher | Employment Type | Hours | Gross | Deductions | Net | Status
// - "Generate All Drafts" button → triggers Cloud Function for all teachers
// - Row click → PayrollDetailModal
//   - For EMPLOYEE: shows tax breakdown (income tax, bituach leumi, health)
//   - For FREELANCE: shows חשבונית preview + PDF download button
// - "Approve All" button (requires 2FA confirmation for amounts > ₪50,000)
// - Export to Excel (for חשבשבת / Priority import)
// - Export to Bank Transfer File (Israeli bank CSV format)
```

---

## 4. Summary Scorecard

| Area | SDD Coverage | Prototype Implementation | Priority to Fix |
|------|-------------|--------------------------|-----------------|
| Dashboard Aggregations | ⚠️ Partial | ❌ Missing | P0 |
| Room Booking Locking | ⚠️ Mentioned | ❌ Missing | P0 |
| Makeup Credit Ledger | ⚠️ Implied | ❌ Missing | P1 |
| Payroll Data Export (CSV/Excel) | ✅ Documented | ❌ Missing | P1 |
| External HR Integration (Hilan/Merav) | ℹ️ Out of scope Phase 1 | N/A — by design | P3 |
| Israeli Tax Engine (in-house) | ℹ️ Out of scope Phase 1 | N/A — by design | P3 |
| Instrument Inventory | ❌ Not documented | ❌ Missing | P1 |
| Holiday Calendar | ⚠️ Mentioned | ❌ Missing | P1 |
| Academic Year Generator | ✅ Documented | ❌ Missing | P1 |
| Multi-Branch Support | ❌ Not documented | ❌ Missing | P2 |
| Annual Tax Reporting | ❌ Not documented | ❌ Missing | P2 |

**Bottom Line:** The administrator experience is the strongest conceptually-documented area of Lyriosa, but it has the widest gap between documentation and implementation. The critical path to a functional admin experience requires: (1) the real-time stats aggregation layer, (2) the makeup credit collection, (3) transactional room booking, and (4) the academic year slot generator. Without these four items, the system cannot safely operate even a small conservatorium. Full payroll calculation (tax, ביטוח לאומי) remains intentionally delegated to Hilan/Merav Digital for Phase 1; Lyriosa's payroll responsibility is producing a clean data export for those systems.
