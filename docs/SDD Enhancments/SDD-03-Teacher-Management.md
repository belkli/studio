# SDD-03: Teacher Management & Availability

**Module:** 03  
**Dependencies:** Module 01 (Identity)  
**Priority:** P0 — Required before scheduling

---

## 1. Overview & Rationale

Teachers are the conservatorium's most valuable (and most autonomous) resource. A typical Israeli music teacher juggles multiple conservatoriums, private students, performances, and family life. The system must respect their autonomy while giving the conservatorium the visibility it needs.

This module covers everything the conservatorium needs to manage its teaching staff — from onboarding and profile management, to real-time availability, room assignments, and payroll preparation.

---

## 2. Teacher Profile

### 2.1 Data Model

```typescript
{
  id: string;
  userId: string;                        // links to User model
  conservatoriumId: string;
  bio: string;                           // public-facing bio
  photoUrl: string;
  
  // Professional
  instruments: Instrument[];             // e.g. ['PIANO', 'THEORY']
  specialties: TeacherSpecialty[];       // e.g. ['EXAM_PREP', 'EARLY_CHILDHOOD', 'JAZZ']
  gradeLevels: GradeLevel[];            // which student levels they teach
  teachingLanguages: Language[];         // Hebrew, Arabic, English, Russian, etc.
  maxStudents: number;                   // capacity cap
  
  // Compensation
  employmentType: 'EMPLOYEE' | 'FREELANCE';
  hourlyRate: number;                    // used for payroll calculation
  ratePerDuration: Map<number, number>;  // e.g. {30: 80, 45: 110, 60: 140}
  
  // Logistics
  assignedRoomIds: string[];             // default rooms for this teacher
  canTeachVirtual: boolean;
  
  // Status
  isActive: boolean;
  isOnLeave: boolean;
  leaveUntil?: Date;
}
```

### 2.2 Teacher Specialties (Tags)

The following specialty tags drive the AI Matchmaker (Module 10):

- `EXAM_PREP` — Israeli Ministry music exams
- `EARLY_CHILDHOOD` — Ages 4–8
- `PERFORMANCE` — Concert and recital focused
- `JAZZ` — Jazz/improvisation
- `THEORY` — Music theory focus
- `SPECIAL_NEEDS` — Experience with special needs students
- `BEGINNER_ADULTS` — Teaching adults who are starting late
- `COMPETITION` — Competition coaching
- `ENSEMBLE` — Chamber music / band coaching

---

## 3. Availability Management

### 3.1 Two-Layer Availability Model

Teachers set availability at two levels:

**Layer 1 — Default Weekly Template**
A recurring weekly grid indicating when the teacher is *generally* available. Set once and repeats.

```typescript
{
  teacherId: string;
  dayOfWeek: DayOfWeek;       // MON | TUE | WED | THU | FRI | SUN
  startTime: string;          // "15:00"
  endTime: string;            // "20:00"
  locationPreference: 'IN_PERSON' | 'VIRTUAL' | 'BOTH';
  roomId?: string;            // preferred room on this day
}
```

**Layer 2 — Exceptions & Overrides**
One-off changes layered on top of the template:

```typescript
{
  teacherId: string;
  date: Date;
  type: 'UNAVAILABLE' | 'AVAILABLE_EXTRA' | 'SICK_LEAVE' | 'HOLIDAY';
  startTime?: string;
  endTime?: string;
  note?: string;              // e.g. "Away for IDF reserve duty"
  createdAt: Timestamp;
}
```

### 3.2 The Availability Grid UI

`/dashboard/teacher/availability`

- Visual weekly grid, resembling Google Calendar week view
- Drag to add available blocks, click to remove
- "Copy from last week" button
- Month view for adding exception dates (holidays, sick days, etc.)
- Color coding: green = available, gray = booked, yellow = exception

### 3.3 Two-Way Calendar Sync

- Teacher can connect Google Calendar or Apple iCal
- **Import direction:** Events from personal calendar mark those times as unavailable in Harmonia automatically
- **Export direction:** All confirmed Harmonia lessons appear in the personal calendar
- Sync frequency: Every 15 minutes (Firebase Scheduled Functions)
- Conflict detection: If a new booking overlaps a synced personal event, teacher receives an immediate alert

---

## 4. Room Management

