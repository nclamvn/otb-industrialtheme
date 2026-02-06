import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query?: {
    page?: number;
    limit?: number;
    type?: string;
    isShared?: boolean;
  }) {
    const { page = 1, limit = 20, type, isShared } = query || {};

    const where: any = {
      OR: [
        { createdById: userId },
        { isShared: true },
      ],
    };
    if (type) where.type = type;
    if (isShared !== undefined) where.isShared = isShared;

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { executions: true },
          },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async create(userId: string, data: {
    name: string;
    description?: string;
    type: string;
    config: any;
    schedule?: string;
    isShared?: boolean;
  }) {
    return this.prisma.report.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type as any,
        config: data.config,
        schedule: data.schedule,
        isShared: data.isShared || false,
        createdById: userId,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    config?: any;
    schedule?: string;
    isShared?: boolean;
  }) {
    return this.prisma.report.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.prisma.report.delete({ where: { id } });
    return { deleted: true };
  }

  async execute(id: string, userId: string, params?: any) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Create execution record
    const execution = await this.prisma.reportExecution.create({
      data: {
        reportId: id,
        status: 'running',
        format: params?.format || 'json',
        parameters: params,
        executedById: userId,
      },
    });

    // Update report last run info
    await this.prisma.report.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: 'running',
      },
    });

    // In a real implementation, this would trigger async report generation
    // For now, we'll return the execution record

    return execution;
  }

  // Budget Summary Report
  async getBudgetSummary(query?: {
    seasonId?: string;
    brandId?: string;
    status?: string;
  }) {
    const { seasonId, brandId, status } = query || {};

    const where: any = {};
    if (seasonId) where.seasonId = seasonId;
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;

    const budgets = await this.prisma.budgetAllocation.findMany({
      where,
      include: {
        season: true,
        brand: true,
        location: true,
      },
    });

    // Calculate summary
    const summary = {
      totalBudgets: budgets.length,
      totalValue: budgets.reduce((sum, b) => sum + Number(b.totalBudget), 0),
      byStatus: {} as Record<string, number>,
      byBrand: {} as Record<string, number>,
    };

    budgets.forEach(budget => {
      summary.byStatus[budget.status] = (summary.byStatus[budget.status] || 0) + 1;
      const brandName = budget.brand.name;
      summary.byBrand[brandName] = (summary.byBrand[brandName] || 0) + Number(budget.totalBudget);
    });

    return {
      summary,
      budgets,
    };
  }

  // OTB Analysis Report
  async getOtbAnalysis(query?: {
    seasonId?: string;
    brandId?: string;
  }) {
    const { seasonId, brandId } = query || {};

    const where: any = {};
    if (seasonId) where.seasonId = seasonId;
    if (brandId) where.brandId = brandId;

    const otbPlans = await this.prisma.oTBPlan.findMany({
      where,
      include: {
        season: true,
        brand: true,
        budget: true,
        lineItems: true,
      },
    });

    const summary = {
      totalPlans: otbPlans.length,
      totalOTBValue: otbPlans.reduce((sum, p) => sum + Number(p.totalOTBValue), 0),
      totalSKUs: otbPlans.reduce((sum, p) => sum + p.totalSKUCount, 0),
      byStatus: {} as Record<string, number>,
    };

    otbPlans.forEach(plan => {
      summary.byStatus[plan.status] = (summary.byStatus[plan.status] || 0) + 1;
    });

    return {
      summary,
      plans: otbPlans,
    };
  }

  // SKU Performance Report
  async getSkuPerformance(query?: {
    seasonId?: string;
    brandId?: string;
    categoryId?: string;
  }) {
    const { seasonId, brandId, categoryId } = query || {};

    const where: any = {};
    if (seasonId) where.proposal = { seasonId };
    if (brandId) where.proposal = { ...where.proposal, brandId };
    if (categoryId) where.categoryId = categoryId;

    const skuItems = await this.prisma.sKUItem.findMany({
      where,
      include: {
        proposal: {
          include: {
            season: true,
            brand: true,
          },
        },
        category: true,
        subcategory: true,
      },
    });

    const summary = {
      totalSKUs: skuItems.length,
      totalQuantity: skuItems.reduce((sum, s) => sum + s.orderQuantity, 0),
      totalValue: skuItems.reduce((sum, s) => sum + Number(s.orderValue || 0), 0),
      byCategory: {} as Record<string, { count: number; value: number }>,
      byValidationStatus: {} as Record<string, number>,
    };

    skuItems.forEach(sku => {
      const catName = sku.category?.name || 'Unknown';
      if (!summary.byCategory[catName]) {
        summary.byCategory[catName] = { count: 0, value: 0 };
      }
      summary.byCategory[catName].count += 1;
      summary.byCategory[catName].value += Number(sku.orderValue || 0);

      summary.byValidationStatus[sku.validationStatus] =
        (summary.byValidationStatus[sku.validationStatus] || 0) + 1;
    });

    return {
      summary,
      skus: skuItems.slice(0, 100), // Limit to 100 for performance
    };
  }
}
