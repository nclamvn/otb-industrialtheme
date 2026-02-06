import prisma from '@/lib/prisma';

export interface QueryResult {
  type: 'budgets' | 'skus' | 'otb' | 'brands' | 'seasons' | 'summary';
  data: unknown;
  count: number;
}

// Fetch budget summary
export async function getBudgetSummary(filters?: {
  brandId?: string;
  seasonId?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.brandId) where.brandId = filters.brandId;
  if (filters?.seasonId) where.seasonId = filters.seasonId;

  const budgets = await prisma.budgetAllocation.findMany({
    where,
    include: {
      brand: true,
      season: true,
      location: true,
    },
  });

  const summary = {
    totalBudget: budgets.reduce((sum, b) => sum + Number(b.totalBudget), 0),
    approvedBudget: budgets
      .filter(b => b.status === 'APPROVED')
      .reduce((sum, b) => sum + Number(b.totalBudget), 0),
    pendingBudget: budgets
      .filter(b => ['SUBMITTED', 'UNDER_REVIEW'].includes(b.status))
      .reduce((sum, b) => sum + Number(b.totalBudget), 0),
    draftBudget: budgets
      .filter(b => b.status === 'DRAFT')
      .reduce((sum, b) => sum + Number(b.totalBudget), 0),
    count: budgets.length,
    byStatus: {
      DRAFT: budgets.filter(b => b.status === 'DRAFT').length,
      SUBMITTED: budgets.filter(b => b.status === 'SUBMITTED').length,
      APPROVED: budgets.filter(b => b.status === 'APPROVED').length,
      REJECTED: budgets.filter(b => b.status === 'REJECTED').length,
    },
  };

  return {
    budgets: budgets.map(b => ({
      id: b.id,
      brand: b.brand.name,
      season: b.season.code,
      location: b.location.name,
      totalBudget: Number(b.totalBudget),
      seasonalBudget: Number(b.seasonalBudget),
      replenishmentBudget: Number(b.replenishmentBudget),
      status: b.status,
    })),
    summary,
  };
}

// Fetch SKU summary
export async function getSKUSummary(filters?: {
  brandId?: string;
  seasonId?: string;
}) {
  const proposals = await prisma.sKUProposal.findMany({
    include: {
      items: true,
      otbPlan: {
        include: {
          budget: {
            include: {
              brand: true,
              season: true,
            },
          },
        },
      },
    },
  });

  const filteredProposals = proposals.filter(p => {
    if (filters?.brandId && p.otbPlan.budget.brandId !== filters.brandId) return false;
    if (filters?.seasonId && p.otbPlan.budget.seasonId !== filters.seasonId) return false;
    return true;
  });

  const allItems = filteredProposals.flatMap(p => p.items);

  return {
    proposals: filteredProposals.map(p => ({
      id: p.id,
      name: `${p.otbPlan.budget.brand.name} - ${p.otbPlan.budget.season.code}`,
      brand: p.otbPlan.budget.brand.name,
      season: p.otbPlan.budget.season.code,
      status: p.status,
      itemCount: p.items.length,
      totalValue: p.items.reduce((sum, i) => sum + Number(i.retailPrice || 0) * (i.orderQuantity || 0), 0),
    })),
    summary: {
      totalProposals: filteredProposals.length,
      totalSKUs: allItems.length,
      totalQuantity: allItems.reduce((sum, i) => sum + (i.orderQuantity || 0), 0),
      totalValue: allItems.reduce((sum, i) => sum + Number(i.retailPrice || 0) * (i.orderQuantity || 0), 0),
      byStatus: {
        DRAFT: filteredProposals.filter(p => p.status === 'DRAFT').length,
        SUBMITTED: filteredProposals.filter(p => p.status === 'SUBMITTED').length,
        APPROVED: filteredProposals.filter(p => p.status === 'APPROVED').length,
      },
    },
  };
}

// Fetch OTB summary
export async function getOTBSummary(filters?: {
  brandId?: string;
  seasonId?: string;
}) {
  const otbPlans = await prisma.oTBPlan.findMany({
    include: {
      budget: {
        include: {
          brand: true,
          season: true,
          location: true,
        },
      },
    },
  });

  const filteredPlans = otbPlans.filter(p => {
    if (filters?.brandId && p.budget.brandId !== filters.brandId) return false;
    if (filters?.seasonId && p.budget.seasonId !== filters.seasonId) return false;
    return true;
  });

  return {
    plans: filteredPlans.map(p => ({
      id: p.id,
      name: `${p.budget.brand.name} - ${p.budget.season.code} - ${p.budget.location.name}`,
      brand: p.budget.brand.name,
      season: p.budget.season.code,
      location: p.budget.location.name,
      status: p.status,
      totalSKUs: p.totalSKUCount || 0,
      otbValue: Number(p.totalOTBValue || 0),
    })),
    summary: {
      totalPlans: filteredPlans.length,
      totalOTB: filteredPlans.reduce((sum, p) => sum + Number(p.totalOTBValue || 0), 0),
      byStatus: {
        DRAFT: filteredPlans.filter(p => p.status === 'DRAFT').length,
        APPROVED: filteredPlans.filter(p => p.status === 'APPROVED').length,
      },
    },
  };
}

// Fetch brands
export async function getBrands() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
  });
  return brands;
}

// Fetch seasons
export async function getSeasons() {
  const seasons = await prisma.season.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true, year: true },
    orderBy: { startDate: 'desc' },
  });
  return seasons;
}

// Parse user query to determine what data to fetch
export function parseQuery(message: string): {
  needsBudget: boolean;
  needsSKU: boolean;
  needsOTB: boolean;
  brandHint?: string;
  seasonHint?: string;
} {
  const lowerMessage = message.toLowerCase();

  return {
    needsBudget: /budget|ngân sách|phân bổ|allocated/i.test(lowerMessage),
    needsSKU: /sku|sản phẩm|product|item|proposal|đề xuất/i.test(lowerMessage),
    needsOTB: /otb|open.?to.?buy|inventory|tồn kho|stock/i.test(lowerMessage),
    brandHint: extractBrandHint(lowerMessage),
    seasonHint: extractSeasonHint(lowerMessage),
  };
}

function extractBrandHint(message: string): string | undefined {
  const brandPatterns = [
    /gucci/i, /prada/i, /lv|louis vuitton/i, /dior/i, /chanel/i,
    /hermes/i, /fendi/i, /burberry/i, /celine/i, /bottega/i,
  ];

  for (const pattern of brandPatterns) {
    if (pattern.test(message)) {
      return message.match(pattern)?.[0];
    }
  }
  return undefined;
}

function extractSeasonHint(message: string): string | undefined {
  const seasonPattern = /(ss|fw)\s*\d{2}/i;
  const match = message.match(seasonPattern);
  return match ? match[0].toUpperCase().replace(/\s/g, '') : undefined;
}
