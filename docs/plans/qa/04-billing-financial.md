# QA Plan: Billing & Financial Features

**Domain:** Billing, Packages, VAT, Invoices, Payroll, Aid, Scholarships, Rentals, CardCom Webhook
**Date:** 2026-03-14
**DB Backends:** mock (default), postgres, supabase, pocketbase
**Locales:** he (RTL), en, ar (RTL), ru

---

## Coverage Map

| # | Scenario | Personas | Priority |
|---|----------|----------|----------|
| BF-01 | Student billing page renders package status | student | P1 |
| BF-02 | Admin billing page renders financial dashboard | conservatorium_admin, site_admin | P1 |
| BF-03 | Package upgrade dialog — select and confirm | student | P1 |
| BF-04 | VAT display on billing page (18%) | student, parent | P1 |
| BF-05 | Invoice PDF download via /api/invoice-pdf | student, parent | P1 |
| BF-06 | Cancellation within 14-day cooling-off | student | P1 |
| BF-07 | Cancellation outside 14-day cooling-off | student | P1 |
| BF-08 | Pause subscription | student | P2 |
| BF-09 | Parent billing page — pending invoices and pay-now | parent | P1 |
| BF-10 | Parent billing page — setup recurring payment | parent | P2 |
| BF-11 | Admin payroll page — teacher payroll panel renders | conservatorium_admin, site_admin | P1 |
| BF-12 | Teacher payroll view — period filter and CSV export | teacher | P1 |
| BF-13 | Admin financial dashboard — revenue KPIs and chart | conservatorium_admin, site_admin | P2 |
| BF-14 | Admin financial dashboard — outstanding invoices list | conservatorium_admin, site_admin | P1 |
| BF-15 | Packages settings — create new package (admin) | conservatorium_admin | P1 |
| BF-16 | Packages settings — edit existing package | conservatorium_admin | P1 |
| BF-17 | Packages settings — toggle active/inactive | conservatorium_admin | P2 |
| BF-18 | Packages settings — delete package | conservatorium_admin | P2 |
| BF-19 | Packages settings — premium package flag | conservatorium_admin | P2 |
| BF-20 | Pricing settings page — access guard | conservatorium_admin, site_admin | P2 |
| BF-21 | Cancellation policy settings page — access guard | conservatorium_admin, site_admin | P2 |
| BF-22 | Aid application wizard — 3-step submission | student, parent | P1 |
| BF-23 | Aid application wizard — duplicate submission guard | student | P2 |
| BF-24 | Public apply-for-aid page accessible without auth | anonymous | P1 |
| BF-25 | Admin scholarships — approve application | conservatorium_admin | P1 |
| BF-26 | Admin scholarships — reject application | conservatorium_admin | P1 |
| BF-27 | Admin scholarships — mark paid | conservatorium_admin | P1 |
| BF-28 | Admin scholarships — add donation cause | conservatorium_admin | P2 |
| BF-29 | Instrument rental — create rental with OTP/signature link | conservatorium_admin | P1 |
| BF-30 | Instrument rental — return instrument | conservatorium_admin | P2 |
| BF-31 | Instrument rental — inventory tab renders | conservatorium_admin | P2 |
| BF-32 | CardCom webhook — valid HMAC + success payload marks invoice PAID | system (API) | P1 |
| BF-33 | CardCom webhook — invalid HMAC returns 401 | system (API) | P1 |
| BF-34 | CardCom webhook — failed payment (ResponseCode != 0) marks invoice OVERDUE | system (API) | P1 |
| BF-35 | CardCom webhook — missing invoiceId returns 400 | system (API) | P1 |
| BF-36 | CardCom webhook — GET ping returns 200 ok | system (API) | P2 |
| BF-37 | Playing school billing redirect | conservatorium_admin | P3 |
| BF-38 | Makeup credit balance displayed on billing page | student | P2 |
| BF-39 | Package expiry warning notice (≤14 days) | student | P2 |
| BF-40 | RTL layout billing pages (he, ar) | all | P2 |

---

## Scenario Details

### BF-01 — Student billing page renders package status

**Personas:** student (student-user-1, student-user-3..8)
**Preconditions:** Student has an active package assigned (`packageId` set in user record)
**Steps:**
1. Navigate to `/dashboard/billing`
2. Wait for `<main>` content to load

