export const runtime = 'nodejs';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateOTBProposal, logAIInteraction } from '@/lib/ai';

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
        lineItems: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'OTB plan not found' }, { status: 404 });
    }

    // Get categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Get historical data (previous season OTB plans)
    const historicalPlans = await prisma.oTBPlan.findMany({
      where: {
        budget: {
          brandId: plan.budget.brandId,
          seasonId: { not: plan.budget.seasonId },
        },
        status: 'APPROVED',
      },
      include: {
        budget: {
          include: { season: true },
        },
        lineItems: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Prepare historical data for AI
    const historicalData = historicalPlans.map((hp) => ({
      season: hp.budget.season.code,
      totalBudget: Number(hp.budget.totalBudget),
      lineItems: hp.lineItems.map((li) => ({
        category: li.category?.name ?? 'Unknown',
        gender: li.gender,
        units: li.userUnits,
        buyValue: Number(li.userBuyValue),
        buyPct: Number(li.userBuyPct),
      })),
    }));

    // Generate AI proposal
    const startTime = Date.now();
    const proposal = await generateOTBProposal({
      budget: Number(plan.budget.totalBudget),
      season: plan.budget.season.code,
      brand: plan.budget.brand.name,
      historicalData: historicalData.flatMap(hp =>
        hp.lineItems.map(li => ({
          category: li.category,
          historicalPct: li.buyPct,
          historicalValue: li.buyValue,
        }))
      ),
    });
    const responseTime = Date.now() - startTime;

    // Log AI interaction
    await logAIInteraction({
      userId: session.user.id,
      action: 'generate_otb_proposal',
      context: {
        entityType: 'OTB_PLAN',
        entityId: id,
        budgetAmount: Number(plan.budget.totalBudget),
        categoriesCount: categories.length,
        historicalPlansCount: historicalPlans.length,
      },
      latencyMs: responseTime,
    });

    return NextResponse.json({
      success: true,
      data: {
        proposals: proposal.proposals,
        overallConfidence: proposal.overallConfidence,
        executiveSummary: proposal.executiveSummary,
      },
    });
  } catch (error) {
    console.error('Error generating AI proposal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate AI proposal' },
      { status: 500 }
    );
  }
}
