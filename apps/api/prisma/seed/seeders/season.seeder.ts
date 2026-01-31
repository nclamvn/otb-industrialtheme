import { PrismaClient } from '@prisma/client';
import { BaseSeeder } from './base.seeder';
import { FieldValidator, transformers } from '../utils/validator';

export class SeasonSeeder extends BaseSeeder {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  getEntityName(): string {
    return 'Seasons';
  }

  getFilePath(): string {
    return 'master/seasons.xlsx';
  }

  getValidators(): FieldValidator[] {
    return [
      { field: 'season_code', required: true, type: 'string' },
      { field: 'season_name', required: true, type: 'string' },
      { field: 'season_group', required: true, type: 'string' },
      { field: 'year', required: true, type: 'number', min: 2020, max: 2030 },
      { field: 'start_date', required: true, type: 'date' },
      { field: 'end_date', required: true, type: 'date' },
      { field: 'is_active', type: 'boolean' },
      { field: 'is_current', type: 'boolean' },
    ];
  }

  transformRow(row: Record<string, any>) {
    return {
      code: transformers.toUpperCase(row.season_code),
      name: transformers.trim(row.season_name),
      seasonGroup: transformers.toUpperCase(row.season_group) || 'SS',
      year: transformers.toNumber(row.year) || new Date().getFullYear(),
      startDate: transformers.toDate(row.start_date),
      endDate: transformers.toDate(row.end_date),
      isActive: row.is_active !== undefined ? transformers.toBoolean(row.is_active) : true,
      isCurrent: row.is_current !== undefined ? transformers.toBoolean(row.is_current) : false,
    };
  }

  async upsertRecord(data: any): Promise<void> {
    await this.prisma.season.upsert({
      where: { code: data.code },
      create: data,
      update: {
        name: data.name,
        seasonGroup: data.seasonGroup,
        year: data.year,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        isCurrent: data.isCurrent,
      },
    });
    this.result.created++;
  }
}
