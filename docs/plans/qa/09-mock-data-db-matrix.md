# QA Plan 09: Mock Data & DB Backend Matrix

**Domain:** Mock data inventory, gaps, additional data spec, DB backend matrix, seed.sql alignment, translation completeness, factory function recommendations.

**Date:** 2026-03-14
**Source files reviewed:**
- `src/lib/data.ts` (1,665 lines, 500KB+ — Babel deoptimisation warning is non-fatal)
- `src/lib/types.ts` (2,061 lines)
- `scripts/db/seed.sql` (2,684 lines)
- `tests/lib/db/memory-adapter.test.ts` (611 lines)
- `tests/lib/db/firebase-adapter.test.ts` (260 lines, emulator-gated)
- `src/messages/{he,en,ar,ru}/*.json` (10 files × 4 locales = 40 files)

---

## 1. Current Mock Data Inventory

### Entity Type Counts (memory adapter / `initialMockData`)

| Entity | Export name | Count | Notes |
|--------|-------------|-------|-------|
| Conservatorium | `conservatoriums` | 85 | Derived from `docs/data/constadmin.json` |
| User (all roles) | `mockUsers` | ~500+ | Includes deduplicated set below |
| — `devUser` | | 1 | site_admin, id: `dev-user` |
| — `siteAdminUser` | | 1 | site_admin |
| — `ministryDirectorUser` | | 1 | ministry_director |
| — `teacherUser` / `teacher-user-1` | | 1 | premium, cons-15 |
| — `teacherUser2` / `teacher-user-2` | | 1 | premium, cons-15 |
| — `teacherUser3` | | 1 | cons-12 |
| — `pendingTeacher` | | 1 | unapproved, cons-15 |
| — `studentUser` / `student-user-1` | | 1 | cons-15 |
| — `studentUser2` / `student-user-2` | | 1 | cons-15 |
| — `otherStudent` / `other-student-1` | | 1 | cons-12 |
| — `additionalStudents` (student-user-3..8) | | 6 | cons-15 (3..5) and cons-66 (6..8) |
| — `parentUser` / `parent-user-1` | | 1 | cons-15 |
| — `additionalParents` (parent-user-2..5) | | 4 | cons-15 (2..3) + cons-66 (4..5) |
| — `conservatoriumAdminUsers` | | varies | One admin per conservatorium |
| — `directoryTeacherUsers` | | 484 total (dir-teacher-001..484) | cons-15 (1..18), cons-66 (19..68), ICM cons-82 (69..71), cons-2/7/9..18 (208..484) |
| LessonSlot | `mockLessons` | 13 | lesson-1..13; 3 COMPLETED, rest SCHEDULED |
| FormSubmission | `mockFormSubmissions` | 8 | IDs form-101..108; all statuses represented |
| ConservatoriumInstrument | `mockConservatoriumInstruments` | 8 | Only for cons-15 |
| LessonPackage | `mockLessonPackages` | 7 | Only for cons-15 |
| Package | `mockPackages` | 0 | Empty array |
| Invoice | `mockInvoices` | 0 | Empty array |
| PracticeLog | `mockPracticeLogs` | 0 | Empty array |
| AssignedRepertoire | `mockAssignedRepertoire` | 0 | Empty array |
| LessonNote | `mockLessonNotes` | 0 | Empty array |
| MessageThread | `mockMessageThreads` | 0 | Empty array |
| ProgressReport | `mockProgressReports` | 0 | Empty array |
| Announcement | `mockAnnouncements` | 0 | Empty array |
| FormTemplate | `mockFormTemplates` | 0 | Empty array |
| AuditLogEntry | `mockAuditLog` | 0 | Empty array |
| EventProduction | `mockEvents` | 1 | event-1, cons-15, OPEN_REGISTRATION |
| InstrumentInventory | `mockInstrumentInventory` | 2 | Violin + Clarinet, cons-15 |
| PerformanceBooking | `mockPerformanceBookings` | 0 | Empty array |
| ScholarshipApplication | `mockScholarshipApplications` | 2 | SUBMITTED + APPROVED, cons-15 |
| DonationCause | `mockDonationCauses` | 4 | All for cons-15, all 4 locales populated |
| DonationRecord | `mockDonations` | 0 | Empty array |
| InstrumentRental | `mockInstrumentRentals` | 0 | Empty array |
| OpenDayEvent | `mockOpenDayEvents` | 1 | cons-15 |
| OpenDayAppointment | `mockOpenDayAppointments` | 1 | status: SCHEDULED |
| WaitlistEntry | `mockWaitlist` | 0 | Empty array |
| PracticeVideo | `mockPracticeVideos` | 0 | Empty (typed `any[]`) |
| PayrollSummary | `mockPayrolls` | 0 | Empty array |
| MakeupCredit | `mockMakeupCredits` | 0 | Empty (typed `any[]`) |
| Alumnus | `mockAlumni` | 3 | alumni-1..3, cons-15 |
| Masterclass | `mockMasterclasses` | 2 | mc-1 (published) + mc-2 (draft), cons-15 |
| Composition | `compositions` / `mockRepertoire` | 5,217 | From `data.json`, AI translations partial |
| Branch | `mockBranches` | 3 | 2 for cons-15, 1 for cons-12 |
| Room | `mockRooms` | 5 | Spread across branches |

---

## 2. Gaps: Entities Missing or Insufficient for Full Feature Coverage

### 2.1 Empty Arrays (Zero Records) — Critical Gaps

These arrays are declared but empty, meaning every feature that reads them returns an empty list or fails to demonstrate real behavior:

