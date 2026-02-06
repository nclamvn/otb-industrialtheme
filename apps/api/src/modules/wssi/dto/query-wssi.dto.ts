import {
  IsInt,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { WSSIForecastType } from './create-wssi.dto';

export class QueryWSSIDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsInt()
  @Min(2020)
  @Max(2100)
  @Type(() => Number)
  @IsOptional()
  year?: number;

  @IsInt()
  @Min(1)
  @Max(53)
  @Type(() => Number)
  @IsOptional()
  weekNumber?: number;

  @IsInt()
  @Min(1)
  @Max(53)
  @Type(() => Number)
  @IsOptional()
  weekStart?: number;

  @IsInt()
  @Min(1)
  @Max(53)
  @Type(() => Number)
  @IsOptional()
  weekEnd?: number;

  @IsString()
  @IsOptional()
  divisionId?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

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

  @IsEnum(WSSIForecastType)
  @IsOptional()
  forecastType?: WSSIForecastType;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  hasAlerts?: boolean;

  @IsString()
  @IsOptional()
  sortBy?: string = 'weekNumber';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class WSSISummaryQueryDto {
  @IsInt()
  @Min(2020)
  @Max(2100)
  @Type(() => Number)
  year: number;

  @IsString()
  @IsOptional()
  divisionId?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  seasonId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  groupBy?: 'week' | 'month' | 'brand' | 'category' | 'location';
}
