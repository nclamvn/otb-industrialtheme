'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, AlertTriangle, Plus, Play, Loader2, FileText } from 'lucide-react';
import { MarkdownPlanCard } from './MarkdownPlanCard';
import { OptimizationResults } from './OptimizationResults';
import { SimulationTool } from './SimulationTool';
import type { MarkdownPlan, OptimizationResult } from '@/types/clearance';

interface Props {
  brandId: string;
  seasonId: string;
}

// Demo data generator
function generateDemoPlans(): MarkdownPlan[] {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const twoMonths = new Date(today);
  twoMonths.setMonth(twoMonths.getMonth() + 2);

  return [
    {
      id: 'plan-1',
      planName: 'SS25 End of Season Clearance',
      planType: 'SEASONAL',
      brandId: 'brand-1',
      seasonId: 'season-1',
      status: 'DRAFT',
      planStartDate: today.toISOString(),
      planEndDate: nextMonth.toISOString(),
      targetSellThroughPct: 85,
      maxMarkdownPct: 50,
      phases: [
        { id: 'p1', phaseName: 'Phase 1', phaseOrder: 1, startDate: today.toISOString(), endDate: nextMonth.toISOString(), markdownPct: 20 },
        { id: 'p2', phaseName: 'Phase 2', phaseOrder: 2, startDate: today.toISOString(), endDate: nextMonth.toISOString(), markdownPct: 30 },
        { id: 'p3', phaseName: 'Phase 3', phaseOrder: 3, startDate: today.toISOString(), endDate: nextMonth.toISOString(), markdownPct: 50 },
      ],
      createdAt: today.toISOString(),
    },
    {
      id: 'plan-2',
      planName: 'Slow Movers Q1 Markdown',
      planType: 'CLEARANCE',
      brandId: 'brand-1',
      seasonId: 'season-1',
      status: 'ACTIVE',
      planStartDate: today.toISOString(),
      planEndDate: twoMonths.toISOString(),
      targetSellThroughPct: 75,
      maxMarkdownPct: 40,
      phases: [
        { id: 'p1', phaseName: 'Phase 1', phaseOrder: 1, startDate: today.toISOString(), endDate: nextMonth.toISOString(), markdownPct: 15 },
        { id: 'p2', phaseName: 'Phase 2', phaseOrder: 2, startDate: today.toISOString(), endDate: nextMonth.toISOString(), markdownPct: 25 },
      ],
      createdAt: today.toISOString(),
    },
    {
      id: 'plan-3',
      planName: 'Size Break Clearance',
      planType: 'CLEARANCE',
      brandId: 'brand-1',
      seasonId: 'season-1',
      status: 'DRAFT',
      planStartDate: nextMonth.toISOString(),
      planEndDate: twoMonths.toISOString(),
      targetSellThroughPct: 90,
      maxMarkdownPct: 60,
      phases: [
        { id: 'p1', phaseName: 'Phase 1', phaseOrder: 1, startDate: today.toISOString(), endDate: nextMonth.toISOString(), markdownPct: 30 },
        { id: 'p2', phaseName: 'Phase 2', phaseOrder: 2, startDate: today.toISOString(), endDate: nextMonth.toISOString(), markdownPct: 45 },
        { id: 'p3', phaseName: 'Phase 3', phaseOrder: 3, startDate: today.toISOString(), endDate: nextMonth.toISOString(), markdownPct: 60 },
      ],
      createdAt: today.toISOString(),
    },
    {
      id: 'plan-4',
      planName: 'Category Exit Strategy',
      planType: 'CLEARANCE',
      brandId: 'brand-1',
      seasonId: 'season-1',
      status: 'COMPLETED',
      planStartDate: today.toISOString(),
      planEndDate: nextMonth.toISOString(),
      targetSellThroughPct: 95,
      maxMarkdownPct: 70,
      phases: [
        { id: 'p1', phaseName: 'Phase 1', phaseOrder: 1, startDate: today.toISOString(), endDate: nextMonth.toISOString(), markdownPct: 40 },
        { id: 'p2', phaseName: 'Phase 2', phaseOrder: 2, startDate: today.toISOString(), endDate: nextMonth.toISOString(), markdownPct: 70 },
      ],
      createdAt: today.toISOString(),
    },
  ];
}

