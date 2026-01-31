import { PrismaClient } from '@prisma/client';
import { BaseSeeder } from './base.seeder';
import { FieldValidator, transformers } from '../utils/validator';

export class BudgetSeeder extends BaseSeeder {
  private seasonCache: Map<string, string> = new Map();
  private brandCache: Map<string, string> = new Map();
  private locationCache: Map<string, string> = new Map();
  private systemUserId: string | null = null;

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  private async getSystemUserId(): Promise<string> {
    if (this.systemUserId) return this.systemUserId;

    // Find or create system user for seeding
    let user = await this.prisma.user.findFirst({
      where: { email: 'system@dafc.vn' },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'system@dafc.vn',
          name: 'System User',
          password: 'not-used', // System user can't login
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
    }

    this.systemUserId = user.id;
    return this.systemUserId;
  }

  getEntityName(): string {
    return 'Budget Allocations';
  }

  getFilePath(): string {
    return 'planning/budgets.xlsx';
  }

  getValidators(): FieldValidator[] {
    return [
      { field: 'season_code', required: true, type: 'string' },
      { field: 'brand_code', required: true, type: 'string' },
      { field: 'location_code', required: true, type: 'string' },
      { field: 'total_budget', required: true, type: 'number', min: 0 },
      { field: 'seasonal_budget', type: 'number', min: 0 },
      { field: 'replenishment_budget', type: 'number', min: 0 },
      { field: 'currency', type: 'string' },
      { field: 'status', enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] },
    ];
  }

  transformRow(row: Record<string, any>) {
    return {
      seasonCode: transformers.toUpperCase(row.season_code),
      brandCode: transformers.toUpperCase(row.brand_code),
      locationCode: transformers.trim(row.location_code),
      totalBudget: transformers.toNumber(row.total_budget) || 0,
      seasonalBudget: transformers.toNumber(row.seasonal_budget),
      replenishmentBudget: transformers.toNumber(row.replenishment_budget),
      currency: transformers.toUpperCase(row.currency) || 'USD',
      status: transformers.toUpperCase(row.status) || 'DRAFT',
    };
  }

  async upsertRecord(data: any): Promise<void> {
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

    // Get brand ID
    let brandId = this.brandCache.get(data.brandCode);
    if (!brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { code: data.brandCode },
      });
      if (!brand) {
        throw new Error(`Brand not found: ${data.brandCode}`);
      }
      brandId = brand.id;
      this.brandCache.set(data.brandCode, brandId);
    }

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

    // Find existing or create
    const existing = await this.prisma.budgetAllocation.findFirst({
      where: {
        seasonId,
        brandId,
        locationId,
        version: 1,
      },
    });

    const systemUserId = await this.getSystemUserId();

    if (existing) {
      await this.prisma.budgetAllocation.update({
        where: { id: existing.id },
        data: {
          totalBudget: data.totalBudget,
          seasonalBudget: data.seasonalBudget,
          replenishmentBudget: data.replenishmentBudget,
          currency: data.currency,
          status: data.status,
        },
      });
      this.result.updated++;
    } else {
      await this.prisma.budgetAllocation.create({
        data: {
          season: { connect: { id: seasonId } },
          brand: { connect: { id: brandId } },
          location: { connect: { id: locationId } },
          createdBy: { connect: { id: systemUserId } },
          totalBudget: data.totalBudget,
          seasonalBudget: data.seasonalBudget,
          replenishmentBudget: data.replenishmentBudget,
          currency: data.currency,
          status: data.status,
          version: 1,
        },
      });
      this.result.created++;
    }
  }
}
