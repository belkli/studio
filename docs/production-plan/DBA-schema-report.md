# DBA Schema Report — Harmonia Production Readiness

> Comprehensive analysis of Firestore schema, Security Rules, Storage Rules,
> indexes, type gaps, and Postgres schema alignment.
>
> Author: DBA (production-readiness initiative)
> Date: 2026-03-06

---

## 1. Executive Summary

The Harmonia platform has a well-designed multi-backend database abstraction (`DatabaseAdapter` with 20 typed repositories), but the Firestore adapter is a stub extending `MemoryDatabaseAdapter`. This report documents all artifacts produced to make the Firestore backend production-ready.

### Artifacts Produced

| File | Status | Description |
|------|--------|-------------|
| `firestore.rules` | **Rewritten** | Complete RBAC + tenant isolation for all collections |
| `storage.rules` | **Rewritten** | PII-first storage rules with per-conservatorium isolation |
| `firestore.indexes.json` | **Rewritten** | 17 composite indexes covering all documented queries |
| `docs/production-plan/DBA-type-changes.md` | **Created** | Proposed type changes for Package and Invoice |

---

## 2. Firestore Security Rules Analysis

### 2.1 Design Principles

1. **Authentication required everywhere** — `isSignedIn()` is the baseline for all operations
2. **Approval gate** — `isApproved()` checks `request.auth.token.approved == true`; unapproved users cannot read any business data
3. **Tenant isolation** — Every sub-collection under `/conservatoriums/{cid}/` checks `conservatoriumId()` from Custom Claims matches `{cid}`
4. **Role-based access** — Granular role functions: `isAdminFor(cid)`, `isTeacherFor(cid)`, `isStudent()`, `isParent()`, `isMinistryDirector()`, `isSchoolCoordinator()`
5. **Parent-child isolation** — `isParentOfStudent(studentId)` does an O(1) existence check on `/parentOf/{parentId}_{studentId}`
6. **Write restrictions** — Financial and lifecycle documents (makeupCredits, roomLocks, complianceLogs, notifications, aiJobs) are `allow write: if false` — all mutations via Cloud Functions / Server Actions
7. **Field-level update guards** — Teachers can only update specific fields (attendance, notes) on lessons; users cannot change their own role or approval status

### 2.2 Collections Covered (Complete List)

**Root collections:**
- `/users/{userId}` — read: self, admin, teacher (students only), parent (own children); create: self-registration; update: field-restricted
- `/parentOf/{linkId}` — read: parent or child; write: Cloud Functions only
- `/consentRecords/{recordId}` — read: owner + site admin; create: self or parent; update/delete: never (PDPPA immutable)
- `/signatureAuditRecords/{auditId}` — read: admin + ministry; write: Cloud Functions only
- `/ageUpgradeInvitations/{inviteId}` — read: parent or student; write: Cloud Functions only

