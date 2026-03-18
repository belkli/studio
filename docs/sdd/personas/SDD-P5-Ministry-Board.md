# SDD-P5: Persona Audit — Ministry of Education / Board Director
**Lyriosa 360° Architecture Audit**
**Persona:** Ministry of Education Representative / Board Director (נציג משרד החינוך / יו"ר הדירקטוריון)
**Auditor Role:** Senior Full-Stack Architect + Israeli Regulatory Compliance Expert
**Version:** 1.0 | **Date:** 2026-02-25

---

## 1. Executive Summary

This persona has two distinct sub-roles with very different needs, and understanding the precise scope of each is critical to building the right system.

**The Ministry of Education Director of Music** (מנהל/ת תחום המוזיקה, משרד החינוך) is not a system administrator of the national portal `pop.education.gov.il`. Rather, this is the individual who currently runs a private, independently-maintained website — **www.y-noam.com** — to distribute forms, guidelines, and resources to conservatoriums across Israel. That site is outdated and cumbersome. Lyriosa's goal is to **replace www.y-noam.com**, not `pop.education.gov.il`. This is a far more tractable and well-defined scope: a forms distribution, collection, and approval system between the Ministry Director and the conservatoriums they oversee.

The Ministry Director's workflow in Lyriosa:
1. Creates or uploads a form (e.g., composition submission, recital application, exam registration, event approval)
2. Sends it to one or many conservatoriums
3. Students, teachers, and admins at each conservatorium fill the form digitally, sign it, and submit it back — all within Lyriosa
4. The Director reviews all submissions in a unified inbox, approves/rejects/requests changes per submission
5. Can download any submission as a PDF, or export a batch as a ZIP for archival
6. No longer needs to manage Excel files, printed forms, email chains, or the www.y-noam.com website

**The Board Director** (יו"ר דירקטוריון) is the conservatorium's own governing body chair. They need strategic visibility into the conservatorium's health — not form management, but enrollment trends, financial performance, faculty metrics, and Ministry compliance status.

**What Is Good:**
- SDD-08's `FormSubmission` model is production-grade: `workflowSteps`, `approvalHistory` with signatures, `ministryExportedAt`, and `ministryReferenceNumber` fields correctly model the multi-step approval chain between student → teacher → admin → Ministry Director.
- The form type taxonomy (`EXAM_REGISTRATION`, `RECITAL`, `COMPOSITION_SUBMISSION`, `SCHOLARSHIP_REQUEST`) maps directly to the real forms currently managed via www.y-noam.com and manual processes.
- The dynamic form builder concept (`CUSTOM` type with configurable approval chains) is architecturally correct — the Ministry Director needs to be able to create new form types without requiring a developer.
- SDD-11 (Reporting) defines the key metrics a Board Director would need.
- The `AuditLogEntry` type and `mockAuditLog` exist in the prototype, showing awareness of the need for an immutable audit trail.

**What Is Critically Missing:**
- **Ministry Director Role & Access Model:** The SDD does not define a `MINISTRY_DIRECTOR` role. This persona needs a cross-conservatorium view — they oversee *all* conservatoriums in their region, not just one. Their access model is fundamentally different from a `CONSERVATORIUM_ADMIN`.
- **Forms Inbox for the Ministry Director:** A unified view of all form submissions across all conservatoriums, filterable by conservatorium, form type, and status. This is the replacement for www.y-noam.com.
- **Digital Signature Flow:** The `requiresSignature` flag exists in the form workflow model, but there's no signature capture component (canvas-based e-signature), no PDF embedding of the signature, and no legal timestamp/audit trail.
- **Bulk PDF Export:** Ministry Director needs to download all submissions for a given form type / period as a ZIP of PDFs. Not implemented.
- **Archival Compliance:** Israeli law requires student records to be retained for 7 years after graduation. No archival policy engine exists.
- **Board Director Dashboard:** A strategic view separate from the operational admin dashboard. The Board Director should not wade through daily lesson cancellations to find enrollment trend data.

**Scope Clarification — What Lyriosa Does NOT Replace:**
- `pop.education.gov.il` — the national Ministry portal for official school registration, funding, and statutory reporting. This remains the authoritative government system.
- Lyriosa forms submissions that require official Ministry reference numbers may still need to be cross-filed in `pop.education.gov.il` manually by the admin — but this is an edge case, not the primary workflow.

---

## 2. Functional Gap Analysis

### Gap 1: Ministry Director Role & Cross-Conservatorium Access
**Severity:** High (P1 — without this role, the Ministry Director cannot use the system at all)

The current role taxonomy (`SITE_ADMIN`, `CONSERVATORIUM_ADMIN`, `TEACHER`, `PARENT`, `STUDENT`) has no `MINISTRY_DIRECTOR` role. This persona needs:
- Read access to form submissions across all conservatoriums in their oversight scope
- Ability to create and push form templates to one or many conservatoriums
- Approve/reject/comment on individual submissions
- No access to financial data, lesson schedules, or student personal details (beyond what's in the form itself)

### Gap 2: Forms Inbox — The www.y-noam.com Replacement
**Severity:** Critical (P1 — this is the core deliverable for this persona)

The Ministry Director currently receives forms via email, WhatsApp, and fax. Lyriosa replaces this with a structured inbox at `/ministry/forms` showing all submissions across all conservatoriums with filter, search, bulk-approve, and PDF download capabilities.

### Gap 3: Digital Signature Flow
**Severity:** High (P1 — Ministry forms require parent/teacher signatures to be legally valid)

No signature canvas component exists in the prototype. See SDD-P4 Section 3.3 for the full `SignatureCanvas` spec — the same component applies here.

### Gap 4: Data Archival & Retention Engine
**Severity:** High (P1 — legal requirement)

Israeli privacy law and Ministry regulations require student records to be retained for 7 years post-graduation. The system currently has no concept of record retention periods, archival status, or scheduled data deletion for expired records.

### Gap 5: Board Director Strategic Dashboard
**Severity:** Medium (P2)

A Board Director needs: fiscal year P&L summary, enrollment trend (5-year view), scholarship fund allocation, faculty headcount and turnover. They do not need — and should not have access to — individual student PII or operational lesson data.

---

## 3. Actionable Technical Specifications

### 3.1 Ministry Director Role & Cross-Conservatorium Access

```typescript
// Add MINISTRY_DIRECTOR to the UserRole enum
type UserRole =
  | 'SITE_ADMIN'
  | 'MINISTRY_DIRECTOR'           // NEW — replaces www.y-noam.com workflow
  | 'CONSERVATORIUM_ADMIN'
  | 'TEACHER'
  | 'PARENT'
  | 'STUDENT_OVER_13'
  | 'STUDENT_UNDER_13';

// Ministry Director Firestore document — NOT scoped to a single conservatorium
// Collection: /ministryDirectors/{directorId}
interface MinistryDirector {
  id: string;                         // links to User.id
  userId: string;
  name: string;
  email: string;
  oversightScope: 'ALL' | 'REGIONAL'; // ALL = all conservatoriums in system
  regionIds?: string[];               // if REGIONAL
  managedConservatoriumIds?: string[]; // explicit list if not regional
  canCreateFormTemplates: boolean;    // true for the Director
  canApproveSubmissions: boolean;
  createdAt: Timestamp;
}

// Firebase Custom Claim for Ministry Director:
// { role: 'MINISTRY_DIRECTOR', ministryScope: 'ALL' }
// This grants read access to formSubmissions across all conservatoriums
// No access to: financial data, lesson schedules, student PII outside form content
```

**Firestore Security Rule addition:**
```javascript
// Ministry Director can read any form submission across any conservatorium
match /conservatoriums/{cid}/formSubmissions/{formId} {
  allow read: if isMinistryDirector()
              || isAdminFor(cid)
              || isTeacherFor(cid) && resource.data.teacherId == request.auth.uid
              || resource.data.submittedBy == request.auth.uid;

  // Ministry Director can update status (approve/reject/request changes) only
  allow update: if isMinistryDirector()
                && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['status', 'approvalHistory', 'updatedAt']);
}

function isMinistryDirector() {
  return isSignedIn() && request.auth.token.role == 'MINISTRY_DIRECTOR';
}
```

---

### 3.2 Ministry Director Forms Inbox (www.y-noam.com Replacement)

Route: `/ministry/inbox` — visible only to `MINISTRY_DIRECTOR` role

This is the primary UI replacing the current manual workflow via www.y-noam.com:

```typescript
// src/app/ministry/inbox/page.tsx
// Server Component — fetches across all conservatoriums

// The inbox shows all form submissions requiring Ministry Director attention,
// grouped by conservatorium and form type

interface MinistryInboxItem {
  formSubmissionId: string;
  conservatoriumName: string;
  conservatoriumId: string;
  formType: FormType;
  title: string;
  submittedByName: string;
  studentName?: string;
  submittedAt: Timestamp;
  status: FormStatus;
  daysOpen: number;           // days since submission, for urgency indication
}

// Firestore query for Ministry Director inbox:
// Collection group query across all conservatoriums
const inboxQuery = query(
  collectionGroup(db, 'formSubmissions'),
  where('requiresMinistryApproval', '==', true),
  where('status', 'in', ['PENDING_MINISTRY_REVIEW', 'RETURNED_FOR_EDIT']),
  orderBy('submittedAt', 'desc')
);

// UI Features:
// - Filter by conservatorium, form type, date range, status
// - Batch approve (select multiple → approve all)
// - Per-submission: Approve | Reject | Request Changes (with comment field)
// - Download single submission as PDF
// - Download all submissions of a type as ZIP of PDFs
// - Send form template to one / all / selected conservatoriums
```

**FormSubmission model addition** — add `requiresMinistryApproval` flag:
```typescript
interface FormSubmission {
  // ...existing fields
  requiresMinistryApproval: boolean;   // true for EXAM_REGISTRATION, COMPOSITION_SUBMISSION, etc.
  ministryReviewedAt?: Timestamp;
  ministryReviewedByDirectorId?: string;
  ministryDirectorComment?: string;
}
```

---

### 3.3 Form Template Distribution (Director → Conservatoriums)

The Ministry Director can create a new form template and push it to conservatoriums — replacing the current practice of emailing Excel files or posting PDFs on www.y-noam.com:

```typescript
// Collection: /ministryFormTemplates/{templateId}
// (Root collection — not per-conservatorium, owned by Ministry Director)
interface MinistryFormTemplate {
  id: string;
  createdByDirectorId: string;
  title: string;
  titleHe: string;
  description?: string;
  formType: FormType;
  fields: FormFieldDefinition[];      // Dynamic form builder spec
  requiresStudentSignature: boolean;
  requiresTeacherSignature: boolean;
  requiresParentSignature: boolean;   // For minors
  requiresAdminSignature: boolean;
  workflowSteps: WorkflowStep[];      // Approval chain
  validFrom?: Date;
  validUntil?: Date;
  targetConservatoriumIds: string[] | 'ALL';
  publishedAt?: Timestamp;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

// When published, the template appears in the admin's forms section at
// /admin/forms/available — with a "Start filling" button for each student
// Admin can initiate the form for all eligible students in one action
```

---

### 3.4 Bulk PDF Export for Ministry Director

```typescript
// src/lib/ministry/bulk-export.ts
export async function exportFormSubmissionsAsZip(
  formType: FormType,
  academicYear: string,
  conservatoriumIds: string[] | 'ALL'
): Promise<Buffer> {
  const JSZip = require('jszip');
  const zip = new JSZip();

  const targetConservatoriums = conservatoriumIds === 'ALL'
    ? await getAllConservatoriumIds()
    : conservatoriumIds;

  for (const cid of targetConservatoriums) {
    const conservatorium = await getConservatorium(cid);
    const forms = await db
      .collection(`conservatoriums/${cid}/formSubmissions`)
      .where('type', '==', formType)
      .where('formData.academicYear', '==', academicYear)
      .where('status', '==', 'APPROVED')
      .get();

    for (const formDoc of forms.docs) {
      const form = formDoc.data() as FormSubmission;
      const pdfBuffer = await generateFormPDF(form, conservatorium);
      const filename = `${conservatorium.name}_${form.studentId}_${form.id}.pdf`
        .replace(/[^\w\-\.]/g, '_');  // sanitize filename
      zip.folder(conservatorium.name)?.file(filename, pdfBuffer);
    }
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
// Admin-side equivalent: the conservatorium admin can also email the PDF of any
// form to the Ministry Director directly from the form approval screen,
// as an alternative to the Ministry Director pulling it from Lyriosa
```

---

### 3.5 Exam Registration Export (for Conservatorium Admin use)

This export is used by the **conservatorium admin** (not the Ministry Director directly) to produce a summary list of exam registrations in a format suitable for sharing with the Ministry Director or for internal records. The Ministry Director receives these via the Lyriosa inbox (Section 3.2) rather than needing to pull exports themselves.

```typescript
// src/lib/ministry/exam-export.ts
interface MinistryExamRecord {
  studentIdNumber: string;           // ת"ז
  studentFirstName: string;          // שם פרטי
  studentLastName: string;           // שם משפחה
  dateOfBirth: string;               // DD/MM/YYYY
  grade: string;                     // כיתה
  school: string;                    // בית ספר
  instrument: string;                // Hebrew Ministry nomenclature
  examLevel: string;                 // רמה (א | ב | ג | ד | ה)
  teacher: string;                   // שם מורה
  teacherIdNumber: string;           // ת"ז מורה
  conservatoriumName: string;
  conservatoriumRegistrationNumber: string;
  examDate?: string;                 // DD/MM/YYYY — if scheduled
  examCenter?: string;               // מרכז בחינות
}

// Ministry instrument name mapping (Hebrew Ministry nomenclature)
const MINISTRY_INSTRUMENT_NAMES: Record<string, string> = {
  'PIANO': 'פסנתר', 'VIOLIN': 'כינור', 'CELLO': 'צ\'לו', 'GUITAR': 'גיטרה',
  'FLUTE': 'חליל צד', 'CLARINET': 'קלרינט', 'TRUMPET': 'חצוצרה',
  'SAXOPHONE': 'סקסופון', 'DRUMS': 'תופים', 'VOICE': 'שירה', 'THEORY': 'תאוריה',
};
```

Admin export button at `/admin/forms/exam-registrations`:
`[ייצא לקובץ Excel]` → downloads `.xlsx` for sending to the Ministry Director by email if preferred, or the Director can pull it directly from the Lyriosa inbox.

---

### 3.6 Record Retention & Archival Engine

---

### 3.7 Record Retention & Archival Engine

```typescript
// Collection: /conservatoriums/{cid}/retentionPolicies/default
interface RetentionPolicy {
  conservatoriumId: string;
  studentRecordRetentionYears: number;   // 7 (per Israeli law)
  financialRecordRetentionYears: number; // 7 (tax law requirement)
  formRetentionYears: number;            // 10 (Ministry recommendation)
  auditLogRetentionYears: number;        // 5
  lastUpdated: Timestamp;
  approvedBy: string;                    // Admin who set the policy
}

// Cloud Function: runs yearly on September 1 (start of Israeli academic year)
export const archiveExpiredRecords = onSchedule('0 0 1 9 *', async () => {
  const conservatoriums = await db.collection('conservatoriums').get();

  for (const consDoc of conservatoriums.docs) {
    const cid = consDoc.id;
    const policy = await getRetentionPolicy(cid);
    const cutoffDate = subYears(new Date(), policy.studentRecordRetentionYears);

    // Find GRADUATED students whose graduation date exceeds retention period
    const expiredStudents = await db
      .collection(`conservatoriums/${cid}/users`)
      .where('role', '==', 'STUDENT_OVER_13')
      .where('enrollmentStatus', '==', 'GRADUATED')
      .where('graduatedAt', '<', Timestamp.fromDate(cutoffDate))
      .get();

    for (const studentDoc of expiredStudents.docs) {
      const student = studentDoc.data() as User;

      // Step 1: Create anonymized archive record (required for statistical reporting)
      await db.doc(`conservatoriums/${cid}/archivedStudents/${student.id}`).set({
        id: student.id,
        instrument: student.instruments?.[0]?.instrument,
        enrolledYear: student.createdAt,
        graduatedYear: student.graduatedAt,
        examLevelAchieved: student.highestExamLevel,
        // All PII stripped:
        firstName: '[מחוק]',
        lastName: '[מחוק]',
        idNumber: '[מחוק]',
        email: '[מחוק]',
        phone: '[מחוק]',
        archivedAt: Timestamp.now(),
      });

      // Step 2: Delete PII from live record
      await studentDoc.ref.update({
        firstName: '[מחוק]',
        lastName: '[מחוק]',
        idNumber: null,
        email: null,
        phone: null,
        photoUrl: null,
        archivedAt: Timestamp.now(),
        piiDeletedAt: Timestamp.now(),
      });

      // Step 3: Log the deletion for compliance
      await db.collection(`conservatoriums/${cid}/complianceLogs`).add({
        action: 'PII_DELETED',
        subjectId: student.id,
        reason: 'RETENTION_POLICY_EXPIRED',
        performedAt: Timestamp.now(),
        performedBy: 'SYSTEM',
        retentionPolicyApplied: policy.studentRecordRetentionYears,
      });
    }
  }
});
```

---

### 3.8 Enrollment Statistics Report

```typescript
// src/lib/reports/enrollment-stats.ts
export interface EnrollmentStatisticsReport {
  conservatoriumId: string;
  reportDate: Date;
  academicYear: string;

  // Required by Ministry
  totalActiveStudents: number;
  byInstrument: Record<string, number>;
  byAgeGroup: {
    under8: number; age8to12: number; age13to18: number; over18: number;
  };
  byGrade: Record<string, number>;
  byFundingSource: {
    municipalFunded: number;
    privatePaying: number;
    scholarship: number;
  };

  // Teacher statistics
  totalActiveTeachers: number;
  teachersByInstrument: Record<string, number>;
  averageStudentsPerTeacher: number;

  // Capacity
  totalLessonsThisMonth: number;
  totalLessonHoursThisMonth: number;
  roomUtilizationPercent: number;

  // Year-over-year
  enrollmentChangePercent: number;
  retentionRate: number;
}

export async function generateEnrollmentReport(
  conservatoriumId: string,
  academicYear: string
): Promise<EnrollmentStatisticsReport> {
  // Aggregate from Firestore — use cached stats where possible
  const liveStats = await getLiveStats(conservatoriumId);
  const students = await getActiveStudents(conservatoriumId);
  const teachers = await getActiveTeachers(conservatoriumId);

  const byInstrument: Record<string, number> = {};
  const byGrade: Record<string, number> = {};
  let byAge = { under8: 0, age8to12: 0, age13to18: 0, over18: 0 };
  let fundingSources = { municipalFunded: 0, privatePaying: 0, scholarship: 0 };

  for (const student of students) {
    const instrument = student.instruments?.[0]?.instrument ?? 'OTHER';
    byInstrument[instrument] = (byInstrument[instrument] ?? 0) + 1;

    const grade = student.grade ?? 'לא ידוע';
    byGrade[grade] = (byGrade[grade] ?? 0) + 1;

    const age = calculateAge(student.dateOfBirth);
    if (age < 8) byAge.under8++;
    else if (age < 13) byAge.age8to12++;
    else if (age < 19) byAge.age13to18++;
    else byAge.over18++;

    if (student.scholarshipId) fundingSources.scholarship++;
    else if (student.municipalFunding) fundingSources.municipalFunded++;
    else fundingSources.privatePaying++;
  }

  return {
    conservatoriumId,
    reportDate: new Date(),
    academicYear,
    totalActiveStudents: students.length,
    byInstrument,
    byAgeGroup: byAge,
    byGrade,
    byFundingSource: fundingSources,
    totalActiveTeachers: teachers.length,
    teachersByInstrument: groupTeachersByInstrument(teachers),
    averageStudentsPerTeacher: students.length / Math.max(teachers.length, 1),
    totalLessonsThisMonth: liveStats.lessonsCompletedThisMonth,
    totalLessonHoursThisMonth: liveStats.lessonHoursThisMonth,
    roomUtilizationPercent: calculateRoomUtilization(conservatoriumId),
    enrollmentChangePercent: await calculateYoYChange(conservatoriumId),
    retentionRate: await calculateRetentionRate(conservatoriumId),
  };
}

// Admin export button at /admin/reports/ministry:
// [ייצא לקובץ Excel — הגשה למשרד החינוך] → downloads .xlsx in Ministry format
// [ייצא PDF — לדיון דירקטוריון] → board-formatted PDF summary
```

---

### 3.9 Board Director Dashboard

Route: `/admin/board` — restricted to `CONSERVATORIUM_ADMIN` with `boardAccess: true` flag

```typescript
// Key widgets for the Board Director dashboard:

// 1. Financial Health Indicator
interface FinancialHealthCard {
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  ytdRevenue: number;
  ytdTarget: number;
  collectionRate: number;    // % of invoices paid on time
  outstandingBalance: number;
  scholarshipFundBalance: number;
}

// 2. Enrollment Trend (5-year view)
// Chart: line graph, Sept 1 of each year, total active students
// Filters: by instrument, by age group

// 3. Faculty Health
interface FacultyHealthCard {
  totalTeachers: number;
  teachersAtCapacity: number;      // >= 90% of maxStudents
  teacherTurnoverThisYear: number; // left / total
  avgTeacherTenureMonths: number;
  avgStudentsPerTeacher: number;
}

// 4. Ministry Compliance Status
interface ComplianceStatusCard {
  pendingFormSubmissions: number;
  overdueFormSubmissions: number;  // past timeout deadline
  examRegistrationsSubmitted: number;
  lastMinistryReportDate?: Date;
  nextReportDueDate: Date;
  retentionPolicyLastReviewed: Date;
}
```

---

## 4. Summary Scorecard

| Area | SDD Coverage | Prototype Implementation | Priority |
|------|-------------|--------------------------|----------|
| Ministry Director Role (MINISTRY_DIRECTOR) | ❌ Not in role taxonomy | ❌ Not implemented | P1 |
| Forms Inbox (www.y-noam.com replacement) | ❌ Not specified | ❌ Not implemented | P1 |
| Form Template Distribution (Director → Consv.) | ❌ Not specified | ❌ Not implemented | P1 |
| Forms Workflow Engine (multi-step approval) | ✅ Full spec | ⚠️ Mock only | P1 |
| Digital Signatures (Legal) | ✅ Field in model | ❌ No canvas/crypto | P1 |
| Bulk PDF/ZIP Export for Director | ❌ Not specified | ❌ Not implemented | P1 |
| Exam Registration Export (Admin use) | ✅ Referenced | ❌ No Excel spec | P1 |
| Record Retention / Archival | ❌ Not documented | ❌ Not implemented | P1 |
| Enrollment Statistics Report | ⚠️ Partial | ❌ Not implemented | P2 |
| Board Director Dashboard | ❌ Not documented | ❌ Not implemented | P2 |
| Audit Log (Immutable) | ⚠️ Type exists | ⚠️ Mock only | P1 |
| Ministry API Integration (pop.gov.il) | ℹ️ Out of scope | N/A — by design | N/A |

**Scope note:** Lyriosa does **not** replace `pop.education.gov.il`. It replaces the Ministry Director of Music's private coordination site (www.y-noam.com) with a modern, digital, multi-party forms workflow. Any submissions that additionally require registration in the national portal remain the conservatorium admin's responsibility via that portal directly.
