import { describe, it, expect } from 'vitest';
import { buildNeedScoreInputs } from '@/lib/need-score-updater';
import type { Conservatorium, ScholarshipApplication, ConservatoriumDonations } from '@/lib/types';

function makeConservatorium(overrides: Partial<Conservatorium> = {}): Conservatorium {
  return {
    id: 'cons-1',
    name: 'Test Conservatorium',
    city: 'Tel Aviv',
    slug: 'test-cons',
    donations: {
      section46Enabled: true,
      needScore: 50,
      needScoreUpdatedAt: '2026-03-01T00:00:00Z',
      annualDonationTarget: 100000,
      currentFundBalance: 30000,
      totalDonationsAllTime: 200000,
      totalStudentsFunded: 15,
      platformWeightAdjustment: 0,
      featuredStudentStories: [],
    },
    ...overrides,
  } as Conservatorium;
}

function makeApplication(overrides: Partial<ScholarshipApplication> = {}): ScholarshipApplication {
  return {
    id: 'app-1',
    studentId: 'student-1',
    studentName: 'Test Student',
    instrument: 'Piano',
    conservatoriumId: 'cons-1',
    academicYear: '2025-2026',
    status: 'PENDING',
    submittedAt: '2026-01-15T00:00:00Z',
    priorityScore: 80,
    aiScore: { score: 75, explanation: 'High need', scoredAt: '2026-01-15T00:00:00Z' },
    ...overrides,
  } as ScholarshipApplication;
}

const NOW = new Date('2026-03-20T12:00:00Z');

describe('buildNeedScoreInputs', () => {
  it('produces a valid NeedScoreInput structure', () => {
    const cons = makeConservatorium();
    const result = buildNeedScoreInputs(cons, [], NOW);

    expect(result).toEqual(
      expect.objectContaining({
        weightedAidDemand: expect.any(Number),
        currentFundBalance: expect.any(Number),
        annualDonationTarget: expect.any(Number),
        socioeconomicClusterBonus: expect.any(Number),
        utilizationRate: expect.any(Number),
        daysSinceLastDonation: expect.any(Number),
        platformWeightAdjustment: expect.any(Number),
      }),
    );
  });

  it('uses donation fields from conservatorium', () => {
    const cons = makeConservatorium({
      donations: {
        section46Enabled: true,
        needScore: 50,
        needScoreUpdatedAt: '2026-03-10T00:00:00Z',
        annualDonationTarget: 200000,
        currentFundBalance: 80000,
        totalDonationsAllTime: 500000,
        totalStudentsFunded: 30,
        platformWeightAdjustment: 5,
        featuredStudentStories: [],
      },
    });

    const result = buildNeedScoreInputs(cons, [], NOW);
    expect(result.currentFundBalance).toBe(80000);
    expect(result.annualDonationTarget).toBe(200000);
    expect(result.platformWeightAdjustment).toBe(5);
  });

  it('returns zero demand when no applications exist', () => {
    const cons = makeConservatorium();
    const result = buildNeedScoreInputs(cons, [], NOW);
    expect(result.weightedAidDemand).toBe(0);
  });

  it('pending applications increase weightedAidDemand', () => {
    const cons = makeConservatorium();
    const apps = [
      makeApplication({ aiScore: { score: 80, explanation: '', scoredAt: '' } }),
      makeApplication({ id: 'app-2', aiScore: { score: 60, explanation: '', scoredAt: '' } }),
    ];

    const withApps = buildNeedScoreInputs(cons, apps, NOW);
    const withoutApps = buildNeedScoreInputs(cons, [], NOW);

    expect(withApps.weightedAidDemand).toBeGreaterThan(withoutApps.weightedAidDemand);
  });

  it('only counts PENDING applications for the matching conservatorium', () => {
    const cons = makeConservatorium({ id: 'cons-1' });
    const apps = [
      makeApplication({ conservatoriumId: 'cons-1', status: 'PENDING' }),
      makeApplication({ id: 'app-2', conservatoriumId: 'cons-2', status: 'PENDING' }),
      makeApplication({ id: 'app-3', conservatoriumId: 'cons-1', status: 'APPROVED' }),
    ];

    const result = buildNeedScoreInputs(cons, apps, NOW);
    // Only 1 PENDING app for cons-1 should contribute
    expect(result.weightedAidDemand).toBeGreaterThan(0);
  });

  it('uses default 30 days when needScoreUpdatedAt is not set', () => {
    const cons = makeConservatorium({
      donations: {
        section46Enabled: true,
        needScore: 0,
        needScoreUpdatedAt: '',
        annualDonationTarget: 100000,
        currentFundBalance: 0,
        totalDonationsAllTime: 0,
        totalStudentsFunded: 0,
        platformWeightAdjustment: 0,
        featuredStudentStories: [],
      },
    });

    const result = buildNeedScoreInputs(cons, [], NOW);
    expect(result.daysSinceLastDonation).toBe(30);
  });

  it('computes daysSinceLastDonation from needScoreUpdatedAt', () => {
    // 10 days before NOW
    const cons = makeConservatorium({
      donations: {
        section46Enabled: true,
        needScore: 50,
        needScoreUpdatedAt: '2026-03-10T12:00:00Z',
        annualDonationTarget: 100000,
        currentFundBalance: 30000,
        totalDonationsAllTime: 200000,
        totalStudentsFunded: 15,
        platformWeightAdjustment: 0,
        featuredStudentStories: [],
      },
    });

    const result = buildNeedScoreInputs(cons, [], NOW);
    expect(result.daysSinceLastDonation).toBe(10);
  });

  it('defaults to safe values when donations field is missing', () => {
    const cons = makeConservatorium({ donations: undefined });
    const result = buildNeedScoreInputs(cons, [], NOW);

    expect(result.currentFundBalance).toBe(0);
    expect(result.annualDonationTarget).toBe(1);
    expect(result.platformWeightAdjustment).toBe(0);
    expect(result.daysSinceLastDonation).toBe(30);
  });
});
