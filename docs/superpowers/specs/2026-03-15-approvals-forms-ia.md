# Approvals vs Forms -- Information Architecture Separation

**Date:** 2026-03-15
**Author:** Architect Agent
**Status:** DRAFT -- ready for team review

---

## 1. Current State Analysis

### Routes
| Route | Component | Purpose |
|---|---|---|
| `/dashboard/forms` | `forms/page.tsx` + `forms-list.tsx` | Lists all form submissions visible to the user, filtered by role. Tabs: All / Pending / Approved / Drafts. |
| `/dashboard/approvals` | `approvals/page.tsx` | Action queue: forms requiring the current user's decision. Tabs: My Queue / All Open / Overdue (disabled). |
| `/dashboard/forms/[id]` | `forms/[id]/page.tsx` | Detail view for a single form (view + edit-if-revision). |
| `/dashboard/forms/new` | `forms/new/page.tsx` | Create new form submission. |

### Overlap Problem
Both pages render `FormSubmission[]` from `useAuth().formSubmissions`. The difference is _intent_:
- **Forms page** = "my filing cabinet" -- everything I submitted, was assigned to, or am responsible for.
- **Approvals page** = "my inbox" -- things that need my action _right now_.

The overlap creates confusion because:
1. The same form appears in both lists at different points in its lifecycle.
2. Both pages have action buttons (approve/reject), making it unclear which is the canonical place to act.
3. The URL structure suggests two separate concepts, but the data source is identical.

---

## 2. Architectural Decision: Two Pages, Clear Contracts

**Decision:** Keep both routes but sharpen their contracts.

### Forms Page (`/dashboard/forms`)
- **Mental model:** "My documents" -- a read-heavy archive.
- **Who sees it:** All roles (student, teacher, parent, admin, site_admin, ministry_director).
- **Content:** All forms the user has visibility into (submitted by them, assigned to them, or within their conservatorium).
- **Actions:** View detail, create new, resume draft. **No approve/reject buttons** on this page.
- **Tabs:** All | Pending | Approved | Drafts | Rejected (add Rejected tab).
- **Search:** Already exists. Add formType filter dropdown.

### Approvals Page (`/dashboard/approvals`)
- **Mental model:** "My action queue" -- a write-heavy decision center.
- **Who sees it:** Roles with approval authority: `teacher`, `conservatorium_admin`, `delegated_admin`, `site_admin`, `ministry_director`.
- **Content:** Only forms in the user's approval queue (status matching their role's step in the chain).
- **Actions:** Approve, Reject, Request Revision, Bulk actions. **This is the only place to approve/reject.**
- **Tabs:** My Queue (default, with badge count) | All Open | Overdue (implement with SLA check).

### Form Detail Page (`/dashboard/forms/[id]`)
- Serves both reading and acting.
- When accessed from Approvals, show action bar at top: Approve / Reject / Request Revision.
- When accessed from Forms, show read-only detail with status timeline.
- Implementation: pass `?action=true` query param when linking from approvals page. The detail page reads this param to show/hide the action bar.
- **SEC-FORM-10: `?action=true` is a UI hint only -- it MUST NOT grant authority.** The detail page always checks `user.role` + form status server-side to determine if action is allowed, regardless of query param. A user who manually adds `?action=true` to a URL they shouldn't act on will see the action bar but all buttons will be disabled/hidden by the role+status check.

---

## 3. Data Model

### FormStatus (greenfield design)

The current `FormStatus` enum is clean and correct. No changes needed:

```typescript
export type FormStatus =
  | 'DRAFT'              // Student/parent started but not submitted
  | 'PENDING_TEACHER'    // Awaiting teacher review
  | 'PENDING_ADMIN'      // Awaiting admin review
  | 'REVISION_REQUIRED'  // Returned for revision (by admin or ministry)
  | 'APPROVED'           // Admin approved; if ministry required, awaits ministry
  | 'FINAL_APPROVED'     // Ministry approved (terminal)
  | 'REJECTED';          // Rejected (terminal)
```

No changes needed to `FormSubmission` type. The separation is purely at the UI/routing layer.

### Client-side derived state:

