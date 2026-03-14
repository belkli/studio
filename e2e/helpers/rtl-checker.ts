import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Assert that the page has RTL direction set on the given container.
 */
export async function assertRtlLayout(page: Page, containerSelector = 'html') {
  const dir = await page.locator(containerSelector).getAttribute('dir');
  expect(dir).toBe('rtl');
}

/**
 * Assert that the page has LTR direction (or no explicit dir, which inherits LTR).
 */
export async function assertLtrLayout(page: Page, containerSelector = 'html') {
  const dir = await page.locator(containerSelector).getAttribute('dir');
  expect(['ltr', null]).toContain(dir);
}

/**
 * Check for physical CSS classes that should be logical in RTL contexts.
 * Returns violations but doesn't fail — some may be intentional (e.g., icons).
 */
export async function findPhysicalCssViolations(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const elements = document.querySelectorAll('[class]');
    const bad: string[] = [];
    elements.forEach((el) => {
      const cls = el.className;
      if (typeof cls === 'string' && /\b(ml-|mr-|pl-|pr-|text-left|text-right)\d/.test(cls)) {
        bad.push(`${el.tagName}#${el.id || '?'}: ${cls.substring(0, 100)}`);
      }
    });
    return bad;
  });
}
