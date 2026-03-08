import { test, expect } from '@playwright/test';

/**
 * Cookie Consent Banner Flow E2E tests.
 *
 * Tests the cookie consent banner accept/reject flow.
 * The banner is rendered client-side and persists consent in localStorage
 * under the key `harmonia_cookie_consent`.
 */

const COOKIE_KEY = 'harmonia_cookie_consent';

test.describe('Cookie Consent Banner', () => {
  test.beforeEach(async ({ page }) => {
    // Clear consent so the banner appears on every test
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), COOKIE_KEY);
    // Reload so the component picks up the cleared state
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('banner is visible on first visit when localStorage is empty', async ({ page }) => {
    const banner = page.getByRole('dialog');
    await expect(banner).toBeVisible({ timeout: 10000 });
  });

  test('clicking Accept stores "accepted" in localStorage and hides the banner', async ({ page }) => {
    const banner = page.getByRole('dialog');
    await expect(banner).toBeVisible({ timeout: 10000 });

    // Click the Accept button — works for both "Accept" (EN) and "אישור" (HE)
    const acceptBtn = banner.getByRole('button').filter({ hasText: /accept|אישור/i });
    await acceptBtn.click();

    // Banner should disappear
    await expect(banner).not.toBeVisible({ timeout: 5000 });

    // Consent value stored in localStorage must be 'accepted'
    const stored = await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY);
    expect(stored).toBe('accepted');
  });

  test('clicking Reject stores "rejected" in localStorage and hides the banner', async ({ page }) => {
    const banner = page.getByRole('dialog');
    await expect(banner).toBeVisible({ timeout: 10000 });

    // Click the Reject button — works for both "Reject" (EN) and "דחייה" (HE)
    const rejectBtn = banner.getByRole('button').filter({ hasText: /reject|דחייה/i });
    await rejectBtn.click();

    // Banner should disappear
    await expect(banner).not.toBeVisible({ timeout: 5000 });

    // Consent value stored in localStorage must be 'rejected'
    const stored = await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY);
    expect(stored).toBe('rejected');
  });

  test('banner does NOT appear on reload after consent has been given', async ({ page }) => {
    // Pre-set consent before navigating
    await page.evaluate((key) => localStorage.setItem(key, 'accepted'), COOKIE_KEY);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Give the client-side component time to mount
    await page.waitForTimeout(1000);

    const banner = page.getByRole('dialog');
    await expect(banner).not.toBeVisible({ timeout: 5000 });
  });

  test('banner does NOT appear on reload after consent has been declined', async ({ page }) => {
    // Pre-set declined consent before navigating
    await page.evaluate((key) => localStorage.setItem(key, 'rejected'), COOKIE_KEY);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await page.waitForTimeout(1000);

    const banner = page.getByRole('dialog');
    await expect(banner).not.toBeVisible({ timeout: 5000 });
  });
});
