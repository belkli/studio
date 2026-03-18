# HARMONIA — SDD-PS: Playing School Program
## (בית ספר מנגן)

**Version 1.0 | February 2026**  
**Classification:** Internal – Product & Engineering  
**Authors:** Expert Architect & Product Manager

---

## 1. Executive Summary

"Playing School" (Hebrew: בית ספר מנגן) is a national music-education program operating across Israel in which conservatories partner with elementary schools to deliver subsidized, in-school instrumental instruction. Students receive weekly group lessons during school hours, instrument loans, and access to school orchestras — all at a fraction of the cost of private conservatory tuition. The program is co-funded by municipalities, the Ministry of Education, and modest parental contributions collected through the school system.

This SDD defines how the Playing School model is incorporated into the Lyriosa platform, extending all existing personas — student, parent, teacher, conservatorium_admin, school_coordinator (new), and ministry_director — with the data structures, screens, APIs, and business-logic rules needed to manage school partnerships end-to-end.

### Program Characteristics at a Glance

- **Target population:** Elementary school students, grades 2–4 (כיתות ב'–ד')
- **Lesson format:** Weekly group lesson (6–12 students per class group) at the school
- **Instruments:** Recorder/flute (grade 2), strings (grade 2–3), winds (grade 4+)
- **Cost to parent:** ₪150–₪500 per academic year (heavily subsidized)
- **Excellence track:** top students receive intensive conservatory training with scholarships
- **Municipal/Ministry funding:** covers 60–80% of program costs
- **Instrument loan:** managed by the conservatory, signed out at school pickup

---

## 2. Background & Context

### 2.1 What Playing School Is

Playing School is a structured municipal music initiative, adopted by dozens of conservatories across Israel (Ramat Gan, Kiryat Ono, Herzliya, Kfar Saba, and others). The conservatory acts as the academic and operational arm, while the municipality funds the program and the school provides the venue and student cohort.

Structurally, it differs from regular conservatory lessons in five critical dimensions:

| Dimension | Regular Conservatory | Playing School |
|---|---|---|
| Location | Conservatory branch rooms | School classrooms / hall |
| Lesson format | Individual (1:1) or small group | Class group (6–20 students) |
| Enrollment | Parent registers online/in-office | Opt-in via school communication |
| Billing | Invoice from conservatory to parent | Added to school tuition / municipality |
| Instrument supply | Parent buys or rents from conservatory | Conservatory loans at school pickup |
| Curriculum | Personalised per student | Shared class curriculum (Ministry syllabus) |

### 2.2 Stakeholder Map

The following stakeholders interact with the Playing School program:

- **Municipality (עירייה):** co-funder, sets subsidy rules, expects compliance reports
- **Ministry of Education (משרד החינוך):** national curriculum standards, eligibility for funding
- **School (בית ספר):** venue, pupil list provider, communication conduit to parents
- **School Coordinator (רכז):** school-side contact point, manages schedule coordination
- **Conservatory Admin (מנהל קונסרבטוריון):** program director, teacher assignment, finances
- **Teacher (מורה):** travels to school, delivers group lessons, tracks attendance
- **Parent (הורה):** opts in, pays subsidized fee, receives progress updates
- **Student (תלמיד):** receives lessons, borrows instrument, may join excellence track

---

## 3. New System Roles

### 3.1 school_coordinator Role

A new UserRole value 'school_coordinator' must be added to the system. A school coordinator is a staff member at a partner school (typically a pedagogical secretary or vice-principal) who manages the Playing School program at their specific school.

#### school_coordinator: Permissions

| Permission | Details |
|---|---|
| **READ** | student enrollment list for their school \| lesson schedule at their school \| attendance records |
| **WRITE** | confirm/deny school schedule proposals \| mark school venue unavailability \| contact teacher via messaging |
| **NONE** | billing / financial data \| other schools' data \| conservatory-wide admin functions |

### 3.2 Updated UserRole Type Definition

Add to `src/lib/types.ts`:

