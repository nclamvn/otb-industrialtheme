export const runtime = 'nodejs';

// Single ERP Connection API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getERPConnectionById,
  updateERPConnection,
  deleteERPConnection,
} from '@/lib/erp';

// GET /api/v1/integrations/erp/[id] - Get ERP connection details
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

    // Remove sensitive data
    return NextResponse.json({
      connection: {
        ...connection,
        password: undefined,
        apiKey: undefined,
      },
    });
  } catch (error) {
    console.error('Error getting ERP connection:', error);
    return NextResponse.json({ error: 'Failed to get ERP connection' }, { status: 500 });
  }
}

// PATCH /api/v1/integrations/erp/[id] - Update ERP connection
export async function PATCH(
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

    const body = await request.json();
    const { name, host, port, database, username, password, apiKey, syncDirection, isEnabled } = body;

    const updated = await updateERPConnection(id, {
      name,
      host,
      port,
      database,
      username,
      password,
      apiKey,
      syncDirection,
      isEnabled,
    });

    return NextResponse.json({
      connection: {
        ...updated,
        password: undefined,
        apiKey: undefined,
      },
    });
  } catch (error) {
    console.error('Error updating ERP connection:', error);
    return NextResponse.json({ error: 'Failed to update ERP connection' }, { status: 500 });
  }
}

// DELETE /api/v1/integrations/erp/[id] - Delete ERP connection
export async function DELETE(
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

    await deleteERPConnection(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ERP connection:', error);
    return NextResponse.json({ error: 'Failed to delete ERP connection' }, { status: 500 });
  }
}