**Expected:**
- Page title "ניהול חיובים" (he) or "Billing" (en) visible
- "Package Status" card shows package name, credit count, progress bar
- `formatWithVAT` output visible on next billing row (price + "כולל מע״מ")
- Invoices table lists at least one row

**DB Backend:** mock
**Locales:** he, en
**Mock Data:** student-user-1, packages with `totalCredits`, invoices with `payerId = student-user-1`
**Stubs:** none (mock data)

---

### BF-02 — Admin billing page renders financial dashboard

**Personas:** conservatorium_admin, site_admin
**Preconditions:** User is conservatorium_admin (admin-user) or site_admin (dev-user)
**Steps:**
1. Navigate to `/dashboard/billing`
2. Wait for dynamic component to load (skeleton disappears)

**Expected:**
- Page title "Financial Overview" (en) or "סקירה פיננסית" (he)
- Four KPI cards visible: Revenue This Month, Overdue Charges, Collection Rate, Active Students
- Bar chart renders (Recharts `BarChart`)
- Outstanding invoices table shows rows with status SENT or OVERDUE

**DB Backend:** mock
**Locales:** he, en
**Mock Data:** invoices with mixed statuses, multiple students
**Stubs:** none

---

### BF-03 — Package upgrade dialog

**Personas:** student, parent
**Preconditions:** User is on billing page with a package assigned
**Steps:**
1. Navigate to `/dashboard/billing`
2. Click "Upgrade Package" button
3. Dialog opens showing 3 package options (PACK_5, PACK_10, MONTHLY)
4. Click "Select" on PACK_10

**Expected:**
- Dialog opens with title "Upgrade Package"
- 3 package tiers listed with price (₪450, ₪850, ₪320)
- Clicking Select shows toast "Package selected"
- Dialog closes

**DB Backend:** mock
**Locales:** he, en
**Mock Data:** student with active package
**Stubs:** Package purchase action (toast only, no real charge)

---

### BF-04 — VAT display on billing page (18%)

**Personas:** student, parent
**Preconditions:** Invoice with `total = 450` exists for the user
**Steps:**
1. Navigate to `/dashboard/billing`
2. Find invoices table

**Expected:**
- Amount column shows `formatWithVAT(450, locale)` output:
  - he: "₪531 כולל מע״מ"
  - en: "₪531 incl. VAT"
  - ar: "₪531 شامل ضريبة القيمة المضافة"
  - ru: "₪531 включая НДС"
- VAT calculation: 450 × 1.18 = 531

**DB Backend:** mock
**Locales:** he, en, ar, ru
**Mock Data:** Invoice with total = 450
**Stubs:** none

---

### BF-05 — Invoice PDF download via /api/invoice-pdf

**Personas:** student, parent, conservatorium_admin
**Preconditions:** Invoice with known `id` exists in mock DB
**Steps:**
1. Navigate to `/dashboard/billing`
2. Click download icon on a PAID invoice row
3. New tab opens at `/api/invoice-pdf/{invoiceId}`

**Expected:**
- HTTP 200 response with `Content-Type: text/html`
- HTML contains "חשבונית תשלום" heading
- Invoice number rendered
- Payment date rendered (he-IL locale)
- Amount in ILS currency format
- Print button present
- Non-existent ID returns 404 with text "Invoice not found"

**DB Backend:** mock
**Locales:** he (PDF always Hebrew)
**Mock Data:** Invoice with status PAID, total, invoiceNumber, paidAt
**Stubs:** none (API route uses `getDb()`)

---

### BF-06 — Cancellation within 14-day cooling-off

**Personas:** student
**Preconditions:** Student has active package; package was activated within last 14 days
**Steps:**
1. Navigate to `/dashboard/billing`
2. Click "Cancel Subscription" button
3. Confirm in AlertDialog

**Expected:**
- `cancelPackageAction` called with `{ packageId: currentPackage.id }`
- Toast shows cooling-off refund message: "הביטול התבצע בתוך תקופת ההתנסות (14 ימים). זכאי/ת להחזר מלא."
- Action returns `{ success: true, withinCoolingOff: true, refundEligible: true }`
- Package marked inactive (`isActive: false`) in DB

**DB Backend:** mock (verify via `useAuth` state update)
**Locales:** he
**Mock Data:** Student with active package
**Stubs:** `cancelPackageAction` currently stubs cooling-off as always true; note in test

---

