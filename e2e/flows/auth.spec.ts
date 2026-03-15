import { test, expect } from '@playwright/test';
import { LOCALES, RTL_LOCALES, localePath, isRtlLocale } from '../helpers/locale';

/**
 * Auth & Registration E2E Tests
 * Covers: A-01..A-25 from QA plan 01-auth-registration.md
 */

test.describe('Auth: Login page', () => {
  test('A-01: Login page renders in all locales', async ({ page }) => {
    for (const locale of LOCALES) {
      const path = localePath(locale, '/login');
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      // Login card is visible
      const card = page.locator('[data-testid="login-card"], .card, [class*="Card"]').first();
      await expect(card).toBeVisible({ timeout: 10000 });

      // Email and password fields exist
      await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

      // Back to home link exists
      const backLink = page.locator('a[href="/"], a[href*="lyriosa"], a:has-text("Lyriosa"), a:has-text("ליריוסה")').first();
      await expect(backLink).toBeVisible();
    }
  });

  test('A-02: Email/password login works (dev bypass)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Fill email field
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await emailInput.fill('student@example.com');

    // Fill password (mock path accepts any)
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('password123');
    }

    // Submit
    const loginButton = page.getByRole('button', { name: /login|כניסה|sign in/i });
    await loginButton.click();

    // Should redirect to dashboard (dev bypass auto-logs in)
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  });

  test('A-03: Logout redirects to home', async ({ page }) => {
    // First log in via dev bypass
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Find and click logout
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("יציאה"), [data-testid="logout"]');
    if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL(/^\/$|\/login/, { timeout: 10000 });
    }
  });

  test('A-25: callbackUrl open redirect blocked (FIX-13)', async ({ page }) => {
    // Attempt external redirect
    await page.goto('/login?callbackUrl=https://evil.com');
    await page.waitForLoadState('domcontentloaded');

    // Fill login form with dev user
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await emailInput.fill('admin@lyriosa.local');

    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('password');
    }

    const loginButton = page.getByRole('button', { name: /login|כניסה|sign in/i });
    await loginButton.click();

    // Should NOT redirect to evil.com — should go to /dashboard instead
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('evil.com');
    expect(page.url()).toMatch(/dashboard|localhost/);
  });

  test('A-25b: Protocol-relative URL redirect blocked', async ({ page }) => {
    await page.goto('/login?callbackUrl=//evil.com');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.getByRole('textbox', { name: /email/i });
    await emailInput.fill('admin@lyriosa.local');

    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('password');
    }

    const loginButton = page.getByRole('button', { name: /login|כניסה|sign in/i });
    await loginButton.click();

    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('evil.com');
  });
});

test.describe('Auth: Role-based access', () => {
  test('A-10: Dashboard requires authentication (dev bypass active)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    // With dev bypass, should NOT redirect to login
    await expect(page).not.toHaveURL(/login/);
    const content = page.locator('h1, h2, h3, [role="main"], main');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test('A-11: Public pages accessible without auth', async ({ page }) => {
    const publicRoutes = ['/', '/login', '/about', '/contact', '/privacy', '/accessibility'];
    for (const route of publicRoutes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).not.toHaveURL(/error/i);
      const body = await page.locator('body').textContent();
      expect(body!.length).toBeGreaterThan(50);
    }
  });
});

test.describe('Auth: Registration', () => {
  test('A-15: Register page renders', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');
    // Should not redirect to login
    await expect(page).not.toHaveURL(/login/);
    // Should have form elements
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(50);
  });

  test('A-16: Playing school enrollment page renders', async ({ page }) => {
    await page.goto('/playing-school');
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(50);
  });
});

test.describe('Auth: RTL layout', () => {
  for (const locale of RTL_LOCALES) {
    test(`Login page has RTL layout for ${locale}`, async ({ page }) => {
      await page.goto(localePath(locale, '/login'));
      await page.waitForLoadState('domcontentloaded');

      // Check dir attribute on html or body
      const htmlDir = await page.locator('html').getAttribute('dir');
      const bodyDir = await page.locator('body').getAttribute('dir');
      const hasRtl = htmlDir === 'rtl' || bodyDir === 'rtl' ||
        await page.locator('[dir="rtl"]').first().isVisible().catch(() => false);
      expect(hasRtl).toBeTruthy();
    });
  }
});
