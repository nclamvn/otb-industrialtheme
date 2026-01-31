export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { locationSchema } from '@/lib/validations/location';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(type && { type }),
    };

    const locations = await prisma.salesLocation.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = locationSchema.parse(body);

    const existingLocation = await prisma.salesLocation.findUnique({
      where: { code: validatedData.code },
    });

    if (existingLocation) {
      return NextResponse.json(
        { success: false, error: 'Location code already exists' },
        { status: 400 }
      );
    }

    const location = await prisma.salesLocation.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        type: validatedData.type,
        address: validatedData.address || null,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
