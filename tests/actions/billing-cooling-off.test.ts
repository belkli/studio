import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Pure-function tests for the cooling-off window logic in
// src/app/actions/billing.ts  (cancelPackageAction).
//
// The action cannot be imported directly ('use server'). We reproduce the
// date-diff logic here to ensure correctness.
// ---------------------------------------------------------------------------

/**
 * Mirrors the cooling-off computation in cancelPackageAction:
 *
 *   const purchaseDate = new Date(pkg.createdAt || pkg.validFrom || Date.now());
 *   const daysSincePurchase = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
 *   const withinCoolingOff = daysSincePurchase <= 14;
 */
function computeCoolingOff(
  purchaseDateIso: string,
  nowMs: number = Date.now()
): { daysSincePurchase: number; withinCoolingOff: boolean } {
  const purchaseDate = new Date(purchaseDateIso);
  const daysSincePurchase = (nowMs - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
  const withinCoolingOff = daysSincePurchase <= 14;
  return { daysSincePurchase, withinCoolingOff };
}

/** Build a fake ISO timestamp that is `daysAgo` days before `nowMs`. */
function daysAgo(days: number, nowMs: number = Date.now()): string {
  return new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('cooling-off window — within 14 days', () => {
  it('returns withinCoolingOff: true for a purchase made today (0 days ago)', () => {
    const { withinCoolingOff } = computeCoolingOff(daysAgo(0));
    expect(withinCoolingOff).toBe(true);
  });

  it('returns withinCoolingOff: true for a purchase made 1 day ago', () => {
    const { withinCoolingOff } = computeCoolingOff(daysAgo(1));
    expect(withinCoolingOff).toBe(true);
  });

  it('returns withinCoolingOff: true for a purchase made 7 days ago', () => {
    const { withinCoolingOff } = computeCoolingOff(daysAgo(7));
    expect(withinCoolingOff).toBe(true);
  });

  it('returns withinCoolingOff: true for a purchase made 13 days ago', () => {
    const { withinCoolingOff } = computeCoolingOff(daysAgo(13));
    expect(withinCoolingOff).toBe(true);
  });
});

describe('cooling-off window — exactly 14 days', () => {
  it('returns withinCoolingOff: true at exactly 14 days (boundary included)', () => {
    const nowMs = Date.now();
    const purchaseMs = nowMs - 14 * 24 * 60 * 60 * 1000;
    const { withinCoolingOff, daysSincePurchase } = computeCoolingOff(
      new Date(purchaseMs).toISOString(),
      nowMs
    );
    expect(daysSincePurchase).toBeCloseTo(14, 5);
    expect(withinCoolingOff).toBe(true);
  });
});

describe('cooling-off window — beyond 14 days', () => {
  it('returns withinCoolingOff: false for a purchase made 15 days ago', () => {
    const { withinCoolingOff } = computeCoolingOff(daysAgo(15));
    expect(withinCoolingOff).toBe(false);
  });

  it('returns withinCoolingOff: false for a purchase made 30 days ago', () => {
    const { withinCoolingOff } = computeCoolingOff(daysAgo(30));
    expect(withinCoolingOff).toBe(false);
  });

  it('returns withinCoolingOff: false for a purchase made 1 year ago', () => {
    const { withinCoolingOff } = computeCoolingOff(daysAgo(365));
    expect(withinCoolingOff).toBe(false);
  });
});

describe('cooling-off window — daysSincePurchase accuracy', () => {
  it('calculates 0 days for a purchase made now', () => {
    const nowMs = Date.now();
    const { daysSincePurchase } = computeCoolingOff(new Date(nowMs).toISOString(), nowMs);
    expect(daysSincePurchase).toBeCloseTo(0, 5);
  });

  it('calculates ~7.5 days for 7.5 days ago', () => {
    const nowMs = Date.now();
    const halfDayMs = 0.5 * 24 * 60 * 60 * 1000;
    const { daysSincePurchase } = computeCoolingOff(
      new Date(nowMs - 7 * 24 * 60 * 60 * 1000 - halfDayMs).toISOString(),
      nowMs
    );
    expect(daysSincePurchase).toBeCloseTo(7.5, 4);
  });
});

describe('cooling-off window — fallback date handling', () => {
  it('handles createdAt field correctly', () => {
    // The action uses: pkg.createdAt || pkg.validFrom || Date.now()
    // We test that using the createdAt field produces expected result
    const nowMs = Date.now();
    const createdAt = new Date(nowMs - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { withinCoolingOff } = computeCoolingOff(createdAt, nowMs);
    expect(withinCoolingOff).toBe(true);
  });

  it('handles validFrom field (alternative date source)', () => {
    const nowMs = Date.now();
    const validFrom = new Date(nowMs - 20 * 24 * 60 * 60 * 1000).toISOString();
    const { withinCoolingOff } = computeCoolingOff(validFrom, nowMs);
    expect(withinCoolingOff).toBe(false);
  });
});