```typescript
// Proposed helper: src/lib/form-utils.ts
export function isInUserApprovalQueue(form: FormSubmission, user: User): boolean {
  switch (user.role) {
    case 'teacher':
      return form.status === 'PENDING_TEACHER' && user.students?.includes(form.studentId);
    case 'delegated_admin':
    case 'conservatorium_admin':
      return (form.status === 'PENDING_ADMIN' || form.status === 'REVISION_REQUIRED')
        && form.conservatoriumId === user.conservatoriumId;
    case 'site_admin':
      return form.status === 'PENDING_ADMIN' || form.status === 'REVISION_REQUIRED';
    case 'ministry_director':
      return form.status === 'APPROVED';
    default:
      return false;
  }
}
```

This logic lives in `approvals/page.tsx` (lines 191-207). Place it in `src/lib/form-utils.ts` so the sidebar badge count can also use it.

---

## 4. Sidebar Navigation Changes

```
Admin group:
  Forms & Documents  -> /dashboard/forms      (FileText icon)
  Approvals (3)      -> /dashboard/approvals   (BadgeCheck icon, with live count badge)

Teacher group:
  My Forms           -> /dashboard/forms       (FileText icon)
  Approvals (1)      -> /dashboard/approvals   (BadgeCheck icon, with live count badge)

Student/Parent group:
  My Forms           -> /dashboard/forms       (FileText icon)
  [No approvals link -- they have nothing to approve]
```

The badge count on the sidebar uses `isInUserApprovalQueue()` to show the number of pending items. This provides a persistent visual cue.

---

## 5. Notification Routing

When a form transitions to a status requiring action:
- Notification `link` field MUST point to `/dashboard/approvals` (not `/dashboard/forms`).
- The notification title should describe the action needed, e.g., "New form awaiting your approval".
- Clicking the notification takes the user to their approval queue where the form is visible.

For form status updates that are informational (approved, rejected):
- Notification `link` points to `/dashboard/forms/{formId}` (the detail page).

---

## 6. Security Considerations

### Tenant isolation (already enforced)
- `forms-list.tsx` filters by `user.conservatoriumId` for admin roles.
- `approvals/page.tsx` filters by conservatoriumId and student ownership.

### Access control on detail page
- `/dashboard/forms/[id]` must verify:
  1. The user has visibility into this form (same conservatorium, or is the student/parent/teacher).
  2. If `?action=true`, the user has the right role AND the form is in the right status for their action.
- Currently this is client-side only. **Recommendation:** Add a server-side check in the form detail page's data fetching to prevent URL guessing.

### Bulk action authorization
- Bulk approve/reject on the approvals page currently filters from `myQueue` (client-side).
- The `updateForm` function in `useAuth` does not re-validate authorization.
- **Recommendation:** When moving to server actions, `upsertFormSubmissionAction` should verify the user has authority to transition to the requested status. This is a security task (flag for security agent).

---

## 7. Overdue Tab Implementation

The "Overdue" tab is currently disabled. To implement:

```typescript
// In form-utils.ts
export function isOverdue(form: FormSubmission, slaDays: number = 7): boolean {
  if (!['PENDING_TEACHER', 'PENDING_ADMIN', 'REVISION_REQUIRED'].includes(form.status)) {
    return false;
  }
  const submitted = new Date(form.submissionDate);
  const now = new Date();
  const diffDays = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > slaDays;
}
```

- Default SLA: 7 days (configurable per conservatorium in future).
- Overdue forms are highlighted with a red badge in the table.
- The overdue tab shows forms from `allPending` that pass `isOverdue()`.

---

## 8. Empty States (per role)

| Role | Forms page (empty) | Approvals page (empty) |
|---|---|---|
| Student | "No forms submitted yet. Start with a new form." + CTA button | N/A -- not in sidebar |
| Teacher | "No forms assigned to you yet." | "All caught up -- no forms need your review." |
| Admin | "No forms in your conservatorium yet." | "All caught up -- no pending approvals." |
| Ministry | N/A (they see all forms system-wide) | "No forms awaiting ministry review." |

---

## 9. Implementation Steps (Greenfield)

**Note:** This is greenfield -- no production users, no migration guards needed. Build it right from scratch.

### Phase 1: Security Foundation
1. Refactor `withAuth()` to accept `{ roles }` parameter (BLOCKING-SEC-01).
2. Implement `canTransition()` form status authorization matrix in `src/lib/form-transition-auth.ts` (SEC-FORM-09).
3. Add conservatoriumId server-side override to `upsertFormSubmissionAction` (SEC-CROSS-03).
4. Add server-side ownership check to form detail data fetching (SEC-FORM-01).