**Per-conservatorium sub-collections (under `/conservatoriums/{cid}/`):**
- `settings/{settingType}` — admin only
- `stats/live` — admin + ministry read; Cloud Functions write only
- `teachers/{teacherId}` — member read; admin write
- `teacherAvailability/{availId}` — admin + own teacher
- `teacherExceptions/{exId}` — admin + own teacher create; admin update
- `lessonSlots/{slotId}` — role-based read; admin/teacher create; teacher field-restricted update
- `lessonSlots/{slotId}/notes/{noteId}` — shared-flag based read; teacher write
- `roomLocks/{lockKey}` — admin/teacher read; Cloud Functions write only
- `rooms/{roomId}` — member read; admin write
- `invoices/{invoiceId}` — admin + payer read; admin write; no delete (audit trail)
- `makeupCredits/{creditId}` — admin + student + parent + teacher read; Cloud Functions write only
- `packages/{packageId}` — admin + student + parent read; admin write
- `practiceLogs/{logId}` — role-based read; student/parent create; teacher comment update
- `assignedRepertoire/{repId}` — role-based read; teacher/admin write
- `examPrepTrackers/{trackerId}` — role-based read; teacher/admin write
- `payrollPeriods/{periodId}` — admin + own teacher read; admin write; no delete
- `formSubmissions/{formId}` — role-based read; member create; field-restricted update per role
- `formTemplates/{templateId}` — member + ministry read; admin write
- `scholarshipApplications/{appId}` — admin + student + parent read; student/parent create; admin update
- `donationCauses/{causeId}` — public read; admin write
- `donationRecords/{donationId}` — admin + donor read; authenticated create; immutable
- `instruments/{instrumentId}` — member read; admin write
- `instrumentCheckouts/{checkoutId}` — admin + student + parent read; admin write
- `closureDates/{dateKey}` — member read; admin write
- `waitlistEntries/{entryId}` — role-based read; member create; admin update/delete
- `events/{eventId}` — member read; admin write
- `notifications/{notifId}` — own user read + mark-read update; Cloud Functions create
- `notificationAuditLog/{logId}` — admin read; Cloud Functions write only
- `messageThreads/{threadId}` — participant read/update; member create
- `aiJobs/{jobId}` — admin read; Cloud Functions write only
- `complianceLogs/{logId}` — admin read; Cloud Functions write only (append-only)
- `schoolPartnerships/{partnershipId}` — admin + coordinator + ministry read; admin write
- `playingSchoolEnrollments/{enrollmentId}` — admin + coordinator + parent read; admin write
- `schoolGroupLessons/{lessonId}` — admin + coordinator + own teacher; admin/teacher write
- `ensembles/{ensembleId}` — member read; admin write
- `announcements/{announcementId}` — member read; admin write
- `openDayEvents/{eventId}` — public read; admin write
- `openDayAppointments/{appointmentId}` — admin read; public create; admin update
- `performanceBookings/{bookingId}` — admin read; public inquiry create; admin update
- `alumni/{alumniId}` — member + public (if isPublic) read; admin + own user write
- `masterclasses/{masterclassId}` — member read; admin write
- `conservatoriumInstruments/{instrumentId}` — member read; admin write
- `lessonPackages/{packageId}` — member read; admin write
- `interestLeads/{leadId}` — admin read; public create; admin update

**Catch-all:** `/{document=**}` — deny all (prevents accidental exposure of unmatched paths)

### 2.3 Custom Claims Required

The Security Rules depend on these Firebase Custom Claims being set on every user's token:

```json
{
  "role": "student | teacher | parent | conservatorium_admin | delegated_admin | site_admin | ministry_director | school_coordinator",
  "conservatoriumId": "string",
  "approved": true
}
```

The `onUserApproved` Cloud Function (to be implemented by Backend team) must call `admin.auth().setCustomUserClaims()` whenever a user is approved or their role changes.

---

## 3. Firebase Storage Rules Analysis

### 3.1 PII Protection Strategy

All student-generated content (practice videos, feedback recordings) is classified as **PII of minors** under Israeli PDPPA:
- No public download URLs
- Signed URLs generated server-side via Cloud Functions with short TTL
- Per-conservatorium path isolation: `/conservatoriums/{cid}/...`
- Content type validation on uploads (prevent executable upload attacks)
- Size limits on all upload paths

### 3.2 Storage Paths

| Path | Read Access | Write Access | Size Limit |
|------|-----------|-------------|-----------|
| `/conservatoriums/{cid}/sheetMusic/` | Tenant members | Admin + teacher | 50MB, PDF only |
| `/conservatoriums/{cid}/practiceVideos/{studentId}/` | Admin + teacher + student | Own student | 500MB, video only |
| `/conservatoriums/{cid}/feedback/{studentId}/` | Admin + teacher + student | Teacher | 200MB |
| `/conservatoriums/{cid}/invoices/{invoiceId}/` | Admin + parent + student | Cloud Functions only | N/A |
| `/conservatoriums/{cid}/formSubmissions/{formId}/` | Admin + ministry | Cloud Functions only | N/A |
| `/conservatoriums/{cid}/signatures/{auditRecordId}/` | Admin + site admin + ministry | Approved tenant | 1MB, image only |
| `/conservatoriums/{cid}/teacherPhotos/{teacherId}/` | Tenant members | Own teacher + admin | 10MB, image only |
| `/conservatoriums/{cid}/agreements/{checkoutId}/` | Admin + parent | Cloud Functions only | N/A |
| `/conservatoriums/{cid}/events/{eventId}/` | Public | Admin | 20MB, image only |
| `/conservatoriums/{cid}/branding/` | Public | Admin | 10MB, image only |
| `/users/{userId}/avatar/` | Authenticated | Own user | 5MB, image only |

