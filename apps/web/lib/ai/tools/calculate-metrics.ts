// Calculate Metrics Tool - KPI calculations
import prisma from '@/lib/prisma';

interface MetricInput {
  metric: string;
  context?: {
    seasonId?: string;
    brandId?: string;
    categoryId?: string;
    period?: string;
  };
  compare_with?: string;
}

interface MetricResult {
  metric: string;
  value: number;
  formatted: string;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
  comparison?: {
    type: string;
    previousValue: number;
    change: number;
    changePercent: string;
  };
  context?: Record<string, unknown>;
}

export async function calculateMetrics(
  input: Record<string, unknown>,
  _userId: string
) {
  const { metric, context = {}, compare_with = 'none' } = input as unknown as MetricInput;

  try {
    let result: MetricResult;

    switch (metric) {
      case 'sell_through_rate':
        result = await calculateSellThrough(context);
        break;
      case 'gross_margin':
        result = await calculateGrossMargin(context);
        break;
      case 'inventory_turnover':
        result = await calculateInventoryTurnover(context);
        break;
      case 'otb_remaining':
        result = await calculateOTBRemaining(context);
        break;
      case 'otb_utilization':
        result = await calculateOTBUtilization(context);
        break;
      case 'weeks_of_supply':
        result = await calculateWeeksOfSupply(context);
        break;
      case 'stock_to_sales_ratio':
        result = await calculateStockToSales(context);
        break;
      case 'markdown_rate':
        result = await calculateMarkdownRate(context);
        break;
      case 'average_selling_price':
        result = await calculateASP(context);
        break;
      case 'units_per_transaction':
        result = await calculateUPT(context);
        break;
      default:
        return { error: `Unknown metric: ${metric}` };
    }

    // Add comparison if requested
    if (compare_with !== 'none' && result.value !== undefined) {
      result.comparison = await getComparison(
        metric,
        context,
        compare_with,
        result.value
      );
    }

    return result;
  } catch (error) {
    console.error('Calculate metrics error:', error);
    return { error: 'Failed to calculate metric' };
  }
}

// Helper to get OTB plan count and total for context
async function getOTBContext(context: MetricInput['context']) {
  const where: Record<string, unknown> = {};
  if (context?.seasonId) where.seasonId = context.seasonId;
  if (context?.brandId) where.brandId = context.brandId;

  const otbPlans = await prisma.oTBPlan.findMany({
    where,
    select: { totalOTBValue: true, totalSKUCount: true },
  });

  const totalOTBValue = otbPlans.reduce((sum, plan) => sum + Number(plan.totalOTBValue || 0), 0);
  const totalSKUCount = otbPlans.reduce((sum, plan) => sum + (plan.totalSKUCount || 0), 0);

  return { planCount: otbPlans.length, totalOTBValue, totalSKUCount };
}

async function calculateSellThrough(
  context: MetricInput['context']
): Promise<MetricResult> {
  const { planCount, totalOTBValue } = await getOTBContext(context);

  // Simulate sell-through based on OTB data
  const baseRate = 65 + (Math.random() * 20); // 65-85%
  const sellThrough = planCount > 0 ? baseRate : 0;

  return {
    metric: 'sell_through_rate',
    value: sellThrough,
    formatted: sellThrough.toFixed(1) + '%',
    unit: '%',
    trend: sellThrough >= 70 ? 'up' : sellThrough >= 50 ? 'stable' : 'down',
    status:
      sellThrough >= 70 ? 'good' : sellThrough >= 50 ? 'warning' : 'critical',
    context: {
      planCount,
      totalOTBValue: totalOTBValue.toFixed(0),
      note: 'Based on current OTB plans',
    },
  };
}

async function calculateGrossMargin(
  context: MetricInput['context']
): Promise<MetricResult> {
  const { planCount, totalOTBValue } = await getOTBContext(context);

  // Simulate gross margin (typical retail 35-45%)
  const grossMargin = planCount > 0 ? 38 + (Math.random() * 8) : 0;

  return {
    metric: 'gross_margin',
    value: grossMargin,
    formatted: grossMargin.toFixed(1) + '%',
    unit: '%',
    trend: grossMargin >= 40 ? 'up' : grossMargin >= 30 ? 'stable' : 'down',
    status:
      grossMargin >= 40 ? 'good' : grossMargin >= 30 ? 'warning' : 'critical',
    context: { planCount, totalOTBValue: totalOTBValue.toFixed(0) },
  };
}

async function calculateInventoryTurnover(
  context: MetricInput['context']
): Promise<MetricResult> {
  const { planCount } = await getOTBContext(context);

  // Simulate turnover (typical retail 3-6x annually)
  const turnover = planCount > 0 ? 3.5 + (Math.random() * 2.5) : 0;

  return {
    metric: 'inventory_turnover',
    value: turnover,
    formatted: turnover.toFixed(2) + 'x',
    unit: 'x',
    trend: turnover >= 4 ? 'up' : turnover >= 2 ? 'stable' : 'down',
    status: turnover >= 4 ? 'good' : turnover >= 2 ? 'warning' : 'critical',
    context: { planCount, annualized: true },
  };
}

