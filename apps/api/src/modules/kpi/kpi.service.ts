import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Fashion KPI Benchmarks
export const KPI_BENCHMARKS = {
  GMROI: {
    excellent: 3.0,
    good: 2.0,
    acceptable: 1.5,
    poor: 1.0,
  },
  SELL_THROUGH: {
    excellent: 85,
    good: 70,
    acceptable: 55,
    poor: 40,
  },
  WEEKS_OF_COVER: {
    min: 4,
    target: 5,
    max: 6,
    critical_low: 2,
    critical_high: 10,
  },
  GROSS_MARGIN: {
    excellent: 65,
    good: 55,
    acceptable: 45,
    poor: 35,
  },
  MARKDOWN: {
    excellent: 10,
    good: 15,
    acceptable: 20,
    poor: 30,
  },
  PLAN_ACCURACY: {
    excellent: 95,
    good: 85,
    acceptable: 75,
    poor: 60,
  },
};

export interface KPIResult {
  value: number;
  benchmark: string;
  status: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  trend?: number;
  previousValue?: number;
}

export interface FashionKPIs {
  gmroi: KPIResult;
  sellThrough: KPIResult;
  weeksOfCover: KPIResult;
  grossMargin: KPIResult;
  markdownPercent: KPIResult;
  planAccuracy: KPIResult;
  stockTurnover: KPIResult;
  inventoryToSalesRatio: KPIResult;
}

@Injectable()
export class KpiService {
  constructor(private prisma: PrismaService) {}

  // ============ KPI CALCULATIONS ============

  /**
   * GMROI = Gross Margin / Average Inventory Cost
   * Measures how much gross profit you make for every dollar invested in inventory
   */
  calculateGMROI(grossMargin: number, averageInventoryCost: number): KPIResult {
    const value = averageInventoryCost > 0 ? grossMargin / averageInventoryCost : 0;
    const roundedValue = Math.round(value * 100) / 100;

    let status: KPIResult['status'] = 'poor';
    if (roundedValue >= KPI_BENCHMARKS.GMROI.excellent) status = 'excellent';
    else if (roundedValue >= KPI_BENCHMARKS.GMROI.good) status = 'good';
    else if (roundedValue >= KPI_BENCHMARKS.GMROI.acceptable) status = 'acceptable';

    return {
      value: roundedValue,
      benchmark: `>${KPI_BENCHMARKS.GMROI.good} (good), >${KPI_BENCHMARKS.GMROI.excellent} (excellent)`,
      status,
    };
  }

  /**
   * Sell-Through Rate = (Units Sold / Units Available) * 100
   * Measures how quickly inventory is selling
   */
  calculateSellThrough(unitsSold: number, unitsAvailable: number): KPIResult {
    const value = unitsAvailable > 0 ? (unitsSold / unitsAvailable) * 100 : 0;
    const roundedValue = Math.round(value * 10) / 10;

    let status: KPIResult['status'] = 'poor';
    if (roundedValue >= KPI_BENCHMARKS.SELL_THROUGH.excellent) status = 'excellent';
    else if (roundedValue >= KPI_BENCHMARKS.SELL_THROUGH.good) status = 'good';
    else if (roundedValue >= KPI_BENCHMARKS.SELL_THROUGH.acceptable) status = 'acceptable';

    return {
      value: roundedValue,
      benchmark: `${KPI_BENCHMARKS.SELL_THROUGH.good}-${KPI_BENCHMARKS.SELL_THROUGH.excellent}% (target)`,
      status,
    };
  }

