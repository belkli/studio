# 05 -- Data Persistence

## 1. Multi-Backend Strategy

```typescript
// src/lib/db/index.ts
function resolveBackend(): string {
  const explicit = process.env.DB_BACKEND?.trim().toLowerCase();
  if (explicit) return explicit;
  if (process.env.DATABASE_URL) return 'postgres';
  return 'mock';
}
```

| Backend | `DB_BACKEND` | Implementation | Use Case |
|---------|-------------|----------------|----------|
| `mock` | `mock` (default) | `MemoryDatabaseAdapter` -- in-memory seed | Local dev, demos |
| `firebase` | `firebase` | ✅ `FirebaseAdapter` -- full Firestore (503 lines) | Production |
| `postgres` | `postgres` | ✅ `PostgresAdapter` -- full read-write (1749 lines) | Dev with Docker |
| `supabase` | `supabase` | ✅ `SupabaseAdapter` | Low-cost cloud |
| `pocketbase` | `pocketbase` | ✅ `PocketBaseAdapter` | Single-site lightweight |

### FirebaseAdapter Architecture

`src/lib/db/adapters/firebase.ts` implements all 26 `DatabaseAdapter` repositories using Firestore:

- **Root collections:** `users`, `conservatoriums`, `consentRecords` (top-level, cross-tenant)
- **Sub-collections:** everything else nested under `/conservatoriums/{cid}/`
- **Generic factories:** `createRootRepository<T>()` and `createSubCollectionRepository<T>()`
- **Graceful fallback:** when `FIREBASE_SERVICE_ACCOUNT_KEY` is absent, falls back to `MemoryDatabaseAdapter` with a console warning

### DatabaseAdapter Interface

The `DatabaseAdapter` interface (`src/lib/db/types.ts`) defines 26 typed repositories:

```
users, conservatoriums, conservatoriumInstruments, lessonPackages,
lessons, branches, rooms, events, forms, approvals, scholarships,
rentals, payments, payrolls, announcements, alumni, masterClasses,
repertoire, donationCauses, donations, makeupCredits, practiceLogs,
notifications, roomLocks, teacherExceptions, consentRecords,
complianceLogs
```

---

## 2. Mock Seed Data

The `MemoryDatabaseAdapter` is populated by `buildDefaultMemorySeed()` from:

| Source | Data |
|--------|------|
| `docs/data/constadmin.json` | 85 conservatorium records with real names, cities |
| `docs/data/conservatoriums.json` | 71 directory teachers (18 cons-15 + 50 cons-66 + 3 cons-84) |
| `src/lib/data.ts` | mockUsers, devUser, directoryTeacherUsers (348 total: 71 original + 277 added in 2026-03 sprint across cons-2, -7, -9, -10, -11, -13, -14, -16, -17, -18) |
| `src/lib/data.json` | 5,217 music compositions |

The `/api/bootstrap` route serves all seed data to the client. `NEXT_PUBLIC_ALLOW_BOOTSTRAP_MOCK_FALLBACK=1` enables client fallback.

---

## 3. Firestore Schema

```
ROOT COLLECTIONS:
+-- /users/{userId}                    Global user profiles
+-- /consentRecords/{recordId}         PDPPA consent (immutable)
+-- /parentOf/{parentId_studentId}     Parent-child links (Security Rules)

PER-CONSERVATORIUM (/conservatoriums/{cid}/):
+-- lessonSlots/{slotId}               All lesson slots
+-- rooms/{roomId}                     Room catalog
+-- branches/{branchId}                Physical branches
+-- events/{eventId}                   Recitals, concerts
+-- formSubmissions/{formId}           Forms & approvals
+-- packages/{packageId}               Student packages
+-- lessonPackages/{lpId}              Admin-configured catalog
+-- conservatoriumInstruments/{iId}    Instrument catalog
+-- invoices/{invoiceId}               Billing
+-- payrollPeriods/{periodId}          Monthly payroll
+-- makeupCredits/{creditId}           Credit ledger
+-- practiceLogs/{logId}               Practice sessions
+-- assignedRepertoire/{repId}         Teacher-assigned pieces
+-- scholarshipApplications/{appId}    Financial aid
+-- donationCauses/{causeId}           Donation funds
+-- donationRecords/{donationId}       Donation ledger
+-- notifications/{notifId}            In-app notifications
+-- announcements/{annId}              Conservatorium announcements
+-- alumni/{alumniId}                  Alumni profiles
+-- masterclasses/{mcId}               Masterclass events
+-- roomLocks/{lockKey}                Short-TTL booking locks
+-- teacherExceptions/{exId}           Sick leave, holidays
+-- complianceLogs/{logId}             Audit trail
+-- instrumentCheckouts/{checkId}      Rentals
```

