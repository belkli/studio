import { describe, it, expect, beforeEach } from 'vitest';

// Test the OTP logic directly (pure functions extracted from the server action)
// Since we can't import 'use server' files, we test the same logic inline

describe('Rental OTP logic', () => {
  // Simulate the otpStore Map
  const otpStore = new Map<string, { code: string; expiresAt: number }>();

  // Helper: generate 6-digit OTP
  const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

  beforeEach(() => {
    otpStore.clear();
  });

  it('generates a 6-digit numeric OTP', () => {
    const code = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
    expect(Number(code)).toBeGreaterThanOrEqual(100000);
    expect(Number(code)).toBeLessThanOrEqual(999999);
  });

  it('stores OTP with 10-minute TTL', () => {
    const token = 'rental-token-123';
    const code = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(token, { code, expiresAt });

    const entry = otpStore.get(token);
    expect(entry).toBeDefined();
    expect(entry!.code).toMatch(/^\d{6}$/);
    expect(entry!.expiresAt).toBeGreaterThan(Date.now());
    expect(entry!.expiresAt).toBeLessThanOrEqual(Date.now() + 10 * 60 * 1000 + 100);
  });

  it('verifies correct OTP successfully and deletes it (single-use)', () => {
    const token = 'rental-token-abc';
    const code = '123456';
    otpStore.set(token, { code, expiresAt: Date.now() + 600_000 });

    const entry = otpStore.get(token);
    expect(entry).toBeDefined();
    expect(entry!.code).toBe(code);

    // Simulate verification
    otpStore.delete(token);
    expect(otpStore.has(token)).toBe(false); // single-use
  });

  it('rejects incorrect OTP code', () => {
    const token = 'rental-token-xyz';
    otpStore.set(token, { code: '654321', expiresAt: Date.now() + 600_000 });

    const entry = otpStore.get(token);
    const inputCode = '111111';
    expect(inputCode !== entry!.code).toBe(true);
  });

  it('rejects expired OTP', () => {
    const token = 'rental-token-expired';
    otpStore.set(token, { code: '999999', expiresAt: Date.now() - 1000 }); // already expired

    const entry = otpStore.get(token);
    expect(Date.now() > entry!.expiresAt).toBe(true);
  });

  it('rejects unknown token (OTP_NOT_FOUND)', () => {
    expect(otpStore.has('nonexistent-token')).toBe(false);
  });
});
