import { PrismaClient } from '@prisma/client';
import { BaseSeeder } from './base.seeder';
import { FieldValidator, transformers } from '../utils/validator';

export class StorePerformanceSeeder extends BaseSeeder {
  private locationCache: Map<string, string> = new Map();
  private seasonCache: Map<string, string> = new Map();

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  getEntityName(): string {
    return 'Store Performance';
  }

  getFilePath(): string {
    return 'performance/store-sales.xlsx';
  }

  getValidators(): FieldValidator[] {
    return [
      { field: 'location_code', required: true, type: 'string' },
      { field: 'season_code', required: true, type: 'string' },
      { field: 'period_start', required: true, type: 'date' },
      { field: 'period_end', required: true, type: 'date' },
      { field: 'sales_quantity', required: true, type: 'number', min: 0 },
      { field: 'sales_value', required: true, type: 'number', min: 0 },
      { field: 'stock_quantity', required: true, type: 'number', min: 0 },
      { field: 'stock_value', required: true, type: 'number', min: 0 },
    ];
  }

  transformRow(row: Record<string, any>) {
    const salesQuantity = transformers.toNumber(row.sales_quantity) || 0;
    const stockQuantity = transformers.toNumber(row.stock_quantity) || 0;
    const salesValue = transformers.toNumber(row.sales_value) || 0;
    const stockValue = transformers.toNumber(row.stock_value) || 0;

    // Calculate sell-through rate
    const totalUnits = salesQuantity + stockQuantity;
    const sellThru = totalUnits > 0 ? (salesQuantity / totalUnits) * 100 : 0;

    // Calculate weeks of cover (assuming 4 weeks per period)
    const avgWeeklySales = salesQuantity / 4;
    const weeksOfCover = avgWeeklySales > 0 ? stockQuantity / avgWeeklySales : 0;

    // Calculate margin (estimated)
    const margin = salesValue > 0 ? ((salesValue - stockValue * 0.4) / salesValue) * 100 : 0;

    return {
      locationCode: transformers.trim(row.location_code),
      seasonCode: transformers.toUpperCase(row.season_code),
      periodStart: transformers.toDate(row.period_start),
      periodEnd: transformers.toDate(row.period_end),
      salesQuantity,
      salesValue,
      stockQuantity,
      stockValue,
      sellThru: transformers.toDecimal(sellThru, 2),
      weeksOfCover: transformers.toDecimal(weeksOfCover, 2),
      margin: transformers.toDecimal(margin, 2),
    };
  }

  async upsertRecord(data: any): Promise<void> {
    // Get location ID
    let locationId = this.locationCache.get(data.locationCode);
    if (!locationId) {
      const location = await this.prisma.salesLocation.findUnique({
        where: { code: data.locationCode },
      });
      if (!location) {
        throw new Error(`Location not found: ${data.locationCode}`);
      }
      locationId = location.id;
      this.locationCache.set(data.locationCode, locationId);
    }

    // Get season ID
    let seasonId = this.seasonCache.get(data.seasonCode);
    if (!seasonId) {
      const season = await this.prisma.season.findUnique({
        where: { code: data.seasonCode },
      });
      if (!season) {
        throw new Error(`Season not found: ${data.seasonCode}`);
      }
      seasonId = season.id;
      this.seasonCache.set(data.seasonCode, seasonId);
    }

    // Find existing or create
    const existing = await this.prisma.storePerformance.findFirst({
      where: {
        locationId,
        seasonId,
        periodStart: data.periodStart,
      },
    });

    if (existing) {
      await this.prisma.storePerformance.update({
        where: { id: existing.id },
        data: {
          periodEnd: data.periodEnd,
          salesQuantity: data.salesQuantity,
          salesValue: data.salesValue,
          stockQuantity: data.stockQuantity,
          stockValue: data.stockValue,
          sellThru: data.sellThru,
          weeksOfCover: data.weeksOfCover,
          margin: data.margin,
        },
      });
      this.result.updated++;
    } else {
      await this.prisma.storePerformance.create({
        data: {
          location: { connect: { id: locationId } },
          season: { connect: { id: seasonId } },
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          salesQuantity: data.salesQuantity,
          salesValue: data.salesValue,
          stockQuantity: data.stockQuantity,
          stockValue: data.stockValue,
          sellThru: data.sellThru,
          weeksOfCover: data.weeksOfCover,
          margin: data.margin,
        },
      });
      this.result.created++;
    }
  }
}
