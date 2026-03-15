import { test, expect, type Page } from '@playwright/test';

/**
 * Waitlist & Offer Flow E2E Tests
 * Covers: admin waitlist dashboard, Send Offer button, family page
 */

const DEV_USER = {
  id: 'dev-user',
  name: 'Dev Admin',
  email: 'admin@harmonia.dev',
  role: 'site_admin',
  conservatoriumId: 'cons-15',
  status: 'approved',
};

async function setupAuth(page: Page) {
  await page.goto('/en');
  await page.evaluate((user) => {
    localStorage.setItem('harmonia-user', JSON.stringify(user));
    localStorage.setItem('harmonia_cookie_consent', JSON.stringify({ essential: true, analytics: false, marketing: false }));
  }, DEV_USER);
}

test.describe('Waitlist Offer Flow', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('admin waitlists page loads with heading', async ({ page }) => {
    await page.goto('/en/dashboard/admin/waitlists');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    const heading = page.locator('h1');
    await expect(heading.first()).toBeVisible({ timeout: 30000 });
  });

  test('waitlist table or empty state is visible', async ({ page }) => {
    await page.goto('/en/dashboard/admin/waitlists');
    await page.waitForLoadState('domcontentloaded');
    // Table with data or empty state
    const table = page.locator('table');
    await expect(table.first()).toBeVisible({ timeout: 30000 });
  });

  test('Send Offer button exists or empty state is shown', async ({ page }) => {
    await page.goto('/en/dashboard/admin/waitlists');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    // Check for Send Offer button or empty state icon/text
    const sendOfferBtn = page.getByRole('button', { name: /send offer/i });
    const emptyState = page.locator('svg'); // EmptyState has an icon
    const hasButton = await sendOfferBtn.first().isVisible().catch(() => false);
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    // Either the button exists (entries in waitlist) or the table is visible (with empty state row)
    expect(hasButton || hasTable).toBeTruthy();
  });

  test('clicking Send Offer opens a dialog (when WAITING entries exist)', async ({ page }) => {
    await page.goto('/en/dashboard/admin/waitlists');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    // Find a Send Offer button that is NOT disabled (only WAITING entries have an enabled button)
    const enabledOfferBtn = page.getByRole('button', { name: /send offer/i }).and(page.locator(':not([disabled])'));
    const isVisible = await enabledOfferBtn.first().isVisible().catch(() => false);
    if (!isVisible) {
      // All entries are OFFERED (disabled) or no entries — skip
      test.skip();
      return;
    }
    // Dismiss any overlay that might intercept clicks
    await page.evaluate(() => {
      document.querySelectorAll('.driver-overlay, .tsqd-parent-container').forEach(el => el.remove());
    });
    await enabledOfferBtn.first().click({ force: true });
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.first()).toBeVisible({ timeout: 10000 });
  });

  test('family (parent) dashboard page loads', async ({ page }) => {
    await page.goto('/en/dashboard/family');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    const content = page.locator('h1, h2, h3, [role="main"], main');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });
});
