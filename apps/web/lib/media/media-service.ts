import prisma from '@/lib/prisma';
import { DAFC } from '@/lib/dafc-tokens';

// ════════════════════════════════════════
// S3/R2 Configuration
// ════════════════════════════════════════

const S3_CONFIG = {
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT || '',
  bucket: process.env.S3_BUCKET || 'dafc-media',
  cdnBase: process.env.CDN_BASE_URL || '/uploads',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
};

// ════════════════════════════════════════
// Variant Specifications (Luxury Standards)
// ════════════════════════════════════════

interface VariantSpec {
  key: string;
  width: number;
  height: number;
  quality: number;
  fit: 'cover' | 'contain' | 'fill' | 'inside';
}

const IMAGE_VARIANTS: VariantSpec[] = [
  { key: 'hero', width: 1200, height: 1600, quality: 85, fit: 'cover' },
  { key: 'card', width: 600, height: 800, quality: 80, fit: 'cover' },
  { key: 'thumb', width: 400, height: 400, quality: 80, fit: 'contain' },
  { key: 'mini', width: 64, height: 64, quality: 75, fit: 'cover' },
  { key: 'zoom', width: 2400, height: 3200, quality: 90, fit: 'inside' },
];

// ════════════════════════════════════════
// Image Processing (uses Sharp)
// ════════════════════════════════════════

async function processImageVariants(
  buffer: Buffer,
  entityId: string,
  fileName: string
): Promise<Record<string, string>> {
  // Dynamic import Sharp (server-side only)
  // @ts-expect-error - sharp types not installed, using dynamic import
  const sharp = (await import('sharp')).default;
  const urls: Record<string, string> = {};
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const ts = Date.now();

  for (const variant of IMAGE_VARIANTS) {
    const processed = await sharp(buffer)
      .resize(variant.width, variant.height, {
        fit: variant.fit,
        background: DAFC.media.background,
        withoutEnlargement: variant.key !== 'zoom',
      })
      .webp({ quality: variant.quality })
      .toBuffer();

    // In production: upload to S3/R2
    // For dev: save to local public/uploads/
    const fs = await import('fs/promises');
    const path = await import('path');

    const dir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'products',
      entityId,
      variant.key
    );
    await fs.mkdir(dir, { recursive: true });

    const outFileName = `${baseName}-${ts}.webp`;
    const outPath = path.join(dir, outFileName);
    await fs.writeFile(outPath, processed);

    urls[`${variant.key}Url`] = `/uploads/products/${entityId}/${variant.key}/${outFileName}`;
  }

  // Save original
  const fs = await import('fs/promises');
  const path = await import('path');
  const origDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'products',
    entityId,
    'original'
  );
  await fs.mkdir(origDir, { recursive: true });
  const ext = fileName.match(/\.[^.]+$/)?.[0] || '.jpg';
  const origName = `${baseName}-${ts}${ext}`;
  await fs.writeFile(path.join(origDir, origName), buffer);
  urls.originalUrl = `/uploads/products/${entityId}/original/${origName}`;

  return urls;
}

// ════════════════════════════════════════
// Media Service (CRUD + Business Logic)
// ════════════════════════════════════════