---

## 4. Core Entity Models

### User
```typescript
interface User {
  id: string;
  name: string;                       // single full-name field
  email: string;
  role: UserRole;                     // 10 values (lowercase)
  conservatoriumId: string;
  conservatoriumName: string;         // denormalised
  approved: boolean;
  dateOfBirth?: string;
  parentId?: string;
  childIds?: string[];
  accountType?: 'FULL' | 'PLAYING_SCHOOL' | 'TRIAL';
  isPremiumTeacher?: boolean;         // admin-gated
  // + teacher-specific, student-specific fields
}
```

### LessonSlot
```typescript
interface LessonSlot {
  id: string;
  conservatoriumId: string;
  teacherId: string;
  studentId: string;
  instrument: string;
  startTime: string;                  // ISO Timestamp
  durationMinutes: 30 | 45 | 60;
  type: 'RECURRING' | 'MAKEUP' | 'TRIAL' | 'ADHOC' | 'GROUP';
  bookingSource: 'STUDENT_SELF' | 'PARENT' | 'TEACHER' | 'ADMIN' | 'AUTO_MAKEUP';
  status: SlotStatus;
  roomId?: string;
  branchId?: string;
  isVirtual: boolean;
  packageId?: string;
  isCreditConsumed: boolean;
  makeupCreditId?: string;
}
```

### MakeupCredit
```typescript
interface MakeupCredit {
  id: string;
  conservatoriumId: string;
  studentId: string;
  issuedBySlotId: string;
  issuedReason: 'TEACHER_CANCELLATION' | 'CONSERVATORIUM_CANCELLATION' | 'STUDENT_NOTICED_CANCEL';
  issuedAt: string;
  expiresAt: string;
  status: 'AVAILABLE' | 'REDEEMED' | 'EXPIRED';
  redeemedBySlotId?: string;
  amount: number;
}
```

---

## 5. PostgreSQL Alignment

`scripts/db/seed.sql` contains SQL inserts aligned with mock data:
- All 348 directory teachers with UUID-based records and `teacher_profiles` (71 original + 277 added in 2026-03 sprint; UUIDs c1000000-...-000001 through ...-000484; includes 12 conservatorium website UPDATE statements)
- 9 students, 5 parents, 10 lesson slots
- Uses `scheduled_at` (not `start_time`), lowercase `lesson_status` enum

PostgreSQL tooling:
```
npm run db:start     # docker compose up -d
npm run db:migrate   # run schema.sql
npm run db:seed      # run seed.sql
npm run db:reset     # drop and recreate
npm run db:studio    # drizzle-kit studio
```

---

## 6. Key Design Decisions

1. **Explicit MakeupCredit collection:** Each credit is a first-class document with full lifecycle (`AVAILABLE -> REDEEMED | EXPIRED`), enabling audit trail and expiry notifications.

2. **Stats document for O(1) dashboard:** `ConservatoriumLiveStats` maintained by Cloud Functions with pre-aggregated counts.

3. **RoomLocks as coordination primitives:** Short-TTL documents preventing double-booking without pessimistic locking.

4. **Global User identity:** `/users/{userId}` is root-level. A teacher at two conservatoriums has one Firebase Auth identity.

5. **Sub-collection notes:** Lesson notes in `/lessonSlots/{slotId}/notes/{noteId}` to keep the hot collection lean.