| Entity | Impact |
|--------|--------|
| `mockPackages` (`Package[]`) | Book-lesson wizard cannot show an active package; package guard tests always fail |
| `mockInvoices` (`Invoice[]`) | Billing/invoices page always shows empty; no paid/overdue/pending states testable |
| `mockPracticeLogs` (`PracticeLog[]`) | Practice tracking page always empty; gamification streaks untestable |
| `mockAssignedRepertoire` (`AssignedRepertoire[]`) | Student repertoire page always empty; no LEARNING/POLISHING/COMPLETED states |
| `mockLessonNotes` (`LessonNote[]`) | Teacher note-taking flow untestable; student feedback view always empty |
| `mockMessageThreads` (`MessageThread[]`) | Messaging feature always shows empty inbox |
| `mockProgressReports` (`ProgressReport[]`) | Progress report page always empty |
| `mockAnnouncements` (`Announcement[]`) | Announcements page always empty; no target-audience filtering testable |
| `mockFormTemplates` (`FormTemplate[]`) | Dynamic form builder has no templates to load |
| `mockAuditLog` (`AuditLogEntry[]`) | Notification delivery audit untestable |
| `mockDonations` (`DonationRecord[]`) | Donation flow end-state (paid) untestable |
| `mockInstrumentRentals` (`InstrumentRental[]`) | Rental management page always empty |
| `mockWaitlist` (`WaitlistEntry[]`) | Waitlist feature untestable |
| `mockPayrolls` (`PayrollSummary[]`) | Payroll export / teacher compensation view always empty |
| `mockMakeupCredits` (`MakeupCredit[] as any[]`) | Makeup booking flow untestable |
| `mockPerformanceBookings` (`PerformanceBooking[]`) | Performance booking feature untestable |

### 2.2 Single-Record Entities — Insufficient for State Coverage

| Entity | Gap |
|--------|-----|
| `mockEvents` (1 event) | Can't test all `EventProductionStatus` values (PLANNING, OPEN_REGISTRATION, CLOSED, COMPLETED), all event types (RECITAL, CONCERT, EXAM_PERFORMANCE, OPEN_DAY), ticket-tier logic |
| `mockOpenDayEvents` (1 event) | Only SCHEDULED appointment; no ATTENDED or NO_SHOW |
| `mockInstrumentInventory` (2 items) | Missing all `InstrumentCondition` states, missing CHECKED_OUT/IN_REPAIR/RETIRED status items |
| `mockAlumni` (3 alumni) | alumni-3 has `isPublic: false` but alumni-1 and -2 share the same `conservatoriumId`; cross-conservatorium alumni untestable |
| `mockScholarshipApplications` (2 apps) | Missing UNDER_REVIEW, REJECTED, DOCUMENTS_PENDING, WAITLISTED states |

### 2.3 Conservatorium Coverage Gaps

- `mockConservatoriumInstruments` — only 8 instruments, only for **cons-15**. cons-66 and all other conservatoriums have no instruments, blocking enrollment wizard for non-cons-15.
- `mockLessonPackages` — only for **cons-15**. Book wizard for cons-66 students has no packages.
- Rooms — only 5 rooms across cons-15 branches; cons-66 has no rooms at all.
- Branches — cons-66 has no branches.

### 2.4 Lesson Coverage Gaps

- No lesson with `type: 'MAKEUP'`, `'TRIAL'`, `'ADHOC'`, or `'GROUP'`
- No lesson with `isVirtual: true` (lesson-3 is virtual but belongs to cons-12 `other-student-1`)
- No lesson with `status: 'CANCELLED_STUDENT_NOTICED'`, `'CANCELLED_TEACHER'`, `'NO_SHOW_STUDENT'`, `'NO_SHOW_TEACHER'`
- No recurring recurrence chain (`recurrenceId` shared across multiple lessons)
- No lesson with `packageId` populated

### 2.5 User Coverage Gaps

- No user with `accountType: 'PLAYING_SCHOOL'` having `playingSchoolInfo` populated
- No user with `accountType: 'TRIAL'`
- No user with `isDelegatedAdmin: true` + `delegatedAdminPermissions`
- No user with `role: 'school_coordinator'`
- No user with `status: 'graduated'` or `status: 'inactive'`
- No user with `oauthProviders` populated (OAuth login flow untestable)
- No user with `paymentMethods` populated (payment method management untestable)
- No user with `notificationPreferences` populated
- No user with `achievements` populated (gamification untestable)
- No user with `weeklyPracticeGoal` set
- No user with `packageId` referencing an active Package record
- Missing `conservatoriumAdminUsers` for multi-conservatorium admin isolation tests (admin data model creates one per conservatorium but they all use the same sparse shape)

### 2.6 Form Submission Gaps

- No `FormSubmission` with `formType: 'ENROLLMENT'` (only recital/event types)
- No form in `PENDING_TEACHER` status
- No form with `requiresMinistryApproval: true`

---

## 3. Additional Mock Data Spec

### 3.1 Active Package Records (Priority: Critical)

```typescript
// mockPackages — needed for book wizard, billing, package guard
{
  id: 'pkg-active-1',
  conservatoriumId: 'cons-15',
  studentId: 'student-user-1',
  type: 'PACK_10',
  title: 'Pack of 10 Lessons',
  description: '10 lesson credits, valid through 2026-08-31',
  totalCredits: 10,
  usedCredits: 3,
  price: 1200,
  paymentStatus: 'PAID',
  validFrom: '2026-01-01',
  validUntil: '2026-08-31',
  createdAt: '2026-01-01T00:00:00.000Z',
}
// Also: PACK_5 for student-user-2; PACK_5_PREMIUM for student-user-3; TRIAL for student-user-5
// Also: expired package for student-user-4 (validUntil in the past)
```

### 3.2 Invoices (Priority: Critical)

