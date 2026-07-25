export type BankFormat = 'HDFC' | 'SBI' | 'ICICI' | 'AXIS' | 'UNKNOWN';

export interface RawTransaction {
  id: string;
  rawText: string;
  bankHint?: BankFormat;
}

export interface ParsedTransaction {
  id: string;
  rawText: string;
  merchant: string;
  amount: number;
  date: string; // ISO format string YYYY-MM-DD
  referenceNo?: string;
  bankFormat: BankFormat;
  confidenceScore: number; // 0 to 1
  extractionMethod: 'regex' | 'llm';
}

export interface MerchantCluster {
  clusterId: string;
  normalizedMerchant: string;
  aliases: string[];
  transactions: ParsedTransaction[];
}

export type IntervalType = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'irregular';

export interface IntervalClassification {
  interval: IntervalType;
  averageDeltaDays: number;
  confidenceScore: number; // 0 to 1 based on variance
}

export type PriceDriftType = 'price_hike' | 'one_off_spike' | 'stable';

export interface PriceDriftAnalysis {
  type: PriceDriftType;
  percentageChange: number; // % change between baseline and latest
  zScore: number;
  historicalAmounts: { date: string; amount: number }[];
  isHikeDetected: boolean;
  hikeDetails?: {
    previousAmount: number;
    newAmount: number;
    effectiveDate: string;
  };
}

export interface LeakScoreBreakdown {
  totalScore: number; // 0 - 100
  dormancyScore: number; // 0 - 100 (weight 0.4)
  priceDriftScore: number; // 0 - 100 (weight 0.3)
  redundancyScore: number; // 0 - 100 (weight 0.2)
  costShareScore: number; // 0 - 100 (weight 0.1)
  explanation: string[];
}

export type SubscriptionCategory =
  | 'OTT & Streaming'
  | 'Developer & SaaS'
  | 'Fitness & Health'
  | 'Food & Dining'
  | 'Cloud Storage'
  | 'Gaming & Media'
  | 'Utilities & Services'
  | 'Other';

export interface SubscriptionItem {
  id: string;
  merchantName: string;
  category: SubscriptionCategory;
  averageMonthlyCost: number;
  currentAmount: number;
  billingInterval: IntervalType;
  intervalConfidence: number;
  lastBilledDate: string;
  nextExpectedDate: string;
  transactionCount: number;
  transactions: ParsedTransaction[];
  priceDrift: PriceDriftAnalysis;
  leakScore: LeakScoreBreakdown;
  isDormant: boolean; // User toggled or inferred
  isRedundant: boolean; // Category has multiple active subscriptions
}

export interface GeminiRecommendation {
  subscriptionId: string;
  action: 'cancel' | 'downgrade' | 'renegotiate' | 'keep';
  headline: string;
  reason: string;
  potentialAnnualSavings: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface EmailDraft {
  subscriptionId: string;
  subject: string;
  body: string;
  recipientHint: string;
}

export interface DashboardSummary {
  totalMonthlySpend: number;
  totalAnnualSpend: number;
  totalSubscriptions: number;
  highLeakSubscriptions: number;
  potentialAnnualSavings: number;
  categoryBreakdown: { category: SubscriptionCategory; spend: number; count: number }[];
  monthlySpendTrend: { month: string; spend: number; hikesCount: number }[];
}
