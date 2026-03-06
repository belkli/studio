import { describe, it, expect } from 'vitest';
import hePublic from '@/messages/he/public.json';
import enPublic from '@/messages/en/public.json';
import arPublic from '@/messages/ar/public.json';
import ruPublic from '@/messages/ru/public.json';

/**
 * REQUIRED_LANDING_KEYS
 *
 * The canonical set of keys that every locale's Landing namespace MUST define.
 * These are used by the PublicLandingPage component. Adding a key here acts
 * as a regression guard — any locale that drops a key will immediately fail.
 */
const REQUIRED_LANDING_KEYS = [
    // Hero
    'heroTitle',
    'heroSubtitle',
    'heroBadge',
    'registerCta',
    'findConservatory',

    // Stats strip
    'statConservatories',
    'statLessons',
    'statSatisfaction',
    'statStudents',

    // Find conservatory section
    'findTitle',
    'findSubtitle',
    'searchPlaceholder',
    'cityPlaceholder',
    'instrumentPlaceholder',
    'search',

    // How it works section
    'howItWorksTitle',
    'step1Title',
    'step1Desc',
    'step2Title',
    'step2Desc',
    'step3Title',
    'step3Desc',

    // Featured teachers section
    'featuredTeachersTitle',
    'bookTrialLesson',

    // Personas section
    'personasTitle',
    'personasSubtitle',
    'personaAdminTitle',
    'personaAdminDesc',
    'personaTeacherTitle',
    'personaTeacherDesc',
    'personaParentTitle',
    'personaParentDesc',
    'personaStudentTitle',
    'personaStudentDesc',
    'personaCta',

    // Upcoming events
    'upcomingEventsTitle',
    'openDaysFallback',

    // Testimonials
    'testimonialsTitle',
    'testimonial1',
    'testimonial2',
    'testimonial3',
    'testimonialAuthor1',
    'testimonialRole1',
    'testimonialAuthor2',
    'testimonialRole2',
    'testimonialAuthor3',
    'testimonialRole3',

    // Donate section
    'donateTitle',
    'donateSubtitle',
    'donateCta',
] as const;

type LandingKey = (typeof REQUIRED_LANDING_KEYS)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLanding(messages: Record<string, unknown>): Record<string, unknown> {
    return (messages['Landing'] ?? {}) as Record<string, unknown>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Landing translations completeness', () => {
    const locales: Array<{ name: string; messages: Record<string, unknown> }> = [
        { name: 'he', messages: hePublic as Record<string, unknown> },
        { name: 'en', messages: enPublic as Record<string, unknown> },
        { name: 'ar', messages: arPublic as Record<string, unknown> },
        { name: 'ru', messages: ruPublic as Record<string, unknown> },
    ];

    for (const { name, messages } of locales) {
        describe(`${name} locale`, () => {
            const landing = getLanding(messages);

            // ── Key presence & type ───────────────────────────────────────────
            for (const key of REQUIRED_LANDING_KEYS) {
                it(`has key: ${key}`, () => {
                    expect(landing[key]).toBeDefined();
                });

                it(`${key} is a non-empty string`, () => {
                    const value = landing[key];
                    expect(typeof value).toBe('string');
                    expect((value as string).trim().length).toBeGreaterThan(0);
                });
            }

            // ── Structural sanity checks ──────────────────────────────────────
            it('Landing namespace exists in public.json', () => {
                expect(messages['Landing']).toBeDefined();
                expect(typeof messages['Landing']).toBe('object');
            });

            it('Landing namespace contains at least as many keys as the required set', () => {
                const actualKeys = Object.keys(landing);
                expect(actualKeys.length).toBeGreaterThanOrEqual(REQUIRED_LANDING_KEYS.length);
            });

            it('no required key maps to an object (all must be flat strings)', () => {
                for (const key of REQUIRED_LANDING_KEYS) {
                    expect(typeof landing[key]).not.toBe('object');
                }
            });
        });
    }

    // ── Cross-locale parity ───────────────────────────────────────────────────
    describe('cross-locale parity', () => {
        it('all locales define exactly the same set of required keys', () => {
            const required = new Set<string>(REQUIRED_LANDING_KEYS);

            for (const { name, messages } of locales) {
                const landing = getLanding(messages);
                for (const key of required) {
                    expect(
                        landing[key],
                        `[${name}] missing required key: "${key}"`
                    ).toBeDefined();
                }
            }
        });

        it('hero titles are distinct across locales (not all identical)', () => {
            const heroTitles = locales.map(({ messages }) =>
                getLanding(messages)['heroTitle'] as string
            );
            const uniqueTitles = new Set(heroTitles);
            // At minimum, Hebrew and English should differ
            expect(uniqueTitles.size).toBeGreaterThan(1);
        });

        it('heroBadge is defined in every locale and is non-empty', () => {
            for (const { name, messages } of locales) {
                const badge = getLanding(messages)['heroBadge'];
                expect(typeof badge, `[${name}] heroBadge should be a string`).toBe('string');
                expect((badge as string).length, `[${name}] heroBadge should not be empty`).toBeGreaterThan(0);
            }
        });

        it('testimonialAuthor keys are present and non-empty in every locale', () => {
            const authorKeys: LandingKey[] = [
                'testimonialAuthor1',
                'testimonialAuthor2',
                'testimonialAuthor3',
            ];
            for (const { name, messages } of locales) {
                const landing = getLanding(messages);
                for (const key of authorKeys) {
                    expect(
                        (landing[key] as string)?.trim().length,
                        `[${name}] ${key} should not be empty`
                    ).toBeGreaterThan(0);
                }
            }
        });

        it('persona titles are present and non-empty in every locale', () => {
            const personaKeys: LandingKey[] = [
                'personaAdminTitle',
                'personaTeacherTitle',
                'personaParentTitle',
                'personaStudentTitle',
            ];
            for (const { name, messages } of locales) {
                const landing = getLanding(messages);
                for (const key of personaKeys) {
                    expect(
                        (landing[key] as string)?.trim().length,
                        `[${name}] ${key} should not be empty`
                    ).toBeGreaterThan(0);
                }
            }
        });

        it('step descriptions are present and non-empty in every locale', () => {
            const stepKeys: LandingKey[] = [
                'step1Desc',
                'step2Desc',
                'step3Desc',
            ];
            for (const { name, messages } of locales) {
                const landing = getLanding(messages);
                for (const key of stepKeys) {
                    expect(
                        (landing[key] as string)?.trim().length,
                        `[${name}] ${key} should not be empty`
                    ).toBeGreaterThan(0);
                }
            }
        });
    });
});
