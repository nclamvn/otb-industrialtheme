export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { chat, logAIInteraction } from '@/lib/ai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages are required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Call AI chat function
    const response = await chat(messages as ChatMessage[], context);

    const responseTime = Date.now() - startTime;

    // Log interaction
    await logAIInteraction({
      userId: session.user.id,
      action: 'chat',
      context: {
        entityType: context?.entityType || 'GENERAL',
        entityId: context?.entityId,
        page: context?.page,
        messageCount: messages.length,
      },
      result: {
        success: true,
      },
      latencyMs: responseTime,
    });

    return NextResponse.json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
