export const runtime = 'nodejs';

// app/api/v1/reports/otb-analysis/route.ts
// Power BI compatible OTB Analysis Report API

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brandId');
    const seasonId = searchParams.get('seasonId');
    const status = searchParams.get('status');
    const format = searchParams.get('format') || 'json';
    const includeLineItems = searchParams.get('includeLineItems') === 'true';

    // Build filter
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (brandId) where.brandId = brandId;
    if (seasonId) where.seasonId = seasonId;

    const data = await prisma.oTBPlan.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true, code: true } },
        season: { select: { id: true, name: true, code: true } },
        budget: {
          include: {
            location: { select: { id: true, name: true, code: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        lineItems: includeLineItems ? {
          include: {
            category: { select: { id: true, name: true, code: true } },
            subcategory: { select: { id: true, name: true } },
            collection: { select: { id: true, name: true } },
          },
          orderBy: [{ level: 'asc' }, { categoryId: 'asc' }],
        } : false,
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    // Transform OTB Plans
    const transformedPlans = data.map((plan) => {
      const lineItems = plan.lineItems || [];
      const totalHistoricalValue = lineItems.reduce((sum, li) => sum + Number(li.historicalSalesValue || 0), 0);
      const totalSystemProposed = lineItems.reduce((sum, li) => sum + Number(li.systemProposedValue || 0), 0);
      const totalUserBuy = lineItems.reduce((sum, li) => sum + Number(li.userBuyValue || 0), 0);
      const totalUnits = lineItems.reduce((sum, li) => sum + (li.userUnits || 0), 0);
      const anomalyCount = lineItems.filter(li => li.hasAnomaly).length;

      return {
        // Plan identifiers
        plan_id: plan.id,
        plan_name: plan.versionName || `v${plan.version}`,
        version: plan.version,
        version_type: plan.versionType,

        // Budget reference
        budget_id: plan.budgetId,

        // Dimensions
        brand_id: plan.brandId,
        brand_code: plan.brand?.code,
        brand_name: plan.brand?.name,
        season_id: plan.seasonId,
        season_code: plan.season?.code,
        season_name: plan.season?.name,
        location_id: plan.budget?.locationId,
        location_code: plan.budget?.location?.code,
        location_name: plan.budget?.location?.name,

        // Status
        status: plan.status,

        // Plan totals
        total_otb_value: Number(plan.totalOTBValue),
        total_sku_count: plan.totalSKUCount,

        // Calculated from line items
        total_historical_value: totalHistoricalValue,
        total_system_proposed: totalSystemProposed,
        total_user_buy: totalUserBuy,
        total_units: totalUnits,
        line_items_count: lineItems.length,
        anomaly_count: anomalyCount,

        // AI metadata
        ai_confidence_score: plan.aiConfidenceScore,
        ai_model_used: plan.aiModelUsed,

        // Variance
        variance_from_historical: totalHistoricalValue > 0
          ? Math.round(((totalUserBuy - totalHistoricalValue) / totalHistoricalValue) * 10000) / 100
          : 0,
        variance_from_system: totalSystemProposed > 0
          ? Math.round(((totalUserBuy - totalSystemProposed) / totalSystemProposed) * 10000) / 100
          : 0,

        // Audit
        created_by_id: plan.createdById,
        created_by_name: plan.createdBy?.name,
        approved_by_id: plan.approvedById,
        approved_by_name: plan.approvedBy?.name,

        // Timestamps
        created_at: plan.createdAt.toISOString(),
        submitted_at: plan.submittedAt?.toISOString() || null,
        approved_at: plan.approvedAt?.toISOString() || null,
        updated_at: plan.updatedAt.toISOString(),

        // Comments
        comments: plan.comments,
      };
    });

    // Transform Line Items if included
    let transformedLineItems: Record<string, unknown>[] = [];
    if (includeLineItems) {
      transformedLineItems = data.flatMap((plan) =>
        (plan.lineItems || []).map((li: Record<string, unknown>) => ({
          // Line item identifiers
          line_item_id: li.id,
          plan_id: li.otbPlanId,
          plan_name: plan.versionName || `v${plan.version}`,

          // Hierarchy
          level: li.level,
          category_id: li.categoryId,
          category_code: (li.category as Record<string, unknown> | null)?.code,
          category_name: (li.category as Record<string, unknown> | null)?.name,
          subcategory_id: li.subcategoryId,
          subcategory_name: (li.subcategory as Record<string, unknown> | null)?.name,
          collection_id: li.collectionId,
          collection_name: (li.collection as Record<string, unknown> | null)?.name,
          gender: li.gender,
          size_group: li.sizeGroup,

          // Historical
          historical_sales_pct: li.historicalSalesPct ? Number(li.historicalSalesPct) : null,
          historical_sales_value: li.historicalSalesValue ? Number(li.historicalSalesValue) : null,
          historical_units: li.historicalUnits,

          // System proposal
          system_proposed_pct: li.systemProposedPct ? Number(li.systemProposedPct) : null,
          system_proposed_value: li.systemProposedValue ? Number(li.systemProposedValue) : null,
          system_confidence: li.systemConfidence,

          // User input
          user_buy_pct: Number(li.userBuyPct),
          user_buy_value: Number(li.userBuyValue),
          user_units: li.userUnits,

          // Variance
          variance_from_system: li.varianceFromSystem ? Number(li.varianceFromSystem) : null,
          variance_from_hist: li.varianceFromHist ? Number(li.varianceFromHist) : null,

          // Status
          has_anomaly: li.hasAnomaly,
          anomaly_type: li.anomalyType,
          is_locked: li.isLocked,

          // Comments
          comment: li.comment,
          ai_generated_comment: li.aiGeneratedComment,

          // Brand/Season (from plan)
          brand_name: plan.brand?.name,
          season_name: plan.season?.name,
        }))
      );
    }

    // Calculate summary
    const summary = {
      totalPlans: transformedPlans.length,
      totalOTBValue: transformedPlans.reduce((sum, p) => sum + p.total_otb_value, 0),
      totalBuyValue: transformedPlans.reduce((sum, p) => sum + p.total_user_buy, 0),
      totalUnits: transformedPlans.reduce((sum, p) => sum + p.total_units, 0),
      statusBreakdown: transformedPlans.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avgVarianceFromHistorical: transformedPlans.length > 0
        ? Math.round(transformedPlans.reduce((sum, p) => sum + p.variance_from_historical, 0) / transformedPlans.length * 100) / 100
        : 0,
    };

    if (format === 'csv') {
      const csvData = includeLineItems ? transformedLineItems : transformedPlans;
      return generateCSV(csvData, includeLineItems ? 'otb_line_items' : 'otb_plans');
    }

    const response: Record<string, unknown> = {
      success: true,
      data: {
        plans: transformedPlans,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: { brandId, seasonId, status, includeLineItems },
        summary,
      },
    };

    if (includeLineItems) {
      (response.data as Record<string, unknown>).lineItems = transformedLineItems;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('OTB Analysis Report Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    return new NextResponse('', {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  }

  const headers = Object.keys(data[0]);
  const BOM = '\uFEFF';

  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return String(val);
      }).join(',')
    ),
  ];

  return new NextResponse(BOM + csvRows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
