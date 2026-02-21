# SDD-14: Additional Strategic Features

**Module:** 14  
**Dependencies:** Various (noted per feature)  
**Priority:** Mix of P1 and P2 — each feature is independently deployable

---

## Overview

This module captures high-value features that don't fit neatly into a single domain module but each represent a meaningful capability. They were identified through the lens of: what does a conservatorium manager actually spend time on that we haven't addressed yet, and where can smart technology create an unfair advantage?

---

## Feature A: Annual Recital & Concert Production Manager

**Dependencies:** Modules 01, 04, 08  
**Priority:** P1

### A.1 Rationale

Every conservatorium runs at least one major annual recital — often several. Today this is managed with a combination of WhatsApp groups, Excel sheets, and whoever happens to remember things. It is, reliably, a chaotic mess. This feature turns it into a managed production.

### A.2 The Event Production Model

```typescript
{
  id: string;
  conservatoriumId: string;
  name: string;                      // e.g., "Spring Recital 2026"
  type: 'RECITAL' | 'CONCERT' | 'EXAM_PERFORMANCE' | 'OPEN_DAY';
  
  // Logistics
  venue: Venue;                      // room within conservatorium or external
  eventDate: Date;
  doorsOpenTime: string;
  startTime: string;
  estimatedEndTime: string;
  
  // Program
  program: PerformanceSlot[];        // ordered list of performances
  
  // Production
  dressRehearsalDate?: Date;
  soundCheckSchedule?: SoundCheckSlot[];
  
  // Ticketing
  isPublic: boolean;
  ticketingEnabled: boolean;
  maxCapacity: number;
  ticketPrice: number;               // 0 for free events
  ticketsSold: number;
  
  // Status
  status: 'PLANNING' | 'OPEN_REGISTRATION' | 'CLOSED' | 'COMPLETED';
}
```

### A.3 Program Builder

Admin and teacher collaboratively build the program:

`/admin/events/:id/program`

- Drag-and-drop ordering of student performances
- Each slot shows: student name, instrument, piece(s), estimated duration
- Running total duration displayed prominently
- Intermission insertion (drag to position)
- Auto-detected issues: two consecutive piano solos, program too long, student performing twice in a row
- Export: print-quality program PDF (bilingual Hebrew/English) with all performer names

### A.4 Student Registration for Events

Students/parents register their participation through a form (Module 08 integration):
- Teacher first approves the student's readiness and repertoire
- Form pre-populates with student's current repertoire
- Once approved by admin, student is added to the program
- Student receives: rehearsal schedule, dress code reminder, arrival time for sound check

### A.5 Ticketing (Public Events)

`/events/:id` — public ticketing page:
- Event description, performers preview, venue info
- Seat selection or general admission counter
- Payment via card (Cardcom integration)
- E-ticket sent via email (QR code for door check-in)
- Admin can scan QR codes at the door via the mobile app

### A.6 Dress Rehearsal Scheduler

For each student on the program:
- Assigned a sound check / run-through slot
- Automatic notification 48 hours before: "Your rehearsal slot is [date/time]. Please arrive 10 minutes early."
- Teacher receives a rehearsal schedule for all their students in the event

---

## Feature B: Student Achievement & Certificate System

**Dependencies:** Modules 01, 09  
**Priority:** P2

### B.1 Rationale

Students who feel recognized stay enrolled longer. Parents who see structured progression re-enroll their children for another year. A digital achievement and certificate system adds tangible milestones to what can feel like an endless journey of weekly lessons.

### B.2 Achievement Types

```typescript
type AchievementType =
  | 'PRACTICE_STREAK_7'          // 7-day practice streak
  | 'PRACTICE_STREAK_30'         // 30-day practice streak
  | 'PIECE_COMPLETED'            // teacher marks a piece as performance-ready
  | 'EXAM_PASSED'                // Ministry exam passed
  | 'FIRST_RECITAL'              // first public performance
  | 'YEARS_ENROLLED_1'          // 1 year anniversary
  | 'ENSEMBLE_DEBUT'             // first ensemble/group performance
  | 'TEACHER_NOMINATED'          // teacher nominates for exceptional progress
```

### B.3 Digital Certificates

When an achievement is earned:
- A beautifully designed PDF certificate is generated (conservatorium letterhead, teacher's signature, student's name)
- Parent and student notified: "🎉 [Child] earned a new certificate!"
- Certificate added to the student's achievement portfolio
- Portfolio is shareable (opt-in): a personal public URL with all achievements