```typescript
export type UserRole =
  | 'student' | 'teacher' | 'parent'
  | 'conservatorium_admin' | 'site_admin'
  | 'ministry_director' | 'admin' | 'superadmin'
  | 'school_coordinator'; // NEW — SDD-PS
```

---

## 4. Data Model Extensions

### 4.1 New Collection: school_partnerships

**Firestore collection:** `conservatoria/{conservatoriumId}/school_partnerships/{partnershipId}`

| Field | Type | Description |
|---|---|---|
| id | string | Auto-generated Firestore document ID |
| conservatoriumId | string | Owning conservatory |
| schoolName | string | Official school name (Hebrew) |
| schoolSymbol | string | Ministry school code (סמל מוסד) |
| municipalityId | string | FK to municipalities collection |
| coordinatorUserId | string | school_coordinator user ID |
| contactEmail | string | School admin email |
| contactPhone | string | School admin phone |
| address | string | School physical address |
| academicYear | string | e.g. 'תשפ"ו' |
| status | PartnershipStatus | ACTIVE \| PENDING \| SUSPENDED \| ENDED |
| subsidyModel | SubsidyModel | FULL_MUNICIPAL \| SPLIT \| PARENT_ONLY |
| municipalSubsidyPercent | number | 0–100 — municipality covers this % of cost |
| ministrySubsidyPercent | number | 0–100 — Ministry of Education covers this % |
| parentContributionPerYear | number | NIS amount per student per year (remainder) |
| programs | SchoolProgram[] | Array of active program tracks (see §4.2) |
| signedAgreementUrl | string? | Firebase Storage URL to signed contract PDF |
| createdAt | string | ISO Timestamp |
| updatedAt | string | ISO Timestamp |

### 4.2 Sub-type: SchoolProgram

Embedded array inside school_partnerships. Each element represents one instrument/grade track:

| Field | Type | Description |
|---|---|---|
| programId | string | UUID generated on creation |
| instrument | string | e.g. 'RECORDER', 'VIOLIN', 'CLARINET' |
| targetGrades | string[] | e.g. ['ב'', 'ג''] |
| teacherId | string | Assigned conservatory teacher |
| dayOfWeek | DayOfWeek | Lesson day at school |
| startTime | string | HH:mm — lesson start |
| durationMinutes | number | Typically 45 |
| roomAtSchool | string | Room name/number within school |
| maxStudents | number | Enrollment cap |
| excellenceTrackEnabled | boolean | Whether this program feeds an excellence track |

### 4.3 New Collection: playing_school_enrollments

**Firestore path:** `conservatoria/{conservatoriumId}/playing_school_enrollments/{enrollmentId}`

| Field | Type | Description |
|---|---|---|
| id | string | Auto-generated |
| conservatoriumId | string | Owning conservatory |
| partnershipId | string | FK to school_partnerships |
| programId | string | FK to SchoolProgram inside partnership |
| studentId | string? | FK to users — null until account created |
| parentId | string? | FK to users — parent who registered |
| studentName | string | Full name (even before account creation) |
| studentGrade | string | School grade (ב, ג, ד...) |
| studentClass | string | Class identifier (e.g. '1ב') |
| schoolSymbol | string | Ministry school code |
| instrument | string | Instrument for this enrollment |
| status | EnrollmentStatus | PENDING_PAYMENT \| ACTIVE \| WAITLIST \| CANCELLED |
| paymentStatus | PaymentStatus | PENDING \| PAID \| WAIVED (scholarship) |
| paymentMethod | PSPaymentMethod | SCHOOL_FEES \| MUNICIPAL_DIRECT \| CARDCOM |
| instrumentLoanId | string? | FK to instrument_checkouts if loaned |
| depositChequeRef | string? | Cheque reference number for instrument deposit |
| excellenceTrackNominated | boolean | Teacher nominated for excellence track |
| excellenceTrackStatus | ExcellenceStatus? | NOMINATED \| AUDITIONED \| ENROLLED \| DECLINED |
| consentGiven | boolean | Parent data processing consent |
| academicYear | string | e.g. 'תשפ"ו' |
| enrolledAt | string | ISO Timestamp |
| updatedAt | string | ISO Timestamp |

