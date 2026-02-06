import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateThresholdDto {
  @IsString()
  @IsOptional()
  divisionId?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(52)
  @IsOptional()
  wocMinimum?: number = 3.0;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(52)
  @IsOptional()
  wocMaximum?: number = 8.0;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(52)
  @IsOptional()
  wocTarget?: number = 5.0;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @IsOptional()
  salesVarianceAlert?: number = 10.0;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateThresholdDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(52)
  @IsOptional()
  wocMinimum?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(52)
  @IsOptional()
  wocMaximum?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(52)
  @IsOptional()
  wocTarget?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @IsOptional()
  salesVarianceAlert?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