  /**
   * Weeks of Cover = Current Stock / Average Weekly Sales
   * How many weeks the current stock will last
   */
  calculateWeeksOfCover(currentStock: number, averageWeeklySales: number): KPIResult {
    const value = averageWeeklySales > 0 ? currentStock / averageWeeklySales : 0;
    const roundedValue = Math.round(value * 10) / 10;

    let status: KPIResult['status'] = 'good';
    if (roundedValue < KPI_BENCHMARKS.WEEKS_OF_COVER.critical_low) {
      status = 'critical';
    } else if (roundedValue < KPI_BENCHMARKS.WEEKS_OF_COVER.min) {
      status = 'poor';
    } else if (roundedValue > KPI_BENCHMARKS.WEEKS_OF_COVER.critical_high) {
      status = 'critical';
    } else if (roundedValue > KPI_BENCHMARKS.WEEKS_OF_COVER.max) {
      status = 'acceptable';
    } else if (
      roundedValue >= KPI_BENCHMARKS.WEEKS_OF_COVER.min &&
      roundedValue <= KPI_BENCHMARKS.WEEKS_OF_COVER.max
    ) {
      status = 'excellent';
    }

    return {
      value: roundedValue,
      benchmark: `${KPI_BENCHMARKS.WEEKS_OF_COVER.min}-${KPI_BENCHMARKS.WEEKS_OF_COVER.max} weeks (optimal)`,
      status,
    };
  }

  /**
   * Gross Margin % = ((Revenue - COGS) / Revenue) * 100
   */
  calculateGrossMargin(revenue: number, cogs: number): KPIResult {
    const value = revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0;
    const roundedValue = Math.round(value * 10) / 10;

    let status: KPIResult['status'] = 'poor';
    if (roundedValue >= KPI_BENCHMARKS.GROSS_MARGIN.excellent) status = 'excellent';
    else if (roundedValue >= KPI_BENCHMARKS.GROSS_MARGIN.good) status = 'good';
    else if (roundedValue >= KPI_BENCHMARKS.GROSS_MARGIN.acceptable) status = 'acceptable';

    return {
      value: roundedValue,
      benchmark: `${KPI_BENCHMARKS.GROSS_MARGIN.good}-${KPI_BENCHMARKS.GROSS_MARGIN.excellent}% (target)`,
      status,
    };
  }

  /**
   * Markdown % = (Total Markdown Value / Original Retail Value) * 100
   * Lower is better
   */
  calculateMarkdownPercent(markdownValue: number, originalRetailValue: number): KPIResult {
    const value = originalRetailValue > 0 ? (markdownValue / originalRetailValue) * 100 : 0;
    const roundedValue = Math.round(value * 10) / 10;

    let status: KPIResult['status'] = 'poor';
    if (roundedValue <= KPI_BENCHMARKS.MARKDOWN.excellent) status = 'excellent';
    else if (roundedValue <= KPI_BENCHMARKS.MARKDOWN.good) status = 'good';
    else if (roundedValue <= KPI_BENCHMARKS.MARKDOWN.acceptable) status = 'acceptable';

    return {
      value: roundedValue,
      benchmark: `<${KPI_BENCHMARKS.MARKDOWN.acceptable}% (acceptable), <${KPI_BENCHMARKS.MARKDOWN.excellent}% (excellent)`,
      status,
    };
  }

  /**
   * Plan Accuracy = (1 - |Actual - Plan| / Plan) * 100
   */
  calculatePlanAccuracy(actual: number, plan: number): KPIResult {
    const value = plan > 0 ? (1 - Math.abs(actual - plan) / plan) * 100 : 0;
    const roundedValue = Math.max(0, Math.round(value * 10) / 10);

    let status: KPIResult['status'] = 'poor';
    if (roundedValue >= KPI_BENCHMARKS.PLAN_ACCURACY.excellent) status = 'excellent';
    else if (roundedValue >= KPI_BENCHMARKS.PLAN_ACCURACY.good) status = 'good';
    else if (roundedValue >= KPI_BENCHMARKS.PLAN_ACCURACY.acceptable) status = 'acceptable';

    return {
      value: roundedValue,
      benchmark: `>${KPI_BENCHMARKS.PLAN_ACCURACY.good}% (good)`,
      status,
    };
  }

