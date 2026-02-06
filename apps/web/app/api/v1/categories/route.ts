export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { categorySchema } from '@/lib/validations/category';
import {
  parseJsonBody,
  handlePrismaError,
  errorResponse,
} from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const categories = await prisma.category.findMany({
      where,
      include: {
        subcategories: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { subcategories: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    const prismaResponse = handlePrismaError(error, 'fetching categories');
    if (prismaResponse) return prismaResponse;

    return errorResponse('Failed to fetch categories', 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // 3. Check for duplicate code
    const existingCategory = await prisma.category.findUnique({
      where: { code: validatedData.code },
    });

    if (existingCategory) {
      return errorResponse('Category code already exists', 400);
    }

    // 4. Create category
    const category = await prisma.category.create({
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
    console.error('Error creating category:', error);

    // Handle Prisma errors
    const prismaResponse = handlePrismaError(error, 'creating category');
    if (prismaResponse) return prismaResponse;

    return errorResponse('Failed to create category', 500, error instanceof Error ? error.message : undefined);
  }
}
