# 06 -- Security

## 1. Summary

Harmonia stores Israeli ID numbers, children's audio/video recordings, credit card histories, exam results, and scholarship financial disclosures. A breach violates the **Israeli Protection of Privacy Law (PDPPA / 5741-1981)**.

**Current security status:**
- ✅ Firebase session cookie authentication (production)
- ✅ Edge Proxy validates `__session` JWT on all dashboard routes
- ✅ `verifyAuth()` + `requireRole()` enforce RBAC on Server Actions
- ✅ Zod validation on all critical schemas (no remaining `z.any()`)
- ✅ Cloud Functions set Custom Claims on user approval
- ✅ HTTP security headers active (HSTS, CSP, X-Frame-Options)
- 🚧 Firestore Security Rules template in repo, not yet deployed
- 🚧 Firebase App Check not yet configured

---

## 2. Authentication

### 2.1 Methods

| Method | Status |
|--------|--------|
| Email + Password (Firebase Auth) | ✅ |
| Google OAuth | ✅ |
| Microsoft OAuth | ✅ |
| Magic Link (Email) | 📋 Planned |
| Phone OTP (SMS) | 📋 Planned |

### 2.2 Session Management

Production uses Firebase session cookies:
- **Created by** `/api/auth/login` after client `signInWithEmailAndPassword` or OAuth
- **Cookie:** `__session` (Firebase hosting convention), HttpOnly, 14-day expiry
- **Validated by** `proxy.ts` (JWT decode for headers) and `verifyAuth()` (Admin SDK `verifySessionCookie()`)
- **Revoked by** `/api/auth/logout` which calls `admin.auth().revokeRefreshTokens()`

### 2.3 Dev Bypass

When `NODE_ENV !== 'production'` and `FIREBASE_SERVICE_ACCOUNT_KEY` is absent:
- `proxy.ts` injects synthetic `site_admin` claims
- `verifyAuth()` returns synthetic dev session

This is **unreachable in production** because Firebase App Hosting sets `NODE_ENV='production'` and provides credentials via Secret Manager.

---

## 3. Authorization (RBAC)

### 3.1 Edge Proxy Headers

`proxy.ts` validates the `__session` cookie and injects:
- `x-user-id`
- `x-user-role`
- `x-user-conservatorium-id`
- `x-user-approved`
- `x-user-email`

### 3.2 Server Action Guard

```typescript
// src/lib/auth-utils.ts
const GLOBAL_ADMIN_ROLES = ['site_admin', 'superadmin'];

async function requireRole(
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

### 3.3 Custom Claims

Set by `onUserApproved` Cloud Function when admin approves a user:
- `role`, `conservatoriumId`, `approved: true`
- Stored as Firebase Custom Claims on the Auth token

---

## 4. Firestore Security Rules

Template in `firestore.rules` enforces:
1. Authentication required for all operations
2. Tenant isolation (`conservatoriumId` from Custom Claims must match)
3. Role-based field access
4. Parent-child isolation via `parentOf/{parentId_studentId}` collection

---

## 4a. Supabase Row Level Security (RLS) Requirements

When the Supabase backend is used (`DB_BACKEND=supabase`), all tables **must** have RLS enabled and policies deployed before going to production. Server-side access via the service role key bypasses RLS, but direct client queries (e.g., Supabase JS client in the browser) do not.

### Required RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| `users` | `SELECT own row` | `auth.uid() = id` |
| `users` | `SELECT by conservatorium admin` | `role IN ('conservatorium_admin', 'site_admin')` AND `conservatorium_id = auth.jwt()->>'conservatoriumId'` |
| `lessons` | `SELECT/INSERT/UPDATE` | `teacher_id = auth.uid()` OR `student_id = auth.uid()` OR admin role |
| `packages` | `SELECT` | `student_id = auth.uid()` OR parent of student OR admin role |
| `compositions` | `SELECT` | Public read; write restricted to `ministry_director`, `site_admin` |
| `consent_records` | `SELECT/INSERT` | `user_id = auth.uid()` |
| `compliance_logs` | `INSERT` | Any authenticated user (own records only); `SELECT` restricted to `site_admin` |
| `conservatoriums` | `SELECT` | Public read; write restricted to `conservatorium_admin` for own row, `site_admin` for all |

### Enabling RLS

```sql
-- Enable RLS on all tables (run once per table)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conservatoriums ENABLE ROW LEVEL SECURITY;

