export const runtime = 'nodejs';

/**
 * Reorder Suggestions API
 * Manage auto-reorder suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getPendingReorders,
  processReorderSuggestion,
} from '@/lib/automation/auto-reorder';

export const dynamic = 'force-dynamic';

// GET /api/automation/reorders - Get pending reorder suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const urgency = searchParams.get('urgency');
    const limit = parseInt(searchParams.get('limit') || '50');

    let suggestions = await getPendingReorders();

    // Filter by urgency if specified
    if (urgency) {
      suggestions = suggestions.filter(s => s.urgency === urgency);
    }

    // Apply limit
    suggestions = suggestions.slice(0, limit);

    // Calculate summary
    const summary = {
      total: suggestions.length,
      critical: suggestions.filter(s => s.urgency === 'critical').length,
      high: suggestions.filter(s => s.urgency === 'high').length,
      medium: suggestions.filter(s => s.urgency === 'medium').length,
      low: suggestions.filter(s => s.urgency === 'low').length,
      totalValue: suggestions.reduce((sum, s) => sum + s.estimatedCost, 0),
      totalUnits: suggestions.reduce((sum, s) => sum + s.reorderQuantity, 0),
    };

    return NextResponse.json({
      suggestions,
      summary,
    });
  } catch (error) {
    console.error('Error fetching reorder suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reorder suggestions' },
      { status: 500 }
    );
  }
}

// POST /api/automation/reorders - Process reorder suggestion (approve/reject)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { suggestionId, action, comment } = body;

    // Validate required fields
    if (!suggestionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: suggestionId, action' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: approve or reject' },
        { status: 400 }
      );
    }

    // Process the suggestion
    const result = await processReorderSuggestion(
      suggestionId,
      action,
      session.user.id,
      comment
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to process suggestion' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Reorder suggestion ${action}d successfully`,
      suggestionId,
      action,
    });
  } catch (error) {
    console.error('Error processing reorder suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to process reorder suggestion' },
      { status: 500 }
    );
  }
}

// PUT /api/automation/reorders - Bulk process reorder suggestions
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { suggestionIds, action, comment } = body;

    // Validate required fields
    if (!suggestionIds || !Array.isArray(suggestionIds) || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: suggestionIds (array), action' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: approve or reject' },
        { status: 400 }
      );
    }

    // Process each suggestion
    const results = await Promise.all(
      suggestionIds.map(id =>
        processReorderSuggestion(id, action, session.user.id, comment)
      )
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failed === 0,
      message: `Processed ${successful} suggestions, ${failed} failed`,
      processed: successful,
      failed,
      action,
    });
  } catch (error) {
    console.error('Error bulk processing reorder suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to bulk process reorder suggestions' },
      { status: 500 }
    );
  }
}
