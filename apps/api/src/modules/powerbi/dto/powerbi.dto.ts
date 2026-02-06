import { IsString, IsOptional, IsArray, IsEnum, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PowerBIReportType {
  SALES_DASHBOARD = 'SALES_DASHBOARD',
  INVENTORY_ANALYTICS = 'INVENTORY_ANALYTICS',
  OTB_OVERVIEW = 'OTB_OVERVIEW',
  KPI_SCORECARD = 'KPI_SCORECARD',
  TREND_ANALYSIS = 'TREND_ANALYSIS',
  CUSTOM = 'CUSTOM',
}

export class EmbedTokenRequestDto {
  @ApiProperty({ description: 'Power BI Report ID' })
  @IsString()
  reportId: string;

  @ApiPropertyOptional({ description: 'Power BI Group/Workspace ID' })
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ description: 'Power BI Dataset ID' })
  @IsString()
  @IsOptional()
  datasetId?: string;

  @ApiPropertyOptional({ description: 'Row-level security roles to apply' })
  @IsArray()
  @IsOptional()
  roles?: string[];

  @ApiPropertyOptional({ description: 'Additional filter to apply' })
  @IsObject()
  @IsOptional()
  filter?: Record<string, unknown>;
}

export class PowerBIReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: PowerBIReportType })
  type: PowerBIReportType;

  @ApiProperty()
  powerbiReportId: string;

  @ApiPropertyOptional()
  powerbiGroupId?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  thumbnail?: string;

  @ApiPropertyOptional({ description: 'Default filters to apply' })
  defaultFilters?: Record<string, unknown>;
}

export class CreatePowerBIReportDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: PowerBIReportType })
  @IsEnum(PowerBIReportType)
  type: PowerBIReportType;

  @ApiProperty({ description: 'Power BI Report ID from Power BI Service' })
  @IsString()
  powerbiReportId: string;

  @ApiPropertyOptional({ description: 'Power BI Workspace/Group ID' })
  @IsString()
  @IsOptional()
  powerbiGroupId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  defaultFilters?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePowerBIReportDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: PowerBIReportType })
  @IsEnum(PowerBIReportType)
  @IsOptional()
  type?: PowerBIReportType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  powerbiReportId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  powerbiGroupId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  defaultFilters?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class EmbedTokenResponseDto {
  @ApiProperty({ description: 'Power BI Embed Token' })
  token: string;

  @ApiProperty({ description: 'Token expiration time' })
  expiration: Date;

  @ApiProperty({ description: 'Embed URL for the report' })
  embedUrl: string;

  @ApiProperty({ description: 'Report ID' })
  reportId: string;
}

export class PowerBIConfigDto {
  @ApiProperty({ description: 'Whether Power BI is configured' })
  isConfigured: boolean;

  @ApiPropertyOptional({ description: 'Power BI Tenant ID' })
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Power BI Client ID (App ID)' })
  clientId?: string;

  @ApiProperty({ description: 'Available report types' })
  availableReportTypes: PowerBIReportType[];
}
