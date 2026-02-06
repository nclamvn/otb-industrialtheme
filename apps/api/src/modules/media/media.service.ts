import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImageProcessingService } from './image-processing.service';
import {
  UploadMediaDto,
  UploadExternalMediaDto,
  UpdateMediaDto,
  QueryMediaDto,
  ReorderMediaDto,
  MediaStatus,
  MediaUploadResult,
} from './dto/media.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageProcessing: ImageProcessingService,
  ) {}

  /**
   * Upload and process a new media file
   */
  async upload(
    file: Express.Multer.File,
    dto: UploadMediaDto,
    userId: string,
  ): Promise<MediaUploadResult> {
    // Validate the image
    const validation = await this.imageProcessing.validateImage(file.buffer);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // Get image dimensions
    const dimensions = await this.imageProcessing.getImageDimensions(file.buffer);

    // Create initial media record
    const media = await this.prisma.productMedia.create({
      data: {
        skuItemId: dto.skuItemId || null,
        styleCode: dto.styleCode || null,
        colorCode: dto.colorCode || null,
        type: dto.type || 'HERO',
        status: 'PROCESSING',
        source: dto.source || 'UPLOAD',
        sortOrder: dto.sortOrder || 0,
        isPrimary: dto.isPrimary || false,
        originalUrl: '', // Will be updated after upload
        originalFilename: file.originalname,
        originalMimeType: file.mimetype,
        originalSize: file.size,
        originalWidth: dimensions.width,
        originalHeight: dimensions.height,
        altText: dto.altText,
        caption: dto.caption,
        uploadedById: userId,
      },
    });

    try {
      // Process image and generate variants
      const result = await this.imageProcessing.processImage(
        file.buffer,
        file.originalname,
        media.id,
      );

      // Update media record with processed data
      const updatedMedia = await this.prisma.productMedia.update({
        where: { id: media.id },
        data: {
          status: 'READY',
          originalUrl: `/uploads/original/${media.id}_original.${file.mimetype.split('/')[1]}`,
          variants: result.variants,
          heroUrl: result.variants.hero,
          cardUrl: result.variants.card,
          thumbUrl: result.variants.thumb,
          miniUrl: result.variants.mini,
          zoomUrl: result.variants.zoom,
          dominantColor: result.analysis.dominantColor,
          colorPalette: result.analysis.colorPalette,
          qualityScore: result.analysis.qualityScore,
          isTransparent: result.analysis.isTransparent,
          hasBackground: result.analysis.hasBackground,
          processedAt: new Date(),
          processingTimeMs: result.processingTimeMs,
        },
      });

      // If this is primary, unset other primaries for same SKU
      if (dto.isPrimary && dto.skuItemId) {
        await this.setPrimaryMedia(media.id, dto.skuItemId);
      }

      return {
        id: updatedMedia.id,
        originalUrl: updatedMedia.originalUrl,
        variants: result.variants,
        status: MediaStatus.READY,
        analysis: result.analysis,
      };
    } catch (error) {
      // Mark as failed
      await this.prisma.productMedia.update({
        where: { id: media.id },
        data: {
          status: 'FAILED',
          processingError: error.message,
        },
      });

      this.logger.error(`Media processing failed for ${media.id}`, error);
      throw new BadRequestException(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Upload media from external URL
   */
  async uploadFromUrl(
    dto: UploadExternalMediaDto,
    userId: string,
  ): Promise<MediaUploadResult> {
    // Create initial record
    const media = await this.prisma.productMedia.create({
      data: {
        skuItemId: dto.skuItemId || null,
        styleCode: dto.styleCode || null,
        colorCode: dto.colorCode || null,
        type: dto.type || 'HERO',
        status: 'PROCESSING',
        source: 'EXTERNAL',
        sortOrder: dto.sortOrder || 0,
        isPrimary: dto.isPrimary || false,
        originalUrl: dto.imageUrl,
        originalFilename: dto.imageUrl.split('/').pop() || 'external',
        originalMimeType: 'image/unknown',
        originalSize: 0,
        altText: dto.altText,
        caption: dto.caption,
        uploadedById: userId,
      },
    });

    try {
      // Process from URL
      const result = await this.imageProcessing.processFromUrl(dto.imageUrl, media.id);

      // Update media record
      const updatedMedia = await this.prisma.productMedia.update({
        where: { id: media.id },
        data: {
          status: 'READY',
          variants: result.variants,
          heroUrl: result.variants.hero,
          cardUrl: result.variants.card,
          thumbUrl: result.variants.thumb,
          miniUrl: result.variants.mini,
          zoomUrl: result.variants.zoom,
          dominantColor: result.analysis.dominantColor,
          colorPalette: result.analysis.colorPalette,
          qualityScore: result.analysis.qualityScore,
          isTransparent: result.analysis.isTransparent,
          hasBackground: result.analysis.hasBackground,
          processedAt: new Date(),
          processingTimeMs: result.processingTimeMs,
        },
      });

      if (dto.isPrimary && dto.skuItemId) {
        await this.setPrimaryMedia(media.id, dto.skuItemId);
      }

      return {
        id: updatedMedia.id,
        originalUrl: updatedMedia.originalUrl,
        variants: result.variants,
        status: MediaStatus.READY,
        analysis: result.analysis,
      };
    } catch (error) {
      await this.prisma.productMedia.update({
        where: { id: media.id },
        data: {
          status: 'FAILED',
          processingError: error.message,
        },
      });
      throw new BadRequestException(`Failed to process external image: ${error.message}`);
    }
  }

  /**
   * Find all media with filters
   */
  async findAll(query: QueryMediaDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      status: { not: 'ARCHIVED' },
    };

    if (query.skuItemId) where.skuItemId = query.skuItemId;
    if (query.styleCode) where.styleCode = query.styleCode;
    if (query.colorCode) where.colorCode = query.colorCode;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (typeof query.isPrimary === 'boolean') where.isPrimary = query.isPrimary;

    const [data, total] = await Promise.all([
      this.prisma.productMedia.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          skuItem: {
            select: {
              id: true,
              skuCode: true,
              styleName: true,
              colorName: true,
            },
          },
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.productMedia.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find media by ID
   */
  async findOne(id: string) {
    const media = await this.prisma.productMedia.findUnique({
      where: { id },
      include: {
        skuItem: {
          select: {
            id: true,
            skuCode: true,
            styleName: true,
            colorName: true,
            colorCode: true,
          },
        },
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  /**
   * Get all media for a SKU
   */
  async findBySku(skuItemId: string) {
    return this.prisma.productMedia.findMany({
      where: {
        skuItemId,
        status: { not: 'ARCHIVED' },
      },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  /**
   * Get primary media for a SKU
   */
  async getPrimaryMedia(skuItemId: string) {
    return this.prisma.productMedia.findFirst({
      where: {
        skuItemId,
        isPrimary: true,
        status: 'READY',
      },
    });
  }

  /**
   * Update media metadata
   */
  async update(id: string, dto: UpdateMediaDto) {
    const media = await this.findOne(id);

    const updated = await this.prisma.productMedia.update({
      where: { id },
      data: {
        type: dto.type,
        sortOrder: dto.sortOrder,
        isPrimary: dto.isPrimary,
        altText: dto.altText,
        caption: dto.caption,
      },
    });

    // If setting as primary, unset others
    if (dto.isPrimary && media.skuItemId) {
      await this.setPrimaryMedia(id, media.skuItemId);
    }

    return updated;
  }

  /**
   * Set a media as primary (unsets others for same SKU)
   */
  private async setPrimaryMedia(mediaId: string, skuItemId: string) {
    await this.prisma.productMedia.updateMany({
      where: {
        skuItemId,
        id: { not: mediaId },
      },
      data: { isPrimary: false },
    });
  }

  /**
   * Reorder media for a SKU
   */
  async reorder(skuItemId: string, dto: ReorderMediaDto) {
    const updates = dto.mediaIds.map((id, index) =>
      this.prisma.productMedia.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await Promise.all(updates);

    return this.findBySku(skuItemId);
  }

  /**
   * Archive (soft delete) media
   */
  async archive(id: string) {
    const media = await this.findOne(id);

    await this.prisma.productMedia.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
      },
    });

    // Delete physical files
    await this.imageProcessing.deleteVariants(id);

    return { success: true, message: 'Media archived successfully' };
  }

  /**
   * Permanently delete media
   */
  async delete(id: string) {
    const media = await this.findOne(id);

    // Delete from database
    await this.prisma.productMedia.delete({
      where: { id },
    });

    // Delete physical files
    await this.imageProcessing.deleteVariants(id);

    return { success: true, message: 'Media deleted successfully' };
  }

  /**
   * Bulk upload media for multiple SKUs
   */
  async bulkUpload(
    files: Express.Multer.File[],
    skuItemIds: string[],
    userId: string,
  ) {
    const results: MediaUploadResult[] = [];
    const errors: { skuItemId: string; error: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const skuItemId = skuItemIds[i];

      if (!skuItemId) {
        errors.push({ skuItemId: 'unknown', error: 'Missing SKU ID for file' });
        continue;
      }

      try {
        const result = await this.upload(
          file,
          { skuItemId, isPrimary: true },
          userId,
        );
        results.push(result);
      } catch (error) {
        errors.push({ skuItemId, error: error.message });
      }
    }

    return { results, errors };
  }

  /**
   * Get media statistics
   */
  async getStats() {
    const [total, ready, processing, failed, archived] = await Promise.all([
      this.prisma.productMedia.count(),
      this.prisma.productMedia.count({ where: { status: 'READY' } }),
      this.prisma.productMedia.count({ where: { status: 'PROCESSING' } }),
      this.prisma.productMedia.count({ where: { status: 'FAILED' } }),
      this.prisma.productMedia.count({ where: { status: 'ARCHIVED' } }),
    ]);

    return {
      total,
      byStatus: { ready, processing, failed, archived },
    };
  }
}
