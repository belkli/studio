# QA Plan: Admin Features (07)

> Covers all admin-specific pages, actions, and workflows accessible to `conservatorium_admin`, `site_admin`, and `ministry_director` roles.

---

## Coverage Map

| Feature Area | Routes |
|---|---|
| Command Center | `/dashboard/admin` |
| User Management | `/dashboard/users` |
| Enrollment (Admin) | `/dashboard/enroll` |
| Approvals / Form Queue | `/dashboard/approvals` |
| Announcements | `/dashboard/announcements` |
| Events CRUD | `/dashboard/events`, `/dashboard/events/new`, `/dashboard/events/[id]`, `/dashboard/events/[id]/edit` |
| Form Builder | `/dashboard/admin/form-builder` |
| Forms List & Detail | `/dashboard/forms`, `/dashboard/forms/new`, `/dashboard/forms/[id]` |
| Open Day | `/dashboard/admin/open-day` |
| Waitlists | `/dashboard/admin/waitlists` |
| Substitute Management | `/dashboard/admin/substitute` |
| Branches | `/dashboard/admin/branches` |
| Performances | `/dashboard/admin/performances` |
| Notifications (Sender) | `/dashboard/admin/notifications` |
| Notification Audit Log | `/dashboard/admin/notifications/log` |
| Ministry Inbox (Admin) | `/dashboard/admin/ministry` |
| Ministry Dashboard | `/dashboard/ministry` |
| Ministry Export | `/dashboard/ministry-export` |
| Playing School Admin | `/dashboard/admin/playing-school` |
| Playing School Distribute | `/dashboard/admin/playing-school/distribute` |
| School Coordinator | `/dashboard/school` |

---

## Existing Coverage (do not duplicate)

- `e2e/personas/admin.spec.ts` — page-load smoke tests for all admin routes
- `e2e/personas/ministry.spec.ts` — ministry dashboard and export page load
- `e2e/flows/admin-approve-flow.spec.ts` — users page, approvals page, enroll page, substitute page load checks

All scenarios below target **behaviour beyond mere page load**.

---

## Scenario ADM-01: Admin Command Center Stats

**Name:** Admin command center displays KPI summary cards
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** Mock data with students, teachers, lessons, pending registrations
**Steps:**
1. Navigate to `/dashboard/admin`
2. Wait for `AdminCommandCenter` component to hydrate
3. Assert at least 4 stat cards are visible (students, teachers, lessons, pending)
4. Assert no error UI or 404 title

**Expected Results:** KPI cards render with numeric values; no skeleton after hydration
**DB Backend:** mock
**Locales:** he, en
**Mock Data:** Standard seed — students, teachers, lessons, form submissions
**Security:** Non-admin role (student) navigating to `/dashboard/admin` must not see admin content; `useAdminGuard` should redirect

---

## Scenario ADM-02: User Management — Tabs and Search

**Name:** Users page shows approved and pending tabs; search filters list
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** Mock data with approved and pending (unapproved) users in the same conservatorium
**Steps:**
1. Navigate to `/dashboard/users`
2. Assert default tab is "Approved" (active)
3. Assert approved user list is non-empty
4. Click "Pending" tab
5. Assert pending user list is visible
6. Return to "Approved" tab; type name substring in search input
7. Assert table rows filter to matching names only

**Expected Results:** Tab switch updates table; search filters in real time; no page reload
**DB Backend:** mock
**Locales:** he
**Mock Data:** At least one approved student and one pending user in `cons-15`
**Security:** `conservatorium_admin` of cons-15 must not see users from cons-66 in their list

---

## Scenario ADM-03: User Management — Approve Pending User

**Name:** Admin approves a pending user registration
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** At least one user with `approved: false`
**Steps:**
1. Navigate to `/dashboard/users?tab=pending`
2. Find first pending user row
3. Click "Approve" button
4. Assert toast notification "User Approved" appears
5. Assert the user row disappears from pending list
6. Switch to "Approved" tab
7. Assert approved count increased by 1

**Expected Results:** Approval is reflected immediately in UI state; `approveUser()` called
**DB Backend:** mock
**Locales:** he, en
**Mock Data:** `student-user-3` with `approved: false`
**Security:** Teacher role navigating to `/dashboard/users` must receive guard redirect or empty state, not access the full management UI

