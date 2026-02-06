import type {
  RiskIndicator,
  OpportunityIndicator,
} from '@/types/insights';
import {
  calculateWeeksOfSupply,
  calculateStockOutRate,
} from './calculations';
import { analyzeTrend, detectAnomalies } from './forecasting';

// Internal insight type for analytics functions
interface InternalInsight {
  id: string;
  type: string;
  category: string;
  title: string;
  summary: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  dataPoints: Array<{
    label: string;
    value: number;
    format: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: string;
  }>;
  affectedEntities: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  createdAt: Date;
}

// Internal data context with inventory-specific fields
interface InternalDataContext {
  currentInventory?: number;
  averageWeeklySales?: number;
  stockOutCount?: number;
  totalSKUs?: number;
  slowMovingPercentage?: number;
  sellThroughRate?: number;
  sellThrough?: number;
  targetSellThrough?: number;
  grossMargin?: number;
  targetMargin?: number;
  historicalData?: number[];
  budgetUtilization?: number;
  budgetTotal?: number;
  budgetSpent?: number;
  revenue?: number;
  previousRevenue?: number;
}

/**
 * Generate AI insights based on current data context
 */
export function generateInsights(context: InternalDataContext): InternalInsight[] {
  const insights: InternalInsight[] = [];

  // Analyze different aspects
  const inventoryInsights = analyzeInventory(context);
  const performanceInsights = analyzePerformance(context);
  const trendInsights = analyzeTrends(context);
  const anomalyInsights = analyzeAnomalies(context);

  insights.push(...inventoryInsights);
  insights.push(...performanceInsights);
  insights.push(...trendInsights);
  insights.push(...anomalyInsights);

  // Sort by priority (impact level)
  return insights.sort((a, b) => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.impact] - priorityOrder[b.impact];
  });
}

/**
 * Analyze inventory health and generate insights
 */
function analyzeInventory(context: InternalDataContext): InternalInsight[] {
  const insights: InternalInsight[] = [];
  const {
    currentInventory = 0,
    averageWeeklySales = 0,
    stockOutCount = 0,
    totalSKUs = 0,
    slowMovingPercentage = 0,
  } = context;

  // Weeks of Supply analysis
  if (averageWeeklySales > 0) {
    const wos = calculateWeeksOfSupply(currentInventory, averageWeeklySales);

    if (wos > 12) {
      insights.push({
        id: `inv-wos-high-${Date.now()}`,
        type: 'WARNING',
        category: 'inventory',
        title: 'Excess Inventory Alert',
        summary: `Current weeks of supply (${wos.toFixed(1)}) exceeds optimal range`,
        description: `Your inventory levels indicate ${wos.toFixed(1)} weeks of supply, significantly above the target range of 6-8 weeks. This may lead to increased carrying costs, potential obsolescence, and markdown pressure.`,
        impact: 'high',
        confidence: 0.92,
        dataPoints: [
          { label: 'Current WOS', value: wos, format: 'number' },
          { label: 'Target WOS', value: 7, format: 'number' },
          { label: 'Excess Value', value: currentInventory * ((wos - 7) / wos), format: 'currency' },
        ],
        recommendations: [
          { action: 'Reduce upcoming purchase orders by 15-20%', priority: 'high' },
          { action: 'Accelerate markdown cadence on slow-moving items', priority: 'medium' },
          { action: 'Review and cancel pending orders where possible', priority: 'medium' },
        ],
        affectedEntities: [
          { type: 'inventory', id: 'all', name: 'All Inventory' },
        ],
        createdAt: new Date(),
      });
    } else if (wos < 4) {
      insights.push({
        id: `inv-wos-low-${Date.now()}`,
        type: 'WARNING',
        category: 'inventory',
        title: 'Low Inventory Warning',
        summary: `Weeks of supply (${wos.toFixed(1)}) below optimal range`,
        description: `Your current inventory levels may not support projected demand. With only ${wos.toFixed(1)} weeks of supply, you risk stock-outs on popular items.`,
        impact: 'high',
        confidence: 0.88,
        dataPoints: [
          { label: 'Current WOS', value: wos, format: 'number' },
          { label: 'Target WOS', value: 6, format: 'number' },
          { label: 'Gap', value: 6 - wos, format: 'number' },
        ],
        recommendations: [
          { action: 'Expedite incoming orders where possible', priority: 'high' },
          { action: 'Review demand forecast for accuracy', priority: 'medium' },
          { action: 'Consider re-allocating inventory from lower-velocity locations', priority: 'medium' },
        ],
        affectedEntities: [],
        createdAt: new Date(),
      });
    }
  }

  // Stock-out analysis
  if (totalSKUs > 0) {
    const stockOutRate = calculateStockOutRate(stockOutCount, totalSKUs);

    if (stockOutRate > 5) {
      insights.push({
        id: `inv-sor-${Date.now()}`,
        type: 'WARNING',
        category: 'inventory',
        title: 'Stock-Out Rate Elevated',
        summary: `${stockOutRate.toFixed(1)}% of SKUs currently out of stock`,
        description: `Your stock-out rate is above the target threshold of 5%. This represents potential lost sales and customer dissatisfaction.`,
        impact: stockOutRate > 10 ? 'high' : 'medium',
        confidence: 0.95,
        dataPoints: [
          { label: 'Stock-Out Rate', value: stockOutRate, format: 'percent' },
          { label: 'SKUs Affected', value: stockOutCount, format: 'number' },
          { label: 'Est. Lost Revenue', value: stockOutCount * averageWeeklySales * 0.1, format: 'currency' },
        ],
        recommendations: [
          { action: 'Review stock-out items and prioritize replenishment', priority: 'high' },
          { action: 'Analyze root cause (forecast accuracy, lead times, etc.)', priority: 'medium' },
        ],
        affectedEntities: [],
        createdAt: new Date(),
      });
    }
  }

  // Slow-moving inventory
  if (slowMovingPercentage > 20) {
    insights.push({
      id: `inv-slow-${Date.now()}`,
      type: 'RECOMMENDATION',
      category: 'inventory',
      title: 'Slow-Moving Inventory Opportunity',
      summary: `${slowMovingPercentage.toFixed(0)}% of inventory is slow-moving`,
      description: `A significant portion of your inventory hasn't sold in the expected timeframe. Consider markdown strategies or promotional activities to accelerate sell-through.`,
      impact: 'medium',
      confidence: 0.85,
      dataPoints: [
        { label: 'Slow-Moving %', value: slowMovingPercentage, format: 'percent' },
        { label: 'Estimated Value', value: currentInventory * (slowMovingPercentage / 100), format: 'currency' },
      ],
      recommendations: [
        { action: 'Implement targeted markdowns on slowest SKUs', priority: 'high' },
        { action: 'Bundle slow-movers with popular items', priority: 'medium' },
        { action: 'Consider channel expansion or liquidation', priority: 'low' },
      ],
      affectedEntities: [],
      createdAt: new Date(),
    });
  }

  return insights;
}

