export {
  ImageOptimizationService,
  imageOptimization,
  IMAGE_VARIANTS,
  QUALITY_THRESHOLDS,
  MAX_FILE_SIZES,
  getOptimalImageUrl,
  generateSrcSet,
  getQualityLabel,
  type ImageVariant,
  type ProcessedImage,
  type ImageVariantResult,
  type OptimizationOptions,
} from './image-optimization';

export {
  useImageOptimization,
  useBatchImageOptimization,
  useImagePreview,
  useImageQuality,
  useColorExtraction,
  type UseImageOptimizationOptions,
  type UseImageOptimizationReturn,
  type UseBatchImageOptimizationReturn,
  type UseImagePreviewReturn,
  type UseImageQualityReturn,
  type UseColorExtractionReturn,
  type BatchProcessResult,
  type ImageQualityInfo,
  type ColorExtractionResult,
} from './hooks';

// MED-1: Media Service
export { MediaService, IMAGE_VARIANTS as MEDIA_VARIANTS, S3_CONFIG } from './media-service';

// MED-5: Excel Image Import
export { ExcelImageImportService, type ImportResult } from './excel-image-import';