---

## Scenario ADM-04: User Management — Reject Pending User with Reason

**Name:** Admin rejects a pending user and provides a rejection reason
**Personas:** `conservatorium_admin`
**Preconditions:** At least one pending user
**Steps:**
1. Navigate to `/dashboard/users?tab=pending`
2. Click "Reject" button for first pending user
3. Assert rejection dialog / alert dialog opens
4. Enter rejection reason text
5. Confirm rejection
6. Assert toast appears confirming rejection
7. Assert user is removed from pending list

**Expected Results:** `rejectUser()` called with ID; dialog closes; user gone from pending
**DB Backend:** mock
**Locales:** he
**Mock Data:** Pending user
**Security:** Only `conservatorium_admin` or `site_admin` should see reject button

---

## Scenario ADM-05: User Management — Edit User Profile

**Name:** Admin edits an existing user's name, grade, instruments
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** Approved student user exists
**Steps:**
1. Navigate to `/dashboard/users`
2. Click "Edit" (pencil icon) for a student user
3. Assert edit dialog opens with pre-filled form values
4. Change the student's name field
5. Change grade via select
6. Submit form
7. Assert toast "User updated" appears
8. Assert table row reflects updated name

**Expected Results:** `updateUser()` called; dialog closes; table reflects new values
**DB Backend:** mock
**Locales:** he, en
**Mock Data:** `student-user-1` at cons-15
**Security:** Site admin can edit any user; conservatorium admin can only edit users within their conservatorium (cross-conservatorium edit attempt should be blocked by `baseUsers` filter)

---

## Scenario ADM-06: User Management — Premium Teacher Toggle

**Name:** Admin sets `isPremiumTeacher` flag on a teacher
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** Teacher user exists; edit dialog is accessible
**Steps:**
1. Navigate to `/dashboard/users`
2. Click Edit for `teacher-user-1` (מרים כהן)
3. Locate the premium teacher switch/toggle in the edit dialog
4. Toggle switch on if not already enabled
5. Submit form
6. Assert toast confirmation
7. Navigate away and return to edit the same teacher
8. Assert premium switch reflects saved state

**Expected Results:** `isPremiumTeacher: true` persisted in mock state; star badge visible where used
**DB Backend:** mock
**Locales:** he
**Mock Data:** `teacher-user-1`

---

## Scenario ADM-07: Admin Enrollment — Create New Student via Wizard

**Name:** Admin enrolls a new student on their behalf
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** Admin is logged in; EnrollmentWizard is rendered with `isAdminFlow`
**Steps:**
1. Navigate to `/dashboard/enroll`
2. Assert "New Enrollment" heading is visible
3. Complete step 1: fill student name, ID number, email, phone
4. Assert ID validation (enter invalid Israeli ID → inline error; fix it)
5. Complete remaining wizard steps
6. Submit
7. Assert success state or confirmation message

**Expected Results:** Wizard completes without error; new user created in mock state
**DB Backend:** mock
**Locales:** he, en
**Mock Data:** None required initially (new user being created)
**Security:** Teacher role cannot access `/dashboard/enroll`; renders `noPermission` text

---

## Scenario ADM-08: Approvals Queue — Teacher Approves Form

**Name:** Teacher sees PENDING_TEACHER form in their queue and approves it
**Personas:** `teacher`
**Preconditions:** A `FormSubmission` with `status: PENDING_TEACHER` where `studentId` is in teacher's `students` array
**Steps:**
1. Navigate to `/dashboard/approvals`
2. Assert "For Your Handling" tab shows count badge
3. Locate the pending form row
4. Click "View" → navigate to `/dashboard/forms/[id]`
5. Assert "Teacher Actions" card is visible with Approve/Reject buttons
6. Click "Approve & Forward"
7. Assert toast confirms approval
8. Navigate back to `/dashboard/approvals`
9. Assert that form is no longer in teacher's queue

**Expected Results:** Form status transitions `PENDING_TEACHER → PENDING_ADMIN`
**DB Backend:** mock
**Locales:** he
**Mock Data:** `formSubmissions` seed entry with `status: PENDING_TEACHER`

---

## Scenario ADM-09: Approvals Queue — Admin Approves with Digital Signature

