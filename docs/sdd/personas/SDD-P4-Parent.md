# SDD-P4: Persona Audit — Parent
**Lyriosa 360° Architecture Audit**
**Persona:** Parent / Guardian (הורה / אפוטרופוס)
**Auditor Role:** Senior Full-Stack Architect + Trust & Payments Domain Expert
**Version:** 1.0 | **Date:** 2026-02-25

---

## 1. Executive Summary

The parent persona is Lyriosa's financial backbone and primary trust relationship. Parents write the checks, sign the forms, and make the call when something goes wrong. If they don't trust the system — with their credit card details, with their child's personal data, with the conservatorium's financial transparency — they will call the secretary instead of using the app, and Lyriosa's core value proposition fails.

The SDD covers the parent's journey reasonably well: package renewal, WhatsApp notifications, the Family Hub for progress visibility, and digital signatures for Ministry forms. However, the prototype contains a significant structural flaw that undermines all of this: **the payment system is entirely mocked**. There is no real Cardcom integration — `updateUserPaymentMethod` in `use-auth.tsx` simply stores `last4` and `expiry` in the mock user object. No token is created, no charge is made, no webhook is processed.

**What Is Good:**
- The sibling discount model (SDD-05 Section 2.4) is correctly specified — automatic application at invoice generation time based on `childIds` linkage.
- The notification catalog (SDD-07) covers all the parent-critical events: teacher sick leave, payment failure, makeup credit expiry, form approval. The channel preference model (WhatsApp / SMS / Email with quiet hours) is well thought out.
- The `PaymentMethod` type with `last4`, `expiryMonth`, `expiryYear`, and `isPrimary` is in the type system, suggesting the UI for card-on-file is partially built.
- The digital signature concept in the forms workflow (SDD-08, `requiresSignature` on workflow steps) is specified. The `approvalHistory[].signature` field exists in the model.
- The `mockScholarshipApplications` and `addScholarshipApplication` function in the auth hook show that the scholarship/aid application flow (SDD-17) has been partially wired.

**What Is Critically Missing:**
- **Real Cardcom Integration:** Zero lines of real payment code exist in the prototype. No Cardcom API calls, no webhook handler, no PCI-DSS token flow, no recurring charge scheduler.
- **WhatsApp Reliability:** SDD-07 specifies Twilio WhatsApp API but no Twilio integration code exists anywhere in the prototype. The notification catalog is a specification document, not an implementation.
- **Multi-Child Family Hub:** The `childIds` linkage exists in the User model, but there's no dedicated Family Hub UI that aggregates multiple children's schedules, balances, and progress in a single view.
- **Digital Signature Flow:** The `requiresSignature` flag exists in the form workflow model, but there's no signature capture component (canvas-based e-signature), no PDF embedding of the signature, and no legal timestamp/audit trail.
- **Installment Payments (תשלומים):** SDD-05 specifies 1–12 installment support, which is critical for the Israeli market. No implementation exists.

---

## 2. Functional Gap Analysis

### Gap 1: Cardcom Integration — The Most Critical Gap
**Severity:** Critical (P0 — no revenue without this)

The entire business model depends on collecting payments. The prototype doesn't process a single shekel. Cardcom is an Israeli payment gateway with specific integration patterns (hosted payment page, server-to-server token charging, recurring billing, and installment handling).

### Gap 2: WhatsApp Notification Delivery
**Severity:** High (P1)

In Israel, WhatsApp is the primary communication channel. Parents expect teacher cancellations to arrive on WhatsApp within minutes. Without Twilio integration, the system can't deliver on this promise.

### Gap 3: Digital Signature for Ministry Forms
**Severity:** High (P1 — compliance)

Ministry of Education forms require parent signatures. A digital signature (e-signature) component backed by a cryptographic timestamp and audit log is required for these to be legally valid.

### Gap 4: Multi-Child Family Hub
**Severity:** Medium (P1)

A parent with three children enrolled at the conservatorium needs to see all three schedules, balances, and upcoming events in one view. The current architecture supports this via `childIds` but no aggregated UI exists.

### Gap 5: Installment Payments
**Severity:** High (P1 for Israel market)

Israelis routinely pay in installments (תשלומים). A parent paying for a yearly subscription expects to split the ₪4,000+ cost across 10–12 monthly credit card installments. Without this, the yearly package becomes unaffordable for most families.

---

## 3. Actionable Technical Specifications

### 3.1 Cardcom Integration — Complete Implementation

**Architecture:** Cardcom hosted payment page with server-side token creation for recurring charges.

