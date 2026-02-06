import { PrismaClient } from '@prisma/client';
import { BaseSeeder } from './base.seeder';
import { FieldValidator, transformers } from '../utils/validator';

export class LocationSeeder extends BaseSeeder {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  getEntityName(): string {
    return 'Locations';
  }

  getFilePath(): string {
    return 'master/locations.xlsx';
  }

  getValidators(): FieldValidator[] {
    return [
      { field: 'location_code', required: true, type: 'string' },
      { field: 'location_name', required: true, type: 'string' },
      { field: 'type', type: 'string' },
      { field: 'store_group', type: 'string' },
      { field: 'address', type: 'string' },
      { field: 'is_active', type: 'boolean' },
      { field: 'sort_order', type: 'number' },
    ];
  }

  transformRow(row: Record<string, any>) {
    return {
      code: transformers.trim(row.location_code),
      name: transformers.trim(row.location_name),
      type: transformers.toUpperCase(row.type) || 'STORE',
      storeGroup: transformers.toUpperCase(row.store_group),
      address: transformers.trim(row.address),
      isActive: row.is_active !== undefined ? transformers.toBoolean(row.is_active) : true,
      sortOrder: transformers.toNumber(row.sort_order) || 0,
    };
  }

  async upsertRecord(data: any): Promise<void> {
    await this.prisma.salesLocation.upsert({
      where: { code: data.code },
      create: data,
      update: {
        name: data.name,
        type: data.type,
        storeGroup: data.storeGroup,
        address: data.address,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });
    this.result.created++;
  }
}
