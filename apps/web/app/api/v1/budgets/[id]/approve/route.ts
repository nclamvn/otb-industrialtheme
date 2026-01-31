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
    const { comment } = body;

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

    // Process workflow approval
    const result = await processWorkflowAction({
      workflowId: existing.workflow.id,
      stepNumber: existing.workflow.currentStep,
      actionById: session.user.id,
      action: 'approve',
      comment,
    });

    // Update budget status based on workflow result
    let newStatus = existing.status;
    if (result.status === 'completed') {
      newStatus = 'APPROVED';
    } else if (result.status === 'moved_to_next') {
      newStatus = 'UNDER_REVIEW';
    }

    const budget = await prisma.budgetAllocation.update({
      where: { id },
      data: {
        status: newStatus,
        ...(result.status === 'completed' && {
          approvedById: session.user.id,
          approvedAt: new Date(),
        }),
      },
      include: {
        season: true,
        brand: true,
        location: true,
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
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
      workflowStatus: result.status,
      message:
        result.status === 'completed'
          ? 'Budget approved successfully'
          : 'Budget approved, moved to next step',
    });
  } catch (error) {
    console.error('Error approving budget:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve budget' },
      { status: 500 }
    );
  }
}