### Phase 2: Core Implementation
5. Create `src/lib/form-utils.ts` with `isInUserApprovalQueue()` and `isOverdue()`.
6. Build the Approvals page (`/dashboard/approvals`) with My Queue / All Open / Overdue tabs, bulk actions, and proper empty states.
7. Build the Forms page (`/dashboard/forms`) as read-only archive with All / Pending / Approved / Drafts / Rejected tabs and search. No approve/reject buttons.
8. Build the form detail page (`/dashboard/forms/[id]`) with conditional action bar: `?from=approvals` shows actions (gated by `canTransition()`), otherwise read-only.

### Phase 3: Integration
9. Add sidebar badge count using `isInUserApprovalQueue()`, with `aria-live="polite"`.
10. Wire notification routing: action-required notifications link to `/dashboard/approvals`, informational notifications link to `/dashboard/forms/{formId}`.

---

## UX & Accessibility Addendum (UX-UA Agent)

### A1. Wireframe — Approvals Empty State

Uses existing `EmptyState` component from `src/components/ui/empty-state.tsx`.

```
+------------------------------------------+
|     (CheckCircle icon, 40x40, muted)     |
|                                          |
|    All caught up!                        |
|    No forms are waiting for your         |
|    review right now.                     |
|                                          |
|    [View all forms ->]                   |
+------------------------------------------+
```

### A2. Wireframe — Forms Empty State (per tab)

All tab:
```
+------------------------------------------+
|     (FileText icon, 40x40, muted)        |
|                                          |
|    No forms yet                          |
|    Forms you submit or receive will      |
|    appear here.                          |
|                                          |
|    [Submit a new form]                   |
+------------------------------------------+
```

Drafts tab:
```
+------------------------------------------+
|     (PenLine icon, 40x40, muted)         |
|                                          |
|    No drafts                             |
|    Start a new form and save it as a     |
|    draft to continue later.              |
|                                          |
|    [Start a new form]                    |
+------------------------------------------+
```

### A3. Wireframe — Form Detail Page Action Bar

```
+-------------------------------------------------+
| <- Back to [Approvals | Forms]                  |
+-------------------------------------------------+
| Card: Form Details                              |
|                                                 |
| Type: Transfer Request    Status: PENDING_ADMIN |
| Student: Yael Cohen                             |
| Conservatorium: Hod HaSharon                    |
| Submitted: 12/03/2026                           |
|                                                 |
| --- Form Content (read-only fields) ---         |
|                                                 |
| --- Action Section (conditional) ---            |
| Note to submitter:                              |
| [textarea for optional comment]                 |
|                                                 |
| [Approve]  [Request Revision]  [Reject]         |
+-------------------------------------------------+
```

Back link: use `searchParams.from=approvals` to track origin, default "Back to Forms".

### A4. RTL Behavior

- All tables use `text-start` (not `text-left`) -- already implemented
- Bulk action bar: selected count on start side, buttons on end side (`ms-auto`)
- Back link arrow: `<ArrowRight>` in RTL, `<ArrowLeft>` in LTR
- Badge positioning: `ms-2` not `ml-2`
- Tab order: visually mirrors in RTL but DOM order unchanged (Radix handles this)

### A5. Accessibility Requirements

- **Bulk select**: "Select all" checkbox has `aria-label={t('selectAll')}` -- already implemented
- **Row checkboxes**: `aria-label={t('selectRow')}` -- already implemented
- **Tab badge**: `aria-label={t('pendingCount', { count })}` -- new
- **Status badges**: semantic color + text (not color-only) -- already implemented via StatusBadge
- **Focus management**: after bulk action, focus returns to bulk action bar or first remaining row
- **Keyboard**: Tab through rows, Enter to open detail, Space to toggle checkbox
- **Live region**: sidebar badge count should be `aria-live="polite"` for screen readers

### A6. i18n String Keys (New)

**Namespace: `ApprovalsPage`** (new keys only):
- `emptyTitle` -- "All caught up!"
- `emptyDesc` -- "No forms are waiting for your review right now."
- `viewAllForms` -- "View all forms"
- `pendingCount` -- "{count} pending"
- `backToApprovals` -- "Back to Approvals"

