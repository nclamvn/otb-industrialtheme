export const runtime = 'nodejs';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { chat } from '@/lib/ai/openai';

interface ExecutiveSummary {
  generatedAt: string;
  period: {
    season: string;
    dateRange: string;
  };
  highlights: {
    type: 'positive' | 'negative' | 'neutral';
    metric: string;
    value: string;
    change: number;
    context: string;
  }[];
  financialSnapshot: {
    totalBudget: number;
    utilized: number;
    utilizationRate: number;
    variance: number;
    projection: string;
  };
  operationalStatus: {
    pendingApprovals: number;
    activePlans: number;
    completedPlans: number;
    blockers: string[];
  };
  riskSummary: {
    overallLevel: string;
    criticalCount: number;
    topRisks: string[];
  };
  recommendations: {
    priority: 'critical' | 'high' | 'medium';
    action: string;
    rationale: string;
  }[];
  aiNarrative?: string;
}

// GET /api/analytics/executive-summary - Get executive summary
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const seasonId = searchParams.get('seasonId');
    const includeAI = searchParams.get('includeAI') === 'true';

    // Fetch all relevant data
    const [
      season,
      budgets,
      otbPlans,
      skuProposals,
      alerts,
      _recentInsights,
    ] = await Promise.all([
      seasonId ? prisma.season.findUnique({ where: { id: seasonId } }) : prisma.season.findFirst({ where: { isCurrent: true } }),
      prisma.budgetAllocation.findMany({
        where: seasonId ? { seasonId } : {},
        include: { brand: { select: { name: true } } },
      }),
      prisma.oTBPlan.findMany({
        where: seasonId ? { seasonId } : {},
      }),
      prisma.sKUProposal.findMany({
        where: seasonId ? { seasonId } : {},
      }),
      prisma.predictiveAlert.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.aIInsight.findMany({
        where: { status: 'NEW' },
        orderBy: { generatedAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate metrics
    const totalBudget = budgets.reduce((sum: number, b: { totalBudget: unknown }) => sum + Number(b.totalBudget || 0), 0);
    // Calculate utilized from OTB plans or simulate based on approved budgets
    const approvedBudgets = budgets.filter((b: { status: string }) => b.status === 'APPROVED');
    const utilizedBudget = approvedBudgets.reduce((sum: number, b: { totalBudget: unknown }) => sum + Number(b.totalBudget || 0), 0) * 0.7; // Simulated 70% utilization for approved
    const utilizationRate = totalBudget > 0 ? (utilizedBudget / totalBudget) * 100 : 0;

    const pendingApprovals = otbPlans.filter((p: { status: string }) => p.status === 'SUBMITTED').length;
    const activePlans = otbPlans.filter((p: { status: string }) => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(p.status)).length;
    const completedPlans = otbPlans.filter((p: { status: string }) => p.status === 'APPROVED').length;

    const criticalAlerts = alerts.filter((a: { severity: string }) => a.severity === 'CRITICAL').length;

    // Generate highlights
    const highlights = generateHighlights(budgets, otbPlans, skuProposals, alerts);

    // Generate recommendations
    const recommendations = generateExecutiveRecommendations(
      utilizationRate,
      pendingApprovals,
      criticalAlerts,
      alerts
    );

    // Build summary
    const summary: ExecutiveSummary = {
      generatedAt: new Date().toISOString(),
      period: {
        season: season?.name || 'Current Season',
        dateRange: `${season?.startDate?.toLocaleDateString() || 'N/A'} - ${season?.endDate?.toLocaleDateString() || 'N/A'}`,
      },
      highlights,
      financialSnapshot: {
        totalBudget,
        utilized: utilizedBudget,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        variance: totalBudget - utilizedBudget,
        projection: utilizationRate < 70 ? 'Under-utilized' : utilizationRate > 95 ? 'Risk of overrun' : 'On track',
      },
      operationalStatus: {
        pendingApprovals,
        activePlans,
        completedPlans,
        blockers: generateBlockers(otbPlans, skuProposals),
      },
      riskSummary: {
        overallLevel: criticalAlerts > 2 ? 'High' : criticalAlerts > 0 ? 'Moderate' : 'Low',
        criticalCount: criticalAlerts,
        topRisks: alerts.slice(0, 3).map(a => a.title),
      },
      recommendations,
    };

    // Generate AI narrative if requested
    if (includeAI) {
      try {
        const narrative = await generateAINarrative(summary);
        summary.aiNarrative = narrative;
      } catch (err) {
        console.error('AI narrative generation failed:', err);
        // Continue without AI narrative
      }
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error generating executive summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate executive summary' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/executive-summary - Generate custom summary with AI
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { focus, audience, seasonId, includeSections } = body;

    // Fetch base data
    const [budgets, otbPlans, alerts] = await Promise.all([
      prisma.budgetAllocation.findMany({
        where: seasonId ? { seasonId } : {},
        include: { brand: { select: { name: true } } },
        take: 20,
      }),
      prisma.oTBPlan.findMany({
        where: seasonId ? { seasonId } : {},
        take: 20,
      }),
      prisma.predictiveAlert.findMany({
        where: { status: 'ACTIVE' },
        take: 20,
      }),
    ]);

    // Generate base metrics
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.totalBudget || 0), 0);
    const approvedBudgets = budgets.filter(b => b.status === 'APPROVED');
    const utilizedBudget = approvedBudgets.reduce((sum, b) => sum + Number(b.totalBudget || 0), 0) * 0.7;

    // Generate AI-powered summary
    const aiSummary = await generateCustomAISummary({
      focus: focus || 'overall',
      audience: audience || 'executive',
      metrics: {
        totalBudget,
        utilizedBudget,
        pendingApprovals: otbPlans.filter(p => p.status === 'SUBMITTED').length,
        activePlans: otbPlans.filter(p => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(p.status)).length,
        criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
        totalAlerts: alerts.length,
      },
      includeSections: includeSections || ['financial', 'operational', 'risks', 'recommendations'],
    });

    // Save the generated summary
    await prisma.aIInsight.create({
      data: {
        insightType: 'RECOMMENDATION',
        category: 'Executive Summary',
        title: `Executive Summary - ${new Date().toLocaleDateString()}`,
        description: aiSummary.summary.slice(0, 500),
        impactLevel: 'MEDIUM',
        confidence: 0.9,
        dataContext: {
          focus,
          audience,
          generatedAt: new Date().toISOString(),
        } as any,
        status: 'NEW',
        userId: session.user.id,
      },
    });

    return NextResponse.json(aiSummary, { status: 201 });
  } catch (error) {
    console.error('Error generating executive summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate executive summary' },
      { status: 500 }
    );
  }
}

function generateHighlights(
  budgets: any[],
  otbPlans: any[],
  skuProposals: any[],
  alerts: any[]
): ExecutiveSummary['highlights'] {
  const highlights: ExecutiveSummary['highlights'] = [];

  // Budget highlight
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.totalBudget || 0), 0);
  const approvedBudgets = budgets.filter(b => b.status === 'APPROVED');
  const utilizedBudget = approvedBudgets.reduce((sum, b) => sum + Number(b.totalBudget || 0), 0) * 0.7;
  const utilizationRate = totalBudget > 0 ? (utilizedBudget / totalBudget) * 100 : 0;

  highlights.push({
    type: utilizationRate >= 60 && utilizationRate <= 90 ? 'positive' : utilizationRate < 50 ? 'negative' : 'neutral',
    metric: 'Budget Utilization',
    value: `${utilizationRate.toFixed(1)}%`,
    change: 8.5, // Simulated change
    context: utilizationRate < 60 ? 'Underutilized - consider accelerating spend' : 'On track for season',
  });

  // OTB Plans highlight
  const completedPlans = otbPlans.filter(p => p.status === 'APPROVED').length;
  const totalPlans = otbPlans.length;
  const completionRate = totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0;

  highlights.push({
    type: completionRate >= 70 ? 'positive' : completionRate < 40 ? 'negative' : 'neutral',
    metric: 'Plan Completion',
    value: `${completedPlans}/${totalPlans}`,
    change: 15.2,
    context: `${completionRate.toFixed(0)}% of OTB plans approved`,
  });

  // SKU Progress highlight
  const totalSkus = skuProposals.reduce((sum, p) => sum + (p.totalSKUs || 0), 0);
  const validSkus = skuProposals.reduce((sum, p) => sum + (p.validSKUs || 0), 0);

  highlights.push({
    type: validSkus > totalSkus * 0.9 ? 'positive' : validSkus < totalSkus * 0.7 ? 'negative' : 'neutral',
    metric: 'SKU Validation',
    value: `${validSkus.toLocaleString()}`,
    change: 5.3,
    context: `${totalSkus > 0 ? ((validSkus / totalSkus) * 100).toFixed(0) : 0}% validation rate`,
  });

  // Alerts highlight
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;

  highlights.push({
    type: criticalAlerts === 0 ? 'positive' : criticalAlerts > 3 ? 'negative' : 'neutral',
    metric: 'Active Alerts',
    value: alerts.length.toString(),
    change: criticalAlerts > 0 ? 25 : -10,
    context: criticalAlerts > 0 ? `${criticalAlerts} critical alerts require attention` : 'No critical issues',
  });

  return highlights;
}

