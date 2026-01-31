export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createWorkflow } from '@/lib/workflow/engine';

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

    const existing = await prisma.oTBPlan.findUnique({
      where: { id },
      include: {
        lineItems: true,
        budget: {
          include: {
            season: true,
            brand: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'OTB plan not found' }, { status: 404 });
    }

    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Can only submit draft or rejected plans' },
        { status: 400 }
      );
    }

    if (existing.lineItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'OTB plan must have at least one line item' },
        { status: 400 }
      );
    }

    // Calculate total buy value
    const totalPlannedAmount = existing.lineItems.reduce(
      (sum, item) => sum + Number(item.userBuyValue),
      0
    );

    // Validate against budget
    if (totalPlannedAmount > Number(existing.budget.totalBudget)) {
      return NextResponse.json(
        {
          success: false,
          error: `Total planned amount ($${totalPlannedAmount.toLocaleString()}) exceeds budget ($${Number(existing.budget.totalBudget).toLocaleString()})`,
        },
        { status: 400 }
      );
    }

    // Create workflow
    const workflow = await createWorkflow({
      type: 'OTB_APPROVAL',
      referenceType: 'otb',
      referenceId: id,
      initiatedById: session.user.id,
    });

    // Update plan status
    const plan = await prisma.oTBPlan.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        workflowId: workflow.id,
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
      message: 'OTB plan submitted for approval',
    });
  } catch (error) {
    console.error('Error submitting OTB plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit OTB plan' },
      { status: 500 }
    );
  }
}
