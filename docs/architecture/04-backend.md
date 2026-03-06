# 04 — Backend

## 1. Backend Architecture Overview

Harmonia uses a **serverless backend** composed of three layers:

| Layer | Technology | Role |
|-------|-----------|------|
| **Server Actions** | Next.js Server Actions | Authenticated data mutations from Client Components; validated server-side |
| **Callable Cloud Functions** | Firebase Cloud Functions (2nd Gen / Cloud Run) | Transactional operations requiring atomicity, external API calls, or background processing |
| **Triggered / Scheduled Functions** | Firebase Cloud Functions | Event-driven reactions (new document, payment webhook) and cron jobs |

The client **never writes directly to Firestore**. All mutations go through Server Actions or Callable Functions that validate Firebase Custom Claims before any write.

---

## 2. API Design Principles

1. **Claims-first auth** — every callable function reads the caller's role and `conservatoriumId` from `context.auth.token` (Firebase Custom Claims), never from request body.
2. **Zod validation** — all input is validated with a shared Zod schema before any business logic runs.
3. **Idempotency** — payment and credit-issuance functions accept an idempotency key (`operationId`) to prevent double-charge on retry.
4. **Atomic transactions** — room booking, makeup credit redemption, and monthly auto-charge use Firestore transactions or batch writes to guarantee consistency.
5. **Audit trail** — every consequential write appends to a `/complianceLogs` collection before returning.

---

## 3. Callable Cloud Functions

These are invoked by client code via `httpsCallable()`.

### 3.1 Booking Engine

#### `bookLessonSlot`
```typescript
Input: {
  teacherId: string;
  studentId: string;
  startTime: Timestamp;
  durationMinutes: 30 | 45 | 60;
  packageId?: string;
  roomId?: string;
  isVirtual: boolean;
}
Steps:
  1. Validate caller role (PARENT | STUDENT_OVER_13 | ADMIN | TEACHER)
  2. Validate conservatoriumId from claims === slot's conservatoriumId
  3. Zod schema validation on input
  4. Check teacher availability (no overlap with existing slots)
  5. Acquire roomLock document (Firestore transaction, TTL = lesson duration + 15min)
  6. Deduct credit from Package (atomic transaction: package.usedCredits++)
  7. Create LessonSlot document
  8. Dispatch notifications (student/parent reminder, teacher notification)
  9. Optionally sync to Google Calendar
Output: { lessonId: string; success: boolean }
```

#### `bookMakeupLesson`
```typescript
Input: { makeupCreditId: string; startTime: Timestamp; teacherId: string; roomId?: string }
Steps:
  1. Validate caller owns the makeupCreditId
  2. Firestore transaction: MakeupCredit.status AVAILABLE → REDEEMED
  3. Create LessonSlot with type: 'MAKEUP'
  4. Dispatch confirmation notification
```

#### `rescheduleLesson`
```typescript
Input: { lessonId: string; newStartTime: Timestamp; newRoomId?: string }
Steps:
  1. Load existing LessonSlot, validate caller owns it
  2. Enforce cancellation policy notice window (e.g., 24h)
     → If < 24h: treat as late cancel (status: CANCELLED_STUDENT_NO_NOTICE, credit forfeited)
     → If ≥ 24h: release old slot, create new slot, notify teacher
```

#### `submitSickLeave`
```typescript
Input: { teacherId: string; dates: Date[]; note?: string }
Role: TEACHER (own sick leave) | ADMIN (on behalf)
Steps:
  1. Find all SCHEDULED slots for teacherId on the given dates
  2. Batch cancel all found slots (status: CANCELLED_TEACHER)
  3. For each cancelled slot: create MakeupCredit document for affected student
  4. Notify all affected students/parents via SMS + email
  5. Admin dashboard AI Alert created
  6. Optionally suggest substitute teachers (availability check)
```

### 3.2 Payment Functions

