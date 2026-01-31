export const runtime = 'nodejs';

// app/api/v1/reports/budget-summary/route.ts
// Power BI compatible Budget Summary Report API

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
    const locationId = searchParams.get('locationId');
    const status = searchParams.get('status');
    const format = searchParams.get('format') || 'json';

    // Build filter
    const where: Record<string, unknown> = {};
    if (brandId) where.brandId = brandId;
    if (seasonId) where.seasonId = seasonId;
    if (locationId) where.locationId = locationId;
    if (status) where.status = status;

    const data = await prisma.budgetAllocation.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true, code: true } },
        season: { select: { id: true, name: true, code: true } },
        location: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        otbPlans: {
          select: {
            id: true,
            versionName: true,
            status: true,
          },
        },
      },
      orderBy: [
        { season: { code: 'desc' } },
        { brand: { name: 'asc' } },
        { location: { name: 'asc' } },
      ],
    });

    // Transform for Power BI (snake_case)
    const transformed = data.map((item) => {
      const totalBudget = Number(item.totalBudget);
      const seasonalBudget = Number(item.seasonalBudget || 0);
      const replenishmentBudget = Number(item.replenishmentBudget || 0);

      return {
        // Identifiers
        budget_id: item.id,
        version: item.version,

        // Dimensions
        brand_id: item.brandId,
        brand_code: item.brand?.code,
        brand_name: item.brand?.name,
        season_id: item.seasonId,
        season_code: item.season?.code,
        season_name: item.season?.name,
        location_id: item.locationId,
        location_code: item.location?.code,
        location_name: item.location?.name,

        // Budget amounts
        total_budget: totalBudget,
        seasonal_budget: seasonalBudget,
        replenishment_budget: replenishmentBudget,
        currency: item.currency,

        // Calculated fields
        seasonal_percent: totalBudget > 0
          ? Math.round((seasonalBudget / totalBudget) * 10000) / 100
          : 0,
        replenishment_percent: totalBudget > 0
          ? Math.round((replenishmentBudget / totalBudget) * 10000) / 100
          : 0,

        // Status
        status: item.status,

        // OTB Plans count
        otb_plans_count: item.otbPlans?.length || 0,

        // Audit
        created_by_id: item.createdById,
        created_by_name: item.createdBy?.name,
        approved_by_id: item.approvedById,
        approved_by_name: item.approvedBy?.name,

        // Timestamps
        created_at: item.createdAt.toISOString(),
        submitted_at: item.submittedAt?.toISOString() || null,
        approved_at: item.approvedAt?.toISOString() || null,
        updated_at: item.updatedAt.toISOString(),

        // Comments
        comments: item.comments,
      };
    });

    // Calculate summary
    const summary = {
      totalRecords: transformed.length,
      totalBudget: transformed.reduce((sum, i) => sum + i.total_budget, 0),
      totalSeasonalBudget: transformed.reduce((sum, i) => sum + i.seasonal_budget, 0),
      totalReplenishmentBudget: transformed.reduce((sum, i) => sum + i.replenishment_budget, 0),
      statusBreakdown: transformed.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byBrand: transformed.reduce((acc, i) => {
        if (!acc[i.brand_name || 'Unknown']) {
          acc[i.brand_name || 'Unknown'] = 0;
        }
        acc[i.brand_name || 'Unknown'] += i.total_budget;
        return acc;
      }, {} as Record<string, number>),
    };

    if (format === 'csv') {
      return generateCSV(transformed, 'budget_summary');
    }

    return NextResponse.json({
      success: true,
      data: transformed,
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: { brandId, seasonId, locationId, status },
        summary,
      },
    });
  } catch (error) {
    console.error('Budget Summary Report Error:', error);
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
