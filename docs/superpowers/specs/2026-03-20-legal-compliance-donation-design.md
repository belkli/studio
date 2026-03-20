# Lyriosa — Legal Compliance + Donation Module Design Spec
**Date:** 2026-03-20
**Status:** DRAFT v1.1 — Pending user approval
**Scope:** Two interconnected workstreams derived from the 2026-03-20 Legal & Security Audit

---

## Part A: Legal Compliance Implementation

### A.1 Decomposition into Sprints

This work covers 50 named action items from the audit (SEC-1..5, AID-1..5, ACC-1..7, SIG-1..3, MOE-1..2, SMS-1..5, PAY-1..8, CHILD-1..3, DON-1..7, MUN-1..5). Each sprint is independent and can be parallelized after S1.

| Sprint | Theme | Action IDs | Priority | Blocking? |
|--------|-------|-----------|----------|-----------|
| **S1** | Security Hardening | SEC-1..5 | P0 | Blocks all production |
| **S2** | Scholarship RBAC + Privacy | AID-1..5 | P0 | Blocks S7 |
| **S3** | Invoice + Accounting | ACC-1..7 | P1 | Before first payment |
| **S4** | Legal Contracts + Signatures | SIG-1..3, MOE-1..2 | P1 | Before enrollment opens |
| **S5** | Communications Compliance | SMS-1..5 | P1 | Before any bulk SMS |
| **S6** | Payroll + Privacy Foundation | PAY-1..8, CHILD-1..3 | P1 | Before payroll module launch |
| **S7** | Donation Module | DON-1..7 + new donation arch | P1 | After S2 |
| **S8** | Municipal Procurement | MUN-1..5 | P2 | Before municipal sales |

---

### A.2 Sprint S1 — Security Hardening (P0)

**Goal:** Fix 37 tenant isolation violations before any production deployment.

**Changes required:**

#### Backend
- All Supabase queries in Server Actions and API routes must filter by `conservatoriumId` claimed from auth token — never from client-supplied input
- Audit pattern: `supabase.from('teachers').select()` → must become `supabase.from('teachers').select().eq('conservatorum_id', verifiedConsId)`
- Wire `ComplianceLog` to all PII read/write events: `logAccess(userId, resourceType, resourceId, action)`
- All API credentials (Cardcom terminals, SMS keys, etc.) moved to **Vercel Environment Variables** (encrypted, per-environment) — never stored in Supabase DB columns. Per-tenant BYOD credentials use Supabase-encrypted columns (via `pgcrypto`). See `src/lib/secrets.ts`.
- Cardcom webhook: verify HMAC signature on every incoming webhook before processing
- Replace `Math.random()` with `crypto.randomInt()` for all OTP/token generation, including `src/app/actions/signatures.ts`

#### DB
- Supabase RLS policies: add `conservatorum_id` ownership check to every table policy
- No row readable unless `auth.jwt() ->> 'conservatorum_id' = conservatorum_id`

#### DB — `ComplianceLog.action` new values (add to union in `src/lib/types.ts`)
```typescript
// Add to existing: 'PII_DELETED' | 'CONSENT_GIVEN' | 'CONSENT_REVOKED' | 'DATA_EXPORTED' | 'BREACH_REPORTED' | 'SIGNATURE_CREATED'
| 'PII_READ'                  // any PII field accessed
| 'SENSITIVE_DATA_ACCESS'     // scholarship documents viewed
| 'MARKETING_MESSAGE_SENT'    // commercial SMS/WhatsApp sent
| 'OTP_GENERATED'             // OTP created for user
```

#### No UI changes needed for S1.

**Files to modify:**
- All 22 files identified in `docs/audits/tenant-isolation-audit.md`
- `src/lib/compliance-log.ts` (new) — wire to all PII operations
- `src/lib/secrets.ts` (per architecture doc 09-byod-integrations.md) — updated for Vercel env vars
- `src/lib/payments/cardcom.ts` — add HMAC validation
- `src/app/actions/signatures.ts` — replace `Math.random()` with `crypto.randomInt()` for auditId generation
- `src/lib/types.ts` — add new `ComplianceLog.action` union values (see DB section above)
- Supabase RLS migration files

