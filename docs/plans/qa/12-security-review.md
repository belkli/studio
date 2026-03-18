# QA Plan: Security Review

**Domain:** Security Architecture, Authentication, Authorization, Data Protection, API Security
**Reviewer Role:** Security Architect / Penetration Tester
**Date:** 2026-03-14
**Status:** Complete — ready for engineering triage

---

## Methodology

All findings are based on direct inspection of:
- `src/proxy.ts` — Edge Proxy (auth header injection, HMAC check)
- `src/lib/auth-utils.ts` — `verifyAuth()`, `requireRole()`, `withAuth()`
- `src/lib/auth/provider.ts` — Auth provider abstraction types
- `src/app/api/auth/login/route.ts` — Session cookie creation
- `src/app/api/auth/logout/route.ts` — Session revocation
- `src/app/api/cardcom-webhook/route.ts` — Payment webhook
- `src/app/actions/consent.ts` — Consent server actions
- QA plans (00-master, 01-auth, 08-legal)
- Architecture doc `docs/architecture/06-security.md`
- Identity spec `docs/sdd/features/SDD-01-Identity-and-Access.md`
- Prior security audits (`SDD-P7-Security-Architect.md`, `SDD-Security-Expert.md`)
- Legal readiness assessment `docs/operations/LEGAL-READINESS.md`

---

## 1. Authentication & Session Management

### FINDING-AUTH-01 — Session Cookie `SameSite=lax` Instead of `strict`

**Severity:** MEDIUM
**File:** `src/app/api/auth/login/route.ts:70`

The `__session` cookie is set with `sameSite: 'lax'`. While Next.js Server Actions use POST (which `lax` blocks on cross-site navigation), lax does not protect against state-changing GET requests or AJAX calls from cross-origin contexts that some frameworks allow.

**Evidence (line 70):**
```
sameSite: 'lax',   // Should be 'strict' for an authenticated app
```

**Recommendation:** Change to `sameSite: 'strict'`. The only trade-off is that users arriving via an external link must re-authenticate if the browser follows the redirect as a navigation. For a conservatorium dashboard this is acceptable.

**QA Test to add:** SEC-01 (see section 7).

---

### FINDING-AUTH-02 — Proxy `extractClaimsFromCookie` is Lightweight, Not Cryptographic

**Severity:** LOW (documented; compensated)
**File:** `src/proxy.ts:158`, `src/lib/auth/provider.ts:51-55`

The Edge Proxy uses `extractClaimsFromCookie` which is documented as "lightweight — no cryptographic verification." Cryptographic verification happens later in `verifyAuth()` via `provider.verifySessionCookie()`. This two-stage pattern means the proxy injects headers based on an unverified JWT decode.

**Risk:** If an attacker can somehow forge a structurally-valid JWT (without the correct signature), the proxy injects elevated headers into the request before Server Actions re-verify. However, Server Actions calling `verifyAuth()` will catch the forgery. The risk window is only for Server Components that read injected headers directly via `getClaimsFromRequest()` without calling `verifyAuth()`.

**Recommendation:** Audit all Server Components that read `x-user-role` / `x-user-id` headers directly. Any component that makes authorization decisions based on these headers without also calling `verifyAuth()` is vulnerable to header injection if the proxy layer is ever bypassed.

**Related scenario:** If a direct request reaches a Server Component without going through the proxy (e.g., during misconfigured rewrites), it could receive no headers and silently fail-open depending on how the component handles null claims.

---

### FINDING-AUTH-03 — Dev Bypass Relies Solely on Environment Variables

**Severity:** LOW (mitigated by documented architecture)
**File:** `src/proxy.ts:141-145`, `src/lib/auth-utils.ts:87-96`

The dev bypass triggers when `NODE_ENV !== 'production'` AND neither `FIREBASE_SERVICE_ACCOUNT_KEY` nor `SUPABASE_SERVICE_KEY` is present. The architecture doc (`06-security.md:44-45`) correctly notes this is unreachable in production because Firebase App Hosting sets `NODE_ENV='production'` and provides credentials via Secret Manager.

**Risk:** The condition depends on the deployment platform correctly setting `NODE_ENV`. On a non-Firebase hosting environment (Vercel, Railway, Docker), an operator who forgets to set `NODE_ENV=production` while providing no auth credentials would expose a `site_admin` bypass to anyone. This is a deployment footgun.

**Recommendation:** Add a startup assertion in `next.config.ts` or a server-side health check that verifies: if `NODE_ENV === 'production'`, at least one of the auth credential env vars must be present. Fail the server startup with a loud error otherwise.

---

### FINDING-AUTH-04 — Session Expiry Not Validated on Every Request

**Severity:** LOW
**File:** `src/lib/auth-utils.ts:63-99`

The `verifyAuth()` function calls `provider.verifySessionCookie(sessionCookie)`. Firebase's `verifySessionCookie` validates the expiry embedded in the JWT. However, the 14-day `SESSION_EXPIRY_MS` constant in `auth-utils.ts:51` is only used at cookie creation time. If the underlying Firebase token has a different expiry, the two could diverge.