/**
 * Analyze performance metrics and generate insights
 */
function analyzePerformance(context: InternalDataContext): InternalInsight[] {
  const insights: InternalInsight[] = [];
  const {
    revenue = 0,
    previousRevenue = 0,
    grossMargin = 0,
    targetMargin = 50,
    sellThrough = 0,
    targetSellThrough = 70,
  } = context;

  // Revenue growth analysis
  if (previousRevenue > 0) {
    const revenueGrowth = ((revenue - previousRevenue) / previousRevenue) * 100;

    if (revenueGrowth > 15) {
      insights.push({
        id: `perf-rev-growth-${Date.now()}`,
        type: 'OPPORTUNITY',
        category: 'performance',
        title: 'Strong Revenue Growth',
        summary: `Revenue up ${revenueGrowth.toFixed(1)}% vs previous period`,
        description: `Your revenue performance is exceeding expectations. Consider capitalizing on this momentum with strategic investments or expanded inventory in top-performing categories.`,
        impact: 'medium',
        confidence: 0.9,
        dataPoints: [
          { label: 'Revenue Growth', value: revenueGrowth, format: 'percent' },
          { label: 'Current Revenue', value: revenue, format: 'currency' },
          { label: 'Previous Revenue', value: previousRevenue, format: 'currency' },
        ],
        recommendations: [
          { action: 'Analyze top-performing SKUs for reorder opportunities', priority: 'high' },
          { action: 'Review marketing spend allocation to winning categories', priority: 'medium' },
        ],
        affectedEntities: [],
        createdAt: new Date(),
      });
    } else if (revenueGrowth < -10) {
      insights.push({
        id: `perf-rev-decline-${Date.now()}`,
        type: 'WARNING',
        category: 'performance',
        title: 'Revenue Decline Alert',
        summary: `Revenue down ${Math.abs(revenueGrowth).toFixed(1)}% vs previous period`,
        description: `Revenue is trending below previous period. Investigate potential causes including competitive pressure, inventory gaps, or market shifts.`,
        impact: 'high',
        confidence: 0.9,
        dataPoints: [
          { label: 'Revenue Change', value: revenueGrowth, format: 'percent' },
          { label: 'Revenue Gap', value: revenue - previousRevenue, format: 'currency' },
        ],
        recommendations: [
          { action: 'Review competitive pricing and positioning', priority: 'high' },
          { action: 'Analyze traffic and conversion trends', priority: 'high' },
          { action: 'Assess inventory availability in key categories', priority: 'medium' },
        ],
        affectedEntities: [],
        createdAt: new Date(),
      });
    }
  }

  // Margin analysis
  if (grossMargin < targetMargin - 3) {
    insights.push({
      id: `perf-margin-${Date.now()}`,
      type: 'WARNING',
      category: 'performance',
      title: 'Margin Below Target',
      summary: `Gross margin ${grossMargin.toFixed(1)}% is ${(targetMargin - grossMargin).toFixed(1)}pp below target`,
      description: `Your gross margin is under-performing relative to targets. Review pricing strategy, promotional mix, and markdown cadence.`,
      impact: grossMargin < targetMargin - 5 ? 'high' : 'medium',
      confidence: 0.92,
      dataPoints: [
        { label: 'Current Margin', value: grossMargin, format: 'percent' },
        { label: 'Target Margin', value: targetMargin, format: 'percent' },
        { label: 'Gap', value: targetMargin - grossMargin, format: 'percent' },
      ],
      recommendations: [
        { action: 'Review promotional calendar and reduce off-price activities', priority: 'high' },
        { action: 'Analyze category mix shift impact on margin', priority: 'medium' },
        { action: 'Optimize markdown timing strategy', priority: 'medium' },
      ],
      affectedEntities: [],
      createdAt: new Date(),
    });
  } else if (grossMargin > targetMargin + 3) {
    insights.push({
      id: `perf-margin-high-${Date.now()}`,
      type: 'OPPORTUNITY',
      category: 'performance',
      title: 'Strong Margin Performance',
      summary: `Gross margin ${grossMargin.toFixed(1)}% exceeds target by ${(grossMargin - targetMargin).toFixed(1)}pp`,
      description: `Your margin performance is exceeding targets. Consider whether there's room to invest in growth while maintaining healthy profitability.`,
      impact: 'low',
      confidence: 0.9,
      dataPoints: [
        { label: 'Current Margin', value: grossMargin, format: 'percent' },
        { label: 'Target Margin', value: targetMargin, format: 'percent' },
      ],
      recommendations: [
        { action: 'Evaluate opportunities to invest in traffic-driving activities', priority: 'medium' },
        { action: 'Consider selective price optimization for competitive categories', priority: 'low' },
      ],
      affectedEntities: [],
      createdAt: new Date(),
    });
  }

  // Sell-through analysis
  if (sellThrough < targetSellThrough - 5) {
    insights.push({
      id: `perf-st-${Date.now()}`,
      type: 'WARNING',
      category: 'performance',
      title: 'Sell-Through Below Target',
      summary: `Sell-through ${sellThrough.toFixed(1)}% is ${(targetSellThrough - sellThrough).toFixed(1)}pp below target`,
      description: `Your sell-through rate indicates inventory is moving slower than planned. This may lead to increased markdown requirements later in the season.`,
      impact: 'medium',
      confidence: 0.88,
      dataPoints: [
        { label: 'Current ST', value: sellThrough, format: 'percent' },
        { label: 'Target ST', value: targetSellThrough, format: 'percent' },
      ],
      recommendations: [
        { action: 'Identify and address slow-moving categories', priority: 'high' },
        { action: 'Consider early markdown on underperforming styles', priority: 'medium' },
        { action: 'Review demand forecast assumptions', priority: 'medium' },
      ],
      affectedEntities: [],
      createdAt: new Date(),
    });
  }

  return insights;
}

