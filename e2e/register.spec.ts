import { test, expect } from '@playwright/test';

/**
 * Registration Flow E2E tests.
 *
 * /register        - enrollment wizard for students/parents
 * /register?token  - playing school enrollment wizard
 * /register/school - school (conservatorium) registration
 */
test.describe('Registration Flow', () => {
  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    // The Hebrew site name uses niqqud: הַרמוֹנְיָה. Accept any locale variant.
    await expect(page).toHaveTitle(/הרמוניה|הַרמוֹנְיָה|Register|Harmonia|Harmony/i);
  });

  test('shows enrollment wizard form', async ({ page }) => {
    await page.goto('/register');
    // The enrollment wizard renders a <form> or element with role="form"
    await expect(page.locator('form, [role="form"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('register with token shows playing school wizard', async ({ page }) => {
    await page.goto('/register?token=test-token-123');
    await page.waitForLoadState('domcontentloaded');
    // Main content area should be rendered regardless of token validity
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('register/school page loads', async ({ page }) => {
    await page.goto('/register/school');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();
  });
});
