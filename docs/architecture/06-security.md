# 06 — Security

## 1. Security Architecture Summary

Harmonia stores Israeli ID numbers (ת"ז) of minors and parents, video/audio recordings of children, credit card histories, Ministry exam results, and scholarship financial disclosures. This makes a security breach a violation of the **Israeli Protection of Privacy Law (PDPPA / חוק הגנת הפרטיות, 5741-1981)** with civil and regulatory consequences.

> ⚠️ **Current prototype status:** The prototype's authentication is `localStorage.getItem('harmonia-user')` — role escalation is trivially possible from browser DevTools. `verifyAuth()` unconditionally returns `true`. There are no Firestore Security Rules deployed. **These must all be resolved before any real user is onboarded.**

---

## 2. Authentication

### 2.1 Authentication Methods

| Method | Used By | Provider |
|--------|---------|----------|
| Email + Password | All roles | Firebase Auth |
| Google OAuth | All roles (optional) | Firebase Auth — GoogleAuthProvider |
| Microsoft OAuth | All roles (optional) | Firebase Auth — OAuthProvider('microsoft.com') |
| Magic Link (Email) | Parents (low-tech) | Firebase Auth — sendSignInLinkToEmail |
| Phone OTP (SMS) | Student 13+, Parent (fallback) | Firebase Auth via Twilio |

### 2.2 OAuth Progressive Registration

OAuth users (Google / Microsoft) do **not** need to pre-register. The flow:

```
OAuth authenticate → check if email exists in Harmonia
  ├── EXISTS → restore session directly
  └── NEW    → "Complete Registration" wizard (pre-filled from provider profile)
                → role assigned during wizard, not by OAuth provider
```

Key rules:
- Admin accounts cannot be self-created via OAuth — they must be invited by `SITE_ADMIN`
- Same email = same account (OAuth provider is linked to existing account, not duplicated)
- `registrationSource` field tracks the origin: `'email' | 'google' | 'microsoft' | 'admin_created'`

### 2.3 Session Management

- Firebase ID tokens expire in **1 hour**. Session cookies (`__session`) are issued by the server and last up to 14 days.
- The Next.js middleware validates the session cookie on every request using Firebase Admin SDK `verifySessionCookie()`.
- On token refresh, Custom Claims are re-read from Firebase Auth — role changes take effect on next request without forcing logout.

---

## 3. Authorisation — Role-Based Access Control

### 3.1 Custom Claims (Server-Side Role Authority)

Roles are stored in **Firebase Custom Claims**, not in `localStorage` or any client-accessible store. Claims are set by the `onUserApproved` Cloud Function whenever `users/{userId}.approved` or `users/{userId}.role` changes.

```typescript
// Firebase Custom Claims payload:
{
  role: UserRole;
  conservatoriumId: string;
  approved: boolean;
}
```

### 3.2 Middleware Route Protection

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('__session')?.value;
  if (!token) return NextResponse.redirect('/login');

  const decoded = await verifySessionCookie(token);  // throws on invalid
  if (!decoded.approved) return NextResponse.redirect('/pending-approval');

  // Inject validated claims for Server Components (never trust client headers)
  const headers = new Headers(request.headers);
  headers.set('x-user-id', decoded.uid);
  headers.set('x-user-role', decoded.role);
  headers.set('x-conservatorium-id', decoded.conservatoriumId);

  return NextResponse.next({ request: { headers } });
}
```

### 3.3 Server Action Guard Pattern

Every Server Action and Callable Function validates claims before any logic:

```typescript
// src/lib/auth-utils.ts
export async function requireRole(
  allowedRoles: UserRole[],
  conservatoriumIdMustMatch?: string
): Promise<DecodedIdToken> {
  const claims = await getClaimsFromRequestHeaders();
  if (!allowedRoles.includes(claims.role)) throw new Error('FORBIDDEN');
  if (conservatoriumIdMustMatch && claims.conservatoriumId !== conservatoriumIdMustMatch) {
    throw new Error('TENANT_MISMATCH');
  }
  return claims;
}
```

---

## 4. Firestore Security Rules

All Firestore rules enforce:
1. Authentication required for all operations
2. Tenant isolation (`conservatoriumId` from Custom Claims must match document field)
3. Role-based field access (e.g., only `TEACHER` or `ADMIN` can write `attendanceMarkedAt`)
4. Parent-child isolation (`parentOf/{parentId_studentId}` collection used for fast rule checks)

```javascript
// Abbreviated canonical rules:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() { return request.auth != null; }
    function hasRole(role) { return request.auth.token.role == role; }
    function isSameTenant(cid) { return request.auth.token.conservatoriumId == cid; }
    function isApproved() { return request.auth.token.approved == true; }

    // Users — users can read their own profile; admins can read all in their tenant
    match /users/{userId} {
      allow read: if isSignedIn() && isApproved() &&
        (request.auth.uid == userId || hasRole('CONSERVATORIUM_ADMIN') || hasRole('SITE_ADMIN'));
      allow write: if isSignedIn() && hasRole('CONSERVATORIUM_ADMIN') &&
        isSameTenant(resource.data.conservatoriumId);
    }

    // Lesson slots — scoped to conservatorium; student/parent see only their own
    match /conservatoriums/{cid}/lessonSlots/{slotId} {
      allow read: if isSignedIn() && isApproved() && isSameTenant(cid) &&
        (hasRole('CONSERVATORIUM_ADMIN') || hasRole('TEACHER') ||
         resource.data.studentId == request.auth.uid ||
         exists(/databases/$(database)/documents/parentOf/$(request.auth.uid + '_' + resource.data.studentId)));
      allow write: if false; // All writes via Cloud Functions / Server Actions only
    }

    // Invoices — payer sees own invoices; admin sees all in tenant
    match /conservatoriums/{cid}/invoices/{invoiceId} {
      allow read: if isSignedIn() && isSameTenant(cid) &&
        (resource.data.payerId == request.auth.uid || hasRole('CONSERVATORIUM_ADMIN'));
      allow write: if false;
    }
  }
}
```

---

## 5. STRIDE Threat Model Summary

| Threat | Severity | Attack | Mitigation |
|--------|----------|--------|------------|
| **S**poofing — localStorage role manipulation | 🔴 Critical | Edit `harmonia-user` in DevTools → become admin | Firebase Custom Claims in JWT; session cookie validation |
| **T**ampering — crafted booking with `amount: 0` | 🔴 Critical | Send `bookLessonSlot` with zero price | Zod validation + server-side price lookup; client never sends price |
| **R**epudiation — no financial audit trail | 🟠 High | Deny authorising a payment | Cardcom webhook HMAC + `/complianceLogs` collection |
| **I**nformation Disclosure — PII of minors | 🔴 Critical | Unauthenticated Firestore reads | Security Rules + Storage Rules with signed URLs |
| **D**enial of Service — booking function abuse | 🟡 Medium | Spam `bookLessonSlot` callable | Firebase App Check + rate limiting on callable functions |
| **E**levation of Privilege — teacher sees admin data | 🔴 Critical | `useAuth()` context exposes all admin data | Role-scoped hooks; Server-side claims validation |

---

## 6. PDPPA Compliance (Israeli Privacy Law)

### 6.1 Obligations

Harmonia stores **sensitive personal data** under PDPPA (חוק הגנת הפרטיות, 5741-1981):
- Israeli ID numbers (ת"ז) of minors and parents
- Children's audio and video recordings
- Financial information (payment methods, invoice history)
- Ministry exam results
- Scholarship financial disclosures

### 6.2 Required Implementations

| Requirement | Implementation |
|-------------|---------------|
| Consent collection | `/consentRecords/{recordId}` collection; consent captured during registration with timestamp and version |
| Data access log | `/complianceLogs/{logId}` collection; all reads of sensitive fields logged |
| Right to erasure | Admin "Delete User" action triggers: anonymise PII fields, delete Storage files, retain financial records per legal minimum (7 years) |
| Data retention | `archiveExpiredRecords` scheduled function removes lesson/form records older than 3 years |
| Breach notification | > TODO: Requires manual documentation — incident response procedure |
| Data residency | Firebase project must be in `europe-west1` or `me-central1` (Israel/GDPR-adjacent) |

### 6.3 Under-13 Data Protection

- No email, no SMS, no direct communication with `STUDENT_UNDER_13`
- All PII is accessible only to the linked parent and to the conservatorium admin
- Video/audio recordings require explicit parent consent (stored in `/consentRecords`)
- Practice videos stored with signed URL access only (no public URLs)

---

## 7. Firebase App Check

App Check is required on **all callable Cloud Functions** to prevent abuse. It verifies requests originate from the legitimate Harmonia web/mobile app:

```typescript
// functions/src/index.ts
setGlobalOptions({ enforceAppCheck: true });
```

Client initialisation:
```typescript
// src/lib/firebase-client.ts
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
  isTokenAutoRefreshEnabled: true,
});
```

---

## 8. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| LCP | < 2.5s | Measured on 4G mobile, Hebrew locale |
| INP | < 200ms | All interactive elements |
| CLS | < 0.1 | No layout shift on RTL font load |
| Firestore reads per session | ≤ 5 on initial load | Role-scoped, paginated queries |
| Admin dashboard load | < 2.5s | Reads from `stats/live` document, not collection scans |
| Booking calendar open | < 800ms | `onSnapshot` with indexed query |
| Cloud Function cold start | < 500ms | 2nd Gen (Cloud Run min instances = 1 for critical functions) |
| Monthly auto-charge function | Complete within 10 min | Batch size ≤ 400 Firestore docs; Cardcom rate limit handled |
| Concurrent lesson bookings | Handles 50 simultaneous | Room lock transaction prevents double-booking |