### BF-07 — Cancellation outside 14-day cooling-off

**Personas:** student
**Preconditions:** Package older than 14 days (stub backend to return `withinCoolingOff: false` in future)
**Steps:**
1. Navigate to `/dashboard/billing`
2. Click "Cancel Subscription", confirm

**Expected:**
- Toast shows standard cancellation message: "הביטול יכנס לתוקף תוך 3 ימי עסקים."
- Package is deactivated

**DB Backend:** mock (current action always returns `withinCoolingOff: true`; mark as TODO pending real implementation)
**Locales:** he
**Mock Data:** Package with old activation date
**Stubs:** `cancelPackageAction` — document current stub behaviour

---

### BF-08 — Pause subscription

**Personas:** student
**Preconditions:** Student has active package
**Steps:**
1. Navigate to `/dashboard/billing`
2. Click "Pause Subscription"

**Expected:**
- `cancelPackageAction` called
- Toast shows pause confirmation text
- Button shows loading spinner during processing

**DB Backend:** mock
**Locales:** he, en
**Mock Data:** Student with active package
**Stubs:** `cancelPackageAction`

---

### BF-09 — Parent billing page — pending invoices and pay-now

**Personas:** parent (parent-user-1)
**Preconditions:** Parent role; mock data has PENDING invoice
**Steps:**
1. Navigate to `/dashboard/parent/billing`
2. Observe billing summary card showing balance due
3. Click "Proceed to Payment"

**Expected:**
- Page title "Parent Billing" visible
- Balance due shows ₪850 (PENDING invoice amount)
- "Pay by the 10th" warning visible
- Click triggers `handlePayNow` → loading spinner → toast "Redirecting to secure payment page"
- Pay button disabled if totalPending === 0

**DB Backend:** mock (component uses hardcoded MOCK_INVOICES)
**Locales:** he, en
**Mock Data:** ParentPaymentPanel uses internal mock; no external data dependency
**Stubs:** Cardcom redirect simulated with setTimeout

---

### BF-10 — Parent billing — setup recurring payment

**Personas:** parent
**Steps:**
1. Navigate to `/dashboard/parent/billing`
2. Click "Set Up Alternative Payment / Direct Debit"

**Expected:**
- Loading spinner shown
- Toast: "Set Up Recurring / Monthly Direct Debit" with description
- Real redirect to Cardcom not triggered (stub)

**DB Backend:** mock
**Locales:** he, en
**Stubs:** Cardcom redirect

---

### BF-11 — Admin payroll page renders

**Personas:** conservatorium_admin, site_admin
**Preconditions:** Logged in as admin
**Steps:**
1. Navigate to `/dashboard/admin/payroll`
2. Wait for dynamic component

**Expected:**
- Page heading "Payroll" (en) or "שכר מורים" (he)
- `AdminPayrollPanel` component loaded (no skeleton)
- useAdminGuard redirects non-admins to /403

**DB Backend:** mock
**Locales:** he, en
**Mock Data:** Teachers in same conservatoriumId
**Stubs:** none

---

### BF-12 — Teacher payroll view — period filter and CSV export

**Personas:** teacher (teacher-user-1, teacher-user-2)
**Preconditions:** Teacher has completed lessons in mock data for period 2026-03
**Steps:**
1. Navigate to `/dashboard/teacher/payroll`
2. Verify current period "2026-03" selected by default
3. Check lessons table shows only this teacher's lessons in March 2026
4. Click "Export CSV"

**Expected:**
- Lessons table shows correct rows (teacherId matches)
- Summary: lesson count, total hours formatted as HH:MM
- Absent count (CANCELLED_TEACHER + NO_SHOW_TEACHER)
- CSV downloaded with Hebrew BOM header: שם עובד, ת.ז., שעות בפועל, שעות נוספות, היעדרויות, הערות
- Non-teacher role redirected to /403

**DB Backend:** mock
**Locales:** he, en
**Mock Data:** Lessons lesson-4..lesson-13, teacher-user-1 lessons in March 2026
**Stubs:** File download (browser download)

---

### BF-13 — Admin financial dashboard — revenue chart

**Personas:** conservatorium_admin
**Steps:**
1. Navigate to `/dashboard/billing`
2. Locate bar chart component

**Expected:**
- Recharts BarChart renders with month labels (Jan–Jun)
- No JS errors in console
- Chart is accessible (has aria label or desc)

