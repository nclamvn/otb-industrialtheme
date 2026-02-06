export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { otbPlanCreateSchema } from '@/lib/validations/otb';
import { mockOTBPlans } from '@/lib/mock-data';
import { OTB_PLAN_STATUSES, safeOTBStatus } from '@/lib/utils/enum-helpers';
import { Prisma } from '@prisma/client';

// Helper to safely convert Decimal to number
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  // Handle Prisma Decimal
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const budgetId = searchParams.get('budgetId');
    const seasonId = searchParams.get('seasonId');
    const brandId = searchParams.get('brandId');
    const status = searchParams.get('status');

    let plansWithSummary;

    try {
      const where: Record<string, unknown> = {};

      if (budgetId) where.budgetId = budgetId;
      if (status && OTB_PLAN_STATUSES.includes(status as typeof OTB_PLAN_STATUSES[number])) {
        where.status = status;
      }

      if (seasonId || brandId) {
        where.budget = {};
        if (seasonId) (where.budget as Record<string, unknown>).seasonId = seasonId;
        if (brandId) (where.budget as Record<string, unknown>).brandId = brandId;
      }

      const plans = await prisma.oTBPlan.findMany({
        where,
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
          _count: {
            select: { lineItems: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate summary with safe Decimal conversion
      plansWithSummary = plans.map((plan) => {
        try {
          const totalPlannedUnits = plan.lineItems.reduce(
            (sum, item) => sum + (item.userUnits || 0),
            0
          );
          const totalPlannedAmount = plan.lineItems.reduce(
            (sum, item) => sum + toNumber(item.userBuyValue),
            0
          );
          const avgBuyPct = plan.lineItems.length > 0
            ? plan.lineItems.reduce((sum, item) => sum + toNumber(item.userBuyPct), 0) / plan.lineItems.length
            : 0;

          return {
            ...plan,
            status: safeOTBStatus(plan.status),
            totalOTBValue: toNumber(plan.totalOTBValue),
            summary: {
              totalPlannedUnits,
              totalPlannedAmount,
              avgBuyPct,
              itemCount: plan._count.lineItems,
            },
          };
        } catch (mapError) {
          console.error(`Error processing plan ${plan.id}:`, mapError);
          return {
            ...plan,
            status: safeOTBStatus(plan.status),
            totalOTBValue: 0,
            summary: {
              totalPlannedUnits: 0,
              totalPlannedAmount: 0,
              avgBuyPct: 0,
              itemCount: plan._count?.lineItems || 0,
            },
          };
        }
      });
    } catch (dbError) {
      console.error('Database error fetching OTB plans:', dbError);
      // Use mock data when database is unavailable
      const filteredPlans = mockOTBPlans.filter(p => {
        if (budgetId && p.budgetId !== budgetId) return false;
        if (status && p.status !== status) return false;
        if (seasonId && p.seasonId !== seasonId) return false;
        if (brandId && p.brandId !== brandId) return false;
        return true;
      });

      plansWithSummary = filteredPlans.map(plan => {
        const totalPlannedUnits = plan.lineItems?.reduce(
          (sum, item) => sum + (item.userUnits || 0),
          0
        ) || 0;
        const totalPlannedAmount = plan.lineItems?.reduce(
          (sum, item) => sum + (item.userBuyValue || 0),
          0
        ) || toNumber(plan.totalOTBValue);
        const avgBuyPct = plan.lineItems && plan.lineItems.length > 0
          ? plan.lineItems.reduce((sum, item) => sum + (item.userBuyPct || 0), 0) / plan.lineItems.length
          : 0;

        return {
          ...plan,
          totalOTBValue: toNumber(plan.totalOTBValue),
          summary: {
            totalPlannedUnits,
            totalPlannedAmount,
            avgBuyPct,
            itemCount: plan._count?.lineItems || plan.lineItems?.length || 0,
          },
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: plansWithSummary,
    });
  } catch (error) {
    console.error('Error fetching OTB plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch OTB plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = otbPlanCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message, details: validation.error.errors },
        { status: 400 }
      );
    }

    const { budgetId, name, versionType } = validation.data;

    // 3. Verify budget exists and is approved
    const budget = await prisma.budgetAllocation.findUnique({
      where: { id: budgetId },
      include: {
        season: true,
        brand: true,
        location: true,
      },
    });

    if (!budget) {
      return NextResponse.json(
        { success: false, error: 'Budget not found', details: { budgetId } },
        { status: 404 }
      );
    }

    if (budget.status !== 'APPROVED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Budget must be approved before creating OTB plan',
          details: { currentStatus: budget.status }
        },
        { status: 400 }
      );
    }

    // 4. Verify user exists
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 400 }
      );
    }

    // 5. Get version number atomically to prevent race conditions
    let plan;
    try {
      plan = await prisma.$transaction(async (tx) => {
        const existingPlans = await tx.oTBPlan.count({
          where: { budgetId },
        });

        const newPlan = await tx.oTBPlan.create({
          data: {
            budgetId,
            seasonId: budget.seasonId,
            brandId: budget.brandId,
            versionName: name || `OTB Plan v${existingPlans + 1}`,
            versionType: versionType || 'V0_SYSTEM',
            version: existingPlans + 1,
            totalOTBValue: 0,
            totalSKUCount: 0,
            status: 'DRAFT',
            createdById: session.user.id,
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
          },
        });

        return newPlan;
      });
    } catch (txError: unknown) {
      // Handle specific Prisma errors
      const err = txError as { code?: string; meta?: unknown; message?: string };
      if (err.code) {
        console.error('Prisma error creating OTB plan:', {
          code: err.code,
          meta: err.meta,
          message: err.message,
        });

        if (err.code === 'P2002') {
          return NextResponse.json(
            { success: false, error: 'OTB plan version already exists', details: err.meta },
            { status: 409 }
          );
        }
        if (err.code === 'P2003') {
          return NextResponse.json(
            { success: false, error: 'Foreign key constraint failed', details: err.meta },
            { status: 400 }
          );
        }
        if (err.code === 'P2025') {
          return NextResponse.json(
            { success: false, error: 'Related record not found', details: err.meta },
            { status: 404 }
          );
        }
      }

      console.error('Transaction error creating OTB plan:', txError);
      throw txError;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        totalOTBValue: toNumber(plan.totalOTBValue),
      },
    });
  } catch (error) {
    console.error('Error creating OTB plan:', error);

    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create OTB plan',
        ...(isDev && { details: errorMessage }),
      },
      { status: 500 }
    );
  }
}
