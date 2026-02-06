import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums matching Prisma schema
export enum GapSeverity {
  OK = 'OK',
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum GapType {
  BALANCED = 'BALANCED',
  UNDER = 'UNDER',
  OVER = 'OVER',
}

export enum BudgetSuggestionType {
  REALLOCATE = 'REALLOCATE',
  AUTO_BALANCE = 'AUTO_BALANCE',
  INCREASE_BUDGET = 'INCREASE_BUDGET',
  DECREASE_BUDGET = 'DECREASE_BUDGET',
  SPLIT_ALLOCATION = 'SPLIT_ALLOCATION',
  MERGE_ALLOCATION = 'MERGE_ALLOCATION',
  PRIORITIZE = 'PRIORITIZE',
  DEFER = 'DEFER',
}

export enum BudgetSuggestionStatus {
  PENDING = 'PENDING',
  APPLIED = 'APPLIED',
  DISMISSED = 'DISMISSED',
  EXPIRED = 'EXPIRED',
}

export enum SuggestionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// DTO for running gap analysis
export class AnalyzeGapsDto {
  @ApiPropertyOptional({ description: 'Minimum gap percentage to include' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  minGapPercent?: number;

  @ApiPropertyOptional({ description: 'Only analyze specific levels' })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  levels?: number[];

  @ApiPropertyOptional({ description: 'Include children analysis' })
  @IsOptional()
  includeChildren?: boolean;
}

// DTO for generating AI suggestions
export class GenerateSuggestionsDto {
  @ApiPropertyOptional({ description: 'Maximum number of suggestions' })
  @IsInt()
  @IsOptional()
  maxSuggestions?: number;

  @ApiPropertyOptional({ description: 'Minimum confidence score (0-100)' })
  @IsInt()
  @IsOptional()
  minConfidence?: number;

  @ApiPropertyOptional({ description: 'Focus on specific node IDs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  focusNodeIds?: string[];

  @ApiPropertyOptional({ description: 'Suggestion types to include', type: [String], enum: BudgetSuggestionType })
  @IsArray()
  @IsEnum(BudgetSuggestionType, { each: true })
  @IsOptional()
  types?: BudgetSuggestionType[];
}

// DTO for applying a suggestion
export class ApplySuggestionDto {
  @ApiPropertyOptional({ description: 'Partial apply - only apply to specific nodes' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applyToNodeIds?: string[];

  @ApiPropertyOptional({ description: 'Comment for the change' })
  @IsString()
  @IsOptional()
  comment?: string;
}

// DTO for dismissing a suggestion
export class DismissSuggestionDto {
  @ApiProperty({ description: 'Reason for dismissing' })
  @IsString()
  reason: string;
}

// Response types
export class GapAnalysisResultResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  budgetId: string;

  @ApiProperty()
  nodeId: string;

  @ApiProperty()
  nodeName: string;

  @ApiProperty({ description: 'Path from root to node' })
  nodePath: string[];

  @ApiProperty()
  nodeLevel: number;

  @ApiProperty()
  budgetValue: number;

  @ApiProperty()
  allocatedValue: number;

  @ApiProperty({ description: 'Gap amount (budget - allocated)' })
  gap: number;

  @ApiProperty({ description: 'Gap as percentage of budget' })
  gapPercent: number;

  @ApiProperty({ enum: GapSeverity })
  severity: GapSeverity;

  @ApiProperty({ enum: GapType })
  type: GapType;

  @ApiProperty()
  childrenWithGaps: number;

  @ApiProperty()
  totalChildren: number;

  @ApiProperty()
  analyzedAt: Date;
}

export class SuggestionActionResponse {
  @ApiProperty()
  nodeId: string;

  @ApiProperty()
  nodeName: string;

  @ApiProperty({ description: 'Field to change' })
  field: string;

  @ApiProperty()
  currentValue: number;

  @ApiProperty()
  newValue: number;

  @ApiProperty()
  change: number;
}

export class AffectedNodeResponse {
  @ApiProperty()
  nodeId: string;

  @ApiProperty()
  nodeName: string;

  @ApiProperty()
  change: number;
}

export class BudgetSuggestionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  budgetId: string;

  @ApiProperty({ enum: BudgetSuggestionType })
  type: BudgetSuggestionType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional({ description: 'AI reasoning for this suggestion' })
  reasoning?: string;

  @ApiProperty()
  impactAmount: number;

  @ApiProperty()
  impactPercent: number;

  @ApiProperty({ type: [AffectedNodeResponse] })
  affectedNodes: AffectedNodeResponse[];

  @ApiProperty({ description: 'Confidence score 0-100' })
  confidence: number;

  @ApiProperty({ enum: SuggestionPriority })
  priority: SuggestionPriority;

  @ApiProperty({ type: [SuggestionActionResponse] })
  actions: SuggestionActionResponse[];

  @ApiProperty({ enum: BudgetSuggestionStatus })
  status: BudgetSuggestionStatus;

  @ApiPropertyOptional()
  appliedAt?: Date;

  @ApiPropertyOptional()
  appliedById?: string;

  @ApiPropertyOptional()
  dismissedAt?: Date;

  @ApiPropertyOptional()
  dismissedById?: string;

  @ApiPropertyOptional()
  dismissReason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;
}

export class GapAnalysisSummaryResponse {
  @ApiProperty()
  totalNodes: number;

  @ApiProperty()
  nodesWithGaps: number;

  @ApiProperty()
  totalBudget: number;

  @ApiProperty()
  totalAllocated: number;

  @ApiProperty()
  totalGap: number;

  @ApiProperty()
  avgGapPercent: number;

  @ApiProperty({ description: 'Nodes by severity' })
  bySeverity: {
    ok: number;
    info: number;
    warning: number;
    critical: number;
  };

  @ApiProperty({ description: 'Nodes by gap type' })
  byType: {
    balanced: number;
    under: number;
    over: number;
  };

  @ApiProperty({ type: [GapAnalysisResultResponse] })
  results: GapAnalysisResultResponse[];
}
