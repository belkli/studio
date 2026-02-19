# SDD-04: Smart Scheduling & Booking Engine

**Module:** 04  
**Dependencies:** Modules 01, 02, 03  
**Priority:** P0 — Core operational module

---

## 1. Overview & Rationale

Scheduling is the beating heart of a music conservatorium. Every week, hundreds of lessons need to happen in the right room, at the right time, with the right teacher and student — and this must adjust dynamically for cancellations, sickness, holidays, and exam seasons.

This module defines the booking engine, covering: initial slot assignment, recurring bookings, ad-hoc single sessions, trial lessons, package-based bookings, self-service rescheduling, and the admin view for capacity management.

---

## 2. Lesson Slot Model

```typescript
{
  id: string;
  conservatoriumId: string;
  teacherId: string;
  studentId: string;
  instrument: Instrument;
  
  // Timing
  startTime: Timestamp;
  durationMinutes: 30 | 45 | 60;
  recurrenceId?: string;         // links slots in a recurring series
  
  // Type & Origin
  type: LessonType;
  bookingSource: 'STUDENT_SELF' | 'PARENT' | 'TEACHER' | 'ADMIN' | 'AUTO_MAKEUP';
  
  // Location
  roomId?: string;
  isVirtual: boolean;
  meetingLink?: string;          // auto-generated Zoom/Meet link
  
  // Package Linkage
  packageId?: string;
  isCreditConsumed: boolean;
  
  // Status
  status: SlotStatus;
  attendanceMarkedAt?: Timestamp;
  teacherNote?: string;
  
  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancelledAt?: Timestamp;
  cancelledBy?: string;
  cancellationReason?: string;
}

type LessonType = 
  | 'RECURRING'      // fixed weekly slot (yearly/monthly subscription)
  | 'MAKEUP'         // replacement for a cancelled lesson
  | 'TRIAL'          // first trial session
  | 'ADHOC'          // one-off booking from available pool
  | 'GROUP'          // future: ensemble/group lesson

type SlotStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED_STUDENT_NOTICED'     // cancelled with sufficient notice
  | 'CANCELLED_STUDENT_NO_NOTICE'   // cancelled too late — credit forfeited
  | 'CANCELLED_TEACHER'             // teacher cancelled — credit owed
  | 'CANCELLED_CONSERVATORIUM'      // holiday / facility issue — credit owed
  | 'NO_SHOW_STUDENT'               // student didn't show — credit forfeited
  | 'NO_SHOW_TEACHER'               // teacher didn't show — credit owed + flag
```

---

## 3. Booking Types

### 3.1 Yearly Subscription — Reserved Slot

The premium offering. Student books a specific day + time for the full academic year.

**Flow:**
1. Student selects teacher during enrollment
2. Teacher's available yearly slots are shown (only recurring-eligible slots with full-year availability)
3. Student picks day, time, duration
4. Payment collected (full year upfront OR monthly autopay)
5. System generates all ~40 lesson slots for the academic year
6. Slots are marked as `RECURRING`
7. System auto-skips national holidays and conservatorium closure dates
8. Calendar invite for entire year sent to student and teacher

**Guarantees to student:**
- That time slot is reserved exclusively for them
- Teacher cannot assign it to anyone else
- If cancelled by conservatorium/teacher → makeup credit issued automatically

### 3.2 Monthly Subscription — Rolling Weekly Slot

Same weekly slot, renewed monthly via autopay.

- Each month, if payment succeeds → next month's 4–5 lessons are generated
- If payment fails → booking paused, student notified, grace period (5 days) before slot is released
- Student can change their slot once per month with 7 days notice

### 3.3 Package (5 or 10 Lessons) — Flexible Booking

Student buys a credit pack and books individual sessions from available slots.

**Flow:**
1. Credits are purchased upfront
2. Student/parent sees available slots for their teacher (or any teacher of that instrument, depending on package type)
3. Book a slot → consumes 1 credit
4. Unused credits expire 6 months from purchase (configurable)
5. System warns when 2 credits remain: "Book your next session before they expire!"

### 3.4 Ad-Hoc Single Session — Commit-Free

For people who cannot or will not commit to a recurring slot.

- Pool of available slots published weekly (slots not claimed by subscription/package students)
- Book and pay per session
- Displayed on a public-facing "Book a Session" page
- First-come, first-served
- Price slightly higher than equivalent per-lesson package price (incentivizes commitment)

### 3.5 Trial Lesson — No Commitment

Single trial session. Price is nominal (e.g., 50–70% of standard rate).
- No account required to book (just name + phone + email)
- If student converts to a package afterward, trial fee is deducted (configurable)
- See Module 02 for full trial flow

---

## 4. The Availability Engine

### 4.1 How Available Slots Are Computed

```
Available Slot = Teacher Availability Window
               − Already Booked Slots
               − Teacher Exceptions (sick, holiday)
               − Room Conflicts
               − Buffer Time (configurable: 0 | 5 | 10 min between lessons)
```

The engine runs as a server-side function and returns available slots for any given:
- Teacher ID
- Instrument
- Duration
- Date range

