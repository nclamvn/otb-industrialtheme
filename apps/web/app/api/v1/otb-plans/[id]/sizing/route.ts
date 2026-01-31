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
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const plan = await prisma.oTBPlan.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: {
            category: true,
          },
        },
        sizingAnalysis: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'OTB plan not found' }, { status: 404 });
    }

    // Map sizing analysis by category and gender for easier lookup
    const sizingMap = new Map(
      plan.sizingAnalysis.map((sa) => [`${sa.categoryId}-${sa.gender}`, sa])
    );

    const sizingData = plan.lineItems.map((item) => {
      const sizing = item.categoryId && item.gender
        ? sizingMap.get(`${item.categoryId}-${item.gender}`)
        : null;

      return {
        lineItemId: item.id,
        category: item.category?.name ?? 'Unknown',
        gender: item.gender,
        userUnits: item.userUnits,
        sizing: sizing
          ? {
              id: sizing.id,
              sizeData: sizing.sizeData as Record<string, number>,
              aiInsight: sizing.aiInsight,
              aiRecommendation: sizing.aiRecommendation,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: sizingData,
    });
  } catch (error) {
    console.error('Error fetching sizing data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sizing data' },
      { status: 500 }
    );
  }
}

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

    const { categoryId, gender, sizeData } = body;

    if (!categoryId || !gender || !sizeData) {
      return NextResponse.json(
        { success: false, error: 'categoryId, gender, and sizeData are required' },
        { status: 400 }
      );
    }

    // Verify plan exists
    const plan = await prisma.oTBPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'OTB plan not found' },
        { status: 404 }
      );
    }

    // Validate size data sums to 100%
    const total = Object.values(sizeData as Record<string, number>).reduce(
      (sum: number, val) => sum + (val as number),
      0
    );
    if (Math.abs(total - 100) > 0.01) {
      return NextResponse.json(
        { success: false, error: 'Size data must sum to 100%' },
        { status: 400 }
      );
    }

    // Check for existing sizing analysis for this plan/category/gender combination
    const existing = await prisma.sizingAnalysis.findFirst({
      where: {
        otbPlanId: id,
        categoryId,
        gender,
      },
    });

    let sizing;
    if (existing) {
      sizing = await prisma.sizingAnalysis.update({
        where: { id: existing.id },
        data: {
          sizeData,
          updatedAt: new Date(),
        },
      });
    } else {
      sizing = await prisma.sizingAnalysis.create({
        data: {
          otbPlanId: id,
          categoryId,
          gender,
          sizeData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: sizing,
    });
  } catch (error) {
    console.error('Error saving sizing data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save sizing data' },
      { status: 500 }
    );
  }
}
