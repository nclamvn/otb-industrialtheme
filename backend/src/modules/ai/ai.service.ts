import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SizeRecommendation {
  sizeCode: string;
  recommendedPct: number;
  recommendedQty: number;
  confidence: number;
  historicalAvg: number;
  reasoning: string;
}

export interface SizeCurveComparison {
  alignment: 'good' | 'warning' | 'risk';
  score: number;
  deviations: Array<{
    sizeCode: string;
    userPct: number;
    recommendedPct: number;
    deviation: number;
  }>;
  suggestion: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate optimal size curve based on historical sell-through.
   * Algorithm: Weighted average of last 3 seasons, with recency bias.
   */
  async calculateSizeCurve(
    category: string,
    storeId: string,
    totalOrderQty: number,
  ): Promise<SizeRecommendation[]> {
    // 1. Fetch historical data grouped by size + season
    const history = await this.prisma.salesHistory.groupBy({
      by: ['sizeCode', 'season'],
      where: {
        storeId,
        skuCode: {
          in: await this.getSkuCodesForCategory(category),
        },
      },
      _sum: { quantitySold: true, quantityBought: true },
      _avg: { sellThroughPct: true },
      orderBy: { season: 'desc' },
    });

    if (history.length === 0) {
      // No historical data — return equal distribution
      return this.getDefaultCurve(totalOrderQty);
    }

    // 2. Compute weighted average (season 1 = 50%, season 2 = 30%, season 3 = 20%)
    const weights = [0.5, 0.3, 0.2];
    const seasons = [...new Set(history.map((h) => h.season))].slice(0, 3);
    const sizeMap = new Map<
      string,
      { totalWeight: number; weightedPct: number; seasons: number }
    >();

    for (const row of history) {
      const seasonIdx = seasons.indexOf(row.season);
      if (seasonIdx < 0 || seasonIdx >= weights.length) continue;

      const weight = weights[seasonIdx];
      const bought = row._sum.quantityBought || 1;
      const sold = row._sum.quantitySold || 0;
      const sellPct = (sold / bought) * 100;

      const existing = sizeMap.get(row.sizeCode) || {
        totalWeight: 0,
        weightedPct: 0,
        seasons: 0,
      };
      existing.totalWeight += weight;
      existing.weightedPct += sellPct * weight;
      existing.seasons += 1;
      sizeMap.set(row.sizeCode, existing);
    }

    // 3. Normalize to 100%
    let totalPct = 0;
    const sizes = Array.from(sizeMap.entries()).map(([sizeCode, data]) => {
      const pct = data.weightedPct / data.totalWeight;
      totalPct += pct;
      return {
        sizeCode,
        rawPct: pct,
        confidence: Math.min(data.seasons / 3, 1),
        avgSellThrough: pct,
        seasonsUsed: data.seasons,
      };
    });

    const normalized = sizes.map((s) => ({
      ...s,
      pct: (s.rawPct / totalPct) * 100,
    }));

    // 4. Build recommendations
    const recommendations: SizeRecommendation[] = normalized.map((s) => ({
      sizeCode: s.sizeCode,
      recommendedPct: Math.round(s.pct * 10) / 10,
      recommendedQty: Math.round(totalOrderQty * (s.pct / 100)),
      confidence: Math.round(s.confidence * 100) / 100,
      historicalAvg: Math.round(s.avgSellThrough * 10) / 10,
      reasoning: this.generateReasoning(s),
    }));

    // 5. Ensure total = 100%
    const sumPct = recommendations.reduce((a, b) => a + b.recommendedPct, 0);
    if (Math.abs(sumPct - 100) > 0.1 && recommendations.length > 0) {
      const largest = recommendations.reduce((a, b) =>
        a.recommendedPct > b.recommendedPct ? a : b,
      );
      largest.recommendedPct += 100 - sumPct;
      largest.recommendedQty = Math.round(
        totalOrderQty * (largest.recommendedPct / 100),
      );
    }

    return recommendations;
  }

  /**
   * Compare user sizing input vs AI recommendation.
   */
  async compareSizeCurve(
    skuId: string,
    storeId: string,
    userSizing: Record<string, number>,
  ): Promise<SizeCurveComparison> {
    const sku = await this.prisma.skuCatalog.findUnique({
      where: { id: skuId },
    });
    if (!sku) {
      return {
        alignment: 'risk',
        score: 0,
        deviations: [],
        suggestion: 'SKU not found',
      };
    }

    const totalQty = Object.values(userSizing).reduce((a, b) => a + b, 0);
    if (totalQty === 0) {
      return {
        alignment: 'good',
        score: 100,
        deviations: [],
        suggestion: 'No sizing data to compare',
      };
    }

    const recommended = await this.calculateSizeCurve(
      sku.productType,
      storeId,
      totalQty,
    );

    const deviations = recommended.map((rec) => {
      const userQty = userSizing[rec.sizeCode] || 0;
      const userPct = (userQty / totalQty) * 100;
      return {
        sizeCode: rec.sizeCode,
        userPct: Math.round(userPct * 10) / 10,
        recommendedPct: rec.recommendedPct,
        deviation: Math.round(Math.abs(userPct - rec.recommendedPct) * 10) / 10,
      };
    });

    const avgDeviation =
      deviations.reduce((sum, d) => sum + d.deviation, 0) /
      (deviations.length || 1);
    const score = Math.max(0, Math.round(100 - avgDeviation * 2));

    let alignment: 'good' | 'warning' | 'risk';
    let suggestion: string;

    if (avgDeviation <= 5) {
      alignment = 'good';
      suggestion = 'Size allocation aligns well with historical patterns';
    } else if (avgDeviation <= 15) {
      alignment = 'warning';
      const worst = deviations.reduce((a, b) =>
        a.deviation > b.deviation ? a : b,
      );
      suggestion = `Consider adjusting size ${worst.sizeCode}: you have ${worst.userPct.toFixed(0)}% vs recommended ${worst.recommendedPct.toFixed(0)}%`;
    } else {
      alignment = 'risk';
      suggestion =
        'Significant deviation from historical patterns. Review size allocation to avoid stockout/deadstock.';
    }

    return { alignment, score, deviations, suggestion };
  }

  // ── helpers ────────────────────────────────────────────────────────────

  private async getSkuCodesForCategory(category: string): Promise<string[]> {
    const skus = await this.prisma.skuCatalog.findMany({
      where: { productType: category, isActive: true },
      select: { skuCode: true },
    });
    return skus.map((s) => s.skuCode);
  }

  private getDefaultCurve(totalOrderQty: number): SizeRecommendation[] {
    const sizes = ['0002', '0004', '0006', '0008'];
    const pct = 100 / sizes.length;
    return sizes.map((sizeCode) => ({
      sizeCode,
      recommendedPct: pct,
      recommendedQty: Math.round(totalOrderQty / sizes.length),
      confidence: 0,
      historicalAvg: 0,
      reasoning: 'No historical data — using equal distribution',
    }));
  }

  private generateReasoning(size: {
    sizeCode: string;
    confidence: number;
    avgSellThrough: number;
    seasonsUsed: number;
  }): string {
    if (size.confidence >= 0.8) {
      return `High confidence: Based on ${size.seasonsUsed} seasons, size ${size.sizeCode} averages ${size.avgSellThrough.toFixed(1)}% of sales`;
    }
    if (size.confidence >= 0.5) {
      return `Medium confidence: Based on ${size.seasonsUsed} season(s) data`;
    }
    return 'Low confidence: Limited historical data, using category average';
  }
}
