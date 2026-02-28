# SDD-i18n-SITE-WIDE — Full Site Translation Audit & Fix Specification

**Document ID:** SDD-i18n-SITE-WIDE  
**Status:** Draft  
**Scope:** All public pages, dashboard pages, and shared components  
**Languages:** Hebrew (he) · English (en) · Arabic (ar) · Russian (ru)  
**Audit Date:** 2026-02-28

---

## 1. Executive Summary

A full automated + manual audit of the Harmonia codebase found **1,903 hardcoded Hebrew string occurrences** across **156 source files**. The root causes fall into six distinct categories, each requiring a different fix pattern. The existing message infrastructure (`next-intl`, four locale JSON files) is sound — all top-level namespace keys already exist in all four locales — so the work is exclusively replacing hardcoded strings with `t()` calls and adding the corresponding keys to the locale files.

### Screenshot Evidence of Issues

| Screenshot | Page | Visible Bug |
|---|---|---|
| Image 1 | `/available-now` | Filter bar labels (סינון תוצאות, כל הקונסרבטוריונים, כל הכלים, כל אורך שיעור) remain Hebrew regardless of language |
| Image 2 | `/donate` | Entire Donate page component is hardcoded Hebrew with no `useTranslations` call |
| Image 3 | `/open-day` | Date chip renders `חל מ- יום שבת, 14 מרץ 2026` because `date-fns` always uses `{ locale: he }` |
| Image 4 | `/about` | Page hero, filter bar, card details, and all dialog panels are hardcoded Hebrew |
| Image 5 | `/contact` | Entire contact form and sidebar tips are hardcoded Hebrew |

---

## 2. Root Cause Classification

### Category A — Public Pages: Zero `useTranslations` Usage
Pages under `src/app/[locale]/` that render directly in JSX with hardcoded Hebrew strings and no calls to `useTranslations`.

**Files:**
- `app/[locale]/about/page.tsx` (44 occurrences)
- `app/[locale]/contact/page.tsx` (30 occurrences)
- `app/[locale]/apply/matchmaker/page.tsx` (3 occurrences)
- `app/[locale]/apply-for-aid/page.tsx` (3 occurrences)

### Category B — Public Components: No `useTranslations` Call
Shared components used on public pages that have no translation wiring at all.

**Files:**
- `components/harmonia/available-slots-marketplace.tsx` (12 occurrences)
- `components/harmonia/donation-landing-page.tsx` (35 occurrences)
- `components/harmonia/open-day-landing.tsx` (8 occurrences)
- `components/harmonia/slot-promotion-card.tsx` (8 occurrences)
- `components/harmonia/playing-school-enrollment-wizard.tsx` (22 occurrences)

### Category C — Dashboard Pages: Partial or Zero Translation
Admin and user dashboard pages that either never call `useTranslations` or call it for some sections but miss others.

**Files (sorted by severity):**
- `app/[locale]/dashboard/users/page.tsx` (81 occurrences)
- `app/[locale]/dashboard/forms/[id]/page.tsx` (58 occurrences)
- `app/[locale]/dashboard/teacher/student/[id]/page.tsx` (44 occurrences)
- `app/[locale]/dashboard/approvals/page.tsx` (35 occurrences)
- `app/[locale]/dashboard/admin/scholarships/page.tsx` (32 occurrences)
- `app/[locale]/dashboard/ministry/page.tsx` (27 occurrences)
- `app/[locale]/dashboard/ministry-export/page.tsx` (21 occurrences)
- `app/[locale]/dashboard/ai/page.tsx` (18 occurrences)
- `app/[locale]/dashboard/progress/page.tsx` (14 occurrences)
- `app/[locale]/dashboard/settings/conservatorium/page.tsx` (10 occurrences)
- `app/[locale]/dashboard/notifications/page.tsx` (7 occurrences)
- `app/[locale]/dashboard/schedule/page.tsx` (6 occurrences)
- `app/[locale]/dashboard/forms/page.tsx` (3 occurrences)
- `app/[locale]/dashboard/events/page.tsx` (3 occurrences)
- `app/[locale]/dashboard/events/new/page.tsx` (3 occurrences)
- `app/[locale]/dashboard/teacher/profile/page.tsx` (2 occurrences)
- `app/[locale]/dashboard/teacher/availability/page.tsx` (2 occurrences)
- `app/[locale]/dashboard/teacher/reports/page.tsx` (4 occurrences)
- `app/[locale]/dashboard/teacher/payroll/page.tsx` (4 occurrences)
- `app/[locale]/dashboard/teacher/lessons/[id]/note/page.tsx` (3 occurrences)
- `app/[locale]/dashboard/teacher/exams/page.tsx` (3 occurrences)
- `app/[locale]/dashboard/settings/calendar/page.tsx` (4 occurrences)
- `app/[locale]/dashboard/settings/cancellation/page.tsx` (3 occurrences)
- `app/[locale]/dashboard/settings/notifications/page.tsx` — not yet audited
- `app/[locale]/dashboard/parent/billing/page.tsx` (3 occurrences)
- `app/[locale]/dashboard/parent/settings/page.tsx` (3 occurrences)
- `app/[locale]/dashboard/practice/page.tsx` (4 occurrences)
- `app/[locale]/dashboard/practice/upload/page.tsx` (2 occurrences)
- `app/[locale]/dashboard/library/page.tsx` (4 occurrences)
- `app/[locale]/dashboard/master-schedule/page.tsx` (4 occurrences)
- `app/[locale]/dashboard/school/page.tsx` — needs audit
- `app/[locale]/dashboard/alumni/page.tsx` — needs audit
- Admin sub-pages: `branches`, `form-builder`, `makeups`, `ministry`, `notifications/log`, `notifications`, `open-day`, `payroll`, `performances`, `rentals`, `substitute`, `waitlists` — all (3–4 occurrences each)

### Category D — Dashboard Components: Hardcoded Hebrew Labels
The largest category. Shared dashboard components (dialogs, cards, panels) that contain hardcoded Hebrew strings in JSX.

**Files (sorted by severity):**
- `components/dashboard/harmonia/exam-tracker-panel.tsx` (48)
- `components/dashboard/harmonia/instrument-rental-dashboard.tsx` (41)
- `components/dashboard/harmonia/ai-matchmaker-form.tsx` (39)
- `components/dashboard/harmonia/student-practice-panel.tsx` (37)
- `components/dashboard/harmonia/parent-payment-panel.tsx` (33)
- `components/dashboard/walkthrough-manager.tsx` (30)
- `components/dashboard/harmonia/lms-lesson-note-panel.tsx` (30)
- `components/dashboard/harmonia/lesson-detail-dialog.tsx` (28)
- `components/dashboard/harmonia/form-builder.tsx` (27)
- `components/dashboard/harmonia/notification-preferences.tsx` (26)
- `components/dashboard/harmonia/teacher-payroll-view.tsx` (24)
- `components/dashboard/harmonia/performance-booking-dashboard.tsx` (24)
- `components/dashboard/harmonia/practice-log-form.tsx` (23)
- `components/dashboard/harmonia/admin-calendar-panel.tsx` (23)
- `components/dashboard/harmonia/weekly-digest-card.tsx` (21)
- `components/dashboard/harmonia/teacher-reports-dashboard.tsx` (21)
- `components/dashboard/harmonia/performance-profile-editor.tsx` (19)
- `components/dashboard/harmonia/parent-notification-panel.tsx` (19)
- `components/dashboard/harmonia/room-management-dialog.tsx` (18)
- `components/dashboard/harmonia/event-details.tsx` (17)
- `components/dashboard/harmonia/admin-makeup-dashboard.tsx` (17)
- `components/dashboard/harmonia/academic-reports.tsx` (17)
- `components/dashboard/harmonia/school-coordinator-dashboard.tsx` (16)
- `components/dashboard/harmonia/availability-grid.tsx` (16)
- `components/dashboard/harmonia/school-partnership-dashboard.tsx` (15)
- `components/dashboard/harmonia/notification-audit-log.tsx` (15)
- `components/dashboard/harmonia/event-form.tsx` (15)
- `components/dashboard/harmonia/substitute-assignment-panel.tsx` (14)
- `components/dashboard/harmonia/sheet-music-viewer.tsx` (14)
- `components/dashboard/harmonia/cancellation-policy-settings.tsx` (14)
- `components/dashboard/harmonia/sick-leave-modal.tsx` (13)
- `components/dashboard/harmonia/practice-video-upload-form.tsx` (12)
- `components/dashboard/harmonia/practice-coach.tsx` (12)
- `components/dashboard/harmonia/assign-performer-dialog.tsx` (12)
- `components/dashboard/harmonia/teacher-profile-editor.tsx` (11)
- `components/dashboard/harmonia/announcement-composer.tsx` (22)
- `components/dashboard/harmonia/assign-musician-dialog.tsx` (4)
- `components/dashboard/harmonia/assign-repertoire-dialog.tsx` (9)
- `components/dashboard/harmonia/age-upgrade-modal.tsx` (8)
- `components/dashboard/harmonia/ai-alerts-card.tsx` (4)
- `components/dashboard/harmonia/admin-command-center.tsx` (9)
- `components/dashboard/harmonia/admin-finance-dashboard.tsx` (4)
- `components/dashboard/harmonia/admin-waitlist-dashboard.tsx` — needs audit
- `components/dashboard/harmonia/admin-makeup-dashboard.tsx` (17)
- `components/dashboard/harmonia/cancel-lesson-dialog.tsx` (6)
- `components/dashboard/harmonia/family-hub.tsx` (3)
- `components/dashboard/harmonia/teacher-dashboard.tsx` (3)
- `components/dashboard/harmonia/student-billing-dashboard.tsx` (3)
- `components/dashboard/harmonia/recent-announcements-card.tsx` (3)
- `components/dashboard/harmonia/master-schedule-calendar.tsx` (3)
- `components/dashboard/harmonia/send-quote-dialog.tsx` (10)
- `components/dashboard/harmonia/today-snapshot-card.tsx` (9)
- `components/dashboard/harmonia/sound-check-scheduler.tsx` (9)
- `components/dashboard/harmonia/promote-slot-dialog.tsx` (7)
- `components/dashboard/harmonia/pricing-settings.tsx` (7)
- `components/dashboard/harmonia/manage-payment-method-dialog.tsx` (7)
- `components/dashboard/harmonia/admin-payroll-panel.tsx` (6)
- `components/dashboard/harmonia/ministry-inbox-panel.tsx` (6)
- `components/dashboard/harmonia/admin-reports-dashboard.tsx` (3)
- `components/dashboard/harmonia/key-metrics-bar.tsx` (4)
- `components/payments/InstallmentSelector.tsx` (8)
- `components/forms/save-status-bar.tsx` (5)
- `components/forms/kenes-form.tsx` (5)
- `components/forms/recital-form.tsx` (2)

