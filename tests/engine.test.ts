import { describe, it, expect } from 'vitest';
import { parseTransactionRegex } from '../src/lib/parser/regex-parser';
import { parseTransactionGemini } from '../src/lib/parser/gemini-parser';
import { clusterTransactionsByMerchant, areMerchantsSimilar } from '../src/lib/detector/merchant-clustering';
import { detectInterval } from '../src/lib/detector/interval-detection';
import { analyzePriceDrift } from '../src/lib/analyzer/price-drift';
import { calculateLeakScore } from '../src/lib/scoring/leak-score';
import { parseBatchTransactions } from '../src/lib/parser/pipeline';
import { generateGeminiRecommendation, generateCancellationEmailDraft } from '../src/lib/gemini/recommendations';
import { ParsedTransaction, SubscriptionItem } from '../src/types';

describe('Tier 1 Regex Parser Edge-Case Audit', () => {
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

  it('should parse amounts with commas (e.g. Rs.1,299.00)', () => {
    const text = 'Rs.1,299.00 debited from A/C **4921 on 12-01-2026 to VPA GITHUB INC Ref 123.';
    const result = parseTransactionRegex(text, 'T_COMMAS');
    expect(result?.amount).toBe(1299);
  });

  it('should handle currency variants (INR, Rs., Rs )', () => {
    const text1 = 'INR 800 paid to GITHUB.COM on 10-02-2026 via HDFC.';
    const text2 = 'Rs 499 debited towards Sony PlayStation on 11-02-2026.';
    expect(parseTransactionRegex(text1, 'C1')?.amount).toBe(800);
    expect(parseTransactionRegex(text2, 'C2')?.amount).toBe(499);
  });

  it('should return null on completely malformed or missing amount SMS', () => {
    const malformed = 'Your account password was updated on 12-01-2026. Ignore if done by you.';
    expect(parseTransactionRegex(malformed, 'M1')).toBeNull();
  });

  it('should parse unknown bank notifications with fallback generic patterns', () => {
    const genericText = 'Paid Rs.299 to SWIGGY ONE on 14-04-2026 Ref 998877.';
    const result = parseTransactionRegex(genericText, 'GEN1');
    expect(result).not.toBeNull();
    expect(result?.amount).toBe(299);
    expect(result?.bankFormat).toBe('UNKNOWN');
  });
});

describe('Tier 2 Gemini LLM Fallback Audit', () => {
  it('should gracefully degrade to null if GEMINI_API_KEY is missing', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const result = await parseTransactionGemini('Random raw statement line', 'G1');
    expect(result).toBeNull();

    process.env.GEMINI_API_KEY = originalKey;
  });

  it('should trigger offline fallback recommendation seamlessly if Gemini key is missing', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const mockSub: SubscriptionItem = {
      id: 'SUB_1',
      merchantName: 'Cult.fit',
      category: 'Fitness & Health',
      averageMonthlyCost: 1750,
      currentAmount: 1750,
      billingInterval: 'monthly',
      intervalConfidence: 0.9,
      lastBilledDate: '2026-06-12',
      nextExpectedDate: '2026-07-12',
      transactionCount: 4,
      transactions: [],
      priceDrift: { type: 'stable', percentageChange: 0, zScore: 0, historicalAmounts: [], isHikeDetected: false },
      leakScore: { totalScore: 70, dormancyScore: 100, priceDriftScore: 0, redundancyScore: 60, costShareScore: 20, explanation: [] },
      isDormant: true,
      isRedundant: false,
    };

    const rec = await generateGeminiRecommendation(mockSub);
    expect(rec.action).toBe('cancel');
    expect(rec.potentialAnnualSavings).toBe(21000);

    const email = await generateCancellationEmailDraft(mockSub, 'cancel');
    expect(email.subject).toContain('Cancellation');
    expect(email.recipientHint).toBe('support@cultfit.com');

    process.env.GEMINI_API_KEY = originalKey;
  });
});

