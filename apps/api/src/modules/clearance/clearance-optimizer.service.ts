import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface SKUForOptimization {
  skuId: string;
  skuCode: string;
  skuName: string;
  brandId?: string;
  categoryId?: string;
  currentStock: number;
  currentPrice: number;
  originalPrice: number;
  costPrice: number;
  currentStockValue: number;
  weeksOnHand: number;
  sellThroughRate: number;
  weeksToSeasonEnd: number;
  avgWeeklySales: number;
}

export interface OptimizationConfig {
  strategy: 'MAXIMIZE_RECOVERY' | 'MAXIMIZE_SELL_THROUGH' | 'BALANCED';
  maxMarkdownPct: number;
  minMarginPct: number;
  analyzeElasticity: boolean;
}

export interface SKUOptimizationResult {
  skuId: string;
  skuCode: string;
  skuName: string;
  currentStock: number;
  currentPrice: number;
  costPrice: number;
  urgencyScore: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  demandElasticity: number;
  recommendedAction: 'MARKDOWN' | 'TRANSFER' | 'BUNDLE' | 'PROMOTE' | 'DISCONTINUE' | 'HOLD';
  recommendedMarkdownPct: number;
  recommendedNewPrice: number;
  projectedUnitsSold: number;
  projectedRevenue: number;
  projectedMarginLoss: number;
  projectedDaysToSell: number;
  reasoning: string;
}