**Recommendation:** Confirm that the `createSessionCookie` call passes `SESSION_EXPIRY_MS / 1000` (it does — line 191) and that the Firebase session cookie expiry and the HTTP cookie `maxAge` are set identically. The current code sets `SESSION_MAX_AGE = 14 * 24 * 60 * 60` in the login route (`route.ts:15`) as both the cookie `maxAge` and the Firebase session duration. These values match — no gap found. Document this invariant in comments so future maintenance does not desync them.

---

### FINDING-AUTH-05 — No Concurrent Session Limit or Session Inventory

**Severity:** LOW
**Files:** `src/app/api/auth/logout/route.ts`, `src/lib/auth-utils.ts`

`revokeUserSessions(uid)` revokes all sessions for a user (correct). However, there is no mechanism for a user to:
1. View all active sessions.
2. Selectively revoke a single session (e.g., "sign out of all other devices").

**Recommendation:** Add "Active Sessions" management to `/dashboard/settings`. Firebase Auth supports listing tokens per user. For now at minimum, the "Revoke all sessions" logout call is correct — document this in the DSAR settings as a security action.

---

## 2. Authorization & Access Control

### FINDING-AUTHZ-01 — `withAuth()` Verifies Authentication but Not Authorization

**Severity:** HIGH
**File:** `src/lib/auth-utils.ts:145-178`

`withAuth()` calls `verifyAuth()` (checks that the user is authenticated) but does **not** call `requireRole()`. Server Actions wrapped with `withAuth()` alone are accessible to any authenticated user regardless of role, including students calling actions intended only for admins.

**Evidence (auth-utils.ts lines 149-155):**
```
return async (input) => {
  await verifyAuth();  // Only checks auth, not role
  const parsedInput = schema.parse(input);
  return await action(parsedInput);
};
```

The `saveConsentRecord` action in `consent.ts:133` uses `withAuth()` with no role restriction. Any authenticated user (student, parent, teacher) can call it with an arbitrary `userId` — they could record false consent on behalf of another user.

**Recommendation:**
1. `saveConsentRecord` should validate that `data.userId === claims.uid` (you can only record your own consent) OR that `claims.role` is at least `parent` and `data.minorUserId` is a known child of this parent.
2. Audit every `withAuth()` call to verify whether a role restriction is needed. Actions that touch data across users must use `requireRole()` plus ownership checks.

**QA Test:** SEC-02 (see section 7).

---

### FINDING-AUTHZ-02 — Consent Action: Caller Can Record Consent for Arbitrary User

**Severity:** HIGH
**File:** `src/app/actions/consent.ts:133-181`

The `saveConsentRecord` action (wrapped in `withAuth()`) accepts `userId` and `minorUserId` from the caller's input payload. There is no server-side check that `userId === caller.uid` or that the parental relationship between `caller.uid` and `minorUserId` is valid.

**Attack:** An authenticated student could call `saveConsentRecord({ userId: 'admin-user-id', consentDataProcessing: true, ... })` to fabricate consent records for another user.

**Recommendation:** Inside the action body, assert `data.userId === actor.uid` for normal consent, or for parental consent, verify the parent-child relationship from the DB before writing.

---

### FINDING-AUTHZ-03 — `getConsentStatus` Leaks Another User's Consent Map

**Severity:** MEDIUM
**File:** `src/app/actions/consent.ts:185-202`

`getConsentStatus` accepts `{ userId }` from the caller and returns all consent records for that user ID with no ownership check.

**Attack:** An authenticated student can call `getConsentStatus({ userId: 'parent-user-1' })` to retrieve the parent's consent status, including whether they have revoked any consent types.

**Recommendation:** Enforce `data.userId === claims.uid` inside the action, or allow admins/parents to query on behalf of linked users only.

---

### FINDING-AUTHZ-04 — Proxy Passes All `/api/*` Routes Without Auth

**Severity:** MEDIUM
**File:** `src/proxy.ts:127-129`

All routes matching `/api/` are passed through without any auth processing:
```
if (pathname.startsWith('/api/')) {
  return NextResponse.next();
}
```

This means API routes must implement their own authentication. The login and logout routes are intentionally public, and the Cardcom webhook has HMAC protection. However, any future API route added under `/api/` that does not implement its own auth guard will be silently public.

**Recommendation:**
1. Document this policy explicitly in the proxy and in the contributing guide.
2. Consider adding an allowlist of explicitly public `/api/` routes and redirecting unknown `/api/` routes to the auth check, or at minimum add a lint rule or middleware test that alerts on new `/api/` routes without auth.
3. The current Cardcom HMAC check in the proxy only verifies header presence when `CARDCOM_WEBHOOK_SECRET` is set (see FINDING-API-01 below). The full HMAC verification happens in the route handler itself — this double-layer is correct but the proxy's partial check could give false confidence.

---

### FINDING-AUTHZ-05 — Tenant Isolation Has No Test Coverage in QA Plan

**Severity:** MEDIUM

The `requireRole()` function in `auth-utils.ts:130-133` checks `conservatoriumId` matches, but the QA plan (`01-auth-registration.md`) contains no cross-tenant access attempt test. A conservatorium_admin from cons-15 attempting to read/modify data from cons-66 should be blocked.

**Recommendation:** Add cross-tenant boundary tests (SEC-03, SEC-04 in section 7).

---

### FINDING-AUTHZ-06 — `recordConsentAction` Role List Includes All Roles

**Severity:** LOW
**File:** `src/app/actions/consent.ts:55-65`

