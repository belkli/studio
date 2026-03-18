# QA Plan: Auth & Registration

**Domain:** Authentication, Login, Logout, User Registration, Playing School Enrollment, Invite Acceptance, Pending Approval
**Prepared:** 2026-03-14
**Status:** Draft — ready for PM review

---

## Overview

This plan covers every E2E test scenario for the Auth & Registration domain. It is intended for a QA engineer to execute against a running dev or staging environment. Scenarios are grouped by feature area. For each scenario the plan specifies:

- What to test and why
- Exact preconditions and mock data
- Step-by-step actions
- Expected results at each step
- DB backend scope (MEMORY / POSTGRES / BOTH)
- Locale scope (ALL-LOCALES / specific)
- Security checks where applicable
- External API stubs needed

---

## Dev Bypass vs. Production Auth

A critical invariant to verify in every auth test:

| Environment | `FIREBASE_SERVICE_ACCOUNT_KEY` | `SUPABASE_SERVICE_KEY` | Behaviour |
|---|---|---|---|
| Local dev | absent | absent | Dev bypass: proxy injects `site_admin` headers; `verifyAuth()` returns synthetic claims |
| Local dev | present | — | Full Firebase auth path active |
| Staging / Prod | present | — | Full auth path; no bypass |

**Rule:** Tests that intentionally test the bypass should run without credentials. Tests that verify actual auth (rate limits, cookie expiry, invalid tokens) must run against a configured auth provider (staging/prod environment).

---

## A. Login Page

### A-01 — Login page renders in all locales

**Scenario:** Verify the login page renders correctly in all four locales, including RTL.

**Personas:** Anonymous visitor
**Preconditions:** None
**DB:** BOTH
**Locales:** ALL-LOCALES

**Steps:**
1. Navigate to `/he/login` (Hebrew, RTL)
2. Navigate to `/en/login` (English, LTR)
3. Navigate to `/ar/login` (Arabic, RTL)
4. Navigate to `/ru/login` (Russian, LTR)

**Expected results:**
- Each page returns HTTP 200
- The login card renders with email, password fields, tabs (Email/Password | Magic Link)
- Google and Microsoft OAuth buttons are visible
- "Back to Home" (`← Lyriosa`) link is in the top-start corner
- For RTL locales (he, ar): the layout is right-to-left, the back arrow points left, tab order is reversed logically
- For LTR locales (en, ru): standard left-to-right layout
- No console errors about missing translation keys

**RTL checks:**
- `dir="rtl"` on the card for he/ar
- Margin/padding uses logical properties (`ms-`, `me-`, `ps-`, `pe-`)
- Arrow icon in back link rotates 180° for LTR via `ltr:rotate-180` class

---

### A-02 — Email/Password login — happy path (dev bypass / mock)

**Scenario:** A known mock user logs in using email/password via the mock fallback (no auth provider configured).

**Personas:** student-user-1 (email: student@harmonia.local or equivalent mock email)
**Preconditions:**
- `NODE_ENV=development`, no `FIREBASE_SERVICE_ACCOUNT_KEY`
- Mock user exists in `mockUsers` with `approved: true`
**DB:** MEMORY
**Locales:** `he` (primary), `en` (smoke)

**Mock data needed:**
```json
{
  "id": "student-user-1",
  "email": "student@harmonia.local",
  "name": "תלמיד לדוגמה",
  "role": "student",
  "approved": true,
  "conservatoriumId": "cons-15"
}
```

**Steps:**
1. Navigate to `/login`
2. Observe yellow dev-mode notice banner (present in non-production only)
3. Fill email: `student@harmonia.local`
4. Fill password: any non-empty string (mock path ignores password)
5. Click "Login"
6. Wait for toast: success message with first name
7. Observe redirect to `/dashboard`

**Expected results:**
- Yellow dev-mode banner visible before submit
- After submit: loading spinner on button
- Success toast: `t('toasts.loginSuccess')` with user's first name
- Redirect lands on `/[locale]/dashboard`
- `harmonia-user` key in localStorage contains serialised user JSON
- `harmonia-auth` cookie set

---

### A-03 — Email/Password login — user not found (mock fallback)

**Scenario:** Login attempt with an email not in `mockUsers`.

**Personas:** Anonymous visitor
**Preconditions:** Dev bypass active, email does not exist in mock data
**DB:** MEMORY
**Locales:** `he`

**Steps:**
1. Navigate to `/login`
2. Fill email: `nobody@example.com`
3. Fill password: `anything`
4. Click "Login"

**Expected results:**
- Destructive toast: `t('toasts.loginFailed')` / `t('toasts.loginFailedDesc')`
- No redirect
- Button re-enabled after failure
- `harmonia-user` NOT set in localStorage

---

### A-04 — Email/Password login — pending user

**Scenario:** A registered but not-yet-approved user attempts to log in.

**Personas:** pending user (e.g., `approved: false` in mock)
**Preconditions:**
- Mock user with `approved: false`
- Dev bypass active
**DB:** MEMORY
**Locales:** `he`

**Mock data needed:**
```json
{
  "id": "pending-user-1",
  "email": "pending@harmonia.local",
  "name": "ממתין לאישור",
  "role": "teacher",
  "approved": false
}
```

**Steps:**
1. Navigate to `/login`
2. Fill email: `pending@harmonia.local`, password: anything
3. Click "Login"

**Expected results:**
- Destructive toast: `t('toasts.pendingAccount')` / `t('toasts.pendingAccountDesc')`
- Page stays on login
- No redirect to dashboard
- `harmonia-user` NOT set

---

### A-05 — Email/Password login — empty email validation

**Scenario:** User submits login without entering email.

**Personas:** Anonymous
**Preconditions:** None
**DB:** BOTH
**Locales:** `en`

**Steps:**
1. Navigate to `/en/login`
2. Leave email blank
3. Fill password: `anything`
4. Click "Login"

**Expected results:**
- Destructive toast: `t('toasts.missingEmail')` / `t('toasts.missingEmailDesc')`
- No API call to `/api/auth/login`
- Form remains on page

---

### A-06 — Email/Password login — empty password validation

**Scenario:** User submits login with email but no password.