function generateBlockers(otbPlans: any[], skuProposals: any[]): string[] {
  const blockers: string[] = [];

  const pendingApprovals = otbPlans.filter(p => p.status === 'SUBMITTED').length;
  if (pendingApprovals > 3) {
    blockers.push(`${pendingApprovals} OTB plans awaiting approval`);
  }

  const errorSkus = skuProposals.reduce((sum, p) => sum + (p.errorSKUs || 0), 0);
  if (errorSkus > 0) {
    blockers.push(`${errorSkus} SKUs with validation errors`);
  }

  const draftPlans = otbPlans.filter(p => p.status === 'DRAFT').length;
  if (draftPlans > 5) {
    blockers.push(`${draftPlans} plans still in draft status`);
  }

  return blockers;
}

function generateExecutiveRecommendations(
  utilizationRate: number,
  pendingApprovals: number,
  criticalAlerts: number,
  _alerts: any[]
): ExecutiveSummary['recommendations'] {
  const recommendations: ExecutiveSummary['recommendations'] = [];

  if (criticalAlerts > 0) {
    recommendations.push({
      priority: 'critical',
      action: 'Address critical alerts immediately',
      rationale: `${criticalAlerts} critical alerts detected that may impact operations`,
    });
  }

  if (pendingApprovals > 3) {
    recommendations.push({
      priority: 'high',
      action: 'Expedite pending approvals',
      rationale: `${pendingApprovals} plans pending approval may delay procurement`,
    });
  }

  if (utilizationRate < 50) {
    recommendations.push({
      priority: 'high',
      action: 'Review budget utilization strategy',
      rationale: 'Low utilization rate indicates potential missed opportunities',
    });
  } else if (utilizationRate > 95) {
    recommendations.push({
      priority: 'high',
      action: 'Monitor spending closely',
      rationale: 'High utilization rate increases risk of budget overrun',
    });
  }

  // Add general recommendations
  recommendations.push({
    priority: 'medium',
    action: 'Schedule weekly planning review',
    rationale: 'Regular reviews improve forecast accuracy and risk detection',
  });

  return recommendations;
}