### 4.4 New Collection: school_group_lessons

Replaces/extends the existing lesson_slots for Playing School context. **Path:** `conservatoria/{cId}/school_group_lessons/{lessonId}`

| Field | Type | Description |
|---|---|---|
| id | string | Auto-generated |
| partnershipId | string | FK to school_partnerships |
| programId | string | FK to SchoolProgram |
| teacherId | string | Conservatory teacher delivering lesson |
| schoolSymbol | string | School identifier |
| startTime | string | ISO Timestamp |
| durationMinutes | number | Lesson duration |
| instrument | string | Instrument taught in this lesson |
| recurrenceId | string? | For recurring weekly lessons |
| status | GroupLessonStatus | SCHEDULED \| COMPLETED \| CANCELLED \| MAKEUP |
| attendance | GroupAttendanceEntry[] | Per-student attendance records |
| teacherNote | string? | Lesson summary from teacher |
| cancelReason | string? | If cancelled — reason |
| substituteTeacherId | string? | If teacher was substituted |
| createdAt | string | ISO Timestamp |

### 4.5 Extension to User type (school_coordinator fields)

Add to the User type in `src/lib/types.ts` when role === 'school_coordinator':

- **schoolSymbol:** string — Ministry school code they coordinate
- **schoolName:** string — school display name
- **partnershipIds:** string[] — school partnerships they manage

### 4.6 Extended InstrumentCheckout for Playing School

Extend the existing InstrumentCheckout type with:

- **context:** 'PLAYING_SCHOOL' | 'CONSERVATORY' — loan origin context
- **enrollmentId:** string? — FK to playing_school_enrollments
- **pickupLocation:** 'CONSERVATORY' | 'SCHOOL' — where instrument was collected
- **depositChequeNumber:** string? — for school program deposits

---

## 5. Business Logic & Rules

### 5.1 Enrollment Lifecycle

The Playing School enrollment follows a distinct lifecycle from regular conservatory enrollment:

| Stage | State | Trigger / Action |
|---|---|---|
| 1 | Invitation | Admin creates partnership + programs; school coordinator/parent receives enrollment link |
| 2 | Parent Registration | PENDING_PAYMENT | Parent fills enrollment form (student name, grade, class, consent) |
| 3 | Payment | PENDING_PAYMENT → ACTIVE | Cardcom payment OR school-fees collection confirmation from admin |
| 4 | Instrument Loan | ACTIVE | Admin/teacher issues instrument; checkout record created; deposit cheque noted |
| 5 | Active Lessons | ACTIVE | Weekly group lessons at school; attendance marked by teacher |
| 6 | Excellence Nomination | ACTIVE + nomination | Teacher nominates student; coordinator reviews; excellence track offer sent to parent |
| 7 | Year End | ACTIVE → COMPLETED | Academic year closes; instrument returned; deposit cheque returned; reports generated |

### 5.2 Subsidized Billing Rules

The platform must support three payment models:

- **SCHOOL_FEES model:** Parent contribution collected through the school's tuition management system (external). Admin manually marks payment as received in Lyriosa. No Cardcom transaction generated.
- **MUNICIPAL_DIRECT model:** Municipality pays conservatory directly via invoice. Parent contribution is ₪0. Admin generates a municipal invoice from the system.
- **CARDCOM model:** Parent pays online via Cardcom (same as regular enrollment). System generates standard invoice.

**Pricing calculation rules:**

1. `parentContributionPerYear = programBasePrice × (1 - municipalSubsidyPercent/100) × (1 - ministrySubsidyPercent/100)`
2. If result < minimumParentContribution (configurable per conservatory, default ₪0), use minimum
3. **Installment option:** always offer 10 monthly installments at (parentContributionPerYear / 10) per month

### 5.3 Teacher Travel & Payroll

School-visit lessons must be compensated differently from conservatory lessons:

