# Security Requirements for Deferred Features

**Author:** Security Architect Agent
**Date:** 2026-03-15
**Status:** v5 -- legal-security intersection incorporated; all blocking issues resolved
**Updated:** 2026-03-15 (v5: SEC-CONTRACT-01..07 from legal brief; greenfield note; PM decisions)
**References:** `docs/plans/qa/12-security-review.md` (existing SEC-01..SEC-12)

---

## Overview

This document defines security requirements for the 5 deferred features being planned. Each section maps threats to mitigations and specifies the Server Action guards, tenant isolation rules, data minimization, and audit trail entries that **must** be implemented before each feature ships.

All requirements follow the established patterns:
- `requireRole(allowedRoles, conservatoriumId)` for RBAC + tenant isolation
- `verifyAuth()` + ownership checks for user-scoped data
- Zod schemas for input validation (never trust client)
- `conservatoriumId` filtering on every DB query (per commit `47229cb`)
- `ComplianceLog` entries for PII-accessing operations (per FINDING-INFRA-06)

**Greenfield note (2026-03-15):** This is a greenfield project with no production users or live data. All security patterns should be built correctly from the start, not retrofitted. The `withAuth()` wrapper should be designed with mandatory role enforcement from day one. Status enums, state machines, and data models can be replaced wholesale if a better design exists. No backwards-compatibility constraints apply.

---

## 1. Performances -- Musician Assignment

### 1.1 Threat Model

| Threat | Vector | Impact |
|--------|--------|--------|
| **Cross-tenant musician assignment** | Admin of cons-15 assigns a teacher/student belonging to cons-66 by knowing their userId | Teacher from another conservatorium receives notifications and gains visibility into another tenant's event |
| **Unauthorized program visibility** | Teacher from cons-66 navigates to `/dashboard/admin/performances/[eventId]` of cons-15 | Sees student names, compositions, schedule times -- PII leak |
| **Decline reason disclosure** | Admin reads teacher's decline reason containing private info (e.g., "I have a medical appointment") | Privacy violation if shared beyond the admin |
| **Program slot manipulation** | Teacher modifies another teacher's performance slot via Server Action with a guessed slotId | Corrupted program, potential DoS on the event |
| **IDOR on EventProduction** | Any authenticated user GETs `/dashboard/admin/performances/[eventId]` with a guessed event ID | Reads full event data including performer PII from another conservatorium |

### 1.2 Security Requirements

#### SEC-PERF-01: Tenant-scoped musician assignment

**Every** Server Action that assigns a musician to an event **must**:

1. Call `requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin'], event.conservatoriumId)`.
2. Verify `musician.conservatoriumId === event.conservatoriumId` server-side, **regardless** of what the client sends. Cross-tenant assignment must return `TENANT_MISMATCH`.
3. Exception: `site_admin` may assign cross-tenant for inter-conservatorium concerts. This must be an explicit boolean flag `allowCrossTenant` in the schema, defaulting to `false`.

```
// Pseudocode for assignMusicianToEvent
const claims = await requireRole([...adminRoles], event.conservatoriumId);
if (musician.conservatoriumId !== event.conservatoriumId && claims.role !== 'site_admin') {
  throw new Error('TENANT_MISMATCH');
}
```

#### SEC-PERF-02: Event read access is tenant-scoped

The `getEventProduction(eventId)` query **must** filter by `conservatoriumId` matching the caller's tenant, or be restricted to admin roles. A teacher/student should only see events from their own conservatorium. Public events (`isPublic: true`) may be visible to anyone, but the `performers` array must be stripped of `userId` fields for non-admin viewers.

#### SEC-PERF-03: Musician search returns only same-tenant users

The musician search/autocomplete endpoint **must** filter results by `conservatoriumId === claims.conservatoriumId`. It must **never** return users from other tenants. The search response should return only: `{ id, displayName, instrument }` -- no email, phone, or address.

#### SEC-PERF-04: Decline reason visibility rules (PM confirmed)

When a teacher declines an assignment:
- The `declineReason` field is stored on the assignment record.
- Visibility rules:
  - `conservatorium_admin`, `delegated_admin`, `site_admin`: **full visibility**
  - The declined teacher themselves (`claims.uid === assignment.userId`): **can see their own reason**
  - Other musicians on the same booking: **CANNOT see**
  - Students, parents: **CANNOT see** -- show "Performer TBD"
  - External clients (event booker): **CANNOT see**
- Booking card for non-admin roles: shows "1 declined" badge, **never** the reason.
- The `projectBookingForRole()` DTO must strip `declineReason` from all assignments except the caller's own (if they are the declined musician).

#### SEC-PERF-05: Assignment mutation requires ownership or admin

A teacher can only accept/decline their **own** assignments. Server Action must verify `assignment.userId === claims.uid` OR caller is an admin role. A teacher must not be able to accept or decline on behalf of another teacher.

#### SEC-PERF-07: Musician rate data is compensation-sensitive

`PerformanceAssignment.ratePerHour` and `PerformanceProfile.performanceRatePerHour` are **compensation data**. Requirements:
- These fields must **never** be included in client-facing API responses to non-admin roles.
- Musician search results for the assign dialog must strip `ratePerHour` unless the caller is `conservatorium_admin`, `delegated_admin`, or `site_admin`.
- The cost summary (`estimatedMusicianCost`) on the booking card is admin-only. It must not appear in any client/customer-facing view or quote.
- One musician must **never** see another musician's rate on the same booking.
- In the `/dashboard/performances/invitations` page (teacher view), the teacher sees their own assignment details but NOT other musicians' rates.

