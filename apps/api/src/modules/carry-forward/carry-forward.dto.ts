import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CarryForwardStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ALLOCATED = 'ALLOCATED',
  CLEARANCE = 'CLEARANCE',
}

export class GetCarryForwardQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromSeasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toSeasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: CarryForwardStatus })
  @IsOptional()
  @IsEnum(CarryForwardStatus)
  status?: CarryForwardStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class CreateCarryForwardDto {
  @ApiProperty()
  @IsString()
  skuItemId: string;

  @ApiProperty()
  @IsString()
  fromSeasonId: string;

  @ApiProperty()
  @IsString()
  toSeasonId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  carryQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  carryValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateCarryForwardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  carryQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  carryValue?: number;

  @ApiPropertyOptional({ enum: CarryForwardStatus })
  @IsOptional()
  @IsEnum(CarryForwardStatus)
  status?: CarryForwardStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApproveCarryForwardDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvalNote?: string;
}

export class RejectCarryForwardDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiProperty()
  @IsString()
  rejectionReason: string;
}

export class BatchCarryForwardDto {
  @ApiProperty({ type: () => [CarryForwardItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarryForwardItem)
  items: CarryForwardItem[];
}

export class CarryForwardItem {
  @ApiProperty()
  @IsString()
  skuItemId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  carryQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AnalyzeCarryForwardDto {
  @ApiProperty()
  @IsString()
  fromSeasonId: string;

  @ApiProperty()
  @IsString()
  toSeasonId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Minimum sell-through threshold for carry forward eligibility' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minSellThrough?: number;

  @ApiPropertyOptional({ description: 'Maximum weeks of cover for carry forward eligibility' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxWeeksOfCover?: number;
}

export class AllocateCarryForwardDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ description: 'Allocation strategy', enum: ['proportional', 'priority', 'clearance'] })
  @IsString()
  strategy: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountPercent?: number;
}
