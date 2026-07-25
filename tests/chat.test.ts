import { describe, it, expect } from 'vitest';
import {
  getSubscriptionByName,
  getTopLeaksByScore,
  computeSavingsIfCancelled,
  getCategorySpendBreakdown,
} from '../src/lib/chat/chat-tools';
import { SubscriptionItem } from '../src/types';

const mockSubscriptions: SubscriptionItem[] = [
  {
    id: 'SUB_1',
    merchantName: 'NETFLIX.COM',
    category: 'OTT & Streaming',
    averageMonthlyCost: 649,
    currentAmount: 799,
    billingInterval: 'monthly',
    intervalConfidence: 0.9,
    lastBilledDate: '2026-06-10',
    nextExpectedDate: '2026-07-10',
    transactionCount: 4,
    transactions: [],
    priceDrift: { type: 'price_hike', percentageChange: 23.1, zScore: 1.8, historicalAmounts: [], isHikeDetected: true },
    leakScore: { totalScore: 85, dormancyScore: 100, priceDriftScore: 90, redundancyScore: 60, costShareScore: 30, explanation: [] },
    isDormant: true,
    isRedundant: true,
  },
  {
    id: 'SUB_2',
    merchantName: 'Spotify India',
    category: 'OTT & Streaming',
    averageMonthlyCost: 119,
    currentAmount: 119,
    billingInterval: 'monthly',
    intervalConfidence: 0.95,
    lastBilledDate: '2026-06-15',
    nextExpectedDate: '2026-07-15',
    transactionCount: 5,
    transactions: [],
    priceDrift: { type: 'stable', percentageChange: 0, zScore: 0, historicalAmounts: [], isHikeDetected: false },
    leakScore: { totalScore: 20, dormancyScore: 0, priceDriftScore: 0, redundancyScore: 60, costShareScore: 5, explanation: [] },
    isDormant: false,
    isRedundant: true,
  },
];

describe('Chat Assistant Query Tools Suite', () => {
  it('should find subscription details by name', () => {
    const result = getSubscriptionByName('Netflix', mockSubscriptions);
    expect(result.found).toBe(true);
    expect((result.data as { merchantName: string }).merchantName).toBe('NETFLIX.COM');
  });

  it('should return found=false for unknown merchant name', () => {
    const result = getSubscriptionByName('NonExistentVendor', mockSubscriptions);
    expect(result.found).toBe(false);
  });

  it('should filter top leaks above a score threshold', () => {
    const result = getTopLeaksByScore(50, mockSubscriptions);
    expect(result.found).toBe(true);
    const data = result.data as { merchantName: string }[];
    expect(data.length).toBe(1);
    expect(data[0].merchantName).toBe('NETFLIX.COM');
  });

  it('should calculate projected savings when cancelling specific subscriptions', () => {
    const result = computeSavingsIfCancelled(['Netflix'], mockSubscriptions);
    expect(result.found).toBe(true);
    const data = result.data as { monthlySavingsINR: number; annualSavingsINR: number };
    expect(data.monthlySavingsINR).toBe(799);
    expect(data.annualSavingsINR).toBe(9588);
  });

  it('should calculate savings when passing min score threshold', () => {
    const result = computeSavingsIfCancelled(50, mockSubscriptions);
    expect(result.found).toBe(true);
    const data = result.data as { monthlySavingsINR: number };
    expect(data.monthlySavingsINR).toBe(799);
  });

  it('should compute category spend breakdown', () => {
    const result = getCategorySpendBreakdown(mockSubscriptions);
    expect(result.found).toBe(true);
    const data = result.data as Record<string, { spend: number; count: number }>;
    expect(data['OTT & Streaming'].spend).toBe(918);
    expect(data['OTT & Streaming'].count).toBe(2);
  });
});
