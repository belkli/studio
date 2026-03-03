
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import fs from 'node:fs/promises';
import path from 'node:path';

// Helper function to deeply merge two objects.
// This is used to merge the fallback messages with the locale-specific messages.
function deepMerge(base: any, override: any): any {
    const result = { ...base };
    for (const key in override) {
        if (Object.prototype.hasOwnProperty.call(override, key)) {
            // If the key exists in both and they are both objects (but not arrays), recurse.
            if (
                typeof result[key] === 'object' && result[key] !== null &&
                typeof override[key] === 'object' && override[key] !== null &&
                !Array.isArray(result[key]) && !Array.isArray(override[key])
            ) {
                result[key] = deepMerge(result[key], override[key]);
            } else {
                // Otherwise, the override value takes precedence.
                result[key] = override[key];
            }
        }
    }
    return result;
}

async function readJsonFileIfExists(filePath: string) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

async function loadLocaleMessages(locale: string) {
    const splitDir = path.resolve('src/messages', locale);
    let merged = {};

    try {
        const entries = await fs.readdir(splitDir, { withFileTypes: true });
        const splitFiles = entries
            .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
            .map((entry) => entry.name)
            .sort((a, b) => a.localeCompare(b, 'en'));

        for (const fileName of splitFiles) {
            const filePath = path.join(splitDir, fileName);
            const splitMessages = await readJsonFileIfExists(filePath);
            merged = deepMerge(merged, splitMessages);
        }
    } catch {
        // Split directory missing; return empty object and let fallback merge handle display safety.
    }

    return merged;
}


export default getRequestConfig(async ({ requestLocale }) => {
    const resolvedLocale = await requestLocale;
    let locale = resolvedLocale;
    
    // Validate that the incoming `locale` parameter is valid
    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    // Load locale root + optional split bundles.
    const messages = await loadLocaleMessages(locale);
    
    // Always load English (root + split) as fallback language.
    const fallbackMessages = await loadLocaleMessages('en');
    
    return {
        locale,
        // Merge the fallback messages with the requested locale's messages.
        // This ensures that any missing keys in the requested locale are
        // replaced by their English counterparts, preventing broken UI.
        messages: deepMerge(fallbackMessages, messages),
    };
});
