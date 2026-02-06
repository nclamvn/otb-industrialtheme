import { PrismaClient } from '@prisma/client';
import { BaseSeeder } from './base.seeder';
import { FieldValidator, transformers } from '../utils/validator';
import { logger } from '../utils/logger';

interface SizeDistributionInput {
  sizeCode: string;
  percentage: number;
}

export class SizeProfileSeeder extends BaseSeeder {
  private categoryCache: Map<string, string> = new Map();
  private sizeCache: Map<string, string> = new Map();

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  getEntityName(): string {
    return 'Size Profiles';
  }

  getFilePath(): string {
    return 'sku/size-profiles.xlsx';
  }

  getValidators(): FieldValidator[] {
    return [
      { field: 'category_code', required: true, type: 'string' },
      { field: 'profile_type', enum: ['HISTORICAL', 'CURRENT_TREND', 'SYSTEM_OPTIMAL', 'USER_ADJUSTED', 'FINAL'] },
      { field: 'based_on_units', type: 'number', min: 0 },
      // Size columns: xs, s, m, l, xl, xxl
      { field: 'xs', type: 'number', min: 0, max: 100 },
      { field: 's', type: 'number', min: 0, max: 100 },
      { field: 'm', type: 'number', min: 0, max: 100 },
      { field: 'l', type: 'number', min: 0, max: 100 },
      { field: 'xl', type: 'number', min: 0, max: 100 },
      { field: 'xxl', type: 'number', min: 0, max: 100 },
    ];
  }

  transformRow(row: Record<string, any>) {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const distributions: SizeDistributionInput[] = [];

    sizes.forEach((size) => {
      const key = size.toLowerCase();
      const percentage = transformers.toNumber(row[key]);
      if (percentage !== null && percentage > 0) {
        distributions.push({
          sizeCode: size,
          percentage,
        });
      }
    });

    return {
      categoryCode: transformers.toUpperCase(row.category_code),
      profileType: transformers.toUpperCase(row.profile_type) || 'HISTORICAL',
      basedOnUnits: transformers.toNumber(row.based_on_units),
      distributions,
    };
  }

  async upsertRecord(data: any): Promise<void> {
    // Get category ID
    let categoryId = this.categoryCache.get(data.categoryCode);
    if (!categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { code: data.categoryCode },
      });
      if (!category) {
        throw new Error(`Category not found: ${data.categoryCode}`);
      }
      categoryId = category.id;
      this.categoryCache.set(data.categoryCode, categoryId);
    }

    // Validate total percentage
    const totalPercentage = data.distributions.reduce(
      (sum: number, d: SizeDistributionInput) => sum + d.percentage,
      0
    );

    if (Math.abs(totalPercentage - 100) > 0.1) {
      logger.warn(`Profile for "${data.categoryCode}" percentages sum to ${totalPercentage}%, not 100%`);
    }

    // Find existing profile (compound unique with nullable fields)
    let profile = await this.prisma.sizeProfile.findFirst({
      where: {
        categoryId,
        subcategoryId: null,
        genderId: null,
        seasonId: null,
        locationId: null,
        profileType: data.profileType,
      },
    });

    if (profile) {
      // Update existing
      profile = await this.prisma.sizeProfile.update({
        where: { id: profile.id },
        data: {
          basedOnUnits: data.basedOnUnits,
        },
      });
      this.result.updated++;
    } else {
      // Create new
      profile = await this.prisma.sizeProfile.create({
        data: {
          categoryId,
          profileType: data.profileType,
          basedOnUnits: data.basedOnUnits,
        },
      });
      this.result.created++;
    }

    // Delete existing items
    await this.prisma.sizeProfileItem.deleteMany({
      where: { profileId: profile.id },
    });

    // Create new items
    for (const dist of data.distributions) {
      // Get size ID
      let sizeId = this.sizeCache.get(dist.sizeCode);
      if (!sizeId) {
        const size = await this.prisma.sizeDefinition.findUnique({
          where: { sizeCode: dist.sizeCode },
        });
        if (!size) {
          logger.warn(`Size not found: ${dist.sizeCode}`);
          continue;
        }
        sizeId = size.id;
        this.sizeCache.set(dist.sizeCode, sizeId);
      }

      await this.prisma.sizeProfileItem.create({
        data: {
          profileId: profile.id,
          sizeId,
          percentageShare: dist.percentage,
        },
      });
    }
  }
}
