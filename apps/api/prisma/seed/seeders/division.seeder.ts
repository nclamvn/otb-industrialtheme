import { PrismaClient } from '@prisma/client';
import { BaseSeeder } from './base.seeder';
import { FieldValidator, transformers } from '../utils/validator';

export class DivisionSeeder extends BaseSeeder {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  getEntityName(): string {
    return 'Divisions';
  }

  getFilePath(): string {
    return 'master/divisions.xlsx';
  }

  getValidators(): FieldValidator[] {
    return [
      { field: 'division_code', required: true, type: 'string' },
      { field: 'division_name', required: true, type: 'string' },
      { field: 'description', type: 'string' },
      { field: 'is_active', type: 'boolean' },
      { field: 'sort_order', type: 'number' },
    ];
  }

  transformRow(row: Record<string, any>) {
    return {
      code: transformers.toUpperCase(row.division_code),
      name: transformers.trim(row.division_name),
      description: transformers.trim(row.description),
      isActive: row.is_active !== undefined ? transformers.toBoolean(row.is_active) : true,
      sortOrder: transformers.toNumber(row.sort_order) || 0,
    };
  }

  async upsertRecord(data: any): Promise<void> {
    await this.prisma.division.upsert({
      where: { code: data.code },
      create: data,
      update: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });
    this.result.created++;
  }
}
