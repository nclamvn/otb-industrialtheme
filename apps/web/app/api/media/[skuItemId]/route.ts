import { NextRequest, NextResponse } from 'next/server';
import { MediaService } from '@/lib/media/media-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ skuItemId: string }> }
) {
  try {
    const { skuItemId } = await params;
    const media = await MediaService.getProductMedia(skuItemId);
    return NextResponse.json({ media });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { mediaId } = await req.json();
    if (!mediaId) {
      return NextResponse.json({ error: 'Thiếu mediaId' }, { status: 400 });
    }

    await MediaService.deleteMedia(mediaId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, mediaId, mediaIds, skuItemId } = body;

    switch (action) {
      case 'setPrimary':
        if (!mediaId) {
          return NextResponse.json(
            { error: 'Thiếu mediaId' },
            { status: 400 }
          );
        }
        await MediaService.setPrimary(mediaId);
        return NextResponse.json({ success: true });

      case 'reorder':
        if (!skuItemId || !mediaIds) {
          return NextResponse.json(
            { error: 'Thiếu skuItemId hoặc mediaIds' },
            { status: 400 }
          );
        }
        await MediaService.reorderMedia(skuItemId, mediaIds);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Action không hợp lệ' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
