# 06 — Security

## 1. Security Architecture Summary

Harmonia stores Israeli ID numbers (ת"ז) of minors and parents, video/audio recordings of children, credit card histories, Ministry exam results, and scholarship financial disclosures. This makes a security breach a violation of the **Israeli Protection of Privacy Law (PDPPA / חוק הגנת הפרטיות, 5741-1981)** with civil and regulatory consequences.

> ⚠️ **Current prototype security status — verified from code:**
> - **Authentication:** `login()` in `use-auth.tsx` does a plain email lookup in the mock users array. No password check. No Firebase `signInWithEmailAndPassword` call.
> - **Session:** A `harmonia-user=1` cookie is set/cleared client-side (`document.cookie`). The cookie value has no cryptographic significance.
> - **Authorization:** `verifyAuth()` in `src/lib/auth-utils.ts` unconditionally returns `true`. Any unauthenticated caller can invoke any Server Action.
> - **Route guards:** `useAdminGuard()` is a client-side hook that redirects after mount — it can be bypassed by disabling JavaScript or navigating directly.
> - **Firestore rules:** `firestore.rules` is a template in the repo but not enforced (no Firestore is connected).
> - **No `src/middleware.ts` exists.**
>
> **None of these must remain in production. All items in §8 Pre-Launch Checklist are blocking.**

---

## 2. Authentication

### 2.1 Authentication Methods (Verified Status)

| Method | Used By | Provider | Status |
|--------|---------|----------|--------|
| Email + Password | All roles | Mock array lookup — no Firebase Auth call | ⚠️ Mock only |
| Google OAuth | All roles | Firebase Auth SDK in `src/lib/auth/oauth.ts` — falls back to mock profile when Firebase unconfigured | ⚠️ Partial |
| Microsoft OAuth | All roles | Firebase Auth SDK — same fallback | ⚠️ Partial |
| Magic Link (Email) | Parents (low-tech) | `firebase/auth` `sendSignInLinkToEmail` | ❌ Not wired |
| Phone OTP (SMS) | Student 13+, Parent | Firebase Auth + Twilio | ❌ Not implemented |

### 2.2 OAuth Progressive Registration (Verified)

`src/lib/auth/oauth.ts` uses `GoogleAuthProvider` and `OAuthProvider('microsoft.com')` with `signInWithPopup`. When `getClientAuth()` returns null (Firebase not configured), `createMockProfile()` generates a synthetic profile from the email. The flow:

```
signInWithPopup (or mock)
  ├── Firebase configured → real OAuth credential
  └── Firebase not configured → mock profile from email/fallbackEmail
→ caller must check if Harmonia user exists (by email) → redirect to complete-registration if new
```

### 2.3 Session Management (Verified — Current Reality)

```typescript
// src/hooks/use-auth.tsx (actual)
const setAuthCookie = () => {
  document.cookie = 'harmonia-user=1; path=/; max-age=2592000; samesite=lax';
  // ⚠️ No JWT, no user ID, no role — just a presence flag
};
```

The `harmonia-user=1` cookie is checked by the dashboard layout to decide whether to render the sidebar. It has no cryptographic content and conveys no identity or role information to the server.

**Target architecture (required before production):**
- Firebase `signInWithEmailAndPassword` → Firebase ID token
- Server-side Firebase session cookie via `admin.auth().createSessionCookie()`
- `src/middleware.ts` validates `__session` cookie via `admin.auth().verifySessionCookie()` on every request
- Custom Claims `{ role, conservatoriumId, approved }` injected into request headers for Server Components

---

## 3. Authorisation — Role-Based Access Control

### 3.1 Custom Claims (Planned — Not Yet Implemented)

The **intended** production design uses Firebase Custom Claims as the server-side role authority. This is **not yet active**. Current role checks use the mock `user.role` value from the in-memory context.

```typescript
// Planned Custom Claims payload (not yet deployed):
{
  role: UserRole;
  conservatoriumId: string;
  approved: boolean;
}
```

The `onUserApproved` Cloud Function that would set these claims is a spec (`src/lib/cloud-functions/`) and not deployed.

### 3.2 Current Route Protection (Verified — Client-Side Only)

```typescript
// src/hooks/use-admin-guard.ts (actual — client-side only)
export function useAdminGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && (!user || (
      user.role !== 'conservatorium_admin' &&
      user.role !== 'site_admin' &&
      user.role !== 'delegated_admin'
    ))) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);
  return { user, isLoading };
}
```

> ⚠️ This guard runs after the component mounts on the client. Admin pages render briefly before the redirect fires. JavaScript-disabled users or direct API calls bypass it entirely.

### 3.3 Server Action Guard (Target Pattern)

Once `verifyAuth()` is wired to real Firebase Admin SDK:

```typescript
// src/lib/auth-utils.ts (target)
export async function requireRole(
  allowedRoles: UserRole[],
  conservatoriumIdMustMatch?: string
): Promise<DecodedIdToken> {
  const claims = await getClaimsFromRequestHeaders(); // from x-user-role header injected by middleware
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

| Threat | Severity | Attack | Mitigation | Status |
|--------|----------|--------|------------|--------|
| **S**poofing — no password check | 🔴 Critical | Any email logs in without password | Replace mock login with `signInWithEmailAndPassword` | ❌ |
| **T**ampering — `z.any()` on form/user/lesson schemas | 🟠 High | Inject arbitrary data via Server Actions | Replace `z.any()` with real Zod schemas | ❌ |
| **R**epudiation — no financial audit trail | 🟠 High | Deny authorising a payment | Cardcom webhook HMAC + `/complianceLogs` | ⚠️ Planned |
| **I**nformation Disclosure — PII of minors | 🔴 Critical | Unauthenticated requests to Server Actions | `verifyAuth()` must validate real claims | ❌ |
| **D**enial of Service — booking function abuse | 🟡 Medium | Spam callable functions | Firebase App Check + rate limiting | ❌ |
| **E**levation of Privilege — client-side role check | 🔴 Critical | Access admin pages with student account | Middleware + server-side Claims validation | ❌ |

### Security Headers (✅ Already Configured in `next.config.ts`)

The following HTTP security headers are **already active** in production builds:

```typescript
// next.config.ts (verified active)
{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },  // Note: SAMEORIGIN not DENY
{ key: 'X-Content-Type-Options', value: 'nosniff' },
{ key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
{ key: 'Content-Security-Policy', value: ContentSecurityPolicy },
// CSP includes: Cardcom (secure.cardcom.solutions), Google APIs, Firebase domains
```

---

## 6. PDPPA Compliance (Israeli Privacy Law)

### 6.1 Obligations

Harmonia stores **sensitive personal data** under PDPPA (חוק הגנת הפרטיות, 5741-1981):
- Israeli ID numbers (ת"ז) of minors and parents
- Children's audio and video recordings
- Financial information (payment methods, invoice history)
- Ministry exam results
- Scholarship financial disclosures

### 6.2 Required Implementations (Verified Status)

| Requirement | Implementation | Status |
|-------------|---------------|--------|
| Consent collection | `ConsentRecord` type defined; `/consentRecords/{recordId}` Firestore path | ⚠️ Type exists, not wired to UI |
| Data access log | `ComplianceLog` type defined; `ComplianceLog.action` enum includes all required events | ⚠️ Type exists, not wired |
| Signature audit trail | `SignatureAuditRecord` type defined with `signatureHash` + `documentHash` (SHA-256) | ⚠️ Type exists, not wired |
| Right to erasure | `ComplianceLog` `PII_DELETED` action exists | ❌ Admin delete action not implemented |
| Data retention | `RetentionPolicy` type defined with year thresholds | ⚠️ Type exists; `archiveExpiredRecords` scheduler not deployed |
| Breach notification | > TODO: Requires manual documentation — incident response procedure | ❌ |
| Data residency | Firebase project must be `europe-west1` or `me-central1` (Israel/GDPR-adjacent) | ⚠️ Pending Firebase project setup |

### 6.3 Under-13 Data Protection

- **Actual implementation:** Students under 13 have no login — their `User` record is `role: 'student'` with `parentId` set and `email` absent. The parent is the authenticated actor.
- No direct email, SMS, or WhatsApp to under-13 students — the `dispatchNotification()` function must be called with `parent`'s userId for all communications
- `ConsentRecord` type requires parent sign-off for `VIDEO_RECORDING` consent type
- Practice videos stored in Firebase Storage — must use signed URLs (not public)
- `parentOf/{parentId_studentId}` denormalised collection used in Firestore Security Rules to grant parent access to child's documents

---

## 7. Firebase App Check

> ⚠️ **Not yet configured.** `src/lib/firebase-client.ts` initialises only `getAuth()` — no `initializeAppCheck()` call. When Cloud Functions are deployed, App Check must be added.

Planned configuration:
```typescript
// src/lib/firebase-client.ts (target)
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
  isTokenAutoRefreshEnabled: true,
});
```

---

## 8. Pre-Launch Security Checklist

### Blocking (must complete before first real user)

- [ ] Replace mock `login()` with real Firebase `signInWithEmailAndPassword`
- [ ] Implement Firebase session cookies — replace `harmonia-user=1` cookie
- [ ] Create `src/middleware.ts` with `verifySessionCookie()` on every request
- [ ] Deploy `onUserApproved` Cloud Function to set Custom Claims
- [ ] Replace `verifyAuth(): return true` with real claims validation
- [ ] Replace `FormSubmissionSchema = z.any()`, `UserSchema = z.any()`, `LessonSchema = z.any()`
- [ ] Deploy complete Firestore Security Rules (tenant isolation)
- [ ] Deploy Firebase Storage Security Rules (no public URLs for PII)
- [ ] Enable Firebase App Check on callable functions
- [ ] Store all secrets in Google Secret Manager
- [ ] Validate Cardcom HMAC signature on every webhook request
- [ ] Remove pre-filled mock login (no password prompt in current UI)

### Already Done ✅

- [x] HTTP Security Headers: HSTS, X-Frame-Options (`SAMEORIGIN`), X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP — in `next.config.ts`
- [x] CSP allowlist includes Cardcom, Firebase, and Google API domains
- [x] Zod schemas for booking, practice-log, user, announcement, master-class, scholarship, donation, branch, room, lesson-package
- [x] OAuth `signInWithPopup` implemented with Firebase SDK (pending Firebase project credentials)
- [x] Israeli phone normalisation (`normalizeIsraeliPhone`) prevents format injection
- [x] `/accessibility` statutory page present
- [x] PDPPA types defined: `ConsentRecord`, `SignatureAuditRecord`, `ComplianceLog`, `RetentionPolicy`

---

## 9. Performance Targets

> These are aspirational targets. Current performance is constrained by the monolithic `useAuth()` context loading all data for all roles on every page load.

| Metric | Target | Current Reality |
|--------|--------|----------------|
| LCP | < 2.5s on 4G mobile | Unmeasured — mock data loads synchronously |
| INP | < 200ms | At risk — context re-renders on any state change |
| CLS | < 0.1 | Likely OK |
| Firestore reads per session | ≤ 5 | N/A — no Firestore reads (all in-memory) |
| Admin dashboard load | < 2.5s | Context includes all domains' data |
| Booking calendar | < 800ms | No real-time listeners yet |
| Cloud Function cold start | < 500ms | No CFs deployed |


