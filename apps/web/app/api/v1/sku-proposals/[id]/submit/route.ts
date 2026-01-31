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

    const existing = await prisma.sKUProposal.findUnique({
      where: { id },
      include: {
        items: true,
        otbPlan: {
          include: {
            budget: {
              include: {
                season: true,
                brand: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'SKU proposal not found' },
        { status: 404 }
      );
    }

    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Can only submit draft or rejected proposals' },
        { status: 400 }
      );
    }

    if (existing.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'SKU proposal must have at least one item' },
        { status: 400 }
      );
    }

    // Check for validation errors
    const errorCount = existing.items.filter(
      (item) => item.validationStatus === 'ERROR'
    ).length;

    if (errorCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot submit: ${errorCount} items have validation errors. Please fix or remove them.`,
        },
        { status: 400 }
      );
    }

    // Create workflow
    const workflow = await createWorkflow({
      type: 'SKU_APPROVAL',
      referenceType: 'sku',
      referenceId: id,
      initiatedById: session.user.id,
    });

    // Update proposal status
    const proposal = await prisma.sKUProposal.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        workflowId: workflow.id,
      },
      include: {
        otbPlan: {
          include: {
            budget: {
              include: {
                season: true,
                brand: true,
                location: true,
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
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
      data: proposal,
      message: 'SKU proposal submitted for approval',
    });
  } catch (error) {
    console.error('Error submitting SKU proposal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit SKU proposal' },
      { status: 500 }
    );
  }
}
