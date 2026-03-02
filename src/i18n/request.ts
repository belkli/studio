
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

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


export default getRequestConfig(async ({ locale: requestLocale }) => {
    let locale = requestLocale;
    
    // Validate that the incoming `locale` parameter is valid
    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    // Load the messages for the requested locale.
    const messages = (await import(`../messages/${locale}.json`)).default;
    
    // Always load English as the fallback language.
    const fallbackMessages = (await import('../messages/en.json')).default;
    
    return {
        locale,
        // Merge the fallback messages with the requested locale's messages.
        // This ensures that any missing keys in the requested locale are
        // replaced by their English counterparts, preventing broken UI.
        messages: deepMerge(fallbackMessages, messages),
    };
});