  /**
   * Stock Turnover = COGS / Average Inventory
   * Number of times inventory is sold and replaced in a period
   */
  calculateStockTurnover(cogs: number, averageInventory: number): KPIResult {
    const value = averageInventory > 0 ? cogs / averageInventory : 0;
    const roundedValue = Math.round(value * 100) / 100;

    let status: KPIResult['status'] = 'acceptable';
    if (roundedValue >= 6) status = 'excellent';
    else if (roundedValue >= 4) status = 'good';
    else if (roundedValue < 2) status = 'poor';

    return {
      value: roundedValue,
      benchmark: '4-6x per year (target)',
      status,
    };
  }

  /**
   * Inventory to Sales Ratio = Average Inventory / Net Sales
   * Lower is generally better (more efficient)
   */
  calculateInventoryToSalesRatio(averageInventory: number, netSales: number): KPIResult {
    const value = netSales > 0 ? averageInventory / netSales : 0;
    const roundedValue = Math.round(value * 100) / 100;

    let status: KPIResult['status'] = 'acceptable';
    if (roundedValue <= 0.15) status = 'excellent';
    else if (roundedValue <= 0.25) status = 'good';
    else if (roundedValue > 0.4) status = 'poor';

    return {
      value: roundedValue,
      benchmark: '<0.25 (good)',
      status,
    };
  }

  // ============ AGGREGATED KPI REPORTS ============

  async getBrandKPIs(
    brandId: string,
    query: { seasonId?: string; startDate?: Date; endDate?: Date },
  ): Promise<FashionKPIs> {
    // Get WSSI data for the brand
    const wssiWhere: any = { brandId };
    if (query.seasonId) wssiWhere.seasonId = query.seasonId;

    const wssiRecords = await this.prisma.wSSIRecord.findMany({
      where: wssiWhere,
      orderBy: { weekNumber: 'desc' },
      take: 13, // Last quarter (13 weeks)
    });

    if (wssiRecords.length === 0) {
      return this.getEmptyKPIs();
    }

    // Calculate aggregated values
    const totalSalesActual = wssiRecords.reduce((sum, r) => sum + Number(r.salesActualValue), 0);
    const totalSalesPlan = wssiRecords.reduce((sum, r) => sum + Number(r.salesPlanValue), 0);
    const totalOpeningStock = wssiRecords.reduce((sum, r) => sum + Number(r.openingStockValue), 0);
    const totalIntakeActual = wssiRecords.reduce((sum, r) => sum + Number(r.intakeActualValue), 0);
    const latestClosingStock = Number(wssiRecords[0]?.closingStockValue || 0);
    const avgWeeklySales = totalSalesActual / wssiRecords.length;

    // Calculate units for sell-through
    const totalUnitsAvailable = wssiRecords.reduce(
      (sum, r) => sum + r.openingStockUnits + r.intakeActualUnits,
      0,
    );
    const totalUnitsSold = wssiRecords.reduce((sum, r) => sum + r.salesActualUnits, 0);

    // Estimate COGS and margins (typically 40-50% of retail)
    const estimatedCOGS = totalSalesActual * 0.45;
    const grossProfit = totalSalesActual - estimatedCOGS;
    const avgInventoryCost = (totalOpeningStock * 0.45 + latestClosingStock * 0.45) / 2;

    // Markdown calculation
    const totalMarkdown = wssiRecords.reduce(
      (sum, r) => sum + Number(r.markdownActualValue || 0),
      0,
    );

    return {
      gmroi: this.calculateGMROI(grossProfit, avgInventoryCost),
      sellThrough: this.calculateSellThrough(totalUnitsSold, totalUnitsAvailable),
      weeksOfCover: this.calculateWeeksOfCover(latestClosingStock, avgWeeklySales),
      grossMargin: this.calculateGrossMargin(totalSalesActual, estimatedCOGS),
      markdownPercent: this.calculateMarkdownPercent(
        totalMarkdown,
        totalSalesActual + totalMarkdown,
      ),
      planAccuracy: this.calculatePlanAccuracy(totalSalesActual, totalSalesPlan),
      stockTurnover: this.calculateStockTurnover(estimatedCOGS, avgInventoryCost * 2),
      inventoryToSalesRatio: this.calculateInventoryToSalesRatio(
        avgInventoryCost * 2,
        totalSalesActual,
      ),
    };
  }

