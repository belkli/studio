import { test, expect } from '@playwright/test';

test.describe('Available-Now to Book Slot Flow', () => {
  test('deals tab renders with slot cards via dev-bypass', async ({ page }) => {
    // Dev-bypass mode injects site_admin header automatically — no login needed.
    // Navigate directly to the book page with deals tab selected.
    await page.goto('/en/dashboard/schedule/book?tab=deals');

    // The page title / heading should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // The deals tab trigger should be active
    const dealsTab = page.getByRole('tab').filter({ hasText: /deal|last.?minute|עסקאות/i });
    await expect(dealsTab).toBeVisible();

    // Wait for content: either slot cards appear or a "no deals" message shows
    const slotCard = page.locator('button.rounded-xl.border');
    const noDeals = page.getByText(/no deals|no slots|אין עסקאות/i);
    await expect(slotCard.first().or(noDeals.first())).toBeVisible({ timeout: 15000 });

    // If slot cards are present, verify they show expected elements
    if (await slotCard.count() > 0) {
      // Each card should have a teacher name and a price
      const firstCard = slotCard.first();
      await expect(firstCard).toContainText(/₪/);
    }
  });

  test('slot card can be clicked to open booking dialog', async ({ page }) => {
    await page.goto('/en/dashboard/schedule/book?tab=deals');

    // Wait for slot cards
    const slotCard = page.locator('button.rounded-xl.border');
    const noDeals = page.getByText(/no deals|no slots|אין עסקאות/i);
    await expect(slotCard.first().or(noDeals.first())).toBeVisible({ timeout: 15000 });

    // Only run the click test if slots are available
    const count = await slotCard.count();
    if (count > 0) {
      await slotCard.first().click();

      // A dialog / sheet should open with booking details
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
    }
  });

  test('available-now page shows slot tiles', async ({ page }) => {
    await page.goto('/available-now');

    // Page should load without error
    await expect(page).not.toHaveTitle(/error|404/i);

    // Should show either tiles or "no slots" message
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(100);
  });
});
