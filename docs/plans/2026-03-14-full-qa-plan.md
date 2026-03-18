# Lyriosa — Full QA Plan

> **Date:** 2026-03-14
> **For Claude:** Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Achieve comprehensive test coverage for the entire Lyriosa application — unit tests (Vitest), integration tests (Vitest), and end-to-end tests (Playwright). Fill every gap in the current suite, add missing interaction tests, and establish a CI-ready QA gate.

---

## Current State Audit

### Unit Tests (Vitest) — 28 files
| File | Covers |
|---|---|
| `tests/lib/auth-utils.test.ts` | verifyAuth, requireRole, withAuth |
| `tests/auth/provider.test.ts` | Auth provider factory |
| `tests/auth/extract-claims.test.ts` | extractClaimsFromCookie (both providers) |
| `tests/lib/instrument-matching.test.ts` | Instrument matching algorithm |
| `tests/lib/room-allocation.test.ts` | Room allocation logic |
| `tests/lib/utils.test.ts` | General utilities |
| `tests/lib/vat.test.ts` | VAT calculations |
| `tests/lib/playing-school-utils.test.ts` | Playing school helpers |
| `tests/lib/db/memory-adapter.test.ts` | In-memory DB adapter |
| `tests/lib/db/firebase-adapter.test.ts` | Firebase DB adapter |
| `tests/lib/validation/booking.test.ts` | Booking validation schemas |
| `tests/lib/validation/forms.test.ts` | Form validation schemas |
| `tests/lib/validation/practice-log.test.ts` | Practice log validation |
| `tests/lib/validation/user-schema.test.ts` | User schema validation |
| `tests/lib/utils/get-date-locale.test.ts` | Date locale helper |
| `tests/lib/utils/translation-hash.test.ts` | Translation hash util |
| `tests/lib/utils/conservatorium-slug.test.ts` | Slug generation |
| `tests/lib/utils/localized-content.test.ts` | Localized content helpers |
| `tests/hooks/use-toast.test.ts` | Toast hook |
| `tests/i18n-landing-keys.test.ts` | Landing page i18n keys |
| `tests/i18n-locale-integrity.test.ts` | Locale file structure |
| `tests/i18n-completeness.test.ts` | Translation completeness |
| `tests/consent.test.ts` | Consent logic |
| `tests/teacher-import.test.ts` | Teacher import pipeline |
| `tests/vat.test.ts` | VAT (duplicate — consolidate) |
| `tests/actions/cancellation-enforcement.test.ts` | Cancellation 14-day cooling-off |
| `tests/actions/rental-otp.test.ts` | Rental OTP flow |
| `tests/actions/teacher-rating.test.ts` | Teacher rating actions |
| `tests/notifications/payment-notifications.test.ts` | Payment notification logic |

### E2E Tests (Playwright) — 22 files
| File | Type | Covers |
|---|---|---|
| `e2e/smoke.spec.ts` | Smoke | 52 dashboard + 6 public + 10 conservatorium routes |
| `e2e/landing.spec.ts` | Page | Landing page sections |
| `e2e/public-pages.spec.ts` | Page | Public pages render |
| `e2e/register.spec.ts` | Flow | Registration start |
| `e2e/playing-school.spec.ts` | Flow | Playing school enrollment |
| `e2e/dashboard.spec.ts` | Page | Dashboard general |
| `e2e/api.spec.ts` | API | API routes |
| `e2e/debug-page.spec.ts` | Page | Debug page |
| `e2e/available-now-to-book.spec.ts` | Flow | Available-now → booking |
| `e2e/personas/student.spec.ts` | Persona | Student pages load |
| `e2e/personas/teacher.spec.ts` | Persona | Teacher pages load |
| `e2e/personas/parent.spec.ts` | Persona | Parent pages load |
| `e2e/personas/admin.spec.ts` | Persona | Admin pages load |
| `e2e/personas/ministry.spec.ts` | Persona | Ministry pages load |
| `e2e/flows/booking-flow.spec.ts` | Flow | Booking wizard tabs |
| `e2e/flows/upgrade-package.spec.ts` | Flow | Package upgrade |
| `e2e/flows/admin-approve-flow.spec.ts` | Flow | Admin approval |
| `e2e/flows/teacher-makeup.spec.ts` | Flow | Teacher makeup lessons |
| `e2e/flows/consent-banner.spec.ts` | Flow | Cookie consent banner |
| `e2e/flows/dsar.spec.ts` | Flow | DSAR (data export/delete) |
| `e2e/flows/registration-full.spec.ts` | Flow | Full 9-step registration |
| `e2e/full-audit/screenshot-all-screens.spec.ts` | Visual | Screenshot every screen |