Need at least one per status: DRAFT, SENT, PAID, OVERDUE, CANCELLED.

```typescript
// 4-locale display strings needed:
// description: { he: 'חבילת שיעורים', en: 'Lesson Package', ar: 'حزمة دروس', ru: 'Пакет уроков' }
{
  id: 'inv-1',
  invoiceNumber: 'INV-2026-001',
  conservatoriumId: 'cons-15',
  payerId: 'parent-user-1',
  lineItems: [{ description: 'Lesson Package (10 × 45min)', total: 1200 }],
  subtotal: 1200,
  vatRate: 0.17,
  vatAmount: 204,
  total: 1404,
  status: 'PAID',
  dueDate: '2026-02-01',
  paidAt: '2026-01-28',
  paymentMethod: 'CREDIT_CARD',
}
// inv-2: status SENT (parent-user-2)
// inv-3: status OVERDUE (parent-user-3, dueDate in the past)
// inv-4: status DRAFT (admin-created)
```

### 3.3 Practice Logs (Priority: High)

```typescript
// 4 logs across 3 students to test streak/gamification
[
  { id: 'plog-1', studentId: 'student-user-1', conservatoriumId: 'cons-15', date: '2026-03-13', durationMinutes: 45, mood: 'GREAT', pieces: [{ title: 'Nocturne Op.9 No.2', composerId: 'chopin' }] },
  { id: 'plog-2', studentId: 'student-user-1', conservatoriumId: 'cons-15', date: '2026-03-12', durationMinutes: 30, mood: 'OKAY' },
  { id: 'plog-3', studentId: 'student-user-1', conservatoriumId: 'cons-15', date: '2026-03-11', durationMinutes: 60, mood: 'HARD' },
  { id: 'plog-4', studentId: 'student-user-2', conservatoriumId: 'cons-15', date: '2026-03-13', durationMinutes: 30, mood: 'GREAT' },
]
```

### 3.4 Assigned Repertoire (Priority: High)

```typescript
// Cover all RepertoireStatus values
[
  { id: 'rep-1', studentId: 'student-user-1', compositionId: 'comp-db-0', status: 'LEARNING', assignedAt: '2026-01-10T00:00:00.000Z' },
  { id: 'rep-2', studentId: 'student-user-1', compositionId: 'comp-db-1', status: 'POLISHING', assignedAt: '2025-09-01T00:00:00.000Z' },
  { id: 'rep-3', studentId: 'student-user-1', compositionId: 'comp-db-2', status: 'PERFORMANCE_READY', assignedAt: '2025-06-01T00:00:00.000Z' },
  { id: 'rep-4', studentId: 'student-user-2', compositionId: 'comp-db-3', status: 'COMPLETED', assignedAt: '2025-03-01T00:00:00.000Z', completedAt: '2025-12-15T00:00:00.000Z' },
]
```

### 3.5 Lesson Notes (Priority: High)

```typescript
// One public, one with private studioNote, one with technicalFlags
[
  {
    id: 'note-1', slotId: 'lesson-11', lessonSlotId: 'lesson-11',
    teacherId: 'teacher-user-1', studentId: 'student-user-1',
    lessonDate: '2026-02-25T16:00:00.000Z',
    lessonSummary: 'Worked on Chopin Nocturne Op.9 phrasing and pedaling.',
    summary: 'Worked on Chopin Nocturne Op.9 phrasing and pedaling.',
    homeworkAssignment: { description: 'Practice mm. 1-16 slowly', pieces: ['Nocturne Op.9'], specificFocusAreas: ['pedaling'] },
    isSharedWithStudent: true, isSharedWithParent: true,
    createdAt: '2026-02-25T17:00:00.000Z',
  },
  {
    id: 'note-2', slotId: 'lesson-12', lessonSlotId: 'lesson-12',
    teacherId: 'teacher-user-1', studentId: 'student-user-2',
    lessonDate: '2026-02-26T17:00:00.000Z',
    lessonSummary: 'Worked on Mozart Sonata K.545 first movement.',
    summary: 'Worked on Mozart Sonata K.545 first movement.',
    studioNote: 'Struggling with left-hand independence. May need targeted exercises next week.',
    technicalFlags: [{ flag: 'TECHNIQUE', detail: 'Left-hand independence below standard' }],
    teacherMood: 'PRODUCTIVE',
    isSharedWithStudent: false, isSharedWithParent: false,
    createdAt: '2026-02-26T18:30:00.000Z',
  },
]
```

### 3.6 Announcements (Priority: Medium)

```typescript
// All 4 target audiences
[
  { id: 'ann-1', conservatoriumId: 'cons-15', title: 'Summer Concert Registration Open', body: 'Register by April 30 for the summer concert.', targetAudience: 'ALL', channels: ['IN_APP'], sentAt: '2026-03-01T09:00:00.000Z' },
  { id: 'ann-2', conservatoriumId: 'cons-15', title: 'Teacher Meeting — March 20', body: 'Staff meeting at 17:00 in the main hall.', targetAudience: 'TEACHERS', channels: ['IN_APP', 'EMAIL'], sentAt: '2026-03-05T08:00:00.000Z' },
  { id: 'ann-3', conservatoriumId: 'cons-15', title: 'Term Invoice Due', body: 'Invoices for term 2 are now due.', targetAudience: 'PARENTS', channels: ['EMAIL'], sentAt: '2026-03-07T10:00:00.000Z' },
  { id: 'ann-4', conservatoriumId: 'cons-15', title: 'Practice Challenge', body: 'Log 30 consecutive days of practice.', targetAudience: 'STUDENTS', channels: ['IN_APP'], sentAt: '2026-03-10T12:00:00.000Z' },
]
```

### 3.7 Makeup Credits (Priority: High)

