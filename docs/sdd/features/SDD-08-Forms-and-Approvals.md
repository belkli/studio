# SDD-08: Forms, Approvals & Ministry Submissions

**Module:** 08  
**Dependencies:** Modules 01, 07  
**Priority:** P1 — Core differentiator vs. competitors

---

## 1. Overview & Rationale

This module is an enhanced evolution of the original Lyriosa forms system. It maintains full backward compatibility with the recital and conference form workflows described in SDD v1.0, while adding: a structured approval dashboard, bulk ministry export, exam registration forms, and a dynamic form builder for admin-created form types.

This is the feature that replaces the government portal at pop.education.gov.il — making form submission, tracking, and archiving a native part of the conservatorium's daily operations rather than a separate, painful process.

---

## 2. Form Types

| Form Type | Hebrew | Submitted By | Approval Chain |
|-----------|--------|-------------|----------------|
| `RECITAL` | טופס נגינה | Student / Teacher | Student → Teacher → Admin |
| `CONFERENCE` | כנס / אירוע | Teacher / Admin | Teacher → Admin |
| `EXAM_REGISTRATION` | הרשמה לבחינה | Teacher | Teacher → Admin → Ministry Export |
| `COMPOSITION_SUBMISSION` | הגשת יצירה | Student | Student → Teacher → Admin |
| `SCHOLARSHIP_REQUEST` | בקשת מלגה | Parent / Student | Student → Admin → Committee |
| `INSTRUMENT_REQUEST` | בקשת כלי נגינה | Teacher | Teacher → Admin |
| `CUSTOM` | מותאם אישית | Configurable | Configurable |

---

## 3. Enhanced Form Model

Building on v1.0, the `FormSubmission` model is extended:

```typescript
{
  id: string;
  type: FormType;
  conservatoriumId: string;
  
  // Submitter
  submittedBy: string;           // userId of creator
  studentId: string;
  teacherId: string;
  
  // Status & Workflow
  status: FormStatus;
  workflowSteps: WorkflowStep[]; // ordered approval chain
  currentStep: number;
  
  // Content
  title: string;
  formData: Record<string, any>; // dynamic fields per form type
  repertoire?: Composition[];
  attachments?: Attachment[];    // uploaded supporting documents
  
  // Approval History
  approvalHistory: {
    stepIndex: number;
    actorId: string;
    action: 'APPROVED' | 'REJECTED' | 'RETURNED_FOR_EDIT';
    comment?: string;
    signature?: string;          // base64 or Storage URL
    timestamp: Timestamp;
  }[];
  
  // Ministry Export
  ministryExportedAt?: Timestamp;
  ministryReferenceNumber?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  pdfUrl?: string;
}
```

### 3.1 Workflow Steps Definition

Each form type has a configurable approval chain:

```typescript
{
  formType: FormType;
  steps: {
    stepIndex: number;
    roleName: string;              // e.g., "Teacher Approval"
    requiredRole: UserRole;
    isRequired: boolean;
    canReturnForEdit: boolean;     // can send back for correction?
    requiresSignature: boolean;
    timeoutDays?: number;          // auto-escalate if no action after X days
  }[];
}
```

---

## 4. Form Submission Flows

### 4.1 Student Submits a Recital Form

1. Student opens `/dashboard/forms/new` → selects Recital
2. Form is pre-filled with student data (locked fields)
3. Student fills repertoire (searchable composer/composition fields)
4. System validates duration vs. grade level → contextual warning if out of range
5. "Save Draft" available at any time (auto-save every 30 seconds)
6. "Submit for Teacher Approval" button → status → `ממתין לאישור מורה`
7. Teacher receives in-app + email notification

### 4.2 Teacher Reviews and Approves

1. Teacher opens `/dashboard/approvals`
2. Sees all forms awaiting their action (filtered queue)
3. Opens form → reads all details in read-only view
4. Can: **Approve** | **Reject** | **Return for Edit** (with comment)
5. On Approve → status → `ממתין לאישור מנהל`
6. Student and Admin notified

### 4.3 Admin Final Approval with Digital Signature

1. Admin opens `/dashboard/approvals`
2. Sees all forms awaiting final approval
3. Reviews form
4. Clicks "Approve & Sign" → signature dialog opens (canvas element)
5. Admin signs with mouse or stylus
6. On confirm: status → `מאושר`
7. PDF generated with: form data + signature + conservatorium stamp
8. Student, teacher, and parent (if applicable) notified with PDF link

### 4.4 Rejection Flow