**Namespace: `FormsPage`** (new keys only):
- `emptyAllTitle` -- "No forms yet"
- `emptyAllDesc` -- "Forms you submit or receive will appear here."
- `emptyDraftsTitle` -- "No drafts"
- `emptyDraftsDesc` -- "Start a new form and save it as a draft to continue later."
- `startNewForm` -- "Start a new form"
- `backToForms` -- "Back to Forms"
- `formNotFound` -- "Form not found"

### A7. Component Mapping

| UI Element | shadcn Component | Notes |
|-----------|---------|-------|
| Approvals page | `Tabs` + `Table` + `Checkbox` | Existing, add EmptyState per tab |
| Forms page | `Tabs` + `Table` + `Input` search | Existing, add EmptyState per tab |
| Form detail back link | `Button` variant="ghost" + `Link` | New: dynamic text based on origin |
| Sidebar badge | `Badge` variant="destructive" size="sm" | New: live count, `aria-live="polite"` |
| Empty states | `EmptyState` component | Existing reusable component |

---

## Security Addendum (Response to BLOCKING-SEC-01, SEC-CROSS-03)

### S1. `withAuth()` Must Enforce Roles for Form Status Transitions

**Problem (BLOCKING-SEC-01):** `withAuth()` in `src/lib/auth-utils.ts:145-178` only calls `verifyAuth()` -- it does NOT enforce roles. The existing `upsertFormSubmissionAction` can be called by ANY authenticated user to set ANY status, bypassing the entire approval chain.

**Required fix before this feature ships:**

Option A (preferred): Extend `withAuth()` signature to accept allowed roles:

```typescript
export function withAuth<Schema, R>(
  schema: Schema,
  options: { roles?: UserRole[] },
  action: (input: Schema['_output'], claims: HarmoniaClaims) => Promise<R>
) {
  return async (input: Schema['_input']): Promise<R> => {
    const claims = options.roles
      ? await requireRole(options.roles)
      : await verifyAuth();
    const parsedInput = schema.parse(input);
    return await action(parsedInput, claims);  // Pass claims so action can use conservatoriumId
  };
}
```

Option B: Call `requireRole()` inside each action body (more verbose, easier to forget).

**Recommendation:** Option A. It makes the role requirement declarative and visible at the action definition site. Add an ESLint rule or code review checklist item requiring all new actions to specify roles.

### S2. Form Status Transition Authorization Matrix

Even with role enforcement, we need fine-grained transition validation. A teacher calling the upsert action should NOT be able to set `status: 'FINAL_APPROVED'`.

```typescript
// Proposed: src/lib/form-transition-auth.ts
const ALLOWED_TRANSITIONS: Partial<Record<UserRole, Record<FormStatus, FormStatus[]>>> = {
  student: {
    DRAFT: ['PENDING_TEACHER'],                // submit form
    REVISION_REQUIRED: ['PENDING_TEACHER'],    // resubmit after revision
  },
  parent: {
    DRAFT: ['PENDING_TEACHER'],                // submit on behalf of child
    REVISION_REQUIRED: ['PENDING_TEACHER'],    // resubmit after revision
  },
  teacher: {
    PENDING_TEACHER: ['PENDING_ADMIN'],        // approve -> advance to admin
    REVISION_REQUIRED: ['PENDING_ADMIN'],      // re-review after student resubmits
  },
  conservatorium_admin: {
    PENDING_ADMIN: ['APPROVED', 'REVISION_REQUIRED', 'REJECTED'],
    REVISION_REQUIRED: ['APPROVED', 'REJECTED'],
  },
  delegated_admin: {
    PENDING_ADMIN: ['APPROVED', 'REVISION_REQUIRED', 'REJECTED'],
    REVISION_REQUIRED: ['APPROVED', 'REJECTED'],
  },
  // site_admin: wildcard bypass -- handled below, not in the matrix
  ministry_director: {
    APPROVED: ['FINAL_APPROVED', 'REVISION_REQUIRED'],
  },
};

export function canTransition(role: UserRole, fromStatus: FormStatus, toStatus: FormStatus): boolean {
  // site_admin bypasses the matrix entirely (SEC-FORM-09: "any -> any")
  if (role === 'site_admin') return true;
  return ALLOWED_TRANSITIONS[role]?.[fromStatus]?.includes(toStatus) ?? false;
}
```

