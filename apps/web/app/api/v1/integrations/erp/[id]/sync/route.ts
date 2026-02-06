export const runtime = 'nodejs';

// ERP Sync API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getERPConnectionById, runSync, testConnection, getSyncLogs } from '@/lib/erp';

// Define SyncDirection locally to avoid @prisma/client dependency
type SyncDirection = 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';

// GET /api/v1/integrations/erp/[id]/sync - Get sync logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const connection = await getERPConnectionById(id);

    if (!connection) {
      return NextResponse.json({ error: 'ERP connection not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const logs = await getSyncLogs(id, limit);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error getting sync logs:', error);
    return NextResponse.json({ error: 'Failed to get sync logs' }, { status: 500 });
  }
}

// POST /api/v1/integrations/erp/[id]/sync - Trigger sync
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const connection = await getERPConnectionById(id);

    if (!connection) {
      return NextResponse.json({ error: 'ERP connection not found' }, { status: 404 });
    }

    if (!connection.isEnabled) {
      return NextResponse.json({ error: 'ERP connection is disabled' }, { status: 400 });
    }

    const body = await request.json();
    const { action, entityType, direction } = body;

    if (action === 'test') {
      // Test connection
      try {
        const success = await testConnection(id);
        return NextResponse.json({
          success,
          message: success ? 'Connection successful' : 'Connection failed',
        });
      } catch (testError) {
        return NextResponse.json({
          success: false,
          message: 'Connection failed',
          error: testError instanceof Error ? testError.message : 'Unknown error',
        });
      }
    }

    if (action === 'sync') {
      // Run sync
      if (!entityType) {
        return NextResponse.json(
          { error: 'entityType is required for sync' },
          { status: 400 }
        );
      }

      // Use connection's sync direction if not provided
      const syncDirection: SyncDirection = direction || connection.syncDirection || 'BIDIRECTIONAL';

      const result = await runSync({
        connectionId: id,
        entityType,
        direction: syncDirection,
        triggeredById: session.user.id,
      });

      return NextResponse.json({
        success: result.success,
        processed: result.recordsSuccess,
        failed: result.recordsFailed,
        errors: result.errors,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "test" or "sync"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error running sync:', error);
    return NextResponse.json({ error: 'Failed to run sync' }, { status: 500 });
  }
}
