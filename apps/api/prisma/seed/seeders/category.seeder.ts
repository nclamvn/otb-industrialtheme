import { PrismaClient } from '@prisma/client';
import { BaseSeeder } from './base.seeder';
import { FieldValidator, transformers } from '../utils/validator';

export class CategorySeeder extends BaseSeeder {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  getEntityName(): string {
    return 'Categories';
  }

  getFilePath(): string {
    return 'master/categories.xlsx';
  }

  getValidators(): FieldValidator[] {
    return [
      { field: 'category_code', required: true, type: 'string' },
      { field: 'category_name', required: true, type: 'string' },
      { field: 'description', type: 'string' },
      { field: 'is_active', type: 'boolean' },
      { field: 'sort_order', type: 'number' },
    ];
  }

  transformRow(row: Record<string, any>) {
    return {
      code: transformers.toUpperCase(row.category_code),
      name: transformers.trim(row.category_name),
      description: transformers.trim(row.description),
      isActive: row.is_active !== undefined ? transformers.toBoolean(row.is_active) : true,
      sortOrder: transformers.toNumber(row.sort_order) || 0,
    };
  }

  async upsertRecord(data: any): Promise<void> {
    await this.prisma.category.upsert({
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
