export const runtime = 'nodejs';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { runSimulation, getScenarioPresets } from '@/lib/analytics/simulator';

// GET /api/simulator - Get saved scenarios
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const seasonId = searchParams.get('seasonId');
    const status = searchParams.get('status');
    const includePresets = searchParams.get('includePresets') === 'true';

    const scenarios = await prisma.scenario.findMany({
      where: {
        ...(seasonId && { baseSeasonId: seasonId }),
        ...(status && { status: status as any }),
        createdById: session.user.id,
      },
      include: {
        baseSeason: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response: any = { scenarios };

    if (includePresets) {
      response.presets = getScenarioPresets();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

// POST /api/simulator - Run simulation and optionally save scenario
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      seasonId,
      parameters,
      baseline,
      saveScenario = false,
    } = body;

    // Validate parameters
    if (!parameters || !Array.isArray(parameters) || parameters.length === 0) {
      return NextResponse.json(
        { error: 'At least one parameter is required' },
        { status: 400 }
      );
    }

    // Run simulation
    const result = runSimulation(parameters, baseline) as any;

    // Save scenario if requested
    if (saveScenario) {
      if (!name || !seasonId) {
        return NextResponse.json(
          { error: 'Name and season ID required to save scenario' },
          { status: 400 }
        );
      }

      const scenario = await prisma.scenario.create({
        data: {
          name,
          description: description || null,
          baseSeasonId: seasonId,
          parameters: parameters as any,
          impactSummary: {
            projected: result.scenario?.projected,
            impacts: result.impacts,
            score: result.score,
          } as any,
          detailedResults: {
            baseline: result.scenario?.baseline,
            recommendations: result.recommendations,
            risks: result.risks,
            confidenceLevel: result.confidenceLevel,
          } as any,
          status: 'DRAFT',
          createdById: session.user.id,
        },
      });

      return NextResponse.json({
        ...result,
        scenarioId: scenario.id,
        saved: true,
      }, { status: 201 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error running simulation:', error);
    return NextResponse.json(
      { error: 'Failed to run simulation' },
      { status: 500 }
    );
  }
}

// PATCH /api/simulator - Update scenario
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Scenario ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.scenario.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    if (existing.createdById !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own scenarios' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const scenario = await prisma.scenario.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(scenario);
  } catch (error) {
    console.error('Error updating scenario:', error);
    return NextResponse.json(
      { error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

// DELETE /api/simulator - Delete scenario
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
        { error: 'Scenario ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.scenario.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    if (existing.createdById !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own scenarios' },
        { status: 403 }
      );
    }

    await prisma.scenario.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}
