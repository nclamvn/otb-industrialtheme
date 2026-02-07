import { IsString, IsNumber, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateSizeCurveDto {
  @ApiProperty({ description: 'Category / product type', example: 'W OUTERWEAR' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Store ID', example: 'store-rex-id' })
  @IsString()
  storeId: string;

  @ApiProperty({ description: 'Total order quantity', example: 100 })
  @IsNumber()
  @Min(1)
  totalOrderQty: number;
}

export class CompareSizeCurveDto {
  @ApiProperty({ description: 'SKU ID' })
  @IsString()
  skuId: string;

  @ApiProperty({ description: 'Store ID' })
  @IsString()
  storeId: string;

  @ApiProperty({
    description: 'User sizing input — map of sizeCode → quantity',
    example: { '0002': 10, '0004': 30, '0006': 35, '0008': 25 },
  })
  @IsObject()
  userSizing: Record<string, number>;
}

export class GetAlertsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by budget ID' })
  @IsOptional()
  @IsString()
  budgetId?: string;

  @ApiPropertyOptional({ description: 'Only unread alerts', default: false })
  @IsOptional()
  unreadOnly?: string; // query params are strings
}
