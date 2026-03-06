# PDPPA Compliance Report — Harmonia Platform

## Overview

The Israeli Protection of Privacy Law (PDPPA / חוק הגנת הפרטיות, 5741-1981) and its associated regulations govern the collection, storage, processing, and transfer of personal data. Harmonia stores sensitive personal data including Israeli ID numbers (ת"ז) of minors and parents, children's audio/video recordings, financial records, Ministry exam results, and scholarship financial disclosures.

This report maps every PDPPA obligation to its current implementation status and provides a remediation plan.

---

## 1. Obligation Matrix

| # | PDPPA Obligation | Type Defined | Implementation | Status | Remediation |
|---|-----------------|:----:|----------------|:------:|-------------|
| 1 | **Consent collection** | `ConsentRecord` in types.ts | Firestore path `/consentRecords/{recordId}` planned | PARTIAL | Wire to UI (see Section 2) |
| 2 | **Purpose limitation** | Implicit in `ConsentType` enum | No enforcement mechanism | NOT STARTED | Server Actions must check consent before processing |
| 3 | **Data access logging** | `ComplianceLog` in types.ts | Type exists, not wired | PARTIAL | Wire to Server Actions (see Section 3) |
| 4 | **Digital signature audit trail** | `SignatureAuditRecord` in types.ts | Type with SHA-256 hashes defined | PARTIAL | Wire to form signing flow (see Section 4) |
| 5 | **Right to access (Subject Access Request)** | Not implemented | No SAR endpoint | NOT STARTED | Implement data export endpoint |
| 6 | **Right to erasure** | `ComplianceLog.PII_DELETED` action | No admin deletion UI or Server Action | NOT STARTED | Implement erasure workflow (see Section 5) |
| 7 | **Data retention policy** | `RetentionPolicy` in types.ts | Scheduler `archiveExpiredRecords` not deployed | PARTIAL | Deploy Cloud Function scheduler |
| 8 | **Breach notification** | Not implemented | No incident response procedure | NOT STARTED | Document IR procedure |
| 9 | **Data residency** | Not configured | Firebase project not yet created | PENDING | Must use `europe-west1` or `me-central1` |
| 10 | **Under-13 protection** | Implicit via `parentId` pattern | Students <13 have no login, parent acts as proxy | PARTIAL | Audit complete (see Section 6) |
| 11 | **Cross-border transfer** | Not assessed | Firebase default may route to US | AT RISK | Configure data residency |
| 12 | **Data minimization** | Not assessed | Mock data includes extensive PII fields | AT RISK | Review field necessity |
| 13 | **Encryption at rest** | Firebase managed | Firestore encryption is automatic | DONE | No action needed |
| 14 | **Encryption in transit** | HSTS configured | `next.config.ts` has HSTS header | DONE | No action needed |
| 15 | **Database registration** | Not done | PDPPA requires registration with PPA | NOT STARTED | Register database with Privacy Protection Authority |

---

## 2. ConsentRecord UI Wiring Plan

### Current State
- `ConsentRecord` type defined in `src/lib/types.ts:1700-1709`
- `ConsentType` enum: `'DATA_PROCESSING' | 'MARKETING' | 'VIDEO_RECORDING' | 'SCHOLARSHIP_DATA'`
- No UI component collects consent
- No Server Action persists consent records

### Required Implementation

**A. Registration consent flow:**
1. Add a consent checkbox group to the registration form (complete-registration page)
2. Consent types presented at registration:
   - `DATA_PROCESSING` (mandatory for service — cannot proceed without)
   - `MARKETING` (optional)
   - `VIDEO_RECORDING` (must be collected before first practice video upload)
3. Parent must provide consent for students under 18

**B. Server Action: `recordConsent`**
```typescript
async function recordConsent(input: {
  userId: string;
  consentType: ConsentType;
  consentVersion: string;
}): Promise<ConsentRecord> {
  const claims = await requireRole(['student', 'parent', 'teacher', 'conservatorium_admin', 'site_admin']);
  // For minors, verify that the caller is the parent
  // Create ConsentRecord in Firestore
  // Log to ComplianceLog with action 'CONSENT_GIVEN'
}
```

**C. Server Action: `revokeConsent`**
```typescript
async function revokeConsent(input: {
  consentRecordId: string;
}): Promise<void> {
  const claims = await verifyAuth();
  // Set revokedAt timestamp on ConsentRecord
  // Log to ComplianceLog with action 'CONSENT_REVOKED'
  // If VIDEO_RECORDING revoked, trigger practice video deletion
}
```

**D. Consent management UI:**
- Add "Privacy Settings" section to user profile/settings page
- Show current consent status for each type
- Allow revocation with confirmation dialog
- Display privacy policy version and date of consent

---

## 3. ComplianceLog Wiring Plan

### Current State
- `ComplianceLog` type defined in `src/lib/types.ts:1815-1823`
- Actions: `'PII_DELETED' | 'CONSENT_GIVEN' | 'CONSENT_REVOKED' | 'DATA_EXPORTED' | 'BREACH_REPORTED'`
- Not wired to any Server Action

### Required Implementation

**A. Create `logComplianceEvent` helper:**
```typescript
// src/lib/compliance.ts
async function logComplianceEvent(event: {
  action: ComplianceLog['action'];
  subjectId: string;
  reason: string;
  performedBy: string;
}): Promise<void> {
  // Write to Firestore: /complianceLogs/{autoId}
  // Include timestamp, action, subjectId, reason, performedBy
}
```

**B. Integration points (where to call `logComplianceEvent`):**

| Server Action | Event | Action |
|--------------|-------|--------|
| `recordConsent` | User gives consent | `CONSENT_GIVEN` |
| `revokeConsent` | User revokes consent | `CONSENT_REVOKED` |
| `deleteUserPII` | Admin erases user data | `PII_DELETED` |
| `exportUserData` | SAR data export | `DATA_EXPORTED` |
| (Manual admin action) | Breach detected | `BREACH_REPORTED` |

**C. Admin dashboard — Compliance Log viewer:**
- Table view of all compliance events
- Filterable by action type, date range, subject
- Exportable to CSV for auditor review
- Only accessible to `site_admin` and `conservatorium_admin`

---

## 4. SignatureAuditRecord Wiring Plan

### Current State
- `SignatureAuditRecord` type defined in `src/lib/types.ts:1712-1723`
- Fields: `signatureHash` (SHA-256 of signature dataUrl) + `documentHash` (SHA-256 of form content)
- `SignatureSubmissionSchema` exists in `src/lib/validation/forms.ts:45-52`
- Form signing UI exists but does not persist audit records

### Required Implementation

**A. Update the signature submission Server Action:**
```typescript
async function submitSignature(input: SignatureSubmissionInput): Promise<void> {
  const claims = await verifyAuth();

  // 1. Compute SHA-256 hashes
  const signatureHash = sha256(input.signatureDataUrl);
  const formContent = await getFormSubmission(input.formSubmissionId);
  const documentHash = sha256(JSON.stringify(formContent));

  // 2. Store signature image in Firebase Storage (signed URL, not public)
  const signatureUrl = await uploadSignature(input.signatureDataUrl, input.formSubmissionId);

  // 3. Create SignatureAuditRecord in Firestore
  const auditRecord: SignatureAuditRecord = {
    id: generateId(),
    formSubmissionId: input.formSubmissionId,
    signerId: claims.uid,
    signerRole: claims.role,
    signerName: formContent.studentName, // or parent name
    signedAt: new Date().toISOString(),
    ipAddress: headers().get('x-forwarded-for') || 'unknown',
    userAgent: headers().get('user-agent') || 'unknown',
    signatureHash,
    documentHash,
  };

  // 4. Update FormSubmission with signature URL and signer info
  // 5. Log compliance event
}
```

**B. SHA-256 utility:**
```typescript
// src/lib/crypto-utils.ts
import { createHash } from 'crypto';

export function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf-8').digest('hex');
}
```

---

## 5. Right-to-Erasure Implementation Plan

### PDPPA Requirements
- Data subjects (or parents of minors) may request deletion of personal data
- Certain records must be retained per Israeli tax law (7 years for financial records)
- Ministry exam records may need to be retained per Ministry requirements

### Implementation

**A. Admin UI: "Delete User Data" action**
1. Available only to `site_admin` role
2. Confirmation dialog with explicit list of what will be deleted
3. Two-phase process: soft-delete (mark as deleted) then hard-delete after 30-day grace period

**B. What gets deleted:**
| Data Category | Action | Retention Override |
|--------------|--------|-------------------|
| User profile (name, email, phone) | Anonymize (replace with "Deleted User #{id}") | None |
| Israeli ID number (ת"ז) | Delete entirely | None |
| Practice videos | Delete from Storage | None |
| Practice logs | Anonymize studentId | None |
| Lesson notes (private) | Delete | None |
| Form submissions | Retain anonymized for Ministry records | 10 years |
| Invoices / payment records | Retain for tax compliance | 7 years |
| Consent records | Retain (proof of lawful basis) | Indefinite |
| Compliance logs | Retain (audit trail) | Indefinite |
| Signature audit records | Retain with anonymized signer info | 10 years |

**C. Server Action: `eraseUserPII`**
```typescript
async function eraseUserPII(userId: string): Promise<void> {
  const claims = await requireRole(['site_admin']);

  // 1. Anonymize user document
  // 2. Delete practice videos from Storage
  // 3. Anonymize lesson notes, practice logs
  // 4. Retain financial records with anonymized references
  // 5. Create ComplianceLog entry: PII_DELETED
  // 6. Send confirmation email to data subject
}
```

---

## 6. Under-13 Data Protection Audit

### Current Protections (Verified)

| Protection | Implementation | Status |
|-----------|---------------|--------|
| No direct login for under-13 | `User.parentId` set, no email on student record | IMPLEMENTED |
| Parent is authenticated actor | Parent userId used for all API calls | IMPLEMENTED |
| Parent consent for video recording | `ConsentRecord` type with `VIDEO_RECORDING` | TYPE ONLY |
| No direct communication to minors | `dispatchNotification` must use parent's userId | DOCUMENTED (not enforced in code) |
| Practice videos not publicly accessible | Firebase Storage signed URLs required | NOT YET ENFORCED |
| Parent access via Firestore rules | `parentOf/{parentId_studentId}` collection | RULES DEFINED |

### Required Remediations

1. **Enforce notification routing in code:**
   - Add a guard in the notification Server Action that checks if the target user has `parentId` set
   - If so, route all notifications to the parent's userId instead
   - Log any attempted direct contact to under-13 users as a compliance event

2. **Firebase Storage Security Rules for practice videos:**
   ```
   match /practiceVideos/{videoId} {
     allow read: if request.auth != null && (
       resource.metadata.studentId == request.auth.uid ||
       exists(/databases/$(database)/documents/parentOf/$(request.auth.uid + '_' + resource.metadata.studentId)) ||
       request.auth.token.role == 'teacher' ||
       request.auth.token.role == 'conservatorium_admin'
     );
     allow write: if false; // Uploads via signed URLs only
   }
   ```

3. **Video consent gate:**
   - Before first practice video upload, check that `VIDEO_RECORDING` consent exists for the student
   - If student is under 13, consent must be from parent (check `givenByUserId` matches `parentId`)

4. **Age verification:**
   - Calculate age from `User.dateOfBirth` or `User.birthDate`
   - Add server-side guard: if age < 13 and no `parentId`, reject the operation
   - Add server-side guard: if age < 13, never set `email` on the User document

---

## 7. Data Residency Requirements

### Firebase Project Configuration

Harmonia must store all data in a region compliant with Israeli privacy law. Two options:

| Region | Location | Latency from Israel | PDPPA Compliant | Notes |
|--------|----------|-------------------|:----:|-------|
| `europe-west1` | Belgium | ~50ms | Yes | EU adequacy, recommended |
| `me-central1` | Doha, Qatar | ~30ms | Possibly | Newer region, verify data processing agreement |
| `me-west1` | Tel Aviv | ~5ms | Yes | Ideal but limited Firebase services |

### Recommendation: `europe-west1` (Belgium)

- Full Firebase service availability (Firestore, Auth, Functions, Storage, Hosting)
- EU GDPR adequacy provides strong privacy framework compatible with PDPPA
- Acceptable latency for Israeli users
- If `me-west1` (Tel Aviv) gains full Firestore support, migrate

### Required Configuration

1. **Firestore:** Create database in `europe-west1`
2. **Firebase Storage:** Default bucket in `europe-west1`
3. **Cloud Functions:** Deploy to `europe-west1`
4. **Firebase Hosting:** Uses global CDN (no region restriction needed)
5. **Environment variables:** Set `FIREBASE_REGION=europe-west1`

### Data Transfer Assessment

| External Service | Data Transferred | Location | Mitigation |
|-----------------|-----------------|----------|------------|
| Cardcom (payments) | Invoice amount, user reference | Israel | Compliant |
| Google OAuth | Email, name | Google global | Data Processing Agreement with Google |
| Microsoft OAuth | Email, name | Microsoft global | Data Processing Agreement with Microsoft |
| Twilio (SMS) | Phone number, OTP | US servers | Use Twilio EU region or switch to Firebase Phone Auth |
| Firebase Auth | Email, phone, name | Google global | Covered by Firebase Terms |

---

## 8. Database Registration

Under PDPPA Section 8, databases containing personal data about more than 10,000 individuals must be registered with the Privacy Protection Authority (PPA / הרשות להגנת הפרטיות).

### Action Items

- [ ] Register the database with PPA before exceeding 10,000 user records
- [ ] Appoint a Data Protection Officer (DPO) per Regulation 3A
- [ ] Prepare and publish a privacy policy in Hebrew (and other supported languages)
- [ ] Include in privacy policy: purpose of collection, data categories, retention periods, rights of data subjects
- [ ] Document the database purpose as: "Management of music conservatorium operations including student records, lesson scheduling, financial records, and Ministry exam administration"

---

## 9. Breach Notification Procedure

### PDPPA Requirements
- Notify the PPA within 72 hours of becoming aware of a breach
- Notify affected data subjects "without undue delay"
- For breaches involving minors' data, expedite notification

### Incident Response Checklist

1. **Detect:** Monitor Firebase audit logs, Cloud Function error rates
2. **Contain:** Revoke all session cookies (`adminAuth.revokeRefreshTokens` for all affected users)
3. **Assess:** Determine scope — which users, which data types
4. **Notify PPA:** Within 72 hours, submit notification at https://www.gov.il/he/service/report-a-breach-to-the-privacy-protection-authority
5. **Notify subjects:** Email all affected users and parents
6. **Log:** Create `ComplianceLog` entry with action `BREACH_REPORTED`
7. **Remediate:** Fix vulnerability, rotate credentials, update security rules
8. **Review:** Post-incident review within 14 days

---

## 10. Summary of Blocking Items

| Priority | Item | Owner | Blocks |
|----------|------|-------|--------|
| P0 | Wire ConsentRecord to registration flow | Frontend + Backend | Production launch |
| P0 | Configure Firebase project in `europe-west1` | Infra | All Firestore operations |
| P0 | Deploy Firebase Storage security rules | DBA | Practice video uploads |
| P1 | Implement ComplianceLog logging in Server Actions | Backend | Audit readiness |
| P1 | Implement right-to-erasure Server Action | Backend | PDPPA compliance |
| P1 | Under-13 notification routing guard | Backend | Minor data protection |
| P1 | Practice video consent gate | Frontend + Backend | Video feature launch |
| P2 | SAR (Subject Access Request) export endpoint | Backend | Full compliance |
| P2 | Database registration with PPA | Legal/Admin | Regulatory requirement |
| P2 | Breach notification procedure documentation | Security | Incident readiness |
| P3 | Data retention scheduler Cloud Function | Backend | Long-term compliance |
