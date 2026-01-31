export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const divisions = await prisma.division.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: divisions,
    });
  } catch (error) {
    console.error('Error fetching divisions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch divisions' },
      { status: 500 }
    );
  }
}