### Category E — Hardcoded `date-fns` Hebrew Locale
**38 files** import `{ he }` from `date-fns/locale` and pass `{ locale: he }` directly to `format()`, `formatDistanceToNow()`, etc. This causes dates to always render with Hebrew month names, Hebrew day names, and Hebrew number formatting regardless of the active UI locale. This is the bug visible in Screenshot 3 (Open Day date chip).

**All affected files** (complete list):
- `app/[locale]/dashboard/notifications/page.tsx`
- `app/[locale]/dashboard/makeups/page.tsx`
- `components/dashboard/harmonia/admin-calendar-panel.tsx`
- `components/dashboard/harmonia/admin-payroll-panel.tsx`
- `components/dashboard/harmonia/admin-waitlist-dashboard.tsx`
- `components/dashboard/harmonia/book-lesson-wizard.tsx`
- `components/dashboard/harmonia/event-details.tsx`
- `components/dashboard/harmonia/events-list.tsx`
- `components/dashboard/harmonia/exam-tracker-panel.tsx`
- `components/dashboard/harmonia/instrument-rental-dashboard.tsx`
- `components/dashboard/harmonia/lesson-detail-dialog.tsx`
- `components/dashboard/harmonia/master-schedule-calendar.tsx`
- `components/dashboard/harmonia/ministry-inbox-panel.tsx`
- `components/dashboard/harmonia/multimedia-feedback-card.tsx`
- `components/dashboard/harmonia/notification-audit-log.tsx`
- `components/dashboard/harmonia/open-day-admin-dashboard.tsx`
- `components/dashboard/harmonia/performance-booking-dashboard.tsx`
- `components/dashboard/harmonia/promote-slot-dialog.tsx`
- `components/dashboard/harmonia/recent-announcements-card.tsx`
- `components/dashboard/harmonia/reports/financial-reports.tsx`
- `components/dashboard/harmonia/reports/operational-reports.tsx`
- `components/dashboard/harmonia/reschedule-lesson-dialog.tsx`
- `components/dashboard/harmonia/rescheduling-chat-widget.tsx`
- `components/dashboard/harmonia/schedule-calendar.tsx`
- `components/dashboard/harmonia/sick-leave-modal.tsx`
- `components/dashboard/harmonia/sound-check-scheduler.tsx`
- `components/dashboard/harmonia/student-practice-panel.tsx`
- `components/dashboard/harmonia/student-profile-content.tsx`
- `components/dashboard/harmonia/substitute-assignment-panel.tsx`
- `components/dashboard/harmonia/teacher-dashboard.tsx`
- `components/dashboard/harmonia/teacher-payroll-view.tsx`
- `components/dashboard/harmonia/weekly-digest-card.tsx`
- `components/dashboard/sidebar-nav.tsx`
- `components/enrollment/enrollment-wizard.tsx`
- `components/harmonia/open-day-landing.tsx`
- `components/harmonia/public-event-page.tsx`
- `components/harmonia/slot-promotion-card.tsx`
- `components/harmonia/trial-booking-widget.tsx`

### Category F — Locale File Data Integrity Bugs
Four specific values in `src/messages/ar.json` contain stray Hebrew characters (likely copy-paste errors during initial translation):

| Key Path | Issue |
|---|---|
| `DonatePage.heroSubtitle` | Contains `מוהובًا` (Hebrew inside Arabic sentence) |
| `DonatePage.storiesSubtitle` | Contains `כל` (Hebrew word inside Arabic sentence) |
| `DonatePage.donateFormSubtitle` | Contains `התבرعات` (Hebrew-Arabic mix) |
| `Sidebar.viewAll` | Contains `כל` (Hebrew word inside Arabic) |
| `PlayingSchool.coordinatorPageTitle` | Contains `תעזף` (Hebrew word inside Arabic) |

---

## 3. New Message Namespaces Required

The following namespaces and keys do not yet exist in any locale file and must be added to all four (`he.json`, `en.json`, `ar.json`, `ru.json`).

### 3.1 `AboutPage` — New Namespace

Covers `src/app/[locale]/about/page.tsx` and its inline dialogs.

```json
{
  "AboutPage": {
    "heroTitle": "Find Your Conservatory",
    "heroBadge": "{count} conservatories",
    "heroSubtitle": "The Harmonia conservatory network — professional music education for all ages, across the country.",
    "searchPlaceholder": "Search by city, conservatory name...",
    "sortByCity": "Sort by city...",
    "locating": "Locating...",
    "sortedByLocation": "Sorted by location",
    "currentLocation": "Current Location",
    "filterAll": "All",
    "showing": "Showing {count} conservatories",
    "foundOf": "Found {found} of {total}",
    "sortedByDistance": "· Sorted by distance",
    "clearFilter": "Clear filter",
    "noResults": "No matching conservatories found",
    "noResultsHint": "Try changing the search terms or clearing the filter",
    "moreTeachers": "More teachers",
    "contactThisConservatory": "Contact this conservatory",
    "officialSite": "Official Site",
    "dialog": {
      "contactDetails": "Contact Details",
      "management": "Management",
      "about": "About",
      "departments": "Departments & Study Areas",
      "programs": "Study Programs",
      "branches": "Branches",
      "teachers": "Teaching Staff ({count})"
    },
    "distance": {
      "meters": "{m}m",
      "km": "{km}km"
    }
  }
}
```

### 3.2 `ContactPage` — New Namespace

Covers `src/app/[locale]/contact/page.tsx`.

```json
{
  "ContactPage": {
    "heroTitle": "Contact Us",
    "heroSubtitle": "Choose the nearest conservatory and we'll get back to you",
    "searchConservatory": "Search conservatory...",
    "searchConservatoryPlaceholder": "Search by city or conservatory name...",
    "noResults": "No results found",
    "formTitle": "Send Us a Message",
    "formSubtitle": "Please fill in the details and we'll get back to you",
    "conservatoryRequired": "Required Conservatory",
    "firstName": "First Name",
    "lastName": "Last Name",
    "phone": "Phone",
    "email": "Email",
    "messageBody": "Message Content",
    "messagePlaceholder": "How can we help? Instrument, age, experience...",
    "submitDisabled": "Choose a conservatory first",
    "submitButton": "Send Message",
    "successTitle": "Thank you for your inquiry!",
    "successDesc": "Your details have been received. The conservatory team will contact you shortly.",
    "sendAnother": "Send Another Message",
    "officialSite": "Official Site",
    "conservatoryDetails": "Selected Conservatory Details",
    "chooseConservatory": "Choose a Conservatory",
    "chooseConservatoryDesc": "After choosing, contact details and conservatory information will appear here",
    "conservatoryList": "Conservatory List",
    "tipsTitle": "Tips for Your Inquiry",
    "tip1": "Mention the instrument you're interested in and your current experience level",
    "tip2": "Share the age of the child being enrolled",
    "tip3": "Mention available days and times for lessons",
    "toastSent": "Inquiry sent successfully",
    "toastSentDesc": "We will be in touch as soon as possible."
  }
}
```

