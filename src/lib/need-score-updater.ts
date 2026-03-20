/**
 * @fileoverview Pure utility for computing NeedScore updates for all eligible conservatoria.
 * Used by the hourly cron job (/api/cron/need-score-update).
 */
import type { Conservatorium, ScholarshipApplication } from '@/lib/types';
import { computeNeedScore, type NeedScoreInput } from './need-score';

export interface NeedScoreUpdateResult {
  conservatoriumId: string;
  oldScore: number;
  newScore: number;
  section46Enabled: boolean;
}

export function buildNeedScoreInputs(
  conservatorium: Conservatorium,
  pendingApplications: ScholarshipApplication[],
  now: Date,
): NeedScoreInput {
  const donations = conservatorium.donations;
  const balance = donations?.currentFundBalance ?? 0;
  const target = donations?.annualDonationTarget ?? 1;

  // Weighted aid demand: sum of (aiScore.score/100) for submitted/under-review apps, normalized
  const apps = pendingApplications.filter(
    (a) => a.conservatoriumId === conservatorium.id &&
      (a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'DOCUMENTS_PENDING'),
  );
  const weightedDemand =
    apps.length > 0
      ? apps.reduce((sum, a) => sum + ((a.aiScore?.score ?? 50) / 100), 0) /
        Math.max(apps.length, 1)
      : 0;

  // Socioeconomic bonus — placeholder until CSO data is integrated
  const socioeconomicClusterBonus = 0.3;

  // Utilization: enrolled students / capacity (no capacity field yet — use 0.7 default)
  const utilizationRate = 0.7;

  // Days since last donation
  const lastDonationDate = donations?.needScoreUpdatedAt
    ? new Date(donations.needScoreUpdatedAt)
    : null;
  const daysSinceLastDonation = lastDonationDate
    ? Math.floor(
        (now.getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24),
      )
    : 30;

  return {
    weightedAidDemand: weightedDemand,
    currentFundBalance: balance,
    annualDonationTarget: target,
    socioeconomicClusterBonus,
    utilizationRate,
    daysSinceLastDonation,
    platformWeightAdjustment: donations?.platformWeightAdjustment ?? 0,
  };
}

export { computeNeedScore };
