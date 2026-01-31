export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { mockLocations } from '@/lib/mock-data';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let locations;

    try {
      locations = await prisma.salesLocation.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    } catch (dbError) {
      console.error('Database error, using mock data:', dbError);
      locations = mockLocations;
    }

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
