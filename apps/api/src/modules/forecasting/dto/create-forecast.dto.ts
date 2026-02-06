import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ForecastMethodEnum {
  MOVING_AVERAGE = 'MOVING_AVERAGE',
  EXPONENTIAL_SMOOTHING = 'EXPONENTIAL_SMOOTHING',
  TREND_ADJUSTED = 'TREND_ADJUSTED',
  SEASONAL_DECOMPOSITION = 'SEASONAL_DECOMPOSITION',
  ENSEMBLE = 'ENSEMBLE',
  AI_ML = 'AI_ML',
}

export class CreateForecastRunDto {
  @ApiPropertyOptional({ description: 'Season ID' })
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: 'Forecast method', enum: ForecastMethodEnum, default: 'ENSEMBLE' })
  @IsEnum(ForecastMethodEnum)
  method: ForecastMethodEnum;

  @ApiPropertyOptional({ description: 'Number of weeks to look back', default: 12 })
  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(52)
  lookbackWeeks?: number;

  @ApiPropertyOptional({ description: 'Number of weeks to forecast', default: 8 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  forecastWeeks?: number;
}

export class CreateForecastConfigDto {
  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Season ID' })
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiProperty({ description: 'Primary forecast method', enum: ForecastMethodEnum, default: 'ENSEMBLE' })
  @IsEnum(ForecastMethodEnum)
  primaryMethod: ForecastMethodEnum;

  @ApiPropertyOptional({ description: 'Lookback weeks', default: 12 })
  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(52)
  lookbackWeeks?: number;

  @ApiPropertyOptional({ description: 'Forecast weeks', default: 8 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  forecastWeeks?: number;

  @ApiPropertyOptional({ description: 'Moving average weight', default: 0.25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  movingAvgWeight?: number;

  @ApiPropertyOptional({ description: 'Exponential smoothing weight', default: 0.35 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  expSmoothWeight?: number;

  @ApiPropertyOptional({ description: 'Trend weight', default: 0.40 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  trendWeight?: number;

  @ApiPropertyOptional({ description: 'Exponential smoothing alpha', default: 0.30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  expSmoothAlpha?: number;

  @ApiPropertyOptional({ description: 'Exponential smoothing beta', default: 0.10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  expSmoothBeta?: number;

  @ApiPropertyOptional({ description: 'Exponential smoothing gamma', default: 0.20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  expSmoothGamma?: number;
}
