# 01 — Product Context

## 1. Business Goals

Harmonia targets **Israeli music conservatoriums** — institutions that today operate through a combination of phone calls, WhatsApp messages, paper forms, and Excel spreadsheets. The platform's commercial thesis is:

| Goal | Metric |
|------|--------|
| Eliminate administrative overhead | Reduce secretary time-per-week by ≥ 60% |
| Enable self-service for families | ≥ 80% of bookings, cancellations, and payments completed without staff intervention |
| Increase retention | Proactive makeup credit tracking and AI engagement reduce student dropout |
| Expand revenue per conservatorium | Musicians for Hire marketplace and scholarship donation pipeline |
| Regulatory compliance | Native Israeli Ministry of Education form submission, PDPPA privacy law, IS 5568 accessibility, and Bituach Leumi payroll export |

The business model is **multi-tenant SaaS**: each conservatorium is a fully isolated tenant (`conservatoriumId`) with its own settings, users, pricing, and branding. A single Harmonia deployment can serve a single branch or a national network.

---

## 2. User Roles

### Role Hierarchy

```
SITE_ADMIN
└── CONSERVATORIUM_ADMIN
    ├── TEACHER
    └── PARENT
        ├── STUDENT_UNDER_13  (no login — managed via parent)
        └── STUDENT_OVER_13   (has own login)

Additional roles:
    MINISTRY_DIRECTOR         (read-only cross-tenant reporting)
    SCHOOL_COORDINATOR        (Playing School programme liaison)
```

### Role Definitions

| Role | Auth | Key Capabilities |
|------|------|-----------------|
| `SITE_ADMIN` | Email + Password | Full access across all conservatoriums. Creates and manages conservatorium admins. |
| `CONSERVATORIUM_ADMIN` | Email + Password / OAuth | Full access within their conservatorium. Approves registrations and forms, manages billing, payroll export, reporting, and settings. |
| `TEACHER` | Email + Password / OAuth | Manages own schedule, availability, attendance, lesson notes, LMS content, and forms for their students. Views own payroll statement. |
| `PARENT` | Email + Password / OAuth / Magic Link | Registers children, pays invoices, books and cancels lessons, signs Ministry forms, views child progress on the Family Hub. Financial controller of the family account. |
| `STUDENT_OVER_13` | Email + Password / OAuth | Books lessons, logs practice, submits forms, views own schedule and repertoire, messages teacher. |
| `STUDENT_UNDER_13` | None (no login) | Virtual profile only. All actions performed by the linked parent. No direct email or SMS. |
| `MINISTRY_DIRECTOR` | Email + Password | Read-only cross-conservatorium reporting and Ministry export access. Cannot modify any data. |
| `SCHOOL_COORDINATOR` | Email + Password | Playing School programme management within a specific conservatorium. |

### Age-Gate Logic

- **Source of truth:** `User.dateOfBirth`
- **Under 13:** Profile created by a `PARENT`. No email, no login, no direct SMS. All notifications route to `PARENT`.
- **Turning 13:** A nightly Cloud Function triggers the **Age-Upgrade Flow** — parent is notified and can invite the child to create their own account. Parent retains financial control.
- **Over 18:** Student is fully independent. Parent link retained optionally for family billing.

---

## 3. Primary Use Cases

### 3.1 Student & Family Journey

| # | Use Case | Actor | Module |
|---|----------|-------|--------|
| UC-01 | Self-register or be registered by parent | Parent / Student | 02 |
| UC-02 | Be matched to a teacher via AI Matchmaker | System / Student | 10 |
| UC-03 | Book a trial lesson | Student / Parent | 04 |
| UC-04 | Purchase a lesson package (monthly, pack, yearly) | Parent / Student | 05 |
| UC-05 | Book, reschedule, or cancel a lesson | Student / Parent | 04, 06 |
| UC-06 | Receive instant WhatsApp/SMS notification of cancellation | System → Parent | 07 |
| UC-07 | Log a practice session with mood and notes | Student / Parent | 09 |
| UC-08 | View assigned repertoire and sheet music | Student | 09 |
| UC-09 | Submit a recital / Ministry exam registration form | Student / Teacher | 08 |
| UC-10 | Pay invoice with Israeli Cardcom gateway in 1–12 instalments | Parent | 05 |
| UC-11 | Apply for a scholarship / financial aid | Parent / Student | 17 |
| UC-12 | View all children's schedules and balances in Family Hub | Parent | 11 |

### 3.2 Teacher Journey

| # | Use Case | Actor | Module |
|---|----------|-------|--------|
| UC-13 | Set weekly availability template + ad-hoc exceptions | Teacher | 03 |
| UC-14 | Mark lesson attendance (Present / Absent / No-Show) | Teacher | 04 |
| UC-15 | Submit sick leave — all affected lessons auto-cancelled with makeup credits | Teacher | 06 |
| UC-16 | Assign repertoire and view student practice logs | Teacher | 09 |
| UC-17 | Approve or reject forms for their students | Teacher | 08 |
| UC-18 | View own payroll statement and download CSV export | Teacher | 11 |
| UC-19 | Opt-in to the Musicians for Hire marketplace | Teacher | 13 |

### 3.3 Administrator Journey

| # | Use Case | Actor | Module |
|---|----------|-------|--------|
| UC-20 | Approve new student / teacher registrations | Admin | 01 |
| UC-21 | Generate monthly invoices and send to families | Admin / System | 05 |
| UC-22 | View real-time command centre (students, revenue, makeups, alerts) | Admin | 11 |
| UC-23 | Export teacher payroll data for Hilan / Merav Digital | Admin | 03 |
| UC-24 | Manage rooms, branches, and instrument inventory | Admin | 14 |
| UC-25 | Submit bulk Ministry of Education forms | Admin | 08 |
| UC-26 | Configure scholarship fund and review applications | Admin | 17 |
| UC-27 | Manage events, open days, and recital productions | Admin | 14 |
| UC-28 | View platform-wide analytics and financial forecasts | Admin | 11 |

---

## 4. Key Competitive Differentiators

| Feature | My Music Staff | TeacherZone | Jackrabbit | **Harmonia** |
|---------|---------------|-------------|------------|-------------|
| Hebrew / RTL | ❌ | ❌ | ❌ | ✅ Native |
| Arabic support | ❌ | ❌ | ❌ | ✅ |
| Israeli payment (Cardcom) | ❌ | ❌ | ❌ | ✅ |
| Installment payments (תשלומים) | ❌ | ❌ | ❌ | ✅ 1–12 |
| Ministry of Education forms | ❌ | ❌ | ❌ | ✅ Native |
| AI Teacher Matching | ❌ | ❌ | ❌ | ✅ Genkit |
| AI Progress Reports | ❌ | ❌ | ❌ | ✅ |
| Musicians for Hire Marketplace | ❌ | ❌ | ❌ | ✅ |
| Section 46 Donation Receipts | ❌ | ❌ | ❌ | ✅ |
| IS 5568 Accessibility (Israeli law) | ❌ | ❌ | ❌ | ✅ Target |
| WhatsApp Notifications | ❌ | ❌ | ❌ | ✅ Twilio |
| Multi-child Family Hub | ⚠️ | ⚠️ | ✅ | ✅ |
| LMS + Practice Logs | ⚠️ | ✅ | ❌ | ✅ Full |
| Auto Payroll Export (Hilan-compatible) | ⚠️ | ❌ | ✅ | ✅ CSV |

