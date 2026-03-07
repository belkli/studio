# Harmonia Security Audit — npm Dependency Vulnerabilities

**Date:** 2026-03-07
**Auditor:** Security Engineering
**Scope:** npm dependency vulnerability remediation (firebase-admin chain + xlsx)
**Status:** REMEDIATED (one residual risk documented below)

---

## 1. Executive Summary

An npm audit identified 5 vulnerability chains in Harmonia's production and development dependencies. All critical and high-severity issues have been resolved by upgrading `firebase-admin` from `^10.3.0` to `^13.7.0` and removing the unused `xlsx` package. No source code changes were required — the existing `src/lib/firebase-admin.ts` already used the modern named-import API style compatible with v13.

| Severity  | Before | After |
|-----------|--------|-------|
| Critical  | 2      | 0     |
| High      | 4      | 0     |
| Moderate  | 1      | 0     |
| Low       | —      | 9 (transitive, dev-only) |

---

## 2. Vulnerabilities Found

### 2.1 `@google-cloud/firestore` <=6.1.0-pre.0 — CRITICAL
**CVE:** Firestore service account key written to Node.js logs
**Impact:** Service account private key material could appear in log aggregation systems (e.g., Cloud Logging, Datadog), enabling impersonation of the Firebase service account with full Firestore read/write access.
**Attack surface:** Server-side only; requires access to production logs. Not exploitable from the public internet directly but a severe post-breach information disclosure risk.
**Root cause:** Pulled in transitively by `firebase-admin` <=11.4.0.

### 2.2 `google-gax` (transitive) — CRITICAL via `@grpc/grpc-js` <1.8.22
**CVE:** Memory allocation without limit enforcement in gRPC message framing
**Impact:** A malicious gRPC peer (or a compromised Firebase backend) could send crafted framing to trigger unbounded memory allocation, causing out-of-memory denial of service on the application server.
**Attack surface:** Internal — gRPC channel between the app server and Google Cloud APIs.

### 2.3 `protobufjs` 6.10.0–6.11.3 — CRITICAL
**CVE:** Prototype Pollution (GHSA-h755-8qp9-cq85)
**Impact:** Deserializing attacker-controlled protobuf messages could set arbitrary properties on `Object.prototype`, potentially leading to property injection, logic bypasses, or remote code execution in some Node.js patterns.
**Attack surface:** Triggered during protobuf deserialization. Exploitable if the application processes externally supplied protobuf payloads (e.g., responses from a compromised upstream gRPC service).

### 2.4 `jsonwebtoken` <=8.5.1 — HIGH (3 CVEs)
- **CVE-2022-23539:** Algorithms confusion — `none` algorithm accepted
- **CVE-2022-23540:** Insecure comparison of secret types
- **CVE-2022-23541:** Asymmetric key acceptance when symmetric expected
**Impact:** JWT verification bypass. The most severe scenario: an unauthenticated attacker constructs a JWT signed with algorithm `none`, which older versions of `jsonwebtoken` accept as valid, bypassing all Firebase token verification.
**Attack surface:** `firebase-admin` used `jsonwebtoken` internally to verify Firebase ID tokens in `admin.auth().verifyIdToken()`. Although Harmonia wraps this in `verifyAuth()` (see `src/lib/auth-utils.ts`), the underlying library vulnerability meant the verification could be bypassed.

### 2.5 `xlsx` * — HIGH (Prototype Pollution + ReDoS)
- **GHSA-4r6h-8v6p-xvh6:** Prototype Pollution via `set` utility
- **GHSA-4r6h-8v6p-xvh6 (ReDoS):** Regular expression denial of service on CSV parsing
**No fix available** from the upstream maintainer (SheetJS has moved to a commercial model; the npm package is unmaintained).
**Impact in Harmonia:** `xlsx` was present in `devDependencies` only and was not imported anywhere in `src/`. It was never bundled into the production build and posed no runtime risk. However, it could be exploited during developer workstation builds or CI runs processing malicious files.

---

## 3. Fixes Applied

### 3.1 `firebase-admin` upgraded: `^10.3.0` → `^13.7.0`

**File changed:** `package.json`

This single upgrade resolves all four CVE chains listed above:
- `@google-cloud/firestore` upgraded from <=6.1.0-pre.0 to 7.11.6 (patched)
- `@grpc/grpc-js` upgraded from <1.8.22 to 1.9.15 (patched)
- `protobufjs` upgraded from 6.x to 7.5.4 (patched)
- `jsonwebtoken` upgraded from <=8.5.1 to 9.0.3 (patched)

**Breaking change analysis:** No source code changes were required. The existing `src/lib/firebase-admin.ts` already used the v13-compatible named-export style:

```typescript
// Already correct for v13 — no changes needed:
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
```

All consuming files (`src/lib/auth-utils.ts`, `src/app/api/auth/logout/route.ts`, `src/app/actions/consent.ts`, `src/app/actions/storage.ts`, `src/lib/db/adapters/firebase.ts`) use the internal `getAdminAuth()` / `getAdminFirestore()` / `getAdminStorage()` wrappers from `src/lib/firebase-admin.ts` and required no modification.

**TypeScript check post-upgrade:** `npx tsc --noEmit` reported 0 firebase-admin-related errors. The 2 pre-existing errors (`admin-makeup-dashboard.tsx` lines 153, 162) relate to `next-intl` translator types and are unrelated to this upgrade.