- A new payroll line type 'SCHOOL_VISIT' must be added to PayrollExportRow
- **Travel allowance:** configurable per conservatory (e.g. ₪30/visit flat, or per-km rate)
- **Teacher payroll for school lessons:** calculated as: (group lesson rate × number of students attended / maxStudents) OR flat rate per session — configured per partnership
- **Sick leave for school visits:** substitute teacher must be arranged; school coordinator must be notified via WhatsApp + in-app

### 5.4 Excellence Track Logic

The excellence track is an opt-in upgrade path for high-performing Playing School students:

1. Teacher nominates student in their lesson notes (excellenceTrackNominated = true)
2. System sends notification to conservatorium_admin for review
3. Admin sends excellence track offer to parent (via WhatsApp/email), with pricing and schedule
4. Parent accepts → new standard conservatory enrollment is created (individual lessons at conservatory), linked via the original enrollmentId
5. Scholarship check: if family qualifies for scholarship, auto-trigger ScholarshipApplication flow
6. Excellence track students appear in both Playing School reports AND regular student reports

### 5.5 Attendance for Group Lessons

Group lesson attendance (school context) differs from 1:1 lessons:

- Teacher marks attendance for all students in a class group in one action
- **Absence types:** PRESENT | ABSENT_NOTICED | ABSENT_NO_NOTICE | SCHOOL_EVENT (school cancelled due to event)
- **No makeup credits** are issued for Playing School absences (policy configurable per partnership)
- **If conservatory cancels** (teacher sick): school coordinator is notified; makeup lesson rescheduled within same school term

---

## 6. Feature Specifications by Persona

### 6.1 Conservatorium Admin

#### 6.1.1 School Partnership Management Dashboard

**Route:** `/dashboard/admin/playing-school`

A new top-level admin section providing:

- List of all active school partnerships with status, enrollment count, and program summary
- Create / Edit / Archive partnership — full form with school details, subsidy model, and program tracks
- Assign teacher to each program track from existing teacher roster (filtered by instrument)
- View enrollment roster per school — with payment status, instrument loan status, and excellence track flags
- Generate enrollment link for school (unique URL per partnership for parent self-registration)
- Export enrollment list to Excel/PDF for school coordinator or municipality

#### 6.1.2 Playing School Billing

**Route:** `/dashboard/admin/playing-school/billing`

- Overview of all Playing School revenue: municipal invoices, parent payments, Ministry claims
- Generate municipal invoice for each partnership (PDF, with partnership agreement reference)
- Manually confirm school-fee payments (SCHOOL_FEES model) per student
- Filter unpaid enrollments and send WhatsApp/email reminders
- Financial report: per school, per municipality, for academic year — exportable

#### 6.1.3 Teacher Assignment & Travel Scheduling

- Calendar overlay showing teacher school-visit days alongside conservatory lessons
- Conflict detection: prevent scheduling school visits when teacher has conservatory lessons in same time slot
- Travel allowance configuration per partnership
- Substitute teacher assignment for school visits (extending existing substitute-assignment-panel.tsx)

#### 6.1.4 Reports & Compliance

- Ministry report: enrollment statistics by school, grade, instrument — in Ministry format
- Annual summary: total subsidized students, total municipal/ministry funding received
- Excellence track pipeline: nominees → auditioned → enrolled conversion funnel
- Integrate with existing reports dashboard (academic-reports.tsx, financial-reports.tsx)

### 6.2 Teacher

#### 6.2.1 School Visit Schedule

**Route:** `/dashboard/teacher` — existing teacher dashboard extended

- School visit events appear in the teacher's weekly calendar view with distinct visual treatment (school icon + school name label)
- Pre-lesson summary card adapted for group context: shows class list, instrument, school name
- Quick-tap attendance marking: teacher opens lesson → sees student list → taps PRESENT/ABSENT per student

#### 6.2.2 Group Lesson Notes

- After marking attendance, teacher writes a single group lesson note (summary of what was covered)
- Excellence nomination: toggle button per student — 'Nominate for Excellence Track'
- Notes are visible to school coordinator and conservatorium admin; not to individual parents (option to share enabled by admin)

#### 6.2.3 Payroll View

- School visit lessons appear as separate line items in teacher payroll view with 'School Visit' type label
- Travel allowance displayed separately per visit

