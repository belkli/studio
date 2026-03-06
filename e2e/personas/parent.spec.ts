import { test, expect } from '@playwright/test';

/**
 * Parent Persona E2E tests — Dev Mode (Auth Bypassed).
 *
 * Covers all parent-facing dashboard routes from sidebar-nav.tsx:
 * - My Family: /dashboard/family, /dashboard/schedule
 * - Child Progress: /dashboard/progress, /dashboard/practice
 * - Parent Tools: /dashboard/practice/coach, /dashboard/ai-reschedule
 * - Finance & Admin: /dashboard/billing, /dashboard/makeups, /dashboard/apply-for-aid, /dashboard/forms
 * - Community: /dashboard/messages, /dashboard/notifications, /dashboard/alumni
 */
test.describe('Parent Persona', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/family');
    await page.waitForLoadState('domcontentloaded');
  });

  test('family hub page loads', async ({ page }) => {
    await page.goto('/dashboard/family');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent schedule page loads', async ({ page }) => {
    await page.goto('/dashboard/schedule');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent progress page loads', async ({ page }) => {
    await page.goto('/dashboard/progress');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent practice log page loads', async ({ page }) => {
    await page.goto('/dashboard/practice');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent AI coach page loads', async ({ page }) => {
    await page.goto('/dashboard/practice/coach');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent AI reschedule page loads', async ({ page }) => {
    await page.goto('/dashboard/ai-reschedule');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent billing page loads', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent makeups page loads', async ({ page }) => {
    await page.goto('/dashboard/makeups');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent apply for aid page loads', async ({ page }) => {
    await page.goto('/dashboard/apply-for-aid');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent forms page loads', async ({ page }) => {
    await page.goto('/dashboard/forms');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent messages page loads', async ({ page }) => {
    await page.goto('/dashboard/messages');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent notifications page loads', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent alumni page loads', async ({ page }) => {
    await page.goto('/dashboard/alumni');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('parent book lesson page loads', async ({ page }) => {
    await page.goto('/dashboard/schedule/book');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });
});
