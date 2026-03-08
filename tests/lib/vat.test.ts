import { describe, it, expect } from 'vitest';
import { addVAT, formatWithVAT, vatBreakdown, getVatRate, VAT_RATE } from '@/lib/vat';
import type { PricingConfig } from '@/lib/types';

// Israel VAT was raised from 17% to 18% on 1 January 2025.
// VAT_RATE = 0.18 in src/lib/vat.ts

describe('VAT_RATE constant', () => {
  it('equals 0.18 (18%)', () => {
    expect(VAT_RATE).toBe(0.18);
  });
});

describe('getVatRate', () => {
  it('returns VAT_RATE when no config provided', () => {
    expect(getVatRate()).toBe(0.18);
  });

  it('returns VAT_RATE when config has no vatRate', () => {
    const config = {} as PricingConfig;
    expect(getVatRate(config)).toBe(0.18);
  });

  it('returns custom vatRate from pricingConfig', () => {
    const config = { vatRate: 0.17 } as PricingConfig;
    expect(getVatRate(config)).toBe(0.17);
  });

  it('returns 0 when vatRate is explicitly 0 in config', () => {
    const config = { vatRate: 0 } as PricingConfig;
    expect(getVatRate(config)).toBe(0);
  });
});

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

  it('accepts a custom rate override', () => {
    expect(addVAT(100, 0.17)).toBe(117);
  });

  it('rounds half-up for .5 result: 1000 * 1.18 = 1180', () => {
    expect(addVAT(1000)).toBe(1180);
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

  it('uses custom rate when provided', () => {
    const result = formatWithVAT(100, 'en', 0.17);
    expect(result).toContain('₪117');
  });
});

describe('vatBreakdown', () => {
  it('returns { net: 100, vat: 18, total: 118 } for 100', () => {
    expect(vatBreakdown(100)).toEqual({ net: 100, vat: 18, total: 118 });
  });

  it('returns { net: 200, vat: 36, total: 236 } for 200', () => {
    expect(vatBreakdown(200)).toEqual({ net: 200, vat: 36, total: 236 });
  });

  it('uses custom rate when provided', () => {
    expect(vatBreakdown(100, 0.17)).toEqual({ net: 100, vat: 17, total: 117 });
  });

  it('handles zero amount', () => {
    expect(vatBreakdown(0)).toEqual({ net: 0, vat: 0, total: 0 });
  });

  it('rounds vat fraction correctly: 320 * 0.18 = 57.6 → 58', () => {
    const result = vatBreakdown(320);
    expect(result.net).toBe(320);
    expect(result.vat).toBe(58);
    expect(result.total).toBe(378);
  });
});
