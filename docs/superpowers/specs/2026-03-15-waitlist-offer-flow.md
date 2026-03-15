# Waitlist Offer Flow -- UX and Business Logic

**Date:** 2026-03-15
**Author:** Architect Agent
**Status:** DRAFT -- ready for team review

---

## 1. Current State Analysis

### Existing Infrastructure
- **Page:** `/dashboard/admin/waitlists` renders `AdminWaitlistDashboard`.
- **Type:** `WaitlistEntry` (types.ts:1097) with status enum `WaitlistStatus = 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'`.
- **Client state:** `useAuth()` exposes `waitlist`, `addToWaitlist`, `updateWaitlistStatus`, `offerSlotToWaitlisted`, `acceptWaitlistOffer`, `declineWaitlistOffer`, `expireWaitlistOffers`, `revokeWaitlistOffer`.
- **Current "offer" flow:** Admin clicks "Send Offer" button, which calls `offerSlotToWaitlisted(entryId, slotId, slotTimeLabel)`. This sets status to `OFFERED` with a hardcoded slot label. No actual slot selection, no notification, no expiry enforcement beyond a client-side `setInterval`.

### Gaps
1. No slot selection UI -- admin just sends a generic "offer" without choosing a real available slot.
2. No delivery mechanism -- no email/notification sent to parent/student.
3. Expiry is client-side only (`setInterval` every 60s) -- not persisted across sessions.
4. No parent/student-facing UI to accept/decline the offer.
5. No FIFO enforcement -- admin can offer to anyone regardless of queue position.
6. No interaction with package purchase flow.

---

## 2. Architectural Decisions

### 2.1 Offer Model: Admin-Driven, FIFO-Suggested

**Decision:** Show the queue in FIFO order (sorted by `joinedAt`). Highlight the next-in-line entry. Allow admin to offer to any entry, but show a warning if skipping ahead.

**Rationale:** Some families may have scheduling constraints that make the next available slot unsuitable. The admin needs flexibility to skip, but the system should guide toward fairness.

### 2.2 Slot Selection at Offer Time

**Decision:** When admin clicks "Send Offer", open a dialog that lets them pick a real `LessonSlot` from the teacher's available slots.

**New component:** `OfferSlotDialog`

```typescript
// Props contract
interface OfferSlotDialogProps {
  entry: WaitlistEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (entryId: string, slotId: string, offerExpiresAt: string) => void;
}
```

The dialog:
1. Fetches available slots for `entry.teacherId` (filtered by `entry.preferredDays` and `entry.preferredTimes`).
2. Shows a mini-schedule view with available time blocks.
3. Admin selects a slot, confirms offer.
4. Sets `offerExpiresAt` to `now + 48 hours` (default, configurable).

### 2.3 Offer Expiry Window

**Decision:** 48 hours default. Configurable per conservatorium in future (add `waitlistOfferExpiryHours?: number` to `Conservatorium` type).

**Enforcement:** Expiry must be enforced server-side, not just client-side `setInterval`.

**Implementation approach:**
- Server Action `expireWaitlistOffersAction()` runs on page load of the admin waitlist page.
- Additionally, a cron-like check on any waitlist-related page load.
- For the mock adapter, the current `setInterval` approach is acceptable for demo.
- For production (postgres/supabase): a `CHECK` constraint or a scheduled function.

### 2.4 Delivery Mechanism

**Decision:** Multi-channel notification.

When an offer is sent:
1. **In-app notification** created via `Notification` type, with `link: '/dashboard/waitlist/offer/{entryId}'`.
2. **Email** sent to the parent/student's email address (via the notification system's email channel).
3. **SMS** (future) -- flag as optional, depends on conservatorium having SMS provider configured.

The notification should include:
- Teacher name, instrument, proposed day/time.
- Expiry deadline ("You have 48 hours to respond").
- Direct link to accept/decline.

### 2.5 Parent/Student Accept/Decline UI

**New page:** `/dashboard/waitlist/offer/[entryId]`

This page shows:
- Offer details (teacher, instrument, day, time).
- Countdown timer showing time remaining.
- Two buttons: "Accept" and "Decline".
- A third option: "Defer" (stay on waitlist, keep position).

```typescript
// New WaitlistStatus values needed
export type WaitlistStatus = 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'DEFERRED';
```

### 2.6 What Happens After Each Action