```typescript
// functions/src/payments/cardcom.ts

const CARDCOM_API_BASE = 'https://secure.cardcom.solutions/api/v11';
const CARDCOM_TERMINAL = process.env.CARDCOM_TERMINAL_NUMBER;
const CARDCOM_API_NAME = process.env.CARDCOM_API_NAME;

// Step 1: Create a payment page (hosted) for one-time or first recurring payment
export async function createCardcomPaymentPage(params: {
  amount: number;               // in agorot (multiply NIS × 100)
  installments?: number;        // 1–12, default 1
  description: string;
  invoiceId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  successUrl: string;
  failureUrl: string;
  conservatoriumId: string;
}): Promise<{ paymentUrl: string; lowProfileId: string }> {

  const body = {
    TerminalNumber: CARDCOM_TERMINAL,
    ApiName: CARDCOM_API_NAME,
    Amount: params.amount,
    NumOfPayments: params.installments ?? 1,
    Description: params.description,
    ReturnValue: params.invoiceId,          // echoed back in webhook
    SuccessRedirectUrl: params.successUrl,
    ErrorRedirectUrl: params.failureUrl,
    CustomerName: params.customerName,
    CustomerEmail: params.customerEmail,
    CustomerPhone: params.customerPhone,
    CreateInvoice: true,                    // Cardcom issues a חשבונית מס
    Language: 'he',
  };

  const response = await fetch(`${CARDCOM_API_BASE}/LowProfile/Create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.ReturnCode !== 0) {
    throw new Error(`Cardcom error ${data.ReturnCode}: ${data.Description}`);
  }

  return {
    paymentUrl: data.LowProfileId
      ? `${CARDCOM_API_BASE}/LowProfile/Pay?LowProfileId=${data.LowProfileId}`
      : '',
    lowProfileId: data.LowProfileId,
  };
}

// Step 2: Webhook handler — receives payment result from Cardcom
// functions/src/payments/cardcomWebhook.ts
export const cardcomWebhook = onRequest(async (req, res) => {
  const { LowProfileId, ReturnValue: invoiceId, ReturnCode, Token, CardLastFourDigits, CardExpiration } = req.body;

  if (ReturnCode !== '0') {
    await handlePaymentFailure(invoiceId);
    res.status(200).send('FAIL_HANDLED');
    return;
  }

  // Payment succeeded
  await db.runTransaction(async (tx) => {
    const invoiceRef = db.collectionGroup('invoices').where('id', '==', invoiceId);
    const invoiceSnap = await invoiceRef.get();
    if (invoiceSnap.empty) return;

    const invoiceDoc = invoiceSnap.docs[0];
    const invoice = invoiceDoc.data() as Invoice;

    // Mark invoice as paid
    tx.update(invoiceDoc.ref, {
      status: 'PAID',
      paidAt: Timestamp.now(),
      paidAmount: invoice.total,
      paymentMethod: 'CARD',
      cardcomTransactionId: LowProfileId,
    });

    // Store card token on the payer's profile (for future recurring charges)
    if (Token) {
      const payerRef = db.doc(`users/${invoice.payerId}`);
      tx.update(payerRef, {
        cardToken: Token,
        cardLast4: CardLastFourDigits,
        cardExpiry: CardExpiration,         // "MM/YY"
        cardTokenUpdatedAt: Timestamp.now(),
      });
    }
  });

  // Trigger confirmation notifications
  await triggerPaymentConfirmedNotification(invoiceId);
  res.status(200).send('OK');
});

