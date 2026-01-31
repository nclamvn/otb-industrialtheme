export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { validateSKUs, getValidationSummary } from '@/lib/excel';

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

    const proposal = await prisma.sKUProposal.findUnique({
      where: { id },
      include: {
        otbPlan: {
          include: {
            budget: {
              include: {
                brand: true,
              },
            },
            lineItems: {
              include: {
                category: true,
              },
            },
          },
        },
        items: {
          include: {
            category: true,
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

    if (proposal.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items to validate' },
        { status: 400 }
      );
    }

    // Get all active categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
    });

    // Prepare SKUs for validation
    const skusToValidate = proposal.items.map((item, index) => ({
      rowNumber: index + 1,
      skuCode: item.skuCode,
      styleName: item.styleName,
      colorCode: item.colorCode || undefined,
      colorName: item.colorName || undefined,
      category: item.category?.name || 'Unknown',
      gender: item.gender || 'UNISEX',
      retailPrice: item.retailPrice ? Number(item.retailPrice) : 0,
      costPrice: item.costPrice ? Number(item.costPrice) : 0,
      orderQuantity: item.orderQuantity || 0,
      sizeBreakdown: (item.sizeBreakdown as Record<string, number>) || undefined,
    }));

    // Get subcategories and collections for validation context
    const subcategories = await prisma.subcategory.findMany({
      where: { isActive: true },
    });
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
    });

    // Get existing SKU codes for duplicate check
    const existingSKUs = await prisma.sKUItem.findMany({
      where: {
        proposalId: { not: id },
      },
      select: { skuCode: true },
    });

    // Validate SKUs
    const validationResults = validateSKUs(skusToValidate, {
      existingSKUs: existingSKUs.map((s) => s.skuCode),
      validCategories: categories.map((c) => ({ id: c.id, code: c.code, name: c.name })),
      validSubcategories: subcategories.map((s) => ({
        id: s.id,
        code: s.code,
        categoryId: s.categoryId,
        name: s.name
      })),
      validCollections: collections.map((c) => ({ id: c.id, code: c.code, name: c.name })),
      seasonBudget: Number(proposal.otbPlan.budget.totalBudget),
    });

    // Update items with validation results
    await prisma.$transaction(
      proposal.items.map((item, index) => {
        const result = validationResults[index];
        // Convert lowercase status to uppercase enum value
        const statusMap: Record<string, 'PENDING' | 'VALID' | 'WARNING' | 'ERROR'> = {
          valid: 'VALID',
          warning: 'WARNING',
          error: 'ERROR',
        };
        return prisma.sKUItem.update({
          where: { id: item.id },
          data: {
            validationStatus: statusMap[result.status] || 'PENDING',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            validationErrors: result.errors as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            validationWarnings: result.warnings as any,
          },
        });
      })
    );

    // Get validation summary
    const summary = getValidationSummary(validationResults);

    return NextResponse.json({
      success: true,
      data: {
        results: validationResults,
        summary,
      },
      message: `Validation complete: ${summary.valid} valid, ${summary.warnings} warnings, ${summary.errors} errors`,
    });
  } catch (error) {
    console.error('Error validating SKUs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate SKUs' },
      { status: 500 }
    );
  }
}
