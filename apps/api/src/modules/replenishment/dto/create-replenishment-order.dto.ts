import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'SKU ID' })
  @IsString()
  skuId: string;

  @ApiProperty({ description: 'SKU Code' })
  @IsString()
  skuCode: string;

  @ApiProperty({ description: 'SKU Name' })
  @IsString()
  skuName: string;

  @ApiProperty({ description: 'Order quantity' })
  @IsNumber()
  @Min(1)
  orderedQty: number;

  @ApiProperty({ description: 'Unit cost' })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPct?: number;
}

export class CreateReplenishmentOrderDto {
  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Supplier name' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiProperty({ description: 'Expected delivery date' })
  @IsDateString()
  expectedDelivery: string;

  @ApiProperty({ description: 'Order items', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Alert IDs to resolve' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alertIds?: string[];
}
