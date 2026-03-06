# Harmonia - End-User Guide

**Version 2.0**

---

## 1. Introduction

Harmonia is a comprehensive music conservatory management platform built for Israeli music schools. It brings together every aspect of conservatory life — lesson scheduling, practice tracking, repertoire management, billing, exams, events, and communications — into a single, unified system. The platform supports Hebrew (default, RTL), English, Arabic, and Russian, and is designed to work equally well on mobile and desktop devices.

Harmonia serves seven distinct user personas: students, parents, teachers, conservatory administrators, delegated administrators, site administrators (platform-wide), and ministry directors. Each persona has a tailored dashboard and navigation experience. This guide covers all personas. Find the section that matches your role and refer to it for day-to-day usage.

---

## 2. For Students

As a student, Harmonia is your personal hub for managing your musical journey — from viewing your schedule and logging practice sessions to submitting forms and communicating with your teacher.

### 2.1 My Profile Dashboard

When you log in, you land on your **Profile Dashboard**. It gives you an at-a-glance summary of everything that matters:

- **Teacher & Package:** See your assigned teacher, your active lesson package, and remaining lesson credits.
- **Weekly Practice Goal:** A progress bar shows how many minutes you have practiced this week against the goal your teacher set.
- **Upcoming Lessons:** Your next two or three scheduled lessons, with date, time, and room.
- **Recent Practice Logs:** The last few sessions you logged, including duration and pieces worked on.
- **Repertoire Snapshot:** The pieces currently assigned to you, with status (learning, polishing, performance-ready).
- **Achievements:** Digital badges for milestones such as completing a piece, maintaining a seven-day practice streak, or passing an exam grade.

### 2.2 Schedule (`/dashboard/schedule`)

- **View Your Lessons:** A weekly calendar displays all your upcoming lessons. Switch between week and list views using the toggle at the top right.
- **Book a Makeup Lesson:** If you have makeup credits (earned when a lesson was cancelled with sufficient notice), use the "Book Makeup" button to find an available slot with your teacher.
- **Cancel or Reschedule:** Click any lesson card to open a details dialog. From there, select "Cancel" or "Reschedule." Cancellation policies set by your conservatory determine whether a makeup credit is issued.
- **Lesson History:** Scroll back to previous weeks to review past lessons, including attendance status and any notes your teacher left.

### 2.3 Practice Log (`/dashboard/practice`)

- **Log a Session:** Tap "Log Practice" and fill in the date, duration (in minutes), the pieces you worked on, and a mood rating.
- **Add Notes for Your Teacher:** Use the notes field to flag anything challenging or to share what went well. Your teacher sees these notes in their lesson prep view before your next session.
- **Upload a Video:** Use "Upload Video for Feedback" to attach a short recording. Your teacher can leave timestamped comments directly on the video.
- **View History:** The practice log table shows all your past sessions with total weekly and monthly totals, helping you spot patterns in your practice habits.
- **Streaks & Stats:** The summary card at the top tracks your current practice streak and your all-time personal best.

### 2.4 Repertoire (`/dashboard/student/repertoire`)

- **View Assigned Pieces:** See every piece assigned to you, organised by status: In Progress, Polishing, Performance Ready, and Completed.
- **Piece Details:** Click a piece to see the full record — composer, arranger, grade level, when it was assigned, and any specific notes from your teacher.
- **Request a New Piece:** Use the "Suggest a Piece" button to send your teacher a request. The AI assistant can suggest repertoire appropriate for your grade and instrument.
- **Exam Repertoire:** Pieces marked for an upcoming exam appear highlighted so you can focus your practice accordingly.

### 2.5 Forms & Docs (`/dashboard/forms`)

- **Submit Forms:** This is where you fill out and submit official forms — recital applications, exam entries, instrument loan agreements, and more.
- **Track Status:** The main table shows every form you have submitted, with a colour-coded status: Draft, Submitted, Under Review, Approved, Rejected.
- **View Details & History:** Click any form to read the full submission and see the complete approval trail, including any comments from reviewers.
- **Download Approved Documents:** Once a form reaches "Approved," a download button appears so you can save a PDF copy for your records.

