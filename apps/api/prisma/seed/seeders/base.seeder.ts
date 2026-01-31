import { PrismaClient } from '@prisma/client';
import { logger, SeedResult } from '../utils/logger';
import { DataValidator, FieldValidator } from '../utils/validator';
import { ExcelReader } from '../parsers/excel-reader';

export abstract class BaseSeeder {
  protected prisma: PrismaClient;
  protected reader: ExcelReader;
  protected result: SeedResult;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.reader = new ExcelReader();
    this.result = {
      entity: this.getEntityName(),
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      errorMessages: [],
    };
  }

  abstract getEntityName(): string;
  abstract getValidators(): FieldValidator[];
  abstract getFilePath(): string;
  abstract transformRow(row: Record<string, any>): any;
  abstract upsertRecord(data: any): Promise<void>;

  async seed(): Promise<SeedResult> {
    const entityName = this.getEntityName();
    logger.start(`Seeding ${entityName}...`);

    try {
      // Read Excel file
      const filePath = this.getFilePath();
      if (!this.reader.fileExists(filePath)) {
        logger.warn(`File not found: ${filePath}`);
        this.result.skipped = 1;
        logger.succeed(`${entityName} skipped (file not found)`);
        return this.result;
      }

      const file = await this.reader.readExcelJS(filePath);
      const sheet = file.sheets[0]; // Use first sheet by default

      if (!sheet || sheet.rows.length === 0) {
        logger.warn(`No data found in ${filePath}`);
        this.result.skipped = 1;
        logger.succeed(`${entityName} skipped (no data)`);
        return this.result;
      }

      // Validate data
      const validator = new DataValidator(this.getValidators());
      const { validRows, invalidRows } = validator.validateAll(sheet.rows);

      if (invalidRows.length > 0) {
        logger.warn(`${invalidRows.length} invalid rows found`);
        invalidRows.slice(0, 5).forEach(({ errors }) => {
          errors.forEach(err => logger.error(`  ${err}`));
        });
        this.result.errors = invalidRows.length;
        this.result.errorMessages = invalidRows.flatMap(r => r.errors);
      }

      // Process valid rows
      for (const row of validRows) {
        try {
          const data = this.transformRow(row);
          await this.upsertRecord(data);
        } catch (error: any) {
          this.result.errors++;
          this.result.errorMessages?.push(error.message);
        }
      }

      logger.succeed(`${entityName} seeded: ${this.result.created} created, ${this.result.updated} updated`);
    } catch (error: any) {
      logger.fail(`Failed to seed ${entityName}: ${error.message}`);
      this.result.errors++;
      this.result.errorMessages?.push(error.message);
    }

    return this.result;
  }

  protected async findOrCreate<T>(
    model: any,
    where: any,
    create: any,
    update?: any
  ): Promise<{ record: T; created: boolean }> {
    const existing = await model.findFirst({ where });

    if (existing) {
      if (update) {
        const updated = await model.update({
          where: { id: existing.id },
          data: update,
        });
        this.result.updated++;
        return { record: updated, created: false };
      }
      this.result.skipped++;
      return { record: existing, created: false };
    }

    const created = await model.create({ data: create });
    this.result.created++;
    return { record: created, created: true };
  }
}
