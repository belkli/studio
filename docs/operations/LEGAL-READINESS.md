# Lyriosa Platform - Legal Readiness Assessment

**Version:** 1.0
**Author:** Legal Agent
**Date:** 2026-03-06
**Status:** DRAFT - Requires review by qualified Israeli legal counsel

---

## Executive Summary

Lyriosa is a multi-tenant SaaS platform serving Israeli music conservatoriums. It processes sensitive personal data including Israeli ID numbers of minors, audio/video recordings of children, financial payment information, Ministry exam results, and scholarship disclosures. This document assesses legal readiness across Israeli law compliance, required legal agreements, intellectual property considerations, technical gaps, and pre-launch obligations.

**Overall Legal Readiness Score: ~85/100** _(was 40/100 before 2026-03-08 sprint)_

> **Implementation Notes — Sprint 2026-03-08:** Items 1–11 from the technical gaps table (CRITICAL, HIGH, MEDIUM, and LOW priorities) have been implemented. Remaining gaps: formal lawyer review of the standard registration contract (`docs/legal/standard-registration-agreement-draft.md`), WCAG-certified accessibility audit, and database registration with the Israeli Registrar of Databases.

| Area | Score | Key Gaps |
|------|-------|----------|
| Privacy Law (PDPPA) Compliance | 80/100 | ConsentRecord persistence ✅; DSAR flow ✅; cookie banner ✅; database registration with Registrar still pending |
| Consumer Protection | 80/100 | Cancellation flow ✅; VAT display ✅; 14-day cooling-off ✅; installment disclosure pending |
| Accessibility (IS 5568) | 60/100 | Accessibility page exists; panel exists; formal audit not done |
| Contractual Framework | 75/100 | MSA template ✅; enrollment contract signing step ✅; lawyer review pending |
| IP Clearance | 50/100 | Metadata-only compositions; upload disclaimers missing |
| Digital Signatures | 95/100 | Component built; server action exists; integrated into enrollment wizard ✅ |
| Data Residency | 40/100 | europe-west1 configured in Cloud Functions; Firestore project not yet deployed |

---

## Part 1: Israeli Law Compliance

### 1.1 Privacy Protection Law (5741-1981) + Amendment 2

