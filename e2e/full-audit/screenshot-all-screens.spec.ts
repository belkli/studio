/**
 * Full Visual Audit — Screenshot Every Screen
 *
 * Traverses every route in the Harmonia application, interacts with all major
 * tabs and expandable sections, and captures full-page screenshots.
 *
 * Prerequisites:
 *   - Dev server running on port 9002  (`npm run dev`)
 *   - No FIREBASE_SERVICE_ACCOUNT_KEY set  (enables dev-bypass auth)
 *   - Output dir: docs/screenshots/full-audit/
 *
 * Run:
 *   npx playwright test e2e/full-audit/screenshot-all-screens.spec.ts --project=chromium
 */

import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import { test, expect, type Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OUT_DIR = path.join(process.cwd(), 'docs', 'screenshots', 'full-audit');

/** Absolute path for a named screenshot inside OUT_DIR. */
function shot(name: string) {
  return path.join(OUT_DIR, name.endsWith('.png') ? name : `${name}.png`);
}

/**
 * Inject the dev-bypass admin user into localStorage before navigating,
 * so the client-side useAuth hook picks up the user immediately.
 * This simulates what would happen if someone had logged in as site_admin.
 */
/**
 * Navigate to a URL and wait for the page to fully stabilise before screenshot.
 * Strategy:
 *  1. goto with domcontentloaded
 *  2. Wait for /api/bootstrap to complete (data loaded from server)
 *  3. Poll for skeleton loaders to disappear (dynamic imports + data render)
 *  4. Extra 500ms settle
 */
async function navAndShot(
  page: Page,
  url: string,
  filename: string,
) {
  // Inner helper: navigate once and wait for content
  async function loadOnce() {
    // Listen for bootstrap API response before navigating
    const bootstrapDone = page.waitForResponse(
      resp => resp.url().includes('/api/bootstrap') && resp.status() === 200,
      { timeout: 15_000 },
    ).catch(() => null);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });

    // Wait for bootstrap data to arrive (usually 1-3s; cap at 6s)
    await Promise.race([bootstrapDone, page.waitForTimeout(6_000)]);

    // Wait for skeleton loaders to disappear — poll with retries
    for (let i = 0; i < 25; i++) {
      await page.waitForTimeout(300);
      // Also kill any driver.js walkthrough overlay that fires after bootstrap
      await page.evaluate(() => {
        document.querySelectorAll('.driver-overlay, .driver-popover, [class*="driver-"]').forEach(el => el.remove());
      }).catch(() => {});
      const loadingCount = await page.evaluate(
        () => document.querySelectorAll('.animate-pulse, .animate-spin').length
      ).catch(() => 0);
      if (loadingCount === 0) break;
    }

    // After skeleton gone, also wait for meaningful content (catches pages that return null while loading)
    // and wait for Turbopack compilation overlay to clear
    await page.waitForFunction(
      () => {
        // Turbopack "Compiling..." indicator must be gone
        const compiling = Array.from(document.querySelectorAll('*')).some(
          el => el.textContent?.trim() === 'Compiling ...' && (el as HTMLElement).offsetParent !== null
        );
        if (compiling) return false;
        // "Rendering..." indicator must also be gone
        const rendering = Array.from(document.querySelectorAll('*')).some(
          el => el.textContent?.trim()?.startsWith('Rendering') && (el as HTMLElement).offsetParent !== null
        );
        if (rendering) return false;
        return (document.body?.innerText?.length ?? 0) > 100;
      },
      { timeout: 15_000 },
    ).catch(() => {});
  }

  // First attempt
  await loadOnce();

  // Check if page is still blank (sidebar-only) or 404 — if so, retry once
  const contentLength = await page.evaluate(() => {
    // Detect Next.js 404
    const is404 = document.title?.includes('404') || document.body?.innerText?.includes('This page could not be found');
    if (is404) return 0;
    // Exclude sidebar text from count
    const sidebar = document.querySelector('aside, [data-sidebar]');
    const sidebarText = (sidebar as HTMLElement | null)?.innerText ?? '';
    const bodyText = document.body?.innerText ?? '';
    return bodyText.length - sidebarText.length;
  }).catch(() => 0);

  if (contentLength < 150) {
    // Page is essentially blank (only sidebar rendered) — wait and retry navigation
    await page.waitForTimeout(2000);
    await loadOnce();
  }

  // Final settle for CSS transitions (sidebar margin animation = 200ms) + lazy images
  await page.waitForTimeout(1500);

  await page.screenshot({ path: shot(filename), fullPage: true });
}

/**
 * Click a tab trigger identified by its visible text (or partial text), wait
 * briefly for panel to render, then screenshot.
 */
