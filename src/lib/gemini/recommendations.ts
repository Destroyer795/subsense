import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { SubscriptionItem, GeminiRecommendation, EmailDraft } from '../../types';
import { GEMINI_API_TIMEOUT_MS } from '../constants';

const RecommendationSchema = z.object({
  action: z.enum(['cancel', 'downgrade', 'renegotiate', 'keep']),
  headline: z.string(),
  reason: z.string(),
  potentialAnnualSavings: z.number(),
  riskLevel: z.enum(['low', 'medium', 'high']),
});

const EmailDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
  recipientHint: z.string(),
});

function getOfflineRecommendationFallback(subscription: SubscriptionItem): GeminiRecommendation {
  let action: GeminiRecommendation['action'] = 'keep';
  let headline = 'Subscription billing pattern is active & stable';
  let reason = 'Regular interval billing detected with no price drift.';
  let savings = 0;
  let riskLevel: GeminiRecommendation['riskLevel'] = 'low';

  if (subscription.leakScore.totalScore >= 60 || subscription.isDormant) {
    action = 'cancel';
    headline = `Cancel unused ${subscription.merchantName} subscription`;
    reason = `Flagged as dormant with leak score of ${subscription.leakScore.totalScore}/100. Saves ₹${(subscription.averageMonthlyCost * 12).toLocaleString()}/yr.`;
    savings = subscription.averageMonthlyCost * 12;
    riskLevel = 'low';
  } else if (subscription.priceDrift.isHikeDetected) {
    action = 'downgrade';
    headline = `Downgrade ${subscription.merchantName} plan following price hike`;
    reason = `Recent price increase of +${subscription.priceDrift.percentageChange}%. Request tier downgrade.`;
    savings = Math.round(subscription.averageMonthlyCost * 0.4 * 12);
    riskLevel = 'medium';
  }

  return {
    subscriptionId: subscription.id,
    action,
    headline,
    reason,
    potentialAnnualSavings: savings,
    riskLevel,
  };
}

function getOfflineEmailDraftFallback(
  subscription: SubscriptionItem,
  actionType: 'cancel' | 'downgrade' | 'renegotiate'
): EmailDraft {
  const isCancel = actionType === 'cancel';
  const cleanMerchant = subscription.merchantName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return {
    subscriptionId: subscription.id,
    subject: isCancel
      ? `Request for Cancellation of ${subscription.merchantName} Subscription`
      : `Request to Downgrade Plan / Review Pricing for ${subscription.merchantName}`,
    recipientHint: `support@${cleanMerchant}.com`,
    body: `Dear ${subscription.merchantName} Support Team,

I am writing to formally request the ${isCancel ? 'cancellation' : 'downgrade'} of my active subscription associated with my registered email/account.

Subscription Details:
- Service: ${subscription.merchantName}
- Current Monthly Billing: ₹${subscription.currentAmount}
- Last Charge Date: ${subscription.lastBilledDate}

${
  isCancel
    ? 'Please process this cancellation immediately and confirm that no further recurring payments will be charged to my payment method. Kindly send a confirmation of cancellation and final invoice for my records.'
    : `Following recent price adjustments (+${subscription.priceDrift.percentageChange}%), I would like to request a downgrade to your basic/essential tier or inquire about available promotional retention discounts.`
}

Thank you for your prompt assistance.

Best regards,
[Your Name]`,
  };
}

export async function generateGeminiRecommendation(
  subscription: SubscriptionItem
): Promise<GeminiRecommendation> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return getOfflineRecommendationFallback(subscription);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analyze this subscription and provide a cost-optimization recommendation:
Merchant: ${subscription.merchantName}
Category: ${subscription.category}
Monthly Spend: ₹${subscription.currentAmount}
Price Hike Detected: ${subscription.priceDrift.isHikeDetected ? 'YES' : 'NO'} (${subscription.priceDrift.percentageChange}%)
Is Dormant/Unused: ${subscription.isDormant ? 'YES' : 'NO'}
Leak Score: ${subscription.leakScore.totalScore}/100

Provide action (cancel, downgrade, renegotiate, or keep), punchy headline, 1-sentence reason, projected annual savings in INR, and risk level (low, medium, high).`;

    // Demo-safety 8s timeout promise race
    const callPromise = ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ['cancel', 'downgrade', 'renegotiate', 'keep'] },
            headline: { type: Type.STRING },
            reason: { type: Type.STRING },
            potentialAnnualSavings: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          },
          required: ['action', 'headline', 'reason', 'potentialAnnualSavings', 'riskLevel'],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), GEMINI_API_TIMEOUT_MS)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);
    const rawText = response.text || '';
    if (!rawText) return getOfflineRecommendationFallback(subscription);

    const parsed = JSON.parse(rawText);
    const validated = RecommendationSchema.parse(parsed);

    return {
      subscriptionId: subscription.id,
      action: validated.action as GeminiRecommendation['action'],
      headline: validated.headline,
      reason: validated.reason,
      potentialAnnualSavings: validated.potentialAnnualSavings,
      riskLevel: validated.riskLevel as GeminiRecommendation['riskLevel'],
    };
  } catch (error) {
    console.warn('Gemini API recommendation error/timeout. Falling back to offline engine:', error);
    return getOfflineRecommendationFallback(subscription);
  }
}

export async function generateCancellationEmailDraft(
  subscription: SubscriptionItem,
  actionType: 'cancel' | 'downgrade' | 'renegotiate' = 'cancel'
): Promise<EmailDraft> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return getOfflineEmailDraftFallback(subscription, actionType);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Draft a firm, professional, personalized ${actionType} email to ${subscription.merchantName}.
Details:
- Merchant: ${subscription.merchantName}
- Current Spend: ₹${subscription.currentAmount}/month
- Price Change: +${subscription.priceDrift.percentageChange}%
- Action: ${actionType}

Return JSON with subject line, email body (with placeholders like [Your Name]), and recipient support email hint.`;

    const callPromise = ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
            recipientHint: { type: Type.STRING },
          },
          required: ['subject', 'body', 'recipientHint'],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API email generation timed out')), GEMINI_API_TIMEOUT_MS)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);
    const rawText = response.text || '';
    if (!rawText) return getOfflineEmailDraftFallback(subscription, actionType);

    const parsed = JSON.parse(rawText);
    const validated = EmailDraftSchema.parse(parsed);

    return {
      subscriptionId: subscription.id,
      subject: validated.subject,
      body: validated.body,
      recipientHint: validated.recipientHint,
    };
  } catch (error) {
    console.warn('Gemini API email draft error/timeout. Falling back to offline draft:', error);
    return getOfflineEmailDraftFallback(subscription, actionType);
  }
}
