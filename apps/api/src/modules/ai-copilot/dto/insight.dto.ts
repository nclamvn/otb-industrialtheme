import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class InsightDto {
  @ApiProperty({ enum: ['anomaly', 'risk', 'opportunity', 'info'] })
  type: 'anomaly' | 'risk' | 'opportunity' | 'info';

  @ApiProperty({ enum: ['high', 'medium', 'low'] })
  severity: 'high' | 'medium' | 'low';

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  action?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  metric?: string;
}

export class InsightsResponseDto {
  @ApiProperty({ type: [InsightDto] })
  insights: InsightDto[];

  @ApiProperty()
  generatedAt: string;

  @ApiProperty()
  planId: string;
}

export class RefreshInsightsDto {
  @ApiProperty()
  @IsString()
  otbPlanId: string;

  @ApiPropertyOptional({ enum: ['full', 'quick'] })
  @IsOptional()
  @IsIn(['full', 'quick'])
  type?: 'full' | 'quick';
}
