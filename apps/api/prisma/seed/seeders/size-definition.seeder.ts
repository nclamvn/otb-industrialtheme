import { PrismaClient } from '@prisma/client';
import { BaseSeeder } from './base.seeder';
import { FieldValidator, transformers } from '../utils/validator';

export class SizeDefinitionSeeder extends BaseSeeder {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  getEntityName(): string {
    return 'Size Definitions';
  }

  getFilePath(): string {
    return 'master/size-definitions.xlsx';
  }

  getValidators(): FieldValidator[] {
    return [
      { field: 'size_code', required: true, type: 'string' },
      { field: 'size_name', required: true, type: 'string' },
      { field: 'size_order', required: true, type: 'number', min: 1 },
      { field: 'size_type', required: true, enum: ['ALPHA', 'NUMERIC', 'WAIST', 'SHOE', 'ONE_SIZE'] },
      { field: 'numeric_equivalent', type: 'string' },
      { field: 'is_active', type: 'boolean' },
    ];
  }

  transformRow(row: Record<string, any>) {
    return {
      sizeCode: transformers.toUpperCase(row.size_code),
      sizeName: transformers.trim(row.size_name),
      sizeOrder: transformers.toNumber(row.size_order) || 1,
      sizeType: transformers.toUpperCase(row.size_type) || 'ALPHA',
      numericEquivalent: transformers.trim(row.numeric_equivalent),
      isActive: row.is_active !== undefined ? transformers.toBoolean(row.is_active) : true,
    };
  }

  async upsertRecord(data: any): Promise<void> {
    await this.prisma.sizeDefinition.upsert({
      where: { sizeCode: data.sizeCode },
      create: data,
      update: {
        sizeName: data.sizeName,
        sizeOrder: data.sizeOrder,
        sizeType: data.sizeType,
        numericEquivalent: data.numericEquivalent,
        isActive: data.isActive,
      },
    });
    this.result.created++;
  }
}
