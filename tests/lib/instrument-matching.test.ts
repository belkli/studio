import { describe, it, expect } from 'vitest';
import {
    normalizeInstrumentToken,
    collectInstrumentTokensFromConservatoriumInstrument,
    collectInstrumentTokensFromTeacherInstrument,
    tokenSetsIntersect,
    userHasInstrument,
} from '@/lib/instrument-matching';

// ── Fixtures ────────────────────────────────────────────────────────────────

const pianoInstrument = {
    id: 'piano-1',
    conservatoriumId: 'cons-1',
    instrumentCatalogId: 'catalog-piano',
    names: {
        he: 'פסנתר',
        en: 'Piano',
        ar: 'بيانو',
        ru: 'Пианино',
    },
};

const violinInstrument = {
    id: 'violin-1',
    conservatoriumId: 'cons-1',
    instrumentCatalogId: 'catalog-violin',
    names: {
        he: 'כינור',
        en: 'Violin',
        ar: 'كمان',
        ru: 'Скрипка',
    },
};

const guitarInstrument = {
    id: 'guitar-1',
    conservatoriumId: 'cons-2',
    instrumentCatalogId: 'catalog-guitar',
    names: {
        he: 'גיטרה',
        en: 'Guitar',
        // No ar or ru on purpose — optional fields
    },
};

const minimalInstrument = {
    id: 'min-inst',
    names: {
        he: 'חליל',
        en: 'Flute',
    },
};

// ── normalizeInstrumentToken ─────────────────────────────────────────────────

describe('normalizeInstrumentToken', () => {
    it('lowercases and trims a plain string', () => {
        expect(normalizeInstrumentToken('  Piano  ')).toBe('piano');
    });

    it('handles empty string', () => {
        expect(normalizeInstrumentToken('')).toBe('');
    });

    it('handles null', () => {
        expect(normalizeInstrumentToken(null)).toBe('');
    });

    it('handles undefined', () => {
        expect(normalizeInstrumentToken(undefined)).toBe('');
    });

    it('preserves non-latin characters (Hebrew)', () => {
        expect(normalizeInstrumentToken('פסנתר')).toBe('פסנתר');
    });

    it('lowercases mixed-case ASCII', () => {
        expect(normalizeInstrumentToken('VIOLIN')).toBe('violin');
    });
});

// ── collectInstrumentTokensFromConservatoriumInstrument ─────────────────────

describe('collectInstrumentTokensFromConservatoriumInstrument', () => {
    it('includes the instrument id as a token', () => {
        const tokens = collectInstrumentTokensFromConservatoriumInstrument(pianoInstrument);
        expect(tokens.has('piano-1')).toBe(true);
    });

    it('includes the instrumentCatalogId as a token', () => {
        const tokens = collectInstrumentTokensFromConservatoriumInstrument(pianoInstrument);
        expect(tokens.has('catalog-piano')).toBe(true);
    });

    it('includes the Hebrew name as a token', () => {
        const tokens = collectInstrumentTokensFromConservatoriumInstrument(pianoInstrument);
        expect(tokens.has('פסנתר')).toBe(true);
    });

    it('includes the English name lowercased', () => {
        const tokens = collectInstrumentTokensFromConservatoriumInstrument(pianoInstrument);
        expect(tokens.has('piano')).toBe(true);
    });

    it('includes the Arabic name when present', () => {
        const tokens = collectInstrumentTokensFromConservatoriumInstrument(pianoInstrument);
        expect(tokens.has('بيانو')).toBe(true);
    });

    it('includes the Russian name when present', () => {
        const tokens = collectInstrumentTokensFromConservatoriumInstrument(pianoInstrument);
        expect(tokens.has('пианино')).toBe(true);
    });

    it('does not add empty tokens for missing optional language fields', () => {
        const tokens = collectInstrumentTokensFromConservatoriumInstrument(guitarInstrument);
        // No Arabic or Russian — the empty string should be filtered out
        expect(tokens.has('')).toBe(false);
    });

    it('returns a Set', () => {
        const tokens = collectInstrumentTokensFromConservatoriumInstrument(pianoInstrument);
        expect(tokens).toBeInstanceOf(Set);
    });

    it('works with a minimal instrument (no catalogId, no ar/ru)', () => {
        const tokens = collectInstrumentTokensFromConservatoriumInstrument(minimalInstrument);
        expect(tokens.has('min-inst')).toBe(true);
        expect(tokens.has('חליל')).toBe(true);
        expect(tokens.has('flute')).toBe(true);
        // instrumentCatalogId is undefined — should not produce a token
        expect(tokens.has('undefined')).toBe(false);
    });

    it('all tokens are non-empty strings', () => {
        const tokens = collectInstrumentTokensFromConservatoriumInstrument(pianoInstrument);
        for (const token of tokens) {
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        }
    });
});

