export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  calculateSellThrough,
  calculateGrossMargin,
  calculateInventoryTurn,
  calculateWeeksOfSupply,
  calculateMarkdownRate,
  calculateStockOutRate,
  calculateReceiptFlowRate,
  calculateOTBUtilization,
  calculateStatus,
} from '@/lib/analytics/calculations';

// POST /api/kpi/calculate - Calculate and store KPI values
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { seasonId, brandId, categoryId, locationId } = body;

    if (!seasonId) {
      return NextResponse.json(
        { error: 'Season ID is required' },
        { status: 400 }
      );
    }

    // Get KPI definitions
    const kpiDefinitions = await prisma.kPIDefinition.findMany({
      where: { isActive: true },
    });

    // Get relevant data for calculations
    // In a real implementation, these would query actual transaction and inventory data
    // For now, we'll use mock calculations

    const calculatedValues: Array<{
      kpiId: string;
      code: string;
      value: number;
      previousValue: number;
      changePercent: number;
      trend: string;
    }> = [];

    // Calculate each KPI
    for (const kpi of kpiDefinitions) {
      let value = 0;
      let previousValue = 0;

      // Mock data - in production, these would be real calculations from database
      switch (kpi.code) {
        case 'SELL_THROUGH':
          value = calculateSellThrough(68500, 100000);
          previousValue = calculateSellThrough(62300, 100000);
          break;
        case 'GROSS_MARGIN':
          value = calculateGrossMargin(1500000, 715500);
          previousValue = calculateGrossMargin(1400000, 700000);
          break;
        case 'INVENTORY_TURN':
          value = calculateInventoryTurn(750000, 178571);
          previousValue = calculateInventoryTurn(700000, 184211);
          break;
        case 'WEEKS_OF_SUPPLY':
          value = calculateWeeksOfSupply(425000, 50000);
          previousValue = calculateWeeksOfSupply(510000, 50000);
          break;
        case 'MARKDOWN_RATE':
          value = calculateMarkdownRate(277500, 1500000);
          previousValue = calculateMarkdownRate(309400, 1400000);
          break;
        case 'STOCK_OUT_RATE':
          value = calculateStockOutRate(32, 1000);
          previousValue = calculateStockOutRate(45, 1000);
          break;
        case 'RECEIPT_FLOW':
          value = calculateReceiptFlowRate(873, 1000);
          previousValue = calculateReceiptFlowRate(912, 1000);
          break;
        case 'OPEN_TO_BUY':
          value = calculateOTBUtilization(728000, 1000000);
          previousValue = calculateOTBUtilization(654000, 1000000);
          break;
        default:
          continue;
      }

      const changePercent = previousValue !== 0
        ? ((value - previousValue) / previousValue) * 100
        : 0;

      const trend = changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'neutral';

      calculatedValues.push({
        kpiId: kpi.id,
        code: kpi.code,
        value,
        previousValue,
        changePercent,
        trend,
      });
    }

    // Store calculated values
    const storedValues = await Promise.all(
      calculatedValues.map(async (cv) => {
        // Get target for status calculation
        const target = await prisma.kPITarget.findFirst({
          where: {
            kpiId: cv.kpiId,
            seasonId,
            brandId: brandId || null,
            locationId: locationId || null,
          },
          include: {
            kpi: true,
          },
        });

        // Calculate status
        let status = 'no_target';
        if (target) {
          // Map Prisma TargetType enum to calculateStatus format
          const targetTypeMap: Record<string, 'higher' | 'lower' | 'target'> = {
            'HIGHER_IS_BETTER': 'higher',
            'LOWER_IS_BETTER': 'lower',
            'TARGET_VALUE': 'target',
            'RANGE': 'target',
          };
          const mappedTargetType = targetTypeMap[target.kpi.targetType] || 'target';

          status = calculateStatus(
            cv.value,
            target.targetValue,
            mappedTargetType,
            target.kpi.warningThreshold ?? 0.1,
            target.kpi.criticalThreshold ?? 0.2
          );
        }

        // Store KPI value
        const now = new Date();
        const kpiValue = await prisma.kPIValue.create({
          data: {
            kpiId: cv.kpiId,
            seasonId,
            brandId: brandId || null,
            categoryId: categoryId || null,
            locationId: locationId || null,
            value: cv.value,
            previousValue: cv.previousValue,
            changePercent: cv.changePercent,
            periodType: 'DAILY',
            periodDate: now,
            dataAsOf: now,
          },
        });

        // Check if alert should be triggered
        if (target && (status === 'warning' || status === 'critical')) {
          const kpi = kpiDefinitions.find((k) => k.id === cv.kpiId);
          const severity = status === 'critical' ? 'CRITICAL' : 'WARNING';
          const alertType = 'THRESHOLD_BREACH';

          await prisma.kPIAlert.create({
            data: {
              kpiId: cv.kpiId,
              alertType,
              severity,
              message: `${kpi?.name} is ${status}. Current: ${cv.value.toFixed(2)}, Target: ${target.targetValue.toFixed(2)}`,
              currentValue: cv.value,
              thresholdValue: target.targetValue,
              isAcknowledged: false,
            },
          });
        }

        return {
          ...kpiValue,
          code: cv.code,
          status,
        };
      })
    );

    return NextResponse.json({
      success: true,
      calculated: storedValues.length,
      values: storedValues,
    });
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to calculate KPIs' },
      { status: 500 }
    );
  }
}
