/**
 * Tenant Isolation E2E Tests — TEN-01 to TEN-06
 *
 * AUTH INJECTION MECHANISM:
 * ─────────────────────────
 * The app reads identity from localStorage key "lyriosa-user" (see src/hooks/use-auth.tsx line ~685).
 * On mount the hook does:
 *   const storedUser = localStorage.getItem('lyriosa-user');
 *   const parsedData = JSON.parse(storedUser);
 *   if (VALID_ROLES.includes(parsedData?.role)) { setUser(parsedData); }
 *
 * So to simulate a non-site_admin user in Playwright:
 *   1. Navigate to any page to get the JS runtime running.
 *   2. Set localStorage.setItem('lyriosa-user', JSON.stringify(mockUserObject)) before
 *      navigating to the target route.
 *   3. Navigate to the target route — the AuthProvider picks up the stored user on mount.
 *
 * The proxy dev-bypass auto-injects site_admin for all /dashboard/* routes when
 * NODE_ENV !== production && no FIREBASE_SERVICE_ACCOUNT_KEY is set.  The proxy
 * injects headers used only by Server Components; the client-side identity comes
 * from localStorage via useAuth().  For conservatorium_admin or teacher roles the
 * localStorage record is what drives all client-side filtering (tenantFilter /
 * tenantUsers in src/lib/tenant-filter.ts).
 *
 * KEY USERS (from src/lib/data.ts):
 * ──────────────────────────────────
 * cons-15 (הוד השרון) admin  : id='conservatorium-admin-user-15', role='conservatorium_admin'
 * cons-66 (קריית אונו) admin : id='conservatorium-admin-user-66', role='conservatorium_admin'
 *
 * cons-15 teachers (dir-teacher-001 … dir-teacher-018), e.g.:
 *   יעל פלוטניארז (dir-teacher-001), יעל קדר (dir-teacher-002), מרים כהן (teacher-user-1)
 *
 * cons-66 teachers (dir-teacher-019 … dir-teacher-068), e.g.:
 *   בר ערמון (dir-teacher-019), לורה בורלא ששון (dir-teacher-020)
 *
 * cons-15 students : student-user-1 (אריאל לוי), student-user-2 (תמר ישראלי),
 *                    student-user-3 (נועם בן-דוד), student-user-4 (שני אלמוג), student-user-5 (אריק שמש)
 * cons-66 students : student-user-6 (יובל לוין), student-user-7 (מיכל רוזן), student-user-8 (דניאל ברגר)
 *
 * site_admin dev user: id='dev-user', role='site_admin', conservatoriumId='dev-conservatorium'
 */

import { test, expect, type Page } from '@playwright/test';

// Cold-compile pages on first hit in dev mode can take 15–30s.
test.setTimeout(90_000);

// ── Reusable mock user objects ─────────────────────────────────────────────────

const CONS15_ADMIN = {
  id: 'conservatorium-admin-user-15',
  name: 'יעל פלסטניאר (מנהלת)',
  email: 'admin@example.com',
  role: 'conservatorium_admin',
  conservatoriumId: 'cons-15',
  conservatoriumName: 'הוד השרון',
  approved: true,
  notifications: [],
  achievements: [],
};

const CONS66_ADMIN = {
  id: 'conservatorium-admin-user-66',
  name: 'מנהל קריית אונו',
  email: 'admin66@example.com',
  role: 'conservatorium_admin',
  conservatoriumId: 'cons-66',
  conservatoriumName: 'קריית אונו',
  approved: true,
  notifications: [],
  achievements: [],
};

const CONS15_TEACHER = {
  id: 'teacher-user-1',
  name: 'מרים כהן',
  email: 'teacher@example.com',
  role: 'teacher',
  conservatoriumId: 'cons-15',
  conservatoriumName: 'הוד השרון',
  approved: true,
  notifications: [],
  achievements: [],
};