```typescript
// 3 credits: AVAILABLE, REDEEMED, EXPIRED
[
  {
    id: 'mc-credit-1', conservatoriumId: 'cons-15', studentId: 'student-user-1',
    issuedBySlotId: 'lesson-11', issuedReason: 'TEACHER_CANCELLATION',
    issuedAt: '2026-02-20T09:00:00.000Z', expiresAt: '2026-04-20T09:00:00.000Z',
    status: 'AVAILABLE', amount: 100,
  },
  {
    id: 'mc-credit-2', conservatoriumId: 'cons-15', studentId: 'student-user-2',
    issuedBySlotId: 'lesson-12', issuedReason: 'STUDENT_NOTICED_CANCEL',
    issuedAt: '2026-02-18T09:00:00.000Z', expiresAt: '2026-04-18T09:00:00.000Z',
    status: 'REDEEMED', redeemedBySlotId: 'lesson-6', redeemedAt: '2026-03-09T12:00:00.000Z', amount: 110,
  },
  {
    id: 'mc-credit-3', conservatoriumId: 'cons-15', studentId: 'student-user-1',
    issuedBySlotId: 'lesson-11', issuedReason: 'CONSERVATORIUM_CANCELLATION',
    issuedAt: '2025-12-01T09:00:00.000Z', expiresAt: '2026-01-31T09:00:00.000Z',
    status: 'EXPIRED', amount: 100,
  },
]
```

### 3.8 Missing Lesson Types (Priority: High)

```typescript
// Add to mockLessons
[
  // Makeup lesson
  { id: 'lesson-14', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-1',
    instrument: 'פסנתר', startTime: '2026-03-20T14:00:00.000Z', durationMinutes: 45,
    type: 'MAKEUP', bookingSource: 'AUTO_MAKEUP', makeupCreditId: 'mc-credit-1',
    isVirtual: false, status: 'SCHEDULED', isCreditConsumed: false,
    createdAt: '2026-03-09T10:00:00.000Z', updatedAt: '2026-03-09T10:00:00.000Z' },
  // Trial lesson
  { id: 'lesson-15', conservatoriumId: 'cons-15', teacherId: 'teacher-user-2', studentId: 'student-user-5',
    instrument: 'חליל צד', startTime: '2026-03-18T16:00:00.000Z', durationMinutes: 45,
    type: 'TRIAL', bookingSource: 'STUDENT_SELF',
    isVirtual: false, status: 'SCHEDULED', isCreditConsumed: false,
    createdAt: '2026-03-10T10:00:00.000Z', updatedAt: '2026-03-10T10:00:00.000Z' },
  // Cancelled lesson
  { id: 'lesson-16', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-1',
    instrument: 'פסנתר', startTime: '2026-03-07T16:00:00.000Z', durationMinutes: 45,
    type: 'RECURRING', bookingSource: 'STUDENT_SELF',
    isVirtual: false, status: 'CANCELLED_TEACHER',
    cancelledAt: '2026-03-06T09:00:00.000Z', cancelledBy: 'teacher-user-1',
    cancellationReason: 'Teacher illness', isCreditConsumed: false,
    createdAt: '2026-03-01T00:00:00.000Z', updatedAt: '2026-03-06T09:00:00.000Z' },
]
```

### 3.9 Playing School Student (Priority: Medium)

```typescript
// Additional student with accountType PLAYING_SCHOOL + playingSchoolInfo
{
  id: 'ps-student-1',
  name: 'אורי שמואל',
  email: 'ps.student@example.com',
  role: 'student',
  accountType: 'PLAYING_SCHOOL',
  conservatoriumId: 'cons-15',
  conservatoriumName: 'הוד השרון',
  approved: true,
  playingSchoolInfo: {
    schoolName: 'תיכון הדרים, הוד השרון',
    schoolSymbol: '44570001',
    instrument: 'חליל',
    instrumentReceived: true,
    receivedAt: '2025-09-15',
    programType: 'GROUP',
    municipalSubsidyPercent: 30,
    ministrySubsidyPercent: 20,
    parentYearlyContribution: 1200,
    teacherName: 'מרים כהן',
  },
  notifications: [], achievements: [], createdAt: '2025-09-01T00:00:00.000Z',
}
```

### 3.10 Additional Events (Priority: Medium)

```typescript
// Cover all event statuses and types
[
  { id: 'event-2', conservatoriumId: 'cons-15', name: 'חזרה כללית — מבחני בגרות', type: 'EXAM_PERFORMANCE', venue: 'אולם הרצאות', eventDate: '2026-05-20', startTime: '15:00', status: 'PLANNING', program: [] },
  { id: 'event-3', conservatoriumId: 'cons-66', name: 'יום הכנה לאודישנים', type: 'CONCERT', venue: 'אולם ראשי', eventDate: '2026-04-10', startTime: '19:00', status: 'CLOSED', program: [], title: { he: 'יום הכנה לאודישנים', en: 'Audition Prep Day', ar: 'يوم التحضير للأوديشن', ru: 'День подготовки к прослушиванию' } },
  { id: 'event-4', conservatoriumId: 'cons-15', name: 'גמר עונת 2025', type: 'RECITAL', venue: 'אולם הגדול', eventDate: '2025-06-20', startTime: '18:00', status: 'COMPLETED', program: [], isPublic: true, isFree: false, ticketPrice: 50 },
]
```

### 3.11 Instrument Rentals (Priority: Medium)

