import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetCarryForwardQueryDto,
  CreateCarryForwardDto,
  UpdateCarryForwardDto,
  ApproveCarryForwardDto,
  RejectCarryForwardDto,
  BatchCarryForwardDto,
  AnalyzeCarryForwardDto,
  AllocateCarryForwardDto,
} from './carry-forward.dto';

@Injectable()
export class CarryForwardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(query: GetCarryForwardQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.fromSeasonId) where.fromSeasonId = query.fromSeasonId;
    if (query.toSeasonId) where.toSeasonId = query.toSeasonId;
    if (query.status) where.status = query.status;
    if (query.categoryId) where.skuItem = { categoryId: query.categoryId };

    const [data, total] = await Promise.all([
      this.prisma.carryForwardItem.findMany({
        where,
        skip,
        take: limit,
        include: {
          skuItem: {
            include: {
              category: true,
            },
          },
          fromSeason: true,
          toSeason: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.carryForwardItem.count({ where }),
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
    const item = await this.prisma.carryForwardItem.findUnique({
      where: { id },
      include: {
        skuItem: {
          include: {
            category: true,
          },
        },
        fromSeason: true,
        toSeason: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Carry forward item with ID ${id} not found`);
    }

    return item;
  }

  async create(dto: CreateCarryForwardDto) {
    // Verify SKU exists
    const sku = await this.prisma.sKUItem.findUnique({
      where: { id: dto.skuItemId },
    });

    if (!sku) {
      throw new NotFoundException(`SKU with ID ${dto.skuItemId} not found`);
    }

    return this.prisma.carryForwardItem.create({
      data: {
        skuItemId: dto.skuItemId,
        fromSeasonId: dto.fromSeasonId,
        toSeasonId: dto.toSeasonId,
        isCarryForward: true,
        originalQuantity: dto.carryQuantity,
        remainingQuantity: dto.carryQuantity,
        carryForwardReason: dto.reason,
        status: 'PENDING',
      },
      include: {
        skuItem: true,
        fromSeason: true,
        toSeason: true,
      },
    });
  }

  async update(id: string, dto: UpdateCarryForwardDto) {
    await this.getById(id); // Verify exists

    return this.prisma.carryForwardItem.update({
      where: { id },
      data: {
        ...(dto.carryQuantity !== undefined ? { remainingQuantity: dto.carryQuantity } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.reason ? { carryForwardReason: dto.reason } : {}),
      },
      include: {
        skuItem: true,
        fromSeason: true,
        toSeason: true,
      },
    });
  }

  async delete(id: string) {
    await this.getById(id); // Verify exists

    await this.prisma.carryForwardItem.delete({ where: { id } });
    return { success: true, message: 'Carry forward item deleted successfully' };
  }

  async approve(dto: ApproveCarryForwardDto) {
    const results = await Promise.all(
      dto.ids.map(async (id) => {
        try {
          return await this.prisma.carryForwardItem.update({
            where: { id },
            data: {
              status: 'APPROVED',
            },
          });
        } catch {
          return { id, error: 'Failed to approve' };
        }
      })
    );

    return {
      approved: results.filter(r => !('error' in r)).length,
      failed: results.filter(r => 'error' in r).length,
      results,
    };
  }

  async reject(dto: RejectCarryForwardDto) {
    const results = await Promise.all(
      dto.ids.map(async (id) => {
        try {
          return await this.prisma.carryForwardItem.update({
            where: { id },
            data: {
              status: 'REJECTED',
              carryForwardReason: dto.rejectionReason,
            },
          });
        } catch {
          return { id, error: 'Failed to reject' };
        }
      })
    );

    return {
      rejected: results.filter(r => !('error' in r)).length,
      failed: results.filter(r => 'error' in r).length,
      results,
    };
  }

  async batchCreate(fromSeasonId: string, toSeasonId: string, dto: BatchCarryForwardDto) {
    const results = await Promise.all(
      dto.items.map(async (item) => {
        try {
          const sku = await this.prisma.sKUItem.findUnique({
            where: { id: item.skuItemId },
          });

          if (!sku) {
            return { skuItemId: item.skuItemId, error: 'SKU not found' };
          }

          return await this.prisma.carryForwardItem.create({
            data: {
              skuItemId: item.skuItemId,
              fromSeasonId,
              toSeasonId,
              isCarryForward: true,
              originalQuantity: item.carryQuantity,
              remainingQuantity: item.carryQuantity,
              carryForwardReason: item.reason,
              status: 'PENDING',
            },
          });
        } catch {
          return { skuItemId: item.skuItemId, error: 'Failed to create' };
        }
      })
    );

    return {
      created: results.filter(r => !('error' in r)).length,
      failed: results.filter(r => 'error' in r).length,
      results,
    };
  }

  async analyze(dto: AnalyzeCarryForwardDto) {
    const minSellThrough = dto.minSellThrough ?? 30;
    const maxWeeksOfCover = dto.maxWeeksOfCover ?? 12;

    // Get all SKUs from the source season via proposal
    const skus = await this.prisma.sKUItem.findMany({
      where: {
        proposal: { seasonId: dto.fromSeasonId },
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
      },
      include: {
        category: true,
      },
    });

    // Analyze each SKU for carry forward eligibility
    const eligibleItems: any[] = [];
    const ineligibleItems: any[] = [];

    for (const sku of skus) {
      const remainingStock = sku.orderQuantity;
      const sellThrough = 50; // Mock
      const weeksOfCover = 8; // Mock

      const isEligible = sellThrough >= minSellThrough && weeksOfCover <= maxWeeksOfCover && remainingStock > 0;

      const item = {
        skuId: sku.id,
        skuCode: sku.skuCode,
        category: sku.category?.name,
        remainingStock,
        sellThrough,
        weeksOfCover,
        estimatedValue: remainingStock * Number(sku.retailPrice),
        isEligible,
        reason: !isEligible
          ? sellThrough < minSellThrough
            ? 'Low sell-through'
            : weeksOfCover > maxWeeksOfCover
              ? 'High weeks of cover'
              : 'No remaining stock'
          : null,
      };

      if (isEligible) {
        eligibleItems.push(item);
      } else {
        ineligibleItems.push(item);
      }
    }

    return {
      fromSeasonId: dto.fromSeasonId,
      toSeasonId: dto.toSeasonId,
      criteria: { minSellThrough, maxWeeksOfCover },
      summary: {
        totalSKUs: skus.length,
        eligibleCount: eligibleItems.length,
        ineligibleCount: ineligibleItems.length,
        totalEligibleValue: eligibleItems.reduce((sum, i) => sum + i.estimatedValue, 0),
        totalEligibleUnits: eligibleItems.reduce((sum, i) => sum + i.remainingStock, 0),
      },
      eligibleItems,
      ineligibleItems,
    };
  }

  async allocate(dto: AllocateCarryForwardDto) {
    const results = await Promise.all(
      dto.ids.map(async (id) => {
        try {
          const item = await this.prisma.carryForwardItem.findUnique({
            where: { id },
            include: { skuItem: true },
          });

          if (!item) {
            return { id, error: 'Item not found' };
          }

          return await this.prisma.carryForwardItem.update({
            where: { id },
            data: {
              status: 'APPROVED',
              newSeasonQuantity: item.remainingQuantity,
            },
          });
        } catch {
          return { id, error: 'Failed to allocate' };
        }
      })
    );

    return {
      allocated: results.filter(r => !('error' in r)).length,
      failed: results.filter(r => 'error' in r).length,
      strategy: dto.strategy,
      results,
    };
  }

  async getSummary(seasonId: string) {
    const [items, aggregate] = await Promise.all([
      this.prisma.carryForwardItem.findMany({
        where: { toSeasonId: seasonId },
        include: {
          skuItem: {
            include: { category: true },
          },
        },
      }),
      this.prisma.carryForwardItem.aggregate({
        where: { toSeasonId: seasonId },
        _sum: {
          originalQuantity: true,
          remainingQuantity: true,
          newSeasonQuantity: true,
        },
        _count: true,
      }),
    ]);

    // Group by status
    const byStatus = items.reduce((acc, item) => {
      const status = item.status;
      if (!acc[status]) {
        acc[status] = { count: 0, quantity: 0 };
      }
      acc[status].count++;
      acc[status].quantity += item.remainingQuantity;
      return acc;
    }, {} as Record<string, { count: number; quantity: number }>);

    return {
      seasonId,
      totalItems: aggregate._count,
      totalOriginalQuantity: aggregate._sum.originalQuantity || 0,
      totalRemainingQuantity: aggregate._sum.remainingQuantity || 0,
      totalNewSeasonQuantity: aggregate._sum.newSeasonQuantity || 0,
      byStatus,
    };
  }

  async getHistory(skuItemId: string) {
    const items = await this.prisma.carryForwardItem.findMany({
      where: { skuItemId },
      include: {
        fromSeason: true,
        toSeason: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items;
  }
}