// ── collectInstrumentTokensFromTeacherInstrument ─────────────────────────────

describe('collectInstrumentTokensFromTeacherInstrument', () => {
    const conservatoriumInstruments = [pianoInstrument, violinInstrument, guitarInstrument];

    it('returns an empty Set for an empty instrument value', () => {
        const tokens = collectInstrumentTokensFromTeacherInstrument('', conservatoriumInstruments);
        expect(tokens.size).toBe(0);
    });

    it('returns an empty Set for a whitespace-only instrument value', () => {
        const tokens = collectInstrumentTokensFromTeacherInstrument('   ', conservatoriumInstruments);
        expect(tokens.size).toBe(0);
    });

    it('always adds the normalized teacher value itself as a token', () => {
        const tokens = collectInstrumentTokensFromTeacherInstrument('Piano', conservatoriumInstruments);
        expect(tokens.has('piano')).toBe(true);
    });

    it('expands tokens by matching against conservatoriumInstruments via English name', () => {
        const tokens = collectInstrumentTokensFromTeacherInstrument('Piano', conservatoriumInstruments);
        // 'piano' matches pianoInstrument.names.en — should expand to include Hebrew, etc.
        expect(tokens.has('פסנתר')).toBe(true);
        expect(tokens.has('piano-1')).toBe(true);
        expect(tokens.has('catalog-piano')).toBe(true);
    });

    it('expands tokens by matching via Hebrew name', () => {
        const tokens = collectInstrumentTokensFromTeacherInstrument('פסנתר', conservatoriumInstruments);
        expect(tokens.has('piano')).toBe(true);
        expect(tokens.has('piano-1')).toBe(true);
    });

    it('expands tokens by matching via instrument id', () => {
        const tokens = collectInstrumentTokensFromTeacherInstrument('violin-1', conservatoriumInstruments);
        expect(tokens.has('violin')).toBe(true);
        expect(tokens.has('כינור')).toBe(true);
    });

    it('filters by conservatoriumId when provided', () => {
        // guitar-1 belongs to cons-2; searching under cons-1 should NOT expand to guitar tokens
        const tokens = collectInstrumentTokensFromTeacherInstrument(
            'Guitar',
            conservatoriumInstruments,
            'cons-1'
        );
        // The raw value 'guitar' is still added, but no expansion from the guitar catalog item
        expect(tokens.has('guitar')).toBe(true);
        expect(tokens.has('guitar-1')).toBe(false);
        expect(tokens.has('גיטרה')).toBe(false);
    });

    it('does not filter by conservatoriumId when conservatoriumId is omitted', () => {
        const tokens = collectInstrumentTokensFromTeacherInstrument(
            'Guitar',
            conservatoriumInstruments
            // no conservatoriumId
        );
        expect(tokens.has('guitar-1')).toBe(true);
        expect(tokens.has('גיטרה')).toBe(true);
    });

    it('returns a Set', () => {
        const tokens = collectInstrumentTokensFromTeacherInstrument('Piano', conservatoriumInstruments);
        expect(tokens).toBeInstanceOf(Set);
    });

    it('does not expand when the instrument value matches no catalog entry', () => {
        const tokens = collectInstrumentTokensFromTeacherInstrument(
            'Theremin',
            conservatoriumInstruments
        );
        // Only the raw normalized value should be present
        expect(tokens.size).toBe(1);
        expect(tokens.has('theremin')).toBe(true);
    });
});

// ── tokenSetsIntersect ────────────────────────────────────────────────────────

