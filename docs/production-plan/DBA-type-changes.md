# DBA Type Changes — Proposed Modifications to `src/lib/types.ts`

> These changes are required before the Firestore schema can be considered production-ready.
> DBA does NOT modify `types.ts` directly — Backend team should apply these changes.

---

## 1. Package Interface (line ~826)

**Problem:** `Package` lacks `conservatoriumId` (cannot enforce tenant isolation in Firestore) and `installments` (required for Cardcom payment plans).

**Current:**
```typescript
export type Package = {
  id: string;
  studentId?: string;
  type: PackageType;
  title: string;
  description: string;
  totalCredits?: number;
  usedCredits?: number;
  price: number;
  paymentStatus?: PaymentStatus;
  validFrom?: string;
  validUntil?: string;
};
```

**Proposed:**
```typescript
export type Package = {
  id: string;
  conservatoriumId: string;        // ADDED: Required for tenant isolation in Firestore
  studentId?: string;
  type: PackageType;
  title: string;
  description: string;
  totalCredits?: number;
  usedCredits?: number;
  price: number;
  paymentStatus?: PaymentStatus;
  validFrom?: string;
  validUntil?: string;
  installments?: InstallmentOption; // ADDED: Link to installment plan (SDD-P4)
  createdAt?: string;              // ADDED: Audit trail
  updatedAt?: string;              // ADDED: Audit trail
};
```

---

## 2. Invoice Interface (line ~842)

**Problem:** Invoice is too minimal for Israeli billing requirements. Missing VAT (17%), discounts, payment method tracking, installment plan, and PDF URL.

**Current:**
```typescript
export type Invoice = {
  id: string;
  invoiceNumber: string;
  conservatoriumId: string;
  payerId: string;
  lineItems: { description: string; total: number; }[];
  total: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
};
```

**Proposed:**
```typescript
export type Invoice = {
  id: string;
  invoiceNumber: string;
  conservatoriumId: string;
  payerId: string;
  lineItems: {
    description: string;
    quantity: number;             // ADDED
    unitPrice: number;           // ADDED
    total: number;
  }[];
  subtotal: number;              // ADDED: Sum of line items before discounts
  discounts: {                   // ADDED: Applied discounts
    type: string;                // e.g., 'sibling', 'pack10', 'scholarship'
    amount: number;
    description?: string;
  }[];
  vatRate: number;               // ADDED: 17% Israeli VAT (0.17)
  vatAmount: number;             // ADDED: Calculated VAT
  total: number;                 // Final total including VAT
  paidAmount: number;            // ADDED: Amount paid so far (for partial payments)
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'CARDCOM'; // ADDED
  installments?: {               // ADDED: Installment plan details
    count: number;
    monthlyAmount: number;
    paidInstallments: number;
    nextPaymentDate?: string;
  };
  pdfUrl?: string;               // ADDED: Firebase Storage URL for generated PDF
  cardcomTransactionId?: string;  // ADDED: For reconciliation with Cardcom
  issuedAt?: string;             // ADDED: When invoice was issued
  createdAt?: string;            // ADDED: Audit trail
  updatedAt?: string;            // ADDED: Audit trail
};
```

---

## 3. PracticeLog Interface (line ~854)

**Problem:** Missing `conservatoriumId` — required for sub-collection scoping in Firestore.

**Note:** The `conservatoriumId` field already exists as optional (`conservatoriumId?: string`). It should be made **required** for Firestore documents but can remain optional in the TypeScript type since legacy/mock data may not have it.

---

## 4. FormSubmission Interface (line ~625)

**Note:** `conservatoriumId` is already present as optional. For Firestore tenant isolation, every document must have `conservatoriumId` set. The Cloud Function that creates form submissions should enforce this.

---

## 5. Room Interface (line ~979)

**Status:** Already has `conservatoriumId: string` and `branchId: string`. No changes needed.

---

## 6. LessonSlot Interface (line ~791)

**Status:** Already has `conservatoriumId: string`. No changes needed.

---

## 7. MakeupCredit Interface (line ~771)

**Status:** Already has `conservatoriumId: string`. No changes needed.

---

## Summary of Required Changes

| Interface | Field(s) to Add | Priority | Reason |
|-----------|-----------------|----------|--------|
| `Package` | `conservatoriumId` (required) | **Blocking** | Firestore tenant isolation |
| `Package` | `installments`, `createdAt`, `updatedAt` | High | Cardcom integration, audit |
| `Invoice` | `subtotal`, `discounts`, `vatRate`, `vatAmount` | **Blocking** | Israeli billing law |
| `Invoice` | `paidAmount`, `paymentMethod`, `installments` | **Blocking** | Payment tracking |
| `Invoice` | `pdfUrl`, `cardcomTransactionId`, timestamps | High | PDF generation, reconciliation |
| `Invoice.lineItems` | `quantity`, `unitPrice` | High | Proper line item detail |
| `PracticeLog` | Make `conservatoriumId` required in Firestore | Medium | Tenant scoping |

---

## Impact on DatabaseAdapter

The `DatabaseAdapter` interface in `src/lib/db/types.ts` does not need changes for these type modifications — the repositories use generic `ScopedRepository<T>` which will pick up the type changes automatically.

However, the `PostgresAdapter` SQL schema will need corresponding column additions (see DBA-schema-report.md for details).