# 05 — Data Persistence

## 1. Database Layer — Current Reality

> ⚠️ **The app runs on in-memory mock data by default.** The `DB_BACKEND` env var defaults to `mock` (if unset and no `DATABASE_URL` present), which loads all data from `src/lib/data.ts` into a `MemoryDatabaseAdapter`. No data is persisted between server restarts.

**Firebase Firestore** is the intended production cloud database, but the `FirebaseAdapter` (`src/lib/db/adapters/firebase.ts`) is currently an 8-line stub that simply extends `MemoryDatabaseAdapter` — it makes no Firestore SDK calls.

**PostgreSQL** (via Docker) is the most complete real alternative: the `PostgresAdapter` (`src/lib/db/adapters/postgres.ts`, 1749 lines) has a full read-write implementation including schema migrations and seed scripts. When `DATABASE_URL` is set, the app automatically uses Postgres.

A **multi-backend abstraction layer** (`src/lib/db/`) allows the backend to be switched via the `DB_BACKEND` environment variable:

---

## 2. Intended Firestore Schema (Production Target)

> This describes the planned Firestore document hierarchy when the `FirebaseAdapter` is fully implemented. Current data lives in the `MemoryDatabaseAdapter` in-memory seed. The `DatabaseAdapter` interface in `src/lib/db/types.ts` defines 17 typed repositories that map to these collections.

```
ROOT COLLECTIONS:
├── /users/{userId}
│     Global user profiles (cross-conservatorium identity)
│
├── /conservatoriums/{cid}
│   ├── /settings/{settingType}          # Config: cancellationPolicy, payroll, pricing
│   ├── /stats/live                      # O(1) aggregated dashboard document
│   │
│   ├── /teachers/{teacherId}            # Teacher profiles (extends user)
│   ├── /teacherAvailability/{availId}   # Weekly availability templates
│   ├── /teacherExceptions/{exId}        # Sick leave, holidays, ad-hoc overrides
│   │
│   ├── /lessonSlots/{slotId}            # All lesson slots (recurring, makeup, trial, adhoc)
│   │   └── /notes/{noteId}             # Per-lesson teacher notes (sub-collection)
│   ├── /roomLocks/{lockKey}             # Short-TTL optimistic booking locks
│   ├── /rooms/{roomId}                  # Room catalog with instrument equipment
│   │
│   ├── /packages/{packageId}            # Student lesson packages
│   ├── /makeupCredits/{creditId}        # Explicit makeup credit ledger
│   ├── /invoices/{invoiceId}            # All invoices
│   ├── /payrollPeriods/{periodId}       # Monthly payroll summaries
│   │
│   ├── /practiceLogs/{logId}            # Student practice sessions
│   ├── /assignedRepertoire/{repId}      # Teacher-assigned pieces
│   ├── /examPrepTrackers/{trackerId}    # Ministry exam preparation tracking
│   │
│   ├── /formSubmissions/{formId}        # Forms & approvals
│   ├── /formTemplates/{templateId}      # Reusable form templates
│   │
│   ├── /notifications/{notifId}         # In-app notification feed
│   ├── /notificationAuditLog/{logId}    # SMS/Email delivery audit trail
│   ├── /messageThreads/{threadId}       # Direct messages (teacher ↔ student/parent)
│   │
│   ├── /instruments/{instrumentId}      # Instrument inventory catalog
│   ├── /instrumentCheckouts/{checkId}   # Active and historical checkouts
│   ├── /closureDates/{dateKey}          # Holiday and closure calendar
│   ├── /waitlistEntries/{entryId}       # Teacher waitlist
│   │
│   ├── /events/{eventId}               # Recital / concert productions
│   ├── /scholarshipApplications/{appId} # Financial aid applications
│   ├── /donationRecords/{donationId}    # Donation fund ledger
│   ├── /aiJobs/{jobId}                  # Async AI job queue + audit log
│   └── /complianceLogs/{logId}          # PDPPA compliance + mutation audit trail
│
├── /parentOf/{parentId_studentId}       # Denormalised parent-child links (for Security Rules)
├── /ageUpgradeInvitations/{inviteId}    # Pending 13th-birthday account invitations
├── /consentRecords/{recordId}           # PDPPA consent tracking
└── /signatureAuditRecords/{auditId}     # Digital signature audit trail
```

