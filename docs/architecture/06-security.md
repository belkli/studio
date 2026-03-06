# 06 — Security

## 1. Security Architecture Summary

Harmonia stores Israeli ID numbers (ת"ז) of minors and parents, video/audio recordings of children, credit card histories, Ministry exam results, and scholarship financial disclosures. This makes a security breach a violation of the **Israeli Protection of Privacy Law (PDPPA / חוק הגנת הפרטיות, 5741-1981)** with civil and regulatory consequences.

> **Current security status — verified from code:**
> - **Authentication:** `src/lib/auth-utils.ts` implements layered auth: (1) Firebase Admin SDK `verifySessionCookie()` when `FIREBASE_SERVICE_ACCOUNT_KEY` is configured, (2) fallback to `x-user-*` headers injected by `proxy.ts`, (3) dev-only synthetic `site_admin` session when `NODE_ENV !== 'production'`.
> - **Session:** Production uses Firebase `__session` cookie (created via `admin.auth().createSessionCookie()`). The old `harmonia-user=1` client-side cookie is still used for sidebar rendering in the mock data path but is **not** the auth mechanism.
> - **Edge Proxy:** `src/proxy.ts` validates `__session` JWT on dashboard routes, injects user claims as request headers, and redirects unauthenticated users to `/login`. In dev mode, synthetic claims are injected automatically.
> - **Authorization:** `requireRole()` enforces RBAC with tenant isolation. `withAuth()` wraps all Server Actions with `verifyAuth()` + Zod validation.
> - **Route guards:** `useAdminGuard()` remains as a client-side hook for UX (immediate redirect); the proxy provides server-side protection.
> - **Firestore rules:** `firestore.rules` is a template in the repo but not enforced (no Firestore is connected).
> - **Dev bypass mode:** When `NODE_ENV !== 'production'` and `FIREBASE_SERVICE_ACCOUNT_KEY` is absent, both `proxy.ts` and `verifyAuth()` grant synthetic `site_admin` access. This is intentionally permissive for local development. **It is unreachable in production** because Firebase App Hosting sets `NODE_ENV='production'` at build time and `FIREBASE_SERVICE_ACCOUNT_KEY` is always provided via Secret Manager.
>
> **Items in §8 Pre-Launch Checklist that remain blocking are marked below.**

---

## 2. Authentication

### 2.1 Authentication Methods (Verified Status)

| Method | Used By | Provider | Status |
|--------|---------|----------|--------|
| Email + Password | All roles | Firebase Auth `signInWithEmailAndPassword` → session cookie | ✅ Wired (requires Firebase project) |
| Google OAuth | All roles | Firebase Auth SDK in `src/lib/auth/oauth.ts` — falls back to mock profile when Firebase unconfigured | ✅ Wired (requires Firebase project) |
| Microsoft OAuth | All roles | Firebase Auth SDK — same fallback | ✅ Wired (requires Firebase project) |
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

Production session management uses Firebase session cookies:

```typescript
// src/lib/auth-utils.ts (actual)
export async function createSessionCookie(idToken: string): Promise<string> {
  const adminAuth = getAdminAuth();
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: 14 * 24 * 60 * 60 * 1000, // 14 days
  });
  return sessionCookie;
}
```

The `__session` cookie (Firebase hosting convention) is:
- Created by `/api/auth/login` after client-side `signInWithEmailAndPassword` or OAuth
- Validated by `proxy.ts` (JWT decode for header injection) and `verifyAuth()` (full `verifySessionCookie()` via Admin SDK)
- Deleted by `/api/auth/logout` which also calls `admin.auth().revokeRefreshTokens()`

> ⚠️ The `harmonia-user=1` cookie still exists in the mock data path (`use-auth.tsx`) for sidebar rendering decisions but is **not** the auth mechanism for Server Actions or protected routes.

**Dev mode:** When Firebase credentials are absent, `proxy.ts` injects synthetic claims without any cookie. The `verifyAuth()` function falls back to reading these headers or returning a synthetic session.

---

## 3. Authorisation — Role-Based Access Control

### 3.1 Custom Claims (Partially Implemented)

Firebase Custom Claims are used as the server-side role authority. The `proxy.ts` Edge Proxy decodes the JWT from the `__session` cookie and injects claims as request headers. Server Actions read these claims via `getClaimsFromRequest()`.

The `onUserApproved` Cloud Function (`functions/src/auth/on-user-approved.ts`) is now implemented and sets Custom Claims when a user's `approved` field changes to `true` in Firestore.

### 3.2 Current Route Protection (Verified — Server + Client)

**Server-side (proxy.ts):**
- Dashboard routes: `proxy.ts` validates `__session` cookie and redirects to `/login` if absent/expired
- Unapproved users are redirected to `/pending-approval`
- Auth headers injected for Server Components

**Client-side (supplementary UX guard):**

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

> This client-side guard provides a UX redirect for non-admin users. Server-side protection is handled by `proxy.ts` and `requireRole()` in Server Actions.

### 3.3 Server Action Guard (Implemented)

`requireRole()` is the production RBAC enforcement for Server Actions:

```typescript
// src/lib/auth-utils.ts (actual implementation)
const GLOBAL_ADMIN_ROLES: UserRole[] = ['site_admin', 'superadmin'];

export async function requireRole(
  allowedRoles: UserRole[],
  conservatoriumIdMustMatch?: string
): Promise<HarmoniaClaims> {
  const claims = await verifyAuth();
  if (!claims.approved) throw new Error('ACCOUNT_NOT_APPROVED');
  if (!allowedRoles.includes(claims.role)) throw new Error('FORBIDDEN');
  if (conservatoriumIdMustMatch && !GLOBAL_ADMIN_ROLES.includes(claims.role)
      && claims.conservatoriumId !== conservatoriumIdMustMatch) {
    throw new Error('TENANT_MISMATCH');
  }
  return claims;
}
```

`withAuth()` wraps Server Actions with `verifyAuth()` + Zod validation. The `requireRole()` function is available for actions that need specific role checks beyond simple authentication.

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
| **S**poofing — session forgery | 🟡 Medium | Forge `__session` cookie | `verifySessionCookie()` performs cryptographic verification via Admin SDK | ✅ (requires Firebase project) |
| **T**ampering — `z.any()` on form/user/lesson schemas | 🟠 High | Inject arbitrary data via Server Actions | Replace `z.any()` with real Zod schemas | ⚠️ Partially done |
| **R**epudiation — no financial audit trail | 🟠 High | Deny authorising a payment | Cardcom webhook HMAC + `/complianceLogs` | ⚠️ Planned |
| **I**nformation Disclosure — PII of minors | 🟠 High | Unauthorised access to Server Actions | `verifyAuth()` + `requireRole()` enforce auth + RBAC | ✅ (in Server Actions) |
| **D**enial of Service — booking function abuse | 🟡 Medium | Spam callable functions | Firebase App Check + rate limiting | ❌ |
| **E**levation of Privilege — tenant escape | 🟡 Medium | Access another conservatorium's data | `requireRole()` checks `conservatoriumId` match | ✅ (in Server Actions) |

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

- [x] ~~Replace mock `login()` with real Firebase `signInWithEmailAndPassword`~~ — Done: `/api/auth/login` creates session cookies
- [x] ~~Implement Firebase session cookies~~ — Done: `__session` cookie via `createSessionCookie()`
- [x] ~~Create `src/middleware.ts` with `verifySessionCookie()`~~ — Done: `src/proxy.ts` (Edge Proxy) validates sessions and injects headers
- [x] ~~Replace `verifyAuth(): return true`~~ — Done: layered auth in `auth-utils.ts`
- [x] ~~Deploy `onUserApproved` Cloud Function to set Custom Claims~~ — Done: `functions/src/auth/on-user-approved.ts`
- [ ] Replace `FormSubmissionSchema = z.any()`, `UserSchema = z.any()`, `LessonSchema = z.any()`
- [ ] Deploy complete Firestore Security Rules (tenant isolation)
- [ ] Deploy Firebase Storage Security Rules (no public URLs for PII)
- [ ] Enable Firebase App Check on callable functions
- [ ] Store all secrets in Google Secret Manager
- [ ] Validate Cardcom HMAC signature on every webhook request (body verification — proxy checks header presence only)

### Already Done ✅

- [x] HTTP Security Headers: HSTS, X-Frame-Options (`SAMEORIGIN`), X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP — in `next.config.ts`
- [x] CSP allowlist includes Cardcom, Firebase, and Google API domains
- [x] Zod schemas for booking, practice-log, user, announcement, master-class, scholarship, donation, branch, room, lesson-package, conservatorium, event-production, lesson-slot, user-upsert, form-submission-upsert
- [x] OAuth `signInWithPopup` implemented with Firebase SDK (pending Firebase project credentials)
- [x] Israeli phone normalisation (`normalizeIsraeliPhone`) prevents format injection
- [x] `/accessibility` statutory page present
- [x] PDPPA types defined: `ConsentRecord`, `SignatureAuditRecord`, `ComplianceLog`, `RetentionPolicy`
- [x] Edge Proxy (`src/proxy.ts`) validates `__session` cookie and injects auth headers
- [x] `verifyAuth()` implements layered auth: Admin SDK → proxy headers → dev-only fallback
- [x] `requireRole()` enforces RBAC with tenant isolation on Server Actions
- [x] `/api/auth/login` creates Firebase session cookies via Admin SDK
- [x] `/api/auth/logout` revokes refresh tokens and clears session cookie

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


