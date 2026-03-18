# Performances Page -- Musician Assignment UX

**Date:** 2026-03-15
**Author:** Architect Agent
**Status:** DRAFT -- ready for team review

---

## 1. Current State Analysis

### Existing Infrastructure
- **Page:** `/dashboard/admin/performances` renders `PerformanceBookingDashboard`.
- **Dashboard component:** `performance-booking-dashboard.tsx` -- list/kanban view of bookings with 4-column pipeline (New -> Manager Review -> Music Review -> Price Offered).
- **Assign dialog:** `assign-musician-dialog.tsx` -- checkbox list of teachers with `performanceProfile.isOptedIn && performanceProfile.adminApproved`.
- **Types:**
  - `PerformanceBooking` (types.ts:1286): `assignedMusicians?: { userId, name, instrument }[]`
  - `PerformanceBookingStatus`: 7-stage pipeline enum.
  - `PerformanceProfile` (types.ts:218): `isOptedIn, adminApproved, performanceGenres, repertoireHighlights, videoLinks, audioLinks, performanceRatePerHour, travelRadiusKm, canPerformSolo, canPerformChamber, ensembleRoles`.
  - `EventPerformer` (types.ts:1162): `userId, displayName, instrument, role: 'soloist' | 'ensemble' | 'accompanist' | 'conductor'`.

### Current Assignment Dialog Gaps
1. **No filtering** -- shows all opted-in teachers in a flat list. No instrument filter, no availability check, no role assignment.
2. **No role assignment** -- musicians are just toggled on/off. No concept of "Lead Violin" vs "Accompanist" for this booking.
3. **No musician response** -- after assignment, no notification or accept/decline flow for the musician.
4. **No rate/cost calculation** -- `performanceRatePerHour` exists on the profile but is not used in the booking flow.
5. **No schedule conflict detection** -- no check if the musician has a lesson or another performance at the same time.

---

## 2. Architectural Decisions

### 2.1 Assignment Model: Role-Based with Instrument Filter

**Decision:** Each assignment is not just "this musician is on this gig" but "this musician fills this role for this gig."

Extend the assignment data model:

```typescript
// Replace the current inline type in PerformanceBooking
export type PerformanceAssignment = {
  userId: string;
  name: string;
  instrument: string;
  role: 'soloist' | 'ensemble' | 'accompanist' | 'conductor';
  status: 'pending' | 'accepted' | 'declined';
  ratePerHour?: number;
  responseAt?: string;      // ISO timestamp when musician responded
  declineReason?: string;
};

// Updated PerformanceBooking
export type PerformanceBooking = {
  // ... existing fields ...
  assignedMusicians?: PerformanceAssignment[];  // was { userId, name, instrument }[]
  requiredRoles?: {                              // NEW: what the booking needs
    role: 'soloist' | 'ensemble' | 'accompanist' | 'conductor';
    instrument: string;
    count: number;
    filled: number;  // computed from assignedMusicians
  }[];
};
```

### 2.2 Enhanced Assignment Dialog: Filter + Role Picker

**Decision:** Replace the simple checkbox list with a multi-step dialog.

#### Step 1: Define Requirements (optional, skippable)
Admin specifies what the gig needs:
- 1x Pianist (accompanist)
- 2x Violinists (ensemble)
- 1x Cellist (soloist)

This creates `requiredRoles[]` on the booking. If skipped, assignments are free-form.

#### Step 2: Search & Assign Musicians
For each required role (or free-form if no requirements):

```
+-----------------------------------------------+
| Assign Musicians for: Wedding at Park Hotel    |
|                                                 |
| [Filter: Instrument v] [Filter: Available v]   |
| [Search musician name...]                       |
|                                                 |
| Required: 1x Pianist (accompanist)              |
| +-------------------------------------------+  |
| | [ ] David Levy          Piano             |  |
| |     Rate: 250 ILS/hr  Available           |  |
| |     Role: [Accompanist v]                 |  |
| +-------------------------------------------+  |
| | [x] Miriam Cohen       Piano              |  |
| |     Rate: 300 ILS/hr  Conflict: lesson    |  |
| |     Role: [Accompanist v]                 |  |
| +-------------------------------------------+  |
|                                                 |
| Required: 2x Violinists (ensemble)              |
| +-------------------------------------------+  |
| | [x] Sarah Ben-Ami      Violin             |  |
| |     Rate: 200 ILS/hr  Available           |  |
| |     Role: [Ensemble v]                    |  |
| +-------------------------------------------+  |
|                                                 |
| Estimated total: 750 ILS/hr                     |
| [Cancel]                          [Assign (3)]  |
+-----------------------------------------------+
```

### 2.3 Availability & Conflict Detection

**Decision:** Show conflicts as warnings, not blockers. Admin can override.

Check for conflicts:
1. **Lesson slots:** Query `lessonSlots` for the event date/time window. If teacher has a lesson, show yellow "Conflict: lesson at 14:00".
2. **Other performances:** Query `performanceBookings` for overlapping event dates where the teacher is already assigned.
3. **Teacher availability:** Check `user.availability` slots for the event's day-of-week.

```typescript
// New utility: src/lib/performance-utils.ts
export function checkMusicianAvailability(
  musician: User,
  eventDate: string,
  eventTime: string,
  existingBookings: PerformanceBooking[],
  lessonSlots: LessonSlot[]
): {
  available: boolean;
  conflicts: { type: 'lesson' | 'performance' | 'unavailable'; detail: string }[];
}
```

### 2.4 Musician Response Flow

**Decision:** After admin assigns musicians, each musician receives a notification and can accept/decline.

Flow:
1. Admin assigns musicians -> status per assignment: `pending`.
2. Notification sent to each musician: "You've been invited to perform at [event] on [date]."
3. Musician sees a pending invitation on their dashboard (new section or banner).
4. Musician clicks Accept or Decline (with optional decline reason).
5. When ALL assigned musicians have accepted -> booking status auto-advances to `MUSICIANS_CONFIRMED`.
6. If any musician declines -> admin notified, must reassign that slot.

**New page:** `/dashboard/performances/invitations` (teacher view)

### 2.5 Cost Calculation

**Decision:** Auto-calculate estimated cost from assigned musicians' rates.

```typescript
// Computed on the booking card
const estimatedCost = booking.assignedMusicians
  ?.filter(m => m.status !== 'declined')
  .reduce((sum, m) => sum + (m.ratePerHour || 0), 0) || 0;
// Multiply by estimated hours (from event duration, or default 2h)
```

This feeds into the `totalQuote` field and is displayed on the booking card + used in the Send Quote dialog.

### 2.6 Mobile UX

**Decision:** Modal dialog for assignment (not separate page), with responsive layout.

- On desktop: dialog is 640px wide, two-column layout (filter sidebar + musician list).
- On mobile: dialog goes full-screen, stacked layout (filters on top, list below).
- The kanban view already handles mobile via `snap-x snap-mandatory` scrolling.

---

## 3. Data Model Changes

### New type: PerformanceAssignment

```typescript
export type PerformanceAssignmentStatus = 'pending' | 'accepted' | 'declined' | 'opted_out';  // SEC-PERF-08: opted_out = musician disabled isOptedIn after assignment

export type PerformanceAssignment = {
  userId: string;
  name: string;
  instrument: string;
  role: 'soloist' | 'ensemble' | 'accompanist' | 'conductor';
  status: PerformanceAssignmentStatus;
  ratePerHour?: number;
  responseAt?: string;
  declineReason?: string;
};
```

### PerformanceBooking changes

```typescript
export type PerformanceBooking = {
  id: string;
  conservatoriumId: string;
  status: PerformanceBookingStatus;
  inquiryReceivedAt: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  eventDurationHours?: number;        // NEW: for cost calculation
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  totalQuote: number;
  assignedMusicians?: PerformanceAssignment[];  // CHANGED from inline type
  requiredRoles?: {                              // NEW
    role: 'soloist' | 'ensemble' | 'accompanist' | 'conductor';
    instrument: string;
    count: number;
  }[];
  estimatedMusicianCost?: number;                // NEW: computed from assignments
  adminNotes?: string;                           // NEW
};
```

### Status pipeline refinement

Current pipeline works well, but the `MUSICIANS_CONFIRMED` status should now mean "all assigned musicians have accepted":

```
INQUIRY_RECEIVED -> ADMIN_REVIEWING -> [musicians assigned, some pending]
  -> MUSICIANS_CONFIRMED [all accepted] -> QUOTE_SENT -> DEPOSIT_PAID -> BOOKING_CONFIRMED -> EVENT_COMPLETED
```

Add intermediate visual state: when musicians are assigned but not all confirmed, show "Awaiting musician confirmation (2/3 confirmed)" badge on the card.

---

## 4. Server Action Signatures

