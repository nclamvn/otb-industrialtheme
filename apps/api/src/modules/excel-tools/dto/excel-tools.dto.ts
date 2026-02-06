/**
 * Excel Tools DTOs
 * Request/Response types for NL Formula and Data Cleaner APIs
 */

import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================
// NL Formula DTOs
// ============================================================

export class NLFormulaRequestDto {
  @ApiProperty({
    description: 'Vietnamese natural language input',
    example: 'tính margin từ giá bán và giá vốn',
  })
  @IsString()
  input: string;

  @ApiPropertyOptional({
    description: 'Context values for formula evaluation',
    example: { retailPrice: 150, costPrice: 60 },
  })
  @IsOptional()
  context?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Return alternative formula suggestions',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  returnAlternatives?: boolean;
}

export class FormulaIntentDto {
  @ApiProperty({ example: 'CALCULATE_MARGIN' })
  type: string;

  @ApiProperty({ example: 0.85 })
  confidence: number;

  @ApiProperty({ example: ['retailPrice', 'costPrice'] })
  fields: string[];

  @ApiProperty({ example: [] })
  operations: string[];

  @ApiProperty({ example: 'tính margin từ giá bán và giá vốn' })
  rawInput: string;

  @ApiPropertyOptional({ example: '=(retailPrice-costPrice)/retailPrice*100' })
  suggestedFormula?: string;

  @ApiPropertyOptional({ example: 'Tính margin % = (Giá bán - Giá vốn) / Giá bán × 100' })
  description?: string;
}

export class NLFormulaResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '=(retailPrice-costPrice)/retailPrice*100' })
  formula: string;

  @ApiProperty()
  intent: FormulaIntentDto;

  @ApiPropertyOptional()
  alternativeIntents?: FormulaIntentDto[];

  @ApiProperty({ example: 5 })
  executionTime: number;
}

export class FormulaSuggestionDto {
  @ApiProperty({ example: '=(retailPrice-costPrice)/retailPrice*100' })
  formula: string;

  @ApiProperty({ example: 'Tính margin %' })
  description: string;

  @ApiProperty({ example: 0.8 })
  confidence: number;
}

export class FormulaSuggestionsResponseDto {
  @ApiProperty({ type: [FormulaSuggestionDto] })
  suggestions: FormulaSuggestionDto[];

  @ApiProperty({ example: 'tính' })
  query: string;
}

// ============================================================
// Data Quality DTOs
// ============================================================

export class DataQualityAnalyzeRequestDto {
  @ApiProperty({
    description: 'Array of data rows to analyze',
    example: [
      { sku: 'SKU001', styleName: 'Shirt', retailPrice: 150, costPrice: 60, quantity: 100 },
    ],
  })
  @IsArray()
  data: Record<string, unknown>[];

  @ApiPropertyOptional({
    description: 'Required columns to validate',
    example: ['sku', 'retailPrice', 'costPrice'],
  })
  @IsOptional()
  @IsArray()
  requiredColumns?: string[];

  @ApiPropertyOptional({
    description: 'Numeric columns for outlier detection',
    example: ['retailPrice', 'costPrice', 'quantity'],
  })
  @IsOptional()
  @IsArray()
  numericColumns?: string[];

  @ApiPropertyOptional({
    description: 'Category columns for consistency check',
    example: ['category', 'gender'],
  })
  @IsOptional()
  @IsArray()
  categoryColumns?: string[];

  @ApiPropertyOptional({
    description: 'Outlier threshold (standard deviations)',
    default: 3,
  })
  @IsOptional()
  @IsNumber()
  outlierThreshold?: number;
}

export class DataIssueDto {
  @ApiProperty({ example: 'DUPLICATE-3-sku-1234567890' })
  id: string;

  @ApiProperty({ example: 'DUPLICATE' })
  type: string;

  @ApiProperty({ example: 'critical' })
  severity: 'critical' | 'warning' | 'info';

  @ApiProperty({ example: 3 })
  row: number;

  @ApiProperty({ example: 'sku' })
  column: string;

  @ApiProperty({ example: 'SKU001' })
  value: unknown;

  @ApiProperty({ example: 'Hàng trùng lặp với hàng 2' })
  message: string;

  @ApiPropertyOptional({ example: 'Xóa hàng trùng lặp' })
  suggestion?: string;

  @ApiProperty({ example: true })
  autoFixable: boolean;

  @ApiPropertyOptional({ example: null })
  fixedValue?: unknown;
}

export class DataQualityScoreDto {
  @ApiProperty({ example: 85.5 })
  overall: number;

  @ApiProperty({ example: 90 })
  completeness: number;

  @ApiProperty({ example: 85 })
  accuracy: number;

  @ApiProperty({ example: 80 })
  consistency: number;

  @ApiProperty({ example: 87 })
  validity: number;
}

export class CleaningSummaryDto {
  @ApiProperty({ example: 2 })
  duplicatesRemoved: number;

  @ApiProperty({ example: 0 })
  missingValuesFilled: number;

  @ApiProperty({ example: 1 })
  outliersDetected: number;

  @ApiProperty({ example: 3 })
  formatErrorsFixed: number;

  @ApiProperty({ example: 2 })
  inconsistenciesFixed: number;

  @ApiProperty({ example: 15 })
  executionTimeMs: number;
}

export class DataQualityAnalyzeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 100 })
  originalRowCount: number;

  @ApiProperty({ example: 5 })
  issuesFound: number;

  @ApiProperty({ type: [DataIssueDto] })
  issues: DataIssueDto[];

  @ApiProperty()
  qualityScore: DataQualityScoreDto;

  @ApiProperty()
  summary: CleaningSummaryDto;
}

export class DataQualityFixRequestDto extends DataQualityAnalyzeRequestDto {
  @ApiPropertyOptional({
    description: 'Remove duplicate rows',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  removeDuplicates?: boolean;

  @ApiPropertyOptional({
    description: 'Auto-fix format and consistency issues',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoFix?: boolean;
}

export class DataQualityFixResponseDto extends DataQualityAnalyzeResponseDto {
  @ApiProperty({ example: 98 })
  cleanedRowCount: number;

  @ApiProperty({ example: 7 })
  issuesFixed: number;

  @ApiProperty({
    description: 'Cleaned data array',
    example: [{ sku: 'SKU001', retailPrice: 150 }],
  })
  cleanedData: Record<string, unknown>[];
}
