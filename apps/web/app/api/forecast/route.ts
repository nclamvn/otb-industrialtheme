export const runtime = 'nodejs';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  generateForecast,
} from '@/lib/analytics/forecasting';

// GET /api/forecast - Get existing forecasts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const seasonId = searchParams.get('seasonId');
    const brandId = searchParams.get('brandId');
    const categoryId = searchParams.get('categoryId');
    const type = searchParams.get('type');

    const forecasts = await prisma.forecast.findMany({
      where: {
        ...(seasonId && { seasonId }),
        ...(brandId && { brandId }),
        ...(categoryId && { categoryId }),
        ...(type && { forecastType: type as any }),
      },
      include: {
        season: {
          select: { id: true, name: true, code: true },
        },
        brand: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    return NextResponse.json(forecasts);
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forecasts' },
      { status: 500 }
    );
  }
}

// POST /api/forecast - Generate a new forecast
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      seasonId,
      brandId,
      categoryId,
      type,
      method,
      periods,
      confidence,
      historicalData,
    } = body;

    // Validate required fields
    if (!seasonId || !type) {
      return NextResponse.json(
        { error: 'Season ID and forecast type are required' },
        { status: 400 }
      );
    }

    // Use provided historical data or fetch from database
    let data: number[] = historicalData;

    if (!data || data.length === 0) {
      // In production, fetch actual historical data based on type
      // For demo, use mock data
      data = generateMockHistoricalData(type);
    }

    if (data.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 historical data points required' },
        { status: 400 }
      );
    }

    // Generate forecast
    const forecastResult = generateForecast(data, periods || 12, confidence || 0.95) as any;

    // Store forecast
    const validUntilDate = new Date();
    validUntilDate.setMonth(validUntilDate.getMonth() + 3); // Valid for 3 months

    const forecast = await prisma.forecast.create({
      data: {
        seasonId,
        brandId: brandId || null,
        categoryId: categoryId || null,
        forecastType: type as any,
        modelUsed: method || 'ENSEMBLE',
        confidence: confidence || 0.95,
        forecastData: {
          predictions: forecastResult.predictions,
          horizon: periods || 12,
        } as any,
        accuracy: forecastResult.accuracy as any,
        validUntil: validUntilDate,
        inputDataRange: {
          historicalDataPoints: data.length,
          trend: forecastResult.trend,
          anomalies: forecastResult.anomalies,
          factors: forecastResult.factors,
        } as any,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({
      id: forecast.id,
      ...forecastResult,
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}

// Helper: Generate mock historical data for demo
function generateMockHistoricalData(type: string): number[] {
  const baseValue = {
    DEMAND: 50000,
    SALES: 100000,
    INVENTORY: 200000,
    REVENUE: 150000,
    MARGIN: 45,
  }[type] || 100000;

  // Generate 24 months of data with trend and seasonality
  const data: number[] = [];
  for (let i = 0; i < 24; i++) {
    const trend = 1 + (i * 0.015); // 1.5% growth per month
    const seasonality = 1 + 0.15 * Math.sin((i * Math.PI) / 6); // Seasonal pattern
    const noise = 1 + (Math.random() - 0.5) * 0.1; // Random noise
    data.push(baseValue * trend * seasonality * noise);
  }

  return data;
}
