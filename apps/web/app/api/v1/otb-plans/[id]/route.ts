export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { otbBulkUpdateSchema } from '@/lib/validations/otb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const plan = await prisma.oTBPlan.findUnique({
      where: { id },
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
          orderBy: [{ gender: 'asc' }, { category: { name: 'asc' } }],
        },
        sizingAnalysis: true,
        workflow: {
          include: {
            steps: {
              include: {
                actionBy: { select: { id: true, name: true } },
              },
              orderBy: { stepNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'OTB plan not found' }, { status: 404 });
    }

    // Calculate summary
    const summary = {
      totalPlannedUnits: plan.lineItems.reduce((sum, item) => sum + (item.userUnits || 0), 0),
      totalPlannedAmount: plan.lineItems.reduce(
        (sum, item) => sum + Number(item.userBuyValue),
        0
      ),
      avgBuyPct:
        plan.lineItems.length > 0
          ? plan.lineItems.reduce((sum, item) => sum + Number(item.userBuyPct), 0) /
            plan.lineItems.length
          : 0,
      budgetUtilization:
        Number(plan.budget.totalBudget) > 0
          ? (plan.lineItems.reduce((sum, item) => sum + Number(item.userBuyValue), 0) /
              Number(plan.budget.totalBudget)) *
            100
          : 0,
    };

    // Get previous version for comparison
    let previousVersion = null;
    if (plan.version > 1) {
      previousVersion = await prisma.oTBPlan.findFirst({
        where: {
          budgetId: plan.budgetId,
          version: plan.version - 1,
        },
        include: {
          lineItems: {
            include: {
              category: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: plan,
      summary,
      previousVersion,
    });
  } catch (error) {
    console.error('Error fetching OTB plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch OTB plan' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const existing = await prisma.oTBPlan.findUnique({
      where: { id },
      include: { budget: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'OTB plan not found' }, { status: 404 });
    }

    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Can only edit draft or rejected plans' },
        { status: 400 }
      );
    }

    // Validate bulk update data
    const validation = otbBulkUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { lineItems } = validation.data;

    // Use transaction to update line items
    await prisma.$transaction(async (tx) => {
      // Delete existing line items that are not in the update
      const existingIds = lineItems.filter((item) => item.id).map((item) => item.id);
      await tx.oTBLineItem.deleteMany({
        where: {
          otbPlanId: id,
          id: { notIn: existingIds as string[] },
        },
      });

      // Upsert line items
      for (const item of lineItems) {
        if (item.id) {
          await tx.oTBLineItem.update({
            where: { id: item.id },
            data: {
              categoryId: item.categoryId,
              gender: item.gender,
              level: item.level,
              userUnits: item.userUnits,
              userBuyValue: item.userBuyValue,
              userBuyPct: item.userBuyPct,
              comment: item.comment,
            },
          });
        } else {
          await tx.oTBLineItem.create({
            data: {
              otbPlanId: id,
              categoryId: item.categoryId,
              gender: item.gender,
              level: item.level,
              userUnits: item.userUnits,
              userBuyValue: item.userBuyValue,
              userBuyPct: item.userBuyPct,
              comment: item.comment,
            },
          });
        }
      }

      // Update plan metadata
      await tx.oTBPlan.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          ...(body.name && { name: body.name }),
        },
      });
    });

    // Fetch updated plan
    const plan = await prisma.oTBPlan.findUnique({
      where: { id },
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
          orderBy: [{ gender: 'asc' }, { category: { name: 'asc' } }],
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error updating OTB plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update OTB plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'OTB plan not found' }, { status: 404 });
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Can only delete draft plans' },
        { status: 400 }
      );
    }

    // Delete line items and plan
    await prisma.$transaction(async (tx) => {
      await tx.sizingAnalysis.deleteMany({
        where: { otbPlanId: id },
      });
      await tx.oTBLineItem.deleteMany({
        where: { otbPlanId: id },
      });
      await tx.oTBPlan.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'OTB plan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting OTB plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete OTB plan' },
      { status: 500 }
    );
  }
}
