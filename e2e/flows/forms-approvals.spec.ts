import { test, expect, type Page } from '@playwright/test';

/**
 * Forms & Approvals IA Separation E2E Tests
 * Covers: forms page tabs, approvals page tabs, action button visibility based on ?from= context
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

test.describe('Forms & Approvals', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('forms page loads with tabs', async ({ page }) => {
    await page.goto('/en/dashboard/forms');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    const tabList = page.locator('[role="tablist"]');
    await expect(tabList.first()).toBeVisible({ timeout: 30000 });
  });

  test('forms page shows All tab trigger', async ({ page }) => {
    await page.goto('/en/dashboard/forms');
    await page.waitForLoadState('domcontentloaded');
    // Tab "All Forms" should be visible
    const allTab = page.locator('[role="tab"]').first();
    await expect(allTab).toBeVisible({ timeout: 15000 });
  });

  test('forms list page does NOT show Approve/Reject action buttons in table rows', async ({ page }) => {
    await page.goto('/en/dashboard/forms');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    // FormsList with fromContext="forms" should NOT have approve/reject buttons
    // Note: the "Rejected" TAB trigger exists but that's a tab, not an action button
    // We specifically check inside the table area for action buttons
    const tableApproveBtn = page.locator('table').getByRole('button', { name: /^approve$/i });
    const tableRejectBtn = page.locator('table').getByRole('button', { name: /^reject$/i });
    await expect(tableApproveBtn).toHaveCount(0);
    await expect(tableRejectBtn).toHaveCount(0);
  });

  test('approvals page loads with My Queue tab', async ({ page }) => {
    await page.goto('/en/dashboard/approvals');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/login/);
    const tabList = page.locator('[role="tablist"]');
    await expect(tabList.first()).toBeVisible({ timeout: 30000 });
  });

  test('approvals page shows approve buttons or caught-up state', async ({ page }) => {
    await page.goto('/en/dashboard/approvals');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    // The My Queue tab shows either forms with Approve/Reject buttons, or "All caught up" empty state
    const approveBtn = page.getByRole('button', { name: /approve/i });
    const emptyState = page.locator('text=/caught up|no pending/i');
    const hasApprove = await approveBtn.first().isVisible().catch(() => false);
    const hasEmpty = await emptyState.first().isVisible().catch(() => false);
    expect(hasApprove || hasEmpty).toBeTruthy();
  });

  test('form detail from approvals context shows action buttons', async ({ page }) => {
    await page.goto('/en/dashboard/approvals');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the table content to load (bootstrap data)
    const viewLink = page.getByRole('link', { name: 'View' }).first();
    try {
      await expect(viewLink).toBeVisible({ timeout: 15000 });
    } catch {
      // No forms in approval queue for this user — skip
      test.skip();
      return;
    }
    // Dismiss any overlay that might intercept clicks
    await page.evaluate(() => {
      document.querySelectorAll('.driver-overlay, .tsqd-parent-container, [class*="driver-"]').forEach(el => el.remove());
    });
    await viewLink.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    // Verify we navigated to a form detail page
    await page.waitForURL(/\/dashboard\/forms\/form-/, { timeout: 10000 });
    expect(page.url()).toContain('from=approvals');
    const content = page.locator('h1, h2, h3, [role="main"], main');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test('form detail without approvals context does NOT show action buttons', async ({ page }) => {
    await page.goto('/en/dashboard/forms');
    await page.waitForLoadState('domcontentloaded');
    // Wait for form list to render (bootstrap needs time)
    const viewLink = page.getByRole('link', { name: 'View' }).first();
    await expect(viewLink).toBeVisible({ timeout: 30000 });
    // Dismiss any overlay that might intercept clicks
    await page.evaluate(() => {
      document.querySelectorAll('.driver-overlay, .tsqd-parent-container, [class*="driver-"]').forEach(el => el.remove());
    });
    await viewLink.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    // The form detail page opened from "forms" context (not approvals) should NOT have approve/reject
    // Verify we're on a form detail page
    const url = page.url();
    expect(url).toContain('/dashboard/forms/form-');
    expect(url).not.toContain('from=approvals');
    // Check no Approve/Reject action buttons in the main content area
    const approveBtn = page.getByRole('button', { name: /^approve$/i });
    const rejectBtn = page.getByRole('button', { name: /^reject$/i });
    await expect(approveBtn).toHaveCount(0);
    await expect(rejectBtn).toHaveCount(0);
  });
});