export class MediaService {
  /**
   * Upload and process a product image into all luxury variants
   */
  static async uploadImage(
    skuItemId: string,
    file: { buffer: Buffer; name: string; size: number; mimeType: string },
    uploadedById: string,
    options: {
      isPrimary?: boolean;
      sortOrder?: number;
      tags?: string[];
      styleCode?: string;
      colorCode?: string;
    } = {}
  ) {
    // 1. Process into variants
    const urls = await processImageVariants(file.buffer, skuItemId, file.name);

    // 2. Get metadata
    // @ts-expect-error - sharp types not installed, using dynamic import
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(file.buffer).metadata();

    // 3. If primary, unset others
    if (options.isPrimary) {
      await prisma.productMedia.updateMany({
        where: { skuItemId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // 4. Create DB record
    const media = await prisma.productMedia.create({
      data: {
        skuItemId,
        styleCode: options.styleCode,
        colorCode: options.colorCode,
        type: 'HERO',
        status: 'READY',
        source: 'UPLOAD',
        originalUrl: urls.originalUrl,
        originalFilename: file.name,
        originalMimeType: file.mimeType,
        originalSize: file.size,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        heroUrl: urls.heroUrl,
        cardUrl: urls.cardUrl,
        thumbUrl: urls.thumbUrl,
        miniUrl: urls.miniUrl,
        zoomUrl: urls.zoomUrl,
        variants: urls,
        isPrimary: options.isPrimary ?? false,
        sortOrder: options.sortOrder ?? 0,
        uploadedById,
        processedAt: new Date(),
      },
    });

    return media;
  }

  /** Get all media for an SKU item, primary first */
  static async getProductMedia(skuItemId: string) {
    return prisma.productMedia.findMany({
      where: { skuItemId, archivedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  /** Get media by style code */
  static async getMediaByStyle(styleCode: string) {
    return prisma.productMedia.findMany({
      where: { styleCode, archivedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  /** Get primary image URL (for thumbnails in tables) */
  static async getPrimaryImageUrl(
    skuItemId: string,
    variant: 'hero' | 'card' | 'thumb' | 'mini' = 'mini'
  ) {
    const media = await prisma.productMedia.findFirst({
      where: { skuItemId, isPrimary: true, archivedAt: null },
    });
    if (!media) return null;
    const key = `${variant}Url` as keyof typeof media;
    return media[key] as string | null;
  }

  /** Delete media + cleanup files */
  static async deleteMedia(mediaId: string) {
    const media = await prisma.productMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media) throw new Error('Media not found');

    // Delete files from disk/S3
    const fs = await import('fs/promises');
    const path = await import('path');
    const urlFields = [
      'heroUrl',
      'cardUrl',
      'thumbUrl',
      'miniUrl',
      'zoomUrl',
      'originalUrl',
    ] as const;
    for (const field of urlFields) {
      const url = media[field];
      if (url && url.startsWith('/uploads/')) {
        try {
          await fs.unlink(path.join(process.cwd(), 'public', url));
        } catch {
          // File may not exist
        }
      }
    }

    // Soft delete
    await prisma.productMedia.update({
      where: { id: mediaId },
      data: { archivedAt: new Date() },
    });
  }

  /** Reorder media */
  static async reorderMedia(skuItemId: string, mediaIds: string[]) {
    const updates = mediaIds.map((id, i) =>
      prisma.productMedia.update({ where: { id }, data: { sortOrder: i } })
    );
    await prisma.$transaction(updates);
  }

  /** Set primary image */
  static async setPrimary(mediaId: string) {
    const media = await prisma.productMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media) throw new Error('Media not found');

    await prisma.productMedia.updateMany({
      where: { skuItemId: media.skuItemId, isPrimary: true },
      data: { isPrimary: false },
    });
    await prisma.productMedia.update({
      where: { id: mediaId },
      data: { isPrimary: true },
    });
  }

  /** Batch get primary thumbnails for multiple SKUs */
  static async getBatchThumbnails(
    skuItemIds: string[]
  ): Promise<Map<string, string | null>> {
    const media = await prisma.productMedia.findMany({
      where: {
        skuItemId: { in: skuItemIds },
        isPrimary: true,
        archivedAt: null,
      },
      select: { skuItemId: true, miniUrl: true },
    });

    const map = new Map<string, string | null>();
    for (const id of skuItemIds) {
      map.set(id, null);
    }
    for (const m of media) {
      if (m.skuItemId) {
        map.set(m.skuItemId, m.miniUrl);
      }
    }
    return map;
  }
}

export { IMAGE_VARIANTS, S3_CONFIG };