---

### A.3 Sprint S2 — Scholarship RBAC + Privacy (P0)

**Goal:** Restrict sensitive financial aid documents to designated committee members only.

#### DB
- New sub-role: `SCHOLARSHIP_COMMITTEE` — stored as a permission flag on `conservatorium_admin` users
- New fields on `ScholarshipApplication` (add to type in `src/lib/types.ts`):
  - `documents?: string[]` — array of encrypted document URLs (AES-256 at rest)
- `ComplianceLog` entry on every document view: action `'SENSITIVE_DATA_ACCESS'`
- Auto-delete uploaded financial documents 12 months after scholarship decision (scheduled function)

#### Backend
- `getScholarshipApplication()` Server Action: gate document array behind `SCHOLARSHIP_COMMITTEE` check
- Separate `getScholarshipSummary()` for non-committee admins: returns outcome only, no documents
- `AID-3`: verify `SCHOLARSHIP_DATA` consent checkbox exists on aid application form submission

#### UI
- Admin scholarship list: non-committee admins see applicant name + outcome only (no documents, no income figures)
- Committee members see full application + AI score + reasoning
- Privacy notice on aid application form: "Your documents are seen only by the scholarship committee and deleted within 12 months of decision"

---

### A.4 Sprint S3 — Invoice + Accounting (P1)

**Goal:** Ensure no Lyriosa-generated PDF can be mistaken for an official חשבונית מס.

#### Backend
- `generate-invoice-pdf.ts`: add mandatory disclaimer banner: *"מסמך פנימי בלבד — אינו מהווה חשבונית מס. החשבונית הרשמית הונפקה על-ידי [gatewayName]."*
- Store gateway's invoice number as `invoiceNumber` — never generate a Lyriosa sequential number as the primary key
- `CreateInvoice: true` flag: **add** `CreateInvoice: true` to the Cardcom API request body in `src/lib/payments/cardcom.ts` (currently missing from `createCardcomPaymentPage` function)

#### No DB schema changes.
#### No UI changes (disclaimer is PDF-embedded).

---

### A.5 Sprint S4 — Legal Contracts + Signatures (P1)

**Goal:** Strengthen e-signature audit trail; add Ministry export disclaimer.

#### Backend
- `SignatureAuditRecord`: ensure every signature event persists `{ signerId, formSubmissionId, documentHash, ipAddress, timestamp, signerRole }` — verify backend wiring in `src/app/actions/signatures.ts`
  - Note: existing type uses `signerId` (not `userId`) and `formSubmissionId` (not `documentId`) — use existing field names
- Document hash computed at signing time (SHA-256 of full document content) — stored alongside signature

#### UI
- Signature dialog: add legal notice before canvas: *"חתימתך מהווה חתימה אלקטרונית בהתאם לחוק חתימה אלקטרונית, התשס"א-2001"*
- Ministry export page: add disclaimer banner: *"יצוא זה נוצר לצורך הגשה ידנית. הקונסרבטוריון אחראי לאימות הנתונים לפני הגשתם למשרד החינוך."*

#### DB
- Verify `signatureAuditRecords` collection/table exists and is written on every signature

---

### A.6 Sprint S5 — Communications Compliance (P1)

**Goal:** Comply with Amendment 40 (Israeli Spam Law) before any bulk SMS/WhatsApp.

#### Backend
- `dispatcher.ts`: add `messageType: 'SERVICE' | 'MARKETING'` parameter to all send functions
- Marketing messages: check user's `MARKETING_SMS` consent before sending — skip if revoked
- All outgoing SMS/WhatsApp: prepend sender ID: *"ליריאוסה — [conservatoriumName]:"*
- Add `STOP` reply handler — **two tasks:**
  1. Create `/api/webhooks/sms-inbound` route handler for inbound SMS (Twilio webhook configuration required)
  2. In handler: incoming "סור" / "STOP" → update `userConsent.marketingSms = 'revoked'`
