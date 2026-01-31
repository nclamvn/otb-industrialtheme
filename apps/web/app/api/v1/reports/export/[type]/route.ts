export const runtime = 'nodejs';

// app/api/v1/reports/export/[type]/route.ts
// Universal Excel/CSV Export API for Power BI

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

type ExportType = 'sku' | 'budget' | 'otb' | 'master-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await params;
    const exportType = type.replace('.xlsx', '').replace('.csv', '') as ExportType;
    const format = type.endsWith('.csv') ? 'csv' : 'xlsx';
    const searchParams = request.nextUrl.searchParams;

    let data: Record<string, unknown>[];
    let filename: string;
    let sheetName: string;

    switch (exportType) {
      case 'sku':
        data = await fetchSKUData(searchParams);
        filename = 'sku_performance_export';
        sheetName = 'SKU Data';
        break;

      case 'budget':
        data = await fetchBudgetData(searchParams);
        filename = 'budget_export';
        sheetName = 'Budget Data';
        break;

      case 'otb':
        data = await fetchOTBData(searchParams);
        filename = 'otb_export';
        sheetName = 'OTB Data';
        break;

      case 'master-data':
        return await exportMasterData(format);

      default:
        return NextResponse.json(
          { error: 'Invalid export type', validTypes: ['sku', 'budget', 'otb', 'master-data'] },
          { status: 400 }
        );
    }

    if (format === 'csv') {
      return generateCSV(data, filename);
    }

    return generateExcel(data, filename, sheetName);
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json(
      { error: 'Export failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function fetchSKUData(params: URLSearchParams): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = {};

  if (params.get('brandId') || params.get('seasonId')) {
    where.proposal = {};
    if (params.get('brandId')) (where.proposal as Record<string, unknown>).brandId = params.get('brandId');
    if (params.get('seasonId')) (where.proposal as Record<string, unknown>).seasonId = params.get('seasonId');
  }
  if (params.get('categoryId')) where.categoryId = params.get('categoryId');

  const data = await prisma.sKUItem.findMany({
    where,
    include: {
      proposal: {
        include: {
          brand: { select: { name: true, code: true } },
          season: { select: { name: true, code: true } },
        },
      },
      category: { select: { name: true, code: true } },
      subcategory: { select: { name: true } },
    },
    orderBy: { skuCode: 'asc' },
  });

  return data.map((item) => ({
    'SKU Code': item.skuCode,
    'Style Name': item.styleName,
    'Brand': item.proposal?.brand?.name || '',
    'Season': item.proposal?.season?.name || '',
    'Category': item.category?.name || '',
    'Subcategory': item.subcategory?.name || '',
    'Color': item.colorName || '',
    'Material': item.material || '',
    'Gender': item.gender,
    'Retail Price': Number(item.retailPrice),
    'Cost Price': Number(item.costPrice),
    'Margin %': Number(item.retailPrice) > 0
      ? Math.round(((Number(item.retailPrice) - Number(item.costPrice)) / Number(item.retailPrice)) * 100)
      : 0,
    'Order Quantity': item.orderQuantity,
    'Order Value': item.orderValue ? Number(item.orderValue) : 0,
    'Validation Status': item.validationStatus,
    'AI Demand Score': item.aiDemandScore || '',
    'Created At': item.createdAt.toISOString().split('T')[0],
  }));
}

async function fetchBudgetData(params: URLSearchParams): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = {};
  if (params.get('brandId')) where.brandId = params.get('brandId');
  if (params.get('seasonId')) where.seasonId = params.get('seasonId');
  if (params.get('status')) where.status = params.get('status');

  const data = await prisma.budgetAllocation.findMany({
    where,
    include: {
      brand: { select: { name: true, code: true } },
      season: { select: { name: true, code: true } },
      location: { select: { name: true, code: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: [{ season: { code: 'desc' } }, { brand: { name: 'asc' } }],
  });

  return data.map((item) => ({
    'Brand': item.brand?.name || '',
    'Brand Code': item.brand?.code || '',
    'Season': item.season?.name || '',
    'Season Code': item.season?.code || '',
    'Location': item.location?.name || '',
    'Total Budget': Number(item.totalBudget),
    'Seasonal Budget': Number(item.seasonalBudget || 0),
    'Replenishment Budget': Number(item.replenishmentBudget || 0),
    'Currency': item.currency,
    'Status': item.status,
    'Version': item.version,
    'Created By': item.createdBy?.name || '',
    'Created At': item.createdAt.toISOString().split('T')[0],
    'Submitted At': item.submittedAt?.toISOString().split('T')[0] || '',
    'Approved At': item.approvedAt?.toISOString().split('T')[0] || '',
  }));
}

async function fetchOTBData(params: URLSearchParams): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = {};
  if (params.get('status')) where.status = params.get('status');
  if (params.get('brandId')) where.brandId = params.get('brandId');
  if (params.get('seasonId')) where.seasonId = params.get('seasonId');

  const data = await prisma.oTBPlan.findMany({
    where,
    include: {
      brand: { select: { name: true } },
      season: { select: { name: true } },
      budget: {
        include: {
          location: { select: { name: true } },
        },
      },
      lineItems: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return data.map((plan) => {
    const lineItems = plan.lineItems || [];
    const totalValue = lineItems.reduce((sum, li) => sum + Number(li.userBuyValue || 0), 0);
    const totalUnits = lineItems.reduce((sum, li) => sum + (li.userUnits || 0), 0);

    return {
      'Plan Name': plan.versionName || `v${plan.version}`,
      'Brand': plan.brand?.name || '',
      'Season': plan.season?.name || '',
      'Location': plan.budget?.location?.name || '',
      'Version': plan.version,
      'Version Type': plan.versionType,
      'Status': plan.status,
      'Total OTB Value': Number(plan.totalOTBValue),
      'Total SKU Count': plan.totalSKUCount,
      'Calculated Total Value': totalValue,
      'Total Units': totalUnits,
      'Line Items Count': lineItems.length,
      'AI Confidence': plan.aiConfidenceScore || '',
      'Created By': plan.createdBy?.name || '',
      'Created At': plan.createdAt.toISOString().split('T')[0],
      'Submitted At': plan.submittedAt?.toISOString().split('T')[0] || '',
      'Approved At': plan.approvedAt?.toISOString().split('T')[0] || '',
    };
  });
}

async function exportMasterData(format: string) {
  const [brands, categories, locations, seasons] = await Promise.all([
    prisma.brand.findMany({
      include: { division: { select: { name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      include: { subcategories: { select: { name: true, code: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.salesLocation.findMany({ orderBy: { name: 'asc' } }),
    prisma.season.findMany({ orderBy: { code: 'desc' } }),
  ]);

  const brandsData = brands.map((b) => ({
    'Code': b.code,
    'Name': b.name,
    'Division': b.division?.name || '',
    'Description': b.description || '',
    'Active': b.isActive ? 'Yes' : 'No',
  }));

  const categoriesData = categories.map((c) => ({
    'Code': c.code,
    'Name': c.name,
    'Description': c.description || '',
    'Subcategories': c.subcategories.map(s => s.name).join(', '),
    'Active': c.isActive ? 'Yes' : 'No',
  }));

  const locationsData = locations.map((l) => ({
    'Code': l.code,
    'Name': l.name,
    'Type': l.type,
    'Address': l.address || '',
    'Active': l.isActive ? 'Yes' : 'No',
  }));

  const seasonsData = seasons.map((s) => ({
    'Code': s.code,
    'Name': s.name,
    'Year': s.year,
    'Start Date': s.startDate.toISOString().split('T')[0],
    'End Date': s.endDate.toISOString().split('T')[0],
    'Active': s.isActive ? 'Yes' : 'No',
  }));

  if (format === 'csv') {
    return generateCSV(brandsData, 'master_data_brands');
  }

  // For Excel, create multiple sheets
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(brandsData), 'Brands');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categoriesData), 'Categories');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(locationsData), 'Locations');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(seasonsData), 'Seasons');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="master_data_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}

function generateCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    return new NextResponse('No data', {
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

function generateExcel(data: Record<string, unknown>[], filename: string, sheetName: string) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    worksheet['!cols'] = headers.map((h) => ({
      wch: Math.max(h.length, 15),
    }));
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Add summary sheet
  const summary = [
    ['Export Summary'],
    [''],
    ['Generated At', new Date().toISOString()],
    ['Total Records', data.length],
    ['Sheet Name', sheetName],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), 'Summary');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
