import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SKUPerformanceQueryDto,
  SKUPerformanceDto,
  SKUAnalysisSummaryDto,
  SKURecommendationDto,
  PerformanceMetric,
  PerformanceCategory,
} from './dto/sku-analysis.dto';

// Performance thresholds for categorization
const THRESHOLDS = {
  SELL_THROUGH: { excellent: 85, good: 70, poor: 40 },
  GROSS_MARGIN: { excellent: 60, good: 45, poor: 30 },
  GMROI: { excellent: 3.0, good: 2.0, poor: 1.0 },
  WEEKS_OF_COVER: { low: 2, target: 5, high: 10 },
  REVENUE_CHANGE: { rising: 10, declining: -10 },
};

@Injectable()
export class SKUAnalysisService {
  private readonly logger = new Logger(SKUAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get best performing SKUs
   */
  async getBestPerformers(query: SKUPerformanceQueryDto): Promise<SKUPerformanceDto[]> {
    const skus = await this.getSKUPerformanceData({
      ...query,
      category: PerformanceCategory.BEST,
    });

    return this.sortAndRank(skus, query.metric || PerformanceMetric.REVENUE, 'desc').slice(
      0,
      query.limit || 10,
    );
  }

  /**
   * Get worst performing SKUs
   */
  async getWorstPerformers(query: SKUPerformanceQueryDto): Promise<SKUPerformanceDto[]> {
    const skus = await this.getSKUPerformanceData({
      ...query,
      category: PerformanceCategory.WORST,
    });

    return this.sortAndRank(skus, query.metric || PerformanceMetric.SELL_THROUGH, 'asc').slice(
      0,
      query.limit || 10,
    );
  }

  /**
   * Get rising stars (improving performance)
   */
  async getRisingStars(query: SKUPerformanceQueryDto): Promise<SKUPerformanceDto[]> {
    const skus = await this.getSKUPerformanceData({
      ...query,
      category: PerformanceCategory.RISING,
    });

    return skus
      .filter((s) => (s.revenueChangePct || 0) > THRESHOLDS.REVENUE_CHANGE.rising)
      .sort((a, b) => (b.revenueChangePct || 0) - (a.revenueChangePct || 0))
      .slice(0, query.limit || 10)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }

  /**
   * Get declining performers
   */
  async getDecliningPerformers(query: SKUPerformanceQueryDto): Promise<SKUPerformanceDto[]> {
    const skus = await this.getSKUPerformanceData({
      ...query,
      category: PerformanceCategory.DECLINING,
    });

    return skus
      .filter((s) => (s.revenueChangePct || 0) < THRESHOLDS.REVENUE_CHANGE.declining)
      .sort((a, b) => (a.revenueChangePct || 0) - (b.revenueChangePct || 0))
      .slice(0, query.limit || 10)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }

  /**
   * Get analysis summary
   */
  async getAnalysisSummary(query: SKUPerformanceQueryDto): Promise<SKUAnalysisSummaryDto> {
    const allSkus = await this.getSKUPerformanceData(query);

    if (allSkus.length === 0) {
      return {
        totalSKUs: 0,
        totalRevenue: 0,
        totalUnitsSold: 0,
        avgSellThrough: 0,
        avgGrossMargin: 0,
        top10RevenueContribution: 0,
        bottom10RevenueContribution: 0,
        bestPerformersSKUCount: 0,
        worstPerformersSKUCount: 0,
      };
    }

    const totalRevenue = allSkus.reduce((sum, s) => sum + s.revenue, 0);
    const totalUnitsSold = allSkus.reduce((sum, s) => sum + s.unitsSold, 0);

    // Sort by revenue for contribution analysis
    const sortedByRevenue = [...allSkus].sort((a, b) => b.revenue - a.revenue);
    const top10 = sortedByRevenue.slice(0, Math.ceil(allSkus.length * 0.1));
    const bottom10 = sortedByRevenue.slice(-Math.ceil(allSkus.length * 0.1));

    const top10Revenue = top10.reduce((sum, s) => sum + s.revenue, 0);
    const bottom10Revenue = bottom10.reduce((sum, s) => sum + s.revenue, 0);

    // Count by performance category
    const bestCount = allSkus.filter(
      (s) =>
        s.sellThroughRate >= THRESHOLDS.SELL_THROUGH.good &&
        s.grossMarginPct >= THRESHOLDS.GROSS_MARGIN.good,
    ).length;

    const worstCount = allSkus.filter(
      (s) =>
        s.sellThroughRate < THRESHOLDS.SELL_THROUGH.poor ||
        s.grossMarginPct < THRESHOLDS.GROSS_MARGIN.poor,
    ).length;

    return {
      totalSKUs: allSkus.length,
      totalRevenue,
      totalUnitsSold,
      avgSellThrough: allSkus.reduce((sum, s) => sum + s.sellThroughRate, 0) / allSkus.length,
      avgGrossMargin: allSkus.reduce((sum, s) => sum + s.grossMarginPct, 0) / allSkus.length,
      top10RevenueContribution: totalRevenue > 0 ? (top10Revenue / totalRevenue) * 100 : 0,
      bottom10RevenueContribution: totalRevenue > 0 ? (bottom10Revenue / totalRevenue) * 100 : 0,
      bestPerformersSKUCount: bestCount,
      worstPerformersSKUCount: worstCount,
    };
  }

  /**
   * Get recommendations for SKU actions
   */
  async getRecommendations(query: SKUPerformanceQueryDto): Promise<SKURecommendationDto[]> {
    const allSkus = await this.getSKUPerformanceData(query);
    const recommendations: SKURecommendationDto[] = [];

    for (const sku of allSkus) {
      const rec = this.generateRecommendation(sku);
      if (rec) {
        recommendations.push(rec);
      }
    }

    // Sort by priority and potential impact
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.potentialImpact - a.potentialImpact;
      })
      .slice(0, query.limit || 20);
  }

  /**
   * Internal method to get SKU performance data
   */
  private async getSKUPerformanceData(
    query: SKUPerformanceQueryDto,
  ): Promise<SKUPerformanceDto[]> {
    // In production, this would query from database
    // For now, return mock data
    const mockSKUs = this.generateMockSKUData(query);
    return mockSKUs;
  }

  /**
   * Generate mock SKU performance data
   */
  private generateMockSKUData(query: SKUPerformanceQueryDto): SKUPerformanceDto[] {
    const skus: SKUPerformanceDto[] = [];
    const count = 50;

    const brands = ['Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour'];
    const categories = ['T-Shirts', 'Jeans', 'Sneakers', 'Jackets', 'Accessories'];

    for (let i = 0; i < count; i++) {
      const revenue = Math.random() * 100000 + 1000;
      const unitsSold = Math.floor(Math.random() * 500) + 10;
      const grossMargin = revenue * (0.3 + Math.random() * 0.4);
      const currentStock = Math.floor(Math.random() * 200) + 5;
      const avgWeeklySales = unitsSold / 4;
      const previousRevenue = revenue * (0.8 + Math.random() * 0.4);

      const sellThrough = (unitsSold / (unitsSold + currentStock)) * 100;
      const avgInventoryCost = (revenue - grossMargin) / 2;

      const sku: SKUPerformanceDto = {
        skuId: `SKU-${String(i + 1).padStart(4, '0')}`,
        skuCode: `PRD-${brands[i % brands.length].substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        skuName: `${brands[i % brands.length]} ${categories[i % categories.length]} ${i + 1}`,
        brandName: brands[i % brands.length],
        categoryName: categories[i % categories.length],
        revenue,
        unitsSold,
        grossMargin,
        grossMarginPct: (grossMargin / revenue) * 100,
        sellThroughRate: sellThrough,
        gmroi: avgInventoryCost > 0 ? grossMargin / avgInventoryCost : 0,
        stockTurnover: avgWeeklySales > 0 ? (unitsSold * 52) / (currentStock + unitsSold / 2) : 0,
        currentStock,
        weeksOfCover: avgWeeklySales > 0 ? currentStock / avgWeeklySales : 0,
        previousRevenue,
        revenueChange: revenue - previousRevenue,
        revenueChangePct: previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0,
        performanceCategory: this.categorizePerformance(sellThrough, grossMargin / revenue * 100),
        rank: 0,
      };

      // Apply filters
      if (query.brandId && sku.brandName !== brands[parseInt(query.brandId) % brands.length]) {
        continue;
      }
      if (query.categoryId && sku.categoryName !== categories[parseInt(query.categoryId) % categories.length]) {
        continue;
      }

      skus.push(sku);
    }

    return skus;
  }

  /**
   * Categorize SKU performance
   */
  private categorizePerformance(sellThrough: number, grossMarginPct: number): PerformanceCategory {
    if (sellThrough >= THRESHOLDS.SELL_THROUGH.good && grossMarginPct >= THRESHOLDS.GROSS_MARGIN.good) {
      return PerformanceCategory.BEST;
    }
    if (sellThrough < THRESHOLDS.SELL_THROUGH.poor || grossMarginPct < THRESHOLDS.GROSS_MARGIN.poor) {
      return PerformanceCategory.WORST;
    }
    return PerformanceCategory.RISING; // Default
  }

  /**
   * Sort and rank SKUs
   */
  private sortAndRank(
    skus: SKUPerformanceDto[],
    metric: PerformanceMetric,
    order: 'asc' | 'desc',
  ): SKUPerformanceDto[] {
    const metricKey = this.getMetricKey(metric);
    const sorted = [...skus].sort((a, b) => {
      const aVal = ((a as unknown as Record<string, unknown>)[metricKey] as number) || 0;
      const bVal = ((b as unknown as Record<string, unknown>)[metricKey] as number) || 0;
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return sorted.map((s, i) => ({ ...s, rank: i + 1 }));
  }

  /**
   * Get metric key for sorting
   */
  private getMetricKey(metric: PerformanceMetric): string {
    const metricMap: Record<PerformanceMetric, string> = {
      [PerformanceMetric.REVENUE]: 'revenue',
      [PerformanceMetric.UNITS_SOLD]: 'unitsSold',
      [PerformanceMetric.GROSS_MARGIN]: 'grossMarginPct',
      [PerformanceMetric.SELL_THROUGH]: 'sellThroughRate',
      [PerformanceMetric.GMROI]: 'gmroi',
      [PerformanceMetric.STOCK_TURNOVER]: 'stockTurnover',
    };
    return metricMap[metric];
  }

  /**
   * Generate recommendation for a SKU
   */
  private generateRecommendation(sku: SKUPerformanceDto): SKURecommendationDto | null {
    // Low stock + high sell-through = Reorder
    if (sku.weeksOfCover < THRESHOLDS.WEEKS_OF_COVER.low && sku.sellThroughRate >= THRESHOLDS.SELL_THROUGH.good) {
      return {
        skuId: sku.skuId,
        skuCode: sku.skuCode,
        skuName: sku.skuName,
        action: 'REORDER',
        reason: `Low stock (${sku.weeksOfCover.toFixed(1)} weeks) with high sell-through (${sku.sellThroughRate.toFixed(1)}%)`,
        suggestedQuantity: Math.ceil(sku.unitsSold * 2),
        priority: 'HIGH',
        potentialImpact: sku.revenue * 0.5,
      };
    }

    // High stock + low sell-through = Markdown
    if (sku.weeksOfCover > THRESHOLDS.WEEKS_OF_COVER.high && sku.sellThroughRate < THRESHOLDS.SELL_THROUGH.poor) {
      return {
        skuId: sku.skuId,
        skuCode: sku.skuCode,
        skuName: sku.skuName,
        action: 'MARKDOWN',
        reason: `Excess stock (${sku.weeksOfCover.toFixed(1)} weeks) with low sell-through (${sku.sellThroughRate.toFixed(1)}%)`,
        suggestedMarkdownPct: 20 + Math.min(30, (sku.weeksOfCover - THRESHOLDS.WEEKS_OF_COVER.high) * 5),
        priority: 'HIGH',
        potentialImpact: sku.currentStock * (sku.revenue / sku.unitsSold) * 0.3,
      };
    }

    // Very poor performance = Discontinue
    if (sku.sellThroughRate < 20 && sku.grossMarginPct < THRESHOLDS.GROSS_MARGIN.poor) {
      return {
        skuId: sku.skuId,
        skuCode: sku.skuCode,
        skuName: sku.skuName,
        action: 'DISCONTINUE',
        reason: `Very poor performance: sell-through ${sku.sellThroughRate.toFixed(1)}%, margin ${sku.grossMarginPct.toFixed(1)}%`,
        priority: 'MEDIUM',
        potentialImpact: sku.currentStock * (sku.revenue / sku.unitsSold),
      };
    }

    // Good performance declining = Promote
    if (sku.sellThroughRate >= THRESHOLDS.SELL_THROUGH.good && (sku.revenueChangePct || 0) < -5) {
      return {
        skuId: sku.skuId,
        skuCode: sku.skuCode,
        skuName: sku.skuName,
        action: 'PROMOTE',
        reason: `Good product declining (${sku.revenueChangePct?.toFixed(1)}% revenue change)`,
        priority: 'LOW',
        potentialImpact: Math.abs(sku.revenueChange || 0) * 0.5,
      };
    }

    return null;
  }
}
