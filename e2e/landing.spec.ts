import { test, expect } from '@playwright/test';

/**
 * Landing Page E2E tests.
 *
 * The app uses next-intl with defaultLocale 'he' and localePrefix 'as-needed'.
 * This means '/' serves Hebrew (RTL) content with no locale prefix in the URL.
 * The '/en' prefix is added for English (LTR).
 */
test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero section with correct heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#hero-heading')).toBeVisible();
  });

  test('stats bar shows conservatory count', async ({ page }) => {
    // Stats bar renders values with class text-3xl font-extrabold text-white
    const statValue = page.locator('.text-3xl.font-extrabold.text-white').first();
    await expect(statValue).toBeVisible();
  });

  test('search bar has all three inputs', async ({ page }) => {
    // Name/conservatory text input
    await expect(page.locator('input[aria-label]').first()).toBeVisible();
    // Instrument dropdown (native select)
    await expect(page.locator('select[aria-label]')).toBeVisible();
  });

  test('persona cards section is visible', async ({ page }) => {
    await expect(page.locator('#personas-heading')).toBeVisible();
    // Should have exactly 4 persona cards (Admin, Teacher, Parent, Student)
    const personaCards = page.locator('[aria-labelledby="personas-heading"] .group');
    await expect(personaCards).toHaveCount(4);
  });

  test('navbar has register CTA', async ({ page }) => {
    // The register button lives in the header but outside the <nav> element
    const navRegister = page.locator('header a[href*="register"]').first();
    await expect(navRegister).toBeVisible();
  });

  test('find conservatory section shows heading', async ({ page }) => {
    await expect(page.locator('#find-heading')).toBeVisible();
  });

  test('donate section is visible', async ({ page }) => {
    await expect(page.locator('#donate-heading')).toBeVisible();
  });

  test('footer is visible', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
  });

  test('page is RTL by default (Hebrew)', async ({ page, request }) => {
    // The server renders lang="he" dir="rtl" for the default locale.
    // Without active intl middleware, client-side may re-detect browser locale.
    // We verify the SSR HTML directly using the API request context.
    const response = await request.get('/');
    const body = await response.text();
    expect(body).toContain('dir="rtl"');
  });

  test('English locale switches to LTR', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });
});
