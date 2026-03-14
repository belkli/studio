import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export type TestRole =
  | 'student'
  | 'teacher'
  | 'parent'
  | 'conservatorium_admin'
  | 'site_admin'
  | 'ministry_director'
  | 'school_coordinator'
  | 'delegated_admin';

/**
 * Navigate to a dashboard page using dev bypass (site_admin).
 * Dev bypass auto-injects site_admin when no auth credentials are set.
 */
export async function loginAsDevUser(page: Page) {
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  // Dev bypass means we're already logged in as site_admin
  // Wait for the page to finish rendering
  const content = page.locator('h1, h2, h3, [role="main"], main');
  await expect(content.first()).toBeVisible({ timeout: 15000 });
}

/**
 * Navigate to a specific dashboard route with dev bypass.
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Clear any session/localStorage state that might affect tests.
 */
export async function clearState(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Wait for a toast message to appear with the given text.
 */
export async function expectToast(page: Page, text: string | RegExp) {
  const toast = page.locator('[data-sonner-toast], [role="status"]');
  if (typeof text === 'string') {
    await expect(toast.filter({ hasText: text }).first()).toBeVisible({ timeout: 10000 });
  } else {
    await expect(toast.filter({ hasText: text }).first()).toBeVisible({ timeout: 10000 });
  }
}