`recordConsentAction` uses `requireRole(['student', 'parent', 'teacher', 'conservatorium_admin', 'delegated_admin', 'site_admin'])` — effectively every role. This is correct for consent recording, but there is still no ownership check (see FINDING-AUTHZ-01). This is a lower risk than FINDING-AUTHZ-01 because `recordConsentAction` only creates records; it does not modify or delete.

---

## 3. Input Validation & Injection

### FINDING-INPUT-01 — Cardcom Webhook: `invoiceId` Treated as Trusted Input

**Severity:** MEDIUM
**File:** `src/app/api/cardcom-webhook/route.ts:93-101`

The `ReturnValue` field from the Cardcom payload becomes the `invoiceId` used to look up records in the database. Although HMAC signature verification happens first (correctly), the `invoiceId` value itself is not further validated (no UUID format check, no length check).

**Risk:** If an attacker ever bypasses HMAC (e.g., via a timing attack or key leak), they could pass a path-traversal-style `invoiceId` that could affect databases that interpolate collection paths. Additionally, very long `invoiceId` strings could cause unexpected behavior in DB queries.

**Recommendation:** Validate `invoiceId` as a UUID or known-format string before the `db.payments.findById()` call. For example: verify it matches `/^[0-9a-f-]{36}$/` or your internal ID format before use.

---

### FINDING-INPUT-02 — User-Agent and IP Address Accepted From Client in Consent Action

**Severity:** LOW
**File:** `src/app/actions/consent.ts:28-30`

The `RecordConsentSchema` accepts `ipAddress` and `userAgent` as optional client-provided strings. If the frontend passes these, they become part of the compliance audit record. A client can pass a fake IP or User-Agent string.

**Recommendation:** For PDPPA audit integrity, `ipAddress` should be extracted server-side from request headers (`x-forwarded-for`) rather than trusted from client input. The existing schema allows the client to override this, which undermines the audit trail's evidentiary value.

---

### FINDING-INPUT-03 — No HTML Sanitization Policy for User-Generated Content

**Severity:** MEDIUM (potential XSS)

