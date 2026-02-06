/**
 * Analytics Calculations
 */

import type { MetricData, TimeSeriesData, ComparisonData } from '@/types/analytics';

// Percentage change calculation
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Moving average calculation
export function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }
  return result;
}

// Standard deviation
export function calculateStandardDeviation(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squaredDiffs = data.map((value) => Math.pow(value - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
  return Math.sqrt(avgSquaredDiff);
}

// Z-score for anomaly detection
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

// Growth rate (CAGR-style)
export function calculateGrowthRate(startValue: number, endValue: number, periods: number): number {
  if (startValue <= 0 || periods <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / periods) - 1) * 100;
}

// Sell-through rate
export function calculateSellThrough(unitsSold: number, unitsReceived: number): number {
  if (unitsReceived === 0) return 0;
  return (unitsSold / unitsReceived) * 100;
}

// Gross margin percentage
export function calculateGrossMargin(revenue: number, cogs: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cogs) / revenue) * 100;
}

// Inventory turnover
export function calculateInventoryTurn(cogs: number, averageInventory: number): number {
  if (averageInventory === 0) return 0;
  return cogs / averageInventory;
}

// Weeks of supply
export function calculateWeeksOfSupply(inventory: number, weeklyAverageSales: number): number {
  if (weeklyAverageSales === 0) return 0;
  return inventory / weeklyAverageSales;
}

// Stock-to-sales ratio
export function calculateStockToSales(inventory: number, weeklySales: number): number {
  if (weeklySales === 0) return 0;
  return inventory / weeklySales;
}

// OTB utilization
export function calculateOTBUtilization(committed: number, allocated: number): number {
  if (allocated === 0) return 0;
  return (committed / allocated) * 100;
}

// SKU productivity
export function calculateSKUProductivity(revenue: number, activeSKUs: number): number {
  if (activeSKUs === 0) return 0;
  return revenue / activeSKUs;
}

// Markdown rate
export function calculateMarkdownRate(markdownAmount: number, originalAmount: number): number {
  if (originalAmount === 0) return 0;
  return (markdownAmount / originalAmount) * 100;
}

// Stock out rate
export function calculateStockOutRate(stockOutSKUs: number, totalSKUs: number): number {
  if (totalSKUs === 0) return 0;
  return (stockOutSKUs / totalSKUs) * 100;
}

// Receipt flow rate
export function calculateReceiptFlowRate(receivedUnits: number, plannedUnits: number): number {
  if (plannedUnits === 0) return 0;
  return (receivedUnits / plannedUnits) * 100;
}

// Determine trend direction
export function determineTrend(
  current: number,
  previous: number,
  threshold: number = 0.5
): 'up' | 'down' | 'neutral' {
  const change = calculatePercentageChange(current, previous);
  if (change > threshold) return 'up';
  if (change < -threshold) return 'down';
  return 'neutral';
}

// Calculate metric status based on target
export function calculateStatus(
  value: number,
  target: number,
  targetType: 'higher' | 'lower' | 'target',
  warningThreshold: number = 0.1,
  criticalThreshold: number = 0.2
): 'excellent' | 'good' | 'warning' | 'critical' {
  const variance = Math.abs(value - target) / target;

  if (targetType === 'higher') {
    if (value >= target) return 'excellent';
    if (variance <= warningThreshold) return 'good';
    if (variance <= criticalThreshold) return 'warning';
    return 'critical';
  }

  if (targetType === 'lower') {
    if (value <= target) return 'excellent';
    if (variance <= warningThreshold) return 'good';
    if (variance <= criticalThreshold) return 'warning';
    return 'critical';
  }

  // target type
  if (variance <= warningThreshold / 2) return 'excellent';
  if (variance <= warningThreshold) return 'good';
  if (variance <= criticalThreshold) return 'warning';
  return 'critical';
}

// Create metric data
export function createMetricData(
  label: string,
  value: number,
  previousValue: number,
  target?: number,
  unit?: string,
  sparklineData?: number[]
): MetricData {
  const changePercent = calculatePercentageChange(value, previousValue);
  const trend = determineTrend(value, previousValue);

  return {
    label,
    value,
    previousValue,
    changePercent,
    trend,
    target,
    unit,
    sparklineData,
  };
}

// Calculate comparison data
export function createComparisonData(
  category: string,
  current: number,
  previous: number
): ComparisonData {
  return {
    category,
    current,
    previous,
    change: current - previous,
    changePercent: calculatePercentageChange(current, previous),
  };
}

// Aggregate time series by period
export function aggregateByPeriod(
  data: TimeSeriesData[],
  period: 'day' | 'week' | 'month',
  valueKey: string
): TimeSeriesData[] {
  const grouped = new Map<string, number[]>();

  data.forEach((item) => {
    const date = new Date(item.date);
    let key: string;

    switch (period) {
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = item.date;
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item[valueKey] as number);
  });

  return Array.from(grouped.entries()).map(([date, values]) => ({
    date,
    [valueKey]: values.reduce((a, b) => a + b, 0) / values.length,
  }));
}