### Coverage Gaps Identified

**Unit tests missing for:**
1. Server Actions (`src/app/actions/`) — only 3 of ~12 action files tested
2. Data layer (`src/lib/data.ts`) — 500KB of seed/mock data logic, zero tests
3. Auth provider implementations (server methods like `verifySessionCookie`, `createSessionCookie`)
4. Proxy logic (`src/proxy.ts`) — zero unit tests
5. i18n request loader (`src/i18n/request.ts`) — zero tests
6. Type guards and utility types
7. Billing actions (`src/app/actions/billing.ts`)
8. Storage actions (`src/app/actions/storage.ts`)
9. Translate actions (`src/app/actions/translate.ts`)

**E2E interaction tests missing for:**
1. Login form — submit, error states, OAuth buttons
2. Sidebar navigation — expand/collapse, active state
3. Settings pages — form submission, save confirmation
4. Student repertoire — view, filter
5. Ministry repertoire — CRUD operations
6. Teacher availability — set/edit slots
7. Admin user management — approve, change role
8. Billing page — package selection, payment display
9. Playing school admin — enrollment management
10. Forms builder — create/edit forms
11. Events — create, edit, delete
12. Messages — send, read, mark read
13. Notifications — read, dismiss
14. i18n switching — locale selector, RTL/LTR toggle
15. Mobile viewport — responsive layout
16. Accessibility — keyboard navigation, screen reader

---

## Task 1: Consolidate duplicate VAT tests

**Files:**
- Delete: `tests/vat.test.ts` (duplicate)
- Keep: `tests/lib/vat.test.ts` (canonical location)

**Step 1:** Compare both files — merge any unique test cases from the root-level file into `tests/lib/vat.test.ts`.

**Step 2:** Delete `tests/vat.test.ts`.

**Step 3:** Run `npx vitest run tests/lib/vat.test.ts` — all pass.

**Step 4:** Commit:
```bash
git add -A tests/vat.test.ts tests/lib/vat.test.ts
git commit -m "test: consolidate duplicate VAT tests into tests/lib/vat.test.ts"
```

---

## Task 2: Unit tests for Server Actions — auth actions

**Files:**
- Create: `tests/actions/auth-actions.test.ts`

Test the pure logic extracted from `src/app/actions/auth.ts`:
- `createSessionAction(token)` — calls provider, sets cookie
- `logoutAction()` — revokes sessions, clears cookies
- Session cookie name constant

**Approach:** Mock `getServerAuthProvider()` and `cookies()` from `next/headers`. Test that the action calls the right provider methods with the right arguments.

```typescript
// tests/actions/auth-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  })),
}));

// Mock the provider
vi.mock('@/lib/auth/provider', () => ({
  getServerAuthProvider: vi.fn(),
}));

describe('auth actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createSessionAction calls provider.createSessionCookie and sets cookie', async () => {
    const mockProvider = {
      createSessionCookie: vi.fn().mockResolvedValue('session-cookie-value'),
    };
    const { getServerAuthProvider } = await import('@/lib/auth/provider');
    (getServerAuthProvider as any).mockResolvedValue(mockProvider);

    // Import and call the action (extract the pure function, not the 'use server' export)
    // Note: if the file has 'use server', extract logic to a testable helper
    expect(mockProvider.createSessionCookie).toBeDefined();
  });
});
```

**Step 1:** Read `src/app/actions/auth.ts` to identify all exported functions.