```typescript
// Assign musicians to a performance booking
export const assignMusiciansToPerformanceAction = withAuth(
  z.object({
    bookingId: z.string(),
    assignments: z.array(z.object({
      userId: z.string(),
      role: z.enum(['soloist', 'ensemble', 'accompanist', 'conductor']),
    })),
  }),
  async (payload) => {
    // 1. Validate admin role + conservatorium match
    // 2. Look up each musician, verify performanceProfile.isOptedIn
    // 3. Create PerformanceAssignment entries with status: 'pending'
    // 4. Send notifications to each musician
    // 5. Update booking.assignedMusicians
    // 6. Advance booking status to ADMIN_REVIEWING if not already
  }
);

// Musician responds to performance invitation
export const respondToPerformanceInvitationAction = withAuth(
  z.object({
    bookingId: z.string(),
    accept: z.boolean(),
    declineReason: z.string().optional(),
  }),
  async (payload) => {
    // 1. Verify user is in assignedMusicians
    // 2. Update assignment status
    // 3. If all accepted -> advance booking to MUSICIANS_CONFIRMED
    // 4. If declined -> notify admin
  }
);

// Set required roles for a booking (admin)
export const setPerformanceRequirementsAction = withAuth(
  z.object({
    bookingId: z.string(),
    requiredRoles: z.array(z.object({
      role: z.enum(['soloist', 'ensemble', 'accompanist', 'conductor']),
      instrument: z.string(),
      count: z.number().int().positive(),
    })),
  }),
  async (payload) => { /* ... */ }
);
```

---

## 5. Component Architecture

### Admin Side (enhanced)

```
/dashboard/admin/performances
  -> PerformanceBookingDashboard (existing, enhanced)
     -> BookingCard / BookingRow
        -> AssignmentStatusBadge (new: "2/3 confirmed")
        -> EstimatedCostDisplay (new)
     -> AssignMusicianDialog (rewritten)
        -> Step1: RequirementsDefiner (optional)
        -> Step2: MusicianSearch
           -> InstrumentFilter
           -> AvailabilityFilter (with conflict warnings)
           -> MusicianCard (avatar, name, instrument, rate, availability, role picker)
        -> CostSummary
```

### Teacher/Musician Side (new)

```
/dashboard/performances/invitations (new page)
  -> PerformanceInvitationsList
     -> InvitationCard (event name, date, role, accept/decline)

/dashboard (teacher view)
  -> If has pending invitations:
     -> Banner: "You have N performance invitations"
```

---

## 6. Security Considerations

1. **Role-gated assignment:** Only `conservatorium_admin`, `delegated_admin`, `site_admin` can assign musicians.
2. **Tenant isolation:** Musicians must belong to the same conservatorium as the booking (or be flagged as cross-conservatorium performers).
3. **Musician consent:** Only show musicians where `performanceProfile.isOptedIn && performanceProfile.adminApproved`. A musician who opts out mid-flow should be removable.
4. **Rate visibility:** Musician rates are sensitive. Only show to admin roles, not to the client or other musicians.
5. **Decline reason privacy:** Decline reasons are visible only to admin, not to the client.
6. **Assignment mutation authority:** Only the assigned musician themselves can accept/decline their invitation (verify `userId` matches auth user).

---

## 7. Performance Card Display (what changes)

### Before (current)
```
| Event         | Client       | Date       | Quote    | Actions |
| Wedding Party | Sarah Cohen  | 15/04/2026 | 3,500    | [...]   |
```

### After (enhanced)
```
| Event         | Client       | Date       | Musicians     | Quote    | Actions |
| Wedding Party | Sarah Cohen  | 15/04/2026 | 2/3 confirmed | 3,500    | [...]   |
```

In kanban view, each card shows:
- Event name, client, date (existing)
- Musician count: "3 musicians (2 confirmed, 1 pending)"
- Instrument icons for assigned musicians
- Estimated cost (new)

---

## 8. Implementation Steps (Greenfield)

**Note:** This is greenfield -- no production users, no migration guards needed. Build the ideal design from scratch.

### Revised Pipeline Status (Greenfield Design)

Replace the existing 7-stage pipeline entirely. See section "Greenfield: Simplified Performance Pipeline" below for the recommended enum. Summary:

```
DRAFT → PENDING_REVIEW → MUSICIANS_NEEDED → INVITATIONS_SENT → QUOTE_READY → QUOTE_SENT → CONTRACTS_PENDING → CONFIRMED → COMPLETED | CANCELLED
```

Key changes from the brownfield pipeline:
- Collapses "Manager Review" + "Music Review" into `PENDING_REVIEW`
- Explicit `CONTRACTS_PENDING` stage (legally required -- client must sign before deposit)
- `CONFIRMED` = contracts signed + deposit received
- `CANCELLED` with reason at any stage

### Phase 1: Security Foundation (steps 1-5)
1. Refactor `withAuth()` to accept `{ roles }` parameter (BLOCKING-SEC-01).
2. Add conservatoriumId tenant verification to all performance actions (SEC-CROSS-03).
3. Add rate/cost data filtering by role -- use `projectBookingForRole()` DTO projection (non-admin cannot see rates). Never use in-place mutation (`delete obj.field`); always project into a new object.
4. Add musician eligibility verification (opted-in + admin-approved) (SEC-PERF-08).
5. Add opt-out warning badge -- if a previously opted-in musician has `isOptedIn: false`, show a warning badge on their existing assignments.

### Phase 2: Data Model & Actions (steps 6-12)
6. Define `PerformanceAssignment` type with full schema: `userId, name, instrument, role, status, ratePerHour, responseAt, declineReason, assignedAt, assignedBy`.
7. Define `PerformanceAssignmentStatus`: `pending | accepted | declined | opted_out`.
8. Define `PerformanceBooking` with `assignedMusicians: PerformanceAssignment[]` and `requiredRoles: { instrument, role, count }[]`.
9. Define `PerformanceQuotation` type (see `docs/legal/performance-booking-legal-brief.md` section 4) with: quotationNumber, issueDate, validUntil, clientDetails, conservatoriumDetails, eventDetails, lineItems (musician fees, equipment, travel), subtotal, vatRate, vatAmount, total, paymentTerms, cancellationTerms, signatureFields.
10. Extend `PerformanceProfile` with tax fields: `taxStatus: 'employee' | 'licensed_dealer' | 'exempt_dealer'`, `businessNumber?: string`, `taxWithholdingRate?: number`.
11. Create `src/lib/performance-utils.ts` with `checkMusicianAvailability()`, `calculateBookingCost()`, `generateQuotationNumber()`.
12. Build server actions:
    - `assignMusiciansAction` (admin: assign musicians with roles)
    - `respondToAssignmentAction` (musician: accept/decline invitation)
    - `sendQuotationAction` (admin: generate and send quotation to client, transitions `QUOTE_READY → QUOTE_SENT`)
    - `signQuotationAction` (client: digitally sign quotation, transitions `QUOTE_SENT → CONTRACTS_PENDING`)
    - `recordDepositAction` (admin: record deposit payment, transitions `CONTRACTS_PENDING → CONFIRMED`)

### Phase 3: Quotation & Contract / Legal Integration (steps 13-17)
13. Build `PerformanceQuotation` generator -- server action that assembles line items from assigned musicians, applies VAT per `src/lib/vat.ts`, and produces a structured quotation object. Status: `QUOTE_READY → QUOTE_SENT`.
14. Build quotation PDF renderer (or structured HTML view) showing all legally required fields per Israeli Consumer Protection Law (see Legal section L2).
15. Build client-facing quotation review + digital signing page at `/dashboard/performances/[bookingId]/sign`. Use the existing `SignatureCapture` component and `saveSignatureAction` pattern from the enrollment wizard. Status: `QUOTE_SENT → CONTRACTS_PENDING`.
16. Build internal musician engagement confirmation -- when a musician accepts an assignment, generate a confirmation record documenting: musician identity, event details, agreed rate, cancellation terms, IP/recording consent.
17. Implement cancellation flow with sliding-scale fees per Legal section L6:
    - Declined within 72h response deadline: no penalty
    - Accepted, cancels >72h before event: warning only
    - Accepted, cancels 24-72h before event: ILS 200 or 20% of fee (whichever lower)
    - Accepted, cancels <24h / no-show: full fee forfeited
    - Client cancellation: graduated scale per Legal section L3 clause 4

### Phase 4: UI Components & Integration (steps 18-22)
18. Build assignment Sheet drawer with instrument filter, availability/conflict detection, role picker, and cost summary (replacing current simple Dialog).
19. Build `/dashboard/performances/invitations` page for musicians -- list of pending/past invitations with accept/decline actions.
20. Build musician dashboard banner for pending invitations (count badge in sidebar).
21. Build client quotation view with signing flow (4-step: Review Details, Review Terms, SignatureCapture, Confirmation). Status: `CONTRACTS_PENDING → CONFIRMED` when contracts signed + deposit received.
22. Update booking card display in kanban/list views with assignment status badges, cost summary, and all pipeline stages from the greenfield enum.

---

## UX & Accessibility Addendum (UX-UA Agent)

### C1. Component Pattern Decision: Sheet Drawer for Assignment Panel

**Decision:** Replace the current `Dialog` with a `Sheet` (side drawer) for the musician assignment flow.

**Rationale:**
- The assignment flow involves browsing a long list of musicians with filters -- this is a "workspace" pattern, not a "confirm action" pattern
- A Sheet stays open alongside the booking dashboard, allowing admin to reference booking details
- Sheet slides in from the end side (right in LTR, left in RTL), preserving the main content
- On mobile, Sheet goes full-screen (already handled by the existing Sheet component: `w-3/4 sm:max-w-sm`)