**Name:** Conservatorium admin gives final admin sign-off (PENDING_ADMIN → APPROVED) with signature
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** A form at `status: PENDING_ADMIN` in the admin's conservatorium
**Steps:**
1. Navigate to `/dashboard/approvals`
2. Assert form appears in "For Your Handling" queue
3. Click "Approve" button on the row (or navigate to form detail)
4. From form detail, click "Approve & Sign"
5. Assert signature dialog opens with `SignatureCapture` component
6. Draw signature on canvas
7. Click "Confirm"
8. Assert toast "Signed" appears
9. Assert form status badge changes to "APPROVED"
10. Assert signature image appears in the form sidebar
11. Assert "Download PDF" button is now visible

**Expected Results:** `submitSignatureAction` called; form `status → APPROVED`; `signatureUrl` set
**DB Backend:** mock
**Locales:** he, en
**Mock Data:** Form at `PENDING_ADMIN` status
**Security:** Ministry director sees APPROVED forms but cannot sign them; action button must not appear for that role

---

## Scenario ADM-10: Approvals Queue — Bulk Approve

**Name:** Admin bulk-approves multiple forms from the queue in one action
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** Multiple forms at `PENDING_ADMIN` in queue
**Steps:**
1. Navigate to `/dashboard/approvals`
2. Assert "For Your Handling" tab badge shows ≥ 2
3. Click "Select All" checkbox in table header
4. Assert bulk action toolbar appears showing selected count
5. Click bulk "Approve" button
6. Assert toast shows "X items approved"
7. Assert queue empties (or reduces by X)

**Expected Results:** All selected forms transition to next status; `selectedRows` cleared after action
**DB Backend:** mock
**Locales:** he
**Mock Data:** 3 forms at PENDING_ADMIN

---

## Scenario ADM-11: Approvals Queue — Request Revision

**Name:** Admin sends a form back for revision
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** Form at `PENDING_ADMIN`
**Steps:**
1. Navigate to `/dashboard/approvals`
2. Select one form checkbox
3. Click bulk "Request Revision"
4. Assert form moves to REVISION_REQUIRED status
5. Navigate to the form detail
6. Assert "Fix & Resubmit" button is visible (admin can edit and resubmit)
7. Click "Fix & Resubmit"; edit a repertoire piece duration
8. Submit revised form
9. Assert status returns to "APPROVED"

**Expected Results:** Revision cycle works end-to-end; `REVISION_REQUIRED → APPROVED` on resubmit
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-12: Ministry Director — Form Queue and Final Approval

**Name:** Ministry director sees APPROVED forms and gives FINAL_APPROVED
**Personas:** `ministry_director`
**Preconditions:** At least one form with `status: APPROVED`
**Steps:**
1. Navigate to `/dashboard/approvals`
2. Assert "For Your Handling" tab contains APPROVED forms
3. Click "View & Process" for one form
4. Assert "Ministry Actions" card is visible (not Teacher/Admin action cards)
5. Click "Final Approve"
6. Assert toast "Ministry Approved"
7. Assert form status badge = "FINAL_APPROVED"
8. Assert approval history timeline shows ministry step

**Expected Results:** `status: APPROVED → FINAL_APPROVED`; history renders ministry icon
**DB Backend:** mock
**Locales:** he
**Security:** `conservatorium_admin` must not see Ministry Actions card on the same form detail page

---

## Scenario ADM-13: Ministry Director — Request Changes (Rejection)

**Name:** Ministry director returns a form to conservatorium for revision
**Personas:** `ministry_director`
**Preconditions:** Form at `status: APPROVED`
**Steps:**
1. Navigate to form detail at APPROVED status
2. Click "Request Changes"
3. Assert dialog opens with textarea for rejection reason
4. Enter reason text
5. Click "Send Changes Request"
6. Assert form status = `REVISION_REQUIRED`
7. Assert ministry comment appears in form sidebar
8. Assert conservatorium admin can see the ministry comment when viewing the form

**Expected Results:** `ministryComment` set; status `APPROVED → REVISION_REQUIRED`
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-14: Ministry Dashboard — Filtering

