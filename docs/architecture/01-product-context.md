# 01 -- Product Context

## 1. Business Goals

Lyriosa targets **Israeli music conservatoriums** -- institutions that today operate through phone calls, WhatsApp messages, paper forms, and Excel spreadsheets.

| Goal | Metric |
|------|--------|
| Eliminate administrative overhead | Reduce secretary time-per-week by 60%+ |
| Enable self-service for families | 80%+ of bookings, cancellations, payments without staff |
| Increase retention | Proactive makeup credit tracking and AI engagement |
| Expand revenue per conservatorium | Musicians for Hire marketplace, Premium Teacher tier, donations |
| Regulatory compliance | Ministry of Education forms, PDPPA privacy, IS 5568 accessibility |

The business model is **multi-tenant SaaS**: each conservatorium is a fully isolated tenant (`conservatoriumId`) with its own settings, users, pricing, and branding.

---

## 2. User Roles

### 2.1 Role Hierarchy

Role values in code are **lowercase strings** (e.g., `'conservatorium_admin'`, `'teacher'`).

```
site_admin
+-- conservatorium_admin
|   +-- delegated_admin          (admin with restricted AdminSection permissions)
|   +-- teacher
|   +-- parent
|       +-- student              (over 13 -- has own login)
|       +-- student              (under 13 -- managed via parent)
|
ministry_director                (read-only cross-tenant reporting)
school_coordinator               (Playing School programme liaison)
```

### 2.2 Role Definitions

| Role | Key Capabilities |
|------|-----------------|
| `site_admin` | Full access across all conservatoriums. Creates/manages conservatorium admins. |
| `conservatorium_admin` | Full access within own conservatorium. Approvals, billing, payroll, settings. |
| `delegated_admin` | Admin with restricted access scoped to specific `AdminSection[]` values. |
| `teacher` | Manages schedule, availability, attendance, lesson notes, LMS content. Views payroll. |
| `parent` | Registers children, pays invoices, books/cancels lessons, signs forms. Family Hub. |
| `student` | Books lessons, logs practice, submits forms, views schedule and repertoire. |
| `ministry_director` | Read-only cross-conservatorium reporting and Ministry export. |
| `school_coordinator` | Playing School programme: school partnerships, group lessons, instrument loans. |

### 2.3 Delegated Admin Permissions

Valid `AdminSection[]` values:
`users` | `registrations` | `approvals` | `announcements` | `events` | `scheduling` | `rooms` | `rentals` | `scholarships` | `donations` | `reports` | `payroll` | `open-day` | `performances` | `alumni` | `conservatorium-profile`

### 2.4 Account Types

| AccountType | Description |
|-------------|-------------|
| `FULL` | Standard conservatorium student -- private lessons, full LMS |
| `PLAYING_SCHOOL` | School-partnership group lesson student |
| `TRIAL` | Trial lesson only; no package, limited access |

---

## 3. Primary Use Cases

### 3.1 Student & Family Journey

| # | Use Case | Status |
|---|----------|--------|
| UC-01 | Self-register or be registered by parent | ✅ |
| UC-02 | AI teacher matching via Genkit flow | ✅ |
| UC-03 | Book a trial lesson | ✅ |
| UC-04 | Purchase a lesson package (monthly, pack, yearly, premium) | ✅ UI; 🚧 Cardcom |
| UC-05 | Book, reschedule, or cancel a lesson | ✅ |
| UC-06 | Receive notification of cancellation | 🚧 dispatcher ready, no credentials |
| UC-07 | Log practice session with mood and notes | ✅ |
| UC-08 | View assigned repertoire and sheet music | ✅ |
| UC-09 | Submit recital / Ministry exam form | ✅ |
| UC-10 | Pay invoice with Israeli gateway (1-12 instalments) | 🚧 Cardcom |
| UC-11 | Apply for scholarship / financial aid | ✅ |

### 3.2 Teacher Journey

| # | Use Case | Status |
|---|----------|--------|
| UC-12 | Set weekly availability + ad-hoc exceptions | ✅ |
| UC-13 | Mark lesson attendance | ✅ |
| UC-14 | Submit sick leave | ✅ UI |
| UC-15 | Assign repertoire and view practice logs | ✅ |
| UC-16 | Approve/reject student forms | ✅ |
| UC-17 | View payroll statement | ✅ UI |
| UC-18 | Opt-in to Musicians for Hire | ✅ |

### 3.3 Administrator Journey

| # | Use Case | Status |
|---|----------|--------|
| UC-19 | Approve registrations | ✅ |
| UC-20 | Generate invoices | ✅ UI |
| UC-21 | Admin command centre with live stats | ✅ (mock aggregations) |
| UC-22 | Export teacher payroll for Hilan / Merav Digital | ✅ UI |
| UC-23 | Manage rooms, branches, instruments | ✅ |
| UC-24 | Submit Ministry forms | ✅ |
| UC-25 | Configure scholarship fund | ✅ |
| UC-26 | Manage events, open days, performances | ✅ |

---

## 4. Premium Teacher Tier

Conservatoriums can designate teachers as **Premium** (`isPremiumTeacher: true`). Only `conservatorium_admin` or `site_admin` can set this flag.

**Impact:**
- **Premium Packages:** `PACK_5_PREMIUM`, `PACK_10_PREMIUM`, `PACK_DUET` -- priced higher than standard packs
- **Visual Badge:** Gold badge on slot tiles, teacher cards, and book-lesson wizard
- **Revenue Upsell:** Monetise senior or specialist teachers at higher rates

---

## 5. Available-Now Slot Booking Flow

The `/available-now` page lists open teacher slots for public browsing:

```
/available-now --> Browse open slots --> Click "Book Now"
    |
    +-- Saves slot to sessionStorage as pending_slot
    +-- Routes to /register (or /login) with teacher + conservatorium params
    |
    +-- After login --> Deals tab reads pending_slot from sessionStorage
    +-- Auto-opens booking dialog pre-filled with selected slot
```

---

## 6. Competitive Positioning

| Feature | My Music Staff | TeacherZone | iTalki | Preply | **Lyriosa** |
|---------|---------------|-------------|--------|--------|-------------|
| Hebrew / RTL | -- | -- | -- | -- | ✅ Native |
| Arabic support | -- | -- | -- | -- | ✅ |
| Israeli payment gateways | -- | -- | -- | -- | ✅ (5 providers) |
| Ministry of Education forms | -- | -- | -- | -- | ✅ |
| AI Teacher Matching | -- | -- | -- | -- | ✅ Genkit |
| AI Progress Reports | -- | -- | -- | -- | ✅ Genkit |
| Musicians for Hire | -- | -- | -- | -- | ✅ |
| Playing School Programme | -- | -- | -- | -- | ✅ |
| Premium Teacher Tier | -- | -- | -- | -- | ✅ |
| Multi-child Family Hub | limited | limited | -- | -- | ✅ |
| IS 5568 Accessibility | -- | -- | -- | -- | ✅ |
