// Generate Chart Tool - Create chart data for visualization
import prisma from '@/lib/prisma';

interface ChartInput {
  chart_type: 'line' | 'bar' | 'pie' | 'area' | 'combo';
  data_type: string;
  time_range?: {
    periods?: number;
    unit?: 'day' | 'week' | 'month';
  };
  filters?: {
    seasonId?: string;
    brandId?: string;
    categoryId?: string;
  };
}

interface ChartData {
  type: string;
  chart_type: string;
  title: string;
  data: Array<Record<string, unknown>>;
  config: {
    xAxis: string;
    yAxis: string[];
    colors?: string[];
  };
}

export async function generateChart(
  input: Record<string, unknown>,
  _userId: string
): Promise<ChartData | { error: string }> {
  const {
    chart_type,
    data_type,
    time_range = { periods: 6, unit: 'month' },
    filters = {},
  } = input as unknown as ChartInput;

  try {
    switch (data_type) {
      case 'sales_trend':
        return await generateSalesTrendChart(chart_type, time_range, filters);
      case 'inventory_trend':
        return await generateInventoryTrendChart(chart_type, time_range, filters);
      case 'otb_utilization':
        return await generateOTBUtilizationChart(chart_type, filters);
      case 'category_mix':
        return await generateCategoryMixChart(filters);
      case 'brand_comparison':
        return await generateBrandComparisonChart(chart_type, filters);
      case 'sell_through_trend':
        return await generateSellThroughTrendChart(chart_type, time_range, filters);
      case 'margin_trend':
        return await generateMarginTrendChart(chart_type, time_range, filters);
      default:
        return { error: `Unknown data type: ${data_type}` };
    }
  } catch (error) {
    console.error('Generate chart error:', error);
    return { error: 'Failed to generate chart' };
  }
}

function getMonthLabels(periods: number): string[] {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const currentMonth = new Date().getMonth();
  const labels: string[] = [];

  for (let i = periods - 1; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    labels.push(months[monthIndex]);
  }

  return labels;
}

async function generateSalesTrendChart(
  chartType: string,
  timeRange: ChartInput['time_range'],
  _filters: ChartInput['filters']
): Promise<ChartData> {
  const periods = timeRange?.periods || 6;
  const labels = getMonthLabels(periods);

  // Generate sample data
  const baseValue = 1500000;
  const data = labels.map((month, index) => {
    const variance = (Math.random() - 0.3) * 0.3;
    const trend = 1 + index * 0.02; // Slight upward trend
    return {
      month,
      sales: Math.round(baseValue * trend * (1 + variance)),
      target: Math.round(baseValue * trend * 1.1),
    };
  });

  return {
    type: 'chart',
    chart_type: chartType,
    title: 'Sales Trend - Last ' + periods + ' Months',
    data,
    config: {
      xAxis: 'month',
      yAxis: ['sales', 'target'],
      colors: ['#3b82f6', '#9ca3af'],
    },
  };
}

async function generateInventoryTrendChart(
  chartType: string,
  timeRange: ChartInput['time_range'],
  _filters: ChartInput['filters']
): Promise<ChartData> {
  const periods = timeRange?.periods || 6;
  const labels = getMonthLabels(periods);

  const baseInventory = 500000;
  const data = labels.map((month) => {
    const variance = (Math.random() - 0.5) * 0.2;
    return {
      month,
      inventory: Math.round(baseInventory * (1 + variance)),
      optimal: Math.round(baseInventory * 0.9),
    };
  });

  return {
    type: 'chart',
    chart_type: chartType,
    title: 'Inventory Levels - Last ' + periods + ' Months',
    data,
    config: {
      xAxis: 'month',
      yAxis: ['inventory', 'optimal'],
      colors: ['#10b981', '#6ee7b7'],
    },
  };
}

async function generateOTBUtilizationChart(
  chartType: string,
  filters: ChartInput['filters']
): Promise<ChartData> {
  const where: Record<string, unknown> = {};
  if (filters?.seasonId) where.seasonId = filters.seasonId;
  if (filters?.brandId) where.brandId = filters.brandId;

  const otbPlans = await prisma.oTBPlan.findMany({
    where,
    include: { brand: true },
    take: 10,
  });

  const data = otbPlans.map((plan) => {
    const otbTotal = Number(plan.totalOTBValue || 100000);
    // Simulate utilization (60-85%)
    const utilizationRate = 0.6 + Math.random() * 0.25;
    const otbUsed = otbTotal * utilizationRate;
    return {
      brand: plan.brand.name,
      utilized: Math.round(otbUsed),
      remaining: Math.round(otbTotal - otbUsed),
      utilization: (utilizationRate * 100).toFixed(1),
    };
  });

  // If no data, generate sample
  if (data.length === 0) {
    const sampleBrands = ['Brand A', 'Brand B', 'Brand C', 'Brand D'];
    sampleBrands.forEach((brand) => {
      const total = 500000 + Math.random() * 500000;
      const used = total * (0.5 + Math.random() * 0.4);
      data.push({
        brand,
        utilized: Math.round(used),
        remaining: Math.round(total - used),
        utilization: ((used / total) * 100).toFixed(1),
      });
    });
  }

  return {
    type: 'chart',
    chart_type: chartType,
    title: 'OTB Utilization by Brand',
    data,
    config: {
      xAxis: 'brand',
      yAxis: ['utilized', 'remaining'],
      colors: ['#3b82f6', '#e5e7eb'],
    },
  };
}

