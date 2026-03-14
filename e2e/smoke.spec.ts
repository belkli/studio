import { test, expect } from '@playwright/test';

/**
 * Smoke Test Suite — @smoke tag
 *
 * Fast suite that hits every dashboard page once (GET, minimal interaction).
 * Tagged with @smoke for quick CI checks.
 *
 * Uses dev-bypass mode (no credentials needed).
 */

const DASHBOARD_ROUTES = [
  // Student
  '/dashboard',
  '/dashboard/schedule',
  '/dashboard/schedule/book',
  '/dashboard/practice',
  '/dashboard/practice/coach',
  '/dashboard/progress',
  '/dashboard/billing',
  '/dashboard/makeups',
  '/dashboard/alumni',
  '/dashboard/alumni/profile',
  '/dashboard/ai-reschedule',
  '/dashboard/apply-for-aid',
  '/dashboard/profile',
  '/dashboard/student/repertoire',
  '/dashboard/student/practice',
  '/dashboard/school',
  // Teacher
  '/dashboard/teacher',
  '/dashboard/teacher/profile',
  '/dashboard/teacher/performance-profile',
  '/dashboard/teacher/availability',
  '/dashboard/teacher/payroll',
  '/dashboard/teacher/reports',
  '/dashboard/teacher/exams',
  '/dashboard/practice/upload',
  // Parent
  '/dashboard/family',
  '/dashboard/parent/billing',
  '/dashboard/parent/settings',
  // Admin
  '/dashboard/admin',
  '/dashboard/admin/performances',
  '/dashboard/admin/payroll',
  '/dashboard/admin/playing-school',
  '/dashboard/admin/playing-school/billing',
  '/dashboard/admin/playing-school/distribute',
  '/dashboard/admin/rentals',
  '/dashboard/admin/branches',
  '/dashboard/admin/form-builder',
  '/dashboard/admin/open-day',
  '/dashboard/admin/makeups',
  '/dashboard/admin/waitlists',
  '/dashboard/admin/substitute',
  '/dashboard/admin/scholarships',
  '/dashboard/admin/ministry',
  '/dashboard/admin/notifications',
  '/dashboard/admin/notifications/log',
  '/dashboard/users',
  '/dashboard/master-schedule',
  '/dashboard/reports',
  '/dashboard/events',
  '/dashboard/events/new',
  '/dashboard/ai',
  '/dashboard/announcements',
  '/dashboard/enroll',
  '/dashboard/approvals',
  // Shared
  '/dashboard/messages',
  '/dashboard/notifications',
  '/dashboard/forms',
  '/dashboard/forms/new',
  '/dashboard/settings',
  '/dashboard/settings/conservatorium',
  '/dashboard/settings/conservatorium/profile',
  '/dashboard/settings/packages',
  '/dashboard/settings/instruments',
  '/dashboard/settings/calendar',
  '/dashboard/settings/cancellation',
  '/dashboard/settings/notifications',
  '/dashboard/settings/pricing',
  '/dashboard/ministry-export',
  // Ministry
  '/dashboard/ministry',
  '/dashboard/ministry/repertoire',
  // Extras
  '/dashboard/whats-new',
  '/dashboard/library',
] as const;

test.describe('Smoke: all dashboard pages load without error', { tag: '@smoke' }, () => {
  for (const route of DASHBOARD_ROUTES) {
    test(`${route} loads`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      // Must not redirect to login
      await expect(page).not.toHaveURL(/login/);
      // Must not show error page
      await expect(page).not.toHaveTitle(/error/i);
      // Must have at least one heading or main landmark
      const content = page.locator('h1, h2, h3, [role="main"], main');
      await expect(content.first()).toBeVisible({ timeout: 15000 });
    });
  }
});

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/about',
  '/about/alumni',
  '/contact',
  '/privacy',
  '/accessibility',
  '/register',
  '/playing-school',
  '/available-now',
  '/apply-for-aid',
  '/apply/matchmaker',
  '/donate',
  '/help',
  '/musicians',
  '/open-day',
  '/pending-approval',
  '/try',
] as const;

test.describe('Smoke: public pages load', { tag: '@smoke' }, () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} loads`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).not.toHaveTitle(/error/i);
      const body = await page.locator('body').textContent();
      expect(body!.length).toBeGreaterThan(50);
    });
  }
});

/**
 * New conservatoriums added in the latest seed update.
 * Routes use the /about/[slug] page which accepts `cons-{id}` as a valid slug.
 * Each route exercises the public profile rendering path for that conservatorium.
 */
const CONSERVATORIUM_ROUTES = [
  '/about/cons-2',   // אשדוד
  '/about/cons-7',   // באר שבע
  '/about/cons-9',   // בית שמש
  '/about/cons-10',  // ברנר
  '/about/cons-11',  // בת ים
  '/about/cons-13',  // דימונה
  '/about/cons-14',  // גליל עליון
  '/about/cons-16',  // ערבה
  '/about/cons-17',  // הרצליה
  '/about/cons-18',  // זכרון יעקב
] as const;

test.describe('Smoke: new conservatorium public profile pages load', { tag: '@smoke' }, () => {
  for (const route of CONSERVATORIUM_ROUTES) {
    test(`${route} loads`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).not.toHaveTitle(/error/i);
      const body = await page.locator('body').textContent();
      expect(body!.length).toBeGreaterThan(50);
    });
  }
});

const LOCALE_CHECK_ROUTES = [
  { locale: 'he', path: '/' },
  { locale: 'en', path: '/en' },
  { locale: 'ar', path: '/ar' },
  { locale: 'ru', path: '/ru' },
];

test.describe('Smoke: locale landing pages load', { tag: '@smoke' }, () => {
  for (const { locale, path } of LOCALE_CHECK_ROUTES) {
    test(`Landing page loads in ${locale}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      const body = await page.locator('body').textContent();
      expect(body!.length).toBeGreaterThan(50);
    });
  }
});
