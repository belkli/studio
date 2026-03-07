
import { expect, test, describe } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * i18n Completeness Test
 * Scans the codebase for useTranslations('Namespace') calls and verifies
 * that the corresponding namespaces exist in en/ split message files.
 */
describe('i18n Namespace Completeness', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const enMessagesDir = path.resolve(__dirname, '../src/messages/en');

    // Build flat map: namespace -> true, from all en/ JSON files
    // A namespace can be:
    //   - a top-level file name: "admin" (from admin.json)
    //   - a nested key inside a file: "AboutPage" (from public.json { "AboutPage": {...} })
    const knownNamespaces = new Set<string>();
    if (fs.existsSync(enMessagesDir)) {
        for (const file of fs.readdirSync(enMessagesDir)) {
            if (file.endsWith('.json')) {
                const ns = file.replace('.json', '');
                knownNamespaces.add(ns);
                try {
                    const contents = JSON.parse(fs.readFileSync(path.join(enMessagesDir, file), 'utf-8'));
                    // Also register top-level keys inside each file as sub-namespaces
                    if (contents && typeof contents === 'object') {
                        for (const key of Object.keys(contents)) {
                            knownNamespaces.add(key);           // e.g. "AboutPage"
                            knownNamespaces.add(`${ns}.${key}`); // e.g. "public.AboutPage"
                        }
                    }
                } catch {
                    // skip malformed files
                }
            }
        }
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

    const allFiles = walkSync(srcDir);
    const usedNamespaces = new Set<string>();

    allFiles.forEach(file => {
        const namespaces = findNamespacesInFile(file);
        namespaces.forEach(ns => usedNamespaces.add(ns));
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
