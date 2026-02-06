import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum EditFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DECIMAL = 'DECIMAL',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

export enum EditStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  AUTO_APPROVED = 'AUTO_APPROVED',
}

// Fields that can cascade updates to other fields
export const CASCADE_RULES: Record<string, string[]> = {
  // SKUItem cascade rules
  'SKUItem.retailPrice': ['SKUItem.margin', 'SKUItem.orderValue'],
  'SKUItem.costPrice': ['SKUItem.margin'],
  'SKUItem.orderQuantity': ['SKUItem.orderValue', 'SKUProposal.totalUnits', 'SKUProposal.totalValue'],

  // OTBPlan cascade rules
  'OTBPlan.totalBudget': ['OTBPlan.allocatedBudget', 'OTBPlan.remainingBudget'],
  'OTBLineItem.allocatedAmount': ['OTBPlan.totalAllocated'],

  // Budget cascade rules
  'BudgetAllocation.totalAmount': ['BudgetAllocation.remainingAmount'],
};

// Auto-approve limits by field
export const AUTO_APPROVE_LIMITS: Record<string, { value?: number; percent?: number }> = {
  'SKUItem.orderQuantity': { percent: 10 },
  'SKUItem.retailPrice': { percent: 5 },
  'SKUItem.costPrice': { percent: 5 },
  'OTBLineItem.allocatedAmount': { percent: 15, value: 50000 },
};

export class CreateEditDto {
  @IsString()
  entityType: string;

  @IsString()
  entityId: string;

  @IsString()
  fieldName: string;

  @IsEnum(EditFieldType)
  fieldType: EditFieldType;

  @IsString()
  @IsOptional()
  fieldLabel?: string;

  @IsString()
  @IsOptional()
  oldValue?: string;

  @IsString()
  @IsOptional()
  newValue?: string;

  @IsObject()
  @IsOptional()
  oldValueJson?: any;

  @IsObject()
  @IsOptional()
  newValueJson?: any;

  @IsString()
  @IsOptional()
  editReason?: string;

  @IsString()
  @IsOptional()
  editSource?: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class BulkEditDto {
  edits: CreateEditDto[];

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  editReason?: string;
}

export class ApproveEditDto {
  @IsString()
  editId: string;

  @IsString()
  @IsOptional()
  approvalReason?: string;
}

export class RejectEditDto {
  @IsString()
  editId: string;

  @IsString()
  rejectionReason: string;
}

export class QueryEditHistoryDto {
  @IsString()
  @IsOptional()
  entityType?: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsString()
  @IsOptional()
  fieldName?: string;

  @IsString()
  @IsOptional()
  editedById?: string;

  @IsEnum(EditStatus)
  @IsOptional()
  status?: EditStatus;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class UndoEditDto {
  @IsString()
  editId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export interface EditResult {
  success: boolean;
  editId: string;
  status: EditStatus;
  requiresApproval: boolean;
  cascadeInfo?: CascadeInfo;
  error?: string;
}

export interface CascadeInfo {
  affectedFields: Array<{
    entityType: string;
    entityId: string;
    fieldName: string;
    oldValue: any;
    newValue: any;
  }>;
  recalculations: Array<{
    field: string;
    formula: string;
    result: any;
  }>;
}

export interface EditPermissionCheck {
  canEdit: boolean;
  requiresApproval: boolean;
  autoApproveLimit?: number;
  autoApprovePctLimit?: number;
  lockReason?: string;
}

export interface FieldLock {
  fieldName: string;
  lockedBy: string;
  lockedAt: Date;
  reason: string;
  expiresAt?: Date;
}
