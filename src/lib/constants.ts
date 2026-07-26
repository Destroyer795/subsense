/**
 * SubSense Algorithmic Thresholds & Constants
 */

// Merchant Clustering Constants
export const MERCHANT_CONSTANTS = {
  /** Minimum token overlap ratio required to consider two merchant names similar */
  TOKEN_SIMILARITY_THRESHOLD: 0.75,
  /** Minimum Levenshtein similarity ratio (1 - distance/maxLen) for string matching */
  LEVENSHTEIN_SIMILARITY_THRESHOLD: 0.70,
  /** Minimum character length of brand name token to allow single-token brand matching */
  MIN_BRAND_TOKEN_LENGTH: 4,
  /** Secondary service tokens that distinguish sub-brands under same parent (e.g. Amazon Pay vs Amazon Prime) */
  DISTINCT_SERVICE_TOKENS: ['PAY', 'PRIME', 'MUSIC', 'CLOUD', 'DRIVE', 'FOOD', 'ONE', 'GOLD', 'CARD', 'PLUS'],
};

// Interval Classification Delta Ranges (in Days)
export const INTERVAL_CONSTANTS = {
  WEEKLY_MIN_DAYS: 5,
  WEEKLY_MAX_DAYS: 9,
  MONTHLY_MIN_DAYS: 24,
  MONTHLY_MAX_DAYS: 36,
  QUARTERLY_MIN_DAYS: 75,
  QUARTERLY_MAX_DAYS: 105,
  ANNUAL_MIN_DAYS: 330,
  ANNUAL_MAX_DAYS: 400,
};

// Price Drift & Anomaly Constants
export const PRICE_DRIFT_CONSTANTS = {
  /** Minimum percentage increase to qualify as a candidate price hike */
  PRICE_HIKE_PERCENT_THRESHOLD: 10,
  /** Minimum Z-score threshold to classify a charge as a one-off anomaly spike */
  Z_SCORE_SPIKE_THRESHOLD: 2.0,
  /** Minimum percentage spike to flag one-off anomaly */
  SPIKE_PERCENT_THRESHOLD: 25,
};

// Leak Score Formula Weights
export const LEAK_SCORE_WEIGHTS = {
  DORMANCY: 0.4,
  PRICE_DRIFT: 0.3,
  REDUNDANCY: 0.2,
  COST_SHARE: 0.1,
};

// Gemini API Timeout & Default Model for Demo Safety
export const GEMINI_API_TIMEOUT_MS = 8000;
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
