import { describe, it, expect } from 'vitest';
import {
  getLocalizedField,
  getLocalizedConservatorium,
  getLocalizedUserProfile,
} from '@/lib/utils/localized-content';
import type { Conservatorium, User } from '@/lib/types';

// ── getLocalizedField ──────────────────────────────────────────────────────────

describe('getLocalizedField', () => {
  it('returns empty string when sourceText is null', () => {
    expect(getLocalizedField(null, {}, 'en', 'name')).toBe('');
  });

  it('returns empty string when sourceText is undefined', () => {
    expect(getLocalizedField(undefined, {}, 'en', 'name')).toBe('');
  });

  it('returns sourceText for Hebrew locale (no translation needed)', () => {
    expect(getLocalizedField('שם', { en: { name: 'Name' } }, 'he', 'name')).toBe('שם');
  });

  it('returns sourceText when translations is undefined', () => {
    expect(getLocalizedField('Hebrew text', undefined, 'en', 'name')).toBe('Hebrew text');
  });

  it('returns sourceText when locale has no translation entry', () => {
    expect(getLocalizedField('Hebrew text', { en: undefined }, 'en', 'name')).toBe('Hebrew text');
  });

  it('returns translated value for a non-Hebrew locale', () => {
    const translations = { en: { name: 'English Name' } };
    expect(getLocalizedField('שם עברי', translations, 'en', 'name')).toBe('English Name');
  });

  it('falls back to sourceText when translated value is empty string', () => {
    const translations = { en: { name: '' } };
    expect(getLocalizedField('שם', translations, 'en', 'name')).toBe('שם');
  });

  it('falls back to sourceText when translated value is null', () => {
    const translations = { en: { name: null } };
    expect(getLocalizedField('שם', translations, 'en', 'name')).toBe('שם');
  });
});

// ── getLocalizedConservatorium ─────────────────────────────────────────────────

const baseCons: Conservatorium = {
  id: 'cons-1',
  name: 'בית ספר',
  tier: 'A',
  about: 'על בית הספר',
  openingHours: 'ראשון-חמישי',
  programs: ['פסנתר', 'כינור'],
  ensembles: ['תזמורת'],
  departments: [{ name: 'מחלקת פסנתר' }],
  branchesInfo: [{ name: 'סניף מרכז', address: 'רחוב הרצל 1' }],
  leadingTeam: [{ name: 'ראש הצוות', role: 'מנהל', bio: 'ביוגרפיה' }],
};

describe('getLocalizedConservatorium', () => {
  it('returns the original object for Hebrew locale', () => {
    const result = getLocalizedConservatorium(baseCons, 'he');
    expect(result).toBe(baseCons);
  });

  it('returns the original object when no translations set', () => {
    const result = getLocalizedConservatorium(baseCons, 'en');
    expect(result).toBe(baseCons);
  });

  it('translates name, about, openingHours for non-Hebrew locale', () => {
    const consWithTranslations: Conservatorium = {
      ...baseCons,
      translations: {
        en: {
          name: 'School of Music',
          about: 'About the school',
          openingHours: 'Sun-Thu',
        },
      },
    };

    const result = getLocalizedConservatorium(consWithTranslations, 'en');
    expect(result.name).toBe('School of Music');
    expect(result.about).toBe('About the school');
    expect(result.openingHours).toBe('Sun-Thu');
  });

  it('falls back to Hebrew name when English translation is missing', () => {
    const consWithTranslations: Conservatorium = {
      ...baseCons,
      translations: { en: {} },
    };
    const result = getLocalizedConservatorium(consWithTranslations, 'en');
    expect(result.name).toBe('בית ספר');
  });

  it('translates programs when provided', () => {
    const consWithTranslations: Conservatorium = {
      ...baseCons,
      translations: { en: { programs: ['Piano', 'Violin'] } },
    };
    const result = getLocalizedConservatorium(consWithTranslations, 'en');
    expect(result.programs).toEqual(['Piano', 'Violin']);
  });

  it('falls back to original programs when not translated', () => {
    const consWithTranslations: Conservatorium = {
      ...baseCons,
      translations: { en: {} },
    };
    const result = getLocalizedConservatorium(consWithTranslations, 'en');
    expect(result.programs).toEqual(['פסנתר', 'כינור']);
  });

  it('translates departments by index when provided', () => {
    const consWithTranslations: Conservatorium = {
      ...baseCons,
      translations: { en: { departments: [{ name: 'Piano Department' }] } },
    };
    const result = getLocalizedConservatorium(consWithTranslations, 'en');
    expect(result.departments?.[0].name).toBe('Piano Department');
  });

  it('falls back to original department name when not translated', () => {
    const consWithTranslations: Conservatorium = {
      ...baseCons,
      translations: { en: {} },
    };
    const result = getLocalizedConservatorium(consWithTranslations, 'en');
    expect(result.departments?.[0].name).toBe('מחלקת פסנתר');
  });

  it('translates branchesInfo name and address', () => {
    const consWithTranslations: Conservatorium = {
      ...baseCons,
      translations: {
        en: {
          branchesInfo: [{ name: 'Central Branch', address: '1 Herzl St' }],
        },
      },
    };
    const result = getLocalizedConservatorium(consWithTranslations, 'en');
    expect(result.branchesInfo?.[0].name).toBe('Central Branch');
    expect(result.branchesInfo?.[0].address).toBe('1 Herzl St');
  });

  it('translates leadingTeam role and bio', () => {
    const consWithTranslations: Conservatorium = {
      ...baseCons,
      translations: {
        en: {
          leadingTeam: [{ role: 'Director', bio: 'Biography' }],
        },
      },
    };
    const result = getLocalizedConservatorium(consWithTranslations, 'en');
    expect(result.leadingTeam?.[0].role).toBe('Director');
    expect(result.leadingTeam?.[0].bio).toBe('Biography');
  });

  it('preserves location object (deep copied)', () => {
    const consWithLocation: Conservatorium = {
      ...baseCons,
      translations: { en: { name: 'School' } },
      location: { city: 'Tel Aviv', coordinates: { lat: 32.07, lng: 34.78 } },
    };
    const result = getLocalizedConservatorium(consWithLocation, 'en');
    expect(result.location).toEqual({ city: 'Tel Aviv', coordinates: { lat: 32.07, lng: 34.78 } });
    // Should be a copy, not the same reference
    expect(result.location).not.toBe(consWithLocation.location);
  });

  it('handles cons with no location gracefully', () => {
    const consWithTranslations: Conservatorium = {
      ...baseCons,
      translations: { en: {} },
    };
    const result = getLocalizedConservatorium(consWithTranslations, 'en');
    expect(result.location).toBeUndefined();
  });
});

