export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { parseExcelFile } from '@/lib/excel';

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
        { success: false, error: 'Can only upload to draft or rejected proposals' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload an Excel file (.xlsx)' },
        { status: 400 }
      );
    }

    // Parse Excel file
    const buffer = await file.arrayBuffer();
    const parseResult = parseExcelFile(buffer);

    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse Excel file', details: parseResult.errors },
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

    // Transform parsed data to SKU items
    const items = parseResult.data.map((row) => {
      const categoryName = (row.category || '').toLowerCase();
      const categoryId = categoryMap.get(categoryName) || categories[0]?.id;

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
        warnings: parseResult.errors,
        summary: parseResult.summary,
      },
      message: `Successfully uploaded ${items.length} SKU items`,
    });
  } catch (error) {
    console.error('Error uploading SKUs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload SKU file' },
      { status: 500 }
    );
  }
}
