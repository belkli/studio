import { test, expect } from '@playwright/test';

const DASHBOARD_ROUTES = [
  '/dashboard',
  '/dashboard/alumni',
  '/dashboard/notifications',
  '/dashboard/events',
  '/dashboard/forms',
  '/dashboard/billing',
  '/dashboard/announcements',
  '/dashboard/approvals',
  '/dashboard/admin/payroll',
  '/dashboard/admin/rentals',
  '/dashboard/admin/performances',
  '/dashboard/admin/open-day',
  '/dashboard/admin/scholarships',
  '/dashboard/admin/waitlists',
  '/dashboard/reports',
  '/dashboard/ministry-export',
];

test.describe('i18n RTL regression @rtl-regression', () => {
  test.use({ locale: 'he-IL' });

  for (const route of DASHBOARD_ROUTES) {
    test(`${route} — page root has dir=rtl`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // Look for a main container with dir attribute
      const rtlContainers = page.locator('[dir="rtl"]');
      const count = await rtlContainers.count();
      expect(count, `${route} should have at least one dir=rtl container`).toBeGreaterThan(0);
    });
  }

  test('/dashboard/notifications — tabs have correct dir', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await page.waitForLoadState('networkidle');
    // Tabs root (role=tablist) should be inside an element with dir=rtl
    const tabList = page.locator('[role="tablist"]').first();
    if (await tabList.count() > 0) {
      const closestRtl = page.locator('[dir="rtl"] [role="tablist"]').first();
      await expect(closestRtl).toBeVisible();
    }
  });

  test('/dashboard/events — no raw EXAM_PERFORMANCE or RECITAL text visible', async ({ page }) => {
    await page.goto('/dashboard/events');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('EXAM_PERFORMANCE');
    expect(bodyText).not.toContain('RECITAL');
    expect(bodyText).not.toContain('BOOKING_CONFIRMED');
    expect(bodyText).not.toContain('INQUIRY_RECEIVED');
  });

  test('/dashboard/billing — no ILS prefix visible', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('ILS');
  });

  test('/dashboard/admin/scholarships — no English-only cause names when locale is Hebrew', async ({ page }) => {
    await page.goto('/dashboard/admin/scholarships');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Financial Aid for Disadvantaged');
    expect(bodyText).not.toContain('Excellence Scholarships');
  });
});
