import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetPriceRangesQueryDto,
  CreatePriceRangeDto,
  UpdatePriceRangeDto,
  AnalyzePriceRangeDto,
  PriceRangeDistributionDto,
  BatchPriceRangeUpdateDto,
  OptimizePriceRangesDto,
} from './price-range.dto';

@Injectable()
export class PriceRangeService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(query: GetPriceRangesQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    const [data, total] = await Promise.all([
      this.prisma.priceRange.findMany({
        where,
        skip,
        take: limit,
        orderBy: { minPrice: 'asc' },
      }),
      this.prisma.priceRange.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const priceRange = await this.prisma.priceRange.findUnique({
      where: { id },
    });

    if (!priceRange) {
      throw new NotFoundException(`Price range with ID ${id} not found`);
    }

    return priceRange;
  }

  async create(dto: CreatePriceRangeDto) {
    if (dto.minPrice >= dto.maxPrice) {
      throw new BadRequestException('minPrice must be less than maxPrice');
    }

    return this.prisma.priceRange.create({
      data: {
        name: dto.name,
        code: 'BUDGET', // Default code - would be validated against PriceRangeCode enum
        minPrice: dto.minPrice,
        maxPrice: dto.maxPrice,
        description: dto.name,
      },
    });
  }

  async update(id: string, dto: UpdatePriceRangeDto) {
    await this.getById(id); // Verify exists

    if (dto.minPrice !== undefined && dto.maxPrice !== undefined) {
      if (dto.minPrice >= dto.maxPrice) {
        throw new BadRequestException('minPrice must be less than maxPrice');
      }
    }

    return this.prisma.priceRange.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.minPrice !== undefined ? { minPrice: dto.minPrice } : {}),
        ...(dto.maxPrice !== undefined ? { maxPrice: dto.maxPrice } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async delete(id: string) {
    await this.getById(id); // Verify exists

    await this.prisma.priceRange.delete({ where: { id } });
    return { success: true, message: 'Price range deleted successfully' };
  }

  async analyze(dto: AnalyzePriceRangeDto) {
    // Get all SKUs for analysis by season via proposal
    const skus = await this.prisma.sKUItem.findMany({
      where: {
        proposal: { seasonId: dto.seasonId },
        ...(dto.brandId ? { proposal: { brandId: dto.brandId } } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
      },
      select: {
        id: true,
        retailPrice: true,
        costPrice: true,
        orderQuantity: true,
      },
    });

    if (skus.length === 0) {
      return {
        totalSKUs: 0,
        priceRanges: [],
        summary: { minPrice: 0, maxPrice: 0, avgPrice: 0, medianPrice: 0 },
      };
    }

    // Calculate price statistics
    const prices = skus.map(s => Number(s.retailPrice)).filter(p => p > 0).sort((a, b) => a - b);
    const minPrice = prices[0] || 0;
    const maxPrice = prices[prices.length - 1] || 0;
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const medianPrice = prices[Math.floor(prices.length / 2)] || 0;

    // Get existing price ranges
    const priceRanges = await this.prisma.priceRange.findMany({
      where: { isActive: true },
      orderBy: { minPrice: 'asc' },
    });

    // Calculate SKU count per range
    const rangeAnalysis = priceRanges.map(range => {
      const skusInRange = skus.filter(
        s => Number(s.retailPrice) >= Number(range.minPrice) && Number(s.retailPrice) <= Number(range.maxPrice)
      );
      const totalQuantity = skusInRange.reduce((sum, s) => sum + s.orderQuantity, 0);
      const totalValue = skusInRange.reduce((sum, s) => sum + s.orderQuantity * Number(s.retailPrice), 0);

      return {
        ...range,
        skuCount: skusInRange.length,
        totalQuantity,
        totalValue,
        percentOfTotal: (skusInRange.length / skus.length) * 100,
      };
    });

    return {
      totalSKUs: skus.length,
      priceRanges: rangeAnalysis,
      summary: { minPrice, maxPrice, avgPrice, medianPrice },
    };
  }

  async getDistribution(dto: PriceRangeDistributionDto) {
    const priceRanges = await this.prisma.priceRange.findMany({
      where: {
        isActive: true,
        ...(dto.priceRangeIds?.length ? { id: { in: dto.priceRangeIds } } : {}),
      },
      orderBy: { minPrice: 'asc' },
    });

    const skus = await this.prisma.sKUItem.findMany({
      where: {
        proposal: { seasonId: dto.seasonId },
        ...(dto.brandId ? { proposal: { brandId: dto.brandId } } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
      },
      select: {
        id: true,
        retailPrice: true,
        orderQuantity: true,
      },
    });

    const distribution = priceRanges.map(range => {
      const skusInRange = skus.filter(
        s => Number(s.retailPrice) >= Number(range.minPrice) && Number(s.retailPrice) <= Number(range.maxPrice)
      );

      return {
        rangeId: range.id,
        rangeName: range.name,
        minPrice: range.minPrice,
        maxPrice: range.maxPrice,
        skuCount: skusInRange.length,
        totalUnits: skusInRange.reduce((sum, s) => sum + s.orderQuantity, 0),
        percentOfSKUs: skus.length > 0 ? (skusInRange.length / skus.length) * 100 : 0,
      };
    });

    return {
      seasonId: dto.seasonId,
      totalSKUs: skus.length,
      distribution,
    };
  }

  async batchUpdate(dto: BatchPriceRangeUpdateDto) {
    const results = await Promise.all(
      dto.updates.map(async (item) => {
        try {
          return await this.prisma.priceRange.update({
            where: { id: item.id },
            data: {
              ...(item.minPrice !== undefined ? { minPrice: item.minPrice } : {}),
              ...(item.maxPrice !== undefined ? { maxPrice: item.maxPrice } : {}),
            },
          });
        } catch {
          return { id: item.id, error: 'Failed to update' };
        }
      })
    );

    return {
      updated: results.filter(r => !('error' in r)).length,
      failed: results.filter(r => 'error' in r).length,
      results,
    };
  }

  async optimize(dto: OptimizePriceRangesDto) {
    const numberOfRanges = dto.numberOfRanges || 5;
    const strategy = dto.strategy || 'equal_width';

    const skus = await this.prisma.sKUItem.findMany({
      where: {
        proposal: { seasonId: dto.seasonId },
        ...(dto.brandId ? { proposal: { brandId: dto.brandId } } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
      },
      select: { retailPrice: true },
    });

    if (skus.length === 0) {
      return { suggestions: [], message: 'No SKUs found for optimization' };
    }

    const prices = skus.map(s => Number(s.retailPrice)).filter(p => p > 0).sort((a, b) => a - b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];

    const suggestions: any[] = [];

    if (strategy === 'equal_width') {
      const width = (maxPrice - minPrice) / numberOfRanges;
      for (let i = 0; i < numberOfRanges; i++) {
        const rangeMin = minPrice + i * width;
        const rangeMax = i === numberOfRanges - 1 ? maxPrice : minPrice + (i + 1) * width;
        const skusInRange = prices.filter(p => p >= rangeMin && p <= rangeMax);

        suggestions.push({
          name: `Range ${i + 1}`,
          minPrice: Math.round(rangeMin),
          maxPrice: Math.round(rangeMax),
          suggestedSKUCount: skusInRange.length,
          percentOfTotal: (skusInRange.length / prices.length) * 100,
        });
      }
    } else if (strategy === 'equal_frequency') {
      const itemsPerBin = Math.ceil(prices.length / numberOfRanges);
      for (let i = 0; i < numberOfRanges; i++) {
        const startIdx = i * itemsPerBin;
        const endIdx = Math.min((i + 1) * itemsPerBin - 1, prices.length - 1);
        const rangeMin = prices[startIdx];
        const rangeMax = prices[endIdx];

        suggestions.push({
          name: `Range ${i + 1}`,
          minPrice: Math.round(rangeMin),
          maxPrice: Math.round(rangeMax),
          suggestedSKUCount: endIdx - startIdx + 1,
          percentOfTotal: ((endIdx - startIdx + 1) / prices.length) * 100,
        });
      }
    }

    return {
      strategy,
      totalSKUs: prices.length,
      priceRange: { min: minPrice, max: maxPrice },
      suggestions,
    };
  }

  async getHistory(seasonId: string) {
    const analyses = await this.prisma.priceRangeAnalysis.findMany({
      where: { seasonId },
      orderBy: { analyzedAt: 'desc' },
      take: 20,
    });

    return analyses;
  }

  async getSummary(seasonId: string) {
    const [priceRanges, skus] = await Promise.all([
      this.prisma.priceRange.findMany({
        where: { isActive: true },
        orderBy: { minPrice: 'asc' },
      }),
      this.prisma.sKUItem.findMany({
        where: { proposal: { seasonId } },
        select: { retailPrice: true, orderQuantity: true },
      }),
    ]);

    const totalSKUs = skus.length;
    const totalUnits = skus.reduce((sum, s) => sum + s.orderQuantity, 0);
    const prices = skus.map(s => Number(s.retailPrice)).filter(p => p > 0);

    return {
      seasonId,
      totalPriceRanges: priceRanges.length,
      totalSKUs,
      totalUnits,
      priceStats: {
        min: Math.min(...prices) || 0,
        max: Math.max(...prices) || 0,
        avg: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      },
      priceRanges: priceRanges.map(r => ({
        id: r.id,
        name: r.name,
        minPrice: r.minPrice,
        maxPrice: r.maxPrice,
      })),
    };
  }
}
