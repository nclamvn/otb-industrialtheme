// ═══════════════════════════════════════════════════════════════════════════════
// GET & DELETE /api/v1/import/data — Query & Delete Imported Data
// DAFC OTB Platform
//
// GET  /api/v1/import/data?target=products&page=1&search=dress
// GET  /api/v1/import/data?target=products&mode=stats
// DELETE body: { target: "products", clearAll: true }
// DELETE body: { target: "products", sessionId: "sess_xxx" }
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { queryData, getStats, deleteSession, clearAll } from '@/services/import-data-service';
import type { ImportTarget } from '@/services/import-data-service';

export const dynamic = 'force-dynamic';

// ─── GET: Query / Stats ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target') as ImportTarget | null;

    if (!target) {
      return NextResponse.json({ success: false, error: 'Thiếu tham số target' }, { status: 400 });
    }

    // Stats mode
    if (searchParams.get('mode') === 'stats') {
      const stats = await getStats(target);
      return NextResponse.json({ success: true, stats });
    }

    // Query mode
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 200);
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || '_importedAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const filters: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      if (key.startsWith('filter_') && val) filters[key.slice(7)] = val;
    });

    const result = await queryData({
      target, page, pageSize, search, sortBy, sortOrder,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[GET /api/v1/import/data]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Lỗi server' },
      { status: 500 }
    );
  }
}

// ─── DELETE: Clear / Remove Session ──────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, sessionId, clearAll: shouldClear } = body as {
      target?: ImportTarget; sessionId?: string; clearAll?: boolean;
    };

    if (!target) {
      return NextResponse.json({ success: false, error: 'Thiếu tham số target' }, { status: 400 });
    }

    if (shouldClear) {
      const count = await clearAll(target);
      return NextResponse.json({
        success: true, deletedCount: count,
        message: `Đã xóa toàn bộ ${count} bản ghi ${target}`,
      });
    }

    if (sessionId) {
      const count = await deleteSession(target, sessionId);
      return NextResponse.json({
        success: true, deletedCount: count,
        message: `Đã xóa ${count} bản ghi từ phiên ${sessionId}`,
      });
    }

    return NextResponse.json({ success: false, error: 'Cần sessionId hoặc clearAll=true' }, { status: 400 });
  } catch (err) {
    console.error('[DELETE /api/v1/import/data]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Lỗi server' },
      { status: 500 }
    );
  }
}
