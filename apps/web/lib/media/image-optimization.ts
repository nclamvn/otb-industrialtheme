// ============================================================
// IMAGE OPTIMIZATION SERVICE - DAFC OTB Platform
// Handles image processing, optimization, and variant generation
// ============================================================

// ============================================================
// Types
// ============================================================

export interface ImageVariant {
  name: 'hero' | 'card' | 'thumb' | 'mini' | 'zoom';
  width: number;
  height: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
}

export interface ProcessedImage {
  original: {
    url: string;
    width: number;
    height: number;
    size: number;
    format: string;
  };
  variants: {
    hero?: ImageVariantResult;
    card?: ImageVariantResult;
    thumb?: ImageVariantResult;
    mini?: ImageVariantResult;
    zoom?: ImageVariantResult;
  };
  metadata: {
    dominantColor?: string;
    colorPalette?: string[];
    qualityScore?: number;
    aspectRatio: number;
    processedAt: string;
  };
}

export interface ImageVariantResult {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface OptimizationOptions {
  variants?: ImageVariant['name'][];
  extractColors?: boolean;
  calculateQuality?: boolean;
  maxOriginalSize?: number; // in bytes
  preserveOriginal?: boolean;
}

// ============================================================
// Constants
// ============================================================

// Standard image variants for DAFC OTB Platform
export const IMAGE_VARIANTS: Record<ImageVariant['name'], Omit<ImageVariant, 'name'>> = {
  hero: { width: 1200, height: 1600, quality: 90, format: 'webp' },
  card: { width: 400, height: 533, quality: 85, format: 'webp' },
  thumb: { width: 200, height: 267, quality: 80, format: 'webp' },
  mini: { width: 40, height: 40, quality: 75, format: 'webp' },
  zoom: { width: 2400, height: 3200, quality: 95, format: 'webp' },
};

// Quality thresholds
export const QUALITY_THRESHOLDS = {
  excellent: 90,
  good: 70,
  acceptable: 50,
  poor: 30,
};

// Max file sizes (in bytes)
export const MAX_FILE_SIZES = {
  hero: 500 * 1024, // 500KB
  card: 150 * 1024, // 150KB
  thumb: 50 * 1024, // 50KB
  mini: 10 * 1024, // 10KB
  zoom: 2 * 1024 * 1024, // 2MB
  original: 10 * 1024 * 1024, // 10MB
};

// ============================================================
// Image Optimization Service
// ============================================================

export class ImageOptimizationService {
  private static instance: ImageOptimizationService;

  private constructor() {}

  static getInstance(): ImageOptimizationService {
    if (!this.instance) {
      this.instance = new ImageOptimizationService();
    }
    return this.instance;
  }

  /**
   * Process an image file and generate variants
   */
  async processImage(
    file: File,
    options: OptimizationOptions = {}
  ): Promise<ProcessedImage> {
    const {
      variants = ['hero', 'card', 'thumb', 'mini'],
      extractColors = true,
      calculateQuality = true,
      maxOriginalSize = MAX_FILE_SIZES.original,
      preserveOriginal = true,
    } = options;

    // Validate file
    this.validateFile(file, maxOriginalSize);

    // Read file as data URL
    const dataUrl = await this.readFileAsDataUrl(file);

    // Get original dimensions
    const { width, height } = await this.getImageDimensions(dataUrl);

    // Extract colors if requested
    const colorData = extractColors
      ? await this.extractColors(dataUrl)
      : { dominantColor: undefined, colorPalette: undefined };

    // Calculate quality score if requested
    const qualityScore = calculateQuality
      ? await this.calculateQualityScore(dataUrl, width, height)
      : undefined;

    // Generate variants
    const generatedVariants: ProcessedImage['variants'] = {};
    for (const variantName of variants) {
      const variantConfig = IMAGE_VARIANTS[variantName];
      generatedVariants[variantName] = await this.generateVariant(
        dataUrl,
        { name: variantName, ...variantConfig },
        width,
        height
      );
    }

    return {
      original: {
        url: preserveOriginal ? dataUrl : '',
        width,
        height,
        size: file.size,
        format: file.type.split('/')[1] || 'unknown',
      },
      variants: generatedVariants,
      metadata: {
        ...colorData,
        qualityScore,
        aspectRatio: width / height,
        processedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate a single variant from source image
   */
  async generateVariant(
    sourceUrl: string,
    variant: ImageVariant,
    sourceWidth: number,
    sourceHeight: number
  ): Promise<ImageVariantResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate dimensions maintaining aspect ratio
        const sourceAspect = sourceWidth / sourceHeight;
        const targetAspect = variant.width / variant.height;

        let drawWidth = variant.width;
        let drawHeight = variant.height;
        let offsetX = 0;
        let offsetY = 0;

        if (sourceAspect > targetAspect) {
          // Source is wider - fit to height
          drawWidth = variant.height * sourceAspect;
          offsetX = (drawWidth - variant.width) / 2;
        } else {
          // Source is taller - fit to width
          drawHeight = variant.width / sourceAspect;
          offsetY = (drawHeight - variant.height) / 2;
        }

        canvas.width = variant.width;
        canvas.height = variant.height;

        // Draw with center crop
        ctx.drawImage(img, -offsetX, -offsetY, drawWidth, drawHeight);

        // Convert to target format
        const mimeType = `image/${variant.format}`;
        const quality = variant.quality / 100;
        const dataUrl = canvas.toDataURL(mimeType, quality);

        // Calculate size
        const base64Length = dataUrl.split(',')[1]?.length || 0;
        const size = Math.ceil(base64Length * 0.75);

        resolve({
          url: dataUrl,
          width: variant.width,
          height: variant.height,
          size,
          format: variant.format,
        });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = sourceUrl;
    });
  }

