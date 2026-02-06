import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // KPI Dashboard
  async getKPIDashboard(query?: { seasonId?: string; brandId?: string }) {
    const { seasonId, brandId } = query || {};

    // Get active budgets
    const budgetWhere: any = { status: 'APPROVED' };
    if (seasonId) budgetWhere.seasonId = seasonId;
    if (brandId) budgetWhere.brandId = brandId;

    const [
      totalBudget,
      approvedBudgets,
      otbPlans,
      skuProposals,
    ] = await Promise.all([
      this.prisma.budgetAllocation.aggregate({
        where: budgetWhere,
        _sum: { totalBudget: true },
      }),
      this.prisma.budgetAllocation.count({ where: budgetWhere }),
      this.prisma.oTBPlan.count({ where: { status: 'APPROVED', ...(seasonId && { seasonId }), ...(brandId && { brandId }) } }),
      this.prisma.sKUProposal.count({ where: { status: 'APPROVED', ...(seasonId && { seasonId }), ...(brandId && { brandId }) } }),
    ]);

    // Get KPI definitions and their latest values
    const kpiDefinitions = await this.prisma.kPIDefinition.findMany({
      where: { isActive: true },
      include: {
        values: {
          take: 1,
          orderBy: { periodDate: 'desc' },
        },
        targets: {
          where: {
            ...(seasonId && { seasonId }),
            ...(brandId && { brandId }),
          },
          take: 1,
        },
      },
    });

    const kpis = kpiDefinitions.map((kpi) => ({
      id: kpi.id,
      code: kpi.code,
      name: kpi.name,
      category: kpi.category,
      currentValue: kpi.values[0]?.value ?? null,
      previousValue: kpi.values[0]?.previousValue ?? null,
      changePercent: kpi.values[0]?.changePercent ?? null,
      targetValue: kpi.targets[0]?.targetValue ?? null,
      unit: kpi.unit,
      format: kpi.format,
    }));

    return {
      summary: {
        totalBudgetAmount: Number(totalBudget._sum.totalBudget || 0),
        approvedBudgets,
        approvedOTBPlans: otbPlans,
        approvedSKUProposals: skuProposals,
      },
      kpis,
    };
  }

  // KPI Alerts
  async getKPIAlerts(query?: { isAcknowledged?: boolean; severity?: string; limit?: number }) {
    const { isAcknowledged, severity, limit = 20 } = query || {};

    const where: any = {};
    if (isAcknowledged !== undefined) where.isAcknowledged = isAcknowledged;
    if (severity) where.severity = severity;

    const alerts = await this.prisma.kPIAlert.findMany({
      where,
      include: {
        kpi: true,
        acknowledgedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return alerts;
  }

  // Acknowledge KPI Alert
  async acknowledgeKPIAlert(id: string, userId: string) {
    return this.prisma.kPIAlert.update({
      where: { id },
      data: {
        isAcknowledged: true,
        acknowledgedById: userId,
        acknowledgedAt: new Date(),
      },
    });
  }

  // Forecasts
  async getForecasts(query?: { seasonId?: string; brandId?: string; forecastType?: string }) {
    const { seasonId, brandId, forecastType } = query || {};

    const where: any = {};
    if (seasonId) where.seasonId = seasonId;
    if (brandId) where.brandId = brandId;
    if (forecastType) where.forecastType = forecastType;

    const forecasts = await this.prisma.forecast.findMany({
      where,
      include: {
        season: true,
        brand: true,
        category: true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { generatedAt: 'desc' },
    });

    return forecasts;
  }

  // Generate Forecast (simulated)
  async generateForecast(data: {
    forecastType: string;
    seasonId: string;
    brandId?: string;
    categoryId?: string;
  }, userId: string) {
    const { forecastType, seasonId, brandId, categoryId } = data;

    // Simulated forecast generation
    const forecastData = {
      periods: [
        { period: 'W1', value: Math.round(10000 + Math.random() * 5000), confidence: 0.85 },
        { period: 'W2', value: Math.round(10000 + Math.random() * 5000), confidence: 0.82 },
        { period: 'W3', value: Math.round(10000 + Math.random() * 5000), confidence: 0.78 },
        { period: 'W4', value: Math.round(10000 + Math.random() * 5000), confidence: 0.75 },
      ],
    };

    const forecast = await this.prisma.forecast.create({
      data: {
        forecastType: forecastType as any,
        modelUsed: 'dafc-forecast-v1',
        seasonId,
        brandId,
        categoryId,
        forecastData,
        confidence: 0.8,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        inputDataRange: { start: new Date().toISOString(), end: new Date().toISOString() },
        createdById: userId,
      },
      include: {
        season: true,
        brand: true,
        category: true,
      },
    });

    return forecast;
  }

  // Scenarios
  async getScenarios(query?: { seasonId?: string; status?: string }) {
    const { seasonId, status } = query || {};

    const where: any = {};
    if (seasonId) where.baseSeasonId = seasonId;
    if (status) where.status = status;

    const scenarios = await this.prisma.scenario.findMany({
      where,
      include: {
        baseSeason: true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return scenarios;
  }

  // Create Scenario
  async createScenario(data: {
    name: string;
    description?: string;
    baseSeasonId: string;
    parameters: any;
  }, userId: string) {
    // Simulate impact calculation
    const impactSummary = {
      revenueChange: (Math.random() * 20 - 10).toFixed(2) + '%',
      marginChange: (Math.random() * 10 - 5).toFixed(2) + '%',
      inventoryChange: (Math.random() * 15 - 7.5).toFixed(2) + '%',
    };

    const scenario = await this.prisma.scenario.create({
      data: {
        name: data.name,
        description: data.description,
        baseSeasonId: data.baseSeasonId,
        parameters: data.parameters,
        impactSummary,
        status: 'COMPLETED',
        createdById: userId,
      },
      include: {
        baseSeason: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    return scenario;
  }

  // AI Insights
  async getAIInsights(query?: { type?: string; status?: string; limit?: number }) {
    const { type, status, limit = 20 } = query || {};

    const where: any = {};
    if (type) where.insightType = type;
    if (status) where.status = status;

    const insights = await this.prisma.aIInsight.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
      take: limit,
    });

    return insights;
  }

  // Executive Summary
  async getExecutiveSummary(query?: { seasonId?: string }) {
    const { seasonId } = query || {};

    const seasonWhere = seasonId ? { seasonId } : {};

    const [
      totalBudgets,
      approvedBudgets,
      pendingApprovals,
      activeAlerts,
    ] = await Promise.all([
      this.prisma.budgetAllocation.count({ where: seasonWhere }),
      this.prisma.budgetAllocation.count({ where: { ...seasonWhere, status: 'APPROVED' } }),
      this.prisma.workflow.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      this.prisma.kPIAlert.count({ where: { isAcknowledged: false } }),
    ]);

    const totalBudgetAmount = await this.prisma.budgetAllocation.aggregate({
      where: { ...seasonWhere, status: 'APPROVED' },
      _sum: { totalBudget: true },
    });

    return {
      budgets: {
        total: totalBudgets,
        approved: approvedBudgets,
        totalAmount: Number(totalBudgetAmount._sum.totalBudget || 0),
      },
      approvals: {
        pending: pendingApprovals,
      },
      alerts: {
        active: activeAlerts,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  // Stock Optimization Recommendations
  async getStockOptimization(query?: { seasonId?: string; brandId?: string }) {
    // Simulated stock optimization data
    return {
      recommendations: [
        {
          type: 'REORDER',
          sku: 'SKU-001',
          currentStock: 50,
          recommendedOrder: 200,
          reason: 'High demand forecast',
          priority: 'HIGH',
        },
        {
          type: 'MARKDOWN',
          sku: 'SKU-002',
          currentStock: 500,
          recommendedAction: 'Apply 20% markdown',
          reason: 'Slow moving inventory',
          priority: 'MEDIUM',
        },
        {
          type: 'TRANSFER',
          sku: 'SKU-003',
          fromLocation: 'Store A',
          toLocation: 'Store B',
          quantity: 100,
          reason: 'Balance inventory across locations',
          priority: 'LOW',
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  // Risk Assessment
  async getRiskAssessment(query?: { seasonId?: string }) {
    // Simulated risk assessment
    return {
      overallRisk: 'MEDIUM',
      riskScore: 65,
      risks: [
        {
          category: 'INVENTORY',
          level: 'HIGH',
          description: '15% of SKUs at risk of stockout',
          mitigation: 'Accelerate reorder process',
        },
        {
          category: 'MARGIN',
          level: 'MEDIUM',
          description: 'Projected margin 2% below target',
          mitigation: 'Review pricing strategy',
        },
        {
          category: 'SALES',
          level: 'LOW',
          description: 'Sales on track with forecast',
          mitigation: 'Continue monitoring',
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}