/**
 * Analyze trends and generate insights
 */
function analyzeTrends(context: InternalDataContext): InternalInsight[] {
  const insights: InternalInsight[] = [];
  const { historicalData = [] } = context;

  if (historicalData.length < 6) {
    return insights;
  }

  const trend = analyzeTrend(historicalData);

  if (trend.breakpoints && trend.breakpoints.length > 0) {
    const breakpoint = trend.breakpoints[0];
    insights.push({
      id: `trend-change-${Date.now()}`,
      type: 'INSIGHT',
      category: 'trend',
      title: 'Trend Change Detected',
      summary: `Significant ${breakpoint.type.replace('_', ' ')} identified`,
      description: `Our analysis detected a significant change in your data pattern. This may indicate a market shift, operational change, or external factor impact.`,
      impact: 'medium',
      confidence: 0.82,
      dataPoints: [
        { label: 'Change Type', value: 0, format: 'string' },
        { label: 'Magnitude', value: breakpoint.magnitude, format: 'number' },
      ],
      recommendations: [
        { action: 'Investigate potential causes of the trend change', priority: 'high' },
        { action: 'Adjust forecasts to reflect the new trend direction', priority: 'medium' },
      ],
      affectedEntities: [],
      createdAt: new Date(),
    });
  }

  if (trend.seasonality && trend.seasonality.detected && trend.seasonality.period) {
    const amplitude = trend.seasonality.amplitude ?? 0;
    insights.push({
      id: `trend-seasonality-${Date.now()}`,
      type: 'INSIGHT',
      category: 'trend',
      title: 'Seasonal Pattern Identified',
      summary: `${trend.seasonality.period}-period seasonal cycle detected`,
      description: `A repeating seasonal pattern has been identified in your data with a cycle of ${trend.seasonality.period} periods.`,
      impact: 'low',
      confidence: amplitude,
      dataPoints: [
        { label: 'Cycle Period', value: trend.seasonality.period, format: 'number' },
        { label: 'Pattern Strength', value: amplitude * 100, format: 'percent' },
      ],
      recommendations: [
        { action: 'Incorporate seasonality into demand planning', priority: 'medium' },
        { action: 'Align inventory builds with seasonal peaks', priority: 'medium' },
      ],
      affectedEntities: [],
      createdAt: new Date(),
    });
  }

  return insights;
}