**Step 2:** Write tests covering:
- Happy path: valid token → session cookie created
- Error path: invalid token → appropriate error
- Logout: revokes sessions + clears cookies

**Step 3:** Run tests, fix any issues.

**Step 4:** Commit:
```bash
git add tests/actions/auth-actions.test.ts
git commit -m "test: add unit tests for auth server actions"
```

---

## Task 3: Unit tests for billing actions

**Files:**
- Create: `tests/actions/billing-actions.test.ts`

**What to test:**
- `cancelPackageAction()` — 14-day cooling-off enforcement
- Package creation / update logic
- VAT calculation integration
- Error handling for missing/expired packages

**Step 1:** Read `src/app/actions/billing.ts`.

**Step 2:** Extract testable pure functions. Mock `verifyAuth()` and DB calls.

**Step 3:** Write tests:
```typescript
describe('cancelPackageAction', () => {
  it('allows cancellation within 14-day cooling-off period');
  it('rejects cancellation after cooling-off period');
  it('requires authenticated user');
  it('rejects cancellation for non-owner');
});
```

**Step 4:** Run + commit:
```bash
git add tests/actions/billing-actions.test.ts
git commit -m "test: add billing actions unit tests (cancellation, packages)"
```

---

## Task 4: Unit tests for consent actions

**Files:**
- Modify: `tests/consent.test.ts` OR create `tests/actions/consent-actions.test.ts`

**What to test:**
- `saveConsentRecord()` — stores consent with timestamp
- Consent types: cookies, marketing, video_recording, minor_data
- Parental consent for minors
- Withdraw consent flow

**Step 1:** Read `src/app/actions/consent.ts`.

**Step 2:** Write tests for each consent operation.

**Step 3:** Run + commit:
```bash
git add tests/actions/consent-actions.test.ts
git commit -m "test: add consent actions unit tests"
```

---

## Task 5: Unit tests for translate actions

**Files:**
- Create: `tests/actions/translate-actions.test.ts`

**What to test:**
- `translateCompositionData()` — input/output shape
- Batch translation logic
- Locale handling (he/en/ar/ru)
- Error/fallback when translation API fails

**Step 1:** Read `src/app/actions/translate.ts`.

**Step 2:** Mock Gemini API calls. Test the transformation logic.

**Step 3:** Run + commit:
```bash
git add tests/actions/translate-actions.test.ts
git commit -m "test: add translate actions unit tests"
```

---

## Task 6: Unit tests for storage actions

**Files:**
- Create: `tests/actions/storage-actions.test.ts`

**What to test:**
- `verifyParentChildLink()` — both Firebase and Supabase paths
- Signed URL generation — valid path → URL, missing file → error
- Auth guard: unauthenticated user → rejected

**Step 1:** Read `src/app/actions/storage.ts`.

**Step 2:** Mock DB calls and storage backends.

**Step 3:** Run + commit:
```bash
git add tests/actions/storage-actions.test.ts
git commit -m "test: add storage actions unit tests"
```

---

## Task 7: Unit tests for proxy.ts edge logic

**Files:**
- Create: `tests/proxy.test.ts`

**What to test:**
- API routes (`/api/*`) pass through without auth
- Dashboard routes get auth headers injected
- Dev bypass activates when no credentials set
- `extractClaimsFromCookie` called for authenticated requests
- Locale detection (he default, en/ar/ru prefixed)
- Invalid cookie → redirect to login

**Approach:** Cannot import the proxy function directly (it uses Next.js runtime). Extract the routing logic into a pure function and test that.

**Step 1:** Read `src/proxy.ts`, identify testable logic.

**Step 2:** Extract `shouldBypassAuth(pathname)`, `isApiRoute(pathname)`, `isDashboardRoute(pathname)` as pure helpers if not already extracted.

**Step 3:** Test the helpers:
```typescript
describe('proxy routing helpers', () => {
  it('isApiRoute returns true for /api/bootstrap');
  it('isApiRoute returns false for /dashboard');
  it('isDashboardRoute returns true for /dashboard/schedule');
  it('shouldBypassAuth returns true in dev mode without credentials');
});
```