### 3.3 `AvailableNow` — Extend Existing Namespace

Currently has only `title` and `subtitle`. Add filter labels:

```json
{
  "AvailableNow": {
    "filterResults": "Filter Results",
    "allConservatories": "All Conservatories",
    "allInstruments": "All Instruments",
    "allDurations": "All Durations",
    "duration45": "45 minutes",
    "duration60": "60 minutes",
    "noSlotsTitle": "No available lessons right now",
    "noSlotsDesc": "Try changing the filter options or check back later.",
    "searching": "Looking for last-minute opportunities..."
  }
}
```

### 3.4 `SlotPromotionCard` — New Namespace

```json
{
  "SlotPromotionCard": {
    "badge": "Last-Minute Opportunity!",
    "discount": "{percent}% off",
    "bookNow": "Book Now",
    "shareTitle": "Music Lesson Available!",
    "shareText": "I found an available {instrument} lesson with {teacher} at a special price of ₪{price}!",
    "copiedTitle": "Link Copied!",
    "copiedDesc": "You can share it with friends.",
    "shareErrorTitle": "Sharing Error",
    "shareErrorDesc": "Could not share the link."
  }
}
```

### 3.5 `OpenDayLanding` — Extend Existing `OpenDay` Namespace

Add keys missing from the component:

```json
{
  "OpenDay": {
    "noEventsPlanned": "No open days are currently planned. Please check back soon!",
    "filterByBranch": "Filter by branch",
    "allBranchesAndConservatories": "All branches and conservatories",
    "noEventsForBranch": "No open days found for this branch.",
    "backToList": "Back to list",
    "registrationTitle": "Registration for Open Day: {name}",
    "selectDay": "Select Open Day",
    "missingDetails": "Missing Details",
    "selectTimePlease": "Please select a meeting time."
  }
}
```

### 3.6 `LessonManagement` — Extend Existing Namespace

Add lesson type and status label translations (currently hardcoded in `lesson-detail-dialog.tsx`):

```json
{
  "LessonManagement": {
    "types": {
      "RECURRING": "Recurring Lesson",
      "MAKEUP": "Makeup Lesson",
      "TRIAL": "Trial Lesson",
      "ADHOC": "One-Time Lesson",
      "GROUP": "Group Lesson"
    },
    "statuses": {
      "SCHEDULED": "Scheduled",
      "COMPLETED": "Completed",
      "CANCELLED_STUDENT_NOTICED": "Cancelled (With Notice)",
      "CANCELLED_STUDENT_NO_NOTICE": "Cancelled (No Notice)",
      "CANCELLED_TEACHER": "Cancelled by Teacher",
      "CANCELLED_CONSERVATORIUM": "Cancelled by Conservatory",
      "NO_SHOW_STUDENT": "Student No-Show",
      "NO_SHOW_TEACHER": "Teacher No-Show"
    },
    "lessonTitle": "{instrument} Lesson",
    "fullDetails": "Full Lesson Details",
    "student": "Student",
    "teacher": "Teacher",
    "date": "Date",
    "timeAndDuration": "Time & Duration",
    "notFound": "Not found"
  }
}
```

### 3.7 `Walkthrough` — New Namespace

All Driver.js popover tooltips in `walkthrough-manager.tsx`:

```json
{
  "Walkthrough": {
    "student": {
      "profile": { "title": "Your Personal Profile", "desc": "Here you'll find a summary of your activity, progress and achievements." },
      "schedule": { "title": "Schedule", "desc": "Here you can see your schedule and cancel or reschedule a lesson." },
      "practice": { "title": "Practice Log", "desc": "Update your teacher on your progress between lessons and track your practice." },
      "forms": { "title": "Forms & Documents", "desc": "Submit forms for recitals, exams and more, and track their approval status." },
      "messages": { "title": "Messages", "desc": "Send direct messages to your teacher from here." },
      "help": { "title": "Need Help?", "desc": "For any question - click the help button! Our AI assistant is available 24/7." }
    },
    "parent": {
      "family": { "title": "Family Hub", "desc": "This is your control centre - see all your children in one place." },
      "childCard": { "title": "Child Card", "desc": "This shows a weekly summary of your child's activity. Click 'Full Profile' for details." },
      "billing": { "title": "Billing & Payments", "desc": "Here you'll find invoices and can update payment methods." },
      "notifications": { "title": "Notification Preferences", "desc": "Choose how to receive updates - SMS, WhatsApp, or email." },
      "digest": { "title": "Weekly Summary", "desc": "Each week you'll receive an email summary of your children's lesson activity." },
      "help": { "title": "Need Help?", "desc": "Any questions? Click help at any time." }
    },
    "teacher": {
      "dashboard": { "title": "Control Centre", "desc": "Welcome! This is your command centre with everything you need for today." },
      "todayLessons": { "title": "Today's Lessons", "desc": "Here you can mark attendance for your students with a single click." },
      "availability": { "title": "Availability Management", "desc": "Set when you're available — students will see your availability and book lessons." },
      "students": { "title": "Student Roster", "desc": "View all your students and quickly access their full profiles." },
      "approvals": { "title": "Approvals Queue", "desc": "Forms submitted by students awaiting your approval will appear here." },
      "sickLeave": { "title": "Sick Leave Report", "desc": "If you're ill, click here — the system will cancel lessons and notify everyone automatically." },
      "help": { "title": "Need Help?", "desc": "This tour is available again from settings. For further questions, use the AI assistant." }
    },
    "admin": {
      "dashboard": { "title": "Control Centre", "desc": "Welcome! This is your conservatory management dashboard." }
    }
  }
}
```

### 3.8 `UserManagement` — New Namespace

Covers `app/[locale]/dashboard/users/page.tsx`:

```json
{
  "UserManagement": {
    "title": "User Management",
    "subtitle": "Manage users, permissions and join requests.",
    "allUsers": "All Users",
    "usersAt": "Users at {conservatory}",
    "pendingApproval": "Pending Approval",
    "approvedUsers": "Approved Users",
    "searchPlaceholder": "Search by name or email...",
    "filterByInstrument": "Filter by instrument",
    "filterByTeacher": "Filter by teacher",
    "filterByGrade": "Filter by grade",
    "allInstruments": "All instruments",
    "allTeachers": "All teachers",
    "allGrades": "All grades",
    "pendingTitle": "Pending Join Requests",
    "pendingDesc": "Approve or reject requests from new users to join your conservatory.",
    "noResults": "No users match the search.",
    "noPending": "No pending approval requests.",
    "colName": "Name",
    "colId": "ID",
    "colEmail": "Email",
    "colPhone": "Mobile",
    "colRole": "Role",
    "colInstrument": "Instrument",
    "colTeacher": "Teacher",
    "colSeniority": "Seniority (yrs)",
    "colConservatory": "Conservatory",
    "colActions": "Actions",
    "approveUser": "Approve",
    "rejectUser": "Reject",
    "editUser": "Edit",
    "approvedToast": "User approved",
    "approvedToastDesc": "{name}'s account has been approved.",
    "updatedToast": "User updated",
    "updatedToastDesc": "{name}'s details have been updated successfully.",
    "rejectedToast": "User rejected",
    "rejectedToastDesc": "{name}'s account has been rejected.",
    "noPermissionToast": "No Permission",
    "noPermissionDesc": "You do not have permission to edit this user.",
    "rejectDialogTitle": "Reject User: {name}",
    "rejectDialogDesc": "Are you sure you want to reject this join request? You may optionally provide a reason.",
    "rejectReasonPlaceholder": "Reason for rejection...",
    "cancel": "Cancel",
    "confirm": "Reject User",
    "editDialogTitle": "Edit User: {name}",
    "roleLabel": "Role",
    "selectRole": "Select role",
    "gradeLabel": "Grade",
    "selectGrade": "Select grade",
    "seniorityLabel": "Seniority at conservatory (years)",
    "teacherSeniorityTitle": "Seniority with teachers",
    "instrumentLabel": "Instrument",
    "teacherNameLabel": "Teacher name",
    "yearsLabel": "Years of seniority",
    "saveChanges": "Save Changes",
    "roles": {
      "student": "Student",
      "teacher": "Teacher",
      "parent": "Parent",
      "conservatorium_admin": "Conservatory Manager",
      "site_admin": "System Administrator",
      "ministry_director": "Ministry of Education Director"
    },
    "validation": {
      "nameMin": "Full name must be at least 2 characters.",
      "invalidEmail": "Invalid email address.",
      "invalidID": "Invalid ID number.",
      "invalidPhone": "Invalid mobile number.",
      "yearsPositive": "Years must be a positive number.",
      "seniorityPositive": "Seniority must be a positive number."
    }
  }
}
```

### 3.9 `InstrumentRental` — New Namespace

Covers `instrument-rental-dashboard.tsx`:

