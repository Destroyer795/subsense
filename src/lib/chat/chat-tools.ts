import { SubscriptionItem, DashboardSummary } from '../../types';

export interface ToolQueryResult {
  found: boolean;
  message: string;
  data?: unknown;
}

/**
 * Tool 1: Lookup subscription details by merchant name
 */
export function getSubscriptionByName(
  merchantName: string,
  subscriptions: SubscriptionItem[]
): ToolQueryResult {
  const normSearch = merchantName.toLowerCase().trim();
  const sub = subscriptions.find(
    (s) =>
      s.merchantName.toLowerCase().includes(normSearch) ||
      s.transactions.some((t) => t.merchant.toLowerCase().includes(normSearch))
  );

  if (!sub) {
    return {
      found: false,
      message: `No active subscription found matching '${merchantName}'.`,
    };
  }

  return {
    found: true,
    message: `Found subscription for ${sub.merchantName}.`,
    data: {
      id: sub.id,
      merchantName: sub.merchantName,
      category: sub.category,
      currentMonthlyAmount: sub.currentAmount,
      billingInterval: sub.billingInterval,
      leakScore: sub.leakScore.totalScore,
      isDormant: sub.isDormant,
      priceHikeDetected: sub.priceDrift.isHikeDetected,
      priceHikeChangePercent: sub.priceDrift.percentageChange,
      scoreBreakdown: {
        dormancyScore: sub.leakScore.dormancyScore,
        priceDriftScore: sub.leakScore.priceDriftScore,
        redundancyScore: sub.leakScore.redundancyScore,
        costShareScore: sub.leakScore.costShareScore,
      },
      explanations: sub.leakScore.explanation,
    },
  };
}

/**
 * Tool 2: Get top flagged subscriptions above a leak score threshold
 */
export function getTopLeaksByScore(
  minScore: number = 50,
  subscriptions: SubscriptionItem[]
): ToolQueryResult {
  const flagged = subscriptions.filter((s) => s.leakScore.totalScore >= minScore);

  return {
    found: flagged.length > 0,
    message: `Found ${flagged.length} subscriptions with leak score >= ${minScore}.`,
    data: flagged.map((s) => ({
      merchantName: s.merchantName,
      category: s.category,
      leakScore: s.leakScore.totalScore,
      monthlyCost: s.currentAmount,
      isDormant: s.isDormant,
      hikePercent: s.priceDrift.percentageChange,
    })),
  };
}

/**
 * Tool 3: Compute projected savings if specific subscriptions or a threshold are cancelled
 */
export function computeSavingsIfCancelled(
  targetSubNamesOrMinScore: string[] | number,
  subscriptions: SubscriptionItem[]
): ToolQueryResult {
  let targetSubs: SubscriptionItem[] = [];

  if (typeof targetSubNamesOrMinScore === 'number') {
    const minScore = targetSubNamesOrMinScore;
    targetSubs = subscriptions.filter((s) => s.leakScore.totalScore >= minScore);
  } else if (Array.isArray(targetSubNamesOrMinScore)) {
    const names = targetSubNamesOrMinScore.map((n) => n.toLowerCase().trim());
    targetSubs = subscriptions.filter((s) =>
      names.some((n) => s.merchantName.toLowerCase().includes(n))
    );
  }

  const monthlySavings = targetSubs.reduce((sum, s) => sum + s.currentAmount, 0);
  const annualSavings = monthlySavings * 12;

  return {
    found: targetSubs.length > 0,
    message: `Computed projected savings for ${targetSubs.length} subscription(s).`,
    data: {
      cancelledCount: targetSubs.length,
      cancelledSubscriptions: targetSubs.map((s) => s.merchantName),
      monthlySavingsINR: monthlySavings,
      annualSavingsINR: annualSavings,
    },
  };
}

/**
 * Tool 4: Get Category spend breakdown
 */
export function getCategorySpendBreakdown(subscriptions: SubscriptionItem[]): ToolQueryResult {
  const breakdown: Record<string, { spend: number; count: number; merchants: string[] }> = {};

  subscriptions.forEach((sub) => {
    if (!breakdown[sub.category]) {
      breakdown[sub.category] = { spend: 0, count: 0, merchants: [] };
    }
    breakdown[sub.category].spend += sub.currentAmount;
    breakdown[sub.category].count += 1;
    breakdown[sub.category].merchants.push(sub.merchantName);
  });

  return {
    found: Object.keys(breakdown).length > 0,
    message: 'Computed category spend breakdown.',
    data: breakdown,
  };
}
