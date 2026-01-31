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

    const existing = await prisma.oTBPlan.findUnique({
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
      return NextResponse.json({ success: false, error: 'OTB plan not found' }, { status: 404 });
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'OTB plan is not pending approval' },
        { status: 400 }
      );
    }

    if (!existing.workflow) {
      return NextResponse.json(
        { success: false, error: 'No workflow found for this OTB plan' },
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

    // Update plan status based on workflow result
    let newStatus = existing.status;
    if (result.status === 'completed') {
      newStatus = 'APPROVED';
    } else if (result.status === 'moved_to_next') {
      newStatus = 'UNDER_REVIEW';
    }

    const plan = await prisma.oTBPlan.update({
      where: { id },
      data: {
        status: newStatus,
        ...(result.status === 'completed' && {
          approvedById: session.user.id,
          approvedAt: new Date(),
        }),
      },
      include: {
        budget: {
          include: {
            season: true,
            brand: true,
            location: true,
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        lineItems: {
          include: {
            category: true,
          },
        },
        workflow: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
      workflowStatus: result.status,
      message:
        result.status === 'completed'
          ? 'OTB plan approved successfully'
          : 'OTB plan approved, moved to next step',
    });
  } catch (error) {
    console.error('Error approving OTB plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve OTB plan' },
      { status: 500 }
    );
  }
}