| Action | Result | Next Step |
|---|---|---|
| **Accept** | Status -> `ACCEPTED`, `offerAcceptedAt` set | Redirect to package purchase page. Slot is soft-reserved for 24h pending payment. |
| **Decline** | Status -> `DECLINED` | Entry removed from waitlist. Admin notified. Next in queue highlighted. |
| **Defer** | Status -> `WAITING`, `deferredCount` incremented, position preserved | Entry stays in queue. Admin sees "deferred 1x" badge. Max 2 defers, then auto-decline on 3rd offer. |
| **Expire** | Status -> `EXPIRED` | Same as decline. Admin notified. Next in queue highlighted. |

### 2.7 Package Purchase Interaction

**Decision:** After accepting an offer, the parent must purchase a lesson package within 24 hours to confirm the slot.

Flow:
1. Accept offer -> redirect to `/dashboard/billing?action=purchase&slotId=X`.
2. If package purchased within 24h: slot is permanently assigned, lesson scheduled.
3. If 24h expires without purchase: slot released, entry moves to `EXPIRED`, admin notified.

This is a soft-hold pattern -- no money is charged at offer acceptance, only at package purchase.

---

## 3. Data Model Changes

### WaitlistEntry extensions

```typescript
export type WaitlistStatus = 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'DEFERRED';

export type WaitlistEntry = {
  id: string;
  studentId: string;
  teacherId: string;
  conservatoriumId: string;
  instrument: string;
  preferredDays: DayOfWeek[];
  preferredTimes: TimeRange[];
  joinedAt: string;
  notifiedAt?: string;
  status: WaitlistStatus;
  offeredSlotId?: string;
  offeredSlotTime?: string;
  offerExpiresAt?: string;
  offerAcceptedAt?: string;
  offerDeclinedAt?: string;

  // New fields:
  deferredCount?: number;           // How many times parent deferred
  lastDeferredAt?: string;          // ISO timestamp of last deferral
  offerSentVia?: ('in_app' | 'email' | 'sms')[];  // Channels used for notification
  paymentDeadlineAt?: string;       // 24h after acceptance, for package purchase
  assignedLessonSlotId?: string;    // Set when payment completes -> lesson scheduled
  skipReason?: string;              // Admin's reason for skipping FIFO order (SEC-WAIT-09: REQUIRED when out-of-order)
  queuePosition?: number;           // Computed on read, not stored
};
```

### Conservatorium extension (future)

```typescript
// Add to Conservatorium type:
waitlistOfferExpiryHours?: number;  // Default: 48
waitlistMaxDefers?: number;         // Default: 2
waitlistPaymentWindowHours?: number; // Default: 24
```

---

## 4. Server Action Signatures

```typescript
// Offer a slot to a waitlisted entry
export const offerWaitlistSlotAction = withAuth(
  z.object({
    entryId: z.string(),
    slotId: z.string(),
    skipReason: z.string().optional(),  // SEC-WAIT-09: validated REQUIRED server-side when offering out of FIFO order
  }),
  async (payload) => {
    // Check if this is the FIFO-next entry; if not, skipReason is mandatory
    const queue = await db.waitlist.listByTeacher(entry.teacherId, 'WAITING');
    const fifoNext = queue.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0];
    if (fifoNext?.id !== payload.entryId && !payload.skipReason) {
      throw new Error('SKIP_REASON_REQUIRED');  // SEC-WAIT-09
    }
    // Log audit entry: WAITLIST_FIFO_SKIPPED
  }
);

// Accept a waitlist offer (called by parent/student)
export const acceptWaitlistOfferAction = withAuth(
  z.object({ entryId: z.string() }),
  async (payload) => { /* ... */ }
);

// Decline a waitlist offer
export const declineWaitlistOfferAction = withAuth(
  z.object({ entryId: z.string() }),
  async (payload) => { /* ... */ }
);

// Defer a waitlist offer (keep position)
export const deferWaitlistOfferAction = withAuth(
  z.object({ entryId: z.string() }),
  async (payload) => { /* ... */ }
);

// Expire stale offers (called on page load or by cron)
export const expireWaitlistOffersAction = withAuth(
  z.object({}),
  async () => { /* ... */ }
);

// Revoke an offer (admin action)
export const revokeWaitlistOfferAction = withAuth(
  z.object({
    entryId: z.string(),
    reason: z.string().optional(),
  }),
  async (payload) => { /* ... */ }
);
```

---

## 5. Component Architecture

### Admin Side

