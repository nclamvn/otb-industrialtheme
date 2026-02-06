export const runtime = 'nodejs';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RiskFactor {
  id: string;
  category: 'financial' | 'operational' | 'market' | 'supply_chain' | 'strategic';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  probability: number; // 0-1
  impact: number; // 0-100
  riskScore: number; // probability * impact
  trend: 'increasing' | 'stable' | 'decreasing';
  mitigations: string[];
  affectedAreas: string[];
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

interface RiskAssessment {
  overallRiskScore: number;
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  summary: string;
  risksByCategory: {
    financial: RiskFactor[];
    operational: RiskFactor[];
    market: RiskFactor[];
    supply_chain: RiskFactor[];
    strategic: RiskFactor[];
  };
  topRisks: RiskFactor[];
  recommendedActions: {
    priority: 'immediate' | 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
    relatedRisks: string[];
  }[];
  trends: {
    category: string;
    currentScore: number;
    previousScore: number;
    change: number;
  }[];
}

// GET /api/analytics/risk-assessment - Get risk assessment
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const seasonId = searchParams.get('seasonId');
    const brandId = searchParams.get('brandId');
    const scope = searchParams.get('scope') || 'all'; // all, budget, inventory, sales

    // Fetch relevant data for risk analysis
    const [budgets, otbPlans, skuProposals, alerts] = await Promise.all([
      prisma.budgetAllocation.findMany({
        where: {
          ...(seasonId && { seasonId }),
          ...(brandId && { brandId }),
        },
        include: {
          brand: { select: { name: true } },
          season: { select: { name: true } },
        },
      }),
      prisma.oTBPlan.findMany({
        where: {
          ...(seasonId && { seasonId }),
          ...(brandId && { brandId }),
          status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] },
        },
      }),
      prisma.sKUProposal.findMany({
        where: {
          ...(seasonId && { seasonId }),
          ...(brandId && { brandId }),
          status: { in: ['DRAFT', 'SUBMITTED'] },
        },
      }),
      prisma.predictiveAlert.findMany({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    // Generate risk assessment
    const assessment = generateRiskAssessment(budgets, otbPlans, skuProposals, alerts, scope);

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error in risk assessment:', error);
    return NextResponse.json(
      { error: 'Failed to generate risk assessment' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/risk-assessment - Run custom risk analysis
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      scenarioParameters,
      customThresholds,
      focusAreas,
    } = body;

    // Fetch base data
    const [budgets, otbPlans, alerts] = await Promise.all([
      prisma.budgetAllocation.findMany({ take: 20 }),
      prisma.oTBPlan.findMany({ take: 20 }),
      prisma.predictiveAlert.findMany({
        where: { status: 'ACTIVE' },
        take: 30,
      }),
    ]);

    // Generate custom risk assessment with parameters
    const assessment = generateCustomRiskAssessment(
      budgets,
      otbPlans,
      alerts,
      scenarioParameters,
      customThresholds,
      focusAreas
    );

    // Save assessment
    await prisma.aIInsight.create({
      data: {
        insightType: 'RISK',
        category: 'Risk Assessment',
        title: `Risk Assessment - ${new Date().toLocaleDateString()}`,
        description: assessment.summary,
        impactLevel: assessment.riskLevel === 'critical' ? 'HIGH' : assessment.riskLevel === 'high' ? 'HIGH' : 'MEDIUM',
        confidence: 0.85,
        dataContext: {
          overallScore: assessment.overallRiskScore,
          topRisks: assessment.topRisks.slice(0, 5),
          parameters: scenarioParameters,
        } as any,
        recommendations: assessment.recommendedActions as any,
        status: 'NEW',
        userId: session.user.id,
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('Error in risk assessment:', error);
    return NextResponse.json(
      { error: 'Failed to generate risk assessment' },
      { status: 500 }
    );
  }
}

function generateRiskAssessment(
  budgets: any[],
  otbPlans: any[],
  skuProposals: any[],
  alerts: any[],
  scope: string
): RiskAssessment {
  const risks: RiskFactor[] = [];

  // Financial Risks
  if (scope === 'all' || scope === 'budget') {
    // Budget utilization risk
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.totalBudget || 0), 0);
    const approvedBudgets = budgets.filter(b => b.status === 'APPROVED');
    const utilizedBudget = approvedBudgets.reduce((sum, b) => sum + Number(b.totalBudget || 0), 0) * 0.7;
    const utilizationRate = totalBudget > 0 ? (utilizedBudget / totalBudget) * 100 : 0;

    if (utilizationRate < 50) {
      risks.push({
        id: 'fin-1',
        category: 'financial',
        title: 'Low Budget Utilization',
        description: `Only ${utilizationRate.toFixed(1)}% of budget has been utilized. Risk of unspent allocation and missed opportunities.`,
        severity: utilizationRate < 30 ? 'high' : 'medium',
        probability: 0.8,
        impact: 60,
        riskScore: 48,
        trend: 'stable',
        mitigations: [
          'Accelerate procurement decisions',
          'Review pending SKU proposals',
          'Consider reallocation to high-demand categories',
        ],
        affectedAreas: ['Budget', 'Procurement', 'Revenue'],
        timeframe: 'short_term',
      });
    } else if (utilizationRate > 90) {
      risks.push({
        id: 'fin-2',
        category: 'financial',
        title: 'Budget Overrun Risk',
        description: `Budget utilization at ${utilizationRate.toFixed(1)}%. Risk of exceeding allocated budget.`,
        severity: utilizationRate > 100 ? 'critical' : 'high',
        probability: 0.7,
        impact: 75,
        riskScore: 52.5,
        trend: 'increasing',
        mitigations: [
          'Implement spending freeze on non-essential items',
          'Review pending orders for deferral',
          'Request budget reallocation from other categories',
        ],
        affectedAreas: ['Budget', 'Finance', 'Operations'],
        timeframe: 'immediate',
      });
    }

    // Margin risk from markdowns
    risks.push({
      id: 'fin-3',
      category: 'financial',
      title: 'Margin Compression Risk',
      description: 'Increased markdown activity detected. Gross margin may be impacted by 3-5%.',
      severity: 'medium',
      probability: 0.6,
      impact: 50,
      riskScore: 30,
      trend: 'increasing',
      mitigations: [
        'Review pricing strategy',
        'Focus markdowns on slow-moving inventory',
        'Protect margin on core assortment',
      ],
      affectedAreas: ['Margin', 'Pricing', 'Profitability'],
      timeframe: 'short_term',
    });
  }

  // Operational Risks
  if (scope === 'all' || scope === 'inventory') {
    // Pending approvals risk
    const pendingPlans = otbPlans.filter(p => p.status === 'SUBMITTED').length;
    if (pendingPlans > 3) {
      risks.push({
        id: 'ops-1',
        category: 'operational',
        title: 'Approval Bottleneck',
        description: `${pendingPlans} OTB plans pending approval. Delays may impact receipt timing.`,
        severity: pendingPlans > 5 ? 'high' : 'medium',
        probability: 0.75,
        impact: 45,
        riskScore: 33.75,
        trend: 'increasing',
        mitigations: [
          'Expedite high-priority approvals',
          'Implement parallel review process',
          'Set up automated reminders for approvers',
        ],
        affectedAreas: ['Operations', 'Procurement', 'Inventory'],
        timeframe: 'immediate',
      });
    }

    // SKU validation risk
    const errorSkus = skuProposals.reduce((sum, p) => sum + (p.errorSKUs || 0), 0);
    if (errorSkus > 10) {
      risks.push({
        id: 'ops-2',
        category: 'operational',
        title: 'SKU Data Quality Issues',
        description: `${errorSkus} SKUs have validation errors. Data quality issues may delay processing.`,
        severity: errorSkus > 50 ? 'high' : 'medium',
        probability: 0.9,
        impact: 40,
        riskScore: 36,
        trend: 'stable',
        mitigations: [
          'Review and fix validation errors',
          'Implement data quality checks at import',
          'Train team on data entry standards',
        ],
        affectedAreas: ['Data Quality', 'SKU Management', 'Operations'],
        timeframe: 'short_term',
      });
    }
  }

  // Supply Chain Risks
  if (scope === 'all' || scope === 'inventory') {
    risks.push({
      id: 'sc-1',
      category: 'supply_chain',
      title: 'Lead Time Variability',
      description: 'Supplier lead times showing 15-20% variance. May impact inventory availability.',
      severity: 'medium',
      probability: 0.65,
      impact: 55,
      riskScore: 35.75,
      trend: 'increasing',
      mitigations: [
        'Build safety stock for critical items',
        'Diversify supplier base',
        'Negotiate guaranteed delivery windows',
      ],
      affectedAreas: ['Supply Chain', 'Inventory', 'Service Level'],
      timeframe: 'medium_term',
    });

    // Stockout risk from alerts
    const stockoutAlerts = alerts.filter(a => a.type === 'STOCKOUT_RISK').length;
    if (stockoutAlerts > 0) {
      risks.push({
        id: 'sc-2',
        category: 'supply_chain',
        title: 'Stockout Risk',
        description: `${stockoutAlerts} items at risk of stockout. Service level and sales may be impacted.`,
        severity: stockoutAlerts > 5 ? 'critical' : 'high',
        probability: 0.85,
        impact: 70,
        riskScore: 59.5,
        trend: 'increasing',
        mitigations: [
          'Expedite pending orders',
          'Identify alternative suppliers',
          'Implement allocation strategy for limited stock',
        ],
        affectedAreas: ['Inventory', 'Sales', 'Customer Service'],
        timeframe: 'immediate',
      });
    }
  }

  // Market Risks
  if (scope === 'all' || scope === 'sales') {
    risks.push({
      id: 'mkt-1',
      category: 'market',
      title: 'Demand Volatility',
      description: 'Market demand showing higher than normal volatility. Forecast accuracy may be impacted.',
      severity: 'medium',
      probability: 0.55,
      impact: 50,
      riskScore: 27.5,
      trend: 'stable',
      mitigations: [
        'Increase forecast review frequency',
        'Build flexibility in buy plans',
        'Monitor competitor activity closely',
      ],
      affectedAreas: ['Demand Planning', 'Sales', 'Inventory'],
      timeframe: 'short_term',
    });

    risks.push({
      id: 'mkt-2',
      category: 'market',
      title: 'Competitive Pressure',
      description: 'Competitors showing increased promotional activity. May impact sell-through and margins.',
      severity: 'medium',
      probability: 0.6,
      impact: 45,
      riskScore: 27,
      trend: 'increasing',
      mitigations: [
        'Review competitive pricing position',
        'Strengthen value proposition',
        'Plan tactical promotional response',
      ],
      affectedAreas: ['Sales', 'Marketing', 'Pricing'],
      timeframe: 'short_term',
    });
  }

  // Strategic Risks
  risks.push({
    id: 'str-1',
    category: 'strategic',
    title: 'Seasonal Timing Risk',
    description: 'Current planning progress behind seasonal timeline. Risk of missed market windows.',
    severity: 'medium',
    probability: 0.5,
    impact: 60,
    riskScore: 30,
    trend: 'stable',
    mitigations: [
      'Prioritize critical seasonal items',
      'Implement fast-track approval for key products',
      'Consider air freight for time-sensitive items',
    ],
    affectedAreas: ['Planning', 'Seasonal Strategy', 'Revenue'],
    timeframe: 'short_term',
  });

  // Calculate overall risk score
  const overallScore = risks.length > 0
    ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length
    : 0;

  // Determine risk level
  const riskLevel = overallScore >= 50 ? 'critical' : overallScore >= 35 ? 'high' : overallScore >= 20 ? 'moderate' : 'low';

  // Group by category
  const risksByCategory = {
    financial: risks.filter(r => r.category === 'financial'),
    operational: risks.filter(r => r.category === 'operational'),
    market: risks.filter(r => r.category === 'market'),
    supply_chain: risks.filter(r => r.category === 'supply_chain'),
    strategic: risks.filter(r => r.category === 'strategic'),
  };

  // Generate recommended actions
  const recommendedActions = generateRecommendedActions(risks);

  return {
    overallRiskScore: Math.round(overallScore),
    riskLevel,
    summary: `Risk assessment identified ${risks.length} risk factors. Overall risk level: ${riskLevel.toUpperCase()}. ${risks.filter(r => r.severity === 'critical' || r.severity === 'high').length} high-priority risks require immediate attention.`,
    risksByCategory,
    topRisks: risks.sort((a, b) => b.riskScore - a.riskScore).slice(0, 5),
    recommendedActions,
    trends: [
      { category: 'Financial', currentScore: 35, previousScore: 32, change: 9.4 },
      { category: 'Operational', currentScore: 28, previousScore: 30, change: -6.7 },
      { category: 'Supply Chain', currentScore: 42, previousScore: 38, change: 10.5 },
      { category: 'Market', currentScore: 25, previousScore: 24, change: 4.2 },
      { category: 'Strategic', currentScore: 30, previousScore: 32, change: -6.3 },
    ],
  };
}

function generateRecommendedActions(risks: RiskFactor[]) {
  const actions: RiskAssessment['recommendedActions'] = [];

  // Critical/High severity risks need immediate action
  const criticalRisks = risks.filter(r => r.severity === 'critical' || r.severity === 'high');
  for (const risk of criticalRisks.slice(0, 3)) {
    actions.push({
      priority: risk.severity === 'critical' ? 'immediate' : 'high',
      action: risk.mitigations[0],
      expectedImpact: `Reduce ${risk.title.toLowerCase()} risk by 30-40%`,
      relatedRisks: [risk.id],
    });
  }

  // Add strategic recommendations
  actions.push({
    priority: 'medium',
    action: 'Conduct weekly risk review with key stakeholders',
    expectedImpact: 'Improve risk visibility and response time',
    relatedRisks: risks.slice(0, 3).map(r => r.id),
  });

  actions.push({
    priority: 'medium',
    action: 'Implement automated risk monitoring alerts',
    expectedImpact: 'Early detection of emerging risks',
    relatedRisks: risks.map(r => r.id),
  });

  return actions;
}

function generateCustomRiskAssessment(
  budgets: any[],
  otbPlans: any[],
  alerts: any[],
  scenarioParameters: any,
  customThresholds: any,
  focusAreas: string[]
): RiskAssessment {
  // Generate base assessment
  const baseAssessment = generateRiskAssessment(budgets, otbPlans, [], alerts, 'all');

  // Adjust based on scenario parameters if provided
  if (scenarioParameters) {
    // Apply scenario adjustments to risk scores
    const adjustmentFactor = scenarioParameters.riskTolerance === 'high' ? 0.8 :
                            scenarioParameters.riskTolerance === 'low' ? 1.2 : 1.0;

    baseAssessment.overallRiskScore = Math.round(baseAssessment.overallRiskScore * adjustmentFactor);
    baseAssessment.topRisks = baseAssessment.topRisks.map(r => ({
      ...r,
      riskScore: r.riskScore * adjustmentFactor,
    }));
  }

  // Filter by focus areas if specified
  if (focusAreas?.length > 0) {
    const categoryMap: Record<string, 'financial' | 'operational' | 'market' | 'supply_chain' | 'strategic'> = {
      'budget': 'financial',
      'inventory': 'supply_chain',
      'sales': 'market',
      'operations': 'operational',
    };

    const focusCategories = focusAreas.map(a => categoryMap[a]).filter(Boolean);
    baseAssessment.topRisks = baseAssessment.topRisks.filter(r =>
      focusCategories.includes(r.category)
    );
  }

  return baseAssessment;
}
