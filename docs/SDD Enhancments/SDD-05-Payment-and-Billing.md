# SDD-05: Payment, Packages & Billing

**Module:** 05  
**Dependencies:** Modules 01, 02, 04  
**Priority:** P0 — Revenue critical

---

## 1. Overview & Rationale

Music conservatoriums in Israel deal with a patchwork of payment methods: cash at the office, bank transfers with vague descriptions, monthly checks, and the ever-present "I'll pay next week." This module replaces all of that with a unified, automated billing system that handles every payment type, sends professional invoices, chases overdue payments automatically, and reconciles teacher payroll — all without admin intervention.

---

## 2. Package & Pricing Model

### 2.1 Package Types

| Type | Description | Recurring? | Slot Type |
|------|-------------|-----------|-----------|
| `TRIAL` | 1 lesson, no commitment | No | Ad-hoc |
| `PACK_5` | 5 lessons, flexible booking | No | Ad-hoc / flexible |
| `PACK_10` | 10 lessons, flexible booking | No | Ad-hoc / flexible |
| `MONTHLY` | ~4 lessons/month, recurring weekly slot | Monthly autopay | Recurring |
| `YEARLY` | ~40 lessons/year, reserved weekly slot | Annual or monthly autopay | Recurring reserved |
| `ADHOC_SINGLE` | Pay-per-session, no package | No | Ad-hoc pool |

### 2.2 Pricing Configuration

Pricing is configured per-conservatorium at `/admin/settings/pricing`:

```typescript
{
  conservatoriumId: string;
  instrument: Instrument;
  durationMinutes: 30 | 45 | 60;
  baseRatePerLesson: number;
  
  discounts: {
    pack5: number;           // e.g., 0.05 = 5% off
    pack10: number;          // e.g., 0.10 = 10% off
    yearly: number;          // e.g., 0.15 = 15% off
    sibling: number;         // e.g., 0.10 for 2nd child in same family
    earlyPayment: number;    // e.g., 0.05 for paying yearly upfront
  };
  
  adHocPremium: number;      // e.g., 0.15 = 15% premium on ad-hoc over pack rate
  trialPrice: number;        // fixed trial lesson price
}
```

### 2.3 Prorated Billing

If a student enrolls mid-month on a monthly subscription:
```
Prorated charge = (base monthly rate / lessons in month) × remaining lessons this month
```
Example: Monthly rate = ₪400 (4 lessons). Student enrolls on 22nd of the month with 2 lessons remaining.
Charge = ₪200 for the remainder, then full ₪400 from next month.

### 2.4 Sibling Discount

Families with multiple children enrolled automatically receive the configured sibling discount on the second and subsequent children. This is applied at invoice generation time.

---

## 3. Invoice Model

```typescript
{
  id: string;
  invoiceNumber: string;        // auto-incremented: CON-2025-00142
  conservatoriumId: string;
  payerId: string;              // Parent or adult Student
  
  lineItems: {
    description: string;        // e.g. "Piano lessons — March 2026 (4 lessons × ₪100)"
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
    relatedSlotIds?: string[];
  }[];
  
  subtotal: number;
  discounts: number;
  vatAmount: number;            // 17% Israeli VAT
  total: number;
  
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  dueDate: Date;
  paidAt?: Date;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  
  pdfUrl?: string;              // stored in Firebase Storage
  createdAt: Timestamp;
}
```

---

## 4. Payment Gateway Integration

### 4.1 Supported Gateways

Primary: **Cardcom** (widely used in Israel, supports recurring charges, installments)  
Secondary: **Tranzila** (backup, widely trusted in Israeli market)

### 4.2 Payment Methods Accepted

| Method | One-Time | Recurring | Notes |
|--------|----------|-----------|-------|
| Credit Card (Visa/MC) | ✅ | ✅ | Via Cardcom token |
| Debit Card | ✅ | ✅ | |
| Bank Transfer (העברה בנקאית) | ✅ | ❌ | Manual confirmation by admin |
| Cash | ✅ | ❌ | Admin marks as paid manually |
| Installments (תשלומים) | ✅ | N/A | Israeli-specific: 1–12 installments |
| Phone Payment | ✅ | ❌ | QR code that opens payment page |

### 4.3 Card-on-File (Token) System

For monthly and yearly subscriptions:
- Card details are tokenized at first payment (PCI-DSS compliant via Cardcom)
- System stores only the token, last 4 digits, and expiry
- Future charges use the token — no re-entry required
- Parent/student can update card at any time at `/dashboard/billing`
- Card expiry warnings sent 30 days before expiry

### 4.4 Phone Payment for Low-Tech Users

For less tech-savvy parents, the admin or teacher can:
1. Generate a payment QR code or short link from the admin panel
2. Share via WhatsApp
3. Parent opens link on mobile → enters card details in a simple mobile-optimized form
4. No account login required for this step

