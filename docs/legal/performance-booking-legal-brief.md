# Legal Brief: Performance Booking Quotations & Contracts

**Date:** 2026-03-15
**Author:** Legal Expert Agent
**Status:** DRAFT -- Requires review by qualified Israeli legal counsel
**Jurisdiction:** State of Israel

---

## 1. Executive Summary

This brief defines the legal requirements for the Lyriosa platform's performance booking feature, where conservatoriums book musicians (teachers who opt in to performing) for external events such as weddings, corporate events, and concerts. The document covers: quotation documents, engagement contracts, signing flow, tax treatment, cancellation terms, and data retention -- all under Israeli law.

**Key regulatory framework:**
- Contract Formation: Israeli Contract Law (General Part) 5733-1973 (חוק החוזים (חלק כללי), התשל"ג-1973)
- Consumer Protection Law 5741-1981 (חוק הגנת הצרכן, התשמ"א-1981) -- applies to B2C client relationships
- Electronic Signature Law 5761-2001 (חוק חתימה אלקטרונית, התשס"א-2001)
- Income Tax Ordinance (New Version) 5721-1961 (פקודת מס הכנסה (נוסח חדש), התשכ"א-1961)
- VAT Law 5736-1975 (חוק מס ערך מוסף, התשל"ו-1975)
- Protection of Privacy Law 5741-1981 (חוק הגנת הפרטיות, התשמ"א-1981) + Amendment 13
- Unjust Enrichment Prevention Law 5739-1979 (relevant to cancellation refunds)

---

## 2. Parties and Legal Relationships

### 2.1 Three-Party Structure

The performance booking involves three distinct legal relationships:

```
CLIENT (event organizer)
    |
    | --- Service Agreement (quotation + contract) ---
    |
CONSERVATORIUM (the contracting entity)
    |
    | --- Engagement Agreement (musician assignment) ---
    |
MUSICIAN (teacher/performer)
```

**Critical:** The conservatorium is the contracting party with the client, NOT the individual musician. The musician performs under the conservatorium's engagement, not as an independent contractor to the client. This has significant tax and liability implications.

### 2.2 Conservatorium as Principal

The conservatorium:
- Issues the quotation and contract to the client
- Collects payment from the client (including VAT)
- Is liable for service delivery to the client
- Engages the musician separately (internal engagement agreement)
- Pays the musician (with appropriate tax treatment based on musician's status)

### 2.3 Musician Status Types

| Status | Hebrew | Tax Treatment | Invoice Requirement |
|--------|--------|---------------|-------------------|
| **Employee** (שכיר) | עובד שכיר | Conservatorium withholds income tax + Bituach Leumi (social insurance) | Conservatorium issues pay stub (תלוש שכר) |
| **Licensed Sole Proprietor** (עוסק מורשה) | עוסק מורשה | Musician issues tax invoice (חשבונית מס) with VAT to conservatorium | Musician invoices conservatorium; conservatorium can claim VAT offset |
| **Exempt Sole Proprietor** (עוסק פטור) | עוסק פטור | Musician issues receipt (קבלה) without VAT | No VAT offset for conservatorium |
| **Invoice + Receipt** (חשבונית עסקה) | חשבונית עסקה | For small dealings, musician issues combined document | Depends on turnover threshold |

**Platform requirement:** The musician's `PerformanceProfile` must include a `taxStatus` field indicating their employment/tax status. This determines the financial flow.

---

## 3. Quotation Document

### 3.1 Required Fields (under Israeli law)

The quotation (הצעת מחיר) is a legal offer under the Contract Law. Once accepted by the client, it forms a binding agreement. Required fields:

| Field | Hebrew | Legal Basis | Notes |
|-------|--------|------------|-------|
| **Quotation number** | מספר הצעה | Tax records (7-year retention) | Sequential, unique per conservatorium |
| **Date of issue** | תאריך הנפקה | Contract Law S. 3 (offer date) | |
| **Validity period** | תוקף ההצעה | Contract Law S. 3(2) | Must be explicit; default: 14 days |
| **Conservatorium details** | פרטי הקונסרבטוריון | VAT Law S. 47 | Full name, address, ח.פ./ע.מ. (business registration number), VAT registration |
| **Client details** | פרטי הלקוח | Contract Law | Full name/company, address, contact |
| **Event details** | פרטי האירוע | Contract specifics | Date, time, venue, duration, event type |
| **Service description** | תיאור השירות | Consumer Protection S. 4A | Musicians, instruments, roles, repertoire notes |
| **Itemized pricing** | פירוט מחירים | Consumer Protection S. 17A | Per-musician rate x hours, travel, equipment |
| **Subtotal** | סיכום ביניים | | Net of VAT |
| **VAT amount** | מע"מ | VAT Law S. 47 | Must be shown separately; current rate 18% |
| **Total including VAT** | סה"כ כולל מע"מ | Consumer Protection S. 17A | |
| **Payment terms** | תנאי תשלום | | Deposit amount, balance due date, payment methods |
| **Cancellation terms** | תנאי ביטול | Consumer Protection S. 14ג | Must reference 14-day cooling-off |

### 3.2 Validity Period

- **Default:** 14 calendar days from date of issue.
- **Platform behavior:** After validity expires, the quotation status should auto-update to `EXPIRED`. The admin can re-issue a new quotation.
- **Legal note:** An expired quotation is no longer a binding offer (Contract Law S. 3(2)).

### 3.3 VAT Breakdown Format

All prices displayed to the client MUST include VAT disclosure (Consumer Protection Law S. 17A):

```
Service Description                     Amount (ILS)
-----------------------------------------------
Pianist (accompanist) - 4 hours          1,200
Violinist (ensemble) - 4 hours             800
Cellist (soloist) - 4 hours               1,000
Travel supplement                           150
-----------------------------------------------
Subtotal (before VAT)                    3,150
VAT (18%)                                  567
-----------------------------------------------
TOTAL                                    3,717
```

**Platform integration:** Use `vatBreakdown()` from `src/lib/vat.ts` to compute. The `getVatRate()` function correctly handles per-conservatorium overrides.

### 3.4 Quotation as PDF

The quotation must be generated as a PDF for:
1. Sending to the client via email/WhatsApp
2. Archival for 7 years (tax law requirement)
3. Digital signing capability (if client signs electronically)

Reuse the existing `invoice-pdf` route pattern (`src/app/api/invoice-pdf/[invoiceId]/route.ts`) to create a `/api/quotation-pdf/[quotationId]/route.ts`.

---

## 4. Contract Document (Engagement Agreement with Client)

### 4.1 Required Clauses

Once the client accepts the quotation (via signing or deposit payment), a binding contract is formed. The contract MUST include the following clauses under Israeli law:

#### Clause 1: Parties (הצדדים)
- Full legal name and registration number of the conservatorium
- Full name/company and ID of the client
- Statement that the conservatorium is the service provider; musicians perform on its behalf

#### Clause 2: Scope of Services (היקף השירותים)
- Event name, type, date, start time, end time, venue address
- Number and type of musicians (instruments, roles)
- Named musicians (if specifically requested by client) or "musicians at conservatorium's discretion"
- Repertoire guidelines or specific program (if agreed)
- Sound/equipment requirements (who provides: client or conservatorium)

#### Clause 3: Fee and Payment (שכר ותשלום)
- Total fee including VAT (with VAT amount shown separately)
- Deposit amount and due date (typically 30%-50% upon signing)
- Balance payment date (typically 7 days before event, or day-of)
- Accepted payment methods
- Late payment interest: Prime + 4% per annum (standard commercial rate)
- Statement: "All prices include VAT at the statutory rate (currently 18%)"

#### Clause 4: Cancellation by Client (ביטול על ידי הלקוח)
- **14-day cooling-off right** (Consumer Protection Law S. 14ג for distance contracts):
  - If contract signed digitally (distance transaction): client may cancel within 14 days of signing OR 14 days of receiving the contract document, whichever is later
  - Cancellation fee: up to 5% of total or ILS 100, whichever is lower (S. 14ה(b)(1))
  - Refund of deposit minus cancellation fee within 14 business days
- **After cooling-off period:**
  - More than 30 days before event: 25% cancellation fee
  - 14-30 days before event: 50% cancellation fee
  - 7-14 days before event: 75% cancellation fee
  - Less than 7 days before event: 100% (no refund)
- **Event date change by client:** If rescheduled more than 30 days before original date, treated as new booking (no penalty). Otherwise, original cancellation terms apply.

#### Clause 5: Cancellation by Conservatorium (ביטול על ידי הקונסרבטוריון)
- Conservatorium may cancel only due to force majeure or musician unavailability
- If cancelled: full refund of all amounts paid within 14 business days
- Conservatorium will make best efforts to provide replacement musicians of equivalent quality
- Liability capped at the total contract value (no consequential damages)

#### Clause 6: Musician No-Show / Cancellation (אי הגעת נגן)
- **Musician cancels > 48 hours before event:** Conservatorium must provide a replacement of equivalent instrument and skill level, or offer full refund
- **Musician cancels within 48 hours:** Conservatorium must provide a replacement OR grant the client a 20% discount on the total fee
- **Musician no-show (day of event):** Conservatorium provides a replacement within 1 hour if possible. If replacement not possible: pro-rata refund for the missing musician's portion, plus 10% compensation on that musician's portion

#### Clause 7: Intellectual Property and Recording Rights (קניין רוחני וזכויות הקלטה)
- **Default:** Client may record the performance for personal/private use only
- **Commercial use:** Requires separate written consent from the conservatorium AND each performing musician
- **Live streaming:** Requires prior written consent and may incur additional fee
- **Copyright:** Musicians' performance rights under the Copyright Law 2007 (חוק זכויות יוצרים, התשס"ח-2007) are reserved. The contract does not transfer performance rights
- **Moral rights:** Non-waivable under Israeli law (S. 45 Copyright Law)

#### Clause 8: Insurance and Liability (ביטוח ואחריות)
- Conservatorium warrants that musicians are covered under its professional liability insurance
- Client is responsible for venue safety and audience management
- Neither party liable for consequential, indirect, or special damages
- Total liability capped at the total contract value

#### Clause 9: Force Majeure (כוח עליון)
- Events beyond reasonable control: natural disaster, war, terrorism, pandemic, government orders, military reserve duty (מילואים -- relevant in Israel)
- Party affected must notify the other within 24 hours
- If event is impossible: full refund minus reasonable expenses already incurred
- If event is delayed: rescheduling at no additional charge within 60 days

#### Clause 10: Confidentiality (סודיות)
- Client event details are confidential
- Musician rates and internal costs are confidential (not disclosed to client)
- Conservatorium may use event photos/videos for marketing ONLY with prior written consent

#### Clause 11: Data Protection (הגנת מידע)
- Client's personal data processed per Lyriosa's privacy policy
- Data retained for 7 years (tax law) then deleted
- Client may exercise DSAR rights (Privacy Protection Law, Amendment 13)

#### Clause 12: Dispute Resolution (יישוב סכסוכים)
- Good-faith negotiation for 14 days
- If unresolved: mediation through the Israeli Institute of Commercial Arbitration
- If mediation fails: exclusive jurisdiction of the competent court in the conservatorium's district
- **Small Claims Court** (בית משפט לתביעות קטנות): If total contract value is under ILS 35,800 (2026 threshold), client may file in Small Claims Court

#### Clause 13: General Provisions (הוראות כלליות)
- Hebrew language governs; translations are for convenience only
- Amendments only in writing signed by both parties
- Severability clause
- This contract constitutes the entire agreement between the parties
- Electronic signatures are valid under the Electronic Signature Law 5761-2001

### 4.2 Contract Language

- **Primary language:** Hebrew (הסכם זה נערך בעברית)
- **Translations:** Auto-generated by the platform in 4 locales (he/en/ar/ru) for the client's convenience, but the Hebrew version prevails in case of conflict
- **Font size:** Minimum 10pt for all terms; cancellation terms must be at minimum 12pt bold (Consumer Protection Regulations)

---

## 5. Internal Musician Engagement Agreement

### 5.1 Purpose

Separate from the client contract, the conservatorium needs an internal agreement with each musician for each performance. This governs the musician's obligations and compensation.

### 5.2 Required Fields

| Field | Description |
|-------|-------------|
| Musician name and ID | Full name, ת"ז (ID number) |
| Tax status | שכיר / עוסק מורשה / עוסק פטור |
| Event details | Name, date, time, venue |
| Role | Soloist / ensemble / accompanist / conductor |
| Compensation | Rate per hour, estimated total, payment terms |
| Rehearsal requirements | Sound check, dress rehearsal dates |
| Dress code | Event-specific attire requirements |
| Cancellation penalty | Musician's penalty for cancelling (see S. 5.3) |
| Response deadline | Date by which musician must accept/decline |

### 5.3 Musician Cancellation Penalties

- **Declined within response deadline:** No penalty (not yet committed)
- **Accepted, then cancels > 72 hours before event:** Warning recorded in profile; no financial penalty
- **Accepted, then cancels 24-72 hours before event:** ILS 200 penalty or 20% of musician's fee, whichever is lower
- **Accepted, then cancels < 24 hours / no-show:** Full musician fee forfeited; incident recorded; admin may revoke `performanceProfile.adminApproved`

### 5.4 Musician's Accept/Decline Flow (Legal Implications)

1. **Assignment = Offer:** When the admin assigns a musician, this constitutes an offer to engage
2. **Response deadline:** The musician has 72 hours to accept or decline (configurable by admin). If no response within the deadline, the offer lapses (Contract Law S. 4(2))
3. **Acceptance = Binding commitment:** Once the musician clicks "Accept", they are contractually committed. The platform records: acceptance timestamp, IP address, user agent (for audit)
4. **Decline = No obligation:** Declining within the deadline carries no penalty
5. **Auto-lapse:** If the musician does not respond within the deadline, their assignment status changes to `expired` and the admin is notified to reassign

---

## 6. Signing Flow

### 6.1 Digital Signing Sequence

```
1. Admin creates quotation in the platform
   -> Quotation generated with all required fields
   -> Status: DRAFT

2. Admin sends quotation to client
   -> Via email (PDF attachment) or WhatsApp (link to view + sign)
   -> Status: QUOTE_SENT
   -> 14-day validity clock starts

3. Client reviews and signs quotation electronically
   -> Uses SignatureCapture component (existing)
   -> Platform records: signature image, SHA-256 hash, timestamp, IP, user agent
   -> Status: CLIENT_SIGNED
   -> This acceptance triggers contract generation

4. Contract auto-generated from accepted quotation
   -> All quotation fields + additional contract clauses
   -> PDF generated and sent to client

5. Client pays deposit
   -> Via Cardcom (existing payment integration)
   -> Status: DEPOSIT_PAID
   -> Receipt/invoice generated with VAT

6. Conservatorium admin countersigns (optional)
   -> Admin signs to confirm the booking
   -> Status: BOOKING_CONFIRMED

7. Musicians receive engagement notifications
   -> Each assigned musician gets notification with event details
   -> 72-hour response deadline

8. All musicians accept
   -> Status: MUSICIANS_CONFIRMED
   -> Final confirmation sent to client
```

### 6.2 Signature Requirements

Under the Electronic Signature Law 5761-2001:

- **Basic electronic signature** (חתימה אלקטרונית): Sufficient for contracts under ILS 50,000. This is what the platform provides via the `SignatureCapture` component.
- **Certified electronic signature** (חתימה אלקטרונית מאושרת): Required for contracts over ILS 50,000. Requires a certified electronic signature from a licensed certification authority. The platform should flag contracts exceeding this threshold and recommend physical signing.
- **Audit trail:** Every signature must be accompanied by an immutable `SignatureAuditRecord` (existing pattern in `src/app/actions/signatures.ts`):
  - Signer ID and role
  - Timestamp (ISO 8601)
  - IP address
  - User agent
  - SHA-256 hash of the signed document
  - SHA-256 hash of the signature image

### 6.3 Who Signs What

| Document | Signer | Method |
|----------|--------|--------|
| Quotation (acceptance) | Client | SignatureCapture or deposit payment (implied acceptance) |
| Client contract | Client + Admin (optional countersign) | SignatureCapture |
| Musician engagement | Each musician | "Accept" button (platform records as electronic consent) |
| Tax invoice (to client) | Auto-generated | System-generated with conservatorium details |
| Tax invoice (from musician) | Musician (if עוסק מורשה) | Uploaded to platform or issued externally |

---

## 7. Tax Handling

### 7.1 Client-Facing: VAT on Service Fee

The conservatorium charges the client the full service fee including VAT:

```
Client pays:  3,717 ILS (3,150 net + 567 VAT)
Conservatorium remits: 567 ILS to Tax Authority (less input VAT offsets)
```

### 7.2 Musician Payment: Three Scenarios

#### Scenario A: Musician is an Employee (שכיר)

```
Conservatorium pays musician: 1,200 ILS (gross salary for this gig)
Conservatorium withholds:
  - Income tax (per musician's tax bracket + withholding certificate תיאום מס)
  - National Insurance (ביטוח לאומי): ~3.5% employee + ~6.57% employer (on amounts above threshold)
  - Health tax (מס בריאות): ~3.1% employee
Musician receives: net amount after deductions
Document: Pay stub (תלוש שכר) or supplementary payment report (דו"ח נוסף)
```

#### Scenario B: Musician is עוסק מורשה (Licensed Dealer)

```
Musician invoices conservatorium: 1,416 ILS (1,200 net + 216 VAT at 18%)
Conservatorium pays: 1,416 ILS
Conservatorium claims: 216 ILS as input VAT offset
Conservatorium withholds: income tax at source if no exemption certificate (אישור ניכוי מס במקור)
Document: Musician issues חשבונית מס (Tax Invoice)
```

#### Scenario C: Musician is עוסק פטור (Exempt Dealer)

```
Musician invoices conservatorium: 1,200 ILS (no VAT)
Conservatorium pays: 1,200 ILS
Conservatorium cannot claim VAT offset
Conservatorium withholds: income tax at source per statutory rate
Document: Musician issues קבלה (Receipt)
```

### 7.3 Platform Implementation

The `PerformanceProfile` type should include:

```typescript
taxStatus: 'employee' | 'licensed_dealer' | 'exempt_dealer';
taxId?: string;          // ע.מ. or ח.פ. for dealers
hasWithholdingExemption?: boolean;  // Has אישור ניכוי מס במקור?
withholdingExemptionExpiry?: string; // ISO date -- must be re-verified annually
```

The platform should:
1. **Warn admin** if a musician's withholding exemption is expired
2. **Auto-calculate** the payment amount based on tax status
3. **Generate** appropriate payment documentation (pay stub vs. request for invoice)
4. **Store** tax documents for 7-year retention period

---

## 8. Cancellation and No-Show Rules

### 8.1 Client Cancellation Timeline

| When | Refund | Legal Basis |
|------|--------|-------------|
| Within 14 days of signing (distance transaction) | Full refund minus max 5% or ILS 100 | Consumer Protection S. 14ג |
| > 30 days before event | 75% refund (25% cancellation fee) | Contract terms |
| 14-30 days before event | 50% refund | Contract terms |
| 7-14 days before event | 25% refund | Contract terms |
| < 7 days before event | No refund | Contract terms |

**Important:** The 14-day cooling-off applies ONLY if the contract was formed as a "distance transaction" (עסקת מכר מרחוק) -- i.e., signed digitally without face-to-face meeting. If the client met the admin in person to sign, the cooling-off does not apply (but is still good practice to offer).

### 8.2 Conservatorium Cancellation

- Full refund within 14 business days of cancellation notice
- Best-effort replacement offer
- No consequential damages liability

### 8.3 Musician Cancellation (Internal)

See Section 5.3 above for musician cancellation penalties.

### 8.4 Event Cancellation Due to Force Majeure

- Full refund minus documented expenses already incurred (e.g., travel deposits, equipment rental)
- Documented expenses must be itemized and provided to client
- Rescheduling option within 60 days at no additional charge

### 8.5 Partial Cancellation

If the client reduces the number of musicians (e.g., from 4 to 3):
- Treated as partial cancellation
- The cancelled musician's portion follows the cancellation fee schedule above
- Remaining musicians' engagement continues unchanged

---

## 9. Data Retention Requirements

### 9.1 Statutory Retention Periods

| Document Type | Retention Period | Legal Basis |
|---------------|-----------------|-------------|
| **Tax invoices (חשבוניות)** | 7 years from end of tax year | Income Tax Ordinance S. 25, VAT Law S. 74 |
| **Contracts** | 7 years from end of contract term | Income Tax Ordinance S. 25 |
| **Quotations** | 7 years from date of issue | Same as contracts (may form part of agreement) |
| **Signature audit records** | 7 years from signing date | Electronic Signature Law + tax retention |
| **Payment records** | 7 years from payment date | VAT Law S. 74 |
| **Musician engagement records** | 7 years from engagement date | Employment/tax records |
| **Cancellation records** | 7 years from cancellation date | Consumer Protection + tax |
| **Client PII** | Duration of contract + 7 years | Privacy Protection Law |
| **Musician PII** | Duration of engagement + 7 years | Privacy Protection Law + Employment Law |

### 9.2 Platform Implementation

- All performance-related records must include a `retainUntil` computed field: `eventDate + 7 years`
- Records past their retention date should be anonymized (not deleted) to preserve aggregate analytics
- DSAR requests must include performance booking history in the export
- Deletion requests must respect the 7-year tax retention window (data locked, not deleted)

---

## 10. Compliance Checklist

| # | Requirement | Priority | Implementation Status |
|---|-------------|----------|----------------------|
| L-01 | Quotation includes VAT breakdown | CRITICAL | Not yet implemented |
| L-02 | Contract includes 14-day cooling-off clause | CRITICAL | Not yet implemented |
| L-03 | All prices shown with VAT (Consumer Protection S. 17A) | CRITICAL | `vat.ts` utility exists; needs integration |
| L-04 | Signature audit trail (timestamp, IP, hash) | HIGH | Exists (`signatures.ts`); needs extension for quotation/contract signing |
| L-05 | Musician tax status field on PerformanceProfile | HIGH | Not yet implemented |
| L-06 | 7-year document retention | HIGH | Architecture exists (Firestore); retention policy not enforced |
| L-07 | Contract auto-generated in Hebrew (primary) + 3 locales | HIGH | Translation infrastructure exists (next-intl) |
| L-08 | Recording/IP rights clause in contract | MEDIUM | Not yet implemented |
| L-09 | Force majeure clause including military reserve duty | MEDIUM | Not yet implemented |
| L-10 | Musician withholding exemption expiry warning | MEDIUM | Not yet implemented |
| L-11 | Client DSAR includes performance booking data | MEDIUM | DSAR section exists in settings; needs extension |
| L-12 | Small Claims Court reference for contracts under ILS 35,800 | LOW | Informational; included in contract template |
| L-13 | Certified signature recommendation for contracts > ILS 50,000 | LOW | UI warning; no platform change |

---

## 11. Risk Assessment

### 11.1 High-Risk Scenarios

| Risk | Mitigation |
|------|-----------|
| Client disputes charge after cooling-off period | Clear cancellation terms in contract; signed acknowledgment |
| Musician classified incorrectly (employee treated as contractor) | Tax status verified at profile creation; admin approval gate |
| VAT not collected or not remitted | Automated VAT calculation; all prices VAT-inclusive by default |
| Contract formed without proper disclosure (Consumer Protection) | Template enforces all required fields; validation before sending |
| Digital signature challenged in court | Full audit trail (hash, timestamp, IP, user agent); SHA-256 integrity |
| Musician no-show with no replacement | Replacement SLA in contract; penalty in musician engagement |
| Data breach exposing musician rates or client PII | Tenant isolation (SEC-CROSS-03); rate data filtered by role |
| Client cancels within 14 days but deposit already spent | Deposit held in escrow pattern; not disbursed to musicians until cooling-off expires |

### 11.2 Regulatory Risk

The conservatorium policies analysis (`docs/legal/conservatorium-policies-analysis.md`) found that ZERO out of 13 analyzed conservatoriums currently comply with:
- VAT disclosure on prices
- 14-day cooling-off period disclosure
- DSAR mechanisms

Lyriosa's performance booking feature has the opportunity to set the standard for compliance in this sector. The platform should enforce these requirements as non-optional defaults, not configurable overrides.

---

## 12. Recommended Data Model Extensions

Based on the legal requirements above, the following type extensions are recommended:

```typescript
// New type: PerformanceQuotation
export type PerformanceQuotation = {
  id: string;
  bookingId: string;
  conservatoriumId: string;
  quotationNumber: string;           // Sequential per conservatorium
  issuedAt: string;                  // ISO timestamp
  validUntil: string;                // ISO timestamp (default: +14 days)
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'cancelled';

  // Client details
  clientName: string;
  clientCompany?: string;
  clientIdNumber?: string;           // ת"ז or company registration
  clientAddress?: string;
  clientEmail: string;
  clientPhone: string;

  // Service line items
  lineItems: {
    description: string;             // e.g., "Pianist (accompanist) - 4 hours"
    musicianUserId?: string;
    quantity: number;                 // hours
    unitPrice: number;               // ILS per hour (net of VAT)
    total: number;                   // quantity * unitPrice
  }[];

  // Financial
  subtotal: number;                  // Sum of line items
  vatRate: number;                   // e.g., 0.18
  vatAmount: number;                 // subtotal * vatRate
  totalIncVat: number;               // subtotal + vatAmount
  depositRequired: number;           // Amount due upon signing
  depositDueDate?: string;

  // Cancellation terms
  cancellationTermsAccepted?: boolean;
  coolingOffExpiresAt?: string;      // 14 days from acceptance

  // Signatures
  clientSignature?: {
    signatureUrl: string;
    signatureHash: string;
    signedAt: string;
    ipAddress: string;
    userAgent: string;
  };
  adminCountersignature?: {
    signatureUrl: string;
    signatureHash: string;
    signedAt: string;
  };

  // Retention
  retainUntil: string;               // eventDate + 7 years
};

// Extension to PerformanceProfile
export type PerformanceProfileTaxFields = {
  taxStatus: 'employee' | 'licensed_dealer' | 'exempt_dealer';
  taxId?: string;
  hasWithholdingExemption?: boolean;
  withholdingExemptionExpiry?: string;
};
```

---

## 13. Security-Legal Intersection

*This section addresses security requirements that have legal implications, per input from the Security Architect.*

### 13.1 Contract Signing Token Security

**Legal requirement:** A contract signing URL must reliably identify both the contract and the intended signer. If a signing token is guessable or reusable, the resulting signature may be challenged in court.

- Tokens must be cryptographically random (`crypto.randomBytes(32)`) -- not sequential or predictable
- Tokens must be single-use: once a contract is signed, the token is invalidated
- Tokens must have a server-enforced expiry (recommended: 72 hours, matching the musician response deadline)
- The signing page must verify that the authenticated user matches the contract's `musicianUserId` before allowing signature submission

### 13.2 OTP Security for Contract Signing

**Legal note:** If OTP is used as part of the signing flow (as in `rental-signing-flow.tsx`), the OTP generation must be cryptographically secure to maintain the evidentiary value of the signature:

- Use `crypto.randomInt(100000, 999999)` instead of `Math.random()` (the current `rental-otp.ts` implementation uses `Math.random()` which is NOT cryptographically secure)
- OTP store must persist across server restarts (Redis or DB with TTL) for production
- OTP expiry: 10 minutes maximum

**Legal implication:** If a signature is challenged and the OTP mechanism is shown to be predictable, the court may question whether the signer's identity was adequately verified. This weakens the evidentiary value of the electronic signature under the Electronic Signature Law 5761-2001.

### 13.3 Sensitive Financial Data Protection

**Legal requirement (PDPPA + Employment Privacy):** Musician compensation data, tax classification, and bank details are protected personal data:

| Data Field | Protection Required | Legal Basis |
|-----------|-------------------|-------------|
| `ratePerHour` | Encrypted at rest; visible only to admin + the musician themselves | PDPPA S. 8 (purpose limitation) |
| `taxStatus` (עוסק מורשה / שכיר) | Encrypted at rest; visible only to admin + the musician | Employment privacy |
| `taxId` (business registration) | Encrypted at rest; masked in UI (show last 4 digits) | PDPPA S. 8 |
| Bank details (account, branch) | Encrypted at rest; masked in UI (last 4 digits only) | Banking privacy + PDPPA |

**Key rule:** One musician must NEVER see another musician's rate, tax status, or bank details on the same booking. The security architect's projection/DTO pattern (SEC-PERF-07) correctly addresses this.

### 13.4 Contract Immutability After Signing

**Legal requirement:** Under the Electronic Signature Law, the integrity of a signed document is essential to its legal validity. If a contract can be modified after signing, the signature is no longer legally valid.

Implementation requirements:
1. Signed contracts must be **write-once**: no update or delete operations on the contract record after `status = 'signed'`
2. The `SignatureAuditRecord` must include **both**:
   - `signatureHash`: SHA-256 of the signature image (already exists in `SignatureCapture`)
   - `documentHash`: SHA-256 of the complete contract content at the moment of signing (creates a tamper-evident seal)
3. Any attempt to modify a signed contract must be rejected by the server action with error `CONTRACT_IMMUTABLE`
4. If contract terms need to change post-signature: create a new contract version, archive the old version, require re-signing

**DSAR exception:** Deletion requests under PDPPA must exempt financial records within the 7-year retention period. The platform should respond to deletion requests for contract data with: "This record is retained under Income Tax Ordinance S. 25 and VAT Law S. 74. It will be anonymized after [retainUntil date]."

### 13.5 Audit Trail for Contract Lifecycle

**Legal requirement:** For the electronic signature to have full evidentiary value, the entire contract lifecycle must be logged in an append-only audit trail:

| Event | ComplianceLog Action | Required Fields |
|-------|---------------------|-----------------|
| Quotation created | `QUOTATION_CREATED` | quotationId, adminId, clientName, totalIncVat |
| Quotation sent to client | `QUOTATION_SENT` | quotationId, clientEmail, sentAt |
| Quotation accepted/signed | `QUOTATION_SIGNED` | quotationId, signatureHash, documentHash, signerIp, signerAgent |
| Contract generated | `CONTRACT_CREATED` | contractId, quotationId, bookingId |
| Contract sent to musician | `CONTRACT_SENT` | contractId, musicianUserId, sentAt |
| Musician signs contract | `CONTRACT_SIGNED` | contractId, musicianUserId, signatureHash, documentHash, signerIp, signerAgent |
| Admin countersigns | `CONTRACT_COUNTERSIGNED` | contractId, adminId, signatureHash |
| Contract cancelled | `CONTRACT_CANCELLED` | contractId, cancelledBy, reason |

These records are themselves subject to the 7-year retention requirement and must be immutable (append-only).

### 13.6 Electronic Signature Law -- SignatureCapture Sufficiency

**Clarification requested by Security Architect:** Does the existing `SignatureCapture` component (canvas-drawn signature + SHA-256 hash) meet Israeli Electronic Signature Law requirements?

**Analysis:**

The Electronic Signature Law 5761-2001 defines three tiers:

1. **Electronic signature** (חתימה אלקטרונית, S. 1): Any data in electronic form attached to or logically associated with an electronic message that serves the purpose of identifying the signer. **SignatureCapture meets this tier.** The canvas-drawn signature + SHA-256 hash + timestamp + IP address + user agent constitutes an electronic signature.

2. **Secure electronic signature** (חתימה אלקטרונית מאובטחת, S. 2): An electronic signature that also (a) uniquely identifies the signer, (b) is created by means under the signer's sole control, (c) allows detection of any change to the signed document. **SignatureCapture partially meets this tier** -- the SHA-256 documentHash satisfies (c), the authentication check satisfies (a), but (b) is debatable since the signing device is not exclusively controlled.

3. **Certified electronic signature** (חתימה אלקטרונית מאושרת, S. 3): A secure electronic signature backed by a certificate from a licensed certification authority. **SignatureCapture does NOT meet this tier.**

**Legal position:**

- For **performance contracts under ILS 50,000**: A basic electronic signature (tier 1) is legally valid under S. 3 of the Law. Courts generally accept basic electronic signatures for commercial contracts, especially when accompanied by a strong audit trail (OTP verification, IP logging, document hashing). SignatureCapture is sufficient.

- For **performance contracts over ILS 50,000**: While not strictly required by statute, a secure or certified signature (tier 2/3) significantly strengthens legal enforceability. The platform should display a warning: "For contracts exceeding ILS 50,000, we recommend in-person signing or a certified electronic signature."

- For **all contracts**: The tamper-evident seal (documentHash) is essential. Without it, the signature can be challenged on grounds that the document was altered after signing.

---

## 14. Updated Compliance Checklist (incorporating Security requirements)

| # | Requirement | Priority | Status |
|---|-------------|----------|--------|
| L-01 | Quotation includes VAT breakdown | CRITICAL | Not yet implemented |
| L-02 | Contract includes 14-day cooling-off clause | CRITICAL | Not yet implemented |
| L-03 | All prices shown with VAT (Consumer Protection S. 17A) | CRITICAL | `vat.ts` utility exists; needs integration |
| L-04 | Signature audit trail (timestamp, IP, hash) | HIGH | Exists (`signatures.ts`); needs extension |
| L-05 | Musician tax status field on PerformanceProfile | HIGH | Not yet implemented |
| L-06 | 7-year document retention | HIGH | Architecture exists; retention policy not enforced |
| L-07 | Contract auto-generated in Hebrew (primary) + 3 locales | HIGH | Translation infrastructure exists |
| L-08 | Recording/IP rights clause in contract | MEDIUM | Not yet implemented |
| L-09 | Force majeure clause including military reserve duty | MEDIUM | Not yet implemented |
| L-10 | Musician withholding exemption expiry warning | MEDIUM | Not yet implemented |
| L-11 | Client DSAR includes performance booking data | MEDIUM | DSAR section exists; needs extension |
| L-12 | Small Claims Court reference for contracts under ILS 35,800 | LOW | Informational |
| L-13 | Certified signature recommendation for contracts > ILS 50,000 | LOW | UI warning only |
| **LS-01** | **Signing tokens: crypto.randomBytes(32), single-use, 72h expiry** | **HIGH** | Not yet implemented |
| **LS-02** | **OTP uses crypto.randomInt, not Math.random** | **HIGH** | Current rental-otp.ts uses Math.random (vulnerability) |
| **LS-03** | **Compensation data encrypted at rest** | **HIGH** | Not yet implemented |
| **LS-04** | **Contract immutability after signing (write-once)** | **CRITICAL** | Not yet implemented |
| **LS-05** | **documentHash included in every SignatureAuditRecord** | **CRITICAL** | signatureHash exists; documentHash optional in current schema |
| **LS-06** | **Full contract lifecycle audit trail (ComplianceLog)** | **HIGH** | ComplianceLog exists; needs new event types |
| **LS-07** | **Bank details masked in UI (last 4 digits)** | **MEDIUM** | Not yet implemented |

---

*This legal brief is based on Israeli law as of March 2026. It does not constitute legal advice. All contract templates and business processes described herein must be reviewed and approved by qualified Israeli legal counsel before deployment.*