// ── getLocalizedUserProfile ────────────────────────────────────────────────────

const baseUser: User = {
  id: 'user-1',
  name: 'מורה',
  email: 'teacher@example.com',
  role: 'teacher',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'בית ספר',
  approved: true,
  bio: 'ביו בעברית',
  createdAt: '2024-01-01',
};

describe('getLocalizedUserProfile', () => {
  it('returns the original user object for Hebrew locale', () => {
    const result = getLocalizedUserProfile(baseUser, 'he');
    expect(result).toBe(baseUser);
  });

  it('returns the original user when no translations set', () => {
    const result = getLocalizedUserProfile(baseUser, 'en');
    expect(result).toBe(baseUser);
  });

  it('injects localized bio when translation exists', () => {
    const userWithTranslations: User = {
      ...baseUser,
      translations: { en: { bio: 'English bio' } },
    };
    const result = getLocalizedUserProfile(userWithTranslations, 'en');
    expect((result as any).localizedBio).toBe('English bio');
  });

  it('falls back to original bio when localized bio is absent', () => {
    const userWithTranslations: User = {
      ...baseUser,
      bio: 'Hebrew bio',
      translations: { en: {} },
    };
    const result = getLocalizedUserProfile(userWithTranslations, 'en');
    expect((result as any).localizedBio).toBe('Hebrew bio');
  });

  it('injects localized role when translation exists', () => {
    const userWithTranslations: User = {
      ...baseUser,
      translations: { en: { role: 'Concert Pianist' } },
    };
    const result = getLocalizedUserProfile(userWithTranslations, 'en');
    expect((result as any).localizedRole).toBe('Concert Pianist');
  });

  it('falls back to ensembleRoles[0] when localized role is absent', () => {
    const userWithTranslations: User = {
      ...baseUser,
      performanceProfile: { ensembleRoles: ['ACCOMPANIST'] },
      translations: { en: {} },
    };
    const result = getLocalizedUserProfile(userWithTranslations, 'en');
    expect((result as any).localizedRole).toBe('ACCOMPANIST');
  });

  it('falls back to empty string when both localized role and ensembleRoles are absent', () => {
    const userWithTranslations: User = {
      ...baseUser,
      translations: { en: {} },
    };
    const result = getLocalizedUserProfile(userWithTranslations, 'en');
    expect((result as any).localizedRole).toBe('');
  });

  it('injects localized headline when translation exists', () => {
    const userWithTranslations: User = {
      ...baseUser,
      translations: { en: { headline: 'World-class Musician' } },
    };
    const result = getLocalizedUserProfile(userWithTranslations, 'en');
    expect((result as any).localizedHeadline).toBe('World-class Musician');
  });

  it('falls back to performanceProfile headline when localized headline is absent', () => {
    const userWithTranslations: User = {
      ...baseUser,
      performanceProfile: { headline: 'Hebrew Headline' },
      translations: { en: {} },
    };
    const result = getLocalizedUserProfile(userWithTranslations, 'en');
    expect((result as any).localizedHeadline).toBe('Hebrew Headline');
  });

  it('injects localized performanceBio when translation exists', () => {
    const userWithTranslations: User = {
      ...baseUser,
      translations: { en: { performanceBio: 'English performance bio' } },
    };
    const result = getLocalizedUserProfile(userWithTranslations, 'en');
    expect((result as any).localizedPerformanceBio).toBe('English performance bio');
  });
});