**DB Backend:** mock
**Locales:** he (month names RTL), en
**Stubs:** Chart uses hardcoded data; note in test

---

### BF-14 — Admin financial dashboard — outstanding invoices

**Personas:** conservatorium_admin
**Steps:**
1. Navigate to `/dashboard/billing`
2. Find invoices table

**Expected:**
- Table shows invoices with status SENT or OVERDUE
- OVERDUE row badge styled red
- Collection rate percentage matches PAID/total ratio
- Download button on each row opens /api/invoice-pdf

**DB Backend:** mock
**Mock Data:** invoices with mixed PAID/SENT/OVERDUE statuses

---

### BF-15 — Packages settings — create new package

**Personas:** conservatorium_admin
**Preconditions:** newFeaturesEnabled not required for packages page (packages page only guards for conservatorium_admin)
**Steps:**
1. Navigate to `/dashboard/settings/packages`
2. Click "Add Package"
3. Fill: nameHe = "חבילה חדשה", nameEn = "New Package", type = monthly, lessonCount = 4, duration = 45, price = 600
4. Check instruments checkboxes (at least one)
5. Click Save

**Expected:**
- Dialog opens with empty form
- Per-lesson hint shows ₪150/lesson (600÷4)
- Save button disabled until both nameHe and nameEn filled
- After save: new card appears in list with name, type badge (blue/monthly), price
- Dialog closes

**DB Backend:** mock
**Locales:** he, en
**Mock Data:** conservatoriumInstruments for same conservatoriumId
**Stubs:** `addLessonPackage` (useAuth hook)

---

### BF-16 — Packages settings — edit existing package

**Personas:** conservatorium_admin
**Steps:**
1. Navigate to `/dashboard/settings/packages`
2. Click pencil icon on existing package
3. Change price to 700, toggle isPremium on
4. Click Save

**Expected:**
- Form pre-populates with existing values
- Premium toggle shows gold star section
- After save: card updates with new price and ⭐ Premium badge

**DB Backend:** mock
**Locales:** he
**Stubs:** `updateLessonPackage`

---

### BF-17 — Packages settings — toggle active/inactive

**Personas:** conservatorium_admin
**Steps:**
1. Navigate to `/dashboard/settings/packages`
2. Toggle active Switch off for a package

**Expected:**
- Card becomes opacity-60
- "Inactive" badge appears
- `updateLessonPackage(id, { isActive: false })` called

**DB Backend:** mock
**Stubs:** `updateLessonPackage`

---

### BF-18 — Packages settings — delete package

**Personas:** conservatorium_admin
**Steps:**
1. Navigate to `/dashboard/settings/packages`
2. Click trash icon on a package

**Expected:**
- `deleteLessonPackage(id)` called
- Card removed from list
- No confirmation dialog (direct delete — note as UX concern)

**DB Backend:** mock
**Stubs:** `deleteLessonPackage`

---

### BF-19 — Packages settings — premium package flag

**Personas:** conservatorium_admin
**Steps:**
1. Navigate to `/dashboard/settings/packages`
2. Add or edit package with `isPremium: true`

**Expected:**
- Premium badge with ⭐ star icon shown on card
- Gold star section visible in form with hint text
- Premium packages appear in book-lesson-wizard teacher selector with ⭐ prefix

**DB Backend:** mock
**Locales:** he, en

---

### BF-20 — Pricing settings page — access guard

**Personas:** conservatorium_admin (with newFeaturesEnabled), site_admin, student
**Steps:**
1. Navigate to `/dashboard/settings/pricing` as conservatorium_admin with `newFeaturesEnabled = true`
2. Navigate as student

**Expected:**
- Admin + newFeaturesEnabled: PricingSettings component renders
- Student or newFeaturesEnabled=false: page renders nothing (returns null)
- No redirect to /403 — just hidden (check this is intentional)

**DB Backend:** mock
**Stubs:** `newFeaturesEnabled` flag from useAuth

---

### BF-21 — Cancellation policy settings — access guard

**Personas:** conservatorium_admin (newFeaturesEnabled), site_admin, student
**Steps:**
1. Navigate to `/dashboard/settings/cancellation`

**Expected:**
- Admin + newFeaturesEnabled: CancellationPolicySettings renders with title
- Others: returns null

**DB Backend:** mock

---

### BF-22 — Aid application wizard — 3-step submission

