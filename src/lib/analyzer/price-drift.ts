import { ParsedTransaction, PriceDriftAnalysis, PriceDriftType } from '../../types';
import { PRICE_DRIFT_CONSTANTS } from '../constants';

export function analyzePriceDrift(transactions: ParsedTransaction[]): PriceDriftAnalysis {
  if (transactions.length < 2) {
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
  const percentageChange = firstAmount > 0 ? ((lastAmount - firstAmount) / firstAmount) * 100 : 0;

  // Calculate Mean & Standard Deviation
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  // Latest amount Z-score relative to overall distribution
  const zScore = stdDev > 0 ? (lastAmount - mean) / stdDev : 0;

  let type: PriceDriftType = 'stable';
  let isHikeDetected = false;
  let hikeDetails: PriceDriftAnalysis['hikeDetails'] = undefined;

  // Check for step change in charge history
  let stepIndex = -1;
  for (let i = 1; i < amounts.length; i++) {
    const prev = amounts[i - 1];
    const curr = amounts[i];
    const diffPct = prev > 0 ? ((curr - prev) / prev) * 100 : 0;

    if (diffPct >= PRICE_DRIFT_CONSTANTS.PRICE_HIKE_PERCENT_THRESHOLD) {
      const remainingCharges = amounts.slice(i);
      const staysHigh = remainingCharges.every((amt) => amt >= curr * 0.95);
      
      // A sustained hike requires at least 2 consecutive charges at the new higher price
      if (staysHigh && remainingCharges.length >= 2) {
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
  } else if (
    zScore >= PRICE_DRIFT_CONSTANTS.Z_SCORE_SPIKE_THRESHOLD ||
    percentageChange >= PRICE_DRIFT_CONSTANTS.SPIKE_PERCENT_THRESHOLD
  ) {
    // Single anomaly / spike at the end of history
    type = 'one_off_spike';
  } else if (percentageChange > 5) {
    type = 'price_hike';
  } else {
    type = 'stable';
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
