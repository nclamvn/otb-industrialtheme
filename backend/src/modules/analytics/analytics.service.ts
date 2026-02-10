import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // SALES PERFORMANCE
  // ═══════════════════════════════════════════════════════════════════════════

  async getTopSkus(query: AnalyticsQueryDto) {
    const where: Prisma.SkuPerformanceWhereInput = { storeId: null };
    if (query.seasonGroup) where.seasonGroup = query.seasonGroup;
    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;
    if (query.storeId) where.storeId = query.storeId;

    return this.prisma.skuPerformance.findMany({
      where,
      orderBy: { performanceScore: 'desc' },
      take: query.limit || 10,
      include: { sku: true, store: true },
    });
  }

  async getBottomSkus(query: AnalyticsQueryDto) {
    const where: Prisma.SkuPerformanceWhereInput = { storeId: null };
    if (query.seasonGroup) where.seasonGroup = query.seasonGroup;
    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;
    if (query.storeId) where.storeId = query.storeId;

    return this.prisma.skuPerformance.findMany({
      where,
      orderBy: { performanceScore: 'asc' },
      take: query.limit || 10,
      include: { sku: true, store: true },
    });
  }

  async getSalesByDimension(query: AnalyticsQueryDto) {
    const where: Prisma.AllocationHistoryWhereInput = {};
    if (query.seasonGroup) where.seasonGroup = query.seasonGroup;
    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;
    if (query.dimensionType) where.dimensionType = query.dimensionType;

    return this.prisma.allocationHistory.findMany({
      where,
      orderBy: { allocatedAmount: 'desc' },
    });
  }

  async getSellThroughSummary(query: AnalyticsQueryDto) {
    const where: Prisma.SkuPerformanceWhereInput = { storeId: null };
    if (query.seasonGroup) where.seasonGroup = query.seasonGroup;
    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;

    const records = await this.prisma.skuPerformance.findMany({
      where,
      include: { sku: true },
      orderBy: { sellThroughPct: 'desc' },
    });

    // Group by product type from SKU
    const grouped: Record<string, {
      productType: string;
      count: number;
      avgSellThrough: number;
      avgMargin: number;
      totalRevenue: number;
      avgPerformanceScore: number;
    }> = {};

    for (const r of records) {
      const pt = r.sku?.productType || 'Unknown';
      if (!grouped[pt]) {
        grouped[pt] = { productType: pt, count: 0, avgSellThrough: 0, avgMargin: 0, totalRevenue: 0, avgPerformanceScore: 0 };
      }
      grouped[pt].count++;
      grouped[pt].avgSellThrough += Number(r.sellThroughPct);
      grouped[pt].avgMargin += Number(r.grossMarginPct);
      grouped[pt].totalRevenue += Number(r.totalRevenue);
      grouped[pt].avgPerformanceScore += r.performanceScore;
    }

    return Object.values(grouped).map(g => ({
      ...g,
      avgSellThrough: +(g.avgSellThrough / g.count).toFixed(2),
      avgMargin: +(g.avgMargin / g.count).toFixed(2),
      avgPerformanceScore: +(g.avgPerformanceScore / g.count).toFixed(0),
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUDGET ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  async getUtilizationTrend(query: AnalyticsQueryDto) {
    const where: Prisma.BudgetSnapshotWhereInput = {};
    if (query.groupBrandId) {
      where.budget = { groupBrandId: query.groupBrandId };
    }

    return this.prisma.budgetSnapshot.findMany({
      where,
      orderBy: { snapshotDate: 'asc' },
      include: { budget: { select: { budgetCode: true, groupBrand: true } } },
    });
  }

  async getBudgetAlerts(query: AnalyticsQueryDto) {
    const where: Prisma.BudgetAlertWhereInput = {};
    if (query.groupBrandId) {
      where.budget = { groupBrandId: query.groupBrandId };
    }

    return this.prisma.budgetAlert.findMany({
      where,
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      include: { budget: { select: { budgetCode: true, groupBrand: true } } },
    });
  }

  async getAllocationEfficiency(query: AnalyticsQueryDto) {
    const where: Prisma.AllocationHistoryWhereInput = {};
    if (query.seasonGroup) where.seasonGroup = query.seasonGroup;
    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;
    if (query.dimensionType) where.dimensionType = query.dimensionType;

    const records = await this.prisma.allocationHistory.findMany({
      where,
      orderBy: [{ dimensionType: 'asc' }, { allocatedAmount: 'desc' }],
    });

    return records.map(r => ({
      ...r,
      efficiency: r.actualSales
        ? +(Number(r.actualSales) / Number(r.allocatedAmount) * 100).toFixed(2)
        : null,
    }));
  }

  async getBudgetSummary(query: AnalyticsQueryDto) {
    const budgetWhere: Prisma.BudgetWhereInput = {};
    if (query.fiscalYear) budgetWhere.fiscalYear = query.fiscalYear;
    if (query.groupBrandId) budgetWhere.groupBrandId = query.groupBrandId;
    if (query.seasonGroup) budgetWhere.seasonGroupId = query.seasonGroup;

    const [budgets, alertStats, latestSnapshots] = await Promise.all([
      this.prisma.budget.findMany({
        where: budgetWhere,
        include: { groupBrand: true },
      }),
      this.prisma.budgetAlert.groupBy({
        by: ['severity'],
        where: query.groupBrandId ? { budget: { groupBrandId: query.groupBrandId } } : {},
        _count: true,
      }),
      this.prisma.budgetSnapshot.findMany({
        where: query.groupBrandId ? { budget: { groupBrandId: query.groupBrandId } } : {},
        orderBy: { snapshotDate: 'desc' },
        distinct: ['budgetId'],
      }),
    ]);

    const totalBudget = budgets.reduce((s, b) => s + Number(b.totalBudget), 0);
    const avgUtilization = latestSnapshots.length > 0
      ? latestSnapshots.reduce((s, snap) => s + Number(snap.utilizationPct), 0) / latestSnapshots.length
      : 0;
    const unreadAlerts = await this.prisma.budgetAlert.count({
      where: {
        isRead: false,
        ...(query.groupBrandId ? { budget: { groupBrandId: query.groupBrandId } } : {}),
      },
    });

    // Allocation efficiency from history
    const historyWhere: Prisma.AllocationHistoryWhereInput = {};
    if (query.fiscalYear) historyWhere.fiscalYear = query.fiscalYear;
    const history = await this.prisma.allocationHistory.findMany({
      where: { ...historyWhere, actualSales: { not: null } },
    });
    const avgEfficiency = history.length > 0
      ? history.reduce((s, h) => s + Number(h.actualSales!) / Number(h.allocatedAmount) * 100, 0) / history.length
      : 0;

    return {
      totalBudget,
      avgUtilization: +avgUtilization.toFixed(2),
      unreadAlerts,
      avgEfficiency: +avgEfficiency.toFixed(2),
      budgetCount: budgets.length,
      alertsByseverity: alertStats.reduce((acc, a) => {
        acc[a.severity] = a._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY TRENDS
  // ═══════════════════════════════════════════════════════════════════════════

  async getTrendAttributes(query: AnalyticsQueryDto) {
    const where: Prisma.AttributeTrendWhereInput = {};
    if (query.seasonGroup) where.seasonGroup = query.seasonGroup;
    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;
    if (query.attributeType) where.attributeType = query.attributeType;
    if (query.category) where.category = query.category;

    return this.prisma.attributeTrend.findMany({
      where,
      orderBy: { trendScore: 'desc' },
      take: query.limit || 50,
    });
  }

  async getYoyComparison(query: AnalyticsQueryDto) {
    const where: Prisma.AttributeTrendWhereInput = {
      yoyGrowth: { not: null },
    };
    if (query.seasonGroup) where.seasonGroup = query.seasonGroup;
    if (query.attributeType) where.attributeType = query.attributeType;

    return this.prisma.attributeTrend.findMany({
      where,
      orderBy: { yoyGrowth: 'desc' },
      take: query.limit || 30,
    });
  }

  async getGenderBreakdown(query: AnalyticsQueryDto) {
    const where: Prisma.AttributeTrendWhereInput = {
      attributeType: 'product_type',
    };
    if (query.seasonGroup) where.seasonGroup = query.seasonGroup;
    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;

    const records = await this.prisma.attributeTrend.findMany({ where });

    const genderGroups: Record<string, {
      gender: string;
      totalSkus: number;
      avgSellThrough: number;
      avgMargin: number;
      avgTrendScore: number;
      count: number;
      categories: string[];
    }> = {};

    for (const r of records) {
      const gender = r.attributeValue.startsWith('W ') ? 'Women' : r.attributeValue.startsWith('M ') ? 'Men' : 'Other';
      if (!genderGroups[gender]) {
        genderGroups[gender] = { gender, totalSkus: 0, avgSellThrough: 0, avgMargin: 0, avgTrendScore: 0, count: 0, categories: [] };
      }
      genderGroups[gender].totalSkus += r.totalSkus;
      genderGroups[gender].avgSellThrough += Number(r.avgSellThrough);
      genderGroups[gender].avgMargin += Number(r.avgMargin);
      genderGroups[gender].avgTrendScore += r.trendScore;
      genderGroups[gender].count++;
      genderGroups[gender].categories.push(r.attributeValue);
    }

    return Object.values(genderGroups).map(g => ({
      gender: g.gender,
      totalSkus: g.totalSkus,
      avgSellThrough: +(g.avgSellThrough / g.count).toFixed(2),
      avgMargin: +(g.avgMargin / g.count).toFixed(2),
      avgTrendScore: +(g.avgTrendScore / g.count).toFixed(0),
      categories: [...new Set(g.categories)],
    }));
  }
}
