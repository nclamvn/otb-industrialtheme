import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PerformanceMetric {
  REVENUE = 'REVENUE',
  UNITS_SOLD = 'UNITS_SOLD',
  GROSS_MARGIN = 'GROSS_MARGIN',
  SELL_THROUGH = 'SELL_THROUGH',
  GMROI = 'GMROI',
  STOCK_TURNOVER = 'STOCK_TURNOVER',
}

export enum PerformanceCategory {
  BEST = 'BEST',
  WORST = 'WORST',
  RISING = 'RISING',
  DECLINING = 'DECLINING',
}

export class SKUPerformanceQueryDto {
  @ApiPropertyOptional({ description: 'Filter by brand' })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by season' })
  @IsString()
  @IsOptional()
  seasonId?: string;

  @ApiPropertyOptional({ description: 'Filter by location' })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({ enum: PerformanceMetric, description: 'Metric to rank by' })
  @IsEnum(PerformanceMetric)
  @IsOptional()
  metric?: PerformanceMetric;

  @ApiPropertyOptional({ enum: PerformanceCategory, description: 'Performance category' })
  @IsEnum(PerformanceCategory)
  @IsOptional()
  category?: PerformanceCategory;

  @ApiPropertyOptional({ description: 'Number of SKUs to return', default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Time period in days', default: 30 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  periodDays?: number;
}

export class SKUPerformanceDto {
  @ApiProperty()
  skuId: string;

  @ApiProperty()
  skuCode: string;

  @ApiProperty()
  skuName: string;

  @ApiPropertyOptional()
  brandName?: string;

  @ApiPropertyOptional()
  categoryName?: string;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  unitsSold: number;

  @ApiProperty()
  grossMargin: number;

  @ApiProperty()
  grossMarginPct: number;

  @ApiProperty()
  sellThroughRate: number;

  @ApiProperty()
  gmroi: number;

  @ApiProperty()
  stockTurnover: number;

  @ApiProperty()
  currentStock: number;

  @ApiProperty()
  weeksOfCover: number;

  @ApiPropertyOptional()
  previousRevenue?: number;

  @ApiPropertyOptional()
  revenueChange?: number;

  @ApiPropertyOptional()
  revenueChangePct?: number;

  @ApiProperty({ enum: PerformanceCategory })
  performanceCategory: PerformanceCategory;

  @ApiProperty()
  rank: number;
}

export class SKUAnalysisSummaryDto {
  @ApiProperty()
  totalSKUs: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalUnitsSold: number;

  @ApiProperty()
  avgSellThrough: number;

  @ApiProperty()
  avgGrossMargin: number;

  @ApiProperty()
  top10RevenueContribution: number;

  @ApiProperty()
  bottom10RevenueContribution: number;

  @ApiProperty()
  bestPerformersSKUCount: number;

  @ApiProperty()
  worstPerformersSKUCount: number;
}

export class SKURecommendationDto {
  @ApiProperty()
  skuId: string;

  @ApiProperty()
  skuCode: string;

  @ApiProperty()
  skuName: string;

  @ApiProperty({ enum: ['REORDER', 'MARKDOWN', 'DISCONTINUE', 'TRANSFER', 'PROMOTE'] })
  action: 'REORDER' | 'MARKDOWN' | 'DISCONTINUE' | 'TRANSFER' | 'PROMOTE';

  @ApiProperty()
  reason: string;

  @ApiPropertyOptional()
  suggestedQuantity?: number;

  @ApiPropertyOptional()
  suggestedMarkdownPct?: number;

  @ApiProperty()
  priority: 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiProperty()
  potentialImpact: number;
}