### 6.3 Parent

#### 6.3.1 Playing School Enrollment Flow

**Route:** `/enroll/playing-school/{partnershipToken}` (public, no auth required to start)

A guided 5-step enrollment wizard for parents:

1. **Step 1 – School Info:** Display school name, program description, instruments, schedule, cost breakdown
2. **Step 2 – Student Details:** name, grade, class, date of birth, gender
3. **Step 3 – Parent Contact:** name, phone, email, ID number
4. **Step 4 – Instrument Selection** (if multiple options per grade) + consent checkbox
5. **Step 5 – Payment:** Cardcom, or 'Pay via school fees' selection + confirmation

After submission: parent receives WhatsApp/email confirmation with instrument pickup instructions.

#### 6.3.2 Family Hub Extension

**Route:** `/dashboard/family` — existing family-hub.tsx extended

- Playing School enrollments appear as child cards alongside regular conservatory enrollments
- Card shows: school name, instrument, lesson day, next lesson date, payment status
- If excellence track nominated: special notification card with action button to view offer
- Instrument loan status: shows 'Instrument: Violin — on loan' or 'Instrument: pick up by [date]'

#### 6.3.3 Progress Updates

- Parents see group lesson attendance for their child (present/absent per lesson)
- Group lesson notes shared with parent (if teacher/admin enabled sharing)
- Excellence track progress tracker (if enrolled)

### 6.4 Student (Playing School / Excellence Track)

- Playing School students may not have a Lyriosa account initially — account is auto-created when parent registers and pays
- After account creation, student sees a simplified 'Playing School' dashboard — no individual billing, no makeup credits, no booking
- Excellence track students transition to a full student account with standard access
- Achievement system: Playing School-specific achievements (first group lesson, 3-month streak, excellence track nomination)

### 6.5 School Coordinator

#### 6.5.1 School Coordinator Dashboard

**Route:** `/dashboard/school` — new dashboard for school_coordinator role

- **Overview:** program name, teacher name, lesson day/time, enrolled student count
- **Lesson calendar:** upcoming school visits, with ability to mark venue unavailability (holidays, school events)
- **Student roster:** name, grade, class, payment status, instrument — read-only view
- **Messaging:** send message to conservatory admin or assigned teacher
- **Absence reporting:** if school has an event that conflicts with lesson, coordinator can flag the date for makeup scheduling

#### 6.5.2 Notifications for School Coordinator

- Teacher cancellation notice (min. 24 hours in advance if possible)
- New enrollment confirmed at their school
- Excellence track nomination for a student at their school
- Instrument pickup reminder for new students

### 6.6 Ministry Director

- Ministry director's existing dashboard (ministry-inbox-panel.tsx) extended with Playing School enrollment statistics
- New report type: 'Playing School Annual Compliance Report' — aggregates all conservatories' school partnership data
- Filter by municipality, school, grade, instrument
- Export in Ministry-compatible format (matching existing MinistryExamRecord export pattern)

---

## 7. UI / UX Specifications

### 7.1 Navigation Changes

The sidebar navigation (sidebar-nav.tsx) must be updated with new links:

| Route | Label (EN/HE) | Roles | Icon |
|---|---|---|---|
| /dashboard/admin/playing-school | Playing School / מנגן ספר בית | conservatorium_admin, site_admin | School |
| /dashboard/school | My School / בית הספר שלי | school_coordinator | Building |
| /dashboard/admin/playing-school/billing | School Billing / חיובים | conservatorium_admin | DollarSign |

### 7.2 Parent Enrollment Landing Page (Public)

The public enrollment page (`/enroll/playing-school/[token]`) must be:

- Accessible without login — full public page
- Mobile-first design (most parents will open from WhatsApp link on mobile)
- Available in Hebrew (default), Arabic, and Russian per the existing i18n system
- Display school logo, conservatory logo, cost breakdown prominently
- Integrate existing InstallmentSelector component for payment plan selection
- Use existing Cardcom integration (`src/lib/payments/cardcom.ts`) for online payment

### 7.3 Teacher Attendance UI

