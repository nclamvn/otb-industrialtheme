import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateSizeDefinitionDto,
  UpdateSizeDefinitionDto,
  CreateSizeProfileDto,
  UpdateSizeProfileDto,
  QuerySizeProfileDto,
  OptimizeSizeProfileDto,
  SizeProfileType,
  BulkUpdateSizeItemsDto,
} from './dto/size-profile.dto';

@Injectable()
export class SizeProfilesService {
  constructor(private prisma: PrismaService) {}

  // ============ SIZE DEFINITIONS ============

  async findAllSizeDefinitions(query: { sizeType?: string; isActive?: boolean }) {
    const where: Prisma.SizeDefinitionWhereInput = {};
    if (query.sizeType) where.sizeType = query.sizeType as any;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.prisma.sizeDefinition.findMany({
      where,
      orderBy: [{ sizeType: 'asc' }, { sizeOrder: 'asc' }],
    });
  }

  async findOneSizeDefinition(id: string) {
    const size = await this.prisma.sizeDefinition.findUnique({
      where: { id },
      include: {
        profiles: {
          include: {
            profile: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!size) {
      throw new NotFoundException('Size definition not found');
    }

    return size;
  }

  async createSizeDefinition(dto: CreateSizeDefinitionDto) {
    // Check for duplicate sizeCode
    const existing = await this.prisma.sizeDefinition.findUnique({
      where: { sizeCode: dto.sizeCode },
    });

    if (existing) {
      throw new ConflictException(`Size code ${dto.sizeCode} already exists`);
    }

    return this.prisma.sizeDefinition.create({
      data: {
        sizeCode: dto.sizeCode,
        sizeName: dto.sizeName,
        sizeOrder: dto.sizeOrder,
        sizeType: dto.sizeType,
        numericEquivalent: dto.numericEquivalent,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateSizeDefinition(id: string, dto: UpdateSizeDefinitionDto) {
    const existing = await this.prisma.sizeDefinition.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Size definition not found');
    }

    return this.prisma.sizeDefinition.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSizeDefinition(id: string) {
    const existing = await this.prisma.sizeDefinition.findUnique({
      where: { id },
      include: { profiles: true },
    });

    if (!existing) {
      throw new NotFoundException('Size definition not found');
    }

    if (existing.profiles.length > 0) {
      throw new BadRequestException('Cannot delete size with existing profile items');
    }

    await this.prisma.sizeDefinition.delete({ where: { id } });
    return { deleted: true };
  }

  // ============ SIZE PROFILES ============

  async findAllSizeProfiles(query: QuerySizeProfileDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.SizeProfileWhereInput = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.subcategoryId) where.subcategoryId = query.subcategoryId;
    if (query.seasonId) where.seasonId = query.seasonId;
    if (query.locationId) where.locationId = query.locationId;
    if (query.profileType) where.profileType = query.profileType;

    const [data, total] = await Promise.all([
      this.prisma.sizeProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, code: true } },
          subcategory: { select: { id: true, name: true, code: true } },
          season: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              size: true,
            },
            orderBy: { size: { sizeOrder: 'asc' } },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.sizeProfile.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneSizeProfile(id: string) {
    const profile = await this.prisma.sizeProfile.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        season: true,
        location: true,
        items: {
          include: { size: true },
          orderBy: { size: { sizeOrder: 'asc' } },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException('Size profile not found');
    }

    return profile;
  }

  async createSizeProfile(dto: CreateSizeProfileDto, userId: string) {
    // Validate items total to 100%
    const totalPercentage = dto.items.reduce((sum, item) => sum + item.percentageShare, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new BadRequestException('Size percentages must total 100%');
    }

    return this.prisma.sizeProfile.create({
      data: {
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        genderId: dto.genderId,
        seasonId: dto.seasonId,
        locationId: dto.locationId,
        profileType: dto.profileType,
        basedOnUnits: dto.basedOnUnits,
        confidenceScore: dto.confidenceScore,
        createdById: userId,
        items: {
          create: dto.items.map((item) => ({
            sizeId: item.sizeId,
            percentageShare: item.percentageShare,
          })),
        },
      },
      include: {
        category: true,
        items: {
          include: { size: true },
          orderBy: { size: { sizeOrder: 'asc' } },
        },
      },
    });
  }

  async updateSizeProfile(id: string, dto: UpdateSizeProfileDto) {
    const existing = await this.prisma.sizeProfile.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Size profile not found');
    }

    // Validate items if provided
    if (dto.items) {
      const totalPercentage = dto.items.reduce((sum, item) => sum + item.percentageShare, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new BadRequestException('Size percentages must total 100%');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update profile type and confidence if provided
      const updateData: any = {};
      if (dto.profileType) updateData.profileType = dto.profileType;
      if (dto.confidenceScore !== undefined) updateData.confidenceScore = dto.confidenceScore;

      const profile = await tx.sizeProfile.update({
        where: { id },
        data: updateData,
      });

      // Update items if provided
      if (dto.items) {
        // Delete existing items
        await tx.sizeProfileItem.deleteMany({ where: { profileId: id } });

        // Create new items
        await tx.sizeProfileItem.createMany({
          data: dto.items.map((item) => ({
            profileId: id,
            sizeId: item.sizeId,
            percentageShare: item.percentageShare,
          })),
        });
      }

      return this.findOneSizeProfile(id);
    });
  }

  async deleteSizeProfile(id: string) {
    const existing = await this.prisma.sizeProfile.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Size profile not found');
    }

    await this.prisma.sizeProfile.delete({ where: { id } });
    return { deleted: true };
  }

  // ============ SIZE OPTIMIZATION ============

  async calculateOptimalProfile(dto: OptimizeSizeProfileDto, userId: string) {
    const historicalWeight = dto.historicalWeight ?? 0.4;
    const trendWeight = dto.trendWeight ?? 0.6;

    if (Math.abs(historicalWeight + trendWeight - 1) > 0.01) {
      throw new BadRequestException('Weights must total 1.0');
    }

    // Get historical profile
    const historicalProfile = await this.prisma.sizeProfile.findFirst({
      where: {
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId || null,
        seasonId: dto.seasonId || null,
        locationId: dto.locationId || null,
        profileType: SizeProfileType.HISTORICAL,
      },
      include: {
        items: { include: { size: true } },
      },
    });

    // Get current trend profile
    const trendProfile = await this.prisma.sizeProfile.findFirst({
      where: {
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId || null,
        seasonId: dto.seasonId || null,
        locationId: dto.locationId || null,
        profileType: SizeProfileType.CURRENT_TREND,
      },
      include: {
        items: { include: { size: true } },
      },
    });

    if (!historicalProfile && !trendProfile) {
      throw new BadRequestException('No historical or trend profile found for optimization');
    }

    // Get all size definitions for this category's size type
    const sizeDefinitions = await this.prisma.sizeDefinition.findMany({
      where: { isActive: true },
      orderBy: { sizeOrder: 'asc' },
    });

    // Calculate weighted average
    const optimizedItems: Array<{ sizeId: string; percentageShare: number }> = [];

    for (const size of sizeDefinitions) {
      const historicalItem = historicalProfile?.items.find((i) => i.sizeId === size.id);
      const trendItem = trendProfile?.items.find((i) => i.sizeId === size.id);

      const historicalPct = historicalItem ? Number(historicalItem.percentageShare) : 0;
      const trendPct = trendItem ? Number(trendItem.percentageShare) : 0;

      let optimizedPct: number;
      if (historicalProfile && trendProfile) {
        optimizedPct = historicalPct * historicalWeight + trendPct * trendWeight;
      } else if (historicalProfile) {
        optimizedPct = historicalPct;
      } else {
        optimizedPct = trendPct;
      }

      if (optimizedPct > 0) {
        optimizedItems.push({
          sizeId: size.id,
          percentageShare: Math.round(optimizedPct * 100) / 100,
        });
      }
    }

    // Normalize to 100%
    const total = optimizedItems.reduce((sum, item) => sum + item.percentageShare, 0);
    if (total > 0) {
      optimizedItems.forEach((item) => {
        item.percentageShare = Math.round((item.percentageShare / total) * 100 * 100) / 100;
      });
    }

    // Create or update optimal profile
    const existingOptimal = await this.prisma.sizeProfile.findFirst({
      where: {
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId || null,
        seasonId: dto.seasonId || null,
        locationId: dto.locationId || null,
        profileType: SizeProfileType.SYSTEM_OPTIMAL,
      },
    });

    if (existingOptimal) {
      return this.updateSizeProfile(existingOptimal.id, {
        items: optimizedItems,
        confidenceScore: this.calculateConfidenceScore(historicalProfile, trendProfile),
      });
    }

    return this.createSizeProfile(
      {
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        seasonId: dto.seasonId,
        locationId: dto.locationId,
        profileType: SizeProfileType.SYSTEM_OPTIMAL,
        items: optimizedItems,
        confidenceScore: this.calculateConfidenceScore(historicalProfile, trendProfile),
      },
      userId,
    );
  }

  private calculateConfidenceScore(
    historicalProfile: any,
    trendProfile: any,
  ): number {
    let score = 0.5; // Base score

    if (historicalProfile) {
      const historicalUnits = historicalProfile.basedOnUnits || 0;
      if (historicalUnits > 1000) score += 0.2;
      else if (historicalUnits > 500) score += 0.15;
      else if (historicalUnits > 100) score += 0.1;
    }

    if (trendProfile) {
      const trendUnits = trendProfile.basedOnUnits || 0;
      if (trendUnits > 500) score += 0.2;
      else if (trendUnits > 200) score += 0.15;
      else if (trendUnits > 50) score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  async compareProfiles(profileIds: string[]) {
    if (profileIds.length < 2) {
      throw new BadRequestException('Need at least 2 profiles to compare');
    }

    const profiles = await this.prisma.sizeProfile.findMany({
      where: { id: { in: profileIds } },
      include: {
        category: { select: { id: true, name: true } },
        items: {
          include: { size: true },
          orderBy: { size: { sizeOrder: 'asc' } },
        },
      },
    });

    if (profiles.length !== profileIds.length) {
      throw new NotFoundException('One or more profiles not found');
    }

    // Get all unique sizes
    const allSizes = new Map<string, any>();
    profiles.forEach((profile) => {
      profile.items.forEach((item) => {
        if (!allSizes.has(item.sizeId)) {
          allSizes.set(item.sizeId, item.size);
        }
      });
    });

    // Build comparison matrix
    const comparison = Array.from(allSizes.values())
      .sort((a, b) => a.sizeOrder - b.sizeOrder)
      .map((size) => {
        const row: any = {
          sizeId: size.id,
          sizeCode: size.sizeCode,
          sizeName: size.sizeName,
        };

        profiles.forEach((profile, idx) => {
          const item = profile.items.find((i) => i.sizeId === size.id);
          row[`profile${idx + 1}`] = item ? Number(item.percentageShare) : 0;
        });

        // Calculate variance
        const values = profiles.map((_, idx) => row[`profile${idx + 1}`]);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const variance =
          values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        row.variance = Math.round(Math.sqrt(variance) * 100) / 100;

        return row;
      });

    return {
      profiles: profiles.map((p) => ({
        id: p.id,
        profileType: p.profileType,
        category: p.category,
        confidenceScore: p.confidenceScore,
      })),
      comparison,
      summary: {
        totalSizes: comparison.length,
        highVarianceSizes: comparison.filter((r) => r.variance > 5).length,
        avgVariance:
          Math.round(
            (comparison.reduce((sum, r) => sum + r.variance, 0) / comparison.length) * 100,
          ) / 100,
      },
    };
  }

  async getSizeBreakdown(categoryId: string, query: { seasonId?: string; locationId?: string }) {
    const where: Prisma.SizeProfileWhereInput = {
      categoryId,
      profileType: SizeProfileType.FINAL,
    };
    if (query.seasonId) where.seasonId = query.seasonId;
    if (query.locationId) where.locationId = query.locationId;

    const profile = await this.prisma.sizeProfile.findFirst({
      where,
      include: {
        items: {
          include: { size: true },
          orderBy: { size: { sizeOrder: 'asc' } },
        },
      },
    });

    if (!profile) {
      // Fall back to optimal profile
      const optimalProfile = await this.prisma.sizeProfile.findFirst({
        where: { ...where, profileType: SizeProfileType.SYSTEM_OPTIMAL },
        include: {
          items: {
            include: { size: true },
            orderBy: { size: { sizeOrder: 'asc' } },
          },
        },
      });

      if (!optimalProfile) {
        return null;
      }

      return {
        profileId: optimalProfile.id,
        profileType: optimalProfile.profileType,
        items: optimalProfile.items.map((item) => ({
          sizeCode: item.size.sizeCode,
          sizeName: item.size.sizeName,
          percentage: Number(item.percentageShare),
        })),
      };
    }

    return {
      profileId: profile.id,
      profileType: profile.profileType,
      items: profile.items.map((item) => ({
        sizeCode: item.size.sizeCode,
        sizeName: item.size.sizeName,
        percentage: Number(item.percentageShare),
      })),
    };
  }
}