### 2.6 Messages (`/dashboard/messages`)

- **Direct Messaging:** Send and receive messages with your teacher and conservatory staff through Harmonia's secure internal messaging system.
- **Notifications vs. Messages:** System notifications (lesson reminders, form approvals) appear in the Notifications panel. The Messages section is for free-form conversation.
- **Message History:** All conversations are stored and searchable, so you can look back at instructions your teacher sent in a previous session.

### 2.7 AI Practice Coach (`/dashboard/practice/coach`)

- **Ask Questions:** Type a question about technique, theory, or practice strategy and the AI coach responds using resources curated by your conservatory.
- **Composition Suggestions:** Ask for piece suggestions matching your instrument, grade, or a style you are working towards. The AI draws on a library of over 5,000 compositions.
- **Practice Plans:** Describe an upcoming exam or recital and the coach can suggest a structured daily practice schedule for the weeks leading up to it.

---

## 3. For Parents

The Family Hub is your command center for staying informed about your children's musical education, managing payments, and communicating with the conservatory.

### 3.1 Family Hub (`/dashboard/family`)

- **Weekly Digest Cards:** Each child enrolled in the conservatory gets a dedicated digest card. At a glance you can see:
  - Their next scheduled lesson (date, time, teacher, room).
  - Current repertoire pieces and their progress status.
  - The latest note left by their teacher after the most recent lesson.
  - A practice progress bar showing this week's minutes against the weekly goal.
- **One-Click Navigation:** From each child's card, jump directly to their full profile, their schedule, their practice log, or open a message thread with their teacher.
- **Age-Upgrade Invitation:** When a child turns 13, a prompt appears on their card inviting you to grant them an independent student account so they can manage their own profile.
- **Multiple Children:** If you have more than one child enrolled, each has their own card. Scroll down to see all children on a single page.

### 3.2 Billing & Invoices (`/dashboard/parent/billing`)

- **Current Package:** View the active lesson package for each child, including the number of lessons included, lessons remaining, and the next renewal date.
- **Invoice History:** A full list of past invoices with date, amount, and status (Paid, Pending, Overdue). Click any invoice to view the full breakdown and download a PDF.
- **Update Payment Method:** Use "Manage Payment Method" to securely update your credit card details. Harmonia integrates with Israeli payment gateways (Cardcom, Pelecard, Tranzila) according to your conservatory's configuration.
- **Pause or Cancel:** Subject to your conservatory's policy, you can request a subscription pause (e.g., during summer break) or cancellation directly from this page.

### 3.3 Scholarship Applications (`/dashboard/apply-for-aid`)

- **Browse Available Aid:** See all scholarship and financial aid programmes currently open at your conservatory, with eligibility criteria and deadlines.
- **Submit an Application:** Complete the structured application form online. Required fields vary by programme — some ask for income documentation; others are merit-based.
- **Track Application Status:** After submission, the status updates as your application moves through the review process: Submitted, Under Review, Shortlisted, Awarded, or Declined.
- **Supporting Documents:** Upload required documents (income statements, recommendation letters) directly through the form interface.

### 3.4 Playing School Registration (`/enroll/playing-school/[token]`)

- **Token-Based Enrollment:** The conservatory sends you a personalised registration link containing a secure token. Open the link to begin the wizard.
- **Step-by-Step Wizard:** The enrollment wizard walks you through child details, instrument interest, preferred lesson days and times, parent contact information, and payment setup.
- **Save & Continue:** The wizard saves your progress at each step, so you can return to finish if you need to gather information.
- **Confirmation:** After completing the wizard, you receive a confirmation screen and an email summary. The conservatory staff reviews the registration and contacts you to confirm placement.

### 3.5 Notifications & Settings

- **Notification Preferences:** In your account settings, choose which alerts you receive by email, SMS, or WhatsApp — lesson reminders, payment receipts, teacher messages, and form approvals.
- **Language:** Switch the platform language between Hebrew, English, Arabic, and Russian from your profile settings. The page layout automatically mirrors for RTL languages.
- **Linked Children:** The settings page shows all child accounts linked to your parent profile. You can request to link an additional child if they are already enrolled.

