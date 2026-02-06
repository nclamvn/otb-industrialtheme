'use client';

import { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PercentInput, CurrencyInput } from '@/components/ui/number-input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Save, PieChartIcon, LayoutGrid, AlertTriangle } from 'lucide-react';

// Format currency helper
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = ['#1E3A5F', '#D4AF37', '#0D9488', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

interface Category {
  id: string;
  name: string;
  code: string;
}

interface BreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  allocatedAmount: number;
  allocatedPercent: number;
}

interface BudgetBreakdownProps {
  totalBudget: number;
  seasonalBudget: number;
  replenishmentBudget: number;
  categories: Category[];
  initialBreakdown?: BreakdownItem[];
  onSave?: (breakdown: BreakdownItem[]) => void;
  readOnly?: boolean;
  className?: string;
}

export function BudgetBreakdown({
  totalBudget,
  seasonalBudget: _seasonalBudget,
  replenishmentBudget: _replenishmentBudget,
  categories,
  initialBreakdown = [],
  onSave,
  readOnly = false,
  className,
}: BudgetBreakdownProps) {
  // Note: seasonalBudget and replenishmentBudget reserved for future category-level split feature
  void _seasonalBudget;
  void _replenishmentBudget;
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>(initialBreakdown);
  const [inputMode, setInputMode] = useState<'percent' | 'amount'>('percent');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Calculate totals
  const totals = useMemo(() => {
    const allocatedAmount = breakdown.reduce((sum, item) => sum + item.allocatedAmount, 0);
    const allocatedPercent = breakdown.reduce((sum, item) => sum + item.allocatedPercent, 0);
    const remainingAmount = totalBudget - allocatedAmount;
    const remainingPercent = 100 - allocatedPercent;
    return { allocatedAmount, allocatedPercent, remainingAmount, remainingPercent };
  }, [breakdown, totalBudget]);

  // Available categories (not yet allocated)
  const availableCategories = useMemo(() => {
    const allocatedIds = new Set(breakdown.map((b) => b.categoryId));
    return categories.filter((c) => !allocatedIds.has(c.id));
  }, [categories, breakdown]);

  // Add category to breakdown
  const addCategory = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    setBreakdown([
      ...breakdown,
      {
        categoryId: category.id,
        categoryName: category.name,
        categoryCode: category.code,
        allocatedAmount: 0,
        allocatedPercent: 0,
      },
    ]);
  };

  // Remove category from breakdown
  const removeCategory = (categoryId: string) => {
    setBreakdown(breakdown.filter((b) => b.categoryId !== categoryId));
  };

  // Update allocation
  const updateAllocation = (categoryId: string, value: number, mode: 'percent' | 'amount') => {
    setBreakdown(
      breakdown.map((item) => {
        if (item.categoryId !== categoryId) return item;

        if (mode === 'percent') {
          return {
            ...item,
            allocatedPercent: Math.min(100, Math.max(0, value)),
            allocatedAmount: (value / 100) * totalBudget,
          };
        } else {
          return {
            ...item,
            allocatedAmount: Math.min(totalBudget, Math.max(0, value)),
            allocatedPercent: totalBudget > 0 ? (value / totalBudget) * 100 : 0,
          };
        }
      })
    );
  };

  // Auto-distribute remaining budget
  const autoDistribute = () => {
    if (availableCategories.length === 0 && breakdown.length === 0) return;

    const targetCategories = breakdown.length > 0 ? breakdown : categories.slice(0, 5).map(c => ({
      categoryId: c.id,
      categoryName: c.name,
      categoryCode: c.code,
      allocatedAmount: 0,
      allocatedPercent: 0,
    }));

    const equalPercent = 100 / targetCategories.length;
    const equalAmount = totalBudget / targetCategories.length;

    setBreakdown(
      targetCategories.map((item) => ({
        ...item,
        allocatedPercent: Math.round(equalPercent * 10) / 10,
        allocatedAmount: Math.round(equalAmount),
      }))
    );
  };

  // Chart data
  const chartData = useMemo(() => {
    const data = breakdown.map((item, index) => ({
      name: item.categoryName,
      value: item.allocatedAmount,
      percent: item.allocatedPercent,
      fill: COLORS[index % COLORS.length],
    }));

    if (totals.remainingAmount > 0) {
      data.push({
        name: 'Unallocated',
        value: totals.remainingAmount,
        percent: totals.remainingPercent,
        fill: '#E5E7EB',
      });
    }

    return data;
  }, [breakdown, totals]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; percent: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg border-2 border-border p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)} ({data.percent.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Validation warning
  const hasWarning = Math.abs(totals.allocatedPercent - 100) > 0.1 && breakdown.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Budget Category Breakdown</CardTitle>
            <CardDescription>
              Allocate {formatCurrency(totalBudget)} across categories
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'chart' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('chart')}
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Total Budget</p>
            <p className="text-lg font-semibold">{formatCurrency(totalBudget)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Allocated</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(totals.allocatedAmount)}
              <span className="text-sm text-muted-foreground ml-1">
                ({totals.allocatedPercent.toFixed(1)}%)
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className={cn(
              'text-lg font-semibold',
              totals.remainingAmount < 0 ? 'text-red-600' : 'text-yellow-600'
            )}>
              {formatCurrency(Math.abs(totals.remainingAmount))}
              {totals.remainingAmount < 0 && ' (Over)'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Allocation Progress</span>
            <span>{totals.allocatedPercent.toFixed(1)}%</span>
          </div>
          <Progress
            value={Math.min(100, totals.allocatedPercent)}
            className={cn('h-2', totals.allocatedPercent > 100 && 'bg-red-100')}
          />
        </div>

        {/* Warning */}
        {hasWarning && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              {totals.allocatedPercent > 100
                ? `Over-allocated by ${(totals.allocatedPercent - 100).toFixed(1)}%`
                : `${totals.remainingPercent.toFixed(1)}% of budget is unallocated`}
            </span>
          </div>
        )}

        {viewMode === 'table' ? (
          <>
            {/* Controls */}
            {!readOnly && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Input Mode:</Label>
                  <Select value={inputMode} onValueChange={(v) => setInputMode(v as 'percent' | 'amount')}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={autoDistribute}>
                  Auto Distribute
                </Button>
              </div>
            )}

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  {!readOnly && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.map((item, index) => (
                  <TableRow key={item.categoryId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{item.categoryName}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.categoryCode}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {readOnly ? (
                        `${item.allocatedPercent.toFixed(1)}%`
                      ) : (
                        <PercentInput
                          value={item.allocatedPercent}
                          onChange={(val) => updateAllocation(item.categoryId, val || 0, 'percent')}
                          className="w-20 text-right"
                          disabled={inputMode !== 'percent'}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {readOnly ? (
                        formatCurrency(item.allocatedAmount)
                      ) : (
                        <CurrencyInput
                          value={item.allocatedAmount}
                          onChange={(val) => updateAllocation(item.categoryId, val || 0, 'amount')}
                          className="w-28 text-right"
                          disabled={inputMode !== 'amount'}
                        />
                      )}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCategory(item.categoryId)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {breakdown.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No categories allocated. Add categories below.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Add Category */}
            {!readOnly && availableCategories.length > 0 && (
              <div className="flex items-center gap-2">
                <Select onValueChange={addCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Add category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => addCategory(availableCategories[0]?.id)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Chart View */
          <ChartWrapper height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent ?? 0).toFixed(1)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        )}

        {/* Save Button */}
        {!readOnly && onSave && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => onSave(breakdown)} disabled={hasWarning && totals.allocatedPercent > 100}>
              <Save className="h-4 w-4 mr-2" />
              Save Breakdown
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
