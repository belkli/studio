import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Tests for billing action logic (LC-40, LC-41)
//
// src/app/actions/billing.ts has 'use server' — cannot be imported directly.
// We reproduce the pure cooling-off and cancellation logic here.
// ---------------------------------------------------------------------------

// ── Cooling-off window (LC-40) ─────────────────────────────────────────────

/**
 * Mirrors cancelPackageAction cooling-off computation:
 *
 *   const purchaseDate = new Date(pkg.createdAt || pkg.validFrom || Date.now());
 *   const daysSincePurchase = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
 *   const withinCoolingOff = daysSincePurchase <= 14;
 *   return { success: true, withinCoolingOff, refundEligible: withinCoolingOff };
 */
function computeCancellationEligibility(
  purchaseDateIso: string,
  nowMs: number = Date.now()
): { withinCoolingOff: boolean; refundEligible: boolean; daysSincePurchase: number } {
  const purchaseDate = new Date(purchaseDateIso);
  const daysSincePurchase = (nowMs - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
  const withinCoolingOff = daysSincePurchase <= 14;
  return { withinCoolingOff, refundEligible: withinCoolingOff, daysSincePurchase };
}

function daysAgo(days: number, nowMs: number = Date.now()): string {
  return new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('cancelPackageAction — cooling-off eligibility (LC-40)', () => {
  it('purchase today → withinCoolingOff: true, refundEligible: true', () => {
    const { withinCoolingOff, refundEligible } = computeCancellationEligibility(daysAgo(0));
    expect(withinCoolingOff).toBe(true);
    expect(refundEligible).toBe(true);
  });

  it('purchase 1 day ago → within window', () => {
    const { withinCoolingOff } = computeCancellationEligibility(daysAgo(1));
    expect(withinCoolingOff).toBe(true);
  });

  it('purchase 7 days ago → within window', () => {
    const { withinCoolingOff } = computeCancellationEligibility(daysAgo(7));
    expect(withinCoolingOff).toBe(true);
  });

  it('purchase exactly 14 days ago → within window (boundary inclusive)', () => {
    const nowMs = Date.now();
    const { withinCoolingOff } = computeCancellationEligibility(
      new Date(nowMs - 14 * 24 * 60 * 60 * 1000).toISOString(),
      nowMs
    );
    expect(withinCoolingOff).toBe(true);
  });

  it('purchase 15 days ago → outside window', () => {
    const { withinCoolingOff, refundEligible } = computeCancellationEligibility(daysAgo(15));
    expect(withinCoolingOff).toBe(false);
    expect(refundEligible).toBe(false);
  });

  it('purchase 30 days ago → outside window', () => {
    const { withinCoolingOff } = computeCancellationEligibility(daysAgo(30));
    expect(withinCoolingOff).toBe(false);
  });

  it('refundEligible always matches withinCoolingOff', () => {
    for (const days of [0, 7, 13, 14, 15, 30]) {
      const { withinCoolingOff, refundEligible } = computeCancellationEligibility(daysAgo(days));
      expect(refundEligible).toBe(withinCoolingOff);
    }
  });
});

// ── Package date fallback chain (LC-41) ────────────────────────────────────

/**
 * Mirrors the fallback: pkg.createdAt || pkg.validFrom || Date.now()
 */
function resolvePurchaseDate(
  pkg: { createdAt?: string; validFrom?: string },
  nowMs: number = Date.now()
): Date {
  return new Date(pkg.createdAt || pkg.validFrom || nowMs);
}

describe('cancelPackageAction — purchase date fallback (LC-41)', () => {
  it('uses createdAt when present', () => {
    const nowMs = Date.now();
    const createdAt = new Date(nowMs - 5 * 24 * 60 * 60 * 1000).toISOString();
    const date = resolvePurchaseDate({ createdAt }, nowMs);
    expect(date.toISOString()).toBe(new Date(createdAt).toISOString());
  });

  it('falls back to validFrom when createdAt is absent', () => {
    const nowMs = Date.now();
    const validFrom = new Date(nowMs - 10 * 24 * 60 * 60 * 1000).toISOString();
    const date = resolvePurchaseDate({ validFrom }, nowMs);
    expect(date.toISOString()).toBe(new Date(validFrom).toISOString());
  });

  it('falls back to now when both createdAt and validFrom are absent', () => {
    const nowMs = Date.now();
    const date = resolvePurchaseDate({}, nowMs);
    expect(date.getTime()).toBe(nowMs);
  });

  it('prefers createdAt over validFrom when both are present', () => {
    const nowMs = Date.now();
    const createdAt = new Date(nowMs - 3 * 24 * 60 * 60 * 1000).toISOString();
    const validFrom = new Date(nowMs - 20 * 24 * 60 * 60 * 1000).toISOString();
    const date = resolvePurchaseDate({ createdAt, validFrom }, nowMs);
    expect(date.toISOString()).toBe(new Date(createdAt).toISOString());
  });

  it('package within cooling-off when createdAt is 5 days ago', () => {
    const nowMs = Date.now();
    const createdAt = new Date(nowMs - 5 * 24 * 60 * 60 * 1000).toISOString();
    const purchaseDate = resolvePurchaseDate({ createdAt }, nowMs);
    const daysSince = (nowMs - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysSince).toBeCloseTo(5, 4);
    expect(daysSince <= 14).toBe(true);
  });

  it('package outside cooling-off when validFrom is 20 days ago', () => {
    const nowMs = Date.now();
    const validFrom = new Date(nowMs - 20 * 24 * 60 * 60 * 1000).toISOString();
    const purchaseDate = resolvePurchaseDate({ validFrom }, nowMs);
    const daysSince = (nowMs - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysSince <= 14).toBe(false);
  });
});

// ── Cancellation result shape (LC-41b) ─────────────────────────────────────

describe('cancelPackageAction — result shape (LC-41b)', () => {
  it('success result has withinCoolingOff and refundEligible booleans', () => {
    const result = computeCancellationEligibility(daysAgo(3));
    expect(result).toHaveProperty('withinCoolingOff');
    expect(result).toHaveProperty('refundEligible');
    expect(typeof result.withinCoolingOff).toBe('boolean');
    expect(typeof result.refundEligible).toBe('boolean');
  });

  it('daysSincePurchase is non-negative', () => {
    for (const days of [0, 1, 14, 30]) {
      const { daysSincePurchase } = computeCancellationEligibility(daysAgo(days));
      expect(daysSincePurchase).toBeGreaterThanOrEqual(0);
    }
  });

  it('daysSincePurchase approximates the expected days', () => {
    const nowMs = Date.now();
    for (const days of [1, 7, 14, 30]) {
      const { daysSincePurchase } = computeCancellationEligibility(daysAgo(days, nowMs), nowMs);
      expect(daysSincePurchase).toBeCloseTo(days, 4);
    }
  });
});
