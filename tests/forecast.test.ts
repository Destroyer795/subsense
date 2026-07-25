import { describe, it, expect } from 'vitest';
import { calculate12MonthLeakForecast } from '../src/lib/analyzer/leak-forecast';
import { SubscriptionItem } from '../src/types';

describe('12-Month Leak Forecast Extrapolation Suite', () => {
  it('should extrapolate flat spend if no subscriptions have price hikes', () => {
    const mockSubs: SubscriptionItem[] = [
      {
        id: '1',
        merchantName: 'Spotify',
        category: 'OTT & Streaming',
        averageMonthlyCost: 119,
        currentAmount: 119,
        billingInterval: 'monthly',
        intervalConfidence: 0.9,
        lastBilledDate: '2026-06-01',
        nextExpectedDate: '2026-07-01',
        transactionCount: 4,
        transactions: [],
        priceDrift: { type: 'stable', percentageChange: 0, zScore: 0, historicalAmounts: [], isHikeDetected: false },
        leakScore: { totalScore: 10, dormancyScore: 0, priceDriftScore: 0, redundancyScore: 0, costShareScore: 10, explanation: [] },
        isDormant: false,
        isRedundant: false,
      },
    ];

    const result = calculate12MonthLeakForecast(mockSubs);
    expect(result.forecastData.length).toBe(12);
    expect(result.total12MonthProjectedSpend).toBe(119 * 12);
    expect(result.total12MonthExcessHikeWaste).toBe(0);
  });

  it('should compound cumulative price hike excess when price hike is detected', () => {
    const mockSubs: SubscriptionItem[] = [
      {
        id: '1',
        merchantName: 'Netflix',
        category: 'OTT & Streaming',
        averageMonthlyCost: 799,
        currentAmount: 799, // Hiked from 649 (+150 diff)
        billingInterval: 'monthly',
        intervalConfidence: 0.9,
        lastBilledDate: '2026-06-01',
        nextExpectedDate: '2026-07-01',
        transactionCount: 4,
        transactions: [],
        priceDrift: {
          type: 'price_hike',
          percentageChange: 23.1,
          zScore: 2.1,
          historicalAmounts: [],
          isHikeDetected: true,
          hikeDetails: { previousAmount: 649, newAmount: 799, effectiveDate: '2026-03-01' },
        },
        leakScore: { totalScore: 80, dormancyScore: 0, priceDriftScore: 90, redundancyScore: 0, costShareScore: 20, explanation: [] },
        isDormant: false,
        isRedundant: false,
      },
    ];

    const result = calculate12MonthLeakForecast(mockSubs);
    expect(result.forecastData.length).toBe(12);
    expect(result.total12MonthProjectedSpend).toBe(799 * 12); // 9588
    expect(result.total12MonthExcessHikeWaste).toBe(150 * 12); // 1800 extra loss from hike over 12 months
    expect(result.forecastData[0].priceHikeExcess).toBe(150);
    expect(result.forecastData[11].priceHikeExcess).toBe(1800);
  });
});
