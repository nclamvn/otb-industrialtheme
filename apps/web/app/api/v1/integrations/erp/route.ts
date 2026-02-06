export const runtime = 'nodejs';

// ERP Connections API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createERPConnection, getAllERPConnections } from '@/lib/erp';
import { ERPType, SyncDirection } from '@prisma/client';

// GET /api/v1/integrations/erp - List ERP connections
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can manage ERP connections
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const connections = await getAllERPConnections();

    // Remove sensitive data
    const safeConnections = connections.map((c) => ({
      ...c,
      password: undefined,
      apiKey: undefined,
    }));

    return NextResponse.json({
      connections: safeConnections,
      availableTypes: Object.values(ERPType),
      syncDirections: Object.values(SyncDirection),
    });
  } catch (error) {
    console.error('Error listing ERP connections:', error);
    return NextResponse.json({ error: 'Failed to list ERP connections' }, { status: 500 });
  }
}

// POST /api/v1/integrations/erp - Create ERP connection
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create ERP connections
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, host, port, database, username, password, apiKey, syncDirection } = body;

    // Validate required fields
    if (!name || !type || !host) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, host' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = Object.values(ERPType);
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate sync direction if provided
    if (syncDirection) {
      const validDirections = Object.values(SyncDirection);
      if (!validDirections.includes(syncDirection)) {
        return NextResponse.json(
          { error: `Invalid syncDirection. Must be one of: ${validDirections.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const connection = await createERPConnection({
      name,
      type,
      host,
      port,
      database,
      username,
      password,
      apiKey,
      syncDirection,
    });

    return NextResponse.json({
      connection: {
        id: connection.id,
        name: connection.name,
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        syncDirection: connection.syncDirection,
        isEnabled: connection.isEnabled,
        createdAt: connection.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating ERP connection:', error);
    return NextResponse.json({ error: 'Failed to create ERP connection' }, { status: 500 });
  }
}
