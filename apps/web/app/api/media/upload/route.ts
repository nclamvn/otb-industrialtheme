import { NextRequest, NextResponse } from 'next/server';
import { MediaService } from '@/lib/media/media-service';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEOS = ['video/mp4', 'video/webm'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const skuItemId = formData.get('skuItemId') as string;
    const isPrimary = formData.get('isPrimary') === 'true';
    const tagsRaw = formData.get('tags') as string;
    const uploadedById = (formData.get('uploadedById') as string) || 'system';
    const styleCode = formData.get('styleCode') as string | null;
    const colorCode = formData.get('colorCode') as string | null;

    // Validate
    if (!file || !skuItemId) {
      return NextResponse.json(
        { error: 'Thiếu file hoặc skuItemId' },
        { status: 400 }
      );
    }

    const isImage = ALLOWED_IMAGES.includes(file.type);
    const isVideo = ALLOWED_VIDEOS.includes(file.type);
    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error:
            'Định dạng không hỗ trợ. Chấp nhận: JPEG, PNG, WebP, GIF, MP4',
        },
        { status: 400 }
      );
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File quá lớn. Tối đa: ${isImage ? '10MB' : '50MB'}` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];

    const media = await MediaService.uploadImage(
      skuItemId,
      { buffer, name: file.name, size: file.size, mimeType: file.type },
      uploadedById,
      {
        isPrimary,
        tags,
        styleCode: styleCode || undefined,
        colorCode: colorCode || undefined,
      }
    );

    return NextResponse.json({ success: true, media });
  } catch (error: unknown) {
    console.error('[Media Upload Error]', error);
    const message =
      error instanceof Error ? error.message : 'Upload thất bại';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