### B.4 Shareable Portfolio Page (Future)

When a student opts-in, the system will generate a public, shareable URL (e.g., `harmonia.app/portfolio/student-name`). This page will be visually appealing, designed to be shared with family, friends, or for college applications.

**Design Philosophy:**
*   **Clean & Professional:** The page will have a minimalist design, focusing on the student's accomplishments.
*   **Visual Milestones:** Achievements will be displayed as a timeline with icons and dates.
*   **Print-Friendly:** The layout will be optimized for printing as a formal record of achievement.
*   **Print-Friendly:** The layout will be optimized for printing as a formal record of achievement.

### B.5 Teacher Nomination

Teachers can nominate students for "Exceptional Progress" certificates with a short comment. These require admin approval and carry more weight than automatic achievements. This gives teachers a meaningful way to recognize effort beyond measurable metrics.

---

## Feature C: Parent Engagement Portal

**Dependencies:** Modules 01, 09, 07  
**Priority:** P1

### C.1 Rationale

The most common reason a child stops music lessons is parental disengagement. When parents don't feel connected to their child's musical journey, they see lessons as an expense rather than an investment. This feature keeps parents actively involved without burdening teachers with extra communication.

### C.2 The Weekly Parent Digest

Every Sunday evening, parents receive an automated digest:

**"This week in [child's] musical journey:"**

```
🎹 [Child Name]'s Week — Week of March 10, 2026

📅 Upcoming: Piano lesson with Teacher Rivka
   Tuesday, March 12 at 4:00 PM · Room 3

🎵 Current Repertoire:
   • Beethoven Sonata Op. 49 — "Polishing" 
   • Bach Invention No. 1 — ✅ Performance Ready!

📝 From Teacher Rivka (last lesson):
   "Great focus this week. Work on the left hand 
   in bars 14–18 before Tuesday."

⏱ Practice This Week: 3 sessions · 75 minutes total
   [Goal: 3 sessions — ✅ On track!]

💡 How to help at home:
   → Ask [child] to play the Bach Invention for you
   → Celebrate their progress on the Beethoven!

🔔 Next steps: [View Full Schedule] [Message Teacher]
```

This digest is generated automatically from practice logs, lesson notes, and schedule data. Parents who feel informed are parents who keep their children enrolled.

### C.3 Practice Encouragement Tools

For parents of under-13 students:
- "Practice reminder" — set a daily time for the app to send a push notification to the parent: "Time for [child]'s practice! 🎵"
- "Log practice on behalf of [child]" — quick 30-second log after supervising a practice session
- "Send encouragement" — sends a pre-written celebration message to the teacher, who can share it with the student

---

## Feature D: Alumni Network & Community

**Dependencies:** Module 01  
**Priority:** P3 (long-term)

### D.1 Rationale

Every conservatorium has graduates who loved their time there, some of whom are now professional musicians. These alumni are the best marketing asset the conservatorium has — and they're completely untapped.

### D.2 Alumni Portal (`/alumni`)

Former students who graduated or completed studies can:
- Create a free alumni profile (no lesson booking, just community)
- Showcase their current musical activities
- Join a conservatorium alumni group chat
- Come back for advanced masterclasses (special alumni pricing)
- Refer new students (and earn referral credits toward masterclasses)

### D.3 Alumni as Guest Teachers

Advanced alumni (professional musicians) can be invited as guest teachers for:
- Masterclasses (one-off bookings, not ongoing)
- Sectional coaching for ensemble students
- Recital coaching in the run-up to performances

This creates a pipeline from student → alumnus → guest teacher → potentially full teacher hire.

---

## Feature E: Conservatorium Open Day Manager

**Dependencies:** Modules 02, 07, 12  
**Priority:** P2

### E.1 Rationale

The annual open day is the conservatorium's highest-converting acquisition event. Families visit, see the rooms, meet the teachers, and often enroll on the spot. This feature makes the open day itself into a managed, data-driven experience.

### E.2 Open Day Flow

**Before:**
- Public registration page: `[conservatorium].harmonia.co.il/open-day`
- Registrants choose their 20-minute appointment slot
- Automated reminders: 1 week, 1 day, 1 hour before
- Internal: admin sees a schedule of all appointments