**Personas:** Anonymous
**Preconditions:** None
**DB:** BOTH
**Locales:** `en`

**Steps:**
1. Navigate to `/en/login`
2. Fill email: `test@example.com`
3. Leave password blank
4. Click "Login"

**Expected results:**
- Destructive toast: `t('toasts.missingPassword')` / `t('toasts.missingPasswordDesc')`
- No API call made

---

### A-07 — Magic Link tab — sends magic link

**Scenario:** User switches to magic link tab, enters email, sends.

**Personas:** Anonymous
**Preconditions:** None
**DB:** BOTH
**Locales:** `en`

**Steps:**
1. Navigate to `/en/login`
2. Click "Magic Link" tab
3. Fill email: `student@harmonia.local`
4. Click "Send Magic Link"
5. Wait ~1 second

**Expected results:**
- Tab switches, only email field shown (no password)
- After clicking: loading state on button
- Success toast: `t('toasts.magicLinkSent')` / `t('toasts.magicLinkSentDesc')`
- Button re-enabled, no redirect

---

### A-08 — Magic Link — empty email validation

**Steps:**
1. Switch to Magic Link tab
2. Leave email blank, click "Send Magic Link"

**Expected results:**
- Destructive toast: `t('toasts.missingEmail')`

---

### A-09 — Forgot Password — no email entered

**Scenario:** User clicks "Forgot password" without entering email.

**Steps:**
1. Navigate to login page
2. Click "Forgot password" link (without filling email)

**Expected results:**
- Destructive toast: `t('enterEmailFirst')`
- No API call

---

### A-10 — Forgot Password — with email

**Steps:**
1. Navigate to login page
2. Fill email: `teacher@harmonia.local`
3. Click "Forgot password"

**Expected results:**
- Success toast: `t('passwordResetSent')` + `t('passwordResetSentDesc')`

---

### A-11 — callbackUrl redirect after login

**Scenario:** Unauthenticated user visits protected route, gets redirected to login with `callbackUrl`, then after login lands on the originally requested page.

**Personas:** student-user-1
**Preconditions:** Dev bypass OFF (auth provider configured, or test via direct URL manipulation)
**DB:** BOTH
**Locales:** `he`, `en`

**Steps:**
1. Navigate to `/dashboard/schedule/book?tab=deals` without session
2. Observe redirect to `/login?callbackUrl=%2Fdashboard%2Fschedule%2Fbook%3Ftab%3Ddeals`
3. Log in with valid credentials
4. Observe redirect to `/dashboard/schedule/book?tab=deals`

**Expected results:**
- Step 2: login page shows with `callbackUrl` in URL
- Step 4: after successful login, lands on the exact `callbackUrl` (not just `/dashboard`)
- `callbackUrl` defaults to `/dashboard` when absent

**Security check:** `callbackUrl` must only accept relative paths. Attempt `callbackUrl=https://evil.com/` — verify it redirects to `/dashboard` instead of the external URL.

---

### A-12 — OAuth Sign In — Google (existing user, mock)

**Scenario:** Google OAuth sign-in for an email already in `mockUsers`.

**Personas:** teacher-user-1
**Preconditions:**
- Mock teacher exists with email matching OAuth profile
- `getClientAuthProvider()` returns a mock that resolves `{ type: 'success', profile: { email: 'teacher@harmonia.local', ... } }`
**Stubs:** Mock `getClientAuthProvider` to return fixture OAuth result
**DB:** MEMORY
**Locales:** `he`

**Steps:**
1. Click "Google" OAuth button on login page
2. Stub resolves with matching email

**Expected results:**
- User linked (oauthProviders array updated in memory)
- `login(email)` called → user logged in
- Redirect to `callbackUrl` (`/dashboard`)

---

### A-13 — OAuth Sign In — Google (new user, no account)

**Scenario:** Google OAuth for email NOT in mockUsers → redirect to register.

**Preconditions:** OAuth stub returns email that does not exist in mock data
**Stubs:** Mock `getClientAuthProvider`

**Steps:**
1. Click "Google" button
2. OAuth resolves with new email

**Expected results:**
- `oauth_prefill` sessionStorage key set with profile JSON
- Redirect to `/register?source=oauth`
- Registration wizard pre-fills data from sessionStorage

---

### A-14 — OAuth Sign In — account conflict

**Scenario:** OAuth returns `type: 'conflict'` (email already registered with password).

**Stubs:** Mock provider returns `{ type: 'conflict', existingMethods: ['password'] }`

**Expected results:**
- Destructive toast: `t('accountExistsTitle')` with existing methods listed
- No redirect
- No sessionStorage entry set

---

### A-15 — OAuth Sign In — provider error

**Scenario:** OAuth provider throws an error.

**Stubs:** Mock `getClientAuthProvider` throws

**Expected results:**
- Destructive toast: `t('oauthErrorTitle')` / `t('oauthErrorDesc')`
- Loading state cleared

---

### A-16 — Back to Home link

**Scenario:** Verify the top-start "← Lyriosa" / "Lyriosa →" link navigates to home.

**Steps:**
1. Navigate to `/en/login`
2. Click the back-to-home link

**Expected results:**
- Navigate to `/en` (home / landing page)
- Not to a 404

**RTL check:** In `/he/login` the arrow icon points in the correct RTL direction.

---

### A-17 — Login page redirects authenticated users

**Scenario:** A user who already has a valid session navigates to the login page.

**Preconditions:** Valid `__session` cookie set (or dev bypass active with localStorage user)
**Note:** Current implementation does NOT auto-redirect authenticated users away from login (no guard in the page component). Document current behaviour and flag as gap if PM wants a redirect.

**Expected results (current):** Login page renders even with active session.
**PM action item:** Decide if an already-authenticated visit to `/login` should redirect to `/dashboard`.

---

## B. Logout

### B-01 — Logout clears session and redirects to home

**Scenario:** An authenticated user clicks logout.

**Personas:** Any logged-in persona
**Preconditions:** User logged in (session cookie or localStorage)
**DB:** BOTH
**Locales:** `he`, `en`

**Steps:**
1. Log in successfully
2. Click "Logout" (from sidebar or pending-approval page)

