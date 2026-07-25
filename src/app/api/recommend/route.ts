import { NextResponse } from 'next/server';
import { generateGeminiRecommendation } from '@/lib/gemini/recommendations';
import { SubscriptionItem } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subscription: SubscriptionItem = body.subscription;

    if (!subscription || !subscription.merchantName) {
      return NextResponse.json({ error: 'Valid subscription object is required' }, { status: 400 });
    }

    const recommendation = await generateGeminiRecommendation(subscription);
    return NextResponse.json({ success: true, recommendation });
  } catch (error) {
    console.error('Error in /api/recommend route:', error);
    return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 });
  }
}