- Log all commercial messages: `{ recipientId, timestamp, messageType, consentStatus }` → ComplianceLog (action: `'MARKETING_MESSAGE_SENT'`)

#### UI
- Marketing message templates: add unsubscribe footer: *"להסרה מרשימת התפוצה השב: סור"*
- Broadcast composer: label commercial messages with "פרסומת" tag — required by law
- Admin cannot send marketing messages to users with revoked consent (send button disabled, tooltip explains)

---

### A.7 Sprint S6 — Payroll + Privacy Foundation (P1)

**Goal:** PIA completion + CSV export audit + children's data policy.

#### Backend
- CSV export endpoint: add confirmation step — log export event with `{ exportedBy, timestamp, recordCount, includesIdNumbers: true }` to ComplianceLog
- Overtime calculation: add disclaimer to CSV header row: *"שעות עבודה בפועל בלבד — אינו כולל זמן עבודה מחוץ לשיעורים"*

#### UI
- CSV export button: confirmation dialog: *"יצוא זה מכיל מספרי תעודת זהות. השתמש בו לצורכי שכר בלבד."*
- Teacher self-view: add section showing exact data that was exported for them in last payroll cycle
- Privacy policy page: add "Children's Data Protection" section
- Gemini progress report generation prompt: add system instruction: *"Provide educational feedback only. Do not analyze behavioral patterns or make predictions about the student."*

#### Legal (non-code)
- Privacy Impact Assessment document: create `docs/legal/PIA-payroll-module.md`
- Data Security Officer appointment: documented in `docs/operations/DSO-appointment.md`

---

### A.8 Sprint S8 — Municipal Procurement (P2)

#### Documents to create (no code)
- `docs/legal/municipal-procurement-guide-he.md` — Hebrew guide for municipal conservatoria
- `docs/legal/sole-supplier-justification-template.md` — ספק יחיד exemption template
- MSA addendum: municipal-specific clauses (budget committee approval, auditor access, annual renewal)

---

## Part B: Donation Module — AI-Ranked Marketplace

### B.1 Core Concept

**"The AI-Ranked Marketplace"** — Fair play through transparent ranked display. AI ranks conservatoria by need; donors choose; money flows direct. No central entity, no legal complexity.

