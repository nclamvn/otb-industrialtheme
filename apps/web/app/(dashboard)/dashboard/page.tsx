'use client';

import { useState } from 'react';
import { ContextBar } from '@/components/layout/context-bar';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { InlineProgress } from '@/components/ui/inline-progress';
import { TrendChart } from '@/components/charts/trend-chart';
import { DollarSign, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getBudgetHealth,
  getHealthStyles,
  formatBudgetCurrency,
} from '@/components/ui/budget';

// Mock data
const mockKPIs = {
  netSales: { value: '$2.45M', trend: { value: 12.3, direction: 'up' as const, label: 'vs LY' } },
  sellThrough: { value: '68.5%', trend: { value: -2.1, direction: 'down' as const, label: 'vs Plan' } },
  woc: { value: '4.2', trend: { value: 0, direction: 'neutral' as const } },
  alerts: { critical: 3, warning: 12, healthy: 45 },
};

const mockCategories = [
  { id: '1', name: 'Bags', bop: 2450, sales: 1200, intake: 500, eop: 1750, st: 68.5, status: 'success' as const },
  { id: '2', name: 'Shoes', bop: 1800, sales: 650, intake: 200, eop: 1350, st: 45.2, status: 'warning' as const },
  { id: '3', name: 'RTW', bop: 950, sales: 280, intake: 100, eop: 770, st: 28.0, status: 'critical' as const },
  { id: '4', name: 'Accessories', bop: 420, sales: 185, intake: 80, eop: 315, st: 52.3, status: 'success' as const },
];

const mockChartData = [
  { period: 'W01', actual: 120, plan: 100, ly: 90 },
  { period: 'W02', actual: 145, plan: 110, ly: 95 },
  { period: 'W03', actual: 160, plan: 120, ly: 110 },
  { period: 'W04', actual: 180, plan: 130, ly: 120 },
  { period: 'W05', actual: 210, plan: 140, ly: 130 },
  { period: 'W06', actual: 195, plan: 150, ly: 145 },
  { period: 'W07', actual: 230, plan: 160, ly: 155 },
  { period: 'W08', actual: 250, plan: 170, ly: 165 },
];

const brands = [
  { id: '1', name: 'Ferragamo' },
  { id: '2', name: 'Burberry' },
];

const seasons = [
  { id: '1', name: 'SS25' },
  { id: '2', name: 'FW24' },
];