**Name:** Ministry director filters forms by conservatorium, status, and instrument
**Personas:** `ministry_director`, `site_admin`
**Preconditions:** Multiple APPROVED / REVISION_REQUIRED / FINAL_APPROVED forms from different conservatoriums
**Steps:**
1. Navigate to `/dashboard/ministry`
2. Assert forms table is visible and non-empty
3. Select a specific conservatorium from the Combobox filter
4. Assert only rows matching that conservatorium remain
5. Reset conservatorium filter; select `FINAL_APPROVED` status filter
6. Assert only FINAL_APPROVED rows visible
7. Use search box to search by student name substring
8. Assert matching rows shown

**Expected Results:** All filter combinations work independently and combined; no page reload
**DB Backend:** mock
**Locales:** he, en
**Security:** Non-ministry, non-site_admin user navigating to `/dashboard/ministry` should see "no permission" message

---

## Scenario ADM-15: Ministry Export — Select and Download CSV

**Name:** Conservatorium admin selects approved forms and exports to CSV
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** At least one `APPROVED` form with `formType` = 'רסיטל בגרות' or 'הרשמה לבחינה' in the user's conservatorium
**Steps:**
1. Navigate to `/dashboard/ministry-export`
2. Assert "Approved Forms" table is visible
3. Select one or more form rows using checkboxes
4. Assert export button becomes active showing selected count
5. Click "Export Selected"
6. Assert toast "Export Complete" appears
7. Assert browser download is triggered (file named `ministry_export_*.csv`)

**Expected Results:** CSV blob download initiated; UTF-8 BOM included; form data mapped to columns
**DB Backend:** mock
**Locales:** he
**Mock Data:** APPROVED form of type 'רסיטל בגרות'
**Security:** Teacher / student navigating to `/dashboard/ministry-export` sees "no permission" message

---

## Scenario ADM-16: Ministry Export — Empty State When No Forms Selected

**Name:** Export button disabled / shows destructive toast when no rows selected
**Personas:** `conservatorium_admin`
**Steps:**
1. Navigate to `/dashboard/ministry-export`
2. Do not select any rows
3. Assert export button is disabled (or click it)
4. Assert destructive toast "No Forms Selected" appears
5. Assert no download is triggered

**Expected Results:** Guard condition prevents empty export
**DB Backend:** mock

---

## Scenario ADM-17: Event Create

**Name:** Admin creates a new event
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** Admin is authenticated
**Steps:**
1. Navigate to `/dashboard/events/new`
2. Assert EventForm renders (not "no permission")
3. Fill in event title, date, location, description
4. Submit
5. Assert success state or redirect to events list
6. Navigate to `/dashboard/events`
7. Assert new event appears in list

**Expected Results:** New event created in mock state; visible in events list
**DB Backend:** mock
**Locales:** he, en
**Security:** Teacher navigating to `/dashboard/events/new` sees `noPermission` text from DashboardPages translation

---

## Scenario ADM-18: Event Edit

**Name:** Admin edits an existing event's details
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** An event exists in mock data
**Steps:**
1. Navigate to `/dashboard/events/[known-event-id]/edit`
2. Assert EventEditForm renders with pre-populated values
3. Change event title field
4. Submit form
5. Assert navigation back to event detail or list
6. Assert updated title displayed

**Expected Results:** Event updated in state; edit form guards against non-admin access (redirects to `/403`)
**DB Backend:** mock
**Locales:** he
**Security:** Teacher / student visiting edit URL is redirected to `/403` by `useEffect` guard

---

## Scenario ADM-19: Event Detail View

**Name:** Event details page renders event information
**Personas:** All authenticated roles
**Steps:**
1. Navigate to `/dashboard/events/[known-event-id]`
2. Assert event title is visible
3. Assert date/location shown
4. Admin persona: assert Edit link/button is visible
5. Non-admin persona: assert Edit link is absent

**Expected Results:** Detail page renders; edit action gated to admin
**DB Backend:** mock
**Locales:** he, en

---

## Scenario ADM-20: Announcements — Compose and Send

