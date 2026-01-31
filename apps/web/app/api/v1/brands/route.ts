export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { brandSchema } from '@/lib/validations/brand';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const divisionId = searchParams.get('divisionId') || '';

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(divisionId && { divisionId }),
    };

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        include: {
          division: true,
        },
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.brand.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: brands,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = brandSchema.parse(body);

    // Check if code already exists
    const existingBrand = await prisma.brand.findUnique({
      where: { code: validatedData.code },
    });

    if (existingBrand) {
      return NextResponse.json(
        { success: false, error: 'Brand code already exists' },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description || null,
        logoUrl: validatedData.logoUrl || null,
        divisionId: validatedData.divisionId,
        isActive: validatedData.isActive,
      },
      include: {
        division: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: brand,
    });
  } catch (error: unknown) {
    console.error('Error creating brand:', error);
    if (error && typeof error === 'object' && 'errors' in error) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create brand' },
      { status: 500 }
    );
  }
}