---

## 4. Firestore Indexes

### 4.1 Indexes from Architecture Doc (10 required)

All 10 composite indexes from `05-data-persistency.md` section 5 are implemented in `firestore.indexes.json`. Since sub-collections under `/conservatoriums/{cid}/` scope by collection group, the `conservatoriumId` prefix field from the architecture doc is not needed in the composite index — it's implicit in the collection path.

| # | Collection | Fields | Query Purpose |
|---|-----------|--------|---------------|
| 1 | `lessonSlots` | `teacherId` ASC, `startTime` ASC | Teacher schedule view |
| 2 | `lessonSlots` | `studentId` ASC, `startTime` ASC | Student schedule view |
| 3 | `lessonSlots` | `startTime` ASC, `status` ASC | Admin master schedule |
| 4 | `lessonSlots` | `roomId` ASC, `startTime` ASC | Room availability check |
| 5 | `lessonSlots` | `teacherId` ASC, `status` ASC, `startTime` ASC | Teacher filtered schedule |
| 6 | `invoices` | `payerId` ASC, `status` ASC, `dueDate` DESC | Family billing view |
| 7 | `invoices` | `status` ASC, `dueDate` ASC | Admin overdue report |
| 8 | `makeupCredits` | `studentId` ASC, `status` ASC | Student credit wallet |
| 9 | `makeupCredits` | `status` ASC, `expiresAt` ASC | Credit expiry cron job |
| 10 | `formSubmissions` | `status` ASC, `currentStep` ASC | Admin approvals queue |

### 4.2 Additional Indexes (7 added)

| # | Collection | Fields | Query Purpose |
|---|-----------|--------|---------------|
| 11 | `practiceLogs` | `studentId` ASC, `date` DESC | Practice history timeline |
| 12 | `teacherExceptions` | `teacherId` ASC, `dateFrom` ASC | Teacher schedule exceptions |
| 13 | `formSubmissions` | `conservatoriumId` ASC, `status` ASC, `submissionDate` DESC | Admin form queue (cross-type) |
| 14 | `scholarshipApplications` | `status` ASC, `submittedAt` DESC | Admin scholarship review |
| 15 | `notifications` | `userId` ASC, `read` ASC, `timestamp` DESC | Unread notifications feed |
| 16 | `waitlistEntries` | `teacherId` ASC, `status` ASC, `joinedAt` ASC | Teacher waitlist management |
| 17 | `instrumentCheckouts` | `status` ASC, `expectedReturnDate` ASC | Overdue checkout alerts |

---

## 5. Type Model Gaps

See `DBA-type-changes.md` for full details. Summary:

| Interface | Gap | Impact |
|-----------|-----|--------|
| `Package` | Missing `conservatoriumId` | Cannot enforce tenant isolation |
| `Package` | Missing `installments` | Cannot model Cardcom payment plans |
| `Invoice` | Missing `subtotal`, `discounts`, `vatRate`, `vatAmount` | Cannot comply with Israeli billing law (17% VAT) |
| `Invoice` | Missing `paidAmount`, `paymentMethod`, `installments` | Cannot track partial payments |
| `Invoice` | Missing `pdfUrl` | Cannot link to generated invoice PDFs |

---

## 6. Postgres Schema Validation

### 6.1 Schema Comparison

The `PostgresAdapter` (1749 lines) has a simpler schema than the Firestore target:

| Aspect | Postgres Schema | Firestore Target | Gap |
|--------|----------------|------------------|-----|
| User name | `first_name` + `last_name` (split) | `name` (single field) | Adapter maps at read time |
| User role | `STUDENT_OVER_13`, `STUDENT_UNDER_13` | `student` (unified) | `mapRole()` handles this |
| Lesson status | Simple `completed/cancelled/scheduled` | 8 specific statuses | `mapLessonStatus()` lossy |
| Invoice fields | Basic: `invoice_number`, `payer_id`, `line_items`, `total`, `status`, `due_date`, `paid_at` | Needs: `subtotal`, `discounts`, `vatRate`, `vatAmount`, `paidAmount`, `paymentMethod`, `installments`, `pdfUrl` | **Major gap** |
| Package fields | Not visible in raw types | Needs: `conservatoriumId`, `installments` | **Gap** |
| Makeup Credits | Not in Postgres schema | Full lifecycle collection in Firestore | **Missing table** |
| Practice Logs | Not in Postgres raw types | Full collection in Firestore | **Missing table** |
| Compliance/PDPPA | Not in Postgres schema | Multiple collections | Expected — PDPPA is Firestore-only |

