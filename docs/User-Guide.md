# Harmonia - End-User Guide

**Version 1.0**

## 1. Introduction

Welcome to Harmonia! This guide is designed to help you, whether you are a student, parent, teacher, or administrator, get the most out of our platform. Harmonia is a comprehensive system designed to make every aspect of managing a music conservatory seamless and intuitive.

Please find the section below that corresponds to your role in the system.

---

## 2. For Students

As a student, Harmonia is your personal hub for managing your musical journey.

### 2.1 My Profile (Your Dashboard)

When you log in, you land on your **Profile Page**. This is your main dashboard, giving you an at-a-glance overview of everything important:
- **Your Teacher & Package:** See who you're learning with and what lesson package is active.
- **Weekly Goal:** Track your practice time against the weekly goal set by your teacher.
- **Upcoming Lessons:** Quickly see your next few scheduled lessons.
- **Recent Practice:** Review your latest practice logs.
- **Repertoire:** View the musical pieces you are currently working on.
- **Achievements:** Celebrate your progress with digital badges for milestones like completing a piece or maintaining a practice streak.

### 2.2 Schedule (`/dashboard/schedule`)

- **View Your Schedule:** See all your upcoming lessons for the week in a clear calendar view.
- **Book a New Lesson:** If you have credits available from a package or a makeup lesson, you can use the "Book a New Lesson" button to find an open slot with your teacher.
- **Cancel or Reschedule:** Click on any upcoming lesson to open a details dialog. From there, you can choose to cancel or reschedule it, subject to the conservatory's cancellation policy.

### 2.3 Practice Log (`/dashboard/practice`)

- **Log a Session:** After practicing, go here to log your session. You can record the date, duration, what pieces you worked on, and how the practice felt.
- **Leave Notes for Your Teacher:** Add specific notes about what was challenging or what you're proud of. Your teacher will see these notes before your next lesson.
- **Upload a Video:** Use the "Upload Video for Feedback" option to send a short recording to your teacher for comments between lessons.

### 2.4 Forms & Docs (`/dashboard/forms`)

- **Submit New Forms:** This is where you go to fill out and submit important forms, such as applications for recitals or exams.
- **Track Status:** The main table shows you the current status of every form you've submitted, from "Draft" to "Final Approved."
- **View Details:** Click on any form to see its full details and the history of its approval process.

### 2.5 Messages (`/dashboard/messages`)

- **Communicate Directly:** Use this secure messaging system to communicate directly with your teacher about anything related to your lessons.

---

## 3. For Parents

The Family Hub is your command center for managing the musical education of all your children enrolled in the conservatory.

### 3.1 The Family Hub (`/dashboard/family`)

- **Weekly Digest Cards:** Instead of a simple list, you get a "Weekly Digest" card for each child. This card provides a rich, at-a-glance summary of their week, including:
    - Their next lesson.
    - An overview of their current repertoire.
    - The latest note from their teacher.
    - A progress bar showing their practice time against their weekly goal.
- **One-Click Access:** From the digest card, you can jump to the child's full profile, their schedule, or send a message to their teacher.
- **Age-Upgrade Invitations:** When your child turns 13, a special prompt will appear here, allowing you to invite them to manage their own account.

### 3.2 Billing (`/dashboard/billing`)

- **Manage Payments:** View your current package, see your next billing date, and securely update your credit card on file using the "Manage Payment Method" button.
- **Invoice History:** Access and download PDF copies of all your past invoices for your records.
- **Subscription Management:** You can pause or cancel your subscription directly from this page.

### 3.3 Child's Profile (Accessible from Family Hub)

- By clicking "View Full Profile" on a digest card, you can access your child's complete dashboard, identical to what they see, including their achievements, practice logs, and schedule.

---

## 4. For Teachers

Harmonia empowers you to manage your teaching schedule and student progress with minimal administrative overhead.

### 4.1 Teacher Dashboard (`/dashboard/teacher`)