describe('Merchant Fuzzy Clustering Edge-Case Audit', () => {
  it('should recognize variants of Netflix as the same merchant cluster', () => {
    expect(areMerchantsSimilar('NETFLIX.COM', 'NETFLIX INDIA')).toBe(true);
    expect(areMerchantsSimilar('NETFLIX*ENTERTAINMENT', 'NETFLIX.COM')).toBe(true);
    expect(areMerchantsSimilar('NETFLIX.COM', 'SPOTIFY INDIA')).toBe(false);
  });

  it('should NOT cluster distinct sub-brands (e.g. Amazon Prime vs Amazon Pay)', () => {
    expect(areMerchantsSimilar('Amazon Prime', 'Amazon Pay')).toBe(false);
    expect(areMerchantsSimilar('Zomato Gold', 'Zomato Pay')).toBe(false);
  });

  it('should handle single-occurrence merchants without crashing', () => {
    const txns: ParsedTransaction[] = [
      { id: '1', rawText: '', merchant: 'OneTime Vendor', amount: 500, date: '2026-01-01', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
    ];
    const clusters = clusterTransactionsByMerchant(txns);
    expect(clusters.length).toBe(1);
    expect(clusters[0].transactions.length).toBe(1);
  });
});

describe('Interval Classification Edge-Case Audit', () => {
  it('should classify single occurrence as irregular interval', () => {
    const txns: ParsedTransaction[] = [
      { id: '1', rawText: '', merchant: 'Netflix', amount: 649, date: '2026-01-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
    ];
    const intervalResult = detectInterval(txns);
    expect(intervalResult.interval).toBe('irregular');
    expect(intervalResult.confidenceScore).toBe(0);
  });

  it('should classify exactly 2 occurrences as valid interval', () => {
    const txns: ParsedTransaction[] = [
      { id: '1', rawText: '', merchant: 'Netflix', amount: 649, date: '2026-01-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '2', rawText: '', merchant: 'Netflix', amount: 649, date: '2026-02-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
    ];
    const intervalResult = detectInterval(txns);
    expect(intervalResult.interval).toBe('monthly');
  });

  it('should classify month-length variation (28 to 31 days) cleanly as monthly', () => {
    const txns: ParsedTransaction[] = [
      { id: '1', rawText: '', merchant: 'Spotify', amount: 119, date: '2026-01-31', bankFormat: 'SBI', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '2', rawText: '', merchant: 'Spotify', amount: 119, date: '2026-02-28', bankFormat: 'SBI', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '3', rawText: '', merchant: 'Spotify', amount: 119, date: '2026-03-31', bankFormat: 'SBI', confidenceScore: 0.9, extractionMethod: 'regex' },
    ];
    const intervalResult = detectInterval(txns);
    expect(intervalResult.interval).toBe('monthly');
  });
});

describe('Price-Drift Analyzer Edge-Case Audit', () => {
  it('should handle single-charge subscription with zero drift', () => {
    const txns: ParsedTransaction[] = [
      { id: '1', rawText: '', merchant: 'Netflix', amount: 649, date: '2026-01-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
    ];
    const drift = analyzePriceDrift(txns);
    expect(drift.type).toBe('stable');
    expect(drift.percentageChange).toBe(0);
  });

  it('should distinguish a one-off spike from a sustained price hike', () => {
    // One-off spike: 649 -> 2500 -> 649
    const spikeTxns: ParsedTransaction[] = [
      { id: '1', rawText: '', merchant: 'AWS', amount: 649, date: '2026-01-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '2', rawText: '', merchant: 'AWS', amount: 649, date: '2026-02-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '3', rawText: '', merchant: 'AWS', amount: 649, date: '2026-03-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '4', rawText: '', merchant: 'AWS', amount: 2500, date: '2026-04-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
    ];
    const spikeDrift = analyzePriceDrift(spikeTxns);
    expect(spikeDrift.type).toBe('one_off_spike');

    // Sustained hike: 649 -> 799 -> 799
    const hikeTxns: ParsedTransaction[] = [
      { id: '1', rawText: '', merchant: 'Netflix', amount: 649, date: '2026-01-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '2', rawText: '', merchant: 'Netflix', amount: 649, date: '2026-02-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '3', rawText: '', merchant: 'Netflix', amount: 799, date: '2026-03-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '4', rawText: '', merchant: 'Netflix', amount: 799, date: '2026-04-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
    ];
    const hikeDrift = analyzePriceDrift(hikeTxns);
    expect(hikeDrift.type).toBe('price_hike');
  });

  it('should handle price decreases without crashing or flagging false hikes', () => {
    const decreaseTxns: ParsedTransaction[] = [
      { id: '1', rawText: '', merchant: 'SaaS Tool', amount: 1200, date: '2026-01-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
      { id: '2', rawText: '', merchant: 'SaaS Tool', amount: 800, date: '2026-02-10', bankFormat: 'HDFC', confidenceScore: 0.9, extractionMethod: 'regex' },
    ];
    const drift = analyzePriceDrift(decreaseTxns);
    expect(drift.type).toBe('stable');
    expect(drift.percentageChange).toBe(-33.3);
  });
});

describe('Leak Score Engine & Bounds Audit', () => {
  it('should clamp total leak score between 0 and 100', () => {
    const leakMax = calculateLeakScore({
      isDormant: true,
      priceDrift: { type: 'price_hike', percentageChange: 100, zScore: 5.0, historicalAmounts: [], isHikeDetected: true },
      categoryCountInGroup: 5,
      monthlyCost: 10000,
      totalMonthlySpend: 10000,
    });
    expect(leakMax.totalScore).toBe(100);

    const leakMin = calculateLeakScore({
      isDormant: false,
      priceDrift: { type: 'stable', percentageChange: 0, zScore: 0, historicalAmounts: [], isHikeDetected: false },
      categoryCountInGroup: 1,
      monthlyCost: 0,
      totalMonthlySpend: 0,
    });
    expect(leakMin.totalScore).toBe(0);
  });

  it('should safely handle zero totalMonthlySpend denominator without division by zero', () => {
    const leak = calculateLeakScore({
      isDormant: false,
      priceDrift: { type: 'stable', percentageChange: 0, zScore: 0, historicalAmounts: [], isHikeDetected: false },
      categoryCountInGroup: 1,
      monthlyCost: 100,
      totalMonthlySpend: 0,
    });
    expect(leak.costShareScore).toBe(0);
    expect(Number.isNaN(leak.totalScore)).toBe(false);
  });
});

describe('End-To-End Performance & Sanity Audit', () => {
  it('should handle batch parsing of empty input array', async () => {
    const result = await parseBatchTransactions([]);
    expect(result.length).toBe(0);
  });

  it('should process 50+ transactions rapidly under 100ms', async () => {
    const largeBatch = Array.from({ length: 60 }, (_, i) => ({
      id: `TXN_${i}`,
      rawText: `Rs.${100 + i}.00 debited from A/C **4921 on 12-01-2026 to VPA MERCHANT_${i % 5} Ref ${1000 + i}.`,
      bankHint: 'HDFC' as const,
    }));

    const start = Date.now();
    const parsed = await parseBatchTransactions(largeBatch);
    const duration = Date.now() - start;

    expect(parsed.length).toBe(60);
    expect(duration).toBeLessThan(1000);
  });
});