async function clickTabAndShot(
  page: Page,
  tabText: string | RegExp,
  filename: string,
) {
  // Dismiss any driver.js tutorial overlay that might intercept clicks
  await page.evaluate(() => {
    document.querySelectorAll('.driver-overlay, .driver-popover, [class*="driver-"]').forEach(el => el.remove());
  }).catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});

  const trigger = page
    .locator('[role="tab"]')
    .filter({ hasText: tabText })
    .first();

  const count = await trigger.count();
  if (count === 0) {
    console.warn(`[full-audit] Tab not found: ${tabText}. Skipping.`);
    return;
  }

  // Use dispatchEvent to bypass overlay interception
  await trigger.dispatchEvent('click');
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot(filename), fullPage: true });
}

// ─── Viewport presets ─────────────────────────────────────────────────────────

const DESKTOP = { width: 1280, height: 800 };
const MOBILE  = { width: 390,  height: 844 };

// ─── Known mock IDs (from src/lib/data.ts) ────────────────────────────────────
const MOCK_STUDENT_ID = 'student-user-1';
const MOCK_FORM_ID    = 'form-101';

// ─── Mock login helper ────────────────────────────────────────────────────────

/**
 * Bootstrap user cache — fetched once from server and reused across tests.
 * This avoids the Playwright page.goto('/he/') round-trip in devLogin.
 */
let _bootstrapUsers: Array<Record<string, unknown>> | null = null;

async function fetchBootstrapUsers(): Promise<Array<Record<string, unknown>>> {
  if (_bootstrapUsers) return _bootstrapUsers;
  return new Promise((resolve) => {
    http.get('http://localhost:9002/api/bootstrap', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const payload = JSON.parse(data);
          _bootstrapUsers = payload?.users ?? [];
        } catch {
          _bootstrapUsers = [];
        }
        resolve(_bootstrapUsers!);
      });
    }).on('error', () => {
      _bootstrapUsers = [];
      resolve(_bootstrapUsers);
    });
  });
}

/**
 * Inject a persona user into localStorage BEFORE the page loads using addInitScript.
 * This is 100% reliable: addInitScript runs before any page JavaScript, so useAuth
 * reads the correct user from localStorage on its very first render.
 *
 * After calling devLogin(page, email), simply call navAndShot(page, url, name) —
 * the user will already be in localStorage when the page mounts.
 */
