# PM Signature PDF Embedding Plan

**Date:** 2026-03-06
**Task:** #28 — Digital Signature Capture Component
**Author:** PM Agent

---

## 1. Current State

### What Was Built

1. **`src/components/forms/signature-capture.tsx`** — Reusable client component with:
   - `react-signature-canvas` for touch/mouse input
   - SHA-256 hashing via Web Crypto API (both client-side and server-verified)
   - IS 5568 accessibility: `role="img"`, `aria-label`, `tabIndex`, focus-within border
   - RTL-aware layout using CSS Logical Properties (`start-2` instead of `left-2`)
   - Validation state with `role="alert"` for screen readers
   - Loading/submitting state management

2. **`src/app/actions/signatures.ts`** — Server Action with:
   - Zod schema validation for all inputs
   - `requireRole()` authentication gate (admin, teacher, parent, ministry_director)
   - Server-side SHA-256 re-computation to verify client hash integrity
   - Form lookup, signatureUrl persistence, status update
   - `SignatureAuditRecord` creation (logged; Firestore write pending Admin SDK wiring)

3. **`src/app/[locale]/dashboard/forms/[id]/page.tsx`** — Integration:
   - Replaced raw `SignatureCanvas` in AlertDialog with `SignatureCapture` component
   - `handleConfirmApproval` now calls `submitSignatureAction` server action
   - Loading state during submission (`isSignatureSubmitting`)
   - Error handling with toast on failure

4. **Translation keys** added to `he.json`, `en.json`, `ar.json` for `Signature` namespace.

### What Works Now

- Admin clicks "Approve & Sign" on a form in PENDING_ADMIN status
- Signature dialog opens with the `SignatureCapture` component
- User draws signature on canvas
- Client computes SHA-256 hash of the data URL
- Server Action validates input, re-computes hash, verifies match
- Form is updated with `signatureUrl`, `signedAt`, `status: APPROVED`
- `SignatureAuditRecord` is created with immutable audit fields
- Signature image displays in the form detail sidebar

---

## 2. PDF Embedding Plan (Next Phase)

The existing `generatePdf` function (lines 89-204 in the form detail page) already embeds signatures:

```typescript
if (form.signatureUrl) {
    doc.addImage(form.signatureUrl, 'PNG', 140, pageHeight - 55, 50, 25);
}
```

This works because `signatureUrl` is a base-64 data URL that `jsPDF.addImage` accepts directly. However, for production-grade Ministry form PDFs, the following enhancements are needed:

### 2.1 Signature Metadata Overlay

Add a text block below the signature in the PDF with:
- Signer name (from `SignatureAuditRecord.signerName`)
- Signing timestamp (ISO 8601)
- Signature hash (first 12 chars of SHA-256)
- "Signed digitally via Harmonia" watermark

```typescript
// After addImage:
doc.setFontSize(7);
doc.setTextColor(128, 128, 128);
doc.text(`Signed: ${auditRecord.signerName}`, 165, pageHeight - 28, { align: 'center' });
doc.text(`${auditRecord.signedAt}`, 165, pageHeight - 24, { align: 'center' });
doc.text(`Hash: ${auditRecord.signatureHash.slice(0, 12)}...`, 165, pageHeight - 20, { align: 'center' });
```

### 2.2 Document Hash for Tamper Detection

Before generating the PDF, compute a SHA-256 hash of the form content (all field values concatenated). Store this as `documentHash` in the `SignatureAuditRecord`. If the form content changes after signing, the hash mismatch proves tampering.

```typescript
// In signature-capture integration:
const formContentString = JSON.stringify({
  formType: form.formType,
  studentName: form.studentName,
  repertoire: form.repertoire,
  // ... all form fields
});
const documentHash = await sha256(formContentString);
```

### 2.3 Server-Side PDF Generation (Cloud Function)

For legal validity, PDFs should be generated server-side (not client-side with jsPDF) to prevent tampering:

- **Cloud Function:** `generateSignedFormPdf`
- **Trigger:** Called after `submitSignatureAction` succeeds
- **Output:** PDF uploaded to Firebase Storage at `forms/{conservatoriumId}/{formId}/signed.pdf`
- **Library:** `pdf-lib` (lightweight, server-friendly, supports embedding images)
- **Storage:** URL stored in `FormSubmission.pdfUrl`

### 2.4 PDF/A Compliance (Future)

For archival purposes and Ministry acceptance, PDFs should conform to PDF/A-1b:
- Embed all fonts (Rubik for Hebrew, with fallback)
- Include XMP metadata
- Use `pdf-lib` with ICC color profile embedding

---

## 3. Firestore Admin SDK Integration (Remaining Work)

The `submitSignatureAction` currently:
- Updates the form via `db.forms.update()` (works with current adapter)
- Logs the `SignatureAuditRecord` to console

**Remaining:** When the `FirebaseAdapter` is fully wired, add:

```typescript
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();
await db.collection('signatureAuditRecords').doc(auditId).set(auditRecord);
```

This must use the Admin SDK because Firestore rules set `allow write: if false` on `/signatureAuditRecords/{auditId}` — only server-side writes are permitted, ensuring the audit trail is immutable.

---

## 4. Firebase Storage Upload (Remaining Work)

Currently, `signatureUrl` stores the full base-64 data URL on the Firestore document. For production:

1. Decode the base-64 data URL to a `Buffer`
2. Upload to Firebase Storage at `signatures/{conservatoriumId}/{formSubmissionId}/{auditId}.png`
3. Generate a signed URL (not public) with 7-year expiry
4. Store the signed URL (not the data URL) in `FormSubmission.signatureUrl`

This reduces Firestore document size and follows the Storage Security Rules pattern where only admins and Ministry directors can read signature images.

---

## 5. Remaining Integration Points

| Integration | Status | Owner |
|-------------|--------|-------|
| Ministry Director signing (FINAL_APPROVED) | Pending | Frontend |
| Parent signing for enrollment forms | Pending | Frontend |
| Teacher signing for exam recommendations | Pending | Frontend |
| Document hash computation before signing | Pending | PM / Backend |
| Server-side PDF generation Cloud Function | Pending | Backend |
| Firebase Storage upload for signatures | Pending | DBA / Backend |
| Bulk PDF export (ZIP) for Ministry Director | Pending | Backend |
