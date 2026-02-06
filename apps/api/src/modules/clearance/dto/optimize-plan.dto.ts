import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OptimizePlanDto {
  @ApiProperty({ description: 'Plan ID to optimize' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ description: 'Optimization strategy', enum: ['MAXIMIZE_RECOVERY', 'MAXIMIZE_SELL_THROUGH', 'BALANCED'], default: 'BALANCED' })
  @IsOptional()
  @IsString()
  strategy?: 'MAXIMIZE_RECOVERY' | 'MAXIMIZE_SELL_THROUGH' | 'BALANCED';

  @ApiPropertyOptional({ description: 'Include demand elasticity analysis', default: true })
  @IsOptional()
  @IsBoolean()
  analyzeElasticity?: boolean;

  @ApiPropertyOptional({ description: 'Consider competitor pricing', default: false })
  @IsOptional()
  @IsBoolean()
  considerCompetitors?: boolean;

  @ApiPropertyOptional({ description: 'Minimum margin to maintain (%)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(100)
  minMarginPct?: number;

  @ApiPropertyOptional({ description: 'SKU IDs to include (empty = all)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skuIds?: string[];
}

export class OptimizationResultDto {
  planId: string;
  totalSKUs: number;
  totalCurrentValue: number;
  projectedRecovery: number;
  projectedMarginLoss: number;
  projectedSellThrough: number;
  confidenceScore: number;
  recommendations: SKURecommendationDto[];
  summary: OptimizationSummaryDto;
}

export class SKURecommendationDto {
  skuId: string;
  skuCode: string;
  skuName: string;
  currentStock: number;
  currentPrice: number;
  urgencyScore: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: 'MARKDOWN' | 'TRANSFER' | 'BUNDLE' | 'PROMOTE' | 'DISCONTINUE' | 'HOLD';
  recommendedMarkdownPct: number;
  recommendedNewPrice: number;
  projectedUnitsSold: number;
  projectedRevenue: number;
  projectedDaysToSell: number;
  reasoning: string;
}

export class OptimizationSummaryDto {
  totalSKUsAnalyzed: number;
  skusByUrgency: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  skusByAction: {
    markdown: number;
    transfer: number;
    bundle: number;
    promote: number;
    discontinue: number;
    hold: number;
  };
  expectedOutcome: {
    totalRecovery: number;
    totalMarginLoss: number;
    avgSellThrough: number;
    avgDaysToSell: number;
  };
}
