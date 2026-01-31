export const runtime = 'nodejs';

/**
 * Automation Run API
 * Triggers automation processes (auto-approval, auto-reorder)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { processAutoApprovals, getAutoApprovalStats } from '@/lib/automation/auto-approver';
import { processAutoReorders, getPendingReorders } from '@/lib/automation/auto-reorder';

export const dynamic = 'force-dynamic';

// GET /api/automation/run - Get automation status and stats
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';

    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    };

    if (type === 'all' || type === 'approval') {
      const approvalStats = await getAutoApprovalStats();
      results.approvalStats = approvalStats;
    }

    if (type === 'all' || type === 'reorder') {
      const pendingReorders = await getPendingReorders();
      results.pendingReorders = {
        count: pendingReorders.length,
        suggestions: pendingReorders.slice(0, 10),
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching automation status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation status' },
      { status: 500 }
    );
  }
}

// POST /api/automation/run - Trigger automation process
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for admin/manager role
    const userRole = (session.user as { role?: string }).role;
    if (!['ADMIN', 'MERCHANDISE_LEAD', 'FINANCE_HEAD'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to run automation' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, dryRun = false } = body;

    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      dryRun,
      executedBy: session.user.id,
    };

    if (type === 'approval' || type === 'all') {
      if (dryRun) {
        results.approvalPreview = {
          message: 'Dry run - no approvals executed',
          wouldProcess: 'Pending workflows would be evaluated against rules',
        };
      } else {
        const approvalResults = await processAutoApprovals();
        results.approvalResults = {
          processed: approvalResults.length,
          approved: approvalResults.filter(r => r.action === 'approved').length,
          skipped: approvalResults.filter(r => r.action === 'skipped').length,
          errors: approvalResults.filter(r => r.action === 'error').length,
          details: approvalResults,
        };
      }
    }

    if (type === 'reorder' || type === 'all') {
      if (dryRun) {
        results.reorderPreview = {
          message: 'Dry run - no reorders created',
          wouldProcess: 'SKU items would be evaluated for low stock',
        };
      } else {
        const reorderResults = await processAutoReorders();
        results.reorderResults = {
          success: reorderResults.success,
          suggestionsCreated: reorderResults.suggestionsCreated,
          criticalItems: reorderResults.criticalItems,
          totalReorderValue: reorderResults.totalReorderValue,
          suggestions: reorderResults.suggestions.slice(0, 20),
        };
      }
    }

    if (!type || !['approval', 'reorder', 'all'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Use: approval, reorder, or all' },
        { status: 400 }
      );
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Error running automation:', error);
    return NextResponse.json(
      { error: 'Failed to run automation' },
      { status: 500 }
    );
  }
}
