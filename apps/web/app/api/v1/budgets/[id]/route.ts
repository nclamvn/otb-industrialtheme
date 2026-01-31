export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const budget = await prisma.budgetAllocation.findUnique({
      where: { id },
      include: {
        season: true,
        brand: { include: { division: true } },
        location: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        approvedBy: { select: { id: true, name: true, email: true, role: true } },
        rejectedBy: { select: { id: true, name: true, email: true, role: true } },
        workflow: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
              include: {
                assignedUser: { select: { id: true, name: true, email: true } },
                actionBy: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        parentVersion: true,
        childVersions: true,
        otbPlans: {
          select: {
            id: true,
            version: true,
            versionType: true,
            status: true,
            totalOTBValue: true,
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Get previous season budget for comparison
    const previousSeasonBudget = await prisma.budgetAllocation.findFirst({
      where: {
        brandId: budget.brandId,
        locationId: budget.locationId,
        status: 'APPROVED',
        season: {
          year: budget.season.year - 1,
          seasonGroup: budget.season.seasonGroup,
        },
      },
      select: {
        id: true,
        totalBudget: true,
        season: { select: { code: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: budget,
      comparison: previousSeasonBudget,
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budget' },
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

    const existing = await prisma.budgetAllocation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Only allow editing DRAFT or REJECTED budgets
    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot edit budget in current status' },
        { status: 400 }
      );
    }

    const {
      totalBudget,
      seasonalBudget,
      replenishmentBudget,
      currency,
      comments,
      assumptions,
    } = body;

    const budget = await prisma.budgetAllocation.update({
      where: { id },
      data: {
        totalBudget,
        seasonalBudget,
        replenishmentBudget,
        currency,
        comments,
        assumptions,
        // Reset rejection if was rejected
        ...(existing.status === 'REJECTED' && {
          status: 'DRAFT',
          rejectedById: null,
          rejectedAt: null,
          rejectionReason: null,
        }),
      },
      include: {
        season: true,
        brand: true,
        location: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update budget' },
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

    const existing = await prisma.budgetAllocation.findUnique({
      where: { id },
      include: { otbPlans: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Only allow deleting DRAFT budgets
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Only draft budgets can be deleted' },
        { status: 400 }
      );
    }

    // Check for OTB plans
    if (existing.otbPlans.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete budget with OTB plans' },
        { status: 400 }
      );
    }

    await prisma.budgetAllocation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Budget deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}
