import { describe, it, expect } from 'vitest';
import { parseTransactionRegex } from '../src/lib/parser/regex-parser';
import { clusterTransactionsByMerchant, areMerchantsSimilar } from '../src/lib/detector/merchant-clustering';
import { detectInterval } from '../src/lib/detector/interval-detection';
import { analyzePriceDrift } from '../src/lib/analyzer/price-drift';
import { calculateLeakScore } from '../src/lib/scoring/leak-score';
import { ParsedTransaction } from '../src/types';

describe('Tier 1 Regex Parser Suite', () => {
  it('should correctly parse HDFC SMS notification', () => {
    const text = 'Rs.649.00 debited from A/C **4921 on 12-01-2026 to VPA NETFLIX.COM Ref 123456789.';
    const result = parseTransactionRegex(text, 'T1');
    expect(result).not.toBeNull();
    expect(result?.bankFormat).toBe('HDFC');
    expect(result?.amount).toBe(649);
    expect(result?.merchant).toBe('NETFLIX.COM');
    expect(result?.date).toBe('2026-01-12');
  });

  it('should correctly parse SBI Debit card transaction', () => {
    const text = 'Txn of Rs.119.00 done on SBI Debit Card **1082 on 15-02-2026 at Spotify India. Ref No 987654.';
    const result = parseTransactionRegex(text, 'T2');
    expect(result).not.toBeNull();
    expect(result?.bankFormat).toBe('SBI');
    expect(result?.amount).toBe(119);
    expect(result?.merchant).toBe('Spotify India');
    expect(result?.date).toBe('2026-02-15');
  });

  it('should correctly parse ICICI bank UPI alert', () => {
    const text = 'ICICI Bank Acct **3019 debited for Rs 1999.00 on 2026-03-01. Info: INF*OPENAI *CHATGPT*. UPI: 554433.';
    const result = parseTransactionRegex(text, 'T3');
    expect(result).not.toBeNull();
    expect(result?.bankFormat).toBe('ICICI');
    expect(result?.amount).toBe(1999);
    expect(result?.merchant).toBe('OPENAI *CHATGPT');
    expect(result?.date).toBe('2026-03-01');
  });
});

describe('Merchant Fuzzy Clustering Suite', () => {
  it('should recognize variants of Netflix as the same merchant cluster', () => {
    expect(areMerchantsSimilar('NETFLIX.COM', 'NETFLIX INDIA')).toBe(true);
    expect(areMerchantsSimilar('NETFLIX*ENTERTAINMENT', 'NETFLIX.COM')).toBe(true);
    expect(areMerchantsSimilar('NETFLIX.COM', 'SPOTIFY INDIA')).toBe(false);
  });

  it('should cluster transactions under normalized merchant name', () => {
    const txns: ParsedTransaction[] = [
      { id: '1', rawText: '', merchant: 'NETFLIX.COM', amount: 649, date: '2026-01-01', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '2', rawText: '', merchant: 'NETFLIX INDIA', amount: 649, date: '2026-02-01', bankFormat: 'SBI', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '3', rawText: '', merchant: 'Spotify India', amount: 119, date: '2026-01-05', bankFormat: 'ICICI', confidenceScore: 0.9, extractionMethod: 'regex' },
    ];

    const clusters = clusterTransactionsByMerchant(txns);
    expect(clusters.length).toBe(2);
    const netflixCluster = clusters.find((c) => c.aliases.includes('NETFLIX.COM'));
    expect(netflixCluster).toBeDefined();
    expect(netflixCluster?.transactions.length).toBe(2);
  });
});

describe('Interval Classification Suite', () => {
  it('should classify monthly billing interval with 30-day delta', () => {
    const txns: ParsedTransaction[] = [
      { id: '1', rawText: '', merchant: 'Netflix', amount: 649, date: '2026-01-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '2', rawText: '', merchant: 'Netflix', amount: 649, date: '2026-02-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '3', rawText: '', merchant: 'Netflix', amount: 649, date: '2026-03-12', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
    ];

    const intervalResult = detectInterval(txns);
    expect(intervalResult.interval).toBe('monthly');
    expect(intervalResult.confidenceScore).toBeGreaterThan(0.7);
  });
});

describe('Price Drift Analysis Suite', () => {
  it('should detect a step-hike in subscription charges', () => {
    const txns: ParsedTransaction[] = [
      { id: '1', rawText: '', merchant: 'Netflix', amount: 649, date: '2026-01-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '2', rawText: '', merchant: 'Netflix', amount: 649, date: '2026-02-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '3', rawText: '', merchant: 'Netflix', amount: 799, date: '2026-03-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '4', rawText: '', merchant: 'Netflix', amount: 799, date: '2026-04-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
    ];

    const drift = analyzePriceDrift(txns);
    expect(drift.type).toBe('price_hike');
    expect(drift.isHikeDetected).toBe(true);
    expect(drift.hikeDetails?.previousAmount).toBe(649);
    expect(drift.hikeDetails?.newAmount).toBe(799);
  });
});

describe('Leak Score Engine Composite Formula Suite', () => {
  it('should calculate 100 leak score for dormant sub with price hike & high redundancy', () => {
    const leak = calculateLeakScore({
      isDormant: true, // 40
      priceDrift: { type: 'price_hike', percentageChange: 25, zScore: 2.1, historicalAmounts: [], isHikeDetected: true }, // 30
      categoryCountInGroup: 3, // 20
      monthlyCost: 2000,
      totalMonthlySpend: 5000, // 10
    });

    expect(leak.dormancyScore).toBe(100);
    expect(leak.totalScore).toBe(100);
    expect(leak.explanation.length).toBeGreaterThan(0);
  });

  it('should calculate low leak score for active unique stable sub', () => {
    const leak = calculateLeakScore({
      isDormant: false,
      priceDrift: { type: 'stable', percentageChange: 0, zScore: 0, historicalAmounts: [], isHikeDetected: false },
      categoryCountInGroup: 1,
      monthlyCost: 119,
      totalMonthlySpend: 10000,
    });

    expect(leak.totalScore).toBeLessThan(25);
  });
});
