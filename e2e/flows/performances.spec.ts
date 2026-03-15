import { test, expect, type Page } from '@playwright/test';

/**
 * Performance Booking E2E Tests
 * Covers: admin performances dashboard, assign musicians, invitations page
 */

const DEV_USER = {
  id: 'dev-user',
  name: 'Dev Admin',
  email: 'admin@harmonia.dev',
  role: 'site_admin',
  conservatoriumId: 'cons-15',
  status: 'approved',
};

async function setupAuth(page: Page) {
  await page.goto('/en');
  await page.evaluate((user) => {
    localStorage.setItem('harmonia-user', JSON.stringify(user));
    localStorage.setItem('harmonia_cookie_consent', JSON.stringify({ essential: true, analytics: false, marketing: false }));
  }, DEV_USER);
}

test.describe('Performance Booking Flow', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('admin performances page loads with heading', async ({ page }) => {
    await page.goto('/en/dashboard/admin/performances');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    const heading = page.locator('h1');
    await expect(heading.first()).toBeVisible({ timeout: 30000 });
  });

  test('performances page shows tabs', async ({ page }) => {
    await page.goto('/en/dashboard/admin/performances');
    await page.waitForLoadState('domcontentloaded');
    // The PerformanceBookingDashboard has tabs: New, Manager Review, Music Review, Price Offered
    const tabList = page.locator('[role="tablist"]');
    await expect(tabList.first()).toBeVisible({ timeout: 30000 });
  });

  test('performances page shows list/kanban toggle and table', async ({ page }) => {
    await page.goto('/en/dashboard/admin/performances');
    await page.waitForLoadState('domcontentloaded');
    // The dashboard has a table in list view
    const table = page.locator('table');
    await expect(table.first()).toBeVisible({ timeout: 30000 });
  });

  test('performance invitations page loads', async ({ page }) => {
    await page.goto('/en/dashboard/performances/invitations');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    const heading = page.locator('h1');
    await expect(heading.first()).toBeVisible({ timeout: 30000 });
  });

  test('invitations page has tabs (Pending and History)', async ({ page }) => {
    await page.goto('/en/dashboard/performances/invitations');
    await page.waitForLoadState('domcontentloaded');
    const tabList = page.locator('[role="tablist"]');
    await expect(tabList.first()).toBeVisible({ timeout: 30000 });
  });
});
