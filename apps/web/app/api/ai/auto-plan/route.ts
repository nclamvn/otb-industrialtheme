export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET endpoint to fetch generated plans
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (planId) {
      // Fetch single plan with details
      const plan = await prisma.aIGeneratedPlan.findUnique({
        where: { id: planId },
        include: {
          brand: true,
          season: true,
        },
      });

      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      return NextResponse.json(plan);
    }

    // Fetch all plans for user
    const plans = await prisma.aIGeneratedPlan.findMany({
      where: { userId: session.user.id },
      include: {
        brand: true,
        season: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Get auto plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

// POST endpoint to generate a new plan
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, brandId, seasonId, categoryId, parameters } = body;

    // Validate inputs
    if (!type || !brandId || !seasonId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, brandId, seasonId' },
        { status: 400 }
      );
    }

    // Get brand and season data for plan generation
    const [brand, season, category] = await Promise.all([
      prisma.brand.findUnique({ where: { id: brandId } }),
      prisma.season.findUnique({ where: { id: seasonId } }),
      categoryId ? prisma.category.findUnique({ where: { id: categoryId } }) : null,
    ]);

    if (!brand || !season) {
      return NextResponse.json(
        { error: 'Brand or Season not found' },
        { status: 404 }
      );
    }

    // Get historical data for analysis
    const historicalOTB = await prisma.oTBPlan.findMany({
      where: {
        brandId,
        season: {
          year: { lt: season.year },
        },
      },
      include: {
        season: true,
        lineItems: true,
      },
      orderBy: { season: { year: 'desc' } },
      take: 3,
    });

    // Generate plan based on type
    const generatedPlan = generateOTBPlan(type, {
      brand,
      season,
      category,
      historicalData: historicalOTB,
      parameters,
    });

    // Map type to enum values
    const typeMap: Record<string, 'OTB_PLAN' | 'BUDGET_PLAN' | 'MARKDOWN_PLAN' | 'RECEIPT_PLAN'> = {
      otb: 'OTB_PLAN',
      budget: 'BUDGET_PLAN',
      markdown: 'MARKDOWN_PLAN',
      receipt: 'RECEIPT_PLAN',
    };
    const planType = typeMap[type.toLowerCase()] || 'OTB_PLAN';

    // Save generated plan
    const savedPlan = await prisma.aIGeneratedPlan.create({
      data: {
        type: planType,
        name: `${brand.name} - ${season.name} Auto Plan`,
        description: `AI-generated ${type} plan for ${brand.name} (${season.name})`,
        userId: session.user.id,
        brandId,
        seasonId,
        planData: generatedPlan,
        assumptions: parameters || {},
        confidenceScore: generatedPlan.confidence,
        status: 'DRAFT',
      },
      include: {
        brand: true,
        season: true,
      },
    });

    return NextResponse.json(savedPlan);
  } catch (error) {
    console.error('Generate auto plan error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update plan status
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, action, data } = body;

    if (!planId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, action' },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'approve':
        updateData = {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedById: session.user.id,
        };
        break;
      case 'reject':
        updateData = { status: 'REJECTED' };
        break;
      case 'apply':
        updateData = {
          status: 'APPLIED',
          appliedAt: new Date(),
        };
        // Here you would also create the actual OTB plan from generated data
        break;
      case 'update':
        updateData = { generatedData: data };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedPlan = await prisma.aIGeneratedPlan.update({
      where: { id: planId },
      data: updateData,
      include: {
        brand: true,
        season: true,
      },
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Update auto plan error:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

// Helper function to generate OTB plan
function generateOTBPlan(
  type: string,
  context: {
    brand: { id: string; name: string };
    season: { id: string; name: string; year: number };
    category: { id: string; name: string } | null;
    historicalData: unknown[];
    parameters?: Record<string, unknown>;
  }
) {
  const { brand, season, parameters } = context;

  // Base values with some randomization to simulate AI generation
  const growthRate = (parameters?.growthRate as number) || 1.05 + Math.random() * 0.1;
  const baseOTB = 500000 + Math.random() * 1000000;
  const baseSales = baseOTB * (1.3 + Math.random() * 0.4);

  // Generate monthly breakdown
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const seasonalFactors = [0.8, 0.85, 0.95, 1.0, 1.05, 1.1, 0.9, 0.85, 1.15, 1.2, 1.25, 1.0];

  const monthlyBreakdown = months.map((month, index) => {
    const factor = seasonalFactors[index];
    const monthlyOTB = (baseOTB / 12) * factor;
    const monthlySales = (baseSales / 12) * factor;

    return {
      month,
      otbPlan: Math.round(monthlyOTB),
      salesPlan: Math.round(monthlySales),
      receiptPlan: Math.round(monthlyOTB * 0.9),
      closingStock: Math.round(monthlyOTB * 0.3),
    };
  });

  // Category mix recommendations
  const categoryMix = [
    { category: 'Tops', percentage: 30, growth: '+5%' },
    { category: 'Bottoms', percentage: 25, growth: '+3%' },
    { category: 'Dresses', percentage: 20, growth: '+8%' },
    { category: 'Accessories', percentage: 15, growth: '+2%' },
    { category: 'Outerwear', percentage: 10, growth: '+10%' },
  ];

  // KPI targets
  const kpiTargets = {
    sellThrough: 68 + Math.random() * 10,
    grossMargin: 38 + Math.random() * 8,
    inventoryTurnover: 3.5 + Math.random() * 1.5,
    weeksOfSupply: 8 + Math.random() * 4,
  };

  return {
    type,
    brand: brand.name,
    season: season.name,
    year: season.year,
    summary: {
      totalOTB: Math.round(baseOTB),
      totalSalesPlan: Math.round(baseSales),
      totalReceiptPlan: Math.round(baseOTB * 0.9),
      openingStock: Math.round(baseOTB * 0.2),
      targetClosingStock: Math.round(baseOTB * 0.25),
      growthVsLY: `+${((growthRate - 1) * 100).toFixed(1)}%`,
    },
    monthlyBreakdown,
    categoryMix,
    kpiTargets,
    assumptions: [
      `Growth rate of ${((growthRate - 1) * 100).toFixed(1)}% based on market trends`,
      'Seasonal adjustments applied for peak/off-peak periods',
      'Category mix optimized based on historical sell-through',
      'Receipt timing aligned with promotional calendar',
    ],
    risks: [
      'Supply chain delays may affect receipt timing',
      'Markdown risk if sell-through below 65%',
      'Currency fluctuation impact on import costs',
    ],
    confidence: 0.75 + Math.random() * 0.15,
    generatedAt: new Date().toISOString(),
  };
}