The group lesson attendance screen must be:

- Optimized for quick interaction on mobile (teacher is at the school, using phone)
- Single-scroll list of student names with large tap targets for attendance status
- One-tap bulk action: 'Mark all present' then adjust exceptions
- Offline-capable: queue attendance data if school has poor connectivity, sync on reconnect

### 7.4 Instrument Loan Flow

The existing instrument-rental-dashboard.tsx is extended with a 'Playing School Loans' tab:

- Filter instruments by context: CONSERVATORY vs PLAYING_SCHOOL
- Batch checkout: pre-list instruments assigned to a school, admin checks them all out in one session
- Deposit cheque management: record cheque number, bank, amount per loan
- Automated overdue notices: if instrument not returned within 7 days of academic year end

---

## 8. API & Cloud Functions

### 8.1 New Cloud Functions

New functions to be added under `src/lib/cloud-functions/`:

#### playing-school-enrollment.ts

- **createPlayingSchoolEnrollment(data: EnrollmentFormData):** Creates enrollment, triggers payment flow, sends parent confirmation
- **confirmSchoolFeesPayment(enrollmentId, adminId):** Marks SCHOOL_FEES payment as received
- **cancelPlayingSchoolEnrollment(enrollmentId, reason):** Cancels enrollment, triggers instrument return if loaned

#### school-partnership.ts

- **createSchoolPartnership(data: PartnershipFormData):** Creates partnership, generates enrollment token, notifies coordinator
- **generateEnrollmentToken(partnershipId):** Creates unique URL token for parent registration page
- **updatePartnershipStatus(partnershipId, status):** Activates/suspends/ends partnership
- **exportSchoolRoster(partnershipId, format: 'xlsx' | 'pdf'):** Generates roster document

#### school-group-lesson.ts

- **createGroupLessonSeries(partnershipId, programId):** Generates all weekly lesson slots for academic year
- **markGroupAttendance(lessonId, attendance: GroupAttendanceEntry[]):** Records attendance
- **cancelSchoolLesson(lessonId, reason, notifyCoordinator):** Cancels lesson, notifies school
- **proposeGroupLessonMakeup(originalLessonId, newDate):** Creates makeup lesson proposal for school coordinator approval

#### excellence-track.ts

- **nominateForExcellenceTrack(enrollmentId, teacherNote):** Creates nomination, alerts admin
- **sendExcellenceTrackOffer(enrollmentId, offerDetails):** Sends parent offer with pricing, schedule
- **enrollInExcellenceTrack(enrollmentId):** Creates linked standard conservatory enrollment

### 8.2 Extended Notification Dispatchers

Extend `src/lib/notifications/dispatcher.ts` with new notification types for Playing School:

| Event Type | Recipients | Channels |
|---|---|---|
| PLAYING_SCHOOL_ENROLLMENT_CONFIRMED | parent, admin | WhatsApp, Email |
| PLAYING_SCHOOL_LESSON_CANCELLED | parent, school_coordinator | WhatsApp, In-App |
| PLAYING_SCHOOL_INSTRUMENT_PICKUP_READY | parent | WhatsApp, Email |
| PLAYING_SCHOOL_INSTRUMENT_OVERDUE | parent, admin | WhatsApp, Email |
| EXCELLENCE_TRACK_NOMINATION | admin | In-App |
| EXCELLENCE_TRACK_OFFER | parent | WhatsApp, Email |
| SCHOOL_VENUE_CONFLICT | teacher, admin | In-App, WhatsApp |
| PAYMENT_DUE_SCHOOL_PROGRAM | parent | WhatsApp, Email |

### 8.3 Firestore Security Rules

Extend storage.rules with Playing School collections:

- **school_partnerships:** read(conservatorium_admin, site_admin, school_coordinator[own school]); write(conservatorium_admin, site_admin)
- **playing_school_enrollments:** read(conservatorium_admin, teacher[own programs], school_coordinator[own school], parent[own children]); write(conservatorium_admin, parent[create only], site_admin)
- **school_group_lessons:** read(all authenticated); write(teacher[own lessons], conservatorium_admin, site_admin)