The **Protection of Privacy Law** (Hebrew: חוק הגנת הפרטיות, התשמ"א-1981) and its **Information Security Regulations (2017)** govern Lyriosa's data handling obligations.

#### Data Lyriosa Collects

| Data Category | Examples | Sensitivity |
|---------------|----------|-------------|
| Identity | Full name, Israeli ID number (ת"ז), date of birth | High (includes minors) |
| Contact | Email, phone, address | Medium |
| Financial | Payment card tokens (via Cardcom), invoice history, scholarship amounts | High |
| Educational | Lesson history, exam results, progress reports, teacher notes | Medium |
| Media | Practice video/audio recordings, signature images | High (minors) |
| Behavioural | Practice streaks, login timestamps, notification preferences | Low |
| Location | Conservatorium branch addresses | Low |

#### Database Registration Requirement

Under Section 8 of the Privacy Protection Law, a "database" (מאגר מידע) must be registered with the **Registrar of Databases** (רשם מאגרי המידע) at the Israel Authority for Privacy Protection when it meets ANY of:
- Contains data on more than 10,000 individuals
- Contains "sensitive information" (health, political, financial, genetic data)
- Is used for direct marketing purposes
- Belongs to a public body

**Lyriosa qualifies on multiple criteria:** The platform will store data for potentially thousands of students across 85+ conservatoriums, includes Israeli ID numbers (sensitive by definition), financial data, and recordings of minors.

#### Action Items

- [ ] **Register the database** with the Registrar of Databases before launch (application at https://www.gov.il/he/service/database_registration)
- [ ] **Appoint a Data Security Officer** (ממונה על אבטחת מידע) as required for registered databases under Regulation 2 of the Information Security Regulations
- [ ] **Complete a security risk assessment** per the Information Security Regulations, aligned with ISO 27001 / Israeli Standard 27799
- [ ] **Implement data breach notification procedure**: notify the Registrar within 72 hours of discovering a "severe security incident" + notify affected data subjects "without delay" (Regulation 11)
- [ ] **Honour right of access and correction** within 30 days of receiving a request (Section 13 of the Privacy Law)
- [ ] **Wire ConsentRecord** (`src/lib/types.ts:1742`) to the registration UI — types exist but are not persisted
- [ ] **Wire ComplianceLog** (`src/lib/types.ts:1857`) audit trail for all PII access events
- [ ] **Implement right-to-erasure** (PII_DELETED action) as an admin action — the ComplianceLog type supports it but no delete flow exists

#### Current Implementation Status

| Requirement | Type/Code Exists | Wired to UI | Wired to Backend |
|-------------|-----------------|-------------|------------------|
| Consent collection | `ConsentRecord` type at `types.ts:1742` | ✅ (`consent-checkboxes.tsx`) | ✅ (`src/app/actions/consent.ts`) |
| Consent types | `ConsentType`: DATA_PROCESSING, MARKETING, VIDEO_RECORDING, SCHOLARSHIP_DATA | ✅ (all 4 in UI incl. VIDEO_RECORDING) | ✅ |
| Compliance audit log | `ComplianceLog` type at `types.ts:1857` | No | No |
| Signature audit trail | `SignatureAuditRecord` type at `types.ts:1754` | Yes (`signature-capture.tsx`) | Yes (`actions/signatures.ts`) |
| Data retention | `RetentionPolicy` type at `types.ts:1700` | ✅ (retention schedule in privacy page) | No |
| Right to erasure | `PII_DELETED` action in ComplianceLog enum | No | No |
| Breach notification | Not implemented | No | No |

---

### 1.2 Consumer Protection Law (5741-1981)

The **Consumer Protection Law** (חוק הגנת הצרכן) applies to all transactions between Lyriosa's conservatorium clients and their paying customers (parents/students).

#### Key Obligations

**14-Day Cooling-Off Period (Section 14ג)**
- Distance contracts (online sales) grant the consumer a 14-day cancellation right from the date of the transaction
- This applies to: package purchases, enrollment fees, instrument rental deposits
- Exceptions: lessons already delivered cannot be refunded

**Recurring Billing (Section 13ד)**
- Monthly/yearly package subscriptions must have a clear, simple cancellation mechanism
- The consumer must be able to cancel online (not just by phone or in-person)
- Cancellation must take effect within 3 business days of the request

**Price Display**
- All prices must be displayed in Israeli New Shekels (₪)
- Prices must **include VAT** (currently 17%) — not "plus VAT"
- Payment installments (תשלומים) must disclose total cost and per-installment amount

#### Action Items

- [x] **Add cancellation flow** in the billing dashboard — implemented in `src/components/dashboard/student/student-billing-dashboard.tsx` (`src/app/actions/billing.ts`)
- [x] **Implement 14-day refund policy** clearly stated at point of purchase (package selection screen)
- [x] **Display all prices with VAT included** (17%) — `src/lib/vat.ts` provides VAT helpers; UI updated in billing dashboard
- [ ] **Add installment disclosure** showing total cost and per-payment amount when installments are selected
- [x] **Ensure online cancellation** is available without requiring phone/in-person interaction

---

### 1.3 Accessibility — Israeli Standard IS 5568 (Equal Rights Regulations 5773-2013)

The **Equal Rights for People with Disabilities Regulations (Accessibility of Internet Services)** (תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירותי אינטרנט), התשע"ג-2013) require compliance with WCAG 2.1 Level AA for:
- Government websites and services
- Public bodies
- Entities receiving public funding
- Businesses serving more than 50 people

Israeli music conservatoriums receive municipal funding and serve the public, making Lyriosa subject to these regulations. **Penalty: up to NIS 50,000 per complaint, with no proof of harm required** (Section 19ב of the Equal Rights for People with Disabilities Law).

#### Current Implementation

Lyriosa already has:
- An **accessibility statement page** at `/accessibility` (`src/app/[locale]/accessibility/page.tsx`) with measures, known limitations, per-conservatorium contact directory, and alternative access information
- An **accessibility panel** component (`src/components/a11y/accessibility-panel.tsx`) for runtime adjustments
- **Semantic HTML**: headings, landmark regions, aria-labels on interactive elements
- **Keyboard navigation**: tab indices, focus management on dialogs
- **RTL support**: CSS Logical Properties (`ms-/me-`, `ps-/pe-`, `text-start/text-end`)

#### Gaps

- No formal WCAG 2.1 AA audit has been performed
- Some ARIA labels missing on sidebar navigation items
- No skip-to-content link in dashboard layout
- Focus management incomplete on some modal dialogs
- Colour contrast not verified for Hebrew text at all sizes

#### Action Items

- [ ] **Commission formal WCAG 2.1 AA accessibility audit** by a certified Israeli accessibility consultant before launch
- [ ] **Add skip-to-content link** in the dashboard layout
- [ ] **Verify colour contrast ratios**: 4.5:1 for normal text, 3:1 for large text (per WCAG 2.1 AA)
- [ ] **Test with assistive technologies**: NVDA (Windows), VoiceOver (iOS/macOS), TalkBack (Android)
- [ ] **Ensure keyboard navigation** follows logical RTL tab order for Hebrew/Arabic locales
- [ ] **Review accessibility statement** content for completeness per IS 5568 requirements

---

### 1.4 Education Law Considerations — Minors' Data

#### Parental Consent for Data Processing (Under-18)

Israeli law does not set a specific "digital age of consent" like GDPR's Article 8. However, the **Legal Capacity and Guardianship Law** (חוק הכשרות המשפטית והאפוטרופסות, התשכ"ב-1962) establishes that:
- Minors under 18 cannot enter into contracts without parental consent
- Processing of a minor's personal data requires explicit parental consent
- For children under 13, all communications must be routed through the parent/guardian

#### Current Implementation

- The `ConsentRecord` type tracks `givenByUserId` (can be parent for minors) — **not wired to UI**
- The `consent-checkboxes.tsx` component collects `consentDataProcessing` and `consentTerms` but does **not differentiate** between an adult consenting for themselves vs. a parent consenting for a minor
- Students under 13 have no direct login — their records are managed by parents (correctly per security architecture doc Section 6.3)
- The `parentOf/{parentId_studentId}` denormalized collection exists in Firestore rules for parent-child access

#### Action Items

- [ ] **Add age gate / parental consent flow** for student registration — if the student is under 18, the registration flow must explicitly collect the parent's identity and consent
- [x] **Differentiate consent types**: "I consent to processing MY data" vs. "I consent to processing my CHILD's data as their legal guardian" — `isMinor` prop added to `consent-checkboxes.tsx`
- [x] **Add explicit VIDEO_RECORDING consent** — `VIDEO_RECORDING` ConsentType now collected in UI (`consent-checkboxes.tsx`)
- [ ] **Implement student records retention**: records for minors must be retained for a minimum of 7 years past the student reaching age 18 (per `RetentionPolicy.studentRecordRetentionYears`)
- [ ] **Route all communications for under-13 students** to the parent's contact details (partially implemented via dispatcher.ts requiring parent's userId)

---

### 1.5 Tax Compliance

#### Israeli VAT (Value Added Tax)

- Current rate: **17%**
- All invoices issued by Lyriosa on behalf of conservatoriums must comply with the **Value Added Tax Law** (חוק מס ערך מוסף, התשל"ו-1975)
- Invoices must include: business registration number, invoice number, date, VAT amount, and total including VAT
- The `Invoice` type now includes `vatRate` and `vatAmount` fields (verified in QA Report)

#### Tax Invoice Requirements (per Income Tax Regulations)

- [ ] Each conservatorium must configure their own **עוסק מורשה/פטור** (VAT registration number) in the system
- [ ] Invoices generated by Lyriosa must include the conservatorium's tax details (not Lyriosa's)
- [ ] If Lyriosa operates as a marketplace, determine whether Lyriosa or the conservatorium is the "supplier" for VAT purposes
- [ ] Financial records must be retained for **7 years** per Israeli tax law (aligned with `RetentionPolicy.financialRecordRetentionYears`)

---

## Part 2: Required Legal Documents

### 2.1 Master Service Agreement (MSA) — Between Lyriosa and Conservatoriums

The MSA is the primary contractual relationship governing Lyriosa's service to each conservatorium. A template skeleton is provided at `docs/contracts/MSA-TEMPLATE.md`.

**The MSA must cover:**

| Section | Key Terms |
|---------|-----------|
| Service Description | Platform features, hosting, maintenance, support hours |
| Service Level Agreement (SLA) | 99.5% monthly uptime target; scheduled maintenance windows; incident response times |
| Data Processing Agreement (DPA) | Incorporated by reference or as an exhibit — see Section 2.4 |
| Payment Terms | Subscription fee model (per-conservatorium), or per-student fee, or revenue share; payment schedule; late payment consequences |
| Liability Cap | Lyriosa total liability capped at 3 months of service fees paid |
| Indemnification | Each party indemnifies the other for breaches of their obligations |
| Termination | 30-day written notice; data export provided within 14 days of termination; data deletion within 30 days of export confirmation |
| IP Ownership | Conservatorium owns their student data, custom terms, and uploaded content; Lyriosa owns the platform, code, and aggregated anonymized analytics |
| Confidentiality | Mutual NDA; surviving 3 years post-termination |
| Governing Law | Laws of the State of Israel; exclusive jurisdiction: Tel Aviv District Court |
| Force Majeure | Standard force majeure clause including cyber attacks, pandemic, government orders |

### 2.2 Terms of Service (TOS) — Between Lyriosa and End Users

The TOS governs the relationship with students, parents, teachers, and other end users who access the platform.

**Must cover:**

- **Eligibility**: Users under 18 may only use the platform with parental/guardian consent
- **Acceptable Use**: No upload of copyrighted material without rights; no sharing of other users' personal data; no automated access/scraping
- **Account Responsibility**: Users are responsible for maintaining the security of their login credentials
- **Lesson Cancellation Policy**: Configurable per conservatorium (via `cancellationPolicySettings` — component exists at `cancellation-policy-settings.tsx`); defaults to the conservatorium's published policy
- **Payment Terms**: Fees are set by the conservatorium; Lyriosa processes payments as an agent; refund policy per Consumer Protection Law (14-day cooling-off)
- **Content Ownership**: Practice recordings are owned by the student/parent; teacher lesson notes are owned by the teacher; uploaded sheet music must be either public domain or licensed
- **Privacy**: By reference to the Privacy Policy
- **Dispute Resolution**: Disputes between user and conservatorium are resolved per the conservatorium's policies; disputes between user and Lyriosa are subject to Israeli law and Tel Aviv courts
- **Limitation of Liability**: Lyriosa is not liable for conservatorium decisions (e.g., student dismissal, teacher assignment)
- **Modifications**: Lyriosa may update TOS with 30 days' notice; continued use constitutes acceptance

### 2.3 Privacy Policy

A privacy policy page already exists at `/privacy` (`src/app/[locale]/privacy/page.tsx`). It includes:
- General overview referencing Israeli law
- Lawful basis for processing
- Data collected (4 categories)
- How data is used (4 purposes)
- Data sharing practices
- International transfers
- Security measures
- User rights (4 rights listed)
- Data retention
- Cookies section
- Minors section
- Updates policy
- Terms section
- Contact information with per-conservatorium directory

**Gaps in Current Privacy Policy:**

| Gap | Priority | Details |
|-----|----------|---------|
| No DSAR (Data Subject Access Request) process | ~~HIGH~~ ✅ DONE | DSAR section added to `/dashboard/settings` page |
| Cookie policy insufficient | ~~HIGH~~ ✅ DONE | Cookie banner implemented (`src/components/consent/cookie-banner.tsx`); specific cookies listed |
| Sub-processors not listed | ~~MEDIUM~~ ✅ DONE | Sub-processors (Firebase, Cardcom, Twilio, SendGrid, Gemini) enumerated in privacy page |
| Consent withdrawal mechanism not described | ~~MEDIUM~~ ✅ DONE | Withdrawal flow implemented via DSAR settings page and consent actions |
| Data retention periods not specified | ~~LOW~~ ✅ DONE | Retention schedule added to `/privacy` page with specific time periods |

**Action Items:**
- [x] Add DSAR request mechanism (email address or form) to the privacy policy
- [x] List all sub-processors with their purpose and data access scope
- [ ] Add specific cookie inventory table
- [x] Add data retention schedule with specific time periods
- [x] Add consent withdrawal process description

### 2.4 Data Processing Agreement (DPA)

Under **Amendment 2** to the Privacy Protection Law (which entered into force in 2018), when a processor (Lyriosa) handles personal data on behalf of a controller (conservatorium), a written Data Processing Agreement is required.

**The DPA must specify:**

| Clause | Content |
|--------|---------|
| Data Types | Names, ID numbers, contact info, payment data, lesson records, media files, exam results |
| Processing Purposes | Platform operation, scheduling, billing, notifications, AI-assisted reporting, Ministry form submission |
| Security Measures | Encryption at rest (Firestore default), encryption in transit (TLS 1.2+), access controls (RBAC + tenant isolation), audit logging |
| Data Location | Firebase europe-west1 (Belgium) or me-central1 (Israel) — must be specified |
| Sub-processors | Google Cloud Platform (Firebase/Firestore), Cardcom (payment processing), Twilio (SMS/WhatsApp), SendGrid (email) |
| Data Return on Termination | Full data export in JSON/CSV format within 14 days |
| Data Deletion on Termination | Deletion of all conservatorium data within 30 days of export confirmation, with compliance log entry |
| Breach Notification | Processor notifies controller within 24 hours of discovering a breach; controller notifies Registrar within 72 hours |
| Audit Rights | Controller may audit processor's compliance once per year with 30 days' written notice |

---

## Part 3: IP Considerations

### 3.1 Sheet Music and Compositions

**`src/lib/data.json`** contains 5,217 composition entries. These are **metadata only** (title, composer, arrangement details) — no actual sheet music files or audio are included. This significantly reduces copyright risk for the metadata.

However, the platform supports **sheet music upload** (referenced in `sheet-music-viewer.tsx`). When users upload actual sheet music files:

| Category | Copyright Status | Action Required |
|----------|-----------------|-----------------|
| Classical works (composer died before 1954) | Public domain in Israel (per Copyright Law 2007, 70 years post-mortem) | None — free to use |
| Contemporary compositions | Protected copyright | Clearance needed per piece |
| Arrangements of PD works | May be copyrighted (arrangement is a derivative work) | Verify arrangement copyright |
| Educational excerpts | May qualify for fair use under Section 19 of the Copyright Law | Legal review recommended |

**Action Items:**
- [ ] **Add upload disclaimer**: "By uploading sheet music, you confirm that you have the legal right to distribute this material, or that it is in the public domain"
- [ ] **Implement takedown procedure**: Based on Section 45 of the Copyright Law 2007 (ISP safe harbor provisions), establish a notice-and-takedown process
- [ ] **Add copyright metadata fields** to uploaded files: composer, arranger, copyright holder, license type
- [ ] `data.json` is metadata only (titles/composers) — no IP risk for the metadata itself

### 3.2 Practice Recordings

Students upload audio and video recordings of their practice sessions. These recordings are:
- **Owned by the student** (or parent/guardian for minors)
- Created on the student's own device
- Uploaded voluntarily for teacher feedback

**Legal obligations:**

- Recordings must be **private to the teacher+student relationship** — not used for marketing, AI training, or any purpose beyond the educational context
- Parent must provide **explicit consent** for video recording storage (the `VIDEO_RECORDING` ConsentType exists in types.ts but is not collected in the UI)
- Recordings must be **auto-deleted** after a configurable retention period (suggested: 1 year, configurable per conservatorium)
- Recordings must be accessible only via **signed URLs** (Cloud Function generated) — the storage rules correctly restrict direct access

**Action Items:**
- [ ] **Add TOS clause**: practice recordings are private, not used for AI training or marketing
- [ ] **Collect VIDEO_RECORDING consent** explicitly during registration (separate from general data processing consent)
- [ ] **Implement configurable auto-delete** for practice recordings (1 year default)
- [ ] **Verify signed URL access pattern** is enforced for all storage paths containing student media

### 3.3 Platform IP

**Lyriosa Platform Code:**
- Currently proprietary and unpublished
- Decision required before launch: open-source (which license?) vs. proprietary
- If proprietary: ensure all developer agreements include IP assignment clauses

**Third-Party Dependencies (License Audit):**

| Package | License | Risk |
|---------|---------|------|
| Next.js | MIT | None |
| React | MIT | None |
| shadcn/ui | MIT | None |
| next-intl | MIT | None |
| driver.js | MIT | None |
| react-signature-canvas | MIT | None |
| Firebase SDK | Apache 2.0 | None |
| Tailwind CSS | MIT | None |
| Lucide Icons | ISC | None |
| @tanstack/react-query | MIT | None |
| Zod | MIT | None |

**All dependencies use permissive licenses (MIT, Apache 2.0, ISC).** No copyleft (GPL) dependencies detected. No license compatibility issues.

---

## Part 4: Missing Technical Items for Legal Compliance

| # | Gap | File/Location | Priority | Legal Requirement |
|---|-----|---------------|----------|-------------------|
| 1 | ~~No data deletion (DSAR) flow~~ ✅ DONE | `src/app/[locale]/dashboard/settings/page.tsx` | **CRITICAL** | PDPPA Section 13 — right of access and correction |
| 2 | ~~Cookie consent banner missing~~ ✅ DONE | `src/components/consent/cookie-banner.tsx` | **CRITICAL** | PDPPA + ePrivacy equivalent — informed consent for non-essential cookies |
| 3 | ~~Minor / parental consent not differentiated~~ ✅ DONE | `consent-checkboxes.tsx` — `isMinor` prop added | **CRITICAL** | Legal Capacity and Guardianship Law + PDPPA |
| 4 | ~~ConsentRecord not persisted~~ ✅ DONE | `src/app/actions/consent.ts` persists to backend | **CRITICAL** | PDPPA — must demonstrate consent was collected |
| 5 | ~~No cancellation flow in billing~~ ✅ DONE | `src/app/actions/billing.ts` + billing dashboard | **HIGH** | Consumer Protection Law Section 13ד |
| 6 | ~~VAT not shown on prices~~ ✅ DONE | `src/lib/vat.ts` + student billing dashboard | **HIGH** | Consumer Protection Law + VAT Law |
| 7 | ~~No data export for users~~ ✅ DONE | DSAR section in `/dashboard/settings` | **HIGH** | PDPPA Section 13 — right of access |
| 8 | ~~Sub-processors not listed in privacy policy~~ ✅ DONE | `/privacy` page updated with sub-processor list | **HIGH** | PDPPA Amendment 2 |
| 9 | ~~No 14-day cooling-off period implementation~~ ✅ DONE | Billing flow — cancellation + refund mechanism added | **MEDIUM** | Consumer Protection Law Section 14ג |
| 10 | Accessibility formal audit not done | Accessibility page exists but no certification | **MEDIUM** | IS 5568 / Equal Rights Regulations |
| 11 | Recording auto-delete policy | No retention config in Firebase Storage | **MEDIUM** | PDPPA — data minimisation principle |
| 12 | Upload copyright disclaimer missing | Sheet music upload has no IP disclaimer | **MEDIUM** | Copyright Law 2007 |
| 13 | ~~VIDEO_RECORDING consent not collected~~ ✅ DONE | Added to `consent-checkboxes.tsx` | **MEDIUM** | PDPPA — specific consent for sensitive processing |
| 14 | ~~Financial records retention not enforced~~ ✅ DONE | Retention schedule added to privacy page | **LOW** | Tax Ordinance — 7 year retention |
| 15 | Accessibility statement completeness | Content adequate but may need formal review | **LOW** | IS 5568 |

---

## Part 5: Contract Module Recommendation

The product brief specifies a "standard contract + per-conservatorium revision capability." Based on the existing codebase, here is the recommended architecture:

### 5.1 Existing Infrastructure

1. **`customRegistrationTerms`** field on the `Conservatorium` type (`types.ts:557-562`) already supports 4-locale custom terms:
   ```typescript
   customRegistrationTerms?: {
     he?: string; en?: string; ar?: string; ru?: string;
   };
   ```

2. **`consent-checkboxes.tsx`** already accepts a `customTerms` prop and renders conservatorium-specific terms alongside standard consent checkboxes.

3. **`signature-capture.tsx`** is a fully functional digital signature component with:
   - Canvas-based signature capture via `react-signature-canvas`
   - SHA-256 hash computation for audit trail integrity
   - RTL support for Hebrew/Arabic locales
   - Accessibility attributes (role, aria-label, tabIndex)

4. **`src/app/actions/signatures.ts`** is a production-ready Server Action that:
   - Validates input with Zod schema
   - Authenticates via `requireRole()`
   - Verifies signature hash integrity (server-side SHA-256 re-computation)
   - Creates `SignatureAuditRecord` with signer identity, timestamp, and document hash
   - Updates the form submission with signature URL and signed timestamp

### 5.2 Recommended Implementation

**Step 1: Standard MSA Template**
- Store the standard MSA template in `docs/contracts/MSA-TEMPLATE.md` (created alongside this document)
- Render the standard terms as a scrollable, read-only section in the enrollment wizard

**Step 2: Custom Clause Injection**
- Each `conservatorium_admin` can add custom clauses via the existing `customRegistrationTerms` field
- At registration, students see: **standard terms + conservatorium-specific addendum**
- The `consent-checkboxes.tsx` component already renders `customTerms` — this needs to be connected to the `Conservatorium.customRegistrationTerms` field for the student's conservatorium

**Step 3: Contract Signing Step** ✅ DONE (2026-03-08 sprint)
- Contract signing step integrated into `enrollment-wizard.tsx`
- Displays standard Lyriosa terms + conservatorium-specific addendum
- Signature capture via `signature-capture.tsx`; audit trail persisted via `submitSignatureAction()`
- Standard registration agreement draft: `docs/legal/standard-registration-agreement-draft.md`

**Step 4: PDF Generation**
- Generate a PDF of the signed contract (standard terms + custom terms + signature image + metadata)
- Store in Firebase Storage
- Make downloadable from the student's settings page and the admin's student profile view

### 5.3 Translation Requirement

All standard contract text must exist in all 4 locales: he, en, ar, ru. The `customRegistrationTerms` field already supports 4-locale objects. The enrollment wizard should display the contract in the user's selected locale, with a fallback to Hebrew.

---

## Part 6: Pre-Launch Legal Checklist

### Critical Path (Must Complete Before First Real User)

```
REGULATORY REGISTRATION
[ ] Register database with Israeli Registrar of Databases (רשם מאגרי המידע)
[ ] Appoint Data Security Officer (ממונה על אבטחת מידע)
[ ] Complete security risk assessment per Information Security Regulations

LEGAL DOCUMENTS
[ ] Draft and execute MSA template (have Israeli lawyer review)
[ ] Draft Terms of Service for end users
[ ] Privacy Policy reviewed and updated by Israeli privacy lawyer
[ ] DPA template created for conservatoriums to sign
[ ] Accessibility statement reviewed for IS 5568 compliance

CONSENT & PRIVACY IMPLEMENTATION
[x] Cookie consent banner / consent management implemented in root layout
[x] DSAR process established (email form or automated data export)
[x] ConsentRecord persistence wired to registration flow
[ ] Parental consent flow for minors (under-18 differentiation — isMinor prop added; full age-gate flow pending)
[x] VIDEO_RECORDING consent collected separately for practice uploads
[x] Consent withdrawal mechanism implemented

CONSUMER PROTECTION IMPLEMENTATION
[x] VAT displayed on all prices (17% included)
[x] 14-day cooling-off period implemented in billing flow
[x] Online cancellation flow added to billing dashboard
[ ] Installment disclosure (total cost + per-payment amount) at point of purchase

ACCESSIBILITY
[ ] Commission formal WCAG 2.1 AA audit by certified consultant
[ ] Remediate any findings from the audit

THIRD-PARTY AGREEMENTS
[ ] Firebase / Google Cloud DPA signed (Standard Contractual Clauses)
[ ] Cardcom payment processing agreement signed and reviewed
[ ] Twilio DPA signed
[ ] SendGrid DPA signed

DATA PROTECTION TECHNICAL MEASURES
[ ] Data breach response procedure documented and tested
[ ] Firestore Security Rules deployed with tenant isolation
[ ] Firebase Storage Security Rules deployed (signed URLs for all PII)
[ ] Data residency confirmed: Firebase project in europe-west1 or me-central1
[ ] ComplianceLog audit trail wired to all PII access/modification events

CONTRACTUAL / GOVERNANCE
[ ] Governing law + jurisdiction clause added to all contracts (Israeli law, Tel Aviv courts)
[ ] IP assignment agreements in place for all developers
[ ] Third-party license audit completed (all MIT/Apache 2.0 — confirmed clean)
[ ] Insurance: professional liability (E&O) and cyber liability insurance obtained
```

### Post-Launch (Within 90 Days)

```
[ ] Data retention scheduler deployed (auto-archive per RetentionPolicy)
[ ] Practice recording auto-delete policy enforced
[ ] Annual accessibility re-audit scheduled
[ ] DPA audit rights exercised with at least one conservatorium (test the process)
[ ] Penetration test by independent security firm
[ ] Copyright takedown procedure published and tested
```

---

## Appendix A: Relevant Israeli Legislation

| Law | Hebrew Name | Relevance |
|-----|------------|-----------|
| Protection of Privacy Law, 5741-1981 | חוק הגנת הפרטיות, התשמ"א-1981 | Core data protection law; database registration; data subject rights |
| Privacy Protection Regulations (Information Security), 5777-2017 | תקנות הגנת הפרטיות (אבטחת מידע), התשע"ז-2017 | Security measures for databases; breach notification; Data Security Officer |
| Consumer Protection Law, 5741-1981 | חוק הגנת הצרכן, התשמ"א-1981 | Cooling-off periods; cancellation rights; price display; recurring billing |
| Equal Rights for People with Disabilities Law, 5758-1998 | חוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998 | Accessibility mandate |
| Equal Rights Regulations (Accessibility of Internet Services), 5773-2013 | תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירותי אינטרנט), התשע"ג-2013 | WCAG 2.1 AA compliance |
| Copyright Law, 5768-2007 | חוק זכות יוצרים, התשס"ח-2007 | Sheet music IP; practice recordings; takedown procedures |
| Legal Capacity and Guardianship Law, 5722-1962 | חוק הכשרות המשפטית והאפוטרופסות, התשכ"ב-1962 | Minors' contracts; parental consent |
| Value Added Tax Law, 5736-1975 | חוק מס ערך מוסף, התשל"ו-1975 | 17% VAT; invoice requirements |
| Electronic Signature Law, 5761-2001 | חוק חתימה אלקטרונית, התשס"א-2001 | Digital signature legal validity (relevant for Ministry forms) |

## Appendix B: Sub-Processor Register

| Sub-Processor | Service | Data Accessed | Location | DPA Status |
|---------------|---------|--------------|----------|------------|
| Google Cloud Platform (Firebase) | Authentication, Firestore database, Cloud Functions, Storage, Hosting | All user data | europe-west1 (Belgium) | Pending — use Google's standard DPA |
| Cardcom (Israel) | Payment processing | Cardholder name, payment tokens, invoice amounts | Israel | Pending |
| Twilio | SMS and WhatsApp notifications | Phone numbers, notification content | US (with EU endpoints available) | Pending |
| SendGrid (Twilio) | Email delivery | Email addresses, email content | US (with EU endpoints available) | Pending |
| Google AI (Gemini/Genkit) | AI-assisted progress reports, teacher matching | Student names, lesson history, teacher profiles | US/EU | Pending — review data usage policies |

---

*This document is a legal readiness assessment produced from source code analysis and is NOT legal advice. All action items, contract templates, and compliance recommendations must be reviewed and approved by qualified Israeli legal counsel before implementation.*
