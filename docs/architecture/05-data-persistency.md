# 05 — Data Persistence

## 1. Primary Database

**Firebase Firestore** (NoSQL, document-based) is the production cloud database. It is accessed exclusively through the `DatabaseAdapter` interface — never called directly from UI components.

A **multi-backend abstraction layer** (`src/lib/db/`) allows the backend to be switched via the `DB_BACKEND` environment variable, supporting local development (PostgreSQL), low-cost hosting (Supabase), and ultra-lightweight single-site installs (PocketBase).

---

## 2. Canonical Firestore Schema

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

## 3. Core Entity Models

### 3.1 User
```typescript
interface User {
  id: string;                            // Firebase Auth UID
  email?: string;                        // absent for STUDENT_UNDER_13
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  conservatoriumId: string;
  approved: boolean;
  dateOfBirth?: Date;                    // drives age-gate logic
  parentId?: string;                     // child → parent link
  childIds?: string[];                   // parent → children links
  preferredLanguage?: 'he' | 'ar' | 'en' | 'ru';
  oauthProviders?: UserOAuthProvider[];  // Google / Microsoft linked accounts
  registrationSource: 'email' | 'google' | 'microsoft' | 'admin_created';
  createdAt: Timestamp;
}
```

### 3.2 LessonSlot
```typescript
interface LessonSlot {
  id: string;
  conservatoriumId: string;
  teacherId: string;
  studentId: string;
  instrument: string;
  startTime: Timestamp;
  durationMinutes: 30 | 45 | 60;
  recurrenceId?: string;                 // links slots in a recurring series
  type: 'RECURRING' | 'MAKEUP' | 'TRIAL' | 'ADHOC' | 'GROUP';
  bookingSource: 'STUDENT_SELF' | 'PARENT' | 'TEACHER' | 'ADMIN' | 'AUTO_MAKEUP';
  roomId?: string;
  isVirtual: boolean;
  meetingLink?: string;
  packageId?: string;
  isCreditConsumed: boolean;
  status: SlotStatus;
  attendanceMarkedAt?: Timestamp;
  cancelledAt?: Timestamp;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type SlotStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED_STUDENT_NOTICED'
  | 'CANCELLED_STUDENT_NO_NOTICE'
  | 'CANCELLED_TEACHER'
  | 'CANCELLED_CONSERVATORIUM'
  | 'NO_SHOW_STUDENT'
  | 'NO_SHOW_TEACHER';
```

### 3.3 Package
```typescript
interface Package {
  id: string;
  conservatoriumId: string;
  studentId: string;
  type: 'TRIAL' | 'PACK_5' | 'PACK_10' | 'MONTHLY' | 'YEARLY' | 'ADHOC_SINGLE';
  totalCredits: number;
  usedCredits: number;
  price: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  validFrom: Date;
  validUntil: Date;
  installments?: number;               // 1–12, for Israeli market
}
```

### 3.4 Invoice
```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;               // e.g. CON-2026-00142
  conservatoriumId: string;
  payerId: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discounts: number;
  vatAmount: number;                   // 17% Israeli VAT
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  dueDate: Date;
  paidAt?: Date;
  paidAmount?: number;
  paymentMethod?: string;
  installments?: number;
  pdfUrl?: string;
  createdAt: Timestamp;
}
```

### 3.5 MakeupCredit
```typescript
interface MakeupCredit {
  id: string;
  conservatoriumId: string;
  studentId: string;
  issuedForLessonSlotId: string;       // the cancelled lesson that generated this credit
  issuedAt: Timestamp;
  expiresAt: Timestamp;                // typically 30 days from issuance
  status: 'AVAILABLE' | 'REDEEMED' | 'EXPIRED';
  redeemedForLessonSlotId?: string;    // the makeup lesson that consumed this credit
  redeemedAt?: Timestamp;
}
```

### 3.6 Teacher Profile
```typescript
interface TeacherProfile {
  id: string;
  userId: string;
  conservatoriumId: string;
  instruments: string[];
  specialties: TeacherSpecialty[];
  gradeLevels: string[];
  teachingLanguages: string[];
  maxStudents: number;
  employmentType: 'EMPLOYEE' | 'FREELANCE';
  hourlyRate: number;
  ratePerDuration: Record<number, number>;   // { 30: 80, 45: 110, 60: 140 }
  assignedRoomIds: string[];
  canTeachVirtual: boolean;
  isActive: boolean;
  isOnLeave: boolean;
  leaveUntil?: Date;
}
```

### 3.7 Room
```typescript
interface Room {
  id: string;
  conservatoriumId: string;
  branchId: string;
  name: string;
  capacity: number;
  instrumentEquipment: {
    instrumentId: string;    // references instruments/{id}
    quantity: number;
    notes?: string;
  }[];
  blocks: {
    id: string;
    startDateTime: string;
    endDateTime: string;
    reason: string;
    blockedByUserId: string;
  }[];
  isActive: boolean;
}
```

### 3.8 FormSubmission
```typescript
interface FormSubmission {
  id: string;
  type: 'RECITAL' | 'CONFERENCE' | 'EXAM_REGISTRATION' | 'COMPOSITION_SUBMISSION'
      | 'SCHOLARSHIP_REQUEST' | 'INSTRUMENT_REQUEST' | 'CUSTOM';
  conservatoriumId: string;
  submittedBy: string;
  studentId: string;
  teacherId: string;
  status: FormStatus;
  workflowSteps: WorkflowStep[];
  currentStep: number;
  title: string;
  formData: Record<string, unknown>;
  attachments?: Attachment[];
  approvalHistory: ApprovalHistoryEntry[];
  ministryExportedAt?: Timestamp;
  ministryReferenceNumber?: string;
  pdfUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

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

## 7. Multi-Backend Strategy

The `DatabaseAdapter` interface supports four backends, selected by `DB_BACKEND`:

```typescript
// src/lib/db/index.ts
export async function getDb(): Promise<DatabaseAdapter> {
  switch (process.env.DB_BACKEND ?? 'firebase') {
    case 'firebase':  return new FirebaseAdapter();
    case 'postgres':  return new PostgresAdapter(process.env.DATABASE_URL!);
    case 'supabase':  return new SupabaseAdapter(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    case 'pocketbase': return new PocketBaseAdapter(process.env.POCKETBASE_URL!);
  }
}
```

| Backend | Recommended For | Cost |
|---------|----------------|------|
| `firebase` | Cloud production (default) | Pay-per-use |
| `postgres` | Local development (Docker) | Free |
| `supabase` | Low-cost cloud alternative | Free tier → $25/mo |
| `pocketbase` | Single-site ultra-lightweight installs | Free (self-hosted) |

> **Note:** The PostgreSQL schema migration scripts live in `scripts/db/`. Run these to seed a local Postgres instance with realistic mock data matching the `data.json` fixture.

