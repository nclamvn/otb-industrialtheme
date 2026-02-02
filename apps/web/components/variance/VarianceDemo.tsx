'use client';

import React from 'react';
import { AlertTriangle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VarianceIndicator, VarianceCell } from './VarianceIndicator';
import { VarianceTooltip } from './VarianceTooltip';
import {
  calculateVariance,
  getVarianceSummary,
  DEFAULT_THRESHOLDS,
  CATEGORY_THRESHOLDS,
} from '@/lib/variance-utils';

// Sample data for demo
const sampleData = [
  { id: '1', label: 'Women\'s Bags', actual: 1350000, target: 1200000 },
  { id: '2', label: 'Men\'s Shoes', actual: 890000, target: 1000000 },
  { id: '3', label: 'Accessories', actual: 450000, target: 450000 },
  { id: '4', label: 'Ready-to-Wear', actual: 580000, target: 750000 },
  { id: '5', label: 'Small Leather', actual: 320000, target: 280000 },
];

export function VarianceDemo() {
  // Calculate variances for all items
  const variances = sampleData.map((item) => ({
    ...item,
    variance: calculateVariance(item.actual, item.target, CATEGORY_THRESHOLDS.sales, true),
  }));

  // Get summary
  const summary = getVarianceSummary(variances.map((v) => v.variance));

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#D7B797]" />
            Variance Highlights System
          </CardTitle>
          <CardDescription>
            Auto-highlight variances exceeding thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {summary.criticalCount}
              </p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-center">
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {summary.warningCount}
              </p>
              <p className="text-xs text-muted-foreground">Warning</p>
            </div>
            <div className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-center">
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {summary.minorCount}
              </p>
              <p className="text-xs text-muted-foreground">Minor</p>
            </div>
            <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {summary.positiveCount}
              </p>
              <p className="text-xs text-muted-foreground">Positive</p>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 text-center">
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {summary.onTargetCount}
              </p>
              <p className="text-xs text-muted-foreground">On Target</p>
            </div>
          </div>

          {/* Indicator Styles Demo */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Indicator Styles</h4>
            <div className="flex flex-wrap gap-4">
              {/* Different sizes */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Sizes</p>
                <div className="flex items-center gap-4">
                  <VarianceIndicator actual={120} target={100} size="sm" />
                  <VarianceIndicator actual={120} target={100} size="md" />
                  <VarianceIndicator actual={120} target={100} size="lg" />
                </div>
              </div>

              {/* Badge style */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Badge Style</p>
                <div className="flex items-center gap-2">
                  <VarianceIndicator actual={120} target={100} showBadge size="sm" />
                  <VarianceIndicator actual={85} target={100} showBadge size="sm" />
                  <VarianceIndicator actual={100} target={100} showBadge size="sm" />
                </div>
              </div>

              {/* With absolute value */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">With Absolute</p>
                <VarianceIndicator actual={1350000} target={1200000} showAbsolute />
              </div>
            </div>
          </div>

          {/* Table with variance cells */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 text-xs font-medium">Category</th>
                  <th className="text-right p-3 text-xs font-medium">Target</th>
                  <th className="text-right p-3 text-xs font-medium">Actual</th>
                  <th className="text-right p-3 text-xs font-medium">Variance</th>
                </tr>
              </thead>
              <tbody>
                {variances.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3 text-sm">{item.label}</td>
                    <td className="p-3 text-right text-sm font-mono text-muted-foreground">
                      ${item.target.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <VarianceTooltip
                        actual={item.actual}
                        target={item.target}
                        thresholds={CATEGORY_THRESHOLDS.sales}
                        title={item.label}
                        description="Sales performance vs target"
                        historyData={[
                          { period: 'Jan', variance: Math.random() * 20 - 10 },
                          { period: 'Feb', variance: Math.random() * 20 - 10 },
                          { period: 'Mar', variance: Math.random() * 20 - 10 },
                          { period: 'Apr', variance: item.variance.percentageValue },
                        ]}
                        showHistory
                        variant="hovercard"
                      >
                        <span className="font-mono text-sm cursor-help underline decoration-dotted">
                          ${item.actual.toLocaleString()}
                        </span>
                      </VarianceTooltip>
                    </td>
                    <td className="p-3 text-right">
                      <VarianceIndicator
                        variance={item.variance}
                        showBadge
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Threshold info */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Threshold Configuration</span>
            </div>
            <p>
              Critical: ≥{CATEGORY_THRESHOLDS.sales.critical}% |
              Warning: ≥{CATEGORY_THRESHOLDS.sales.warning}% |
              Minor: ≥{CATEGORY_THRESHOLDS.sales.minor}%
            </p>
            <p className="mt-1">
              Hover over actual values to see detailed variance breakdown and trend.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
