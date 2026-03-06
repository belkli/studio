import { test, expect } from '@playwright/test';

/**
 * Admin Persona E2E tests — Dev Mode (Auth Bypassed).
 *
 * Covers all admin-facing dashboard routes from sidebar-nav.tsx:
 * - Overview: /dashboard, /dashboard/announcements
 * - People: /dashboard/users, /dashboard/enroll, /dashboard/approvals, /dashboard/admin/substitute, /dashboard/admin/scholarships
 * - Schedule & Ops: /dashboard/master-schedule, /dashboard/admin/makeups, /dashboard/admin/waitlists
 * - Programs & Events: /dashboard/events, /dashboard/admin/open-day, /dashboard/admin/performances, /dashboard/admin/rentals, /dashboard/admin/branches, /dashboard/admin/playing-school
 * - Finance: /dashboard/billing, /dashboard/admin/payroll
 * - Intelligence: /dashboard/reports, /dashboard/ai, /dashboard/admin/form-builder, /dashboard/ministry-export
 * - Communication: /dashboard/messages, /dashboard/forms, /dashboard/notifications, /dashboard/alumni
 * - Settings: /dashboard/settings, /dashboard/settings/conservatorium, /dashboard/settings/packages, /dashboard/settings/instruments
 */
test.describe('Admin Persona', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('domcontentloaded');
  });

  // ---- Overview ----

  test('admin command center loads', async ({ page }) => {
    await page.goto('/dashboard/admin');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('announcements page loads', async ({ page }) => {
    await page.goto('/dashboard/announcements');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  // ---- People ----

  test('user management page loads', async ({ page }) => {
    await page.goto('/dashboard/users');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('new registration page loads', async ({ page }) => {
    await page.goto('/dashboard/enroll');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('approvals page loads', async ({ page }) => {
    await page.goto('/dashboard/approvals');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('substitute management page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/substitute');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('scholarships management page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/scholarships');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  // ---- Schedule & Operations ----

  test('master schedule page loads', async ({ page }) => {
    await page.goto('/dashboard/master-schedule');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin makeups page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/makeups');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('waitlists page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/waitlists');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  // ---- Programs & Events ----

  test('events page loads', async ({ page }) => {
    await page.goto('/dashboard/events');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('new event page loads', async ({ page }) => {
    await page.goto('/dashboard/events/new');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('open day management page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/open-day');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('performances page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/performances');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('rentals page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/rentals');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('branches page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/branches');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('playing school page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/playing-school');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  // ---- Finance ----

  test('admin billing page loads', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher payroll page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/payroll');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  // ---- Intelligence ----

  test('reports and analytics page loads', async ({ page }) => {
    await page.goto('/dashboard/reports');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('AI agents page loads', async ({ page }) => {
    await page.goto('/dashboard/ai');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('form builder page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/form-builder');
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

  // ---- Communication ----

  test('admin messages page loads', async ({ page }) => {
    await page.goto('/dashboard/messages');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin forms page loads', async ({ page }) => {
    await page.goto('/dashboard/forms');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin notifications page loads', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin alumni page loads', async ({ page }) => {
    await page.goto('/dashboard/alumni');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  // ---- Settings ----

  test('settings page loads', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('conservatorium settings page loads', async ({ page }) => {
    await page.goto('/dashboard/settings/conservatorium');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('packages settings page loads', async ({ page }) => {
    await page.goto('/dashboard/settings/packages');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('instruments settings page loads', async ({ page }) => {
    await page.goto('/dashboard/settings/instruments');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  // ---- Sidebar ----

  test('sidebar navigation is visible on admin dashboard', async ({ page }) => {
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('domcontentloaded');
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar.first()).toBeAttached({ timeout: 10000 });
  });
});