```
/dashboard/admin/waitlists
  -> AdminWaitlistDashboard (enhanced)
     -> WaitlistTable (FIFO-ordered, with skip warnings)
     -> OfferSlotDialog (new: slot picker from teacher's availability)
     -> WaitlistStatsBar (new: counts per status, avg wait time)
```

### Parent/Student Side

```
/dashboard/waitlist/offer/[entryId]
  -> WaitlistOfferPage (new)
     -> OfferDetailCard (teacher, instrument, slot, countdown)
     -> AcceptButton -> redirects to billing
     -> DeclineButton -> confirmation dialog
     -> DeferButton -> confirmation dialog (shows remaining defers)
```

### Parent Dashboard Integration

```
/dashboard (parent view)
  -> If user has OFFERED waitlist entry:
     -> Show prominent banner: "You have a waitlist offer expiring in X hours"
     -> Link to /dashboard/waitlist/offer/{entryId}
```

---

## 6. Security Considerations

1. **Authorization on accept/decline:** Only the student themselves or their linked parent can accept/decline. Verify `entry.studentId` matches `user.id` or `user.childIds`.
2. **Tenant isolation:** All waitlist queries must filter by `conservatoriumId`.
3. **Timing attacks:** Use server-side timestamp for expiry checks, not client clock.
4. **Slot double-booking (SEC-WAIT-08):** When a slot is offered, it should be soft-locked (not bookable by others) until the offer expires. If the offer expires, the lock is released. Add `offeredToWaitlistEntryId` and `softLockedUntil` fields to `LessonSlot`.
5. **FIFO skip audit (SEC-WAIT-09):** When admin skips FIFO order, `skipReason` is **required** (not optional). Audit entry `WAITLIST_FIFO_SKIPPED` is logged and visible in audit trail.
6. **Rate limiting:** Limit offer sends to prevent admin from spamming families with offers.

---

## 7. State Machine

```
WAITING --[admin offers slot]--> OFFERED
OFFERED --[parent accepts]-----> ACCEPTED
OFFERED --[parent declines]----> DECLINED
OFFERED --[parent defers]------> WAITING (deferredCount++)
OFFERED --[48h expires]--------> EXPIRED
OFFERED --[admin revokes]------> WAITING (reset offer fields)
ACCEPTED --[payment within 24h]-> [Entry completed, lesson scheduled]
ACCEPTED --[24h expires]-------> EXPIRED
```

---

## 8. Implementation Steps (Greenfield)

**Note:** This is greenfield -- no production users. Build the ideal design from scratch.

### Phase 1: Data Model & Security
1. Define the complete `WaitlistStatus` type with all states: `WAITING | OFFERED | ACCEPTED | DECLINED | EXPIRED | DEFERRED`.
2. Define the complete `WaitlistEntry` type with all fields (section 3 above).
3. Refactor `withAuth()` to accept `{ roles }` parameter (BLOCKING-SEC-01).
4. Implement atomic compare-and-swap for offer acceptance in all DB adapters (BLOCKING-SEC-02).
5. Add conservatoriumId server-side override to all waitlist actions (SEC-CROSS-03).
6. Add server-side expiry enforcement.

