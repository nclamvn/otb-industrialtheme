export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { processWorkflowAction } from '@/lib/workflow/engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.budgetAllocation.findUnique({
      where: { id },
      include: {
        workflow: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      );
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Budget is not pending approval' },
        { status: 400 }
      );
    }

    if (!existing.workflow) {
      return NextResponse.json(
        { success: false, error: 'No workflow found for this budget' },
        { status: 400 }
      );
    }

    // Process workflow rejection
    await processWorkflowAction({
      workflowId: existing.workflow.id,
      stepNumber: existing.workflow.currentStep,
      actionById: session.user.id,
      action: 'reject',
      comment: reason,
    });

    // Update budget status
    const budget = await prisma.budgetAllocation.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById: session.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        season: true,
        brand: true,
        location: true,
        createdBy: { select: { id: true, name: true, email: true } },
        rejectedBy: { select: { id: true, name: true, email: true } },
        workflow: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: budget,
      message: 'Budget rejected',
    });
  } catch (error) {
    console.error('Error rejecting budget:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject budget' },
      { status: 500 }
    );
  }
}