**Expected results:**
- POST to `/api/auth/logout` fires
- `__session` cookie deleted
- `harmonia-user` localStorage key removed
- `harmonia-auth` cookie deleted
- Redirect to `/` (home), NOT `/login`
- Dashboard page no longer accessible without re-login

---

### B-02 — Logout API — POST /api/auth/logout

**Scenario:** Direct API test of logout endpoint.

**Steps:**
1. POST to `/api/auth/logout` with no body

**Expected results:**
- HTTP 200
- `{ ok: true }` JSON response
- `__session` and `harmonia-user` Set-Cookie headers to expire/delete cookies
- No 500 even without active session (silent cleanup)

---

### B-03 — Logout with expired session cookie

**Scenario:** `__session` cookie present but already expired/invalid; user clicks logout.

**Preconditions:** Set an invalid `__session` cookie value

**Expected results:**
- Server catches exception in `revokeUserSessions` silently
- Logout still succeeds: session deleted, redirect to `/`

---

## C. Session Cookie & Proxy Auth

### C-01 — Unauthenticated access to dashboard redirects to login

**Scenario:** No `__session` cookie, auth provider configured (production-like).

**Preconditions:** `FIREBASE_SERVICE_ACCOUNT_KEY` set (staging env)
**DB:** BOTH
**Locales:** `he`, `en`

**Steps:**
1. Clear all cookies
2. Navigate directly to `/dashboard`

**Expected results:**
- Proxy detects no session cookie
- Redirect to `/login?callbackUrl=%2Fdashboard`
- HTTP 302 (or client redirect)

---

### C-02 — Expired/invalid session cookie redirects to login

**Scenario:** `__session` cookie present but provider returns `null` from `extractClaimsFromCookie`.

**Preconditions:** Tampered/expired cookie
**DB:** BOTH

**Steps:**
1. Set `__session` cookie to `invalid.token.here`
2. Navigate to `/dashboard`

**Expected results:**
- Proxy calls `extractClaimsFromCookie` → returns `null`
- `__session` cookie deleted in redirect response
- Redirect to login page

---

### C-03 — Approved user can access dashboard

**Scenario:** Valid session cookie with `approved: true`.

**Preconditions:** Staging auth configured, valid session
**DB:** BOTH

**Steps:**
1. Log in as approved user
2. Navigate to `/dashboard`

**Expected results:**
- HTTP 200 (no redirect)
- Dashboard renders, `x-user-id`, `x-user-role` headers injected by proxy

---

### C-04 — Unapproved user redirected to pending-approval

**Scenario:** Session cookie valid but claims have `approved: false`.

**Preconditions:** User with `approved: false` in auth system
**DB:** BOTH

**Steps:**
1. Set `__session` cookie for unapproved user
2. Navigate to `/dashboard`

**Expected results:**
- Proxy detects `claims.approved === false`
- Redirect to `/[locale]/dashboard/pending-approval`

---

### C-05 — Pending approval page renders correctly

**Scenario:** Unapproved user lands on pending-approval page.

**Personas:** New teacher or admin pending approval
**Preconditions:** User authenticated but not approved
**DB:** BOTH
**Locales:** ALL-LOCALES

**Steps:**
1. Land on `/pending-approval` page (or `/dashboard/pending-approval`)
2. Click "Back to Site"
3. Navigate back, click "Logout"

**Expected results:**
- Pending approval card visible with clock icon, explanation, contact info
- Phone: `08-9467890`, Email: `office@harmony.org.il` visible
- 3 steps checklist (review, contact, notify) shown
- "Back to Site" navigates to `/`
- "Logout" button triggers full logout flow (B-01)

---

### C-06 — Role headers injected correctly per user role

**Scenario:** Verify proxy injects correct headers for each role.

**Personas:** One test per role: student, teacher, parent, conservatorium_admin, ministry_director, site_admin
**Preconditions:** Each user has valid session
**DB:** BOTH

**Steps:**
1. Log in as each persona
2. Visit a server-rendered dashboard page
3. Check server logs or response for header injection

**Expected results:**
- `x-user-role` matches the user's role exactly
- `x-user-conservatorium-id` matches user's conservatoriumId
- `x-user-approved: true` for approved users

---

### C-07 — Dev bypass injects site_admin headers without credentials

**Scenario:** Verify the dev bypass works in local mode.

**Preconditions:**
- `NODE_ENV=development`
- No `FIREBASE_SERVICE_ACCOUNT_KEY` or `SUPABASE_SERVICE_KEY`

**Steps:**
1. Clear all cookies and localStorage
2. Navigate to `/dashboard`

**Expected results:**
- No redirect to login
- Dashboard renders
- `x-user-id: dev-user`, `x-user-role: site_admin` injected
- `verifyAuth()` returns dev synthetic claims in Server Actions

---

### C-08 — API routes pass through without auth

**Scenario:** `/api/*` routes bypass the intl middleware and proxy auth.

**Steps:**
1. Make GET request to `/api/bootstrap` without session cookie
2. Make POST to `/api/auth/login` without session cookie

**Expected results:**
- Both return their own responses (not redirected to login)
- `/api/bootstrap` returns mock seed data (200)
- `/api/auth/login` returns 400 (missing token body) — not 302

---

### C-09 — Session cookie max age 14 days

**Scenario:** Verify session cookie attributes.

**Preconditions:** Staging environment with auth provider

**Steps:**
1. Log in successfully
2. Inspect `Set-Cookie` header for `__session`

**Expected results:**
- `HttpOnly` flag set
- `SameSite=Lax`
- `Path=/`
- `Secure` set in production, absent in development
- `Max-Age` ≈ 1,209,600 (14 days)

---

## D. Login API Rate Limiting

### D-01 — Rate limit: 11th login attempt within 15 minutes blocked

**Scenario:** Verify the login API rate limiter (10 req / 15 min per IP).

**Preconditions:** Staging environment with auth provider configured
**DB:** N/A (API route test)
**Locales:** N/A
**Security check:** Yes

**Steps:**
1. POST to `/api/auth/login` 10 times with any body from the same IP
2. POST an 11th time

