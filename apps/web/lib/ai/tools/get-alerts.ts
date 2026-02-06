// Get Alerts Tool - Fetch current alerts and warnings
import prisma from '@/lib/prisma';

interface AlertInput {
  alert_type: string;
  severity?: string;
  limit?: number;
}

interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  entity?: {
    type: string;
    id: string;
    name: string;
  };
  metric?: {
    current: number;
    threshold: number;
    unit: string;
  };
  createdAt: Date;
  actionRequired: boolean;
}

export async function getAlerts(
  input: Record<string, unknown>,
  _userId: string
): Promise<{ type: string; alerts: Alert[]; summary: Record<string, number> }> {
  const { alert_type, severity = 'all', limit = 10 } = input as unknown as AlertInput;

  try {
    const alerts: Alert[] = [];

    switch (alert_type) {
      case 'all':
        alerts.push(
          ...(await getStockoutRiskAlerts(limit)),
          ...(await getOverstockRiskAlerts(limit)),
          ...(await getOTBOverrunAlerts(limit)),
          ...(await getApprovalPendingAlerts(limit)),
          ...(await getKPIThresholdAlerts(limit))
        );
        break;
      case 'stockout_risk':
        alerts.push(...(await getStockoutRiskAlerts(limit)));
        break;
      case 'overstock_risk':
        alerts.push(...(await getOverstockRiskAlerts(limit)));
        break;
      case 'otb_overrun':
        alerts.push(...(await getOTBOverrunAlerts(limit)));
        break;
      case 'approval_pending':
        alerts.push(...(await getApprovalPendingAlerts(limit)));
        break;
      case 'kpi_threshold':
        alerts.push(...(await getKPIThresholdAlerts(limit)));
        break;
      case 'margin_decline':
        alerts.push(...(await getMarginDeclineAlerts(limit)));
        break;
      default:
        return { type: 'alerts', alerts: [], summary: {} };
    }

    // Filter by severity if specified
    const filteredAlerts =
      severity === 'all'
        ? alerts
        : alerts.filter((a) => a.severity === severity);

    // Sort by severity (critical first) then by date
    const sortedAlerts = filteredAlerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Summary counts
    const summary = {
      critical: sortedAlerts.filter((a) => a.severity === 'critical').length,
      warning: sortedAlerts.filter((a) => a.severity === 'warning').length,
      info: sortedAlerts.filter((a) => a.severity === 'info').length,
      total: sortedAlerts.length,
    };

    return {
      type: 'alerts',
      alerts: sortedAlerts.slice(0, limit),
      summary,
    };
  } catch (error) {
    console.error('Get alerts error:', error);
    return { type: 'alerts', alerts: [], summary: {} };
  }
}

async function getStockoutRiskAlerts(limit: number): Promise<Alert[]> {
  // Check for low stock items
  const alerts: Alert[] = [];

  // Get OTB plans with low closing stock
  const otbPlans = await prisma.oTBPlan.findMany({
    where: {
      status: { in: ['APPROVED', 'FINAL'] },
    },
    include: {
      brand: true,
      season: true,
    },
    take: limit,
  });

  otbPlans.forEach((plan) => {
    // Simulate weeks of supply (2-12 weeks)
    const weeksOfSupply = 2 + (Math.random() * 10);

    if (weeksOfSupply < 4) {
      alerts.push({
        id: `stockout-${plan.id}`,
        type: 'stockout_risk',
        severity: weeksOfSupply < 2 ? 'critical' : 'warning',
        title: 'Low Stock Risk',
        message: `${plan.brand.name} (${plan.season.name}) has only ${weeksOfSupply.toFixed(1)} weeks of supply remaining`,
        entity: {
          type: 'OTBPlan',
          id: plan.id,
          name: `${plan.brand.name} - ${plan.season.name}`,
        },
        metric: {
          current: weeksOfSupply,
          threshold: 4,
          unit: 'weeks',
        },
        createdAt: new Date(),
        actionRequired: true,
      });
    }
  });

  return alerts;
}

async function getOverstockRiskAlerts(limit: number): Promise<Alert[]> {
  const alerts: Alert[] = [];

  const otbPlans = await prisma.oTBPlan.findMany({
    where: {
      status: { in: ['APPROVED', 'FINAL'] },
    },
    include: {
      brand: true,
      season: true,
    },
    take: limit,
  });

  otbPlans.forEach((plan) => {
    // Simulate weeks of supply for overstock detection
    const weeksOfSupply = 10 + (Math.random() * 20); // Simulate 10-30 weeks

    if (weeksOfSupply > 16) {
      alerts.push({
        id: `overstock-${plan.id}`,
        type: 'overstock_risk',
        severity: weeksOfSupply > 24 ? 'critical' : 'warning',
        title: 'Excess Inventory Risk',
        message: `${plan.brand.name} (${plan.season.name}) has ${weeksOfSupply.toFixed(1)} weeks of supply - consider markdown`,
        entity: {
          type: 'OTBPlan',
          id: plan.id,
          name: `${plan.brand.name} - ${plan.season.name}`,
        },
        metric: {
          current: weeksOfSupply,
          threshold: 16,
          unit: 'weeks',
        },
        createdAt: new Date(),
        actionRequired: true,
      });
    }
  });

  return alerts;
}