At any approval step, approver can reject:
1. Must enter a rejection reason (required)
2. Form status → `נדחה`
3. Student receives notification with reason
4. Student can view the form (read-only) with rejection reason displayed
5. Option: "Create new form based on this one" (pre-populates with rejected form's data for easy re-submission)

---

## 5. Exam Registration Form (New)

Ministry of Education music exams require structured registration. This form type connects directly to the exam registration pipeline.

### 5.1 Form Fields

```
Student personal details (pre-filled from profile)
Conservatorium registration number
Instrument
Exam level (Aleph / Bet / Gimel / etc.)
Exam type (Performance / Theory / Both)
Preferred exam date range
Repertoire list (same searchable component as recital form)
Teacher declaration (digital signature)
Admin declaration (digital signature)
```

### 5.2 Batch Ministry Export

At `/admin/forms/exam-export`:
- Admin selects all approved exam registration forms for a given exam period
- System generates a structured Excel/CSV matching the Ministry's required format
- Also generates individual PDFs per student for physical submission if required
- Export is logged with timestamp and exported-by user

---

## 6. Composition Submission Form (New)

For students submitting original compositions (as referenced in the ministry portal):

```
Student details (pre-filled)
Composition title
Genre / Style
Instrumentation
Duration
Score attachment (PDF upload to Firebase Storage)
Audio recording (optional, MP3/WAV upload)
Program notes (text)
Teacher's endorsement note
```

Approval chain: Student → Teacher → Admin → (Ministry Export optional)

---

## 7. Approval Dashboard

`/dashboard/approvals`

Completely redesigned from v1.0 with a focus on speed and clarity:

### 7.1 Queue View
- **My Queue** tab: Forms awaiting the current user's action only
- **All Forms** tab: All forms in the conservatorium (admin only)
- **Overdue** tab: Forms where a step has exceeded the timeout threshold

### 7.2 Bulk Actions (Admin)
- Select multiple forms → Approve All (with one combined signature)
- Export selected forms as a ZIP of PDFs
- Email all selected applicants at once

### 7.3 Form Status Timeline
On every form detail page:
```
[✅ Draft] → [✅ Submitted] → [✅ Teacher Approved: 12.03.2026] → [⏳ Awaiting Admin]
```
Each step shows: who acted, timestamp, any comments.

---

## 8. Dynamic Form Builder (Admin Tool)

`/admin/form-builder`

Site Admins and Conservatorium Admins can create custom form types without code changes.

### 8.1 Form Builder UI
- Drag-and-drop field builder
- Available field types: Text, Number, Date, Dropdown, Checkbox, File Upload, Signature, Section Header
- Each field: label (Hebrew + optional English), required/optional, help text
- Approval chain builder: add/remove/reorder steps, set required role per step

### 8.2 Form Template Publishing
- "Publish" makes the form available to users in the specified roles
- "Archive" removes from active use but preserves all historical submissions
- Versioning: changes create a new version; existing submissions retain their version's fields

---

## 9. PDF Generation

All approved forms generate a professional, RTL-formatted PDF:

- Conservatorium letterhead with logo
- Form title and reference number
- Student/teacher details in a structured layout
- Repertoire table (for recital/conference forms)
- Approval history with timestamps
- Digital signatures rendered as images
- Conservatorium stamp (uploaded image, stored in Firebase Storage)
- QR code linking to the digital form (for verification)

PDFs are stored in Firebase Storage and linked from the form record. Download links are valid for the life of the record.

---

## 10. Archiving & Compliance

- All submitted forms are retained indefinitely (configurable per conservatorium)
- Forms can be searched by: student name, teacher, date range, status, type
- Annual archive export (ZIP of all PDFs for a given year) available to admin
- Audit trail: every field change, every approval action, every PDF download is logged

---

## 11. UI Components Required

| Component | Description |
|-----------|-------------|
| `FormTypeSelector` | Role-aware form type picker on `/forms/new` |
| `RecitalFormV2` | Enhanced recital form (backward compatible) |
| `ConferenceFormV2` | Enhanced conference form |
| `ExamRegistrationForm` | New exam registration form |
| `CompositionSubmissionForm` | New composition form |
| `ApprovalDashboard` | Queue view with bulk actions |
| `FormStatusTimeline` | Visual approval history on form detail page |
| `SignatureDialog` | Canvas-based digital signature capture |
| `FormBuilder` | Admin drag-and-drop form creator |
| `MinistryExportPanel` | Batch exam export UI |
| `FormDetailPage` | Full read-only form view with action buttons |
