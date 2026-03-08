# Scholarship Actions Plan

## 1. Current ScholarshipApplication Type (src/lib/types.ts ~line 1294)

```ts
export type ApplicationStatus =
  | 'DRAFT' | 'SUBMITTED' | 'DOCUMENTS_PENDING' | 'UNDER_REVIEW'
  | 'APPROVED' | 'PARTIALLY_APPROVED' | 'WAITLISTED' | 'REJECTED' | 'EXPIRED';

export type ScholarshipPaymentStatus = 'UNPAID' | 'PAID';

export type ScholarshipApplication = {
  id: string;
  studentId: string;
  studentName: string;
  instrument: string;
  conservatoriumId: string;
  academicYear: string;
  status: ApplicationStatus;
  submittedAt: string;       // ISO timestamp
  priorityScore: number;
  approvedAt?: string;
  rejectedAt?: string;
  paymentStatus?: ScholarshipPaymentStatus;
  paidAt?: string;
};
```

**Missing fields (compared to schema.sql):** `amount_ils` (requested amount), `approved_by` (admin user ID), `reason`.
The schema.sql scholarship_applications table allows statuses: `PENDING | APPROVED | REJECTED | PAID` (simpler than the TypeScript union).

## 2. What Buttons Are Stubs on the Admin Scholarships Page

`src/app/[locale]/dashboard/admin/scholarships/page.tsx` has three action buttons per row plus two header buttons:

| Button | Current state |
|---|---|
| **Approve** | Calls `updateScholarshipStatus(id, 'APPROVED')` from `useAuth()` — fully wired |
| **Reject** | Calls `updateScholarshipStatus(id, 'REJECTED')` — wired but **no rejection reason UI** |
| **Mark as Paid** | Calls `markScholarshipAsPaid(id)` — wired but **no amount input** |
| **Export Donations** | `<Button variant="outline">` with no `onClick` — **complete stub** |
| **Add Manual Donation** | `<Button>` with no `onClick` — **complete stub** |

Notes:
- Approve / Reject / Mark Paid fire through to real server actions (`updateScholarshipStatusAction`, `markScholarshipPaidAction`) and the mock adapter. The paths work end-to-end.
- Reject drops any reason string — the type has `rejectedAt` but no `rejectionReason` field.
- Mark Paid does not record the disbursed amount — no `approvedAmount` concept exists yet.

## 3. New Server Actions to Add (src/app/actions.ts)

### 3a. `rejectScholarshipAction(applicationId, reason)`

```ts
const RejectScholarshipSchema = z.object({
  applicationId: z.string(),
  reason: z.string().min(1).max(500),
});

export const rejectScholarshipAction = withAuth(
  RejectScholarshipSchema,
  async ({ applicationId, reason }) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    const db = await getDb();
    const existing = await db.scholarships.findById(applicationId);
    if (!existing) return { success: false as const, reason: 'not_found' as const };
    const updated = await db.scholarships.update(applicationId, {
      status: 'REJECTED',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
    } as any);
    return { success: true as const, scholarship: updated };
  }
);
```

### 3b. `processScholarshipPaymentAction(applicationId, amount)`

```ts
const ProcessPaymentSchema = z.object({
  applicationId: z.string(),
  amount: z.number().positive(),
});

export const processScholarshipPaymentAction = withAuth(
  ProcessPaymentSchema,
  async ({ applicationId, amount }) => {
    await requireRole(['conservatorium_admin', 'delegated_admin', 'site_admin']);
    const db = await getDb();
    const existing = await db.scholarships.findById(applicationId);
    if (!existing) return { success: false as const, reason: 'not_found' as const };
    if (existing.status !== 'APPROVED') return { success: false as const, reason: 'not_approved' as const };
    const updated = await db.scholarships.update(applicationId, {
      paymentStatus: 'PAID',
      paidAt: new Date().toISOString(),
      approvedAmount: amount,
    } as any);
    return { success: true as const, scholarship: updated };
  }
);
```

The existing `approveScholarship` path (`updateScholarshipStatusAction({ applicationId, status: 'APPROVED' })`) can remain as-is unless partial-approval amounts are needed; if so, extend its Zod schema with `approvedAmount?: z.number().positive().optional()`.

## 4. Type Changes: Add to ScholarshipApplication (src/lib/types.ts)

```ts
export type ScholarshipApplication = {
  // ... all existing fields unchanged ...
  requestedAmountILS?: number;  // ADD: what the student is asking for
  rejectionReason?: string;     // ADD: free-text reason stored when admin rejects
  approvedAmount?: number;      // ADD: ILS actually disbursed (may differ from requested)
};
```

**schema.sql migration (migration-safe ALTER TABLE):**

```sql
ALTER TABLE scholarship_applications
  ADD COLUMN IF NOT EXISTS requested_amount_ils NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_amount_ils NUMERIC(10,2);
```

## 5. Mock DB Adapter Changes (src/lib/db/adapters/shared.ts)

