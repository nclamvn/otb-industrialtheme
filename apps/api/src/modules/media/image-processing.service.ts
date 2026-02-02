import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');
import { IMAGE_VARIANTS, ImageVariantConfig, ProcessedVariants, ImageAnalysis } from './dto/media.dto';

interface ProcessingResult {
  variants: ProcessedVariants;
  analysis: ImageAnalysis;
  processingTimeMs: number;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);
  private readonly uploadDir: string;

  constructor() {
    // Configure upload directory from env or default
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      // Create subdirectories for variants
      const subdirs = ['original', 'hero', 'card', 'thumb', 'mini', 'zoom'];
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.uploadDir, subdir), { recursive: true });
      }
    } catch (error) {
      this.logger.error('Failed to create upload directories', error);
    }
  }

  /**
   * Process an uploaded image and generate all variants
   */
  async processImage(
    inputBuffer: Buffer,
    filename: string,
    mediaId: string,
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const variants: ProcessedVariants = {};

    try {
      // Get image metadata
      const metadata = await sharp(inputBuffer).metadata();
      this.logger.log(`Processing image: ${filename}, ${metadata.width}x${metadata.height}`);

      // Generate each variant
      const variantPromises = Object.entries(IMAGE_VARIANTS).map(async ([key, config]) => {
        const variantPath = await this.generateVariant(
          inputBuffer,
          mediaId,
          key as keyof typeof IMAGE_VARIANTS,
          config,
        );
        return { key, path: variantPath };
      });

      const results = await Promise.all(variantPromises);
      results.forEach(({ key, path }) => {
        variants[key as keyof ProcessedVariants] = path;
      });

      // Analyze image
      const analysis = await this.analyzeImage(inputBuffer);

      const processingTimeMs = Date.now() - startTime;
      this.logger.log(`Image processing completed in ${processingTimeMs}ms`);

      return { variants, analysis, processingTimeMs };
    } catch (error) {
      this.logger.error(`Image processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a single image variant
   */
  private async generateVariant(
    inputBuffer: Buffer,
    mediaId: string,
    variantName: keyof typeof IMAGE_VARIANTS,
    config: ImageVariantConfig,
  ): Promise<string> {
    const ext = config.format === 'webp' ? 'webp' : config.format === 'jpeg' ? 'jpg' : 'png';
    const filename = `${mediaId}_${variantName}.${ext}`;
    const outputPath = path.join(this.uploadDir, variantName, filename);

    let sharpInstance = sharp(inputBuffer);

    // Resize based on variant config
    if (config.height !== null) {
      // Fixed dimensions - cover mode for consistent aspect ratio
      sharpInstance = sharpInstance.resize(config.width, config.height, {
        fit: 'cover',
        position: 'centre',
      });
    } else {
      // Width only - maintain aspect ratio (for zoom variant)
      sharpInstance = sharpInstance.resize(config.width, null, {
        fit: 'inside',
        withoutEnlargement: false,
      });
    }

    // Apply format and quality
    switch (config.format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: config.quality });
        break;
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: config.quality, mozjpeg: true });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality: config.quality, compressionLevel: 9 });
        break;
    }

    await sharpInstance.toFile(outputPath);

    // Return relative path for storage
    return `/uploads/${variantName}/${filename}`;
  }

  /**
   * Analyze image for colors, quality, and properties
   */
  async analyzeImage(inputBuffer: Buffer): Promise<ImageAnalysis> {
    try {
      const image = sharp(inputBuffer);
      const metadata = await image.metadata();
      const stats = await image.stats();

      // Get dominant color from stats
      const dominantChannel = stats.channels[0]; // R channel for simplicity
      const dominantColor = this.rgbToHex(
        Math.round(stats.channels[0].mean),
        Math.round(stats.channels[1].mean),
        Math.round(stats.channels[2].mean),
      );

      // Generate color palette using resize + extract colors
      const colorPalette = await this.extractColorPalette(inputBuffer);

      // Check for transparency
      const isTransparent = metadata.hasAlpha && metadata.channels === 4;

      // Simple quality score based on resolution
      const qualityScore = this.calculateQualityScore(
        metadata.width || 0,
        metadata.height || 0,
      );

      // Detect if image has a background (simple heuristic)
      const hasBackground = !isTransparent || stats.channels[3]?.mean > 200;

      return {
        dominantColor,
        colorPalette,
        qualityScore,
        isTransparent,
        hasBackground,
      };
    } catch (error) {
      this.logger.warn(`Image analysis failed: ${error.message}`);
      return {
        dominantColor: '#000000',
        colorPalette: [],
        qualityScore: 50,
        isTransparent: false,
        hasBackground: true,
      };
    }
  }

  /**
   * Extract color palette from image
   */
  private async extractColorPalette(inputBuffer: Buffer): Promise<string[]> {
    try {
      // Resize to small image and extract colors
      const { data, info } = await sharp(inputBuffer)
        .resize(10, 10, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const colors: Set<string> = new Set();
      const channels = info.channels;

      for (let i = 0; i < data.length; i += channels) {
        const hex = this.rgbToHex(data[i], data[i + 1], data[i + 2]);
        colors.add(hex);
      }

      // Return unique colors (max 6)
      return Array.from(colors).slice(0, 6);
    } catch {
      return [];
    }
  }

  /**
   * Calculate quality score based on resolution
   */
  private calculateQualityScore(width: number, height: number): number {
    const idealWidth = 1200;
    const idealHeight = 1600;

    const widthScore = Math.min(100, (width / idealWidth) * 100);
    const heightScore = Math.min(100, (height / idealHeight) * 100);

    return Math.round((widthScore + heightScore) / 2);
  }

  /**
   * Convert RGB to hex color
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
      .map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Process image from URL (for external sources)
   */
  async processFromUrl(imageUrl: string, mediaId: string): Promise<ProcessingResult> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return this.processImage(buffer, `external_${mediaId}`, mediaId);
  }

  /**
   * Get image dimensions without full processing
   */
  async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  }

  /**
   * Validate image file
   */
  async validateImage(buffer: Buffer): Promise<{ valid: boolean; error?: string }> {
    try {
      const metadata = await sharp(buffer).metadata();

      // Check format
      const allowedFormats = ['jpeg', 'png', 'webp', 'gif', 'tiff'];
      if (!metadata.format || !allowedFormats.includes(metadata.format)) {
        return { valid: false, error: `Invalid format: ${metadata.format}` };
      }

      // Check minimum dimensions
      const minWidth = 200;
      const minHeight = 200;
      if ((metadata.width || 0) < minWidth || (metadata.height || 0) < minHeight) {
        return { valid: false, error: `Image too small. Minimum ${minWidth}x${minHeight} required.` };
      }

      // Check maximum file size (handled by multer but double-check)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (buffer.length > maxSize) {
        return { valid: false, error: 'Image file too large. Maximum 20MB allowed.' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Invalid image file: ${error.message}` };
    }
  }

  /**
   * Delete all variants of a media file
   */
  async deleteVariants(mediaId: string): Promise<void> {
    const variants = ['hero', 'card', 'thumb', 'mini', 'zoom'];
    const extensions = ['webp', 'jpg', 'png'];

    for (const variant of variants) {
      for (const ext of extensions) {
        const filePath = path.join(this.uploadDir, variant, `${mediaId}_${variant}.${ext}`);
        try {
          await fs.unlink(filePath);
        } catch {
          // File may not exist, ignore
        }
      }
    }
  }

  /**
   * Create placeholder image for missing media
   */
  async createPlaceholder(width: number, height: number): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 240, g: 240, b: 240, alpha: 1 },
      },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg width="${width}" height="${height}">
              <rect width="${width}" height="${height}" fill="#f0f0f0"/>
              <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="sans-serif" font-size="14">
                No Image
              </text>
            </svg>`
          ),
        },
      ])
      .webp()
      .toBuffer();
  }
}
