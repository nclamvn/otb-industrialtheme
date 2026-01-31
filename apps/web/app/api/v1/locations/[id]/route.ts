export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { locationSchema } from '@/lib/validations/location';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const location = await prisma.salesLocation.findUnique({
      where: { id },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = locationSchema.parse(body);

    const existingLocation = await prisma.salesLocation.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    if (validatedData.code !== existingLocation.code) {
      const codeExists = await prisma.salesLocation.findUnique({
        where: { code: validatedData.code },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Location code already exists' },
          { status: 400 }
        );
      }
    }

    const location = await prisma.salesLocation.update({
      where: { id },
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
    console.error('Error updating location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.salesLocation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Location deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
