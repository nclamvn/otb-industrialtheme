import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClearanceOptimizerService, SKUForOptimization, SKUOptimizationResult } from './clearance-optimizer.service';
import { CreateMarkdownPlanDto } from './dto/create-markdown-plan.dto';
import { OptimizePlanDto, OptimizationResultDto } from './dto/optimize-plan.dto';
import { SimulateScenarioDto, SimulationResultDto, WeeklyProjectionDto } from './dto/simulate-scenario.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ClearanceService {
  private readonly logger = new Logger(ClearanceService.name);

  constructor(
    private prisma: PrismaService,
    private optimizer: ClearanceOptimizerService,
  ) {}

  /**
   * Create a new markdown plan
   */
  async createPlan(dto: CreateMarkdownPlanDto, userId: string) {
    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Create plan with phases
    const plan = await this.prisma.markdownPlan.create({
      data: {
        name: dto.name,
        description: dto.description,
        seasonId: dto.seasonId,
        brandId: dto.brandId,
        startDate,
        endDate,
        targetRecoveryValue: dto.targetRecoveryValue,
        targetSellThroughPct: dto.targetSellThroughPct,
        maxMarkdownPct: dto.maxMarkdownPct || 70,
        createdById: userId,
        phases: dto.phases
          ? {
              create: dto.phases.map((phase) => ({
                phaseNumber: phase.phaseNumber,
                name: phase.name,
                markdownPct: phase.markdownPct,
                startDate: new Date(phase.startDate),
                endDate: new Date(phase.endDate),
                targetSellThroughPct: phase.targetSellThroughPct || 0,
                minDaysAtPrice: phase.minDaysAtPrice || 14,
              })),
            }
          : undefined,
      },
      include: {
        phases: true,
      },
    });

    return plan;
  }

  /**
   * Get all markdown plans
   */
  async getPlans(filters: {
    seasonId?: string;
    brandId?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters.seasonId) where.seasonId = filters.seasonId;
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.status) where.status = filters.status;

    return this.prisma.markdownPlan.findMany({
      where,
      include: {
        phases: true,
        _count: {
          select: { skuPlans: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get plan by ID with details
   */
  async getPlanById(id: string) {
    const plan = await this.prisma.markdownPlan.findUnique({
      where: { id },
      include: {
        phases: {
          orderBy: { phaseNumber: 'asc' },
        },
        skuPlans: {
          orderBy: { urgencyScore: 'desc' },
          take: 100,
        },
        _count: {
          select: { skuPlans: true, results: true },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Markdown plan with ID ${id} not found`);
    }

    return plan;
  }

  /**
   * Get SKUs eligible for clearance
   * This would typically fetch from inventory/sales data
   */
  async getEligibleSKUs(params: {
    seasonId: string;
    brandId?: string;
    minWeeksOnHand?: number;
    maxSellThrough?: number;
  }): Promise<SKUForOptimization[]> {
    // In production, this would query actual inventory data
    // For now, return mock data for demonstration
    const mockSKUs: SKUForOptimization[] = [
      {
        skuId: 'sku-001',
        skuCode: 'JACKET-BLK-M',
        skuName: 'Classic Black Jacket - Medium',
        brandId: params.brandId,
        categoryId: 'cat-outerwear',
        currentStock: 150,
        currentPrice: 199.99,
        originalPrice: 249.99,
        costPrice: 89.99,
        currentStockValue: 29998.5,
        weeksOnHand: 12,
        sellThroughRate: 25,
        weeksToSeasonEnd: 6,
        avgWeeklySales: 12,
      },
      {
        skuId: 'sku-002',
        skuCode: 'DRESS-RED-S',
        skuName: 'Evening Red Dress - Small',
        brandId: params.brandId,
        categoryId: 'cat-dresses',
        currentStock: 80,
        currentPrice: 149.99,
        originalPrice: 189.99,
        costPrice: 55.99,
        currentStockValue: 11999.2,
        weeksOnHand: 8,
        sellThroughRate: 35,
        weeksToSeasonEnd: 6,
        avgWeeklySales: 10,
      },
      {
        skuId: 'sku-003',
        skuCode: 'PANTS-NVY-L',
        skuName: 'Navy Trousers - Large',
        brandId: params.brandId,
        categoryId: 'cat-bottoms',
        currentStock: 200,
        currentPrice: 89.99,
        originalPrice: 119.99,
        costPrice: 35.99,
        currentStockValue: 17998.0,
        weeksOnHand: 16,
        sellThroughRate: 15,
        weeksToSeasonEnd: 6,
        avgWeeklySales: 8,
      },
      {
        skuId: 'sku-004',
        skuCode: 'BLOUSE-WHT-M',
        skuName: 'White Silk Blouse - Medium',
        brandId: params.brandId,
        categoryId: 'cat-tops',
        currentStock: 45,
        currentPrice: 79.99,
        originalPrice: 99.99,
        costPrice: 29.99,
        currentStockValue: 3599.55,
        weeksOnHand: 5,
        sellThroughRate: 55,
        weeksToSeasonEnd: 6,
        avgWeeklySales: 9,
      },
      {
        skuId: 'sku-005',
        skuCode: 'COAT-GRY-XL',
        skuName: 'Grey Winter Coat - XL',
        brandId: params.brandId,
        categoryId: 'cat-outerwear',
        currentStock: 300,
        currentPrice: 299.99,
        originalPrice: 399.99,
        costPrice: 149.99,
        currentStockValue: 89997.0,
        weeksOnHand: 20,
        sellThroughRate: 10,
        weeksToSeasonEnd: 6,
        avgWeeklySales: 5,
      },
    ];

    // Apply filters
    let filtered = mockSKUs;

    if (params.minWeeksOnHand !== undefined) {
      const minWeeks = params.minWeeksOnHand;
      filtered = filtered.filter((s) => s.weeksOnHand >= minWeeks);
    }

    if (params.maxSellThrough !== undefined) {
      const maxSell = params.maxSellThrough;
      filtered = filtered.filter((s) => s.sellThroughRate <= maxSell);
    }

    return filtered;
  }

  /**
   * Optimize a markdown plan
   */
  async optimizePlan(dto: OptimizePlanDto): Promise<OptimizationResultDto> {
    // Get the plan
    const plan = await this.getPlanById(dto.planId);

    // Get eligible SKUs
    const skus = await this.getEligibleSKUs({
      seasonId: plan.seasonId,
      brandId: plan.brandId || undefined,
    });

    // Filter to specific SKUs if provided
    let skusToOptimize = skus;
    if (dto.skuIds && dto.skuIds.length > 0) {
      const skuIds = dto.skuIds;
      skusToOptimize = skus.filter((s) => skuIds.includes(s.skuId));
    }

    // Run optimization
    const optimizationResults = await this.optimizer.optimizeSKUs(
      skusToOptimize,
      {
        strategy: dto.strategy || 'BALANCED',
        maxMarkdownPct: Number(plan.maxMarkdownPct) || 70,
        minMarginPct: dto.minMarginPct || 0,
        analyzeElasticity: dto.analyzeElasticity !== false,
      },
      8,
    );

    // Generate summary
    const summary = this.optimizer.generateSummary(optimizationResults);

    // Calculate totals
    const totalCurrentValue = skusToOptimize.reduce((sum, s) => sum + s.currentStockValue, 0);
    const totalRecovery = optimizationResults.reduce((sum, r) => sum + r.projectedRevenue, 0);
    const totalMarginLoss = optimizationResults.reduce((sum, r) => sum + r.projectedMarginLoss, 0);

    // Update plan with optimization results
    await this.prisma.markdownPlan.update({
      where: { id: dto.planId },
      data: {
        status: 'OPTIMIZED',
        aiOptimizedAt: new Date(),
        aiConfidenceScore: 0.85,
        totalSKUs: optimizationResults.length,
        totalCurrentValue,
        projectedRecovery: totalRecovery,
        projectedMarginLoss: totalMarginLoss,
        aiRecommendations: JSON.parse(JSON.stringify(optimizationResults.slice(0, 10))), // Store top 10 recommendations
      },
    });

    // Create/Update SKU plans
    for (const result of optimizationResults) {
      await this.prisma.markdownSKUPlan.upsert({
        where: {
          planId_skuId: {
            planId: dto.planId,
            skuId: result.skuId,
          },
        },
        create: {
          planId: dto.planId,
          skuId: result.skuId,
          skuCode: result.skuCode,
          skuName: result.skuName,
          currentStock: result.currentStock,
          currentPrice: result.currentPrice,
          originalPrice: result.currentPrice, // Assume current is original for mock
          costPrice: result.costPrice,
          currentStockValue: result.currentStock * result.currentPrice,
          weeksOnHand: 0,
          sellThroughRate: 0,
          weeksToSeasonEnd: 6,
          urgencyScore: result.urgencyScore,
          urgencyLevel: result.urgencyLevel,
          demandElasticity: result.demandElasticity,
          optimalMarkdownPct: result.recommendedMarkdownPct,
          recommendedAction: result.recommendedAction,
          recommendedMarkdownPct: result.recommendedMarkdownPct,
          recommendedNewPrice: result.recommendedNewPrice,
          projectedUnitsSold: result.projectedUnitsSold,
          projectedRevenue: result.projectedRevenue,
          projectedMarginLoss: result.projectedMarginLoss,
          projectedDaysToSell: result.projectedDaysToSell,
        },
        update: {
          urgencyScore: result.urgencyScore,
          urgencyLevel: result.urgencyLevel,
          demandElasticity: result.demandElasticity,
          optimalMarkdownPct: result.recommendedMarkdownPct,
          recommendedAction: result.recommendedAction,
          recommendedMarkdownPct: result.recommendedMarkdownPct,
          recommendedNewPrice: result.recommendedNewPrice,
          projectedUnitsSold: result.projectedUnitsSold,
          projectedRevenue: result.projectedRevenue,
          projectedMarginLoss: result.projectedMarginLoss,
          projectedDaysToSell: result.projectedDaysToSell,
        },
      });
    }

    return {
      planId: dto.planId,
      totalSKUs: optimizationResults.length,
      totalCurrentValue,
      projectedRecovery: totalRecovery,
      projectedMarginLoss: totalMarginLoss,
      projectedSellThrough: summary.expectedOutcome.avgSellThrough,
      confidenceScore: 0.85,
      recommendations: optimizationResults.map((r) => ({
        ...r,
        reasoning: r.reasoning,
      })),
      summary,
    };
  }

  /**
   * Simulate a markdown scenario
   */
  async simulateScenario(dto: SimulateScenarioDto): Promise<SimulationResultDto> {
    const plan = await this.getPlanById(dto.planId);
    const skus = await this.getEligibleSKUs({
      seasonId: plan.seasonId,
      brandId: plan.brandId || undefined,
    });

    const weeksToSimulate = dto.weeksToSimulate || 8;
    const elasticityFactor = dto.elasticityFactor || 1.0;
    const globalMarkdown = dto.globalMarkdownPct || 30;

    // Build SKU markdown map
    const skuMarkdowns: Map<string, number> = new Map();
    if (dto.skuOverrides) {
      for (const override of dto.skuOverrides) {
        skuMarkdowns.set(override.skuId, override.markdownPct);
      }
    }

    // Initialize simulation
    let totalStock = 0;
    let totalValue = 0;
    const weeklyProjections: WeeklyProjectionDto[] = [];

    // Current inventory state
    const inventoryState = skus.map((sku) => {
      const markdown = skuMarkdowns.get(sku.skuId) ?? globalMarkdown;
      const newPrice = sku.currentPrice * (1 - markdown / 100);
      const baseElasticity = 1.5 * elasticityFactor;
      const demandMultiplier = 1 + (markdown / 100) * baseElasticity;
      const weeklyDemand = Math.max(1, Math.round((sku.avgWeeklySales || 5) * demandMultiplier));

      totalStock += sku.currentStock;
      totalValue += sku.currentStockValue;

      return {
        ...sku,
        currentStock: sku.currentStock,
        newPrice,
        weeklyDemand,
        markdown,
      };
    });

    const startingInventoryValue = totalValue;
    let cumulativeRecovery = 0;
    let cumulativeSales = 0;
    const startDate = new Date(plan.startDate);

    // Simulate each week
    for (let week = 1; week <= weeksToSimulate; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (week - 1) * 7);

      let weekOpeningStock = 0;
      let weekOpeningValue = 0;
      let weekSales = 0;
      let weekRevenue = 0;
      let weekClosingStock = 0;
      let weekClosingValue = 0;

      for (const item of inventoryState) {
        weekOpeningStock += item.currentStock;
        weekOpeningValue += item.currentStock * item.newPrice;

        // Calculate sales for this week
        const sales = Math.min(item.currentStock, item.weeklyDemand);
        const revenue = sales * item.newPrice;

        weekSales += sales;
        weekRevenue += revenue;

        // Update stock
        item.currentStock -= sales;
        weekClosingStock += item.currentStock;
        weekClosingValue += item.currentStock * item.newPrice;
      }

      cumulativeRecovery += weekRevenue;
      cumulativeSales += weekSales;

      weeklyProjections.push({
        weekNumber: week,
        weekStartDate: weekStart.toISOString().split('T')[0],
        openingStock: weekOpeningStock,
        openingValue: Math.round(weekOpeningValue * 100) / 100,
        projectedSales: weekSales,
        projectedRevenue: Math.round(weekRevenue * 100) / 100,
        avgSellingPrice:
          weekSales > 0 ? Math.round((weekRevenue / weekSales) * 100) / 100 : 0,
        closingStock: weekClosingStock,
        closingValue: Math.round(weekClosingValue * 100) / 100,
        cumulativeSellThrough:
          totalStock > 0 ? Math.round((cumulativeSales / totalStock) * 10000) / 100 : 0,
        cumulativeRecovery: Math.round(cumulativeRecovery * 100) / 100,
      });
    }

    // Calculate final metrics
    const finalProjection = weeklyProjections[weeklyProjections.length - 1];
    const projectedRecovery = cumulativeRecovery;
    const projectedMarginLoss = startingInventoryValue - projectedRecovery;
    const projectedSellThrough = totalStock > 0 ? (cumulativeSales / totalStock) * 100 : 0;

    // Risk assessment
    const warnings: string[] = [];
    let stockoutRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let marginErosionRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (projectedSellThrough < 50) {
      warnings.push('Sell-through below 50% - consider more aggressive markdowns');
      stockoutRisk = 'LOW';
    } else if (projectedSellThrough > 95) {
      warnings.push('May sell out too quickly - consider phased approach');
      stockoutRisk = 'HIGH';
    }

    if (projectedMarginLoss > startingInventoryValue * 0.5) {
      warnings.push('Significant margin erosion expected (>50%)');
      marginErosionRisk = 'HIGH';
    } else if (projectedMarginLoss > startingInventoryValue * 0.3) {
      marginErosionRisk = 'MEDIUM';
    }

    const overallRisk: 'HIGH' | 'MEDIUM' | 'LOW' =
      marginErosionRisk === 'HIGH' || stockoutRisk === 'HIGH'
        ? 'HIGH'
        : (marginErosionRisk as string) === 'MEDIUM' || (stockoutRisk as string) === 'MEDIUM'
        ? 'MEDIUM'
        : 'LOW';

    return {
      scenarioName: dto.scenarioName || 'Default Scenario',
      planId: dto.planId,
      totalSKUs: skus.length,
      startingInventoryValue: Math.round(startingInventoryValue * 100) / 100,
      projectedRecoveryValue: Math.round(projectedRecovery * 100) / 100,
      projectedMarginLoss: Math.round(projectedMarginLoss * 100) / 100,
      projectedSellThroughPct: Math.round(projectedSellThrough * 100) / 100,
      projectedRemainingStock: finalProjection.closingStock,
      projectedRemainingValue: finalProjection.closingValue,
      weeklyProjections,
      riskAssessment: {
        stockoutRisk,
        marginErosionRisk,
        overallRisk,
        warnings,
      },
    };
  }

  /**
   * Approve a markdown plan
   */
  async approvePlan(planId: string, userId: string) {
    const plan = await this.getPlanById(planId);

    if (plan.status !== 'OPTIMIZED') {
      throw new BadRequestException('Plan must be optimized before approval');
    }

    return this.prisma.markdownPlan.update({
      where: { id: planId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
      },
    });
  }

  /**
   * Activate a markdown plan
   */
  async activatePlan(planId: string) {
    const plan = await this.getPlanById(planId);

    if (plan.status !== 'APPROVED') {
      throw new BadRequestException('Plan must be approved before activation');
    }

    // Activate first phase
    const firstPhase = plan.phases[0];
    if (firstPhase) {
      await this.prisma.markdownPhase.update({
        where: { id: firstPhase.id },
        data: { status: 'ACTIVE' },
      });
    }

    return this.prisma.markdownPlan.update({
      where: { id: planId },
      data: { status: 'ACTIVE' },
    });
  }

  /**
   * Get plan results/performance
   */
  async getPlanResults(planId: string) {
    const plan = await this.getPlanById(planId);

    const results = await this.prisma.markdownResult.findMany({
      where: { planId },
      orderBy: { recordDate: 'asc' },
    });

    // Aggregate results
    const summary = {
      totalUnitsSold: results.reduce((sum, r) => sum + r.unitsSold, 0),
      totalRevenue: results.reduce((sum, r) => sum + Number(r.revenue), 0),
      totalMarginLoss: results.reduce((sum, r) => sum + Number(r.marginLoss), 0),
      avgSellThrough:
        results.length > 0
          ? results.reduce((sum, r) => sum + Number(r.sellThroughActual), 0) / results.length
          : 0,
      weeklyResults: results,
    };

    return {
      plan,
      summary,
    };
  }

  /**
   * Delete a markdown plan
   */
  async deletePlan(planId: string) {
    await this.getPlanById(planId); // Verify exists

    return this.prisma.markdownPlan.delete({
      where: { id: planId },
    });
  }
}