@Injectable()
export class ClearanceOptimizerService {
  private readonly logger = new Logger(ClearanceOptimizerService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate urgency score for a SKU
   * Score ranges from 0 to 1 where higher = more urgent
   */
  calculateUrgencyScore(sku: SKUForOptimization): number {
    const weights = {
      weeksOfCover: 0.35,
      sellThrough: 0.25,
      timeToSeasonEnd: 0.25,
      stockValue: 0.15,
    };

    // Weeks of cover component (higher WoC = more urgent to clear)
    const wocScore = Math.min(sku.weeksOnHand / 12, 1);

    // Sell-through component (lower sell-through = more urgent)
    const sellThroughScore = Math.max(0, 1 - sku.sellThroughRate / 100);

    // Time to season end component (less time = more urgent)
    const timeScore = Math.max(0, 1 - sku.weeksToSeasonEnd / 12);

    // Stock value component (higher value = more priority)
    const valueScore = Math.min(sku.currentStockValue / 50000, 1);

    const urgencyScore =
      weights.weeksOfCover * wocScore +
      weights.sellThrough * sellThroughScore +
      weights.timeToSeasonEnd * timeScore +
      weights.stockValue * valueScore;

    return Math.round(urgencyScore * 100) / 100;
  }

  /**
   * Get urgency level from score
   */
  getUrgencyLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Estimate demand elasticity
   * Returns how much sales increase per % markdown
   */
  estimateDemandElasticity(sku: SKUForOptimization): number {
    // Base elasticity varies by category (fashion typically has higher elasticity)
    let baseElasticity = 1.5;

    // Adjust based on sell-through rate
    if (sku.sellThroughRate < 20) {
      baseElasticity *= 1.3; // Low performers respond better to markdowns
    } else if (sku.sellThroughRate > 60) {
      baseElasticity *= 0.8; // Good performers don't need as much markdown
    }

    // Adjust based on weeks on hand
    if (sku.weeksOnHand > 10) {
      baseElasticity *= 1.2; // Older inventory more price sensitive
    }

    return Math.round(baseElasticity * 100) / 100;
  }

  /**
   * Calculate optimal markdown percentage
   */
  calculateOptimalMarkdown(
    sku: SKUForOptimization,
    urgencyScore: number,
    elasticity: number,
    config: OptimizationConfig,
  ): number {
    // Base markdown based on urgency
    let baseMarkdown = urgencyScore * 50; // Max 50% from urgency alone

    // Strategy adjustments
    if (config.strategy === 'MAXIMIZE_RECOVERY') {
      baseMarkdown *= 0.7; // More conservative
    } else if (config.strategy === 'MAXIMIZE_SELL_THROUGH') {
      baseMarkdown *= 1.3; // More aggressive
    }

    // Adjust based on current sell-through
    if (sku.sellThroughRate < 10) {
      baseMarkdown += 15; // Add more markdown for very slow movers
    } else if (sku.sellThroughRate > 50) {
      baseMarkdown -= 10; // Reduce for better performers
    }

    // Adjust for time pressure
    if (sku.weeksToSeasonEnd < 4) {
      baseMarkdown += 20; // Urgent clearance needed
    } else if (sku.weeksToSeasonEnd < 8) {
      baseMarkdown += 10;
    }

    // Cap at maximum allowed
    let finalMarkdown = Math.min(baseMarkdown, config.maxMarkdownPct);

    // Ensure minimum margin if specified
    if (config.minMarginPct > -100) {
      const currentMargin = ((sku.currentPrice - sku.costPrice) / sku.currentPrice) * 100;
      const maxMarkdownForMargin = currentMargin - config.minMarginPct;
      finalMarkdown = Math.min(finalMarkdown, Math.max(0, maxMarkdownForMargin));
    }

    return Math.round(finalMarkdown * 10) / 10;
  }

  /**
   * Determine recommended action for a SKU
   */
  determineAction(
    sku: SKUForOptimization,
    urgencyScore: number,
    optimalMarkdown: number,
  ): 'MARKDOWN' | 'TRANSFER' | 'BUNDLE' | 'PROMOTE' | 'DISCONTINUE' | 'HOLD' {
    // Very low stock - might be worth holding
    if (sku.currentStock < 10) {
      return 'HOLD';
    }

    // Very slow mover with high markdown needed - consider discontinue
    if (sku.sellThroughRate < 5 && optimalMarkdown > 60) {
      return 'DISCONTINUE';
    }

    // Moderate performer - could benefit from promotion
    if (sku.sellThroughRate >= 30 && sku.sellThroughRate <= 50 && optimalMarkdown < 30) {
      return 'PROMOTE';
    }

    // Low stock but decent value - could bundle
    if (sku.currentStock < 50 && sku.currentStockValue > 1000 && sku.sellThroughRate < 25) {
      return 'BUNDLE';
    }

    // Default to markdown
    return 'MARKDOWN';
  }

  /**
   * Project sales based on markdown
   */
  projectSales(
    sku: SKUForOptimization,
    markdownPct: number,
    elasticity: number,
    weeksToProject: number,
  ): { units: number; revenue: number; daysToSell: number } {
    // Calculate new price
    const newPrice = sku.currentPrice * (1 - markdownPct / 100);

    // Calculate demand increase from markdown
    const demandMultiplier = 1 + (markdownPct / 100) * elasticity;

    // Project weekly sales
    const baseWeeklySales = sku.avgWeeklySales || sku.currentStock / 12;
    const projectedWeeklySales = Math.round(baseWeeklySales * demandMultiplier);

    // Calculate units that can be sold
    const maxUnitsSellable = Math.min(
      sku.currentStock,
      projectedWeeklySales * weeksToProject,
    );

    // Calculate revenue
    const projectedRevenue = maxUnitsSellable * newPrice;

    // Calculate days to sell current stock
    const daysToSell =
      projectedWeeklySales > 0
        ? Math.round((sku.currentStock / projectedWeeklySales) * 7)
        : 999;

    return {
      units: Math.round(maxUnitsSellable),
      revenue: Math.round(projectedRevenue * 100) / 100,
      daysToSell: Math.min(daysToSell, 365),
    };
  }

  /**
   * Generate reasoning for recommendation
   */
  generateReasoning(
    sku: SKUForOptimization,
    urgencyLevel: string,
    action: string,
    markdownPct: number,
  ): string {
    const parts: string[] = [];

    // Urgency reasoning
    if (urgencyLevel === 'CRITICAL') {
      parts.push('Critical urgency due to high stock levels and low sell-through.');
    } else if (urgencyLevel === 'HIGH') {
      parts.push('High priority for clearance action.');
    }

    // Stock reasoning
    if (sku.weeksOnHand > 10) {
      parts.push(`${Math.round(sku.weeksOnHand)} weeks of stock on hand.`);
    }

    // Sell-through reasoning
    if (sku.sellThroughRate < 20) {
      parts.push(`Low sell-through rate of ${sku.sellThroughRate.toFixed(1)}%.`);
    }

    // Time reasoning
    if (sku.weeksToSeasonEnd < 8) {
      parts.push(`Only ${sku.weeksToSeasonEnd} weeks until season end.`);
    }

    // Action reasoning
    if (action === 'MARKDOWN') {
      parts.push(`Recommend ${markdownPct}% markdown to accelerate sales.`);
    } else if (action === 'DISCONTINUE') {
      parts.push('Consider discontinuing due to poor performance.');
    } else if (action === 'BUNDLE') {
      parts.push('Consider bundling with other products to increase value.');
    }

    return parts.join(' ');
  }

  /**
   * Main optimization function
   */
  async optimizeSKUs(
    skus: SKUForOptimization[],
    config: OptimizationConfig,
    weeksToProject: number = 8,
  ): Promise<SKUOptimizationResult[]> {
    const results: SKUOptimizationResult[] = [];

    for (const sku of skus) {
      // Calculate urgency score
      const urgencyScore = this.calculateUrgencyScore(sku);
      const urgencyLevel = this.getUrgencyLevel(urgencyScore);

      // Estimate demand elasticity
      const elasticity = config.analyzeElasticity
        ? this.estimateDemandElasticity(sku)
        : 1.5;

      // Calculate optimal markdown
      const optimalMarkdown = this.calculateOptimalMarkdown(
        sku,
        urgencyScore,
        elasticity,
        config,
      );

      // Determine recommended action
      const action = this.determineAction(sku, urgencyScore, optimalMarkdown);

      // Calculate new price
      const newPrice = sku.currentPrice * (1 - optimalMarkdown / 100);

      // Project sales
      const projection = this.projectSales(
        sku,
        optimalMarkdown,
        elasticity,
        weeksToProject,
      );

      // Calculate margin loss
      const originalRevenue = sku.currentStock * sku.currentPrice;
      const marginLoss = originalRevenue - projection.revenue;

      // Generate reasoning
      const reasoning = this.generateReasoning(
        sku,
        urgencyLevel,
        action,
        optimalMarkdown,
      );

      results.push({
        skuId: sku.skuId,
        skuCode: sku.skuCode,
        skuName: sku.skuName,
        currentStock: sku.currentStock,
        currentPrice: sku.currentPrice,
        costPrice: sku.costPrice,
        urgencyScore,
        urgencyLevel,
        demandElasticity: elasticity,
        recommendedAction: action,
        recommendedMarkdownPct: optimalMarkdown,
        recommendedNewPrice: Math.round(newPrice * 100) / 100,
        projectedUnitsSold: projection.units,
        projectedRevenue: projection.revenue,
        projectedMarginLoss: Math.round(marginLoss * 100) / 100,
        projectedDaysToSell: projection.daysToSell,
        reasoning,
      });
    }

    // Sort by urgency score (highest first)
    results.sort((a, b) => b.urgencyScore - a.urgencyScore);

    return results;
  }

  /**
   * Generate optimization summary
   */
  generateSummary(results: SKUOptimizationResult[]): {
    totalSKUsAnalyzed: number;
    skusByUrgency: { critical: number; high: number; medium: number; low: number };
    skusByAction: {
      markdown: number;
      transfer: number;
      bundle: number;
      promote: number;
      discontinue: number;
      hold: number;
    };
    expectedOutcome: {
      totalRecovery: number;
      totalMarginLoss: number;
      avgSellThrough: number;
      avgDaysToSell: number;
    };
  } {
    const skusByUrgency = { critical: 0, high: 0, medium: 0, low: 0 };
    const skusByAction = { markdown: 0, transfer: 0, bundle: 0, promote: 0, discontinue: 0, hold: 0 };

    let totalRecovery = 0;
    let totalMarginLoss = 0;
    let totalStock = 0;
    let totalProjectedSales = 0;
    let totalDays = 0;

    for (const result of results) {
      // Count by urgency
      skusByUrgency[result.urgencyLevel.toLowerCase() as keyof typeof skusByUrgency]++;

      // Count by action
      skusByAction[result.recommendedAction.toLowerCase() as keyof typeof skusByAction]++;

      // Accumulate metrics
      totalRecovery += result.projectedRevenue;
      totalMarginLoss += result.projectedMarginLoss;
      totalStock += result.currentStock;
      totalProjectedSales += result.projectedUnitsSold;
      totalDays += result.projectedDaysToSell;
    }

    return {
      totalSKUsAnalyzed: results.length,
      skusByUrgency,
      skusByAction,
      expectedOutcome: {
        totalRecovery: Math.round(totalRecovery * 100) / 100,
        totalMarginLoss: Math.round(totalMarginLoss * 100) / 100,
        avgSellThrough: totalStock > 0 ? Math.round((totalProjectedSales / totalStock) * 10000) / 100 : 0,
        avgDaysToSell: results.length > 0 ? Math.round(totalDays / results.length) : 0,
      },
    };
  }
}
