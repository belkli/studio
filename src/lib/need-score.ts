/**
 * @fileoverview NeedScore computation for donation marketplace ranking.
 * Score drives display order only — never touches money routing.
 * Updates hourly via scheduled function (S7-T3).
 *
 * Formula:
 * NeedScore = (
 *   (Σ studentAIScores × ₪requested) × 0.40   // weighted aid demand
 *   + max(0, 1 - fundBalance/annualTarget) × 0.25  // funding gap
 *   + socioeconomicClusterBonus          × 0.20  // periphery index
 *   + (enrolledStudents/capacity)        × 0.10  // utilization
 *   + daysSinceLastDonation/30           × 0.05  // starvation prevention
 * ) × platformWeightMultiplier
 * Floor-clamped to 0, capped at 100.
 */

export interface NeedScoreInput {
  /** Weighted sum of (aiScore.score × requested_amount) for all PENDING scholarship applications, normalized to 0–1 */
  weightedAidDemand: number;
  /** Current fund balance in ILS */
  currentFundBalance: number;
  /** Annual donation target in ILS */
  annualDonationTarget: number;
  /** CSO socioeconomic cluster bonus (0–1). Clusters 1-2 = 1.0, 3-4 = 0.5, 5+ = 0 */
  socioeconomicClusterBonus: number;
  /** Enrolled students / capacity (0–1) */
  utilizationRate: number;
  /** Days since last donation received (use 30 if never donated) */
  daysSinceLastDonation: number;
  /** Platform weight adjustment: -10 to +10 (default 0) */
  platformWeightAdjustment: number;
}

export function computeNeedScore(input: NeedScoreInput): number {
  const {
    weightedAidDemand,
    currentFundBalance,
    annualDonationTarget,
    socioeconomicClusterBonus,
    utilizationRate,
    daysSinceLastDonation,
    platformWeightAdjustment,
  } = input;

  const fundingGap = annualDonationTarget > 0
    ? Math.max(0, 1 - currentFundBalance / annualDonationTarget)
    : 0;

  const starvationFactor = Math.min(daysSinceLastDonation / 30, 1);

  const platformMultiplier = 1.0 + (platformWeightAdjustment / 100);

  const raw = (
    weightedAidDemand * 0.40
    + fundingGap * 0.25
    + socioeconomicClusterBonus * 0.20
    + utilizationRate * 0.10
    + starvationFactor * 0.05
  ) * platformMultiplier;

  return Math.max(0, Math.min(100, raw * 100));
}
