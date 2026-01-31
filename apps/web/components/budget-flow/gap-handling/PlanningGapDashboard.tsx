'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { BudgetNode } from '../types';
import { GapAnalysis, SEVERITY_COLORS, analyzeGaps } from './types';

interface PlanningGapDashboardProps {
  data: BudgetNode;
  onNodeClick?: (nodeId: string) => void;
  onOpenCopilot?: () => void;
  className?: string;
}

interface GapSummary {
  totalGaps: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  okCount: number;
  overBudgetTotal: number;
  underBudgetTotal: number;
  overBudgetCount: number;
  underBudgetCount: number;
  balancedCount: number;
}

const SeverityIcon = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  ok: CheckCircle,
};

export function PlanningGapDashboard({
  data,
  onNodeClick,
  onOpenCopilot,
  className,
}: PlanningGapDashboardProps) {
  // Analyze all gaps in the tree
  const gaps = useMemo(() => analyzeGaps(data), [data]);

  // Calculate summary statistics
  const summary = useMemo<GapSummary>(() => {
    const result: GapSummary = {
      totalGaps: gaps.length,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      okCount: 0,
      overBudgetTotal: 0,
      underBudgetTotal: 0,
      overBudgetCount: 0,
      underBudgetCount: 0,
      balancedCount: 0,
    };

    gaps.forEach((gap) => {
      switch (gap.severity) {
        case 'critical':
          result.criticalCount++;
          break;
        case 'warning':
          result.warningCount++;
          break;
        case 'info':
          result.infoCount++;
          break;
        case 'ok':
          result.okCount++;
          break;
      }

      if (gap.type === 'over') {
        result.overBudgetCount++;
        result.overBudgetTotal += Math.abs(gap.gap);
      } else if (gap.type === 'under') {
        result.underBudgetCount++;
        result.underBudgetTotal += gap.gap;
      } else {
        result.balancedCount++;
      }
    });

    return result;
  }, [gaps]);

  // Group gaps by severity
  const gapsByLevel = useMemo(() => {
    const grouped: Record<number, GapAnalysis[]> = {};
    gaps.forEach((gap) => {
      const level = gap.nodePath.length;
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(gap);
    });
    return grouped;
  }, [gaps]);

  // Top gaps to show (sorted by severity and amount)
  const topGaps = useMemo(() => {
    const severityOrder = { critical: 0, warning: 1, info: 2, ok: 3 };
    return [...gaps]
      .sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return Math.abs(b.gap) - Math.abs(a.gap);
      })
      .slice(0, 6);
  }, [gaps]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const overallHealth = useMemo(() => {
    if (summary.criticalCount > 0) return 'critical';
    if (summary.warningCount > 0) return 'warning';
    if (summary.infoCount > 0) return 'info';
    return 'ok';
  }, [summary]);

  const healthPercentage = useMemo(() => {
    if (gaps.length === 0) return 100;
    const score =
      ((summary.okCount * 100 +
        summary.infoCount * 75 +
        summary.warningCount * 40 +
        summary.criticalCount * 0) /
        (gaps.length * 100)) *
      100;
    return Math.round(score);
  }, [gaps.length, summary]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Planning Gap Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Overview of budget allocation gaps across categories
          </p>
        </div>
        {onOpenCopilot && (
          <Button onClick={onOpenCopilot} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Open Gap Copilot
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Overall Health */}
        <Card className={cn('border-l-4', `border-l-${overallHealth === 'critical' ? 'red' : overallHealth === 'warning' ? 'amber' : overallHealth === 'info' ? 'blue' : 'emerald'}-500`)}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold">{healthPercentage}%</p>
              </div>
              <div
                className={cn(
                  'p-3 rounded-full',
                  SEVERITY_COLORS[overallHealth].bg
                )}
              >
                {overallHealth === 'critical' && (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
                {overallHealth === 'warning' && (
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                )}
                {overallHealth === 'info' && (
                  <Info className="h-6 w-6 text-blue-600" />
                )}
                {overallHealth === 'ok' && (
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                )}
              </div>
            </div>
            <Progress
              value={healthPercentage}
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>

        {/* Total Gaps */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Gap Issues</p>
                <p className="text-2xl font-bold">{summary.totalGaps}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-3 flex gap-1">
              {summary.criticalCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {summary.criticalCount} critical
                </Badge>
              )}
              {summary.warningCount > 0 && (
                <Badge className="bg-amber-500 text-xs">
                  {summary.warningCount} warning
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Over Budget */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Over Budget</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.overBudgetTotal)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-red-50 dark:bg-red-950/30">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {summary.overBudgetCount} categories
            </p>
          </CardContent>
        </Card>

        {/* Under Budget */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Under Budget</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(summary.underBudgetTotal)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950/30">
                <TrendingDown className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {summary.underBudgetCount} categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gap Severity Breakdown</CardTitle>
          <CardDescription>Distribution of gaps by severity level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(['critical', 'warning', 'info', 'ok'] as const).map((severity) => {
              const count =
                severity === 'critical'
                  ? summary.criticalCount
                  : severity === 'warning'
                  ? summary.warningCount
                  : severity === 'info'
                  ? summary.infoCount
                  : summary.okCount;

              const percentage =
                summary.totalGaps > 0 ? (count / summary.totalGaps) * 100 : 0;

              const Icon = SeverityIcon[severity];
              const colors = SEVERITY_COLORS[severity];

              return (
                <div key={severity} className="flex items-center gap-3">
                  <div className={cn('p-1.5 rounded', colors.bg)}>
                    <Icon className={cn('h-4 w-4', colors.text)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">
                        {severity}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all', colors.dot)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Gaps Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Top Gap Issues</CardTitle>
              <CardDescription>Most significant budget gaps requiring attention</CardDescription>
            </div>
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topGaps.map((gap) => {
              const Icon = SeverityIcon[gap.severity];
              const colors = SEVERITY_COLORS[gap.severity];

              return (
                <div
                  key={gap.nodeId}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all',
                    colors.bg,
                    colors.border,
                    onNodeClick && 'cursor-pointer hover:shadow-sm'
                  )}
                  onClick={() => onNodeClick?.(gap.nodeId)}
                >
                  <div className={cn('p-1.5 rounded-full', colors.badge)}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{gap.nodeName}</span>
                      <Badge variant="outline" className="text-xs">
                        {gap.type === 'over' ? (
                          <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
                        ) : gap.type === 'under' ? (
                          <TrendingDown className="h-3 w-3 mr-1 text-blue-500" />
                        ) : (
                          <Minus className="h-3 w-3 mr-1" />
                        )}
                        {gap.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {gap.nodePath.join(' > ')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={cn(
                        'font-semibold',
                        gap.type === 'over'
                          ? 'text-red-600'
                          : gap.type === 'under'
                          ? 'text-blue-600'
                          : 'text-muted-foreground'
                      )}
                    >
                      {gap.type === 'over' ? '+' : gap.type === 'under' ? '-' : ''}
                      {formatCurrency(Math.abs(gap.gap))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {gap.gapPercent > 0 ? '+' : ''}
                      {gap.gapPercent.toFixed(1)}%
                    </p>
                  </div>

                  {onNodeClick && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>

          {gaps.length > 6 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" onClick={onOpenCopilot}>
                View All {gaps.length} Gaps
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* By Level Breakdown */}
      {Object.keys(gapsByLevel).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gaps by Hierarchy Level</CardTitle>
            <CardDescription>Distribution of gaps across budget hierarchy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-5">
              {Object.entries(gapsByLevel).map(([level, levelGaps]) => {
                const levelNum = parseInt(level);
                const levelLabels = ['Season', 'Brand', 'Gender', 'Category', 'Subcategory', 'Product'];
                const criticalInLevel = levelGaps.filter((g) => g.severity === 'critical').length;
                const warningInLevel = levelGaps.filter((g) => g.severity === 'warning').length;

                return (
                  <div
                    key={level}
                    className="p-3 rounded-lg border bg-muted/30"
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      {levelLabels[levelNum - 1] || `Level ${level}`}
                    </p>
                    <p className="text-lg font-bold mt-1">{levelGaps.length}</p>
                    <div className="flex gap-1 mt-1">
                      {criticalInLevel > 0 && (
                        <div className="h-1.5 flex-1 bg-red-500 rounded" />
                      )}
                      {warningInLevel > 0 && (
                        <div className="h-1.5 flex-1 bg-amber-500 rounded" />
                      )}
                      {levelGaps.length - criticalInLevel - warningInLevel > 0 && (
                        <div className="h-1.5 flex-1 bg-blue-500 rounded" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PlanningGapDashboard;
