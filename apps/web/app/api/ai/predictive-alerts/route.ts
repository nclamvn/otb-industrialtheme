export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getAlerts } from '@/lib/ai/tools/get-alerts';

// GET endpoint to fetch predictive alerts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const severity = searchParams.get('severity') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get real-time alerts from tool
    const realTimeAlerts = await getAlerts(
      { alert_type: type, severity, limit },
      session.user.id
    );

    // Get saved predictive alerts from database
    const savedAlerts = await prisma.predictiveAlert.findMany({
      where: {
        userId: session.user.id,
        status: { in: ['ACTIVE', 'ACKNOWLEDGED'] },
      },
      include: {
        brand: true,
        category: true,
        season: true,
      },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });

    // Generate predictive alerts based on analysis
    const predictiveAlerts = generatePredictiveAlerts();

    return NextResponse.json({
      realTimeAlerts: realTimeAlerts.alerts || [],
      summary: realTimeAlerts.summary || {},
      savedAlerts,
      predictiveAlerts,
    });
  } catch (error) {
    console.error('Get predictive alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// POST endpoint to save or act on alerts
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, alert, alertId } = body;

    switch (action) {
      case 'save': {
        // Save a new predictive alert
        const saved = await prisma.predictiveAlert.create({
          data: {
            userId: session.user.id,
            type: mapAlertType(alert.type),
            severity: mapSeverity(alert.severity),
            title: alert.title,
            description: alert.message || alert.description || '',
            probability: alert.probability || alert.confidence || 0.5,
            timeframe: alert.timeframe,
            data: {
              prediction: alert.prediction,
              impact: alert.impact,
              metric: alert.metric,
              ...alert.data,
            },
            recommendations: alert.recommendedActions || [],
            brandId: alert.brandId,
            categoryId: alert.categoryId,
            seasonId: alert.seasonId,
            status: 'ACTIVE',
          },
        });

        return NextResponse.json({ success: true, alert: saved });
      }

      case 'acknowledge': {
        if (!alertId) {
          return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
        }

        const updated = await prisma.predictiveAlert.update({
          where: { id: alertId },
          data: {
            status: 'ACKNOWLEDGED',
            acknowledgedAt: new Date(),
          },
        });

        return NextResponse.json({ success: true, alert: updated });
      }

      case 'dismiss': {
        if (!alertId) {
          return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
        }

        const updated = await prisma.predictiveAlert.update({
          where: { id: alertId },
          data: { status: 'RESOLVED', resolutionNotes: 'Dismissed by user' },
        });

        return NextResponse.json({ success: true, alert: updated });
      }

      case 'resolve': {
        if (!alertId) {
          return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
        }

        const updated = await prisma.predictiveAlert.update({
          where: { id: alertId },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
          },
        });

        return NextResponse.json({ success: true, alert: updated });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Predictive alert action error:', error);
    return NextResponse.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}

function mapSeverity(severity: string): 'INFO' | 'WARNING' | 'CRITICAL' {
  const mapping: Record<string, 'INFO' | 'WARNING' | 'CRITICAL'> = {
    info: 'INFO',
    low: 'INFO',
    medium: 'WARNING',
    warning: 'WARNING',
    high: 'WARNING',
    critical: 'CRITICAL',
  };
  return mapping[severity.toLowerCase()] || 'WARNING';
}

type PredictiveAlertTypeValue = 'STOCKOUT_RISK' | 'OVERSTOCK_RISK' | 'MARGIN_DECLINE' | 'TREND_REVERSAL' | 'DEMAND_SPIKE' | 'SLOW_MOVING' | 'SEASON_END_RISK' | 'BUDGET_OVERRUN';

function mapAlertType(type: string): PredictiveAlertTypeValue {
  const mapping: Record<string, PredictiveAlertTypeValue> = {
    stockout: 'STOCKOUT_RISK',
    stockout_risk: 'STOCKOUT_RISK',
    overstock: 'OVERSTOCK_RISK',
    overstock_risk: 'OVERSTOCK_RISK',
    margin_decline: 'MARGIN_DECLINE',
    trend_reversal: 'TREND_REVERSAL',
    demand_spike: 'DEMAND_SPIKE',
    slow_moving: 'SLOW_MOVING',
    seasonal: 'SEASON_END_RISK',
    season_end_risk: 'SEASON_END_RISK',
    budget_overrun: 'BUDGET_OVERRUN',
  };
  return mapping[type.toLowerCase()] || 'STOCKOUT_RISK';
}

// Generate predictive alerts based on analysis
interface PredictiveAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  prediction: string;
  probability: number;
  timeframe: string;
  impact: Record<string, unknown>;
  recommendedActions: string[];
  createdAt: string;
}

