import { describe, it, expect } from 'vitest';
import { validateIsraeliId, userBaseSchema } from '@/lib/validation/user-schema';

// Israeli ID checksum algorithm: Luhn-like mod-10 variant
// Each digit is multiplied by 1 or 2 alternately (starting with 1 for index 0)
// If result > 9, subtract 9. Sum must be divisible by 10.

describe('validateIsraeliId', () => {
  it('returns true for a known valid ID: 123456782', () => {
    expect(validateIsraeliId('123456782')).toBe(true);
  });

  it('returns true for a known valid ID: 012345674', () => {
    expect(validateIsraeliId('012345674')).toBe(true);
  });

  it('returns true for all-zeros ID (000000000)', () => {
    // 0s sum = 0, which is divisible by 10
    expect(validateIsraeliId('000000000')).toBe(true);
  });

  it('returns false for ID that fails checksum', () => {
    expect(validateIsraeliId('123456780')).toBe(false);
  });

  it('returns false for ID shorter than 9 digits', () => {
    expect(validateIsraeliId('12345678')).toBe(false);
  });

  it('returns false for ID longer than 9 digits', () => {
    expect(validateIsraeliId('1234567890')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateIsraeliId('')).toBe(false);
  });

  it('returns false for non-numeric characters', () => {
    expect(validateIsraeliId('abcdefghi')).toBe(false);
  });

  it('returns false for ID with spaces', () => {
    expect(validateIsraeliId('123 4567 8')).toBe(false);
  });

  it('handles digits at boundary: digit * 2 > 9 gets subtracted correctly', () => {
    // 012345674 is documented valid — index 1 is '1' multiplied by 2 = 2, fine
    // tests that the d -= 9 branch fires for d > 9
    // Use a known ID where at least one position * 2 > 9
    expect(validateIsraeliId('012345674')).toBe(true);
  });
});

describe('userBaseSchema', () => {
  it('accepts a valid 9-digit Israeli ID', () => {
    const result = userBaseSchema.safeParse({ nationalId: '123456782' });
    expect(result.success).toBe(true);
  });

  it('rejects ID with fewer than 9 digits (regex)', () => {
    const result = userBaseSchema.safeParse({ nationalId: '12345678' });
    expect(result.success).toBe(false);
  });

  it('rejects ID with more than 9 digits (regex)', () => {
    const result = userBaseSchema.safeParse({ nationalId: '1234567890' });
    expect(result.success).toBe(false);
  });

  it('rejects non-digit characters (regex)', () => {
    const result = userBaseSchema.safeParse({ nationalId: '1234567ab' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string (min length)', () => {
    const result = userBaseSchema.safeParse({ nationalId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a 9-digit string that fails checksum (refine)', () => {
    const result = userBaseSchema.safeParse({ nationalId: '123456780' });
    expect(result.success).toBe(false);
  });

  it('rejects missing nationalId field', () => {
    const result = userBaseSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
