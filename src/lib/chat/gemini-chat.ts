import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { SubscriptionItem, DashboardSummary } from '../../types';
import {
  getSubscriptionByName,
  getTopLeaksByScore,
  computeSavingsIfCancelled,
  getCategorySpendBreakdown,
} from './chat-tools';
import { GEMINI_API_TIMEOUT_MS } from '../constants';

export interface ChatResponseResult {
  text: string;
  source: 'gemini' | 'fallback';
  errorDetails?: string;
}

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'getSubscriptionByName',
    description: 'Lookup subscription details, leak score, price drift history, and dormancy status by merchant name.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        merchantName: { type: Type.STRING, description: 'Name of the merchant or service (e.g. Netflix, Spotify, Cult fit)' },
      },
      required: ['merchantName'],
    },
  },
  {
    name: 'getTopLeaksByScore',
    description: 'Get list of subscriptions with leak score at or above a minimum score threshold.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        minScore: { type: Type.NUMBER, description: 'Minimum leak score (0-100, default 50)' },
      },
      required: ['minScore'],
    },
  },
  {
    name: 'computeSavingsIfCancelled',
    description: 'Compute monthly and annual INR savings if specific subscriptions or subscriptions above a leak score are cancelled.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        targetSubNamesOrMinScore: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Array of merchant names to cancel (e.g. ["Netflix", "Cult.fit"])',
        },
      },
    },
  },
  {
    name: 'getCategorySpendBreakdown',
    description: 'Get category-wise monthly spend distribution and subscription counts.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

function runLocalOfflineQuery(userQuery: string, subscriptions: SubscriptionItem[]): string {
  const queryLower = userQuery.toLowerCase();

  // Priority 1: Specific "Which to cancel first / highest priority" questions
  if (
    queryLower.includes('first') ||
    queryLower.includes('which') ||
    queryLower.includes('priority') ||
    queryLower.includes('start')
  ) {
    const sorted = [...subscriptions].sort((a, b) => b.leakScore.totalScore - a.leakScore.totalScore);
    const top = sorted[0];
    if (top) {
      return `You should cancel ${top.merchantName} first. It carries your highest Leak Score (${top.leakScore.totalScore}/100) costing ₹${top.currentAmount}/month (${top.leakScore.explanation.join('; ')}).`;
    }
  }

  // Priority 2: General total savings calculation
  if (queryLower.includes('how much') || queryLower.includes('save') || queryLower.includes('savings') || queryLower.includes('total cancel')) {
    const res = computeSavingsIfCancelled(50, subscriptions);
    const data = res.data as { cancelledCount: number; monthlySavingsINR: number; annualSavingsINR: number; cancelledSubscriptions: string[] };
    if (data && data.cancelledCount > 0) {
      return `Based on your computed data, cancelling your ${data.cancelledCount} high-leak subscription(s) (${data.cancelledSubscriptions.join(', ')}) will save you ₹${data.monthlySavingsINR.toLocaleString()}/month, totaling ₹${data.annualSavingsINR.toLocaleString()}/year in recaptured savings.`;
    }
  }

  // Priority 3: Top/worst/highest leaks list
  if (queryLower.includes('top') || queryLower.includes('worst') || queryLower.includes('highest')) {
    const res = getTopLeaksByScore(50, subscriptions);
    const data = res.data as { merchantName: string; leakScore: number; monthlyCost: number }[];
    if (data && data.length > 0) {
      const topList = data.map((d) => `${d.merchantName} (Score ${d.leakScore}/100, ₹${d.monthlyCost}/mo)`).join(', ');
      return `Your top flagged leak subscriptions are: ${topList}.`;
    }
  }

  // Priority 4: Category breakdown
  if (queryLower.includes('category') || queryLower.includes('breakdown')) {
    const res = getCategorySpendBreakdown(subscriptions);
    const data = res.data as Record<string, { spend: number; count: number }>;
    const cats = Object.entries(data).map(([cat, val]) => `${cat}: ₹${val.spend}/mo (${val.count} subs)`).join(' | ');
    return `Category spend breakdown: ${cats}`;
  }

  // Priority 5: Specific merchant lookup
  for (const sub of subscriptions) {
    if (queryLower.includes(sub.merchantName.toLowerCase())) {
      const res = getSubscriptionByName(sub.merchantName, subscriptions);
      const d = res.data as { merchantName: string; leakScore: number; currentMonthlyAmount: number; explanations: string[] };
      return `${d.merchantName} is currently billed at ₹${d.currentMonthlyAmount}/month with a Leak Score of ${d.leakScore}/100. Factors: ${d.explanations.join('; ')}.`;
    }
  }

  return `Based on your loaded report (${subscriptions.length} subscriptions detected): You have a total monthly recurring spend of ₹${subscriptions.reduce((sum, s) => sum + s.currentAmount, 0).toLocaleString()}/month. Your highest leak subscription is ${subscriptions[0]?.merchantName || 'None'} with a score of ${subscriptions[0]?.leakScore.totalScore || 0}/100.`;
}

export async function processChatQueryWithTools(
  userQuery: string,
  subscriptions: SubscriptionItem[],
  summary: DashboardSummary
): Promise<ChatResponseResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (!apiKey || apiKey.includes('your_gemini_api_key')) {
    console.warn('⚠️ [SubSense AI]: No valid GEMINI_API_KEY configured. Running offline grounded query engine.');
    return {
      text: runLocalOfflineQuery(userQuery, subscriptions),
      source: 'fallback',
      errorDetails: 'No GEMINI_API_KEY configured in .env',
    };
  }

  try {
    console.log(`⚡ [SubSense AI]: Querying Gemini API (${modelName}) for question: "${userQuery}"`);
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are SubSense AI, an enterprise-grade financial analyst for recurring subscription leaks.
Answer the user's question using the provided tools to query their real computed transaction dataset.
Rule: Always invoke a tool to get grounded facts before answering. Do NOT hallucinate data not returned by tools.

Loaded Report Summary:
- Total Subscriptions: ${summary.totalSubscriptions}
- Total Monthly Spend: ₹${summary.totalMonthlySpend}
- High Leak Count: ${summary.highLeakSubscriptions}

User Question: "${userQuery}"`;

    const callPromise = ai.models.generateContent({
      model: modelName,
      contents: systemPrompt,
      config: {
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini Chat timed out')), GEMINI_API_TIMEOUT_MS)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);
    
    const functionCalls = response.functionCalls || [];

    if (functionCalls && functionCalls.length > 0) {
      const toolResults: string[] = [];

      for (const fc of functionCalls) {
        const name = fc.name;
        const args = fc.args as Record<string, unknown>;

        let res = '';
        if (name === 'getSubscriptionByName') {
          res = JSON.stringify(getSubscriptionByName(String(args.merchantName || ''), subscriptions));
        } else if (name === 'getTopLeaksByScore') {
          res = JSON.stringify(getTopLeaksByScore(Number(args.minScore || 50), subscriptions));
        } else if (name === 'computeSavingsIfCancelled') {
          const rawTarget = args.targetSubNamesOrMinScore;
          res = JSON.stringify(computeSavingsIfCancelled(Array.isArray(rawTarget) ? rawTarget : Number(rawTarget || 50), subscriptions));
        } else if (name === 'getCategorySpendBreakdown') {
          res = JSON.stringify(getCategorySpendBreakdown(subscriptions));
        }

        toolResults.push(`Tool ${name} Output: ${res}`);
      }

      const followupPrompt = `${systemPrompt}\n\nTool Execution Results:\n${toolResults.join('\n')}\n\nProvide a concise, punchy, grounded answer to the user.`;

      const finalResponse = await ai.models.generateContent({
        model: modelName,
        contents: followupPrompt,
      });

      return {
        text: finalResponse.text || runLocalOfflineQuery(userQuery, subscriptions),
        source: 'gemini',
      };
    }

    return {
      text: response.text || runLocalOfflineQuery(userQuery, subscriptions),
      source: 'gemini',
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.warn('⚠️ [SubSense Fallback]: Gemini API request failed. Reason:', errorMsg);

    let cleanReason = errorMsg;
    if (errorMsg.includes('429') || errorMsg.includes('Quota exceeded')) {
      cleanReason = 'Google Gemini API Free Quota Exceeded (HTTP 429 Rate Limit)';
    } else if (errorMsg.includes('404')) {
      cleanReason = 'Selected Gemini Model Not Found (HTTP 404)';
    }

    return {
      text: runLocalOfflineQuery(userQuery, subscriptions),
      source: 'fallback',
      errorDetails: cleanReason,
    };
  }
}