**Expected results:**
- First 10 attempts return 400/401 (bad token) — not 429
- 11th attempt returns HTTP 429
- Response body: `{ "error": "Too many login attempts. Please try again later." }`
- Headers: `Retry-After`, `X-RateLimit-Limit: 10`, `X-RateLimit-Remaining: 0`

---

### D-02 — Rate limit resets after window

**Steps:**
1. Hit rate limit (D-01)
2. Wait for `Retry-After` seconds
3. POST again

**Expected results:**
- After window expires, request accepted again (400 or 401 — not 429)

---

### D-03 — Rate limit — invalid JSON body

**Steps:**
1. POST to `/api/auth/login` with body `not-json`

**Expected results:**
- HTTP 400, `{ "error": "Invalid JSON body" }`

---

### D-04 — Rate limit — missing idToken

**Steps:**
1. POST to `/api/auth/login` with `{}`

**Expected results:**
- HTTP 400, `{ "error": "Missing idToken" }`

---

### D-05 — Login API — invalid token rejected

**Steps:**
1. POST to `/api/auth/login` with `{ "idToken": "garbage" }`

**Expected results:**
- HTTP 401, `{ "error": "Invalid token or session creation failed" }`

---

## E. OAuth Callback (Supabase)

### E-01 — OAuth callback — Supabase provider — happy path

**Scenario:** Supabase OAuth redirects to `/api/auth/callback?code=...`

**Preconditions:** `AUTH_PROVIDER=supabase`, valid code
**Stubs:** Mock Supabase `exchangeCodeForSession` to return valid session

**Steps:**
1. Navigate to `/api/auth/callback?code=valid-code`

**Expected results:**
- Session cookie `__session` set with access token
- Redirect to `/dashboard`

---

### E-02 — OAuth callback — missing code

**Steps:**
1. Navigate to `/api/auth/callback` (no `code` param)

**Expected results:**
- Redirect to `/login?error=oauth_failed`

---

### E-03 — OAuth callback — Supabase code exchange failure

**Stubs:** Mock Supabase to return error from `exchangeCodeForSession`

**Expected results:**
- Redirect to `/login?error=oauth_failed`

---

### E-04 — OAuth callback — open redirect prevention

**Scenario:** Attacker crafts `next=https://evil.com`
**Security check:** Yes

**Steps:**
1. Navigate to `/api/auth/callback?code=valid-code&next=https://evil.com`

**Expected results:**
- The `next` param is sanitised: only relative paths starting with `/` and not `//` are allowed
- Redirect goes to `/dashboard` (default), NOT to `https://evil.com`

---

### E-05 — OAuth callback — Firebase provider ignores callback route

**Scenario:** Firebase uses popup, not redirect — callback route should not be used.

**Preconditions:** `AUTH_PROVIDER=firebase` (default)

**Steps:**
1. Navigate to `/api/auth/callback?code=anything`

**Expected results:**
- Redirect to `/dashboard` immediately (no code exchange)

---

## F. Standard Registration (Enrollment Wizard)

### F-01 — Register page loads (all locales)

**Personas:** Anonymous visitor
**Preconditions:** None
**DB:** BOTH
**Locales:** ALL-LOCALES

**Steps:**
1. Navigate to `/register` (he), `/en/register`, `/ar/register`, `/ru/register`

**Expected results:**
- Page returns HTTP 200
- Title matches locale: Hebrew/English/Arabic/Russian
- Enrollment wizard form renders (step 1: role selection + conservatorium)
- No redirect to login
- Accessibility footer link visible

---

### F-02 — Register page — enrollment wizard Step 1 (Role): validation

**Scenario:** User tries to advance without selecting a conservatorium.

**Preconditions:** Clear localStorage draft key `enrollment-wizard-draft:v1`
**DB:** MEMORY
**Locales:** `en`

**Steps:**
1. Navigate to `/en/register`
2. Wait for bootstrap data (conservatorium combobox populated)
3. Click "Next" without selecting a conservatorium

**Expected results:**
- Error message visible: "Please select a conservatorium" (or i18n key equivalent)
- URL stays at `/en/register`
- Step 1 does not advance

---

### F-03 — Register page — enrollment wizard Step 1: select parent role + conservatorium, advance

**Preconditions:** Conservatoriums seeded (85 from `constadmin.json`)
**DB:** MEMORY
**Locales:** `en`

**Steps:**
1. Navigate to `/en/register`, clear draft
2. Select "I am registering my child" (parent role) — should be default
3. Open conservatorium combobox, select first option (e.g., "הוד השרון - Hod HaSharon Conservatorium" if shown)
4. Click "Next"

**Expected results:**
- Advances to Step 2 (parent/student details)
- Step indicator shows step 2 active

---

### F-04 — Register — Step 2 (Details): invalid Israeli ID

**Steps:**
1. Complete Step 1 (F-03)
2. Fill parent name, email, phone with valid values
3. Fill ID number: `123` (too short, fails Luhn check)
4. Click "Next"

**Expected results:**
- ID validation error appears
- Does not advance to Step 3
- URL stays on `/en/register`

---

### F-05 — Register — Step 2 (Details): valid data, advance to Step 3

**Mock data:**
- Valid Israeli ID: `011565137` (passes Luhn)
- Parent: "Sarah Cohen", email `sarah@example.com`, phone `050-1234567`
- Student: "Dan Cohen", DOB `2015-06-15`

**Steps:**
1. Complete Step 1
2. Fill parent details with valid data
3. Fill student details with valid data
4. Click "Next"

**Expected results:**
- Advances to Step 3 (Musical details: instrument, level, duration)

---

### F-06 — Register — full happy-path (Steps 1–8, parent + student)

**Scenario:** Complete the entire registration wizard from role selection through contract signing to summary confirmation.

**Personas:** Parent registering a child
**Preconditions:**
- Clear localStorage draft
- Mock conservatorium data available via `/api/bootstrap`
- Stub `createEnrollmentAction` (or its equivalent Server Action) to return `{ ok: true }`
**DB:** MEMORY
**Locales:** `en`

