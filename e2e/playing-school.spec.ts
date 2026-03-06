import { test, expect } from '@playwright/test';

/**
 * Playing School E2E tests.
 *
 * /playing-school                              - public marketing page
 * /enroll/playing-school/[token]              - enrollment wizard (token-gated)
 * /enroll/playing-school/[token]/payment-return - post-payment landing
 * /dashboard/admin/playing-school             - admin management view (dev bypass)
 * /dashboard/admin/playing-school/billing     - billing management (dev bypass)
 * /dashboard/admin/playing-school/distribute  - distribution (dev bypass)
 */
test.describe('Playing School', () => {
  test('playing school public page loads', async ({ page }) => {
    await page.goto('/playing-school');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();
    // Should not redirect to login — this is a public page
    await expect(page).not.toHaveURL(/login/);
  });

  test('enrollment wizard with invalid token shows main content (not crash)', async ({ page }) => {
    // An invalid token should show an error state, not a blank page or 500
    const response = await page.goto('/enroll/playing-school/invalid-token-xyz');
    expect(response?.status()).not.toBe(500);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('enrollment payment-return page with invalid token loads', async ({ page }) => {
    const response = await page.goto('/enroll/playing-school/invalid-token-xyz/payment-return');
    expect(response?.status()).not.toBe(500);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();
  });

  // Admin playing school pages - accessible in dev bypass mode
  test('admin playing school dashboard loads (dev bypass)', async ({ page }) => {
    await page.goto('/dashboard/admin/playing-school');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('admin playing school billing page loads (dev bypass)', async ({ page }) => {
    await page.goto('/dashboard/admin/playing-school/billing');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('admin playing school distribute page loads (dev bypass)', async ({ page }) => {
    await page.goto('/dashboard/admin/playing-school/distribute');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });
});
