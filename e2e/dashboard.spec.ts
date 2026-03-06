import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E tests — Dev Mode (Auth Bypassed).
 *
 * proxy.ts sets isDevBypass = true when:
 *   process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY
 *
 * In dev mode the proxy injects synthetic claims (role: 'site_admin') and
 * all /dashboard/* routes are accessible without a real Firebase session cookie.
 *
 * If these tests fail with a redirect to /login, ensure that
 * FIREBASE_SERVICE_ACCOUNT_KEY is NOT set in the local .env file.
 */
test.describe('Dashboard - Dev Mode (Auth Bypassed)', () => {
  test('admin dashboard loads', async ({ page }) => {
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('domcontentloaded');
    // Should not redirect to login in dev bypass mode
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('dashboard root redirects or renders', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    // May redirect to /dashboard/admin or render directly — should not hit login
    await expect(page).not.toHaveURL(/login/);
  });

  test('schedule page loads', async ({ page }) => {
    await page.goto('/dashboard/schedule');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('events page loads', async ({ page }) => {
    await page.goto('/dashboard/events');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('billing page loads', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('reports page loads', async ({ page }) => {
    await page.goto('/dashboard/reports');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('messages page loads', async ({ page }) => {
    await page.goto('/dashboard/messages');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('profile page loads', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('sidebar navigation is visible on admin dashboard', async ({ page }) => {
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the page heading/content that indicates the dashboard rendered
    // The sidebar uses 'hidden md:block' which is conditionally visible by viewport.
    // At 1280px (Desktop Chrome), the sidebar aside should be present in DOM.
    const sidebar = page.locator('aside[data-sidebar="sidebar"], [data-sidebar="sidebar"]');
    await expect(sidebar.first()).toBeAttached({ timeout: 10000 });
  });

  test('admin admin branches page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/branches');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('admin payroll page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/payroll');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible();
  });
});