### 6.2 Postgres-Specific Issues

1. **`runPsqlJson()` uses `spawnSync`** — This blocks the Node.js event loop. For production, should use `pg` client library or connection pool. However, this is a dev-only backend and not the production target.

2. **Role mapping is lossy** — Postgres has `STUDENT_OVER_13` and `STUDENT_UNDER_13` but the adapter maps both to `student`. The distinction is important for under-13 data protection but is handled at the application level via `parentId` presence.

3. **Invoice schema in Postgres is minimal** — The `RawInvoice` type has only `id`, `conservatorium_id`, `invoice_number`, `payer_id`, `line_items`, `total`, `status`, `due_date`, `paid_at`. Missing VAT and payment tracking fields.

### 6.3 Recommendation

The Postgres backend is suitable for local development and demo purposes. It does not need to match the Firestore schema exactly, since Firestore is the production target. However, if Postgres continues to be used for testing, the following SQL migrations should be created:

- `ALTER TABLE invoices ADD COLUMN subtotal NUMERIC, ADD COLUMN vat_rate NUMERIC DEFAULT 0.17, ADD COLUMN vat_amount NUMERIC, ADD COLUMN paid_amount NUMERIC DEFAULT 0, ADD COLUMN payment_method TEXT, ADD COLUMN installments JSONB, ADD COLUMN pdf_url TEXT;`
- `ALTER TABLE packages ADD COLUMN conservatorium_id TEXT REFERENCES conservatoriums(id), ADD COLUMN installments JSONB;`
- `CREATE TABLE makeup_credits (...)` if Postgres parity is desired
- `CREATE TABLE practice_logs (...)` if Postgres parity is desired

---

## 7. Critical Deployment Notes

### 7.1 Deployment Order

1. **Firebase project setup** (Infra team) — project must be in `europe-west1` or `me-central1` for PDPPA data residency
2. **Deploy Firestore indexes** — `firebase deploy --only firestore:indexes` (indexes take time to build)
3. **Deploy Firestore Security Rules** — `firebase deploy --only firestore:rules`
4. **Deploy Storage Security Rules** — `firebase deploy --only storage`
5. **Deploy `onUserApproved` Cloud Function** — Sets Custom Claims (Security Rules depend on this)
6. **Implement FirebaseAdapter** — Replace stub with real Firestore SDK calls
7. **Test with Firebase Emulator Suite** — Verify all rules with unit tests

### 7.2 Firebase Emulator Testing

All Security Rules should be tested with the Firebase Emulator Suite before production deployment:

```bash
firebase emulators:start --only firestore,storage
# Run rule unit tests against emulator
npx jest --config jest.rules.config.js
```

### 7.3 Known Limitations

- **Collection group queries** — The indexes assume sub-collection queries within a conservatorium scope. If cross-conservatorium queries are needed (e.g., site admin dashboard), collection group queries with the `conservatoriumId` field filter will be required.
- **parentOf collection** — This denormalized collection must be kept in sync with `User.parentId`/`User.childIds` by a Cloud Function trigger on user document changes.
- **Rate limiting** — Firestore Security Rules do not support rate limiting. Firebase App Check + Cloud Function rate limiting is needed for abuse prevention.

---

## 8. Dependencies on Other Teams

| Team | Dependency | Priority |
|------|-----------|----------|
| **Security** | Deploy Custom Claims Cloud Function (`role`, `conservatoriumId`, `approved`) | **Blocking** |
| **Backend** | Apply type changes to `Package` and `Invoice` (see DBA-type-changes.md) | **Blocking** |
| **Backend** | Implement `FirebaseAdapter` with real Firestore SDK calls | **Blocking** |
| **Backend** | Create `parentOf` sync Cloud Function trigger | High |
| **Infra** | Firebase project in EU/ME region; deploy rules + indexes | **Blocking** |
| **Infra** | Set up Firebase Emulator Suite for rule testing | High |
