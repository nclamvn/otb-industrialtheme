import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================================================
// INTERFACES
// ============================================================================

export interface RecommendationInput {
  budgetDetailId: string;
  category: string;
  subCategory?: string;
  budgetAmount: number;
  seasonGroup: string;
  fiscalYear: number;
  storeId?: string;
  brandId?: string;
  excludeSkuIds?: string[];
  maxResults?: number;
}

export interface SkuRecommendationItem {
  skuId: string;
  skuCode: string;
  productName: string;
  category: string;
  subCategory?: string;
  color?: string;
  theme?: string;
  srp: number;
  recommendedQty: number;
  recommendedValue: number;
  confidence: number;
  performanceScore: number;
  trendScore: number;
  assortmentScore: number;
  priceScore: number;
  overallScore: number;
  riskLevel: string;
  reasoning: string;
}

export interface RecommendationResult {
  budgetDetailId: string;
  category: string;
  subCategory?: string;
  budgetAmount: number;
  totalRecommendedValue: number;
  recommendations: SkuRecommendationItem[];
  assortmentSummary: {
    colorCoverage: number;
    priceTierCoverage: number;
    themeCoverage: number;
  };
  warnings: string[];
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class SkuRecommenderService {
  private readonly logger = new Logger(SkuRecommenderService.name);

  private readonly SCORE_WEIGHTS = {
    performance: 0.35,
    trend: 0.25,
    assortment: 0.25,
    price: 0.15,
  };

  private readonly PRICE_TIERS = {
    entry: { min: 0, max: 30_000_000, label: 'Entry' },
    mid: { min: 30_000_000, max: 60_000_000, label: 'Mid' },
    premium: { min: 60_000_000, max: 100_000_000, label: 'Premium' },
    luxury: { min: 100_000_000, max: Infinity, label: 'Luxury' },
  };

  constructor(private prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN: GENERATE RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════

  async generateRecommendations(
    input: RecommendationInput,
  ): Promise<RecommendationResult> {
    this.logger.log(
      `Generating SKU recommendations for budget detail: ${input.budgetDetailId}, category: ${input.category}`,
    );

    const warnings: string[] = [];
    const maxResults = input.maxResults || 20;

    // 1) Get eligible SKUs from catalog
    const eligibleSkus = await this.getEligibleSkus(input);
    if (eligibleSkus.length === 0) {
      warnings.push('No eligible SKUs found for this category.');
      return this.emptyResult(input, warnings);
    }
    this.logger.log(`Found ${eligibleSkus.length} eligible SKUs`);

    // 2) Get historical performance data (last 2 fiscal years)
    const perfMap = await this.getPerformanceMap(
      eligibleSkus.map((s) => s.id),
      input.seasonGroup,
      input.fiscalYear,
    );
    if (perfMap.size === 0) {
      warnings.push(
        'No historical performance data available. Scoring based on catalog attributes only.',
      );
    }

    // 3) Get attribute trends
    const trendMap = await this.getAttributeTrends(
      input.category,
      input.seasonGroup,
      input.fiscalYear,
    );
    if (trendMap.size === 0) {
      warnings.push(
        'No attribute trend data available. Trend score uses defaults.',
      );
    }

    // 4) Analyze assortment gaps
    const gaps = await this.analyzeAssortmentGaps(
      input.budgetDetailId,
      input.category,
      eligibleSkus,
    );

    // 5) Score each SKU on 4 factors
    const scored: SkuRecommendationItem[] = eligibleSkus.map((sku) => {
      const perf = perfMap.get(sku.id);
      const performanceScore = this.calcPerformanceScore(perf);
      const trendScore = this.calcTrendScore(sku, trendMap);
      const assortmentScore = this.calcAssortmentScore(sku, gaps);
      const priceScore = this.calcPriceScore(sku, input.budgetAmount, eligibleSkus.length);
      const overallScore = Math.round(
        performanceScore * this.SCORE_WEIGHTS.performance +
          trendScore * this.SCORE_WEIGHTS.trend +
          assortmentScore * this.SCORE_WEIGHTS.assortment +
          priceScore * this.SCORE_WEIGHTS.price,
      );

      const riskLevel = this.calcRiskLevel(perf, performanceScore);
      const reasoning = this.buildReasoning(
        sku,
        performanceScore,
        trendScore,
        assortmentScore,
        priceScore,
        riskLevel,
        perf,
      );

      return {
        skuId: sku.id,
        skuCode: sku.skuCode,
        productName: sku.productName,
        category: sku.productType,
        subCategory: sku.theme || undefined,
        color: sku.color || undefined,
        theme: sku.theme || undefined,
        srp: Number(sku.srp),
        recommendedQty: 0, // calculated after selection
        recommendedValue: 0,
        confidence: 0,
        performanceScore,
        trendScore,
        assortmentScore,
        priceScore,
        overallScore,
        riskLevel,
        reasoning,
      };
    });

    // 6) Select top SKUs within budget
    scored.sort((a, b) => b.overallScore - a.overallScore);
    const selected = this.selectWithinBudget(
      scored.slice(0, maxResults * 2), // consider more than we need for budget fitting
      input.budgetAmount,
      maxResults,
    );

    // 7) Calculate recommended quantities
    this.assignQuantities(selected, input.budgetAmount);

    // 8) Save to SkuRecommendation table
    await this.saveRecommendations(input, selected);

    // Build assortment summary
    const colors = new Set(selected.filter((s) => s.color).map((s) => s.color));
    const themes = new Set(selected.filter((s) => s.theme).map((s) => s.theme));
    const priceTiers = new Set(
      selected.map((s) => this.getPriceTier(s.srp)),
    );

    const totalRecommendedValue = selected.reduce(
      (sum, s) => sum + s.recommendedValue,
      0,
    );

    return {
      budgetDetailId: input.budgetDetailId,
      category: input.category,
      subCategory: input.subCategory,
      budgetAmount: input.budgetAmount,
      totalRecommendedValue,
      recommendations: selected,
      assortmentSummary: {
        colorCoverage: colors.size,
        priceTierCoverage: priceTiers.size,
        themeCoverage: themes.size,
      },
      warnings,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DATA ACCESS HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  async getRecommendations(budgetDetailId: string, category?: string) {
    const where: any = { budgetDetailId };
    if (category) where.category = category;

    return this.prisma.skuRecommendation.findMany({
      where,
      orderBy: { overallScore: 'desc' },
      include: { sku: true },
    });
  }

  async updateRecommendationStatus(
    recommendationId: string,
    status: 'selected' | 'rejected',
  ) {
    return this.prisma.skuRecommendation.update({
      where: { id: recommendationId },
      data: {
        isSelected: status === 'selected',
        isRejected: status === 'rejected',
      },
    });
  }

  async addSelectedToProposal(
    budgetDetailId: string,
    proposalId: string,
  ): Promise<number> {
    const selected = await this.prisma.skuRecommendation.findMany({
      where: { budgetDetailId, isSelected: true },
      include: { sku: true },
    });

    if (selected.length === 0) return 0;

    // Get existing product sort order
    const existingProducts = await this.prisma.proposalProduct.findMany({
      where: { proposalId },
      orderBy: { sortOrder: 'desc' },
      take: 1,
    });
    let nextSort = (existingProducts[0]?.sortOrder || 0) + 1;

    const data = selected.map((rec) => {
      const item = {
        proposalId,
        skuId: rec.skuId,
        skuCode: rec.skuCode,
        productName: rec.productName,
        category: rec.category,
        subCategory: rec.subCategory,
        color: rec.sku.color,
        theme: rec.sku.theme,
        composition: rec.sku.composition,
        srp: rec.sku.srp,
        unitCost: 0,
        orderQty: rec.recommendedQty,
        totalValue: rec.recommendedValue,
        sortOrder: nextSort++,
      };
      return item;
    });

    await this.prisma.proposalProduct.createMany({ data });

    // Update proposal totals
    const allProducts = await this.prisma.proposalProduct.findMany({
      where: { proposalId },
    });
    const totalSkuCount = allProducts.length;
    const totalOrderQty = allProducts.reduce(
      (sum, p) => sum + p.orderQty,
      0,
    );
    const totalValue = allProducts.reduce(
      (sum, p) => sum + Number(p.totalValue),
      0,
    );

    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { totalSkuCount, totalOrderQty, totalValue },
    });

    return selected.length;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE: DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════

  private async getEligibleSkus(input: RecommendationInput) {
    const where: any = {
      isActive: true,
      productType: { contains: input.category, mode: 'insensitive' },
    };

    if (input.brandId) {
      where.brandId = input.brandId;
    }

    if (input.excludeSkuIds && input.excludeSkuIds.length > 0) {
      where.id = { notIn: input.excludeSkuIds };
    }

    return this.prisma.skuCatalog.findMany({
      where,
      orderBy: { skuCode: 'asc' },
    });
  }

  private async getPerformanceMap(
    skuIds: string[],
    seasonGroup: string,
    currentFiscalYear: number,
  ): Promise<Map<string, any>> {
    const performances = await this.prisma.skuPerformance.findMany({
      where: {
        skuId: { in: skuIds },
        seasonGroup,
        fiscalYear: { gte: currentFiscalYear - 2 },
      },
      orderBy: { fiscalYear: 'desc' },
    });

    // Group by skuId, keep most recent + aggregate
    const map = new Map<string, any>();
    for (const perf of performances) {
      if (!map.has(perf.skuId)) {
        map.set(perf.skuId, {
          latestPerformanceScore: perf.performanceScore,
          latestVelocityScore: perf.velocityScore,
          latestMarginScore: perf.marginScore,
          avgSellThrough: Number(perf.sellThroughPct),
          avgGrossMargin: Number(perf.grossMarginPct),
          avgMarkdown: Number(perf.markdownPct),
          totalRevenue: Number(perf.totalRevenue),
          seasonsCount: 1,
          weeksToSellThru: perf.weeksToSellThru,
        });
      } else {
        const existing = map.get(perf.skuId);
        existing.seasonsCount++;
        existing.avgSellThrough =
          (existing.avgSellThrough * (existing.seasonsCount - 1) +
            Number(perf.sellThroughPct)) /
          existing.seasonsCount;
        existing.avgGrossMargin =
          (existing.avgGrossMargin * (existing.seasonsCount - 1) +
            Number(perf.grossMarginPct)) /
          existing.seasonsCount;
        existing.avgMarkdown =
          (existing.avgMarkdown * (existing.seasonsCount - 1) +
            Number(perf.markdownPct)) /
          existing.seasonsCount;
        existing.totalRevenue += Number(perf.totalRevenue);
      }
    }

    return map;
  }

  private async getAttributeTrends(
    category: string,
    seasonGroup: string,
    currentFiscalYear: number,
  ): Promise<Map<string, any>> {
    const trends = await this.prisma.attributeTrend.findMany({
      where: {
        seasonGroup,
        fiscalYear: { gte: currentFiscalYear - 2 },
        OR: [
          { category: { contains: category, mode: 'insensitive' } },
          { category: null },
        ],
      },
      orderBy: { fiscalYear: 'desc' },
    });

    // Key: "attributeType:attributeValue" -> trend data
    const map = new Map<string, any>();
    for (const trend of trends) {
      const key = `${trend.attributeType}:${trend.attributeValue}`;
      if (!map.has(key)) {
        map.set(key, {
          trendScore: trend.trendScore,
          avgSellThrough: Number(trend.avgSellThrough),
          avgMargin: Number(trend.avgMargin),
          yoyGrowth: trend.yoyGrowth ? Number(trend.yoyGrowth) : null,
          totalSkus: trend.totalSkus,
        });
      }
    }

    return map;
  }

  private async analyzeAssortmentGaps(
    budgetDetailId: string,
    category: string,
    eligibleSkus: any[],
  ): Promise<{
    missingColors: Set<string>;
    missingThemes: Set<string>;
    missingPriceTiers: Set<string>;
    existingColors: Set<string>;
    existingThemes: Set<string>;
    existingPriceTiers: Set<string>;
  }> {
    // Get already-selected / existing products in proposals for this budget detail
    let existingProducts: any[] = [];
    try {
      // Check if we can query proposal products through budget detail
      const budgetDetail = await this.prisma.budgetDetail.findUnique({
        where: { id: budgetDetailId },
        include: {
          budget: {
            include: {
              proposals: {
                include: {
                  products: true,
                },
              },
            },
          },
        },
      });

      if (budgetDetail?.budget?.proposals) {
        for (const proposal of budgetDetail.budget.proposals) {
          existingProducts.push(...(proposal.products || []));
        }
      }
    } catch {
      this.logger.debug('Could not fetch existing proposal products for assortment analysis');
    }

    // Existing assortment attributes
    const existingColors = new Set<string>();
    const existingThemes = new Set<string>();
    const existingPriceTiers = new Set<string>();

    for (const product of existingProducts) {
      if (product.color) existingColors.add(product.color.toLowerCase());
      if (product.theme) existingThemes.add(product.theme.toLowerCase());
      const srp = Number(product.srp || 0);
      if (srp > 0) existingPriceTiers.add(this.getPriceTier(srp));
    }

    // All possible attributes from eligible SKUs
    const allColors = new Set<string>();
    const allThemes = new Set<string>();
    const allPriceTiers = new Set<string>();

    for (const sku of eligibleSkus) {
      if (sku.color) allColors.add(sku.color.toLowerCase());
      if (sku.theme) allThemes.add(sku.theme.toLowerCase());
      const srp = Number(sku.srp);
      if (srp > 0) allPriceTiers.add(this.getPriceTier(srp));
    }

    // Missing = available but not yet in assortment
    const missingColors = new Set<string>();
    for (const c of allColors) {
      if (!existingColors.has(c)) missingColors.add(c);
    }

    const missingThemes = new Set<string>();
    for (const t of allThemes) {
      if (!existingThemes.has(t)) missingThemes.add(t);
    }

    const missingPriceTiers = new Set<string>();
    for (const p of allPriceTiers) {
      if (!existingPriceTiers.has(p)) missingPriceTiers.add(p);
    }

    return {
      missingColors,
      missingThemes,
      missingPriceTiers,
      existingColors,
      existingThemes,
      existingPriceTiers,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE: SCORING
  // ═══════════════════════════════════════════════════════════════════════

  private calcPerformanceScore(perf: any | undefined): number {
    if (!perf) return 40; // new item with no history gets a baseline

    // Weighted combination of historical scores
    const sellThroughComponent = Math.min(perf.avgSellThrough, 100) * 0.4;
    const marginComponent = Math.min(perf.avgGrossMargin, 100) * 0.3;
    const velocityComponent = Math.min(perf.latestVelocityScore, 100) * 0.3;

    return Math.round(
      sellThroughComponent + marginComponent + velocityComponent,
    );
  }

  private calcTrendScore(sku: any, trendMap: Map<string, any>): number {
    let score = 50; // default neutral
    let factors = 0;
    let totalScore = 0;

    // Check color trend
    if (sku.color) {
      const colorTrend = trendMap.get(`color:${sku.color.toLowerCase()}`);
      if (colorTrend) {
        totalScore += colorTrend.trendScore;
        factors++;
      }
    }

    // Check theme trend
    if (sku.theme) {
      const themeTrend = trendMap.get(`theme:${sku.theme.toLowerCase()}`);
      if (themeTrend) {
        totalScore += themeTrend.trendScore;
        factors++;
      }
    }

    // Check product type trend
    const typeTrend = trendMap.get(
      `productType:${sku.productType.toLowerCase()}`,
    );
    if (typeTrend) {
      totalScore += typeTrend.trendScore;
      factors++;
    }

    if (factors > 0) {
      score = Math.round(totalScore / factors);
    }

    return Math.min(Math.max(score, 0), 100);
  }

  private calcAssortmentScore(
    sku: any,
    gaps: {
      missingColors: Set<string>;
      missingThemes: Set<string>;
      missingPriceTiers: Set<string>;
      existingColors: Set<string>;
      existingThemes: Set<string>;
      existingPriceTiers: Set<string>;
    },
  ): number {
    let score = 50; // neutral baseline
    let bonusPoints = 0;

    // Bonus for filling a color gap
    if (sku.color && gaps.missingColors.has(sku.color.toLowerCase())) {
      bonusPoints += 25;
    }

    // Bonus for filling a theme gap
    if (sku.theme && gaps.missingThemes.has(sku.theme.toLowerCase())) {
      bonusPoints += 15;
    }

    // Bonus for filling a price tier gap
    const srp = Number(sku.srp);
    if (srp > 0) {
      const tier = this.getPriceTier(srp);
      if (gaps.missingPriceTiers.has(tier)) {
        bonusPoints += 20;
      }
    }

    // Penalty if attributes already heavily represented
    if (
      sku.color &&
      gaps.existingColors.has(sku.color.toLowerCase()) &&
      gaps.existingColors.size > 3
    ) {
      bonusPoints -= 10;
    }

    score += bonusPoints;
    return Math.min(Math.max(score, 0), 100);
  }

  private calcPriceScore(
    sku: any,
    budgetAmount: number,
    totalEligible: number,
  ): number {
    const srp = Number(sku.srp);
    if (srp <= 0) return 30;

    // Ideal average price per SKU (rough estimate)
    const estimatedSkuCount = Math.max(Math.min(totalEligible, 20), 5);
    const idealAvgPrice = budgetAmount / estimatedSkuCount;

    // Score based on how close the SKU price is to the ideal
    const ratio = srp / idealAvgPrice;

    if (ratio >= 0.5 && ratio <= 1.5) {
      return 80; // good fit
    } else if (ratio >= 0.3 && ratio <= 2.0) {
      return 60; // acceptable
    } else if (ratio < 0.3) {
      return 40; // too cheap relative to budget
    } else {
      return 35; // too expensive relative to budget
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE: RISK, SELECTION, QUANTITY
  // ═══════════════════════════════════════════════════════════════════════

  private calcRiskLevel(perf: any | undefined, performanceScore: number): string {
    if (!perf) return 'high'; // new item, no history
    if (performanceScore >= 70 || perf.seasonsCount >= 2) return 'safe';
    if (performanceScore >= 50 || perf.seasonsCount >= 1) return 'moderate';
    return 'high';
  }

  private selectWithinBudget(
    scored: SkuRecommendationItem[],
    budgetAmount: number,
    maxResults: number,
  ): SkuRecommendationItem[] {
    const selected: SkuRecommendationItem[] = [];
    let runningTotal = 0;

    for (const item of scored) {
      if (selected.length >= maxResults) break;
      // Estimate minimum value for this SKU (at least 1 unit)
      const minValue = item.srp;
      if (runningTotal + minValue <= budgetAmount) {
        selected.push(item);
        runningTotal += minValue;
      }
    }

    // If we couldn't select any, take the top items anyway (at least 1)
    if (selected.length === 0 && scored.length > 0) {
      selected.push(scored[0]);
    }

    return selected;
  }

  private assignQuantities(
    selected: SkuRecommendationItem[],
    budgetAmount: number,
  ): void {
    if (selected.length === 0) return;

    // Distribute budget proportional to overall score
    const totalScore = selected.reduce((sum, s) => sum + s.overallScore, 0);
    if (totalScore === 0) {
      // Equal distribution
      const perSku = budgetAmount / selected.length;
      for (const item of selected) {
        if (item.srp > 0) {
          item.recommendedQty = Math.max(1, Math.round(perSku / item.srp));
          item.recommendedValue = item.recommendedQty * item.srp;
        } else {
          item.recommendedQty = 1;
          item.recommendedValue = 0;
        }
        item.confidence = 0.5;
      }
      return;
    }

    for (const item of selected) {
      const share = item.overallScore / totalScore;
      const allocatedBudget = budgetAmount * share;

      if (item.srp > 0) {
        item.recommendedQty = Math.max(1, Math.round(allocatedBudget / item.srp));
        item.recommendedValue = item.recommendedQty * item.srp;
      } else {
        item.recommendedQty = 1;
        item.recommendedValue = 0;
      }

      // Confidence based on risk level and score
      if (item.riskLevel === 'safe') {
        item.confidence = Math.min(0.95, 0.7 + (item.overallScore / 100) * 0.25);
      } else if (item.riskLevel === 'moderate') {
        item.confidence = Math.min(0.8, 0.5 + (item.overallScore / 100) * 0.3);
      } else {
        item.confidence = Math.min(0.65, 0.3 + (item.overallScore / 100) * 0.35);
      }

      item.confidence = Math.round(item.confidence * 100) / 100;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE: REASONING
  // ═══════════════════════════════════════════════════════════════════════

  private buildReasoning(
    sku: any,
    performanceScore: number,
    trendScore: number,
    assortmentScore: number,
    priceScore: number,
    riskLevel: string,
    perf: any | undefined,
  ): string {
    const parts: string[] = [];

    // Performance
    if (perf) {
      if (performanceScore >= 70) {
        parts.push(
          `Strong performer (sell-through: ${perf.avgSellThrough.toFixed(1)}%, margin: ${perf.avgGrossMargin.toFixed(1)}%).`,
        );
      } else if (performanceScore >= 50) {
        parts.push(
          `Moderate performer (sell-through: ${perf.avgSellThrough.toFixed(1)}%).`,
        );
      } else {
        parts.push('Below-average historical performance.');
      }
      parts.push(`Based on ${perf.seasonsCount} season(s) of data.`);
    } else {
      parts.push('New item with no historical performance data.');
    }

    // Trend
    if (trendScore >= 70) {
      parts.push('Attributes align with current positive trends.');
    } else if (trendScore <= 30) {
      parts.push('Attributes show declining trend signals.');
    }

    // Assortment
    if (assortmentScore >= 70) {
      parts.push('Fills gaps in current assortment mix.');
    } else if (assortmentScore <= 30) {
      parts.push('Overlaps with existing assortment selections.');
    }

    // Price
    if (priceScore >= 70) {
      parts.push('Price point well-suited for budget allocation.');
    } else if (priceScore <= 40) {
      parts.push('Price point may not align with budget balance.');
    }

    // Risk
    if (riskLevel === 'safe') {
      parts.push('Low risk — proven track record.');
    } else if (riskLevel === 'moderate') {
      parts.push('Moderate risk — limited history.');
    } else {
      parts.push('Higher risk — new or unproven item.');
    }

    return parts.join(' ');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE: PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════

  private async saveRecommendations(
    input: RecommendationInput,
    items: SkuRecommendationItem[],
  ): Promise<void> {
    // Delete previous recommendations for same budget detail + category
    await this.prisma.skuRecommendation.deleteMany({
      where: {
        budgetDetailId: input.budgetDetailId,
        category: input.category,
      },
    });

    if (items.length === 0) return;

    await this.prisma.skuRecommendation.createMany({
      data: items.map((item) => ({
        budgetDetailId: input.budgetDetailId,
        category: item.category,
        subCategory: item.subCategory || null,
        skuId: item.skuId,
        skuCode: item.skuCode,
        productName: item.productName,
        recommendedQty: item.recommendedQty,
        recommendedValue: item.recommendedValue,
        confidence: item.confidence,
        performanceScore: item.performanceScore,
        trendScore: item.trendScore,
        assortmentScore: item.assortmentScore,
        priceScore: item.priceScore,
        overallScore: item.overallScore,
        riskLevel: item.riskLevel,
        reasoning: item.reasoning,
      })),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE: UTILITIES
  // ═══════════════════════════════════════════════════════════════════════

  private getPriceTier(srp: number): string {
    if (srp < this.PRICE_TIERS.entry.max) return 'entry';
    if (srp < this.PRICE_TIERS.mid.max) return 'mid';
    if (srp < this.PRICE_TIERS.premium.max) return 'premium';
    return 'luxury';
  }

  private emptyResult(
    input: RecommendationInput,
    warnings: string[],
  ): RecommendationResult {
    return {
      budgetDetailId: input.budgetDetailId,
      category: input.category,
      subCategory: input.subCategory,
      budgetAmount: input.budgetAmount,
      totalRecommendedValue: 0,
      recommendations: [],
      assortmentSummary: {
        colorCoverage: 0,
        priceTierCoverage: 0,
        themeCoverage: 0,
      },
      warnings,
    };
  }
}
