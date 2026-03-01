import { Conservatorium, User } from '@/lib/types';
import { ConservatoriumProfileTranslation, UserTranslations } from '@/lib/types';

/**
 * Returns the localized text for a specific field, falling back to the default (Hebrew)
 * if the translation doesn't exist or is empty.
 */
export function getLocalizedField(
    sourceText: string | null | undefined,
    translations: Record<string, any> | undefined,
    locale: string,
    fieldKey: string
): string {
    if (!sourceText) return '';
    if (locale === 'he' || !translations || !translations[locale]) {
        return sourceText;
    }

    const translatedValue = translations[locale][fieldKey];
    return translatedValue || sourceText;
}

/**
 * Returns a localized version of the conservatorium object for rendering
 */
export function getLocalizedConservatorium(
    cons: Conservatorium,
    locale: string
): Conservatorium & { [key: string]: any } {
    if (locale === 'he' || !cons.translations) {
        return cons;
    }

    const translations = cons.translations as Record<string, ConservatoriumProfileTranslation>;
    const localeTranslations = translations[locale];

    return {
        ...cons,
        name: getLocalizedField(cons.name, translations, locale, 'name'),
        about: getLocalizedField(cons.about, translations, locale, 'about'),
        openingHours: getLocalizedField(cons.openingHours, translations, locale, 'openingHours'),
        programs: localeTranslations?.programs || cons.programs,
        ensembles: localeTranslations?.ensembles || cons.ensembles,
        departments: cons.departments?.map((dep, idx) => ({
            ...dep,
            name: (localeTranslations?.departments && localeTranslations.departments[idx]?.name) || dep.name
        })),
        branchesInfo: cons.branchesInfo?.map((branch, idx) => ({
            ...branch,
            name: (localeTranslations?.branchesInfo && localeTranslations.branchesInfo[idx]?.name) || branch.name,
            address: (localeTranslations?.branchesInfo && localeTranslations.branchesInfo[idx]?.address) || branch.address
        })),
        // Deep copy location to avoid mutating the original
        location: cons.location ? { ...cons.location } : undefined
    };
}

/**
 * Returns a localized version of the user object (for teachers/staff)
 */
export function getLocalizedUserProfile(
    user: User,
    locale: string
): User & { [key: string]: any } {
    if (locale === 'he' || !user.translations) {
        return user;
    }

    const translations = user.translations;
    const localeKey = locale as keyof UserTranslations;
    const localizedBio = translations[localeKey]?.bio;
    const localizedRole = translations[localeKey]?.role;
    const localizedHeadline = translations[localeKey]?.headline;
    const localizedPerformanceBio = translations[localeKey]?.performanceBio;

    return {
        ...user,
        localizedBio: localizedBio || user.bio,
        localizedRole: localizedRole || user.performanceProfile?.ensembleRoles?.[0] || '', // Fallback pattern
        localizedHeadline: localizedHeadline || user.performanceProfile?.headline,
        localizedPerformanceBio: localizedPerformanceBio || user.performanceProfile?.performanceBio,
    };
}
