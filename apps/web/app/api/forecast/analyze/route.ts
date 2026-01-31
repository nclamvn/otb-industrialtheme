export const runtime = 'nodejs';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeTrend, detectAnomalies, calculateForecastAccuracy } from '@/lib/analytics/forecasting';

// POST /api/forecast/analyze - Analyze historical data without generating full forecast
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data, options } = body;

    if (!data || !Array.isArray(data) || data.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 data points required for analysis' },
        { status: 400 }
      );
    }

    const results: any = {};

    // Trend analysis
    if (!options || options.trend !== false) {
      results.trend = analyzeTrend(data);
    }

    // Anomaly detection
    if (!options || options.anomalies !== false) {
      results.anomalies = detectAnomalies(data, options?.anomalyThreshold || 2.5);
    }

    // Accuracy metrics (if enough data for backtesting)
    if ((!options || options.accuracy !== false) && data.length >= 6) {
      results.accuracy = calculateForecastAccuracy(data);
    }

    // Basic statistics
    if (!options || options.statistics !== false) {
      const sum = data.reduce((a: number, b: number) => a + b, 0);
      const mean = sum / data.length;
      const sortedData = [...data].sort((a, b) => a - b);
      const median = data.length % 2 === 0
        ? (sortedData[data.length / 2 - 1] + sortedData[data.length / 2]) / 2
        : sortedData[Math.floor(data.length / 2)];
      const variance = data.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / data.length;
      const stdDev = Math.sqrt(variance);

      results.statistics = {
        count: data.length,
        sum,
        mean,
        median,
        min: Math.min(...data),
        max: Math.max(...data),
        range: Math.max(...data) - Math.min(...data),
        variance,
        standardDeviation: stdDev,
        coefficientOfVariation: mean !== 0 ? stdDev / mean : 0,
      };
    }

    // Growth analysis
    if (!options || options.growth !== false) {
      const firstValue = data[0];
      const lastValue = data[data.length - 1];
      const totalGrowth = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

      // Calculate CAGR (Compound Annual Growth Rate)
      const periods = data.length - 1;
      const cagr = firstValue > 0 && lastValue > 0 && periods > 0
        ? (Math.pow(lastValue / firstValue, 1 / periods) - 1) * 100
        : 0;

      // Period-over-period growth
      const periodGrowth = data.slice(1).map((val, i) =>
        data[i] !== 0 ? ((val - data[i]) / data[i]) * 100 : 0
      );

      results.growth = {
        totalGrowth,
        cagr,
        averageGrowth: periodGrowth.length > 0
          ? periodGrowth.reduce((a, b) => a + b, 0) / periodGrowth.length
          : 0,
        periodGrowth,
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error analyzing data:', error);
    return NextResponse.json(
      { error: 'Failed to analyze data' },
      { status: 500 }
    );
  }
}
