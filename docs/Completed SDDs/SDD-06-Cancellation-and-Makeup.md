# SDD-06: Cancellation, Makeup & Sick Leave

**Module:** 06  
**Dependencies:** Modules 03, 04, 05, 07  
**Priority:** P1 — Required for operational launch

---

## 1. Overview & Rationale

Cancellations are the single biggest source of friction, arguments, and lost revenue in a music conservatorium. Students cancel last-minute; teachers call in sick; parents demand refunds; makeups pile up and never get scheduled. This module defines a clear, automated, and fair system for every cancellation scenario — removing ambiguity and replacing it with consistent, policy-driven outcomes.

---

## 2. Cancellation Policy Configuration

The admin defines the policy at `/admin/settings/cancellation-policy`. Each policy applies per-conservatorium and can optionally be different for teacher-side vs. student-side.

```typescript
{
  conservatoriumId: string;
  
  // Student cancellation
  studentNoticeHoursRequired: number;        // e.g., 24
  studentCancellationCredit: 'FULL' | 'NONE' | 'PARTIAL';
  studentPartialCreditPercent?: number;      // if PARTIAL
  
  // Late cancellation (within notice window)
  studentLateCancelCredit: 'FULL' | 'NONE';
  
  // No-show
  noShowCredit: 'FULL' | 'NONE';
  
  // Teacher cancellation
  teacherCancelCredit: 'FULL';               // always full, non-configurable
  makeupWindowDays: number;                  // how many days to schedule a makeup: e.g., 30
  
  // Makeup slot expiry
  makeupCreditExpiryDays: number;            // e.g., 60 days to use makeup credit
  maxMakeupsPerTerm: number;                 // cap to prevent abuse: e.g., 4
}
```

---

## 3. Student Cancellation Flow

### 3.1 On-Time Cancellation (within notice period)

Student cancels a lesson with sufficient notice (e.g., >24 hours in advance):

1. Student clicks "Cancel lesson" on the lesson card
2. Confirmation modal shows: policy reminder + credit that will be issued
3. Student confirms → slot is released, status → `CANCELLED_STUDENT_NOTICED`
4. Credit is added to student's balance
5. Notification sent to teacher: "Student [name] cancelled Tuesday 4pm — slot is now free"
6. Slot re-enters the ad-hoc pool
7. Credit can be used to book a makeup within `makeupCreditExpiryDays`

### 3.2 Late Cancellation (outside notice window)

Student cancels less than the required notice period before the lesson:

1. System detects the late cancellation
2. Modal shows a clear warning: "This cancellation is within 24 hours. According to our policy, no credit will be issued. Are you sure?"
3. Requires explicit confirmation
4. Status → `CANCELLED_STUDENT_NO_NOTICE`
5. No credit issued; invoice is not adjusted
6. Teacher is notified: "Late cancellation — you will still be paid for this slot"
7. Slot is **NOT** released to the public pool (teacher may choose to fill it privately or rest)

### 3.3 No-Show

If a student simply doesn't attend:
1. Teacher marks attendance as `NO_SHOW_STUDENT` (one tap in the app)
2. Same outcome as late cancellation — no credit
3. Parent receives an automatic notification: "We missed [child name] at today's lesson. No credit has been issued per our policy. [Reschedule | Contact Us]"
4. If 2 no-shows occur in a rolling 30-day period, admin is automatically flagged for follow-up

---

## 4. Teacher Sick Leave & Cancellation

### 4.1 Teacher Initiates Sick Leave

From the teacher dashboard, teacher taps "I'm sick — cancel today's lessons" button:

1. Select affected date range (today only / today + tomorrow / custom range)
2. System shows all affected lesson slots in that range
3. Teacher confirms → all affected slots → `CANCELLED_TEACHER`
4. **Automatic outcomes:**
   - Makeup credit issued to every affected student instantly
   - All affected students/parents receive immediate notification (see Module 07)
   - Admin is notified with a summary: "Teacher X cancelled N lessons on [date]. Substitute search: [View]"

