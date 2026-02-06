export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getSuggestions } from '@/lib/ai/tools/get-suggestions';

// GET endpoint to fetch suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'buy_recommendations';
    const seasonId = searchParams.get('seasonId') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await getSuggestions(
      {
        suggestion_type: type,
        context: { seasonId, brandId, categoryId },
        limit,
      },
      session.user.id
    );

    // Also fetch saved suggestions from database
    const savedSuggestions = await prisma.aISuggestion.findMany({
      where: {
        userId: session.user.id,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      ...result,
      savedSuggestions,
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

// POST endpoint to save/act on a suggestion
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, suggestion, suggestionId } = body;

    if (action === 'save') {
      // Save a new suggestion
      const saved = await prisma.aISuggestion.create({
        data: {
          userId: session.user.id,
          type: mapSuggestionType(suggestion.type),
          title: suggestion.title,
          description: suggestion.description,
          confidence: suggestion.confidence || 0.5,
          priority: mapPriority(suggestion.priority),
          impact: mapImpact(suggestion.impact),
          reasoning: suggestion.reasoning,
          data: suggestion.data || {},
          metrics: suggestion.projectedImpact,
          status: 'PENDING',
        },
      });

      return NextResponse.json({ success: true, suggestion: saved });
    }

    if (action === 'accept' && suggestionId) {
      // Mark suggestion as accepted
      const updated = await prisma.aISuggestion.update({
        where: { id: suggestionId },
        data: {
          status: 'ACCEPTED',
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, suggestion: updated });
    }

    if (action === 'reject' && suggestionId) {
      // Mark suggestion as rejected
      const updated = await prisma.aISuggestion.update({
        where: { id: suggestionId },
        data: { status: 'REJECTED' },
      });

      return NextResponse.json({ success: true, suggestion: updated });
    }

    if (action === 'dismiss' && suggestionId) {
      // Mark suggestion as dismissed
      const updated = await prisma.aISuggestion.update({
        where: { id: suggestionId },
        data: { status: 'REJECTED', reviewNotes: 'Dismissed by user' },
      });

      return NextResponse.json({ success: true, suggestion: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Suggestion action error:', error);
    return NextResponse.json(
      { error: 'Failed to process suggestion action' },
      { status: 500 }
    );
  }
}

function mapPriority(priority: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  const mapping: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    urgent: 'URGENT',
  };
  return mapping[priority] || 'MEDIUM';
}

type AISuggestionTypeValue = 'BUY_RECOMMENDATION' | 'MARKDOWN_RECOMMENDATION' | 'TRANSFER_RECOMMENDATION' | 'REORDER_RECOMMENDATION' | 'CANCEL_RECOMMENDATION' | 'PRICING_RECOMMENDATION';

function mapSuggestionType(type: string): AISuggestionTypeValue {
  const mapping: Record<string, AISuggestionTypeValue> = {
    buy: 'BUY_RECOMMENDATION',
    buy_recommendation: 'BUY_RECOMMENDATION',
    markdown: 'MARKDOWN_RECOMMENDATION',
    markdown_recommendation: 'MARKDOWN_RECOMMENDATION',
    transfer: 'TRANSFER_RECOMMENDATION',
    transfer_recommendation: 'TRANSFER_RECOMMENDATION',
    reorder: 'REORDER_RECOMMENDATION',
    reorder_recommendation: 'REORDER_RECOMMENDATION',
    cancel: 'CANCEL_RECOMMENDATION',
    cancel_recommendation: 'CANCEL_RECOMMENDATION',
    pricing: 'PRICING_RECOMMENDATION',
    pricing_recommendation: 'PRICING_RECOMMENDATION',
    category: 'BUY_RECOMMENDATION', // Map category to buy recommendation
    category_optimization: 'BUY_RECOMMENDATION',
  };
  return mapping[type.toLowerCase()] || 'BUY_RECOMMENDATION';
}

function mapImpact(impact: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const mapping: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    critical: 'CRITICAL',
  };
  return mapping[impact?.toLowerCase()] || 'MEDIUM';
}