function generateDemoOptimizationResult(planId: string): OptimizationResult {
  return {
    planId,
    totalSKUs: 156,
    recommendations: [
      {
        id: 'rec-1',
        skuId: 'sku-001',
        skuCode: 'NK-AM90-BLK-42',
        currentStock: 45,
        currentWoC: 8.5,
        currentSellThrough: 32,
        recommendedAction: 'INCLUDE_PHASE_1',
        recommendedMarkdownPct: 20,
        predictedSellThrough: 85,
        predictedRevenue: 125000000,
        confidenceScore: 0.87,
        isOverridden: false,
      },
      {
        id: 'rec-2',
        skuId: 'sku-002',
        skuCode: 'NK-AF1-WHT-40',
        currentStock: 78,
        currentWoC: 12.3,
        currentSellThrough: 18,
        recommendedAction: 'IMMEDIATE_CLEAR',
        recommendedMarkdownPct: 50,
        predictedSellThrough: 92,
        predictedRevenue: 89000000,
        confidenceScore: 0.92,
        isOverridden: false,
      },
      {
        id: 'rec-3',
        skuId: 'sku-003',
        skuCode: 'AD-UB22-GRY-43',
        currentStock: 23,
        currentWoC: 4.2,
        currentSellThrough: 65,
        recommendedAction: 'NO_ACTION',
        predictedSellThrough: 78,
        predictedRevenue: 96000000,
        confidenceScore: 0.75,
        isOverridden: false,
      },
    ],
    summary: {
      byAction: {
        'NO_ACTION': 45,
        'INCLUDE_PHASE_1': 52,
        'INCLUDE_PHASE_2': 28,
        'INCLUDE_PHASE_3': 15,
        'IMMEDIATE_CLEAR': 12,
        'REMOVE_FROM_FLOOR': 4,
      },
      totalExpectedRevenue: 1250000000,
      avgConfidence: 0.85,
    },
  };
}

export function ClearanceDashboard({ brandId, seasonId }: Props) {
  const t = useTranslations('clearance');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [plans, setPlans] = useState<MarkdownPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Load demo data on mount
  useEffect(() => {
    const loadPlans = async () => {
      setIsLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setPlans(generateDemoPlans());
      setIsLoading(false);
    };
    loadPlans();
  }, [brandId, seasonId]);

  const handleOptimize = async (planId: string) => {
    setIsOptimizing(true);
    setSelectedPlanId(planId);
    // Simulate optimization API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    const result = generateDemoOptimizationResult(planId);
    setOptimizationResult(result);
    setIsOptimizing(false);
  };

  const summary = {
    totalPlans: plans.length,
    activePlans: plans.filter(p => p.status === 'ACTIVE').length,
    draftPlans: plans.filter(p => p.status === 'DRAFT').length,
    immediateAction: 12, // Demo value
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />{t('createNew')}</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-border bg-card',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-blue-500 p-4'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <FileText className="w-24 h-24 text-blue-500 opacity-[0.08]" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {t('totalPlans')}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
              {summary.totalPlans}
            </p>
          </div>
        </div>
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-border bg-card',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-green-500 p-4'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <Play className="w-24 h-24 text-green-500 opacity-[0.08]" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {t('active')}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
              {summary.activePlans}
            </p>
          </div>
        </div>
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-border bg-card',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-purple-500 p-4'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <TrendingDown className="w-24 h-24 text-purple-500 opacity-[0.08]" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {t('draft')}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
              {summary.draftPlans}
            </p>
          </div>
        </div>
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-border bg-card',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-amber-500 p-4'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <AlertTriangle className="w-24 h-24 text-amber-500 opacity-[0.08]" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {t('urgentAction')}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
              {summary.immediateAction}
            </p>
          </div>
        </div>
      </div>

      {/* Plans List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('markdownPlans')}</CardTitle>
          <CardDescription>{t('managePlans')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              {t('loading')}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('noPlans')}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {plans.map((plan) => (
                <MarkdownPlanCard
                  key={plan.id}
                  plan={plan}
                  onOptimize={() => handleOptimize(plan.id)}
                  isOptimizing={isOptimizing && selectedPlanId === plan.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimization Results */}
      {optimizationResult && selectedPlanId && (
        <OptimizationResults planId={selectedPlanId} result={optimizationResult} />
      )}

      {/* Simulation Tool */}
      {selectedPlanId && optimizationResult && (
        <SimulationTool planId={selectedPlanId} skus={optimizationResult.recommendations} />
      )}
    </div>
  );
}
