import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

// Mirror enums from Prisma
export enum MediaType {
  HERO = 'HERO',
  CARD = 'CARD',
  THUMBNAIL = 'THUMBNAIL',
  MINI = 'MINI',
  ZOOM = 'ZOOM',
  SWATCH = 'SWATCH',
  LIFESTYLE = 'LIFESTYLE',
  FLAT_LAY = 'FLAT_LAY',
  DETAIL = 'DETAIL',
  VIDEO_THUMB = 'VIDEO_THUMB',
}

export enum MediaStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

export enum MediaSource {
  UPLOAD = 'UPLOAD',
  SUPPLIER = 'SUPPLIER',
  AI_GENERATED = 'AI_GENERATED',
  EXTERNAL = 'EXTERNAL',
}

// Image variant specifications based on CODER PACK
export const IMAGE_VARIANTS = {
  hero: { width: 1200, height: 1600, quality: 90, format: 'webp' as const },
  card: { width: 600, height: 800, quality: 85, format: 'webp' as const },
  thumb: { width: 400, height: 400, quality: 80, format: 'webp' as const },
  mini: { width: 64, height: 64, quality: 75, format: 'webp' as const },
  zoom: { width: 4000, height: null, quality: 95, format: 'webp' as const }, // Height auto
} as const;

export class UploadMediaDto {
  @IsString()
  @IsOptional()
  skuItemId?: string;

  @IsString()
  @IsOptional()
  styleCode?: string;

  @IsString()
  @IsOptional()
  colorCode?: string;

  @IsEnum(MediaType)
  @IsOptional()
  type?: MediaType = MediaType.HERO;

  @IsEnum(MediaSource)
  @IsOptional()
  source?: MediaSource = MediaSource.UPLOAD;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number = 0;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;

  @IsString()
  @IsOptional()
  altText?: string;

  @IsString()
  @IsOptional()
  caption?: string;
}

export class UploadExternalMediaDto extends UploadMediaDto {
  @IsUrl()
  imageUrl: string;
}

export class UpdateMediaDto {
  @IsEnum(MediaType)
  @IsOptional()
  type?: MediaType;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  altText?: string;

  @IsString()
  @IsOptional()
  caption?: string;
}

export class QueryMediaDto {
  @IsString()
  @IsOptional()
  skuItemId?: string;

  @IsString()
  @IsOptional()
  styleCode?: string;

  @IsString()
  @IsOptional()
  colorCode?: string;

  @IsEnum(MediaType)
  @IsOptional()
  type?: MediaType;

  @IsEnum(MediaStatus)
  @IsOptional()
  status?: MediaStatus;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPrimary?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class BulkUploadDto {
  @IsString()
  skuItemIds: string[];
}

export class ReorderMediaDto {
  @IsString({ each: true })
  mediaIds: string[];
}

export interface ImageVariantConfig {
  width: number;
  height: number | null;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
}

export interface ProcessedVariants {
  hero?: string;
  card?: string;
  thumb?: string;
  mini?: string;
  zoom?: string;
  [key: string]: string | undefined;
}

export interface ImageAnalysis {
  dominantColor: string;
  colorPalette: string[];
  qualityScore: number;
  isTransparent: boolean;
  hasBackground: boolean;
  aiTags?: string[];
}

export interface MediaUploadResult {
  id: string;
  originalUrl: string;
  variants: ProcessedVariants;
  status: MediaStatus;
  analysis?: ImageAnalysis;
}
