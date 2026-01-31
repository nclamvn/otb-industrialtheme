import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== Query DTOs ====================

export class GetDeliveryWindowsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class GetDeliveryAllocationsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  skuId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  windowId?: string;

  @ApiPropertyOptional({ enum: ['REX', 'TTP', 'DAFC'] })
  @IsOptional()
  @IsString()
  storeGroup?: 'REX' | 'TTP' | 'DAFC';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonId?: string;

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

export class GetDeliveryMatrixQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['REX', 'TTP', 'DAFC'] })
  @IsOptional()
  @IsString()
  storeGroup?: 'REX' | 'TTP' | 'DAFC';
}

export class GetDeliverySummaryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ enum: ['REX', 'TTP', 'DAFC'] })
  @IsOptional()
  @IsString()
  storeGroup?: 'REX' | 'TTP' | 'DAFC';
}

// ==================== Create/Update DTOs ====================

export class CreateDeliveryWindowDto {
  @ApiProperty()
  @IsString()
  seasonId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;
}

export class UpdateDeliveryWindowDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateDeliveryAllocationDto {
  @ApiProperty()
  @IsString()
  windowId: string;

  @ApiProperty()
  @IsString()
  skuItemId: string;

  @ApiProperty()
  @IsString()
  locationId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ default: 'PENDING' })
  @IsOptional()
  @IsString()
  status?: string = 'PENDING';
}

export class UpdateDeliveryAllocationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class BatchDeliveryUpdateDto {
  @ApiProperty({ type: [Object] })
  @IsArray()
  updates: {
    id: string;
    quantity?: number;
    value?: number;
    status?: string;
  }[];
}

export class CopyAllocationsDto {
  @ApiProperty()
  @IsString()
  sourceWindowId: string;

  @ApiProperty()
  @IsString()
  targetWindowId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skuIds?: string[];
}

export class AutoDistributeDto {
  @ApiProperty()
  @IsString()
  skuId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  totalQuantity: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  windowIds: string[];

  @ApiProperty({ enum: ['EQUAL', 'WEIGHTED', 'FRONT_LOADED', 'BACK_LOADED'] })
  @IsEnum(['EQUAL', 'WEIGHTED', 'FRONT_LOADED', 'BACK_LOADED'])
  method: 'EQUAL' | 'WEIGHTED' | 'FRONT_LOADED' | 'BACK_LOADED';
}

// ==================== Response DTOs ====================

export class DeliveryWindowResponseDto {
  id: string;
  seasonId: string;
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class DeliveryAllocationResponseDto {
  id: string;
  windowId: string;
  skuItemId: string;
  locationId: string;
  quantity: number;
  value: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  window?: DeliveryWindowResponseDto;
  skuItem?: any;
  location?: any;
}

export class DeliveryMatrixRowDto {
  skuId: string;
  skuCode: string;
  skuName: string;
  brand: string;
  category: string;
  windows: {
    windowId: string;
    windowName: string;
    stores: {
      storeId: string;
      storeName: string;
      storeGroup: string;
      quantity: number;
      value: number;
    }[];
  }[];
  totals: {
    quantity: number;
    value: number;
  };
}

export class DeliverySummaryDto {
  seasonId: string;
  totalWindows: number;
  totalSKUs: number;
  totalQuantity: number;
  totalValue: number;
  byWindow: {
    windowId: string;
    windowName: string;
    quantity: number;
    value: number;
  }[];
  byStoreGroup: {
    storeGroup: string;
    quantity: number;
    value: number;
    percentage: number;
  }[];
}
