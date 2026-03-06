import { test, expect } from '@playwright/test';

/**
 * Ministry Persona E2E tests — Dev Mode (Auth Bypassed).
 *
 * Covers ministry-facing dashboard routes from sidebar-nav.tsx:
 * - /dashboard/ministry
 * - /dashboard/ministry-export
 */
test.describe('Ministry Persona', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/ministry');
    await page.waitForLoadState('domcontentloaded');
  });

  test('ministry dashboard loads', async ({ page }) => {
    await page.goto('/dashboard/ministry');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('ministry export page loads', async ({ page }) => {
    await page.goto('/dashboard/ministry-export');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('ministry page has meaningful content', async ({ page }) => {
    await page.goto('/dashboard/ministry');
    await expect(page).not.toHaveTitle(/error|404/i);
    // The ministry dashboard should render some heading or content
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible({ timeout: 10000 });
  });

  test('ministry export page has heading', async ({ page }) => {
    await page.goto('/dashboard/ministry-export');
    await expect(page).not.toHaveTitle(/error|404/i);
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible({ timeout: 10000 });
  });
});