#### `createPaymentPage`
```typescript
Input: { invoiceId: string; installments: 1 | 3 | 6 | 10 | 12 }
Steps:
  1. Load Invoice, validate payerId === caller.uid
  2. Call Cardcom Hosted Payment Page API
     → POST /api/v1/LowProfile/Create with amount, description, installments, returnUrl
  3. Return { paymentUrl: string } — redirect client to Cardcom hosted page
  4. DO NOT store card details — Cardcom manages PCI scope
```

#### `onPaymentWebhook` (triggered, not callable)
```typescript
Trigger: POST /api/cardcom-webhook
Steps:
  1. Validate Cardcom HMAC signature on request
  2. Extract invoiceId from ReturnValue field
  3. Idempotency check: if Invoice.status already PAID, return 200 and stop
  4. Firestore transaction: Invoice.status → PAID, Invoice.paidAt → now
  5. Trigger Package activation or credit top-up as appropriate
  6. Send payment confirmation email (PDF receipt from Storage)
```

### 3.3 Auth Functions

#### `onUserApproved` (triggered)
```typescript
Trigger: Firestore onDocumentUpdated('users/{userId}')
Condition: approved changed to true OR role changed
Action: admin.auth().setCustomUserClaims(userId, {
  role: user.role,
  conservatoriumId: user.conservatoriumId,
  approved: user.approved,
})
Effect: All subsequent JWT tokens for this user carry the new claims.
```

---

## 4. Scheduled Cloud Functions

| Function | Schedule | Action |
|----------|----------|--------|
| `monthlyAutoCharge` | 1st of month, 06:00 | Generate invoices for all active MONTHLY/YEARLY packages; call Cardcom tokenised charge for each |
| `syncTeacherCalendars` | Every 15 minutes | Fetch Google Calendar / CalDAV for opted-in teachers; mark conflicts in `teacherExceptions` |
| `dailyAgeGateCheck` | Daily, 02:00 | Find STUDENT_UNDER_13 profiles with `dateOfBirth` that crossed 13th birthday; trigger Age-Upgrade notification to parent |
| `expireCredits` | Daily, 03:00 | Find MakeupCredit documents past `expiresAt`; set status → EXPIRED; notify student/parent |
| `sendLessonReminders` | Daily, 08:00 | Send SMS/WhatsApp reminders for lessons scheduled in the next 24h |
| `archiveExpiredRecords` | September 1 | Move >3-year-old lesson and form records to archive sub-collections (PDPPA retention policy) |

---

## 5. Domain Logic — Core Business Rules

### 5.1 Cancellation Policy Engine

Cancellation credit entitlement is determined by the configured policy per conservatorium:

| Condition | Outcome |
|-----------|---------|
| Student cancels with ≥ N hours notice (configurable, default 24h) | Makeup credit issued |
| Student cancels with < N hours notice | Credit forfeited; slot status: `CANCELLED_STUDENT_NO_NOTICE` |
| Teacher cancels for any reason | Makeup credit always issued to student |
| Conservatorium cancels (holiday, facility) | Makeup credit always issued |
| Student no-show | Credit forfeited; slot status: `NO_SHOW_STUDENT` |
| Teacher no-show | Credit issued; teacher flag raised; admin alerted |

### 5.2 Makeup Credit Lifecycle

```
MakeupCredit.status:
  AVAILABLE → (student books makeup lesson) → REDEEMED
  AVAILABLE → (30 days pass without booking) → EXPIRED (with notification at day 25)
```

Each credit is an explicit Firestore document in `/conservatoriums/{cid}/makeupCredits/{creditId}`. Credits are **never** implicitly inferred from `Package.usedCredits` — the ledger is explicit and auditable.

### 5.3 Room Booking Lock

To prevent double-booking in a concurrent system:

```typescript
// roomLocks/{conservatoriumId}_{roomId}_{slotStartMinute}
{
  roomId: string;
  lockedBy: string;       // lessonSlotId
  expiresAt: Timestamp;   // now + durationMinutes + 15min buffer
}
```

