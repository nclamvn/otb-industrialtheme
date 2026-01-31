'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BudgetFlowView, WorkflowTracker, WorkflowStatusBadge } from '@/components/budget-flow';
import { PlanningGapDashboard } from '@/components/budget-flow/gap-handling';
import { BudgetNode } from '@/components/budget-flow/types';
import type { WorkflowStatus } from '@/components/budget-flow/WorkflowTracker';
import { useBudgetData } from '@/components/budget-flow/hooks/useBudgetData';
import { Loader2, ArrowLeft, Building2, Palette, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { StorePerformanceCard, useStorePerformance } from '@/components/store-performance';
import { ThemeGroupCard, THEME_CONFIG } from '@/components/carry-forward';
import { VarianceIndicator } from '@/components/shared/VarianceIndicator';

// Mock data mapping - replace with actual API call
const MOCK_BUDGETS: Record<string, BudgetNode> = {
  'ss26-hugo-boss': {
    id: 'ss26-hugo-boss',
    name: 'Hugo Boss SS26',
    level: 0,
    budget: 2100000,
    allocated: 1950000,
    percentage: 1,
    status: 'verified',
    metadata: {
      seasonYear: 'SS26',
      brand: 'Hugo Boss',
      location: 'Vincom Le Thanh Ton',
    },
    children: [
      {
        id: 'hb-male',
        name: 'Male',
        level: 1,
        budget: 1200000,
        allocated: 1150000,
        percentage: 0.57,
        status: 'verified',
        children: [
          {
            id: 'hb-male-suits',
            name: 'Suits',
            level: 2,
            budget: 500000,
            allocated: 480000,
            percentage: 0.42,
            status: 'verified',
          },
          {
            id: 'hb-male-casual',
            name: 'Casual Wear',
            level: 2,
            budget: 400000,
            allocated: 400000,
            percentage: 0.33,
            status: 'verified',
          },
          {
            id: 'hb-male-accessories',
            name: 'Accessories',
            level: 2,
            budget: 300000,
            allocated: 270000,
            percentage: 0.25,
            status: 'draft',
          },
        ],
      },
      {
        id: 'hb-female',
        name: 'Female',
        level: 1,
        budget: 900000,
        allocated: 800000,
        percentage: 0.43,
        status: 'draft',
        children: [
          {
            id: 'hb-female-dresses',
            name: 'Dresses',
            level: 2,
            budget: 400000,
            allocated: 380000,
            percentage: 0.44,
            status: 'verified',
          },
          {
            id: 'hb-female-outerwear',
            name: 'Outerwear',
            level: 2,
            budget: 300000,
            allocated: 250000,
            percentage: 0.33,
            status: 'warning',
          },
          {
            id: 'hb-female-accessories',
            name: 'Accessories',
            level: 2,
            budget: 200000,
            allocated: 170000,
            percentage: 0.23,
            status: 'draft',
          },
        ],
      },
    ],
  },
  'ss26-max-mara': {
    id: 'ss26-max-mara',
    name: 'Max Mara SS26',
    level: 0,
    budget: 1800000,
    allocated: 1700000,
    percentage: 1,
    status: 'verified',
    metadata: {
      seasonYear: 'SS26',
      brand: 'Max Mara',
      location: 'Vincom Le Thanh Ton',
    },
    children: [
      {
        id: 'mm-coats',
        name: 'Coats',
        level: 1,
        budget: 800000,
        allocated: 780000,
        percentage: 0.44,
        status: 'verified',
      },
      {
        id: 'mm-dresses',
        name: 'Dresses',
        level: 1,
        budget: 600000,
        allocated: 570000,
        percentage: 0.33,
        status: 'verified',
      },
      {
        id: 'mm-accessories',
        name: 'Accessories',
        level: 1,
        budget: 400000,
        allocated: 350000,
        percentage: 0.23,
        status: 'draft',
      },
    ],
  },
  'ss26-burberry': {
    id: 'ss26-burberry',
    name: 'Burberry SS26',
    level: 0,
    budget: 3200000,
    allocated: 3000000,
    percentage: 1,
    status: 'verified',
    metadata: {
      seasonYear: 'SS26',
      brand: 'Burberry',
      location: 'Vincom Le Thanh Ton',
    },
    children: [
      {
        id: 'bb-outerwear',
        name: 'Outerwear',
        level: 1,
        budget: 1500000,
        allocated: 1450000,
        percentage: 0.47,
        status: 'verified',
      },
      {
        id: 'bb-rtw',
        name: 'Ready-to-Wear',
        level: 1,
        budget: 1000000,
        allocated: 950000,
        percentage: 0.31,
        status: 'verified',
      },
      {
        id: 'bb-accessories',
        name: 'Accessories',
        level: 1,
        budget: 700000,
        allocated: 600000,
        percentage: 0.22,
        status: 'warning',
      },
    ],
  },
  'ss26-ferragamo': {
    id: 'ss26-ferragamo',
    name: 'Ferragamo SS26',
    level: 0,
    budget: 2500000,
    allocated: 2300000,
    percentage: 1,
    status: 'draft',
    metadata: {
      seasonYear: 'SS26',
      brand: 'Ferragamo',
      location: 'Vincom Le Thanh Ton',
    },
    children: [
      {
        id: 'fg-shoes',
        name: 'Shoes',
        level: 1,
        budget: 1200000,
        allocated: 1100000,
        percentage: 0.48,
        status: 'verified',
      },
      {
        id: 'fg-bags',
        name: 'Bags',
        level: 1,
        budget: 800000,
        allocated: 750000,
        percentage: 0.32,
        status: 'draft',
      },
      {
        id: 'fg-accessories',
        name: 'Accessories',
        level: 1,
        budget: 500000,
        allocated: 450000,
        percentage: 0.20,
        status: 'draft',
      },
    ],
  },
};

// Export functions
function exportToCSV(data: BudgetNode) {
  const rows: string[] = [];
  rows.push('Level,Name,Budget,Allocated,Percentage,Status');

  function flatten(node: BudgetNode, level: number = 0) {
    const indent = '  '.repeat(level);
    rows.push([
      level,
      `"${indent}${node.name}"`,
      node.budget,
      node.allocated,
      `${(node.percentage * 100).toFixed(1)}%`,
      node.status,
    ].join(','));

    if (node.children) {
      node.children.forEach(child => flatten(child, level + 1));
    }
  }

  flatten(data);

  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `budget-${data.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function BudgetFlowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;

  // Workflow status state
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('pending_md_review');
  const [showGapDashboard, setShowGapDashboard] = useState(false);

  // Get mock data for this budget ID
  const mockData = MOCK_BUDGETS[budgetId];

  const { data, isLoading, error, refresh, updateBudget } = useBudgetData({
    budgetId,
    initialData: mockData,
  });

  // Store performance data
  const { summary: storeSummary } = useStorePerformance({});

  // Demo theme data
  const themes = [
    { id: '1', name: 'August Drop', type: 'SEASONAL_TREND' as const, productCount: 45, totalValue: 2500000000, targetPercentage: 0.35, currentPercentage: 0.32, season: 'W25' },
    { id: '2', name: 'Core Collection', type: 'CORE_CLASSIC' as const, productCount: 80, totalValue: 4200000000, targetPercentage: 0.45, currentPercentage: 0.48, season: 'W25' },
    { id: '3', name: 'Limited Edition', type: 'LIMITED_EDITION' as const, productCount: 15, totalValue: 800000000, targetPercentage: 0.10, currentPercentage: 0.08, season: 'W25' },
  ];

  const handleExport = () => {
    if (data) {
      exportToCSV(data);
    }
  };

  const handleRefresh = async () => {
    await refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 dark:text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading budget data...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Budget not found'}</p>
          <p className="text-slate-500 dark:text-neutral-400 mb-4">Budget ID: {budgetId}</p>
          <Link href="/budget">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Budget List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="px-6 pt-4">
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400">
          <Link href="/budget" className="hover:text-slate-900 dark:hover:text-neutral-100 transition-colors">
            Budget
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-neutral-100 font-medium">{data.name}</span>
          <span className="ml-auto">
            <WorkflowStatusBadge status={workflowStatus} />
          </span>
        </nav>
      </div>

      {/* Workflow Tracker */}
      <div className="px-6 py-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">Approval Workflow</h3>
          <WorkflowTracker
            currentStatus={workflowStatus}
            onStepClick={(stepId) => console.log('Step clicked:', stepId)}
          />
        </div>
      </div>

      {/* Gap Dashboard Toggle */}
      <div className="px-6 pb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGapDashboard(!showGapDashboard)}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          {showGapDashboard ? 'Hide Gap Analysis' : 'Show Gap Analysis'}
        </Button>
      </div>

      {/* Planning Gap Dashboard */}
      {showGapDashboard && (
        <div className="px-6 pb-4">
          <PlanningGapDashboard
            data={data}
            onNodeClick={(nodeId) => console.log('Node clicked:', nodeId)}
          />
        </div>
      )}

      <BudgetFlowView
        data={data}
        onBudgetUpdate={updateBudget}
        onExport={handleExport}
        onRefresh={handleRefresh}
      />

      {/* Store Performance Section */}
      <div className="px-6 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Store Performance</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StorePerformanceCard
            data={{
              id: 'rex',
              storeGroup: 'REX',
              sellThruPercent: storeSummary.rex.avgSellThru,
              qtyReceived: 500,
              qtySold: Math.round(500 * storeSummary.rex.avgSellThru),
              qtyOnHand: Math.round(500 * (1 - storeSummary.rex.avgSellThru)),
              salesValue: storeSummary.rex.totalSalesValue,
              salesUnits: storeSummary.rex.totalSalesUnits,
              trend: 'up',
            }}
            showDetails={true}
          />
          <StorePerformanceCard
            data={{
              id: 'ttp',
              storeGroup: 'TTP',
              sellThruPercent: storeSummary.ttp.avgSellThru,
              qtyReceived: 500,
              qtySold: Math.round(500 * storeSummary.ttp.avgSellThru),
              qtyOnHand: Math.round(500 * (1 - storeSummary.ttp.avgSellThru)),
              salesValue: storeSummary.ttp.totalSalesValue,
              salesUnits: storeSummary.ttp.totalSalesUnits,
              trend: 'stable',
            }}
            showDetails={true}
          />
        </div>

        {/* Theme Breakdown Section */}
        <div className="flex items-center gap-2 mt-8">
          <Palette className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Theme Breakdown</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {themes.map((theme) => (
            <ThemeGroupCard
              key={theme.id}
              theme={theme}
              showProgress={true}
            />
          ))}
        </div>

        {/* YoY Variance */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">YoY Budget Variance</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">+15.2%</span>
              <VarianceIndicator value={0.152} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
