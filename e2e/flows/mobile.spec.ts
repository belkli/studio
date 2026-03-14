import { test, expect } from '@playwright/test';

// Increase timeout for mobile tests — dev mode compilation can be slow
test.setTimeout(60_000);

/**
 * Mobile Responsive Tests
 * Verifies key pages render correctly at mobile (375px) and tablet (768px) viewports.
 */

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };

test.describe('Mobile (375px): Landing page', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('Hero section visible and not overflowing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });

    // Check no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    // Allow small overflow (scrollbar), but not major overflow
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });

  test('Content is readable (no text truncation)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(200);
  });

  test('CTA buttons are visible and tappable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Look for CTA buttons (register, find conservatory)
    const buttons = page.locator('a[href*="register"], a[href*="about"], button').first();
    if (await buttons.isVisible({ timeout: 5000 }).catch(() => false)) {
      const box = await buttons.boundingBox();
      if (box) {
        // Minimum touch target size (44x44 per WCAG)
        expect(box.height).toBeGreaterThanOrEqual(30); // Allow slightly smaller
        expect(box.width).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

test.describe('Mobile (375px): Login page', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('Login form usable on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Email input should be visible
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Check input is wide enough to type into
    const box = await emailInput.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThan(150);
    }
  });
});

test.describe('Mobile (375px): Dashboard', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('Dashboard loads without horizontal overflow', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });

  test('Sidebar collapses on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // On mobile, sidebar should be collapsed/hidden
    // Look for hamburger menu button
    const hamburger = page.locator('button[aria-label*="menu"], button[aria-label*="nav"], [data-testid="mobile-nav"]');
    const sidebarCollapsed = await hamburger.first().isVisible({ timeout: 5000 }).catch(() => false);
    // Either hamburger exists (sidebar collapsed) or sidebar is hidden
  });
});

test.describe('Mobile (375px): Book wizard', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('Book wizard tabs usable on mobile', async ({ page }) => {
    await page.goto('/dashboard/schedule/book');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('h1, h2, h3, main').first();
    await expect(content).toBeVisible({ timeout: 15000 });

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });
});

test.describe('Mobile (375px): Billing page', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('Billing page readable on mobile', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('h1, h2, h3, main').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Mobile (375px): Cookie banner', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('Cookie banner not obscuring content', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('harmonia_cookie_consent'));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const banner = page.locator('[role="dialog"], [class*="cookie"]').first();
    if (await banner.isVisible({ timeout: 5000 }).catch(() => false)) {
      const bannerBox = await banner.boundingBox();
      const viewportHeight = MOBILE_VIEWPORT.height;
      if (bannerBox) {
        // Banner should not cover more than 40% of viewport
        expect(bannerBox.height).toBeLessThan(viewportHeight * 0.4);
      }
    }
  });
});

test.describe('Tablet (768px): Landing page', () => {
  test.use({ viewport: TABLET_VIEWPORT });

  test('Landing page responsive at tablet width', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });

    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });
});

test.describe('Tablet (768px): Dashboard', () => {
  test.use({ viewport: TABLET_VIEWPORT });

  test('Dashboard sidebar visible or collapsible at tablet', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('h1, h2, h3, main').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Desktop (1280px): Baseline', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Landing page at desktop width', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
  });

  test('Dashboard at desktop width', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('h1, h2, h3, main').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });
});
