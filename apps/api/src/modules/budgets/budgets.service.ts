import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  // Track field changes for change logging
  private getChangedFields(
    original: Record<string, any>,
    updated: Record<string, any>,
    trackFields: string[],
  ): Array<{ fieldName: string; oldValue: string; newValue: string }> {
    const changes: Array<{ fieldName: string; oldValue: string; newValue: string }> = [];

    for (const field of trackFields) {
      const oldValue = original[field];
      const newValue = updated[field];

      if (oldValue !== newValue && newValue !== undefined) {
        changes.push({
          fieldName: field,
          oldValue: oldValue?.toString() || null,
          newValue: newValue?.toString() || null,
        });
      }
    }

    return changes;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    seasonId?: string;
    brandId?: string;
    status?: string;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.seasonId) where.seasonId = query.seasonId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.budgetAllocation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          season: true,
          brand: true,
          location: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.budgetAllocation.count({ where }),
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
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id },
      include: {
        season: true,
        brand: true,
        location: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        otbPlans: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async create(data: any, userId: string) {
    return this.prisma.budgetAllocation.create({
      data: {
        ...data,
        createdById: userId,
        status: 'DRAFT',
        version: 1,
      },
      include: {
        season: true,
        brand: true,
        location: true,
      },
    });
  }

  async update(id: string, data: any, userId?: string, changeReason?: string) {
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Track fields that need change logging
    const trackFields = [
      'totalBudget',
      'allocatedBudget',
      'remainingBudget',
      'targetUnits',
      'targetGMROI',
      'targetSellThrough',
      'status',
    ];

    const changes = this.getChangedFields(budget, data, trackFields);

    // Use transaction to ensure both update and logging succeed
    const result = await this.prisma.$transaction(async (tx) => {
      // Update the budget
      const updatedBudget = await tx.budgetAllocation.update({
        where: { id },
        data,
        include: {
          season: true,
          brand: true,
          location: true,
        },
      });

      // Log changes if user and reason provided
      if (userId && changeReason && changes.length > 0) {
        await tx.budgetChangeLog.createMany({
          data: changes.map((change) => ({
            budgetId: id,
            fieldName: change.fieldName,
            oldValue: change.oldValue,
            newValue: change.newValue,
            changeReason,
            changedById: userId,
          })),
        });
      }

      return updatedBudget;
    });

    return result;
  }

  async remove(id: string) {
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    await this.prisma.budgetAllocation.delete({ where: { id } });
    return { deleted: true };
  }

  async submit(id: string, userId: string) {
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return this.prisma.budgetAllocation.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
  }

  async approve(id: string, userId: string, comments?: string) {
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return this.prisma.budgetAllocation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
        comments: comments || budget.comments,
      },
    });
  }

  async reject(id: string, userId: string, reason: string) {
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update the budget
      const result = await tx.budgetAllocation.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedById: userId,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      });

      // Log the status change
      await tx.budgetChangeLog.create({
        data: {
          budgetId: id,
          fieldName: 'status',
          oldValue: budget.status,
          newValue: 'REJECTED',
          changeReason: reason,
          changedById: userId,
        },
      });

      return result;
    });
  }

  // Change Log Methods
  async getChangeLogs(budgetId: string, query: { page?: number; limit?: number }) {
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.budgetChangeLog.findMany({
        where: { budgetId },
        skip,
        take: limit,
        orderBy: { changedAt: 'desc' },
        include: {
          changedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.budgetChangeLog.count({ where: { budgetId } }),
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

  async getVersionHistory(budgetId: string) {
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id: budgetId },
      include: {
        otbPlans: {
          orderBy: { version: 'desc' },
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              include: {
                createdBy: { select: { id: true, name: true, email: true } },
                submittedBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async getSummaryStats(query: { seasonId?: string; brandId?: string }) {
    const where: any = {};
    if (query.seasonId) where.seasonId = query.seasonId;
    if (query.brandId) where.brandId = query.brandId;

    const budgets = await this.prisma.budgetAllocation.findMany({
      where,
      select: {
        id: true,
        totalBudget: true,
        seasonalBudget: true,
        replenishmentBudget: true,
        status: true,
      },
    });

    const stats = {
      totalBudgets: budgets.length,
      totalBudgetValue: budgets.reduce((sum, b) => sum + Number(b.totalBudget || 0), 0),
      totalSeasonalBudget: budgets.reduce((sum, b) => sum + Number(b.seasonalBudget || 0), 0),
      totalReplenishmentBudget: budgets.reduce((sum, b) => sum + Number(b.replenishmentBudget || 0), 0),
      byStatus: {
        DRAFT: budgets.filter(b => b.status === 'DRAFT').length,
        SUBMITTED: budgets.filter(b => b.status === 'SUBMITTED').length,
        APPROVED: budgets.filter(b => b.status === 'APPROVED').length,
        REJECTED: budgets.filter(b => b.status === 'REJECTED').length,
      },
    };

    return stats;
  }
}
