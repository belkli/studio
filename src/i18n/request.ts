
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

// Static imports of all message files — avoids node:fs in Edge Runtime
import heAdmin from '../messages/he/admin.json';
import heAlumni from '../messages/he/alumni.json';
import heBilling from '../messages/he/billing.json';
import heCommon from '../messages/he/common.json';
import heEnrollment from '../messages/he/enrollment.json';
import heForms from '../messages/he/forms.json';
import heOpenDay from '../messages/he/OpenDay.json';
import hePublic from '../messages/he/public.json';
import heSettings from '../messages/he/settings.json';
import heStudent from '../messages/he/student.json';

import enAdmin from '../messages/en/admin.json';
import enAlumni from '../messages/en/alumni.json';
import enBilling from '../messages/en/billing.json';
import enCommon from '../messages/en/common.json';
import enEnrollment from '../messages/en/enrollment.json';
import enForms from '../messages/en/forms.json';
import enOpenDay from '../messages/en/OpenDay.json';
import enPublic from '../messages/en/public.json';
import enSettings from '../messages/en/settings.json';
import enStudent from '../messages/en/student.json';

import arAdmin from '../messages/ar/admin.json';
import arAlumni from '../messages/ar/alumni.json';
import arBilling from '../messages/ar/billing.json';
import arCommon from '../messages/ar/common.json';
import arEnrollment from '../messages/ar/enrollment.json';
import arForms from '../messages/ar/forms.json';
import arOpenDay from '../messages/ar/OpenDay.json';
import arPublic from '../messages/ar/public.json';
import arSettings from '../messages/ar/settings.json';
import arStudent from '../messages/ar/student.json';

import ruAdmin from '../messages/ru/admin.json';
import ruAlumni from '../messages/ru/alumni.json';
import ruBilling from '../messages/ru/billing.json';
import ruCommon from '../messages/ru/common.json';
import ruEnrollment from '../messages/ru/enrollment.json';
import ruForms from '../messages/ru/forms.json';
import ruOpenDay from '../messages/ru/OpenDay.json';
import ruPublic from '../messages/ru/public.json';
import ruSettings from '../messages/ru/settings.json';
import ruStudent from '../messages/ru/student.json';

// Helper function to deeply merge two objects.
function deepMerge(base: any, override: any): any {
    const result = { ...base };
    for (const key in override) {
        if (Object.prototype.hasOwnProperty.call(override, key)) {
            if (
                typeof result[key] === 'object' && result[key] !== null &&
                typeof override[key] === 'object' && override[key] !== null &&
                !Array.isArray(result[key]) && !Array.isArray(override[key])
            ) {
                result[key] = deepMerge(result[key], override[key]);
            } else {
                result[key] = override[key];
            }
        }
    }
    return result;
}

const allMessages: Record<string, object[]> = {
    he: [heAdmin, heAlumni, heBilling, heCommon, heEnrollment, heForms, heOpenDay, hePublic, heSettings, heStudent],
    en: [enAdmin, enAlumni, enBilling, enCommon, enEnrollment, enForms, enOpenDay, enPublic, enSettings, enStudent],
    ar: [arAdmin, arAlumni, arBilling, arCommon, arEnrollment, arForms, arOpenDay, arPublic, arSettings, arStudent],
    ru: [ruAdmin, ruAlumni, ruBilling, ruCommon, ruEnrollment, ruForms, ruOpenDay, ruPublic, ruSettings, ruStudent],
};

function mergeMessages(locale: string): object {
    const files = allMessages[locale] ?? allMessages['en'];
    return files.reduce((acc, msg) => deepMerge(acc, msg), {});
}

export default getRequestConfig(async ({ requestLocale }) => {
    const resolvedLocale = await requestLocale;
    let locale = resolvedLocale;

    // Validate that the incoming `locale` parameter is valid
    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    const messages = mergeMessages(locale);
    const fallbackMessages = mergeMessages('en');

    return {
        locale,
        messages: deepMerge(fallbackMessages, messages),
    };
});