```typescript
{
  id: string;
  conservatoriumId: string;
  name: string;               // e.g. "Room 4 - Piano Studio"
  instruments: Instrument[];  // what's in this room
  capacity: number;
  hasProjector: boolean;
  hasSoundproofing: boolean;
  isActive: boolean;
}
```

- Each lesson slot is assigned a room automatically based on instrument + teacher preference
- Admin can view room occupancy grid at `/admin/rooms`
- Room conflicts are detected and flagged at booking time
- Teachers can set room preferences per day

---

## 5. Teacher Dashboard

`/dashboard/teacher`

### 5.1 Today's View
- List of today's lessons in chronological order
- Each lesson card shows: student name/photo, instrument, room, package type
- One-tap attendance marking: ✅ Present | ❌ Absent (No Notice) | ⏰ Absent (Noticed) | 📱 Virtual
- Quick note field per lesson
- "Sick leave — cancel today" emergency button

### 5.2 Week View
- Full week schedule
- Color-coded by status: scheduled (blue), completed (green), cancelled (red), makeup (orange)
- Drag-and-drop rescheduling (within same week only; future weeks via student request)

### 5.3 Student Roster
- Cards for all assigned students
- Last lesson date, next lesson date
- Package status (e.g., "3 lessons remaining")
- Practice log summary (from Module 09)
- "Message parent" shortcut

---

## 6. Teacher Onboarding Flow

When a teacher account is approved by admin:

1. Teacher receives welcome email with setup link
2. Guided onboarding (4 steps):
   - Complete profile (bio, photo, instruments)
   - Set weekly availability
   - Review teaching rates (confirm or negotiate with admin)
   - Connect calendar (optional)
3. Admin sees onboarding completion % in the user list
4. First students can only be assigned once onboarding is 80%+ complete

---

## 7. Substitute Teacher Workflow

When a teacher is sick or unavailable:

1. Teacher marks themselves unavailable (sick leave) in the app
2. System identifies all affected lesson slots for the selected date range
3. System checks: are there other active teachers who:
   - Teach the same instrument
   - Have availability at those exact times
4. If matches found: Admin is presented with a **one-click substitute assignment** screen
5. If no matches: Admin can flag lessons as "Postponed — credit issued"
6. All affected students/parents receive automatic notification (Module 07)

---

## 8. Teacher Performance Metrics

Visible to Admin at `/admin/teachers/:id`:

| Metric | How Calculated |
|--------|----------------|
| Attendance Rate | (Present lessons / Scheduled lessons) × 100 |
| Cancellation Rate | (Teacher-cancelled lessons / Scheduled) × 100 |
| On-Time Makeup Rate | (Makeups scheduled within policy / Total makeups owed) × 100 |
| Student Retention | (Students active 12 months / Students enrolled 12 months ago) × 100 |
| Avg. Lesson Rating | From optional student/parent post-lesson feedback |

---

## 9. Payroll Preparation

At the end of each month, the system auto-generates a payroll summary for each teacher:

```typescript
{
  teacherId: string;
  periodStart: Date;
  periodEnd: Date;
  completedLessons: {
    slotId: string;
    studentName: string;
    durationMinutes: number;
    rate: number;
    subtotal: number;
  }[];
  totalHours: number;
  grossPay: number;
  deductions?: number;     // if salaried employee with known deductions
  netPay: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
}
```

- Teacher sees their own paystub preview at `/dashboard/teacher/payroll`
- Admin reviews and approves all paystubs at `/admin/payroll`
- Export to Excel/PDF for accounting software import
- For freelance teachers: generates a `חשבונית מס קבלה` (tax receipt) template

---

## 10. UI Components Required

| Component | Route | Description |
|-----------|-------|-------------|
| `AvailabilityGrid` | `/dashboard/teacher/availability` | Drag-drop weekly availability editor |
| `TeacherDashboard` | `/dashboard/teacher` | Today's view + week view |
| `StudentRosterCard` | Within dashboard | Per-student summary card |
| `SickLeaveModal` | Triggered from dashboard | Emergency cancellation flow |
| `SubstituteAssignmentPanel` | `/admin/substitute` | Admin substitute matching UI |
| `PayrollSummaryView` | `/dashboard/teacher/payroll` | Monthly earnings breakdown |
| `AdminPayrollPanel` | `/admin/payroll` | Approve all paystubs |
| `RoomOccupancyGrid` | `/admin/rooms` | Room booking overview |