```typescript
// Cover RentalStatus values
[
  { id: 'rental-1', conservatoriumId: 'cons-15', instrumentId: 'inst-1', studentId: 'student-user-4', parentId: 'parent-user-2',
    rentalModel: 'monthly', depositAmountILS: 1200, monthlyFeeILS: 180,
    startDate: '2025-09-01', expectedReturnDate: '2026-06-30',
    status: 'active', signingToken: 'tok-rental-1', parentSignedAt: '2025-08-28T00:00:00.000Z',
    condition: 'good' },
  { id: 'rental-2', conservatoriumId: 'cons-15', instrumentId: 'inst-2', studentId: 'student-user-5', parentId: 'parent-user-3',
    rentalModel: 'deposit', depositAmountILS: 1500,
    startDate: '2025-09-10', status: 'pending_signature', signingToken: 'tok-rental-2',
    condition: 'excellent' },
]
```

### 3.12 Conservatorium Instruments for cons-66 (Priority: High)

```typescript
// cons-66 needs instruments for enrollment wizard to work
[
  { id: 'piano-66', conservatoriumId: 'cons-66', names: { he: 'פסנתר', en: 'Piano', ru: 'Фортепиано', ar: 'بيانو' }, isActive: true, teacherCount: 3, availableForRegistration: true, availableForRental: true },
  { id: 'violin-66', conservatoriumId: 'cons-66', names: { he: 'כינור', en: 'Violin', ru: 'Скрипка', ar: 'كمان' }, isActive: true, teacherCount: 2, availableForRegistration: true, availableForRental: false },
  { id: 'clarinet-66', conservatoriumId: 'cons-66', names: { he: 'קלרינט', en: 'Clarinet', ru: 'Кларнет', ar: 'كلارينيت' }, isActive: true, teacherCount: 2, availableForRegistration: true, availableForRental: false },
]
```

### 3.13 Message Threads (Priority: Medium)

```typescript
[
  {
    id: 'thread-1',
    participants: ['teacher-user-1', 'parent-user-1'],
    lessonSlotId: 'lesson-11',
    messages: [
      { senderId: 'teacher-user-1', body: 'Ariel made great progress on Chopin this week!', sentAt: '2026-02-25T17:30:00.000Z' },
      { senderId: 'parent-user-1', body: 'Thank you! He has been practicing every day.', sentAt: '2026-02-25T18:00:00.000Z', readAt: '2026-02-25T18:05:00.000Z' },
    ],
  },
]
```

### 3.14 Payroll Summaries (Priority: Medium)

```typescript
[
  {
    id: 'payroll-1', teacherId: 'teacher-user-1', teacherName: 'מרים כהן',
    conservatoriumId: 'cons-15', periodStart: '2026-03-01', periodEnd: '2026-03-31',
    totalHours: 8.5, grossPay: 3200, totalAmount: 3200,
    status: 'DRAFT',
    completedLessons: [
      { slotId: 'lesson-11', studentId: 'student-user-1', studentName: 'אריאל לוי', durationMinutes: 45, rate: 100, subtotal: 100, completedAt: '2026-02-25T16:45:00.000Z' },
      { slotId: 'lesson-12', studentId: 'student-user-2', studentName: 'תמר ישראלי', durationMinutes: 60, rate: 120, subtotal: 120, completedAt: '2026-02-26T18:00:00.000Z' },
    ],
  },
]
```

---

## 4. DB Backend Matrix

Legend:
- **[MEMORY-ONLY]** — Only testable with the in-memory adapter
- **[POSTGRES-ONLY]** — Only testable with Postgres (seed.sql required)
- **[BOTH]** — Works with both adapters; should be the default for most tests

| Feature / Test Area | Adapter Tag | Notes |
|---------------------|-------------|-------|
| User CRUD (list, findById, findByEmail, create, update, delete) | [BOTH] | Memory adapter tests already cover this |
| Conservatorium CRUD | [BOTH] | 85 conservatoriums seeded in both |
| Lesson CRUD (create, update status, findByConservatorium) | [BOTH] | Both have lesson seed data |
| Forms/approvals (create, findPending, update status) | [BOTH] | Both have form_submissions table |
| Payments (invoices) CRUD | [BOTH] | Memory has `mockInvoices`, Postgres has payments table |
| Announcements CRUD | [BOTH] | Both support announcements |
| ConservatoriumInstruments CRUD | [BOTH] | 8 seeded for cons-15 in memory; Postgres has `conservatorium_instruments` |
| Notifications (create, findByUser, markRead) | [BOTH] | |
| Rooms CRUD | [BOTH] | 5 rooms in memory; Postgres schema has rooms table |
| Alumni CRUD | [BOTH] | 3 alumni in memory |
| Repertoire (compositions) CRUD | [BOTH] | 5,217 compositions in both |
| Donation causes CRUD | [BOTH] | 4 causes in memory |
| Practice logs CRUD | [BOTH] | Empty seed; create-and-read is sufficient |
| Makeup credits CRUD | [MEMORY-ONLY] | Postgres seed.sql has no makeup_credits inserts yet |
| Payroll summaries | [MEMORY-ONLY] | Postgres seed.sql has `payroll_snapshots` table in TRUNCATE but no inserts |
| Master classes CRUD | [MEMORY-ONLY] | Postgres seed.sql has `master_classes` in TRUNCATE but no inserts |
| Waitlist CRUD | [MEMORY-ONLY] | No waitlist table inserts in seed.sql |
| Instrument rentals | [MEMORY-ONLY] | `instrument_rentals` in TRUNCATE but no seed inserts |
| Scholarship applications | [MEMORY-ONLY] | `scholarship_applications` in TRUNCATE but no seed inserts |
| Teacher profiles (bio, specialties, availability) | [BOTH] | seed.sql has `teacher_profiles`; memory has `directoryTeacherUsers` |
| Student profiles (birth_date, grade) | [BOTH] | seed.sql has `student_profiles` inserts |
| Firebase Auth (sign-in, token verify, dev bypass) | [MEMORY-ONLY] | Firebase adapter requires `FIREBASE_EMULATOR=true` |
| Google Calendar sync (`googleCalendarEventId`) | [MEMORY-ONLY] | Purely mock field |
| Playing School wizard (enrollment steps) | [MEMORY-ONLY] | PS user has no Postgres representation yet |
| Ministry form approval workflow | [BOTH] | Both adapters support form status transitions |
| Multi-locale conservatorium profile (translations) | [MEMORY-ONLY] | Postgres cons table lacks `translations` JSONB column |
| Open Day events + appointments | [MEMORY-ONLY] | No open_day seed inserts in seed.sql |
| Performance bookings | [MEMORY-ONLY] | No seed data in either; memory has empty array |
| Donation records | [MEMORY-ONLY] | No seed data in either |

