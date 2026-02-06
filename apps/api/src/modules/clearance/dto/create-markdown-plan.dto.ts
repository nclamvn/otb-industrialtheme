import { IsString, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMarkdownPhaseDto {
  @ApiProperty({ description: 'Phase number (1, 2, 3...)' })
  @IsNumber()
  @Min(1)
  phaseNumber: number;

  @ApiProperty({ description: 'Phase name', example: 'First Markdown' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Markdown percentage for this phase', example: 30 })
  @IsNumber()
  @Min(0)
  @Max(100)
  markdownPct: number;

  @ApiProperty({ description: 'Phase start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Phase end date' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Target sell-through percentage', example: 40 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetSellThroughPct?: number;

  @ApiPropertyOptional({ description: 'Minimum days at this price before next markdown', default: 14 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minDaysAtPrice?: number;
}

export class CreateMarkdownPlanDto {
  @ApiProperty({ description: 'Plan name', example: 'End of Season Clearance FW24' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Season ID' })
  @IsString()
  seasonId: string;

  @ApiPropertyOptional({ description: 'Brand ID (optional, for brand-specific plan)' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiProperty({ description: 'Plan start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Plan end date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Target recovery value from clearance', example: 500000 })
  @IsNumber()
  @Min(0)
  targetRecoveryValue: number;

  @ApiProperty({ description: 'Target sell-through percentage', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  targetSellThroughPct: number;

  @ApiPropertyOptional({ description: 'Maximum markdown percentage allowed', default: 70 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxMarkdownPct?: number;

  @ApiPropertyOptional({ description: 'Markdown phases', type: [CreateMarkdownPhaseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMarkdownPhaseDto)
  phases?: CreateMarkdownPhaseDto[];
}