---

## 9. Integration with Existing System Components

| Existing Component | Playing School Integration |
|---|---|
| instrument-rental-dashboard.tsx | Add PLAYING_SCHOOL context filter; batch checkout flow; deposit cheque tracking |
| schedule-calendar.tsx | Render school visits as distinct event type; school icon; location label |
| substitute-assignment-panel.tsx | Extend to handle school-visit substitutions; notify school coordinator |
| teacher-payroll-view.tsx | Add SCHOOL_VISIT line items; travel allowance line |
| payroll-export.ts | Extend PayrollExportRow with school visit + travel fields |
| enrollment-wizard.tsx | New variant: Playing School mode (group, school-based, limited fields) |
| family-hub.tsx | Add Playing School enrollment cards per child |
| student-billing-dashboard.tsx | Display Playing School payment alongside regular billing |
| ministry-inbox-panel.tsx | Add Playing School compliance reports section |
| academic-reports.tsx | New report template: School Program Participation Report |
| financial-reports.tsx | New section: Playing School Revenue (municipal + parent split) |
| notification-preferences.tsx | New NotificationTypes: PLAYING_SCHOOL_* events |
| ai-alerts-card.tsx | New AI alert: low enrollment warning, at-risk non-payers, instrument overdue |
| form-builder.tsx | New form template: Playing School Enrollment Form, Excellence Track Offer |

---

## 10. Implementation Roadmap

### Phase 1 — Foundation (Weeks 1–4)

Core infrastructure to enable the program to function at a basic level.

- **Data model:** add new Firestore collections (school_partnerships, playing_school_enrollments, school_group_lessons)
- **Types:** extend `src/lib/types.ts` with all new types defined in §4
- **Add school_coordinator to UserRole;** update Firestore security rules
- **School partnership CRUD:** admin form + list UI
- **Group lesson series generator:** (createGroupLessonSeries cloud function)
- **Basic teacher schedule:** school visits in existing calendar

### Phase 2 — Enrollment & Payments (Weeks 5–8)

- **Public parent enrollment page:** (`/enroll/playing-school/[token]`)
- **Cardcom integration** for Playing School payments
- **SCHOOL_FEES manual payment** confirmation flow
- **Municipal invoice generator**
- **Parent enrollment confirmation** notifications (WhatsApp + Email)
- **Instrument loan batch checkout** for Playing School context

### Phase 3 — Teacher & Attendance (Weeks 9–12)

- **Mobile-optimized group attendance** marking UI
- **Group lesson notes** with excellence track nomination
- **Teacher payroll extension** (school visit line items + travel allowance)
- **Substitute teacher assignment** for school visits
- **School coordinator dashboard** + notifications

### Phase 4 — Excellence Track & Parent Portal (Weeks 13–16)

- **Excellence track nomination** → offer → enrollment workflow
- **Family Hub extension** (Playing School cards per child)
- **Parent progress view** (attendance, group notes, excellence track status)
- **Playing School student account** auto-creation on enrollment
- **Achievement badges** for Playing School milestones

### Phase 5 — Analytics, Compliance & Polish (Weeks 17–20)

- **Ministry compliance reports** for Playing School
- **Financial reports:** municipal/parent split analytics
- **AI alerts:** low enrollment, at-risk payments, instrument overdue
- **i18n:** HE, AR, RU translations for all new screens
- **Accessibility audit** (WCAG 2.1 AA) on all new components
- **End-to-end testing** + UAT with pilot conservatory

---

## 11. Open Questions & Decisions Required

| # | Question | Options | Owner |
|---|---|---|---|
| 1 | Should Playing School students get full Lyriosa student accounts on enrollment, or only on excellence track? | A) Full account (more visibility) B) Lightweight record until excellence track | Product |
| 2 | Should makeup credits apply when a teacher cancels a school visit? | A) Yes, same as regular B) No makeup credits (school program policy) C) Configurable | Business |
| 3 | How should school coordinators authenticate? | A) Email/password same as other users B) Google SSO via school domain C) One-time link per term | Architecture |
| 4 | Which payment method is default for new partnerships? | A) SCHOOL_FEES (most common currently) B) Cardcom C) Per partnership config | Business |
| 5 | Should group lesson notes be shared with parents by default? | A) No (privacy, group context) B) Yes, general group note C) Configurable per conservatory | Product |
| 6 | How to handle multi-conservatory municipalities? | A) Each conservatory manages own schools B) Site-admin can manage across conservatories C) Municipality admin role (future) | Architecture |

