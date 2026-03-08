# Harmonia -- End-User Guide

**Version 3.0**

---

## 1. Introduction

Harmonia is a comprehensive music conservatory management platform built for Israeli music schools. It brings together lesson scheduling, practice tracking, repertoire management, billing, exams, events, and communications into a single system. The platform supports Hebrew (default, RTL), English, Arabic, and Russian.

Harmonia serves **seven user personas**: students, parents, teachers, conservatory administrators, delegated administrators, site administrators, ministry directors, and school coordinators. Each persona has a tailored dashboard and navigation experience.

---

## 2. For Students

### 2.1 Profile Dashboard

Your landing page shows:
- Teacher assignment and active lesson package with remaining credits
- Weekly practice goal progress bar
- Upcoming lessons with date, time, and room
- Recent practice logs and repertoire snapshot
- Achievement badges for milestones

### 2.2 Schedule (`/dashboard/schedule`)

- **View Lessons:** Weekly calendar with week/list toggle
- **Book Makeup:** Use makeup credits from cancelled lessons to find open slots
- **Cancel/Reschedule:** Click any lesson for details, then cancel or reschedule per conservatory policy
- **Available-Now Deals:** Browse `/available-now` for open teacher slots. Click "Book Now" to save the slot and proceed through the booking wizard
- **Premium Teachers:** Teachers with a gold badge are Premium -- they may use higher-priced premium packages

### 2.3 Practice Log (`/dashboard/practice`)

- Log sessions with date, duration, pieces, and mood
- Add notes for your teacher (visible in their pre-lesson summary)
- Upload practice videos for teacher feedback
- View history with weekly/monthly totals and streaks

### 2.4 Repertoire (`/dashboard/student/repertoire`)

- View assigned pieces by status: In Progress, Polishing, Performance Ready, Completed
- Click any piece for full details and teacher notes
- Request new pieces via AI suggestions (5,000+ compositions in library)

### 2.5 Forms (`/dashboard/forms`)

- Submit official forms: recital applications, exam entries, instrument loans
- Track status: Draft, Submitted, Under Review, Approved, Rejected
- Download approved documents as PDF

### 2.6 Messages (`/dashboard/messages`)

- Direct messaging with teachers and staff
- Searchable message history

### 2.7 AI Practice Coach (`/dashboard/practice/coach`)

- Ask questions about technique, theory, or practice strategy
- Get composition suggestions matching your instrument and level
- Request structured practice plans for exams or recitals

---

## 3. For Parents

### 3.1 Family Hub (`/dashboard/family`)

- **Weekly Digest Cards** per child: next lesson, repertoire progress, teacher notes, practice bar
- One-click navigation to any child's profile, schedule, or teacher message
- **Age-Upgrade Invitation:** when a child turns 13, grant them an independent account

### 3.2 Billing (`/dashboard/parent/billing`)

- View active packages and remaining credits per child
- Invoice history with status (Paid, Pending, Overdue)
- Update payment method (Israeli gateways: Cardcom, Pelecard, Tranzila)
- Request subscription pause or cancellation

### 3.3 Scholarships (`/dashboard/apply-for-aid`)

- Browse available scholarship and aid programmes
- Submit applications with supporting documents
- Track application status through review process

### 3.4 Playing School Registration (`/enroll/playing-school/[token]`)

- Token-based enrollment via personalised link
- Step-by-step wizard: child details, instrument, schedule, payment
- Save & continue -- progress persists between sessions

### 3.5 Notification Preferences

- Choose alerts by channel: email, SMS, WhatsApp
- Switch language (Hebrew, English, Arabic, Russian)
- Manage linked children from account settings

---

## 4. For Teachers

### 4.1 My Workspace (`/dashboard/teacher`)

- Today's lessons in chronological order with student, instrument, room
- Mark attendance: Present, Absent (notified), Absent (no notice)
- Quick actions: report sick leave, open availability grid
- Student roster with practice log links and exam dates
- Pending form approvals

### 4.2 Availability (`/dashboard/teacher/availability`)

- Interactive weekly grid of 30-minute slots
- Set recurring weekly schedule + date-specific overrides
- External calendar sync placeholder (Google Calendar)

### 4.3 Lesson Notes (`/dashboard/teacher/lessons/[id]/note`)

- Post-lesson structured notes: summary, homework, pieces covered
- AI Pre-Lesson Summary compiles each student's recent activity
- Notes visible to student, parent (under-13), and admin
- Editable within 24 hours; locked with audit trail after

### 4.4 Student Progress (`/dashboard/student/[id]`)

- Full profile: practice history, repertoire, exam history, achievements
- Assign repertoire from 5,000+ composition library
- Set weekly practice goals
- Generate AI Progress Report from logged data

### 4.5 Payroll (`/dashboard/teacher/payroll`)

- Monthly pay stubs with lesson breakdown
- Export PDF for personal records
- Flag issues for admin review

### 4.6 Performance Profile (`/dashboard/teacher/performance-profile`)

- Edit public bio, photo, instruments, styles
- Toggle availability visibility for prospective students
- **Premium Badge:** displayed if admin designates you as Premium (admin-only toggle)

### 4.7 Exams (`/dashboard/teacher/exams`)

- Upcoming exams with dates, boards, grades, repertoire
- Enter exam results (visible to student and parent)
- Preparation status indicators (green/amber/red)

---

## 5. For Conservatory Administrators

### 5.1 Admin Command Center (`/dashboard/admin`)

- Live metrics: active students, lessons this week, pending approvals, overdue invoices
- Quick action buttons for common tasks
- Today's lesson feed grouped by teacher
- Payment alerts and AI intelligence alerts

### 5.2 User Management (`/dashboard/users`)