**Personas:** student, parent
**Preconditions:** User navigates to aid application
**Steps:**
1. Navigate to `/dashboard/apply-for-aid`
2. Fill step 1 (personal details)
3. Click Next → fill step 2 (financial info)
4. Click Next → review step 3
5. Click Submit

**Expected:**
- 3-step stepper visible with indicators
- Each Next/Back button works correctly
- Submit triggers loading spinner (1.5s)
- Success state shows green checkmark, "Request Received" heading
- Toast fires with success message
- `addScholarshipApplication({})` called
- "Back to Dashboard" button navigates to `/dashboard`

**DB Backend:** mock
**Locales:** he, en, ar, ru
**Mock Data:** `addScholarshipApplication` in useAuth
**Stubs:** setTimeout simulates API call

---

### BF-23 — Aid application wizard — public route

**Personas:** anonymous
**Steps:**
1. Navigate to `/en/apply-for-aid` (public, not dashboard)
2. Navigate to `/apply-for-aid` (he default)

**Expected:**
- Page renders without auth
- AidApplicationWizard component shown
- Same 3-step wizard behavior

**DB Backend:** mock
**Locales:** he, en

---

### BF-24 — Admin scholarships — approve application

**Personas:** conservatorium_admin
**Preconditions:** Scholarship application with status SUBMITTED in mock data
**Steps:**
1. Navigate to `/dashboard/admin/scholarships`
2. Find SUBMITTED application row
3. Click "Approve"

**Expected:**
- Loading spinner on button during processing
- `updateScholarshipStatus(appId, 'APPROVED')` called
- Toast: approve success message
- Badge updates to APPROVED (green)
- Approve button disabled after approval (status no longer SUBMITTED/UNDER_REVIEW/DOCUMENTS_PENDING)

**DB Backend:** mock
**Mock Data:** scholarshipApplications with status SUBMITTED, conservatoriumId matching admin

---

### BF-25 — Admin scholarships — reject application

**Personas:** conservatorium_admin
**Steps:**
1. Find non-REJECTED application, click "Reject"

**Expected:**
- `updateScholarshipStatus(appId, 'REJECTED')` called
- Badge updates to REJECTED (red)
- Toast success
- Reject button disabled after rejection

**DB Backend:** mock

---

### BF-26 — Admin scholarships — mark paid

**Personas:** conservatorium_admin
**Preconditions:** Application with status APPROVED and paymentStatus != PAID
**Steps:**
1. Find APPROVED application, click "Mark Paid"

**Expected:**
- `markScholarshipAsPaid(appId)` called
- "Paid" badge appears on row
- Mark Paid button disabled after payment

**DB Backend:** mock
**Mock Data:** Application with status APPROVED, paymentStatus not PAID

---

### BF-27 — Admin scholarships — add donation cause

**Personas:** conservatorium_admin
**Steps:**
1. Navigate to `/dashboard/admin/scholarships`
2. Scroll to "Cause Settings" section
3. Fill: nameHe, nameEn, descriptionHe, descriptionEn, category = financial_aid, targetAmount = 10000
4. Submit

**Expected:**
- Form validates required fields (min 2 chars)
- `addDonationCause` called with correct payload
- Toast "Cause added successfully"
- Form resets
- New cause card appears in grid

**DB Backend:** mock
**Mock Data:** donationCauses list

---

### BF-28 — Instrument rental — create rental (OTP signature link)

**Personas:** conservatorium_admin
**Preconditions:** Available instrument in inventory, student with parentId in mock data
**Steps:**
1. Navigate to `/dashboard/admin/rentals`
2. Click rent button on available instrument
3. Fill: select student, choose rentalModel = deposit, set dates and amounts
4. Click "Send for Signature"

**Expected:**
- Student selector populated with approved students
- Parent ID automatically looked up from selected student
- OTP/signature link displayed in dialog or sent (toast confirmation)
- `initiateInstrumentRental` called with correct payload
- Instrument status changes to RENTED in inventory tab

**DB Backend:** mock
**Mock Data:** instrumentInventory items, students with parentId set
**Stubs:** OTP/signature delivery (toast only in mock)

---

### BF-29 — Instrument rental — return instrument

**Personas:** conservatorium_admin
**Preconditions:** Active rental in mock data
**Steps:**
1. Navigate to `/dashboard/admin/rentals` → Rentals tab
2. Find active rental, click "Return" action