---

## 12. Compliance & Privacy Considerations

### 12.1 PDPPA Compliance

- Playing School enrollments involve minors — parental consent for data processing is mandatory (ConsentType.DATA_PROCESSING)
- School class lists (grade, class name) must NOT be stored at individual level without explicit consent
- Instrument loan records with deposit cheque data constitute financial PII — store encrypted, subject to 7-year retention policy
- School coordinator has access to student names and attendance — must acknowledge data processing responsibility on first login

### 12.2 Ministry of Education Requirements

- All enrolled students must be linkable to Ministry school codes (schoolSymbol / סמל מוסד)
- Annual enrollment report must match Ministry format for subsidy claims
- Teacher credentials for school visits must be on file (certified music teacher per Ministry standards)
- Group lesson curriculum must align with Ministry music education syllabus for respective instrument and grade

### 12.3 Municipal Requirements

- Municipal subsidy invoices must include: school name, school symbol, enrollment count per grade, instrument, lesson count, teacher name
- Data retention for municipal financial records: 7 years per Israeli municipal accounting law
- Municipality may request audit access — future consideration: municipality observer role (read-only)

---

## 13. Appendix — Complete TypeScript Definitions

Add the following types to `src/lib/types.ts`:

```typescript
// ── SDD-PS: Playing School Program ───────────────────────────────────────

export type PartnershipStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'ENDED';

export type SubsidyModel = 'FULL_MUNICIPAL' | 'SPLIT' | 'PARENT_ONLY';

export type PSPaymentMethod = 'SCHOOL_FEES' | 'MUNICIPAL_DIRECT' | 'CARDCOM';

export type ExcellenceStatus = 'NOMINATED' | 'AUDITIONED' | 'ENROLLED' | 'DECLINED';

export type GroupLessonStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MAKEUP';

export type SchoolProgram = {
  programId: string;
  instrument: string;
  targetGrades: string[];
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  durationMinutes: number;
  roomAtSchool: string;
  maxStudents: number;
  excellenceTrackEnabled: boolean;
};

export type SchoolPartnership = {
  id: string;
  conservatoriumId: string;
  schoolName: string;
  schoolSymbol: string;
  municipalityId: string;
  coordinatorUserId: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  academicYear: string;
  status: PartnershipStatus;
  subsidyModel: SubsidyModel;
  municipalSubsidyPercent: number;
  ministrySubsidyPercent: number;
  parentContributionPerYear: number;
  programs: SchoolProgram[];
  signedAgreementUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type PlayingSchoolEnrollment = {
  id: string;
  conservatoriumId: string;
  partnershipId: string;
  programId: string;
  studentId?: string;
  parentId?: string;
  studentName: string;
  studentGrade: string;
  studentClass: string;
  schoolSymbol: string;
  instrument: string;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'WAITLIST' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: PaymentStatus;
  paymentMethod: PSPaymentMethod;
  instrumentLoanId?: string;
  depositChequeRef?: string;
  excellenceTrackNominated: boolean;
  excellenceTrackStatus?: ExcellenceStatus;
  consentGiven: boolean;
  academicYear: string;
  enrolledAt: string;
  updatedAt: string;
};

export type SchoolGroupLesson = {
  id: string;
  partnershipId: string;
  programId: string;
  teacherId: string;
  schoolSymbol: string;
  startTime: string;
  durationMinutes: number;
  instrument: string;
  recurrenceId?: string;
  status: GroupLessonStatus;
  attendance: GroupAttendanceEntry[];
  teacherNote?: string;
  cancelReason?: string;
  substituteTeacherId?: string;
  createdAt: string;
};
```
