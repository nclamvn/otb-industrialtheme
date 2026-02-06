import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsInt,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OTBPlanVersionType {
  SYSTEM_PROPOSED = 'SYSTEM_PROPOSED',
  USER_ADJUSTED = 'USER_ADJUSTED',
  FINANCE_REVIEWED = 'FINANCE_REVIEWED',
  BOD_APPROVED = 'BOD_APPROVED',
  BRAND_CONSENSUS = 'BRAND_CONSENSUS',
}

export enum OTBPlanVersionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUPERSEDED = 'SUPERSEDED',
}

export class CreateVersionDto {
  @IsString()
  otbPlanId: string;

  @IsEnum(OTBPlanVersionType)
  versionType: OTBPlanVersionType;

  @IsObject()
  snapshotData: Record<string, any>;

  @IsNumber()
  @Type(() => Number)
  totalOTBValue: number;

  @IsInt()
  @Type(() => Number)
  totalOTBUnits: number;

  @IsString()
  @IsOptional()
  comments?: string;
}

export class UpdateVersionDto {
  @IsEnum(OTBPlanVersionStatus)
  @IsOptional()
  status?: OTBPlanVersionStatus;

  @IsObject()
  @IsOptional()
  snapshotData?: Record<string, any>;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  totalOTBValue?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  totalOTBUnits?: number;

  @IsString()
  @IsOptional()
  approvalComments?: string;
}

export class SubmitVersionDto {
  @IsString()
  @IsOptional()
  comments?: string;
}

export class ApproveVersionDto {
  @IsString()
  @IsOptional()
  comments?: string;
}

export class RejectVersionDto {
  @IsString()
  reason: string;
}

export class RecordChangeDto {
  @IsString()
  entityType: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsString()
  fieldName: string;

  @IsString()
  @IsOptional()
  previousValue?: string;

  @IsString()
  @IsOptional()
  newValue?: string;

  @IsString()
  changeReason: string;
}