```json
{
  "InstrumentRental": {
    "conditions": {
      "EXCELLENT": "Excellent",
      "GOOD": "Good",
      "FAIR": "Fair",
      "NEEDS_REPAIR": "Needs Repair",
      "RETIRED": "Retired"
    },
    "loanDialogTitle": "Loan {type} - {brand}",
    "loanDialogDesc": "Fill in the loan details and have the parent/student sign for the instrument.",
    "studentLabel": "Borrowing Student",
    "studentPlaceholder": "Select student...",
    "returnDateLabel": "Estimated Return Date",
    "depositLabel": "Deposit Amount (₪)",
    "parentSignatureLabel": "Parent signature confirming agreement and deposit terms",
    "signatureReceived": "Signature captured successfully.",
    "cancel": "Cancel",
    "confirmLoan": "Confirm Loan"
  }
}
```

### 3.10 `NotificationPreferences` — New Namespace

Covers `notification-preferences.tsx`:

```json
{
  "NotificationPreferences": {
    "channelTitle": "Channel Preferences",
    "channelDesc": "Choose how you want to receive each type of notification.",
    "notificationType": "Notification Type",
    "additionalTitle": "Additional Settings",
    "quietHoursLabel": "Enable Quiet Hours",
    "quietHoursDesc": "Pause non-urgent notifications (SMS, WhatsApp) during hours you specify.",
    "startTime": "Start Time",
    "endTime": "End Time",
    "savedToast": "Preferences Updated",
    "savedToastDesc": "Your notification preferences have been saved.",
    "types": {
      "lessonReminders": "Lesson Reminders",
      "lessonCancellation": "Lesson Cancellations",
      "makeupCredits": "Makeup Lesson Credits",
      "paymentDue": "Payments & Billing",
      "formStatusChanges": "Form Status Changes",
      "teacherMessages": "Messages from Teacher",
      "systemAnnouncements": "System Announcements"
    },
    "channels": {
      "IN_APP": "In-App Notification",
      "EMAIL": "Email",
      "SMS": "SMS",
      "WHATSAPP": "WhatsApp"
    },
    "timeFormat": "HH:MM",
    "validationTimeFormat": "Invalid format"
  }
}
```

### 3.11 `AnnouncementComposer` — New Namespace

```json
{
  "AnnouncementComposer": {
    "noPermission": "You do not have permission to perform this action.",
    "cardTitle": "Create Announcement",
    "cardDesc": "Fill in the message details you want to send.",
    "titleLabel": "Title",
    "titlePlaceholder": "e.g. Reminder about Hanukkah holiday",
    "bodyLabel": "Message Content",
    "bodyPlaceholder": "Write the announcement content here... Basic Markdown syntax is supported.",
    "audienceLabel": "Target Audience",
    "audiencePlaceholder": "Select who to send to",
    "audienceAll": "All Users",
    "audienceStudents": "Students",
    "audienceParents": "Parents",
    "audienceTeachers": "Teachers",
    "channelsLabel": "Distribution Channels",
    "channelInApp": "In-App Notification",
    "channelEmail": "Email",
    "submit": "Send Announcement",
    "successToast": "Announcement sent successfully!",
    "successToastDesc": "The message \"{title}\" was sent to the selected audience.",
    "validation": {
      "titleMin": "Title must be at least 5 characters.",
      "bodyMin": "Message body must be at least 10 characters.",
      "channelRequired": "At least one distribution channel must be selected."
    }
  }
}
```

### 3.12 `AgeUpgradeModal` — New Namespace

```json
{
  "AgeUpgradeModal": {
    "title": "{name} is turning 13!",
    "desc": "You can now invite {name} to independently manage their Harmonia account.",
    "benefitsDesc": "They will be able to view the schedule, log practice, and communicate with their teacher. You will continue to manage billing and payments.",
    "manageLater": "I'll manage for them for now",
    "inviteNow": "Invite Now",
    "emailLabel": "{name}'s email address",
    "back": "Back",
    "submit": "Send Invitation",
    "successToast": "Invitation Sent!",
    "successToastDesc": "{name} will soon receive an invitation email to join the system."
  }
}
```

### 3.13 `AvailabilityGrid` — New Namespace

```json
{
  "AvailabilityGrid": {
    "title": "Weekly Availability Template",
    "desc": "Click time slots to mark them as available. These are the hours that will be shown to students for booking.",
    "copyFromLastWeek": "Copy from Last Week",
    "addException": "Add Exception",
    "student": "Student",
    "externalCalendarTitle": "External Calendar Sync",
    "externalCalendarDesc": "Connect your Google or Apple calendar to automatically block times when you're unavailable and show Harmonia lessons in your personal calendar.",
    "connectCalendar": "Connect Calendar",
    "saveChanges": "Save Changes",
    "savedToast": "Availability saved successfully"
  }
}
```

### 3.14 `CancellationPolicy` — New Namespace

```json
{
  "CancellationPolicy": {
    "studentRulesTitle": "Student Cancellation Rules",
    "noticeHoursLabel": "Required notice hours for cancellation with credit",
    "creditOnNotice": "Credit for on-time cancellation",
    "creditOnLate": "Credit for late cancellation",
    "creditFull": "Full Credit",
    "creditNone": "No Credit",
    "creditFullNotRecommended": "Full Credit (not recommended)",
    "makeupRulesTitle": "Makeup Lesson Rules",
    "makeupExpiryLabel": "Makeup credit expiry (days)",
    "maxMakeupsLabel": "Maximum makeups per term",
    "savedToast": "Cancellation policy updated successfully!"
  }
}
```

### 3.15 `ExamTracker` — New Namespace

```json
{
  "ExamTracker": {
    "statuses": {
      "NOT_STARTED": "Not Started",
      "IN_PROGRESS": "In Progress",
      "READY": "Ready for Exam"
    },
    "openedToast": "Exam tracker opened successfully",
    "categories": {
      "SCALES": "Scales",
      "PIECES": "Pieces",
      "SIGHT_READING": "Sight Reading",
      "THEORY": "Theory"
    }
  }
}
```

### 3.16 `DonatePage` — Extend Existing Namespace

The `donation-landing-page.tsx` component is completely hardcoded. It needs to consume the existing `DonatePage` translations namespace but currently calls no `useTranslations`. No new keys needed — the component must simply be wired to the existing namespace.

### 3.17 `AiAgents` — New Namespace

Covers `app/[locale]/dashboard/ai/page.tsx`:

```json
{
  "AiAgents": {
    "title": "AI Agents",
    "subtitle": "Manage the system's automations and intelligent agents.",
    "noPermission": "You do not have permission to view this page.",
    "loading": "Loading settings...",
    "updatedToast": "Setting updated",
    "updatedToastDesc": "Agent \"{title}\" has been {state}.",
    "enabled": "enabled",
    "disabled": "disabled",
    "agents": {
      "matchmaker": {
        "title": "Matchmaker Agent",
        "desc": "Automatically matches new students with the most suitable available teachers based on musical profile, goals and availability."
      },
      "compositions": {
        "title": "Composition Suggestion Agent",
        "desc": "Suggests relevant repertoire pieces based on the student's level, goals, and pieces already selected."
      },
      "reschedule": {
        "title": "Rescheduling Concierge",
        "desc": "Handles lesson cancellation and reschedule requests automatically via WhatsApp or chat."
      },
      "progressReports": {
        "title": "Progress Report Agent",
        "desc": "Generates a first draft of periodic progress reports for teachers, based on practice logs and lesson notes."
      },
      "adminAlerts": {
        "title": "Admin Alerts Agent",
        "desc": "Continuously monitors the system and surfaces operational issues before they become crises."
      },
      "leadNurture": {
        "title": "Lead Nurture Agent",
        "desc": "Automatically follows up with students who registered for a trial lesson but did not continue to a package."
      }
    }
  }
}
```

### 3.18 `ProgressPage` — New Namespace

```json
{
  "ProgressPage": {
    "title": "Progress Tracking",
    "subtitle": "View your practice progress, goals and achievements.",
    "weeklyGoal": "Weekly Practice Goal",
    "weeklyGoalValue": "{done} / {goal} minutes",
    "practiceStreak": "Practice Streak",
    "streakValue": "🔥 {days} days",
    "streakCongrats": "Keep up the great work!",
    "monthlyTime": "Practice Time (This Month)",
    "monthlyHours": "{hours} hours",
    "monthlyMinutes": "{minutes} minutes total",
    "logTitle": "Practice Log — Last 7 Days",
    "logDesc": "Chart showing your daily practice minutes.",
    "yAxisUnit": "min",
    "tooltipMinutes": "{value} minutes",
    "tooltipLabel": "Practice time"
  }
}
```

### 3.19 `AdminScholarships` — New Namespace