**During:**
- Check-in via QR scan at the door
- Each family is greeted by name
- Teacher matchmaking happens on the day: families have a mini-session with a proposed teacher
- iPad-based enrollment: families can start their enrollment wizard on-site

**After:**
- Families who didn't enroll receive a 3-part nurture email sequence (Days 1, 7, 21)
- Day 1: "So lovely to meet you! Here's what your child could achieve in a year..."
- Day 7: "Meet [teacher name], who would love to teach [child name]..." (personalized with teacher bio and video)
- Day 21: "We still have a spot open. Enrollment closes [date]..." (scarcity, if true)

---

## Feature F: Multi-Branch Conservatorium Support

**Dependencies:** All modules  
**Priority:** P2 (for larger institutions)

### F.1 Rationale

Some Israeli conservatoriums operate across multiple branches (e.g., a main campus in the city center and satellite branches in surrounding neighborhoods). The system must handle this natively.

### F.2 Branch Model

```typescript
{
  id: string;
  conservatoriumId: string;    // parent organization
  name: string;                // e.g., "Haifa North Branch"
  address: Address;
  rooms: Room[];
  assignedTeacherIds: string[]; // teachers who work at this branch
  adminId?: string;             // optional branch manager (subordinate to conservatorium admin)
}
```

### F.3 Cross-Branch Features

- Students can be enrolled at one branch but book ad-hoc slots at another
- Teachers can have availability at multiple branches (with travel time buffers between)
- Admin can view reports aggregated across all branches or filtered per-branch
- Musicians for Hire (Module 13) sourced from any branch based on proximity to event

---

## Feature G: Instrument Rental Management

**Dependencies:** Modules 01, 05  
**Priority:** P2

### G.1 Rationale

Many conservatoriums have a small library of rental instruments for beginners who aren't ready to buy. This is currently managed by a paper list on someone's desk. It should be in the system.

### G.2 Instrument Inventory Model

```typescript
{
  id: string;
  conservatoriumId: string;
  type: Instrument;
  brand: string;
  serialNumber: string;
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR';
  rentalRatePerMonth: number;
  currentRenterId?: string;      // studentId
  rentalStartDate?: Date;
  expectedReturnDate?: Date;
  notes?: string;
}
```

### G.3 Rental Flow

- Admin assigns instrument to student from inventory list
- Monthly rental fee is automatically added to the student's invoice
- Automated reminder 2 weeks before expected return
- Condition logged on return (with optional photo)
- Damage deposit held and returned/applied based on condition report

---

## Feature H: AI Practice Coach (Future / Experimental)

**Dependencies:** Module 09, Module 10  
**Priority:** P3 — Requires additional AI infrastructure

### H.1 Concept

A student (13+) can record themselves playing on their phone and receive instant AI feedback:

1. Student opens `/dashboard/practice/coach`
2. Taps "Record my practice"
3. Plays a 30–60 second excerpt
4. Audio is sent to a music analysis AI (pitch detection, rhythm analysis)
5. Within 30 seconds, student receives:
   - Accuracy score for the piece (pitch correctness %)
   - Rhythm consistency score
   - 2–3 specific observations: "The note in bar 5 was slightly flat · Your rhythm was very steady in bars 1–8 · The tempo picked up noticeably in bar 12"
6. These reports are also visible to the teacher before the next lesson

### H.2 Technology Stack

- Audio capture: Web Audio API
- Analysis: Google Cloud Music AI (Magenta) or specialized pitch detection API
- Feedback generation: Genkit prompt combining raw analysis data → human-readable Hebrew feedback
- Storage: Firebase Storage (audio files, analysis results)

### H.3 Privacy & Safeguards

- Audio files are stored for 7 days then auto-deleted (unless student saves)
- Teacher can disable this feature for a student if it creates anxiety
- Feedback is explicitly framed as a learning tool, not a grade

---

## Summary: Additional Features Priority Map

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| A: Recital Production Manager | Medium | High | P1 |
| B: Achievement & Certificates | Low | Medium | P2 |
| C: Parent Engagement Portal | Low | High | P1 |
| D: Alumni Network | Medium | Medium | P3 |
| E: Open Day Manager | Low | High | P2 |
| F: Multi-Branch Support | High | High (for chains) | P2 |
| G: Instrument Rental | Low | Medium | P2 |
| H: AI Practice Coach | Very High | High | P3 |