---

## 3. Core Entity Models (Verified from `src/lib/types.ts`)

> All types below have been verified against the actual 1964-line `src/lib/types.ts`. Differences from the original SDD are noted.

### 3.1 User
```typescript
// Verified — role values are LOWERCASE strings in code
interface User {
  id: string;
  name: string;                          // single full-name field (not firstName/lastName split)
  email: string;
  role: UserRole;                        // 'student' | 'teacher' | 'parent' | 'conservatorium_admin' | 'delegated_admin' | 'site_admin' | 'ministry_director' | 'school_coordinator'
  conservatoriumId: string;
  conservatoriumName: string;            // denormalised for display
  approved: boolean;
  dateOfBirth?: string;                  // ISO Date (alias: birthDate)
  parentId?: string;
  childIds?: string[];
  preferredLanguage?: string;            // not directly in User — via NotificationPreferences.language
  oauthProviders?: UserOAuthProvider[];
  registrationSource?: 'email' | 'google' | 'microsoft' | 'admin_created';
  accountType?: 'FULL' | 'PLAYING_SCHOOL' | 'TRIAL';
  // + teacher-specific, student-specific, playing school fields embedded on User
}
```

> ⚠️ **Difference from SDD plan:** `User.name` is a single string field, not `firstName` + `lastName`. There is no `firstName`/`lastName` split in the type. Also `User.conservatoriumName` is denormalised (embedded string) which avoids a join but must be kept in sync.