---

## 5. seed.sql Alignment

### 5.1 In data.ts but NOT in seed.sql

| Entity | Explanation |
|--------|-------------|
| `mockPackages` (`Package[]`) | No `packages` table insert in seed.sql |
| `mockInvoices` | No invoice inserts (placeholder comment exists) |
| `mockPracticeLogs` | No table insert |
| `mockAssignedRepertoire` | No assigned_repertoire table insert |
| `mockLessonNotes` | No lesson_notes table insert |
| `mockMessageThreads` | No message_threads table insert |
| `mockProgressReports` | No progress_reports table insert |
| `mockAnnouncements` | No announcements table insert |
| `mockFormTemplates` | No form_templates table insert |
| `mockOpenDayEvents` / `mockOpenDayAppointments` | No open_day table inserts |
| `mockAlumni` | `alumni_profiles` table is in TRUNCATE but has no inserts |
| `mockMasterclasses` | `master_classes` table is in TRUNCATE but has no inserts |
| `mockDonationCauses` | `donation_causes` table is in TRUNCATE but has no inserts |
| `mockInstrumentInventory` | No instrument_inventory inserts |
| `mockInstrumentRentals` | `instrument_rentals` in TRUNCATE, no inserts |
| `mockScholarshipApplications` | `scholarship_applications` in TRUNCATE, no inserts |
| `mockWaitlist` | No waitlist table in seed.sql |
| `mockPayrolls` | `payroll_snapshots` in TRUNCATE, no inserts |
| `mockMakeupCredits` | No makeup_credits table in seed.sql |
| `mockEvents` | `events` in TRUNCATE; has one INSERT but column shape may differ |
| `mockBranches` | `branches` in TRUNCATE, no inserts |
| `mockRooms` | `rooms` in TRUNCATE, no inserts |

### 5.2 In seed.sql but NOT in data.ts (Postgres-only entities)

| Entity | Notes |
|--------|-------|
| `instrument_catalog` | Global catalog (22 instruments) — memory uses `mockConservatoriumInstruments` which is per-conservatorium only |
| `tmp_seed_teacher_profiles` | Temporary table used in seed pipeline; not an application entity |
| `teacher_profile_instruments` | Junction table (teacher ↔ conservatorium_instrument); not modeled in types.ts |
| Teacher UUIDs (`c1000000-...-000001` to `...-000484`) | Postgres UUIDs differ from memory adapter IDs (`dir-teacher-001` etc.); cross-adapter ID compatibility tests needed |
| Student UUIDs (`e1000000-...-000001` to `...-000009`) | Same issue — Postgres IDs differ from `student-user-1` etc. |
| Parent UUIDs (`f1000000-...-000001` to `...-000005`) | Same issue |
| Conservatorium UUIDs (`a1000000-...-000015`, `...-000066`) | Must not use `cons-15` / `cons-66` IDs in Postgres tests |

### 5.3 ID Incompatibility: Memory vs Postgres

This is the most significant alignment gap. The memory adapter uses human-readable IDs (`student-user-1`, `teacher-user-1`, `cons-15`). Postgres uses UUID format (`e1000000-0000-0000-0000-000000000001`, `c1000000-0000-0000-0000-000000000001`, `a1000000-0000-0000-0000-000000000015`). Tests targeting Postgres **must** use UUID IDs.

A mapping table should be maintained for QA purposes:

| Memory ID | Postgres UUID |
|-----------|--------------|
| `student-user-1` | `e1000000-0000-0000-0000-000000000001` |
| `student-user-2` | `e1000000-0000-0000-0000-000000000002` |
| `student-user-3..8` | `e1000000-...-000003` to `000008` |
| `other-student-1` | `e1000000-0000-0000-0000-000000000009` |
| `parent-user-1..5` | `f1000000-...-000001` to `000005` |
| `teacher-user-1` (cons-15 dir teacher c1000000-...-000001) | `c1000000-0000-0000-0000-000000000001` |
| `dir-teacher-006` | `c1000000-0000-0000-0000-000000000006` |
| `cons-15` | `a1000000-0000-0000-0000-000000000015` |
| `cons-66` | `a1000000-0000-0000-0000-000000000066` |
| `cons-12` (Givataim) | `a1000000-0000-0000-0000-000000000012` |
| `dev-user` | Not in Postgres seed |
| `site-admin-user-1` | Not in Postgres seed |
| `ministry-director-user-1` | Not in Postgres seed |

---

## 6. Translation Completeness

### 6.1 Message File Coverage (UI Strings)

All 4 locales (`he`, `en`, `ar`, `ru`) have an identical file set:
```
admin.json, alumni.json, billing.json, common.json, enrollment.json,
forms.json, legal.json, OpenDay.json, public.json, settings.json, student.json
```

All 4 locales have all 11 files. No locale is missing a file.

**Known gaps within files:** `ar` and `ru` translations were generally machine-translated and may have literal/inconsistent phrasing for complex legal terms in `legal.json` and `enrollment.json`. No structural key gaps were detected in this audit.

