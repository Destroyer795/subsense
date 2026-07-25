import { NextResponse } from 'next/server';
import { generateCancellationEmailDraft } from '@/lib/gemini/recommendations';
import { SubscriptionItem } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subscription: SubscriptionItem = body.subscription;
    const actionType: 'cancel' | 'downgrade' | 'renegotiate' = body.actionType || 'cancel';

    if (!subscription || !subscription.merchantName) {
      return NextResponse.json({ error: 'Valid subscription object is required' }, { status: 400 });
    }

    const emailDraft = await generateCancellationEmailDraft(subscription, actionType);
    return NextResponse.json({ success: true, emailDraft });
  } catch (error) {
    console.error('Error in /api/email-draft route:', error);
    return NextResponse.json({ error: 'Failed to generate email draft' }, { status: 500 });
  }
}
