export const runtime = 'nodejs';

// S3 Files API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getFilesByUser, deleteStoredFile } from '@/lib/storage';

// GET /api/v1/integrations/s3/files - List user's files
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    let files;
    if (entityType && entityId) {
      files = await prisma.storedFile.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    } else {
      files = await getFilesByUser(session.user.id, limit);
    }

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

// DELETE /api/v1/integrations/s3/files - Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Check ownership
    const file = await prisma.storedFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Allow deletion by owner or admin
    const isOwner = file.uploadedById === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteStoredFile(fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
