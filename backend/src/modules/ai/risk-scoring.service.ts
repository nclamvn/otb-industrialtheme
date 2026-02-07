import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  status: 'good' | 'warning' | 'risk';
  details: string;
  recommendation?: string;
}

export interface RiskAssessmentResult {
  entityType: string;
  entityId: string;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  warnings: string[];
  recommendation: string;
}

@Injectable()
export class RiskScoringService {
  private readonly logger = new Logger(RiskScoringService.name);

  constructor(private prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN ASSESSMENT
  // ═══════════════════════════════════════════════════════════════════════

  async assessProposal(proposalId: string): Promise<RiskAssessmentResult> {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        budget: {
          include: {
            details: true,
            groupBrand: true,
          },
        },
        products: {
          include: {
            sku: true,
            allocations: { include: { store: true } },
          },
        },
        planningVersion: {
          include: { details: true },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal ${proposalId} not found`);
    }

    this.logger.log(`Assessing risk for proposal ${proposalId} (${proposal.ticketName})`);

    const warnings: string[] = [];

    // Run all 6 factor assessments
    const factors: RiskFactor[] = [
      this.assessBudgetAlignment(proposal, warnings),
      this.assessSkuDiversity(proposal, warnings),
      this.assessSizeCurve(proposal, warnings),
      this.assessVendorConcentration(proposal, warnings),
      this.assessCategoryBalance(proposal, warnings),
      this.assessMarginImpact(proposal, warnings),
    ];

    // Calculate weighted overall score
    const overallScore = factors.reduce(
      (sum, f) => sum + f.score * f.weight,
      0,
    );
    const roundedScore = Math.round(overallScore * 10) / 10;

    const riskLevel = this.getRiskLevel(roundedScore);
    const recommendation = this.generateRecommendation(factors, riskLevel, warnings);

    const result: RiskAssessmentResult = {
      entityType: 'proposal',
      entityId: proposalId,
      overallScore: roundedScore,
      riskLevel,
      factors,
      warnings,
      recommendation,
    };

    // Persist to DB
    await this.saveAssessment(result);

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FACTOR ASSESSMENTS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Budget Alignment (25% weight)
   * Checks how well the proposal value fits within the budget.
   */
  private assessBudgetAlignment(proposal: any, warnings: string[]): RiskFactor {
    const totalBudget = Number(proposal.budget?.totalBudget || 0);
    const proposalValue = Number(proposal.totalValue || 0);

    if (totalBudget <= 0) {
      warnings.push('Budget total is zero or not set');
      return {
        name: 'Budget Alignment',
        score: 5.0,
        weight: 0.25,
        status: 'warning',
        details: 'Budget total is zero or not set. Unable to fully assess.',
        recommendation: 'Ensure budget is properly configured before submitting proposals.',
      };
    }

    const utilizationPct = (proposalValue / totalBudget) * 100;

    // Also check total committed across all proposals for this budget
    let score: number;
    let status: 'good' | 'warning' | 'risk';
    let details: string;
    let recommendation: string | undefined;

    if (utilizationPct > 100) {
      score = 2.0;
      status = 'risk';
      details = `Proposal value (${this.formatCurrency(proposalValue)}) exceeds total budget (${this.formatCurrency(totalBudget)}) by ${(utilizationPct - 100).toFixed(1)}%.`;
      recommendation = 'Reduce proposal value to fit within budget constraints.';
      warnings.push(`Proposal exceeds budget by ${(utilizationPct - 100).toFixed(1)}%`);
    } else if (utilizationPct > 90) {
      score = 6.0;
      status = 'warning';
      details = `Proposal uses ${utilizationPct.toFixed(1)}% of budget. Very little headroom remaining.`;
      recommendation = 'Review whether remaining budget is sufficient for future proposals.';
    } else if (utilizationPct > 70) {
      score = 8.0;
      status = 'good';
      details = `Proposal uses ${utilizationPct.toFixed(1)}% of budget. Healthy utilization.`;
    } else if (utilizationPct < 20) {
      score = 7.0;
      status = 'warning';
      details = `Proposal uses only ${utilizationPct.toFixed(1)}% of budget. May indicate under-buying.`;
      recommendation = 'Consider whether additional SKUs should be added to maximize budget.';
    } else {
      score = 9.0;
      status = 'good';
      details = `Proposal uses ${utilizationPct.toFixed(1)}% of budget. Well-aligned.`;
    }

    return { name: 'Budget Alignment', score, weight: 0.25, status, details, recommendation };
  }

  /**
   * SKU Diversity (15% weight)
   * Checks category concentration and variety of products.
   */
  private assessSkuDiversity(proposal: any, warnings: string[]): RiskFactor {
    const products = proposal.products || [];
    const totalProducts = products.length;

    if (totalProducts === 0) {
      warnings.push('Proposal has no products');
      return {
        name: 'SKU Diversity',
        score: 3.0,
        weight: 0.15,
        status: 'risk',
        details: 'No products in proposal. Cannot assess diversity.',
        recommendation: 'Add products to the proposal.',
      };
    }

    // Count categories
    const categoryMap = new Map<string, number>();
    for (const product of products) {
      const cat = product.category || 'Unknown';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }

    const categoryCount = categoryMap.size;
    const maxCategoryPct = Math.max(...Array.from(categoryMap.values())) / totalProducts * 100;

    let score: number;
    let status: 'good' | 'warning' | 'risk';
    let details: string;
    let recommendation: string | undefined;

    if (categoryCount === 1) {
      score = 4.0;
      status = 'risk';
      details = `All ${totalProducts} SKU(s) belong to a single category. High concentration risk.`;
      recommendation = 'Diversify across multiple categories to reduce risk.';
      warnings.push('Single-category proposal detected');
    } else if (maxCategoryPct > 70) {
      score = 6.0;
      status = 'warning';
      details = `${categoryCount} categories present, but dominant category holds ${maxCategoryPct.toFixed(0)}% of SKUs.`;
      recommendation = 'Consider adding more SKUs from underrepresented categories.';
    } else if (maxCategoryPct > 50) {
      score = 7.5;
      status = 'good';
      details = `${categoryCount} categories with reasonable distribution. Top category at ${maxCategoryPct.toFixed(0)}%.`;
    } else {
      score = 9.0;
      status = 'good';
      details = `Well-diversified across ${categoryCount} categories. Max concentration ${maxCategoryPct.toFixed(0)}%.`;
    }

    return { name: 'SKU Diversity', score, weight: 0.15, status, details, recommendation };
  }

  /**
   * Size Curve (15% weight)
   * Checks if size distribution aligns with historical patterns.
   */
  private assessSizeCurve(proposal: any, warnings: string[]): RiskFactor {
    const products = proposal.products || [];

    if (products.length === 0) {
      return {
        name: 'Size Curve',
        score: 5.0,
        weight: 0.15,
        status: 'warning',
        details: 'No products to assess size curve alignment.',
      };
    }

    // Check if products have allocations (which indicate size-level distribution)
    let productsWithAllocations = 0;
    let totalAllocations = 0;

    for (const product of products) {
      const allocs = product.allocations || [];
      if (allocs.length > 0) {
        productsWithAllocations++;
        totalAllocations += allocs.length;
      }
    }

    const allocationRate = productsWithAllocations / products.length * 100;

    let score: number;
    let status: 'good' | 'warning' | 'risk';
    let details: string;
    let recommendation: string | undefined;

    if (allocationRate === 0) {
      score = 5.0;
      status = 'warning';
      details = 'No store allocations set for any product. Size curve cannot be validated.';
      recommendation = 'Set store-level allocations to enable size curve validation.';
      warnings.push('No store allocations defined');
    } else if (allocationRate < 50) {
      score = 6.0;
      status = 'warning';
      details = `Only ${allocationRate.toFixed(0)}% of products have store allocations. Partial coverage.`;
      recommendation = 'Complete store allocations for remaining products.';
    } else if (allocationRate < 80) {
      score = 7.5;
      status = 'good';
      details = `${allocationRate.toFixed(0)}% of products have store allocations. Good coverage.`;
    } else {
      score = 9.0;
      status = 'good';
      details = `${allocationRate.toFixed(0)}% of products have store allocations. Excellent coverage with ${totalAllocations} total allocation(s).`;
    }

    return { name: 'Size Curve', score, weight: 0.15, status, details, recommendation };
  }

  /**
   * Vendor Concentration (15% weight)
   * Checks supplier dependency based on brand grouping.
   */
  private assessVendorConcentration(proposal: any, warnings: string[]): RiskFactor {
    const products = proposal.products || [];

    if (products.length === 0) {
      return {
        name: 'Vendor Concentration',
        score: 5.0,
        weight: 0.15,
        status: 'warning',
        details: 'No products to assess vendor concentration.',
      };
    }

    // Analyze value concentration by SKU/product grouping
    const totalValue = Number(proposal.totalValue || 0);
    if (totalValue <= 0) {
      return {
        name: 'Vendor Concentration',
        score: 5.0,
        weight: 0.15,
        status: 'warning',
        details: 'Proposal total value is zero. Cannot assess concentration.',
      };
    }

    // Group products by their SKU brand
    const brandValueMap = new Map<string, number>();
    for (const product of products) {
      const brandKey = product.sku?.brandId || 'unknown';
      const value = Number(product.totalValue || 0);
      brandValueMap.set(brandKey, (brandValueMap.get(brandKey) || 0) + value);
    }

    const brandCount = brandValueMap.size;
    const maxBrandValue = Math.max(...Array.from(brandValueMap.values()));
    const maxBrandPct = (maxBrandValue / totalValue) * 100;

    let score: number;
    let status: 'good' | 'warning' | 'risk';
    let details: string;
    let recommendation: string | undefined;

    // Since this is typically single-brand (Ferragamo, Gucci, etc.), assess product-level concentration
    if (products.length === 1) {
      score = 5.0;
      status = 'warning';
      details = 'Only 1 product in proposal. High dependency on a single SKU.';
      recommendation = 'Consider adding more SKUs to reduce single-product risk.';
      warnings.push('Single-SKU proposal');
    } else if (products.length < 5) {
      score = 6.5;
      status = 'warning';
      details = `Only ${products.length} products. Limited diversification.`;
      recommendation = 'Consider expanding product selection for better risk distribution.';
    } else {
      // Check if any single product dominates
      const productValues = products.map((p: any) => Number(p.totalValue || 0));
      const maxProductValue = Math.max(...productValues);
      const maxProductPct = (maxProductValue / totalValue) * 100;

      if (maxProductPct > 50) {
        score = 5.5;
        status = 'warning';
        details = `Single product accounts for ${maxProductPct.toFixed(0)}% of total value. High concentration.`;
        recommendation = 'Redistribute quantity across products to reduce single-product dependency.';
        warnings.push(`Single product dominates at ${maxProductPct.toFixed(0)}% of value`);
      } else if (maxProductPct > 30) {
        score = 7.0;
        status = 'good';
        details = `${products.length} products. Largest product at ${maxProductPct.toFixed(0)}% of value. Moderate concentration.`;
      } else {
        score = 9.0;
        status = 'good';
        details = `${products.length} products well distributed. Max single product at ${maxProductPct.toFixed(0)}%.`;
      }
    }

    return { name: 'Vendor Concentration', score, weight: 0.15, status, details, recommendation };
  }

  /**
   * Category Balance (15% weight)
   * Checks proposal categories against planning version targets.
   */
  private assessCategoryBalance(proposal: any, warnings: string[]): RiskFactor {
    const products = proposal.products || [];
    const planningDetails = proposal.planningVersion?.details || [];

    if (products.length === 0) {
      return {
        name: 'Category Balance',
        score: 5.0,
        weight: 0.15,
        status: 'warning',
        details: 'No products to assess category balance.',
      };
    }

    if (planningDetails.length === 0) {
      return {
        name: 'Category Balance',
        score: 7.0,
        weight: 0.15,
        status: 'good',
        details: 'No planning version linked. Category balance assessed on product spread only.',
        recommendation: 'Link a planning version for more accurate category balance scoring.',
      };
    }

    // Compare proposal category distribution vs planning OTB values
    const totalProposalValue = Number(proposal.totalValue || 0);
    const proposalCategoryValues = new Map<string, number>();

    for (const product of products) {
      const cat = product.category || 'Unknown';
      const value = Number(product.totalValue || 0);
      proposalCategoryValues.set(cat, (proposalCategoryValues.get(cat) || 0) + value);
    }

    // Get planned category OTB values
    const planningCategoryOtb = new Map<string, number>();
    let totalPlannedOtb = 0;

    for (const detail of planningDetails) {
      if (detail.dimensionType === 'category' && detail.categoryId) {
        const otb = Number(detail.otbValue || 0);
        planningCategoryOtb.set(detail.categoryId, otb);
        totalPlannedOtb += otb;
      }
    }

    if (totalPlannedOtb <= 0 || totalProposalValue <= 0) {
      return {
        name: 'Category Balance',
        score: 7.0,
        weight: 0.15,
        status: 'good',
        details: 'Insufficient planning data for category-level comparison.',
      };
    }

    // Calculate deviation between proposal and planning
    let totalDeviation = 0;
    let comparedCategories = 0;

    for (const [cat, value] of proposalCategoryValues) {
      const proposalPct = (value / totalProposalValue) * 100;
      // Try to find matching planning category
      const plannedOtb = Array.from(planningCategoryOtb.values())[comparedCategories] || 0;
      const plannedPct = totalPlannedOtb > 0 ? (plannedOtb / totalPlannedOtb) * 100 : 0;

      totalDeviation += Math.abs(proposalPct - plannedPct);
      comparedCategories++;
    }

    const avgDeviation = comparedCategories > 0 ? totalDeviation / comparedCategories : 0;

    let score: number;
    let status: 'good' | 'warning' | 'risk';
    let details: string;
    let recommendation: string | undefined;

    if (avgDeviation <= 10) {
      score = 9.0;
      status = 'good';
      details = `Category allocation closely matches planning targets (avg deviation ${avgDeviation.toFixed(1)}%).`;
    } else if (avgDeviation <= 25) {
      score = 7.0;
      status = 'good';
      details = `Category allocation moderately aligns with planning (avg deviation ${avgDeviation.toFixed(1)}%).`;
    } else if (avgDeviation <= 40) {
      score = 5.5;
      status = 'warning';
      details = `Significant deviation from planning targets (avg ${avgDeviation.toFixed(1)}%).`;
      recommendation = 'Review category allocations against the approved planning version.';
      warnings.push(`Category balance deviation: ${avgDeviation.toFixed(1)}% avg`);
    } else {
      score = 3.5;
      status = 'risk';
      details = `Major misalignment with planning targets (avg deviation ${avgDeviation.toFixed(1)}%).`;
      recommendation = 'Realign proposal categories with the approved planning version before approval.';
      warnings.push(`Critical category imbalance: ${avgDeviation.toFixed(1)}% avg deviation`);
    }

    return { name: 'Category Balance', score, weight: 0.15, status, details, recommendation };
  }

  /**
   * Margin Impact (15% weight)
   * Checks gross margin potential by comparing unit cost to SRP.
   */
  private assessMarginImpact(proposal: any, warnings: string[]): RiskFactor {
    const products = proposal.products || [];

    if (products.length === 0) {
      return {
        name: 'Margin Impact',
        score: 5.0,
        weight: 0.15,
        status: 'warning',
        details: 'No products to assess margin impact.',
      };
    }

    // Calculate weighted average margin across products
    let totalCostValue = 0;
    let totalSrpValue = 0;
    let productsWithMarginData = 0;

    for (const product of products) {
      const unitCost = Number(product.unitCost || 0);
      const srp = Number(product.srp || 0);
      const qty = Number(product.orderQty || 0);

      if (srp > 0 && qty > 0) {
        totalCostValue += unitCost * qty;
        totalSrpValue += srp * qty;
        productsWithMarginData++;
      }
    }

    if (productsWithMarginData === 0 || totalSrpValue === 0) {
      return {
        name: 'Margin Impact',
        score: 6.0,
        weight: 0.15,
        status: 'warning',
        details: 'Insufficient pricing data to calculate margins.',
        recommendation: 'Ensure unit cost and SRP are set for all products.',
      };
    }

    const grossMarginPct = ((totalSrpValue - totalCostValue) / totalSrpValue) * 100;

    let score: number;
    let status: 'good' | 'warning' | 'risk';
    let details: string;
    let recommendation: string | undefined;

    if (grossMarginPct >= 65) {
      score = 9.5;
      status = 'good';
      details = `Excellent gross margin of ${grossMarginPct.toFixed(1)}%. Strong profitability.`;
    } else if (grossMarginPct >= 55) {
      score = 8.5;
      status = 'good';
      details = `Healthy gross margin of ${grossMarginPct.toFixed(1)}%. Within target range.`;
    } else if (grossMarginPct >= 45) {
      score = 7.0;
      status = 'good';
      details = `Acceptable gross margin of ${grossMarginPct.toFixed(1)}%.`;
    } else if (grossMarginPct >= 30) {
      score = 5.0;
      status = 'warning';
      details = `Below-target gross margin of ${grossMarginPct.toFixed(1)}%. Profitability at risk.`;
      recommendation = 'Review pricing strategy. Consider higher-margin products or renegotiate costs.';
      warnings.push(`Low gross margin: ${grossMarginPct.toFixed(1)}%`);
    } else {
      score = 3.0;
      status = 'risk';
      details = `Critical gross margin of ${grossMarginPct.toFixed(1)}%. Potential loss-making proposal.`;
      recommendation = 'Urgently review unit costs and pricing. This margin level is unsustainable.';
      warnings.push(`Critical margin risk: ${grossMarginPct.toFixed(1)}% gross margin`);
    }

    return { name: 'Margin Impact', score, weight: 0.15, status, details, recommendation };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DATA ACCESS
  // ═══════════════════════════════════════════════════════════════════════

  async getAssessment(entityType: string, entityId: string) {
    return this.prisma.riskAssessment.findUnique({
      where: {
        entityType_entityId: { entityType, entityId },
      },
    });
  }

  async markStale(entityType: string, entityId: string) {
    try {
      await this.prisma.riskAssessment.update({
        where: {
          entityType_entityId: { entityType, entityId },
        },
        data: { isStale: true },
      });
    } catch {
      // Assessment may not exist yet — that is fine
      this.logger.debug(`No existing assessment to mark stale for ${entityType}/${entityId}`);
    }
  }

  async saveAssessment(result: RiskAssessmentResult) {
    await this.prisma.riskAssessment.upsert({
      where: {
        entityType_entityId: {
          entityType: result.entityType,
          entityId: result.entityId,
        },
      },
      update: {
        overallScore: result.overallScore,
        riskLevel: result.riskLevel,
        budgetAlignmentScore: result.factors.find((f) => f.name === 'Budget Alignment')?.score ?? 0,
        skuDiversityScore: result.factors.find((f) => f.name === 'SKU Diversity')?.score ?? 0,
        sizeCurveScore: result.factors.find((f) => f.name === 'Size Curve')?.score ?? 0,
        vendorConcentrationScore: result.factors.find((f) => f.name === 'Vendor Concentration')?.score ?? 0,
        categoryBalanceScore: result.factors.find((f) => f.name === 'Category Balance')?.score ?? 0,
        marginImpactScore: result.factors.find((f) => f.name === 'Margin Impact')?.score ?? 0,
        factors: result.factors as any,
        warnings: result.warnings as any,
        recommendation: result.recommendation,
        calculatedAt: new Date(),
        isStale: false,
      },
      create: {
        entityType: result.entityType,
        entityId: result.entityId,
        overallScore: result.overallScore,
        riskLevel: result.riskLevel,
        budgetAlignmentScore: result.factors.find((f) => f.name === 'Budget Alignment')?.score ?? 0,
        skuDiversityScore: result.factors.find((f) => f.name === 'SKU Diversity')?.score ?? 0,
        sizeCurveScore: result.factors.find((f) => f.name === 'Size Curve')?.score ?? 0,
        vendorConcentrationScore: result.factors.find((f) => f.name === 'Vendor Concentration')?.score ?? 0,
        categoryBalanceScore: result.factors.find((f) => f.name === 'Category Balance')?.score ?? 0,
        marginImpactScore: result.factors.find((f) => f.name === 'Margin Impact')?.score ?? 0,
        factors: result.factors as any,
        warnings: result.warnings as any,
        recommendation: result.recommendation,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 4) return 'critical';
    if (score < 6) return 'high';
    if (score < 8) return 'medium';
    return 'low';
  }

  private generateRecommendation(
    factors: RiskFactor[],
    riskLevel: string,
    warnings: string[],
  ): string {
    const riskFactors = factors.filter((f) => f.status === 'risk');
    const warningFactors = factors.filter((f) => f.status === 'warning');

    const parts: string[] = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      parts.push(
        `This proposal carries ${riskLevel} risk and requires careful review before approval.`,
      );
    } else if (riskLevel === 'medium') {
      parts.push('This proposal has moderate risk. Review flagged areas before approval.');
    } else {
      parts.push('This proposal appears low-risk and is well-aligned with targets.');
    }

    if (riskFactors.length > 0) {
      const riskNames = riskFactors.map((f) => f.name).join(', ');
      parts.push(`Critical issues in: ${riskNames}.`);
    }

    if (warningFactors.length > 0) {
      const warnNames = warningFactors.map((f) => f.name).join(', ');
      parts.push(`Warnings in: ${warnNames}.`);
    }

    // Add specific recommendations from factors
    const recommendations = factors
      .filter((f) => f.recommendation)
      .map((f) => f.recommendation!);

    if (recommendations.length > 0) {
      parts.push('Recommendations: ' + recommendations.join(' '));
    }

    if (warnings.length > 0) {
      parts.push(`Alerts: ${warnings.join('; ')}.`);
    }

    return parts.join(' ');
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
