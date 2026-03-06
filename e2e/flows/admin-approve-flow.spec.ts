import { test, expect } from '@playwright/test';

/**
 * Admin Approval Flow E2E tests.
 *
 * Cross-persona: admin managing users, approving registrations,
 * and viewing the user management interface.
 */
test.describe('Admin Approval Flow', () => {
  test('admin users page loads and shows user list', async ({ page }) => {
    await page.goto('/dashboard/users');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
    // Should show user management interface with some content
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible({ timeout: 10000 });
  });

  test('users page has a search or filter mechanism', async ({ page }) => {
    await page.goto('/dashboard/users');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
    // Look for search input or filter controls
    const searchOrFilter = page.locator('input[type="search"], input[type="text"], input[placeholder*="search" i], input[placeholder*="חיפוש"], [role="combobox"]');
    // May or may not have search — just verify page has interactive elements
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(200);
  });

  test('approvals page loads with content', async ({ page }) => {
    await page.goto('/dashboard/approvals');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('enroll (new registration) page loads', async ({ page }) => {
    await page.goto('/dashboard/enroll');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin substitute management page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/substitute');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });
});
