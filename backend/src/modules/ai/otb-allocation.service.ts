import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DimensionRecommendation {
  dimensionType: 'collection' | 'gender' | 'category';
  dimensionValue: string;
  recommendedPct: number;
  recommendedAmt: number;
  confidence: number;
  reasoning: string;
  factors: {
    historicalAvg: number;
    sellThroughScore: number;
    growthTrend: number;
    seasonalityFactor: number;
  };
}

export interface AllocationResult {
  budgetDetailId: string;
  budgetAmount: number;
  collections: DimensionRecommendation[];
  genders: DimensionRecommendation[];
  categories: DimensionRecommendation[];
  overallConfidence: number;
  dataQuality: 'high' | 'medium' | 'low';
  warnings: string[];
}

interface AllocationInput {
  budgetDetailId: string;
  budgetAmount: number;
  seasonGroup: string;
  seasonType: string;
  storeId: string;
  brandId?: string;
}

@Injectable()
export class OtbAllocationService {
  private readonly logger = new Logger(OtbAllocationService.name);

  private readonly FACTOR_WEIGHTS = {
    historicalAvg: 0.4,
    sellThrough: 0.3,
    growthTrend: 0.2,
    seasonality: 0.1,
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Generate full OTB allocation recommendation.
   */
  async generateAllocation(input: AllocationInput): Promise<AllocationResult> {
    this.logger.log(
      `Generating allocation for budget detail: ${input.budgetDetailId}`,
    );

    const warnings: string[] = [];
    const historicalData = await this.fetchHistoricalData(input);

    if (historicalData.length < 2) {
      warnings.push(
        'Limited historical data available. Recommendations based on category averages.',
      );
    }

    const collections = await this.calcDimension('collection', input, historicalData);
    const genders = await this.calcDimension('gender', input, historicalData);
    const categories = await this.calcDimension('category', input, historicalData);

    this.normalize(collections);
    this.normalize(genders);
    this.normalize(categories);

    const all = [...collections, ...genders, ...categories];
    const overallConfidence =
      all.reduce((s, r) => s + r.confidence, 0) / (all.length || 1);

    const dataQuality: AllocationResult['dataQuality'] =
      historicalData.length >= 3 ? 'high' : historicalData.length >= 2 ? 'medium' : 'low';

    await this.saveRecommendations(input.budgetDetailId, all);

    return {
      budgetDetailId: input.budgetDetailId,
      budgetAmount: input.budgetAmount,
      collections,
      genders,
      categories,
      overallConfidence,
      dataQuality,
      warnings,
    };
  }

  async getRecommendations(budgetDetailId: string) {
    return this.prisma.allocationRecommendation.findMany({
      where: { budgetDetailId },
      orderBy: [{ dimensionType: 'asc' }, { recommendedPct: 'desc' }],
    });
  }

  async applyRecommendations(budgetDetailId: string, dimensionType?: string) {
    const where: any = { budgetDetailId, isApplied: false };
    if (dimensionType) where.dimensionType = dimensionType;

    await this.prisma.allocationRecommendation.updateMany({
      where,
      data: { isApplied: true },
    });

    return this.prisma.allocationRecommendation.findMany({
      where: { budgetDetailId, isApplied: true },
    });
  }

  async compareAllocation(
    budgetDetailId: string,
    userAllocation: Array<{ dimensionType: string; dimensionValue: string; pct: number }>,
  ) {
    const recs = await this.getRecommendations(budgetDetailId);

    const comparisons = userAllocation.map((user) => {
      const ai = recs.find(
        (r) =>
          r.dimensionType === user.dimensionType &&
          r.dimensionValue === user.dimensionValue,
      );
      const deviation = ai
        ? Math.abs(user.pct - Number(ai.recommendedPct))
        : 0;

      return {
        dimensionType: user.dimensionType,
        dimensionValue: user.dimensionValue,
        userPct: user.pct,
        aiPct: ai ? Number(ai.recommendedPct) : null,
        deviation,
        status:
          deviation <= 5
            ? 'aligned'
            : deviation <= 15
              ? 'minor_deviation'
              : 'significant_deviation',
      };
    });

    const avgDev =
      comparisons.reduce((s, c) => s + c.deviation, 0) /
      (comparisons.length || 1);
    const alignmentScore = Math.max(0, 100 - avgDev * 2);

    return {
      comparisons,
      alignmentScore,
      overallStatus:
        avgDev <= 5 ? 'good' : avgDev <= 15 ? 'review_recommended' : 'high_risk',
      suggestion:
        avgDev > 15
          ? 'Significant deviation from AI recommendations. Review allocation to ensure alignment with historical performance.'
          : avgDev > 5
            ? 'Minor deviations detected. Consider reviewing flagged categories.'
            : 'Allocation aligns well with AI recommendations.',
    };
  }

  // ── private helpers ────────────────────────────────────────────────────

  private async fetchHistoricalData(input: AllocationInput) {
    const history = await this.prisma.allocationHistory.findMany({
      where: {
        seasonGroup: input.seasonGroup,
        seasonType: input.seasonType,
        fiscalYear: { lt: new Date().getFullYear() },
      },
      orderBy: { fiscalYear: 'desc' },
      take: 100,
    });

    const byYear = new Map<number, typeof history>();
    history.forEach((h) => {
      if (!byYear.has(h.fiscalYear)) byYear.set(h.fiscalYear, []);
      byYear.get(h.fiscalYear)!.push(h);
    });

    return Array.from(byYear.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, 3)
      .map(([year, data]) => ({ year, data }));
  }

  private async calcDimension(
    dimensionType: 'collection' | 'gender' | 'category',
    input: AllocationInput,
    historicalData: Array<{ year: number; data: any[] }>,
  ): Promise<DimensionRecommendation[]> {
    const values = await this.getDimensionValues(dimensionType);
    const recs: DimensionRecommendation[] = [];

    for (const value of values) {
      const valueHistory = historicalData
        .map((yd) => {
          const m = yd.data.find(
            (d: any) =>
              d.dimensionType === dimensionType && d.dimensionValue === value,
          );
          return {
            year: yd.year,
            allocatedPct: m ? Number(m.allocatedPct) : null,
            actualSales: m ? Number(m.actualSales) : null,
            sellThroughPct: m ? Number(m.sellThroughPct) : null,
          };
        })
        .filter((d) => d.allocatedPct !== null);

      const factors = this.calcFactors(valueHistory, dimensionType, value);
      const weighted =
        factors.historicalAvg * this.FACTOR_WEIGHTS.historicalAvg +
        factors.sellThroughScore * this.FACTOR_WEIGHTS.sellThrough +
        factors.growthTrend * this.FACTOR_WEIGHTS.growthTrend +
        factors.seasonalityFactor * this.FACTOR_WEIGHTS.seasonality;

      const confidence = Math.min(valueHistory.length / 3, 1);

      recs.push({
        dimensionType,
        dimensionValue: value,
        recommendedPct: weighted,
        recommendedAmt: (input.budgetAmount * weighted) / 100,
        confidence,
        reasoning: this.genReasoning(factors, valueHistory.length, value),
        factors,
      });
    }

    return recs;
  }

  private calcFactors(
    history: Array<{
      year: number;
      allocatedPct: number | null;
      sellThroughPct: number | null;
    }>,
    dimensionType: string,
    value: string,
  ) {
    const weights = [0.5, 0.3, 0.2];
    let historicalAvg = 0;
    let totalWeight = 0;

    history.forEach((h, i) => {
      if (h.allocatedPct !== null) {
        const w = weights[i] || 0.1;
        historicalAvg += h.allocatedPct * w;
        totalWeight += w;
      }
    });

    historicalAvg =
      totalWeight > 0
        ? historicalAvg / totalWeight
        : this.defaultPct(dimensionType, value);

    const avgST =
      history.reduce((s, h) => s + (h.sellThroughPct || 70), 0) /
      Math.max(history.length, 1);
    const sellThroughScore = historicalAvg * (1 + (avgST - 70) / 100);

    let growthTrend = historicalAvg;
    if (history.length >= 2) {
      const recent = history[0].allocatedPct || 0;
      const older = history[history.length - 1].allocatedPct || 0;
      if (older > 0) {
        growthTrend = historicalAvg * (1 + ((recent - older) / older) * 0.5);
      }
    }

    const r = (v: number) => Math.round(v * 100) / 100;
    return {
      historicalAvg: r(historicalAvg),
      sellThroughScore: r(sellThroughScore),
      growthTrend: r(growthTrend),
      seasonalityFactor: r(historicalAvg),
    };
  }

  private defaultPct(dimensionType: string, value: string): number {
    const defaults: Record<string, Record<string, number>> = {
      collection: { 'Carry Over': 40, Seasonal: 60 },
      gender: { Female: 60, Male: 40 },
      category: {
        "WOMEN'S RTW": 25,
        'WOMEN HARD ACCESSORIES': 20,
        'W BAGS': 15,
        "MEN'S RTW": 15,
        'MEN ACCESSORIES': 10,
      },
    };
    return defaults[dimensionType]?.[value] || 10;
  }

  private async getDimensionValues(dimensionType: string): Promise<string[]> {
    switch (dimensionType) {
      case 'collection': {
        const rows = await this.prisma.collection.findMany({ where: { isActive: true } });
        return rows.map((c) => c.name);
      }
      case 'gender': {
        const rows = await this.prisma.gender.findMany({ where: { isActive: true } });
        return rows.map((g) => g.name);
      }
      case 'category': {
        const rows = await this.prisma.category.findMany({ where: { isActive: true } });
        return rows.map((c) => c.name);
      }
      default:
        return [];
    }
  }

  private normalize(recs: DimensionRecommendation[]) {
    const total = recs.reduce((s, r) => s + r.recommendedPct, 0);
    if (total === 0) return;
    if (Math.abs(total - 100) > 0.1) {
      const factor = 100 / total;
      recs.forEach((r) => {
        r.recommendedPct = Math.round(r.recommendedPct * factor * 100) / 100;
        r.recommendedAmt = Math.round(r.recommendedAmt * factor * 100) / 100;
      });
    }
    const newTotal = recs.reduce((s, r) => s + r.recommendedPct, 0);
    if (newTotal !== 100 && recs.length > 0) {
      const largest = recs.reduce((a, b) =>
        a.recommendedPct > b.recommendedPct ? a : b,
      );
      largest.recommendedPct += 100 - newTotal;
    }
  }

  private genReasoning(
    factors: DimensionRecommendation['factors'],
    dataPoints: number,
    value: string,
  ): string {
    const parts: string[] = [];
    if (dataPoints >= 3) parts.push('Based on 3 seasons of data.');
    else if (dataPoints >= 1) parts.push(`Based on ${dataPoints} season(s) of data.`);
    else parts.push('Using category default (no historical data).');

    if (factors.historicalAvg > 0)
      parts.push(`Historical average: ${factors.historicalAvg.toFixed(1)}%.`);

    if (factors.sellThroughScore > factors.historicalAvg * 1.05)
      parts.push('Increased allocation due to strong sell-through.');
    else if (factors.sellThroughScore < factors.historicalAvg * 0.95)
      parts.push('Reduced allocation due to below-average sell-through.');

    if (factors.growthTrend > factors.historicalAvg * 1.1)
      parts.push('Upward trend detected — category is growing.');
    else if (factors.growthTrend < factors.historicalAvg * 0.9)
      parts.push('Downward trend — consider reviewing strategy.');

    return parts.join(' ');
  }

  private async saveRecommendations(
    budgetDetailId: string,
    recs: DimensionRecommendation[],
  ) {
    // Validate that budgetDetailId actually exists before saving
    const detail = await this.prisma.budgetDetail.findUnique({
      where: { id: budgetDetailId },
    });
    if (!detail) {
      this.logger.warn(
        `BudgetDetail ${budgetDetailId} not found — skipping save. Recommendations still returned in response.`,
      );
      return;
    }

    await this.prisma.allocationRecommendation.deleteMany({
      where: { budgetDetailId },
    });

    await this.prisma.allocationRecommendation.createMany({
      data: recs.map((r) => ({
        budgetDetailId,
        dimensionType: r.dimensionType,
        dimensionValue: r.dimensionValue,
        recommendedPct: r.recommendedPct,
        recommendedAmt: r.recommendedAmt,
        confidence: r.confidence,
        reasoning: r.reasoning,
        basedOnSeasons: Math.round(r.confidence * 3),
        factors: r.factors,
      })),
    });
  }
}
