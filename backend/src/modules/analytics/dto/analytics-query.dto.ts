import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ example: 'SS', enum: ['SS', 'FW'] })
  @IsOptional()
  @IsString()
  seasonGroup?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fiscalYear?: number;

  @ApiPropertyOptional({ description: 'Group Brand ID' })
  @IsOptional()
  @IsString()
  groupBrandId?: string;

  @ApiPropertyOptional({ description: 'Store ID' })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional({ example: 10, description: 'Limit results' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Attribute type for trends', example: 'color' })
  @IsOptional()
  @IsString()
  attributeType?: string;

  @ApiPropertyOptional({ description: 'Category filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Dimension type', example: 'collection' })
  @IsOptional()
  @IsString()
  dimensionType?: string;
}
