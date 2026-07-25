import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { SubscriptionItem, GeminiRecommendation, EmailDraft } from '../../types';

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

export async function generateGeminiRecommendation(
  subscription: SubscriptionItem
): Promise<GeminiRecommendation> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    // Deterministic fallback if API key is missing
    let action: GeminiRecommendation['action'] = 'keep';
    let headline = 'Subscription appears active and stable';
    let reason = 'Regular billing pattern with no price drift detected.';
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
      reason = `Recent price increase of +${subscription.priceDrift.percentageChange}%. Consider downgrading to lower tier.`;
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

    const response = await ai.models.generateContent({
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

    const parsed = JSON.parse(response.text() || '{}');
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
    console.error('Error generating Gemini recommendation:', error);
    return {
      subscriptionId: subscription.id,
      action: subscription.isDormant ? 'cancel' : 'keep',
      headline: `Review ${subscription.merchantName} subscription`,
      reason: `Leak score: ${subscription.leakScore.totalScore}/100.`,
      potentialAnnualSavings: subscription.isDormant ? subscription.averageMonthlyCost * 12 : 0,
      riskLevel: 'low',
    };
  }
}

export async function generateCancellationEmailDraft(
  subscription: SubscriptionItem,
  actionType: 'cancel' | 'downgrade' | 'renegotiate' = 'cancel'
): Promise<EmailDraft> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    // High quality offline template fallback
    const isCancel = actionType === 'cancel';
    return {
      subscriptionId: subscription.id,
      subject: isCancel
        ? `Request for Cancellation of ${subscription.merchantName} Subscription`
        : `Request to Downgrade Plan / Review Pricing for ${subscription.merchantName}`,
      recipientHint: `support@${subscription.merchantName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
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

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Draft a firm, professional, personalized ${actionType} email to ${subscription.merchantName}.
Details:
- Merchant: ${subscription.merchantName}
- Current Spend: ₹${subscription.currentAmount}/month
- Price Change: +${subscription.priceDrift.percentageChange}%
- Action: ${actionType}

Return JSON with subject line, email body (with placeholders like [Your Name]), and recipient support email hint.`;

    const response = await ai.models.generateContent({
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

    const parsed = JSON.parse(response.text() || '{}');
    const validated = EmailDraftSchema.parse(parsed);

    return {
      subscriptionId: subscription.id,
      subject: validated.subject,
      body: validated.body,
      recipientHint: validated.recipientHint,
    };
  } catch (error) {
    console.error('Error generating email draft via Gemini:', error);
    return {
      subscriptionId: subscription.id,
      subject: `Notice of Subscription Cancellation - ${subscription.merchantName}`,
      recipientHint: `support@${subscription.merchantName.toLowerCase()}.com`,
      body: `Dear Support Team,\n\nPlease cancel my subscription for ${subscription.merchantName} (billed ₹${subscription.currentAmount}/mo) effective immediately.\n\nThank you,\n[Your Name]`,
    };
  }
}
