export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/kpi/targets - Get all KPI targets
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const kpiId = searchParams.get('kpiId');
    const seasonId = searchParams.get('seasonId');
    const brandId = searchParams.get('brandId');
    const locationId = searchParams.get('locationId');

    const targets = await prisma.kPITarget.findMany({
      where: {
        ...(kpiId && { kpiId }),
        ...(seasonId && { seasonId }),
        ...(brandId && { brandId }),
        ...(locationId && { locationId }),
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
        season: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(targets);
  } catch (error) {
    console.error('Error fetching KPI targets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI targets' },
      { status: 500 }
    );
  }
}

// POST /api/kpi/targets - Create a new KPI target
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      kpiId,
      seasonId,
      brandId,
      locationId,
      targetValue,
      minValue,
      maxValue,
      stretchTarget,
      periodType,
      periodStart,
      periodEnd,
    } = body;

    // Validate required fields
    if (!kpiId || targetValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate KPI exists
    const kpi = await prisma.kPIDefinition.findUnique({
      where: { id: kpiId },
    });

    if (!kpi) {
      return NextResponse.json(
        { error: 'KPI not found' },
        { status: 404 }
      );
    }

    // Create new target
    const target = await prisma.kPITarget.create({
      data: {
        kpiId,
        seasonId: seasonId || null,
        brandId: brandId || null,
        locationId: locationId || null,
        targetValue,
        minValue,
        maxValue,
        stretchTarget,
        periodType: periodType || 'SEASON',
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        createdById: session.user.id,
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

    return NextResponse.json(target, { status: 201 });
  } catch (error) {
    console.error('Error creating KPI target:', error);
    return NextResponse.json(
      { error: 'Failed to create KPI target' },
      { status: 500 }
    );
  }
}
