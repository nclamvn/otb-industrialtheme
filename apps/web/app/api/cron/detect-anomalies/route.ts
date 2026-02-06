export const runtime = 'nodejs';

// Cron endpoint for automated anomaly detection
// Can be called by Vercel Cron, external scheduler, or manually
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAlerts } from '@/lib/ai/tools/get-alerts';

// Verify cron secret for security (optional - for production)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Optional: Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting anomaly detection...');

    // Get all alerts from the detection system
    const alertResult = await getAlerts({ alert_type: 'all', limit: 50 }, 'system');

    const savedAlerts: string[] = [];
    const skippedAlerts: string[] = [];

    // Process each alert and save to database
    for (const alert of alertResult.alerts) {
      // Check for duplicate (same type + title within last 24 hours)
      const existingAlert = await prisma.predictiveAlert.findFirst({
        where: {
          type: mapAlertType(alert.type),
          title: alert.title,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (existingAlert) {
        skippedAlerts.push(alert.id);
        continue;
      }

      // Save new alert to database
      const savedAlert = await prisma.predictiveAlert.create({
        data: {
          type: mapAlertType(alert.type),
          severity: mapSeverity(alert.severity),
          title: alert.title,
          description: alert.message,
          probability: 0.8, // Default high probability for detected anomalies
          timeframe: '24 hours',
          data: {
            originalType: alert.type,
            entity: alert.entity,
            detectedAt: new Date().toISOString(),
          },
          metrics: alert.metric ? {
            current: alert.metric.current,
            threshold: alert.metric.threshold,
            unit: alert.metric.unit,
          } : undefined,
          recommendations: alert.actionRequired ? ['Review immediately', 'Take corrective action'] : undefined,
          status: 'ACTIVE',
        },
      });

      savedAlerts.push(savedAlert.id);
    }

    // Create notifications for critical alerts
    const criticalAlerts = alertResult.alerts.filter(a => a.severity === 'critical');

    if (criticalAlerts.length > 0) {
      // Get admin users to notify
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'FINANCE_HEAD', 'MERCHANDISE_LEAD'] } },
        select: { id: true },
      });

      // Create notifications for each admin
      for (const admin of admins) {
        for (const alert of criticalAlerts) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              type: 'SYSTEM_ALERT',
              priority: 'CRITICAL',
              title: alert.title,
              message: alert.message,
              referenceType: alert.entity?.type || 'ALERT',
              referenceId: alert.entity?.id,
              referenceUrl: getAlertUrl(alert),
            },
          });
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: alertResult.summary,
      saved: savedAlerts.length,
      skipped: skippedAlerts.length,
      criticalNotifications: criticalAlerts.length,
    };

    console.log('[Cron] Anomaly detection completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Cron] Anomaly detection failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Map alert type string to PredictiveAlertType enum
function mapAlertType(type: string): 'STOCKOUT_RISK' | 'OVERSTOCK_RISK' | 'MARGIN_DECLINE' | 'TREND_REVERSAL' | 'DEMAND_SPIKE' | 'SLOW_MOVING' | 'SEASON_END_RISK' | 'BUDGET_OVERRUN' {
  const mapping: Record<string, 'STOCKOUT_RISK' | 'OVERSTOCK_RISK' | 'MARGIN_DECLINE' | 'TREND_REVERSAL' | 'DEMAND_SPIKE' | 'SLOW_MOVING' | 'SEASON_END_RISK' | 'BUDGET_OVERRUN'> = {
    'stockout_risk': 'STOCKOUT_RISK',
    'overstock_risk': 'OVERSTOCK_RISK',
    'otb_overrun': 'BUDGET_OVERRUN',
    'approval_pending': 'SLOW_MOVING',
    'kpi_threshold': 'TREND_REVERSAL',
    'margin_decline': 'MARGIN_DECLINE',
  };
  return mapping[type] || 'TREND_REVERSAL';
}

// Map severity string to enum
function mapSeverity(severity: string): 'INFO' | 'WARNING' | 'CRITICAL' {
  const mapping: Record<string, 'INFO' | 'WARNING' | 'CRITICAL'> = {
    'info': 'INFO',
    'warning': 'WARNING',
    'critical': 'CRITICAL',
  };
  return mapping[severity] || 'INFO';
}

// Get URL for alert detail
function getAlertUrl(alert: { type: string; entity?: { type: string; id: string } }): string {
  if (!alert.entity) return '/predictive-alerts';

  const urlMapping: Record<string, string> = {
    'SKU': `/sku-proposal/${alert.entity.id}`,
    'OTB': `/otb-analysis/${alert.entity.id}`,
    'BUDGET': `/budget/${alert.entity.id}`,
    'BRAND': `/master-data/brands`,
  };

  return urlMapping[alert.entity.type] || '/predictive-alerts';
}

// Also support POST for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}