**However:** Override the default `sm:max-w-sm` to `sm:max-w-lg` for this use case, since the musician list needs more width.

### C2. Assignment Sheet — Detailed Wireframe

```
+---SHEET (from end side)---------------------------+
| Assign Musicians                            [X]  |
| Wedding Party at Park Hotel                       |
| 15/04/2026 14:00 - 18:00 (4h)                    |
+---------------------------------------------------+
| Requirements (optional)                           |
| +-----------------------------------------------+|
| | [+ Add role requirement]                      ||
| | 1x Pianist (accompanist)        [filled: 1/1] ||
| | 2x Violinist (ensemble)         [filled: 1/2] ||
| | 1x Cellist (soloist)             [filled: 0/1] ||
| +-----------------------------------------------+|
+---------------------------------------------------+
| Filters                                           |
| [Instrument: All v] [Availability: All v]         |
| [Search musician name...             ]            |
+---------------------------------------------------+
| Musicians                                         |
| +-----------------------------------------------+|
| | [x] Miriam Cohen                              ||
| |     Piano | 300 ILS/hr | Available             ||
| |     Role: [Accompanist v]                      ||
| +-----------------------------------------------+|
| | [ ] David Levy                                 ||
| |     Piano | 250 ILS/hr | Conflict: lesson 14h ||
| |     Role: [-- Select --  v]                    ||
| +-----------------------------------------------+|
| | [x] Sarah Ben-Ami                              ||
| |     Violin | 200 ILS/hr | Available            ||
| |     Role: [Ensemble v]                         ||
| +-----------------------------------------------+|
| | [ ] Oren Katz                                  ||
| |     Violin | 180 ILS/hr | Available            ||
| |     Role: [-- Select --  v]                    ||
| +-----------------------------------------------+|
| | [ ] Rachel Stern                               ||
| |     Cello | 220 ILS/hr | Available             ||
| |     Role: [-- Select --  v]                    ||
| +-----------------------------------------------+|
+---------------------------------------------------+
| Cost Summary                                      |
| 3 musicians x avg 4h = est. 2,800 ILS             |
+---------------------------------------------------+
| [Cancel]                      [Assign 3 Musicians]|
+---------------------------------------------------+
```

### C3. Musician Card Design

Each musician in the list is a selectable card:

```
+-----------------------------------------------+
| [Checkbox]  [Avatar]  Name                    |
|                       Instrument | Rate/hr     |
|                       [Availability badge]     |
|             Role: [Select dropdown v]          |
+-----------------------------------------------+
```

**States:**
- **Unselected:** muted border, muted text for rate
- **Selected:** indigo border-start accent, checkbox filled
- **Conflict:** amber background, warning icon, conflict text in amber
- **Unavailable (not opted in):** not shown in list (filtered out)

**Availability badge variants:**
- `Available` — green badge (`bg-green-100 text-green-800`)
- `Conflict: lesson at 14:00` — amber badge (`bg-amber-100 text-amber-800`)
- `Conflict: other performance` — amber badge
- `Unavailable on this day` — red badge (`bg-red-100 text-red-800`)

### C4. Role Picker

Uses `Select` component per musician card:

```
[-- Select role -- v]
  Soloist
  Ensemble
  Accompanist
  Conductor
```

- When requirements are defined, the role dropdown defaults to the matching requirement
- When no requirements, dropdown starts empty (admin must pick)
- Role is required before assignment can be confirmed

### C5. Requirements Definer (Optional Step)

Inline at the top of the Sheet, collapsible:

```
+-----------------------------------------------+
| Requirements                            [Edit] |
| 1x Pianist (accompanist)         [filled: 1/1] |
| 2x Violinist (ensemble)         [filled: 1/2] |
| 1x Cellist (soloist)             [filled: 0/1] |
+-----------------------------------------------+
```

When editing:
```
+-----------------------------------------------+
| Requirements                                   |
| Instrument: [Piano v] Role: [Accompanist v]    |
|   Count: [1]                          [Remove] |
| Instrument: [Violin v] Role: [Ensemble v]      |
|   Count: [2]                          [Remove] |
| Instrument: [Cello v] Role: [Soloist v]        |
|   Count: [1]                          [Remove] |
| [+ Add requirement]                             |
|                                       [Done]    |
+-----------------------------------------------+
```

**Fill indicator:** Each requirement shows `filled: X/Y` based on how many musicians with matching instrument+role are selected. Uses color:
- `0/Y` = red text
- `partial` = amber text
- `Y/Y` = green text

### C6. Performance Card — Enhanced Display (Kanban + List)

**List view — new Musicians column:**

```
| Event         | Client   | Date       | Musicians       | Quote  | Act. |
| Wedding Party | Sarah C. | 15/04/2026 | 2/3 confirmed   | 3,500  | [...] |
|               |          |            | [Piano] [Violin] |        |       |
```

**Kanban card — enhanced:**

```
+-------------------------------+
| Wedding Party                 |
| Sarah Cohen                   |
| 15/04/2026 14:00              |
|                               |
| Musicians: 2/3 confirmed      |
| [Piano icon] [Violin icon]    |
| Est: 2,800 ILS                |
|                               |
| (expanded: action buttons)    |
+-------------------------------+
```

**Assignment status badge variants:**
- `No musicians assigned` — gray badge
- `2/3 confirmed` — amber badge with partial fill
- `3/3 confirmed` — green badge
- `1 declined` — red badge with warning

### C7. Musician Invitation Page (Teacher View)

New page: `/dashboard/performances/invitations`

```
+-------------------------------------------------+
| Performance Invitations                          |
| Accept or decline invitations to perform.        |
+-------------------------------------------------+
| Card: Wedding Party at Park Hotel                |
|                                                  |
| Date: 15 Apr 2026, 14:00 - 18:00                |
| Your role: Accompanist (Piano)                   |
| Rate: 300 ILS/hr (est. 1,200 ILS total)         |
|                                                  |
| [Accept]              [Decline]                  |
+-------------------------------------------------+
| Card: Corporate Event at Hilton                  |
|                                                  |
| Date: 22 Apr 2026, 19:00 - 22:00                |
| Your role: Ensemble (Violin)                     |
| Rate: 200 ILS/hr (est. 600 ILS total)           |
|                                                  |
| [Accept]              [Decline]                  |
+-------------------------------------------------+
```

**Decline flow:** `AlertDialog` with optional textarea for reason.

**Empty state:**
```
+------------------------------------------+
|     (Music icon, large)                  |
|                                          |
|    No invitations                        |
|    When you are invited to perform,      |
|    invitations will appear here.         |
+------------------------------------------+
```

### C8. Teacher Dashboard Banner

```
+------------------------------------------------------------------+
| (Music icon) You have 2 performance invitations                  |
|                                             [View Invitations ->] |
+------------------------------------------------------------------+
```

Uses `Alert` component, indigo accent, non-dismissible while invitations pending.

### C9. RTL Behavior

- **Sheet:** slides from end side automatically (right in LTR, left in RTL). The Sheet component uses `side="right"` by default. For RTL, use `side={isRtl ? 'left' : 'right'}` to make the Sheet appear on the correct end side.
- **Musician cards:** Avatar + name on start side, availability badge on end side
- **Role dropdown:** `dir={isRtl ? 'rtl' : 'ltr'}` on Select
- **Fill indicators:** numbers are LTR (e.g., "1/3"), text is translated
- **Cost summary:** currency symbol position follows locale (`ILS` suffix in Hebrew)
- **Kanban horizontal scroll:** scroll direction respects `dir` attribute

### C10. Mobile (375px)

- **Sheet goes full-screen:** override `sm:max-w-lg` — on mobile, Sheet takes full viewport width
- **Musician cards:** stack vertically, role dropdown below name/instrument (not inline)
- **Requirements section:** collapsed by default on mobile, expandable
- **Filter bar:** stacks vertically (instrument filter, availability filter, search — each full-width)
- **Invitation cards:** full-width, buttons stacked vertically
- **Kanban cards:** existing `snap-x snap-mandatory` handles horizontal scroll

### C11. Loading States

- **Opening assignment Sheet:** skeleton cards in musician list while loading performers
- **Checking availability:** small spinner next to each musician's availability badge during load
- **Assigning:** "Assign" button shows spinner, Sheet stays open until confirmed
- **Invitation page:** skeleton cards while loading

### C12. Accessibility

- **Sheet:** `SheetTitle` and `SheetDescription` are announced by screen readers (Radix handles this)
- **Musician checkboxes:** `aria-label={t('selectMusician', { name })}` per checkbox
- **Role select:** `aria-label={t('roleFor', { name })}` per dropdown
- **Conflict warnings:** `role="alert"` on conflict badge, also described in `aria-label`
- **Fill indicators:** `aria-label={t('filled', { current, required })}` (e.g., "1 of 3 filled")
- **Cost summary:** wrapped in `aria-live="polite"` region so it updates as musicians are selected
- **Invitation accept/decline:** clear button labels, not icon-only
- **Keyboard navigation:** Tab through musician cards, Space to toggle checkbox, Enter on role dropdown

