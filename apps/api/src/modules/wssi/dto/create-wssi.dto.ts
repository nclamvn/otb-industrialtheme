import {
  IsInt,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum WSSIForecastType {
  PLAN = 'PLAN',
  REFORECAST = 'REFORECAST',
  ACTUAL = 'ACTUAL',
}

export class CreateWSSIDto {
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @IsInt()
  @Min(1)
  @Max(53)
  weekNumber: number;

  @IsDateString()
  weekStartDate: string;

  @IsDateString()
  weekEndDate: string;

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

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  openingStockValue?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  closingStockValue?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  openingStockUnits?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  closingStockUnits?: number;

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
  salesActualValue?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  salesActualUnits?: number;

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
  intakeActualValue?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  intakeActualUnits?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  markdownPlanValue?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  markdownActualValue?: number;

  @IsEnum(WSSIForecastType)
  @IsOptional()
  forecastType?: WSSIForecastType;
}