```json
{
  "AdminScholarships": {
    "title": "Scholarship Fund Management",
    "subtitle": "Track donation funds and approve financial assistance requests from students.",
    "exportReport": "Export Section 46 Donation Report",
    "addDonation": "Add Manual Donation",
    "totalFundYear": "Total Fund This Year",
    "totalFundChange": "+{percent}% from last year",
    "approvedScholarships": "Approved Scholarships",
    "approvedTo": "To {count} different students",
    "pendingRequests": "Requests Pending Approval",
    "pendingAmount": "Total demand: ₪{amount}",
    "requestsTitle": "Scholarship Requests",
    "requestsDesc": "Manage scholarship applications submitted by students. Click a request to view attached documents and application reasons.",
    "searchPlaceholder": "Search student name...",
    "colStudent": "Student",
    "colInstrument": "Instrument",
    "colSubmissionDate": "Submission Date",
    "colPriority": "Priority Score",
    "colStatus": "Status",
    "colActions": "Actions",
    "viewRequest": "View Request",
    "statuses": {
      "DRAFT": "Draft",
      "SUBMITTED": "Submitted",
      "DOCUMENTS_PENDING": "Awaiting Documents",
      "UNDER_REVIEW": "Under Review",
      "APPROVED": "Approved",
      "PARTIALLY_APPROVED": "Partially Approved",
      "WAITLISTED": "Waitlisted",
      "REJECTED": "Rejected",
      "EXPIRED": "Expired"
    }
  }
}
```

### 3.20 `AdminMinistry` — Extend Existing `Ministry` Namespace

```json
{
  "Ministry": {
    "portalTitle": "Ministry of Education Portal – Harmonia",
    "portalSubtitle": "Manage and approve requests, recitals, scholarships and grade exams submitted by conservatories.",
    "dashboardTitle": "Ministry of Education Dashboard",
    "dashboardSubtitle": "View and final-approve forms approved by conservatories.",
    "filterTitle": "Filter Forms",
    "filterByStatus": "Filter by status",
    "filterByFormType": "Filter by form type",
    "filterByConservatory": "Filter by conservatory",
    "filterByGrade": "Filter by grade",
    "filterByInstrument": "Filter by instrument",
    "allStatuses": "All statuses",
    "allFormTypes": "All form types",
    "allConservatories": "All conservatories",
    "allGrades": "All grades",
    "allInstruments": "All instruments",
    "listTitle": "Form List",
    "colStudent": "Student",
    "colConservatory": "Conservatory",
    "colFormType": "Form Type",
    "colGrade": "Grade",
    "colStatus": "Status",
    "colSubmittedAt": "Submission Date",
    "viewAndProcess": "View & Process",
    "noFormsFound": "No forms match the filter.",
    "noPermissionTitle": "No Permission",
    "noPermissionDesc": "This page is for Ministry of Education directors only."
  }
}
```

### 3.21 `MinistryExport` — New Namespace

```json
{
  "MinistryExport": {
    "title": "Export Forms to Ministry of Education",
    "subtitle": "Select the approved forms you want to export and submit to the Ministry of Education.",
    "noPermissionTitle": "No Permission",
    "noPermissionDesc": "This page is for conservatory managers only.",
    "cardsTitle": "Approved Forms Ready for Export",
    "exportSelected": "Export Selected ({count})",
    "colStudent": "Student",
    "colFormType": "Form Type",
    "colId": "ID",
    "colGradeLevel": "Grade/Level",
    "colStatus": "Status",
    "colApprovalDate": "Approval Date",
    "view": "View",
    "noFormsAvailable": "No approved forms available for export.",
    "noFormsSelectedTitle": "No Forms Selected",
    "noFormsSelectedDesc": "You must select at least one form to export.",
    "exportSuccessTitle": "Export Complete",
    "exportSuccessDesc": "{count} forms exported to CSV file."
  }
}
```

### 3.22 `AdminPages` — New Namespace (Shared Page Headers)

Many admin pages have identical boilerplate: a `<h1>` title, subtitle, and "no permission" message. All can share a single namespace:

```json
{
  "AdminPages": {
    "noPermission": "You do not have permission to view this page.",
    "noPermissionFull": "You do not have permission to access this page.",
    "branches": {
      "subtitle": "View, add and edit conservatory branches."
    },
    "formBuilder": {
      "title": "Dynamic Form Builder",
      "subtitle": "Create and edit custom form templates for your institution."
    },
    "makeups": {
      "subtitle": "View and manage makeup lesson balances for all students in the conservatory."
    },
    "notifications": {
      "title": "Notifications Log",
      "subtitle": "View all outgoing notifications sent to users."
    },
    "notificationsAdmin": {
      "title": "Notification Preferences",
      "subtitle": "Choose how and when to receive system updates."
    },
    "openDay": {
      "subtitle": "Track attendees and manage appointments for the Open Day event."
    },
    "payroll": {
      "title": "Payroll Preparation — Teachers",
      "adminTitle": "Teacher Payroll Management",
      "subtitle": "Review, approve and manage monthly teacher payroll reports."
    },
    "performances": {
      "subtitle": "Track bookings, manage assignments and handle payments for musician performances."
    },
    "rentals": {
      "subtitle": "Track instrument inventory, manage loans and returns."
    },
    "substitute": {
      "subtitle": "Manage substitute teacher assignments for lessons cancelled due to teacher absence."
    },
    "waitlists": {
      "title": "Waitlist Management",
      "subtitle": "View and manage students waiting for an available spot with teachers."
    },
    "masterSchedule": {
      "title": "Master Schedule",
      "subtitle": "Full overview of all conservatory lessons. Filter by teacher, room or instrument."
    },
    "announcements": {
      "title": "Send New Announcement",
      "subtitle": "Send a message to all users or a specific target audience."
    },
    "enroll": {
      "title": "Register New Student (Admin)",
      "subtitle": "Manually fill in student details to create an account in the system."
    },
    "events": {
      "title": "Events & Recitals Management",
      "subtitle": "Plan, manage and produce all conservatory events.",
      "createNew": "Create New Event"
    },
    "newEvent": {
      "title": "Create New Event",
      "subtitle": "Enter basic details to create a new event in the system.",
      "noPermission": "You do not have permission to access this page."
    },
    "family": {
      "title": "My Family",
      "subtitle": "Central dashboard for managing your children's conservatory activities."
    },
    "library": {
      "title": "Library",
      "subtitle": "Your knowledge and content centre.",
      "comingSoonTitle": "Library Under Construction",
      "comingSoonDesc": "In the future, you'll be able to find and manage sheet music, study materials, and more."
    },
    "reports": {
      "subtitle": "Analyse conservatory performance and gain business insights."
    },
    "schedule": {
      "title": "Weekly Schedule",
      "subtitle": "View and manage your lessons, bookings and availability.",
      "bookNew": "Book New Lesson",
      "emptyTitle": "No Lessons Scheduled",
      "emptyDesc": "Your schedule for the coming week is empty. You can book a new lesson.",
      "bookNow": "Book New Lesson"
    },
    "calendarSettings": {
      "title": "Calendar & Holiday Management",
      "subtitle": "Set national holidays and dates when the conservatory is closed to prevent lesson scheduling."
    },
    "applyForAid": {
      "title": "Scholarships & Financial Aid",
      "subtitle": "Apply for a study scholarship from the conservatory fund."
    },
    "practice": {
      "title": "Practice Log",
      "subtitle": "Record your practice sessions to track your progress.",
      "uploadVideo": "Upload Video for Feedback",
      "openAiCoach": "Open AI Coach"
    },
    "practiceUpload": {
      "title": "Upload Video for Feedback",
      "subtitle": "Get feedback from your teacher between lessons."
    },
    "practiceCoach": {
      "title": "AI Practice Coach",
      "subtitle": "Record yourself and get instant feedback on your playing."
    },
    "parentBilling": {
      "title": "Payments & Invoices",
      "subtitle": "Track tuition fees, open payments and pay securely via Cardcom."
    },
    "parentSettings": {
      "title": "Account Settings",
      "subtitle": "Manage notifications and contact preferences with the conservatory."
    },
    "notifications": {
      "title": "Notifications",
      "subtitle": "All your updates and messages in one place.",
      "markAllRead": "Mark all as read",
      "tabAll": "All",
      "tabUnread": "Unread",
      "noNew": "No new notifications",
      "allUpToDate": "All your notifications are up to date.",
      "noNotifications": "No notifications to display",
      "checkBackLater": "When there are new updates, they will appear here."
    },
    "conservatoriumSettings": {
      "title": "Conservatory Settings",
      "noPermission": "You do not have permission to access this page.",
      "notFound": "Conservatory not found.",
      "featuresUpdatedToast": "New features {state}",
      "featuresUpdatedDesc": "Changes will take effect after refreshing the page. Refreshing...",
      "featuresEnabled": "enabled",
      "featuresDisabled": "disabled"
    },
    "approvals": {
      "title": "Approvals",
      "subtitle": "Here you can view and approve forms submitted by students and teachers.",
      "tabPending": "Pending Your Action",
      "tabAll": "All Open Forms",
      "tabOverdue": "Overdue",
      "pendingTitle": "Forms Awaiting Your Action",
      "pendingDesc": "These forms require your approval, rejection or revision to proceed.",
      "allTitle": "All Open Forms in System",
      "allDesc": "General overview of all forms currently in the approval process.",
      "bulkActions": "Bulk Actions ({count})",
      "approveAll": "Approve All Selected",
      "exportPdf": "Export as PDF",
      "colStudent": "Student",
      "colType": "Type",
      "colConservatory": "Conservatory",
      "colStatus": "Status",
      "colActions": "Actions",
      "viewAction": "View",
      "fixAndResubmit": "Fix & Resubmit",
      "approve": "Approve",
      "reject": "Reject",
      "empty": "No forms to display."
    },
    "teacherStudentPage": {
      "back": "Back to Students",
      "instruments": "{instruments} · Grade {grade}",
      "streakTitle": "Practice Streak",
      "streakValue": "🔥 {days} days",
      "streakDesc": "Consecutive days of logged practice",
      "monthlyTime": "Practice Time (Month)",
      "monthlyHours": "{hours} hours",
      "monthlyMinutesTotal": "{minutes} minutes total",
      "repertoire": "Repertoire",
      "piecesLearned": "{count} pieces",
      "piecesDesc": "Total since start of year"
    }
  }
}
```