### 6.2 Mock Data Entity Translation Coverage

| Entity type | he | en | ar | ru | Notes |
|-------------|----|----|----|-----|-------|
| `Conservatorium.name` | ✓ | partial | partial | partial | `nameI18n` only populated for enriched cons; most have Hebrew name only |
| `Conservatorium.customRegistrationTerms` | ✓ | ✓ | ✓ | ✓ | 10 cons have all 4 locales |
| `ConservatoriumInstrument.names` | ✓ | ✓ | ✓ | ✓ | 8 instruments, full 4-locale |
| `LessonPackage.names` | ✓ | ✓ | ✓ | ✓ | All 7 packages, full 4-locale |
| `DonationCause.names` + `.descriptions` | ✓ | ✓ | ✓ | ✓ | All 4 causes, full 4-locale |
| `Masterclass.title` + `.description` | ✓ | ✓ | ✓ | ✓ | Both masterclasses |
| `Alumnus.bio` | ✓ | ✓ | ✓ | ✓ | All 3 alumni |
| `Composition.titles` | ✓ | partial | partial | partial | AI translation covers ~5,217 entries; composerNames only 7 canonical composers get all 4 locales; others fall back to Hebrew |
| `EventProduction.title` | missing | missing | missing | missing | `mockEvents[0]` has no `title` i18n object; only Hebrew `name` field |
| `LessonNote` content | Hebrew only | none | none | none | Notes text is Hebrew — untranslated |
| `FormSubmission` content | Hebrew only | none | none | none | All form data Hebrew-only |
| `Announcement` title/body | Hebrew only | none | none | none | No i18n structure on Announcement type |
| `ScholarshipApplication` | Hebrew name/instrument | none | none | none | |
| `MockBranches.name` | Hebrew only | none | none | none | Branch type has no i18n fields |

### 6.3 Translation Gaps Requiring Action

1. **EventProduction.title** — `EventTranslation` type supports `{ he, en, ru?, ar? }` but `mockEvents[0]` omits this; all QA tests for event detail pages will display the Hebrew `name` in all locales.
2. **Composition fallback (non-canonical composers)** — ~5,000+ compositions have titles translated by AI, but `composerNames` for non-canonical composers fall back to the Hebrew original for `ar` and `ru`. This means Arabic/Russian repertoire display shows Hebrew composer names.
3. **Announcement** type lacks i18n fields entirely — this is a type design gap, not just a data gap.

---

## 7. Mock Data Factories: Recommended Reusable Functions

The following factory functions should be added to `tests/factories/` (a new directory) or to `src/lib/db/test-fixtures.ts`:

### 7.1 `makeUser(overrides?)`

```typescript
// tests/factories/user.factory.ts
import type { User } from '@/lib/types';
import { nanoid } from 'nanoid';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: `test-user-${nanoid(6)}`,
    name: 'Test User',
    email: `test-${nanoid(4)}@example.com`,
    role: 'student',
    conservatoriumId: 'cons-15',
    conservatoriumName: 'הוד השרון',
    approved: true,
    notifications: [],
    achievements: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Convenience variants:
export const makeStudent = (o?: Partial<User>) => makeUser({ role: 'student', ...o });
export const makeTeacher = (o?: Partial<User>) => makeUser({ role: 'teacher', availableForNewStudents: true, ...o });
export const makeParent = (o?: Partial<User>) => makeUser({ role: 'parent', ...o });
export const makeAdmin = (o?: Partial<User>) => makeUser({ role: 'conservatorium_admin', ...o });
export const makeSiteAdmin = (o?: Partial<User>) => makeUser({ role: 'site_admin', conservatoriumId: 'global', ...o });
export const makeMinistryDirector = (o?: Partial<User>) => makeUser({ role: 'ministry_director', conservatoriumId: 'ministry', ...o });
```

### 7.2 `makeLessonSlot(overrides?)`

```typescript
// tests/factories/lesson.factory.ts
import type { LessonSlot } from '@/lib/types';
import { nanoid } from 'nanoid';

export function makeLessonSlot(overrides: Partial<LessonSlot> = {}): LessonSlot {
  const now = new Date();
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    id: `lesson-${nanoid(6)}`,
    conservatoriumId: 'cons-15',
    teacherId: 'teacher-user-1',
    studentId: 'student-user-1',
    instrument: 'פסנתר',
    startTime: future.toISOString(),
    durationMinutes: 45,
    type: 'RECURRING',
    bookingSource: 'STUDENT_SELF',
    isVirtual: false,
    status: 'SCHEDULED',
    isCreditConsumed: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

export const makeCompletedLesson = (o?: Partial<LessonSlot>) =>
  makeLessonSlot({ status: 'COMPLETED', isCreditConsumed: true, ...o });
export const makeCancelledLesson = (o?: Partial<LessonSlot>) =>
  makeLessonSlot({ status: 'CANCELLED_TEACHER', cancelledAt: new Date().toISOString(), ...o });
export const makeMakeupLesson = (o?: Partial<LessonSlot>) =>
  makeLessonSlot({ type: 'MAKEUP', bookingSource: 'AUTO_MAKEUP', ...o });
```

### 7.3 `makePackage(overrides?)`

```typescript
// tests/factories/package.factory.ts
import type { Package } from '@/lib/types';
import { nanoid } from 'nanoid';

export function makePackage(overrides: Partial<Package> = {}): Package {
  return {
    id: `pkg-${nanoid(6)}`,
    conservatoriumId: 'cons-15',
    type: 'PACK_10',
    title: 'Test Pack of 10',
    description: '10 lesson credits',
    totalCredits: 10,
    usedCredits: 0,
    price: 1200,
    paymentStatus: 'PAID',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export const makeExpiredPackage = (o?: Partial<Package>) =>
  makePackage({ validUntil: '2025-01-01', ...o });
export const makeTrialPackage = (o?: Partial<Package>) =>
  makePackage({ type: 'TRIAL', totalCredits: 1, price: 100, ...o });
```

