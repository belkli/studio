# 01 — Product Context

## 1. Business Goals

Harmonia targets **Israeli music conservatoriums** — institutions that today operate through phone calls, WhatsApp messages, paper forms, and Excel spreadsheets. The platform's commercial thesis is:

| Goal | Metric |
|------|--------|
| Eliminate administrative overhead | Reduce secretary time-per-week by ≥ 60% |
| Enable self-service for families | ≥ 80% of bookings, cancellations, and payments completed without staff intervention |
| Increase retention | Proactive makeup credit tracking and AI engagement reduce student dropout |
| Expand revenue per conservatorium | Musicians for Hire marketplace and scholarship donation pipeline |
| Regulatory compliance | Native Israeli Ministry of Education form submission, PDPPA privacy law, IS 5568 accessibility, payroll CSV export for Hilan/Merav Digital |

The business model is **multi-tenant SaaS**: each conservatorium is a fully isolated tenant (`conservatoriumId`) with its own settings, users, pricing, and branding. A single deployment can serve a single branch or a national network.

---

## 2. User Roles

### 2.1 Role Hierarchy

> **Implementation note:** Role values in code are **lowercase strings** (e.g., `'conservatorium_admin'`, `'teacher'`), not the UPPER_CASE used in earlier SDD documents.

```
site_admin
└── conservatorium_admin
    ├── delegated_admin          (admin with restricted AdminSection permissions)
    ├── teacher
    └── parent
        ├── student              (STUDENT_OVER_13 equivalent — has own login)
        └── student              (STUDENT_UNDER_13 equivalent — managed via parent)

Additional roles:
    ministry_director            (read-only cross-tenant reporting)
    school_coordinator           (Playing School programme liaison — SDD-PS)
```

### 2.2 Role Definitions

| Role (code value) | Auth | Key Capabilities |
|-------------------|------|-----------------|
| `site_admin` | Email + Password / OAuth | Full access across all conservatoriums. Creates and manages conservatorium admins. |
| `conservatorium_admin` | Email + Password / OAuth | Full access within their conservatorium. Approves registrations, manages billing, payroll export, reporting, and settings. |
| `delegated_admin` | Email + Password / OAuth | Admin with restricted access; permissions scoped to specific `AdminSection[]` values. Cannot access sections not in `delegatedAdminPermissions`. |
| `teacher` | Email + Password / OAuth | Manages own schedule, availability, attendance, lesson notes, LMS content, and forms for their students. Views own payroll statement. |
| `parent` | Email + Password / OAuth / Magic Link | Registers children, pays invoices, books and cancels lessons, signs Ministry forms, views child progress on the Family Hub. |
| `student` | Email + Password / OAuth | Books lessons, logs practice, submits forms, views own schedule and repertoire, messages teacher. Under-13 students have no login — handled by parent. |
| `ministry_director` | Email + Password | Read-only cross-conservatorium reporting and Ministry export access. Cannot modify any data. |
| `school_coordinator` | Email + Password | Playing School programme management — school partnerships, group lessons, instrument loans, excellence track. |

### 2.3 Delegated Admin Permissions

The `delegated_admin` role is a sub-role that restricts access to a named subset of admin sections, stored on the user record as `delegatedAdminPermissions: AdminSection[]`. Valid sections:

`users` · `registrations` · `approvals` · `announcements` · `events` · `scheduling` · `rooms` · `rentals` · `scholarships` · `donations` · `reports` · `payroll` · `open-day` · `performances` · `alumni` · `conservatorium-profile`

### 2.4 Age-Gate Logic

- **Source of truth:** `User.dateOfBirth` / `User.birthDate`
- **Under 13:** Profile created by a `parent`. No email, no login, no direct SMS. All notifications route to `parent`.
- **Turning 13:** A nightly Cloud Function triggers the **Age-Upgrade Flow** (spec in `src/lib/cloud-functions/`).
- **Over 18:** Student is fully independent. Parent link retained optionally for family billing.

---

## 3. Account Types

Beyond roles, users have an `accountType` field that changes the experience:

| AccountType | Description |
|-------------|-------------|
| `FULL` | Standard conservatorium student — private lessons, full LMS |
| `PLAYING_SCHOOL` | School-partnership group lesson student (SDD-PS) |
| `TRIAL` | Trial lesson only; no package, limited access |

---

## 4. Primary Use Cases

### 4.1 Student & Family Journey

