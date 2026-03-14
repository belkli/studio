
import { expect, test, describe } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ALL_LOCALES = ['en', 'he', 'ar', 'ru'] as const;

/** Build the set of known namespaces (file names + top-level keys) for a locale dir. */
function buildKnownNamespaces(messagesDir: string): Set<string> {
    const known = new Set<string>();
    if (!fs.existsSync(messagesDir)) return known;
    for (const file of fs.readdirSync(messagesDir)) {
        if (!file.endsWith('.json')) continue;
        const ns = file.replace('.json', '');
        known.add(ns);
        try {
            const contents = JSON.parse(fs.readFileSync(path.join(messagesDir, file), 'utf-8'));
            if (contents && typeof contents === 'object') {
                for (const key of Object.keys(contents)) {
                    known.add(key);           // e.g. "AboutPage"
                    known.add(`${ns}.${key}`); // e.g. "public.AboutPage"
                }
            }
        } catch {
            // skip malformed files
        }
    }
    return known;
}

const findNamespacesInFile = (filePath: string): string[] => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const regex = /useTranslations\(['"]([^'"]+)['"]\)/g;
    const namespaces: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        namespaces.push(match[1]);
    }
    return namespaces;
};

const walkSync = (dir: string, filelist: string[] = []): string[] => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (!['node_modules', '.next', '.git'].includes(file)) {
                filelist = walkSync(filePath, filelist);
            }
        } else if (file.match(/\.(tsx|ts|js|jsx)$/)) {
            filelist.push(filePath);
        }
    });
    return filelist;
};

/**
 * i18n Completeness Test
 * Scans the codebase for useTranslations('Namespace') calls and verifies
 * that the corresponding namespaces exist in en/ split message files.
 */
describe('i18n Namespace Completeness', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const enMessagesDir = path.resolve(__dirname, '../src/messages/en');

    const knownNamespaces = buildKnownNamespaces(enMessagesDir);

    const allFiles = walkSync(srcDir);
    const usedNamespaces = new Set<string>();

    allFiles.forEach(file => {
        findNamespacesInFile(file).forEach(ns => usedNamespaces.add(ns));
    });

    Array.from(usedNamespaces).forEach(ns => {
        test(`Namespace "${ns}" should exist in en messages`, () => {
            // Check if it's a known namespace (file name OR top-level key in any file)
            // Also accept sub-paths like "Common.shared" if "common" or "Common" file has "shared" key
            const topKey = ns.split('.')[0];
            const isKnown = knownNamespaces.has(ns) || knownNamespaces.has(topKey);
            expect(
                isKnown,
                `Namespace "${ns}" not found in src/messages/en/ (no file or key matching "${topKey}")`
            ).toBe(true);
        });
    });
});

/**
 * i18n All-Locale Completeness Test
 * For each namespace used in source code, verifies that it exists in ALL 4 locales.
 */
describe('i18n Namespace Completeness — all locales', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const messagesRoot = path.resolve(__dirname, '../src/messages');

    // Pre-build known namespaces per locale
    const knownPerLocale: Record<string, Set<string>> = {};
    for (const locale of ALL_LOCALES) {
        knownPerLocale[locale] = buildKnownNamespaces(path.join(messagesRoot, locale));
    }

    const allFiles = walkSync(srcDir);
    const usedNamespaces = new Set<string>();
    allFiles.forEach(file => {
        findNamespacesInFile(file).forEach(ns => usedNamespaces.add(ns));
    });

    for (const locale of ALL_LOCALES) {
        Array.from(usedNamespaces).forEach(ns => {
            test(`[${locale}] Namespace "${ns}" exists`, () => {
                const topKey = ns.split('.')[0];
                const isKnown = knownPerLocale[locale].has(ns) || knownPerLocale[locale].has(topKey);
                expect(
                    isKnown,
                    `[${locale}] Namespace "${ns}" not found in src/messages/${locale}/`
                ).toBe(true);
            });
        });
    }
});

/**
 * i18n Locale File Parity Test
 * Each non-en locale must have exactly the same namespace JSON files as en/.
 */
describe('i18n Locale File Parity — all locales have same namespace files as en', () => {
    const messagesRoot = path.resolve(__dirname, '../src/messages');
    const enDir = path.join(messagesRoot, 'en');

    const enFiles = fs.existsSync(enDir)
        ? fs.readdirSync(enDir).filter(f => f.endsWith('.json')).sort()
        : [];

    for (const locale of ALL_LOCALES) {
        if (locale === 'en') continue;
        test(`Locale "${locale}" has all namespace files present in "en"`, () => {
            const localeDir = path.join(messagesRoot, locale);
            const localeFiles = fs.existsSync(localeDir)
                ? fs.readdirSync(localeDir).filter(f => f.endsWith('.json')).sort()
                : [];
            const missing = enFiles.filter(f => !localeFiles.includes(f));
            expect(
                missing,
                `[${locale}] Missing namespace files: ${missing.join(', ')}`
            ).toHaveLength(0);
        });
    }
});