**Steps:**
1. Step 1: Select parent, pick conservatorium → Next
2. Step 2: Fill parent (valid ID, email, phone, name) + student (name, DOB) → Next
3. Step 3: Select instrument, level, lesson duration → Next
4. Step 4: Select available days/times → Next
5. Step 5: Teacher matching — select a teacher or skip if auto-matched → Next
6. Step 6: Select a learning package → Next
7. Step 7: Accept consent checkboxes, draw signature → Next (contract step)
8. Step 8: Review summary → Click "Confirm Registration"

**Expected results:**
- Each step advances without errors
- Step indicator updates after each step
- Step 7: "Next" is disabled until signature is provided and contract accepted
- Step 8: Summary shows all entered data
- On final submit: success state renders with congratulations message

---

### F-07 — Register — draft persistence in localStorage

**Scenario:** User fills Steps 1–3, closes browser tab, reopens — draft should be restored.

**Preconditions:** `enrollment-wizard-draft:v1` key behaviour
**DB:** MEMORY
**Locales:** `en`

**Steps:**
1. Complete Steps 1–3
2. Close and reopen `/en/register`
3. Observe wizard state

**Expected results:**
- Wizard restores to the last completed step (or Step 1 with data pre-filled)
- Form fields from Step 2 are pre-populated
- No error in console about missing draft data

---

### F-08 — Register — teacher pre-selected via query param (`?teacher=X&conservatorium=Y`)

**Scenario:** User arrives from "Book Trial Lesson" CTA on landing page with teacher and conservatorium pre-selected.

**Preconditions:** `?teacher=teacher-user-1&conservatorium=cons-15` query params
**DB:** MEMORY
**Locales:** `he`

**Steps:**
1. Navigate to `/register?teacher=teacher-user-1&conservatorium=cons-15`
2. Observe Step 1

**Expected results:**
- Conservatorium `cons-15` pre-selected in combobox
- Teacher `teacher-user-1` pre-selected or surfaced in Step 5 (matching)
- User can proceed with pre-filled data

---

### F-09 — Register — OAuth pre-fill from sessionStorage (`?source=oauth`)

**Scenario:** User arrived via OAuth (new account) — registration form pre-fills from `oauth_prefill` sessionStorage key.

**Preconditions:**
- Set `sessionStorage.oauth_prefill` = `{ email: "user@gmail.com", firstName: "Jane", lastName: "Doe", provider: "google", ... }`
**DB:** MEMORY
**Locales:** `en`

**Steps:**
1. Set sessionStorage `oauth_prefill` manually via `page.evaluate`
2. Navigate to `/en/register?source=oauth`
3. Reach Step 2 (details)

**Expected results:**
- Email field pre-filled with `user@gmail.com`
- Name fields pre-filled with Jane / Doe
- Provider badge or indicator visible (OAuth registration source)

---

### F-10 — Register — student self-registration (no parent)

**Scenario:** Adult student registering themselves (role = student, not parent).

**Steps:**
1. Navigate to `/en/register`
2. Select "I am a student" role in Step 1
3. Complete wizard with student details only (no separate parent section)

**Expected results:**
- Step 2 shows student details only (no parent/child separation)
- Wizard completes successfully

---

### F-11 — Register — register/school page (school enrollment, no token)

**Scenario:** `/register/school` page loads without a token.

**Preconditions:** None
**DB:** BOTH
**Locales:** `he`

**Steps:**
1. Navigate to `/register/school`

**Expected results:**
- `PlayingSchoolEnrollmentWizard` renders with empty token
- Wizard shows loading → error state (invalid token)
- No 500 error or blank page
- Error card displayed: `t('wizard.loadProfileError')`

---

### F-12 — Register — RegistrationSessionGuard behaviour

**Scenario:** Verify the session guard (storageKey) prevents duplicate registrations from the same browser session.

**Preconditions:** Complete a registration (store session key), then attempt another
**DB:** MEMORY
**Locales:** `en`

**Note:** Read `src/components/registration/session-guard.tsx` to confirm exact guard behaviour before implementing this test.

**Expected results (assumed):**
- If session key already present: guard shows "already registered" state or redirects
- If not present: wizard renders normally

---

## G. Playing School Enrollment Wizard

### G-01 — Playing School wizard loads with valid token

**Scenario:** `/register?token=valid-token` renders the playing school wizard with school info.

**Preconditions:**
- `resolvePlayingSchoolToken` Server Action returns a valid `SchoolInfo` fixture for `token=test-school-token`
**Stub:** Mock `resolvePlayingSchoolToken` to return fixture:
```json
{
  "id": "ps-school-001",
  "name": "Yad Eliyahu Elementary",
  "conservatorium": "cons-15",
  "symbol": "123456",
  "city": "הוד השרון",
  "instrument": "חליל",
  "grades": "1-6",
  "gradeOptions": ["1", "2", "3", "4", "5", "6"],
  "lessonDay": "MON",
  "basePrice": 2400,
  "monthlyPrice": 200,
  "subsidies": { "municipal": 800, "ministry": 600 },
  "parentContribution": 1000
}
```
**DB:** MEMORY
**Locales:** `he`, `en`

**Steps:**
1. Navigate to `/register?token=test-school-token`
2. Observe loading spinner → school info card

**Expected results:**
- Loading spinner visible while `resolvePlayingSchoolToken` resolves
- Step 1 card shows school name, conservatorium, instrument, grades
- Price breakdown (base, municipal subsidy %, ministry subsidy %, parent contribution) displayed
- "Back to Playing School Finder" link visible
- 6-step indicator rendered

---

### G-02 — Playing School wizard: invalid token → error state

**Scenario:** Token resolves to error/null.

**Preconditions:** `resolvePlayingSchoolToken` throws for `token=invalid-token-xyz`
**DB:** MEMORY
**Locales:** `he`

**Steps:**
1. Navigate to `/register?token=invalid-token-xyz`
2. Wait for resolution

**Expected results:**
- Destructive toast: `t('wizard.invalidTokenTitle')` / `t('wizard.invalidTokenDesc')`
- Error card: `t('wizard.loadProfileError')`
- No crash / no blank page

---

### G-03 — Playing School wizard: Step 1 (Program Info) → advance

**Steps:**
1. Load wizard with valid token (G-01 preconditions)
2. Read program info
3. Click "Next"

**Expected results:**
- Advances to Step 2 (Student Details)
- Step indicator: Step 2 active, Step 1 green