### 7.4 `makeInvoice(overrides?)`

```typescript
// tests/factories/invoice.factory.ts
import type { Invoice } from '@/lib/types';
import { nanoid } from 'nanoid';

export function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const subtotal = 1200;
  const vatAmount = Math.round(subtotal * 0.17);
  return {
    id: `inv-${nanoid(6)}`,
    invoiceNumber: `INV-${Date.now()}`,
    conservatoriumId: 'cons-15',
    payerId: 'parent-user-1',
    lineItems: [{ description: 'Lesson Package', total: subtotal }],
    subtotal,
    vatRate: 0.17,
    vatAmount,
    total: subtotal + vatAmount,
    status: 'SENT',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
```

### 7.5 `makeFormSubmission(overrides?)`

```typescript
// tests/factories/form.factory.ts
import type { FormSubmission } from '@/lib/types';
import { nanoid } from 'nanoid';

export function makeFormSubmission(overrides: Partial<FormSubmission> = {}): FormSubmission {
  return {
    id: `form-${nanoid(6)}`,
    formType: 'רסיטל בגרות',
    studentId: 'student-user-1',
    studentName: 'אריאל לוי',
    status: 'PENDING_ADMIN',
    submissionDate: new Date().toISOString().split('T')[0],
    totalDuration: '10:00',
    repertoire: [],
    ...overrides,
  };
}
```

### 7.6 `makeMakeupCredit(overrides?)`

```typescript
import type { MakeupCredit } from '@/lib/types';
import { nanoid } from 'nanoid';

export function makeMakeupCredit(overrides: Partial<MakeupCredit> = {}): MakeupCredit {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: `credit-${nanoid(6)}`,
    conservatoriumId: 'cons-15',
    studentId: 'student-user-1',
    issuedBySlotId: 'lesson-11',
    issuedReason: 'TEACHER_CANCELLATION',
    issuedAt,
    expiresAt,
    status: 'AVAILABLE',
    amount: 100,
    ...overrides,
  };
}
```

### 7.7 `seedMemoryDb(overrides?)`

```typescript
// tests/factories/memory-seed.factory.ts
// Extends buildDefaultMemorySeed() with populated arrays for full-coverage testing
import { buildDefaultMemorySeed } from '@/lib/db/default-memory-seed';
import { makePackage, makeInvoice, makeLessonSlot, makeMakeupCredit } from './';

export function buildFullCoverageSeed() {
  const seed = buildDefaultMemorySeed();
  return {
    ...seed,
    packages: [
      makePackage({ id: 'pkg-active-1', studentId: 'student-user-1', type: 'PACK_10', usedCredits: 3 }),
      makePackage({ id: 'pkg-active-2', studentId: 'student-user-2', type: 'PACK_5' }),
      makeExpiredPackage({ id: 'pkg-expired-1', studentId: 'student-user-4' }),
    ],
    invoices: [
      makeInvoice({ id: 'inv-1', status: 'PAID', paidAt: '2026-01-28' }),
      makeInvoice({ id: 'inv-2', status: 'SENT' }),
      makeInvoice({ id: 'inv-3', status: 'OVERDUE', dueDate: '2026-01-01' }),
    ],
    makeupCredits: [
      makeMakeupCredit({ id: 'mc-credit-1', status: 'AVAILABLE' }),
      makeMakeupCredit({ id: 'mc-credit-2', status: 'REDEEMED', redeemedBySlotId: 'lesson-6' }),
      makeMakeupCredit({ id: 'mc-credit-3', status: 'EXPIRED', expiresAt: '2026-01-31' }),
    ],
    // ... extend practiceLogs, assignedRepertoire, lessonNotes, etc.
  };
}
```

---

## 8. Summary of Priority Actions

| Priority | Action | Effort |
|----------|--------|--------|
| Critical | Populate `mockPackages` with 4 records covering all PackageType variants | Low |
| Critical | Populate `mockInvoices` with 5 records covering all InvoiceStatus values | Low |
| Critical | Add `mockConservatoriumInstruments` for cons-66 | Low |
| High | Populate `mockPracticeLogs` (4 records), `mockAssignedRepertoire` (4 records) | Low |
| High | Populate `mockLessonNotes` (2 records — one shared, one private) | Low |
| High | Populate `mockMakeupCredits` (3 records — AVAILABLE, REDEEMED, EXPIRED) | Low |
| High | Add MAKEUP, TRIAL, CANCELLED lesson slots to `mockLessons` | Low |
| High | Create `tests/factories/` directory with 6 factory functions above | Medium |
| Medium | Populate `mockAnnouncements` (4 records, all target audiences) | Low |
| Medium | Populate `mockInstrumentRentals` (2 records) | Low |
| Medium | Add additional `mockEvents` (3 more, covering all statuses/types) | Low |
| Medium | Add Playing School student to `mockUsers` | Low |
| Medium | Populate `mockMessageThreads` (1 record) | Low |
| Medium | Add `EventProduction.title` i18n object to `mockEvents[0]` | Low |
| Medium | Populate `mockPayrolls` (1 record — DRAFT status) | Low |
| Low | Add `FormTemplate` records to `mockFormTemplates` | Medium |
| Low | Add seed.sql inserts for alumni, masterclasses, donation causes | Medium |
| Low | Resolve teacher ID incompatibility between memory and Postgres adapters in E2E documentation | High |