### 3.2 LessonSlot
```typescript
// Verified — matches SDD plan closely
interface LessonSlot {
  id: string;
  conservatoriumId: string;
  teacherId: string;
  studentId: string;
  instrument: string;
  startTime: string;                     // ISO Timestamp (string, not Timestamp object)
  durationMinutes: 30 | 45 | 60;
  recurrenceId?: string;
  type: 'RECURRING' | 'MAKEUP' | 'TRIAL' | 'ADHOC' | 'GROUP';
  bookingSource: 'STUDENT_SELF' | 'PARENT' | 'TEACHER' | 'ADMIN' | 'AUTO_MAKEUP';
  roomId?: string;
  branchId?: string;                     // Additional field vs SDD plan
  isVirtual: boolean;
  meetingLink?: string;
  packageId?: string;
  isCreditConsumed: boolean;
  makeupCreditId?: string;               // Additional field — links to MakeupCredit
  status: SlotStatus;
  attendanceMarkedAt?: string;
  teacherNote?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  rescheduledFrom?: string;              // Additional field — original time before reschedule
  rescheduledAt?: string;
  googleCalendarEventId?: string;        // Additional field — for calendar sync
  effectiveRate?: number;                // Additional field — NIS rate at time of lesson
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 Package
```typescript
// Verified — simpler than SDD plan
interface Package {
  id: string;
  studentId?: string;
  type: 'TRIAL' | 'PACK_5' | 'PACK_10' | 'MONTHLY' | 'YEARLY' | 'ADHOC_SINGLE';
  title: string;
  description: string;
  totalCredits?: number;
  usedCredits?: number;
  price: number;
  paymentStatus?: 'PAID' | 'PENDING' | 'FAILED';
  validFrom?: string;
  validUntil?: string;
  // Note: no conservatoriumId, no installments field on Package itself
}
```

> ⚠️ **Gap vs. SDD plan:** `Package` lacks `conservatoriumId` and `installments`. The `LessonPackage` type (separate from `Package`) is the admin-configured catalog entry with full multi-locale names and per-conservatorium configuration.

### 3.4 Invoice
```typescript
// Verified — simpler than SDD plan
interface Invoice {
  id: string;
  invoiceNumber: string;
  conservatoriumId: string;
  payerId: string;
  lineItems: { description: string; total: number }[];
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  paidAt?: string;
}
```

> ⚠️ **Gap vs. SDD plan:** Missing `subtotal`, `discounts`, `vatAmount`, `paidAmount`, `paymentMethod`, `installments`, `pdfUrl` fields. VAT not modelled in type.

### 3.5 MakeupCredit — Verified (matches SDD plan)
See `04-backend.md` §4.2 for the full verified type.

### 3.6 Room — Verified (matches SDD-FIX-10)
```typescript
interface Room {
  id: string;
  conservatoriumId: string;
  branchId: string;
  name: string;
  capacity: number;
  instrumentEquipment: { instrumentId: string; quantity: number; notes?: string }[];
  blocks: RoomBlock[];
  isActive: boolean;
  description?: string;
  photoUrl?: string;
  equipment?: string[];                  // Legacy free-text field kept for backward compat
}
```

### 3.7 FormSubmission — Verified (hybrid model)
```typescript
// Actual FormSubmission is a HYBRID — fields for all form types merged flat
interface FormSubmission {
  id: string;
  formType: string;
  conservatoriumId?: string;
  studentId: string;
  studentName: string;
  status: FormStatus;
  submissionDate: string;
  repertoire: Composition[];
  totalDuration: string;
  workflowSteps?: WorkflowStepDefinition[];  // from formTemplateId reference
  currentStep?: number;
  approvalHistory?: ...;
  // + 30+ flat optional fields covering all form types
}
```

> ⚠️ **Difference from SDD plan:** `FormSubmission` uses a flat optional-field design rather than the `formData: Record<string, unknown>` design in the SDD. All form type-specific fields (exam level, event name, conductor, etc.) are flat optional fields on the base type.

### 3.8 Additional Verified Types (Not in Original SDD)

The following types exist in `types.ts` and represent features beyond the original 17-module SDD:

| Type | Module |
|------|--------|
| `PlayingSchoolInfo`, `PlayingSchoolInvoice`, `SchoolPartnership`, `PlayingSchoolEnrollment`, `SchoolGroupLesson` | SDD-PS (Playing School) |
| `InstrumentInventory`, `InstrumentRental`, `InstrumentCheckout` | Rentals |
| `AlumniProfile`, `Masterclass`, `MasterClassRegistration` | Alumni + Masterclasses |
| `OpenDayEvent`, `OpenDayAppointment` | Open Day |
| `PerformanceBooking`, `PerformanceProfile` | Musicians for Hire |
| `ExamPrepTracker`, `GroupLessonSlot`, `Ensemble` | Exam prep + ensembles |
| `ConsentRecord`, `SignatureAuditRecord`, `ComplianceLog` | PDPPA compliance |
| `ConservatoriumLiveStats`, `RoomLock`, `TeacherException` | Production operational types |
| `MinistryDirector`, `MinistryFormTemplate`, `MinistryInboxItem` | Ministry Director portal |
| `AIJob`, `ConservatoriumInstrument`, `LessonPackage` | AI queue + admin catalog |

---

## 4. Key Design Decisions

### 4.1 Explicit MakeupCredit Collection

Makeup credits are **not** implicit in `Package.usedCredits`. Each credit is a first-class document with a full lifecycle (`AVAILABLE → REDEEMED | EXPIRED`). This enables:
- Transparent audit trail per credit
- Expiry notifications at day 25
- Admin view of all pending credits across all students

### 4.2 Stats Document for O(1) Dashboard

The admin dashboard must **never** trigger collection scans. A `/conservatoriums/{cid}/stats/live` document is maintained by Cloud Functions and contains pre-aggregated counts:

```typescript
{
  activeStudents: number;
  lessonsThisWeek: number;
  revenueThisMonth: number;
  pendingApprovals: number;
  openMakeupCredits: number;
  aiAlerts: number;
  updatedAt: Timestamp;
}
```

### 4.3 RoomLocks as Coordination Primitives

`roomLocks` documents are not business entities — they are short-lived coordination mechanisms (TTL = lesson duration + 15 min). They prevent double-booking in concurrent booking scenarios without requiring pessimistic locking on the entire room schedule.

### 4.4 Sub-Collection for Lesson Notes

Lesson notes live in `/lessonSlots/{slotId}/notes/{noteId}` rather than inline on the slot document. This keeps the hot `lessonSlots` collection lean; notes are only loaded when a teacher opens a specific lesson.

### 4.5 Global User Identity

`/users/{userId}` is a root collection, not nested under a conservatorium. A teacher who works at two conservatoriums has one Firebase Auth identity; their role within each conservatorium is in the per-conservatorium `/teachers/{id}` document.

---

## 5. Firestore Index Requirements

The following composite indexes are required (must be deployed before production):

| Collection | Fields | Query Purpose |
|------------|--------|---------------|
| `lessonSlots` | `conservatoriumId`, `teacherId`, `startTime` ASC | Teacher schedule view |
| `lessonSlots` | `conservatoriumId`, `studentId`, `startTime` ASC | Student schedule view |
| `lessonSlots` | `conservatoriumId`, `startTime` ASC, `status` | Admin master schedule |
| `lessonSlots` | `conservatoriumId`, `roomId`, `startTime` ASC | Room availability check |
| `invoices` | `conservatoriumId`, `payerId`, `status`, `dueDate` DESC | Family billing view |
| `invoices` | `conservatoriumId`, `status`, `dueDate` ASC | Admin overdue report |
| `makeupCredits` | `conservatoriumId`, `studentId`, `status` | Student credit wallet |
| `makeupCredits` | `conservatoriumId`, `status`, `expiresAt` ASC | Credit expiry job |
| `formSubmissions` | `conservatoriumId`, `status`, `currentStep` | Admin approvals queue |
| `practiceLogs` | `studentId`, `date` DESC | Practice history |

---

## 6. Firebase Storage Structure

```
/conservatoriums/{cid}/
├── invoices/{invoiceId}.pdf            # Generated invoice PDFs
├── formSubmissions/{formId}.pdf        # Approved form exports (Ministry-ready)
├── sheetMusic/{compositionId}/
│   ├── original.pdf
│   └── optimised.pdf                  # Compressed by Cloud Function pipeline
├── practiceVideos/{studentId}/{logId}  # Student practice video uploads
├── teacherPhotos/{teacherId}.jpg
└── signatures/{auditRecordId}.png      # Digital signature captures
```

---

## 7. Multi-Backend Strategy (Verified from `src/lib/db/index.ts`)

```typescript
// src/lib/db/index.ts (actual auto-detection logic)
function resolveBackend(): string {
  const explicit = process.env.DB_BACKEND?.trim().toLowerCase();
  if (explicit) return explicit;
  if (process.env.DATABASE_URL) return 'postgres';  // auto-detect Postgres
  return 'mock';  // default — in-memory seed data
}
```

| Backend | `DB_BACKEND` value | Implementation | Recommended For |
|---------|-------------------|----------------|----------------|
| `mock` | `mock` (default) | `MemoryDatabaseAdapter` — in-memory seed from `data.ts` | Local dev, demos |
| `firebase` | `firebase` | ⚠️ **`MemoryDatabaseAdapter` stub** — no Firestore calls | Production (not yet) |
| `postgres` | `postgres` (or auto-detected) | ✅ `PostgresAdapter` — 1749 lines, full read-write | Local dev with Docker |
| `supabase` | `supabase` | ✅ `SupabaseAdapter` — full implementation | Low-cost cloud |
| `pocketbase` | `pocketbase` | ✅ `PocketBaseAdapter` — full implementation | Single-site lightweight |

**PostgreSQL tooling:**
```json
"db:start":  "docker compose up -d"
"db:migrate":"node scripts/db/run-sql-file.mjs scripts/db/schema.sql"
"db:seed":   "node scripts/db/run-sql-file.mjs scripts/db/seed.sql ..."
"db:reset":  "node scripts/db/reset.mjs"
"db:studio": "npx drizzle-kit studio"
```

