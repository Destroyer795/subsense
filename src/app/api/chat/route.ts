import { NextResponse } from 'next/server';
import { processChatQueryWithTools } from '@/lib/chat/gemini-chat';
import { SubscriptionItem, DashboardSummary } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, subscriptions, summary } = body as {
      query: string;
      subscriptions: SubscriptionItem[];
      summary: DashboardSummary;
    };

    if (!query || !Array.isArray(subscriptions)) {
      return NextResponse.json({ error: 'Valid query and subscriptions list are required' }, { status: 400 });
    }

    const answer = await processChatQueryWithTools(query, subscriptions, summary);
    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error('Error in /api/chat route:', error);
    return NextResponse.json({ error: 'Failed to process chat query' }, { status: 500 });
  }
}