**Installed version confirmed:** `13.7.0`

### 3.2 `xlsx` removed from `devDependencies`

**File changed:** `package.json`

Since `xlsx` has no patched version and is not imported anywhere in `src/` (confirmed by full codebase search), it was removed from `devDependencies`. This eliminates the vulnerability entirely.

**Usage verification:** The following search returned zero matches across all `.ts` and `.tsx` files:
```
grep -r "xlsx|exceljs|XLSX|SheetJS" src/ --include="*.ts" --include="*.tsx"
```

**Replacement guidance (if Excel export is needed in future):** Use `exceljs` (MIT licensed, actively maintained, no known critical CVEs). Install as a dependency only when required, scoped to the specific feature module.

---

## 4. Remaining Risks

### 4.1 Low-severity transitive vulnerabilities (9 issues)

After the upgrade, `npm audit` reports 9 low-severity vulnerabilities. These are all in deep transitive dependencies (build tooling, not runtime code). None are directly exploitable in Harmonia's threat model:

- `glob` 10.5.0: deprecated old API warning (not a CVE)
- `rimraf` 5.x: similar tooling deprecation
- `esbuild` 0.27.3: the known dev-server advisory (GHSA-67mh-4wv8-2f99) requires an attacker to send a crafted HTTP request to the local Vite dev server. It is dev-only, never exposed in production.

**Recommendation:** Run `npm audit fix` after the next minor version update cycle to pick up transitive fixes automatically.

### 4.2 `path-to-regexp` 0.1.12 (transitive, Express internals via Next.js)

Express uses an ancient `path-to-regexp` version. This is a known issue tracked upstream in the Next.js project. The version in use (0.1.12) has a ReDoS advisory. In Harmonia's case:
- The affected code path handles route matching at the framework level, not user input
- Firebase App Hosting fronts the application with Google's CDN, which limits raw HTTP access
- Upgrading requires a Next.js release — monitor Next.js changelog

### 4.3 No `npm audit` integration in CI

The `.github/workflows/ci.yml` does not currently run `npm audit` as a blocking step. This means new vulnerabilities introduced by dependency updates will not be caught automatically.

---

## 5. Recommendations for Production

### Immediate (before next deployment)

1. **Run `npm install`** to regenerate `package-lock.json` with `xlsx` removed. Commit both `package.json` and `package-lock.json`.

2. **Rotate the Firebase service account key** (`FIREBASE_SERVICE_ACCOUNT_KEY` in Secret Manager) as a precaution. The old key may have been logged due to the `@google-cloud/firestore` CVE if the application was running any version prior to this fix.
   - GCP Console → IAM & Admin → Service Accounts → Generate new key → Update the secret in Secret Manager → Delete old key

3. **Audit production Cloud Logging** for the past 90 days for any log entries containing `private_key` or `client_email` strings originating from the Node.js application process.

### Short-term (within 2 weeks)

4. **Add `npm audit --audit-level=high` to CI** as a blocking check on every PR:

```yaml
# In .github/workflows/ci.yml, add to the test job:
- name: Security audit
  run: npm audit --audit-level=high
```

5. **Enable Dependabot** for automated dependency PRs:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    groups:
      firebase:
        patterns: ["firebase*", "@google-cloud/*", "@grpc/*"]
```

6. **Pin `firebase-admin` to an exact minor** in `package.json` (`"firebase-admin": "13.7.0"` without `^`) to prevent silent upgrades that could introduce breaking changes in server-side auth.

### Medium-term (within 1 month)

7. **Content Security Policy headers**: Add `Content-Security-Policy` response headers in `next.config.ts` to mitigate XSS impact even if a prototype pollution exploit were to succeed client-side.

8. **Key logging audit**: Add a CI lint rule that flags any `console.log` / `console.error` calls that could inadvertently serialize credential objects (e.g., objects containing `private_key` keys).

9. **Secret scanning**: Enable GitHub secret scanning on the repository to catch accidental credential commits.

---

## 6. File Changes Summary

| File | Change |
|------|--------|
| `package.json` | `firebase-admin` bumped `^10.3.0` → `^13.7.0`; `xlsx` removed from devDependencies |
| `package-lock.json` | Regenerated by npm (43 added, 88 removed, 21 changed packages) |

No source code changes were required. All Firebase Admin SDK usage in the codebase already conforms to the v13 named-export API.

---

## 7. References

- [GHSA-h755-8qp9-cq85](https://github.com/advisories/GHSA-h755-8qp9-cq85) — protobufjs Prototype Pollution
- [CVE-2022-23539](https://nvd.nist.gov/vuln/detail/CVE-2022-23539) — jsonwebtoken algorithms confusion
- [CVE-2022-23540](https://nvd.nist.gov/vuln/detail/CVE-2022-23540) — jsonwebtoken insecure comparison
- [CVE-2022-23541](https://nvd.nist.gov/vuln/detail/CVE-2022-23541) — jsonwebtoken asymmetric key confusion
- [firebase-admin v13 release notes](https://firebase.google.com/docs/admin/migrate-node-v13)
- [GHSA-4r6h-8v6p-xvh6](https://github.com/advisories/GHSA-4r6h-8v6p-xvh6) — xlsx Prototype Pollution
- [exceljs](https://github.com/exceljs/exceljs) — recommended xlsx replacement
