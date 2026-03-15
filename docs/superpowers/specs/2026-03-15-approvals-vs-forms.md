# Approvals vs Forms -- Information Architecture Separation

**Date:** 2026-03-15
**Status:** Spec Draft
**Owner:** PM + UX-UA + Architect
**SDD refs:** SDD-08, SDD-FIX-05, SDD-FIX-13

---

## 1. Problem Statement

Users (teachers, admins) are confused by two separate sidebar entries -- **Forms** (`/dashboard/forms`) and **Approvals** (`/dashboard/approvals`) -- that surface overlapping data. A teacher submits a recital form under "Forms" but reviews and approves it under "Approvals". The submitted form appears in Approvals but NOT in Forms (SDD-FIX-13 documents this bug).

The mental model is broken: users don't understand where to go to find their work.

### Current sidebar routing

| Persona | Sees "Forms" | Sees "Approvals" | Sees both? |
|---------|-------------|-----------------|------------|
| Admin   | Yes (under Communication) | Yes (under People) | Yes -- different groups |
| Teacher | Yes (under Community) | Yes (under My Workspace) | Yes -- different groups |
| Student | Yes (under Logistics) | No | No |
| Parent  | Yes (under Finance/Admin) | No | No |

---

## 2. User Stories

### US-1: Teacher submits a recital form
**As a** teacher,
**I want to** submit a recital form and later find it in the same place I submitted it,
**so that** I don't have to remember two different locations.

### US-2: Teacher reviews pending approvals
**As a** teacher,
**I want to** see all forms awaiting my review in a single, clear queue,
**so that** I can approve or reject them quickly without missing any.

### US-3: Admin manages all forms
**As a** conservatorium admin,
**I want to** see all submitted forms (mine, teacher submissions, student submissions) with status filtering,
**so that** I can track what's pending, what's been approved, and what's overdue.

### US-4: Student checks form status
**As a** student,
**I want to** see the status of my submitted forms and any feedback/rejections,
**so that** I know if I need to take action.

### US-5: Parent views child's forms
**As a** parent,
**I want to** see my child's submitted forms and their approval status,
**so that** I'm informed about their academic paperwork.

---

## 3. Proposed Mental Model

### The unified concept: "Forms" is the single home

Forms have a lifecycle: **Draft -> Submitted -> Pending Review -> Approved/Rejected/Revision Required**

Instead of two separate pages, we consolidate into a single `/dashboard/forms` page with smart tabs:

| Tab | Who sees it | What it shows |
|-----|------------|---------------|
| **My Forms** | Everyone | Forms I submitted (drafts, submitted, approved, rejected) |
| **Awaiting My Review** | Teacher, Admin | Forms where I'm the next approver in the workflow chain |
| **All Forms** | Admin only | Every form in the conservatorium, all statuses |
| **Overdue** | Admin only | Forms where a workflow step has exceeded timeout threshold |

### What happens to `/dashboard/approvals`?

**v1:** Keep `/dashboard/approvals` as a redirect to `/dashboard/forms?tab=review`. This prevents broken bookmarks and confusion during transition.

**v2:** Remove the Approvals sidebar entry entirely. The "Awaiting My Review" tab in Forms is the canonical location.

### Sidebar changes (v1)

- Admin: Remove "Approvals" from groupPeople. Add badge count to "Forms" entry showing pending review count.
- Teacher: Remove "Approvals" from groupMyWorkspace. Add badge count to "Forms" entry.
- Student/Parent: No change (they already only see Forms).

---

## 4. Acceptance Criteria

### AC-1: Unified Forms page
- **Given** a teacher with 3 forms awaiting review and 2 forms they submitted
- **When** they open `/dashboard/forms`
- **Then** they see tabs: "My Forms" (2 items) and "Awaiting My Review" (3 items)

### AC-2: Review tab shows actionable items
- **Given** an admin with 5 forms awaiting their approval
- **When** they click the "Awaiting My Review" tab
- **Then** each form shows Approve / Reject / Return for Edit actions inline

### AC-3: Single entry point — no /approvals route
- **Given** this is a greenfield build with no legacy URLs
- **When** the app is deployed
- **Then** only `/dashboard/forms` exists — there is no `/dashboard/approvals` route at all

### AC-4: Badge count on sidebar
- **Given** a teacher with pending review items
- **When** they look at the sidebar
- **Then** the "Forms" nav item shows a badge with the pending count

