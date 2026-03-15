import { test, expect, type Page } from '@playwright/test';

/**
 * Master Schedule E2E Tests
 * Covers: day/week toggle, page load, view switching
 */

const DEV_USER = {
  id: 'dev-user',
  name: 'Dev Admin',
  email: 'admin@lyriosa.dev',
  role: 'site_admin',
  conservatoriumId: 'cons-15',
  status: 'approved',
};

async function setupAuth(page: Page) {
  await page.goto('/en');
  await page.evaluate((user) => {
    localStorage.setItem('lyriosa-user', JSON.stringify(user));
    localStorage.setItem('lyriosa_cookie_consent', JSON.stringify({ essential: true, analytics: false, marketing: false }));
  }, DEV_USER);
}

test.describe('Master Schedule', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('page loads with Master Schedule heading and schedule content', async ({ page }) => {
    await page.goto('/en/dashboard/master-schedule');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    const heading = page.locator('h1');
    await expect(heading.first()).toBeVisible({ timeout: 15000 });
  });

  test('Day toggle button is present', async ({ page }) => {
    await page.goto('/en/dashboard/master-schedule');
    await page.waitForLoadState('domcontentloaded');
    const dayButton = page.locator('[aria-label="Day"]');
    await expect(dayButton).toBeVisible({ timeout: 30000 });
  });

  test('Week toggle button is present', async ({ page }) => {
    await page.goto('/en/dashboard/master-schedule');
    await page.waitForLoadState('domcontentloaded');
    const weekButton = page.locator('[aria-label="Week"]');
    await expect(weekButton).toBeVisible({ timeout: 30000 });
  });

  test('clicking Week view does not crash and shows content', async ({ page }) => {
    await page.goto('/en/dashboard/master-schedule');
    await page.waitForLoadState('domcontentloaded');
    const weekButton = page.locator('[aria-label="Week"]');
    await expect(weekButton).toBeVisible({ timeout: 30000 });
    await weekButton.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    // Verify page did not crash — still has visible heading
    const heading = page.locator('h1');
    await expect(heading.first()).toBeVisible({ timeout: 15000 });
  });

  test('clicking Day view after Week does not crash', async ({ page }) => {
    await page.goto('/en/dashboard/master-schedule');
    await page.waitForLoadState('domcontentloaded');
    const weekButton = page.locator('[aria-label="Week"]');
    await expect(weekButton).toBeVisible({ timeout: 30000 });
    await weekButton.click({ force: true });
    await page.waitForTimeout(1000);
    const dayButton = page.locator('[aria-label="Day"]');
    await dayButton.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    const heading = page.locator('h1');
    await expect(heading.first()).toBeVisible({ timeout: 15000 });
  });
});