### Phase 2: Core Implementation
7. Build server actions: offer, accept, decline, defer, expire, revoke (section 4).
8. Build `OfferSlotDialog` component (admin selects real slot from teacher's availability).
9. Build `/dashboard/waitlist/offer/[entryId]` page (parent accept/decline/defer with countdown).
10. Add slot soft-lock mechanism with explicit release on decline/expire/defer/revoke.

### Phase 3: Integration
11. Update admin waitlist dashboard with FIFO guidance, stats bar, skip-reason enforcement.
12. Add parent dashboard banner for pending offers.
13. Wire notification system: in-app + email on offer send, expiry, and acceptance.

---

## UX & Accessibility Addendum (UX-UA Agent)

### B1. Admin Waitlist Dashboard — Enhanced Wireframe

```
+------------------------------------------------------------------+
| Waitlist Management                                               |
| Manage student waitlist entries and send offers.                  |
+------------------------------------------------------------------+
| Stats Bar                                                        |
| [12 Waiting] [3 Offered] [5 Accepted this month] [2.3 days avg] |
+------------------------------------------------------------------+
| Table (FIFO order)                                               |
| #  | Student   | Teacher  | Instr. | Joined    | Status | Act.  |
| 1* | Yael C.   | Miriam K.| Piano  | 3 days ago| Waiting| [...] |
| 2  | Dan M.    | David L. | Violin | 5 days ago| Offered| [...] |
|    |           |          |        |           | SUN 10 |       |
|    |           |          |        |           | 47h rem|       |
| 3  | Noa S.    | Miriam K.| Piano  | 7 days ago| Waiting| [...] |
+------------------------------------------------------------------+
  * = FIFO next-in-line highlight (amber start border)
```

**Stats bar:** 4 metric cards using `Card` with `p-3`. Mobile (375px): `grid-cols-2 md:grid-cols-4`.

**FIFO highlight:** Row #1 gets `border-s-4 border-amber-400`. Skipping FIFO triggers confirmation dialog.

### B2. Offer Slot Dialog — Wireframe

Uses `Dialog` (not Sheet). Short, focused interaction.

```
+--------------------------------------------------+
| Offer a Slot to Yael Cohen                       |
| Piano with Miriam Cohen                          |
+--------------------------------------------------+
| Preferred days: SUN, TUE                          |
| Preferred times: Morning (08:00-12:00)            |
+--------------------------------------------------+
| Available Slots                                   |
|                                                   |
| SUN 10 Mar                                        |
|   ( ) 09:00 - 09:45   [Available]                |
|   (o) 10:00 - 10:45   [Available]  <- selected   |
|   ( ) 11:00 - 11:45   [Conflict: other student]  |
|                                                   |
| TUE 12 Mar                                        |
|   ( ) 09:00 - 09:45   [Available]                |
|   ( ) 14:00 - 14:45   [Available]                |
+--------------------------------------------------+
| Offer expires in: [48] hours                      |
+--------------------------------------------------+
| [Cancel]                        [Send Offer]      |
+--------------------------------------------------+
```

Slot list: `RadioGroup`. Conflicts: muted + strikethrough + disabled. Mobile: near-full-width.

### B3. Parent/Student Offer Page

New page: `/dashboard/waitlist/offer/[entryId]`

**SEC-CONSTRAINT-1: Login required before showing any offer details.**

The offer URL requires authentication. Unauthenticated visitors see a generic landing:

```
+--------------------------------------------------+
| Harmonia                                         |
|                                                  |
|     (Lock icon, large)                           |
|                                                  |
|     You have a waitlist offer                    |
|     Log in to view the details.                  |
|                                                  |
|     [Log in]                                     |
+--------------------------------------------------+
```

No student name, teacher name, instrument, or conservatorium is visible on the unauthenticated page. The "Log in" button routes to `/login?callbackUrl=/dashboard/waitlist/offer/[entryId]`.

After login, the authenticated offer page shows:

```
+--------------------------------------------------+
| (Music icon)                                     |
| A spot is available for you!                     |
|                                                  |
| +----------------------------------------------+|
| | Teacher: Miriam Cohen                        ||
| | Instrument: Piano                            ||
| | Day & Time: Sunday 10:00 - 10:45             ||
| | Conservatorium: Hod HaSharon                 ||
| +----------------------------------------------+|
|                                                  |
| +----------------------------------------------+|
| |     23 : 45 : 12                             ||
| |    hours  min   sec                           ||
| | This offer expires on 17 Mar 2026, 14:00     ||
| +----------------------------------------------+|
|                                                  |
| [Accept this slot]  (primary, full-width)        |
| [Decline]  [Keep my place (defer)]               |
| Remaining defers: 2 of 2                         |
+--------------------------------------------------+
```

### B4. Countdown Timer Design

- `text-3xl font-mono font-bold` for HH:MM:SS
- Color: neutral (>24h), `text-amber-600` (12-24h), `text-red-600` (<12h), pulse (<1h)
- Expired: "00:00:00", buttons disabled, "This offer has expired"
- `aria-live="polite"`, announced every 5 min (not every second)

### B5. Parent Dashboard Banner

```
+------------------------------------------------------------------+
| (Bell) You have a spot available!                                |
| Piano with Miriam Cohen -- Expires in 23h 45m   [View Offer ->] |
+------------------------------------------------------------------+
```

`Alert` component, indigo accent, non-dismissible. Mobile: stacks, button full-width.

### B6. Confirmation Dialogs

Decline: `AlertDialog` -- "You will be removed from the waitlist."
Defer: `AlertDialog` -- "You have {remaining} defer(s) remaining after this."

### B7. RTL Behavior

- Stats bar: grid auto-mirrors. Table: `text-start`. Timer digits: LTR (numbers). Banner: icon start, CTA end.

### B8. Mobile (375px)

- Admin table: horizontal scroll. Offer dialog: near-full-width, `ScrollArea max-h-60`.
- Parent offer page: single-column, stacked buttons. Timer: `text-2xl`.

### B9. Loading & Accessibility

- Skeleton loaders for slot dialog, stats bar. Spinners on send/accept/decline buttons.
- `RadioGroup` with `aria-label`. FIFO row: `aria-label={t('nextInLine')}`.
- Confirmation dialogs: focus trapped, Escape to cancel. Stats: `<dl>/<dt>/<dd>`.

### B10. i18n String Keys (New in `Waitlist` namespace)

Admin: `statsWaiting`, `statsOffered`, `statsAcceptedMonth`, `statsAvgWait`, `nextInLine`, `skipFifoTitle`, `skipFifoDesc`, `selectSlot`, `preferredDays`, `preferredTimes`, `availableSlots`, `slotConflict`

Parent: `spotAvailable`, `offerDetailsTitle`, `countdownHours/Min/Sec`, `offerExpiresOn`, `acceptSlot`, `decline`, `deferKeepPlace`, `remainingDefers`, `declineConfirmTitle/Desc/Btn`, `deferConfirmTitle/Desc/Btn`, `offerExpired`, `bannerTitle/Desc/Cta`

### B11. Component Mapping

| UI Element | shadcn Component | Notes |
|-----------|---------|-------|
| Stats bar | 4x `Card` in grid | `grid-cols-2 md:grid-cols-4` |
| FIFO highlight | Row border | `border-s-4 border-amber-400` |
| Offer slot dialog | `Dialog` + `RadioGroup` + `ScrollArea` | Max-w-lg |
| Skip FIFO | `AlertDialog` + `Textarea` | Reason required |
| Countdown | Custom + `setInterval` | `aria-live="polite"` |
| Parent offer | `Card` + countdown + `Button` | Full-width mobile |
| Dialogs | `AlertDialog` | Existing |
| Banner | `Alert` indigo | Non-dismissible |

---

## 9. Product Requirements (PM)

### User Stories

**US-1:** As a conservatorium admin, I want to select a specific available slot (teacher + day + time) when sending a waitlist offer, so that the parent knows exactly what they're being offered.

**US-2:** As a parent on the waitlist, I want to receive an SMS and in-app notification when a spot opens up, so that I can act quickly before the offer expires.

**US-3:** As a parent, I want to accept the waitlist offer with one click, so that my child's lesson is booked immediately.

**US-4:** As a parent, I want to decline the offer if the time doesn't work for us, so that the spot goes to the next family.

**US-5:** As a parent, I want to say "not this slot, but keep me on the list" (defer), so that I'm still in line for a different time without losing my position.

**US-6:** As a system, I want to expire unclaimed offers after 48 hours, so that spots don't stay blocked indefinitely.

**US-7:** As an admin, I want to see the full history of offers made, accepted, declined, expired per waitlist entry, so that I can understand demand and follow up with families.

**US-8:** As an admin, I want the system to suggest (but not auto-send) the next eligible family when an offer is declined or expires, so that I can quickly re-offer the slot.

### Acceptance Criteria

**AC-1: Slot selection on offer**
- Given an admin viewing a waitlist entry for Piano with Teacher Miriam
- When they click "Send Offer"
- Then a dialog shows available slots for Miriam, with the student's preferred days/times highlighted
- And admin selects a slot and confirms

**AC-2: Parent notification**
- Given an offer has been sent
- When the parent opens their dashboard
- Then they see a notification badge and a prominent banner showing the offer details and countdown

**AC-3: Accept books the lesson**
- Given a parent viewing an offer for Tuesday 16:00
- When they click "Accept"
- Then a lesson is booked for Tuesday 16:00 with that teacher
- And one package credit is consumed (if package-based)
- And the waitlist entry status is ACCEPTED

**AC-4: Decline triggers next-in-line**
- Given a parent who declines an offer
- When the decline is processed
- Then the admin dashboard highlights the next eligible family for that slot

**AC-5: Defer keeps position**
- Given a parent who defers an offer
- When the defer is processed
- Then the waitlist entry remains WAITING with deferredCount incremented
- And the entry is moved behind other WAITING entries for that specific slot

**AC-6: Offer expires after 48 hours**
- Given an offer that was sent 48 hours ago with no response
- When the expiry check runs
- Then the offer status becomes EXPIRED
- And the parent receives an expiry notification
- And the admin sees "Expired" badge with "Offer to next" button

**AC-7: Max deferrals**
- Given a parent who has deferred the maximum number of times (default: 2 per architect, recommend 3 per PM)
- When they receive another offer
- Then the defer option is hidden
- And only Accept and Decline are available

**AC-8: Race condition on accept**
- Given a slot that was offered but then booked by someone else (e.g., ad-hoc booking)
- When the parent clicks Accept
- Then the system detects the conflict and shows "This slot was just booked. We'll notify you of the next available slot."
- And the offer is moved to a conflict state

### Edge Cases

| Edge Case | Handling |
|-----------|---------|
| Admin offers a slot that gets booked before parent responds | On accept: slot availability re-checked. If taken, show error and auto-suggest next available. |
| Parent's package expires between offer and accept | On accept: redirect to package purchase flow before booking. |
| Admin sends offer to wrong student | Admin can revoke the offer before parent responds. |
| Student is removed from conservatorium while offer pending | Offer auto-cancelled, parent notified. |
| Teacher's availability changes after offer sent | On accept: re-validate. If no longer available, show error. |
| Parent has two children on the waitlist | Each child = separate entry. Offers are independent. |
| Offer expires on weekend/holiday | Expiry is purely time-based (48h from notifiedAt), no business-day logic. |
| Multiple offers sent to same parent for different children | Each offer page shows which child it's for. No confusion. |
| Parent tries to accept from an expired link | Show "This offer has expired" with link back to dashboard. |
| Network error during accept | Idempotent accept: if called twice, second call detects already-accepted state and succeeds silently. |

### v1 vs v2

**v1 (ship now):**
- Slot selection dialog when admin sends offer
- Parent response page: Accept / Decline / Defer
- 48-hour auto-expiry (server-side)
- Admin revoke capability
- In-app notification for offers
- Defer limit (configurable, default 3)
- Next-in-line suggestion (manual trigger by admin)
- FIFO queue display with skip warning
- Package credit check on accept

**v2 (future):**
- Auto-offer to next-in-line (configurable)
- SMS and WhatsApp notifications for offers
- Email deep links with signed Accept/Decline URLs (no login required)
- Priority scoring for waitlist (wait time, package type, conservatorium rules)
- Batch offer: offer same slot to top N families simultaneously (first-come-first-served)
- Parent preference: "any teacher, same instrument"
- Integration with smart slot filling (SDD-12)
- Waitlist analytics dashboard: avg wait time, conversion rate, deferral patterns

### Notification Templates

**SMS (Hebrew):**
```
"נפתח מקום! [teacher] פנוי/ה ב-[day] ב-[time]. אשר/י תוך 48 שעות: [link]"
```

**In-App:**
Title: "Waitlist Offer" / Body: "A lesson slot is available with [teacher] on [day] at [time]"
Action: Link to /dashboard/waitlist/offer/{entryId}

**Email:**
Subject: "A spot opened up for [childName]!"
Body: Full offer details, countdown, Accept/Decline/Defer buttons

---

## Security Addendum (Response to BLOCKING-SEC-01, BLOCKING-SEC-02, SEC-CROSS-03)

### S1. `withAuth()` Role Enforcement (BLOCKING-SEC-01)

All waitlist server actions must use the enhanced `withAuth()` with explicit role lists:

```typescript
// Offer: admin-only
export const offerWaitlistSlotAction = withAuth(
  schema,
  { roles: ['conservatorium_admin', 'delegated_admin', 'site_admin'] },
  async (payload, claims) => { /* ... */ }
);

// Accept/decline/defer: student or parent only
export const acceptWaitlistOfferAction = withAuth(
  schema,
  { roles: ['student', 'parent'] },
  async (payload, claims) => {
    // Additional check: verify claims.userId is the student or linked parent
    const entry = await db.waitlist.get(payload.entryId);
    if (entry.studentId !== claims.userId && !claims.childIds?.includes(entry.studentId)) {
      throw new Error('FORBIDDEN');
    }
    // ...
  }
);
```

### S2. Atomic Offer Acceptance (BLOCKING-SEC-02)

**Problem:** Two parents could simultaneously accept an offer (race condition), or an admin could offer the same slot to two families concurrently, causing double-booking.

**Required: Compare-and-swap pattern for all offer state transitions.**

#### Memory adapter (mock):
```typescript
// Use a simple mutex pattern with a Map<string, boolean> lock
class WaitlistStore {
  private locks = new Map<string, boolean>();

  async acceptOffer(entryId: string): Promise<void> {
    if (this.locks.get(entryId)) throw new Error('CONFLICT');
    this.locks.set(entryId, true);
    try {
      const entry = this.entries.find(e => e.id === entryId);
      if (entry?.status !== 'OFFERED') throw new Error('CONFLICT');
      if (entry.offerExpiresAt && new Date(entry.offerExpiresAt) < new Date()) {
        entry.status = 'EXPIRED';
        throw new Error('OFFER_EXPIRED');
      }
      entry.status = 'ACCEPTED';
      entry.offerAcceptedAt = new Date().toISOString();
    } finally {
      this.locks.delete(entryId);
    }
  }
}
```

#### Postgres adapter:
```sql
-- Atomic accept: only succeeds if status is still OFFERED and not expired
UPDATE waitlist_entries
SET status = 'ACCEPTED',
    offer_accepted_at = NOW()
WHERE id = $1
  AND status = 'OFFERED'
  AND offer_expires_at > NOW()
RETURNING *;
-- If 0 rows affected -> offer was already accepted, expired, or revoked
```

#### Supabase/Firestore adapter:
- Supabase: Use the same Postgres pattern via `.rpc()` or raw SQL.
- Firestore: Use `runTransaction()` with optimistic concurrency:
```typescript
await db.runTransaction(async (tx) => {
  const ref = db.collection('waitlist').doc(entryId);
  const doc = await tx.get(ref);
  if (doc.data()?.status !== 'OFFERED') throw new Error('CONFLICT');
  if (new Date(doc.data()?.offerExpiresAt) < new Date()) throw new Error('OFFER_EXPIRED');
  tx.update(ref, { status: 'ACCEPTED', offerAcceptedAt: new Date().toISOString() });
});
```

#### Slot soft-lock (double-offer prevention):
When admin offers a slot, the slot must be marked as soft-locked:
```sql
-- Atomic offer: only succeeds if slot is not already locked
UPDATE lesson_slots
SET soft_locked_by_waitlist_entry = $1,
    soft_lock_expires_at = $2
WHERE id = $3
  AND soft_locked_by_waitlist_entry IS NULL
RETURNING *;
-- If 0 rows affected -> slot already offered to someone else
```

**Soft-lock release (CRITICAL):** When an offer is declined, expires, deferred, or revoked, the soft-lock MUST be explicitly released. Without this, stale locks permanently block slots:
```sql
-- Release soft-lock: call in decline, expire, defer, and revoke handlers
UPDATE lesson_slots
SET soft_locked_by_waitlist_entry = NULL,
    soft_lock_expires_at = NULL
WHERE soft_locked_by_waitlist_entry = $1;
```
This must be called in: `declineWaitlistOfferAction`, `deferWaitlistOfferAction`, `revokeWaitlistOfferAction`, and `expireWaitlistOffersAction`.

### S3. conservatoriumId Override (SEC-CROSS-03)

All waitlist write actions must override client-supplied `conservatoriumId`:

```typescript
// Inside every waitlist server action:
if (!GLOBAL_ADMIN_ROLES.includes(claims.role)) {
  payload.conservatoriumId = claims.conservatoriumId;
}
```

For the offer action: verify the waitlist entry belongs to the admin's conservatorium:
```typescript
const entry = await db.waitlist.get(payload.entryId);
if (!GLOBAL_ADMIN_ROLES.includes(claims.role) && entry.conservatoriumId !== claims.conservatoriumId) {
  throw new Error('TENANT_MISMATCH');
}
```

### S4. Server-Side Expiry Enforcement

The client-side `setInterval(expireWaitlistOffers, 60000)` is insufficient for production:

1. **On every waitlist read:** Run `expireWaitlistOffersAction()` before returning data.
2. **On accept attempt:** Check `offerExpiresAt` server-side (as shown in S2 above).
3. **For Postgres:** Consider a `pg_cron` job or application-level cron (e.g., Vercel Cron) that runs `UPDATE waitlist_entries SET status = 'EXPIRED' WHERE status = 'OFFERED' AND offer_expires_at < NOW()` every 5 minutes.

### S5. Security Steps

These are now incorporated as Phase 1 of the Implementation Steps (section 8). No separate migration needed -- security is built in from the start.

---

## UI/UX Pro Max Review (Main Session)

**Design System Applied:** Data-Dense Dashboard · Harmonia palette · shadcn/ui

### UX Quality Checklist

| Check | Status |
|---|---|
| 44px min touch targets on Accept/Decline/Defer buttons | ⚠️ enforce `min-h-[44px]` — parent uses this on mobile |
| Countdown timer: color-blind safe (not red/green only) | ⚠️ add text "X hours remaining" alongside color change |
| `role="alert"` on countdown when < 2 hours remain | ⚠️ add for screen reader urgency |
| `cursor-pointer` on waitlist table rows | ⚠️ add |
| Blur validation on "skip reason" textarea | ✅ in spec |
| Loading state on Accept/Decline buttons (async) | ⚠️ disable button + show spinner during submission |
| Skeleton loader on waitlist table | ⚠️ missing — add |

### Greenfield: Clean WaitlistStatus Enum

Replace current `'WAITING' | 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'` with a richer clean enum:

```typescript
type WaitlistStatus =
  | 'WAITING'           // on queue, no offer yet
  | 'OFFERED'           // admin sent offer, awaiting parent response  
  | 'ACCEPTED'          // parent accepted, pending package purchase
  | 'ENROLLED'          // package purchased, slot confirmed — TERMINAL
  | 'DECLINED'          // parent declined — TERMINAL (removed from queue)
  | 'DEFERRED'          // parent deferred (stays in queue, offer retracted)
  | 'EXPIRED'           // offer window elapsed — back to WAITING
  | 'WITHDRAWN'         // parent removed themselves — TERMINAL
```

**Key additions:**
- `ENROLLED`: distinguishes "accepted offer" from "actually enrolled" (package purchased)
- `DEFERRED`: explicit state when parent says "not this slot, keep me in queue"
- `WITHDRAWN`: parent self-removes (different from admin removing)

### Countdown Timer (Precise Spec)

```tsx
// Color progression based on time remaining
const urgency = hoursRemaining > 24 ? 'neutral' 
  : hoursRemaining > 4 ? 'warning'   // amber
  : hoursRemaining > 1 ? 'danger'    // red  
  : 'critical';                       // red + pulse animation

// Component
<div role="timer" aria-live="polite" aria-atomic="true"
  className={cn(
    "font-mono text-2xl tabular-nums",
    urgency === 'warning' && "text-amber-600",
    urgency === 'danger' && "text-red-600",
    urgency === 'critical' && "text-red-600 animate-pulse",
  )}>
  {formatCountdown(offerExpiresAt)} {/* "23:14:07" */}
</div>
<p className="text-sm text-muted-foreground">{t('hoursRemaining', { hours: hoursRemaining })}</p>
```

- `prefers-reduced-motion`: when set, remove `animate-pulse`, keep color change only
- Screen reader: `aria-live="polite"` updates every minute (not every second — too noisy)
- Accessible text: "23 hours remaining" alongside the mono countdown

### Parent Offer Banner (Non-dismissible)

`Alert` banner on parent dashboard is correct. Add:
- `variant="destructive"` when < 4 hours remain
- `variant="default"` (blue/indigo) at > 24 hours
- `variant="warning"` (amber) at 4–24 hours
- Icon changes: `Clock` → `AlertTriangle` → `Siren` (or equivalent Lucide icon)
- Banner should be ABOVE the fold — place it at the top of the parent dashboard content, before any cards

### Offer Slot Dialog: RadioGroup Enhancement

The RadioGroup for slot selection should show conflict indicators:
```
○ Monday 14:00–14:45  ✓ Available
○ Wednesday 16:00–16:45  ✓ Available  
● Thursday 10:00–10:45  ⚠ Teacher has 2 consecutive lessons (fatigue risk)
✗ Friday 09:00–09:45  Already taken
```
- Taken slots: `disabled` + strikethrough text, not hidden (shows admin the full picture)
- Fatigue warning: amber badge, not blocking
- Selected slot: `border-2 border-primary` ring, not just radio dot

### Skip-Queue Warning Dialog

When admin selects a non-FIFO entry to offer:
```
⚠️ Skip Queue Warning
You are offering a spot to [Name] (position #4) while
[Name2] (position #2) and [Name3] (position #3) are 
still waiting.

Reason for skipping (required):
[textarea, minLength=10]

[Cancel]  [Send Offer Anyway]
```
- `[Send Offer Anyway]` button: `variant="destructive"` — emphasizes this is an exception
- Reason is logged in `WaitlistEntry.adminNotes` for audit trail