### 4.2 Admin Cancels on Teacher's Behalf

If teacher is unreachable and admin needs to cancel:
- Same flow initiated from `/admin/schedule`
- Can mark as `CANCELLED_TEACHER` or `CANCELLED_CONSERVATORIUM` (affects accounting)

### 4.3 Teacher Holiday / Planned Absence

Teacher sets planned unavailability in advance (Module 03 availability):
- System **proactively** warns students 7 days before: "Your lesson on [date] has been cancelled due to [teacher name]'s planned absence. Credit issued. [Book Makeup]"
- No last-minute shock for students

---

## 5. The Makeup Board

The Makeup Board is the self-service system for students to book makeup lessons.

`/dashboard/makeups`

### 5.1 Student View

- Active makeup credits shown with expiry countdown
- "Book a makeup" button → shows teacher's available slots
- Can book with their assigned teacher OR, if admin allows, with any teacher of the same instrument
- Booking a makeup consumes 1 makeup credit
- Makeup slots are labeled distinctly in the schedule

### 5.2 How Slots Enter the Makeup Pool

Slots eligible for makeup booking:
- Any unbooked slot in teacher's availability template
- Any released slot from a student's on-time cancellation
- Teacher-added extra slots ("I have a free slot this Sunday")

Makeup slots are shown to students with pending makeup credits **first**, before being released to the ad-hoc pool.

### 5.3 Admin Makeup Board

`/admin/makeups`

- List of all pending makeup credits across all students
- Who has credits, for which teacher, expiring when
- "At Risk" view: credits expiring in the next 7 days with no makeup booked
- Admin can manually assign a makeup slot to a student who is having trouble finding one
- Admin can extend makeup credit expiry on a per-student basis

---

## 6. Conservatorium-Wide Closures

When admin creates a closure (e.g., Passover break):

1. Admin sets closure dates at `/admin/settings/closures`
2. System scans all `RECURRING` slots within the closure period
3. For each affected slot:
   - Status → `CANCELLED_CONSERVATORIUM`
   - Makeup credit automatically issued
4. Batch notification sent (see Module 07)
5. Monthly invoices are automatically adjusted to not charge for closure-period lessons

---

## 7. Cancellation Analytics

Admin can see at `/admin/reports/cancellations`:

| Metric | Insight |
|--------|---------|
| Cancellation rate by teacher | Are some teachers cancelling too much? |
| Cancellation rate by student | Are some students chronically cancelling? |
| Makeup credit age | Are credits being used or expiring unused? |
| Late cancellation rate | Is the notice policy working? |
| No-show rate | Are reminders reducing no-shows? |

---

## 8. Edge Cases & Policy Enforcement

| Scenario | System Behavior |
|----------|----------------|
| Student tries to cancel with <1 hour notice | Warning shown, late cancel policy applied, requires double-confirmation |
| Teacher cancels the same student >3 times in a term | Admin auto-notified; flagged for review |
| Student has >4 makeup credits unused | Admin notified to follow up and help schedule |
| Makeup credit expires unused | Credit is written off; system logs for accounting |
| Student disputes a no-show | Admin has 48-hour window to override and issue a credit manually |
| Sick leave exceeds 5 consecutive days | Admin prompted to consider substitute assignment (Module 03) |

---

## 9. UI Components Required

| Component | Description |
|-----------|-------------|
| `CancelLessonModal` | Cancellation confirmation with policy summary |
| `LateCancelWarningModal` | Explicit late-cancel warning with double confirmation |
| `SickLeaveModal` | Teacher emergency cancellation with affected lesson list |
| `MakeupBoard` | Student view of makeup credits and available slots |
| `AdminMakeupDashboard` | Admin overview of all pending makeups |
| `MakeupCreditBadge` | Shows pending makeup credits in header/dashboard |
| `ClosureManager` | Admin tool for creating conservatorium-wide closures |
