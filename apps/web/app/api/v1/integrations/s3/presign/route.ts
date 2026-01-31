export const runtime = 'nodejs';

// S3 Presigned URL API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUploadRequest, isS3Configured } from '@/lib/storage';
import { FileCategory } from '@prisma/client';

// POST /api/v1/integrations/s3/presign - Generate presigned upload URL
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isS3Configured()) {
      return NextResponse.json(
        { error: 'S3 is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { filename, mimeType, size, category, entityType, entityId } = body;

    // Validate required fields
    if (!filename || !mimeType || !size) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, mimeType, size' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = Object.values(FileCategory);
    const fileCategory = (category || 'DOCUMENT') as FileCategory;
    if (!validCategories.includes(fileCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed (100MB)' },
        { status: 400 }
      );
    }

    // Create upload request
    const result = await createUploadRequest({
      filename,
      mimeType,
      size,
      category: fileCategory,
      entityType,
      entityId,
      userId: session.user.id,
    });

    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      fileId: result.fileId,
      key: result.key,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