---

### G-04 — Playing School wizard: Step 2 (Student Details) — validation

**Scenario:** Try to advance from student details with incomplete data.

**Steps:**
1. Reach Step 2
2. Leave student name blank
3. Click "Next"

**Expected results:**
- Cannot advance: `canContinueStudent` is false
- "Next" button disabled or error shown

**Valid data requirements:** `studentName ≥ 2 chars`, `studentGrade` selected, `studentDob` set.

---

### G-05 — Playing School wizard: Step 3 (Parent Details) — phone validation

**Scenario:** Invalid phone format.

**Steps:**
1. Fill Step 2 with valid student data
2. Reach Step 3
3. Fill phone: `abc` (not matching `PHONE_REGEX`)
4. Click "Next"

**Expected results:**
- `canContinueParent` is false; Next blocked
- Phone validation message shown

---

### G-06 — Playing School wizard: Step 3 — email validation

**Steps:**
1. Fill phone with valid format, fill email: `not-an-email`
2. Click "Next"

**Expected results:**
- `canContinueParent` false (invalid email); Next blocked

---

### G-07 — Playing School wizard: Step 4 (Consent)

**Scenario:** Consent checkbox must be checked to advance.

**Steps:**
1. Reach Step 4
2. Do not check consent checkbox
3. Click "Next"

**Expected results:**
- Next blocked until consent is checked

---

### G-08 — Playing School wizard: Step 5 (Contract) — signature required

**Scenario:** Contract step requires signature before advancing.

**Steps:**
1. Reach Step 5
2. Do not sign (leave signature canvas blank)
3. Click "Next"

**Expected results:**
- `contractSigned` is false; Next blocked (`if (step === 5 && !contractSigned) return;`)
- Signature capture component visible

**Steps (happy path):**
4. Draw signature on canvas
5. Click "Next"

**Expected results:**
- `contractSigned` set to true
- Advances to Step 6

---

### G-09 — Playing School wizard: Step 6 (Payment) — payment method selection

**Scenario:** All configured payment methods displayed; user selects one.

**Preconditions:** `NEXT_PUBLIC_PAYMENT_METHODS` env var unset (all 6 methods shown)
**DB:** MEMORY
**Locales:** `he`

**Steps:**
1. Reach Step 6
2. Observe payment options: SCHOOL_FEES, CARDCOM, PELECARD, HYP, TRANZILA, STRIPE
3. Select CARDCOM
4. Click "Submit"

**Expected results:**
- All 6 payment method cards visible
- CARDCOM selected
- On submit: `createPlayingSchoolEnrollment` called with `paymentMethod: 'CARDCOM'`
- If result contains `redirectUrl`: `window.location.href` set to redirect URL (payment gateway)

---

### G-10 — Playing School wizard: submit — SCHOOL_FEES path (no redirect)

**Steps:**
1. Select `SCHOOL_FEES`
2. Submit

**Expected results:**
- No redirect to payment gateway
- `submitted` state set to true
- Success card visible: `t('wizard.success')` with parent email and phone
- Pickup note and full details shown

---

### G-11 — Playing School wizard: submit — server action failure

**Stubs:** `createPlayingSchoolEnrollment` throws

**Expected results:**
- Destructive toast: `t('wizard.submissionErrorTitle')` / `t('wizard.submissionErrorDesc')`
- `isSubmitting` cleared, wizard stays on Step 6
- User can retry

---

### G-12 — Playing School wizard: NEXT_PUBLIC_PAYMENT_METHODS env filter

**Preconditions:** `NEXT_PUBLIC_PAYMENT_METHODS=CARDCOM,STRIPE`

**Expected results:**
- Only CARDCOM and STRIPE options rendered
- SCHOOL_FEES, PELECARD, HYP, TRANZILA hidden

---

### G-13 — Playing School wizard: RTL layout (Hebrew/Arabic)

**Locales:** `he`, `ar`

**Steps:**
1. Navigate to `/register?token=valid-token` in Hebrew
2. Check chevron icons on Next/Prev buttons
3. Check `dir="rtl"` on outer container

**Expected results:**
- `isRtl = true` for he/ar
- `NextIcon = ChevronLeft`, `PrevIcon = ChevronRight`
- `dir="rtl"` applied to wizard container
- Success card also has `dir="rtl"`

---

### G-14 — Playing School wizard: grade options from `gradeOptions` array vs range string

**Scenario:** `gradeOptions` array present → use array. Absent → split `grades` by `-`.

**Preconditions A:** `schoolInfo.gradeOptions = ["א", "ב", "ג"]`
**Preconditions B:** `schoolInfo.grades = "1-6"`, no `gradeOptions`

**Expected results A:** Dropdown shows "א", "ב", "ג"
**Expected results B:** Dropdown shows "1", "6" (split by `-`)

---

### G-15 — Playing School: `/register/school` page vs `/register?token=` page

**Scenario:** Both pages render `PlayingSchoolEnrollmentWizard`. Verify they behave identically with the same token.

**Steps:**
1. Navigate to `/register/school?token=test-school-token`
2. Navigate to `/register?token=test-school-token`

**Expected results:**
- Both render the same wizard content
- Note: `/register/school` uses `useSearchParams()` (client component); `/register` uses server-side `params` (async component)

---

## H. Accept Invite Page

### H-01 — Accept invite page renders with token

**Scenario:** Coordinator invitation link loads correctly.

**Personas:** New coordinator user
**Preconditions:** Valid invite token in URL
**DB:** BOTH
**Locales:** ALL-LOCALES

**Steps:**
1. Navigate to `/accept-invite/invite-token-abc-123`
2. Observe page

**Expected results:**
- Indigo gradient card renders
- Title: `t('CoordinatorInvite.title')`
- Subtitle includes the token: `t('CoordinatorInvite.subtitle', { token: 'invite-token-abc-123' })`
- 4 capability list items shown
- "Accept Invitation" button active

---

### H-02 — Accept invite: click accept button

**Steps:**
1. Navigate to `/accept-invite/any-token`
2. Click "Accept Invitation"

