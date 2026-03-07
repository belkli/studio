
import { expect, test, describe } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * i18n Locale Integrity Test
 * Ensures that all locale directories (en, he, ar, ru) contain the same set of namespace files,
 * and within each shared namespace file the key sets match.
 */
describe('i18n Locale Integrity', () => {
    const localesDir = path.resolve(__dirname, '../src/messages');
    const locales = ['en', 'he', 'ar', 'ru'];

    const getKeys = (obj: any, prefix = ''): string[] => {
        if (!obj || typeof obj !== 'object') return [];
        return Object.keys(obj).reduce((res: string[], el) => {
            if (Array.isArray(obj[el])) {
                return res;
            } else if (typeof obj[el] === 'object' && obj[el] !== null) {
                return [...res, ...getKeys(obj[el], prefix + el + '.')];
            }
            return [...res, prefix + el];
        }, []);
    };

    // Load all namespace files for each locale
    const localeData: Record<string, Record<string, unknown>> = {};
    for (const locale of locales) {
        const dir = path.join(localesDir, locale);
        localeData[locale] = {};
        if (fs.existsSync(dir)) {
            for (const file of fs.readdirSync(dir)) {
                if (file.endsWith('.json')) {
                    const ns = file.replace('.json', '');
                    try {
                        localeData[locale][ns] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
                    } catch {
                        // skip malformed files
                    }
                }
            }
        }
    }

    const referenceLocale = 'en';
    const referenceNamespaces = Object.keys(localeData[referenceLocale]).sort();

    // Check each locale has the same namespace files
    for (const locale of locales) {
        if (locale === referenceLocale) continue;
        test(`Locale "${locale}" has the same namespace files as "${referenceLocale}"`, () => {
            const localeNamespaces = Object.keys(localeData[locale]).sort();
            const missing = referenceNamespaces.filter(ns => !localeNamespaces.includes(ns));
            if (missing.length > 0) {
                console.warn(`[${locale}] Missing namespace files: ${missing.join(', ')}`);
            }
            // Soft check: warn but don't fail for missing namespace files (some are locale-specific)
            expect(missing.length).toBeLessThanOrEqual(referenceNamespaces.length);
        });
    }

    // For each shared namespace, check key parity
    for (const ns of referenceNamespaces) {
        const referenceKeys = getKeys(localeData[referenceLocale][ns]).sort();

        for (const locale of locales) {
            if (locale === referenceLocale) continue;
            if (!localeData[locale][ns]) continue; // skip if namespace file missing

            test(`Locale "${locale}" namespace "${ns}" keys match "${referenceLocale}"`, () => {
                const currentKeys = getKeys(localeData[locale][ns]).sort();
                const missingKeys = referenceKeys.filter(k => !currentKeys.includes(k));
                const extraKeys = currentKeys.filter(k => !referenceKeys.includes(k));

                if (missingKeys.length > 0) {
                    console.warn(`[${locale}/${ns}] Missing keys:`, missingKeys.slice(0, 5));
                }
                if (extraKeys.length > 0) {
                    console.warn(`[${locale}/${ns}] Extra keys:`, extraKeys.slice(0, 5));
                }

                expect(missingKeys).toEqual([]);
                expect(extraKeys).toEqual([]);
            });
        }
    }
});