### 4.2 Slot Aggregation for Ad-Hoc Pool

Nightly Cloud Function:
1. Collect all unbooked slots for the next 30 days
2. For each teacher: identify 30/45/60-min windows within availability template
3. Subtract all booked recurring/package slots and exceptions
4. Publish remaining windows as the "Ad-Hoc Pool"
5. Sort by: soonest first, then by teacher rating

### 4.3 Smart Slot Suggestions

When a student opens the booking calendar, the AI layer (Module 10) personalizes the view:
- Highlights slots that match their historical preferences (same day/time as past bookings)
- Warns if a slot is far from their usual location (e.g., wrong branch)
- Flags slots close to known exam dates with: "Exam coming up — this slot gives you 3 weeks preparation"

---

## 5. Self-Service Scheduling for Students & Parents

`/dashboard/schedule`

### 5.1 My Schedule View
- Month and week view of all upcoming lessons
- Color coded by lesson type: recurring (blue), makeup (orange), trial (green), ad-hoc (purple)
- Click any lesson → lesson detail card with: teacher, room, status, cancel/reschedule button
- "Remaining credits" badge in the top bar

### 5.2 Booking a New Ad-Hoc Lesson
1. Click "Book a lesson"
2. Filter by: instrument, teacher (optional), duration, date
3. Calendar shows available slots (green)
4. Select slot → confirmation modal with price
5. Confirm → payment → booking confirmed

### 5.3 Rescheduling a Lesson
Allowed if: lesson is more than `cancellationPolicy.noticeHoursRequired` hours away

1. Click "Reschedule" on lesson card
2. Choose new slot from teacher's availability
3. Old slot is released back to pool
4. New slot is booked — no credit consumed (it's a reschedule, not a new booking)
5. Both teacher and student receive updated calendar notification

### 5.4 Cancellation (Student-Initiated)
See Module 06 for full policy. Summary:
- If within notice period: credit refunded (for packages) or voucher issued (for monthly)
- If outside notice period: credit forfeited, no refund
- A clear countdown shows: "Cancel before [time] to receive a credit"

---

## 6. Teacher's Scheduling Interface

`/dashboard/teacher/schedule`

### 6.1 Week View
- Drag-and-drop for moving lessons (with student consent notification)
- Color-coded by student, or by status
- "Add ad-hoc availability" → opens a quick slot creation modal

### 6.2 Blocking Time
- Teacher can block any future slot as unavailable
- System checks for affected booked lessons and offers alternatives to those students

### 6.3 Adding Group Lessons (Future)
- Create a slot with `type: GROUP`
- Set max participants
- Students can enroll up to the cap
- Per-student cost is reduced for group sessions

---

## 7. Admin Scheduling Control Panel

`/admin/schedule`

### 7.1 Master Calendar
- All lessons across all teachers and rooms
- Filters: teacher, room, instrument, day, status
- Exportable as PDF or CSV

### 7.2 Capacity Dashboard
- Tile view: each teacher as a tile showing % capacity booked
- Room occupancy heatmap by hour of day / day of week
- "Empty slot" indicator — slots where teacher is available but unbooked

### 7.3 Bulk Operations
- Create a conservatorium-wide closure (e.g., Passover break)
  → System generates makeup credits for all affected recurring lessons
  → Batch notification sent to all students/parents
- Bulk re-assign students if a teacher leaves
- Export full schedule to Excel

---

## 8. Virtual Lesson Handling

If a lesson slot is marked `isVirtual: true`:

1. At booking time: a Zoom/Google Meet link is auto-generated via API and stored in the slot
2. 24 hours before: reminder SMS/email sent with meeting link
3. 15 minutes before: final reminder SMS sent
4. Teacher and student both receive a "Join Lesson" button in the app dashboard
5. After the lesson ends (calculated by start time + duration), attendance prompt appears

---

## 9. Recurrence & Academic Year

### 9.1 Academic Year Configuration

Admin sets the academic year at `/admin/settings/academic-year`:
```
{
  yearLabel: "2025–2026";
  startDate: "2025-09-01";
  endDate: "2026-06-30";
  closedDates: Date[];       // national holidays, school holidays
  examPeriods: DateRange[];  // periods where special rules may apply
}
```

### 9.2 Holiday Handling for Recurring Slots
When a recurring lesson falls on a closed date:
- **Option A (default):** Lesson is auto-cancelled, makeup credit issued
- **Option B:** Lesson is auto-moved to teacher's next available slot that week
- Admin configures default; teacher can override per-lesson

---

## 10. UI Components Required

| Component | Description |
|-----------|-------------|
| `AvailabilityCalendar` | Student-facing slot picker (month/week view) |
| `LessonCard` | Individual lesson slot display with action buttons |
| `BookingConfirmationModal` | Pre-payment booking summary |
| `RescheduleModal` | Show available slots for rescheduling |
| `MasterCalendar` | Admin multi-teacher, multi-room view |
| `CapacityDashboard` | Admin tile view of teacher capacity |
| `PackageCreditBadge` | Remaining credits indicator |
| `VirtualLessonJoinBanner` | Prominent join button 15 min before virtual lesson |
