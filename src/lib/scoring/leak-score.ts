import { LeakScoreBreakdown, PriceDriftAnalysis } from '../../types';
import { LEAK_SCORE_WEIGHTS } from '../constants';

export interface LeakScoreInput {
  isDormant: boolean;
  priceDrift: PriceDriftAnalysis;
  categoryCountInGroup: number; // How many active subs in this category
  monthlyCost: number;
  totalMonthlySpend: number;
}

export function calculateLeakScore(input: LeakScoreInput): LeakScoreBreakdown {
  const explanation: string[] = [];

  // 1. Dormancy Score (Weight 0.4)
  let dormancyScore = 0;
  if (input.isDormant) {
    dormancyScore = 100;
    explanation.push('Flagged as dormant / unused (40% weight impact)');
  } else {
    explanation.push('Active usage confirmed');
  }

  // 2. Price Drift Score (Weight 0.3)
  let priceDriftScore = 0;
  if (input.priceDrift.type === 'price_hike') {
    const change = Math.max(0, input.priceDrift.percentageChange);
    priceDriftScore = Math.min(100, Math.round(50 + change * 2));
    explanation.push(`Unannounced price hike detected (+${input.priceDrift.percentageChange}%)`);
  } else if (input.priceDrift.type === 'one_off_spike') {
    priceDriftScore = 60;
    explanation.push('Irregular price anomaly / spike detected');
  } else {
    explanation.push('Stable price history');
  }

  // 3. Redundancy Score (Weight 0.2)
  let redundancyScore = 0;
  if (input.categoryCountInGroup >= 3) {
    redundancyScore = 100;
    explanation.push(`High category redundancy (${input.categoryCountInGroup} active subs in category)`);
  } else if (input.categoryCountInGroup === 2) {
    redundancyScore = 60;
    explanation.push(`Moderate category overlap (${input.categoryCountInGroup} active subs in category)`);
  } else {
    explanation.push('Unique subscription category');
  }

  // 4. Cost Share Score (Weight 0.1)
  let costShareScore = 0;
  if (input.totalMonthlySpend > 0) {
    const shareRatio = input.monthlyCost / input.totalMonthlySpend;
    costShareScore = Math.min(100, Math.round(shareRatio * 250));
    explanation.push(`Cost share: ${(shareRatio * 100).toFixed(1)}% of total monthly spend`);
  } else {
    explanation.push('Cost share: 0% (single subscription detected)');
  }

  // Composite Formula calculation using explicit constants
  const rawComposite =
    LEAK_SCORE_WEIGHTS.DORMANCY * dormancyScore +
    LEAK_SCORE_WEIGHTS.PRICE_DRIFT * priceDriftScore +
    LEAK_SCORE_WEIGHTS.REDUNDANCY * redundancyScore +
    LEAK_SCORE_WEIGHTS.COST_SHARE * costShareScore;

  const totalScore = Math.min(100, Math.max(0, Math.round(rawComposite)));

  return {
    totalScore,
    dormancyScore,
    priceDriftScore,
    redundancyScore,
    costShareScore,
    explanation,
  };
}
