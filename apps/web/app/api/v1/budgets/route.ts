export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { mockBudgets } from '@/lib/mock-data';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const brandId = searchParams.get('brandId');
    const locationId = searchParams.get('locationId');
    const status = searchParams.get('status');

    let budgets;

    try {
      const where = {
        ...(seasonId && { seasonId }),
        ...(brandId && { brandId }),
        ...(locationId && { locationId }),
        ...(status && { status: status as 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REVISED' | 'REJECTED' }),
      };

      budgets = await prisma.budgetAllocation.findMany({
        where,
        include: {
          season: true,
          brand: true,
          location: true,
          createdBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
      });
    } catch (dbError) {
      console.error('Database error, using mock data:', dbError);
      // Use mock data when database is unavailable
      budgets = mockBudgets.filter(b => {
        if (seasonId && b.seasonId !== seasonId) return false;
        if (brandId && b.brandId !== brandId) return false;
        if (locationId && b.locationId !== locationId) return false;
        if (status && b.status !== status) return false;
        return true;
      });
    }

    // Calculate summary
    const summary = {
      totalBudget: budgets.reduce((sum, b) => sum + Number(b.totalBudget), 0),
      approvedBudget: budgets
        .filter((b) => b.status === 'APPROVED')
        .reduce((sum, b) => sum + Number(b.totalBudget), 0),
      pendingBudget: budgets
        .filter((b) => ['SUBMITTED', 'UNDER_REVIEW'].includes(b.status))
        .reduce((sum, b) => sum + Number(b.totalBudget), 0),
      count: budgets.length,
    };

    return NextResponse.json({
      success: true,
      data: budgets,
      summary,
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const {
      seasonId,
      brandId,
      locationId,
      totalBudget,
      seasonalBudget,
      replenishmentBudget,
      currency,
      comments,
      assumptions,
    } = body;

    // 3. Validate required fields
    if (!seasonId || typeof seasonId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Season is required' },
        { status: 400 }
      );
    }
    if (!brandId || typeof brandId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Brand is required' },
        { status: 400 }
      );
    }
    if (!locationId || typeof locationId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Location is required' },
        { status: 400 }
      );
    }
    if (totalBudget === undefined || totalBudget === null || totalBudget <= 0) {
      return NextResponse.json(
        { success: false, error: 'Total budget must be greater than 0' },
        { status: 400 }
      );
    }

    // 4. Verify user exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json(
        { success: false, error: 'User not found in database. Please re-login.' },
        { status: 400 }
      );
    }

    // 5. Verify season, brand, location exist
    const [seasonExists, brandExists, locationExists] = await Promise.all([
      prisma.season.findUnique({ where: { id: seasonId }, select: { id: true } }),
      prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } }),
      prisma.salesLocation.findUnique({ where: { id: locationId }, select: { id: true } }),
    ]);

    if (!seasonExists) {
      return NextResponse.json(
        { success: false, error: 'Selected season does not exist' },
        { status: 400 }
      );
    }
    if (!brandExists) {
      return NextResponse.json(
        { success: false, error: 'Selected brand does not exist' },
        { status: 400 }
      );
    }
    if (!locationExists) {
      return NextResponse.json(
        { success: false, error: 'Selected location does not exist' },
        { status: 400 }
      );
    }

    // 6. Check if budget already exists for this combination
    const existing = await prisma.budgetAllocation.findFirst({
      where: {
        seasonId,
        brandId,
        locationId,
        status: { notIn: ['REJECTED'] },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Budget already exists for this season/brand/location combination' },
        { status: 400 }
      );
    }

    // 7. Create budget
    let budget;
    try {
      budget = await prisma.budgetAllocation.create({
        data: {
          seasonId,
          brandId,
          locationId,
          totalBudget: totalBudget,
          seasonalBudget: seasonalBudget || null,
          replenishmentBudget: replenishmentBudget || null,
          currency: currency || 'USD',
          comments: comments || null,
          assumptions: assumptions || null,
          status: 'DRAFT',
          version: 1,
          createdById: session.user.id,
        },
        include: {
          season: true,
          brand: true,
          location: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });
    } catch (createError: unknown) {
      const err = createError as { code?: string; meta?: unknown; message?: string };
      if (err.code) {
        console.error('Prisma error creating budget:', {
          code: err.code,
          meta: err.meta,
          message: err.message,
        });

        if (err.code === 'P2002') {
          return NextResponse.json(
            { success: false, error: 'Budget with this combination already exists' },
            { status: 409 }
          );
        }
        if (err.code === 'P2003') {
          return NextResponse.json(
            { success: false, error: 'Invalid reference: season, brand, or location not found' },
            { status: 400 }
          );
        }
      }
      throw createError;
    }

    return NextResponse.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error('Error creating budget:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create budget',
        ...(isDev && { details: errorMessage }),
      },
      { status: 500 }
    );
  }
}
