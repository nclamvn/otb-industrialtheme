// Query Data Tool - Safe database queries
import prisma from '@/lib/prisma';

interface QueryInput {
  query_type: string;
  filters?: {
    seasonId?: string;
    brandId?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  };
  custom_query?: string;
}

export async function queryData(
  input: Record<string, unknown>,
  _userId: string
) {
  const { query_type, filters = {}, custom_query } = input as unknown as QueryInput;
  const limit = filters.limit || 10;

  try {
    switch (query_type) {
      case 'sales_summary':
        return await getSalesSummary(filters);

      case 'inventory_status':
        return await getInventoryStatus(filters);

      case 'otb_status':
        return await getOTBStatus(filters);

      case 'sku_performance':
        return await getSKUPerformance(filters, limit);

      case 'brand_performance':
        return await getBrandPerformance(filters);

      case 'category_performance':
        return await getCategoryPerformance(filters);

      case 'budget_status':
        return await getBudgetStatus(filters);

      case 'top_sellers':
        return await getTopSellers(filters, limit);

      case 'slow_movers':
        return await getSlowMovers(filters, limit);

      case 'custom':
        return await handleCustomQuery(custom_query || '', filters);

      default:
        return { error: `Unknown query type: ${query_type}` };
    }
  } catch (error) {
    console.error('Query data error:', error);
    return { error: 'Failed to execute query' };
  }
}

async function getSalesSummary(filters: QueryInput['filters']) {
  const where: Record<string, unknown> = {};
  if (filters?.seasonId) where.seasonId = filters.seasonId;
  if (filters?.brandId) where.brandId = filters.brandId;

  // Get OTB plans with sales data
  const otbPlans = await prisma.oTBPlan.findMany({
    where,
    include: {
      season: true,
      brand: true,
      lineItems: true,
    },
    take: 10,
  });

  const summary = otbPlans.map((plan) => {
    // Simulate sales metrics based on OTB data
    const totalOTB = Number(plan.totalOTBValue || 100000);
    const salesPlan = totalOTB * 0.8; // Estimate sales plan as 80% of OTB
    const actualRate = 0.7 + Math.random() * 0.25; // 70-95% achievement
    const salesActual = salesPlan * actualRate;

    return {
      id: plan.id,
      season: plan.season.name,
      brand: plan.brand.name,
      salesPlan: Math.round(salesPlan),
      salesActual: Math.round(salesActual),
      variance: Math.round(salesActual - salesPlan),
      achievement: (actualRate * 100).toFixed(1),
    };
  });

  return {
    type: 'sales_summary',
    data: summary,
    total: {
      planned: summary.reduce((sum, p) => sum + p.salesPlan, 0),
      actual: summary.reduce((sum, p) => sum + p.salesActual, 0),
    },
  };
}

async function getInventoryStatus(filters: QueryInput['filters']) {
  const where: Record<string, unknown> = {};
  if (filters?.seasonId) where.seasonId = filters.seasonId;
  if (filters?.brandId) where.brandId = filters.brandId;

  const otbPlans = await prisma.oTBPlan.findMany({
    where,
    include: {
      season: true,
      brand: true,
    },
  });

  const inventory = otbPlans.map((plan) => {
    // Simulate inventory metrics based on OTB data
    const totalOTB = Number(plan.totalOTBValue || 100000);
    const openingStock = Math.round(totalOTB * 0.3);
    const receipts = Math.round(totalOTB * 0.5);
    const sales = Math.round(totalOTB * 0.4);
    const closingStock = openingStock + receipts - sales;

    return {
      season: plan.season.name,
      brand: plan.brand.name,
      openingStock,
      closingStock,
      receipts,
      status: plan.status,
    };
  });

  return {
    type: 'inventory_status',
    data: inventory,
  };
}

async function getOTBStatus(filters: QueryInput['filters']) {
  const where: Record<string, unknown> = {};
  if (filters?.seasonId) where.seasonId = filters.seasonId;
  if (filters?.brandId) where.brandId = filters.brandId;

  const otbPlans = await prisma.oTBPlan.findMany({
    where,
    include: {
      season: true,
      brand: true,
    },
  });

  const otbData = otbPlans.map((plan) => {
    const totalOTB = Number(plan.totalOTBValue || 100000);
    // Simulate utilization (60-90%)
    const utilizationRate = 0.6 + Math.random() * 0.3;
    const otbUsed = Math.round(totalOTB * utilizationRate);
    const remaining = totalOTB - otbUsed;

    return {
      id: plan.id,
      season: plan.season.name,
      brand: plan.brand.name,
      otbPlan: totalOTB,
      otbActual: otbUsed,
      otbRemaining: remaining,
      utilization: (utilizationRate * 100).toFixed(1) + '%',
      status: plan.status,
    };
  });

  return {
    type: 'otb_status',
    data: otbData,
    summary: {
      totalPlan: otbData.reduce((sum, p) => sum + p.otbPlan, 0),
      totalActual: otbData.reduce((sum, p) => sum + p.otbActual, 0),
      totalRemaining: otbData.reduce((sum, p) => sum + p.otbRemaining, 0),
    },
  };
}

