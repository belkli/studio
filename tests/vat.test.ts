import { describe, it, expect } from 'vitest';
import { addVAT, formatWithVAT, vatBreakdown } from '@/lib/vat';

// Israel VAT was raised from 17% to 18% on 1 January 2025.
// VAT_RATE = 0.18 in src/lib/vat.ts

describe('addVAT', () => {
  it('adds 18% VAT to 100 → 118', () => {
    expect(addVAT(100)).toBe(118);
  });

  it('returns 0 for a zero price', () => {
    expect(addVAT(0)).toBe(0);
  });

  it('rounds correctly: 320 * 1.18 = 377.6 → 378', () => {
    expect(addVAT(320)).toBe(378);
  });
});

describe('formatWithVAT', () => {
  it('Hebrew locale includes ₪118 and the Hebrew VAT label כולל מע״מ', () => {
    const result = formatWithVAT(100, 'he');
    expect(result).toContain('₪118');
    expect(result).toContain('כולל מע״מ');
  });

  it('English locale includes ₪118 and "VAT"', () => {
    const result = formatWithVAT(100, 'en');
    expect(result).toContain('₪118');
    expect(result).toContain('VAT');
  });

  it('Arabic locale includes ₪118', () => {
    const result = formatWithVAT(100, 'ar');
    expect(result).toContain('₪118');
  });

  it('Russian locale includes ₪118', () => {
    const result = formatWithVAT(100, 'ru');
    expect(result).toContain('₪118');
  });

  it('falls back to Hebrew when locale is unknown', () => {
    const result = formatWithVAT(100, 'xx');
    expect(result).toContain('₪118');
    expect(result).toContain('כולל מע״מ');
  });
});

describe('vatBreakdown', () => {
  it('returns { net: 100, vat: 18, total: 118 } for 100', () => {
    expect(vatBreakdown(100)).toEqual({ net: 100, vat: 18, total: 118 });
  });

  it('returns { net: 200, vat: 36, total: 236 } for 200', () => {
    expect(vatBreakdown(200)).toEqual({ net: 200, vat: 36, total: 236 });
  });
});