**Name:** Admin composes and sends an announcement
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/announcements`
2. Assert AnnouncementComposer form is visible
3. Fill in announcement title and body text
4. Select target audience (all, teachers, students, parents)
5. Click Send
6. Assert success toast or confirmation

**Expected Results:** Announcement composed; no form errors; success confirmation shown
**DB Backend:** mock
**Locales:** he, en, ar (RTL direction test)

---

## Scenario ADM-21: Form Builder — Create Custom Form Template

**Name:** Admin creates a new custom form template using the form builder
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/admin/form-builder`
2. Assert FormBuilder renders
3. Add a text field with a label
4. Add a checkbox field
5. Name the form template
6. Save / publish template
7. Assert template appears in form builder list
8. Navigate to `/dashboard/forms/new`
9. Assert the new custom template is selectable

**Expected Results:** Template created and available for form submissions
**DB Backend:** mock
**Locales:** he
**Security:** Non-admin cannot reach form builder; `useAdminGuard` renders skeleton / redirects

---

## Scenario ADM-22: Open Day Management

**Name:** Admin manages open day registrations
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/admin/open-day`
2. Assert `OpenDayAdminDashboard` renders
3. Assert open day registrations table / list is visible
4. Perform any available action (approve, cancel, or view details)
5. Assert action reflects in UI

**Expected Results:** Dashboard renders with data; admin actions functional
**DB Backend:** mock
**Locales:** he, ar (RTL direction attribute on container)

---

## Scenario ADM-23: Waitlists Management

**Name:** Admin views and manages instrument waitlists
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/admin/waitlists`
2. Assert `AdminWaitlistDashboard` renders
3. Assert at least one waitlist entry or empty state message is shown
4. If entries exist, promote or remove a student from a waitlist
5. Assert UI updates reflect the action

**Expected Results:** Waitlist data displayed; promotion action changes list
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-24: Substitute Management

**Name:** Admin assigns a substitute teacher for an absent teacher's lessons
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/admin/substitute`
2. Assert `SubstituteAssignmentPanel` renders
3. Assert list of lessons requiring substitute is shown (or empty state)
4. Select a lesson requiring a substitute
5. Choose a substitute teacher from available options
6. Confirm assignment
7. Assert lesson updated with substitute teacher info

**Expected Results:** Substitute assigned; panel reflects assignment; toast shown
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-25: Branches Management

**Name:** Admin views and creates conservatorium branches
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/admin/branches`
2. Assert `AdminBranchesDashboard` renders
3. Assert existing branches list is visible
4. Click "Add Branch" (or equivalent)
5. Fill in branch name, address
6. Save
7. Assert new branch appears in list

**Expected Results:** Branch added to conservatorium data; list updates
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-26: Performances — Booking Dashboard

**Name:** Admin views and manages performance slot bookings
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/admin/performances`
2. Assert `PerformanceBookingDashboard` renders
3. Assert performance slots or bookings list visible
4. Create a new performance booking or slot if action available
5. Assert new entry appears

**Expected Results:** Performance dashboard renders with data; RTL direction correct
**DB Backend:** mock
**Locales:** he, ar

---

## Scenario ADM-27: Notifications — Send System Notification

**Name:** Admin sends a targeted in-app notification
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/admin/notifications`
2. Assert notification composer renders
3. Select recipient group (e.g., all students)
4. Write notification message
5. Send
6. Assert confirmation

**Expected Results:** Notification dispatched; confirmation shown
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-28: Notification Audit Log

**Name:** Admin reviews notification delivery log
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/admin/notifications/log`
2. Assert `NotificationAuditLog` component renders
3. Assert log entries table visible (or empty state with message)
4. If entries: assert columns for recipient, message, timestamp, status

**Expected Results:** Log renders; data or empty state shown
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-29: Ministry Inbox (Admin Side)

**Name:** Admin views Ministry inbox panel
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/admin/ministry`
2. Assert `MinistryInboxPanel` renders
3. Assert title/subtitle from `AdminPages.ministry` translation namespace shown
4. Assert panel content (messages or status updates from ministry) is visible

**Expected Results:** Panel renders without error; admin guard enforced
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-30: Playing School Admin Dashboard

