export const runtime = 'nodejs';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/kpi/alerts - Get KPI alerts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const kpiId = searchParams.get('kpiId');
    const severity = searchParams.get('severity');
    const unresolvedOnly = searchParams.get('unresolvedOnly') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '50');

    const alerts = await prisma.kPIAlert.findMany({
      where: {
        ...(kpiId && { kpiId }),
        ...(severity && { severity: severity as any }),
        ...(unresolvedOnly && { isAcknowledged: false }),
      },
      include: {
        kpi: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
        warning: alerts.filter((a) => a.severity === 'WARNING').length,
        info: alerts.filter((a) => a.severity === 'INFO').length,
        unacknowledged: alerts.filter((a) => !a.isAcknowledged).length,
      },
    });
  } catch (error) {
    console.error('Error fetching KPI alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI alerts' },
      { status: 500 }
    );
  }
}

// POST /api/kpi/alerts - Create a new KPI alert (usually triggered by system)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      kpiId,
      alertType,
      severity,
      message,
      value,
      threshold,
    } = body;

    // Validate required fields
    if (!kpiId || !alertType || !severity || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for duplicate active alerts
    const existingAlert = await prisma.kPIAlert.findFirst({
      where: {
        kpiId,
        alertType,
        isAcknowledged: false,
      },
    });

    if (existingAlert) {
      // Update existing alert instead of creating a new one
      const updated = await prisma.kPIAlert.update({
        where: { id: existingAlert.id },
        data: {
          currentValue: value,
          thresholdValue: threshold,
          message,
        },
        include: {
          kpi: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json(updated);
    }

    const alert = await prisma.kPIAlert.create({
      data: {
        kpiId,
        alertType,
        severity,
        message,
        currentValue: value || 0,
        thresholdValue: threshold || 0,
        isAcknowledged: false,
      },
      include: {
        kpi: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating KPI alert:', error);
    return NextResponse.json(
      { error: 'Failed to create KPI alert' },
      { status: 500 }
    );
  }
}

// PATCH /api/kpi/alerts - Bulk update alerts (mark as read/resolved)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertIds, action } = body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json(
        { error: 'Alert IDs required' },
        { status: 400 }
      );
    }

    if (!['acknowledge', 'unacknowledge'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use acknowledge or unacknowledge' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (action === 'acknowledge') {
      updateData.isAcknowledged = true;
      updateData.acknowledgedAt = new Date();
      updateData.acknowledgedById = session.user.id;
    } else if (action === 'unacknowledge') {
      updateData.isAcknowledged = false;
      updateData.acknowledgedAt = null;
      updateData.acknowledgedById = null;
    }

    const result = await prisma.kPIAlert.updateMany({
      where: {
        id: { in: alertIds },
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    console.error('Error updating KPI alerts:', error);
    return NextResponse.json(
      { error: 'Failed to update KPI alerts' },
      { status: 500 }
    );
  }
}