**Step 4:** Run + commit:
```bash
git add tests/proxy.test.ts src/proxy.ts
git commit -m "test: add proxy routing logic unit tests"
```

---

## Task 8: Unit tests for i18n request loader

**Files:**
- Create: `tests/i18n/request.test.ts`

**What to test:**
- `deepMerge(fallback, messages)` — merges correctly, doesn't overwrite existing keys
- Locale file loading — each locale loads all namespace files
- Missing key fallback — falls back to `he` (default locale)
- Invalid locale → defaults to `he`

**Step 1:** Read `src/i18n/request.ts`.

**Step 2:** Test the deepMerge logic and locale resolution.

**Step 3:** Run + commit:
```bash
git add tests/i18n/request.test.ts
git commit -m "test: add i18n request loader unit tests"
```

---

## Task 9: Unit tests for data.ts seed builders

**Files:**
- Create: `tests/lib/data-seed.test.ts`

**What to test:**
- `buildDefaultMemorySeed()` — returns complete seed with all entity types
- `localizeSeedTitle()` — returns consistent title across locales
- Conservatorium count matches expected (85)
- Teacher count matches expected (484 directory + mock teachers)
- Student/parent/lesson seed data is structurally valid
- `devUser` is present in mock users

**Step 1:** Import and call the seed builders directly.

**Step 2:** Validate shapes against `types.ts` types.

**Step 3:** Run + commit:
```bash
git add tests/lib/data-seed.test.ts
git commit -m "test: add data.ts seed builder unit tests"
```

---

## Task 10: E2E — Login form interaction tests

**Files:**
- Create: `e2e/flows/login.spec.ts`

**Tests:**
```typescript
test.describe('Login Flow', () => {
  test('login page renders with email and password fields');
  test('empty form shows validation errors on submit');
  test('invalid email format shows error');
  test('back-to-home link navigates to /');
  test('Google OAuth button is visible');
  test('Microsoft OAuth button is visible');
  test('login form is keyboard accessible (tab order)');
  test('RTL layout renders correctly for Hebrew locale', async ({ page }) => {
    await page.goto('/he/login');
    // Check dir="rtl" or text-start classes
  });
});
```

**Step 1:** Write the test file.

**Step 2:** Run: `npx playwright test e2e/flows/login.spec.ts`

**Step 3:** Commit:
```bash
git add e2e/flows/login.spec.ts
git commit -m "test(e2e): add login form interaction tests"
```

---

## Task 11: E2E — Sidebar navigation tests

**Files:**
- Create: `e2e/flows/sidebar-navigation.spec.ts`

**Tests:**
```typescript
test.describe('Sidebar Navigation', () => {
  test('sidebar is visible on dashboard');
  test('clicking nav item navigates to correct page');
  test('active nav item is highlighted');
  test('sidebar sections expand/collapse');
  test('sidebar shows correct items for student role context');
  test('sidebar shows correct items for teacher role context');
  test('sidebar shows correct items for admin role context');
  test('sidebar shows correct items for ministry role context');
  test('mobile: sidebar is hidden by default');
  test('mobile: hamburger menu toggles sidebar');
});
```

**Step 1:** Write tests using dev bypass (site_admin sees all nav items).

**Step 2:** Run + commit:
```bash
git add e2e/flows/sidebar-navigation.spec.ts
git commit -m "test(e2e): add sidebar navigation interaction tests"
```

---

## Task 12: E2E — Settings pages form tests

**Files:**
- Create: `e2e/flows/settings.spec.ts`

**Tests:**
```typescript
test.describe('Settings Pages', () => {
  test('main settings page loads with DSAR section');
  test('conservatorium settings loads');
  test('packages settings loads with package list');
  test('calendar settings loads');
  test('notifications settings loads with toggle switches');
  test('instruments settings loads');
  test('cancellation settings loads');
  test('pricing settings loads');
  test('conservatorium profile settings loads');
  test('DSAR export button is clickable');
  test('DSAR delete request button shows confirmation');
});
```

