// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/import/batch — Batch Import Endpoint
// DAFC OTB Platform — Receives transformed rows and persists to data store
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { processBatch } from '@/services/import-data-service';

export const dynamic = 'force-dynamic';

const VALID_TARGETS = [
  'products', 'otb_budget', 'wssi', 'size_profiles',
  'forecasts', 'clearance', 'kpi_targets', 'suppliers', 'categories',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Validation ─────────────────────────────────────────────────
    if (!body.target || !VALID_TARGETS.includes(body.target)) {
      return NextResponse.json(
        { success: false, error: `Loại dữ liệu không hợp lệ. Chấp nhận: ${VALID_TARGETS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có dữ liệu để import (rows trống)' },
        { status: 400 }
      );
    }

    // ── Process ────────────────────────────────────────────────────
    const result = await processBatch({
      target: body.target,
      mode: body.mode || 'upsert',
      duplicateHandling: body.duplicateHandling || 'skip',
      matchKey: body.matchKey || [],
      rows: body.rows,
      batchIndex: body.batchIndex ?? 0,
      totalBatches: body.totalBatches ?? 1,
      sessionId: body.sessionId,
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: `Lô ${(body.batchIndex ?? 0) + 1}/${body.totalBatches ?? 1}: +${result.inserted} thêm, ↻${result.updated} cập nhật, ⊘${result.skipped} bỏ qua, ✕${result.errors} lỗi`,
    });
  } catch (err) {
    console.error('[POST /api/v1/import/batch]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Lỗi server' },
      { status: 500 }
    );
  }
}