The `upsertFormSubmissionAction` must call `canTransition()` before persisting. Reject with `FORBIDDEN` if the transition is not allowed.

### S3. conservatoriumId Override (SEC-CROSS-03)

For all form write operations, the server action must:
1. Read `claims.conservatoriumId` from the verified auth claims.
2. For non-`site_admin` callers: override the client-supplied `conservatoriumId` with the claims value.
3. For `site_admin`: allow the client-supplied value (they operate cross-tenant).

```typescript
// Inside upsertFormSubmissionAction:
const claims = await requireRole(['teacher', 'conservatorium_admin', 'delegated_admin', 'site_admin', 'ministry_director']);
if (!GLOBAL_ADMIN_ROLES.includes(claims.role)) {
  payload.conservatoriumId = claims.conservatoriumId;  // Override client value
}
```

### S4. Updated Migration Path (prepend security steps)

Insert before step 1:
- **0a.** Refactor `withAuth()` to accept `roles` parameter (BLOCKING-SEC-01).
- **0b.** Add form status transition authorization matrix (S2 above).
- **0c.** Add conservatoriumId server-side override to `upsertFormSubmissionAction` (SEC-CROSS-03).
- **0d.** Add server-side ownership check to form detail data fetching.

---

## 11. Product Requirements (PM)

### User Stories

**US-1:** As a teacher, I want to submit a recital form and later find it in the same place I submitted it, so that I don't have to remember two different locations.

**US-2:** As a teacher, I want to see all forms awaiting my review in a single clear queue with the count visible in the sidebar, so that I can approve or reject them quickly without missing any.

**US-3:** As a conservatorium admin, I want to see all submitted forms (mine, teacher submissions, student submissions) with status filtering, so that I can track what's pending, approved, and overdue.

**US-4:** As a student, I want to see the status of my submitted forms and any feedback/rejections in one place, so that I know if I need to take action.

**US-5:** As a parent, I want to see my child's submitted forms and their approval status, so that I'm informed about their academic paperwork.

### Acceptance Criteria

**AC-1: Forms page shows everything, Approvals shows action items only**
- Given a teacher with 3 forms awaiting review and 2 forms they submitted
- When they open `/dashboard/forms`, they see all 5 forms across all statuses
- When they open `/dashboard/approvals`, they see only the 3 forms needing their action

**AC-2: No approve/reject on Forms page**
- Given a teacher viewing the Forms page
- When they look at a form in PENDING_TEACHER status
- Then no approve/reject buttons are visible (only "View" link)

**AC-3: Approve/reject only on Approvals page and form detail**
- Given a teacher on the Approvals page
- When they click a form to view details
- Then the action bar shows Approve / Request Revision / Reject buttons

**AC-4: Sidebar badge count**
- Given a teacher with 3 pending review items
- When they look at the sidebar
- Then the "Approvals" nav item shows a badge with "3"

**AC-5: Overdue tab**
- Given an admin and a form that has been pending for 10 days (SLA = 7 days)
- When they view the "Overdue" tab on the Approvals page
- Then the form appears with a red urgency indicator

**AC-6: Form detail from Approvals context**
- Given a teacher clicking a form from the Approvals page
- When the detail page opens
- Then a "Back to Approvals" link is shown (not "Back to Forms")
- And the action bar is visible at the top

### Edge Cases

| Edge Case | Handling |
|-----------|---------|
| Form type with no teacher step (e.g., Scholarship Request) | Goes directly to PENDING_ADMIN. Teacher does not see it in their approvals queue. |
| Form type with custom approval chain (Form Builder) | Follow the chain defined in the form template's workflowSteps |
| Teacher and admin are the same person | May see the form in their queue for both steps sequentially |
| Delegated admin with restricted sections | Only see forms matching their delegatedAdminPermissions |
| Bulk approve | Admin selects multiple, clicks "Approve All". One signature dialog for all. |
| Teacher left the conservatorium with pending forms | Admin sees overdue forms and can reassign |
| Student resubmits after revision required | Form returns to PENDING_TEACHER with revision note visible |
| No forms in system | Each tab shows appropriate empty state with CTA to create a form |

### v1 vs v2