export default function DashboardPage() {
  const [selectedBrand, setSelectedBrand] = useState('1');
  const [selectedSeason, setSelectedSeason] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  const columns = [
    { key: 'name', header: 'Category', sortable: true },
    { key: 'bop', header: 'BOP', align: 'right' as const, sortable: true },
    { key: 'sales', header: 'Sales', align: 'right' as const, sortable: true },
    { key: 'intake', header: 'Intake', align: 'right' as const, sortable: true },
    { key: 'eop', header: 'EOP', align: 'right' as const, sortable: true },
    {
      key: 'st',
      header: 'ST%',
      align: 'right' as const,
      sortable: true,
      render: (row: typeof mockCategories[0]) => <InlineProgress value={row.st} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: typeof mockCategories[0]) => <StatusBadge status={row.status} />,
    },
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Context Bar */}
      <ContextBar
        brands={brands}
        seasons={seasons}
        selectedBrand={selectedBrand}
        selectedSeason={selectedSeason}
        onBrandChange={setSelectedBrand}
        onSeasonChange={setSelectedSeason}
        onRefresh={handleRefresh}
        onExport={() => console.log('Export')}
        isLoading={isLoading}
      />

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* KPI Cards - Unified Design: rounded-xl, border-l-4, hover:border-border/80, watermark icons */}
        <div className="grid grid-cols-4 gap-3">
          {/* Net Sales Card */}
          <div
            className={cn(
              'relative rounded-xl border border-border bg-card overflow-hidden',
              'hover:border-border/80 transition-all duration-200',
              'border-l-4 border-l-green-500'
            )}
          >
            {/* Watermark Icon */}
            <div className="absolute -right-4 -bottom-4 pointer-events-none">
              <DollarSign className="w-24 h-24 text-green-500 opacity-[0.08]" />
            </div>
            <div className="p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">Net Sales</p>
                <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
                  {mockKPIs.netSales.value}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950 text-green-700">
                    <TrendingUp className="h-3 w-3" />
                    +{mockKPIs.netSales.trend.value}%
                  </span>
                  <span className="text-xs text-slate-400 dark:text-neutral-500">{mockKPIs.netSales.trend.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sell-Through Card */}
          <div
            className={cn(
              'relative rounded-xl border border-border bg-card overflow-hidden',
              'hover:border-border/80 transition-all duration-200',
              'border-l-4 border-l-amber-500'
            )}
          >
            {/* Watermark Icon */}
            <div className="absolute -right-4 -bottom-4 pointer-events-none">
              <TrendingUp className="w-24 h-24 text-amber-500 opacity-[0.08]" />
            </div>
            <div className="p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">Sell-Through</p>
                <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
                  {mockKPIs.sellThrough.value}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950 text-red-700">
                    <TrendingDown className="h-3 w-3" />
                    {mockKPIs.sellThrough.trend.value}%
                  </span>
                  <span className="text-xs text-slate-400 dark:text-neutral-500">{mockKPIs.sellThrough.trend.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weeks of Cover Card */}
          <div
            className={cn(
              'relative rounded-xl border border-border bg-card overflow-hidden',
              'hover:border-border/80 transition-all duration-200',
              'border-l-4 border-l-blue-500'
            )}
          >
            {/* Watermark Icon */}
            <div className="absolute -right-4 -bottom-4 pointer-events-none">
              <Package className="w-24 h-24 text-blue-500 opacity-[0.08]" />
            </div>
            <div className="p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">Weeks of Cover</p>
                <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
                  {mockKPIs.woc.value}
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2">
                  Target: 4-6 weeks
                </p>
              </div>
            </div>
          </div>

          {/* Alerts Card */}
          <div
            className={cn(
              'relative rounded-xl border border-border bg-card overflow-hidden',
              'hover:border-border/80 transition-all duration-200',
              'border-l-4 border-l-red-500'
            )}
          >
            {/* Watermark Icon */}
            <div className="absolute -right-4 -bottom-4 pointer-events-none">
              <AlertTriangle className="w-24 h-24 text-red-500 opacity-[0.08]" />
            </div>
            <div className="p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">Alerts</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-full text-sm font-bold bg-red-50 dark:bg-red-950 text-red-700 border border-red-200 tabular-nums">
                    {mockKPIs.alerts.critical}
                  </span>
                  <span className="inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-full text-sm font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 border border-amber-200 tabular-nums">
                    {mockKPIs.alerts.warning}
                  </span>
                  <span className="inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-full text-sm font-bold bg-green-50 dark:bg-green-950 text-green-700 border border-green-200 tabular-nums">
                    {mockKPIs.alerts.healthy}
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-2">
                  Critical / Warning / Healthy
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row - Unified Design */}
        <div className="grid grid-cols-2 gap-4">
          {/* Trend Chart */}
          <div
            className={cn(
              'rounded-xl border border-border bg-card overflow-hidden',
              'hover:border-border/80 transition-all duration-200',
              'border-l-4 border-l-slate-600'
            )}
          >
            <div className="p-4 border-b border-slate-100 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Weekly Trend</h2>
            </div>
            <div className="p-4">
              <TrendChart data={mockChartData} height={250} />
            </div>
          </div>

          {/* Category Breakdown */}
          <div
            className={cn(
              'rounded-xl border border-border bg-card overflow-hidden',
              'hover:border-border/80 transition-all duration-200',
              'border-l-4 border-l-slate-400'
            )}
          >
            <div className="p-4 border-b border-slate-100 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">By Category</h2>
            </div>
            <div className="p-4 space-y-3">
              {mockCategories.map((cat) => {
                const percentage = (cat.sales / 1500) * 100;
                const health = getBudgetHealth(percentage / 100);
                const healthStyles = getHealthStyles(health);
                return (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-neutral-100">{cat.name}</span>
                    <div className="flex items-center gap-3">
                      {/* Unified h-2 progress bar */}
                      <div className="w-32 h-2 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', healthStyles.bar)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="tabular-nums w-12 text-right text-sm text-slate-500 dark:text-neutral-400">
                        {Math.round((cat.sales / 3615) * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Table - Unified Design */}
        <div
          className={cn(
            'rounded-xl border border-border bg-card overflow-hidden',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-slate-800'
          )}
        >
          <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Category Performance</h2>
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 w-48"
            />
          </div>
          <DataTable
            columns={columns}
            data={mockCategories}
            keyField="id"
            onRowClick={(row) => console.log('Clicked:', row)}
          />
        </div>
      </div>
    </div>
  );
}