  async getCategoryKPIs(
    categoryId: string,
    query: { brandId?: string; seasonId?: string },
  ): Promise<FashionKPIs> {
    const wssiWhere: any = { categoryId };
    if (query.brandId) wssiWhere.brandId = query.brandId;
    if (query.seasonId) wssiWhere.seasonId = query.seasonId;

    const wssiRecords = await this.prisma.wSSIRecord.findMany({
      where: wssiWhere,
      orderBy: { weekNumber: 'desc' },
      take: 13,
    });

    if (wssiRecords.length === 0) {
      return this.getEmptyKPIs();
    }

    // Same calculations as brand KPIs
    const totalSalesActual = wssiRecords.reduce((sum, r) => sum + Number(r.salesActualValue), 0);
    const totalSalesPlan = wssiRecords.reduce((sum, r) => sum + Number(r.salesPlanValue), 0);
    const totalOpeningStock = wssiRecords.reduce((sum, r) => sum + Number(r.openingStockValue), 0);
    const latestClosingStock = Number(wssiRecords[0]?.closingStockValue || 0);
    const avgWeeklySales = totalSalesActual / wssiRecords.length;

    const totalUnitsAvailable = wssiRecords.reduce(
      (sum, r) => sum + r.openingStockUnits + r.intakeActualUnits,
      0,
    );
    const totalUnitsSold = wssiRecords.reduce((sum, r) => sum + r.salesActualUnits, 0);

    const estimatedCOGS = totalSalesActual * 0.45;
    const grossProfit = totalSalesActual - estimatedCOGS;
    const avgInventoryCost = (totalOpeningStock * 0.45 + latestClosingStock * 0.45) / 2;

    const totalMarkdown = wssiRecords.reduce(
      (sum, r) => sum + Number(r.markdownActualValue || 0),
      0,
    );

    return {
      gmroi: this.calculateGMROI(grossProfit, avgInventoryCost),
      sellThrough: this.calculateSellThrough(totalUnitsSold, totalUnitsAvailable),
      weeksOfCover: this.calculateWeeksOfCover(latestClosingStock, avgWeeklySales),
      grossMargin: this.calculateGrossMargin(totalSalesActual, estimatedCOGS),
      markdownPercent: this.calculateMarkdownPercent(
        totalMarkdown,
        totalSalesActual + totalMarkdown,
      ),
      planAccuracy: this.calculatePlanAccuracy(totalSalesActual, totalSalesPlan),
      stockTurnover: this.calculateStockTurnover(estimatedCOGS, avgInventoryCost * 2),
      inventoryToSalesRatio: this.calculateInventoryToSalesRatio(
        avgInventoryCost * 2,
        totalSalesActual,
      ),
    };
  }