---

## 4. `date-fns` Locale Fix — Shared Utility

**Problem:** 38 files hardcode `{ locale: he }` in `format()` / `formatDistanceToNow()` calls.

**Solution:** Create a shared hook `src/hooks/use-date-locale.ts` that returns the correct `date-fns` locale object based on the active `next-intl` locale. Then replace all hardcoded `{ locale: he }` usages.

### 4.1 New File: `src/hooks/use-date-locale.ts`

```typescript
import { useLocale } from 'next-intl';
import { he, enUS, ar as arLocale, ru } from 'date-fns/locale';
import type { Locale } from 'date-fns';

const LOCALE_MAP: Record<string, Locale> = {
  he: he,
  en: enUS,
  ar: arLocale,
  ru: ru,
};

export function useDateLocale(): Locale {
  const locale = useLocale();
  return LOCALE_MAP[locale] ?? he;
}
```

### 4.2 Usage Pattern (Replace in All 38 Files)

```diff
- import { he } from 'date-fns/locale';
+ import { useDateLocale } from '@/hooks/use-date-locale';

  export function MyComponent() {
+   const dateLocale = useDateLocale();
    
-   format(date, 'EEEE, dd MMMM yyyy', { locale: he })
+   format(date, 'EEEE, dd MMMM yyyy', { locale: dateLocale })
    
-   formatDistanceToNow(date, { addSuffix: true, locale: he })
+   formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })
  }
```

**Note:** For Server Components (not marked `'use client'`), the hook won't work. In those cases, read the locale from params and use a pure utility function:

```typescript
// src/lib/utils/get-date-locale.ts
import { he, enUS, ar as arLocale, ru } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export function getDateLocale(locale: string): Locale {
  const map: Record<string, Locale> = { he, en: enUS, ar: arLocale, ru };
  return map[locale] ?? he;
}
```

---

## 5. Locale File Fixes (Category F Bugs)

The following values in `src/messages/ar.json` must be corrected to remove stray Hebrew characters:

```json
{
  "DonatePage": {
    "heroSubtitle": "كل تبرع، كبيرًا كان أم صغيرًا، يمكّن طفلًا موهوبًا يواجه صعوبات مالية من مواصلة مسيرته الموسيقية. معًا، يمكننا منحه مستقبلًا.",
    "storiesSubtitle": "وراء كل رقم قصة. تعرّف على بعض الطلاب الذين يمكن لتبرعك أن يغيّر حياتهم.",
    "donateFormSubtitle": "جميع التبرعات معفاة من الضرائب بموجب المادة 46. 100٪ من تبرعك يذهب مباشرةً إلى منح الطلاب."
  },
  "Sidebar": {
    "viewAll": "عرض جميع الإشعارات"
  },
  "PlayingSchool": {
    "coordinatorPageTitle": "مدرستي — مدرسة تعزف"
  }
}
```

---

## 6. Implementation Patterns

### 6.1 Wiring a Page Component (Category A)

```tsx
// Before (hardcoded)
export default function ContactPage() {
  return <h1>צור קשר</h1>;
}

// After (translated)
import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('ContactPage');
  return <h1>{t('heroTitle')}</h1>;
}
```

### 6.2 Wiring a Client Component (Category B/D)

```tsx
// Before
'use client';
export function DonationLanding() {
  return <h1>כי מוזיקה היא לא רק לאלה שיכולים להרשות לעצמם</h1>;
}

// After
'use client';
import { useTranslations } from 'next-intl';
export function DonationLanding() {
  const t = useTranslations('DonatePage');
  return <h1>{t('heroTitle')}</h1>;
}
```

### 6.3 Translating Hardcoded Enum Label Maps (Category D)

Many components define inline objects like:
```typescript
const LESSON_TYPES = {
  RECURRING: { label: 'שיעור קבוע', ... },
  MAKEUP:    { label: 'שיעור השלמה', ... },
};
```

Replace with a translated version inside the component:

```typescript
const t = useTranslations('LessonManagement');
const LESSON_TYPES = {
  RECURRING: { label: t('types.RECURRING'), ... },
  MAKEUP:    { label: t('types.MAKEUP'), ... },
};
```

### 6.4 Translating Toast Messages

```typescript
// Before
toast({ title: 'הזמינות נשמרה בהצלחה' });

// After
const t = useTranslations('AvailabilityGrid');
toast({ title: t('savedToast') });
```

### 6.5 Translating Zod Validation Messages

```typescript
// Before
const schema = z.object({
  name: z.string().min(2, 'שם מלא חייב להכיל לפחות 2 תווים.'),
});

// After — pass translated messages at component runtime
const t = useTranslations('UserManagement');
const schema = z.object({
  name: z.string().min(2, t('validation.nameMin')),
});
```

---

## 7. Complete File Change Manifest

The following table lists every file that requires changes, grouped by change type.

### 7.1 New/Extended Message Keys (All 4 Locale Files)

All four files (`he.json`, `en.json`, `ar.json`, `ru.json`) must be updated with the namespaces defined in §3:

| Namespace | Action |
|---|---|
| `AboutPage` | New — add to all 4 locales |
| `ContactPage` | New — add to all 4 locales |
| `AvailableNow` | Extend — add 9 new keys to all 4 locales |
| `SlotPromotionCard` | New — add to all 4 locales |
| `OpenDay` | Extend — add 9 new keys to all 4 locales |
| `LessonManagement` | Extend — add `types`, `statuses`, and detail labels |
| `Walkthrough` | New — add to all 4 locales |
| `UserManagement` | New — add to all 4 locales |
| `InstrumentRental` | New — add to all 4 locales |
| `NotificationPreferences` | New — add to all 4 locales |
| `AnnouncementComposer` | New — add to all 4 locales |
| `AgeUpgradeModal` | New — add to all 4 locales |
| `AvailabilityGrid` | New — add to all 4 locales |
| `CancellationPolicy` | New — add to all 4 locales |
| `ExamTracker` | New — add to all 4 locales |
| `AiAgents` | New — add to all 4 locales |
| `ProgressPage` | New — add to all 4 locales |
| `AdminScholarships` | New — add to all 4 locales |
| `Ministry` | Extend — add ministry page header keys |
| `MinistryExport` | New — add to all 4 locales |
| `AdminPages` | New — consolidates all admin page boilerplate |

Additionally, `ar.json` requires the 5 corrupted value fixes from §5.

### 7.2 New Utility Files

| File | Purpose |
|---|---|
| `src/hooks/use-date-locale.ts` | Returns `date-fns` locale object matching active `next-intl` locale |
| `src/lib/utils/get-date-locale.ts` | Pure function variant for server-side use |

### 7.3 Source Files to Edit

#### Public Pages (Category A)

| File | Action |
|---|---|
| `app/[locale]/about/page.tsx` | Add `useTranslations('AboutPage')`, replace all 44 hardcoded strings, call `useLocale()` for location distance formatting |
| `app/[locale]/contact/page.tsx` | Add `useTranslations('ContactPage')`, replace all 30 hardcoded strings |
| `app/[locale]/apply/matchmaker/page.tsx` | Add `useTranslations('EnrollmentWizard')`, replace 3 strings |
| `app/[locale]/apply-for-aid/page.tsx` | Add `useTranslations('AdminPages')`, replace 3 strings using `AdminPages.applyForAid` |

#### Public Components (Category B)

