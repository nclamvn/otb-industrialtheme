import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SizeType {
  ALPHA = 'ALPHA',
  NUMERIC = 'NUMERIC',
  WAIST = 'WAIST',
  SHOE = 'SHOE',
  ONE_SIZE = 'ONE_SIZE',
}

export enum SizeProfileType {
  HISTORICAL = 'HISTORICAL',
  CURRENT_TREND = 'CURRENT_TREND',
  SYSTEM_OPTIMAL = 'SYSTEM_OPTIMAL',
  USER_ADJUSTED = 'USER_ADJUSTED',
  FINAL = 'FINAL',
}

// Size Definition DTOs
export class CreateSizeDefinitionDto {
  @IsString()
  sizeCode: string;

  @IsString()
  sizeName: string;

  @IsInt()
  @Min(1)
  sizeOrder: number;

  @IsEnum(SizeType)
  sizeType: SizeType;

  @IsString()
  @IsOptional()
  numericEquivalent?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSizeDefinitionDto {
  @IsString()
  @IsOptional()
  sizeName?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  sizeOrder?: number;

  @IsString()
  @IsOptional()
  numericEquivalent?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// Size Profile Item DTOs
export class SizeProfileItemDto {
  @IsString()
  sizeId: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  percentageShare: number;
}

// Size Profile DTOs
export class CreateSizeProfileDto {
  @IsString()
  categoryId: string;

  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @IsString()
  @IsOptional()
  genderId?: string;

  @IsString()
  @IsOptional()
  seasonId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsEnum(SizeProfileType)
  profileType: SizeProfileType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeProfileItemDto)
  items: SizeProfileItemDto[];

  @IsInt()
  @IsOptional()
  basedOnUnits?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  @IsOptional()
  confidenceScore?: number;
}

export class UpdateSizeProfileDto {
  @IsEnum(SizeProfileType)
  @IsOptional()
  profileType?: SizeProfileType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeProfileItemDto)
  @IsOptional()
  items?: SizeProfileItemDto[];

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  @IsOptional()
  confidenceScore?: number;
}

export class QuerySizeProfileDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @IsString()
  @IsOptional()
  seasonId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsEnum(SizeProfileType)
  @IsOptional()
  profileType?: SizeProfileType;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}

// Optimization DTOs
export class OptimizeSizeProfileDto {
  @IsString()
  categoryId: string;

  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @IsString()
  @IsOptional()
  seasonId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  @IsOptional()
  historicalWeight?: number; // Default 0.4

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  @IsOptional()
  trendWeight?: number; // Default 0.6
}

export class BulkUpdateSizeItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeProfileItemDto)
  items: SizeProfileItemDto[];

  @IsString()
  @IsOptional()
  adjustmentReason?: string;
}