describe('tokenSetsIntersect', () => {
    it('returns false when both sets are empty', () => {
        expect(tokenSetsIntersect(new Set(), new Set())).toBe(false);
    });

    it('returns false when set a is empty', () => {
        expect(tokenSetsIntersect(new Set(), new Set(['piano']))).toBe(false);
    });

    it('returns false when set b is empty', () => {
        expect(tokenSetsIntersect(new Set(['piano']), new Set())).toBe(false);
    });

    it('returns false when sets have no common tokens', () => {
        const a = new Set(['piano', 'פסנתר']);
        const b = new Set(['violin', 'כינור']);
        expect(tokenSetsIntersect(a, b)).toBe(false);
    });

    it('returns true when sets share exactly one token', () => {
        const a = new Set(['piano', 'פסנתר']);
        const b = new Set(['guitar', 'piano']);
        expect(tokenSetsIntersect(a, b)).toBe(true);
    });

    it('returns true when sets share multiple tokens', () => {
        const a = new Set(['piano', 'פסנתר', 'catalog-piano']);
        const b = new Set(['piano', 'פסנתר']);
        expect(tokenSetsIntersect(a, b)).toBe(true);
    });

    it('returns true when sets are identical', () => {
        const a = new Set(['violin']);
        const b = new Set(['violin']);
        expect(tokenSetsIntersect(a, b)).toBe(true);
    });

    it('is sensitive to token case (tokens should already be normalized)', () => {
        // All tokens entering this function should be pre-normalized — 'Piano' !== 'piano'
        const a = new Set(['Piano']);
        const b = new Set(['piano']);
        expect(tokenSetsIntersect(a, b)).toBe(false);
    });
});

// ── userHasInstrument ─────────────────────────────────────────────────────────

describe('userHasInstrument', () => {
    const conservatoriumInstruments = [pianoInstrument, violinInstrument, guitarInstrument];

    it('returns true when no selectedInstrumentValue is provided', () => {
        expect(userHasInstrument(['piano'], null, conservatoriumInstruments)).toBe(true);
        expect(userHasInstrument(['piano'], undefined, conservatoriumInstruments)).toBe(true);
        expect(userHasInstrument(['piano'], '', conservatoriumInstruments)).toBe(true);
    });

    it('returns true when user teaches the selected instrument (by English name)', () => {
        expect(userHasInstrument(['Piano'], 'Piano', conservatoriumInstruments)).toBe(true);
    });

    it('returns true when user teaches the selected instrument via Hebrew name', () => {
        expect(userHasInstrument(['פסנתר'], 'Piano', conservatoriumInstruments)).toBe(true);
    });

    it('returns true when user instrument matches via catalog id', () => {
        expect(userHasInstrument(['catalog-piano'], 'Piano', conservatoriumInstruments)).toBe(true);
    });

    it('returns false when user teaches a different instrument', () => {
        expect(userHasInstrument(['Violin'], 'Piano', conservatoriumInstruments)).toBe(false);
    });

    it('returns false when userInstrumentValues is undefined', () => {
        expect(userHasInstrument(undefined, 'Piano', conservatoriumInstruments)).toBe(false);
    });

    it('returns false when userInstrumentValues is empty', () => {
        expect(userHasInstrument([], 'Piano', conservatoriumInstruments)).toBe(false);
    });

    it('returns false for null/undefined entries in userInstrumentValues', () => {
        expect(
            userHasInstrument([null, undefined], 'Piano', conservatoriumInstruments)
        ).toBe(false);
    });

    it('matches across cross-locale token expansion', () => {
        // User has 'بيانو' (Arabic for Piano), selected instrument is 'Piano'
        expect(userHasInstrument(['بيانو'], 'piano-1', conservatoriumInstruments)).toBe(true);
    });

    it('respects conservatoriumId scoping', () => {
        // guitar-1 is in cons-2; filtering by cons-1 should not match
        const result = userHasInstrument(
            ['guitar'],
            'Guitar',
            conservatoriumInstruments,
            'cons-1'
        );
        // 'guitar' normalizes the same way but no expansion occurs from cons-2
        // Both selectedTokens and teacherTokens only contain 'guitar' → they DO intersect
        expect(result).toBe(true);
    });
});
