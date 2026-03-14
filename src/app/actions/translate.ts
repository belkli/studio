'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
    ConservatoriumTranslations,
    ConservatoriumProfileTranslation,
    Conservatorium,
    UserTranslations,
    TranslationMeta,
    AnnouncementContent,
} from '@/lib/types';
import { computeConservatoriumSourceHash, computeUserSourceHash } from '@/lib/utils/translation-hash';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ── Supported target locales ──────────────────────────────────────────────────
type TargetLocale = 'en' | 'ar' | 'ru';

const LOCALE_NAMES: Record<TargetLocale, string> = {
    en: 'English',
    ar: 'Arabic (Modern Standard, right-to-left)',
    ru: 'Russian',
};

export async function translateConservatoriumProfile(
    cons: Partial<Conservatorium>,
    locales: TargetLocale[] = ['en', 'ar', 'ru'],
    existingTranslations?: ConservatoriumTranslations,
    existingOverrides?: TranslationMeta['overrides']
): Promise<{
    success: boolean;
    translations?: ConservatoriumTranslations;
    meta?: Omit<TranslationMeta, 'overrides'>;
    error?: string;
}> {

    // Build the structured source payload
    const sourcePayload = {
        name: cons.name,
        about: cons.about,
        openingHours: cons.openingHours,
        managerRole: cons.manager?.role,
        managerBio: cons.manager?.bio,
        pedagogicalCoordinatorRole: cons.pedagogicalCoordinator?.role,
        pedagogicalCoordinatorBio: cons.pedagogicalCoordinator?.bio,
        leadingTeam: cons.leadingTeam?.map(m => ({
            role: m.role,
            bio: m.bio
        })) ?? [],
        departments: cons.departments?.map(d => d.name) ?? [],
        programs: cons.programs ?? [],
        ensembles: cons.ensembles ?? [],
        branchNames: cons.branchesInfo?.map(b => b.name) ?? [],
        branchAddresses: cons.branchesInfo?.map(b => b.address ?? '') ?? [],
    };

    const prompt = `
You are a professional translator specializing in music education and cultural institutions in Israel.

Translate the following JSON object (representing a music conservatorium's public profile written in Hebrew) into ${locales.map(l => LOCALE_NAMES[l]).join(', ')}.

RULES:
1. Return ONLY a valid JSON object. No markdown, no code fences, no preamble.
2. Preserve proper nouns (names of people, instrument names, specific place names) as-is.
3. For Arabic: use Modern Standard Arabic, right-to-left appropriate phrasing.
4. Keep tone professional yet warm — this is public-facing educational content.
5. If a field is null or empty string, set it to null in the output.
6. Arrays must have the same number of items as the input array, in the same order.
7. The output JSON must have this exact structure:
{
  "en": { <translated fields> },
  "ar": { <translated fields> },
  "ru": { <translated fields> }
}

Source (Hebrew):
${JSON.stringify(sourcePayload, null, 2)}

Output JSON:`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        // Strip fences if present
        text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');

        type RawLocaleTranslation = {
            name?: string;
            about?: string;
            openingHours?: string;
            managerRole?: string;
            managerBio?: string;
            pedagogicalCoordinatorRole?: string;
            pedagogicalCoordinatorBio?: string;
            leadingTeam?: Array<{ role?: string; bio?: string }>;
            departments?: string[];
            programs?: string[];
            ensembles?: string[];
            branchNames?: string[];
            branchAddresses?: string[];
        };
        const raw = JSON.parse(text) as Record<string, RawLocaleTranslation>;

        // Map raw AI output back to ConservatoriumProfileTranslation shape
        const mapLocale = (locale: TargetLocale): ConservatoriumProfileTranslation => {
            const r: RawLocaleTranslation = raw[locale] ?? {};
            const output: ConservatoriumProfileTranslation = {};

            if (r.name) output.name = r.name;
            if (r.about) output.about = r.about;
            if (r.openingHours) output.openingHours = r.openingHours;
            if (r.managerRole || r.managerBio) output.manager = {
                role: r.managerRole ?? undefined,
                bio: r.managerBio ?? undefined,
            };
            if (r.pedagogicalCoordinatorRole || r.pedagogicalCoordinatorBio) {
                output.pedagogicalCoordinator = {
                    role: r.pedagogicalCoordinatorRole ?? undefined,
                    bio: r.pedagogicalCoordinatorBio ?? undefined,
                };
            }
            if (r.leadingTeam?.length) {
                output.leadingTeam = r.leadingTeam.map((m) => ({
                    role: m.role ?? undefined,
                    bio: m.bio ?? undefined,
                }));
            }
            if (r.departments?.length) {
                output.departments = r.departments.map((name: string) => ({ name }));
            }
            if (r.programs?.length) output.programs = r.programs;
            if (r.ensembles?.length) output.ensembles = r.ensembles;
            if (r.branchNames?.length) {
                output.branchesInfo = r.branchNames.map((name: string, i: number) => ({
                    name,
                    address: r.branchAddresses?.[i] ?? undefined,
                }));
            }

            // Preserve any fields the admin has manually overridden (don't overwrite them)
            const overriddenFields = existingOverrides?.[locale] ?? [];
            if (overriddenFields.length > 0 && existingTranslations?.[locale]) {
                const existing = existingTranslations[locale]!;
                for (const field of overriddenFields) {
                    if (field === 'name' && existing.name) output.name = existing.name;
                    if (field === 'about' && existing.about) output.about = existing.about;
                    if (field === 'openingHours' && existing.openingHours) output.openingHours = existing.openingHours;
                    if (field === 'manager.role' && existing.manager?.role) {
                        output.manager = { ...output.manager, role: existing.manager.role };
                    }
                    if (field === 'manager.bio' && existing.manager?.bio) {
                        output.manager = { ...output.manager, bio: existing.manager.bio };
                    }
                    if (field === 'pedagogicalCoordinator.role' && existing.pedagogicalCoordinator?.role) {
                        output.pedagogicalCoordinator = { ...output.pedagogicalCoordinator, role: existing.pedagogicalCoordinator.role };
                    }
                    if (field === 'pedagogicalCoordinator.bio' && existing.pedagogicalCoordinator?.bio) {
                        output.pedagogicalCoordinator = { ...output.pedagogicalCoordinator, bio: existing.pedagogicalCoordinator.bio };
                    }

                    // Handle leadingTeam overrides
                    if (field.startsWith('leadingTeam.')) {
                        const parts = field.split('.');
                        if (parts.length === 3) {
                            const idx = parseInt(parts[1], 10);
                            const key = parts[2] as 'role' | 'bio';
                            if (output.leadingTeam && output.leadingTeam[idx] && existing.leadingTeam?.[idx]) {
                                output.leadingTeam[idx][key] = existing.leadingTeam[idx][key];
                            }
                        }
                    }
                }
            }

            return output;
        };

        const translations: ConservatoriumTranslations = {};
        for (const locale of locales) translations[locale] = mapLocale(locale);

        const meta: Omit<TranslationMeta, 'overrides'> = {
            lastTranslatedAt: new Date().toISOString(),
            sourceHash: computeConservatoriumSourceHash(cons),
            translatedBy: 'AI',
            aiModel: 'gemini-1.5-flash',
        };

        return { success: true, translations, meta };

    } catch (err: unknown) {
        console.error('[translateConservatoriumProfile]', err);
        return { success: false, error: err instanceof Error ? err.message : 'Translation failed' };
    }
}