| File | Action |
|---|---|
| `components/harmonia/available-slots-marketplace.tsx` | Add `useTranslations('AvailableNow')`, replace 12 strings |
| `components/harmonia/donation-landing-page.tsx` | Add `useTranslations('DonatePage')`, replace 35 strings (keys already exist in all locales) |
| `components/harmonia/open-day-landing.tsx` | Add `useTranslations('OpenDay')`, replace 8 strings; swap `import { he }` for `useDateLocale()` |
| `components/harmonia/slot-promotion-card.tsx` | Add `useTranslations('SlotPromotionCard')`, replace 8 strings; swap `import { he }` for `useDateLocale()` |
| `components/harmonia/playing-school-enrollment-wizard.tsx` | Add `useTranslations('PlayingSchool')`, replace 22 strings |

#### Dashboard Pages (Category C) — All Require `useTranslations` + String Replacement

| File | Primary Namespace | Occurrences |
|---|---|---|
| `app/[locale]/dashboard/users/page.tsx` | `UserManagement` | 81 |
| `app/[locale]/dashboard/forms/[id]/page.tsx` | `Forms` (extend) | 58 |
| `app/[locale]/dashboard/teacher/student/[id]/page.tsx` | `AdminPages.teacherStudentPage` | 44 |
| `app/[locale]/dashboard/approvals/page.tsx` | `AdminPages.approvals` | 35 |
| `app/[locale]/dashboard/admin/scholarships/page.tsx` | `AdminScholarships` | 32 |
| `app/[locale]/dashboard/ministry/page.tsx` | `Ministry` (extend) | 27 |
| `app/[locale]/dashboard/ministry-export/page.tsx` | `MinistryExport` | 21 |
| `app/[locale]/dashboard/ai/page.tsx` | `AiAgents` | 18 |
| `app/[locale]/dashboard/progress/page.tsx` | `ProgressPage` | 14 |
| `app/[locale]/dashboard/settings/conservatorium/page.tsx` | `AdminPages.conservatoriumSettings` | 10 |
| `app/[locale]/dashboard/notifications/page.tsx` | `AdminPages.notifications` + fix `locale: he` | 7 |
| `app/[locale]/dashboard/schedule/page.tsx` | `AdminPages.schedule` | 6 |
| `app/[locale]/dashboard/forms/page.tsx` | `FormsPage` (extend) | 3 |
| `app/[locale]/dashboard/events/page.tsx` | `AdminPages.events` | 3 |
| `app/[locale]/dashboard/events/new/page.tsx` | `AdminPages.newEvent` | 3 |
| `app/[locale]/dashboard/practice/page.tsx` | `AdminPages.practice` | 4 |
| `app/[locale]/dashboard/practice/upload/page.tsx` | `AdminPages.practiceUpload` | 2 |
| `app/[locale]/dashboard/practice/coach/page.tsx` | `AdminPages.practiceCoach` | 2 |
| `app/[locale]/dashboard/library/page.tsx` | `AdminPages.library` | 4 |
| `app/[locale]/dashboard/master-schedule/page.tsx` | `AdminPages.masterSchedule` | 4 |
| `app/[locale]/dashboard/family/page.tsx` | `AdminPages.family` | 2 |
| `app/[locale]/dashboard/enroll/page.tsx` | `AdminPages.enroll` | 2 |
| `app/[locale]/dashboard/announcements/page.tsx` | `AdminPages.announcements` | 2 |
| `app/[locale]/dashboard/parent/billing/page.tsx` | `AdminPages.parentBilling` | 3 |
| `app/[locale]/dashboard/parent/settings/page.tsx` | `AdminPages.parentSettings` | 3 |
| `app/[locale]/dashboard/teacher/profile/page.tsx` | `Dashboard` (extend) | 2 |
| `app/[locale]/dashboard/teacher/availability/page.tsx` | `AvailabilityGrid` | 2 |
| `app/[locale]/dashboard/teacher/reports/page.tsx` | `Reports` (extend) | 4 |
| `app/[locale]/dashboard/teacher/payroll/page.tsx` | `Payroll` (extend) | 4 |
| `app/[locale]/dashboard/teacher/lessons/[id]/note/page.tsx` | `LessonManagement` (extend) | 3 |
| `app/[locale]/dashboard/teacher/exams/page.tsx` | `ExamTracker` | 3 |
| `app/[locale]/dashboard/settings/calendar/page.tsx` | `AdminPages.calendarSettings` | 4 |
| `app/[locale]/dashboard/settings/cancellation/page.tsx` | `CancellationPolicy` | 3 |
| `app/[locale]/dashboard/apply-for-aid/page.tsx` | `AdminPages.applyForAid` | 3 |
| All admin sub-pages (12 files) | `AdminPages.*` | 2–4 each |

#### Dashboard Components (Category D) — Add `useTranslations` + String Replacement

| File | Primary Namespace |
|---|---|
| `components/dashboard/harmonia/exam-tracker-panel.tsx` | `ExamTracker` + `LessonManagement` |
| `components/dashboard/harmonia/instrument-rental-dashboard.tsx` | `InstrumentRental` |
| `components/dashboard/harmonia/ai-matchmaker-form.tsx` | New `AiMatchmaker` namespace |
| `components/dashboard/harmonia/student-practice-panel.tsx` | `StudentDashboard` (extend) |
| `components/dashboard/harmonia/parent-payment-panel.tsx` | `StudentBilling` + `Invoices` (extend) |
| `components/dashboard/walkthrough-manager.tsx` | `Walkthrough` |
| `components/dashboard/harmonia/lms-lesson-note-panel.tsx` | New `LmsLessonNote` namespace |
| `components/dashboard/harmonia/lesson-detail-dialog.tsx` | `LessonManagement` (extend) |
| `components/dashboard/harmonia/form-builder.tsx` | New `FormBuilder` namespace |
| `components/dashboard/harmonia/notification-preferences.tsx` | `NotificationPreferences` |
| `components/dashboard/harmonia/teacher-payroll-view.tsx` | `Payroll` (extend) |
| `components/dashboard/harmonia/performance-booking-dashboard.tsx` | New `PerformanceBooking` namespace |
| `components/dashboard/harmonia/practice-log-form.tsx` | `StudentDashboard` (extend) |
| `components/dashboard/harmonia/admin-calendar-panel.tsx` | New `AdminCalendar` namespace |
| `components/dashboard/harmonia/weekly-digest-card.tsx` | `Dashboard` (extend) |
| `components/dashboard/harmonia/teacher-reports-dashboard.tsx` | `Reports` (extend) |
| `components/dashboard/harmonia/performance-profile-editor.tsx` | New `PerformanceProfile` namespace |
| `components/dashboard/harmonia/parent-notification-panel.tsx` | `NotificationPreferences` |
| `components/dashboard/harmonia/room-management-dialog.tsx` | New `RoomManagement` namespace |
| `components/dashboard/harmonia/event-details.tsx` | `PublicEventPage` (extend) |
| `components/dashboard/harmonia/admin-makeup-dashboard.tsx` | `Dashboard.makeups` (extend) |
| `components/dashboard/harmonia/academic-reports.tsx` | `Reports` (extend) |
| `components/dashboard/harmonia/school-coordinator-dashboard.tsx` | `PlayingSchool` (extend) |
| `components/dashboard/harmonia/availability-grid.tsx` | `AvailabilityGrid` |
| `components/dashboard/harmonia/school-partnership-dashboard.tsx` | `PlayingSchool` (extend) |
| `components/dashboard/harmonia/notification-audit-log.tsx` | New `NotificationAuditLog` namespace |
| `components/dashboard/harmonia/event-form.tsx` | `PublicEventPage` (extend) |
| `components/dashboard/harmonia/substitute-assignment-panel.tsx` | New `SubstitutePanel` namespace |
| `components/dashboard/harmonia/sheet-music-viewer.tsx` | New `SheetMusicViewer` namespace |
| `components/dashboard/harmonia/cancellation-policy-settings.tsx` | `CancellationPolicy` |
| `components/dashboard/harmonia/sick-leave-modal.tsx` | New `SickLeave` namespace |
| `components/dashboard/harmonia/announcement-composer.tsx` | `AnnouncementComposer` |
| `components/dashboard/harmonia/assign-musician-dialog.tsx` | `MusiciansForHire` (extend) |
| `components/dashboard/harmonia/assign-performer-dialog.tsx` | `PublicEventPage` (extend) |
| `components/dashboard/harmonia/assign-repertoire-dialog.tsx` | New `Repertoire` namespace |
| `components/dashboard/harmonia/age-upgrade-modal.tsx` | `AgeUpgradeModal` |
| `components/dashboard/harmonia/ai-alerts-card.tsx` | `AiAgents` (extend) |
| `components/dashboard/harmonia/admin-command-center.tsx` | `Dashboard` (extend) |
| `components/dashboard/harmonia/admin-calendar-panel.tsx` | `AdminCalendar` namespace |
| `components/dashboard/harmonia/admin-makeup-dashboard.tsx` | `Dashboard.makeups` (extend) |
| `components/dashboard/harmonia/cancel-lesson-dialog.tsx` | `LessonManagement` (extend) |
| `components/dashboard/harmonia/family-hub.tsx` | `Dashboard` (extend) |
| `components/dashboard/harmonia/manage-payment-method-dialog.tsx` | `PaymentSettings` (extend) |
| `components/dashboard/harmonia/send-quote-dialog.tsx` | `MusiciansForHire` (extend) |
| `components/dashboard/harmonia/today-snapshot-card.tsx` | `Dashboard` (extend) |
| `components/dashboard/harmonia/sound-check-scheduler.tsx` | New `SoundCheck` namespace |
| `components/dashboard/harmonia/promote-slot-dialog.tsx` | `AvailableNow` (extend) |
| `components/dashboard/harmonia/pricing-settings.tsx` | `PricingSettings` (extend) |
| `components/dashboard/harmonia/admin-payroll-panel.tsx` | `Payroll` (extend) |
| `components/dashboard/harmonia/ministry-inbox-panel.tsx` | `Ministry` (extend) |
| `components/dashboard/harmonia/admin-reports-dashboard.tsx` | `Reports` (extend) |
| `components/dashboard/harmonia/key-metrics-bar.tsx` | `FinancialDashboard` (extend) |
| `components/payments/InstallmentSelector.tsx` | New `Payments` namespace |
| `components/forms/save-status-bar.tsx` | `Common` (extend) |
| `components/forms/kenes-form.tsx` | `Forms` (extend) |
| `components/forms/recital-form.tsx` | `Forms` (extend) |