async function generateCategoryMixChart(
  _filters: ChartInput['filters']
): Promise<ChartData> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      skuItems: true,
    },
    take: 8,
  });

  const data = categories.map((cat) => ({
    category: cat.name,
    value: cat.skuItems.length * 10000 + Math.random() * 50000,
    percentage: 0,
  }));

  // Calculate percentages
  const total = data.reduce((sum, d) => sum + (d.value as number), 0);
  data.forEach((d) => {
    d.percentage = total > 0 ? ((d.value as number) / total) * 100 : 0;
  });

  // If no data, generate sample
  if (data.length === 0) {
    const sampleCategories = ['Tops', 'Bottoms', 'Dresses', 'Accessories', 'Outerwear'];
    const values = [30, 25, 20, 15, 10];
    sampleCategories.forEach((cat, i) => {
      data.push({
        category: cat,
        value: values[i] * 10000,
        percentage: values[i],
      });
    });
  }

  return {
    type: 'chart',
    chart_type: 'pie',
    title: 'Sales by Category',
    data,
    config: {
      xAxis: 'category',
      yAxis: ['value'],
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    },
  };
}

async function generateBrandComparisonChart(
  chartType: string,
  _filters: ChartInput['filters']
): Promise<ChartData> {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    include: {
      otbPlans: true,
    },
    take: 6,
  });

  const data = brands.map((brand) => {
    // Calculate total OTB value from plans
    const totalOTB = brand.otbPlans.reduce(
      (sum, p) => sum + Number(p.totalOTBValue || 0),
      0
    );
    // Simulate actual sales as 70-95% of plan
    const actualRate = 0.7 + Math.random() * 0.25;
    return {
      brand: brand.name,
      plan: totalOTB || Math.round(500000 + Math.random() * 500000),
      actual: Math.round((totalOTB || 500000) * actualRate),
    };
  });

  // If no data, generate sample
  if (data.length === 0) {
    const sampleBrands = ['Brand A', 'Brand B', 'Brand C', 'Brand D'];
    sampleBrands.forEach((brand) => {
      data.push({
        brand,
        plan: Math.round(500000 + Math.random() * 500000),
        actual: Math.round(400000 + Math.random() * 500000),
      });
    });
  }

  return {
    type: 'chart',
    chart_type: chartType,
    title: 'Brand Performance Comparison',
    data,
    config: {
      xAxis: 'brand',
      yAxis: ['plan', 'actual'],
      colors: ['#9ca3af', '#3b82f6'],
    },
  };
}

async function generateSellThroughTrendChart(
  chartType: string,
  timeRange: ChartInput['time_range'],
  _filters: ChartInput['filters']
): Promise<ChartData> {
  const periods = timeRange?.periods || 6;
  const labels = getMonthLabels(periods);

  const data = labels.map((month, index) => {
    const baseST = 65;
    const variance = (Math.random() - 0.3) * 10;
    const trend = index * 1.5;
    return {
      month,
      sellThrough: Math.min(95, Math.max(40, baseST + trend + variance)),
      target: 70,
    };
  });

  return {
    type: 'chart',
    chart_type: chartType,
    title: 'Sell-Through Rate Trend',
    data,
    config: {
      xAxis: 'month',
      yAxis: ['sellThrough', 'target'],
      colors: ['#10b981', '#d1d5db'],
    },
  };
}

async function generateMarginTrendChart(
  chartType: string,
  timeRange: ChartInput['time_range'],
  _filters: ChartInput['filters']
): Promise<ChartData> {
  const periods = timeRange?.periods || 6;
  const labels = getMonthLabels(periods);

  const data = labels.map((month) => {
    const baseMargin = 42;
    const variance = (Math.random() - 0.5) * 8;
    return {
      month,
      margin: Math.max(30, Math.min(55, baseMargin + variance)),
      target: 40,
    };
  });

  return {
    type: 'chart',
    chart_type: chartType,
    title: 'Gross Margin Trend',
    data,
    config: {
      xAxis: 'month',
      yAxis: ['margin', 'target'],
      colors: ['#f59e0b', '#d1d5db'],
    },
  };
}