**Step 1:** Write tests.

**Step 2:** Run + commit:
```bash
git add e2e/flows/settings.spec.ts
git commit -m "test(e2e): add settings pages form interaction tests"
```

---

## Task 13: E2E — Ministry repertoire CRUD tests

**Files:**
- Create: `e2e/flows/ministry-repertoire.spec.ts`

**Tests:**
```typescript
test.describe('Ministry Repertoire Management', () => {
  test('repertoire page loads with composition list');
  test('search filters compositions');
  test('pagination works (next/prev page)');
  test('add composition dialog opens');
  test('add composition with title and composer');
  test('edit composition dialog opens with pre-filled data');
  test('delete composition shows confirmation dialog');
  test('approved toggle changes composition status');
});
```

**Step 1:** Write tests — use `/dashboard/ministry/repertoire`.

**Step 2:** Run + commit:
```bash
git add e2e/flows/ministry-repertoire.spec.ts
git commit -m "test(e2e): add ministry repertoire CRUD interaction tests"
```

---

## Task 14: E2E — Student repertoire view tests

**Files:**
- Create: `e2e/flows/student-repertoire.spec.ts`

**Tests:**
```typescript
test.describe('Student Repertoire', () => {
  test('repertoire page loads');
  test('compositions are displayed with titles');
  test('sheet music viewer opens on click');
  test('locale-aware titles are shown (Hebrew default)');
});
```

**Step 1:** Write tests — use `/dashboard/student/repertoire`.

**Step 2:** Run + commit:
```bash
git add e2e/flows/student-repertoire.spec.ts
git commit -m "test(e2e): add student repertoire view tests"
```

---

## Task 15: E2E — Teacher availability tests

**Files:**
- Create: `e2e/flows/teacher-availability.spec.ts`

**Tests:**
```typescript
test.describe('Teacher Availability', () => {
  test('availability page loads');
  test('weekly schedule grid is visible');
  test('time slots are displayed');
  test('clicking a slot toggles availability');
});
```

**Step 1:** Write tests — use `/dashboard/teacher/availability`.

**Step 2:** Run + commit:
```bash
git add e2e/flows/teacher-availability.spec.ts
git commit -m "test(e2e): add teacher availability interaction tests"
```

---

## Task 16: E2E — Admin user management tests

**Files:**
- Create: `e2e/flows/admin-users.spec.ts`

**Tests:**
```typescript
test.describe('Admin User Management', () => {
  test('users page loads with user table');
  test('search filters users');
  test('user row shows name, email, role, status');
  test('approve button is visible for pending users');
  test('role dropdown changes user role');
});
```

**Step 1:** Write tests — use `/dashboard/users`.

**Step 2:** Run + commit:
```bash
git add e2e/flows/admin-users.spec.ts
git commit -m "test(e2e): add admin user management interaction tests"
```

---

## Task 17: E2E — i18n locale switching tests

**Files:**
- Create: `e2e/flows/i18n-locale.spec.ts`

**Tests:**
```typescript
test.describe('i18n Locale Switching', () => {
  test('default locale (he) has RTL layout', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
  });

  test('English locale has LTR layout', async ({ page }) => {
    await page.goto('/en');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'ltr');
  });

  test('Arabic locale has RTL layout', async ({ page }) => {
    await page.goto('/ar');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
  });

  test('Russian locale has LTR layout', async ({ page }) => {
    await page.goto('/ru');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'ltr');
  });

  test('landing page renders in all 4 locales without errors', async ({ page }) => {
    for (const locale of ['', '/en', '/ar', '/ru']) {
      await page.goto(locale || '/');
      await page.waitForLoadState('domcontentloaded');
      await expect(page).not.toHaveTitle(/error/i);
      const body = await page.locator('body').textContent();
      expect(body!.length).toBeGreaterThan(100);
    }
  });

  test('dashboard renders in English locale', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });
});
```

**Step 1:** Write tests.

