export const runtime = 'nodejs';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  generateInsights,
  extractRiskIndicators,
  extractOpportunityIndicators,
} from '@/lib/analytics/insights';

// GET /api/insights - Get AI-generated insights
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get stored insights from database
    const storedInsights = await prisma.aIInsight.findMany({
      where: {
        ...(type && { insightType: type as any }),
        ...(status && { status: status as any }),
      },
      orderBy: [
        { impactLevel: 'desc' },
        { generatedAt: 'desc' },
      ],
      take: limit,
    });

    // Group by category
    const byCategory = storedInsights.reduce((acc, insight) => {
      const cat = insight.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(insight);
      return acc;
    }, {} as Record<string, typeof storedInsights>);

    return NextResponse.json({
      insights: storedInsights,
      byCategory,
      summary: {
        total: storedInsights.length,
        risks: storedInsights.filter((i) => i.insightType === 'RISK').length,
        opportunities: storedInsights.filter((i) => i.insightType === 'OPPORTUNITY').length,
        recommendations: storedInsights.filter((i) => i.insightType === 'RECOMMENDATION').length,
        highImpact: storedInsights.filter((i) => i.impactLevel === 'HIGH').length,
      },
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

// POST /api/insights - Generate new insights
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { seasonId, brandId, categoryId, context } = body;

    if (!seasonId) {
      return NextResponse.json(
        { error: 'Season ID is required' },
        { status: 400 }
      );
    }

    // Build context from request or fetch from database
    let insightContext = context;

    if (!insightContext) {
      // In production, fetch real data
      // For demo, use mock context
      insightContext = {
        currentInventory: 425000,
        averageWeeklySales: 50000,
        stockOutCount: 32,
        totalSKUs: 1000,
        slowMovingPercentage: 22,
        revenue: 1500000,
        previousRevenue: 1350000,
        grossMargin: 52.3,
        targetMargin: 50,
        sellThrough: 68.5,
        targetSellThrough: 70,
        historicalData: [85000, 88000, 92000, 90000, 95000, 98000, 102000, 105000, 108000, 110000, 112000, 115000],
      };
    }

    // Generate insights
    const insights = generateInsights(insightContext);

    // Store insights in database
    const storedInsights = await Promise.all(
      insights.slice(0, 10).map(async (insight: any) => {
        // Map type to InsightType enum values
        const typeMap: Record<string, string> = {
          'WARNING': 'RISK',
          'OPPORTUNITY': 'OPPORTUNITY',
          'RECOMMENDATION': 'RECOMMENDATION',
          'TREND': 'TREND',
          'ALERT': 'ALERT',
          'ANOMALY': 'ANOMALY',
        };
        const insightType = typeMap[insight.type] || insight.insightType || 'TREND';

        return prisma.aIInsight.create({
          data: {
            insightType: insightType as any,
            category: insight.category,
            title: insight.title,
            description: insight.description || insight.summary || '',
            impactLevel: (insight.impact?.toUpperCase() || insight.impactLevel || 'MEDIUM') as any,
            confidence: insight.confidence || 0.8,
            dataContext: {
              seasonId,
              brandId: brandId || null,
              categoryId: categoryId || null,
              dataPoints: insight.dataPoints,
            } as any,
            recommendations: insight.recommendations as any,
            affectedEntities: insight.affectedEntities as any,
            status: 'NEW',
            userId: session.user.id,
          },
        });
      })
    );

    // Extract risk and opportunity summaries
    const risks = extractRiskIndicators(insights);
    const opportunities = extractOpportunityIndicators(insights);

    return NextResponse.json({
      insights: storedInsights,
      risks,
      opportunities,
      generated: storedInsights.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

// PATCH /api/insights - Update insight status
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, dismissedReason } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Insight ID and status are required' },
        { status: 400 }
      );
    }

    const updateData: any = { status };

    if (status === 'DISMISSED' && dismissedReason) {
      updateData.dismissedReason = dismissedReason;
      updateData.dismissedAt = new Date();
      updateData.dismissedById = session.user.id;
    }

    if (status === 'ACTIONED') {
      updateData.actionedAt = new Date();
      updateData.actionedById = session.user.id;
    }

    const insight = await prisma.aIInsight.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(insight);
  } catch (error) {
    console.error('Error updating insight:', error);
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 }
    );
  }
}