  /**
   * Extract dominant color and color palette from image
   */
  async extractColors(
    imageUrl: string
  ): Promise<{ dominantColor?: string; colorPalette?: string[] }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({});
          return;
        }

        // Use small canvas for color sampling
        const sampleSize = 50;
        canvas.width = sampleSize;
        canvas.height = sampleSize;

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;

        // Simple color extraction using color bucketing
        const colorCounts: Record<string, number> = {};
        for (let i = 0; i < pixels.length; i += 4) {
          const r = Math.round(pixels[i] / 32) * 32;
          const g = Math.round(pixels[i + 1] / 32) * 32;
          const b = Math.round(pixels[i + 2] / 32) * 32;
          const hex = this.rgbToHex(r, g, b);
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        // Sort by frequency
        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([color]) => color);

        resolve({
          dominantColor: sortedColors[0],
          colorPalette: sortedColors.slice(0, 6),
        });
      };

      img.onerror = () => resolve({});
      img.src = imageUrl;
    });
  }

  /**
   * Calculate image quality score (0-100)
   */
  async calculateQualityScore(
    imageUrl: string,
    width: number,
    height: number
  ): Promise<number> {
    // Score based on multiple factors
    let score = 100;

    // Resolution check
    const minWidth = 800;
    const minHeight = 1000;
    if (width < minWidth || height < minHeight) {
      const widthPenalty = Math.max(0, (minWidth - width) / minWidth) * 30;
      const heightPenalty = Math.max(0, (minHeight - height) / minHeight) * 30;
      score -= widthPenalty + heightPenalty;
    }

    // Aspect ratio check (should be close to 3:4)
    const targetAspect = 3 / 4;
    const actualAspect = width / height;
    const aspectDiff = Math.abs(actualAspect - targetAspect);
    if (aspectDiff > 0.1) {
      score -= Math.min(20, aspectDiff * 50);
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Validate file before processing
   */
  private validateFile(file: File, maxSize: number): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  /**
   * Read file as data URL
   */
  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get image dimensions
   */
  private getImageDimensions(
    imageUrl: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
  }

  /**
   * Generate blur placeholder (tiny base64 image)
   */
  async generateBlurPlaceholder(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Tiny 10x10 image
        canvas.width = 10;
        canvas.height = 10;
        ctx.drawImage(img, 0, 0, 10, 10);

        resolve(canvas.toDataURL('image/jpeg', 0.1));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Get appropriate image URL for a given size
 */
export function getOptimalImageUrl(
  variants: ProcessedImage['variants'],
  targetWidth: number
): string {
  if (targetWidth <= 40 && variants.mini) return variants.mini.url;
  if (targetWidth <= 200 && variants.thumb) return variants.thumb.url;
  if (targetWidth <= 400 && variants.card) return variants.card.url;
  if (targetWidth <= 1200 && variants.hero) return variants.hero.url;
  return variants.zoom?.url || variants.hero?.url || '';
}

/**
 * Calculate optimal srcset for responsive images
 */
export function generateSrcSet(
  variants: ProcessedImage['variants']
): string {
  const entries: string[] = [];

  if (variants.mini) entries.push(`${variants.mini.url} ${variants.mini.width}w`);
  if (variants.thumb) entries.push(`${variants.thumb.url} ${variants.thumb.width}w`);
  if (variants.card) entries.push(`${variants.card.url} ${variants.card.width}w`);
  if (variants.hero) entries.push(`${variants.hero.url} ${variants.hero.width}w`);
  if (variants.zoom) entries.push(`${variants.zoom.url} ${variants.zoom.width}w`);

  return entries.join(', ');
}

/**
 * Get quality label from score
 */
export function getQualityLabel(score: number): { label: string; labelVi: string; color: string } {
  if (score >= QUALITY_THRESHOLDS.excellent) {
    return { label: 'Excellent', labelVi: 'Xuất sắc', color: 'text-green-600' };
  }
  if (score >= QUALITY_THRESHOLDS.good) {
    return { label: 'Good', labelVi: 'Tốt', color: 'text-blue-600' };
  }
  if (score >= QUALITY_THRESHOLDS.acceptable) {
    return { label: 'Acceptable', labelVi: 'Chấp nhận', color: 'text-yellow-600' };
  }
  return { label: 'Poor', labelVi: 'Kém', color: 'text-red-600' };
}

// Singleton export
export const imageOptimization = ImageOptimizationService.getInstance();