async function getOTBOverrunAlerts(limit: number): Promise<Alert[]> {
  const alerts: Alert[] = [];

  const otbPlans = await prisma.oTBPlan.findMany({
    where: {
      status: { in: ['APPROVED', 'FINAL'] },
    },
    include: {
      brand: true,
      season: true,
    },
    take: limit,
  });

  otbPlans.forEach((plan) => {
    // Simulate utilization (70-110%)
    const utilization = 70 + Math.random() * 40;

    if (utilization > 90) {
      alerts.push({
        id: `otb-overrun-${plan.id}`,
        type: 'otb_overrun',
        severity: utilization > 100 ? 'critical' : 'warning',
        title: 'OTB Budget Alert',
        message: `${plan.brand.name} OTB is ${utilization.toFixed(1)}% utilized - ${utilization > 100 ? 'OVER BUDGET' : 'approaching limit'}`,
        entity: {
          type: 'OTBPlan',
          id: plan.id,
          name: `${plan.brand.name} - ${plan.season.name}`,
        },
        metric: {
          current: utilization,
          threshold: 90,
          unit: '%',
        },
        createdAt: new Date(),
        actionRequired: utilization > 100,
      });
    }
  });

  return alerts;
}

async function getApprovalPendingAlerts(limit: number): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Check SKU proposals pending approval (SUBMITTED status)
  const pendingProposals = await prisma.sKUProposal.findMany({
    where: {
      status: 'SUBMITTED',
    },
    include: {
      brand: true,
      season: true,
    },
    take: limit,
  });

  pendingProposals.forEach((proposal) => {
    const proposalName = `${proposal.brand.name} - ${proposal.season.name}`;
    const daysPending = Math.floor(
      (Date.now() - new Date(proposal.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    alerts.push({
      id: `approval-${proposal.id}`,
      type: 'approval_pending',
      severity: daysPending > 5 ? 'warning' : 'info',
      title: 'Approval Pending',
      message: `SKU Proposal "${proposalName}" waiting for approval (${daysPending} days)`,
      entity: {
        type: 'SKUProposal',
        id: proposal.id,
        name: proposalName,
      },
      createdAt: proposal.createdAt,
      actionRequired: true,
    });
  });

  // Check OTB plans pending approval (SUBMITTED status)
  const pendingOTB = await prisma.oTBPlan.findMany({
    where: {
      status: 'SUBMITTED',
    },
    include: {
      brand: true,
      season: true,
    },
    take: limit,
  });

  pendingOTB.forEach((plan) => {
    alerts.push({
      id: `otb-approval-${plan.id}`,
      type: 'approval_pending',
      severity: 'info',
      title: 'OTB Approval Pending',
      message: `OTB Plan for ${plan.brand.name} - ${plan.season.name} awaiting approval`,
      entity: {
        type: 'OTBPlan',
        id: plan.id,
        name: `${plan.brand.name} - ${plan.season.name}`,
      },
      createdAt: plan.createdAt,
      actionRequired: true,
    });
  });

  return alerts;
}

async function getKPIThresholdAlerts(_limit: number): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Check KPI alerts from database
  const kpiAlerts = await prisma.kPIAlert.findMany({
    where: {
      isAcknowledged: false,
    },
    include: {
      kpi: true,
    },
    take: 10,
  });

  kpiAlerts.forEach((alert) => {
    alerts.push({
      id: `kpi-${alert.id}`,
      type: 'kpi_threshold',
      severity: alert.severity === 'CRITICAL' ? 'critical' : 'warning',
      title: `KPI Alert: ${alert.kpi?.name || 'Unknown'}`,
      message: alert.message,
      metric: {
        current: alert.currentValue,
        threshold: alert.thresholdValue,
        unit: alert.kpi?.unit || '',
      },
      createdAt: alert.createdAt,
      actionRequired: alert.severity === 'CRITICAL',
    });
  });

  return alerts;
}

async function getMarginDeclineAlerts(_limit: number): Promise<Alert[]> {
  // Simulated margin decline alerts
  const alerts: Alert[] = [];

  // Example alert
  alerts.push({
    id: 'margin-decline-1',
    type: 'margin_decline',
    severity: 'warning',
    title: 'Margin Decline Detected',
    message: 'Category "Accessories" showing 5% margin decline vs last month',
    entity: {
      type: 'Category',
      id: 'sample-cat',
      name: 'Accessories',
    },
    metric: {
      current: 35,
      threshold: 40,
      unit: '%',
    },
    createdAt: new Date(),
    actionRequired: false,
  });

  return alerts;
}