**Expected:**
- Rental status changes from ACTIVE to RETURNED
- Instrument condition can be updated on return
- Inventory item becomes available again

**DB Backend:** mock
**Mock Data:** Active InstrumentRental records

---

### BF-30 — Instrument rental — inventory tab renders

**Personas:** conservatorium_admin
**Steps:**
1. Navigate to `/dashboard/admin/rentals`
2. Click Inventory tab

**Expected:**
- Table shows all instruments with condition badges
- Condition badges: EXCELLENT (green), GOOD (blue), FAIR (yellow), NEEDS_REPAIR (red), RETIRED (gray)
- Edit/Delete actions available per row
- "Add Instrument" button visible

**DB Backend:** mock
**Mock Data:** instrumentInventory records

---

### BF-31 — CardCom webhook — valid HMAC success payload

**Personas:** system (API call)
**Preconditions:** `CARDCOM_WEBHOOK_SECRET` env var set; invoice exists in DB
**Steps:**
1. POST to `/api/cardcom-webhook` with:
   - Body: `ReturnValue={invoiceId}&ResponseCode=0&InternalDealNumber=TX123&NumOfPayments=1`
   - `x-cardcom-signature`: valid HMAC-SHA256 of raw body using secret

**Expected:**
- HTTP 200 `{ received: true, status: 'payment_processed' }`
- Invoice status updated to PAID
- `paidAt` timestamp set
- `cardcomTransactionId` saved as `TX123`
- Installments undefined for NumOfPayments=1
- Notifications dispatched (log line)
- PDF generation attempted

**DB Backend:** mock + postgres (both should work)
**Stubs:** CARDCOM_WEBHOOK_SECRET env var in test environment

---

### BF-32 — CardCom webhook — invalid HMAC returns 401

**Steps:**
1. POST to `/api/cardcom-webhook` with body and wrong `x-cardcom-signature`

**Expected:**
- HTTP 401 `{ error: 'Invalid signature' }`
- Invoice NOT updated

---

### BF-33 — CardCom webhook — missing signature header

**Steps:**
1. POST with valid body but no `x-cardcom-signature` header

**Expected:**
- HTTP 401 `{ error: 'Missing signature' }`

---

### BF-34 — CardCom webhook — failed payment

**Steps:**
1. POST with valid HMAC; body: `ReturnValue={invoiceId}&ResponseCode=1`

**Expected:**
- HTTP 200 `{ received: true, status: 'payment_failed' }`
- Invoice status updated to OVERDUE
- Invoice NOT marked PAID

---

### BF-35 — CardCom webhook — missing invoiceId

**Steps:**
1. POST with valid HMAC; body has no `ReturnValue` field

**Expected:**
- HTTP 400 `{ error: 'Missing invoice reference' }`

---

### BF-36 — CardCom webhook — GET ping

**Steps:**
1. GET `/api/cardcom-webhook`

**Expected:**
- HTTP 200 `{ status: 'ok', handler: 'cardcom-webhook' }`
- `Cache-Control: no-store`

---

### BF-37 — Playing school billing redirect

**Personas:** conservatorium_admin
**Steps:**
1. Navigate to `/dashboard/admin/playing-school/billing`

**Expected:**
- Redirected to `/dashboard/admin/playing-school`
- No content rendered on billing sub-route

---

### BF-38 — Makeup credit balance on billing page

**Personas:** student
**Preconditions:** Student has makeup credits (cancelled lessons converted to credits)
**Steps:**
1. Navigate to `/dashboard/billing`

**Expected:**
- "Makeup Credits" card visible
- Credit balance (number) displayed prominently (large text)
- "Manage Makeups" link navigates to `/dashboard/makeups`

**DB Backend:** mock
**Mock Data:** Completed lessons with makeup credits in `getMakeupCreditBalance`

---

### BF-39 — Package expiry warning notice

**Personas:** student
**Preconditions:** Package has `validUntil` within next 14 days
**Steps:**
1. Navigate to `/dashboard/billing`

**Expected:**
- Red/critical Notice banner visible at top of billing content
- Shows days remaining and expiry date
- "Renew Now" link visible inside notice

**DB Backend:** mock
**Mock Data:** Package with `validUntil` = today + 7 days

---

### BF-40 — RTL layout billing pages

