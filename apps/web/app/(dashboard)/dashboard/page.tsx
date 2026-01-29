'use client';

import { useState } from 'react';
import { ContextBar } from '@/components/layout/context-bar';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { InlineProgress } from '@/components/ui/inline-progress';
import { TrendChart } from '@/components/charts/trend-chart';
import { DollarSign, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';

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
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3">
          {/* Net Sales Card */}
          <Card className="relative overflow-hidden">
            <DollarSign className="absolute -bottom-4 -right-4 h-32 w-32 text-emerald-500/10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Sales</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight text-emerald-600">
                {mockKPIs.netSales.value}
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">+{mockKPIs.netSales.trend.value}%</span>
                <span>{mockKPIs.netSales.trend.label}</span>
              </p>
            </CardContent>
          </Card>

          {/* Sell-Through Card */}
          <Card className="relative overflow-hidden">
            <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-amber-500/10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sell-Through</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight text-amber-600">
                {mockKPIs.sellThrough.value}
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-500">{mockKPIs.sellThrough.trend.value}%</span>
                <span>{mockKPIs.sellThrough.trend.label}</span>
              </p>
            </CardContent>
          </Card>

          {/* Weeks of Cover Card */}
          <Card className="relative overflow-hidden">
            <Package className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Weeks of Cover</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight text-blue-600">
                {mockKPIs.woc.value}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Target: 4-6 weeks
              </p>
            </CardContent>
          </Card>

          {/* Alerts Card */}
          <Card className="relative overflow-hidden">
            <AlertTriangle className="absolute -bottom-4 -right-4 h-32 w-32 text-rose-500/10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Alerts</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <span className="text-rose-600">{mockKPIs.alerts.critical}</span>
                <span className="text-amber-600">{mockKPIs.alerts.warning}</span>
                <span className="text-emerald-600">{mockKPIs.alerts.healthy}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Critical / Warning / Healthy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Trend Chart */}
          <div className="ind-card">
            <div className="ind-card-header">
              <h2 className="text-md font-semibold">Weekly Trend</h2>
            </div>
            <div className="ind-card-content">
              <TrendChart data={mockChartData} height={250} />
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="ind-card">
            <div className="ind-card-header">
              <h2 className="text-md font-semibold">By Category</h2>
            </div>
            <div className="ind-card-content space-y-3">
              {mockCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <span className="text-content">{cat.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-surface-secondary rounded overflow-hidden">
                      <div
                        className="h-full bg-accent rounded"
                        style={{ width: `${(cat.sales / 1500) * 100}%` }}
                      />
                    </div>
                    <span className="font-data tabular-nums w-12 text-right text-content-secondary">
                      {Math.round((cat.sales / 3615) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Table */}
        <div className="ind-card">
          <div className="ind-card-header flex items-center justify-between">
            <h2 className="text-md font-semibold">Category Performance</h2>
            <input
              type="text"
              placeholder="Search..."
              className="ind-input ind-input-sm w-48"
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