-- Example policy: users can read their own row
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid()::text = id);

-- Example policy: conservatorium admins can read users in their conservatorium
CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (
    auth.jwt()->>'role' IN ('conservatorium_admin', 'site_admin')
    AND (
      auth.jwt()->>'role' = 'site_admin'
      OR conservatorium_id = auth.jwt()->>'conservatoriumId'
    )
  );
```

> **Deployment note:** The service role key (used by Server Actions via `src/lib/db/supabase-adapter.ts`) bypasses RLS. Policies protect against direct Supabase client access or misconfigured credential leaks. Always verify RLS is active in the Supabase dashboard under **Authentication → Policies** before production launch.

---

## 5. Security Headers

Active in `next.config.ts`:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` -- includes Cardcom, Google APIs, Firebase domains

---

## 6. STRIDE Threat Model

| Threat | Mitigation | Status |
|--------|-----------|--------|
| **S**poofing | `verifySessionCookie()` cryptographic verification | ✅ |
| **T**ampering | Zod validation on all Server Actions | ✅ |
| **R**epudiation | Cardcom webhook HMAC + compliance logs | 🚧 |
| **I**nformation Disclosure | `verifyAuth()` + `requireRole()` | ✅ |
| **D**enial of Service | Firebase App Check | 📋 |
| **E**levation of Privilege | `requireRole()` with tenant isolation | ✅ |

---

## 7. PDPPA Compliance

### 7.1 Sensitive Data

- Israeli ID numbers of minors and parents
- Children's audio/video recordings
- Financial information (payments, invoices)
- Ministry exam results
- Scholarship financial disclosures

### 7.2 Implementation Status

| Requirement | Status |
|-------------|--------|
| Consent collection (`ConsentRecord` type) | ✅ Type + UI (`consent-checkboxes.tsx`) + `saveConsentRecord` Server Action persisting to DB |
| Digital signatures (`SignatureAuditRecord`) | ✅ `signature-capture.tsx` + SHA-256 hash + `src/app/actions/signatures.ts` |
| Data access log (`ComplianceLog`) | ✅ Type + `src/app/actions/consent.ts` writes audit entries |
| Cookie banner (GDPR/PDPPA) | ✅ `src/components/consent/cookie-banner.tsx` — localStorage `harmonia_cookie_consent` |
| DSAR (Data Subject Access Requests) | ✅ Export, delete, and consent withdrawal in `/dashboard/settings` (all roles) |
| Parental consent differentiation | ✅ Separate checkbox path when `accountType === 'PLAYING_SCHOOL'` or student under 13 |
| Enrollment contract step | ✅ Signature capture in enrollment wizard; `SignatureAuditRecord` stored |
| 14-day cooling-off period | ✅ `cancelPackageAction()` in `src/app/actions/billing.ts` |
| Right to erasure (full) | 📋 Deletion request UI ✅; backend purge job not yet scheduled |
| Data retention enforcement | 📋 `RetentionPolicy` type defined; automated purge cron not yet deployed |
| Data residency (europe-west1) | ✅ Cloud Functions configured |
| Sub-processors disclosure | ✅ Privacy page updated with sub-processors table |

### 7.3 Under-13 Protection

- Students under 13 have no login; parent is the authenticated actor
- No direct email/SMS to under-13 students
- `parentOf/{parentId_studentId}` for Security Rules access grants
- Practice videos use signed URLs (not public)

---

## 8. Pre-Launch Checklist

### Done

- [x] Firebase session cookie authentication
- [x] Edge Proxy validates sessions and injects auth headers
- [x] `verifyAuth()` layered auth chain
- [x] `requireRole()` RBAC with tenant isolation
- [x] All `z.any()` schemas replaced with proper Zod validators
- [x] `onUserApproved` Cloud Function sets Custom Claims
- [x] HTTP security headers (HSTS, CSP, etc.)
- [x] OAuth with Google + Microsoft
- [x] Israeli phone normalisation

### Remaining

- [ ] Deploy Firestore Security Rules
- [ ] Deploy Firebase Storage Security Rules
- [ ] Enable Firebase App Check
- [ ] Cardcom webhook HMAC body verification
- [ ] Store all secrets in Google Secret Manager
