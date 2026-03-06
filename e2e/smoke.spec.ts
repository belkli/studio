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
  '/dashboard/ai-reschedule',
  '/dashboard/apply-for-aid',
  '/dashboard/profile',
  // Teacher
  '/dashboard/teacher',
  '/dashboard/teacher/profile',
  '/dashboard/teacher/performance-profile',
  '/dashboard/teacher/availability',
  '/dashboard/teacher/payroll',
  '/dashboard/teacher/reports',
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
  '/dashboard/admin/rentals',
  '/dashboard/admin/branches',
  '/dashboard/admin/form-builder',
  '/dashboard/admin/open-day',
  '/dashboard/admin/makeups',
  '/dashboard/admin/waitlists',
  '/dashboard/admin/substitute',
  '/dashboard/admin/scholarships',
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
  '/dashboard/settings',
  '/dashboard/settings/conservatorium',
  '/dashboard/settings/packages',
  '/dashboard/settings/instruments',
  '/dashboard/ministry-export',
  // Ministry
  '/dashboard/ministry',
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
  '/contact',
  '/privacy',
  '/accessibility',
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
