export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { mockBrands } from '@/lib/mock-data';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let brands;

    try {
      brands = await prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    } catch (dbError) {
      console.error('Database error, using mock data:', dbError);
      brands = mockBrands;
    }

    return NextResponse.json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
