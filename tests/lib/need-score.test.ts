import { describe, it, expect } from 'vitest';
import { computeNeedScore } from '@/lib/need-score';

describe('computeNeedScore', () => {
  const baseInput = {
    weightedAidDemand: 0.5,
    currentFundBalance: 50000,
    annualDonationTarget: 100000,
    socioeconomicClusterBonus: 0.5,
    utilizationRate: 0.8,
    daysSinceLastDonation: 15,
    platformWeightAdjustment: 0,
  };

  it('returns a number between 0 and 100', () => {
    const score = computeNeedScore(baseInput);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('higher aid demand increases score', () => {
    const low = computeNeedScore({ ...baseInput, weightedAidDemand: 0.1 });
    const high = computeNeedScore({ ...baseInput, weightedAidDemand: 0.9 });
    expect(high).toBeGreaterThan(low);
  });

  it('floor-clamps to 0 for negative raw values', () => {
    const score = computeNeedScore({
      weightedAidDemand: 0,
      currentFundBalance: 200000,
      annualDonationTarget: 100000,
      socioeconomicClusterBonus: 0,
      utilizationRate: 0,
      daysSinceLastDonation: 0,
      platformWeightAdjustment: -10,
    });
    expect(score).toBe(0);
  });

  it('caps at 100 for maximum inputs', () => {
    const score = computeNeedScore({
      weightedAidDemand: 1,
      currentFundBalance: 0,
      annualDonationTarget: 100000,
      socioeconomicClusterBonus: 1,
      utilizationRate: 1,
      daysSinceLastDonation: 60,
      platformWeightAdjustment: 10,
    });
    expect(score).toBeLessThanOrEqual(100);
  });

  it('platformWeightAdjustment scales score proportionally', () => {
    const neutral = computeNeedScore({ ...baseInput, platformWeightAdjustment: 0 });
    const boosted = computeNeedScore({ ...baseInput, platformWeightAdjustment: 10 });
    expect(boosted).toBeGreaterThan(neutral);
  });

  it('fully-funded conservatorium gets zero funding gap component', () => {
    const fullyFunded = computeNeedScore({
      ...baseInput,
      currentFundBalance: 100000,
      annualDonationTarget: 100000,
    });
    const unfunded = computeNeedScore({
      ...baseInput,
      currentFundBalance: 0,
      annualDonationTarget: 100000,
    });
    expect(unfunded).toBeGreaterThan(fullyFunded);
  });
});
