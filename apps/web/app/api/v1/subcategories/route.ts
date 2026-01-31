export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { subcategorySchema } from '@/lib/validations/category';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || '';

    const where = categoryId ? { categoryId } : {};

    const subcategories = await prisma.subcategory.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subcategories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = subcategorySchema.parse(body);

    const existingSubcategory = await prisma.subcategory.findUnique({
      where: {
        categoryId_code: {
          categoryId: validatedData.categoryId,
          code: validatedData.code,
        },
      },
    });

    if (existingSubcategory) {
      return NextResponse.json(
        { success: false, error: 'Subcategory code already exists in this category' },
        { status: 400 }
      );
    }

    const subcategory = await prisma.subcategory.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        categoryId: validatedData.categoryId,
        description: validatedData.description || null,
        isActive: validatedData.isActive,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: subcategory,
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subcategory' },
      { status: 500 }
    );
  }
}