### C13. i18n String Keys (New)

**Namespace: `PerformanceBooking`** (new keys only):

Assignment sheet:
- `assignSheetTitle` -- "Assign Musicians"
- `eventDuration` -- "{hours}h"
- `requirementsTitle` -- "Requirements"
- `requirementsEdit` -- "Edit"
- `requirementsDone` -- "Done"
- `addRequirement` -- "Add role requirement"
- `removeRequirement` -- "Remove"
- `instrumentLabel` -- "Instrument"
- `roleLabel` -- "Role"
- `countLabel` -- "Count"
- `selectRole` -- "Select role"
- `roleSoloist` -- "Soloist"
- `roleEnsemble` -- "Ensemble"
- `roleAccompanist` -- "Accompanist"
- `roleConductor` -- "Conductor"
- `filled` -- "{current}/{required} filled"
- `filterInstrument` -- "Instrument"
- `filterAvailability` -- "Availability"
- `filterAll` -- "All"
- `searchMusician` -- "Search musician name..."
- `available` -- "Available"
- `conflict` -- "Conflict: {reason}"
- `conflictLesson` -- "lesson at {time}"
- `conflictPerformance` -- "other performance"
- `unavailableDay` -- "Unavailable on this day"
- `ratePerHour` -- "{amount} ILS/hr"
- `selectMusician` -- "Select {name}"
- `roleFor` -- "Role for {name}"
- `costSummaryTitle` -- "Cost Summary"
- `costSummaryDetail` -- "{count} musicians x avg {hours}h = est. {total} ILS"
- `assignCount` -- "Assign {count} Musicians"
- `noMusiciansAvailable` -- "No musicians match the current filters."

Musician status:
- `musiciansNone` -- "No musicians assigned"
- `musiciansPartial` -- "{confirmed}/{total} confirmed"
- `musiciansAllConfirmed` -- "All {total} confirmed"
- `musiciansDeclined` -- "{count} declined"
- `awaitingConfirmation` -- "Awaiting musician confirmation"

Invitation page (teacher):
- `invitationsTitle` -- "Performance Invitations"
- `invitationsSubtitle` -- "Accept or decline invitations to perform."
- `invitationRole` -- "Your role: {role} ({instrument})"
- `invitationRate` -- "Rate: {rate} ILS/hr (est. {total} ILS total)"
- `invitationAccept` -- "Accept"
- `invitationDecline` -- "Decline"
- `declineReasonTitle` -- "Decline invitation?"
- `declineReasonDesc` -- "Optionally provide a reason. The admin will be notified."
- `declineReasonPlaceholder` -- "Reason (optional)..."
- `invitationsEmpty` -- "No invitations"
- `invitationsEmptyDesc` -- "When you are invited to perform, invitations will appear here."
- `invitationBanner` -- "You have {count} performance invitation(s)"
- `viewInvitations` -- "View Invitations"

### C14. Security-Driven UX Constraints

**SEC-CONSTRAINT-2: Decline reason visibility.**
The teacher decline reason is admin-eyes-only. Students, parents, and clients viewing a performance booking see only a "Performer TBD" status for unfilled or declined slots. The decline reason text is never rendered outside admin-role views. The `declineReason` field must be stripped from API responses for non-admin callers (see Security Addendum S3).

### C15. Component Mapping

| UI Element | shadcn Component | Notes |
|-----------|---------|-------|
| Assignment panel | `Sheet` (side={isRtl ? 'left' : 'right'}) | Replace current Dialog. Override max-w to lg. |
| Musician card | `Checkbox` + `Avatar` + `Badge` + `Select` | Custom card layout within ScrollArea |
| Requirements definer | `Collapsible` + inline `Select` + `Input` | Optional, admin can skip |
| Fill indicator | Inline `Badge` with color variants | green/amber/red |
| Cost summary | Inline text in Sheet footer | `aria-live="polite"` |
| Musician filter bar | `Select` + `Input` | Stacks on mobile |
| Invitation card | `Card` + `Button` pair | Full-width on mobile |
| Decline dialog | `AlertDialog` + `Textarea` | Optional reason |
| Dashboard banner | `Alert` with indigo accent | Non-dismissible |
| Assignment status badge | `Badge` in table/kanban | gray/amber/green/red variants |

---

## UX Addendum: Contract-Signing Step (UX-UA Agent)

Following the existing `rental-signing-flow.tsx` pattern, the musician acceptance flow now includes a mandatory contract-signing step. This section details the UX for that flow.

### E1. Updated Musician Acceptance Flow (4 Steps)

The current invitation accept is a single button click. With the legal requirement, it becomes a multi-step flow mirroring the rental signing pattern:

```
Step 1: Review Invitation Details
Step 2: Review Contract Terms
Step 3: Sign Contract (SignatureCapture)
Step 4: Confirmation
```

**Key difference from rental flow:** No OTP step. The musician is already authenticated (logged into their dashboard). The rental flow needs OTP because it is accessed via an external token link by a parent who may not have an account.

### E2. Step 1: Review Invitation Details

Shown when musician clicks "Accept" on an invitation card:

```
+--------------------------------------------------+
| Performance Contract                        [X]  |
|                                                  |
| [1 Details] --- [2 Terms] --- [3 Sign] --- [4]  |
|   (active)      (pending)     (pending)   (done) |
+--------------------------------------------------+
| Event: Wedding Party at Park Hotel               |
| Date: 15 April 2026, 14:00 - 18:00 (4h)         |
| Venue: Park Hotel Grand Ballroom                 |
| Your Role: Accompanist (Piano)                   |
|                                                  |
| Compensation:                                    |
| Rate: 300 ILS/hr x 4h = 1,200 ILS               |
| +VAT (18%): 216 ILS                              |
| Total: 1,416 ILS                                 |
|                                                  |
| Payment: Within 30 days of event completion      |
| Employment type: Independent Contractor           |
+--------------------------------------------------+
| [Cancel]                        [Review Terms ->] |
+--------------------------------------------------+
```

**VAT display rules:**
- If musician is `contractor`: show rate + VAT breakdown (using `vatBreakdown()` from `src/lib/vat.ts`)
- If musician is `employee`: show gross amount, note "Paid via payroll, no VAT applicable"

Uses the existing `Stepper` component (`src/components/ui/stepper.tsx`) for progress visualization.

### E3. Step 2: Review Contract Terms

```
+--------------------------------------------------+
| Performance Contract                        [X]  |
|                                                  |
| [1 Details] --- [2 Terms] --- [3 Sign] --- [4]  |
|   (done)         (active)     (pending)   (done) |
+--------------------------------------------------+
| Contract Terms                                   |
|                                                  |
| +----------------------------------------------+|
| | ScrollArea (max-h-80)                        ||
| |                                              ||
| | 1. Performance Details                       ||
| |    Date: 15 April 2026, 14:00-18:00          ||
| |    Venue: Park Hotel Grand Ballroom           ||
| |    Role: Accompanist (Piano)                  ||
| |                                              ||
| | 2. Compensation                              ||
| |    Rate: 300 ILS/hr, Est. total: 1,200 ILS   ||
| |    Payment within 30 days of completion       ||
| |                                              ||
| | 3. Cancellation Policy                       ||
| |    7-day notice required. Less than 48h:      ||
| |    50% fee. No-show: full fee deducted.       ||
| |                                              ||
| | 4. IP & Recording Rights                     ||
| |    Conservatorium may record for promotional  ||
| |    use. Musician retains performance rights.  ||
| |                                              ||
| | 5. Liability                                 ||
| |    Musician responsible for own instrument.   ||
| |    Conservatorium provides venue insurance.   ||
| +----------------------------------------------+|
|                                                  |
| [ ] I have read and agree to these terms         |
+--------------------------------------------------+
| [<- Back]                     [Continue to Sign] |
+--------------------------------------------------+
```

- Contract content in `ScrollArea` (max-h-80, scrollable)
- Checkbox agreement required before "Continue to Sign" is enabled
- Back button returns to Step 1

### E4. Step 3: Sign Contract (SignatureCapture)

```
+--------------------------------------------------+
| Performance Contract                        [X]  |
|                                                  |
| [1 Details] --- [2 Terms] --- [3 Sign] --- [4]  |
|   (done)         (done)       (active)    (done) |
+--------------------------------------------------+
| Digital Signature                                |
| Sign below to confirm your participation.        |
|                                                  |
| +----------------------------------------------+|
| | [Trash icon]                                 ||
| |                                              ||
| |      (SignatureCapture canvas)               ||
| |                                              ||
| |                                              ||
| +----------------------------------------------+|
|                                                  |
| [ ] I cannot sign digitally -- confirm by        |
|     checkbox instead                             |
+--------------------------------------------------+
| [<- Back]                    [Submit Signature]   |
+--------------------------------------------------+
```

- Reuses the existing `SignatureCapture` component from `src/components/forms/signature-capture.tsx`
- Canvas with dashed border, clear button in start corner
- Fallback checkbox: "I cannot sign digitally" (same pattern as `confirmOnly` in rental flow)
- `SignatureCaptureResult` includes `dataUrl` + `signatureHash` (SHA-256)
- "Submit Signature" disabled until canvas has content OR fallback checkbox is checked

