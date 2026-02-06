import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsInt,
  IsArray,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums matching Prisma schema
export enum BudgetVersionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CURRENT = 'CURRENT',
  ARCHIVED = 'ARCHIVED',
}

export enum BudgetChangeType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  REALLOC = 'REALLOC',
  MERGE = 'MERGE',
  SPLIT = 'SPLIT',
}

// DTO for creating a new version (snapshot)
export class CreateBudgetVersionDto {
  @ApiProperty({ description: 'Version name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Version description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Tags for filtering', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

// DTO for updating version metadata
export class UpdateBudgetVersionDto {
  @ApiPropertyOptional({ description: 'Version name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Version description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Tags for filtering', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

// DTO for submitting a version
export class SubmitBudgetVersionDto {
  @ApiPropertyOptional({ description: 'Submission comments' })
  @IsString()
  @IsOptional()
  comments?: string;
}

// DTO for approving a version
export class ApproveBudgetVersionDto {
  @ApiPropertyOptional({ description: 'Approval comments' })
  @IsString()
  @IsOptional()
  comments?: string;
}

// DTO for rejecting a version
export class RejectBudgetVersionDto {
  @ApiProperty({ description: 'Rejection reason' })
  @IsString()
  reason: string;
}

// DTO for comparing versions
export class CompareVersionsDto {
  @ApiProperty({ description: 'First version ID or number' })
  @IsString()
  version1: string;

  @ApiProperty({ description: 'Second version ID or number' })
  @IsString()
  version2: string;
}

// DTO for rollback
export class RollbackVersionDto {
  @ApiPropertyOptional({ description: 'Create a new version before rollback' })
  @IsOptional()
  createBackup?: boolean;

  @ApiPropertyOptional({ description: 'Reason for rollback' })
  @IsString()
  @IsOptional()
  reason?: string;
}

// Query DTO for listing versions
export class ListVersionsQueryDto {
  @ApiPropertyOptional({ description: 'Page number' })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by status', enum: BudgetVersionStatus })
  @IsEnum(BudgetVersionStatus)
  @IsOptional()
  status?: BudgetVersionStatus;

  @ApiPropertyOptional({ description: 'Filter by tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

// Response types
export class BudgetVersionChangeResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nodeId: string;

  @ApiProperty()
  nodeName: string;

  @ApiProperty({ description: 'Path from root to node' })
  nodePath: string[];

  @ApiProperty({ enum: BudgetChangeType })
  changeType: BudgetChangeType;

  @ApiProperty({ description: 'Field that changed' })
  field: string;

  @ApiPropertyOptional()
  oldValue?: string;

  @ApiPropertyOptional()
  newValue?: string;

  @ApiPropertyOptional({ description: 'Numeric difference' })
  diff?: number;

  @ApiPropertyOptional({ description: 'Percentage difference' })
  diffPercent?: number;

  @ApiProperty()
  changedAt: Date;
}

export class BudgetVersionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  budgetId: string;

  @ApiProperty()
  versionNumber: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: BudgetVersionStatus })
  status: BudgetVersionStatus;

  @ApiProperty({ description: 'Full tree snapshot as JSON' })
  snapshotData: Record<string, any>;

  @ApiProperty()
  totalBudget: number;

  @ApiProperty()
  totalAllocated: number;

  @ApiProperty()
  nodeCount: number;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ type: [BudgetVersionChangeResponse] })
  changes?: BudgetVersionChangeResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  createdById: string;

  @ApiPropertyOptional()
  createdBy?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };

  @ApiPropertyOptional()
  submittedAt?: Date;

  @ApiPropertyOptional()
  submittedById?: string;

  @ApiPropertyOptional()
  approvedAt?: Date;

  @ApiPropertyOptional()
  approvedById?: string;

  @ApiPropertyOptional()
  approvalComments?: string;

  @ApiPropertyOptional()
  rejectedAt?: Date;

  @ApiPropertyOptional()
  rejectedById?: string;

  @ApiPropertyOptional()
  rejectionReason?: string;
}

export class VersionComparisonNodeChange {
  @ApiProperty()
  nodeId: string;

  @ApiProperty()
  nodeName: string;

  @ApiProperty({ description: 'Path from root' })
  nodePath: string[];

  @ApiProperty({ enum: ['added', 'removed', 'modified', 'unchanged'] })
  status: 'added' | 'removed' | 'modified' | 'unchanged';

  @ApiPropertyOptional({ description: 'Value in version 1' })
  value1?: number;

  @ApiPropertyOptional({ description: 'Value in version 2' })
  value2?: number;

  @ApiPropertyOptional({ description: 'Difference (v2 - v1)' })
  diff?: number;

  @ApiPropertyOptional({ description: 'Percentage change' })
  diffPercent?: number;
}

export class VersionComparisonResponse {
  @ApiProperty()
  version1: BudgetVersionResponse;

  @ApiProperty()
  version2: BudgetVersionResponse;

  @ApiProperty({ description: 'Summary of changes' })
  summary: {
    totalBudgetDiff: number;
    totalBudgetDiffPercent: number;
    totalAllocatedDiff: number;
    totalAllocatedDiffPercent: number;
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    nodesUnchanged: number;
  };

  @ApiProperty({ type: [VersionComparisonNodeChange] })
  changes: VersionComparisonNodeChange[];
}

export class VersionListResponse {
  @ApiProperty({ type: [BudgetVersionResponse] })
  data: BudgetVersionResponse[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