**Step 2:** Run + commit:
```bash
git add e2e/flows/i18n-locale.spec.ts
git commit -m "test(e2e): add i18n locale switching and RTL/LTR tests"
```

---

## Task 18: E2E — Mobile responsive viewport tests

**Files:**
- Create: `e2e/flows/mobile-responsive.spec.ts`

**Tests:** Run a subset of critical pages at mobile viewport (375x667 iPhone SE).

```typescript
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 667 } });

test.describe('Mobile Responsive', () => {
  test('landing page renders on mobile');
  test('login page renders on mobile');
  test('dashboard loads on mobile');
  test('sidebar is collapsed on mobile');
  test('registration page is usable on mobile');
  test('booking wizard works on mobile viewport');
});
```

**Step 1:** Write tests.

**Step 2:** Run + commit:
```bash
git add e2e/flows/mobile-responsive.spec.ts
git commit -m "test(e2e): add mobile responsive viewport tests"
```

---

## Task 19: E2E — Accessibility keyboard navigation tests

**Files:**
- Create: `e2e/flows/accessibility.spec.ts`

**Tests:**
```typescript
test.describe('Accessibility', () => {
  test('landing page has skip-to-content link');
  test('all sections have aria-labelledby');
  test('login form is navigable by Tab key');
  test('dashboard sidebar is navigable by keyboard');
  test('modal dialogs trap focus');
  test('buttons have accessible names');
  test('images have alt text');
});
```

**Step 1:** Write tests.

**Step 2:** Run + commit:
```bash
git add e2e/flows/accessibility.spec.ts
git commit -m "test(e2e): add accessibility keyboard navigation tests"
```

---

## Task 20: E2E — API route tests

**Files:**
- Modify: `e2e/api.spec.ts` (extend existing)

**Add tests for:**
```typescript
test.describe('API Routes', () => {
  test('GET /api/bootstrap returns JSON with seed data');
  test('POST /api/auth/login with invalid token returns 401');
  test('POST /api/auth/logout clears session cookie');
  test('GET /api/auth/callback without code redirects to login');
  test('GET /api/ps/qr returns QR code data');
});
```

**Step 1:** Read existing `e2e/api.spec.ts` to avoid duplication.

**Step 2:** Add missing API tests.

**Step 3:** Run + commit:
```bash
git add e2e/api.spec.ts
git commit -m "test(e2e): extend API route tests with auth and bootstrap coverage"
```

---

## Task 21: E2E — Events page CRUD tests

**Files:**
- Create: `e2e/flows/events.spec.ts`

**Tests:**
```typescript
test.describe('Events Management', () => {
  test('events list page loads');
  test('create new event page loads');
  test('event detail page loads for existing event');
  test('edit event page loads');
});
```

**Step 1:** Write tests using `/dashboard/events`, `/dashboard/events/new`.

**Step 2:** Run + commit:
```bash
git add e2e/flows/events.spec.ts
git commit -m "test(e2e): add events page CRUD tests"
```

---

## Task 22: E2E — Messages and notifications tests

**Files:**
- Create: `e2e/flows/messages-notifications.spec.ts`

**Tests:**
```typescript
test.describe('Messages', () => {
  test('messages page loads');
  test('message list renders');
});

test.describe('Notifications', () => {
  test('notifications page loads');
  test('notification list renders');
});
```

**Step 1:** Write tests.

**Step 2:** Run + commit:
```bash
git add e2e/flows/messages-notifications.spec.ts
git commit -m "test(e2e): add messages and notifications page tests"
```

---

## Task 23: Extend smoke test with missing dashboard routes

**Files:**
- Modify: `e2e/smoke.spec.ts`

**Add missing routes to `DASHBOARD_ROUTES`:**
```typescript
// Currently missing from smoke:
'/dashboard/settings/pricing',
'/dashboard/settings/conservatorium/profile',
'/dashboard/settings/notifications',
'/dashboard/settings/calendar',
'/dashboard/settings/cancellation',
'/dashboard/ministry/repertoire',
'/dashboard/admin/notifications',
'/dashboard/admin/notifications/log',
'/dashboard/admin/ministry',
'/dashboard/admin/playing-school/billing',
'/dashboard/admin/playing-school/distribute',
'/dashboard/school',
```

