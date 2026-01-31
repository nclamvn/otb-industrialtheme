import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StorePerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(query: {
    seasonId?: string;
    storeGroup?: string;
    periodStart?: string;
    periodEnd?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.seasonId) where.seasonId = query.seasonId;
    if (query.storeGroup) where.location = { storeGroup: query.storeGroup };
    if (query.periodStart) where.periodStart = { gte: new Date(query.periodStart) };
    if (query.periodEnd) where.periodEnd = { lte: new Date(query.periodEnd) };

    const [data, total] = await Promise.all([
      this.prisma.storePerformance.findMany({
        where,
        skip,
        take: limit,
        include: { location: true, season: true },
        orderBy: { periodStart: 'desc' },
      }),
      this.prisma.storePerformance.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getByStore(storeId: string, params?: { periodStart?: string; periodEnd?: string }) {
    const where: any = { locationId: storeId };
    if (params?.periodStart) where.periodStart = { gte: new Date(params.periodStart) };
    if (params?.periodEnd) where.periodEnd = { lte: new Date(params.periodEnd) };

    return this.prisma.storePerformance.findMany({
      where,
      include: { location: true, season: true },
      orderBy: { periodStart: 'desc' },
    });
  }

  async getByStoreGroup(storeGroup: string, query: any = {}) {
    const where: any = { location: { storeGroup } };
    if (query.seasonId) where.seasonId = query.seasonId;

    return this.prisma.storePerformance.findMany({
      where,
      include: { location: true, season: true },
      orderBy: [{ location: { name: 'asc' } }, { periodStart: 'desc' }],
    });
  }

  async getGroupSummary(query: { seasonId?: string; periodStart?: string; periodEnd?: string }) {
    const storeGroups = ['REX', 'TTP', 'DAFC'];
    const result: Record<string, any> = {};

    for (const group of storeGroups) {
      const data = await this.prisma.storePerformance.aggregate({
        where: {
          location: { storeGroup: group },
          ...(query.seasonId ? { seasonId: query.seasonId } : {}),
        },
        _sum: {
          salesQuantity: true,
          salesValue: true,
          stockQuantity: true,
          stockValue: true,
        },
        _avg: {
          sellThru: true,
          weeksOfCover: true,
          margin: true,
        },
        _count: true,
      });

      result[group.toLowerCase()] = {
        storeGroup: group,
        totalSales: Number(data._sum.salesValue || 0),
        totalUnits: Number(data._sum.salesQuantity || 0),
        avgSellThru: Number(data._avg.sellThru || 0),
        avgWeeksOfCover: Number(data._avg.weeksOfCover || 0),
        avgMargin: Number(data._avg.margin || 0),
        storeCount: data._count,
      };
    }

    return result;
  }

  async getSummaryByGroup(storeGroup: string, query: any = {}) {
    const data = await this.prisma.storePerformance.aggregate({
      where: {
        location: { storeGroup },
        ...(query.seasonId ? { seasonId: query.seasonId } : {}),
      },
      _sum: {
        salesQuantity: true,
        salesValue: true,
        stockQuantity: true,
        stockValue: true,
      },
      _avg: {
        sellThru: true,
        weeksOfCover: true,
        margin: true,
      },
      _count: true,
    });

    return {
      storeGroup,
      totalSales: Number(data._sum.salesValue || 0),
      totalUnits: Number(data._sum.salesQuantity || 0),
      avgSellThru: Number(data._avg.sellThru || 0),
      avgWeeksOfCover: Number(data._avg.weeksOfCover || 0),
      avgMargin: Number(data._avg.margin || 0),
      storeCount: data._count,
    };
  }

  async compareStores(storeIds: string[], params?: { metrics?: string[]; periodStart?: string; periodEnd?: string }) {
    const result = [];

    for (const storeId of storeIds) {
      const store = await this.prisma.salesLocation.findUnique({ where: { id: storeId } });
      if (!store) continue;

      const data = await this.prisma.storePerformance.aggregate({
        where: {
          locationId: storeId,
          ...(params?.periodStart ? { periodStart: { gte: new Date(params.periodStart) } } : {}),
          ...(params?.periodEnd ? { periodEnd: { lte: new Date(params.periodEnd) } } : {}),
        },
        _sum: { salesQuantity: true, salesValue: true },
        _avg: { sellThru: true, weeksOfCover: true, margin: true },
      });

      result.push({
        storeId,
        storeName: store.name,
        storeGroup: store.storeGroup,
        salesValue: Number(data._sum.salesValue || 0),
        salesQuantity: Number(data._sum.salesQuantity || 0),
        avgSellThru: Number(data._avg.sellThru || 0),
        avgWeeksOfCover: Number(data._avg.weeksOfCover || 0),
        avgMargin: Number(data._avg.margin || 0),
      });
    }

    return result;
  }

  async compareGroups(query: any = {}) {
    const metrics = ['salesValue', 'sellThru', 'weeksOfCover', 'margin'];
    const result = [];

    for (const metric of metrics) {
      const row: any = { metric };
      for (const group of ['REX', 'TTP', 'DAFC']) {
        const data = await this.prisma.storePerformance.aggregate({
          where: { location: { storeGroup: group } },
          _avg: { [metric]: true },
        });
        row[group.toLowerCase()] = Number((data._avg as any)[metric] || 0);
      }
      row.benchmark = (row.rex + row.ttp + row.dafc) / 3;
      result.push(row);
    }

    return result;
  }

  async getTrend(storeId: string, params?: { weeks?: number; metric?: string }) {
    const weeks = params?.weeks || 12;
    const performances = await this.prisma.storePerformance.findMany({
      where: { locationId: storeId },
      orderBy: { periodStart: 'desc' },
      take: weeks,
    });

    return performances.reverse().map((p, i, arr) => {
      const prev = arr[i - 1];
      const value = Number(p.salesValue);
      const change = prev ? value - Number(prev.salesValue) : 0;
      return {
        week: `W${i + 1}`,
        value,
        change,
        changePercent: prev && Number(prev.salesValue) > 0 ? (change / Number(prev.salesValue)) * 100 : 0,
      };
    });
  }

  async getGroupTrend(storeGroup: string, params?: { weeks?: number; metric?: string }) {
    const weeks = params?.weeks || 12;
    // Group by period and aggregate
    const performances = await this.prisma.storePerformance.groupBy({
      by: ['periodStart'],
      where: { location: { storeGroup } },
      _sum: { salesValue: true },
      orderBy: { periodStart: 'desc' },
      take: weeks,
    });

    return performances.reverse().map((p, i, arr) => {
      const prev = arr[i - 1];
      const value = Number(p._sum.salesValue || 0);
      const change = prev ? value - Number(prev._sum.salesValue || 0) : 0;
      return {
        week: `W${i + 1}`,
        value,
        change,
        changePercent: prev && Number(prev._sum.salesValue) > 0 ? (change / Number(prev._sum.salesValue)) * 100 : 0,
      };
    });
  }

  async getTopPerformers(params: { limit?: number; metric?: string } = {}) {
    const limit = params.limit || 10;
    return this.prisma.storePerformance.findMany({
      orderBy: { sellThru: 'desc' },
      take: limit,
      include: { location: true },
    });
  }

  async getBottomPerformers(params: { limit?: number; metric?: string } = {}) {
    const limit = params.limit || 10;
    return this.prisma.storePerformance.findMany({
      orderBy: { sellThru: 'asc' },
      take: limit,
      include: { location: true },
    });
  }

  async getSKUPerformance(storeId: string, params?: { brandId?: string; categoryId?: string; limit?: number }) {
    // This would require joining with SKU sales data
    // For now, return a placeholder
    return [];
  }
}
