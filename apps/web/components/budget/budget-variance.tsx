'use client';

import { useMemo } from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ComposedChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Format currency helper
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface BudgetActualData {
  period: string; // e.g., "Jan", "Feb", "Week 1"
  budgeted: number;
  actual: number;
  committed: number;
}

interface CategoryVariance {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

interface BudgetVarianceProps {
  totalBudget: number;
  totalActual: number;
  totalCommitted: number;
  periodData?: BudgetActualData[];
  categoryVariance?: CategoryVariance[];
  currency?: string;
  className?: string;
}

export function BudgetVariance({
  totalBudget,
  totalActual,
  totalCommitted,
  periodData = [],
  categoryVariance = [],
  currency: _currency = 'USD',
  className,
}: BudgetVarianceProps) {
  // Note: currency reserved for future multi-currency support
  void _currency;
  // Calculate overall variance
  const overallVariance = useMemo(() => {
    const variance = totalBudget - totalActual;
    const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;
    const utilizationRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
    const commitmentRate = totalBudget > 0 ? (totalCommitted / totalBudget) * 100 : 0;
    const remaining = totalBudget - totalActual - totalCommitted;
    const remainingPercent = totalBudget > 0 ? (remaining / totalBudget) * 100 : 0;

    return {
      variance,
      variancePercent,
      utilizationRate,
      commitmentRate,
      remaining,
      remainingPercent,
      status: variancePercent > 10 ? 'under' : variancePercent < -5 ? 'over' : 'on-track',
    };
  }, [totalBudget, totalActual, totalCommitted]);

  // Generate sample period data if not provided
  const chartData = useMemo(() => {
    if (periodData.length > 0) return periodData;

    // Generate sample monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyBudget = totalBudget / 12;
    let cumulativeActual = 0;

    return months.map((month, index) => {
      const monthActual = (totalActual / 6) * (0.8 + Math.random() * 0.4);
      cumulativeActual += monthActual;
      return {
        period: month,
        budgeted: monthlyBudget * (index + 1),
        actual: Math.min(cumulativeActual, totalActual),
        committed: (totalCommitted / 6) * (index + 1),
      };
    });
  }, [periodData, totalBudget, totalActual, totalCommitted]);

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'under':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Under Budget
          </Badge>
        );
      case 'over':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Over Budget
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Minus className="h-3 w-3 mr-1" />
            On Track
          </Badge>
        );
    }
  };

  // Trend icon
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg border-2 border-border p-3">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Budget</div>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Actual Spend</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalActual)}</div>
            <div className="text-xs text-muted-foreground">
              {overallVariance.utilizationRate.toFixed(1)}% utilized
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Committed</div>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalCommitted)}</div>
            <div className="text-xs text-muted-foreground">
              {overallVariance.commitmentRate.toFixed(1)}% committed
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Remaining</div>
            <div className={cn(
              'text-2xl font-bold',
              overallVariance.remaining < 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {formatCurrency(Math.abs(overallVariance.remaining))}
              {overallVariance.remaining < 0 && ' Over'}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.abs(overallVariance.remainingPercent).toFixed(1)}% of budget
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variance Status */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Budget Variance Analysis</CardTitle>
              <CardDescription>Budget vs Actual comparison</CardDescription>
            </div>
            {getStatusBadge(overallVariance.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bars */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Actual Spend</span>
                <span>{overallVariance.utilizationRate.toFixed(1)}%</span>
              </div>
              <Progress
                value={Math.min(100, overallVariance.utilizationRate)}
                className={cn('h-3', overallVariance.utilizationRate > 100 && 'bg-red-100')}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Committed (Actual + Pending)</span>
                <span>{(overallVariance.utilizationRate + overallVariance.commitmentRate).toFixed(1)}%</span>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, overallVariance.utilizationRate)}%` }}
                />
                <div
                  className="absolute h-full bg-yellow-500 rounded-full"
                  style={{
                    left: `${Math.min(100, overallVariance.utilizationRate)}%`,
                    width: `${Math.min(100 - overallVariance.utilizationRate, overallVariance.commitmentRate)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Actual
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    Committed
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted" />
                    Available
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning if over budget */}
          {overallVariance.remaining < 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                Budget exceeded by {formatCurrency(Math.abs(overallVariance.remaining))} ({Math.abs(overallVariance.variancePercent).toFixed(1)}%)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Budget vs Actual Trend</CardTitle>
          <CardDescription>Cumulative spend over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartWrapper height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine y={totalBudget} stroke="#EF4444" strokeDasharray="5 5" label="Budget" />
                <Bar dataKey="actual" name="Actual Spend" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="committed" name="Committed" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="budgeted"
                  name="Budget Plan"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </CardContent>
      </Card>

      {/* Category Variance Table */}
      {categoryVariance.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Variance by Category</CardTitle>
            <CardDescription>Budget vs Actual breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryVariance.map((item) => (
                  <TableRow key={item.categoryId}>
                    <TableCell className="font-medium">{item.categoryName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.budgeted)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.actual)}</TableCell>
                    <TableCell className={cn(
                      'text-right font-medium',
                      item.variance > 0 ? 'text-green-600' : item.variance < 0 ? 'text-red-600' : ''
                    )}>
                      {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right',
                      item.variancePercent > 0 ? 'text-green-600' : item.variancePercent < 0 ? 'text-red-600' : ''
                    )}>
                      {item.variancePercent > 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                    </TableCell>
                    <TableCell>{getTrendIcon(item.variance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Compact version for dashboard
export function BudgetVarianceCompact({
  budgeted,
  actual,
  label = 'Budget Variance',
  className,
}: {
  budgeted: number;
  actual: number;
  label?: string;
  className?: string;
}) {
  const variance = budgeted - actual;
  const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;
  const utilizationRate = budgeted > 0 ? (actual / budgeted) * 100 : 0;

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Badge variant={variance >= 0 ? 'outline' : 'destructive'} className="text-xs">
            {variance >= 0 ? 'Under' : 'Over'}
          </Badge>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={cn(
            'text-2xl font-bold',
            variance >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
          </span>
        </div>
        <Progress
          value={Math.min(100, utilizationRate)}
          className={cn('h-2 mt-3', utilizationRate > 100 && 'bg-red-100')}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Actual: {formatCurrency(actual)}</span>
          <span>Budget: {formatCurrency(budgeted)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
