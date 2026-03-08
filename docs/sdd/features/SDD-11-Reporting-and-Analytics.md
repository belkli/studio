# SDD-11: Reporting, Analytics & Admin Dashboard

**Module:** 11  
**Dependencies:** All modules (aggregates data from everywhere)  
**Priority:** P2 — High value for retention and growth

---

## 1. Overview & Rationale

A conservatorium manager shouldn't need to open Excel on the first of every month to figure out whether the school is healthy. This module gives every stakeholder — admin, teacher, parent, student — a dashboard that instantly answers their most important questions, with data that updates in real time.

---

## 2. Admin Command Center

`/admin`

The main admin landing page is a real-time command center with everything urgent surfaced immediately.

### 2.1 Key Metrics Bar (Top of Page)

| Metric | Description |
|--------|-------------|
| Active Students | Currently enrolled students |
| Lessons This Week | Scheduled vs. completed |
| Revenue This Month | Collected vs. expected |
| Pending Approvals | Forms awaiting admin action |
| AI Alerts | Unresolved alerts from Agent 4 (Module 10) |
| Open Makeups | Students with pending makeup credits |

### 2.2 Today's Snapshot

- Timeline of all lessons today (all teachers, all rooms)
- Any teacher marked sick today
- Any payment failures from last 24 hours
- Forms submitted today awaiting approval
- New registration requests pending approval

### 2.3 Quick Actions

Buttons for the most frequent admin tasks:
- "Approve Pending Registrations" (badge with count)
- "Review Forms" (badge with count)
- "Issue Credit Manually"
- "Send Announcement"
- "View Payroll Drafts"

---

## 3. Financial Reports

`/admin/reports/financial`

### 3.1 Revenue Dashboard