### E5. Step 4: Confirmation

```
+--------------------------------------------------+
| Performance Contract                        [X]  |
|                                                  |
| [1 Details] --- [2 Terms] --- [3 Sign] --- [4]  |
|   (done)         (done)       (done)     (active)|
+--------------------------------------------------+
|                                                  |
|     (CheckCircle icon, large, green)             |
|                                                  |
|     Contract Signed                              |
|     You have confirmed your participation in     |
|     Wedding Party at Park Hotel on 15 Apr 2026.  |
|                                                  |
|     A copy of the signed contract has been        |
|     sent to your email.                          |
|                                                  |
|     [Back to Invitations]                        |
+--------------------------------------------------+
```

### E6. Where the Flow Lives

**Decision:** Use a `Dialog` (not a separate page), because:
- The musician is already on their invitations page
- The flow is short (4 steps, approximately 2 minutes)
- Dialog keeps context (they can see their other invitations behind the overlay)
- On mobile: dialog goes near-full-screen (`sm:max-w-xl`)

The Dialog uses the existing `Stepper` component at the top and swaps content per step.

### E7. Updated Invitation Card (with Contract Status)

After the musician has accepted but before signing:

```
+--------------------------------------------------+
| Wedding Party at Park Hotel                      |
| Date: 15 Apr 2026, 14:00 - 18:00                |
| Your role: Accompanist (Piano)                   |
| Rate: 300 ILS/hr (est. 1,200 ILS)               |
|                                                  |
| Status: Accepted -- Pending Contract Signature   |
|         [amber badge]                            |
|                                                  |
| [Sign Contract]                                  |
+--------------------------------------------------+
```

After signing:

```
+--------------------------------------------------+
| Wedding Party at Park Hotel                      |
| ...                                              |
| Status: Contract Signed [green badge]            |
|                                                  |
| [View Contract PDF]                              |
+--------------------------------------------------+
```

### E8. Admin View -- Contract Status per Musician

In the booking card / assignment Sheet, each musician row now shows contract status:

```
| [x] Miriam Cohen                                |
|     Piano | 300 ILS/hr | Available              |
|     Role: [Accompanist v]                        |
|     Contract: [Signed] (green badge)             |
```

Status badges:
- `Not sent` -- gray (invitation not yet sent)
- `Pending` -- amber (accepted, awaiting signature)
- `Signed` -- green
- `Declined` -- red

The booking cannot advance to `MUSICIANS_CONFIRMED` until all accepted musicians have status `Signed`.

### E9. Updated Status Pipeline

```
INQUIRY_RECEIVED
  -> ADMIN_REVIEWING
     -> [musicians assigned, status: pending]
        -> [musician accepts -> status: accepted_pending_contract]
           -> [musician signs contract -> status: signed]
              -> MUSICIANS_CONFIRMED (all signed)
                 -> QUOTE_SENT -> DEPOSIT_PAID -> BOOKING_CONFIRMED -> EVENT_COMPLETED
```

New per-musician statuses:
- `pending` -- assigned, not yet responded
- `accepted_pending_contract` -- accepted invitation, contract not yet signed
- `signed` -- contract signed, fully confirmed
- `declined` -- declined invitation

### E10. RTL Behavior for Contract Flow

- `Stepper` component already handles RTL (`dir={isRtl ? 'rtl' : 'ltr'}`)
- Contract terms in `ScrollArea`: `text-start`, content area gets `dir={isRtl ? 'rtl' : 'ltr'}`
- `SignatureCapture` already uses `start-2` for clear button (logical property)
- VAT amounts: number formatting follows locale (`toLocaleString()`)
- Currency: ILS symbol placement follows Hebrew convention
- "Back" / "Continue" buttons: positioned with `justify-between`, arrow icons swap for RTL

### E11. Mobile (375px) for Contract Flow

- Dialog goes near-full-screen on mobile
- `Stepper` shows step numbers only (no text labels) to fit 375px
- Contract terms `ScrollArea` max-h reduced to `max-h-60` on mobile
- `SignatureCapture` canvas: full width, aspect ratio 3:1 (maintained)
- Buttons stack vertically on mobile: Back on top, Continue below

### E12. Accessibility for Contract Flow

- **Stepper:** `aria-current="step"` on active step (existing implementation)
- **Contract terms ScrollArea:** `role="document"`, `tabIndex={0}` for keyboard scrolling
- **Agreement checkbox:** `aria-required="true"`, linked to error message via `aria-describedby`
- **SignatureCapture canvas:** `role="img"`, `aria-label={t('signatureCanvas')}`, `tabIndex={0}`
- **Fallback checkbox:** clear full-sentence label: "I cannot sign digitally -- confirm by checkbox instead"
- **Confirmation step:** `role="status"` on the success message
- **Focus management:** on step change, focus moves to the first interactive element in the new step

### E13. New i18n String Keys

**Namespace: `PerformanceContract`** (new namespace):

- `dialogTitle` -- "Performance Contract"
- `stepDetails`, `stepTerms`, `stepSign`, `stepDone`
- `eventLabel`, `dateLabel`, `venueLabel`, `roleLabel`
- `compensationTitle`
- `rateBreakdown` -- "Rate: {rate} ILS/hr x {hours}h = {total} ILS"
- `vatLine` -- "+VAT ({percent}%): {amount} ILS"
- `totalLine` -- "Total: {total} ILS"
- `paymentTerms` -- "Payment: Within {days} days of event completion"
- `employeeNote` -- "Paid via payroll, no VAT applicable"
- `contractorNote` -- "Independent Contractor"
- `reviewTermsBtn` -- "Review Terms"
- `contractTermsTitle` -- "Contract Terms"
- `termsPerformance`, `termsCompensation`, `termsCancellation`, `termsIP`, `termsLiability`
- `agreeCheckbox` -- "I have read and agree to these terms"
- `continueToSign` -- "Continue to Sign"
- `signatureTitle` -- "Digital Signature"
- `signatureDesc` -- "Sign below to confirm your participation."
- `fallbackCheckbox` -- "I cannot sign digitally -- confirm by checkbox instead"
- `submitSignature` -- "Submit Signature"
- `confirmationTitle` -- "Contract Signed"
- `confirmationDesc` -- "You have confirmed your participation in {event} on {date}."
- `emailSent` -- "A copy of the signed contract has been sent to your email."
- `backToInvitations` -- "Back to Invitations"
- `signContract`, `viewContractPdf`
- `contractStatusNotSent`, `contractStatusPending`, `contractStatusSigned`, `contractStatusDeclined`
- `pendingContractBadge` -- "Pending Contract Signature"
- `unsigned48hWarning` -- "{name} has not signed their contract (48h+). Follow up?"

### E14. Updated Component Mapping (additions)

| UI Element | shadcn Component | Notes |
|-----------|---------|-------|
| Contract signing dialog | `Dialog` (sm:max-w-xl) | 4-step flow inside dialog |
| Step progress | `Stepper` (existing) | Already RTL-aware |
| Contract terms | `ScrollArea` (max-h-80) + `Checkbox` | Agreement required |
| Signature canvas | `SignatureCapture` (existing) | Reuse from `src/components/forms/` |
| Fallback confirm | `Checkbox` | "Cannot sign digitally" option |
| Confirmation | CheckCircle icon + text | Success state |
| Contract status badge | `Badge` (gray/amber/green/red) | Per-musician in admin view |
| Contract PDF link | `Button` variant="link" | Opens PDF in new tab |

---

## Security Addendum (Response to BLOCKING-SEC-01, SEC-CROSS-03)

### S1. `withAuth()` Role Enforcement (BLOCKING-SEC-01)

All performance server actions must use the enhanced `withAuth()` with explicit role lists:

```typescript
// Assign musicians: admin-only
export const assignMusiciansToPerformanceAction = withAuth(
  schema,
  { roles: ['conservatorium_admin', 'delegated_admin', 'site_admin'] },
  async (payload, claims) => {
    // Verify booking belongs to admin's conservatorium
    const booking = await db.performanceBookings.get(payload.bookingId);
    if (!GLOBAL_ADMIN_ROLES.includes(claims.role) && booking.conservatoriumId !== claims.conservatoriumId) {
      throw new Error('TENANT_MISMATCH');
    }
    // ...
  }
);

// Respond to invitation: teacher only, must be the assigned musician
export const respondToPerformanceInvitationAction = withAuth(
  schema,
  { roles: ['teacher'] },
  async (payload, claims) => {
    const booking = await db.performanceBookings.get(payload.bookingId);
    const assignment = booking.assignedMusicians?.find(m => m.userId === claims.userId);
    if (!assignment) {
      throw new Error('FORBIDDEN');  // Not assigned to this booking
    }
    // ...
  }
);

// Set requirements: admin-only
export const setPerformanceRequirementsAction = withAuth(
  schema,
  { roles: ['conservatorium_admin', 'delegated_admin', 'site_admin'] },
  async (payload, claims) => { /* ... */ }
);
```

### S2. conservatoriumId Override (SEC-CROSS-03)

All performance write actions must enforce tenant isolation:

