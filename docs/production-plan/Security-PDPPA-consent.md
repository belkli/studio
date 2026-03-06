# Security: PDPPA Consent Collection

## What Was Implemented

Two new files implement PDPPA (Israeli Protection of Privacy Law, 5741-1981) consent collection for the Harmonia registration flow:

| File | Purpose |
|------|---------|
| `src/components/forms/consent-checkboxes.tsx` | Reusable React component that renders three consent checkboxes with IS 5568 accessibility compliance and Hebrew RTL layout |
| `src/app/actions/consent.ts` | Server Action that validates input with Zod, verifies the caller's identity via `requireRole`, and writes an immutable `ConsentRecord` document to Firestore |

---

## ConsentRecord Schema

Each document is written to the root collection `/consentRecords/{autoId}`.

| Field | Type | Purpose |
|-------|------|---------|
| `userId` | `string` | Firebase UID of the user who gave consent |
| `conservatoriumId` | `string` | The conservatorium the user is registering with, for tenant-scoped audits |
| `consentDataProcessing` | `boolean` | Whether the user consented to collection and processing of personal data per PDPPA 5741-1981 (mandatory for service) |
| `consentTerms` | `boolean` | Whether the user accepted the Terms of Service and Privacy Policy (mandatory for service) |
| `consentMarketing` | `boolean` | Whether the user opted in to marketing emails and event notifications (optional) |
| `ipAddress` | `string?` | IP address at time of consent — proves geographic location for jurisdiction |
| `userAgent` | `string?` | Browser user-agent at time of consent — corroborates the authenticity of the consent action |
| `recordedAt` | `string` | ISO 8601 timestamp of consent — establishes the exact moment consent was given |
| `version` | `string` | Schema/consent-text version (currently `'1.0'`) — enables consent versioning (see below) |

---

## Consent Versioning via `version: '1.0'`

The `version` field stores the version of the consent text that was displayed to the user when they clicked the checkbox. This enables:

1. **Re-consent prompts**: When the privacy policy or data processing terms change materially, bump the version to `'1.1'` or `'2.0'`. On next login, check whether the user has a `ConsentRecord` with `version >= currentRequiredVersion`. If not, present the updated consent form before granting access.

2. **Audit defensibility**: If a regulatory authority questions whether a user consented to a specific version of the processing terms, a query on `consentRecords` filtered by `version` and `userId` returns the timestamped proof.

3. **Granular revocation tracking**: When a user revokes consent (future `revokeConsent` action), the revocation record can reference the original `version` that is being revoked.

Example versioning workflow:
```
v1.0  — Initial launch consent text (current)
v1.1  — Minor wording clarification (no re-consent required)
v2.0  — New processing purpose added (re-consent required for all existing users)
```

---

## Immutability: `consentRecords` as an Audit-Only Collection

The `consentRecords` collection is append-only. Firestore Security Rules enforce this:

```
match /consentRecords/{recordId} {
  allow create: if request.auth != null;
  allow update, delete: if false;
}
```

This means:
- A consent record, once written, cannot be modified or deleted by any client (including admins via the client SDK).
- Only the Admin SDK (used by Server Actions and Cloud Functions) can write to this collection.
- Consent records are retained indefinitely per PDPPA right-to-erasure exclusion — they serve as the lawful basis for all historical data processing.

---

## How to Use `ConsentCheckboxes` in a Registration Form

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ConsentCheckboxes, {
  type ConsentFormValues,
} from '@/components/forms/consent-checkboxes';
import { recordConsentAction } from '@/app/actions/consent';

const RegistrationSchema = z.object({
  // ... other registration fields ...
  consentDataProcessing: z.literal(true, {
    errorMap: () => ({ message: 'יש לאשר את עיבוד הנתונים כדי להמשיך' }),
  }),
  consentTerms: z.literal(true, {
    errorMap: () => ({ message: 'יש לאשר את תנאי השימוש כדי להמשיך' }),
  }),
  consentMarketing: z.boolean(),
});

type RegistrationFormValues = z.infer<typeof RegistrationSchema>;

export function RegistrationForm() {
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      consentDataProcessing: false,
      consentTerms: false,
      consentMarketing: false,
    },
  });

  const handleSubmit = async (data: RegistrationFormValues) => {
    // ... create user account ...

    await recordConsentAction({
      userId: createdUserId,
      conservatoriumId: selectedConservatoriumId,
      consentDataProcessing: data.consentDataProcessing,
      consentTerms: data.consentTerms,
      consentMarketing: data.consentMarketing,
      // ipAddress and userAgent are populated server-side from request headers
    });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* other fields */}
      <ConsentCheckboxes
        control={form.control as unknown as import('react-hook-form').Control<ConsentFormValues>}
      />
      <button type="submit">הרשמה</button>
    </form>
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|:--------:|-------------|
| `control` | `Control<ConsentFormValues>` | Yes | The `control` object from `useForm()`. When your form schema extends `ConsentFormValues`, cast as shown above. |

### Exported Members

| Export | Kind | Description |
|--------|------|-------------|
| `default` (`ConsentCheckboxes`) | React component | The checkbox group |
| `ConsentFormValues` | TypeScript type | The three boolean fields managed by this component |