export async function translateInstrumentName(
    nameHe: string,
    locales: TargetLocale[] = ['en', 'ar', 'ru']
): Promise<{
    success: boolean;
    translations?: { en?: string; ar?: string; ru?: string };
    error?: string;
}> {
    const prompt = `Translate the following Hebrew musical instrument name into ${locales.map(l => LOCALE_NAMES[l]).join(', ')}.

Return ONLY valid JSON with no markdown or code fences:
{"en":"...","ar":"...","ru":"..."}

Hebrew instrument name: ${nameHe}`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        const raw = JSON.parse(text);
        const translations: { en?: string; ar?: string; ru?: string } = {};
        for (const locale of locales) {
            if (raw[locale]) translations[locale as 'en' | 'ar' | 'ru'] = raw[locale];
        }
        return { success: true, translations };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

export async function translateUserBio(
    bio: string, p0?: string[], translations?: UserTranslations | undefined, overrides?: { [locale: string]: string[]; } | undefined, role?: string, locales: TargetLocale[] = ['en', 'ar', 'ru']): Promise<{
        success: boolean;
        translations?: UserTranslations;
        meta?: Omit<TranslationMeta, 'overrides'>;
        error?: string;
    }> {
    const prompt = `
Translate the following music teacher's biography and job title from Hebrew to ${locales.map(l => LOCALE_NAMES[l]).join(', ')}.

Return ONLY valid JSON in this structure, no markdown:
{
  "en": { "bio": "...", "role": "..." },
  "ar": { "bio": "...", "role": "..." },
  "ru": { "bio": "...", "role": "..." }
}

Hebrew bio: ${bio}
Hebrew role/title: ${role ?? ''}
`;
    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        const raw = JSON.parse(text);

        const translations: UserTranslations = {};
        for (const locale of locales) {
            if (raw[locale]) translations[locale] = {
                bio: raw[locale].bio || undefined,
                role: raw[locale].role || undefined,
            };
        }

        return {
            success: true,
            translations,
            meta: {
                lastTranslatedAt: new Date().toISOString(),
                sourceHash: computeUserSourceHash(bio, role),
                translatedBy: 'AI',
                aiModel: 'gemini-1.5-flash',
            }
        };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

export async function translateCompositionData(
    titleHe: string,
    composerHe: string,
    locales: TargetLocale[] = ['en', 'ar', 'ru']
): Promise<{
    success: boolean;
    translations?: { title: { en?: string; ar?: string; ru?: string }; composer: { en?: string; ar?: string; ru?: string } };
    error?: string;
}> {
    const prompt = `Translate the following Hebrew classical music composition title and composer name into ${locales.map(l => LOCALE_NAMES[l]).join(', ')}.

Return ONLY valid JSON with no markdown or code fences:
{"title":{"en":"...","ar":"...","ru":"..."},"composer":{"en":"...","ar":"...","ru":"..."}}

Hebrew title: ${titleHe}
Hebrew composer: ${composerHe}`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        const raw = JSON.parse(text);
        const titleT: { en?: string; ar?: string; ru?: string } = {};
        const composerT: { en?: string; ar?: string; ru?: string } = {};
        for (const locale of locales) {
            if (raw.title?.[locale]) titleT[locale as 'en' | 'ar' | 'ru'] = raw.title[locale];
            if (raw.composer?.[locale]) composerT[locale as 'en' | 'ar' | 'ru'] = raw.composer[locale];
        }
        return { success: true, translations: { title: titleT, composer: composerT } };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

export async function translateAnnouncement(
    titleHe: string,
    bodyHe: string,
    locales: TargetLocale[] = ['en', 'ar', 'ru']
): Promise<{
    success: boolean;
    translations?: { en?: AnnouncementContent; ar?: AnnouncementContent; ru?: AnnouncementContent };
    error?: string;
}> {
    const prompt = `You are a professional translator for a music conservatorium in Israel.
This is an official announcement from a music conservatorium. Use formal language appropriate for parents, students, and teachers.

Translate the following Hebrew announcement (title and body) into ${locales.map(l => LOCALE_NAMES[l]).join(', ')}.

Return ONLY valid JSON with no markdown or code fences:
{"en":{"title":"...","body":"..."},"ar":{"title":"...","body":"..."},"ru":{"title":"...","body":"..."}}

Hebrew title: ${titleHe}
Hebrew body: ${bodyHe}`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        const raw = JSON.parse(text);
        const translations: { en?: AnnouncementContent; ar?: AnnouncementContent; ru?: AnnouncementContent } = {};
        for (const locale of locales) {
            if (raw[locale]?.title && raw[locale]?.body) {
                translations[locale as 'en' | 'ar' | 'ru'] = {
                    title: raw[locale].title,
                    body: raw[locale].body,
                };
            }
        }
        return { success: true, translations };
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}