```typescript
// Inside every performance server action:
if (!GLOBAL_ADMIN_ROLES.includes(claims.role)) {
  // Verify booking belongs to caller's conservatorium
  const booking = await db.performanceBookings.get(payload.bookingId);
  if (booking.conservatoriumId !== claims.conservatoriumId) {
    throw new Error('TENANT_MISMATCH');
  }
}
```

For musician assignment: verify each assigned musician belongs to the same conservatorium (or has cross-conservatorium flag):
```typescript
for (const assignment of payload.assignments) {
  const musician = await db.users.get(assignment.userId);
  if (!GLOBAL_ADMIN_ROLES.includes(claims.role)
      && musician.conservatoriumId !== claims.conservatoriumId
      && !musician.performanceProfile?.allowCrossConservatorium) {
    throw new Error('TENANT_MISMATCH');
  }
}
```

### S3. Sensitive Data Protection (SEC-PERF-07)

**Musician rates:** The `ratePerHour` field must be stripped from API responses for non-admin callers. One musician must NEVER see another musician's rate on the same booking.

**Important:** Do NOT mutate the DB result object in-place (e.g., `delete m.ratePerHour`) -- this corrupts cached/reused data. Instead, create a projection/DTO:

```typescript
// When returning booking data to non-admin callers:
function projectBookingForRole(booking: PerformanceBooking, role: UserRole): PerformanceBooking {
  if (isAdminRole(role)) return booking;  // admin sees everything

  return {
    ...booking,
    estimatedMusicianCost: undefined,
    assignedMusicians: booking.assignedMusicians?.map(m => ({
      userId: m.userId,
      name: m.name,
      instrument: m.instrument,
      role: m.role,
      status: m.status,
      responseAt: m.responseAt,
      // ratePerHour, declineReason intentionally omitted
    })),
  };
}
```

**Decline reasons:** Only visible to admin roles, never to clients or other musicians.

### S4. Musician Consent Verification (SEC-PERF-08)

Before assigning a musician, verify:
1. `performanceProfile.isOptedIn === true` (musician actively opted in)
2. `performanceProfile.adminApproved === true` (admin has vetted them)
3. Musician's account is active (not suspended/deactivated)

```typescript
const musician = await db.users.get(assignment.userId);
if (!musician.performanceProfile?.isOptedIn || !musician.performanceProfile?.adminApproved) {
  throw new Error('MUSICIAN_NOT_ELIGIBLE');
}
```

**Post-assignment opt-out handling (SEC-PERF-08):** If a musician sets `isOptedIn = false` after being assigned to a booking, the system does NOT auto-remove them. Instead:
1. The booking card shows a warning badge: "1 musician opted out".
2. The admin is notified via in-app notification.
3. The admin must manually reassign the slot or confirm removal.
This prevents silent changes to confirmed bookings.

### S5. Security in Implementation Steps

These security requirements are now incorporated as Phase 1 of the Implementation Steps (section 8). No separate migration needed -- security is built in from the start.

---

## 10. Product Requirements (PM)

### User Stories

**US-1:** As a conservatorium admin, I want to define what musicians a performance booking needs (e.g., 1 pianist, 2 violinists), so that I can systematically fill the roster.

**US-2:** As a conservatorium admin, I want to search and filter musicians by instrument, availability, and rate when assigning them to a booking, so that I can find the best match quickly.

**US-3:** As a conservatorium admin, I want to see schedule conflicts (lesson at the same time, another gig) when selecting a musician, so that I avoid double-booking.

**US-4:** As a conservatorium admin, I want to assign a role (soloist, ensemble, accompanist, conductor) to each musician, so that the event program is clearly defined.

**US-5:** As a teacher/musician, I want to receive a notification when I'm invited to perform at an event, so that I can accept or decline.

**US-6:** As a teacher/musician, I want to decline a performance invitation with a reason, so that the admin knows why and can find a replacement.

**US-7:** As a conservatorium admin, I want to see the estimated cost of all assigned musicians, so that I can set an accurate quote for the client.

**US-8:** As a conservatorium admin, I want the system to auto-advance the booking to "Musicians Confirmed" when all assigned musicians accept, so that I know the booking is ready for quoting.

### Acceptance Criteria

**AC-1: Instrument filter in assignment dialog**
- Given an admin assigning musicians to a wedding booking that needs a pianist
- When they select "Piano" in the instrument filter
- Then only teachers with Piano as their instrument and an active performance profile are shown

**AC-2: Availability check**
- Given a teacher who has a lesson at 14:00 on the event date
- When the admin opens the assignment dialog for an event at 13:00-16:00
- Then that teacher shows a yellow "Conflict: lesson at 14:00" warning
- And the admin can still assign them (warning, not blocker)

**AC-3: Role assignment per musician**
- Given an admin assigning Sarah as a violinist to an ensemble booking
- When they check Sarah's row in the assignment dialog
- Then a role dropdown appears with options: Soloist / Ensemble / Accompanist / Conductor
- And they select "Ensemble"

**AC-4: Musician receives invitation**
- Given an admin who assigns 3 musicians to a booking
- When the assignment is saved
- Then each musician receives an in-app notification with event details and Accept/Decline buttons

**AC-5: All musicians accept advances status**
- Given a booking with 3 assigned musicians, 2 have accepted
- When the 3rd musician accepts
- Then the booking status automatically advances to MUSICIANS_CONFIRMED
- And the admin receives a notification: "All musicians confirmed for [event]"

**AC-6: Musician declines triggers alert**
- Given a musician who declines a performance invitation
- When they submit the decline with reason "schedule conflict"
- Then the admin sees the booking with "2/3 confirmed - 1 declined" badge
- And a notification: "[musician] declined. Reason: schedule conflict"

**AC-7: Cost calculation**
- Given a booking with 3 assigned musicians (rates: 250, 300, 200 ILS/hr) and a 3-hour event
- When the admin views the booking card
- Then the estimated cost shows: 2,250 ILS (750/hr x 3 hours)

**AC-8: Requirements definition**
- Given an admin opening the assignment Sheet
- When they click "Add role requirement"
- Then they can specify: 1x Pianist (accompanist), 2x Violinist (ensemble)
- And the Sheet groups the musician search by required role
- And fill indicators show progress (0/1, 1/2, etc.)

### Edge Cases

| Edge Case | Handling |
|-----------|---------|
| Musician opts out of performance profile after being assigned | Admin notified. Assignment shows "Profile deactivated" warning. Admin should reassign. |
| Event date changes after musicians assigned | All assigned musicians re-notified. Their acceptance resets to "pending". |
| Musician from different conservatorium | Not allowed in v1. v2: cross-conservatorium performers with explicit flag. |
| Musician has no rate set | Show "Rate: not set" in dialog. Admin can override per-booking. |
| All musicians decline | Show "0/3 confirmed - all declined". Admin alerted. Status does NOT auto-advance. |
| Admin removes musician after acceptance | Musician notified of cancellation. Status reverts if was MUSICIANS_CONFIRMED. |
| Same musician in overlapping events | Conflict warning shown. Both assignments allowed (admin override). |
| Event cancelled after musicians confirmed | All musicians notified. Booking status -> cancelled. |
| No opted-in musicians available | Empty state in dialog: "No musicians match filters. Invite teachers to opt in to performances." |
| Decline reason visibility | Admin sees all decline reasons. The declined musician sees their own reason. Other musicians and clients see only "Performer TBD" for unfilled slots. (SEC-PERF-04) |

### Legal & Contract User Stories

**US-9:** As a conservatorium admin, I want the system to generate a formal quotation PDF when I send a quote to the client, so that the client has an official document with VAT breakdown, payment terms, and cancellation policy as required by Israeli law.

**US-10:** As a conservatorium admin, I want a binding performance contract generated for each confirmed musician, so that both parties have a signed agreement covering date/time/venue, fee, repertoire, cancellation terms, IP/recording rights, and liability.

**US-11:** As a teacher/musician, I want to digitally sign my performance contract before the booking is finalized, so that I have a legally binding record of the engagement terms.

**US-12:** As a conservatorium admin, I want the system to distinguish between musicians who are employees (salaried) vs. independent contractors (sole proprietors), so that the correct tax treatment (VAT invoice vs. payroll) is applied.

**US-13:** As a conservatorium admin, I want all quotations and contracts to be stored for at least 7 years, so that the conservatorium complies with Israeli tax document retention requirements.

### Legal & Contract Acceptance Criteria

**AC-9: Quotation PDF with VAT breakdown**
- Given a booking with 3 confirmed musicians and a total quote of 7,500 ILS (before VAT)
- When the admin clicks "Send Quote"
- Then a PDF is generated showing: line items per musician (name, instrument, role, hours, rate), subtotal, VAT (18% = 1,350 ILS), total (8,850 ILS), payment terms, and cancellation policy
- And the PDF includes the conservatorium's business details (name, address, tax ID)

**AC-10: Contract generation on musician acceptance**
- Given a musician who clicks "Accept" on a performance invitation
- When the acceptance is processed
- Then a digital contract is generated with: performance details (date, time, venue, repertoire), fee terms (rate, estimated total, payment timeline), cancellation clause (notice period, no-show penalty), IP/recording rights clause, and liability clause
- And the musician is prompted to sign via the SignatureCapture component