**Name:** Admin views playing school partnership dashboard
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/admin/playing-school`
2. Assert `SchoolPartnershipDashboard` renders
3. Assert partnership KPI cards are visible
4. Assert school partnerships table shows rows

**Expected Results:** Dashboard loads; no errors; KPI and table data present
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-31: Playing School Token Distribution

**Name:** Admin copies enrollment token and views conversion funnel
**Personas:** `conservatorium_admin`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/admin/playing-school/distribute`
2. Assert page renders with funnel chart section and tokens table
3. Assert conversion funnel bars (leads → token scanned → started wizard → enrolled) visible
4. Click "Copy" icon for `TOKEN_ORT_26`
5. Assert copy confirmation (check icon appears briefly)
6. Assert toast "Copied" shown
7. Click WhatsApp share button
8. Assert new tab / window opens with `wa.me` URL containing encoded message

**Expected Results:** Token copy and WhatsApp share work; funnel renders; RTL direction applied
**DB Backend:** mock (hardcoded `MOCK_TOKENS` and `MOCK_FUNNEL` constants)
**Locales:** he, en

---

## Scenario ADM-32: Forms List — Role-Aware Visibility

**Name:** Forms list shows role-appropriate subtitle and create button
**Personas:** `student`, `teacher`, `conservatorium_admin`
**Steps:**
1. As student: navigate to `/dashboard/forms`
2. Assert student-specific subtitle visible; "New Form" button visible
3. As teacher: navigate to `/dashboard/forms`
4. Assert teacher subtitle visible; "New Form" button visible
5. As conservatorium_admin: navigate to `/dashboard/forms`
6. Assert generic admin subtitle; "New Form" button visible
7. As parent: navigate to `/dashboard/forms`
8. Assert parent subtitle; no "New Form" button (parent not in `canCreateForm` list)

**Expected Results:** Each role sees correct subtitle; create button gated correctly
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-33: Forms List — Tab Filtering

**Name:** Forms tabs correctly filter by status group
**Personas:** `conservatorium_admin`
**Preconditions:** Forms exist across DRAFT, PENDING_ADMIN, APPROVED statuses
**Steps:**
1. Navigate to `/dashboard/forms`
2. Assert "All" tab shows all forms
3. Click "Pending" tab — assert only PENDING_TEACHER / PENDING_ADMIN / REVISION_REQUIRED forms shown
4. Click "Approved" tab — assert only APPROVED / FINAL_APPROVED shown
5. Click "Drafts" tab — assert only DRAFT forms shown
6. Enter search term in search box on any tab
7. Assert filtered results respect both tab status filter and search

**Expected Results:** Tab + search combination filters correctly
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-34: Form Detail — Download PDF

**Name:** Admin downloads form as PDF after approval
**Personas:** `conservatorium_admin`, `site_admin`
**Preconditions:** A form with `status: APPROVED` or `FINAL_APPROVED` and a `signatureUrl`
**Steps:**
1. Navigate to `/dashboard/forms/[id]` for an APPROVED form
2. Assert "Download PDF" button is visible in header
3. Click "Download PDF"
4. Assert browser initiates download of `form_[id].pdf`

**Expected Results:** jsPDF generates PDF; download triggered; no JS errors in console
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-35: Form Detail — Custom Form Template Display

**Name:** Form created from a custom template renders dynamic field layout
**Personas:** `conservatorium_admin`
**Preconditions:** A `FormSubmission` with `formTemplateId` set and `formData` filled
**Steps:**
1. Navigate to the form detail page for a custom-template form
2. Assert the form fields section renders field labels from the template
3. Assert boolean fields render as "Yes" / "No" text
4. Assert numeric and text fields render their values

**Expected Results:** `customFormTemplate.fields` mapped and displayed; no raw keys or undefined values
**DB Backend:** mock
**Locales:** he, en

---

## Scenario ADM-36: Role-Based Access Guard — Non-Admin Blocked

**Name:** Non-admin users cannot access admin-only routes
**Personas:** `student`, `parent`, `teacher`
**Steps:**
1. As student: navigate to each of:
   - `/dashboard/admin`
   - `/dashboard/users`
   - `/dashboard/admin/form-builder`
   - `/dashboard/admin/waitlists`
   - `/dashboard/admin/substitute`
   - `/dashboard/admin/branches`
2. Assert each redirects to login or shows access-denied state (not the admin content)
3. Repeat for parent and teacher roles

**Expected Results:** `useAdminGuard` hook redirects or renders nothing for unauthorized roles
**DB Backend:** mock
**Locales:** he
**Security:** This is a critical security boundary; all admin pages use `useAdminGuard`

