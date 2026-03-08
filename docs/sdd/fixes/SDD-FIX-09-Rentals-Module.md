# SDD-FIX-09: Rentals Module — RTL, Remote Signature & Billing Models

**PDF Issue:** #12  
**Priority:** P1

---

## 1. Overview

Issues in the Rentals (השאלת כלים) module:
1. RTL layout bugs.
2. Parent signature collected on admin screen — must be sent to parent's device instead.
3. Billing options missing: deposit vs. monthly rental fee, purchase option.

---

## 2. RTL Fix

Apply the same RTL pattern from SDD-FIX-01 to the rentals page:
- Page title: `text-start`
- Table: logical CSS column alignment
- `dir={isRtl ? 'rtl' : 'ltr'}` on the page root

---

## 3. Remote Parent Signature Flow

### Problem
Currently the admin can sign a rental agreement on behalf of the parent from the admin screen — this is legally invalid and operationally wrong.

### New Flow

**Step 1 — Admin initiates rental**
Admin fills: instrument, student, deposit amount, rental fee, start date.
Clicks "Send for Parent Signature" (not "Sign").

**Step 2 — Notification sent to parent**
System sends:
- Push notification to parent's app: "Instrument rental request awaiting your signature"
- WhatsApp/SMS message with a unique signing link

**Step 3 — Parent signs**
Parent opens the link (works on mobile browser, no login required beyond phone OTP verification).
Parent sees the rental terms, instrument details, fees.
Parent draws e-signature or clicks "I confirm and agree".

**Step 4 — Confirmation**
Admin receives notification: "Parent [name] has signed the rental agreement for [instrument]."
Rental status changes from `pending_signature` → `active`.

### Data Model

```typescript
interface InstrumentRental {
  id: string;
  conservatoriumId: string;
  instrumentId: string;
  studentId: string;
  parentId: string;
  
  rentalModel: 'deposit' | 'monthly' | 'rent_to_own';
  depositAmountILS?: number;          // for 'deposit' model
  monthlyFeeILS?: number;             // for 'monthly' and 'rent_to_own'
  purchasePriceILS?: number;          // for 'rent_to_own'
  monthsUntilPurchaseEligible?: number; // for 'rent_to_own'
  
  startDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  
  status: 'pending_signature' | 'active' | 'returned' | 'overdue' | 'purchased';
  
  signingToken: string;               // unique URL token
  parentSignedAt?: string;
  parentSignatureUrl?: string;        // stored signature image
  
  condition: 'excellent' | 'good' | 'fair' | 'damaged';
  notes?: string;
}
```

### Signing Page

**Route:** `/rental-sign/[token]` (public, no auth — OTP protected)

```tsx
// src/app/[locale]/rental-sign/[token]/page.tsx
export default async function RentalSignPage({ params }) {
  const rental = await getRentalByToken(params.token);
  
  if (!rental || rental.status !== 'pending_signature') {
    return <ExpiredTokenPage />;
  }
  
  return <RentalSigningFlow rental={rental} />;
}
```

Signing flow steps:
1. Phone OTP verification (parent's phone)
2. Display rental terms (instrument, fees, duration, damage policy)
3. Signature pad (canvas-based, mobile-friendly)
4. Confirmation

---

## 4. Billing Models

### 4.1 Deposit Model
- Parent pays a one-time refundable deposit.
- On instrument return in good condition → automatic refund initiated.
- On damage → partial or no refund, with damage assessment by admin.

### 4.2 Monthly Rental Model
- Parent pays a monthly fee (charged to their payment method on file).
- No deposit required.
- Rental continues until cancelled by parent or admin.

### 4.3 Rent-to-Own Model
- Monthly fee applies for N months.
- After N months, parent can purchase the instrument for `purchasePriceILS`.
- System sends notification when eligible for purchase.

### 4.4 Admin Configuration per Instrument

```tsx
// In "Add Instrument to Rental Fleet" form:
<div className="space-y-4">
  <FormField name="rentalModelsOffered" label={t('Rentals.modelsOffered')}>
    <CheckboxGroup
      options={[
        { value: 'deposit', label: t('Rentals.modelDeposit') },
        { value: 'monthly', label: t('Rentals.modelMonthly') },
        { value: 'rent_to_own', label: t('Rentals.modelRentToOwn') },
      ]}
    />
  </FormField>
  
  <FormField name="depositAmountILS" label={t('Rentals.depositAmount')} type="number" />
  <FormField name="monthlyFeeILS" label={t('Rentals.monthlyFee')} type="number" />
  <FormField name="purchasePriceILS" label={t('Rentals.purchasePrice')} type="number" />
  <FormField name="monthsUntilPurchase" label={t('Rentals.monthsUntilPurchase')} type="number" />
</div>
```

---

## 5. Return & Refund

When admin marks instrument as returned:
1. Admin selects condition (excellent/good/fair/damaged).
2. System calculates refund:
   - Excellent/Good → full deposit refund
   - Fair → partial refund (configurable %, default 70%)
   - Damaged → 0% or custom amount
3. Admin confirms refund amount.
4. Refund initiated via payment gateway (future) or manual note created.

---

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Admin opens Rentals in Hebrew | Page title RTL, table aligned correctly |
| 2 | Admin creates new rental | "Send for Signature" button — no "Sign here" on admin screen |
| 3 | Parent receives SMS/WhatsApp | Contains signing link |
| 4 | Parent opens signing link | OTP verified → terms → signature pad |
| 5 | Parent signs | Admin notified, rental status → active |
| 6 | Admin selects "Monthly" model | Monthly fee field shown, deposit field hidden |
| 7 | Rent-to-own: N months elapsed | Notification sent to parent about purchase option |
| 8 | Instrument returned in "Good" condition | Full refund calculated automatically |
