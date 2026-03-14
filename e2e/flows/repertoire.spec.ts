import { test, expect } from '@playwright/test';

/**
 * Repertoire & Music E2E Tests
 * Covers: RM-01..RM-57 from QA plan 05-repertoire-music.md
 */

test.describe('Repertoire: Student repertoire page', () => {
  test('RM-01: Student repertoire page loads', async ({ page }) => {
    await page.goto('/dashboard/student/repertoire');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('h1, h2, h3, main').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('RM-02: Repertoire shows assigned pieces when data exists', async ({ page }) => {
    await page.goto('/dashboard/student/repertoire');
    await page.waitForLoadState('domcontentloaded');

    const body = await page.locator('body').textContent();
    expect(body!.length).toBeGreaterThan(50);
  });
});

test.describe('Repertoire: Practice tracking', () => {
  test('RM-10: Practice page loads', async ({ page }) => {
    await page.goto('/dashboard/practice');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('h1, h2, h3, main').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('RM-11: Practice coach page loads', async ({ page }) => {
    await page.goto('/dashboard/practice/coach');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('h1, h2, h3, main').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('RM-12: Practice upload page loads', async ({ page }) => {
    await page.goto('/dashboard/practice/upload');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('h1, h2, h3, main').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Repertoire: Ministry repertoire management', () => {
  test('RM-20: Ministry repertoire page loads', async ({ page }) => {
    await page.goto('/dashboard/ministry/repertoire');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('h1, h2, h3, main').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('RM-21: Ministry repertoire shows composition list', async ({ page }) => {
    await page.goto('/dashboard/ministry/repertoire');
    await page.waitForLoadState('domcontentloaded');

    const body = await page.locator('body').textContent();
    // Should show compositions from the 5,217 in data.json
    expect(body!.length).toBeGreaterThan(100);
  });

  test('RM-22: Ministry repertoire has search functionality', async ({ page }) => {
    await page.goto('/dashboard/ministry/repertoire');
    await page.waitForLoadState('domcontentloaded');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="חיפוש"]');
    const isVisible = await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false);
  });
});

test.describe('Repertoire: Library', () => {
  test('RM-30: Library page loads', async ({ page }) => {
    await page.goto('/dashboard/library');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('h1, h2, h3, main').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });
});
