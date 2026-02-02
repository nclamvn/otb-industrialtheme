// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/import/sync — Sync Imported Data to Prisma Database
// DAFC OTB Platform — Bridge staging data to production tables
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { syncImportedData, getSyncStatus, type SyncOptions } from '@/services/import-sync-service';
import type { ImportTarget } from '@/services/import-data-service';

export const dynamic = 'force-dynamic';

const VALID_TARGETS: ImportTarget[] = [
  'products', 'otb_budget', 'wssi', 'size_profiles',
  'forecasts', 'clearance', 'kpi_targets', 'suppliers', 'categories',
];

// POST - Sync imported data to database
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID (fallback for demo users)
    const userId = (session.user as { id?: string }).id || 'demo-admin';

    const body = await request.json();
    const target = body.target as ImportTarget;

    // Validate target
    if (!target || !VALID_TARGETS.includes(target)) {
      return NextResponse.json(
        { success: false, error: `Target không hợp lệ. Chấp nhận: ${VALID_TARGETS.join(', ')}` },
        { status: 400 }
      );
    }

    // Build options
    const options: SyncOptions = {
      userId,
      sessionId: body.sessionId,
      dryRun: body.dryRun === true,
      overwrite: body.overwrite === true,
      seasonId: body.seasonId,
      brandId: body.brandId,
    };

    // Execute sync
    const result = await syncImportedData(target, options);

    return NextResponse.json({
      success: result.success,
      ...result,
    });

  } catch (err) {
    console.error('[POST /api/v1/import/sync]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Lỗi server' },
      { status: 500 }
    );
  }
}

// GET - Get sync status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target') as ImportTarget;

    if (!target || !VALID_TARGETS.includes(target)) {
      // Return status for all targets
      const statuses = await Promise.all(
        ['products', 'otb_budget'].map(t => getSyncStatus(t as ImportTarget))
      );
      return NextResponse.json({ success: true, statuses });
    }

    const status = await getSyncStatus(target);
    return NextResponse.json({ success: true, status });

  } catch (err) {
    console.error('[GET /api/v1/import/sync]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Lỗi server' },
      { status: 500 }
    );
  }
}