---

## 4. For Teachers

Harmonia reduces your administrative load so you can focus on teaching. Manage your schedule, document lessons, track student progress, and view your payroll all in one place.

### 4.1 My Workspace (`/dashboard/teacher`)

- **Today's Lessons:** Your workspace opens with a chronological list of all lessons scheduled for today. Each card shows the student's name, instrument, lesson duration, and room.
- **Mark Attendance:** For each lesson, tap the attendance button to record Present, Absent (notified), or Absent (no notice). Attendance records feed into payroll calculations and parent notifications.
- **Quick Actions:** Buttons at the top allow you to report sick leave (which automatically notifies students, parents, and the admin team), or navigate directly to your availability grid.
- **Student Roster:** A full list of your assigned students with quick links to each student's profile, their latest practice log entry, and their upcoming exam dates.
- **Pending Approvals:** Any student-submitted forms that require your sign-off (recital applications, exam entries) are listed here with one-click approve or reject actions.

### 4.2 Availability Settings (`/dashboard/teacher/availability`)

- **Weekly Grid:** An interactive grid shows every day of the week broken into 30-minute slots. Click a slot to mark it available for student booking; click again to remove it.
- **Recurring vs. One-Off:** Set a recurring weekly schedule as your default, then use the date override panel to mark specific dates as unavailable (holidays, performances, professional development).
- **Save Changes:** Availability updates only apply to open booking slots — already-confirmed lessons are not affected when you update your grid.
- **External Calendar Sync:** A placeholder integration allows you to connect your Google Calendar or Apple Calendar so your Harmonia schedule appears in your personal calendar (feature availability depends on your conservatory's configuration).

### 4.3 Lesson Notes (`/dashboard/teacher/lessons/[id]/note`)

- **Post-Lesson Notes:** After each lesson, navigate to the lesson record and click "Add Note." The structured note form includes fields for session summary, homework assigned, pieces covered, and goals for the next lesson.
- **Visibility:** Notes are visible to the student and, for students under 13, to their linked parent. They are also visible to conservatory administrators.
- **Pre-Lesson Summary:** Before your first lesson of the day, Harmonia's AI Pre-Lesson Summary automatically compiles each student's recent practice logs, outstanding homework, and any notes from the previous lesson into a one-page brief — accessible from the lesson card.
- **Edit Notes:** You can edit a note within 24 hours of posting. After that, the note is locked and an audit trail is shown.

### 4.4 Student Progress (`/dashboard/student/[id]`)

- **Full Profile View:** Access any student's complete profile — practice history with weekly totals, the full repertoire list, exam history, achievements, and all past lesson notes.
- **Assign Repertoire:** Use the "Assign Piece" button to add a composition to the student's repertoire. Search the in-built library by composer, title, instrument, or grade level.
- **Set Practice Goal:** Use the "Weekly Practice Goal" widget to set a target in minutes. The student's profile and parent's Family Hub card both display progress against this goal.
- **Generate AI Progress Report:** At the end of a term, click "Draft Report" to have the AI generate a personalised progress report based on the student's logged data. Review and edit the draft before sending it to parents.

### 4.5 Payroll (`/dashboard/teacher/payroll`)

- **Pay Stubs:** A list of monthly pay stubs showing gross pay, deductions, and net pay for each period.
- **Lesson Breakdown:** Expand any pay stub to see a line-by-line list of all completed lessons that contributed to that month's payment — student name, date, duration, and rate.
- **Export:** Download a PDF of any pay stub for your own records.
- **Disputes:** If a lesson is missing or incorrectly recorded, use the "Flag an Issue" button on the relevant entry to notify the admin team.

### 4.6 Performance Profile (`/dashboard/teacher/performance-profile`)

- **Public Bio:** Edit the bio and profile photo that appear on the conservatory's public-facing musicians directory (`/musicians`). Include your performance background, qualifications, and teaching specialities.
- **Instruments & Styles:** Maintain a structured list of the instruments you teach and the musical styles you specialise in. This data powers the AI teacher-matching flow for new enrolments.
- **Availability Visibility:** Toggle whether your general availability is shown publicly to prospective students browsing the conservatory website.

### 4.7 Exams Tracker (`/dashboard/teacher/exams`)

- **Upcoming Exams:** A list of all upcoming exams for your students, with the exam date, board (ABRSM, Trinity, etc.), grade, and the repertoire the student has entered.
- **Enter Exam Results:** After an exam, enter the result directly in Harmonia. Results are visible to the student and parent and are stored in the student's permanent record.
- **Preparation Status:** For each entered student, see how many lessons remain before the exam date and a colour indicator (green/amber/red) based on practice hours and repertoire completion.

---

## 5. For Conservatory Administrators

The admin dashboard gives you full visibility and control over every aspect of your conservatory's operations — people, schedule, finance, events, and communications.

### 5.1 Admin Command Center (`/dashboard/admin`)

- **Live Metrics Bar:** At the top of the page, real-time counters show active students, lessons scheduled this week, pending approvals, outstanding invoices, and open AI alerts.
- **Quick Action Buttons:** Large, labelled buttons for your most frequent tasks — approve new registrations, review pending forms, send a conservatory-wide announcement, or open the master schedule.
- **Today's Snapshot:** A live feed of today's lessons grouped by teacher, with attendance status updating in real time as teachers mark their sessions.
- **Payment Alerts:** Any failed payments or overdue invoices from the last 48 hours are surfaced here with links to the relevant student billing record.
- **AI Intelligence Alerts:** The AI agent monitors operational signals and raises alerts — for example, a teacher whose roster is near capacity, a student whose practice hours have dropped sharply, or a scheduled lesson with no room assigned. Each alert links directly to the relevant management page.

### 5.2 User Management (`/dashboard/users`)

- **Pending Approvals Tab:** New students and teachers who registered via the self-registration flow appear here. Review their submitted details, then approve or reject with a note.
- **All Users Table:** A searchable, filterable table of every user in your conservatory. Filter by role, instrument, teacher, branch, or status.
- **Edit User Details:** Click any user to open their full admin profile. You can update their personal details, change their role, reassign them to a different teacher, or suspend/reactivate their account.
- **Bulk Actions:** Select multiple users to bulk-send a notification, export their records to CSV, or change a shared attribute such as their assigned branch.
- **Delegated Admin:** Assign a user the `delegated_admin` role to grant them partial admin rights scoped to a specific set of permissions you define.

### 5.3 Approvals (`/dashboard/approvals`)

- **Centralised Approval Queue:** All pending approval items from across the platform appear in one place — scholarship applications, student form submissions, teacher-requested schedule changes, and enrolment registrations.
- **Filters:** Filter the queue by type (form, scholarship, enrolment, payroll), status (pending, under review), or date range.
- **Batch Approve:** For routine items (e.g., a batch of exam entry forms), use the checkbox multi-select and "Approve All Selected" to process them in one action.
- **Audit Trail:** Every approval or rejection is logged with the approving admin's name, the timestamp, and any comment they added.

### 5.4 Schedule & Rooms (`/dashboard/master-schedule`, `/dashboard/admin/branches`)

- **Master Schedule:** A full conservatory schedule in a grid view — rows are rooms or teachers; columns are time slots. Apply filters for branch, date range, instrument, or teacher to narrow the view.
- **Conflict Detection:** The schedule view highlights double-bookings and room conflicts in red. Click a conflicted slot to open the resolution dialog.
- **Substitute Management:** When a teacher reports sick or requests leave, the substitutes panel (`/dashboard/admin/substitute`) lists all affected lessons with AI-suggested substitute teachers ranked by availability, qualification, and past substitution history.
- **Branch Management (`/dashboard/admin/branches`):** Add, rename, or archive physical branch locations. Assign rooms to each branch and set each room's capacity and available instruments.
- **Room & Instrument Rentals:** Track your inventory of rental instruments, record which student has each item, and manage return dates and condition reports.

### 5.5 Finance & Billing (`/dashboard/billing`, `/dashboard/admin/payroll`)

- **Financial Overview (`/dashboard/billing`):** A high-level dashboard showing monthly revenue, collection rate, total outstanding invoices, and trends over the last 12 months.
- **Invoice Management:** Search for any student's billing record, view their invoice history, manually generate an invoice, apply a discount or scholarship credit, or write off a bad debt.
- **Payment Reconciliation:** Match incoming bank payments to outstanding invoices using the reconciliation table.
- **Teacher Payroll (`/dashboard/admin/payroll`):** At the start of each pay cycle, Harmonia auto-generates a payroll draft based on completed lessons and contracted rates. Review the draft, adjust for any exceptional items (sick leave, bonuses), approve it, and mark it as paid once transferred.
- **Payroll Export:** Download the approved payroll as a CSV or PDF formatted for standard Israeli payroll processing.

### 5.6 Events & Open Days (`/dashboard/events`, `/dashboard/admin/open-day`)

- **Events Calendar (`/dashboard/events`):** Create and manage conservatory events — student recitals, masterclasses, workshops, and community concerts. Set event details, capacity, RSVP requirements, and ticket pricing.
- **AI Event Poster:** Use the "Generate Poster" button on any event to have the AI draft promotional content. Review and edit the draft, then download the poster or publish it to your conservatory's public page.
- **Open Day Management (`/dashboard/admin/open-day`):** Configure open day registration pages for prospective students and families. Set session time slots, maximum capacity per slot, and the information collected from registrants.
- **Attendee Lists:** View registered attendees for any event or open day, export the list, and send bulk reminder notifications as the date approaches.

### 5.7 Playing School Programme (`/dashboard/admin/playing-school`)

- **Programme Overview:** View all children enrolled in the Playing School (early childhood music programme), their assigned groups, session times, and lead teacher.
- **Registration Management:** Review new Playing School registration applications submitted via the token-based wizard. Approve placements, assign the child to a group, and trigger the confirmation email.
- **Token Generation:** Generate personalised enrollment invitation links for prospective families. Each token is single-use and expires after 30 days.
- **Lead Nurturing:** The AI nurture-lead flow tracks prospective families who started the wizard but did not complete enrollment, and suggests follow-up actions.

### 5.8 Forms & Announcements (`/dashboard/admin/form-builder`, `/dashboard/announcements`)

- **Form Builder (`/dashboard/admin/form-builder`):** Create custom forms for any purpose — recital applications, instrument loan agreements, term-start questionnaires. The drag-and-drop builder supports text fields, dropdowns, file uploads, and multi-step layouts. Assign approval workflows to specify who reviews each form type.
- **Published Forms:** Manage all active form templates — enable, disable, set submission deadlines, and view aggregated submission statistics.
- **Announcements (`/dashboard/announcements`):** Compose and send conservatory-wide or targeted announcements (e.g., only to parents of students in a specific teacher's class). Announcements appear in the recipient's notification panel and optionally trigger an email or SMS.

### 5.9 Scholarships & Donations (`/dashboard/admin/scholarships`)

- **Scholarship Programmes:** Create and manage scholarship and financial aid programmes — set eligibility criteria, available award amounts, application open/close dates, and the review committee.
- **Application Review:** View all submitted scholarship applications in a structured review table. Add internal notes, change the status, and record the award decision and amount.
- **Donation Tracking:** Log donations received from supporters, link them to specific programmes or endowments, and generate acknowledgement letters.
- **Reporting:** Export a summary of awards made in a given period for financial reporting and donor reporting requirements.

### 5.10 Reports & Analytics (`/dashboard/reports`)

- **Academic Reports:** Exam pass rates by teacher, instrument, and grade level. Student retention and dropout trends. Practice hours aggregated by cohort.
- **Financial Reports:** Revenue by month, by package type, by branch. Collection rates and aging of outstanding invoices.
- **Operational Reports:** Lesson utilisation rates, room occupancy, teacher capacity, substitute usage.
- **Export:** All reports can be exported as CSV or PDF. Ministry-format exports (for government reporting) are handled separately — see Section 6.3.
- **Custom Date Ranges:** All reports support custom date range selection; default views show the current academic year.

### 5.11 Conservatorium Settings (`/dashboard/settings/conservatorium`)

- **General Settings:** Update your conservatory's name, logo, contact details, and public website description.
- **Lesson Packages & Pricing:** Define available lesson packages (e.g., "8 lessons per month — 30 min"), set per-lesson rates for each teacher tier, and configure automatic renewal rules.
- **Cancellation Policy:** Set the notice period required for a cancellation to generate a makeup credit, and the expiry window for unused makeup credits.
- **AI Features:** Enable or disable specific AI features — teacher matching, progress report drafting, practice coach, event poster generation, and targeted slot filling.
- **New Features Flag:** Toggle `newFeaturesEnabled` to switch between the new grouped navigation experience and the legacy flat navigation for your conservatory.
- **Branch Configuration:** Add branches and assign rooms from here (or use the dedicated branch management page).

---

## 6. For Site Administrators (`site_admin`)

Site administrators have platform-wide access across all conservatoriums registered on the Harmonia platform. This role is reserved for the Harmonia operations team and authorised platform partners.

### 6.1 Platform-Wide Access

- **Cross-Conservatorium View:** A site admin can view and manage any conservatorium on the platform without being explicitly enrolled in that conservatory.
- **Impersonation:** Site admins can view the platform as a specific user (read-only) to assist with support requests, accessed via the user management panel by selecting "View As."
- **Dev Bypass:** In development environments, the `site_admin` role is automatically injected via the proxy dev bypass (see architecture documentation). In production, site admin privileges require verified Firebase Custom Claims.

### 6.2 Managing Conservatoriums

- **Conservatorium List:** The admin panel shows all registered conservatoriums with their status (active, suspended, onboarding), contact details, and key metrics (student count, active teachers, last activity).
- **Create New Conservatorium:** Use the "Add Conservatorium" form to onboard a new music school. This creates the conservatory record, assigns it a unique `conservatoriumId`, and generates the first admin user invitation.
- **Suspend / Reactivate:** Suspend a conservatorium to block all access for its users while preserving data (e.g., during a billing dispute). Reactivate when resolved.
- **Feature Flags:** Toggle platform-level feature flags for individual conservatoriums — enable beta features for pilot schools before rolling them out broadly.

### 6.3 Ministry Reports (`/dashboard/ministry-export`)

- **Standardised Export:** Generate a structured export of student enrolment and attendance data in the format required by the Israeli Ministry of Culture and Sport for annual reporting.
- **Date Range Selection:** Choose the academic year or a custom date range for the export.
- **Validation Before Export:** The system runs a pre-export validation to flag any missing required fields (e.g., student ID numbers, instrument classifications) so they can be corrected before the report is submitted.
- **Download Formats:** Export as Excel (`.xlsx`) or CSV. The Ministry export format follows the Ministry's published schema.

---

## 7. For Ministry Directors (`ministry_director`)

Ministry directors have read-only visibility across all conservatoriums in their jurisdiction for the purpose of oversight, reporting, and policy monitoring.

### 7.1 Ministry Dashboard (`/dashboard/ministry`)

- **Aggregated Overview:** The ministry dashboard displays aggregated statistics across all conservatoriums — total enrolled students, active teachers, lesson hours delivered, exam entries, and scholarship awards for the current academic year.
- **Per-Conservatorium Breakdown:** Drill down from the aggregated view to see individual conservatorium statistics. Each conservatorium row shows key indicators with trend arrows (up/down from the previous period).
- **Geographic Distribution:** A regional map view shows conservatorium locations and student density to support resource allocation decisions.
- **Alerts & Flags:** Conservatoriums with unusual patterns — sharp drops in enrolment, high teacher turnover, or low exam pass rates — are flagged automatically for review.

### 7.2 Export and Reporting

- **Ministry Export (`/dashboard/ministry-export`):** Download a standardised data extract for any conservatorium or for all conservatoriums combined, covering enrolment, attendance, exams, and scholarships.
- **Scheduled Reports:** Configure automatic monthly or quarterly report emails delivered to designated ministry addresses.
- **Comparison Reports:** Compare conservatoriums across a set of performance indicators side by side to identify leaders and schools that may benefit from additional support.
- **Data as of Date:** All reports include a clear "data as of" timestamp. Ministry directors cannot modify any data — the role is strictly read-only.

---

## 8. Common Features (All Roles)

### 8.1 Language & RTL Support

- **Available Languages:** Hebrew (default), English, Arabic, and Russian.
- **Language Switching:** Open your profile menu (top right) and select "Language." The page reloads in the selected language.
- **RTL Layouts:** Hebrew and Arabic trigger a full right-to-left layout automatically — all navigation, forms, tables, and buttons mirror to the correct orientation. No action is required from the user.
- **Locale Routing:** The Hebrew (default) experience is served at the root URL (`/`). Other locales are served under a prefix: `/en/`, `/ar/`, `/ru/`.

### 8.2 Notifications (`/dashboard/notifications`)

- **Notification Centre:** The bell icon in the top navigation bar shows a badge count for unread notifications. Click it to open the notifications panel.
- **Notification Types:** Lesson reminders (sent 24 hours and 1 hour before a lesson), form status updates, payment receipts, teacher messages, approval decisions, and system announcements.
- **Notification Preferences:** In your account settings, choose which event types trigger in-app notifications, emails, or SMS/WhatsApp messages. (SMS and WhatsApp availability depends on your conservatory's communication configuration.)
- **Mark as Read:** Click "Mark All as Read" to clear the badge counter, or dismiss individual notifications by clicking the X on each item.

### 8.3 AI Assistant (`/help`)

- **Help Chat:** The AI assistant at `/help` answers questions about how to use Harmonia. Type your question in natural language — for example, "How do I cancel a lesson?" or "Where do I find my invoices?"
- **Context-Aware Answers:** The assistant is aware of your role and provides role-relevant guidance — a teacher asking "How do I add homework?" gets teacher-specific instructions; a parent asking the same question gets parent-relevant guidance.
- **Article Links:** Alongside its answers, the assistant links to the relevant section of the help centre documentation so you can read further if needed.
- **Escalation:** If the assistant cannot answer your question, it offers to submit a support ticket to the Harmonia support team on your behalf.

### 8.4 Accessibility

- **Keyboard Navigation:** All major actions are reachable via keyboard. Tab order follows a logical sequence on every page.
- **Screen Reader Support:** Harmonia uses semantic HTML and ARIA labels throughout. Forms, tables, and dialogs include descriptive labels for screen reader users.
- **High Contrast Mode:** If your operating system or browser has high contrast mode enabled, Harmonia's colour scheme adjusts to maintain readability.
- **Font Size:** Use your browser's standard zoom controls (Ctrl/Cmd + scroll or Ctrl/Cmd + / -) to increase or decrease text size. All layouts are fluid and reflow correctly at higher zoom levels.

---

## 9. Getting Help

- **In-App Help (`/help`):** The AI assistant is your first port of call for how-to questions. It is available 24/7 and covers all features and all roles.
- **Help Centre Articles:** The help centre (accessible from the `/help` page) contains structured articles grouped by topic and role. Articles are available in all four supported languages.
- **Conservatory Admin Support:** For issues specific to your conservatory's configuration — packages, policies, user accounts — contact your conservatory administrator directly via the Messages section (`/dashboard/messages`).
- **Technical Support:** If you encounter a bug or a technical error, use the "Report a Problem" link in the account menu. Include a description of what you were doing and, if possible, a screenshot. The support team aims to respond within one business day.
- **Emergency Contact:** For urgent operational issues (e.g., a teacher cannot access the system on the day of a lesson), contact your conservatory administrator directly by phone. Harmonia does not provide a real-time phone support line.
