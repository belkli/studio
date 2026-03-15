import { test, expect, type Page } from '@playwright/test';

/**
 * Announcements E2E Tests
 * Covers: announcement composer page load, translate button, accordion sections
 */

const DEV_USER = {
  id: 'dev-user',
  name: 'Dev Admin',
  email: 'admin@lyriosa.dev',
  role: 'site_admin',
  conservatoriumId: 'cons-15',
  status: 'approved',
};

async function setupAuth(page: Page) {
  await page.goto('/en');
  await page.evaluate((user) => {
    localStorage.setItem('lyriosa-user', JSON.stringify(user));
    localStorage.setItem('lyriosa_cookie_consent', JSON.stringify({ essential: true, analytics: false, marketing: false }));
  }, DEV_USER);
}

test.describe('Announcements', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('announcements page loads with heading', async ({ page }) => {
    await page.goto('/en/dashboard/announcements');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    const heading = page.locator('h1');
    await expect(heading.first()).toBeVisible({ timeout: 15000 });
  });

  test('announcement composer form fields are visible', async ({ page }) => {
    await page.goto('/en/dashboard/announcements');
    await page.waitForLoadState('domcontentloaded');
    // The composer has input (title) and textarea (body)
    const titleInput = page.locator('input').first();
    await expect(titleInput).toBeVisible({ timeout: 30000 });
  });

  test('Auto-translate button is present', async ({ page }) => {
    await page.goto('/en/dashboard/announcements');
    await page.waitForLoadState('domcontentloaded');
    // The translate button contains "Auto-translate" or "Translate"
    const translateBtn = page.getByRole('button', { name: /translate/i }).first();
    await expect(translateBtn).toBeVisible({ timeout: 30000 });
  });

  test('page does not crash after entering announcement content', async ({ page }) => {
    await page.goto('/en/dashboard/announcements');
    await page.waitForLoadState('domcontentloaded');
    const titleInput = page.locator('input').first();
    await expect(titleInput).toBeVisible({ timeout: 30000 });
    await titleInput.fill('Test Announcement Title', { force: true });
    const bodyInput = page.locator('textarea').first();
    if (await bodyInput.isVisible()) {
      await bodyInput.fill('This is a test announcement body with enough text for validation.', { force: true });
    }
    // Verify page still renders after interaction
    const heading = page.locator('h1');
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });
});
