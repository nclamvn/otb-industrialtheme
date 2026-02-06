'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Format currency helper
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Color palette for charts
const COLORS = ['#1E3A5F', '#D4AF37', '#0D9488', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

interface BudgetData {
  id: string;
  brandName: string;
  seasonName: string;
  locationName: string;
  totalBudget: number;
  seasonalBudget: number;
  replenishmentBudget: number;
  status: string;
  utilization?: number;
}

interface BudgetChartsProps {
  budgets: BudgetData[];
  summary: {
    totalBudget: number;
    approvedBudget: number;
    pendingBudget: number;
    count: number;
  };
  className?: string;
}

export function BudgetCharts({ budgets, summary, className }: BudgetChartsProps) {
  // Prepare data for Brand Distribution Pie Chart
  const brandDistribution = useMemo(() => {
    const brandMap = new Map<string, number>();
    budgets.forEach((b) => {
      const current = brandMap.get(b.brandName) || 0;
      brandMap.set(b.brandName, current + b.totalBudget);
    });
    return Array.from(brandMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [budgets]);

  // Prepare data for Status Distribution
  const statusDistribution = useMemo(() => {
    const statusMap = new Map<string, number>();
    budgets.forEach((b) => {
      const current = statusMap.get(b.status) || 0;
      statusMap.set(b.status, current + b.totalBudget);
    });
    return Array.from(statusMap.entries()).map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase().replace('_', ' '),
      value,
    }));
  }, [budgets]);

  // Prepare data for Budget Type Bar Chart (Seasonal vs Replenishment)
  const budgetTypeData = useMemo(() => {
    const brandMap = new Map<string, { seasonal: number; replenishment: number }>();
    budgets.forEach((b) => {
      const current = brandMap.get(b.brandName) || { seasonal: 0, replenishment: 0 };
      brandMap.set(b.brandName, {
        seasonal: current.seasonal + b.seasonalBudget,
        replenishment: current.replenishment + b.replenishmentBudget,
      });
    });
    return Array.from(brandMap.entries())
      .map(([name, { seasonal, replenishment }]) => ({
        name: name.length > 10 ? name.substring(0, 10) + '...' : name,
        fullName: name,
        seasonal,
        replenishment,
        total: seasonal + replenishment,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 brands
  }, [budgets]);

  // Calculate utilization rate
  const utilizationRate = useMemo(() => {
    if (summary.totalBudget === 0) return 0;
    return Math.round((summary.approvedBudget / summary.totalBudget) * 100);
  }, [summary]);

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg border-2 border-border p-3">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; dataKey: string; payload?: { fullName?: string } }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-background border rounded-lg border-2 border-border p-3">
          <p className="font-medium mb-2">{data?.fullName || label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.dataKey === 'seasonal' ? COLORS[0] : COLORS[1] }}>
              {entry.dataKey === 'seasonal' ? 'Seasonal' : 'Replenishment'}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {/* Budget Utilization Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
          <CardDescription>Approved vs Total Budget</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{utilizationRate}%</span>
              <div className={cn(
                'flex items-center gap-1 text-sm',
                utilizationRate >= 80 ? 'text-green-600' : utilizationRate >= 50 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {utilizationRate >= 80 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : utilizationRate >= 50 ? (
                  <Minus className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {utilizationRate >= 80 ? 'On Track' : utilizationRate >= 50 ? 'In Progress' : 'Low'}
              </div>
            </div>
            <Progress value={utilizationRate} className="h-3" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Approved</p>
                <p className="font-medium text-green-600">{formatCurrency(summary.approvedBudget)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pending</p>
                <p className="font-medium text-yellow-600">{formatCurrency(summary.pendingBudget)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Distribution Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Budget by Brand</CardTitle>
          <CardDescription>Distribution across brands</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartWrapper height={200}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={brandDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {brandDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {brandDistribution.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1 text-xs">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-muted-foreground truncate max-w-[60px]">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Budget by Status</CardTitle>
          <CardDescription>Approval status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartWrapper height={200}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => {
                    const statusColors: Record<string, string> = {
                      'Approved': '#22C55E',
                      'Submitted': '#3B82F6',
                      'Under review': '#F59E0B',
                      'Draft': '#94A3B8',
                      'Rejected': '#EF4444',
                    };
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={statusColors[entry.name] || COLORS[index % COLORS.length]}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {statusDistribution.map((entry, index) => {
              const statusColors: Record<string, string> = {
                'Approved': '#22C55E',
                'Submitted': '#3B82F6',
                'Under review': '#F59E0B',
                'Draft': '#94A3B8',
                'Rejected': '#EF4444',
              };
              return (
                <div key={entry.name} className="flex items-center gap-1 text-xs">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusColors[entry.name] || COLORS[index] }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Budget Type Bar Chart - Full Width */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Seasonal vs Replenishment Budget</CardTitle>
          <CardDescription>Budget allocation by type for top brands</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartWrapper height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => (
                    <span className="text-sm capitalize">{value}</span>
                  )}
                />
                <Bar
                  dataKey="seasonal"
                  name="Seasonal"
                  fill={COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="replenishment"
                  name="Replenishment"
                  fill={COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </CardContent>
      </Card>
    </div>
  );
}

// Export individual chart components for flexibility
export function BudgetUtilizationCard({
  approved,
  pending,
  total,
  className,
}: {
  approved: number;
  pending: number;
  total: number;
  className?: string;
}) {
  const utilizationRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{utilizationRate}%</span>
            <span className="text-sm text-muted-foreground">approved</span>
          </div>
          <Progress value={utilizationRate} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Approved: {formatCurrency(approved)}</span>
            <span>Pending: {formatCurrency(pending)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
