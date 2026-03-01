
import { expect, test, describe } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * i18n Completeness Test
 * Scans the codebase for useTranslations('Namespace') calls and verifies 
 * that the corresponding namespaces exist in en.json.
 */
describe('i18n Namespace Completeness', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const enJsonPath = path.resolve(__dirname, '../src/messages/en.json');
    const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf-8'));

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
        test(`Namespace "${ns}" should exist in en.json`, () => {
            const parts = ns.split('.');
            let current = enJson;
            for (const part of parts) {
                expect(current[part], `Namespace "${ns}" is missing part "${part}" in en.json`).toBeDefined();
                current = current[part];
            }
        });
    });
});
