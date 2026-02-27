import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;
    // Validate that the incoming `locale` parameter is valid
    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    let messages;
    switch (locale) {
        case 'en':
            messages = (await import('../messages/en.json')).default;
            break;
        case 'ar':
            messages = (await import('../messages/ar.json')).default;
            break;
        case 'he':
            messages = (await import('../messages/he.json')).default;
            break;
        case 'ru':
            messages = (await import('../messages/ru.json')).default;
            break;
        default:
            messages = (await import('../messages/he.json')).default;
    }

    return {
        locale,
        messages
    } as any;
});