**v1 (ship now):**
- Clear separation: Forms = archive, Approvals = action queue
- Sidebar badge count for pending approvals
- No approve/reject on Forms page
- Overdue tab with 7-day SLA
- Form detail page with conditional action bar
- Empty states per tab per role
- Notification routing: action-required -> /approvals, info -> /forms/[id]

**v2 (future):**
- Configurable SLA per form type per conservatorium
- Auto-escalation: overdue forms auto-assign to admin if teacher doesn't act
- Ministry Export tab (admin only): batch export approved exam forms
- PDF generation for all approved forms with digital signatures
- Form version history (track all edits)
- Audit trail view per form

---

## UI/UX Pro Max Review (Main Session)

**Design System Applied:** Data-Dense Dashboard · Noto Sans Hebrew · Harmonia palette

### UX Quality Checklist

| Check | Approvals page | Forms page | Form detail |
|---|---|---|---|
| 44px min touch targets on all action buttons | ✅ required | ✅ required | ✅ required |
| `cursor-pointer` on all clickable rows/cards | ⚠️ add to spec | ⚠️ add to spec | ✅ |
| `role="alert"` on error messages, `aria-live="polite"` on badge count | ✅ in spec | — | ✅ |
| Blur validation on forms (not submit-only) | — | — | ✅ required for reject reason |
| `prefers-reduced-motion` on tab transitions | ⚠️ add | ⚠️ add | — |
| Loading skeleton while fetching forms list | ⚠️ missing from spec | ⚠️ missing | — |
| `transition-colors duration-200` on row hover | ⚠️ add | ⚠️ add | — |

### Greenfield State Machine (REVISED — no migration constraints)

The previous spec preserved the existing confused state. Clean design:

```
FormStatus (REVISED):
  DRAFT                    → creator saves but hasn't submitted
  SUBMITTED                → submitted, pending first reviewer
  PENDING_TEACHER_REVIEW   → teacher must act (recital, exam)
  PENDING_ADMIN_REVIEW     → admin must act
  PENDING_MINISTRY_REVIEW  → ministry director must act (exam registration only)
  APPROVED                 → all required approvals obtained
  REJECTED                 → rejected at any stage (with rejectorId + reason)
  WITHDRAWN                → creator withdrew before approval
```

**What changed from current code:**
- `PENDING_TEACHER` → `PENDING_TEACHER_REVIEW` (clearer)
- Remove ambiguous intermediate states
- Add `DRAFT` (creator can save without submitting)
- Add `WITHDRAWN` (replaces delete)
- `REJECTED` is terminal (not re-editable in v1; add revision cycle in v2)

### Page Responsibility (Greenfield)

| Page | Shows | Does NOT show |
|---|---|---|
| `/dashboard/approvals` | Items where **current user** is the next required actor | Anything not in user's action queue |
| `/dashboard/forms` | **All forms the user has visibility into** (submitted by them, or under their jurisdiction) | Nothing — full archive |
| `/dashboard/forms/[id]` | Full form detail + audit trail | Approve/reject buttons (those only render when `isInApprovalQueue(form, user)`) |

### Component Refinements

- **Row hover**: `className="cursor-pointer hover:bg-muted/50 transition-colors duration-150"` on every `<TableRow>`
- **Skeleton loader**: `<Skeleton className="h-10 w-full" />` × 5 rows while fetching, not a spinner
- **Badge on sidebar**: `<Badge variant="destructive" className="ms-auto tabular-nums">` — use `tabular-nums` so count doesn't shift layout
- **Reject reason dialog**: `<Textarea>` with `onBlur` validation (not submit-only), `minLength={10}`, `aria-describedby` pointing to character count
- **Form detail action bar**: sticky `bottom-0 bg-background border-t p-4` — stays visible while scrolling long form content

### RTL Additions

- Sidebar badge: `ms-auto` (not `ml-auto`) — already noted but confirm in implementation
- Form detail action bar on mobile: full-width buttons stacked vertically, not side by side (both "Approve" and "Reject" need 44px height minimum)
- Status badge on rows: `<Badge className="text-xs">` — avoid `dir` mismatch if status is English enum displayed in Hebrew UI (always translate via `tApprovals('statuses.PENDING_TEACHER_REVIEW')`)

### Missing i18n Keys (additions)

