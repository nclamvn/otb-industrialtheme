export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { skuBulkCreateSchema } from '@/lib/validations/sku';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const proposal = await prisma.sKUProposal.findUnique({
      where: { id },
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
            lineItems: {
              include: {
                category: true,
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            category: true,
          },
          orderBy: [{ gender: 'asc' }, { skuCode: 'asc' }],
        },
        workflow: {
          include: {
            steps: {
              include: {
                actionBy: { select: { id: true, name: true } },
              },
              orderBy: { stepNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: 'SKU proposal not found' },
        { status: 404 }
      );
    }

    // Calculate summary
    const summary = {
      totalItems: proposal.items.length,
      totalQuantity: proposal.items.reduce((sum, item) => sum + (item.orderQuantity || 0), 0),
      totalAmount: proposal.items.reduce(
        (sum, item) => sum + (item.orderQuantity || 0) * Number(item.retailPrice || 0),
        0
      ),
      validCount: proposal.items.filter((item) => item.validationStatus === 'VALID').length,
      warningCount: proposal.items.filter((item) => item.validationStatus === 'WARNING')
        .length,
      errorCount: proposal.items.filter((item) => item.validationStatus === 'ERROR').length,
      pendingCount: proposal.items.filter((item) => item.validationStatus === 'PENDING')
        .length,
    };

    return NextResponse.json({
      success: true,
      data: proposal,
      summary,
    });
  } catch (error) {
    console.error('Error fetching SKU proposal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SKU proposal' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.sKUProposal.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'SKU proposal not found' },
        { status: 404 }
      );
    }

    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Can only edit draft or rejected proposals' },
        { status: 400 }
      );
    }

    // Handle bulk item update
    if (body.items) {
      const validation = skuBulkCreateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.errors[0].message },
          { status: 400 }
        );
      }

      const { items } = validation.data;

      // Use transaction to update items
      await prisma.$transaction(async (tx) => {
        // Delete existing items
        await tx.sKUItem.deleteMany({
          where: { proposalId: id },
        });

        // Create new items
        await tx.sKUItem.createMany({
          data: items.map((item) => ({
            proposalId: id,
            skuCode: item.skuCode,
            styleName: item.styleName,
            colorCode: item.colorCode,
            colorName: item.colorName,
            categoryId: item.categoryId,
            gender: item.gender,
            retailPrice: item.retailPrice,
            costPrice: item.costPrice,
            orderQuantity: item.orderQuantity,
            sizeBreakdown: item.sizeBreakdown,
            imageUrl: item.imageUrl,
            validationStatus: 'PENDING',
          })),
        });

        // Update proposal
        await tx.sKUProposal.update({
          where: { id },
          data: {
            updatedAt: new Date(),
            ...(body.name && { name: body.name }),
          },
        });
      });
    }

    // Fetch updated proposal
    const proposal = await prisma.sKUProposal.findUnique({
      where: { id },
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
        items: {
          include: {
            category: true,
          },
          orderBy: [{ gender: 'asc' }, { skuCode: 'asc' }],
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error('Error updating SKU proposal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update SKU proposal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.sKUProposal.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'SKU proposal not found' },
        { status: 404 }
      );
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Can only delete draft proposals' },
        { status: 400 }
      );
    }

    // Delete items and proposal
    await prisma.$transaction(async (tx) => {
      await tx.sKUItem.deleteMany({
        where: { proposalId: id },
      });
      await tx.sKUProposal.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'SKU proposal deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting SKU proposal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete SKU proposal' },
      { status: 500 }
    );
  }
}
