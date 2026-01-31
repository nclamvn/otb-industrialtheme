export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ParsedSKU } from '@/lib/excel';

interface ImportRequestBody {
  items: ParsedSKU[];
}

export async function POST(
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
      include: {
        otbPlan: {
          include: {
            budget: {
              include: {
                brand: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'SKU proposal not found' },
        { status: 404 }
      );
    }

    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Can only import to draft or rejected proposals' },
        { status: 400 }
      );
    }

    const body: ImportRequestBody = await request.json();
    const { items: parsedItems } = body;

    if (!parsedItems || !Array.isArray(parsedItems) || parsedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items provided' },
        { status: 400 }
      );
    }

    // Get all active categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
    });

    const categoryMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.id])
    );
    const categoryCodeMap = new Map(
      categories.map((c) => [c.code.toLowerCase(), c.id])
    );

    // Transform parsed data to SKU items
    const items = parsedItems.map((row) => {
      const categoryName = (row.category || '').toLowerCase();
      const categoryId =
        categoryMap.get(categoryName) ||
        categoryCodeMap.get(categoryName) ||
        categories[0]?.id;

      return {
        proposalId: id,
        skuCode: row.skuCode || '',
        styleName: row.styleName || '',
        colorCode: row.colorCode,
        colorName: row.colorName,
        categoryId,
        gender: (row.gender as 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS') || 'UNISEX',
        retailPrice: row.retailPrice || 0,
        costPrice: row.costPrice || 0,
        orderQuantity: row.orderQuantity || 0,
        sizeBreakdown: row.sizeBreakdown,
        validationStatus: 'PENDING' as const,
      };
    });

    // Use transaction to replace items
    await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.sKUItem.deleteMany({
        where: { proposalId: id },
      });

      // Create new items
      await tx.sKUItem.createMany({
        data: items,
      });

      // Update proposal
      await tx.sKUProposal.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        itemsCreated: items.length,
      },
      message: `Successfully imported ${items.length} SKU items`,
    });
  } catch (error) {
    console.error('Error importing SKUs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import SKUs' },
      { status: 500 }
    );
  }
}
