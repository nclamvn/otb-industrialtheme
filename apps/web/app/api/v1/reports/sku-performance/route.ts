export const runtime = 'nodejs';

// app/api/v1/reports/sku-performance/route.ts
// Power BI compatible SKU Performance Report API

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
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const format = searchParams.get('format') || 'json';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '1000'), 10000);

    // Build proposal filter
    const proposalWhere: Record<string, unknown> = {};
    if (brandId) proposalWhere.brandId = brandId;
    if (seasonId) proposalWhere.seasonId = seasonId;
    if (status) proposalWhere.status = status;

    // Build item filter
    const itemWhere: Record<string, unknown> = {};
    if (categoryId) itemWhere.categoryId = categoryId;
    if (Object.keys(proposalWhere).length > 0) {
      itemWhere.proposal = proposalWhere;
    }

    const [data, total] = await Promise.all([
      prisma.sKUItem.findMany({
        where: itemWhere,
        include: {
          proposal: {
            include: {
              brand: { select: { id: true, name: true, code: true } },
              season: { select: { id: true, name: true, code: true } },
            },
          },
          category: { select: { id: true, name: true, code: true } },
          subcategory: { select: { id: true, name: true } },
          collection: { select: { id: true, name: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ skuCode: 'asc' }],
      }),
      prisma.sKUItem.count({ where: itemWhere }),
    ]);

    // Transform for Power BI (snake_case)
    const transformed = data.map((item) => ({
      // Identifiers
      sku_id: item.id,
      sku_code: item.skuCode,
      style_name: item.styleName,
      proposal_id: item.proposalId,

      // Brand & Season (from proposal)
      brand_id: item.proposal?.brandId,
      brand_code: item.proposal?.brand?.code,
      brand_name: item.proposal?.brand?.name,
      season_id: item.proposal?.seasonId,
      season_code: item.proposal?.season?.code,
      season_name: item.proposal?.season?.name,

      // Category hierarchy
      category_id: item.categoryId,
      category_code: item.category?.code,
      category_name: item.category?.name,
      subcategory_id: item.subcategoryId,
      subcategory_name: item.subcategory?.name,
      collection_id: item.collectionId,
      collection_name: item.collection?.name,
      gender: item.gender,

      // Product attributes
      color_code: item.colorCode,
      color_name: item.colorName,
      material: item.material,

      // Pricing
      retail_price: Number(item.retailPrice),
      cost_price: Number(item.costPrice),
      margin: item.margin ? Number(item.margin) : null,
      margin_percent: Number(item.retailPrice) > 0
        ? Math.round(((Number(item.retailPrice) - Number(item.costPrice)) / Number(item.retailPrice)) * 10000) / 100
        : 0,

      // Quantities
      order_quantity: item.orderQuantity,
      order_value: item.orderValue ? Number(item.orderValue) : null,

      // Supplier
      supplier_sku: item.supplierSKU,
      lead_time: item.leadTime,
      moq: item.moq,
      country_of_origin: item.countryOfOrigin,

      // Validation
      validation_status: item.validationStatus,

      // AI insights
      ai_demand_score: item.aiDemandScore,
      ai_recommended_qty: item.aiRecommendedQty,

      // Status
      is_new: item.isNew,
      is_active: item.isActive,
      proposal_status: item.proposal?.status,

      // Timestamps
      created_at: item.createdAt.toISOString(),
      updated_at: item.updatedAt.toISOString(),
    }));

    // Calculate summary
    const summary = {
      totalRecords: total,
      totalOrderQuantity: transformed.reduce((sum, i) => sum + (i.order_quantity || 0), 0),
      totalOrderValue: transformed.reduce((sum, i) => sum + (i.order_value || 0), 0),
      avgMarginPercent: transformed.length > 0
        ? Math.round(transformed.reduce((sum, i) => sum + (i.margin_percent || 0), 0) / transformed.length * 100) / 100
        : 0,
      validationBreakdown: transformed.reduce((acc, i) => {
        acc[i.validation_status] = (acc[i.validation_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // Format response
    if (format === 'csv') {
      return generateCSV(transformed, 'sku_performance');
    }

    return NextResponse.json({
      success: true,
      data: transformed,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: { brandId, seasonId, categoryId, status },
        summary,
      },
    });
  } catch (error) {
    console.error('SKU Performance Report Error:', error);
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