async function generateAINarrative(summary: ExecutiveSummary): Promise<string> {
  const prompt = `Generate a brief executive summary (2-3 paragraphs) based on the following data:

Budget: ${summary.financialSnapshot.utilizationRate}% utilized (${formatCurrency(summary.financialSnapshot.utilized)} of ${formatCurrency(summary.financialSnapshot.totalBudget)})
Pending Approvals: ${summary.operationalStatus.pendingApprovals}
Active Plans: ${summary.operationalStatus.activePlans}
Risk Level: ${summary.riskSummary.overallLevel}
Critical Alerts: ${summary.riskSummary.criticalCount}

Highlights:
${summary.highlights.map(h => `- ${h.metric}: ${h.value} (${h.context})`).join('\n')}

Provide insights and recommendations in a professional tone suitable for executive leadership.`;

  try {
    const narrative = await chat([{ role: 'user', content: prompt }]);
    return narrative;
  } catch {
    // Return a default narrative if AI fails
    return `Budget utilization is at ${summary.financialSnapshot.utilizationRate}% with ${formatCurrency(summary.financialSnapshot.variance)} remaining. ${summary.operationalStatus.pendingApprovals} plans await approval. Risk level is ${summary.riskSummary.overallLevel.toLowerCase()} with ${summary.riskSummary.criticalCount} critical alerts requiring attention.`;
  }
}

async function generateCustomAISummary(params: {
  focus: string;
  audience: string;
  metrics: any;
  includeSections: string[];
}): Promise<{ summary: string; sections: Record<string, string> }> {
  const prompt = `Generate an executive summary for ${params.audience} audience, focusing on ${params.focus}.

Key Metrics:
- Total Budget: ${formatCurrency(params.metrics.totalBudget)}
- Utilized: ${formatCurrency(params.metrics.utilizedBudget)} (${params.metrics.totalBudget > 0 ? ((params.metrics.utilizedBudget / params.metrics.totalBudget) * 100).toFixed(1) : 0}%)
- Pending Approvals: ${params.metrics.pendingApprovals}
- Active Plans: ${params.metrics.activePlans}
- Critical Alerts: ${params.metrics.criticalAlerts}
- Total Alerts: ${params.metrics.totalAlerts}

Generate sections for: ${params.includeSections.join(', ')}

Format as professional executive summary with clear, actionable insights.`;

  try {
    const summaryText = await chat([{ role: 'user', content: prompt }]);

    return {
      summary: summaryText,
      sections: {
        financial: 'Financial analysis included in summary',
        operational: 'Operational status included in summary',
        risks: 'Risk assessment included in summary',
        recommendations: 'Recommendations included in summary',
      },
    };
  } catch {
    return {
      summary: `Executive Summary: Budget utilization at ${params.metrics.totalBudget > 0 ? ((params.metrics.utilizedBudget / params.metrics.totalBudget) * 100).toFixed(1) : 0}%. ${params.metrics.pendingApprovals} items pending approval. ${params.metrics.criticalAlerts} critical alerts require attention.`,
      sections: {},
    };
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
