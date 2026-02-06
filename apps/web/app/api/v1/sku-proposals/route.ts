export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { skuProposalCreateSchema } from '@/lib/validations/sku';
import { mockSKUProposals } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otbPlanId = searchParams.get('otbPlanId');
    const seasonId = searchParams.get('seasonId');
    const brandId = searchParams.get('brandId');
    const status = searchParams.get('status');

    let proposalsWithSummary;

    try {
      const where: Record<string, unknown> = {};

      if (otbPlanId) where.otbPlanId = otbPlanId;
      if (status) where.status = status;

      if (seasonId || brandId) {
        where.otbPlan = {
          budget: {},
        };
        if (seasonId)
          (
            (where.otbPlan as Record<string, unknown>).budget as Record<string, unknown>
          ).seasonId = seasonId;
        if (brandId)
          (
            (where.otbPlan as Record<string, unknown>).budget as Record<string, unknown>
          ).brandId = brandId;
      }

      const proposals = await prisma.sKUProposal.findMany({
        where,
        include: {
          otbPlan: {
            include: {
              budget: {
                include: {
                  season: true,
                  brand: true,
                  location: true,
                },
              },
            },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate summary for each proposal
      proposalsWithSummary = await Promise.all(
        proposals.map(async (proposal) => {
          const items = await prisma.sKUItem.findMany({
            where: { proposalId: proposal.id },
            select: {
              orderQuantity: true,
              retailPrice: true,
              costPrice: true,
              validationStatus: true,
            },
          });

          const totalQuantity = items.reduce((sum, item) => sum + (item.orderQuantity || 0), 0);
          const totalAmount = items.reduce(
            (sum, item) => sum + (item.orderQuantity || 0) * Number(item.retailPrice || 0),
            0
          );
          const validCount = items.filter((item) => item.validationStatus === 'VALID').length;
          const errorCount = items.filter((item) => item.validationStatus === 'ERROR').length;

          return {
            ...proposal,
            summary: {
              itemCount: proposal._count.items,
              totalQuantity,
              totalAmount,
              validCount,
              errorCount,
            },
          };
        })
      );
    } catch (dbError) {
      console.error('Database error, using mock data:', dbError);
      // Use mock data when database is unavailable
      const filteredProposals = mockSKUProposals.filter(p => {
        if (otbPlanId && p.otbPlanId !== otbPlanId) return false;
        if (status && p.status !== status) return false;
        return true;
      });

      proposalsWithSummary = filteredProposals.map(proposal => ({
        ...proposal,
        _count: { items: proposal.totalSKUs || 0 },
        summary: {
          itemCount: proposal.totalSKUs || 0,
          totalQuantity: proposal.totalQuantity || 0,
          totalAmount: proposal.totalRetail || 0,
          validCount: proposal.items?.filter(i => i.status === 'APPROVED').length || 0,
          errorCount: proposal.items?.filter(i => i.status === 'ERROR').length || 0,
        },
      }));
    }

    return NextResponse.json({
      success: true,
      data: proposalsWithSummary,
    });
  } catch (error) {
    console.error('Error fetching SKU proposals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SKU proposals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = skuProposalCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { otbPlanId } = validation.data;

    // Check if OTB plan exists and is approved
    const otbPlan = await prisma.oTBPlan.findUnique({
      where: { id: otbPlanId },
      include: {
        budget: {
          include: {
            season: true,
            brand: true,
          },
        },
      },
    });

    if (!otbPlan) {
      return NextResponse.json(
        { success: false, error: 'OTB plan not found' },
        { status: 404 }
      );
    }

    if (otbPlan.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'OTB plan must be approved before creating SKU proposal' },
        { status: 400 }
      );
    }

    const proposal = await prisma.sKUProposal.create({
      data: {
        otbPlanId,
        seasonId: otbPlan.budget.seasonId,
        brandId: otbPlan.budget.brandId,
        status: 'DRAFT',
        createdById: session.user.id,
      },
      include: {
        otbPlan: {
          include: {
            budget: {
              include: {
                season: true,
                brand: true,
                location: true,
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error('Error creating SKU proposal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create SKU proposal' },
      { status: 500 }
    );
  }
}