async function devLogin(page: Page, email: string) {
  const users = await fetchBootstrapUsers();
  const found = users.find(
    (u) => typeof u.email === 'string' && u.email.toLowerCase() === email.toLowerCase()
  );

  if (!found) {
    console.warn(`[devLogin] User not found in bootstrap for email: ${email}`);
    return;
  }

  const userJson = JSON.stringify({ ...found, hasSeenWalkthrough: true });
  const userId = String(found.id ?? 'unknown');

  // addInitScript ensures localStorage is set before any React code runs on the NEXT page load.
  // It persists for all subsequent navigations until page is closed.
  await page.addInitScript(
    ({ key, value, walkthroughKey }: { key: string; value: string; walkthroughKey: string }) => {
      try {
        localStorage.setItem(key, value);
        localStorage.setItem(walkthroughKey, 'true');
        localStorage.setItem('harmonia-walkthrough-seen', 'true');
      } catch { /* storage may be unavailable before full page init; safe to ignore */ }
    },
    { key: 'harmonia-user', value: userJson, walkthroughKey: `walkthrough-seen-${userId}` }
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

test.beforeAll(() => {
  // Ensure output directory exists (user deletes contents manually before each run)
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

/**
 * Before each test:
 * 1. Use addInitScript to inject the dev-bypass admin user into localStorage
 *    BEFORE any page JS runs. This ensures useAuth() resolves immediately.
 * 2. Mark walkthrough as seen so the tutorial overlay doesn't block screenshots.
 *
 * Note: tests that call devLogin(page, email) will override this with a persona user.
 * addInitScript calls stack — the last one wins for that key (last write wins in localStorage).
 */
test.beforeEach(async ({ page }) => {
  const devUser = JSON.stringify({
    id: 'dev-user',
    name: 'Dev Admin',
    email: 'dev@harmonia.local',
    role: 'site_admin',
    conservatoriumId: 'dev-conservatorium',
    conservatoriumName: 'Dev Conservatorium',
    avatarUrl: 'https://i.pravatar.cc/150?u=dev',
    idNumber: '000000000',
    phone: '000-0000000',
    approved: true,
    notifications: [],
    achievements: [],
    hasSeenWalkthrough: true,
    createdAt: '2024-03-03T12:00:00.000Z',
  });

  // Force Hebrew locale cookie at the context level (persists for all navigations)
  await page.context().addCookies([
    { name: 'NEXT_LOCALE', value: 'he', domain: 'localhost', path: '/' },
    { name: 'harmonia-user', value: '1', domain: 'localhost', path: '/' },
  ]);

  await page.addInitScript(({ userJson }: { userJson: string }) => {
    try {
      localStorage.setItem('harmonia-user', userJson);
      localStorage.setItem('harmonia-walkthrough-seen', 'true');
      localStorage.setItem('walkthrough-seen-dev-user', 'true');
    } catch { /* ignore */ }
  }, { userJson: devUser });
});

// Global timeout for individual tests (nav + inject + skeleton wait)
test.setTimeout(90_000);

// ══════════════════════════════════════════════════════════════════════════════
// 1. PUBLIC PAGES
// ══════════════════════════════════════════════════════════════════════════════

test.describe('01 — Public Pages', () => {
  test('01-landing-he — Hebrew landing (RTL)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    // Navigate directly to /he/ to avoid redirect complications
    await page.goto('/he/', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Wait for network and content
    await Promise.race([
      page.waitForLoadState('networkidle'),
      page.waitForTimeout(5_000),
    ]);
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: shot('01-landing-he'), fullPage: true });

    // dir is set server-side on <html> — read it after the page is loaded
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir, 'RTL attribute missing on Hebrew landing').toBe('rtl');
  });

  test('02-landing-en — English landing (LTR)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/en/', '02-landing-en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('03-landing-ar — Arabic landing (RTL)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/ar/', '03-landing-ar');
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir, 'RTL attribute missing on Arabic landing').toBe('rtl');
  });

  test('04-landing-ru — Russian landing (LTR)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/ru/', '04-landing-ru');
  });

  test('05-landing-he-mobile — Hebrew landing at 390px', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await navAndShot(page, '/', '05-landing-he-mobile');
  });

  test('06-about-he — About / conservatoriums (Hebrew)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/about', '06-about-he');
    // Conservatoriums load async from bootstrap — wait for cards to appear
    // The about page renders Card elements with class "group overflow-hidden"
    await page.waitForFunction(
      () => {
        // Look for the count text "מציג X קונסרבטוריונים" which appears when data loads
        const countText = document.body?.innerText ?? '';
        if (countText.includes('קונסרבטוריונ') && !countText.includes('0 קונסרבטוריונ')) return true;
        // Also look for actual card buttons (about page renders button inside card)
        return document.querySelectorAll('button.w-full.text-start').length > 0;
      },
      { timeout: 12_000 },
    ).catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: shot('06-about-he'), fullPage: true });
  });

  test('07-about-en — About (English)', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(DESKTOP);
    // Extra long goto timeout — this route is slow to cold-compile
    const bootstrapDone = page.waitForResponse(
      resp => resp.url().includes('/api/bootstrap') && resp.status() === 200,
      { timeout: 20_000 },
    ).catch(() => null);
    await page.goto('/en/about', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await Promise.race([bootstrapDone, page.waitForTimeout(10_000)]);
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForFunction(
      () => {
        const countText = document.body?.innerText ?? '';
        if (countText.includes('conservatori') && !countText.includes('0 conservatori')) return true;
        return document.querySelectorAll('button.w-full.text-start').length > 0;
      },
      { timeout: 20_000 },
    ).catch(() => {});
    await page.evaluate(() => {
      document.querySelectorAll('.driver-overlay, .driver-popover, [class*="driver-"]').forEach(el => el.remove());
    }).catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: shot('07-about-en'), fullPage: true });
  });

  test('08-available-now — Available slots marketplace', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/available-now', '08-available-now');
  });

  test('09-apply-for-aid — Financial aid application', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/apply-for-aid', '09-apply-for-aid');
  });

  test('10-login — Login page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/login', '10-login');
  });

  test('11-apply-matchmaker — AI matchmaker (public)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/apply/matchmaker', '11-apply-matchmaker');
  });

  test('12-contact — Contact page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/contact', '12-contact');
  });

  test('13-privacy — Privacy policy', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/privacy', '13-privacy');
  });

  test('14-accessibility — Accessibility statement', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/accessibility', '14-accessibility');
  });

  test('15-musicians — Musicians-for-hire directory', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/musicians', '15-musicians');
  });

  test('16-open-day — Open day landing', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/open-day', '16-open-day');
  });

  test('17-donate — Donation landing page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/donate', '17-donate');
  });

  test('18-playing-school — Playing school public page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/playing-school', '18-playing-school');
  });

  test('19-register — Registration page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/register', '19-register');
  });

  test('20-try — Trial booking widget', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/try', '20-try');
  });

  test('21-help — Help page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/help', '21-help');
  });

  test('22-about-alumni — Public alumni page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/about/alumni', '22-about-alumni');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. DASHBOARD — MAIN & OVERVIEW (dev-bypass site_admin)
