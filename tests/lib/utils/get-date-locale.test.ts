import { describe, it, expect } from 'vitest';
import { getDateLocale } from '@/lib/utils/get-date-locale';
import { he, ar, ru, enUS } from 'date-fns/locale';

describe('getDateLocale', () => {
  it('returns he locale for "he"', () => {
    expect(getDateLocale('he')).toBe(he);
  });

  it('returns ar locale for "ar"', () => {
    expect(getDateLocale('ar')).toBe(ar);
  });

  it('returns ru locale for "ru"', () => {
    expect(getDateLocale('ru')).toBe(ru);
  });

  it('returns enUS locale for "en"', () => {
    expect(getDateLocale('en')).toBe(enUS);
  });

  it('returns he locale for unknown locale key (default)', () => {
    expect(getDateLocale('fr')).toBe(he);
    expect(getDateLocale('')).toBe(he);
    expect(getDateLocale('xx')).toBe(he);
  });
});