### AC-5: Admin "All Forms" tab
- **Given** an admin
- **When** they view the "All Forms" tab
- **Then** they see every form in the conservatorium with status filters (Draft, Pending, Approved, Rejected, Revision Required)

### AC-6: Status timeline on every form
- **Given** any user viewing a form detail page
- **When** they open the form
- **Then** they see a visual timeline: Draft -> Submitted -> Teacher Review -> Admin Review -> Final status

### AC-7: Overdue escalation
- **Given** an admin and a form that has been in "Pending Teacher Review" for more than the configured timeout (e.g., 7 days)
- **When** they view the "Overdue" tab
- **Then** the form appears with a visual urgency indicator and the option to reassign

---

## 5. State Machine

```
DRAFT
  |-- user clicks "Submit" --> SUBMITTED (PENDING_TEACHER_REVIEW)

PENDING_TEACHER_REVIEW
  |-- teacher approves --> PENDING_ADMIN_REVIEW
  |-- teacher rejects --> REJECTED
  |-- teacher returns --> REVISION_REQUIRED
  |-- timeout exceeded --> OVERDUE (visual state, underlying status unchanged)

REVISION_REQUIRED
  |-- student edits and resubmits --> PENDING_TEACHER_REVIEW

PENDING_ADMIN_REVIEW
  |-- admin approves --> APPROVED
  |-- admin rejects --> REJECTED
  |-- admin returns --> REVISION_REQUIRED

APPROVED (terminal)
REJECTED (terminal -- but user can clone form to create a new submission)
```

---

## 6. Edge Cases

| Edge Case | Handling |
|-----------|---------|
| Form type with no teacher step (e.g., Scholarship Request) | Skip PENDING_TEACHER_REVIEW, go directly to PENDING_ADMIN_REVIEW |
| Form type with custom approval chain (Form Builder) | Follow the chain defined in the form template's `workflowSteps` |
| Teacher and admin are the same person | Single approval step; skip teacher review |
| Delegated admin with restricted sections | Only show forms matching their delegated section permissions |
| Bulk approve | Admin selects multiple forms in "Awaiting My Review" tab, clicks "Approve All". Signature dialog appears once for all selected forms. |
| Form submitted but teacher left the conservatorium | Admin sees the form in "Overdue" and can reassign to another teacher |
| Student resubmits after revision required | Form returns to PENDING_TEACHER_REVIEW with the revision note visible |

---

## 7. v1 vs v2

### v1 (ship now)
- Unified `/dashboard/forms` with tabs: My Forms, Awaiting My Review, All Forms
- No `/dashboard/approvals` route (clean design, single entry point)
- Sidebar badge count for pending reviews
- Clean form state machine: DRAFT -> PENDING_TEACHER -> PENDING_ADMIN -> APPROVED/REJECTED/REVISION_REQUIRED

### v2 (future)
- Form Builder integration: custom forms appear in the same tab system
- Ministry Export tab (admin only): batch export approved exam forms
- PDF generation for all approved forms with digital signatures
- Audit trail view per form

---

## 8. Technical Notes (for Architect)

### Routing
- `/dashboard/forms` -- main page with `?tab=mine|review|all|overdue` query param
- `/dashboard/forms/[id]` -- form detail + approval actions
- `/dashboard/forms/new` -- create new form (select type)

### Data filtering for "Awaiting My Review"
```typescript
const awaitingMyReview = forms.filter(form => {
  if (form.status === 'DRAFT' || form.status === 'APPROVED' || form.status === 'REJECTED') return false;
  const currentStep = form.workflowSteps[form.currentStep];
  if (!currentStep) return false;
  // Direct assignment
  if (currentStep.assignedToUserId === currentUser.id) return true;
  // Role-based (unassigned)
  if (!currentStep.assignedToUserId && currentStep.requiredRole === currentUser.role) return true;
  return false;
});
```

### Sidebar badge
Badge count = `awaitingMyReview.length` computed in the sidebar component (or via a lightweight API/context value).

---

## 9. Security Considerations

- Tenant isolation: forms MUST be filtered by `conservatoriumId` (SDD-FIX from 47229cb)
- Role-based access: students see only their own forms; teachers see their own + assigned for review; admin sees all within conservatorium
- Delegated admin respects `delegatedAdminPermissions` -- only forms in their allowed sections