**Also add missing public routes:**
```typescript
'/register',
'/register/school',
'/available-now',
'/playing-school',
'/musicians',
'/open-day',
'/help',
'/donate',
'/try',
'/apply/matchmaker',
'/apply-for-aid',
```

**Step 1:** Read current `e2e/smoke.spec.ts`.

**Step 2:** Add all missing routes to both arrays.

**Step 3:** Run: `npx playwright test e2e/smoke.spec.ts`

**Step 4:** Fix any routes that fail (404, redirect loops, etc.).

**Step 5:** Commit:
```bash
git add e2e/smoke.spec.ts
git commit -m "test(e2e): extend smoke test to cover all 90+ routes"
```

---

## Task 24: Add Playwright project for mobile viewport

**Files:**
- Modify: `playwright.config.ts`

**Add a mobile project:**
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'mobile', use: { ...devices['iPhone 13'] } },
],
```

This lets us run `npx playwright test --project=mobile` to test responsive layouts.

**Step 1:** Edit `playwright.config.ts`.

**Step 2:** Run smoke tests on mobile: `npx playwright test e2e/smoke.spec.ts --project=mobile`

**Step 3:** Commit:
```bash
git add playwright.config.ts
git commit -m "test: add mobile viewport project to Playwright config"
```

---

## Task 25: CI QA gate script

**Files:**
- Create: `scripts/qa-gate.sh`

**Script:**
```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== QA Gate ==="

echo "[1/4] TypeScript compile check..."
npx tsc --noEmit

echo "[2/4] Vitest unit tests..."
npx vitest run --reporter=verbose

echo "[3/4] Playwright smoke tests..."
npx playwright test --grep @smoke --reporter=dot

echo "[4/4] Playwright full suite..."
npx playwright test --reporter=dot

echo "=== QA Gate PASSED ==="
```

**Step 1:** Create the script.

**Step 2:** Make executable: `chmod +x scripts/qa-gate.sh`

**Step 3:** Add npm script to `package.json`:
```json
"scripts": {
  "qa": "bash scripts/qa-gate.sh"
}
```

**Step 4:** Commit:
```bash
git add scripts/qa-gate.sh package.json
git commit -m "ci: add QA gate script (tsc + vitest + playwright smoke + full)"
```

---

## Task 26: Final validation — run entire QA suite

**Step 1:** TypeScript compile:
```bash
npx tsc --noEmit
```
Expected: 0 errors.

**Step 2:** Vitest full suite:
```bash
npx vitest run --reporter=verbose
```
Expected: All tests pass (existing + new from Tasks 2–9).

**Step 3:** Playwright smoke:
```bash
npx playwright test --grep @smoke --reporter=verbose
```
Expected: All ~90+ smoke tests pass.

**Step 4:** Playwright full suite:
```bash
npx playwright test --reporter=verbose
```
Expected: All tests pass (existing + new from Tasks 10–23).

**Step 5:** Fix any failures found during the run.

**Step 6:** Final commit:
```bash
git add -A
git commit -m "test: full QA suite green — all unit + e2e tests passing"
```

---

## Summary

| Category | Before | After |
|---|---|---|
| Unit test files (Vitest) | 28 | ~37 |
| E2E test files (Playwright) | 22 | ~35 |
| Smoke routes covered | 68 | ~90+ |
| Server Action coverage | 3/12 files | 8/12 files |
| Flow interaction tests | 8 | ~20 |
| Mobile viewport tests | 0 | 6+ |
| Accessibility tests | 0 | 7+ |
| i18n locale tests | 3 (key checks) | 3 + 6 e2e |
| CI QA gate script | none | `npm run qa` |

**Execution order:** Tasks 1–9 (unit tests) can run in parallel. Tasks 10–23 (e2e) can run in parallel. Task 24 (config) before Task 18 (mobile tests). Task 25 (CI script) after everything else. Task 26 is final validation.
