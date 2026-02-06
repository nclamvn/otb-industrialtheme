import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WeekReforecastDto {
  @IsInt()
  @Min(1)
  @Max(53)
  weekNumber: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  salesPlanValue?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  salesPlanUnits?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  intakePlanValue?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  intakePlanUnits?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  markdownPlanValue?: number;
}

export class ReforecastDto {
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @IsString()
  divisionId: string;

  @IsString()
  brandId: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @IsString()
  seasonId: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  reforecastReason: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeekReforecastDto)
  weekUpdates: WeekReforecastDto[];
}

export class BulkReforecastDto {
  @IsString()
  reforecastReason: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleRecordReforecastDto)
  records: SingleRecordReforecastDto[];
}

export class SingleRecordReforecastDto {
  @IsString()
  wssiRecordId: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  salesPlanValue?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  salesPlanUnits?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  intakePlanValue?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  intakePlanUnits?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  markdownPlanValue?: number;
}