**Key insight from JGive research:** JGive Platinum is a Donor Advised Fund (DAF) operated by קרן עשור (ע"ר). This is the established Israeli model for multi-org giving with a single receipt. Lyriosa does not need to build this — it can integrate with JGive Platinum (or Nedarim Plus) as the settlement layer for large donors (>₪5,000) who want multi-org giving. For the majority of donors (<₪5,000, single org), direct Cardcom is used.

### B.2 Versioned Rollout

#### V1 — Launch (implements in Sprint S7)
- Conservatorium admin self-declares Section 46 status in settings (onboarding checklist item)
- Public `/donate` page shows AI-ranked list of Section 46 conservatoria
- Donor picks one conservatorium → single Cardcom payment → single Section 46 receipt
- Recurring: always goes to the same chosen conservatorium
- No central entity required

#### V2 — Multi-basket (3 months post-launch)
- Donor can add multiple conservatoria to a basket with custom amounts
- First Cardcom payment captures card token; subsequent basket items charged against token
- Bundled receipt email (N individual receipts assembled into one PDF)
- Recurring "Follow the Need" option: each month charges against whichever conservatorium ranks #1

#### V3 — DAF Integration (6-12 months, optional)
- Integrate with JGive Platinum API or Nedarim Plus for large donors (>₪5,000)
- Single payment → single receipt → DAF distributes per algorithm
- Enables fully automatic cascade routing without multiple Cardcom transactions

### B.3 Need Score Algorithm

Updates hourly. Drives display ranking only — never touches money routing directly.

```
NeedScore(cons) = (
  (Σ studentAIScores × ₪requested) × 0.40     // open aid demand weighted by severity
  + max(0, 1 - fundBalance/annualTarget) × 0.25 // penalizes well-funded cons; floor at 0 for over-funded
  + socioeconomicClusterBonus          × 0.20  // CSO periphery index, clusters 1-4
  + (enrolledStudents/capacity)        × 0.10  // utilization signal
  + daysSinceLastDonation/30           × 0.05  // starvation prevention
) × platformWeightMultiplier                    // platformWeightMultiplier = 1.0 + (platformWeightAdjustment / 100)
```

`platformWeightAdjustment` is stored on `Conservatorium.donations.platformWeightAdjustment` (range: -10 to +10). Final score is floor-clamped to 0 before display.

**Constraints:**
- Conservatorium must have `section46Enabled: true` to appear in ranking
- Conservatorium excluded if Section 46 approval expired or not set
- Score recalculated hourly by scheduled function
- Algorithm weights published openly on `/about/donations` transparency page

### B.4 AI Scholarship Scoring (Layer 1)

Student applications are scored by Gemini before human committee review.

#### Privacy guardrails
- AI receives anonymized application data only: no name, no ת.ז., no teacher identity
- Documents parsed server-side for structured fields (income bracket, family type, exam score) — raw document text never sent to Gemini
- AI score stored encrypted alongside application; visible only to SCHOLARSHIP_COMMITTEE members
- Committee can override any AI score with a mandatory written note

#### Scoring dimensions (7 weights)
| Dimension | Weight | Data source |
|-----------|--------|-------------|
| Financial hardship severity | 30% | Income certificate bracket |
| Family vulnerability factors | 20% | Single-parent, disability, new immigrant certificates |
| Dropout risk if no aid | 15% | Computed from income + enrollment tenure |
| Musical merit / progress | 15% | Exam grade, teacher endorsement score |
| Peripheral location bonus | 10% | CSO socioeconomic cluster |
| Document completeness | 5% | Required docs uploaded check |
| Enrollment continuity | 5% | Years enrolled |

#### AI output format
See `AIScholarshipScore` type definition in B.5.

### B.5 Data Model Changes

All new types live in `src/lib/types.ts` unless otherwise noted.

#### New type: `AnonymizedStudentStory`
```typescript
interface AnonymizedStudentStory {
  id: string;
  instrument: string;
  ageRange: string;           // e.g. "10-12" — age range not exact age (privacy)
  storyText: { he: string; en?: string };
  addedAt: string;            // ISO timestamp
}
```

#### New type: `AIScholarshipScore` (move from B.4 — lives in `src/lib/types.ts`)
```typescript
interface AIScholarshipScore {
  score: number;                    // 0–100
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;                // 2–4 sentence explanation in Hebrew
  recommendedAward: {
    discountPercent: number;        // suggested award
    durationMonths: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  flaggedForHumanReview: boolean;   // true when borderline (40–70 score)
  flagReason?: string;
}
```

#### New fields on `Conservatorium`
```typescript
donations: {
  section46Enabled: boolean;
  section46ApprovalNumber?: string;
  section46ExpiryDate?: Date;
  needScore: number;                // computed hourly
  needScoreUpdatedAt: Date;
  annualDonationTarget: number;
  currentFundBalance: number;
  totalDonationsAllTime: number;
  totalStudentsFunded: number;      // public counter
  platformWeightAdjustment: number; // -10 to +10, default 0
  featuredStudentStories: AnonymizedStudentStory[];
}
```

#### New fields on `ScholarshipApplication`
```typescript
documents?: string[];               // encrypted document URLs (added in S2)
aiScore?: AIScholarshipScore;
aiScoredAt?: Date;
committeeOverrideNote?: string;     // required if committee overrides AI score
```

#### New `Donation` fields (additions to SDD-17 model)
```typescript
routingMethod: 'DIRECT' | 'BASKET' | 'FOLLOW_NEED' | 'DAF';
basketItems?: { conservatoriumId: string; amount: number }[]; // V2
cardToken?: string;  // for basket multi-charge (V2) — note: Cardcom tokens are terminal-scoped;
                     // V2 requires Cardcom policy confirmation that cross-terminal token reuse is supported
```

#### Onboarding tracking (Part C)
The onboarding checklist is tracked in the DB as a `Conservatorium` field (not just a static doc) — governs go-live gating:
```typescript
onboardingChecklist: {
  legalEntityType?: 'municipal_dept' | 'municipal_corp' | 'amuta' | 'private';
  section46Declared: boolean;
  paymentGatewayConfigured: boolean;
  emailSenderConfigured: boolean;
  smsSenderConfigured: boolean;
  complianceConfirmed: boolean;
  municipalApprovalPath?: boolean;  // only for municipal entity types
}
```

### B.6 UI Changes

#### Conservatorium Admin Settings — new "Donations" tab
- Toggle: Enable donation module (requires Section 46 approval number)
- Fields: Section 46 number, expiry date, annual fundraising target
- Weight adjustment slider: -10% to +10% (with explanation tooltip)
- Student story editor: add/edit/delete anonymized stories (name, instrument, age, story text — no photos)
- Fund balance display (read-only, live)

#### Public `/donate` page
- Hero section with emotional copy and live impact counter
- AI-ranked conservatorium list (top 5 by NeedScore, updated hourly)
  - Each row: rank badge, name, city, "N students waiting", need bar, amount needed, "⭐ Most Urgent" badge on rank 1
- Donor selects one conservatorium (V1) or adds to basket (V2)
- Amount selector + recurring frequency picker
- Donor details form (name, email, ID for Section 46, anonymous option)
- Single Cardcom payment → conservatorium's own terminal
- Success page: receipt confirmation + "Your donation will help [N] students"

#### Donor recurring dashboard (no login required — magic link from receipt email)
- View/cancel recurring donation
- See monthly routing history (V2: which conservatorium received each month's payment)

---

## Part C: Conservatorium Admin Onboarding Checklist (new)

Admin setup now requires completing a structured checklist before going live. The checklist is tracked in the DB as `Conservatorium.onboardingChecklist` (see B.5) and gates the go-live toggle in the admin UI.

- [ ] Legal entity type (municipal department / municipal corp / independent amuta / private)
- [ ] Section 46 approval number + expiry (if applicable)
- [ ] Payment gateway credentials (Cardcom/HYP/Tranzila) — stored in Vercel Environment Variables (encrypted) or Supabase-encrypted columns
- [ ] Email sender domain (BYOD or Lyriosa shared)
- [ ] SMS sender (BYOD or Lyriosa shared)
- [ ] Confirm compliance: hours tracking notification to works council (if applicable)
- [ ] Municipal procurement: confirm budget approval path (if municipal entity)

---

## Implementation Plan Sequence

```
Week 1-2:  S1 (Security) + S2 (Scholarship RBAC) — P0, parallel
Week 3:    S3 (Invoices) + S4 (Signatures) — P1, parallel
Week 4:    S5 (SMS) + S6 (Payroll/Privacy) — P1, parallel
Week 5-6:  S7 (Donation Module V1) — depends on S2 completion
Week 7+:   S8 (Municipal Procurement docs) — P2, no code
Ongoing:   S7 V2 (Multi-basket) after V1 validation
```

---

## Open Questions (resolved during brainstorm)

| Question | Decision |
|----------|----------|
| Algorithm weights fixed or configurable? | Hybrid: Lyriosa sets baseline, admin ±10% adjustment |
| Receipt problem for multi-org donations? | V1: single org per payment (no problem). V2: token reuse + bundled email. V3: DAF integration |
| Central NGO needed? | No — JGive Platinum / Nedarim Plus can serve as DAF layer for V3. V1 and V2 require no central entity |
| Should donors see AI reasoning? | No — donors see "N students are waiting for support" (count-based), not AI scores |
| Recurring payment routing? | V1: fixed conservatorium. V2: "Follow the Need" option charges top-ranked cons each month |
| ₪50K donation exceeding one cons's need | V1: donor picks, no overflow. V2: basket lets donor split manually. V3: DAF auto-cascades |
| Donation overflow / zero-need month | V1 N/A. V2: donor chooses carry forward vs refund vs general reserve |

---

*This spec was produced through multi-session brainstorming with visual companion mockups on 2026-03-20. Mockups saved to `.superpowers/brainstorm/92403-1773978495/`. Requires review by Israeli legal counsel before implementation.*
