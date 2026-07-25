import { ParsedTransaction, BankFormat } from '../../types';

export interface RegexParseResult {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  bankFormat: BankFormat;
  confidenceScore: number;
}

// Extract date helper returning YYYY-MM-DD
function parseDateString(text: string): string | null {
  // DD-MM-YYYY or DD/MM/YYYY or DD-MM-YY
  const dmyMatch = text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD
  const ymdMatch = text.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

// Clean merchant string by stripping common noise prefix/suffixes
function cleanMerchantName(merchantRaw: string): string {
  let cleaned = merchantRaw
    .replace(/^VPA\s+/i, '')
    .replace(/^INF\*/i, '')
    .replace(/[\.\*]+$/, '')
    .replace(/\s*Ref[:\s].*$/i, '')
    .replace(/\s*UPI[:\s].*$/i, '')
    .trim();

  // If ends with date or numbers
  cleaned = cleaned.replace(/\s+\d{2}[-/]\d{2}[-/]\d{2,4}$/, '').trim();
  return cleaned.replace(/[\.\*]+$/, '').trim();
}

export function parseTransactionRegex(rawText: string, id: string): ParsedTransaction | null {
  let bankFormat: BankFormat = 'UNKNOWN';
  let merchant: string | null = null;
  let amount: number | null = null;
  let date: string | null = parseDateString(rawText);

  // 1. HDFC Bank Regex Templates
  // Example: "Rs.649.00 debited from A/C **4921 on 12-01-2026 to VPA NETFLIX.COM Ref 12345."
  // Example: "Alert: Rs.799.00 debited from HDFC Bank A/C ending 4921 on 12-04-2026 towards NETFLIX INDIA Ref: 9876."
  if (/HDFC/i.test(rawText) || /VPA\s+/i.test(rawText)) {
    bankFormat = 'HDFC';
    const amtMatch = rawText.match(/Rs\.?\s*([\d,]+\.?\d*)/i) || rawText.match(/INR\s*([\d,]+\.?\d*)/i);
    if (amtMatch) amount = parseFloat(amtMatch[1].replace(/,/g, ''));

    const merchantMatch = rawText.match(/to\s+VPA\s+([^Ref]+?)(?=\s+Ref|\.|$)/i) ||
                          rawText.match(/towards\s+([^Ref]+?)(?=\s+Ref|\.|$)/i) ||
                          rawText.match(/paid\s+to\s+([^on]+?)(?=\s+on|\.|$)/i);
    if (merchantMatch) merchant = cleanMerchantName(merchantMatch[1]);
  }

  // 2. SBI Bank Regex Templates
  // Example: "Txn of Rs.119.00 done on SBI Debit Card **1082 on 12-01-2026 at Spotify India. Ref No 1234."
  // Example: "SBI Alert: Rs.119.00 debited towards Spotify Media on 12-02-2026. Ref: 5678."
  else if (/SBI/i.test(rawText)) {
    bankFormat = 'SBI';
    const amtMatch = rawText.match(/Rs\.?\s*([\d,]+\.?\d*)/i) || rawText.match(/Txn of Rs\.?\s*([\d,]+\.?\d*)/i);
    if (amtMatch) amount = parseFloat(amtMatch[1].replace(/,/g, ''));

    const merchantMatch = rawText.match(/at\s+([^Ref]+?)(?=\s*\.|\s*Ref|$)/i) ||
                          rawText.match(/transfer\s+to\s+([^Ref]+?)(?=\s*\.|\s*Ref|$)/i) ||
                          rawText.match(/towards\s+([^on]+?)(?=\s+on|\.|$)/i);
    if (merchantMatch) merchant = cleanMerchantName(merchantMatch[1]);
  }

  // 3. ICICI Bank Regex Templates
  // Example: "ICICI Bank Acct **3019 debited for Rs 1999.00 on 12-01-2026. Info: INF*OPENAI *CHATGPT*. UPI: 1234."
  else if (/ICICI/i.test(rawText) || /INF\*/i.test(rawText)) {
    bankFormat = 'ICICI';
    const amtMatch = rawText.match(/Rs\.?\s*([\d,]+\.?\d*)/i) || rawText.match(/INR\s*([\d,]+\.?\d*)/i);
    if (amtMatch) amount = parseFloat(amtMatch[1].replace(/,/g, ''));

    const merchantMatch = rawText.match(/Info:\s*INF\*([^\.]+?)(?=\*\.|\s*UPI|\.|$)/i) ||
                          rawText.match(/payment\s+to\s+([^Ref]+?)(?=\s*\.|\s*Ref|$)/i) ||
                          rawText.match(/for\s+([^Ref]+?)(?=\s*\.|\s*Ref|$)/i);
    if (merchantMatch) merchant = cleanMerchantName(merchantMatch[1]);
  }

  // 4. Axis Bank Regex Templates
  // Example: "Axis Bank: Rs.1750.00 debited from A/C **8812 on 12-01-2026 at CULT FIT GYM. Ref 1234."
  else if (/Axis/i.test(rawText)) {
    bankFormat = 'AXIS';
    const amtMatch = rawText.match(/Rs\.?\s*([\d,]+\.?\d*)/i) || rawText.match(/INR\s*([\d,]+\.?\d*)/i);
    if (amtMatch) amount = parseFloat(amtMatch[1].replace(/,/g, ''));

    const merchantMatch = rawText.match(/at\s+([^Ref]+?)(?=\s*\.|\s*Ref|\s*via|$)/i) ||
                          rawText.match(/spent\s+on.*at\s+([^Ref]+?)(?=\s*\.|\s*Ref|$)/i);
    if (merchantMatch) merchant = cleanMerchantName(merchantMatch[1]);
  }

  // Fallback pattern matching for generic SMS
  if (!merchant || !amount) {
    const genericAmt = rawText.match(/(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
    if (genericAmt && !amount) amount = parseFloat(genericAmt[1].replace(/,/g, ''));

    const genericMerchant = rawText.match(/(?:at|to|towards|vpa)\s+([A-Z0-9\.\*\s\-_]{3,25})/i);
    if (genericMerchant && !merchant) merchant = cleanMerchantName(genericMerchant[1]);
  }

  // If mandatory fields exist and date parsed, calculate confidence
  if (merchant && amount && date && amount > 0) {
    const confidenceScore = bankFormat !== 'UNKNOWN' ? 0.95 : 0.75;
    return {
      id,
      rawText,
      merchant,
      amount,
      date,
      bankFormat,
      confidenceScore,
      extractionMethod: 'regex'
    };
  }

  return null;
}
