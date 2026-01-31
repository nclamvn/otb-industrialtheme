export const runtime = 'nodejs';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Report Template type
interface ReportWidget {
  id: string;
  type: string;
  title: string;
  config: any;
  width: string;
}

interface ReportTemplate {
  name: string;
  description?: string;
  widgets: ReportWidget[];
  schedule?: {
    frequency: string;
    recipients: string[];
    nextRun?: Date;
  };
}

// GET /api/reports - Get user's report templates
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const scheduled = searchParams.get('scheduled') === 'true';

    // In production, this would query a ReportTemplate table
    // For now, return demo data structure
    const reports = [
      {
        id: '1',
        name: 'Weekly Performance Summary',
        description: 'Key metrics and trends for the past week',
        widgets: [
          { id: 'w1', type: 'kpi', title: 'Revenue', config: {}, width: 'third' },
          { id: 'w2', type: 'kpi', title: 'Margin', config: {}, width: 'third' },
          { id: 'w3', type: 'kpi', title: 'Sell-Through', config: {}, width: 'third' },
        ],
        schedule: scheduled
          ? { frequency: 'weekly', recipients: ['team@company.com'] }
          : undefined,
        createdById: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report template
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ReportTemplate = await request.json();
    const { name, description, widgets, schedule } = body;

    if (!name || !widgets || widgets.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one widget are required' },
        { status: 400 }
      );
    }

    // In production, this would save to a ReportTemplate table
    const report = {
      id: `report-${Date.now()}`,
      name,
      description,
      widgets,
      schedule,
      createdById: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

// PATCH /api/reports - Update a report template
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, widgets, schedule } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // In production, this would update the ReportTemplate table
    const report = {
      id,
      name,
      description,
      widgets,
      schedule,
      updatedAt: new Date(),
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports - Delete a report template
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // In production, this would delete from the ReportTemplate table

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
