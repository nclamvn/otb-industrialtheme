export const runtime = 'nodejs';

// Single API Key Management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { deleteAPIKey, enableAPIKey, disableAPIKey } from '@/lib/api-keys';

// GET /api/v1/api-keys/[id] - Get API key details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const apiKey = await prisma.aPIKey.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        rateLimit: true,
        isEnabled: true,
        lastUsedAt: true,
        usageCount: true,
        expiresAt: true,
        createdAt: true,
        createdById: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Check ownership (or admin)
    const isOwner = apiKey.createdById === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error('Error getting API key:', error);
    return NextResponse.json({ error: 'Failed to get API key' }, { status: 500 });
  }
}

// PATCH /api/v1/api-keys/[id] - Update API key (enable/disable)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const apiKey = await prisma.aPIKey.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Check ownership (or admin)
    const isOwner = apiKey.createdById === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { isEnabled } = body;

    if (typeof isEnabled === 'boolean') {
      if (isEnabled) {
        await enableAPIKey(id);
      } else {
        await disableAPIKey(id);
      }
    }

    const updated = await prisma.aPIKey.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        rateLimit: true,
        isEnabled: true,
        lastUsedAt: true,
        usageCount: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ apiKey: updated });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
  }
}

// DELETE /api/v1/api-keys/[id] - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const apiKey = await prisma.aPIKey.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Check ownership (or admin)
    const isOwner = apiKey.createdById === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteAPIKey(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}
