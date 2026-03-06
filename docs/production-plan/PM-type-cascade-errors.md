# PM Type Cascade Errors Report

**Date:** 2026-03-06
**Task:** Apply DBA type changes to Package and Invoice in `src/lib/types.ts`
**Author:** PM Agent

---

## Summary

The DBA's proposed type changes to `Package` and `Invoice` were applied by a concurrent agent before this task was executed. Upon verification, both interfaces now match the DBA specification in `docs/production-plan/DBA-type-changes.md` exactly.

## Changes Applied

### Package (line 826)
| Field | Change | Type |
|-------|--------|------|
| `conservatoriumId` | **Added (required)** | `string` |
| `installments` | **Added (optional)** | `InstallmentOption` |
| `createdAt` | **Added (optional)** | `string` |
| `updatedAt` | **Added (optional)** | `string` |

### Invoice (line 846)
| Field | Change | Type |
|-------|--------|------|
| `lineItems.quantity` | **Added (optional)** | `number` |
| `lineItems.unitPrice` | **Added (optional)** | `number` |
| `subtotal` | **Added (optional)** | `number` |
| `discounts` | **Added (optional)** | `{ type: string; amount: number; description?: string }[]` |
| `vatRate` | **Added (optional)** | `number` |
| `vatAmount` | **Added (optional)** | `number` |
| `paidAmount` | **Added (optional)** | `number` |
| `paymentMethod` | **Added (optional)** | `'CREDIT_CARD' \| 'BANK_TRANSFER' \| 'CASH' \| 'CHEQUE' \| 'CARDCOM'` |
| `installments` | **Added (optional)** | `{ count; monthlyAmount; paidInstallments; nextPaymentDate? }` |
| `pdfUrl` | **Added (optional)** | `string` |
| `cardcomTransactionId` | **Added (optional)** | `string` |
| `issuedAt` | **Added (optional)** | `string` |
| `createdAt` | **Added (optional)** | `string` |
| `updatedAt` | **Added (optional)** | `string` |

### InstallmentOption (line 1601)
Already existed with `count`, `monthlyAmount`, `totalAmount`, `installmentFee?`. No changes needed.

## TypeScript Cascade Analysis

**Command:** `tsc --noEmit`

**Result:** Zero cascading type errors from these changes.

**Errors found:** Only pre-existing `TS7016` warnings (13 instances) for missing `next` and `next/server` declaration files. These are unrelated to the type changes — they're a known issue with the Next.js 16 / TypeScript 5 setup where `@types/next` is not installed as a separate package.

### Why No Cascade Errors

1. **Package.conservatoriumId (required):** Mock data in `src/lib/data.ts` and `use-auth.tsx` creates Package objects from seed data that already populates `conservatoriumId` as part of the general `MemoryDatabaseAdapter` pattern. The mock adapter does not perform type-level validation on object construction, so existing code paths that create packages without `conservatoriumId` do not trigger TS errors (they would fail at runtime if strict checks were added).

2. **All Invoice fields are optional:** Because every new Invoice field was added with `?`, existing code that constructs `{ id, invoiceNumber, conservatoriumId, payerId, lineItems, total, status, dueDate }` remains type-valid. No existing code needs to be updated.

3. **lineItems expansion is optional:** `quantity?` and `unitPrice?` were added as optional fields to the inline type, so existing `{ description: string; total: number }` objects remain valid.

## Potential Runtime Issues (Not TypeScript Errors)

While there are no compile-time errors, the following runtime concerns should be addressed:

1. **Package.conservatoriumId required but mock data may not have it:** Any mock Package objects created without `conservatoriumId` will violate the type at runtime but not at compile time (since `data.ts` uses type assertions). The mock data generator should be updated to always include `conservatoriumId`.

2. **Invoice.subtotal/vatAmount calculation:** New Invoice fields like `subtotal`, `vatRate`, `vatAmount` are optional, but any production code that creates invoices should calculate and populate them. The invoice generation Cloud Function (when deployed) must handle this.

3. **Cardcom webhook handler** must populate `cardcomTransactionId` and `paymentMethod` when processing successful payments.

## Conclusion

The DBA type changes are cleanly applied with no cascading errors. The optional nature of the new fields ensures backward compatibility with existing mock data and UI code. Production code (Cloud Functions, FirebaseAdapter, Cardcom webhook) will need to populate these fields when creating/updating documents.
