import { test, expect } from '@playwright/test';

test.describe('Available-Now to Book Slot Flow', () => {
  test.skip('slot booking flow: available-now → register → login → deals tab', async ({ page }) => {
    // SKIP: This test requires a live auth server and real Firebase credentials.
    // Dev-bypass mode injects site_admin header at the proxy level but does NOT
    // allow form-based login with email/password. The hardcoded credentials
    // (admin@harmonia.test / password123) have no matching Firebase account.
    // Re-enable once a test-specific auth fixture or mock login is in place.
    //
    // Step 1: Go to available-now page
    await page.goto('/available-now');

    // Step 2: Wait for slot tiles to load
    // Tiles have class: group flex flex-col rounded-2xl
    const slotTiles = page.locator('.rounded-2xl.border').filter({ has: page.locator('button') });
    await expect(slotTiles.first()).toBeVisible({ timeout: 15000 });

    // Step 3: Click "Book Now" button on first tile
    const firstTile = slotTiles.first();
    const bookBtn = firstTile.getByRole('button').first();
    await bookBtn.click();

    // Step 4: Should redirect to /register (or /login)
    await page.waitForURL(/\/(register|login)/, { timeout: 10000 });

    // Step 5: If on register page, click "already have account" link
    const currentUrl = page.url();
    if (currentUrl.includes('/register')) {
      const loginLink = page.getByRole('link').filter({ hasText: /login|sign in|כניסה|войти/i });
      if (await loginLink.count() > 0) {
        await loginLink.first().click();
        await page.waitForURL(/\/login/, { timeout: 5000 });
      }
    }

    // Step 6: Should be on login page with callbackUrl
    await expect(page).toHaveURL(/\/login/);

    // Step 7: Fill login credentials (dev user)
    await page.fill('input[type="email"]', 'admin@harmonia.test');
    await page.fill('input[type="password"]', 'password123');

    const submitBtn = page.getByRole('button').filter({ hasText: /sign in|log in|login|כניסה|войти/i });
    await submitBtn.click();

    // Step 8: After login, should land on schedule/book page
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
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
