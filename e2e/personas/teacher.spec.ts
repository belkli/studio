import { test, expect } from '@playwright/test';

/**
 * Teacher Persona E2E tests — Dev Mode (Auth Bypassed).
 *
 * Covers all teacher-facing dashboard routes from sidebar-nav.tsx:
 * - My Workspace: /dashboard/teacher, /dashboard/schedule, /dashboard/approvals
 * - My Profile: /dashboard/teacher/profile, performance-profile, availability
 * - My Finances: /dashboard/teacher/payroll, /dashboard/teacher/reports
 * - Community: /dashboard/messages, /dashboard/forms, /dashboard/notifications, /dashboard/alumni
 */
test.describe('Teacher Persona', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/teacher');
    await page.waitForLoadState('domcontentloaded');
  });

  test('teacher dashboard loads', async ({ page }) => {
    await page.goto('/dashboard/teacher');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher schedule page loads', async ({ page }) => {
    await page.goto('/dashboard/schedule');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher approvals page loads', async ({ page }) => {
    await page.goto('/dashboard/approvals');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher profile page loads', async ({ page }) => {
    await page.goto('/dashboard/teacher/profile');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher performance profile page loads', async ({ page }) => {
    await page.goto('/dashboard/teacher/performance-profile');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher availability page loads', async ({ page }) => {
    await page.goto('/dashboard/teacher/availability');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher payroll page loads', async ({ page }) => {
    await page.goto('/dashboard/teacher/payroll');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher reports page loads', async ({ page }) => {
    await page.goto('/dashboard/teacher/reports');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher messages page loads', async ({ page }) => {
    await page.goto('/dashboard/messages');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher forms page loads', async ({ page }) => {
    await page.goto('/dashboard/forms');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher notifications page loads', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher alumni page loads', async ({ page }) => {
    await page.goto('/dashboard/alumni');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('practice upload page loads', async ({ page }) => {
    await page.goto('/dashboard/practice/upload');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('makeups page loads for teacher', async ({ page }) => {
    await page.goto('/dashboard/makeups');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });
});
