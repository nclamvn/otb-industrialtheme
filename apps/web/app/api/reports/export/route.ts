export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// POST /api/reports/export - Export a report
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, format } = body;

    if (!reportId || !format) {
      return NextResponse.json(
        { error: 'Report ID and format are required' },
        { status: 400 }
      );
    }

    if (!['pdf', 'excel', 'csv', 'pptx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported: pdf, excel, csv, pptx' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Fetch the report template
    // 2. Generate the report with current data
    // 3. Convert to the requested format
    // 4. Return the file or a download URL

    // For now, return a mock response
    const exportResult = {
      success: true,
      format,
      reportId,
      fileName: `report-${reportId}-${Date.now()}.${format === 'excel' ? 'xlsx' : format}`,
      downloadUrl: `/api/reports/download/${reportId}?format=${format}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    return NextResponse.json(exportResult);
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}