**Expected results:**
- Button shows loading state (`isAccepting = true`)
- After ~1.5 seconds: toast `t('CoordinatorInvite.welcomeTitle')` / `t('CoordinatorInvite.welcomeDesc')`
- Redirect to `/dashboard`

**Note:** Current implementation uses a simulated `setTimeout` — real token validation logic not yet implemented. Document as stub/placeholder and flag for implementation.

---

### H-03 — Accept invite: invalid/expired token (future feature)

**Scenario (future):** When real invite validation is implemented, an expired or used token should show an error state.

**Expected results (future):**
- Error message: "This invitation has expired or has already been used"
- Option to request a new invite
- No redirect to dashboard

**PM action item:** Backend invite validation is not yet implemented (current code only simulates). Add to backlog.

---

## I. Security Tests

### I-01 — CSRF: Login API only accepts POST

**Steps:**
1. GET `/api/auth/login`
2. PUT `/api/auth/login`

**Expected results:**
- Both return 405 Method Not Allowed

---

### I-02 — CSRF: Logout API only accepts POST

**Steps:**
1. GET `/api/auth/logout`

**Expected results:**
- 405 Method Not Allowed

---

### I-03 — Session fixation: session cookie changes after login

**Scenario:** After login, the `__session` cookie value should be a freshly issued token, not the same as any pre-existing one.

**Steps:**
1. Set a fake `__session` cookie
2. Log in successfully
3. Inspect new `__session` cookie value

**Expected results:**
- Cookie value is a new token (different from the pre-set value)
- Old cookie value is cleared

---

### I-04 — Role escalation: non-admin cannot access admin routes

**Scenario:** A student user attempts to access `/dashboard/admin/*`.

**Preconditions:** Student session active
**DB:** BOTH

**Steps:**
1. Log in as student
2. Navigate to `/dashboard/admin/users`

**Expected results:**
- Forbidden / redirect to `/dashboard` or 403 page
- No admin data visible

---

### I-05 — Tenant isolation: conservatorium_admin cannot see other tenants' data

**Scenario:** A conservatorium admin for cons-15 attempts to access data belonging to cons-66.

**Preconditions:** cons_admin user with `conservatoriumId: cons-15`
**DB:** BOTH

**Steps:**
1. Log in as conservatorium_admin for cons-15
2. Attempt Server Action that requires `conservatoriumIdMustMatch: cons-66`

**Expected results:**
- Server Action throws `TENANT_MISMATCH`
- Client receives error: "You do not have access to this conservatorium."

---

### I-06 — Unapproved user: Server Actions throw ACCOUNT_NOT_APPROVED

**Scenario:** An unapproved user somehow bypasses the proxy redirect and calls a Server Action.

**Preconditions:** Inject headers with `approved: false`

**Steps:**
1. Call a `withAuth()`-wrapped Server Action with `x-user-approved: false` header

**Expected results:**
- `requireRole` throws `ACCOUNT_NOT_APPROVED`
- Client receives: "Your account has not been approved yet."

---

### I-07 — XSS: Registration form inputs are sanitised

**Scenario:** Submit `<script>alert(1)</script>` as a name field in the enrollment wizard.

**Steps:**
1. In Step 2 of the enrollment wizard, fill parent name with `<script>alert(1)</script>`
2. Advance through wizard, reach summary step

**Expected results:**
- Input is escaped in all display contexts
- No alert fires
- No raw HTML rendered in the summary card

---

### I-08 — Open redirect via callbackUrl (login form)

**Scenario:** Verify the login form's `callbackUrl` cannot be used for open redirect.

**Steps:**
1. Navigate to `/en/login?callbackUrl=https://evil.com`
2. Log in successfully

**Expected results:**
- After login, redirect goes to `/dashboard` (default safe fallback)
- NOT to `https://evil.com`

**Note:** The current implementation uses `callbackUrl` directly: `router.push(callbackUrl as any)`. The proxy sanitises the redirect URL in cookie-based auth, but the client-side mock path does not sanitise. Flag as a security gap if `callbackUrl` is accepted as-is from query params without validation.

---

## J. i18n & Translation Completeness

### J-01 — Auth translation keys present in all locales

**Scenario:** Verify all `Auth.*` namespace keys used in `login-form.tsx` are present in all 4 locale files.

**Locales:** ALL-LOCALES
**Keys to verify:**
- `Auth.cardTitle`, `Auth.cardDescription`
- `Auth.emailPasswordTab`, `Auth.magicLinkTab`
- `Auth.emailLabel`, `Auth.passwordLabel`, `Auth.emailPlaceholder`
- `Auth.forgotPassword`, `Auth.loginButton`, `Auth.loggingIn`
- `Auth.sendMagicLink`, `Auth.sending`
- `Auth.orContinueWith`, `Auth.noAccount`, `Auth.registerHere`
- `Auth.demoModeNotice`
- `Auth.enterEmailFirst`, `Auth.passwordResetSent`, `Auth.passwordResetSentDesc`
- `Auth.accountExistsTitle`, `Auth.accountExistsDesc`
- `Auth.oauthErrorTitle`, `Auth.oauthErrorDesc`
- `Auth.toasts.*` (missingEmail, missingPassword, loginFailed, loginFailedDesc, pendingAccount, loginSuccess, magicLinkSent, etc.)
- `Dashboard.PendingApproval.*` (title, description, steps.*, support, backToSite, logout)
- `CoordinatorInvite.*` (title, subtitle, cardTitle, cardDesc, capabilitiesTitle, cap1–4, processing, acceptBtn, welcomeTitle, welcomeDesc, questions)

**Expected results:**
- No missing keys (no raw key strings rendered in UI)
- RTL locales (he, ar) render text correctly aligned

---

### J-02 — PlayingSchool translation namespace completeness

**Keys to verify (PlayingSchool.wizard.*):**
- `step1`–`step6`, `loadingSchoolInfo`, `loadProfileError`, `invalidTokenTitle`, `invalidTokenDesc`
- `programInfo`, `programInfoDesc`, `school`, `instrument`, `grades`, `city`
- `payViaSchool`, `payViaCardcom`, `payViaPelecard`, `payViaHyp`, `payViaTranzila`, `payViaStripe` (+ `Desc` variants)
- `success`, `successDesc`, `pickupNote`, `pickupNoteFull`
- `submissionErrorTitle`, `submissionErrorDesc`, `backToFinder`, `title`