`bookLessonSlot` uses a Firestore transaction to atomically:
1. Check if a `roomLock` document exists and is not expired
2. If free: create the lock and the `LessonSlot` in the same transaction
3. If locked: throw `ROOM_UNAVAILABLE` error to the client

### 5.4 Israeli VAT & Invoicing

- VAT rate: 17% (configurable per conservatorium for future rate changes)
- Invoice numbers: sequential per conservatorium — `CON-2026-00142`
- Installments: 1–12 months supported via Cardcom's J5 installment parameter
- Sibling discount: applied automatically at invoice generation when `parent.childIds.length > 1`
- Prorated billing: `(monthlyRate / lessonsInMonth) × remainingLessons` for mid-month enrolments

### 5.5 Payroll Export

Harmonia is **not** a payroll system. It exports structured data for external Israeli HR systems (Hilan, Merav Digital):

```
CSV columns: teacherName, nationalId, employmentType, lessonsCount,
             totalMinutes, actualHours, overtimeHours, sickDays,
             grossCompensation, period
```

The file uses `UTF-8 with BOM` to ensure correct Hebrew rendering in Excel and Israeli HR software.

---

## 6. AI Agents (Genkit / Gemini)

All AI agents are implemented as **Genkit flows** in `src/ai/flows/`. They run server-side only and are never called directly from client components.

| Agent | Flow File | Trigger | Action |
|-------|-----------|---------|--------|
| Matchmaker | `match-teacher-flow.ts` | End of enrollment wizard Step 5 | Two-pass: hard-filter teachers, then LLM-score top candidates (weight: specialty 40%, schedule 30%, level 20%, age group 10%). Returns top 3 with human-readable match reasons. |
| Progress Report Drafter | `draft-progress-report-flow.ts` | Teacher clicks "Draft Report" | Reads student's practice logs, lesson notes, and repertoire status; drafts a parent-facing progress narrative in Hebrew. Teacher reviews and edits before sending. |
| Help Assistant | `help-assistant-flow.ts` | User opens Help chat | RAG over `src/lib/help-articles.ts`; answers questions about the platform in the user's locale. Falls back to "contact support" for unknown queries. |
| Event Poster Generator | `generate-event-poster.ts` | Admin creates an event | Generates promotional poster text and layout suggestions using event metadata. Returns structured content for admin review. |
| Scheduling Advisor | > TODO: Requires manual documentation | Async AI job queue | Monitors schedule fill rates; proactively alerts admin when a teacher's slots are < 70% booked. |

All AI agents:
- Log every invocation to `/conservatoriums/{cid}/aiJobs/{jobId}`
- Never take irreversible actions without human confirmation
- Can be enabled/disabled per conservatorium in settings

---

## 7. Notification Dispatcher

All outbound notifications are routed through a single `NotificationDispatcher` service that respects user channel preferences and quiet hours.

```typescript
// src/lib/notifications/dispatcher.ts
interface NotificationPayload {
  type: NotificationType;  // e.g. 'LESSON_REMINDER' | 'TEACHER_SICK' | 'PAYMENT_DUE'
  recipientId: string;
  data: Record<string, string>;  // template variables
  urgent?: boolean;              // bypasses quiet hours if true
}
```

| Channel | Provider | Use Case |
|---------|----------|----------|
| In-App | Firebase Cloud Messaging (FCM) | All events for active users |
| Email | SendGrid (via Firebase Extensions) | Invoices, approvals, weekly summaries |
| SMS | Twilio | Urgent time-sensitive: same-day cancellations, payment failures |
| WhatsApp | Twilio WhatsApp API | Israeli-preferred channel; replaces SMS for opted-in users |

Quiet hours (configurable per user, default 22:00–08:00) suppress non-urgent SMS/WhatsApp; messages are queued and sent after quiet period. Urgent cancellations always bypass quiet hours.

