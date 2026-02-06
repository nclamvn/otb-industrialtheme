export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      where: { isActive: true },
      orderBy: [{ year: 'desc' }, { seasonGroup: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: seasons,
    });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch seasons' },
      { status: 500 }
    );
  }
}
