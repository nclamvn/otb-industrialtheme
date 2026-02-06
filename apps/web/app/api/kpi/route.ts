export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/kpi - Get all KPI definitions and their current values
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const seasonId = searchParams.get('seasonId');
    const brandId = searchParams.get('brandId');
    const categoryId = searchParams.get('categoryId');
    const locationId = searchParams.get('locationId');

    // Get KPI definitions
    const kpiDefinitions = await prisma.kPIDefinition.findMany({
      where: { isActive: true },
      include: {
        targets: {
          where: {
            ...(seasonId && { seasonId }),
            ...(brandId && { brandId }),
            ...(locationId && { locationId }),
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get latest KPI values
    const kpiValues = await prisma.kPIValue.findMany({
      where: {
        ...(seasonId && { seasonId }),
        ...(brandId && { brandId }),
        ...(categoryId && { categoryId }),
        ...(locationId && { locationId }),
      },
      orderBy: { calculatedAt: 'desc' },
      distinct: ['kpiId'],
      include: {
        kpi: true,
      },
    });

    // Get active alerts
    const alerts = await prisma.kPIAlert.findMany({
      where: {
        isAcknowledged: false,
        kpi: {
          id: { in: kpiDefinitions.map((k) => k.id) },
        },
      },
      include: {
        kpi: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build response with combined data
    const kpis = kpiDefinitions.map((def) => {
      const latestValue = kpiValues.find((v) => v.kpiId === def.id);
      const target = def.targets[0];
      const kpiAlerts = alerts.filter((a) => a.kpiId === def.id);

      // Calculate status based on value and target
      let status: 'on_track' | 'at_risk' | 'off_track' | 'no_target' = 'no_target';
      if (target && latestValue) {
        const percentOfTarget = (latestValue.value / target.targetValue) * 100;
        // Use def.targetType from KPIDefinition
        if (def.targetType === 'HIGHER_IS_BETTER') {
          if (percentOfTarget >= 100) status = 'on_track';
          else if (percentOfTarget >= 90) status = 'at_risk';
          else status = 'off_track';
        } else if (def.targetType === 'LOWER_IS_BETTER') {
          if (percentOfTarget <= 100) status = 'on_track';
          else if (percentOfTarget <= 110) status = 'at_risk';
          else status = 'off_track';
        } else {
          // TARGET_VALUE or RANGE
          const variance = Math.abs(percentOfTarget - 100);
          if (variance <= 5) status = 'on_track';
          else if (variance <= 15) status = 'at_risk';
          else status = 'off_track';
        }
      }

      // Determine trend from changePercent
      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      if (latestValue?.changePercent) {
        trend = latestValue.changePercent > 0 ? 'up' : latestValue.changePercent < 0 ? 'down' : 'neutral';
      }

      return {
        id: def.id,
        code: def.code,
        name: def.name,
        description: def.description,
        formula: def.formula,
        category: def.category,
        unit: def.unit,
        value: latestValue?.value ?? null,
        previousValue: latestValue?.previousValue ?? null,
        changePercent: latestValue?.changePercent ?? null,
        trend,
        status,
        target: target
          ? {
              id: target.id,
              value: target.targetValue,
              type: def.targetType,
              warningThreshold: def.warningThreshold,
              criticalThreshold: def.criticalThreshold,
              periodType: target.periodType,
            }
          : null,
        alerts: kpiAlerts.map((a) => ({
          id: a.id,
          type: a.alertType,
          severity: a.severity,
          message: a.message,
          createdAt: a.createdAt,
        })),
        calculatedAt: latestValue?.calculatedAt ?? null,
      };
    });

    return NextResponse.json({
      kpis,
      summary: {
        total: kpis.length,
        onTrack: kpis.filter((k) => k.status === 'on_track').length,
        atRisk: kpis.filter((k) => k.status === 'at_risk').length,
        offTrack: kpis.filter((k) => k.status === 'off_track').length,
        noTarget: kpis.filter((k) => k.status === 'no_target').length,
        activeAlerts: alerts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}

// POST /api/kpi - Create a new KPI definition
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      formula,
      dataSource,
      category,
      unit,
      aggregationType,
      targetType,
      warningThreshold,
      criticalThreshold,
    } = body;

    // Validate required fields
    if (!code || !name || !category || !formula || !dataSource) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.kPIDefinition.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'KPI code already exists' },
        { status: 400 }
      );
    }

    const kpi = await prisma.kPIDefinition.create({
      data: {
        code,
        name,
        description,
        formula,
        dataSource,
        category,
        unit,
        aggregationType: aggregationType || 'SUM',
        targetType: targetType || 'HIGHER_IS_BETTER',
        warningThreshold,
        criticalThreshold,
        isActive: true,
      },
    });

    return NextResponse.json(kpi, { status: 201 });
  } catch (error) {
    console.error('Error creating KPI:', error);
    return NextResponse.json(
      { error: 'Failed to create KPI' },
      { status: 500 }
    );
  }
}
