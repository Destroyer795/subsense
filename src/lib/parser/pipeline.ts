import { RawTransaction, ParsedTransaction } from '../../types';
import { parseTransactionRegex } from './regex-parser';
import { parseTransactionGemini } from './gemini-parser';

export async function parseSingleTransaction(raw: RawTransaction): Promise<ParsedTransaction> {
  // Tier 1: Fast deterministic Regex match
  const regexResult = parseTransactionRegex(raw.rawText, raw.id);
  if (regexResult && regexResult.confidenceScore >= 0.85) {
    return regexResult;
  }

  // Tier 2: Gemini structured output fallback
  const geminiResult = await parseTransactionGemini(raw.rawText, raw.id);
  if (geminiResult && geminiResult.confidenceScore >= 0.6) {
    return geminiResult;
  }

  // Fallback to lower-confidence regex or synthetic placeholder if all fail
  if (regexResult) {
    return regexResult;
  }

  return {
    id: raw.id,
    rawText: raw.rawText,
    merchant: 'Unknown Merchant',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    bankFormat: raw.bankHint || 'UNKNOWN',
    confidenceScore: 0.2,
    extractionMethod: 'regex',
  };
}

export async function parseBatchTransactions(
  rawList: RawTransaction[],
  onProgress?: (processed: number, total: number) => void
): Promise<ParsedTransaction[]> {
  const results: ParsedTransaction[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const parsed = await parseSingleTransaction(rawList[i]);
    results.push(parsed);
    if (onProgress) onProgress(i + 1, rawList.length);
  }
  return results;
}
