import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsObject,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums matching Prisma schema
export enum BudgetNodeType {
  SEASON = 'SEASON',
  BRAND = 'BRAND',
  GENDER = 'GENDER',
  CATEGORY = 'CATEGORY',
  SUBCATEGORY = 'SUBCATEGORY',
  PRODUCT = 'PRODUCT',
}

export enum CardStatus {
  DRAFT = 'DRAFT',
  VERIFIED = 'VERIFIED',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  LOCKED = 'LOCKED',
}

export enum Gender {
  MEN = 'MEN',
  WOMEN = 'WOMEN',
  UNISEX = 'UNISEX',
  KIDS = 'KIDS',
}

// DTO for creating a tree node
export class CreateBudgetTreeNodeDto {
  @ApiProperty({ description: 'Parent node ID (null for root)' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ description: 'Node level in hierarchy (0-5)' })
  @IsInt()
  @Min(0)
  @Max(5)
  level: number;

  @ApiProperty({ description: 'Node name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: BudgetNodeType })
  @IsEnum(BudgetNodeType)
  nodeType: BudgetNodeType;

  @ApiProperty({ description: 'Budget value for this node' })
  @IsNumber()
  @Type(() => Number)
  budgetValue: number;

  @ApiPropertyOptional({ description: 'Allocated value' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  allocatedValue?: number;

  @ApiPropertyOptional({ description: 'Percentage of parent budget' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  percentage?: number;

  @ApiPropertyOptional({ enum: CardStatus })
  @IsEnum(CardStatus)
  @IsOptional()
  status?: CardStatus;

  @ApiPropertyOptional({ description: 'Reference to brand' })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Reference to category' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Reference to subcategory' })
  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// DTO for updating a tree node
export class UpdateBudgetTreeNodeDto {
  @ApiPropertyOptional({ description: 'Node name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Budget value for this node' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  budgetValue?: number;

  @ApiPropertyOptional({ description: 'Allocated value' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  allocatedValue?: number;

  @ApiPropertyOptional({ description: 'Percentage of parent budget' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  percentage?: number;

  @ApiPropertyOptional({ enum: CardStatus })
  @IsEnum(CardStatus)
  @IsOptional()
  status?: CardStatus;

  @ApiPropertyOptional({ description: 'Whether node is locked' })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// DTO for initializing tree from master data
export class InitializeTreeDto {
  @ApiPropertyOptional({ description: 'Include brands breakdown' })
  @IsBoolean()
  @IsOptional()
  includeBrands?: boolean;

  @ApiPropertyOptional({ description: 'Include genders breakdown' })
  @IsBoolean()
  @IsOptional()
  includeGenders?: boolean;

  @ApiPropertyOptional({ description: 'Include categories breakdown' })
  @IsBoolean()
  @IsOptional()
  includeCategories?: boolean;

  @ApiPropertyOptional({ description: 'Include subcategories breakdown' })
  @IsBoolean()
  @IsOptional()
  includeSubcategories?: boolean;

  @ApiPropertyOptional({ description: 'Default allocation percentages by level' })
  @IsObject()
  @IsOptional()
  defaultPercentages?: Record<string, number>;
}

// DTO for batch updating nodes
export class BatchUpdateNodesDto {
  @ApiProperty({ description: 'Array of node updates' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NodeUpdateItem)
  updates: NodeUpdateItem[];
}

export class NodeUpdateItem {
  @ApiProperty({ description: 'Node ID to update' })
  @IsString()
  nodeId: string;

  @ApiProperty({ description: 'New budget value' })
  @IsNumber()
  @Type(() => Number)
  budgetValue: number;

  @ApiPropertyOptional({ description: 'Change reason' })
  @IsString()
  @IsOptional()
  reason?: string;
}

// Response types
export class BudgetTreeNodeResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  budgetId: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiProperty()
  level: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: BudgetNodeType })
  nodeType: BudgetNodeType;

  @ApiProperty()
  budgetValue: number;

  @ApiProperty()
  allocatedValue: number;

  @ApiProperty()
  percentage: number;

  @ApiProperty({ enum: CardStatus })
  status: CardStatus;

  @ApiPropertyOptional()
  brandId?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  subcategoryId?: string;

  @ApiPropertyOptional({ enum: Gender })
  gender?: Gender;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isLocked: boolean;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: () => [BudgetTreeNodeResponse] })
  children?: BudgetTreeNodeResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