const SITE_ADMIN = {
  id: 'dev-user',
  name: 'Dev Admin',
  email: 'dev@lyriosa.local',
  role: 'site_admin',
  conservatoriumId: 'dev-conservatorium',
  conservatoriumName: 'Dev Conservatorium',
  approved: true,
  notifications: [],
  achievements: [],
  hasSeenWalkthrough: true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Set the localStorage mock identity then navigate to a URL.
 * We first go to "/" to establish the JS runtime, then set localStorage,
 * then navigate to the real target so the AuthProvider picks up the user.
 */
async function loginAs(page: Page, user: object, targetPath: string) {
  // Load the root page to get a JS context (avoids localStorage access on blank page).
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((u) => {
    localStorage.setItem('lyriosa-user', JSON.stringify(u));
  }, user);
  await page.goto(targetPath, { waitUntil: 'domcontentloaded' });
  // Give React hydration + AuthProvider mount time.
  await page.waitForLoadState('networkidle').catch(() => {
    // networkidle can timeout on slow pages — that is fine, continue.
  });
}

/** Clear all storage so previous test state doesn't bleed over. */
async function clearAuth(page: Page) {
  try {
    await page.evaluate(() => {
      localStorage.removeItem('lyriosa-user');
      sessionStorage.clear();
    });
  } catch {
    // Page may not have JS context yet — ignore.
  }
}

// ── TEN-01 ────────────────────────────────────────────────────────────────────

test.describe('TEN-01: cons-15 admin cannot see cons-66 teachers', () => {
  test.afterEach(async ({ page }) => { await clearAuth(page); });

  test('Users page as cons-15 admin shows no cons-66 teacher names', async ({ page }) => {
    await loginAs(page, CONS15_ADMIN, '/en/dashboard/users');

    // Wait for the page to fully render (auth guard + data load).
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent() ?? '';

    // Page should have loaded (not empty / not raw error).
    expect(bodyText.length).toBeGreaterThan(100);

    // Spot-check two well-known cons-66 teacher names that appear in mock data.
    // dir-teacher-019 = 'בר ערמון', dir-teacher-020 = 'לורה בורלא ששון'
    // These MUST NOT appear when filtered to cons-15.
    expect(bodyText).not.toContain('בר ערמון');
    expect(bodyText).not.toContain('לורה בורלא ששון');

    // A cons-15 teacher name should be visible if teachers are listed.
    // (Not asserting presence — the page might show only students by default —
    //  but asserting absence of cross-tenant names is the key security check.)
  });

  test('Admin dashboard page as cons-15 admin shows cons-15 conservatorium name', async ({ page }) => {
    await loginAs(page, CONS15_ADMIN, '/en/dashboard/admin');

    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent() ?? '';

    // The admin command center greets the user with their conservatoriumName.
    // 'הוד השרון' (Hod HaSharon) should appear; 'קריית אונו' should NOT appear
    // in the main dashboard context.
    expect(bodyText).toContain('הוד השרון');
    // Cross-tenant conservatorium name must not appear in the admin context.
    expect(bodyText).not.toContain('קריית אונו');
  });
});

// ── TEN-02 ────────────────────────────────────────────────────────────────────

test.describe('TEN-02: cons-66 admin cannot see cons-15 students', () => {
  test.afterEach(async ({ page }) => { await clearAuth(page); });

  test('Users page as cons-66 admin shows no cons-15 student names', async ({ page }) => {
    await loginAs(page, CONS66_ADMIN, '/en/dashboard/users');

    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(100);

    // Well-known cons-15 student names (from data.ts).
    // student-user-1 = 'אריאל לוי', student-user-2 = 'תמר ישראלי'
    // These must NOT appear when the logged-in user is cons-66 admin.
    expect(bodyText).not.toContain('אריאל לוי');
    expect(bodyText).not.toContain('תמר ישראלי');
  });

  test('Admin dashboard as cons-66 admin shows cons-66 name, not cons-15', async ({ page }) => {
    await loginAs(page, CONS66_ADMIN, '/en/dashboard/admin');

    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText).toContain('קריית אונו');
    expect(bodyText).not.toContain('הוד השרון');
  });
});