#### Date Locale Fixes (Category E) — All 38 Files

All files listed in §2 Category E require:
1. Replace `import { he } from 'date-fns/locale'` with `import { useDateLocale } from '@/hooks/use-date-locale'`
2. Add `const dateLocale = useDateLocale()` inside the component body
3. Replace all instances of `{ locale: he }` with `{ locale: dateLocale }`

---

## 8. Acceptance Criteria

| AC | Test | Method |
|---|---|---|
| AC-01 | Switching to English on `/available-now` shows "Filter Results", "All Conservatories", "All Instruments" in English | Manual QA |
| AC-02 | Switching to Arabic on `/donate` shows the full page in Arabic with no Hebrew characters | Manual QA |
| AC-03 | Switching to Russian on `/open-day` shows the date chip in Russian ("суббота, 14 марта 2026") | Manual QA |
| AC-04 | Switching to English on `/about` shows English for all labels: hero, search, dialog panels | Manual QA |
| AC-05 | Switching to any language on `/contact` shows form labels, tips and toast in that language | Manual QA |
| AC-06 | Dashboard sidebar, filters, and table headers all appear in the active locale | Manual QA (all 4 locales) |
| AC-07 | All dates in schedule, lessons, events, and notifications respect the active locale | Manual QA |
| AC-08 | `ar.json` contains no Hebrew characters in any value | Automated: `tests/i18n-locale-integrity.test.ts` |
| AC-09 | `ru.json` contains no Hebrew characters in any value | Automated: same test |
| AC-10 | All EN keys exist in HE, AR, and RU (no missing keys) | Automated: `tests/i18n-completeness.test.ts` |
| AC-11 | No component renders Hebrew text to English/Arabic/Russian users | Automated: ESLint rule flagging bare Hebrew JSX text in non-`he.json` contexts |

---

## 9. Recommended CI Safeguards

### 9.1 `tests/i18n-locale-integrity.test.ts`

```typescript
import he_json from '@/messages/he.json';
import en_json from '@/messages/en.json';
import ar_json from '@/messages/ar.json';
import ru_json from '@/messages/ru.json';

const HEBREW_PATTERN = /[א-ת]/;

function findHebrewValues(obj: object, path = ''): string[] {
  const violations: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = path ? `${path}.${k}` : k;
    if (typeof v === 'string' && HEBREW_PATTERN.test(v)) {
      violations.push(`${full}: "${v.substring(0, 60)}"`);
    } else if (typeof v === 'object' && v !== null) {
      violations.push(...findHebrewValues(v, full));
    }
  }
  return violations;
}

test('AR locale has no Hebrew characters in values', () => {
  const violations = findHebrewValues(ar_json);
  expect(violations).toEqual([]);
});

test('RU locale has no Hebrew characters in values', () => {
  const violations = findHebrewValues(ru_json);
  expect(violations).toEqual([]);
});

test('EN locale has no Hebrew characters in values', () => {
  const violations = findHebrewValues(en_json);
  expect(violations).toEqual([]);
});
```

### 9.2 `tests/i18n-completeness.test.ts`

```typescript
function getAllKeys(obj: object, prefix = ''): Set<string> {
  const keys = new Set<string>();
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    keys.add(full);
    if (typeof v === 'object' && v !== null) {
      getAllKeys(v, full).forEach(k => keys.add(k));
    }
  }
  return keys;
}

test('All EN keys exist in HE', () => {
  const missing = [...getAllKeys(en_json)].filter(k => !getAllKeys(he_json).has(k));
  expect(missing).toEqual([]);
});

test('All EN keys exist in AR', () => {
  const missing = [...getAllKeys(en_json)].filter(k => !getAllKeys(ar_json).has(k));
  expect(missing).toEqual([]);
});

test('All EN keys exist in RU', () => {
  const missing = [...getAllKeys(en_json)].filter(k => !getAllKeys(ru_json).has(k));
  expect(missing).toEqual([]);
});
```

---

## 10. Priority & Phasing

### Phase 1 — Critical: Public-Facing Pages (1–3 days)

These are the pages seen by prospective students and families. Hebrew-only content directly damages the site's value proposition for non-Hebrew audiences.

1. Fix `ar.json` Category F corruption bugs (30 min)
2. Create `use-date-locale.ts` hook (1 hr)
3. Wire `donation-landing-page.tsx` to existing `DonatePage` namespace (2 hr)
4. Wire `about/page.tsx` — add `AboutPage` namespace + `useLocale()` fix (4 hr)
5. Wire `contact/page.tsx` — add `ContactPage` namespace (3 hr)
6. Wire `available-slots-marketplace.tsx` — extend `AvailableNow` namespace (2 hr)
7. Fix date locale in `open-day-landing.tsx` and `public-event-page.tsx` (1 hr)

### Phase 2 — High: Dashboard Core Experience (3–5 days)

8. Fix date locale in all 38 files (systematic find-replace, ~4 hr)
9. Wire `users/page.tsx` — add `UserManagement` namespace (4 hr)
10. Wire `walkthrough-manager.tsx` — add `Walkthrough` namespace (2 hr)
11. Wire `lesson-detail-dialog.tsx` — extend `LessonManagement` (2 hr)
12. Wire `notification-preferences.tsx` — add `NotificationPreferences` (2 hr)
13. Wire `announcement-composer.tsx` — add `AnnouncementComposer` (1 hr)
14. Wire `availability-grid.tsx` — add `AvailabilityGrid` (1 hr)
15. Wire `cancellation-policy-settings.tsx` — add `CancellationPolicy` (1 hr)

### Phase 3 — Medium: Admin & Reporting Pages (3–5 days)

16. Wire all 12 admin sub-pages using `AdminPages` namespace (4 hr)
17. Wire `approvals/page.tsx` (2 hr)
18. Wire `ministry/page.tsx` + `ministry-export/page.tsx` (2 hr)
19. Wire `admin/scholarships/page.tsx` (2 hr)
20. Wire `ai/page.tsx` (1 hr)
21. Wire `progress/page.tsx` (1 hr)

### Phase 4 — Standard: Remaining Components (5+ days)

22–60. Wire all remaining dashboard components listed in §7.3, creating new namespaces as needed per §3.

---

## 11. Notes and Constraints

**Hebrew as the source language:** For all new namespace keys, Hebrew (`he.json`) is the authoritative source. English, Arabic, and Russian translations should be derived from the Hebrew originals, not invented independently.

**Zod schema messages:** Zod schemas defined at module scope cannot use hooks. They must be redefined inside the component (or as a factory function called inside the component) to accept translated error strings.

**Hebrew city names in `about/page.tsx` geocoding map:** The city-to-coordinates lookup map (lines 32–49) uses Hebrew city names as keys. These are not display strings — they are data keys used for geocoding. Do not translate these keys; instead, add the English equivalents to the same map (which is already partially done in the existing code). The display of filter chips should use the conservatory's translated `city` field, not these map keys.

**Status strings used as data values:** Strings like `'ממתין לאישור מורה'` appear both as display text and as data values (`form.status === 'ממתין לאישור מורה'`). The translation system correctly handles display via the `Status` namespace. The data comparisons should continue using the Hebrew string constants — do not replace those. Only replace the JSX display strings.

**RTL/LTR layout:** Switching to Arabic or Hebrew should trigger RTL layout via the existing `dir="rtl"` mechanism on `<html>`. This is already handled by the layout and is not in scope for this SDD.

**Performance:** Adding `useTranslations()` to a large number of components does not add runtime overhead — `next-intl` bundles are tree-shaken per locale at build time.
