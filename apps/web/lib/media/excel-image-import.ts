import { MediaService } from './media-service';

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: { sku: string; error: string }[];
}

/**
 * Extract images from Excel and import into the media system.
 * Supports 3 methods:
 *   1. Embedded images matched by cell position
 *   2. URL columns with image links
 *   3. SKU-named files in a ZIP/folder
 */
export class ExcelImageImportService {
  /**
   * Import from Excel file with embedded images or URL column
   */
  static async importFromExcel(
    fileBuffer: Buffer,
    fileName: string,
    options: {
      skuColumn: number; // 0-indexed column for SKU
      imageColumn?: number; // 0-indexed column for image URLs (optional)
      headerRow: number; // 1-indexed row number of headers
      uploadedById: string;
      productLookup: (sku: string) => Promise<string | null>;
    }
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Use ExcelJS for Node-side parsing (supports images)
      // @ts-expect-error - exceljs types not installed, using dynamic import
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('Không tìm thấy worksheet');

      // ── Method 1: Extract embedded images ──
      const images = worksheet.getImages();
      const imageMap = new Map<string, (typeof images)[0]>();

      for (const image of images) {
        const { range } = image;
        if (range && range.tl) {
          const row = Math.floor(range.tl.row);
          const col = Math.floor(range.tl.col);
          const key = `${row}-${col}`;
          imageMap.set(key, image);
        }
      }

      // ── Process each data row ──
      const startRow = options.headerRow + 1;
      const totalRows = worksheet.rowCount;

      for (let rowIdx = startRow; rowIdx <= totalRows; rowIdx++) {
        const row = worksheet.getRow(rowIdx);
        const skuCell = row.getCell(options.skuColumn + 1); // ExcelJS is 1-indexed
        const sku = skuCell.value?.toString()?.trim();

        if (!sku) continue;
        result.total++;

        try {
          // Look up product ID
          const skuItemId = await options.productLookup(sku);
          if (!skuItemId) {
            result.skipped++;
            result.errors.push({
              sku,
              error: 'Không tìm thấy sản phẩm trong hệ thống',
            });
            continue;
          }

          let imageBuffer: Buffer | null = null;
          let imageName = `${sku}.png`;

          // Try embedded image first
          const imageKey = `${rowIdx - 1}-${options.skuColumn}`; // 0-indexed for image lookup
          const embeddedImage = imageMap.get(imageKey);

          if (embeddedImage) {
            const imageId = embeddedImage.imageId;
            const img = workbook.getImage(parseInt(imageId));
            if (img && img.buffer) {
              imageBuffer = img.buffer as Buffer;
              imageName = `${sku}-embedded.${img.extension || 'png'}`;
            }
          }

          // Try URL column if no embedded image
          if (!imageBuffer && options.imageColumn !== undefined) {
            const urlCell = row.getCell(options.imageColumn + 1);
            const url = urlCell.value?.toString()?.trim();

            if (
              url &&
              (url.startsWith('http://') || url.startsWith('https://'))
            ) {
              try {
                const response = await fetch(url, {
                  signal: AbortSignal.timeout(10000),
                });
                if (response.ok) {
                  const arrayBuffer = await response.arrayBuffer();
                  imageBuffer = Buffer.from(arrayBuffer);
                  const ext =
                    url.match(/\.(jpg|jpeg|png|webp|gif)/i)?.[1] || 'jpg';
                  imageName = `${sku}-url.${ext}`;
                }
              } catch (fetchError: unknown) {
                const msg =
                  fetchError instanceof Error
                    ? fetchError.message
                    : 'Unknown error';
                result.errors.push({
                  sku,
                  error: `Không tải được URL: ${msg}`,
                });
              }
            }
          }

          if (!imageBuffer) {
            result.skipped++;
            result.errors.push({
              sku,
              error: 'Không tìm thấy ảnh (embedded hoặc URL)',
            });
            continue;
          }

          // Upload via MediaService
          await MediaService.uploadImage(
            skuItemId,
            {
              buffer: imageBuffer,
              name: imageName,
              size: imageBuffer.length,
              mimeType: `image/${imageName.split('.').pop() || 'png'}`,
            },
            options.uploadedById,
            { isPrimary: true }
          );

          result.success++;
        } catch (rowError: unknown) {
          result.failed++;
          const msg =
            rowError instanceof Error ? rowError.message : 'Unknown error';
          result.errors.push({ sku, error: msg });
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Lỗi xử lý Excel: ${msg}`);
    }

    return result;
  }

  /**
   * Import from SKU-named image files
   * File names must match SKU codes: "SKU-001.jpg", "ABC-123.png", etc.
   */
  static async importFromFiles(
    files: { name: string; buffer: Buffer; size: number; mimeType: string }[],
    options: {
      uploadedById: string;
      productLookup: (sku: string) => Promise<string | null>;
    }
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: files.length,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    for (const file of files) {
      const sku = file.name.replace(/\.[^.]+$/, '').trim();

      try {
        const skuItemId = await options.productLookup(sku);
        if (!skuItemId) {
          result.skipped++;
          result.errors.push({ sku, error: 'Không tìm thấy sản phẩm' });
          continue;
        }

        await MediaService.uploadImage(skuItemId, file, options.uploadedById, {
          isPrimary: true,
        });

        result.success++;
      } catch (error: unknown) {
        result.failed++;
        const msg =
          error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({ sku, error: msg });
      }
    }

    return result;
  }
}

export type { ImportResult };