No adapter code changes are required. The mock uses `createScopedRepository<ScholarshipApplication>(seed.scholarships, 'scholar')`. Its `.update(id, partial)` method merges any partial onto the stored record, so new fields on the TypeScript type are automatically handled in-memory. `MemorySeed.scholarships` already holds `ScholarshipApplication[]` — new optional fields will be undefined for seed data, which is correct.

## 6. useAuth Mutations to Add (src/hooks/use-auth.tsx)

Add two mutations to `AuthContextType`:

```ts
rejectScholarship: (applicationId: string, reason: string) => void;
processScholarshipPayment: (applicationId: string, amount: number) => void;
```

Implementation mirrors the existing `updateScholarshipStatus` pattern:
1. Optimistic `setMockScholarshipApplications` with new field values.
2. Fire-and-forget async call to the new server action.
3. On success, replace optimistic entry with the server-returned record (handles clock/ID sync).

Import the new actions at the top of use-auth.tsx alongside the existing imports:
```ts
import { ..., rejectScholarshipAction, processScholarshipPaymentAction } from '@/app/actions';
```

## 7. UI Wiring Pattern (src/app/[locale]/dashboard/admin/scholarships/page.tsx)

### Reject with reason dialog:

Replace the `handleReject(id)` inline handler with a two-step flow:
1. Clicking Reject sets `rejectTarget` state and opens a Dialog.
2. Dialog contains a `<Textarea>` bound to `rejectReason` state.
3. Confirm calls `rejectScholarship(rejectTarget, rejectReason)`.

```tsx
const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
const [rejectTarget, setRejectTarget] = useState<string | null>(null);
const [rejectReason, setRejectReason] = useState('');

const openRejectDialog = (id: string) => {
  setRejectTarget(id);
  setRejectDialogOpen(true);
};
const confirmReject = async () => {
  if (!rejectTarget) return;
  setProcessingId(rejectTarget);
  try {
    await rejectScholarship(rejectTarget, rejectReason);
    toast({ description: t('rejectedSuccess') });
  } catch {
    toast({ description: t('actionError'), variant: 'destructive' });
  } finally {
    setProcessingId(null);
    setRejectDialogOpen(false);
    setRejectTarget(null);
    setRejectReason('');
  }
};
```

### Process payment with amount dialog:

Replace `handleMarkPaid(id)` similarly, with a Dialog containing a `<Input type="number">` for the ILS amount. On confirm, call `processScholarshipPayment(id, amount)`.

Both dialogs should use the standard shadcn `<Dialog>` / `<DialogContent>` components, consistent with other dialogs in the codebase (see `assign-repertoire-dialog.tsx` for reference).

## 8. Translation Keys

### New keys in `AdminScholarships` namespace (add to all 4 locale files)

| Key | en | he | ar | ru |
|---|---|---|---|---|
| `rejectDialogTitle` | "Reject Application" | "דחיית בקשת מלגה" | "رفض الطلب" | "Отклонить заявку" |
| `rejectReasonLabel` | "Rejection reason" | "סיבת הדחייה" | "سبب الرفض" | "Причина отклонения" |
| `rejectReasonPlaceholder` | "Explain why this application is being rejected..." | "הסבר מדוע הבקשה נדחית..." | "اشرح سبب رفض هذا الطلب..." | "Объясните, почему заявка отклоняется..." |
| `rejectConfirm` | "Reject Application" | "דחה בקשה" | "رفض الطلب" | "Отклонить заявку" |
| `paymentDialogTitle` | "Process Payment" | "עיבוד תשלום מלגה" | "معالجة الدفع" | "Обработать платёж" |
| `paymentAmountLabel` | "Payment amount (ILS)" | "סכום התשלום (₪)" | "مبلغ الدفع (₪)" | "Сумма платежа (₪)" |
| `paymentConfirm` | "Process Payment" | "עבד תשלום" | "معالجة الدفع" | "Обработать платёж" |
| `approvedAmountBadge` | "Paid: ₪{amount}" | "שולם: ₪{amount}" | "تم الدفع: ₪{amount}" | "Выплачено: ₪{amount}" |
| `paymentSuccess` | "Scholarship payment processed." | "תשלום המלגה עובד בהצלחה." | "تمت معالجة دفع المنحة بنجاح." | "Платёж по стипендии обработан." |

### Files to edit in order:
1. `src/lib/types.ts` — add 3 fields to `ScholarshipApplication`
2. `src/app/actions.ts` — add `rejectScholarshipAction`, `processScholarshipPaymentAction`
3. `src/hooks/use-auth.tsx` — add `rejectScholarship`, `processScholarshipPayment` mutations; update `AuthContextType` interface; import new actions
4. `src/app/[locale]/dashboard/admin/scholarships/page.tsx` — add Dialog state; replace reject and mark-paid button handlers
5. `src/messages/{he,en,ar,ru}/admin.json` — add 9 new keys to `AdminScholarships` object
6. `scripts/db/schema.sql` — add 3 new columns with `ADD COLUMN IF NOT EXISTS`