#### SEC-PERF-08: Opt-in gate on musician search

The `assignMusiciansToPerformanceAction` **must** verify for each userId:
1. The musician has `performanceProfile.isOptedIn === true` AND `performanceProfile.adminApproved === true`.
2. If a musician opts out after assignment (sets `isOptedIn = false`), the system should NOT auto-remove them from existing bookings, but the admin should see a warning badge. The musician can still explicitly decline.

#### SEC-PERF-06: Audit trail

| Action | ComplianceLog entry |
|--------|---------------------|
| Musician assigned to event | `EVENT_MUSICIAN_ASSIGNED` with `eventId`, `musicianId`, `assignedBy` |
| Musician declined | `EVENT_MUSICIAN_DECLINED` with `eventId`, `musicianId` (decline reason NOT in log -- it's PII) |
| Event published | `EVENT_PUBLISHED` with `eventId`, `publishedBy` |

---

## 2. Waitlist Offer Flow

### 2.1 Threat Model

| Threat | Vector | Impact |
|--------|--------|--------|
| **Offer acceptance by wrong parent** | Parent-A guesses the offer URL/token for Parent-B's child | Parent-A's child takes a slot meant for Parent-B's child |
| **Token forgery** | Attacker crafts a valid-looking offer token | Unauthorized slot booking |
| **Offer enumeration** | Attacker iterates `/api/waitlist/offer/[token]` to discover active offers | Information disclosure (which instruments/teachers have openings) |
| **Admin spam** | Malicious admin sends 1000 offers in rapid succession | Notification fatigue, email/SMS cost abuse |
| **Cross-tenant waitlist manipulation** | Admin of cons-15 creates/accepts offers for cons-66 students | Tenant isolation breach |
| **Race condition on offer acceptance** | Two parents accept the same offer simultaneously | Double-booking the slot |

### 2.2 Security Requirements

#### SEC-WAIT-01: Cryptographically secure offer tokens

Offer tokens **must not** be guessable or sequential. Requirements:
- Generate with `crypto.randomBytes(32).toString('hex')` (64 hex chars).
- Tokens are single-use: once accepted or declined, the token is invalidated.
- Tokens have a server-enforced expiry (`offerExpiresAt`). After expiry, the token returns HTTP 410 Gone.
- Tokens are **not** UUIDs -- UUIDs (v4) have only 122 bits of randomness and a predictable format.

#### SEC-WAIT-02: Offer acceptance requires identity verification

Accepting an offer **must** verify:
1. The caller is authenticated (`verifyAuth()`).
2. The caller is either:
   - The student named in the `WaitlistEntry` (`claims.uid === entry.studentId`), OR
   - A parent whose `children` array includes the student (`claims.uid` is in student's `parentIds`), OR
   - An admin of the same conservatorium.
3. The offer is still `OFFERED` status (not already `ACCEPTED`, `DECLINED`, or `EXPIRED`).
4. `entry.conservatoriumId === claims.conservatoriumId` (or caller is `site_admin`).

```
// Pseudocode
const entry = await db.waitlist.findByToken(token);
if (!entry || entry.status !== 'OFFERED') throw new Error('OFFER_INVALID');
if (new Date(entry.offerExpiresAt) < new Date()) throw new Error('OFFER_EXPIRED');
if (claims.uid !== entry.studentId && !isParentOf(claims.uid, entry.studentId) && !isAdmin(claims)) {
  throw new Error('FORBIDDEN');
}
```

#### SEC-WAIT-03: Atomic offer acceptance (race condition prevention)

Offer acceptance **must** use an atomic compare-and-swap or database transaction:
- Read the offer status.
- If status === `OFFERED`, atomically set status to `ACCEPTED` and assign the slot.
- If status !== `OFFERED`, return "Offer no longer available."

For Firestore: use a Firestore transaction. For Postgres: use `UPDATE ... WHERE status = 'OFFERED' RETURNING *`.

This prevents two parents from simultaneously accepting the same offer.

#### SEC-WAIT-04: Rate limiting on offer creation

Admin actions to send offers **must** be rate-limited:
- Maximum 20 offers per admin per hour (configurable per conservatorium).
- Each offer triggers a notification (IN_APP, EMAIL, or SMS). Rate limiting prevents notification spam and cost abuse.
- The rate limit is enforced server-side in the Server Action, not on the client.

#### SEC-WAIT-05: Tenant isolation on waitlist queries

- `getWaitlistEntries()` must filter by `conservatoriumId === claims.conservatoriumId`.
- A teacher sees only waitlist entries for their own instrument/students.
- A parent sees only entries for their own children.
- Admin sees all entries for their conservatorium.

#### SEC-WAIT-06: No PII in offer notification URLs

If offers are delivered via email/SMS with a clickable link:
- The URL must be `https://harmonia.co.il/waitlist/offer/[token]` -- the token itself reveals nothing.
- The email body may include the instrument name and teacher first name, but **not** the student's full name, national ID, or contact details.
- The landing page must require authentication before revealing offer details.

#### SEC-WAIT-08: Soft-lock on offered slots prevents double-booking across waitlist entries

When admin offers a slot to a waitlisted entry, that slot must be **soft-locked**:
- The slot cannot be offered to a different waitlist entry simultaneously.
- The slot cannot be booked through the normal booking flow while the offer is outstanding.
- If the offer expires or is declined, the soft-lock is released.
- Implementation: add `offeredToWaitlistEntryId?: string` and `softLockedUntil?: string` to `LessonSlot`. The booking flow must check these fields before allowing a booking.
- This addresses the concurrency concern where two admins could offer the same slot to different families.

#### SEC-WAIT-09: FIFO skip is auditable

When admin skips FIFO order in the waitlist:
- The `skipReason` field is required (not optional) when skipping.
- An audit trail entry `WAITLIST_FIFO_SKIPPED` is created with `entryId`, `skippedBy`, `skipReason`, `queuePosition`.
- This is visible in admin audit logs for fairness accountability.

#### SEC-WAIT-07: Audit trail

| Action | ComplianceLog entry |
|--------|---------------------|
| Offer created | `WAITLIST_OFFER_CREATED` with `entryId`, `offeredBy`, `studentId`, `expiresAt` |
| Offer accepted | `WAITLIST_OFFER_ACCEPTED` with `entryId`, `acceptedBy` |
| Offer declined | `WAITLIST_OFFER_DECLINED` with `entryId`, `declinedBy` |
| Offer expired | `WAITLIST_OFFER_EXPIRED` with `entryId` (batch job) |

---

## 3. Master Schedule Navigation

### 3.1 Threat Model

| Threat | Vector | Impact |
|--------|--------|--------|
| **Cross-tenant schedule visibility** | Teacher manipulates URL params `?conservatoriumId=cons-66` to see another cons's schedule | Sees student names, teacher assignments, room allocations from another tenant |
| **Student sees other students' lessons** | Student navigates to `/dashboard/schedule?view=master` | Sees lesson times and teacher names of other students (privacy violation) |
| **PDF export data leak** | Admin exports schedule PDF; PDF contains data beyond the admin's tenant | Cross-tenant PII in a downloadable file |
| **URL parameter injection** | Attacker passes `teacherId=../../admin` in query params | Path traversal or IDOR on schedule queries |

### 3.2 Security Requirements

#### SEC-SCHED-01: Role-based schedule visibility

| Role | Visibility |
|------|------------|
| `student` | Only their own lessons (all teachers) |
| `parent` | Only their children's lessons |
| `teacher` | Only lessons where `teacherId === claims.uid` |
| `conservatorium_admin` / `delegated_admin` | All lessons in their conservatorium |
| `site_admin` | All lessons across all conservatoriums |

The Server Action or data-fetching function **must** apply these filters server-side. The client may request a `view` parameter (day/week/month/master), but the **data scope** is always enforced by role.

#### SEC-SCHED-02: Tenant isolation on all schedule queries

Every schedule query **must** include `WHERE conservatoriumId = ?` with the value from `claims.conservatoriumId`. This applies to:
- `db.lessons.findAll({ conservatoriumId })`
- `db.rooms.findAll({ conservatoriumId })`
- `db.users.findAll({ conservatoriumId })` (for teacher/student name resolution)

`site_admin` may pass a different `conservatoriumId` as a filter parameter. All other roles must have the filter locked to their own tenant.

#### SEC-SCHED-03: URL parameters are untrusted

Query parameters like `teacherId`, `studentId`, `roomId`, `date`, `conservatoriumId` **must** be:
1. Validated with Zod (format check: UUID for IDs, ISO date for dates).
2. Ignored if they conflict with the caller's access scope. Example: a teacher passing `teacherId=other-teacher-id` should be silently corrected to their own `teacherId`, not served with the other teacher's data.

#### SEC-SCHED-04: PDF/export is scoped

Schedule PDF generation **must**:
1. Run the same role-based query as the on-screen schedule (SEC-SCHED-01).
2. Include a header in the PDF: "Generated for [userName] on [date]" to create an audit trail.
3. Never include lessons from outside the caller's scope.
4. Rate-limit PDF generation: max 10 per user per hour (prevent DoS via expensive PDF rendering).

#### SEC-SCHED-05: Data minimization in schedule views

- **Teacher view**: shows student first name + last initial (not full name), instrument, time. No student contact info.
- **Student view**: shows teacher display name, instrument, time, room. No other students visible.
- **Admin view**: full names visible, but no national IDs, phone numbers, or email addresses in the schedule grid. These are in the user detail page only.

#### SEC-SCHED-06: Audit trail

PDF exports are logged: `SCHEDULE_EXPORTED` with `exportedBy`, `scope` (my-lessons | teacher-X | full-schedule), `dateRange`.

---

## 4. Announcement Translation Preview

### 4.1 Threat Model

| Threat | Vector | Impact |
|--------|--------|--------|
| **PII sent to third-party API** | Admin writes announcement body containing student names; body sent to Gemini for translation | Student PII processed by external AI service without consent |
| **Cross-tenant announcement delivery** | Admin of cons-15 sets `conservatoriumId: 'cons-66'` in the announcement payload | Users of cons-66 receive announcement from cons-15 admin |
| **XSS via translated content** | Gemini returns HTML/script in translation; rendered unsanitized | Stored XSS affecting all recipients |
| **Translation API abuse** | Attacker calls translation endpoint repeatedly with large payloads | Cost DoS on Gemini API |
| **Announcement body injection** | Admin includes `<script>` in Hebrew body; shown to students | Stored XSS |

### 4.2 Security Requirements

#### SEC-ANN-01: PII detection before translation (soft warning)

**PM Decision (2026-03-15):** Soft warning, not hard block. Names in announcements are expected and legitimate. Only structured PII triggers a warning.

Before sending announcement content to the Gemini API:
1. The Server Action **must** scan the body for **structured PII** patterns:
   - Israeli national ID (`\d{9}`) -- **prominent amber warning**
   - Phone numbers (`\d{2,3}-?\d{7}`) -- **prominent amber warning**
   - Email addresses (`\S+@\S+\.\S+`) -- **prominent amber warning**
2. If structured PII is detected, show: "This text may contain personal information. Personal data will be sent to Google AI for translation." Admin can proceed or edit. The warning does NOT block the API call.
3. Names alone do NOT trigger a warning (names in announcements are expected).
4. The Gemini API call in `translateAnnouncement()` (`src/app/actions/translate.ts:310`) currently sends `titleHe` and `bodyHe` directly. Wrap with PII detection check before the call.

#### SEC-ANN-01a: Sub-processor disclosure update (compliance prerequisite)

The privacy page sub-processor table must be updated to include announcement translation as a Gemini use case:
- **Service:** Add "announcement translation" alongside existing "AI-based progress reports, teacher matching"
- **Data accessed:** Add "announcement content (may include names)" alongside existing fields
- Update in all 4 locale files: `src/messages/{he,en,ar,ru}/common.json`
- This must be done **before** the translation preview feature ships.

#### SEC-ANN-01b: One-time information notice for admins

On first use of auto-translate, show a non-blocking info notice:
- Text: "Announcement text is sent to Google AI for translation. Avoid including personal names or sensitive information in announcements."
- Dismissable, remembered via `localStorage` key (e.g., `harmonia_translate_notice_seen`).
- This is informational, not a consent gate (admin acts in official capacity).

#### SEC-ANN-02: Tenant isolation on announcements

`createAnnouncement` already calls `requireRole([...adminRoles], payload.conservatoriumId)` (line 789). This is correct. **Verify** that:
1. The announcement is stored with `conservatoriumId` from the validated claims, not from the client payload. Recommendation: override `payload.conservatoriumId = claims.conservatoriumId` server-side for non-site_admin callers.
2. The notification delivery system filters recipients by `conservatoriumId`.
3. The announcement list view filters by `conservatoriumId`.

#### SEC-ANN-03: HTML sanitization on announcement content

Both the original Hebrew body and all translated bodies **must** be sanitized before storage:
1. Strip all HTML tags from announcement `title` and `body`.
2. If rich text is needed in the future, use an allowlist (bold, italic, links) and sanitize with DOMPurify or equivalent.
3. The Gemini response **must** be treated as untrusted input. Validate that each translated field is a plain string with no HTML/script tags.

```
// After parsing Gemini response
for (const locale of locales) {
  if (raw[locale]?.title) raw[locale].title = stripHtml(raw[locale].title);
  if (raw[locale]?.body) raw[locale].body = stripHtml(raw[locale].body);
}
```

#### SEC-ANN-04: Translation API rate limiting

- Max 10 translation requests per admin per hour.
- Max body length: 5,000 characters. Reject longer bodies before calling Gemini.
- These limits prevent cost abuse of the Gemini API.

#### SEC-ANN-05: Preview is not delivery

The "translation preview" action must be a **read-only** operation:
1. It calls Gemini, returns the translated text to the admin in the UI.
2. It does **not** store the translations or send notifications.
3. The admin must explicitly click "Send" to create the announcement with translations.
4. This separation prevents accidental announcement delivery during preview.

#### SEC-ANN-06: Audit trail

| Action | ComplianceLog entry |
|--------|---------------------|
| Translation requested | `ANNOUNCEMENT_TRANSLATED` with `announcementId`, `requestedBy`, `locales` |
| Announcement sent | `ANNOUNCEMENT_SENT` with `announcementId`, `sentBy`, `recipientCount`, `channels` |

---

## 5. Approvals / Forms IA

### 5.1 Threat Model

| Threat | Vector | Impact |
|--------|--------|--------|
| **IDOR on form detail** | Teacher-A navigates to `/dashboard/forms/[formId]` where formId belongs to Teacher-B's student | Teacher-A sees another teacher's student's exam form (PII + academic data) |
| **Cross-tenant form access** | Admin of cons-15 calls `getFormSubmission(formId)` for a form belonging to cons-66 | Full form data including student PII from another tenant |
| **Unauthorized approval** | Teacher approves a form where they are not the student's assigned teacher | Bypasses the approval workflow |
| **Ministry director approves outside jurisdiction** | Ministry director approves a form from a conservatorium they don't oversee | Regulatory compliance violation |
| **Form data tampering** | Student modifies form fields after teacher has reviewed it | Teacher's approval is invalidated without their knowledge |
| **Signature forgery** | Attacker replays a `signatureUrl` from one form to another | Forged approval signature |

### 5.2 Security Requirements

#### SEC-FORM-01: Form read access is role-scoped

| Role | Can read |
|------|----------|
| `student` | Only their own forms (`form.studentId === claims.uid`) |
| `parent` | Only their children's forms (`form.studentId` is in parent's `children`) |
| `teacher` | Only forms where `form.teacherId === claims.uid` or forms assigned to them for review |
| `conservatorium_admin` / `delegated_admin` | All forms in their conservatorium (`form.conservatoriumId === claims.conservatoriumId`) |
| `ministry_director` | Forms that require ministry approval (`form.requiresMinistryApproval === true`) within their jurisdictional conservatoriums |
| `site_admin` | All forms |

The `getFormSubmission(formId)` Server Action **must**:
1. Fetch the form.
2. Check `form.conservatoriumId` against `claims.conservatoriumId` (tenant isolation).
3. Apply the role-scoped filter above.
4. Return `FORBIDDEN` if the caller does not match any allowed accessor.

#### SEC-FORM-02: Form list queries are tenant-scoped

`db.forms.findAll()` **must** always include `conservatoriumId` filter. The forms list page must never load forms from other tenants, even if the client requests a different `conservatoriumId`.

#### SEC-FORM-03: Approval action verifies jurisdiction

The `approveFormSubmission(formId, comment)` Server Action **must** verify:

1. **Teacher approval**: `claims.uid === form.teacherId` (the teacher assigned to the student).
2. **Admin approval**: `claims.conservatoriumId === form.conservatoriumId` + admin role.
3. **Ministry approval**: `claims.role === 'ministry_director'` + the form has `requiresMinistryApproval === true` + the conservatorium is in the director's jurisdiction list.

If none of these conditions are met, return `FORBIDDEN`.

#### SEC-FORM-04: Form immutability after submission (PM confirmed)

Once a form's status transitions beyond `DRAFT`:

**Immutable after submission (status >= PENDING_TEACHER):**
- Student details, instrument details, repertoire list, teacher selection, grade/class, uploaded files

**Mutable by approver (at their approval step):**
- `teacherComment`, `adminComment`, `ministryComment`, `managerNotes`, approval status, signature

**Mutable by submitter during REVISION_REQUIRED only:**
- All core fields may be edited during revision (v1). Future: per-field locking based on reviewer flags.
- After resubmission (REVISION_REQUIRED -> PENDING_TEACHER), fields become immutable again.

**Mutable by site_admin always:**
- site_admin can unlock any form for re-editing (creates `FORM_UNLOCKED` audit entry with `unlockedBy`, `timestamp`).

**Never mutable (by any role, including site_admin):**
- `submissionDate`, `submittedBy` (userId), `id` (form ID), `conservatoriumId`

The Server Action must compare incoming payload against the existing form and reject modifications to locked fields based on the current status and caller role.

#### SEC-FORM-05: Signature URLs are not reusable

- `signatureUrl` should include a hash of the form content at signing time: `sha256(formId + formDataHash + timestamp)`.
- When displaying a signed form, verify the signature hash matches the current form data. If the form was modified after signing, display a warning: "Form modified after signature -- re-signing required."
- Signature dataURLs must be validated: max 512 KB (per existing FINDING-DATA-06), must start with `data:image/png;base64,`.

#### SEC-FORM-06: FormTemplate access is tenant-scoped

`FormTemplate.conservatoriumId` must match `claims.conservatoriumId` for all CRUD operations. Templates from cons-15 must not be visible or usable by cons-66 admins.

Exception: `MinistryFormTemplate` (created by ministry directors) may be visible to all conservatoriums, but only editable by the creating director or `site_admin`.

#### SEC-FORM-07: Data minimization in form list views

The forms list endpoint should return a **summary** projection:
```
{ id, formType, studentName, status, submissionDate, teacherName }
```

Full form details (repertoire, signatures, comments, ministry fields) are loaded only on the detail view. This prevents bulk exfiltration of form data via list queries.

#### SEC-FORM-09: Status transition authorization matrix

The `upsertFormSubmissionAction` **must** validate that the requesting user has authority for the requested status transition. A teacher calling `updateForm({...form, status: 'FINAL_APPROVED'})` to bypass the approval chain must be blocked.

| Current Status | Allowed Next Status | Who Can Transition |
|---|---|---|
| `DRAFT` | `PENDING_TEACHER` | student, parent (form owner) |
| `PENDING_TEACHER` | `PENDING_ADMIN`, `REVISION_REQUIRED` | teacher (assigned to this student) |
| `PENDING_ADMIN` | `APPROVED`, `REVISION_REQUIRED`, `REJECTED` | conservatorium_admin, delegated_admin (same tenant) |
| `REVISION_REQUIRED` | `PENDING_TEACHER` | student, parent (form owner) |
| `APPROVED` | `FINAL_APPROVED` | ministry_director (if `requiresMinistryApproval`) |
| Any status | Any status | site_admin (override) |

The Server Action must:
1. Fetch the existing form from DB.
2. Compare `existing.status` with `payload.status`.
3. Look up the transition in the matrix above.
4. Verify `claims.role` and `claims.uid` match the "Who Can Transition" column.
5. Reject with `FORBIDDEN` if the transition is not authorized.

#### SEC-FORM-10: `?action=true` query param does not grant approval authority

The approvals-forms spec uses `?action=true` on the form detail page to show the action bar. This query param must be treated as a **UI hint only**. The actual authorization check happens in the Server Action (SEC-FORM-09). Even if a user manually adds `?action=true` to a URL, the approve/reject buttons must be disabled if the user lacks authority for the current form status.

#### SEC-FORM-08: Audit trail

| Action | ComplianceLog entry |
|--------|---------------------|
| Form submitted | `FORM_SUBMITTED` with `formId`, `submittedBy`, `formType` |
| Form approved (teacher) | `FORM_APPROVED_TEACHER` with `formId`, `approvedBy` |
| Form approved (admin) | `FORM_APPROVED_ADMIN` with `formId`, `approvedBy` |
| Form approved (ministry) | `FORM_APPROVED_MINISTRY` with `formId`, `approvedBy`, `referenceNumber` |
| Form rejected | `FORM_REJECTED` with `formId`, `rejectedBy`, `stage` |
| Form unlocked for re-edit | `FORM_UNLOCKED` with `formId`, `unlockedBy` |

---

## 6. Cross-Cutting Security Requirements

These apply to **all 5 features** above.

### SEC-CROSS-01: All new Server Actions use `requireRole()`, not bare `withAuth()`

Per FINDING-AUTHZ-01, `withAuth()` only checks authentication, not authorization. Every new Server Action **must** call `requireRole(allowedRoles, conservatoriumId)` inside the action body. Do not rely on `withAuth()` alone for any action that reads or writes tenant-scoped data.

### SEC-CROSS-02: Zod schemas for all inputs

Every new Server Action must define a Zod schema. Minimum validations:
- `id` fields: `z.string().uuid()` or `z.string().regex(/^[a-z0-9-]+$/)` (no path traversal chars)
- `conservatoriumId`: `z.string().regex(/^cons-\d+$/)` (matches existing format)
- Text fields: `z.string().max(5000)` (prevent oversized payloads)
- Enum fields: `z.enum([...])` (never trust a client-provided string for status/role)

### SEC-CROSS-03: No client-supplied `conservatoriumId` for write operations

For non-site_admin callers, the `conservatoriumId` on any write operation **must** be set to `claims.conservatoriumId` server-side. The client may send it (for display purposes), but the server must **override** it:

```
const claims = await requireRole(allowedRoles, payload.conservatoriumId);
payload.conservatoriumId = claims.conservatoriumId; // override client value
```

Exception: `site_admin` may specify any `conservatoriumId`.

### SEC-CROSS-04: Notification delivery is tenant-scoped

Any feature that sends notifications (waitlist offers, performance assignments, announcements) **must** verify that all recipients belong to the same `conservatoriumId` as the sender (or the resource). Cross-tenant notifications are a tenant isolation breach.

### SEC-CROSS-05: Error messages do not leak internal state

All new Server Actions must follow the existing pattern in `withAuth()`:
- Return generic error messages to the client ("You do not have permission").
- Log detailed error context server-side only.
- Never return database IDs, table names, or stack traces to the client.

---

## 7. New Security Test Scenarios

These extend the SEC-01..SEC-12 series in `docs/plans/qa/12-security-review.md`.

### SEC-13: Cross-Tenant Event Assignment Blocked

**Steps:**
1. Authenticate as `conservatorium_admin` of cons-15.
2. Call `assignMusicianToEvent({ eventId: cons15Event, musicianId: cons66Teacher })`.
3. Assert: `TENANT_MISMATCH` error.

### SEC-14: Waitlist Offer Token Is Cryptographically Random

**Steps:**
1. Create 100 waitlist offers.
2. Collect all tokens.
3. Assert: no two tokens share a prefix > 8 characters (statistical randomness check).
4. Assert: each token is 64 hex characters long.

### SEC-15: Waitlist Offer Cannot Be Accepted by Wrong Parent

**Steps:**
1. Create offer for student-user-1 (parent: parent-user-1).
2. Authenticate as parent-user-2.
3. Call `acceptWaitlistOffer(token)`.
4. Assert: FORBIDDEN.

### SEC-16: Schedule Query Cannot Cross Tenant Boundary

**Steps:**
1. Authenticate as teacher from cons-15.
2. Call schedule query with `conservatoriumId: 'cons-66'`.
3. Assert: only cons-15 lessons returned (param silently ignored).

### SEC-17: Form Detail IDOR Blocked

**Steps:**
1. Authenticate as teacher-user-1 (assigned to student-user-1).
2. Call `getFormSubmission(formId)` where formId belongs to student-user-3 (different teacher).
3. Assert: FORBIDDEN.

### SEC-18: Announcement Cannot Target Other Tenant

**Steps:**
1. Authenticate as admin of cons-15.
2. Call `createAnnouncement({ conservatoriumId: 'cons-66', ... })`.
3. Assert: `TENANT_MISMATCH` or `conservatoriumId` overridden to cons-15.

### SEC-19: Translation Preview Does Not Store Data

**Steps:**
1. Call `translateAnnouncement(title, body)` as admin.
2. Assert: no new Announcement record created in DB.
3. Assert: response contains translated text but no `id` field.

### SEC-20: Form Immutability After Submission

**Steps:**
1. Submit a form as student (status transitions to `SUBMITTED`).
2. Call `upsertFormSubmission` with modified `repertoire` field.
3. Assert: action rejects with "Form fields locked after submission."
4. Verify original repertoire is unchanged.

### SEC-21: Form Status Transition Authorization

**Steps:**
1. Authenticate as teacher-user-1 (assigned to student-user-1).
2. Fetch a form in `PENDING_TEACHER` status.
3. Call `upsertFormSubmission` with `status: 'APPROVED'` (skipping admin step).
4. Assert: `FORBIDDEN` -- teacher cannot skip to APPROVED.
5. Call with `status: 'PENDING_ADMIN'` (valid teacher transition).
6. Assert: success.

### SEC-22: Musician Rate Visibility Restricted

**Steps:**
1. Authenticate as teacher-user-1 (a musician on booking-1).
2. Request booking-1 details.
3. Assert: own assignment includes rate info.
4. Assert: other musicians' `ratePerHour` fields are `undefined` or stripped.
5. Assert: `estimatedMusicianCost` is not present in response.

### SEC-23: Waitlist Slot Soft-Lock Prevents Double-Offer

**Steps:**
1. Admin offers slot-A to waitlist entry-1.
2. Admin attempts to offer slot-A to waitlist entry-2.
3. Assert: second offer rejected ("Slot already offered to another student").
4. Entry-1 declines the offer.
5. Admin offers slot-A to entry-2.
6. Assert: success -- soft-lock released.

### SEC-24: Waitlist FIFO Skip Requires Reason

**Steps:**
1. Waitlist has 3 entries in FIFO order: entry-1, entry-2, entry-3.
2. Admin offers to entry-2 (skipping entry-1) without `skipReason`.
3. Assert: action rejects ("Skip reason required when offering out of FIFO order").
4. Admin offers to entry-2 with `skipReason: "Family scheduling constraint"`.
5. Assert: success. Audit log contains `WAITLIST_FIFO_SKIPPED` entry.

---

## 8. Blocking Issues for Architect and PM

### BLOCKING-SEC-01 (for architect): `withAuth()` must enforce roles by design -- RESOLVED

**Resolution:** Since this is greenfield, `withAuth()` should be redesigned from the start to require a `{ roles: UserRole[] }` parameter. There should be no "bare" `withAuth()` variant without role enforcement. All Server Actions define their allowed roles declaratively at the definition site. This eliminates the FINDING-AUTHZ-01 vulnerability class entirely.

**Greenfield advantage:** No need for the current two-function pattern (`withAuth` + `requireRole` called separately inside). A single `withAuth(schema, { roles }, action)` signature makes it impossible to forget role enforcement.

### BLOCKING-SEC-02 (for architect): Atomic offer acceptance needs DB transaction support -- RESOLVED

**Resolution:** Architect provided implementations for all three DB adapters:
- Memory: mutex lock pattern with `Map<string, boolean>`
- Postgres: `UPDATE ... WHERE status='OFFERED' AND offer_expires_at > NOW() RETURNING *`
- Firestore: `runTransaction()` with optimistic concurrency
- Slot soft-lock: `UPDATE lesson_slots SET soft_locked_by_waitlist_entry = $1 WHERE id = $3 AND soft_locked_by_waitlist_entry IS NULL`

Soft-lock release wired to all 4 handlers: decline, defer, revoke, expire. No stale-lock risk.

### BLOCKING-SEC-03 (for PM): PII in translation API calls -- RESOLVED

**PM Decision (2026-03-15):**
1. Sub-processor disclosure is partially covered -- must update privacy page to include "announcement translation" as a Gemini use case (SEC-ANN-01a).
2. No consent dialog. One-time informational notice on first auto-translate use (SEC-ANN-01b).
3. Soft warning for structured PII (ID numbers, phones, emails). No warning for names alone. Not a hard block.

**Security assessment:** Acceptable. The soft warning approach balances usability with privacy protection. The sub-processor disclosure update (SEC-ANN-01a) is a **compliance prerequisite** that must ship before the translation preview feature.

### BLOCKING-SEC-04 (for PM): Waitlist offer expiry UX vs. security -- RESOLVED

**PM Decision (2026-03-15):**
- Default validity: **48 hours** (Shabbat-aware -- 24h too aggressive, 72h locks slots too long).
- Expired offers: show "expired" page with message "Your place on the waitlist has been preserved." Link back to dashboard. Do NOT redirect to "join again" (causes anxiety).
- Extend expired offers: **No.** Admin must create a new offer (fresh 48h clock). Slot selection dialog remembers last offered slot for one-click re-offer.

**Security assessment:** Acceptable. 48h expiry with mandatory re-creation on expiry is simpler and more secure than extension (no ambiguous expiry times, cleaner state machine). The soft-lock on slots (SEC-WAIT-08) must release on expiry to prevent permanent slot blockage.

### SEC-PERF-04: Teacher decline reason privacy -- PM CONFIRMED

**PM Decision (2026-03-15):** Decline reasons visible to:
- conservatorium_admin, delegated_admin, site_admin: full visibility
- The declined teacher themselves: can see their own decline reason
- Other musicians on same booking: CANNOT see
- Students, parents, external clients: CANNOT see
- Booking card for non-admin: shows "1 declined" badge, no reason

### SEC-FORM-04: Form immutability after submission -- PM CONFIRMED

**PM Decision (2026-03-15):**
- Immutable after submission (status >= PENDING_TEACHER): student details, instrument, repertoire, teacher selection, grade, uploaded files
- Mutable by approver: comments, approval notes, status, signature
- Mutable by submitter during REVISION_REQUIRED: all core fields (v1; per-field locking in future)
- Mutable by site_admin always: can unlock any form (audit trail: FORM_UNLOCKED)
- Never mutable: submission timestamp, submitter ID, form ID, conservatorium ID

---

## Appendix: Mapping to Existing Findings

| New Requirement | Extends Existing Finding |
|-----------------|-------------------------|
| SEC-PERF-01, SEC-SCHED-02, SEC-FORM-02, SEC-WAIT-05 | FINDING-AUTHZ-05 (tenant isolation not tested) |
| SEC-CROSS-01, SEC-FORM-09 | FINDING-AUTHZ-01 (`withAuth` does not enforce role) |
| SEC-ANN-03 | FINDING-INPUT-03 (no HTML sanitization policy) |
| SEC-ANN-01 | FINDING-INPUT-02 (PII trusted from client) |
| SEC-FORM-08, SEC-PERF-06 | FINDING-INFRA-06 (ComplianceLog not wired) |
| SEC-WAIT-01 | New -- no existing finding for token generation |
| SEC-FORM-05 | FINDING-DATA-06 (signature dataUrl no size cap) |
| SEC-PERF-07 | New -- compensation data classification |
| SEC-WAIT-08 | New -- slot soft-lock for concurrency |
| SEC-WAIT-09 | New -- FIFO skip auditability |
| SEC-FORM-09 | New -- status transition authorization matrix |

---

## 9. Legal-Security Intersection (from Legal Brief)

The following requirements were identified in collaboration with the Legal Expert Agent. Full legal analysis is in `docs/legal/performance-booking-legal-brief.md` Section 13.

### SEC-CONTRACT-01: Contract signing tokens (maps to LS-01)

Performance contract signing URLs must use cryptographically random tokens:
- `crypto.randomBytes(32).toString('hex')` (same pattern as SEC-WAIT-01)
- Single-use: invalidated after signature submission
- Server-enforced 72h expiry (matches musician response deadline from legal brief)
- Signing page verifies `claims.uid === contract.musicianUserId` before allowing signature

### SEC-CONTRACT-02: OTP must use crypto.randomInt (maps to LS-02, HIGH)

**Existing vulnerability in `src/app/actions/rental-otp.ts:25`**: `Math.random()` is NOT cryptographically secure.
- Replace with `crypto.randomInt(100000, 999999)` for all OTP generation (rental AND performance contracts).
- OTP store must use Redis or DB with TTL in production (current in-memory `Map` resets on server restart).
- **Legal risk**: If OTP is predictable, the signature's evidentiary value under the Electronic Signature Law can be challenged in court.

### SEC-CONTRACT-03: Compensation data encrypted at rest (maps to LS-03)

The following fields must be encrypted at rest in Firestore/Postgres:
- `ratePerHour` (musician hourly rate)
- `taxStatus` (עוסק מורשה / שכיר classification)
- `taxId` (business registration number)
- Bank details (account number, branch code)

Visibility rules (extends SEC-PERF-07):
- Admin: full visibility
- The musician themselves: their own data only
- Other musicians on same booking: NEVER visible
- External clients: NEVER visible
- Bank details masked in UI: show last 4 digits only (LS-07)

### SEC-CONTRACT-04: Contract immutability after signing (maps to LS-04, CRITICAL)

Signed contracts are **write-once**:
1. After `contract.status = 'signed'`, no update or delete operations permitted.
2. Server Action must reject mutations with `CONTRACT_IMMUTABLE` error.
3. If terms need to change: create a new contract version, archive the old version, require re-signing.
4. `signatureHash` (SHA-256 of signature image) AND `documentHash` (SHA-256 of contract content at signing time) are both REQUIRED fields -- not optional.
5. DSAR deletion requests must exempt contracts within the 7-year retention period. Response: "This record is retained under Income Tax Ordinance S. 25 and VAT Law S. 74. It will be anonymized after [retainUntil date]."

### SEC-CONTRACT-05: documentHash is REQUIRED for contract signing (maps to LS-05, CRITICAL)

The `SignatureCapture` component already accepts an optional `documentHash` prop. For contract signing flows, this must be made **mandatory**:
- The Server Action must reject signature submissions where `documentHash` is missing or empty.
- The `documentHash` is computed as `SHA-256(contractId + contractContent + timestamp)` before the signing page renders.
- On verification, the stored `documentHash` is compared against the current contract content. Mismatch = tamper warning.
- This is the tamper-evident seal required by the Electronic Signature Law for evidentiary value.

### SEC-CONTRACT-06: Contract lifecycle audit trail (maps to LS-06)

All contract events logged as immutable ComplianceLog entries:

| Event | Action | Required Fields |
|-------|--------|-----------------|
| Quotation created | `QUOTATION_CREATED` | quotationId, adminId, clientName, totalIncVat |
| Quotation sent | `QUOTATION_SENT` | quotationId, clientEmail, sentAt |
| Quotation signed | `QUOTATION_SIGNED` | quotationId, signatureHash, documentHash, signerIp |
| Contract generated | `CONTRACT_CREATED` | contractId, quotationId, bookingId |
| Contract sent to musician | `CONTRACT_SENT` | contractId, musicianUserId, sentAt |
| Musician signs | `CONTRACT_SIGNED` | contractId, musicianUserId, signatureHash, documentHash, signerIp |
| Admin countersigns | `CONTRACT_COUNTERSIGNED` | contractId, adminId, signatureHash |
| Contract cancelled | `CONTRACT_CANCELLED` | contractId, cancelledBy, reason |

These audit records are themselves subject to 7-year retention and must be append-only (no update/delete).

### SEC-CONTRACT-07: ILS 50,000 threshold warning

For contracts exceeding ILS 50,000 total value:
- The admin UI should display a warning: "For contracts exceeding ILS 50,000, we recommend in-person signing or a certified electronic signature."
- The warning is informational, not blocking.
- The threshold is checked server-side based on the quotation total (including VAT).
- Log `CONTRACT_HIGH_VALUE_WARNING` to ComplianceLog when the warning is shown.
