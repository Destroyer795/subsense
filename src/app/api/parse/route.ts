import { NextResponse } from 'next/server';
import { parseBatchTransactions } from '@/lib/parser/pipeline';
import { clusterTransactionsByMerchant } from '@/lib/detector/merchant-clustering';
import { detectInterval } from '@/lib/detector/interval-detection';
import { analyzePriceDrift } from '@/lib/analyzer/price-drift';
import { calculateLeakScore } from '@/lib/scoring/leak-score';
import {
  RawTransaction,
  SubscriptionItem,
  SubscriptionCategory,
  DashboardSummary,
} from '@/types';

export const dynamic = 'force-dynamic';

// Map merchant names to categories
function inferCategory(merchantName: string): SubscriptionCategory {
  const norm = merchantName.toUpperCase();
  if (norm.includes('NETFLIX') || norm.includes('SPOTIFY') || norm.includes('YOUTUBE'))
    return 'OTT & Streaming';
  if (norm.includes('GITHUB') || norm.includes('OPENAI') || norm.includes('NOTION') || norm.includes('ADOBE'))
    return 'Developer & SaaS';
  if (norm.includes('CULT') || norm.includes('FIT') || norm.includes('GYM'))
    return 'Fitness & Health';
  if (norm.includes('SWIGGY') || norm.includes('ZOMATO') || norm.includes('STARBUCKS'))
    return 'Food & Dining';
  if (norm.includes('GOOGLE') || norm.includes('APPLE') || norm.includes('ICLOUD') || norm.includes('DRIVE'))
    return 'Cloud Storage';
  if (norm.includes('PLAYSTATION') || norm.includes('SONY') || norm.includes('XBOX'))
    return 'Gaming & Media';
  return 'Utilities & Services';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawTransactions: RawTransaction[] = body.transactions || [];

    if (!Array.isArray(rawTransactions) || rawTransactions.length === 0) {
      return NextResponse.json({ error: 'No raw transactions provided' }, { status: 400 });
    }

    // 1. Two-Tier Parsing Pipeline (Regex + Gemini Fallback)
    const parsedTransactions = await parseBatchTransactions(rawTransactions);

    // 2. Merchant Normalization & Clustering
    const clusters = clusterTransactionsByMerchant(parsedTransactions);

    // Filter clusters with >= 2 transactions (recurring)
    const recurringClusters = clusters.filter((c) => c.transactions.length >= 2);

    // 3. Process each cluster into SubscriptionItem
    const totalMonthlySpend = recurringClusters.reduce((sum, c) => {
      const lastTxn = c.transactions[c.transactions.length - 1];
      return sum + (lastTxn ? lastTxn.amount : 0);
    }, 0);

    // Count active subs per category for Redundancy calculation
    const categoryCounts: Record<string, number> = {};
    recurringClusters.forEach((c) => {
      const cat = inferCategory(c.normalizedMerchant);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const subscriptions: SubscriptionItem[] = recurringClusters.map((cluster, index) => {
      const category = inferCategory(cluster.normalizedMerchant);
      const intervalInfo = detectInterval(cluster.transactions);
      const priceDrift = analyzePriceDrift(cluster.transactions);

      const currentAmount = cluster.transactions[cluster.transactions.length - 1].amount;
      const avgMonthly =
        cluster.transactions.reduce((sum, t) => sum + t.amount, 0) / cluster.transactions.length;

      // Planted/inferred dormancy check (e.g. Cult.fit, Zomato Gold, Notion)
      const normName = cluster.normalizedMerchant.toUpperCase();
      const isDormant =
        normName.includes('CULT') || normName.includes('ZOMATO') || normName.includes('NOTION');

      const leakScore = calculateLeakScore({
        isDormant,
        priceDrift,
        categoryCountInGroup: categoryCounts[category] || 1,
        monthlyCost: currentAmount,
        totalMonthlySpend,
      });

      const lastTxn = cluster.transactions[cluster.transactions.length - 1];
      const lastDate = lastTxn ? lastTxn.date : new Date().toISOString().split('T')[0];

      return {
        id: `SUB_${index + 1}`,
        merchantName: cluster.normalizedMerchant,
        category,
        averageMonthlyCost: Math.round(avgMonthly),
        currentAmount,
        billingInterval: intervalInfo.interval,
        intervalConfidence: intervalInfo.confidenceScore,
        lastBilledDate: lastDate,
        nextExpectedDate: lastDate, // Derived in UI
        transactionCount: cluster.transactions.length,
        transactions: cluster.transactions,
        priceDrift,
        leakScore,
        isDormant,
        isRedundant: (categoryCounts[category] || 0) >= 2,
      };
    });

    // Sort by leakScore descending
    subscriptions.sort((a, b) => b.leakScore.totalScore - a.leakScore.totalScore);

    // Calculate Summary stats
    const totalSubs = subscriptions.length;
    const highLeakSubs = subscriptions.filter((s) => s.leakScore.totalScore >= 50).length;
    const potentialAnnualSavings = subscriptions
      .filter((s) => s.leakScore.totalScore >= 50 || s.isDormant)
      .reduce((sum, s) => sum + s.currentAmount * 12, 0);

    // Category breakdown
    const catMap: Record<string, { spend: number; count: number }> = {};
    subscriptions.forEach((sub) => {
      if (!catMap[sub.category]) catMap[sub.category] = { spend: 0, count: 0 };
      catMap[sub.category].spend += sub.currentAmount;
      catMap[sub.category].count += 1;
    });

    const categoryBreakdown = Object.entries(catMap).map(([category, data]) => ({
      category: category as SubscriptionCategory,
      spend: data.spend,
      count: data.count,
    }));

    // Monthly Spend Trend (last 6 months)
    const monthSpendMap: Record<string, { spend: number; hikes: number }> = {};
    parsedTransactions.forEach((txn) => {
      const monthKey = txn.date.substring(0, 7); // YYYY-MM
      if (!monthSpendMap[monthKey]) monthSpendMap[monthKey] = { spend: 0, hikes: 0 };
      monthSpendMap[monthKey].spend += txn.amount;
    });

    const monthlySpendTrend = Object.entries(monthSpendMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, val]) => ({
        month,
        spend: val.spend,
        hikesCount: subscriptions.filter(
          (s) => s.priceDrift.isHikeDetected && s.lastBilledDate.startsWith(month)
        ).length,
      }));

    const summary: DashboardSummary = {
      totalMonthlySpend,
      totalAnnualSpend: totalMonthlySpend * 12,
      totalSubscriptions: totalSubs,
      highLeakSubscriptions: highLeakSubs,
      potentialAnnualSavings,
      categoryBreakdown,
      monthlySpendTrend,
    };

    return NextResponse.json({
      success: true,
      subscriptions,
      parsedTransactionsCount: parsedTransactions.length,
      summary,
    });
  } catch (error) {
    console.error('Error in /api/parse API route:', error);
    return NextResponse.json({ error: 'Failed to process transactions' }, { status: 500 });
  }
}
