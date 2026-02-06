import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== Query DTOs ====================

export class GetCostingsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  skuId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minMargin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxMargin?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class GetCostingSummaryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
}

// ==================== Create/Update DTOs ====================

export class CalculateCostingDto {
  @ApiProperty({ description: 'Unit cost in USD (FOB)' })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional({ description: 'Freight cost as percentage of unit cost', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  freightPercent?: number = 5;

  @ApiPropertyOptional({ description: 'Insurance cost as percentage', default: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  insurancePercent?: number = 0.5;

  @ApiPropertyOptional({ description: 'Import duty rate %', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  dutyRate?: number = 0;

  @ApiPropertyOptional({ description: 'VAT rate %', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number = 10;

  @ApiPropertyOptional({ description: 'Other costs in USD', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherCosts?: number = 0;

  @ApiPropertyOptional({ description: 'Target margin %', default: 55 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetMargin?: number = 55;

  @ApiPropertyOptional({ description: 'USD to VND exchange rate', default: 24500 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  exchangeRate?: number = 24500;

  @ApiPropertyOptional({ description: 'Suggested Retail Price (if provided, will calculate margin instead)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  srp?: number;
}

export class CreateCostingDto {
  @ApiProperty()
  @IsString()
  skuItemId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  freightCost?: number = 0;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  insuranceCost?: number = 0;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  dutyRate?: number = 0;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  dutyAmount?: number = 0;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  vatRate?: number = 10;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  vatAmount?: number = 0;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  otherCosts?: number = 0;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  landedCost: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  srp: number;

  @ApiProperty()
  @IsNumber()
  margin: number;

  @ApiPropertyOptional({ default: 24500 })
  @IsOptional()
  @IsNumber()
  exchangeRate?: number = 24500;
}

export class UpdateCostingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  freightCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  insuranceCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dutyRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dutyAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  vatAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  otherCosts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  landedCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  srp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  margin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;
}

export class BatchCostingUpdateDto {
  @ApiProperty({ type: [Object] })
  @IsArray()
  updates: {
    id: string;
    srp?: number;
    margin?: number;
    exchangeRate?: number;
  }[];
}

export class RecalculateAllDto {
  @ApiProperty({ description: 'New exchange rate' })
  @IsNumber()
  @Min(1)
  exchangeRate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;
}

// ==================== Config DTOs ====================

export class CreateCostingConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  defaultDutyRate?: number = 0;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  defaultVatRate?: number = 10;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsNumber()
  defaultFreightRate?: number = 5;

  @ApiPropertyOptional({ default: 55 })
  @IsOptional()
  @IsNumber()
  targetMargin?: number = 55;

  @ApiPropertyOptional({ default: 45 })
  @IsOptional()
  @IsNumber()
  minMargin?: number = 45;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateCostingConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  defaultDutyRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  defaultVatRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  defaultFreightRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetMargin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minMargin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==================== Export DTO ====================

export class ExportCostingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
}
