export const runtime = 'nodejs';

// ERP Field Mappings API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getERPConnectionById, getFieldMappings, updateFieldMappings } from '@/lib/erp';

// GET /api/v1/integrations/erp/[id]/mappings - Get field mappings
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
    const entityType = searchParams.get('entityType') || undefined;

    const mappings = await getFieldMappings(id, entityType);

    return NextResponse.json({ mappings });
  } catch (error) {
    console.error('Error getting field mappings:', error);
    return NextResponse.json({ error: 'Failed to get field mappings' }, { status: 500 });
  }
}

// PUT /api/v1/integrations/erp/[id]/mappings - Update field mappings
export async function PUT(
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
    const { entityType, mappings } = body;

    if (!entityType || !Array.isArray(mappings)) {
      return NextResponse.json(
        { error: 'Missing required fields: entityType, mappings' },
        { status: 400 }
      );
    }

    // Validate mappings structure
    for (const mapping of mappings) {
      if (!mapping.sourceField || !mapping.targetField) {
        return NextResponse.json(
          { error: 'Each mapping must have sourceField and targetField' },
          { status: 400 }
        );
      }
    }

    const updated = await updateFieldMappings(id, entityType, mappings);

    return NextResponse.json({ mappings: updated });
  } catch (error) {
    console.error('Error updating field mappings:', error);
    return NextResponse.json({ error: 'Failed to update field mappings' }, { status: 500 });
  }
}
