import { differenceInDays, parseISO } from 'date-fns';
import { ParsedTransaction, IntervalClassification, IntervalType } from '../../types';

export function detectInterval(transactions: ParsedTransaction[]): IntervalClassification {
  if (transactions.length < 2) {
    return {
      interval: 'irregular',
      averageDeltaDays: 0,
      confidenceScore: 0,
    };
  }

  // Calculate day deltas between consecutive transactions
  const deltas: number[] = [];
  for (let i = 1; i < transactions.length; i++) {
    const prevDate = parseISO(transactions[i - 1].date);
    const currDate = parseISO(transactions[i].date);
    const diff = Math.abs(differenceInDays(currDate, prevDate));
    if (diff > 0) deltas.push(diff);
  }

  if (deltas.length === 0) {
    return {
      interval: 'irregular',
      averageDeltaDays: 0,
      confidenceScore: 0,
    };
  }

  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;

  // Calculate standard deviation of deltas
  const variance = deltas.reduce((acc, d) => acc + Math.pow(d - avgDelta, 2), 0) / deltas.length;
  const stdDev = Math.sqrt(variance);

  // Interval categorization with tolerance windows
  let interval: IntervalType = 'irregular';
  let targetDelta = 0;

  if (avgDelta >= 5 && avgDelta <= 9) {
    interval = 'weekly';
    targetDelta = 7;
  } else if (avgDelta >= 24 && avgDelta <= 36) {
    interval = 'monthly';
    targetDelta = 30;
  } else if (avgDelta >= 75 && avgDelta <= 105) {
    interval = 'quarterly';
    targetDelta = 90;
  } else if (avgDelta >= 330 && avgDelta <= 400) {
    interval = 'annual';
    targetDelta = 365;
  }

  if (interval === 'irregular') {
    return {
      interval: 'irregular',
      averageDeltaDays: Math.round(avgDelta),
      confidenceScore: 0.2,
    };
  }

  // Calculate confidence score (higher if stdDev is low and transaction count is higher)
  const deltaDeviation = Math.abs(avgDelta - targetDelta);
  const consistencyScore = Math.max(0, 1 - stdDev / targetDelta - deltaDeviation / targetDelta);
  const countMultiplier = Math.min(1.0, transactions.length / 4); // Full confidence with 4+ occurrences

  const confidenceScore = Math.min(0.98, Math.max(0.3, consistencyScore * 0.7 + countMultiplier * 0.3));

  return {
    interval,
    averageDeltaDays: Math.round(avgDelta),
    confidenceScore: Number(confidenceScore.toFixed(2)),
  };
}