**Personas:** student (he), parent (ar)
**Steps:**
1. Navigate to `/he/dashboard/billing`
2. Navigate to `/ar/dashboard/billing`

**Expected:**
- `dir="rtl"` on root container
- Table column alignment logical (text-start = right in RTL)
- Buttons have `ms-`/`me-` spacing (not `ml-`/`mr-`)
- VAT label in Hebrew: "כולל מע״מ" / Arabic: "شامل ضريبة القيمة المضافة"
- Invoice number column in monospace, readable RTL

**DB Backend:** mock
**Locales:** he, ar

---

## Mock Data Requirements

| Entity | Required Records |
|--------|-----------------|
| Users | student-user-1 (active package), parent-user-1 (childIds), teacher-user-1 (lessons in 2026-03), conservatorium_admin (admin-user) |
| Packages | PACK_5 + PACK_10 + MONTHLY for cons-15; at least one with `validUntil` in 14 days; one with `isPremium: true` |
| Invoices | Mixed: 2× PAID, 1× SENT, 1× OVERDUE; all with `payerId = student-user-1`; `invoiceNumber`, `total = 450` |
| PlayingSchool Invoices | 1× PAID, 1× PENDING for student-user-1 |
| Scholarships | 1× SUBMITTED, 1× APPROVED (paymentStatus != PAID) for cons-15 |
| DonationCauses | 2 active causes for cons-15 |
| InstrumentInventory | 2 items: 1 AVAILABLE, 1 RENTED |
| InstrumentRentals | 1 ACTIVE rental for student-user-3 |
| Lessons | 3 COMPLETED + 1 CANCELLED_TEACHER for teacher-user-1 in March 2026 |

---

## DB Backend Matrix

| Scenario | mock | postgres | supabase | pocketbase |
|----------|------|----------|----------|------------|
| BF-01 to BF-10 (UI billing) | P1 | P2 | P3 | skip |
| BF-11 to BF-14 (admin payroll/finance) | P1 | P2 | P3 | skip |
| BF-15 to BF-21 (settings) | P1 | P2 | skip | skip |
| BF-22 to BF-27 (scholarships) | P1 | P2 | skip | skip |
| BF-28 to BF-30 (rentals) | P1 | P2 | skip | skip |
| BF-31 to BF-36 (webhook API) | P1 mock | P1 postgres | P2 | skip |
| BF-37 to BF-40 (misc UI) | P1 | skip | skip | skip |

---

## Stubs & Test Helpers

### CardCom Webhook Test Helper
```ts
// tests/helpers/cardcom-stub.ts
import { createHmac } from 'crypto';

export function buildCardcomPayload(secret: string, fields: Record<string, string>) {
  const body = new URLSearchParams(fields).toString();
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  return { body, sig };
}
```

### VAT Calculation Assertions
```ts
// Expected values for VAT = 18%
// addVAT(450) => 531
// addVAT(500) => 590
// addVAT(320) => 378
// Note: vat.ts uses VAT_RATE = 0.18 (changed from 0.17 in Jan 2025)
```

### Invoice PDF Assertions
```ts
// GET /api/invoice-pdf/{id}
// Content-Type: text/html; charset=utf-8
// Body contains: 'חשבונית תשלום', invoiceNumber, payerName, 'שולם' status badge
```

---

## Known Gaps & TODOs

1. **`cancelPackageAction` always returns `withinCoolingOff: true`** — real date comparison not implemented. BF-07 cannot be properly tested until this is fixed. Add a `purchasedAt` field to packages.
2. **Parent billing page uses hardcoded MOCK_INVOICES** — `parent-payment-panel.tsx` does not use `useAuth().invoices`. Real integration pending.
3. **CardCom webhook secret** — tests require `CARDCOM_WEBHOOK_SECRET` in `.env.test`. Add to CI secrets.
4. **PDF generation in webhook** — `generateInvoicePdf` is imported dynamically. Test in isolation; mock the import in unit tests.
5. **Installment payments** — `NumOfPayments > 1` path in webhook not tested by existing specs.
6. **Pricing settings page** — `newFeaturesEnabled` flag not exposed in test environment; verify default value.
7. **Package upgrade dialog** — currently shows hardcoded prices (₪450, ₪850, ₪320), not driven by `lessonPackages` data. Test may fail if prices change.
8. **Admin scholarships search** — Search input is present but filtering not wired (no onChange handler visible). Mark as TODO in test.
