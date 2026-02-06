import { NextRequest, NextResponse } from 'next/server';
import { ExcelImageImportService } from '@/lib/media/excel-image-import';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const method =
      (formData.get('method') as string) || 'excel_embedded';
    const skuColumn = parseInt((formData.get('skuColumn') as string) || '0');
    const imageColumn = formData.get('imageColumn') as string;
    const headerRow = parseInt((formData.get('headerRow') as string) || '1');
    const uploadedById =
      (formData.get('uploadedById') as string) || 'system';

    if (!file) {
      return NextResponse.json({ error: 'Thiếu file' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Product lookup function - search by SKU code or style name
    const productLookup = async (sku: string): Promise<string | null> => {
      const skuItem = await prisma.sKUItem.findFirst({
        where: {
          OR: [
            { skuCode: sku },
            { styleName: sku },
          ],
        },
        select: { id: true },
      });
      return skuItem?.id || null;
    };

    let result;

    if (method === 'files') {
      // Handle multiple file upload
      const files: {
        name: string;
        buffer: Buffer;
        size: number;
        mimeType: string;
      }[] = [];

      // Get all files from form data
      const entries = Array.from(formData.entries());
      for (const [key, value] of entries) {
        if (key.startsWith('files[') && value instanceof File) {
          const fileBuffer = Buffer.from(await value.arrayBuffer());
          files.push({
            name: value.name,
            buffer: fileBuffer,
            size: value.size,
            mimeType: value.type,
          });
        }
      }

      result = await ExcelImageImportService.importFromFiles(files, {
        uploadedById,
        productLookup,
      });
    } else {
      // Excel import (embedded or URL)
      result = await ExcelImageImportService.importFromExcel(
        buffer,
        file.name,
        {
          skuColumn,
          imageColumn: imageColumn ? parseInt(imageColumn) : undefined,
          headerRow,
          uploadedById,
          productLookup,
        }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[Bulk Import Error]', error);
    const message =
      error instanceof Error ? error.message : 'Import thất bại';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
