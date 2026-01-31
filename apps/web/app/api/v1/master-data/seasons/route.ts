export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { mockSeasons } from '@/lib/mock-data';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let seasons;

    try {
      seasons = await prisma.season.findMany({
        where: { isActive: true },
        orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
      });
    } catch (dbError) {
      console.error('Database error, using mock data:', dbError);
      seasons = mockSeasons;
    }

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