// Step 3: Recurring charge using stored token
export async function chargeStoredCard(params: {
  payerId: string;
  amount: number;               // in agorot
  description: string;
  invoiceId: string;
  conservatoriumId: string;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {

  // Fetch stored token
  const payerDoc = await db.doc(`users/${params.payerId}`).get();
  const payer = payerDoc.data() as User;
  if (!payer.cardToken) {
    return { success: false, error: 'NO_TOKEN' };
  }

  const body = {
    TerminalNumber: CARDCOM_TERMINAL,
    ApiName: CARDCOM_API_NAME,
    Amount: params.amount,
    Token: payer.cardToken,
    CardValidityMonth: payer.cardExpiry?.split('/')[0],
    CardValidityYear: payer.cardExpiry?.split('/')[1],
    Description: params.description,
    ReturnValue: params.invoiceId,
    CreateInvoice: true,
    Language: 'he',
  };

  const response = await fetch(`${CARDCOM_API_BASE}/Transactions/ChargeToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  const success = data.ReturnCode === 0;

  if (!success) {
    await handlePaymentFailure(params.invoiceId, data.Description);
  }

  return {
    success,
    transactionId: success ? data.TranzactionId : undefined,
    error: success ? undefined : data.Description,
  };
}

// Step 4: Monthly subscription auto-charge Cloud Function
export const monthlyAutoCharge = onSchedule('0 6 1 * *', async () => {
  // Runs at 06:00 on the 1st of every month
  const activeSubscriptions = await db
    .collectionGroup('packages')
    .where('type', '==', 'MONTHLY')
    .where('paymentStatus', '==', 'PAID')
    .where('autoRenew', '==', true)
    .get();

  for (const pkgDoc of activeSubscriptions.docs) {
    const pkg = pkgDoc.data() as Package;
    const invoice = await createMonthlyInvoice(pkg);
    const result = await chargeStoredCard({
      payerId: pkg.payerId,
      amount: pkg.price * 100,
      description: `שיעורי מוזיקה — ${formatHebrewMonth(new Date())}`,
      invoiceId: invoice.id,
      conservatoriumId: pkg.conservatoriumId,
    });

    if (!result.success) {
      await triggerPaymentFailureFlow(pkg, invoice);
    }
  }
});
```

---

### 3.2 Twilio WhatsApp Integration

```typescript
// functions/src/notifications/twilio.ts
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const WHATSAPP_FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  await twilioClient.messages.create({
    from: WHATSAPP_FROM,
    to: `whatsapp:${normalizeIsraeliPhone(to)}`,
    body,
  });
}

export async function sendSMS(to: string, body: string): Promise<void> {
  await twilioClient.messages.create({
    from: process.env.TWILIO_SMS_NUMBER,
    to: normalizeIsraeliPhone(to),
    body,
  });
}

// Israeli phone normalization: 050-xxx-xxxx → +9725xxxxxxx
function normalizeIsraeliPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`;
  return `+972${digits}`;
}

// Central notification dispatcher
// functions/src/notifications/dispatcher.ts
export async function dispatchNotification(
  userId: string,
  event: NotificationEvent,
  payload: Record<string, string>
): Promise<void> {
  const user = await getUser(userId);
  const prefs = user.notificationPreferences;
  const eventPrefs = prefs?.[event.preferenceKey] ?? ['IN_APP'];
  const message = await renderMessage(event.templateKey, payload, user.language ?? 'he');
  const isUrgent = event.isUrgent;

  // Respect quiet hours for non-urgent messages
  if (!isUrgent && isInQuietHours(user)) {
    await queueForAfterQuietHours(userId, event, message);
    return;
  }

  const tasks: Promise<void>[] = [];

  if (eventPrefs.includes('WHATSAPP') && user.phone) {
    tasks.push(sendWhatsApp(user.phone, message.short));
  }
  if (eventPrefs.includes('SMS') && user.phone) {
    tasks.push(sendSMS(user.phone, message.short));
  }
  if (eventPrefs.includes('EMAIL') && user.email) {
    tasks.push(sendEmail(user.email, message.subject!, message.html!));
  }
  // Always write in-app notification
  tasks.push(writeInAppNotification(userId, event, message));

  await Promise.allSettled(tasks); // Don't let one channel failure block others
}
```

---

### 3.3 Digital Signature Component

```typescript
// src/components/forms/SignatureCanvas.tsx
// npm install react-signature-canvas
import SignatureCanvas from 'react-signature-canvas';

interface SignatureFieldProps {
  onSignatureComplete: (dataUrl: string) => void;
  signerName: string;
  documentTitle: string;
}

export function SignatureField({ onSignatureComplete, signerName, documentTitle }: SignatureFieldProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [signed, setSigned] = useState(false);

  const handleConfirm = async () => {
    if (!sigCanvasRef.current?.isEmpty()) {
      const dataUrl = sigCanvasRef.current!.getCanvas().toDataURL('image/png');
      const signatureWithMetadata = await embedSignatureMetadata(dataUrl, signerName);
      onSignatureComplete(signatureWithMetadata);
      setSigned(true);
    }
  };

  return (
    <div className="signature-field border rounded-lg p-4 bg-white">
      <p className="text-sm text-muted-foreground mb-2">
        חתם/חתמי כאן לאישור: <strong>{documentTitle}</strong>
      </p>
      <div className="border-2 border-dashed border-gray-300 rounded-md bg-gray-50">
        <SignatureCanvas
          ref={sigCanvasRef}
          canvasProps={{ width: 500, height: 150, className: 'signature-canvas w-full' }}
          penColor="black"
        />
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => sigCanvasRef.current?.clear()}>נקה</button>
        <button onClick={handleConfirm} disabled={signed}>אשר חתימה</button>
      </div>
      {signed && (
        <p className="text-xs text-green-600 mt-2">
          ✅ חתימה נרשמה | {signerName} | {new Date().toLocaleString('he-IL')}
        </p>
      )}
    </div>
  );
}

// Signature metadata: embed timestamp + signer name into the PNG EXIF
async function embedSignatureMetadata(dataUrl: string, signerName: string): Promise<string> {
  // Store in Firestore audit trail alongside the base64 signature
  // Return the dataUrl as-is for PDF embedding; the audit trail provides legal backing
  return dataUrl;
}

// Audit trail record for every digital signature
// /conservatoriums/{cid}/signatureAudit/{auditId}
interface SignatureAuditRecord {
  id: string;
  formSubmissionId: string;
  signerId: string;
  signerRole: UserRole;
  signerName: string;
  signedAt: Timestamp;
  ipAddress: string;           // captured server-side at signature submission
  userAgent: string;
  signatureHash: string;       // SHA-256 of the signature dataUrl
  documentHash: string;        // SHA-256 of the form content at time of signing
}
```

---

### 3.4 Multi-Child Family Hub Component

```typescript
// src/app/dashboard/family/page.tsx
// Route: /dashboard/family — visible only to PARENT role

export default async function FamilyHubPage() {
  const { user } = useAuth();
  const children = useChildren(user.childIds ?? []);

  return (
    <div className="family-hub">
      <h1>פורטל משפחה</h1>

      {/* Quick summary bar */}
      <FamilyBalanceBar children={children} />

      {/* Per-child cards */}
      {children.map(child => (
        <ChildSummaryCard key={child.id} child={child} />
      ))}

      {/* Unified upcoming lessons calendar */}
      <FamilyCalendar childIds={user.childIds ?? []} />

      {/* Pending actions requiring parent attention */}
      <ParentActionCenter userId={user.id} conservatoriumId={user.conservatoriumId} />
    </div>
  );
}

// ParentActionCenter shows items requiring attention:
// - Forms requiring parent signature
// - Invoices due
// - Package renewals expiring
// - Makeup credits about to expire
// - Age-upgrade invitations

interface FamilyBalanceBarProps {
  children: StudentProfile[];
}
// Shows: Total balance due across all children | Total makeup credits | Next payment date
```

---

### 3.5 Installment Payment UI

```typescript
// src/components/payments/InstallmentSelector.tsx
interface InstallmentOption {
  count: number;
  monthlyAmount: number;     // total / count
  totalAmount: number;       // may include installment fee
  installmentFee?: number;   // Israeli banks charge for >1 installment
}

// Cardcom supports Israeli installment (תשלומים) natively
// Max installments: typically 12, configurable per merchant
function calculateInstallments(
  total: number,
  maxInstallments: number,
  feePerInstallment: number = 0  // some conservatoriums absorb the fee
): InstallmentOption[] {
  return [1, 2, 3, 6, 10, 12]
    .filter(n => n <= maxInstallments)
    .map(count => {
      const fee = count > 1 ? feePerInstallment * count : 0;
      const totalWithFee = total + fee;
      return {
        count,
        monthlyAmount: Math.ceil(totalWithFee / count),
        totalAmount: totalWithFee,
        installmentFee: fee > 0 ? fee : undefined,
      };
    });
}

// Displayed as a segmented button group:
// [1 תשלום | 3 | 6 | 10 | 12]
// Shows monthly amount under each option
// "Pay ₪400/month × 10 = ₪4,000 total"
```

---

## 4. Summary Scorecard

| Area | SDD Coverage | Prototype Implementation | Priority |
|------|-------------|--------------------------|----------|
| Cardcom Payment Integration | ✅ Full spec | ❌ Zero real code | P0 |
| WhatsApp/SMS Notifications | ✅ Full catalog | ❌ Zero real code | P1 |
| Multi-Child Family Hub | ✅ Documented | ❌ No aggregated UI | P1 |
| Digital Signature | ✅ Field in model | ❌ No canvas component | P1 |
| Installment Payments (תשלומים) | ✅ Documented | ❌ Not implemented | P1 |
| Card-on-File Renewal | ✅ Documented | ⚠️ Mock only | P0 |
| Makeup Credit Expiry Alerts | ✅ In catalog | ❌ No dispatcher | P1 |
| Sibling Discount Logic | ✅ Specified | ⚠️ Not enforced at runtime | P1 |
| Section 46 Tax Receipts for Donations | ✅ SDD-17 | ❌ Not implemented | P3 |