**AC-11: Digital signature for contracts**
- Given a musician viewing their performance contract
- When they complete the SignatureCapture step
- Then the signature is saved (via `saveSignatureAction` pattern from rental-signing-flow)
- And the contract PDF is generated with the embedded signature
- And the contract status is marked as "Signed"
- And the booking status can proceed to QUOTE_SENT only after all musician contracts are signed

**AC-12: Employee vs. contractor distinction**
- Given a musician who is marked as an employee (salaried) in their profile
- When a booking includes them
- Then their fee is treated as gross salary (no VAT line item for them)
- Given a musician marked as an independent contractor (sole proprietor)
- When a booking includes them
- Then the quotation shows their fee + VAT and notes: "Receipt required from contractor"

**AC-13: 7-year document retention**
- Given a completed performance booking with quotation and contracts
- When the event is marked as EVENT_COMPLETED
- Then the quotation PDF, all signed contract PDFs, and payment records are archived
- And the system enforces a minimum 7-year retention period before any automated deletion

### Legal Edge Cases (addendum)

| Edge Case | Handling |
|-----------|---------|
| Musician accepts but refuses to sign contract | Acceptance is conditional. Status stays "pending contract" until signature. Admin alerted after 48h if unsigned. |
| Contract terms change after musician signed | New contract version generated. Old version archived. Musician must re-sign. |
| Musician is both employee AND has independent contractor side gigs | Profile field `employmentType: 'employee' | 'contractor' | 'both'`. Admin selects applicable type per booking. |
| VAT rate changes between quotation and event date | Quotation is binding at the rate issued. Contract notes: "VAT rate as of quotation date." |
| Client disputes quote after it was sent | Quotation is timestamped and stored as PDF. Admin can issue revised quote (new version, old archived). |
| Musician no-shows after signing contract | Contract includes no-show penalty clause. Admin marks as no-show, penalty applied per contract terms. |
| Cross-conservatorium musician (v2) | Contract must specify which conservatorium is the contracting entity. |

### v1 vs v2

**v1 (ship now):**
- Enhanced assignment Sheet: instrument filter, role picker, musician search
- Availability conflict warnings (lessons + other performances)
- Musician invitation/response flow (accept/decline via dashboard)
- Auto-advance to MUSICIANS_CONFIRMED when all accept
- Cost estimation from rates (with VAT breakdown using `vatBreakdown()` from `src/lib/vat.ts`)
- Assignment status badges on booking cards
- Teacher invitations page + dashboard banner
- Quotation PDF generation with VAT breakdown (uses existing VAT_RATE = 18%)
- Contract generation on musician acceptance (follows rental-signing-flow.tsx pattern)
- Digital signature via SignatureCapture for musician contracts
- Employee vs. contractor distinction per musician

**v2 (future):**
- Requirements definition (specify needed roles before assigning)
- Cross-conservatorium musician assignment (with multi-entity contract support)
- Musician availability calendar (block dates)
- AI-suggested musician matching (genre, history, rate)
- Client-facing booking portal with online quote acceptance
- Post-event musician rating system
- Ensemble templates (save common musician lineups for reuse)
- Automated receipt tracking for contractor musicians (receipt upload + reconciliation)
- Integration with accounting/ERP for payroll vs. contractor payment flows


---

## 13. Legal Requirements (Legal Expert)

> Full legal brief: [`docs/legal/performance-booking-legal-brief.md`](../../legal/performance-booking-legal-brief.md)

### L1. Three-Party Legal Structure

The performance booking involves three legal relationships:

1. **Client <-> Conservatorium:** Service agreement (quotation + contract). The conservatorium is the contracting entity, NOT the musician.
2. **Conservatorium <-> Musician:** Internal engagement agreement. The musician performs on behalf of the conservatorium.
3. **Platform (Lyriosa) <-> Conservatorium:** Governed by the MSA (`docs/contracts/MSA-TEMPLATE.md`).

**Implication for UX:** The "Send Quote" dialog sends documents from the conservatorium to the client. Musician names may appear in the quotation, but the conservatorium is the liable party.

### L2. Quotation Document -- Mandatory Fields

Every quotation generated by the platform MUST include these fields (legal basis in parentheses):

| Field | Legal Basis |
|-------|-------------|
| Quotation number (sequential per conservatorium) | Tax records (7-year retention) |
| Date of issue | Contract Law S. 3 |
| Validity period (default: 14 days) | Contract Law S. 3(2) |
| Conservatorium details (name, address, registration number) | VAT Law S. 47 |
| Client details (name, address, contact) | Contract Law |
| Event details (date, time, venue, duration) | Contract specifics |
| Itemized service description (musicians, instruments, roles) | Consumer Protection S. 4A |
| **Itemized pricing with per-line totals** | Consumer Protection S. 17A |
| **Subtotal (net of VAT)** | VAT Law S. 47 |
| **VAT amount (18%, shown separately)** | VAT Law S. 47 |
| **Total including VAT** | Consumer Protection S. 17A |
| Payment terms (deposit amount, balance due date) | Contract terms |
| Cancellation terms (must reference 14-day cooling-off) | Consumer Protection S. 14g |

**VAT note:** Current Israeli VAT rate is 18% (since Jan 2025). The platform handles this via `src/lib/vat.ts` with `VAT_RATE = 0.18` and per-conservatorium overrides via `getVatRate()`. All specs now use 18%.

**Quotation validity:** After expiry, the quotation auto-transitions to `EXPIRED` status. An expired quotation is no longer a binding offer (Contract Law S. 3(2)). Admin can re-issue.

### L3. Contract Clauses -- Mandatory Under Israeli Law

Upon client acceptance, a binding contract is auto-generated. Required clauses:

1. **Parties** -- Full legal identities with registration numbers
2. **Scope of Services** -- Musicians, instruments, roles, program, equipment responsibilities
3. **Fee and Payment** -- Itemized with VAT shown separately; deposit + balance schedule; late payment interest (Prime + 4%)
4. **Client Cancellation:**
   - **14-day cooling-off** (Consumer Protection S. 14g for distance transactions): max 5% or ILS 100 cancellation fee
   - **After cooling-off:** graduated scale -- 25% (>30 days) / 50% (14-30 days) / 75% (7-14 days) / 100% (<7 days)
5. **Conservatorium Cancellation** -- Full refund within 14 business days; best-effort replacement; liability capped at contract value
6. **Musician No-Show** -- Replacement within 1 hour or pro-rata refund + 10% compensation on missing musician's portion
7. **IP/Recording Rights** -- Personal recording allowed; commercial/streaming requires separate written consent; moral rights non-waivable (Copyright Law S. 45)
8. **Insurance and Liability** -- Capped at total contract value; no consequential damages
9. **Force Majeure** -- Including military reserve duty (miluim); full refund minus documented expenses; 60-day rescheduling
10. **Data Protection** -- DSAR rights (Privacy Protection Law, Amendment 13); 7-year retention
11. **Dispute Resolution** -- 14-day negotiation -> mediation -> court in conservatorium's district; Small Claims Court for contracts under ILS 35,800
12. **General Provisions** -- Hebrew governs; electronic signatures valid (Electronic Signature Law 5761-2001)

**Contract language:** Hebrew is the binding version. Auto-generated translations in 4 locales for convenience; Hebrew prevails in conflict. Cancellation terms must be in minimum 12pt bold font (Consumer Protection Regulations).

### L4. Signing Flow -- Legal Sequence

```
1. Admin creates quotation (DRAFT)
2. Admin sends to client (QUOTE_SENT) -- 14-day validity clock starts
3. Client signs electronically (CLIENT_SIGNED) -- triggers contract generation
4. Contract auto-generated from accepted quotation (all clauses above)
5. Client pays deposit (DEPOSIT_PAID)
   -> 14-day cooling-off clock starts from signing date
   -> Deposit held in "escrow" state (NOT disbursed to musicians yet)
6. Admin countersigns (optional) (BOOKING_CONFIRMED)
7. Musicians notified -- 72-hour accept/decline deadline
8. All musicians accept (MUSICIANS_CONFIRMED)
9. Cooling-off period expires -> musician payments may be triggered
```

**Signature requirements:**
- Contracts under ILS 50,000: Basic electronic signature via SignatureCapture is sufficient
- Contracts over ILS 50,000: Platform should warn admin to recommend certified signature or physical signing
- Every signature creates an immutable SignatureAuditRecord (extends existing `src/app/actions/signatures.ts` pattern)

### L5. Musician Tax Status

The PerformanceProfile MUST include tax status fields:

```typescript
taxStatus: 'employee' | 'licensed_dealer' | 'exempt_dealer';
taxId?: string;                      // Business registration number
hasWithholdingExemption?: boolean;   // Valid exemption certificate?
withholdingExemptionExpiry?: string;  // ISO date -- warn admin if expired
```

| Status | Hebrew | Payment Flow | Document |
|--------|--------|-------------|----------|
| Employee | עובד שכיר | Conservatorium withholds income tax + Bituach Leumi | Pay stub |
| Licensed Dealer | עוסק מורשה | Musician invoices with VAT; conservatorium claims VAT offset | Tax Invoice |
| Exempt Dealer | עוסק פטור | Musician invoices without VAT; no offset | Receipt |