The QA plans and architecture reference teacher lesson notes and conservatorium announcements stored in the database. If any of these fields are rendered as raw HTML (e.g., using React's raw HTML injection API or a markdown-to-HTML renderer without sanitization), they become XSS vectors.

**Recommendation:**
1. Confirm via grep that no component renders lesson notes, announcement body, or teacher bio using React's raw HTML injection API without prior sanitization through a library like DOMPurify.
2. All rich text fields must be treated as untrusted. If markdown rendering is needed, use a renderer that escapes HTML by default (e.g., `remark` with `rehype-sanitize`).
3. Add a specific XSS test in the QA plan (SEC-05 in section 7).

---

### FINDING-INPUT-04 — Rental Sign Page: OTP Code Has No Injection Test in QA Plan

**Severity:** LOW

The QA plan tests invalid OTP (`LC-48`) and expired OTP (`LC-49`) but does not test OTP codes with unexpected characters (e.g., SQL injection strings, script tags, excessively long strings). If the OTP comparison is done via string equality after DB lookup, SQL injection is not possible in a NoSQL backend, but the QA plan should include a test.

**Recommendation:** Add SEC-06 (OTP injection test, see section 7).

---

## 4. Data Protection

### FINDING-DATA-01 — `saveConsentRecord` Stores Empty `ipAddress: ''`

**Severity:** MEDIUM
**File:** `src/app/actions/consent.ts:158`

The `ipAddress` field is always written as an empty string, even though it is a required field in the ConsentRecord schema. PDPPA audit requirements expect the IP address of consent to be captured for evidentiary purposes.

**Recommendation:** Extract the real client IP server-side (from the `x-forwarded-for` header) and pass it to the consent record. Do not rely on the client to supply this.

---

### FINDING-DATA-02 — Consent Version Is Hardcoded

**Severity:** MEDIUM
**File:** `src/app/actions/consent.ts:86, 158`

The consent version is hardcoded as `'1.0'` in `recordConsentAction` and `'2.0'` in `saveConsentRecord`. When the privacy policy is updated, all previously stored records should remain tied to the version they were created under, and new records should reference the new version. A hardcoded version means records can drift silently after a policy update without any deploy.

**Recommendation:** Store the consent version as an environment variable or a database constant that can be bumped without a code deploy. Alternatively, store the privacy policy version with the policy document itself and read it at write-time.

---

### FINDING-DATA-03 — DSAR Export Is UI-Only Toast (No Real Data Export)

**Severity:** HIGH (compliance gap)
**Referenced in:** `docs/operations/LEGAL-READINESS.md:257`, QA plan `LC-20`

The "Export My Data" DSAR button triggers a UI toast notification with no actual backend data export. The QA plan explicitly notes this: "Current implementation is UI-only toast; future test should assert file download when backend wired."

This is a **PDPPA Section 13 compliance gap**: the right of access must be fulfilled within 30 days. A toast with no export is not compliant for a production launch.

**Recommendation:** Before launch, wire the export button to a Server Action that:
1. Collects all PII for `claims.uid` across all relevant collections.
2. Produces a JSON or CSV export.
3. Returns a downloadable blob or sends to the user's registered email.

**QA Test:** The existing `LC-20` must be upgraded to assert file download, not just toast visibility.

---

### FINDING-DATA-04 — Data Deletion Request Is Also UI-Only

**Severity:** HIGH (compliance gap)
**File:** `docs/operations/LEGAL-READINESS.md:66`

The "Request Data Deletion" button shows a destructive toast but does not trigger any backend purge job or even a tracked deletion request. The PDPPA grants a right of erasure that must be honoured.

**Recommendation:** At minimum, create a server action that writes a `DELETION_REQUEST` entry to the ComplianceLog with the requester's `uid`, timestamp, and reason. A human operator can then fulfil the request. The fully automated purge job can come post-launch, but the request must be trackable.

---

### FINDING-DATA-05 — Firebase Admin SDK Firestore Used Directly in Consent Action

**Severity:** LOW (architectural note)
**File:** `src/app/actions/consent.ts:97-117`

`recordConsentAction` calls `getAdminFirestore()` directly, bypassing the multi-backend DB adapter (`getDb()`). This means the consent record always goes to Firestore even when the app is configured for Postgres or Supabase. In dev mode, `getAdminFirestore()` returns null and silently succeeds without writing.

**Risk:** In a non-Firebase deployment (Supabase, Postgres), consent records are silently dropped. The PDPPA audit trail is incomplete.

**Recommendation:** Route `recordConsentAction` through `getDb().consentRecords.create()` consistently (as `saveConsentRecord` already does), so it works regardless of backend. The current inconsistency between the two consent-writing paths is a reliability gap.

---

### FINDING-DATA-06 — Signature `dataUrl` (Base64 PNG) Is Stored Without Size Cap

**Severity:** LOW

The `SignatureCapture` component produces a base64-encoded PNG of the full canvas. There is no documented size limit. A very large signature canvas could produce a multi-megabyte base64 string passed through a Server Action.

**Recommendation:** Set a canvas max-dimension (e.g., 600x200 px) and reject `dataUrl` inputs larger than a reasonable threshold (e.g., 512 KB) in the Server Action's Zod schema to prevent DoS via oversized payloads.

---

## 5. API Security

### FINDING-API-01 — Cardcom Webhook HMAC: Proxy Checks Header Presence, Route Handler Verifies Signature

**Severity:** LOW (defense-in-depth gap, not a vulnerability)
**File:** `src/proxy.ts:82-100`, `src/app/api/cardcom-webhook/route.ts:28-56`

The proxy's `isValidCardcomHmac()` only checks that the `x-cardcom-hmac-sha256` header is *present* when `CARDCOM_WEBHOOK_SECRET` is configured. The actual HMAC comparison happens in the route handler using `timingSafeEqual` (correctly).

When `CARDCOM_WEBHOOK_SECRET` is not set:
- Proxy returns `true` (passes through with a warning log).
- The route handler returns HTTP 500 ("Webhook not configured") immediately.

This is a correct fail-safe: missing secret = 500 error. However, the proxy's conditional bypass (`if (!secret) return true`) combined with the route handler's check means there are two separate code paths that must both be kept consistent. A future proxy refactor could inadvertently drop the 500 response if the route handler is not updated.

**Recommendation:** Add a QA test (SEC-10) that verifies the 500 response when `CARDCOM_WEBHOOK_SECRET` is absent, and document the two-layer design explicitly.

---

### FINDING-API-02 — Rate Limiter Uses In-Process Memory Store

**Severity:** MEDIUM
**File:** `src/app/api/auth/login/route.ts:18`

`createRateLimiter({ limit: 10, windowMs: 15 * 60_000 })` is called once per module load. An in-process memory limiter:
1. Resets on each server restart or cold start (Next.js Serverless — frequent).
2. Is per-instance, so a horizontally-scaled deployment (multiple Edge Function instances) does not share state.

**Risk:** An attacker can bypass the 10-attempt limit by hitting different geographic edge nodes or waiting for a cold start.

**Recommendation:** Replace the in-memory limiter with a distributed store (Redis via Upstash, or Cloudflare KV) for production. The existing implementation is acceptable for local dev and low-traffic staging.

---

### FINDING-API-03 — Cardcom `GET` Health Endpoint Exposes Handler Identity

**Severity:** LOW
**File:** `src/app/api/cardcom-webhook/route.ts:244-248`

The `GET` endpoint on the webhook handler returns `{ status: 'ok', handler: 'cardcom-webhook' }`. This reveals internal routing information to unauthenticated callers. While low risk, it could aid reconnaissance.

**Recommendation:** Either remove the `GET` handler (Cardcom does not need it) or return a minimal `{ status: 'ok' }` without the `handler` key.

---

### FINDING-API-04 — No `Content-Type` Enforcement on Webhook Input

**Severity:** LOW
**File:** `src/app/api/cardcom-webhook/route.ts:60-68`

The webhook handler accepts both `application/json` and form-urlencoded, falling back to form-urlencoded. A malicious caller could craft a request with `Content-Type: text/plain` containing JSON, causing the handler to parse it as form-urlencoded and produce unexpected field mappings.

**Recommendation:** Restrict accepted content types to `application/json` and `application/x-www-form-urlencoded` only. Return 415 Unsupported Media Type for other content types.

---

### FINDING-API-05 — Login Endpoint Error Response May Reveal Firebase Error Detail

**Severity:** LOW
**File:** `src/app/api/auth/login/route.ts:77-82`

On session creation failure, the error detail is logged server-side (correct) and the client-facing message is generic (correct). However, if the underlying Firebase error code were to be bubbled through in a future refactor, it could reveal account-probing information.

**Recommendation:** Maintain the current pattern — never pass Firebase error codes to the client. Add a code comment flagging this requirement for future maintenance.

---

## 6. Third-Party & Infrastructure

### FINDING-INFRA-01 — Firestore Security Rules Not Yet Deployed

**Severity:** CRITICAL (pre-launch blocker)
**Source:** `docs/architecture/06-security.md:14`, `docs/operations/LEGAL-READINESS.md:479`

The architecture document confirms: "Firestore Security Rules template in repo, not yet deployed." Without deployed rules, Firestore defaults to either open access (test mode) or fully closed access (production mode). Either extreme is wrong for production:
- Test mode: any authenticated user reads any document, bypassing all RBAC.
- Production mode with no explicit rules: all operations denied, breaking the app.

This is the single highest-priority security gap. All tenant isolation, parent-child isolation, and role-based data access controls exist only in code (Server Actions) and not at the database layer.

**QA Test:** Blocked until deployment. Once deployed, run the cross-tenant and cross-role access tests (SEC-03, SEC-04).

---

### FINDING-INFRA-02 — Firebase Storage Security Rules Not Yet Deployed

**Severity:** CRITICAL (pre-launch blocker)
**Source:** `docs/architecture/06-security.md:14`, `docs/operations/LEGAL-READINESS.md:480`

Same status as FINDING-INFRA-01 for Storage. Practice videos, signed instrument rental agreements, invoice PDFs, and profile photos all rely on Storage rules that exist in a template file but are not deployed.

**Special note:** The `SDD-P7-Security-Architect.md` identifies that a prior rule draft allowed any teacher in the same conservatorium to read any student's feedback videos, not just their own students. This vulnerability must be corrected before deployment. The fix requires storing `teacherId` in file metadata at upload time.

---

### FINDING-INFRA-03 — Firebase App Check Not Configured

**Severity:** MEDIUM (pre-launch)
**Source:** `docs/architecture/06-security.md:16`

Firebase App Check prevents automated abuse of Firestore/Functions from non-app clients (scrapers, bots, DDoS). Without App Check, authenticated users can use the Firebase SDK directly in browser console to query any Firestore document accessible to their session.

**Recommendation:** Enable App Check with reCAPTCHA Enterprise for web before public launch. This is listed as "Planned" in the architecture doc.

---

### FINDING-INFRA-04 — Supabase Service Key Exposure Risk

**Severity:** MEDIUM
**Source:** Architecture multi-backend design; `src/proxy.ts:143`

The dev bypass checks for `SUPABASE_SERVICE_KEY` in addition to `FIREBASE_SERVICE_ACCOUNT_KEY`. The Supabase service key is a super-key with full database access, bypassing all Row Level Security. If this key were to appear in client bundles or `.env.local` files committed to git, it would grant full database access.

**Recommendation:**
1. Ensure `SUPABASE_SERVICE_KEY` is listed in `.gitignore` and `.env.example` (with a placeholder, never a real value).
2. Rename to `SUPABASE_SERVICE_ROLE_KEY` to match Supabase's official naming and avoid confusion with the anon key.
3. Audit the Supabase provider implementation to confirm the service key is only used in server-side code (`server-provider.ts`), never imported from a client bundle.

---

### FINDING-INFRA-05 — OAuth Redirect Validation Not Confirmed

**Severity:** MEDIUM

The `IClientAuthProvider.signInWithOAuth()` returns an `OAuthResult`. If the OAuth callback URL is configurable or the provider's redirect_uri is not locked to the application domain, open redirect attacks are possible.

**Recommendation:** Verify that OAuth redirect URIs in the Firebase console are explicitly locked to `https://harmonia.co.il` (and staging/dev equivalents). Document the allowed redirect URIs in the deployment runbook. Add a QA test that attempts an OAuth flow with a modified redirect parameter.

---

### FINDING-INFRA-06 — ComplianceLog Audit Trail Not Wired

**Severity:** HIGH (compliance gap)
**Source:** `docs/operations/LEGAL-READINESS.md:75`

The `ComplianceLog` type exists but is not consistently written. Only `saveConsentRecord` writes a compliance log entry (and that write is marked `non-fatal` — failures are swallowed). No other PII-accessing operation (DSAR export, lesson note access, invoice download) writes to the compliance log.

**Recommendation:** Before production launch, wire `ComplianceLog` writes to:
- Every DSAR operation (export, deletion request, consent withdrawal)
- Every admin access to student PII (viewing/editing a student profile)
- Invoice downloads

This is required by the PDPPA Information Security Regulations (Regulation 10: audit log of all access to sensitive data).

---

## 7. Missing Security Test Scenarios

The following security tests are not present in any QA plan and should be added.

---

### SEC-01 — Session Cookie Attributes Verification

**Scenario ID:** SEC-01
**Category:** Authentication & Session Management

**Steps:**
1. Complete a login flow in a staging environment (with Firebase credentials present).
2. Using browser DevTools, Application tab, Cookies panel, inspect the `__session` cookie.
3. Assert: `HttpOnly` flag is set.
4. Assert: `Secure` flag is set.
5. Assert: `SameSite` attribute is `lax` or `strict`.
6. Assert: `Path` is `/`.
7. Assert: Expiry is approximately 14 days from now (within +-5 minutes).
8. Assert: The cookie value cannot be read via `document.cookie` in the browser console.

**Expected result:** All assertions pass. `document.cookie` does not include `__session`.

**Backend:** Firebase staging (full auth stack, not dev bypass).

---

### SEC-02 — `saveConsentRecord` Cannot Record Consent for a Different User

**Scenario ID:** SEC-02
**Category:** Authorization & Access Control

**Steps:**
1. Log in as `student-user-1` (or simulate via dev bypass with a modified `x-user-id` header).
2. Call `saveConsentRecord` with `userId: 'conservatorium_admin_user_id'`.
3. Assert that the action returns `{ success: false, error: ... }` or throws FORBIDDEN.
4. Verify no ConsentRecord with `userId = 'conservatorium_admin_user_id'` was written.

**Expected result:** Action is rejected. Only the caller's own `userId` is accepted.

**Notes:** Currently no such check exists (FINDING-AUTHZ-01). This test will FAIL until the fix is applied.

---

### SEC-03 — Cross-Tenant Data Access Blocked for `conservatorium_admin`

**Scenario ID:** SEC-03
**Category:** Tenant Isolation

**Steps:**
1. Authenticate as a `conservatorium_admin` for cons-15.
2. Attempt to call a Server Action that accepts a `conservatoriumId` parameter (e.g., `getTeacherList({ conservatoriumId: 'cons-66' })`).
3. Assert that the action returns TENANT_MISMATCH error.
4. Attempt to navigate to `/dashboard/admin/users?conservatoriumId=cons-66`.
5. Assert that only cons-15 users are returned.

**Expected result:** All cross-tenant accesses are rejected. `requireRole()` TENANT_MISMATCH fires.

**Backend:** MEMORY and POSTGRES.

---

### SEC-04 — Cross-Tenant Data Access Allowed for `site_admin`

**Scenario ID:** SEC-04
**Category:** Tenant Isolation (positive case)

**Steps:**
1. Authenticate as `site_admin` (dev bypass includes this).
2. Call the same Server Action with `conservatoriumId: 'cons-66'`.
3. Assert that data is returned without TENANT_MISMATCH.

**Expected result:** `site_admin` bypasses tenant isolation and sees cons-66 data.

---

### SEC-05 — XSS: Lesson Note Content Rendered Safely

**Scenario ID:** SEC-05
**Category:** Input Validation / XSS

**Steps:**
1. As a teacher, create a lesson note with content: `<img src=x onerror="alert('XSS')">`
2. As the student, navigate to the lesson history view where notes are displayed.
3. Assert: The string is rendered as escaped text, not as an HTML element.
4. Assert: No `alert()` dialog appears.
5. Repeat with: `<script>document.cookie</script>`, `javascript:void(0)`, and a 10,000-character string.

**Expected result:** All XSS payloads are rendered as literal text. No script execution. No raw HTML injection renders unsanitized content.

**Backend:** MEMORY.

---

### SEC-06 — OTP: Injection and Boundary Inputs Rejected

**Scenario ID:** SEC-06
**Category:** Input Validation

**Steps:**
1. Navigate to `/rental-sign/[valid-token]` and send OTP.
2. In the OTP field, enter: `' OR 1=1 --`
3. Assert: Error shown; step does not advance.
4. Enter: `<script>alert(1)</script>`
5. Assert: Error shown; no script execution.
6. Enter: A string of 1,000 characters.
7. Assert: Input is truncated or rejected before reaching the server.
8. Enter: The correct 6-digit OTP with surrounding whitespace (e.g., `  123456  `).
9. Assert: Either the whitespace is stripped and the OTP is accepted, or a clear error is shown.

**Expected result:** All non-numeric and out-of-range inputs are rejected gracefully. No injection strings reach the backend.

---

### SEC-07 — Dev Bypass Absent in Production-Like Environment

**Scenario ID:** SEC-07
**Category:** Dev Bypass Safety

**Steps:**
1. Build and start the Next.js server with `NODE_ENV=production` and `FIREBASE_SERVICE_ACCOUNT_KEY` unset (intentional misconfiguration).
2. Attempt to access `/dashboard`.
3. Assert: The request is NOT served as `site_admin`. Expected result: redirect to `/login` or HTTP 500.

**Expected result:** Dev bypass does not activate when `NODE_ENV=production`. Server either redirects to login or fails with a configuration error rather than granting unauthenticated admin access.

**Notes:** This verifies FINDING-AUTH-03. This test must run against a built production bundle, not `next dev`.

---

### SEC-08 — Rate Limiting on Login Endpoint (11th Attempt is Rejected)

**Scenario ID:** SEC-08
**Category:** API Security / Brute Force Protection

**Steps:**
1. Against a staging environment, send 10 consecutive POST requests to `/api/auth/login` with invalid `idToken` values from the same IP.
2. Send the 11th request.
3. Assert: HTTP 429 response with `Retry-After` header.
4. Wait for the reset window to expire.
5. Send one more request.
6. Assert: HTTP 401 (not 429) — rate limit has reset.

**Expected result:** 429 on the 11th request; rate limit resets after `windowMs`.

**Notes:** If the limiter is in-memory (FINDING-API-02), this test should also be run after restarting the server to confirm the counter resets. This reveals the bypass-via-restart vulnerability.

---

### SEC-09 — Consent Withdrawal: `'rejected'` Value Not Treated as Truthy by Analytics

**Scenario ID:** SEC-09
**Category:** Consent Data Integrity

**Steps:**
1. Set `localStorage.setItem('harmonia_cookie_consent', 'rejected')`.
2. Navigate to all tracked pages.
3. Using the browser Network tab, assert that no analytics events are fired (no requests to Google Analytics, Segment, Mixpanel, etc.).
4. Using the browser Console, assert no analytics-related scripts execute.

**Expected result:** A `'rejected'` consent value is never treated as truthy by any conditional analytics check.

---

### SEC-10 — Cardcom Webhook Rejected Without Valid HMAC

**Scenario ID:** SEC-10
**Category:** Webhook Security

**Steps:**
1. Send a POST request to `/api/cardcom-webhook` with a valid-looking JSON body but:
   a. No `x-cardcom-signature` header — assert HTTP 401.
   b. Incorrect signature value — assert HTTP 401.
   c. Correct signature but `CARDCOM_WEBHOOK_SECRET` not set in env — assert HTTP 500.
2. Send a valid request with correct HMAC — assert HTTP 200.

**Expected result:** Unauthenticated webhook requests are rejected. Correct HMAC passes. Missing secret configuration is surfaced as 500 (not silently ignored).

---

### SEC-11 — DSAR Export: User Can Only Export Own Data

**Scenario ID:** SEC-11
**Category:** Data Protection / DSAR

**Steps:**
1. Log in as `student-user-1`.
2. Call the DSAR export Server Action (once implemented) without specifying a `userId` parameter, or specifying `userId: 'student-user-1'`.
3. Assert: Export contains only data belonging to `student-user-1`.
4. Attempt to call the export action with `userId: 'admin-user-id'`.
5. Assert: Action rejects with FORBIDDEN or TENANT_MISMATCH.

**Expected result:** Users can only export their own data. Cross-user data export is rejected.

**Notes:** Currently the export is UI-only (FINDING-DATA-03). This test must be created to gate the launch of the real export feature.

---

### SEC-12 — Unauthenticated Access to `/dashboard` Routes is Redirected to Login

**Scenario ID:** SEC-12
**Category:** Route Protection

**Steps:**
1. Clear all cookies (ensure no `__session` cookie).
2. Directly navigate to:
   - `/dashboard`
   - `/dashboard/admin/users`
   - `/dashboard/ministry/repertoire`
   - `/dashboard/settings`
   - `/he/dashboard`
3. For each path, assert: HTTP redirect to the locale-appropriate `/login` (with `callbackUrl` param set).
4. Assert: None of the dashboard pages render any content before the redirect.

**Expected result:** All dashboard routes redirect to login when unauthenticated.

**Backend:** Must run against a real auth stack (not dev bypass). Staging environment.

---

## 8. Security Gate Criteria

The following conditions **must all be met** before security sign-off for production launch.

### 8.1 BLOCKERS — Must Pass Before Any Real User Data

| # | Gate | Acceptance Criterion |
|---|------|----------------------|
| G-01 | Firestore Security Rules deployed | Rules deployed in production Firebase project. All cross-tenant access tests (SEC-03, SEC-04) pass. `firestore.rules` version matches the template in repo. |
| G-02 | Firebase Storage Security Rules deployed | Rules deployed. Practice video, invoice, and agreement paths are not publicly accessible. Signed URLs are used for all download links. |
| G-03 | DSAR Export is functional | `Export My Data` produces an actual downloadable file containing the user's PII. SEC-11 passes. |
| G-04 | DSAR Deletion Request is tracked | `Request Data Deletion` writes a `DELETION_REQUEST` ComplianceLog entry. At minimum a human-visible record is created. |
| G-05 | `saveConsentRecord` ownership check | Action rejects `userId` that does not match `claims.uid` (unless valid parental consent flow). SEC-02 passes. |
| G-06 | Session cookie is HttpOnly and Secure in production | SEC-01 passes on the staging/production environment. |
| G-07 | Dev bypass cannot activate in production | SEC-07 passes: `NODE_ENV=production` with no auth credentials does NOT grant `site_admin` access. |

### 8.2 HIGH — Must Pass Before Public Beta

| # | Gate | Acceptance Criterion |
|---|------|----------------------|
| G-08 | Cross-tenant isolation verified | SEC-03 and SEC-04 pass. `conservatorium_admin` cannot read or write data from another conservatorium. |
| G-09 | XSS on user-generated content | SEC-05 passes for all known rich-text fields (lesson notes, announcements, teacher bios). No raw HTML injection renders unsanitized content. |
| G-10 | Rate limiting is distributed | Login rate limiter backed by a shared store (Redis/Upstash/KV), not in-process memory. SEC-08 passes across multiple server restarts. |
| G-11 | ComplianceLog wired to DSAR operations | All three DSAR actions (export, delete, withdraw consent) write `ComplianceLog` entries. Logs are queryable by admin. |
| G-12 | `getConsentStatus` ownership check | Action rejects queries for `userId !== claims.uid` unless the caller is an admin or parent of the queried user. |

### 8.3 MEDIUM — Must Pass Before General Availability

| # | Gate | Acceptance Criterion |
|---|------|----------------------|
| G-13 | Firebase App Check configured | App Check enabled for all Firebase products. Automated Firestore queries without a valid App Check token are rejected. |
| G-14 | Webhook HMAC enforcement in all environments | `CARDCOM_WEBHOOK_SECRET` is set in staging and production. SEC-10 passes (no bypass when secret is set). |
| G-15 | IP address captured server-side in consent records | `ipAddress` in ConsentRecord is populated from server-side `x-forwarded-for`, not client input. |
| G-16 | Consent version is dynamically sourced | Privacy policy version stored outside hardcoded string; bumped when privacy policy changes. |
| G-17 | Israeli Registrar of Databases registration | Application submitted to the Registrar before any data collection from users outside of test accounts. |
| G-18 | Data Security Officer appointed | Named DSO documented in internal governance records. Contact email publicly listed in privacy policy. |

### 8.4 MONITORING — Required Post-Launch

| # | Gate | Acceptance Criterion |
|---|------|----------------------|
| G-19 | Breach notification procedure documented | Written procedure exists naming who is notified within 72 hours, with contact details for the Israeli Registrar. |
| G-20 | Penetration test by external firm | Independent pentest conducted within 90 days of launch. All CRITICAL and HIGH findings remediated. |
| G-21 | Data retention automation | Practice recording auto-delete (1 year) and financial record archiving (7 years) are scheduled Cloud Functions that run and can be verified in audit logs. |

---

## Summary Table

| Finding | Category | Severity | Launch Blocker? |
|---------|----------|----------|-----------------|
| FINDING-AUTH-01 | Session cookie SameSite=lax | MEDIUM | No |
| FINDING-AUTH-02 | Edge proxy lightweight JWT decode | LOW | No |
| FINDING-AUTH-03 | Dev bypass depends on NODE_ENV | LOW | Yes (G-07) |
| FINDING-AUTH-04 | Session expiry sync | LOW | No |
| FINDING-AUTH-05 | No concurrent session inventory | LOW | No |
| FINDING-AUTHZ-01 | `withAuth` does not enforce role | HIGH | Yes (G-05) |
| FINDING-AUTHZ-02 | Consent recording for arbitrary user | HIGH | Yes (G-05) |
| FINDING-AUTHZ-03 | `getConsentStatus` cross-user leak | MEDIUM | Yes (G-12) |
| FINDING-AUTHZ-04 | All `/api/*` pass without auth | MEDIUM | No |
| FINDING-AUTHZ-05 | Tenant isolation not QA-tested | MEDIUM | Yes (G-08) |
| FINDING-AUTHZ-06 | `recordConsentAction` all-roles | LOW | No |
| FINDING-INPUT-01 | `invoiceId` not format-validated | MEDIUM | No |
| FINDING-INPUT-02 | IP/UA trusted from client | LOW | Yes (G-15) |
| FINDING-INPUT-03 | No HTML sanitization policy | MEDIUM | Yes (G-09) |
| FINDING-INPUT-04 | OTP injection not tested | LOW | No |
| FINDING-DATA-01 | `ipAddress: ''` in consent records | MEDIUM | Yes (G-15) |
| FINDING-DATA-02 | Hardcoded consent version | MEDIUM | Yes (G-16) |
| FINDING-DATA-03 | DSAR export is UI-only toast | HIGH | Yes (G-03) |
| FINDING-DATA-04 | DSAR deletion is UI-only | HIGH | Yes (G-04) |
| FINDING-DATA-05 | Admin Firestore bypasses DB adapter | LOW | No |
| FINDING-DATA-06 | Signature dataUrl no size cap | LOW | No |
| FINDING-API-01 | HMAC: proxy header check vs. full verify | LOW | No |
| FINDING-API-02 | Rate limiter is in-process memory | MEDIUM | Yes (G-10) |
| FINDING-API-03 | Webhook GET exposes handler identity | LOW | No |
| FINDING-API-04 | No Content-Type enforcement on webhook | LOW | No |
| FINDING-API-05 | Login error could leak Firebase codes | LOW | No |
| FINDING-INFRA-01 | Firestore Security Rules not deployed | CRITICAL | Yes (G-01) |
| FINDING-INFRA-02 | Storage Security Rules not deployed | CRITICAL | Yes (G-02) |
| FINDING-INFRA-03 | Firebase App Check not configured | MEDIUM | Yes (G-13) |
| FINDING-INFRA-04 | Supabase service key exposure risk | MEDIUM | No |
| FINDING-INFRA-05 | OAuth redirect validation not confirmed | MEDIUM | No |
| FINDING-INFRA-06 | ComplianceLog not wired | HIGH | Yes (G-11) |

**CRITICAL:** 2 (FINDING-INFRA-01, FINDING-INFRA-02)
**HIGH:** 5 (FINDING-AUTHZ-01, FINDING-AUTHZ-02, FINDING-DATA-03, FINDING-DATA-04, FINDING-INFRA-06)
**MEDIUM:** 11
**LOW:** 13

---

*Review prepared by Security Architect agent — Lyriosa QA Plan v1.1, 2026-03-14.*
*All findings are based on static analysis of the codebase and documentation. Dynamic testing against a live environment is required to confirm remediation.*