Add to `ApprovalsPage` namespace:
```json
"statuses": {
  "DRAFT": "...",
  "SUBMITTED": "...",
  "PENDING_TEACHER_REVIEW": "...",
  "PENDING_ADMIN_REVIEW": "...",
  "PENDING_MINISTRY_REVIEW": "...",
  "APPROVED": "...",
  "REJECTED": "...",
  "WITHDRAWN": "..."
},
"rejectReasonPlaceholder": "...",
"rejectReasonMinLength": "...",
"withdrawConfirmTitle": "...",
"withdrawConfirmDesc": "...",
"skeletonLoading": "..."
```

---

## Security UX Addendum — Minimal Columns in Forms List (SEC-CONSTRAINT-5)

### Problem

The forms list page (`/dashboard/forms`) could expose sensitive data (signatures, detailed comments, repertoire specifics) in the table view. If the table renders all fields, a user scrolling through the list sees data that should only be visible in the detail context — increasing the attack surface for shoulder-surfing and accidental data exposure.

### Design Decision: Minimal columns in list view, full data on detail page only

**Decision:** The forms list table shows exactly 5 columns. All other data loads only on the detail page.

### Forms List Table Columns (v1)

| Column | Field | Notes |
|--------|-------|-------|
| Form Type | `formType` | Translated via `tForms('formTypes.' + formType)` |
| Student Name | `studentName` | First name + last initial only in list view (e.g., "Yael C.") |
| Status | `status` | `StatusBadge` component (color + text) |
| Date | `submissionDate` | Formatted per locale (`Intl.DateTimeFormat`) |
| Actions | — | "View" link only (no approve/reject in list) |

### What is NOT shown in the list

These fields load only on the detail page (`/dashboard/forms/[id]`):

- Signature data (`signatureDataUrl`, `signatureHash`)
- Reviewer comments / revision notes
- Repertoire details (piece names, instrument assignments)
- Attached files / documents
- Full student name (list uses abbreviated form)
- Parent contact information
- Form content fields (the actual form body)

### Student Name Abbreviation

```typescript
function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
// "Yael Cohen" -> "Yael C."
// "דוד המלך" -> "דוד ה."
```

**Rationale:** The abbreviated name is sufficient to identify the student in context (the admin knows their students). Full names are available on click-through. This reduces PII exposure in the list view.

### Approvals Table Columns

The approvals page (`/dashboard/approvals`) uses the same minimal columns plus one extra:

| Column | Field | Notes |
|--------|-------|-------|
| Form Type | `formType` | Translated |
| Student Name | `studentName` | Abbreviated (first + last initial) |
| Status | `status` | `StatusBadge` |
| Waiting Since | derived from `submissionDate` | Relative time ("3 days ago") for urgency |
| Actions | — | "Review" link (opens detail with action bar) |

### Wireframe — Minimal Forms List

```
+------------------------------------------------------+
| Forms & Documents                    [+ New Form]    |
| All | Pending | Approved | Drafts | Rejected         |
+------------------------------------------------------+
| Type           | Student   | Status    | Date    |   |
|----------------|-----------|-----------|---------|---|
| Transfer Req.  | Yael C.   | Pending   | 12 Mar  | > |
| Exam Reg.      | David H.  | Approved  | 10 Mar  | > |
| Recital Form   | Sara A.   | Draft     | 08 Mar  | > |
+------------------------------------------------------+
```

### Mobile (375px)

On mobile, the table collapses to a card list with only 3 visible fields:
- **Form Type** (bold, primary text)
- **Student Name** (abbreviated) + **Status Badge** (same row)
- **Date** (muted, small text)

Tap card to navigate to detail page.

### Accessibility

- Abbreviated name has `title` attribute with full name for tooltip on hover
- Screen readers get `aria-label` with full name: `aria-label={t('formByStudent', { student: fullName })}`
- "View" / "Review" links have `aria-label={t('viewForm', { type: formType, student: abbreviatedName })}`

### i18n Keys (new)

Namespace: `FormsPage`:
- `columnFormType` — "Form Type"
- `columnStudent` — "Student"
- `columnStatus` — "Status"
- `columnDate` — "Date"
- `columnActions` — "Actions"
- `viewDetail` — "View"
- `formByStudent` — "Form by {student}"
- `viewForm` — "View {type} form by {student}"

Namespace: `ApprovalsPage`:
- `columnWaitingSince` — "Waiting Since"
- `reviewAction` — "Review"
- `reviewForm` — "Review {type} form by {student}"
