import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { ParsedTransaction, BankFormat } from '../../types';

const GeminiParseSchema = z.object({
  merchant: z.string().describe('Cleaned company or service name'),
  amount: z.number().positive().describe('Numeric transaction amount in INR'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Date in YYYY-MM-DD format'),
  bankFormat: z.enum(['HDFC', 'SBI', 'ICICI', 'AXIS', 'UNKNOWN']),
  confidenceScore: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
});

export async function parseTransactionGemini(
  rawText: string,
  id: string
): Promise<ParsedTransaction | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Skipping Tier 2 Gemini fallback parsing.');
    return null;
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Extract transaction metadata from this bank SMS / notification text:
Text: "${rawText}"

Identify:
1. Clean merchant or payee name (e.g., Netflix, Spotify, OpenAI, Cult fit).
2. Exact transaction amount in numeric INR.
3. Transaction date normalized to YYYY-MM-DD.
4. Bank format if identifiable (HDFC, SBI, ICICI, AXIS, or UNKNOWN).
5. Confidence score (0.0 to 1.0).`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            bankFormat: { type: Type.STRING, enum: ['HDFC', 'SBI', 'ICICI', 'AXIS', 'UNKNOWN'] },
            confidenceScore: { type: Type.NUMBER },
          },
          required: ['merchant', 'amount', 'date', 'bankFormat', 'confidenceScore'],
        },
      },
    });

    const rawJsonText = response.text();
    if (!rawJsonText) return null;

    const parsedJson = JSON.parse(rawJsonText);
    const validated = GeminiParseSchema.parse(parsedJson);

    return {
      id,
      rawText,
      merchant: validated.merchant,
      amount: validated.amount,
      date: validated.date,
      bankFormat: validated.bankFormat as BankFormat,
      confidenceScore: validated.confidenceScore,
      extractionMethod: 'llm',
    };
  } catch (error) {
    console.error('Error executing Gemini Tier 2 transaction parsing:', error);
    return null;
  }
}
