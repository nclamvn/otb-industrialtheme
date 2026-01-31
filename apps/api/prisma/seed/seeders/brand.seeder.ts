import { PrismaClient } from '@prisma/client';
import { BaseSeeder } from './base.seeder';
import { FieldValidator, transformers } from '../utils/validator';

export class BrandSeeder extends BaseSeeder {
  private divisionCache: Map<string, string> = new Map();

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  getEntityName(): string {
    return 'Brands';
  }

  getFilePath(): string {
    return 'master/brands.xlsx';
  }

  getValidators(): FieldValidator[] {
    return [
      { field: 'brand_code', required: true, type: 'string' },
      { field: 'brand_name', required: true, type: 'string' },
      { field: 'division_code', required: true, type: 'string' },
      { field: 'description', type: 'string' },
      { field: 'logo_url', type: 'string' },
      { field: 'is_active', type: 'boolean' },
      { field: 'sort_order', type: 'number' },
    ];
  }

  transformRow(row: Record<string, any>) {
    return {
      code: transformers.toUpperCase(row.brand_code),
      name: transformers.trim(row.brand_name),
      divisionCode: transformers.toUpperCase(row.division_code),
      description: transformers.trim(row.description),
      logoUrl: transformers.trim(row.logo_url),
      isActive: row.is_active !== undefined ? transformers.toBoolean(row.is_active) : true,
      sortOrder: transformers.toNumber(row.sort_order) || 0,
    };
  }

  async upsertRecord(data: any): Promise<void> {
    // Get division ID
    let divisionId = this.divisionCache.get(data.divisionCode);
    if (!divisionId) {
      const division = await this.prisma.division.findUnique({
        where: { code: data.divisionCode },
      });
      if (!division) {
        throw new Error(`Division not found: ${data.divisionCode}`);
      }
      divisionId = division.id;
      this.divisionCache.set(data.divisionCode, divisionId);
    }

    await this.prisma.brand.upsert({
      where: { code: data.code },
      create: {
        code: data.code,
        name: data.name,
        divisionId,
        description: data.description,
        logoUrl: data.logoUrl,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
      update: {
        name: data.name,
        divisionId,
        description: data.description,
        logoUrl: data.logoUrl,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });
    this.result.created++;
  }
}