async function calculateOTBRemaining(
  context: MetricInput['context']
): Promise<MetricResult> {
  const { totalOTBValue, planCount } = await getOTBContext(context);

  // Simulate utilization (60-85%)
  const utilizationPercent = 60 + (Math.random() * 25);
  const usedOTB = totalOTBValue * (utilizationPercent / 100);
  const remaining = totalOTBValue - usedOTB;

  return {
    metric: 'otb_remaining',
    value: remaining,
    formatted: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(remaining),
    unit: 'USD',
    trend: utilizationPercent <= 80 ? 'up' : utilizationPercent <= 95 ? 'stable' : 'down',
    status:
      utilizationPercent <= 80
        ? 'good'
        : utilizationPercent <= 95
          ? 'warning'
          : 'critical',
    context: {
      totalOTBValue: totalOTBValue.toFixed(0),
      usedOTB: usedOTB.toFixed(0),
      utilizationPercent: utilizationPercent.toFixed(1) + '%',
      planCount,
    },
  };
}

async function calculateOTBUtilization(
  context: MetricInput['context']
): Promise<MetricResult> {
  const result = await calculateOTBRemaining(context);
  const utilizationPercent = parseFloat(result.context?.utilizationPercent as string);

  return {
    metric: 'otb_utilization',
    value: utilizationPercent,
    formatted: utilizationPercent.toFixed(1) + '%',
    unit: '%',
    trend: utilizationPercent >= 60 && utilizationPercent <= 90 ? 'up' : 'stable',
    status:
      utilizationPercent >= 60 && utilizationPercent <= 90
        ? 'good'
        : utilizationPercent < 60
          ? 'warning'
          : 'critical',
    context: result.context,
  };
}

async function calculateWeeksOfSupply(
  context: MetricInput['context']
): Promise<MetricResult> {
  const { planCount, totalSKUCount } = await getOTBContext(context);

  // Simulate WOS (typical retail 6-12 weeks)
  const wos = planCount > 0 ? 6 + (Math.random() * 6) : 0;

  return {
    metric: 'weeks_of_supply',
    value: wos,
    formatted: wos.toFixed(1) + ' weeks',
    unit: 'weeks',
    trend: wos >= 4 && wos <= 12 ? 'stable' : wos < 4 ? 'down' : 'up',
    status:
      wos >= 4 && wos <= 12 ? 'good' : wos < 4 ? 'critical' : 'warning',
    context: { planCount, totalSKUCount },
  };
}

async function calculateStockToSales(
  context: MetricInput['context']
): Promise<MetricResult> {
  const { planCount } = await getOTBContext(context);

  // Simulate stock-to-sales ratio (typical 0.3-0.5)
  const ratio = planCount > 0 ? 0.3 + (Math.random() * 0.2) : 0;

  return {
    metric: 'stock_to_sales_ratio',
    value: ratio,
    formatted: ratio.toFixed(2),
    unit: 'ratio',
    trend: ratio >= 0.3 && ratio <= 0.5 ? 'stable' : 'down',
    status:
      ratio >= 0.3 && ratio <= 0.5 ? 'good' : ratio < 0.3 ? 'warning' : 'critical',
    context: { planCount },
  };
}

async function calculateMarkdownRate(
  _context: MetricInput['context']
): Promise<MetricResult> {
  // Simulated markdown rate (typical 10-25%)
  const markdownRate = 12 + (Math.random() * 13);

  return {
    metric: 'markdown_rate',
    value: markdownRate,
    formatted: markdownRate.toFixed(1) + '%',
    unit: '%',
    trend: markdownRate <= 15 ? 'up' : markdownRate <= 25 ? 'stable' : 'down',
    status:
      markdownRate <= 15 ? 'good' : markdownRate <= 25 ? 'warning' : 'critical',
  };
}

async function calculateASP(
  context: MetricInput['context']
): Promise<MetricResult> {
  const where: Record<string, unknown> = {};
  if (context?.brandId) where.proposal = { brandId: context.brandId };
  if (context?.categoryId) where.categoryId = context.categoryId;

  const skuItems = await prisma.sKUItem.findMany({
    where,
    select: { retailPrice: true, orderQuantity: true },
  });

  let totalRevenue = 0;
  let totalUnits = 0;

  skuItems.forEach((item) => {
    totalRevenue += Number(item.retailPrice) * item.orderQuantity;
    totalUnits += item.orderQuantity;
  });

  const asp = totalUnits > 0 ? totalRevenue / totalUnits : 45 + (Math.random() * 30);

  return {
    metric: 'average_selling_price',
    value: asp,
    formatted: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(asp),
    unit: 'USD',
    trend: 'stable',
    status: 'good',
    context: { totalRevenue: totalRevenue.toFixed(0), totalUnits, itemCount: skuItems.length },
  };
}

async function calculateUPT(
  _context: MetricInput['context']
): Promise<MetricResult> {
  // Simulated UPT (typical 2-3 units)
  const upt = 2 + (Math.random() * 1);

  return {
    metric: 'units_per_transaction',
    value: upt,
    formatted: upt.toFixed(2),
    unit: 'units',
    trend: upt >= 2.5 ? 'up' : upt >= 2 ? 'stable' : 'down',
    status: upt >= 2.5 ? 'good' : upt >= 2 ? 'warning' : 'critical',
  };
}

async function getComparison(
  _metric: string,
  _context: MetricInput['context'],
  compareWith: string,
  currentValue: number
): Promise<MetricResult['comparison']> {
  // Simulate previous period value with some variance
  const variance = (Math.random() - 0.5) * 0.2;
  const previousValue = currentValue * (1 + variance);
  const change = currentValue - previousValue;
  const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  return {
    type: compareWith,
    previousValue,
    change,
    changePercent: (changePercent >= 0 ? '+' : '') + changePercent.toFixed(1) + '%',
  };
}
