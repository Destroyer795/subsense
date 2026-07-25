import { SubscriptionCategory } from '../types';

/**
 * Category Benchmark Reference Data (Indian FinTech Market Averages)
 * Note: These figures are illustrative market baseline references for hackathon demonstration.
 */
export interface CategoryBenchmarkInfo {
  category: SubscriptionCategory;
  averageMarketMonthlyINR: number;
  typicalTierDescription: string;
}

export const CATEGORY_BENCHMARKS: Record<SubscriptionCategory, CategoryBenchmarkInfo> = {
  'OTT & Streaming': {
    category: 'OTT & Streaming',
    averageMarketMonthlyINR: 499, // Typical Indian multi-screen HD tier average
    typicalTierDescription: 'Standard HD Multi-screen plan (range ₹149 - ₹649)',
  },
  'Developer & SaaS': {
    category: 'Developer & SaaS',
    averageMarketMonthlyINR: 999, // ~12 USD equivalent standard seat
    typicalTierDescription: 'Pro developer tier / AI assistant seat',
  },
  'Fitness & Health': {
    category: 'Fitness & Health',
    averageMarketMonthlyINR: 1250, // Standard gym / fitness app membership
    typicalTierDescription: 'Monthly pass / gym access membership',
  },
  'Food & Dining': {
    category: 'Food & Dining',
    averageMarketMonthlyINR: 199, // Typical quarterly swiggy/zomato monthly share
    typicalTierDescription: 'VIP delivery membership tier',
  },
  'Cloud Storage': {
    category: 'Cloud Storage',
    averageMarketMonthlyINR: 130, // 100GB / 200GB tier
    typicalTierDescription: '100GB - 200GB cloud backup plan',
  },
  'Gaming & Media': {
    category: 'Gaming & Media',
    averageMarketMonthlyINR: 499, // PlayStation / Xbox GamePass monthly
    typicalTierDescription: 'Console multiplayer & catalogue pass',
  },
  'Utilities & Services': {
    category: 'Utilities & Services',
    averageMarketMonthlyINR: 299,
    typicalTierDescription: 'Standard recurring digital utility pass',
  },
  Other: {
    category: 'Other',
    averageMarketMonthlyINR: 350,
    typicalTierDescription: 'General subscription baseline',
  },
};

export interface BenchmarkComparisonResult {
  category: SubscriptionCategory;
  userAmount: number;
  benchmarkAmount: number;
  percentageDiff: number; // e.g. +30.1% or -12.5%
  status: 'ABOVE_BENCHMARK' | 'AT_BENCHMARK' | 'BELOW_BENCHMARK';
  tierDescription: string;
}

export function compareToCategoryBenchmark(
  category: SubscriptionCategory,
  userMonthlyAmount: number
): BenchmarkComparisonResult {
  const info = CATEGORY_BENCHMARKS[category] || CATEGORY_BENCHMARKS.Other;
  const benchmarkAmount = info.averageMarketMonthlyINR;

  const diff = userMonthlyAmount - benchmarkAmount;
  const percentageDiff = Number(((diff / benchmarkAmount) * 100).toFixed(1));

  let status: BenchmarkComparisonResult['status'] = 'AT_BENCHMARK';
  if (percentageDiff >= 10) {
    status = 'ABOVE_BENCHMARK';
  } else if (percentageDiff <= -10) {
    status = 'BELOW_BENCHMARK';
  }

  return {
    category,
    userAmount: userMonthlyAmount,
    benchmarkAmount,
    percentageDiff,
    status,
    tierDescription: info.typicalTierDescription,
  };
}