async function getSKUPerformance(
  filters: QueryInput['filters'],
  limit: number
) {
  const where: Record<string, unknown> = {};
  if (filters?.brandId) where.proposal = { brandId: filters.brandId };
  if (filters?.categoryId) where.categoryId = filters.categoryId;

  const skuItems = await prisma.sKUItem.findMany({
    where,
    include: {
      category: true,
      subcategory: true,
      proposal: {
        include: {
          brand: true,
        },
      },
    },
    take: limit,
  });

  return {
    type: 'sku_performance',
    data: skuItems.map((item) => ({
      id: item.id,
      sku: item.styleName,
      brand: item.proposal?.brand?.name,
      category: item.category?.name,
      quantity: item.orderQuantity,
      retailPrice: Number(item.retailPrice),
    })),
    count: skuItems.length,
  };
}

async function getBrandPerformance(filters: QueryInput['filters']) {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    include: {
      otbPlans: {
        where: filters?.seasonId ? { seasonId: filters.seasonId } : undefined,
      },
      skuProposals: {
        where: filters?.seasonId ? { seasonId: filters.seasonId } : undefined,
      },
    },
  });

  return {
    type: 'brand_performance',
    data: brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      code: brand.code,
      otbPlansCount: brand.otbPlans.length,
      skuProposalsCount: brand.skuProposals.length,
    })),
  };
}

async function getCategoryPerformance(filters: QueryInput['filters']) {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      subcategories: true,
      skuItems: filters?.brandId
        ? {
            where: {
              proposal: { brandId: filters.brandId },
            },
          }
        : undefined,
    },
  });

  return {
    type: 'category_performance',
    data: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      code: cat.code,
      subcategoriesCount: cat.subcategories.length,
      skuCount: cat.skuItems?.length || 0,
    })),
  };
}

async function getBudgetStatus(filters: QueryInput['filters']) {
  const where: Record<string, unknown> = {};
  if (filters?.seasonId) where.seasonId = filters.seasonId;
  if (filters?.brandId) where.brandId = filters.brandId;

  const budgets = await prisma.budgetAllocation.findMany({
    where,
    include: {
      season: true,
      brand: true,
      location: true,
    },
  });

  return {
    type: 'budget_status',
    data: budgets.map((budget) => ({
      id: budget.id,
      season: budget.season.name,
      brand: budget.brand.name,
      location: budget.location.name,
      totalBudget: Number(budget.totalBudget),
      status: budget.status,
    })),
  };
}

async function getTopSellers(filters: QueryInput['filters'], limit: number) {
  // Top sellers based on SKU data
  const skuItems = await prisma.sKUItem.findMany({
    where: {
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
    },
    include: {
      category: true,
      proposal: {
        include: { brand: true },
      },
    },
    orderBy: {
      orderQuantity: 'desc',
    },
    take: limit,
  });

  return {
    type: 'top_sellers',
    data: skuItems.map((item, index) => ({
      rank: index + 1,
      sku: item.styleName,
      brand: item.proposal?.brand?.name,
      category: item.category?.name,
      quantity: item.orderQuantity,
      revenue: Number(item.retailPrice) * item.orderQuantity,
    })),
  };
}

async function getSlowMovers(filters: QueryInput['filters'], limit: number) {
  // Slow movers based on SKU data
  const skuItems = await prisma.sKUItem.findMany({
    where: {
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
    },
    include: {
      category: true,
      proposal: {
        include: { brand: true },
      },
    },
    orderBy: {
      orderQuantity: 'asc',
    },
    take: limit,
  });

  return {
    type: 'slow_movers',
    data: skuItems.map((item) => ({
      sku: item.styleName,
      brand: item.proposal?.brand?.name,
      category: item.category?.name,
      quantity: item.orderQuantity,
      weeksOfSupply: Math.floor(Math.random() * 20) + 10, // Simulated
    })),
  };
}

async function handleCustomQuery(
  query: string,
  filters: QueryInput['filters']
) {
  // Parse natural language query and route to appropriate function
  const queryLower = query.toLowerCase();

  if (
    queryLower.includes('brand') ||
    queryLower.includes('thương hiệu')
  ) {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
    });
    return { type: 'brands', data: brands };
  }

  if (queryLower.includes('season') || queryLower.includes('mùa')) {
    const seasons = await prisma.season.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, year: true, isCurrent: true },
    });
    return { type: 'seasons', data: seasons };
  }

  if (
    queryLower.includes('category') ||
    queryLower.includes('danh mục') ||
    queryLower.includes('ngành hàng')
  ) {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
    });
    return { type: 'categories', data: categories };
  }

  // Default to sales summary if no specific match
  return await getSalesSummary(filters);
}