---

## Scenario ADM-37: Conservatorium Admin Scope Isolation

**Name:** Conservatorium admin only sees users from their own conservatorium
**Personas:** `conservatorium_admin` (cons-15)
**Preconditions:** Users exist across multiple conservatoriums (cons-15 and cons-66)
**Steps:**
1. Log in as conservatorium_admin for cons-15
2. Navigate to `/dashboard/users`
3. Assert user list shows only cons-15 users (no cons-66 names appear)
4. Navigate to `/dashboard/approvals`
5. Assert only cons-15 forms appear in "All Open" tab

**Expected Results:** Multi-tenant isolation enforced at data filtering layer
**DB Backend:** mock
**Locales:** he
**Security:** Site admin sees all; conservatorium admin scoped to their `conservatoriumId`

---

## Scenario ADM-38: Site Admin Cross-Conservatorium View

**Name:** Site admin sees all users across all conservatoriums
**Personas:** `site_admin`
**Steps:**
1. Navigate to `/dashboard/users`
2. Assert users from multiple conservatoriums are listed (both cons-15 and cons-66 names visible)
3. Navigate to `/dashboard/approvals`
4. Assert forms from multiple conservatoriums in All Open tab

**Expected Results:** Site admin global view confirmed; own user account excluded from list
**DB Backend:** mock
**Locales:** he

---

## Scenario ADM-39: RTL Layout Correctness for Admin Pages

**Name:** Admin pages apply correct RTL direction on Hebrew and Arabic locales
**Personas:** `conservatorium_admin`
**Steps:**
1. Navigate to `/he/dashboard/admin/performances`
2. Assert container `div` has `dir="rtl"`
3. Navigate to `/ar/dashboard/admin/open-day`
4. Assert container `div` has `dir="rtl"`
5. Navigate to `/en/dashboard/admin/performances`
6. Assert container `div` has `dir="ltr"`

**Expected Results:** `isRtl` logic correctly sets `dir` attribute on all pages that implement it
**DB Backend:** mock
**Locales:** he, ar, en

---

## Scenario ADM-40: School Coordinator Dashboard

**Name:** School coordinator page renders coordinator-specific dashboard
**Personas:** `school_coordinator`, `site_admin`
**Steps:**
1. Navigate to `/dashboard/school`
2. Assert `SchoolCoordinatorDashboard` renders
3. Assert relevant coordinator KPI cards or action panels visible
4. Assert no admin-only controls visible to school_coordinator role

**Expected Results:** Coordinator dashboard renders; role-appropriate content shown
**DB Backend:** mock
**Locales:** he

---

## Mock Data Requirements

| Requirement | Details |
|---|---|
| Pending users | At least 1 user with `approved: false` in cons-15 |
| Form pipeline | Forms at each status: DRAFT, PENDING_TEACHER, PENDING_ADMIN, APPROVED, REVISION_REQUIRED, FINAL_APPROVED |
| Form types | Include 'רסיטל בגרות' and 'הרשמה לבחינה' for export/PDF tests |
| Custom form template | At least 1 `formTemplate` with `fields[]` having text and checkbox types |
| Events | At least 2 events for CRUD tests; one with known ID |
| Multi-conservatorium users | Users in both cons-15 and cons-66 for isolation tests |
| Ministry director user | `ministry-user-1` with `role: ministry_director` |
| Signature URL | One APPROVED form with `signatureUrl` set for PDF test |
| Playing school tokens | MOCK_TOKENS hardcoded in distribute page (no DB seed needed) |

---

## DB Backend Coverage

| Backend | Scenarios |
|---|---|
| mock | All (primary) |
| postgres | ADM-03, ADM-09, ADM-15 (critical write paths) |
| supabase | ADM-09 (signature action uses server action path) |

---

## Integration with Other QA Plans

- Auth & Registration (plan 08): user approval in ADM-03/04 feeds into registration flow
- Legal/Consent (plan 07): form signatures in ADM-09 relate to consent recording
- Repertoire (plan 09): ADM-21 form builder may include repertoire-type custom fields
- Billing (plan 10): admin billing page (`/dashboard/billing`) covered in billing plan, not here