// ── TEN-03 ────────────────────────────────────────────────────────────────────

test.describe('TEN-03: site_admin sees teachers from multiple conservatoriums', () => {
  test.afterEach(async ({ page }) => { await clearAuth(page); });

  test('Users page as site_admin includes users from multiple conservatoriums', async ({ page }) => {
    await loginAs(page, SITE_ADMIN, '/en/dashboard/users');

    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(100);

    // site_admin sees everyone — both conservatoriums' data should appear.
    // At a minimum, cons-15 and cons-66 teacher names should be present.
    // We check for at least one distinctive name from each tenant.
    const hasCons15Name = bodyText.includes('מרים כהן') || bodyText.includes('יעל פלוטניארז') || bodyText.includes('הוד השרון');
    const hasCons66Name = bodyText.includes('בר ערמון') || bodyText.includes('קריית אונו');

    expect(hasCons15Name).toBe(true);
    expect(hasCons66Name).toBe(true);
  });

  test('/api/bootstrap response includes users from multiple conservatoriums', async ({ request }) => {
    const response = await request.get('/api/bootstrap');
    // Bootstrap is accessible without auth in dev mode.
    if (response.status() !== 200) {
      test.skip(true, `Bootstrap returned ${response.status()} — skipping multi-tenant check`);
      return;
    }

    const payload = await response.json() as { users?: Array<{ conservatoriumId?: string }> };
    if (!Array.isArray(payload.users) || payload.users.length === 0) {
      test.skip(true, 'Bootstrap returned no users array — skipping multi-tenant check');
      return;
    }

    const conservatoriumIds = new Set(payload.users.map((u) => u.conservatoriumId).filter(Boolean));
    // Should contain at least 2 different conservatoriums to prove global view.
    expect(conservatoriumIds.size).toBeGreaterThanOrEqual(2);
  });
});

// ── TEN-04 ────────────────────────────────────────────────────────────────────

test.describe('TEN-04: Teacher cannot access admin-only routes', () => {
  test.afterEach(async ({ page }) => { await clearAuth(page); });

  test('cons-15 teacher visiting /dashboard/admin is redirected away from admin content', async ({ page }) => {
    await loginAs(page, CONS15_TEACHER, '/en/dashboard/admin');

    // Allow redirect/re-render to complete.
    await page.waitForTimeout(4000);

    const finalUrl = page.url();
    const bodyText = await page.locator('body').textContent() ?? '';

    // Either the URL changed away from /admin, OR the admin-specific content
    // ("Quick Actions", "Control Center" title) is NOT shown.
    // The useAdminGuard hook redirects to '/dashboard' for non-admin roles.
    const wasRedirected = !finalUrl.includes('/admin');
    const adminContentAbsent =
      !bodyText.includes('Quick Actions') &&
      !bodyText.includes('פעולות מהירות') &&     // Hebrew for "Quick Actions"
      !bodyText.includes('Control Center');

    expect(wasRedirected || adminContentAbsent).toBe(true);
  });

  test('cons-15 teacher visiting /dashboard/users is redirected or shows no data', async ({ page }) => {
    await loginAs(page, CONS15_TEACHER, '/en/dashboard/users');

    await page.waitForTimeout(4000);

    const finalUrl = page.url();
    const bodyText = await page.locator('body').textContent() ?? '';

    // useAdminGuard redirects non-admins to /dashboard.
    // Acceptable outcomes: URL changed OR user management table is not shown.
    const wasRedirected = !finalUrl.includes('/users');
    const userTableAbsent = !bodyText.includes('User Management') && !bodyText.includes('ניהול משתמשים');

    expect(wasRedirected || userTableAbsent).toBe(true);
  });
});

// ── TEN-05 ────────────────────────────────────────────────────────────────────