/**
 * Analyze anomalies and generate insights
 */
function analyzeAnomalies(context: InternalDataContext): InternalInsight[] {
  const insights: InternalInsight[] = [];
  const { historicalData = [] } = context;

  if (historicalData.length < 6) {
    return insights;
  }

  const anomalies = detectAnomalies(historicalData);

  for (const anomaly of anomalies.filter((a) => a.severity !== 'low')) {
    const isSpike = anomaly.deviation > 0;
    insights.push({
      id: `anomaly-${anomaly.date.getTime()}-${Date.now()}`,
      type: 'INSIGHT',
      category: 'anomaly',
      title: `Data Anomaly: ${isSpike ? 'Unexpected Spike' : 'Unusual Dip'}`,
      summary: `${anomaly.severity} anomaly detected on ${anomaly.date.toLocaleDateString()}`,
      description: anomaly.explanation || `An unusual ${isSpike ? 'spike' : 'dip'} was detected with a value of ${anomaly.actualValue.toLocaleString()}, which is ${Math.abs(anomaly.deviation).toLocaleString()} ${isSpike ? 'above' : 'below'} the expected value.`,
      impact: anomaly.severity === 'high' ? 'high' : 'medium',
      confidence: 0.85,
      dataPoints: [
        { label: 'Actual Value', value: anomaly.actualValue, format: 'number' },
        { label: 'Expected Value', value: anomaly.expectedValue, format: 'number' },
        { label: 'Deviation', value: anomaly.deviation, format: 'number' },
      ],
      recommendations: [
        { action: 'Investigate the cause of this anomaly', priority: 'high' },
        { action: 'Determine if this is a one-time event or new pattern', priority: 'medium' },
      ],
      affectedEntities: [],
      createdAt: new Date(),
    });
  }

  return insights;
}

/**
 * Get risk indicators from insights
 */
export function extractRiskIndicators(insights: InternalInsight[]): RiskIndicator[] {
  return insights
    .filter((i) => i.type === 'WARNING')
    .map((i) => ({
      category: i.category,
      riskLevel: i.impact === 'high' ? 'high' : i.impact === 'medium' ? 'medium' : 'low',
      factors: [{
        name: i.title,
        severity: i.confidence,
        trend: 'stable' as const,
      }],
      mitigationActions: i.recommendations.map(r => r.action),
    }));
}

/**
 * Get opportunity indicators from insights
 */
export function extractOpportunityIndicators(insights: InternalInsight[]): OpportunityIndicator[] {
  return insights
    .filter((i) => i.type === 'OPPORTUNITY')
    .map((i) => ({
      category: i.category,
      opportunityLevel: i.impact === 'high' ? 'high' : i.impact === 'medium' ? 'medium' : 'low',
      estimatedValue: i.dataPoints?.[0]?.value || 0,
      confidence: i.confidence,
      factors: [{
        name: i.title,
        contribution: i.confidence,
      }],
      suggestedActions: i.recommendations.map(r => r.action),
    }));
}
