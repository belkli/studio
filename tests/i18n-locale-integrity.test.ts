
import { expect, test, describe } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * i18n Locale Integrity Test
 * Ensures that all locale files (EN, HE, AR, RU) have the exact same set of keys.
 */
describe('i18n Locale Integrity', () => {
    const localesDir = path.resolve(__dirname, '../src/messages');
    const localeFiles = ['en.json', 'he.json', 'ar.json', 'ru.json'];

    const getKeys = (obj: any, prefix = ''): string[] => {
        return Object.keys(obj).reduce((res: string[], el) => {
            if (Array.isArray(obj[el])) {
                return res;
            } else if (typeof obj[el] === 'object' && obj[el] !== null) {
                return [...res, ...getKeys(obj[el], prefix + el + '.')];
            }
            return [...res, prefix + el];
        }, []);
    };

    const localesData = localeFiles.reduce((acc: any, file) => {
        const filePath = path.join(localesDir, file);
        if (fs.existsSync(filePath)) {
            acc[file] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
        return acc;
    }, {});

    const referenceLocale = 'en.json';
    const referenceKeys = getKeys(localesData[referenceLocale]).sort();

    localeFiles.forEach((locale) => {
        if (locale === referenceLocale) return;

        test(`Locale ${locale} should match ${referenceLocale} keys`, () => {
            if (!localesData[locale]) {
                console.warn(`Skipping missing locale file: ${locale}`);
                return;
            }
            const currentKeys = getKeys(localesData[locale]).sort();

            const missingKeys = referenceKeys.filter(k => !currentKeys.includes(k));
            const extraKeys = currentKeys.filter(k => !referenceKeys.includes(k));

            if (missingKeys.length > 0) {
                console.error(`[${locale}] Missing keys:`, missingKeys.slice(0, 10), missingKeys.length > 10 ? `...and ${missingKeys.length - 10} more` : '');
            }
            if (extraKeys.length > 0) {
                console.error(`[${locale}] Extra keys:`, extraKeys.slice(0, 10), extraKeys.length > 10 ? `...and ${extraKeys.length - 10} more` : '');
            }

            expect(missingKeys).toEqual([]);
            expect(extraKeys).toEqual([]);
        });
    });
});
