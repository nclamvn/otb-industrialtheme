import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SKUScenarioDto {
  @ApiProperty({ description: 'SKU ID' })
  @IsString()
  skuId: string;

  @ApiProperty({ description: 'Markdown percentage to apply', example: 30 })
  @IsNumber()
  @Min(0)
  @Max(100)
  markdownPct: number;
}

export class SimulateScenarioDto {
  @ApiProperty({ description: 'Plan ID' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ description: 'Scenario name', example: 'Aggressive Markdown Scenario' })
  @IsOptional()
  @IsString()
  scenarioName?: string;

  @ApiPropertyOptional({ description: 'Global markdown percentage to apply to all SKUs', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  globalMarkdownPct?: number;

  @ApiPropertyOptional({ description: 'SKU-specific markdown overrides', type: [SKUScenarioDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SKUScenarioDto)
  skuOverrides?: SKUScenarioDto[];

  @ApiPropertyOptional({ description: 'Demand elasticity factor (1.0 = normal)', default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(3.0)
  elasticityFactor?: number;

  @ApiPropertyOptional({ description: 'Number of weeks to simulate', default: 8 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  weeksToSimulate?: number;
}

export class SimulationResultDto {
  scenarioName: string;
  planId: string;

  // Overall metrics
  totalSKUs: number;
  startingInventoryValue: number;
  projectedRecoveryValue: number;
  projectedMarginLoss: number;
  projectedSellThroughPct: number;
  projectedRemainingStock: number;
  projectedRemainingValue: number;

  // Weekly breakdown
  weeklyProjections: WeeklyProjectionDto[];

  // Comparison with baseline
  comparisonWithBaseline?: {
    recoveryDifference: number;
    marginLossDifference: number;
    sellThroughDifference: number;
  };

  // Risk assessment
  riskAssessment: {
    stockoutRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    marginErosionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    warnings: string[];
  };
}

export class WeeklyProjectionDto {
  weekNumber: number;
  weekStartDate: string;

  openingStock: number;
  openingValue: number;

  projectedSales: number;
  projectedRevenue: number;
  avgSellingPrice: number;

  closingStock: number;
  closingValue: number;

  cumulativeSellThrough: number;
  cumulativeRecovery: number;
}
