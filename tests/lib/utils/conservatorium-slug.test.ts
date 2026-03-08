import { describe, it, expect } from 'vitest';
import {
  buildConservatoriumSlug,
  extractConservatoriumIdFromSlug,
} from '@/lib/utils/conservatorium-slug';

describe('buildConservatoriumSlug', () => {
  it('uses nameEn when provided', () => {
    const slug = buildConservatoriumSlug({ id: 'cons-1', name: 'שם עברי', nameEn: 'Tel Aviv Music School' });
    expect(slug).toBe('tel-aviv-music-school__cons-1');
  });

  it('falls back to name when nameEn is absent', () => {
    const slug = buildConservatoriumSlug({ id: 'cons-2', name: 'Haifa Music' });
    expect(slug).toBe('haifa-music__cons-2');
  });

  it('strips non-ASCII characters from name (Hebrew falls through to "conservatory" base)', () => {
    const slug = buildConservatoriumSlug({ id: 'cons-3', name: 'מוזיקה' });
    // After stripping non-ascii and trimming dashes, we get 'conservatory' fallback
    expect(slug).toBe('conservatory__cons-3');
  });

  it('collapses multiple spaces into single dash', () => {
    const slug = buildConservatoriumSlug({ id: 'cons-4', name: '', nameEn: 'The   Big   School' });
    expect(slug).toBe('the-big-school__cons-4');
  });

  it('collapses consecutive dashes', () => {
    const slug = buildConservatoriumSlug({ id: 'cons-5', name: '', nameEn: 'A---B' });
    expect(slug).toBe('a-b__cons-5');
  });

  it('strips leading and trailing dashes', () => {
    const slug = buildConservatoriumSlug({ id: 'cons-6', name: '', nameEn: '-School Name-' });
    expect(slug).toBe('school-name__cons-6');
  });

  it('converts to lowercase', () => {
    const slug = buildConservatoriumSlug({ id: 'cons-7', name: '', nameEn: 'UPPER CASE' });
    expect(slug).toBe('upper-case__cons-7');
  });

  it('truncates nameEn longer than 80 characters', () => {
    const longName = 'A'.repeat(90);
    const slug = buildConservatoriumSlug({ id: 'cons-8', name: '', nameEn: longName });
    const base = slug.split('__')[0];
    expect(base.length).toBeLessThanOrEqual(80);
  });

  it('falls back to "conservatory" when all chars are stripped and name is empty', () => {
    const slug = buildConservatoriumSlug({ id: 'cons-9', name: '', nameEn: '' });
    expect(slug).toBe('conservatory__cons-9');
  });

  it('appends id after double underscore separator', () => {
    const slug = buildConservatoriumSlug({ id: 'cons-42', name: '', nameEn: 'My School' });
    expect(slug.endsWith('__cons-42')).toBe(true);
  });
});

describe('extractConservatoriumIdFromSlug', () => {
  it('extracts id from a well-formed slug', () => {
    expect(extractConservatoriumIdFromSlug('my-school__cons-15')).toBe('cons-15');
  });

  it('returns null when no double underscore marker', () => {
    expect(extractConservatoriumIdFromSlug('no-marker-here')).toBeNull();
  });

  it('returns null when id part is empty after separator', () => {
    expect(extractConservatoriumIdFromSlug('my-school__')).toBeNull();
  });

  it('uses lastIndexOf — handles slug that contains __ in base', () => {
    // "some__thing__cons-99" — last __ is before cons-99
    expect(extractConservatoriumIdFromSlug('some__thing__cons-99')).toBe('cons-99');
  });

  it('trims whitespace from extracted id', () => {
    expect(extractConservatoriumIdFromSlug('school__  cons-1  ')).toBe('cons-1');
  });
});