- **Monthly Revenue Chart:** Bar chart, current year, actual vs. projected
- **Revenue Breakdown:** Pie chart by package type (monthly subscriptions vs. packs vs. ad-hoc)
- **Collection Rate:** % of invoices paid on time vs. overdue vs. outstanding
- **Top Revenue Sources:** By teacher (which teacher's students generate the most revenue)
- **Refunds & Credits Issued:** Total credits/refunds this month

### 3.2 Exportable Reports

| Report | Format | Period Options |
|--------|--------|---------------|
| Monthly Revenue Summary | PDF, Excel | Month, Quarter, Year |
| Outstanding Invoices | Excel | Current |
| Payroll Preparation | Excel | Month |
| Tax Summary (מע"מ) | PDF | Month, Quarter, Year |
| Student Billing History | PDF (per student) | All time |
| Package Revenue by Type | Excel | Month, Quarter |

### 3.3 Financial Forecast

Simple AI-powered projection (linear extrapolation from last 3 months):
- "At current trajectory, monthly revenue next month: ₪[X]"
- "Subscriptions up for renewal in the next 30 days: [N] students (₪[X] at risk)"

---

## 4. Operational Reports

`/admin/reports/operations`

### 4.1 Attendance & Cancellations

- **Attendance Rate:** By teacher, by instrument, by month
- **Cancellation Breakdown:** Teacher-initiated vs. student (on-time) vs. student (late) vs. no-show
- **Top Cancellation Times:** Which days/times have the most cancellations
- **Makeup Utilization Rate:** % of issued makeup credits that are actually used before expiry

### 4.2 Capacity & Utilization

- **Teacher Capacity Heatmap:** Each teacher's % capacity booked
- **Room Utilization:** Hours used vs. available hours per room
- **Peak Hours:** Busiest times of week (drives decisions about room allocation and hiring)
- **Ad-Hoc Pool Fill Rate:** % of published ad-hoc slots that get booked (measures demand for flexible offerings)

### 4.3 Student Lifecycle

- **Enrollment Sources:** How did students find us? (referral, web search, trial, etc.) — requires a UTM or source field in enrollment
- **Trial-to-Enroll Conversion Rate:** % of trials that converted to a package
- **Average Enrollment Duration:** How long do students stay?
- **Churn Rate:** % of students who didn't renew in the last 90 days
- **Waitlist Conversion:** % of waitlist offers that were accepted

---

## 5. Academic Reports

`/admin/reports/academic`

- **Practice Engagement:** % of students who logged at least 1 practice session in the last 7 days (by teacher)
- **Average Practice Minutes:** Per student, per week, trend over time
- **Repertoire Progress:** How many pieces have students completed this semester?
- **Exam Registration Status:** List of students registered for upcoming exams, with form status
- **Exam Results Tracker:** For teachers to enter pass/fail results; aggregate shown to admin

---

## 6. Teacher Reports

`/dashboard/teacher/reports`

Each teacher sees a private report of their own performance:

- **My Students:** Active student count, capacity vs. available slots
- **This Month:** Lessons taught, lessons cancelled (by me), lessons cancelled (by students)
- **Earnings:** Month-to-date earnings with lesson breakdown
- **Practice Engagement:** % of my students who are logging practice
- **Upcoming Exams:** My students registered for upcoming Ministry exams

---

## 7. Student & Parent Reports

`/dashboard/progress` (already covered in Module 09, summarized here)

- Practice logs and streak
- Package/credit balance
- Upcoming lessons
- Forms status
- Payments history

---

## 8. Conservatorium Settings & Configuration

`/admin/settings`

A central settings hub covering all configurable aspects of the system:

### 8.1 General Settings
- Conservatorium name, logo, stamp image
- Contact information and address
- Default language
- Time zone

### 8.2 Academic Year
- Start/end dates
- Holiday and closure dates
- Exam periods

### 8.3 Pricing
- Per-instrument, per-duration base rates
- Package discounts
- Sibling discounts
- Ad-hoc premium
- Trial lesson price

### 8.4 Cancellation Policy
- Notice hours required
- Credit rules per cancellation type
- Makeup expiry period
- Max makeups per term

### 8.5 Payment Settings
- Cardcom API credentials
- Bank account details (for bank transfer instructions)
- Invoice prefix and numbering
- VAT settings

### 8.6 AI Feature Toggles
- Enable/disable each AI agent individually
- Matchmaker: on/off + minimum match score threshold
- Rescheduling Concierge: on/off + supported channels
- Progress Report Drafter: on/off
- Enrollment Lead Nurture: on/off + follow-up timing

### 8.7 Notification Settings
- Default reminder timing (e.g., 24h before lesson)
- SMS sender name
- Email sender name + reply-to
- WhatsApp opt-in default (on/off)

---

## 9. Data Export & Portability

All major data can be exported on demand:

| Data | Format | Who Can Export |
|------|--------|---------------|
| All students | CSV/Excel | Admin |
| All forms (current year) | ZIP of PDFs | Admin |
| All invoices | CSV/Excel | Admin |
| All lesson history | CSV | Admin |
| Payroll history | Excel | Admin |
| My own data | JSON | Any user (GDPR/privacy) |

**Self-Service Data Deletion:** Users can request account deletion, which triggers a 30-day review period before permanent deletion (data retained in anonymized form for financial records as required by law).

---

## 10. UI Components Required

| Component | Route | Description |
|-----------|-------|-------------|
| `AdminCommandCenter` | `/admin` | Main admin landing page |
| `KeyMetricsBar` | Within admin | Real-time top metrics |
| `TodayTimeline` | Within admin | Today's lesson timeline |
| `RevenueChart` | `/admin/reports/financial` | Monthly revenue bar chart |
| `FinancialExportPanel` | `/admin/reports/financial` | Report generation and download |
| `AttendanceHeatmap` | `/admin/reports/operations` | Day/time cancellation visualization |
| `CapacityHeatmap` | `/admin/reports/operations` | Teacher and room utilization |
| `AcademicEngagementChart` | `/admin/reports/academic` | Practice engagement by teacher |
| `TeacherOwnReport` | `/dashboard/teacher/reports` | Teacher's private performance view |
| `SettingsHub` | `/admin/settings` | Tabbed settings center |
| `DataExportPanel` | `/admin/settings/data` | Export and deletion tools |
