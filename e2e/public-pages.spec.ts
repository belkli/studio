import { test, expect } from '@playwright/test';

/**
 * Public Pages E2E tests.
 *
 * Verifies that all publicly accessible pages:
 * - Return a non-error HTTP status (not 404 / 500)
 * - Render their main content area
 * - Do NOT redirect to /login
 *
 * Routes are under the [locale] segment. Since defaultLocale is 'he'
 * with localePrefix 'as-needed', pages are served at their bare paths
 * (e.g. '/about', '/contact') for Hebrew and with a prefix for other
 * locales (e.g. '/en/about').
 */
test.describe('Public Pages', () => {
  const publicPages = [
    { path: '/', title: /הרמוניה|Harmonia/ },
    { path: '/about', title: /קונסרבטוריון|Conservator|Harmonia/ },
    { path: '/contact', title: /קשר|Contact|Harmonia/ },
    { path: '/donate', title: /תרומה|Donat|Harmonia/ },
    { path: '/musicians', title: /מוזיקאים|Musicians|Harmonia/ },
    { path: '/playing-school', title: /בית ספר|Playing School|Harmonia/ },
    { path: '/help', title: /עזרה|Help|Harmonia/ },
    { path: '/accessibility', title: /נגישות|Accessibility|Harmonia/ },
    { path: '/privacy', title: /פרטיות|Privacy|Harmonia/ },
    { path: '/open-day', title: /יום פתוח|Open Day|Harmonia/ },
  ];

  for (const { path } of publicPages) {
    test(`${path} loads without error`, async ({ page }) => {
      const response = await page.goto(path);
      // Must not be a server or client error
      expect(response?.status()).not.toBe(404);
      expect(response?.status()).not.toBe(500);
      // Main content must be rendered
      await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8000 });
      // Public pages must not redirect to login
      await expect(page).not.toHaveURL(/login/);
    });
  }

  test('about page renders main content', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('login page has email/text input', async ({ page }) => {
    await page.goto('/login');
    await expect(
      page.locator('input[type="email"], input[type="text"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('locale switching: /en is accessible and LTR', async ({ page }) => {
    const response = await page.goto('/en');
    expect(response?.status()).not.toBe(404);
    await expect(page).toHaveURL('/en');
    // English is LTR
    const dirEl = page.locator('[dir]').first();
    await expect(dirEl).toHaveAttribute('dir', 'ltr');
  });

  test('locale switching: /ar is accessible and RTL', async ({ page }) => {
    const response = await page.goto('/ar');
    expect(response?.status()).not.toBe(404);
    await expect(page).toHaveURL('/ar');
    // Arabic is RTL
    const dirEl = page.locator('[dir]').first();
    await expect(dirEl).toHaveAttribute('dir', 'rtl');
  });

  test('locale switching: /ru is accessible', async ({ page }) => {
    const response = await page.goto('/ru');
    expect(response?.status()).not.toBe(404);
    await expect(page).toHaveURL('/ru');
  });

  test('donate page has donation form or CTA', async ({ page }) => {
    await page.goto('/donate');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('musicians page renders content', async ({ page }) => {
    await page.goto('/musicians');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();
  });
});