---

## K. Accessibility

### K-01 — Login page: keyboard navigation

**Steps:**
1. Navigate to `/en/login`
2. Use Tab to navigate through: email → password → "Forgot password" → "Login" button → tabs → Google → Microsoft → "Register here"
3. Submit form via Enter key

**Expected results:**
- All interactive elements reachable via Tab in logical order
- Visible focus ring on each element
- Form submits on Enter when focused on Login button
- Tab indicators accessible (ARIA role `tab`, `tabpanel`)

---

### K-02 — Login page: screen reader labels

**Expected results:**
- Email input has `for="email"` label
- Password input has `for="password"` label
- Tab triggers have accessible names
- OAuth buttons labelled "Google" / "Microsoft"

---

### K-03 — Pending approval page: accessibility

**Expected results:**
- `<h1>` with `t('title')` present
- Icon has `aria-hidden` or accessible label
- Buttons have accessible text
- Responsive at 320px mobile width

---

### K-04 — Registration wizard: step indicator accessible

**Steps:**
1. Load enrollment wizard

**Expected results:**
- Each step circle has `aria-label` set to the step name
- Active step indicated visually and via aria-current (if implemented)

---

## L. Mobile & Responsive

### L-01 — Login page: mobile viewport (375px)

**Steps:**
1. Set viewport to 375×812
2. Navigate to `/login`

**Expected results:**
- Card fits within viewport, no horizontal scroll
- Buttons full-width
- OAuth buttons grid (2 cols) renders correctly

---

### L-02 — Registration wizard: mobile viewport

**Steps:**
1. Set viewport to 375×812
2. Navigate through wizard Steps 1–3

**Expected results:**
- Step indicator wraps on small screens
- Form fields readable and tappable
- "Next" / "Back" buttons accessible without scrolling

---

### L-03 — Playing School wizard: mobile RTL (Hebrew, 375px)

**Expected results:**
- Step indicator and all content is RTL
- Next/Prev chevrons correctly oriented
- No clipped content

---

## M. Error & Edge Cases

### M-01 — Login with network failure (auth provider unavailable)

**Scenario:** `createSessionAction` fails due to network error.

**Stubs:** Mock `createSessionAction` to throw network error

**Expected results:**
- Destructive toast with generic error
- Button re-enabled, user can retry

---

### M-02 — Login — auth/too-many-requests Firebase code

**Scenario:** Firebase returns `auth/too-many-requests`.

**Stubs:** Mock provider to throw `{ code: 'auth/too-many-requests' }`

**Expected results:**
- Destructive toast: "Too many attempts. Please try again later."
- Note: this is a hardcoded English string — flag as i18n gap

---

### M-03 — Concurrent tab sessions

**Scenario:** User opens two browser tabs, logs out in one.

**Steps:**
1. Log in on Tab A
2. Open Tab B (same origin)
3. Log out on Tab A
4. Perform action on Tab B

**Expected results:**
- Tab B's next Server Action fails authentication (session revoked)
- Tab B shows error or redirects to login on next navigation
- No silent data access after logout

---

### M-04 — Playing School wizard: page reload mid-wizard (no draft persistence)

**Scenario:** User is on Step 3 of playing school wizard and refreshes.

**Steps:**
1. Navigate to Step 3 of playing school wizard
2. Reload the page

**Expected results:**
- Wizard resets to Step 1 (no draft persistence for playing school wizard — unlike enrollment wizard)
- School info is re-fetched from the token

---

### M-05 — Register page with malformed searchParams

**Scenario:** Pass unusual query params to `/register`.

**Steps:**
1. Navigate to `/register?token=&teacher=&conservatorium=`

**Expected results:**
- Empty token → falls through to standard enrollment wizard (not playing school)
- Empty teacher/conservatorium → no pre-selection, but wizard still renders

---

## N. Cross-Backend Matrix

The following scenarios must pass on BOTH backends before launch clearance:

| Scenario | MEMORY | POSTGRES |
|---|---|---|
| A-02 Email/password happy path | ✓ | ✓ |
| A-03 User not found | ✓ | ✓ |
| A-04 Pending user | ✓ | ✓ |
| B-01 Logout | ✓ | ✓ |
| C-01 Unauthenticated redirect | ✓ | ✓ |
| C-04 Unapproved redirect | ✓ | ✓ |
| F-06 Full enrollment happy path | ✓ | ✓ |
| G-10 Playing school SCHOOL_FEES submit | ✓ | ✓ |

---

## O. Known Gaps & PM Action Items

| # | Gap | Severity | Recommended Action |
|---|---|---|---|
| O-01 | Invite acceptance (`accept-invite`) only simulates with `setTimeout` — no real token validation | HIGH | Implement real invite validation before launch |
| O-02 | `callbackUrl` on client-side mock login path not sanitised for open redirect | HIGH | Validate `callbackUrl` is a relative path on the client |
| O-03 | `auth/too-many-requests` error message is hardcoded English string, not i18n key | MEDIUM | Extract to translation namespace |
| O-04 | Login page does NOT redirect already-authenticated users | LOW | Decide PM policy: redirect or show login? |
| O-05 | Magic link functionality is a stub (fires toast only, no actual email sent) | HIGH | Integrate email provider or disable tab in production |
| O-06 | Forgot password is a stub (toast only, no actual Firebase password reset called) | HIGH | Wire to `sendPasswordResetEmail` before launch |
| O-07 | `RegistrationSessionGuard` behaviour unverified — need to read component to confirm guard logic | MEDIUM | Read and test `src/components/registration/session-guard.tsx` |
| O-08 | Playing school wizard has no draft persistence on reload (by design?) | LOW | Confirm with PM: is losing wizard state on refresh acceptable? |
| O-09 | `accept-invite` page uses `<a href="mailto:...">` (raw anchor) — should be audited for i18n support email address | LOW | Confirm support email and whether it should be translated |
| O-10 | `pending-approval` page contact details (`08-9467890`, `office@harmony.org.il`) are hardcoded | LOW | Move to config/CMS or per-conservatorium settings |