- Pending approvals tab for new registrations
- Searchable/filterable user table by role, instrument, teacher, branch
- Edit user details, change roles, reassign teachers
- Bulk actions: notify, export CSV, change attributes
- **Delegated Admin:** assign partial admin rights scoped to specific sections
- **Premium Teacher:** designate teachers as Premium for higher-tier packages

### 5.3 Approvals (`/dashboard/approvals`)

- Centralised queue: scholarships, forms, schedule changes, enrollments
- Filter by type, status, date range
- Batch approve for routine items
- Full audit trail on every decision

### 5.4 Schedule & Rooms (`/dashboard/master-schedule`, `/dashboard/admin/branches`)

- Master schedule grid: rooms/teachers x time slots with filters
- Conflict detection (double-bookings highlighted in red)
- Substitute management with AI-suggested replacements
- Branch and room management with instrument equipment tracking

### 5.5 Finance (`/dashboard/billing`, `/dashboard/admin/payroll`)

- Financial overview: monthly revenue, collection rate, trends
- Invoice management with discounts, scholarship credits, write-offs
- Teacher payroll drafts from completed lessons and rates
- Export payroll as CSV/PDF for Hilan/Merav Digital

### 5.6 Events & Open Days (`/dashboard/events`, `/dashboard/admin/open-day`)

- Create events: recitals, masterclasses, workshops, concerts
- AI event poster generation
- Open day registration management with session slots
- Attendee lists and bulk reminder notifications

### 5.7 Playing School (`/dashboard/admin/playing-school`)

- Programme overview: enrolled children, groups, sessions
- Registration management from token-based wizard
- Token generation for enrollment invitations
- AI lead nurturing for incomplete enrollments

### 5.8 Forms & Announcements

- **Form Builder** (`/dashboard/admin/form-builder`): drag-and-drop with approval workflows
- **Announcements** (`/dashboard/announcements`): conservatory-wide or targeted

### 5.9 Scholarships & Donations (`/dashboard/admin/scholarships`)

- Create scholarship programmes with criteria and deadlines
- Review applications with internal notes
- Track donations and generate acknowledgement letters

### 5.10 Reports (`/dashboard/reports`)

- **Academic:** exam pass rates, retention, practice hours
- **Financial:** revenue by month/package/branch, collection rates
- **Operational:** lesson utilisation, room occupancy, teacher capacity
- Export as CSV or PDF; Ministry-format exports available

### 5.11 Settings (`/dashboard/settings/conservatorium`)

- General: name, logo, contact, description
- Lesson packages and pricing (including Premium tiers)
- Cancellation policy: notice period, makeup credit expiry
- AI features toggle
- `newFeaturesEnabled` flag for grouped nav experience

---

## 6. For Site Administrators (`site_admin`)

### 6.1 Platform-Wide Access

- Cross-conservatorium view and management
- "View As" mode for support requests (read-only)
- Dev bypass in development environments (auto-injected `site_admin` claims)

### 6.2 Managing Conservatoriums

- List all conservatoriums with status, metrics, contacts
- Create new conservatoriums and generate first admin invitation
- Suspend/reactivate conservatoriums
- Toggle feature flags per conservatorium

### 6.3 Ministry Reports (`/dashboard/ministry-export`)

- Standardised export for Ministry of Culture and Sport
- Pre-export validation for missing required fields
- Download as Excel or CSV

---

## 7. For Ministry Directors (`ministry_director`)

### 7.1 Ministry Dashboard (`/dashboard/ministry`)

- Aggregated statistics across all conservatoriums
- Per-conservatorium drill-down with trend indicators
- Geographic distribution view
- Automatic alerts for unusual patterns

### 7.2 Export and Reporting

- Standardised data extracts (single or all conservatoriums)
- Comparison reports across performance indicators
- All reports include "data as of" timestamp
- **Read-only role** -- cannot modify any data

---

## 8. For School Coordinators (`school_coordinator`)

### 8.1 School Dashboard (`/dashboard/school`)

- Partnership overview: schools, contacts, groups, schedules
- Group management: assign teachers, track attendance
- Instrument loans: tracking, condition reports, returns
- Excellence track nominations
- Enrollment pipeline from token-based wizard

---

## 9. Common Features

### 9.1 Language & RTL

- **Languages:** Hebrew (default), English, Arabic, Russian
- **RTL:** Hebrew and Arabic trigger full right-to-left layout automatically
- **Locale Routing:** Hebrew at root `/`, others at `/en/`, `/ar/`, `/ru/`

### 9.2 Notifications (`/dashboard/notifications`)

- Bell icon with unread badge count
- Types: lesson reminders, form updates, payment receipts, messages, announcements
- Preferences: in-app, email, SMS/WhatsApp per event type

### 9.3 AI Assistant (`/help`)

- Natural language help chat grounded in curated articles
- Context-aware answers per role
- Composition suggestions from 5,000+ library

### 9.4 Premium Teacher Booking Flow

1. Browse teachers on landing page or `/available-now`
2. Premium teachers display a gold badge on their cards and slot tiles
3. Click "Book Now" -- slot saved to session, routed through login/register
4. In the booking wizard, premium packages (`PACK_5_PREMIUM`, `PACK_10_PREMIUM`, `PACK_DUET`) appear when a premium teacher is selected
5. Complete booking with selected package and payment

### 9.5 Accessibility

- Keyboard navigation with visible focus rings
- Screen reader support (semantic HTML + ARIA)
- High contrast mode support
- Fluid layouts at all zoom levels
- `/accessibility` statutory page (IS 5568 compliance)

---

## 10. Getting Help

- **In-App Help (`/help`):** AI assistant available 24/7
- **Help Centre:** structured articles by topic and role
- **Admin Support:** contact via Messages section
- **Technical Support:** "Report a Problem" in account menu