### L6. Internal Musician Engagement -- Cancellation Penalties

| Timing | Penalty |
|--------|---------|
| Declined within 72h response deadline | None |
| Accepted, cancels > 72h before event | Warning on profile; no financial penalty |
| Accepted, cancels 24-72h before event | ILS 200 or 20% of fee (whichever lower) |
| Accepted, cancels < 24h / no-show | Full fee forfeited; admin may revoke adminApproved |

**Response deadline:** 72 hours (configurable). No response = offer lapses (Contract Law S. 4(2)), assignment status -> expired, admin notified.

**Acceptance = binding commitment.** Platform records: timestamp, IP address, user agent.

### L7. Data Retention -- 7-Year Statutory Minimum

All performance-related records retained for **7 years** from event date (Income Tax Ordinance S. 25, VAT Law S. 74):

- Quotations, contracts, invoices, signature audit records, payment records, engagement records, cancellation records
- After retention: anonymize (not delete) for aggregate analytics
- DSAR exports must include performance booking data
- Deletion requests must respect 7-year tax retention window

### L8. Deposit Escrow Risk

**Risk:** If conservatorium disburses the client's deposit to musicians before the 14-day cooling-off expires, a client cancellation within cooling-off creates a cash flow problem.

**Mitigation:** Enforce a coolingOffExpiresAt field (14 days from contract signing). Musician payments blocked until cooling-off expires OR event occurs (whichever is first).

### L9. Compliance Priority Matrix

| # | Requirement | Priority | Codebase Status |
|---|-------------|----------|----------------|
| L-01 | VAT breakdown on quotations | CRITICAL | vat.ts exists; integrate into quotation PDF |
| L-02 | 14-day cooling-off clause | CRITICAL | Not implemented; add to contract template |
| L-03 | All prices shown with VAT | CRITICAL | formatWithVAT() exists; enforce in Send Quote dialog |
| L-04 | Signature audit trail for quotation/contract | HIGH | signatures.ts exists; extend for new document types |
| L-05 | Musician tax status field | HIGH | Add to PerformanceProfile type |
| L-06 | 7-year document retention policy | HIGH | Firestore exists; add retainUntil field |
| L-07 | Quotation validity/expiry | HIGH | Add validity period + auto-expire logic |
| L-08 | Recording/IP rights clause | MEDIUM | Add to contract template |
| L-09 | Force majeure incl. miluim | MEDIUM | Add to contract template |
| L-10 | Withholding exemption expiry warning | MEDIUM | Add to musician profile UI |
| L-11 | Cooling-off escrow enforcement | MEDIUM | Add coolingOffExpiresAt + payment gate |

### L10. Recommended Data Model: PerformanceQuotation

```typescript
export type PerformanceQuotation = {
  id: string;
  bookingId: string;
  conservatoriumId: string;
  quotationNumber: string;       // Sequential per conservatorium
  issuedAt: string;              // ISO timestamp
  validUntil: string;            // ISO timestamp (default: +14 days)
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'cancelled';

  // Client
  clientName: string;
  clientCompany?: string;
  clientIdNumber?: string;       // Company registration or personal ID
  clientAddress?: string;
  clientEmail: string;
  clientPhone: string;

  // Line items
  lineItems: {
    description: string;         // "Pianist (accompanist) - 4 hours"
    musicianUserId?: string;
    quantity: number;            // hours
    unitPrice: number;           // ILS per hour (net of VAT)
    total: number;               // quantity * unitPrice
  }[];

  // Financials
  subtotal: number;
  vatRate: number;               // 0.18
  vatAmount: number;
  totalIncVat: number;
  depositRequired: number;
  depositDueDate?: string;

  // Cancellation
  cancellationTermsAccepted?: boolean;
  coolingOffExpiresAt?: string;  // 14 days from acceptance

  // Signatures
  clientSignature?: {
    signatureUrl: string;
    signatureHash: string;
    signedAt: string;
    ipAddress: string;
    userAgent: string;
  };

  // Retention
  retainUntil: string;           // eventDate + 7 years
};
```

### L11. VAT Rate Confirmation

All PM acceptance criteria (AC-9, v1 bullet) now correctly reference 18% VAT, matching `src/lib/vat.ts` (VAT_RATE = 0.18). No further correction needed.

---

## UI/UX Pro Max Review (Main Session)

**Design System Applied:** Data-Dense Dashboard · Lyriosa palette · shadcn/ui

### UX Quality Checklist

| Check | Status |
|---|---|
| 44px touch targets on musician card checkboxes | ⚠️ use `min-h-[44px]` on card rows |
| Sheet side RTL: `side={isRtl ? 'left' : 'right'}` | ✅ in UX-UA spec — confirm in implementation |
| Loading state on "Send Invitations" button | ⚠️ specify |
| `aria-live="polite"` on cost summary in Sheet footer | ✅ in UX-UA spec |
| `cursor-pointer` on musician selection cards | ⚠️ add |
| Keyboard: musician cards navigable with arrow keys | ⚠️ add `role="option"` + arrow key handling |
| Conflict indicator: color not sole indicator | ⚠️ add "Unavailable" text, not just gray color |

### Greenfield: Simplified Performance Pipeline

The current 7-stage pipeline is over-engineered for greenfield. Replace with clean stages:

```typescript
type PerformanceBookingStatus =
  | 'DRAFT'                  // admin creating, not yet submitted
  | 'PENDING_REVIEW'         // submitted for internal review
  | 'MUSICIANS_NEEDED'       // approved, admin assigning musicians
  | 'INVITATIONS_SENT'       // musicians notified, awaiting responses
  | 'QUOTE_READY'            // all musicians confirmed, quote generated
  | 'QUOTE_SENT'             // client received quote
  | 'CONTRACTS_PENDING'      // client accepted quote, contracts being signed
  | 'CONFIRMED'              // all contracts signed, deposit received
  | 'COMPLETED'              // event performed
  | 'CANCELLED'              // cancelled at any stage (with reason)
```

**What changed:**
- Removed "Manager Review" and "Music Review" as separate stages — collapse to `PENDING_REVIEW`
- `MUSICIANS_NEEDED` replaces ambiguous middle stages
- `CONTRACTS_PENDING` is explicit (new legal requirement)
- `CONFIRMED` requires both contract + deposit (per legal brief)

### Musician Selection Sheet: Enhanced Card Design

```
┌─────────────────────────────────────────────┐  Sheet (side=right/left per RTL)
│ 🎵 Assign Musicians                    [×]  │
│ Performance: Winter Concert 2026            │
├─────────────────────────────────────────────┤
│ [Filter: Instrument ▾] [Availability ▾]     │
│ 3 musicians selected · Est. ₪4,500          │
├─────────────────────────────────────────────┤
│ ☑ ┌────────────────────────────────────┐   │
│   │ 👤 מרים כהן          🟢 Available  │   │
│   │    Piano · Accompanist ▾           │   │
│   │    ₪250/hr · Solo: ✓ Chamber: ✓   │   │
│   └────────────────────────────────────┘   │
│ ☐ ┌────────────────────────────────────┐   │
│   │ 👤 דוד לוי           🔴 Unavailable│   │
│   │    Violin · [conflict: lesson 14:00]│   │
│   └────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│ Cost summary:              aria-live        │
│   מרים כהן: 2h × ₪250 = ₪500              │
│   Subtotal: ₪500 · VAT 18%: ₪90            │
│   Total: ₪590                              │
├─────────────────────────────────────────────┤
│              [Cancel]  [Send Invitations →] │
└─────────────────────────────────────────────┘
```

### Role Select Dropdown (within musician card)

```tsx
<Select value={assignment.role} onValueChange={updateRole} 
  dir={isRtl ? 'rtl' : 'ltr'}>
  <SelectTrigger className="h-7 text-xs w-[130px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="soloist">{t('roles.soloist')}</SelectItem>
    <SelectItem value="ensemble">{t('roles.ensemble')}</SelectItem>
    <SelectItem value="accompanist">{t('roles.accompanist')}</SelectItem>
    <SelectItem value="conductor">{t('roles.conductor')}</SelectItem>
  </SelectContent>
</Select>
```

### Contract Signing Step: Error Recovery

The 4-step dialog needs explicit error recovery states (missing from UX-UA spec):
- **Signature too small/empty**: `role="alert"` message "Signature required" below canvas, retry
- **Network error on submit**: Toast + "Try again" button, signature data preserved in component state (not lost)
- **Contract already signed** (race condition): Show "Already signed" confirmation, skip to step 4
- **Session expired mid-flow**: Redirect to login with `callbackUrl` back to invitations page

### Invitation Pending Dashboard Banner (Teacher-side)

When a teacher receives a performance invitation, show on their dashboard:
```
┌─────────────────────────────────────────────────────┐
│ 🎵 Performance Invitation                  [View →] │
│ Winter Concert · Dec 24 · 19:00 · Piano Accompanist │
│ Respond by: Dec 10 (5 days)                         │
└─────────────────────────────────────────────────────┘
```
- `variant="default"` (not destructive) — opportunity, not urgent issue
- Dismissible after viewing (not after responding)
- If deadline < 48h: switch to `variant="destructive"` amber styling
