import { test, expect } from '@playwright/test';

/**
 * Student Persona E2E tests — Dev Mode (Auth Bypassed).
 *
 * In dev bypass mode the proxy injects synthetic claims (role: 'site_admin')
 * so all dashboard routes are accessible. These tests verify that each
 * student-facing page renders without errors.
 */
test.describe('Student Persona', () => {
  test.beforeEach(async ({ page }) => {
    // Dev bypass: just navigate — auth header injected by proxy
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('dashboard home loads', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('schedule page renders', async ({ page }) => {
    await page.goto('/dashboard/schedule');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('book lesson wizard loads', async ({ page }) => {
    await page.goto('/dashboard/schedule/book');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('practice page loads', async ({ page }) => {
    await page.goto('/dashboard/practice');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('AI practice coach loads', async ({ page }) => {
    await page.goto('/dashboard/practice/coach');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('progress page loads', async ({ page }) => {
    await page.goto('/dashboard/progress');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('messages page loads', async ({ page }) => {
    await page.goto('/dashboard/messages');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('notifications page loads', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('billing page loads', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('makeups page loads', async ({ page }) => {
    await page.goto('/dashboard/makeups');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('alumni page loads', async ({ page }) => {
    await page.goto('/dashboard/alumni');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('forms page loads', async ({ page }) => {
    await page.goto('/dashboard/forms');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('apply for aid page loads', async ({ page }) => {
    await page.goto('/dashboard/apply-for-aid');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('AI reschedule page loads', async ({ page }) => {
    await page.goto('/dashboard/ai-reschedule');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('student profile page loads', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });
});