// ══════════════════════════════════════════════════════════════════════════════

test.describe('02 — Dashboard Root & Overview', () => {
  test('30-dashboard-root — /dashboard redirect target', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard', '30-dashboard-root');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. SCHEDULE
// ══════════════════════════════════════════════════════════════════════════════

test.describe('03 — Schedule', () => {
  test('31-schedule — Schedule calendar (desktop)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/schedule', '31-schedule');
    await expect(page).not.toHaveURL(/login/);
  });

  test('32-schedule-mobile — Schedule calendar (390px)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await navAndShot(page, '/dashboard/schedule', '32-schedule-mobile');
  });

  test('33-book-lesson-step1 — Book lesson wizard — step 1', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/schedule/book', '33-book-lesson-step1');
    // Extra wait for the dynamically imported BookLessonWizard to render
    await page.waitForFunction(
      () => {
        // Wizard renders tabs with role="tablist" when loaded
        if (document.querySelector('[role="tablist"]')) return true;
        // Or a form element
        if (document.querySelector('select, [role="combobox"]')) return true;
        return false;
      },
      { timeout: 10_000 }
    ).catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: shot('33-book-lesson-step1'), fullPage: true });
    await expect(page).not.toHaveURL(/login/);
  });

  test('34-book-lesson-deals — Book lesson wizard — Deals tab', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/dashboard/schedule/book', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await Promise.race([page.waitForLoadState('networkidle'), page.waitForTimeout(5_000)]);
    await page.waitForSelector('[role="tablist"]', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(500);
    // Click the "deals" tab
    await clickTabAndShot(page, /deal|מבצע|акции|عرض/i, '34-book-lesson-deals');
  });

  test('35-book-lesson-step3 — Book lesson wizard — step 3 tab', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/dashboard/schedule/book', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await Promise.race([page.waitForLoadState('networkidle'), page.waitForTimeout(5_000)]);
    await page.waitForSelector('[role="tablist"]', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(400);
    const step3Tab = page.locator('[role="tab"]').nth(2);
    if (await step3Tab.count()) {
      await step3Tab.click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: shot('35-book-lesson-step3'), fullPage: true });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. COMMUNICATIONS
// ══════════════════════════════════════════════════════════════════════════════

test.describe('04 — Communications', () => {
  test('40-messages — Messaging interface', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/messages', '40-messages');
    await expect(page).not.toHaveURL(/login/);
  });

  test('41-notifications — Notifications feed', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/notifications', '41-notifications');
    await expect(page).not.toHaveURL(/login/);
  });

  test('42-announcements — Announcements page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/announcements', '42-announcements');
    await expect(page).not.toHaveURL(/login/);
  });

  test('43-whats-new — What\'s new feed', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/whats-new', '43-whats-new');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. BILLING
// ══════════════════════════════════════════════════════════════════════════════

test.describe('05 — Billing', () => {
  test('50-billing-admin — Admin financial dashboard (desktop)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/billing', '50-billing-admin');
    await expect(page).not.toHaveURL(/login/);
  });

  test('51-billing-mobile — Admin financial dashboard (390px)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await navAndShot(page, '/dashboard/billing', '51-billing-mobile');
  });

  test('52-parent-billing — Parent billing panel', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    // Must be logged in as parent to see billing panel
    await devLogin(page, 'parent@example.com');
    await navAndShot(page, '/dashboard/parent/billing', '52-parent-billing');
    await expect(page).not.toHaveURL(/login/);
  });

  test('53-parent-billing-mobile — Parent billing (390px)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await devLogin(page, 'parent@example.com');
    await navAndShot(page, '/dashboard/parent/billing', '53-parent-billing-mobile');
  });

  test('54-parent-settings — Parent settings', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'parent@example.com');
    await navAndShot(page, '/dashboard/parent/settings', '54-parent-settings');
    await expect(page).not.toHaveURL(/login/);
  });

  test('55-apply-for-aid-dashboard — Dashboard financial aid form', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/apply-for-aid', '55-apply-for-aid-dashboard');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. TEACHER PORTAL
// ══════════════════════════════════════════════════════════════════════════════

test.describe('06 — Teacher Portal', () => {
  test('60-teacher-dashboard — Teacher home dashboard', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'teacher@example.com');
    await navAndShot(page, '/dashboard/teacher', '60-teacher-dashboard');
    await expect(page).not.toHaveURL(/login/);
  });

  test('61-teacher-student-profile — Student profile via teacher view', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'teacher@example.com');
    await navAndShot(
      page,
      `/dashboard/teacher/student/${MOCK_STUDENT_ID}`,
      '61-teacher-student-profile',
    );
    await expect(page).not.toHaveURL(/login/);
  });

  test('62-teacher-profile — Teacher profile settings', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'teacher@example.com');
    await navAndShot(page, '/dashboard/teacher/profile', '62-teacher-profile');
    await expect(page).not.toHaveURL(/login/);
  });

  test('63-teacher-performance-profile — Performance profile editor', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'teacher@example.com');
    await navAndShot(page, '/dashboard/teacher/performance-profile', '63-teacher-performance-profile');
    await expect(page).not.toHaveURL(/login/);
  });

  test('64-teacher-availability — Availability grid', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'teacher@example.com');
    await navAndShot(page, '/dashboard/teacher/availability', '64-teacher-availability');
    await expect(page).not.toHaveURL(/login/);
  });

  test('65-teacher-payroll — Teacher payroll view', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'teacher@example.com');
    await navAndShot(page, '/dashboard/teacher/payroll', '65-teacher-payroll');
    await expect(page).not.toHaveURL(/login/);
  });

  test('66-teacher-reports — Teacher reports dashboard', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'teacher@example.com');
    await navAndShot(page, '/dashboard/teacher/reports', '66-teacher-reports');
    await expect(page).not.toHaveURL(/login/);
  });

  test('67-teacher-exams — Teacher exam tracker', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'teacher@example.com');
    await navAndShot(page, '/dashboard/teacher/exams', '67-teacher-exams');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. STUDENT PORTAL