| # | Use Case | Actor | Module | Status |
|---|----------|-------|--------|--------|
| UC-01 | Self-register or be registered by parent | Parent / Student | 02 | ✅ |
| UC-02 | Be matched to a teacher via AI Matchmaker | System / Student | 10 | ✅ flow; ⚠️ UI uses stub |
| UC-03 | Book a trial lesson | Student / Parent | 04 | ✅ |
| UC-04 | Purchase a lesson package (monthly, pack, yearly) | Parent / Student | 05 | ✅ UI; ⚠️ Cardcom stub |
| UC-05 | Book, reschedule, or cancel a lesson | Student / Parent | 04, 06 | ✅ UI; ⚠️ no policy enforcement |
| UC-06 | Receive WhatsApp/SMS notification of cancellation | System → Parent | 07 | ⚠️ dispatcher stub |
| UC-07 | Log a practice session with mood and notes | Student / Parent | 09 | ✅ |
| UC-08 | View assigned repertoire and sheet music | Student | 09 | ✅ |
| UC-09 | Submit a recital / Ministry exam registration form | Student / Teacher | 08 | ✅ |
| UC-10 | Pay invoice with Israeli gateway in 1–12 instalments | Parent | 05 | ⚠️ stub |
| UC-11 | Apply for a scholarship / financial aid | Parent / Student | 17 | ✅ |
| UC-12 | View all children's schedules and balances in Family Hub | Parent | 11 | ✅ |

### 4.2 Teacher Journey

| # | Use Case | Actor | Module | Status |
|---|----------|-------|--------|--------|
| UC-13 | Set weekly availability template + ad-hoc exceptions | Teacher | 03 | ✅ |
| UC-14 | Mark lesson attendance (Present / Absent / No-Show) | Teacher | 04 | ✅ |
| UC-15 | Submit sick leave — lessons auto-cancelled, credits issued | Teacher | 06 | ✅ UI; ⚠️ CF spec |
| UC-16 | Assign repertoire and view student practice logs | Teacher | 09 | ✅ |
| UC-17 | Approve or reject forms for their students | Teacher | 08 | ✅ |
| UC-18 | View own payroll statement and download CSV export | Teacher | 11 | ✅ UI; ⚠️ CF spec |
| UC-19 | Opt-in to the Musicians for Hire marketplace | Teacher | 13 | ✅ |

### 4.3 Administrator Journey

| # | Use Case | Actor | Module | Status |
|---|----------|-------|--------|--------|
| UC-20 | Approve new student / teacher registrations | Admin | 01 | ✅ |
| UC-21 | Generate monthly invoices and send to families | Admin / System | 05 | ✅ UI; ⚠️ CF spec |
| UC-22 | View real-time admin command centre | Admin | 11 | ✅ (mock aggregations) |
| UC-23 | Export teacher payroll data for Hilan / Merav Digital | Admin | 03 | ✅ UI; ⚠️ CF spec |
| UC-24 | Manage rooms, branches, and instrument inventory + rentals | Admin | 14 | ✅ |
| UC-25 | Submit bulk Ministry of Education forms | Admin | 08 | ✅ |
| UC-26 | Configure scholarship fund and review applications | Admin | 17 | ✅ |
| UC-27 | Manage events, open days, and recital productions | Admin | 14 | ✅ |
| UC-28 | View platform-wide analytics and financial forecasts | Admin | 11 | ✅ |

### 4.4 Playing School Journey (SDD-PS — Not in original SDD list)

| # | Use Case | Actor | Status |
|---|----------|-------|--------|
| UC-29 | School coordinator manages school partnerships and group lessons | Coordinator | ✅ |
| UC-30 | Parent receives Playing School enrolment flow via QR token | Parent | ✅ |
| UC-31 | Student receives instrument loan with digital consent | Admin / Parent | ✅ |
| UC-32 | Student nominated for excellence track | Teacher / Coordinator | ✅ |

---

## 5. Key Competitive Differentiators

| Feature | My Music Staff | TeacherZone | Jackrabbit | **Harmonia** |
|---------|---------------|-------------|------------|-------------|
| Hebrew / RTL | ❌ | ❌ | ❌ | ✅ Native |
| Arabic support | ❌ | ❌ | ❌ | ✅ |
| Israeli payment (Cardcom + 4 others) | ❌ | ❌ | ❌ | ✅ (stub) |
| Installment payments (תשלומים) | ❌ | ❌ | ❌ | ✅ 1–12 (spec) |
| Ministry of Education forms | ❌ | ❌ | ❌ | ✅ |
| AI Teacher Matching | ❌ | ❌ | ❌ | ✅ Genkit |
| AI Progress Reports | ❌ | ❌ | ❌ | ✅ Genkit |
| AI Event Poster Generation | ❌ | ❌ | ❌ | ✅ Genkit |
| AI Lead Nurturing (Playing School) | ❌ | ❌ | ❌ | ✅ Genkit |
| Musicians for Hire Marketplace | ❌ | ❌ | ❌ | ✅ |
| Playing School Programme | ❌ | ❌ | ❌ | ✅ |
| Delegated Admin with section permissions | ❌ | ❌ | ❌ | ✅ |
| IS 5568 Accessibility (Israeli law) | ❌ | ❌ | ❌ | ✅ (partial) |
| WhatsApp Notifications | ❌ | ❌ | ❌ | ⚠️ stub |
| Multi-child Family Hub | ⚠️ | ⚠️ | ✅ | ✅ |
| LMS + Practice Logs + Gamification | ⚠️ | ✅ | ❌ | ✅ |
| Payroll Export (Hilan-compatible CSV) | ⚠️ | ❌ | ✅ | ⚠️ spec |
