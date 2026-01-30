'use client';

import Link from 'next/link';
import { BudgetFlowView } from '@/components/budget-flow';
import { BudgetNode } from '@/components/budget-flow/types';
import { useBudgetData } from '@/components/budget-flow/hooks/useBudgetData';
import { formatCurrency } from '@/components/budget-flow/utils/budget-calculations';
import { Loader2, ArrowRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

// Available budgets for quick access
const AVAILABLE_BUDGETS = [
  { id: 'ss26-hugo-boss', name: 'Hugo Boss SS26', brand: 'Hugo Boss', budget: 2100000, status: 'verified' },
  { id: 'ss26-max-mara', name: 'Max Mara SS26', brand: 'Max Mara', budget: 1800000, status: 'verified' },
  { id: 'ss26-burberry', name: 'Burberry SS26', brand: 'Burberry', budget: 3200000, status: 'verified' },
  { id: 'ss26-ferragamo', name: 'Ferragamo SS26', brand: 'Ferragamo', budget: 2500000, status: 'draft' },
];

// Demo data for the main view
const mockBudgetData: BudgetNode = {
  id: 'root',
  name: 'FY 2026 Spring Summer',
  level: 0,
  budget: 1886500,
  allocated: 1750000,
  percentage: 1,
  status: 'verified',
  metadata: {
    seasonYear: 'SS26',
  },
  children: [
    {
      id: 'rex',
      name: 'REX',
      level: 1,
      budget: 1037575,
      allocated: 950000,
      percentage: 0.55,
      status: 'verified',
      children: [
        {
          id: 'rex-male',
          name: 'Male',
          level: 2,
          budget: 600000,
          allocated: 580000,
          percentage: 0.578,
          status: 'verified',
          children: [
            {
              id: 'rex-male-outerwear',
              name: 'Outerwear',
              level: 3,
              budget: 200000,
              allocated: 195000,
              percentage: 0.333,
              status: 'verified',
            },
            {
              id: 'rex-male-tops',
              name: 'Tops',
              level: 3,
              budget: 150000,
              allocated: 145000,
              percentage: 0.25,
              status: 'draft',
            },
            {
              id: 'rex-male-bottoms',
              name: 'Bottoms',
              level: 3,
              budget: 120000,
              allocated: 120000,
              percentage: 0.2,
              status: 'verified',
            },
            {
              id: 'rex-male-accessories',
              name: 'Accessories',
              level: 3,
              budget: 130000,
              allocated: 120000,
              percentage: 0.217,
              status: 'warning',
            },
          ],
        },
        {
          id: 'rex-female',
          name: 'Female',
          level: 2,
          budget: 400000,
          allocated: 350000,
          percentage: 0.385,
          status: 'draft',
        },
        {
          id: 'rex-unisex',
          name: 'Unisex',
          level: 2,
          budget: 37575,
          allocated: 20000,
          percentage: 0.037,
          status: 'error',
        },
      ],
    },
    {
      id: 'ttp',
      name: 'TTP',
      level: 1,
      budget: 848925,
      allocated: 800000,
      percentage: 0.45,
      status: 'draft',
      children: [
        {
          id: 'ttp-male',
          name: 'Male',
          level: 2,
          budget: 500000,
          allocated: 480000,
          percentage: 0.59,
          status: 'verified',
        },
        {
          id: 'ttp-female',
          name: 'Female',
          level: 2,
          budget: 348925,
          allocated: 320000,
          percentage: 0.41,
          status: 'draft',
        },
      ],
    },
  ],
};

// Export to CSV function
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

export default function BudgetFlowPage() {
  const { data, isLoading, error, refresh, updateBudget } = useBudgetData({
    initialData: mockBudgetData,
  });

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
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading budget data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">No budget data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Quick Access to Other Budgets */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            Quick Access
          </h2>
          <Link
            href="/budget"
            className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            View All Budgets
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {AVAILABLE_BUDGETS.map((budget) => (
            <Link
              key={budget.id}
              href={`/budget-flow/${budget.id}`}
              className={cn(
                'flex-shrink-0 px-4 py-3 rounded-xl border transition-all',
                'bg-white hover:bg-amber-50 hover:border-amber-200',
                'border-slate-200'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-800">{budget.brand}</div>
                  <div className="text-sm text-slate-500">
                    {formatCurrency(budget.budget)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Demo Budget Flow View */}
      <div className="border-t border-slate-200 mt-2">
        <div className="px-6 py-3 bg-amber-50/50 border-b border-amber-100">
          <p className="text-sm text-amber-700">
            <strong>Demo Mode:</strong> Showing sample budget data. Click a budget above to view real allocation details.
          </p>
        </div>
        <BudgetFlowView
          data={data}
          onBudgetUpdate={updateBudget}
          onExport={handleExport}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