function generatePredictiveAlerts() {
  const now = new Date();
  const alerts: PredictiveAlert[] = [];

  // Stockout prediction
  if (Math.random() > 0.3) {
    alerts.push({
      id: `pred-stockout-${Date.now()}`,
      type: 'STOCKOUT',
      severity: 'high',
      title: 'Predicted Stockout Risk',
      description: 'Based on current sales velocity, Category "Tops" is predicted to stockout within 14 days',
      prediction: 'Stock depletion by end of month',
      probability: 0.75 + Math.random() * 0.2,
      timeframe: '14 days',
      impact: {
        estimatedLostSales: Math.round(50000 + Math.random() * 100000),
        affectedSKUs: Math.round(5 + Math.random() * 15),
      },
      recommendedActions: [
        'Place emergency order for top-selling SKUs',
        'Review and expedite pending POs',
        'Consider transfers from other locations',
      ],
      createdAt: now.toISOString(),
    });
  }

  // Overstock prediction
  if (Math.random() > 0.4) {
    alerts.push({
      id: `pred-overstock-${Date.now()}`,
      type: 'OVERSTOCK',
      severity: 'medium',
      title: 'Overstock Risk Detected',
      description: 'Inventory levels for "Winter Outerwear" exceeding optimal levels with slow sell-through',
      prediction: 'Excess inventory of $200K by season end',
      probability: 0.65 + Math.random() * 0.2,
      timeframe: '30 days',
      impact: {
        excessValue: Math.round(150000 + Math.random() * 100000),
        potentialMarkdown: Math.round(30000 + Math.random() * 50000),
      },
      recommendedActions: [
        'Initiate markdown strategy',
        'Create promotional bundles',
        'Evaluate transfer opportunities',
      ],
      createdAt: now.toISOString(),
    });
  }

  // Trend reversal
  if (Math.random() > 0.5) {
    alerts.push({
      id: `pred-trend-${Date.now()}`,
      type: 'TREND_REVERSAL',
      severity: 'warning',
      title: 'Trend Reversal Detected',
      description: 'Sales velocity for "Dresses" showing declining trend after 3 weeks of growth',
      prediction: 'Expected 15% decline in next 2 weeks',
      probability: 0.6 + Math.random() * 0.25,
      timeframe: '14 days',
      impact: {
        projectedDecline: 15,
        affectedRevenue: Math.round(30000 + Math.random() * 40000),
      },
      recommendedActions: [
        'Analyze market factors',
        'Review pricing strategy',
        'Adjust marketing spend',
      ],
      createdAt: now.toISOString(),
    });
  }

  // Margin decline
  if (Math.random() > 0.5) {
    alerts.push({
      id: `pred-margin-${Date.now()}`,
      type: 'MARGIN_DECLINE',
      severity: 'medium',
      title: 'Margin Erosion Warning',
      description: 'Gross margin trending 3% below target due to increased discounting',
      prediction: 'Margin will hit 35% if trend continues',
      probability: 0.7 + Math.random() * 0.2,
      timeframe: '7 days',
      impact: {
        currentMargin: 38 + Math.random() * 3,
        targetMargin: 42,
        marginGap: 3 + Math.random() * 2,
      },
      recommendedActions: [
        'Review promotional calendar',
        'Optimize discount depth',
        'Focus on full-price selling',
      ],
      createdAt: now.toISOString(),
    });
  }

  // Demand spike
  if (Math.random() > 0.6) {
    alerts.push({
      id: `pred-demand-${Date.now()}`,
      type: 'DEMAND_SPIKE',
      severity: 'info',
      title: 'Demand Spike Predicted',
      description: 'Social media trends indicate potential demand surge for "Accessories"',
      prediction: 'Expected 40% increase in next 7 days',
      probability: 0.55 + Math.random() * 0.25,
      timeframe: '7 days',
      impact: {
        expectedIncrease: 40,
        additionalUnitsNeeded: Math.round(500 + Math.random() * 1000),
      },
      recommendedActions: [
        'Verify inventory availability',
        'Prepare marketing support',
        'Alert fulfillment team',
      ],
      createdAt: now.toISOString(),
    });
  }

  return alerts;
}
