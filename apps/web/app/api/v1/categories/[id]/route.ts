export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { categorySchema } from '@/lib/validations/category';
import {
  parseJsonBody,
  handlePrismaError,
  errorResponse,
} from '@/lib/utils/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    const prismaResponse = handlePrismaError(error, 'fetching category');
    if (prismaResponse) return prismaResponse;

    return errorResponse('Failed to fetch category', 500, error instanceof Error ? error.message : undefined);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Parse JSON body safely
    const [body, parseError] = await parseJsonBody(request);
    if (parseError) return parseError;

    // 2. Validate with Zod schema
    const validationResult = categorySchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.errors[0]?.message || 'Validation failed',
        400,
        validationResult.error.errors
      );
    }

    const validatedData = validationResult.data;

    // 3. Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return errorResponse('Category not found', 404);
    }

    // 4. Check for duplicate code (if changed)
    if (validatedData.code !== existingCategory.code) {
      const codeExists = await prisma.category.findUnique({
        where: { code: validatedData.code },
      });

      if (codeExists) {
        return errorResponse('Category code already exists', 400);
      }
    }

    // 5. Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description || null,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    const prismaResponse = handlePrismaError(error, 'updating category');
    if (prismaResponse) return prismaResponse;

    return errorResponse('Failed to update category', 500, error instanceof Error ? error.message : undefined);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { subcategories: true } },
      },
    });

    if (!existingCategory) {
      return errorResponse('Category not found', 404);
    }

    // 2. Check for related data
    if (existingCategory._count.subcategories > 0) {
      return errorResponse(
        `Cannot delete category with ${existingCategory._count.subcategories} subcategories. Delete subcategories first.`,
        400
      );
    }

    // 3. Delete category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Category deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    const prismaResponse = handlePrismaError(error, 'deleting category');
    if (prismaResponse) return prismaResponse;

    return errorResponse('Failed to delete category', 500, error instanceof Error ? error.message : undefined);
  }
}