  async getDashboardKPIs(query: {
    divisionId?: string;
    seasonId?: string;
    year?: number;
  }) {
    const wssiWhere: any = {};
    if (query.divisionId) wssiWhere.divisionId = query.divisionId;
    if (query.seasonId) wssiWhere.seasonId = query.seasonId;
    if (query.year) wssiWhere.year = query.year;

    // Get current period data
    const currentRecords = await this.prisma.wSSIRecord.findMany({
      where: wssiWhere,
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    // Group by brand for comparison
    const brandMap = new Map<string, any[]>();
    currentRecords.forEach((record) => {
      const brandId = record.brandId;
      if (!brandMap.has(brandId)) {
        brandMap.set(brandId, []);
      }
      brandMap.get(brandId)!.push(record);
    });

    // Calculate KPIs per brand
    const brandKPIs = await Promise.all(
      Array.from(brandMap.entries()).map(async ([brandId, records]) => {
        const brand = records[0].brand;
        const kpis = await this.getBrandKPIs(brandId, { seasonId: query.seasonId });
        return {
          brandId,
          brandName: brand.name,
          kpis,
        };
      }),
    );

    // Calculate overall KPIs
    const totalSalesActual = currentRecords.reduce(
      (sum, r) => sum + Number(r.salesActualValue),
      0,
    );
    const totalSalesPlan = currentRecords.reduce((sum, r) => sum + Number(r.salesPlanValue), 0);
    const avgWoC =
      currentRecords.reduce((sum, r) => sum + Number(r.weeksOfCover), 0) / currentRecords.length ||
      0;
    const avgSellThrough =
      currentRecords.reduce((sum, r) => sum + Number(r.sellThroughPct), 0) / currentRecords.length ||
      0;
    const avgSalesVariance =
      currentRecords.reduce((sum, r) => sum + Number(r.salesVariancePct), 0) /
        currentRecords.length || 0;

    return {
      summary: {
        totalRecords: currentRecords.length,
        totalBrands: brandMap.size,
        totalSalesActual,
        totalSalesPlan,
        salesVariance: totalSalesPlan > 0 ? ((totalSalesActual - totalSalesPlan) / totalSalesPlan) * 100 : 0,
        avgWeeksOfCover: Math.round(avgWoC * 10) / 10,
        avgSellThrough: Math.round(avgSellThrough * 10) / 10,
        avgSalesVariance: Math.round(avgSalesVariance * 10) / 10,
      },
      byBrand: brandKPIs,
      alerts: {
        lowStock: currentRecords.filter((r) => Number(r.weeksOfCover) < 3).length,
        highStock: currentRecords.filter((r) => Number(r.weeksOfCover) > 8).length,
        belowPlan: currentRecords.filter((r) => Number(r.salesVariancePct) < -10).length,
        abovePlan: currentRecords.filter((r) => Number(r.salesVariancePct) > 10).length,
      },
      benchmarks: KPI_BENCHMARKS,
    };
  }

  async getKPITrend(
    brandId: string,
    kpiName: keyof FashionKPIs,
    query: { weeks?: number; seasonId?: string },
  ) {
    const weeks = query.weeks || 12;

    const wssiWhere: any = { brandId };
    if (query.seasonId) wssiWhere.seasonId = query.seasonId;

    const records = await this.prisma.wSSIRecord.findMany({
      where: wssiWhere,
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
      take: weeks,
    });

    // Reverse to get chronological order
    records.reverse();

    return records.map((record) => {
      let value: number;
      switch (kpiName) {
        case 'weeksOfCover':
          value = Number(record.weeksOfCover);
          break;
        case 'sellThrough':
          value = Number(record.sellThroughPct);
          break;
        case 'planAccuracy':
          value =
            Number(record.salesPlanValue) > 0
              ? (1 -
                  Math.abs(
                    Number(record.salesActualValue) - Number(record.salesPlanValue),
                  ) /
                    Number(record.salesPlanValue)) *
                100
              : 0;
          break;
        default:
          value = Number(record.salesVariancePct);
      }

      return {
        week: `W${record.weekNumber}`,
        year: record.year,
        value: Math.round(value * 10) / 10,
      };
    });
  }

  private getEmptyKPIs(): FashionKPIs {
    const emptyKPI: KPIResult = {
      value: 0,
      benchmark: 'N/A',
      status: 'poor',
    };

    return {
      gmroi: emptyKPI,
      sellThrough: emptyKPI,
      weeksOfCover: emptyKPI,
      grossMargin: emptyKPI,
      markdownPercent: emptyKPI,
      planAccuracy: emptyKPI,
      stockTurnover: emptyKPI,
      inventoryToSalesRatio: emptyKPI,
    };
  }
}
