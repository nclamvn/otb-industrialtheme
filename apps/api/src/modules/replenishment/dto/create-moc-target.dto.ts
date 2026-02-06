import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMOCTargetDto {
  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Season ID' })
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional({ description: 'Location ID' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ description: 'Minimum months of cover', default: 1.5 })
  @IsNumber()
  @Min(0.5)
  @Max(12)
  minMOC: number;

  @ApiProperty({ description: 'Target months of cover', default: 2.5 })
  @IsNumber()
  @Min(0.5)
  @Max(12)
  targetMOC: number;

  @ApiProperty({ description: 'Maximum months of cover', default: 4.0 })
  @IsNumber()
  @Min(0.5)
  @Max(12)
  maxMOC: number;

  @ApiPropertyOptional({ description: 'Lead time in days', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Safety stock days', default: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  safetyStockDays?: number;
}

export class CreateMOQRuleDto {
  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Supplier name' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: 'Minimum order quantity (units)', default: 50 })
  @IsNumber()
  @Min(1)
  moqUnits: number;

  @ApiProperty({ description: 'Minimum order value', default: 1000 })
  @IsNumber()
  @Min(0)
  moqValue: number;

  @ApiPropertyOptional({ description: 'Pack size', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  packSize?: number;

  @ApiPropertyOptional({ description: 'Carton size' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  cartonSize?: number;

  @ApiPropertyOptional({ description: 'Lead time in days', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  leadTimeDays?: number;
}