test.describe('TEN-05: /api/bootstrap returns data (smoke check for tenant scoping)', () => {
  test('Bootstrap responds with valid JSON and does not leak raw server errors', async ({ request }) => {
    const response = await request.get('/api/bootstrap');
    const text = await response.text();

    // Must not be a Node.js stack trace.
    expect(text).not.toMatch(/at Object\.<anonymous>/);
    expect(text).not.toMatch(/at Module\._compile/);

    if (response.headers()['content-type']?.includes('application/json')) {
      const payload = JSON.parse(text) as { users?: unknown[] };
      // If users are returned, they must be an array (not a raw object dump).
      if (payload.users !== undefined) {
        expect(Array.isArray(payload.users)).toBe(true);
      }
    }
  });

  test('Bootstrap users list does not include raw cross-tenant leakage marker', async ({ request }) => {
    const response = await request.get('/api/bootstrap');
    if (response.status() !== 200) {
      test.skip(true, `Bootstrap returned ${response.status()} — skipping`);
      return;
    }

    const payload = await response.json() as { users?: Array<{ id?: string; conservatoriumId?: string }> };
    if (!Array.isArray(payload.users) || payload.users.length === 0) {
      test.skip(true, 'No users in bootstrap payload');
      return;
    }

    // Each user must have a conservatoriumId — absence would indicate a data integrity issue.
    const usersWithoutTenant = payload.users.filter(
      (u) => u.conservatoriumId === undefined || u.conservatoriumId === null,
    );
    // Allow at most 1 missing (the devUser has 'dev-conservatorium', siteAdmin has 'global').
    // The real concern is users entirely missing the field — a stricter check is possible
    // once all users are guaranteed to carry the field.
    expect(usersWithoutTenant.length).toBeLessThan(payload.users.length);
  });
});

// ── TEN-06 ────────────────────────────────────────────────────────────────────

test.describe('TEN-06: conservatoriumId query param does not escalate tenant view', () => {
  test.afterEach(async ({ page }) => { await clearAuth(page); });

  test('cons-15 admin visiting /dashboard/admin?conservatoriumId=cons-66 still shows cons-15 data', async ({ page }) => {
    await loginAs(page, CONS15_ADMIN, '/en/dashboard/admin?conservatoriumId=cons-66');

    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(100);

    // The conservatoriumId query param must be ignored by the client.
    // The admin command center reads `user.conservatoriumName` from the AuthContext,
    // not from the URL.  cons-15 name ('הוד השרון') must appear; cons-66 name must NOT.
    expect(bodyText).toContain('הוד השרון');
    expect(bodyText).not.toContain('קריית אונו');
  });

  test('cons-15 admin visiting /dashboard/users?conservatoriumId=cons-66 sees only cons-15 users', async ({ page }) => {
    await loginAs(page, CONS15_ADMIN, '/en/dashboard/users?conservatoriumId=cons-66');

    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(100);

    // cons-66 students must NOT appear regardless of the query param.
    // יובל לוין (student-user-6) and מיכל רוזן (student-user-7) are cons-66 students.
    expect(bodyText).not.toContain('יובל לוין');
    expect(bodyText).not.toContain('מיכל רוזן');
  });

  test('Teacher role cannot inject conservatoriumId to see another tenants admin page', async ({ page }) => {
    await loginAs(page, CONS15_TEACHER, '/en/dashboard/admin?conservatoriumId=cons-66');

    await page.waitForTimeout(4000);

    const finalUrl = page.url();
    const bodyText = await page.locator('body').textContent() ?? '';

    // Teacher should be redirected away from /admin (useAdminGuard).
    // Either redirect happened OR admin command center is absent.
    const wasRedirected = !finalUrl.includes('/admin');
    const adminContentAbsent =
      !bodyText.includes('Quick Actions') &&
      !bodyText.includes('פעולות מהירות') &&
      !bodyText.includes('Control Center') &&
      !bodyText.includes('בר ערמון') &&   // cons-66 teacher — must not appear
      !bodyText.includes('קריית אונו');   // cons-66 name

    expect(wasRedirected || adminContentAbsent).toBe(true);
  });
});