// ══════════════════════════════════════════════════════════════════════════════

test.describe('07 — Student Portal', () => {
  test('70-student-repertoire — Student repertoire page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/student/repertoire', '70-student-repertoire');
    await expect(page).not.toHaveURL(/login/);
  });

  test('71-student-profile — Student detail profile (parent view)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'parent@example.com');
    await navAndShot(page, `/dashboard/student/${MOCK_STUDENT_ID}`, '71-student-profile');
    await expect(page).not.toHaveURL(/login/);
  });

  test('72-practice-log — Practice log', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/practice', '72-practice-log');
    await expect(page).not.toHaveURL(/login/);
  });

  test('73-practice-upload — Practice upload', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/practice/upload', '73-practice-upload');
    await expect(page).not.toHaveURL(/login/);
  });

  test('74-practice-coach — AI practice coach', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/practice/coach', '74-practice-coach');
    await expect(page).not.toHaveURL(/login/);
  });

  test('75-progress — Progress tracking', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/progress', '75-progress');
    await expect(page).not.toHaveURL(/login/);
  });

  test('76-student-practice — Student practice sub-page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/student/practice', '76-student-practice');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. EVENTS
// ══════════════════════════════════════════════════════════════════════════════

test.describe('08 — Events', () => {
  test('80-events-list — Events calendar list', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/events', '80-events-list');
    await expect(page).not.toHaveURL(/login/);
  });

  test('81-events-new — New event form (empty)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/events/new', '81-events-new');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. LIBRARY & FORMS
// ══════════════════════════════════════════════════════════════════════════════

test.describe('09 — Library & Forms', () => {
  test('90-library — Sheet music library', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/library', '90-library');
    await expect(page).not.toHaveURL(/login/);
  });

  test('91-forms-list — Forms list', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/forms', '91-forms-list');
    await expect(page).not.toHaveURL(/login/);
  });

  test('92-form-detail — Form submission detail (form-101)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    // This page imports heavy PDF libs — give extra time for Turbopack compilation
    test.setTimeout(180_000);
    // Navigate directly, skipping the retry logic which can compound timeouts
    const bootstrapDone = page.waitForResponse(
      resp => resp.url().includes('/api/bootstrap') && resp.status() === 200,
      { timeout: 15_000 },
    ).catch(() => null);
    await page.goto(`/dashboard/forms/${MOCK_FORM_ID}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await Promise.race([bootstrapDone, page.waitForTimeout(8_000)]);
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        document.querySelectorAll('.driver-overlay, .driver-popover, [class*="driver-"]').forEach(el => el.remove());
      }).catch(() => {});
      const loadingCount = await page.evaluate(() => document.querySelectorAll('.animate-pulse, .animate-spin').length).catch(() => 0);
      if (loadingCount === 0) break;
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: shot('92-form-detail'), fullPage: true });
    await expect(page).not.toHaveURL(/login/);
  });

  test('93-form-new — New form page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/forms/new', '93-form-new');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. ALUMNI PORTAL — Deep tab coverage
// ══════════════════════════════════════════════════════════════════════════════

test.describe('10 — Alumni Portal', () => {
  async function gotoAlumni(page: Page) {
    // Use navAndShot helper which waits for bootstrap + skeleton removal
    await page.goto('/dashboard/alumni', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const bootstrapDone = page.waitForResponse(
      resp => resp.url().includes('/api/bootstrap') && resp.status() === 200,
      { timeout: 15_000 },
    ).catch(() => null);
    await Promise.race([bootstrapDone, page.waitForTimeout(8_000)]);
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(300);
      const pulseCount = await page.evaluate(() => document.querySelectorAll('.animate-pulse').length).catch(() => 0);
      if (pulseCount === 0) break;
    }
    await page.waitForSelector('[role="tablist"]', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(400);
  }

  test('100-alumni-directory-tab — Alumni directory tab (desktop)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await gotoAlumni(page);
    await expect(page).not.toHaveURL(/login/);
    await clickTabAndShot(page, /directory|ספריית בוגרים|каталог|دليل/i, '100-alumni-directory-tab');
  });

  test('101-alumni-profile-tab — Alumni profile tab', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await gotoAlumni(page);
    await clickTabAndShot(page, /הפרופיל שלי|My Profile|профиль|ملفي/i, '101-alumni-profile-tab');
  });

  test('102-alumni-masterclasses-tab — Alumni masterclasses tab', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await gotoAlumni(page);
    await clickTabAndShot(page, /מאסטרקלאסים|Masterclasses|мастер|ماستر/i, '102-alumni-masterclasses-tab');
  });

  test('103-alumni-review-tab — Alumni review / graduation tab', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await gotoAlumni(page);
    await clickTabAndShot(page, /סקירה|Review|рецен|مراجعة/i, '103-alumni-review-tab');
  });

  test('104-alumni-mobile — Alumni page at 390px (directory tab)', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await gotoAlumni(page);
    await page.screenshot({ path: shot('104-alumni-mobile'), fullPage: true });
  });

  test('105-alumni-profile-page — Alumni profile sub-page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/alumni/profile', '105-alumni-profile-page');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. MINISTRY
// ══════════════════════════════════════════════════════════════════════════════

test.describe('11 — Ministry', () => {
  test('110-ministry-inbox — Ministry inbox panel', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/ministry', '110-ministry-inbox');
    await expect(page).not.toHaveURL(/login/);
  });

  test('111-ministry-export — Ministry export page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/ministry-export', '111-ministry-export');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. MAKEUPS & RESCHEDULE
// ══════════════════════════════════════════════════════════════════════════════

test.describe('12 — Makeups & Reschedule', () => {
  test('120-makeups — Makeup lessons dashboard', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/makeups', '120-makeups');
    await expect(page).not.toHaveURL(/login/);
  });

  test('121-master-schedule — Master schedule calendar', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/master-schedule', '121-master-schedule');
    await expect(page).not.toHaveURL(/login/);
  });

  test('122-ai-reschedule — AI reschedule page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'student@example.com');
    await navAndShot(page, '/dashboard/ai-reschedule', '122-ai-reschedule');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. REPORTS — All four tabs
// ══════════════════════════════════════════════════════════════════════════════

test.describe('13 — Reports', () => {
  async function gotoReports(page: Page) {
    await navAndShot(page, '/dashboard/reports', '__reports-tmp');
    await page.waitForSelector('[role="tablist"]', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(300);
  }

  test('130-reports-financial-tab — Reports — Financial tab (default)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await gotoReports(page);
    await expect(page).not.toHaveURL(/login/);
    await page.screenshot({ path: shot('130-reports-financial-tab'), fullPage: true });
  });

  test('131-reports-operational-tab — Reports — Operational tab', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await gotoReports(page);
    await clickTabAndShot(page, /דוחות תפעוליים|operational|Operational/i, '131-reports-operational-tab');
  });

  test('132-reports-academic-tab — Reports — Academic tab', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await gotoReports(page);
    await clickTabAndShot(page, /דוחות אקדמיים|academic|Academic/i, '132-reports-academic-tab');
  });

  test('133-reports-teachers-tab — Reports — Teachers tab', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await gotoReports(page);
    await clickTabAndShot(page, /teacher|מורה|учит|معلم/i, '133-reports-teachers-tab');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. SETTINGS
// ══════════════════════════════════════════════════════════════════════════════

test.describe('14 — Settings', () => {
  test('140-settings — General settings page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/settings', '140-settings');
    await expect(page).not.toHaveURL(/login/);
  });

  test('141-settings-conservatorium — Conservatorium settings', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/settings/conservatorium', '141-settings-conservatorium');
    await expect(page).not.toHaveURL(/login/);
  });

  test('142-settings-conservatorium-profile — Conservatorium profile', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/settings/conservatorium/profile', '142-settings-conservatorium-profile');
    await expect(page).not.toHaveURL(/login/);
  });

  test('143-settings-instruments — Instruments settings', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    // Instruments settings requires conservatorium_admin role (not site_admin)
    await devLogin(page, 'admin@example.com');
    await navAndShot(page, '/dashboard/settings/instruments', '143-settings-instruments');
    await expect(page).not.toHaveURL(/login/);
  });

  test('144-settings-packages — Packages / lesson tiers', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/settings/packages', '144-settings-packages');
    await expect(page).not.toHaveURL(/login/);
  });

  test('145-settings-pricing — Pricing settings', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/settings/pricing', '145-settings-pricing');
    await expect(page).not.toHaveURL(/login/);
  });

  test('146-settings-calendar — Calendar / scheduling settings', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/settings/calendar', '146-settings-calendar');
    await expect(page).not.toHaveURL(/login/);
  });

  test('147-settings-cancellation — Cancellation policy', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/settings/cancellation', '147-settings-cancellation');
    await expect(page).not.toHaveURL(/login/);
  });

  test('148-settings-notifications — Notification preferences', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/settings/notifications', '148-settings-notifications');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. USER MANAGEMENT — Both tabs
// ══════════════════════════════════════════════════════════════════════════════

test.describe('15 — User Management', () => {
  async function gotoUsers(page: Page) {
    await page.goto('/dashboard/users', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await Promise.race([page.waitForLoadState('networkidle'), page.waitForTimeout(5_000)]);
    await page.waitForSelector('[role="tablist"]', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(400);
  }

  test('150-users-approved-tab — Users page — Approved tab (default)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await gotoUsers(page);
    await expect(page).not.toHaveURL(/login/);
    await page.screenshot({ path: shot('150-users-approved-tab'), fullPage: true });
  });

  test('151-users-pending-tab — Users page — Pending approval tab', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await gotoUsers(page);
    await clickTabAndShot(page, /pending|ממתין|ожид|معلق/i, '151-users-pending-tab');
  });

  test('152-approvals — Form approvals queue', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/approvals', '152-approvals');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. ADMIN COMMAND CENTER
// ══════════════════════════════════════════════════════════════════════════════

test.describe('16 — Admin Command Center', () => {
  test('160-admin-command-center — Admin home / command center', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin', '160-admin-command-center');
    await expect(page).not.toHaveURL(/login/);
  });

  test('161-admin-performances — Performances management', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/performances', '161-admin-performances');
    await expect(page).not.toHaveURL(/login/);
  });

  test('162-admin-payroll — Payroll management', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/payroll', '162-admin-payroll');
    await expect(page).not.toHaveURL(/login/);
  });

  test('163-admin-rentals — Instrument rentals', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/rentals', '163-admin-rentals');
    await expect(page).not.toHaveURL(/login/);
  });

  test('164-admin-playing-school — Playing school admin', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/playing-school', '164-admin-playing-school');
    await expect(page).not.toHaveURL(/login/);
  });

  test('165-admin-playing-school-billing — Playing school billing', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/playing-school/billing', '165-admin-playing-school-billing');
    await expect(page).not.toHaveURL(/login/);
  });

  test('166-admin-playing-school-distribute — Playing school distribute', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/playing-school/distribute', '166-admin-playing-school-distribute');
    await expect(page).not.toHaveURL(/login/);
  });

  test('167-admin-form-builder — Form builder', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/form-builder', '167-admin-form-builder');
    await expect(page).not.toHaveURL(/login/);
  });

  test('168-admin-branches — Branches / conservatoriums list', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/branches', '168-admin-branches');
    await expect(page).not.toHaveURL(/login/);
  });

  test('169-admin-open-day — Open day admin dashboard', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/open-day', '169-admin-open-day');
    await expect(page).not.toHaveURL(/login/);
  });

  test('170-admin-makeups — Admin makeup dashboard', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/makeups', '170-admin-makeups');
    await expect(page).not.toHaveURL(/login/);
  });

  test('171-admin-waitlists — Waitlist management', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/waitlists', '171-admin-waitlists');
    await expect(page).not.toHaveURL(/login/);
  });

  test('172-admin-substitute — Substitute teacher panel', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/substitute', '172-admin-substitute');
    await expect(page).not.toHaveURL(/login/);
  });

  test('173-admin-scholarships — Scholarships management', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/scholarships', '173-admin-scholarships');
    await expect(page).not.toHaveURL(/login/);
  });

  test('174-admin-notifications — Admin notifications', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/notifications', '174-admin-notifications');
    await expect(page).not.toHaveURL(/login/);
  });

  test('175-admin-notifications-log — Admin notification audit log', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/notifications/log', '175-admin-notifications-log');
    await expect(page).not.toHaveURL(/login/);
  });

  test('176-admin-ministry — Admin ministry sub-page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin/ministry', '176-admin-ministry');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. FAMILY, AI & MISC DASHBOARD PAGES
// ══════════════════════════════════════════════════════════════════════════════

test.describe('17 — Family, AI & Misc', () => {
  test('180-family — Family dashboard view', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/family', '180-family');
    await expect(page).not.toHaveURL(/login/);
  });

  test('181-ai-page — General AI assistant page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    // AI agents page requires admin with a real conservatorium
    await devLogin(page, 'admin@example.com');
    await navAndShot(page, '/dashboard/ai', '181-ai-page');
    await expect(page).not.toHaveURL(/login/);
  });

  test('182-enroll — Enroll / new student page', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/enroll', '182-enroll');
    await expect(page).not.toHaveURL(/login/);
  });

  test('183-school — School coordinator dashboard', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/school', '183-school');
    await expect(page).not.toHaveURL(/login/);
  });

  test('184-profile — User profile page (student view)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'student@example.com');
    await navAndShot(page, '/dashboard/profile', '184-profile');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 18. PERSONA-SPECIFIC VIEWS (via mock login)
// ══════════════════════════════════════════════════════════════════════════════

test.describe('18 — Persona Views via Mock Login', () => {
  test('185-student-view — Dashboard as student (student@example.com)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'student@example.com');
    // Student redirects to /dashboard/profile
    await navAndShot(page, '/dashboard/profile', '185-student-view');
  });

  test('186-teacher-view — Dashboard as teacher (teacher@example.com)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'teacher@example.com');
    await navAndShot(page, '/dashboard/teacher', '186-teacher-view');
  });

  test('187-parent-view — Dashboard as parent (parent@example.com)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'parent@example.com');
    // Parent redirects to /dashboard/family
    await navAndShot(page, '/dashboard/family', '187-parent-view');
  });

  test('188-admin-view — Dashboard as admin (admin@example.com)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'admin@example.com');
    await navAndShot(page, '/dashboard/admin', '188-admin-view');
  });

  test('189-site-admin-view — Dashboard as site_admin (site.admin@example.com)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'site.admin@example.com');
    await navAndShot(page, '/dashboard/admin', '189-site-admin-view');
  });

  test('190-ministry-view — Dashboard as ministry director (ministry.director@example.com)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await devLogin(page, 'ministry.director@example.com');
    await navAndShot(page, '/dashboard/ministry', '190-ministry-view');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 19. RTL VERIFICATION SNAPSHOTS
// ══════════════════════════════════════════════════════════════════════════════

test.describe('19 — RTL Verification', () => {
  test('191-dashboard-he-rtl — Dashboard in Hebrew (RTL sidebar)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/dashboard/admin', '191-dashboard-he-rtl');
    await expect(page).not.toHaveURL(/login/);
  });

  test('192-dashboard-en-ltr — Dashboard in English (LTR sidebar)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/en/dashboard/admin', '192-dashboard-en-ltr');
    await expect(page).not.toHaveURL(/login/);
  });

  test('193-dashboard-ar-rtl — Dashboard in Arabic (RTL)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/ar/dashboard/admin', '193-dashboard-ar-rtl');
    await expect(page).not.toHaveURL(/login/);
  });

  test('194-dashboard-ru-ltr — Dashboard in Russian (LTR)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await navAndShot(page, '/ru/dashboard/admin', '194-dashboard-ru-ltr');
    await expect(page).not.toHaveURL(/login/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 20. MOBILE KEY PAGES
// ══════════════════════════════════════════════════════════════════════════════

test.describe('20 — Mobile Key Pages', () => {
  test('200-admin-mobile — Admin command center at 390px', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await navAndShot(page, '/dashboard/admin', '200-admin-mobile');
    await expect(page).not.toHaveURL(/login/);
  });

  test('201-teacher-dashboard-mobile — Teacher dashboard at 390px', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await devLogin(page, 'teacher@example.com');
    await navAndShot(page, '/dashboard/teacher', '201-teacher-dashboard-mobile');
    await expect(page).not.toHaveURL(/login/);
  });

  test('202-reports-mobile — Reports at 390px', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await navAndShot(page, '/dashboard/reports', '202-reports-mobile');
    await expect(page).not.toHaveURL(/login/);
  });

  test('203-available-now-mobile — Available slots at 390px', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await navAndShot(page, '/available-now', '203-available-now-mobile');
  });

  test('204-alumni-ar-rtl-mobile — Alumni portal in Arabic at 390px', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await navAndShot(page, '/ar/dashboard/alumni', '204-alumni-ar-rtl-mobile');
    await expect(page).not.toHaveURL(/login/);
  });

  test('205-ministry-mobile — Ministry page at 390px', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await navAndShot(page, '/dashboard/ministry', '205-ministry-mobile');
    await expect(page).not.toHaveURL(/login/);
  });
});