- **Today's Lessons:** Your dashboard opens with a list of all your lessons for the day. From here, you can mark attendance with a single click (Present, Absent, Notified Absence).
- **Quick Actions:** Use the buttons at the top to report sick leave (which automatically notifies students and admins) or jump to your availability grid.
- **Student Roster:** See all your assigned students at a glance, with quick links to their full profiles.
- **Pending Approvals:** Any forms submitted by your students that require your approval will appear here for you to review.

### 4.2 My Availability (`/dashboard/teacher/availability`)

- **Set Your Schedule:** This interactive weekly grid is where you define your recurring teaching hours. Click on time slots to mark them as available.
- **Save Changes:** Your availability is only updated for students after you click the "Save Changes" button.
- **External Calendar Sync (Future):** The UI includes a placeholder for syncing your Harmonia schedule with your external Google or Apple calendar.

### 4.3 Student Profile Management (`/dashboard/teacher/student/[id]`)

- **View Full Progress:** Access a student's complete profile to see their practice history, manage their assigned repertoire, and view their achievements.
- **Leave Lesson Notes:** After each lesson, you can leave a structured note summarizing the session, assigning homework, and setting goals for the next lesson.
- **Set Practice Goals:** Use the "Weekly Practice Goal" tool to set a target number of practice minutes for your student.
- **Generate AI Progress Reports:** At the end of a semester, you can use the AI assistant to draft a personalized progress report based on the student's data, which you can then edit and send to the parents.

### 4.4 Payroll (`/dashboard/teacher/payroll`)

- **View Earnings:** Access a clear, itemized history of your monthly pay stubs.
- **Detailed Breakdown:** Expand any pay stub to see a list of all the completed lessons that contributed to that month's payment.

---

## 5. For Administrators

The admin dashboard is your command center for overseeing the entire conservatory.

### 5.1 Admin Command Center (`/dashboard`)

- **Key Metrics:** The bar at the top gives you a real-time snapshot of active students, lessons this week, pending approvals, and critical AI alerts.
- **Quick Actions:** A set of large buttons for your most common tasks, such as approving new registrations, reviewing forms, and sending announcements.
- **Today's Snapshot:** A live feed of today's lessons and any payment issues that have occurred.
- **AI Alerts:** The AI agent proactively identifies operational issues (e.g., a teacher at full capacity, a disengaged student) and presents them here with a direct link to the relevant management page.

### 5.2 User Management (`/dashboard/users`)

- **Approve New Users:** In the "Pending Approval" tab, you can approve or reject new students and teachers who have registered.
- **Manage Existing Users:** View a searchable and filterable list of all users in your conservatory. You can edit their details, update their roles, and manage their status.

### 5.3 Financial Management (`/dashboard/billing` & `/dashboard/reports`)

- **Financial Dashboard:** Get a high-level overview of revenue, invoices, and collection rates.
- **Reports:** Dive deeper into financial, operational, and academic analytics to understand your conservatory's performance.
- **Teacher Payroll:** Use the dedicated panel at `/dashboard/admin/payroll` to review auto-generated payroll drafts, approve them for payment, and mark them as paid.

### 5.4 Scheduling & Operations

- **Master Schedule:** View the entire conservatory's schedule in one place, with powerful filters for branch, teacher, room, and instrument.
- **Substitute Management:** When a teacher reports sick, the `/dashboard/admin/substitute` page shows you which lessons need a substitute and provides AI-powered suggestions for available, qualified replacements.
- **Branch Management:** Define and manage multiple physical locations for your conservatory.
- **Instrument Rentals:** Track your inventory of rental instruments, assign them to students, and manage returns.

### 5.5 Settings & Customization (`/dashboard/settings`)

- This is your hub for configuring the platform. Here you can:
    - Set pricing for packages and lesson durations.
    - Define your conservatory's cancellation policy.
    - Enable or disable specific AI features.
    - Create your own custom forms using the **Form Builder**.
