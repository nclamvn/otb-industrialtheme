import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CalculateCostingDto,
  CreateCostingDto,
  UpdateCostingDto,
  BatchCostingUpdateDto,
  RecalculateAllDto,
  GetCostingsQueryDto,
  GetCostingSummaryQueryDto,
  CreateCostingConfigDto,
  UpdateCostingConfigDto,
} from './costing.dto';

@Injectable()
export class CostingService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Costing CRUD ====================

  async getAll(query: GetCostingsQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.skuId) where.skuItemId = query.skuId;

    if (query.category || query.brandId || query.seasonId) {
      where.skuItem = {};
      if (query.category) {
        where.skuItem.category = { code: query.category };
      }
      if (query.brandId) {
        where.skuItem.proposal = { brandId: query.brandId };
      }
      if (query.seasonId) {
        where.skuItem.proposal = { ...where.skuItem.proposal, seasonId: query.seasonId };
      }
    }

    if (query.minMargin !== undefined) {
      where.margin = { gte: query.minMargin };
    }
    if (query.maxMargin !== undefined) {
      where.margin = { ...where.margin, lte: query.maxMargin };
    }

    const [data, total] = await Promise.all([
      this.prisma.costingBreakdown.findMany({
        where,
        skip,
        take: limit,
        include: {
          skuItem: {
            include: {
              proposal: { include: { brand: true } },
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.costingBreakdown.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const costing = await this.prisma.costingBreakdown.findUnique({
      where: { id },
      include: {
        skuItem: {
          include: {
            proposal: { include: { brand: true, season: true } },
            category: true,
          },
        },
      },
    });

    if (!costing) {
      throw new NotFoundException(`Costing with ID ${id} not found`);
    }

    return costing;
  }

  async getBySku(skuId: string) {
    const costing = await this.prisma.costingBreakdown.findUnique({
      where: { skuItemId: skuId },
      include: {
        skuItem: {
          include: {
            proposal: { include: { brand: true, season: true } },
            category: true,
          },
        },
      },
    });

    if (!costing) {
      throw new NotFoundException(`Costing for SKU ${skuId} not found`);
    }

    return costing;
  }

  async calculate(data: CalculateCostingDto) {
    const {
      unitCost,
      freightPercent = 5,
      insurancePercent = 0.5,
      dutyRate = 0,
      vatRate = 10,
      otherCosts = 0,
      targetMargin = 55,
      exchangeRate = 24500,
      srp: providedSrp,
    } = data;

    // Calculate costs in USD
    const freightCost = unitCost * (freightPercent / 100);
    const insuranceCost = unitCost * (insurancePercent / 100);
    const cifCost = unitCost + freightCost + insuranceCost;

    // Calculate duty and VAT
    const dutyAmount = cifCost * (dutyRate / 100);
    const vatBase = cifCost + dutyAmount;
    const vatAmount = vatBase * (vatRate / 100);

    // Total landed cost in USD
    const landedCostUsd = cifCost + dutyAmount + vatAmount + otherCosts;

    // Convert to VND
    const landedCostVnd = landedCostUsd * exchangeRate;

    // Calculate SRP based on target margin or use provided SRP
    let srp: number;
    let margin: number;

    if (providedSrp) {
      srp = providedSrp;
      margin = ((srp - landedCostVnd) / srp) * 100;
    } else {
      srp = landedCostVnd / (1 - targetMargin / 100);
      margin = targetMargin;
    }

    // Round SRP to nearest 10,000 VND
    const roundedSrp = Math.ceil(srp / 10000) * 10000;

    // Recalculate margin with rounded SRP
    const actualMargin = ((roundedSrp - landedCostVnd) / roundedSrp) * 100;

    return {
      input: {
        unitCost,
        freightPercent,
        insurancePercent,
        dutyRate,
        vatRate,
        otherCosts,
        exchangeRate,
      },
      breakdown: {
        freightCost: Number(freightCost.toFixed(2)),
        insuranceCost: Number(insuranceCost.toFixed(2)),
        cifCost: Number(cifCost.toFixed(2)),
        dutyAmount: Number(dutyAmount.toFixed(2)),
        vatAmount: Number(vatAmount.toFixed(2)),
        landedCostUsd: Number(landedCostUsd.toFixed(2)),
        landedCostVnd: Math.round(landedCostVnd),
      },
      result: {
        suggestedSrp: roundedSrp,
        margin: Number(actualMargin.toFixed(2)),
        profitPerUnit: Math.round(roundedSrp - landedCostVnd),
      },
    };
  }

  async create(data: CreateCostingDto) {
    // Check if SKU exists
    const skuItem = await this.prisma.sKUItem.findUnique({
      where: { id: data.skuItemId },
    });

    if (!skuItem) {
      throw new NotFoundException(`SKU Item with ID ${data.skuItemId} not found`);
    }

    return this.prisma.costingBreakdown.create({
      data: {
        skuItemId: data.skuItemId,
        unitCost: data.unitCost,
        freightCost: data.freightCost || 0,
        insuranceCost: data.insuranceCost || 0,
        dutyRate: data.dutyRate || 0,
        dutyAmount: data.dutyAmount || 0,
        vatRate: data.vatRate || 10,
        vatAmount: data.vatAmount || 0,
        otherCosts: data.otherCosts || 0,
        landedCost: data.landedCost,
        srp: data.srp,
        margin: data.margin,
        exchangeRate: data.exchangeRate || 24500,
      },
      include: {
        skuItem: {
          include: {
            proposal: { include: { brand: true } },
            category: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateCostingDto) {
    await this.getById(id); // Verify exists

    return this.prisma.costingBreakdown.update({
      where: { id },
      data,
      include: {
        skuItem: {
          include: {
            proposal: { include: { brand: true } },
            category: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    await this.getById(id); // Verify exists

    await this.prisma.costingBreakdown.delete({ where: { id } });
    return { deleted: true };
  }

  async batchUpdate(data: BatchCostingUpdateDto) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const update of data.updates) {
      try {
        const existing = await this.prisma.costingBreakdown.findUnique({
          where: { id: update.id },
        });

        if (!existing) {
          results.failed++;
          results.errors.push(`Costing ${update.id} not found`);
          continue;
        }

        // Recalculate margin if SRP changed
        let margin = update.margin;
        if (update.srp && !update.margin) {
          margin = ((update.srp - Number(existing.landedCost)) / update.srp) * 100;
        }

        await this.prisma.costingBreakdown.update({
          where: { id: update.id },
          data: {
            srp: update.srp,
            margin,
            exchangeRate: update.exchangeRate,
          },
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to update costing ${update.id}`);
      }
    }

    return results;
  }

  // ==================== Summary & Analysis ====================

  async getSummary(query: GetCostingSummaryQueryDto) {
    const where: any = {};

    if (query.brandId || query.seasonId || query.categoryId) {
      where.skuItem = {};
      if (query.brandId) {
        where.skuItem.proposal = { brandId: query.brandId };
      }
      if (query.seasonId) {
        where.skuItem.proposal = { ...where.skuItem.proposal, seasonId: query.seasonId };
      }
      if (query.categoryId) {
        where.skuItem.categoryId = query.categoryId;
      }
    }

    const costings = await this.prisma.costingBreakdown.findMany({
      where,
      include: {
        skuItem: {
          include: {
            proposal: { include: { brand: true } },
            category: true,
          },
        },
      },
    });

    if (costings.length === 0) {
      return {
        totalSKUs: 0,
        avgMargin: 0,
        avgLandedCost: 0,
        avgSrp: 0,
        totalValue: 0,
        marginDistribution: [],
        byBrand: [],
        byCategory: [],
      };
    }

    const totalSKUs = costings.length;
    const avgMargin = costings.reduce((sum, c) => sum + Number(c.margin), 0) / totalSKUs;
    const avgLandedCost = costings.reduce((sum, c) => sum + Number(c.landedCost), 0) / totalSKUs;
    const avgSrp = costings.reduce((sum, c) => sum + Number(c.srp), 0) / totalSKUs;

    // Margin distribution
    const marginRanges = [
      { label: '< 40%', min: -100, max: 40, count: 0 },
      { label: '40-50%', min: 40, max: 50, count: 0 },
      { label: '50-60%', min: 50, max: 60, count: 0 },
      { label: '60-70%', min: 60, max: 70, count: 0 },
      { label: '> 70%', min: 70, max: 200, count: 0 },
    ];

    for (const c of costings) {
      const margin = Number(c.margin);
      for (const range of marginRanges) {
        if (margin >= range.min && margin < range.max) {
          range.count++;
          break;
        }
      }
    }

    // Group by brand
    const brandMap = new Map<string, { count: number; totalMargin: number }>();
    for (const c of costings) {
      const brand = c.skuItem.proposal.brand.name;
      if (!brandMap.has(brand)) {
        brandMap.set(brand, { count: 0, totalMargin: 0 });
      }
      const b = brandMap.get(brand)!;
      b.count++;
      b.totalMargin += Number(c.margin);
    }

    const byBrand = Array.from(brandMap.entries()).map(([name, data]) => ({
      name,
      skuCount: data.count,
      avgMargin: Number((data.totalMargin / data.count).toFixed(2)),
    }));

    // Group by category
    const categoryMap = new Map<string, { count: number; totalMargin: number }>();
    for (const c of costings) {
      const category = c.skuItem.category.name;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, totalMargin: 0 });
      }
      const cat = categoryMap.get(category)!;
      cat.count++;
      cat.totalMargin += Number(c.margin);
    }

    const byCategory = Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      skuCount: data.count,
      avgMargin: Number((data.totalMargin / data.count).toFixed(2)),
    }));

    return {
      totalSKUs,
      avgMargin: Number(avgMargin.toFixed(2)),
      avgLandedCost: Math.round(avgLandedCost),
      avgSrp: Math.round(avgSrp),
      marginDistribution: marginRanges.map(r => ({
        range: r.label,
        count: r.count,
        percentage: Number(((r.count / totalSKUs) * 100).toFixed(1)),
      })),
      byBrand,
      byCategory,
    };
  }

  async getMarginAnalysis(query: GetCostingSummaryQueryDto) {
    const where: any = {};

    if (query.brandId || query.seasonId || query.categoryId) {
      where.skuItem = {};
      if (query.brandId) {
        where.skuItem.proposal = { brandId: query.brandId };
      }
      if (query.seasonId) {
        where.skuItem.proposal = { ...where.skuItem.proposal, seasonId: query.seasonId };
      }
      if (query.categoryId) {
        where.skuItem.categoryId = query.categoryId;
      }
    }

    const costings = await this.prisma.costingBreakdown.findMany({
      where,
      include: {
        skuItem: true,
      },
      orderBy: { margin: 'asc' },
    });

    if (costings.length === 0) {
      return {
        avgMargin: 0,
        medianMargin: 0,
        minMargin: 0,
        maxMargin: 0,
        distribution: [],
        belowTarget: [],
      };
    }

    const margins = costings.map(c => Number(c.margin));
    const avgMargin = margins.reduce((sum, m) => sum + m, 0) / margins.length;
    const medianMargin = margins[Math.floor(margins.length / 2)];
    const minMargin = Math.min(...margins);
    const maxMargin = Math.max(...margins);

    // Distribution in 10% buckets
    const distribution: { range: string; count: number; percentage: number }[] = [];
    for (let i = 0; i <= 90; i += 10) {
      const count = costings.filter(c => {
        const m = Number(c.margin);
        return m >= i && m < i + 10;
      }).length;

      distribution.push({
        range: `${i}-${i + 10}%`,
        count,
        percentage: Number(((count / costings.length) * 100).toFixed(1)),
      });
    }

    // SKUs below 45% margin target
    const belowTarget = costings
      .filter(c => Number(c.margin) < 45)
      .slice(0, 20)
      .map(c => ({
        skuId: c.skuItemId,
        skuCode: c.skuItem.skuCode,
        margin: Number(c.margin),
      }));

    return {
      avgMargin: Number(avgMargin.toFixed(2)),
      medianMargin: Number(medianMargin.toFixed(2)),
      minMargin: Number(minMargin.toFixed(2)),
      maxMargin: Number(maxMargin.toFixed(2)),
      distribution,
      belowTarget,
    };
  }

  // ==================== Costing Configs ====================

  async getConfigs(query: { brandId?: string; category?: string; isActive?: boolean }) {
    const where: any = {};
    if (query.brandId) where.brandId = query.brandId;
    if (query.category) where.category = { code: query.category };
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.prisma.costingConfig.findMany({
      where,
      include: { brand: true, category: true },
    });
  }

  async getConfigById(id: string) {
    const config = await this.prisma.costingConfig.findUnique({
      where: { id },
      include: { brand: true, category: true },
    });

    if (!config) {
      throw new NotFoundException(`Costing config with ID ${id} not found`);
    }

    return config;
  }

  async createConfig(data: CreateCostingConfigDto) {
    return this.prisma.costingConfig.create({
      data: {
        brandId: data.brandId,
        categoryId: data.categoryId,
        defaultDutyRate: data.defaultDutyRate || 0,
        defaultVatRate: data.defaultVatRate || 10,
        defaultFreightRate: data.defaultFreightRate || 5,
        targetMargin: data.targetMargin || 55,
        minMargin: data.minMargin || 45,
        isActive: data.isActive ?? true,
      },
      include: { brand: true, category: true },
    });
  }

  async updateConfig(id: string, data: UpdateCostingConfigDto) {
    await this.getConfigById(id); // Verify exists

    return this.prisma.costingConfig.update({
      where: { id },
      data,
      include: { brand: true, category: true },
    });
  }

  async deleteConfig(id: string) {
    await this.getConfigById(id); // Verify exists

    await this.prisma.costingConfig.delete({ where: { id } });
    return { deleted: true };
  }

  // ==================== Recalculate All ====================

  async recalculateAll(data: RecalculateAllDto) {
    const where: any = {};

    if (data.seasonId) {
      where.skuItem = { proposal: { seasonId: data.seasonId } };
    }
    if (data.brandId) {
      where.skuItem = { ...where.skuItem, proposal: { brandId: data.brandId } };
    }

    const costings = await this.prisma.costingBreakdown.findMany({ where });

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const costing of costings) {
      try {
        // Recalculate landed cost with new exchange rate
        const newLandedCost = Number(costing.unitCost) * data.exchangeRate +
          Number(costing.freightCost) * data.exchangeRate +
          Number(costing.insuranceCost) * data.exchangeRate +
          Number(costing.dutyAmount) * data.exchangeRate +
          Number(costing.vatAmount) * data.exchangeRate +
          Number(costing.otherCosts) * data.exchangeRate;

        // Recalculate margin with existing SRP
        const newMargin = ((Number(costing.srp) - newLandedCost) / Number(costing.srp)) * 100;

        await this.prisma.costingBreakdown.update({
          where: { id: costing.id },
          data: {
            landedCost: newLandedCost,
            margin: newMargin,
            exchangeRate: data.exchangeRate,
          },
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to recalculate costing ${costing.id}`);
      }
    }

    return results;
  }

  // ==================== Export ====================

  async exportToExcel(query: GetCostingSummaryQueryDto) {
    // In a real implementation, this would generate an Excel file
    // and return a download URL. For now, return a placeholder.
    return {
      downloadUrl: `/api/v1/costing/export/download?token=${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
  }
}