---

## 5. Billing Automation

### 5.1 Monthly Subscription Auto-Charge

On the 1st of each month (Cloud Function, scheduled):
1. Fetch all active monthly subscriptions due for renewal
2. For each: attempt charge via stored card token
3. On success: generate invoice PDF → email to parent → mark lessons as booked
4. On failure: mark as `PAYMENT_FAILED` → trigger reminder flow (see 5.3)

### 5.2 Invoice Generation Rules

| Trigger | Invoice Type | Auto-Sent? |
|---------|-------------|-----------|
| Monthly subscription renewal | Monthly subscription invoice | ✅ Auto |
| Package purchase | Package purchase invoice | ✅ Auto |
| Trial lesson payment | Trial lesson receipt | ✅ Auto |
| Ad-hoc single session | Per-session receipt | ✅ Auto |
| Manual entry by admin | Any | Admin sends manually |
| Makeup credit used | Credit note / deduction | ✅ Auto on next invoice |

### 5.3 Overdue Payment Automation

| Days Overdue | Action |
|-------------|--------|
| 0 | Invoice sent |
| 3 | Gentle reminder email: "Just a friendly reminder..." |
| 7 | SMS reminder with payment link |
| 14 | Firm email warning + admin notified |
| 21 | Booking of new ad-hoc/makeup lessons suspended |
| 30 | Recurring slot at risk — admin prompted to review |

**Important:** Existing booked lessons are never automatically cancelled due to overdue payment. The system escalates to the admin for human decision-making on that step.

---

## 6. Credit & Refund System

### 6.1 Credit Types

```typescript
type CreditReason = 
  | 'TEACHER_CANCELLED'          // teacher cancelled — full credit
  | 'CONSERVATORIUM_HOLIDAY'     // institutional closure — full credit
  | 'STUDENT_CANCELLED_NOTICED'  // within cancellation policy — credit (not cash)
  | 'MAKEUP_USED'                // credit consumed by booking a makeup
  | 'PACKAGE_REFUND'             // admin-issued partial refund on unused pack
  | 'GOODWILL'                   // admin discretion
```

### 6.2 Credit Balance

Each student has a running credit balance:
```typescript
{
  studentId: string;
  balance: number;               // in credits (1 credit = 1 lesson)
  monetaryBalance?: number;      // for cash-equivalent credits
  transactions: CreditTransaction[];
}
```

Credits are automatically applied to the next invoice before charging the card.

### 6.3 Refund Policy (Admin-Configurable)

| Situation | Default Policy | Admin Overrideable? |
|-----------|---------------|---------------------|
| Teacher cancels | Full lesson credit | Yes |
| Student cancels with notice | Lesson credit (not cash) | Yes |
| Student cancels without notice | No refund | Yes (admin discretion) |
| Conservatorium closes | Full credit | No |
| Package unused at expiry | No refund | Yes |
| Student withdraws (mid-package) | Prorated credit for unused lessons | Yes |

---

## 7. Student/Parent Billing Dashboard

`/dashboard/billing`

- Current package status (credits remaining, expiry)
- Subscription status and next charge date
- Invoice history (all time) — each line downloadable as PDF
- Update payment method
- Pause subscription (once per year, up to 30 days — admin configurable)
- Cancel subscription (with confirmation and policy reminder)
- Credit balance display

---

## 8. Admin Financial Dashboard

`/admin/billing`

- Revenue summary: This month / Last month / YTD
- Outstanding invoices with one-click "Send reminder" per invoice
- Failed payments requiring attention
- Refund issuance interface
- Manual payment entry (cash/transfer)
- Export: monthly revenue report (CSV/Excel)

---

## 9. Tax & Compliance (Israeli Standards)

- All invoices are `חשבונית מס` (VAT invoice) or `קבלה` (receipt) depending on context
- VAT (מע"מ) calculated at current rate (17%)
- Invoices numbered sequentially per conservatorium (required by law)
- Annual revenue summary exportable for accounting (מאזן שנתי)
- For freelance teachers: system generates `חשבונית עצמאי` templates pre-filled with lesson data

---

## 10. UI Components Required

| Component | Route | Description |
|-----------|-------|-------------|
| `PackageSelector` | `/register`, `/dashboard` | Visual package comparison |
| `CheckoutForm` | `/checkout` | Cardcom-integrated payment form |
| `BillingDashboard` | `/dashboard/billing` | Student/parent billing overview |
| `InvoiceList` | `/dashboard/billing/invoices` | Downloadable invoice history |
| `AdminFinanceDashboard` | `/admin/billing` | Revenue overview + outstanding invoices |
| `CreditBalanceBadge` | Header/Dashboard | Remaining credits display |
| `PhonePaymentGenerator` | `/admin/payments/phone` | QR/link generator for phone payments |
| `OverduePaymentAlert` | Dashboard | Prominent alert for overdue balances |
