import { describe, it, expect } from 'vitest';
import { addVAT, formatWithVAT, vatBreakdown } from '@/lib/vat';

describe('addVAT', () => {
  it('adds 17% VAT to 100 → 117', () => {
    expect(addVAT(100)).toBe(117);
  });

  it('returns 0 for a zero price', () => {
    expect(addVAT(0)).toBe(0);
  });

  it('rounds correctly: 320 * 1.17 = 374.4 → 374', () => {
    expect(addVAT(320)).toBe(374);
  });
});

describe('formatWithVAT', () => {
  it('Hebrew locale includes ₪117 and the Hebrew VAT label כולל מע״מ', () => {
    const result = formatWithVAT(100, 'he');
    expect(result).toContain('₪117');
    expect(result).toContain('כולל מע״מ');
  });

  it('English locale includes ₪117 and "VAT"', () => {
    const result = formatWithVAT(100, 'en');
    expect(result).toContain('₪117');
    expect(result).toContain('VAT');
  });

  it('Arabic locale includes ₪117', () => {
    const result = formatWithVAT(100, 'ar');
    expect(result).toContain('₪117');
  });

  it('Russian locale includes ₪117', () => {
    const result = formatWithVAT(100, 'ru');
    expect(result).toContain('₪117');
  });

  it('falls back to Hebrew when locale is unknown', () => {
    const result = formatWithVAT(100, 'xx');
    expect(result).toContain('₪117');
    expect(result).toContain('כולל מע״מ');
  });
});

describe('vatBreakdown', () => {
  it('returns { net: 100, vat: 17, total: 117 } for 100', () => {
    expect(vatBreakdown(100)).toEqual({ net: 100, vat: 17, total: 117 });
  });

  it('returns { net: 200, vat: 34, total: 234 } for 200', () => {
    expect(vatBreakdown(200)).toEqual({ net: 200, vat: 34, total: 234 });
  });
});
