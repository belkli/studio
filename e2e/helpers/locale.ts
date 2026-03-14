import type { Page } from '@playwright/test';

export const LOCALES = ['he', 'en', 'ar', 'ru'] as const;
export const RTL_LOCALES = ['he', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Returns the full path for a given locale.
 * Hebrew (default locale) is served at `/path`, others at `/{locale}/path`.
 */
export function localePath(locale: string, path: string): string {
  return locale === 'he' ? path : `/${locale}${path}`;
}

/**
 * Run assertions across all 4 locales for a given path.
 */
export async function runInAllLocales(
  page: Page,
  path: string,
  assertions: (locale: Locale) => Promise<void>,
) {
  for (const locale of LOCALES) {
    await page.goto(localePath(locale, path));
    await page.waitForLoadState('domcontentloaded');
    await assertions(locale);
  }
}

/**
 * Check if a locale is RTL.
 */
export function isRtlLocale(locale: string): boolean {
  return locale === 'he' || locale === 'ar';
}
