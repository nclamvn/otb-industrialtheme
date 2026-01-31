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

    const existing = await prisma.budgetAllocation.findUnique({
      where: { id },
      include: { season: true, brand: true, location: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Only DRAFT or REVISED budgets can be submitted
    if (!['DRAFT', 'REVISED'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Budget cannot be submitted in current status' },
        { status: 400 }
      );
    }

    // Create approval workflow
    const workflow = await createWorkflow({
      type: 'BUDGET_APPROVAL',
      referenceId: id,
      referenceType: 'budget',
      initiatedById: session.user.id,
      slaHours: 72,
    });

    // Update budget status
    const budget = await prisma.budgetAllocation.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        workflowId: workflow.id,
      },
      include: {
        season: true,
        brand: true,
        location: true,
        createdBy: { select: { id: true, name: true, email: true } },
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
      message: 'Budget submitted for approval',
    });
  } catch (error) {
    console.error('Error submitting budget:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit budget' },
      { status: 500 }
    );
  }
}
