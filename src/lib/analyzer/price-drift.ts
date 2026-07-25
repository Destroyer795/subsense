import { ParsedTransaction, PriceDriftAnalysis, PriceDriftType } from '../../types';

export function analyzePriceDrift(transactions: ParsedTransaction[]): PriceDriftAnalysis {
  if (transactions.length < 2) {
    const amount = transactions[0]?.amount || 0;
    return {
      type: 'stable',
      percentageChange: 0,
      zScore: 0,
      historicalAmounts: transactions.map((t) => ({ date: t.date, amount: t.amount })),
      isHikeDetected: false,
    };
  }

  // Extract amount history sorted by date
  const sortedTxns = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const historicalAmounts = sortedTxns.map((t) => ({ date: t.date, amount: t.amount }));
  const amounts = historicalAmounts.map((h) => h.amount);

  const firstAmount = amounts[0];
  const lastAmount = amounts[amounts.length - 1];
  const percentageChange = ((lastAmount - firstAmount) / firstAmount) * 100;

  // Calculate Mean & Standard Deviation
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  // Latest amount Z-score relative to overall distribution
  const zScore = stdDev > 0 ? (lastAmount - mean) / stdDev : 0;

  // Detect sustained step-change vs single one-off spike
  let type: PriceDriftType = 'stable';
  let isHikeDetected = false;
  let hikeDetails: PriceDriftAnalysis['hikeDetails'] = undefined;

  // Check for step change in last N charges
  let stepIndex = -1;
  for (let i = 1; i < amounts.length; i++) {
    const prev = amounts[i - 1];
    const curr = amounts[i];
    const diffPct = ((curr - prev) / prev) * 100;

    if (diffPct >= 10) { // >= 10% increase
      // Verify if subsequent charges stayed at or above this new amount (sustained hike)
      const staysHigh = amounts.slice(i).every((amt) => amt >= curr * 0.95);
      if (staysHigh) {
        stepIndex = i;
        break;
      }
    }
  }

  if (stepIndex !== -1) {
    type = 'price_hike';
    isHikeDetected = true;
    hikeDetails = {
      previousAmount: amounts[stepIndex - 1],
      newAmount: amounts[stepIndex],
      effectiveDate: historicalAmounts[stepIndex].date,
    };
  } else if (zScore >= 2.0 && percentageChange > 25) {
    // Single anomaly / spike
    type = 'one_off_spike';
  } else if (Math.abs(percentageChange) > 5) {
    type = percentageChange > 0 ? 'price_hike' : 'stable';
  }

  return {
    type,
    percentageChange: Number(percentageChange.toFixed(1)),
    zScore: Number(zScore.toFixed(2)),
    historicalAmounts,
    isHikeDetected,
    hikeDetails,
  };
}
