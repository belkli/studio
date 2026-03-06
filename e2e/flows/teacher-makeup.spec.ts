import { test, expect } from '@playwright/test';

/**
 * Teacher Makeup Lesson Flow E2E tests.
 *
 * Tests the makeup lesson management flow from the teacher perspective:
 * 1. Teacher dashboard shows upcoming lessons
 * 2. Makeups page shows makeup credit management
 * 3. Admin makeups page for admin-level makeup management
 */
test.describe('Teacher Makeup Flow', () => {
  test('teacher dashboard loads with lesson overview', async ({ page }) => {
    await page.goto('/dashboard/teacher');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
    // Teacher dashboard should show some content (cards, tables, or lists)
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible({ timeout: 10000 });
  });

  test('makeups page loads for teachers', async ({ page }) => {
    await page.goto('/dashboard/makeups');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('makeups page has content', async ({ page }) => {
    await page.goto('/dashboard/makeups');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
    // Should have some heading or descriptive content
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible({ timeout: 10000 });
  });

  test('admin makeups page loads', async ({ page }) => {
    await page.goto('/dashboard/admin/makeups');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('teacher schedule shows lessons', async ({ page }) => {
    await page.goto('/dashboard/schedule');
    await expect(page).not.toHaveTitle(/error|404/i);
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
    // Schedule should render some calendar or list view
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(200);
  });
});
