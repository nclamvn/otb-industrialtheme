'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { SizeProfile, ProfileComparison } from '@/types/size-profile';
import { SIZE_PROFILE_TYPE_LABELS, SIZE_PROFILE_TYPE_COLORS } from '@/types/size-profile';

interface SizeProfileComparisonProps {
  comparison: ProfileComparison;
  viewMode?: 'chart' | 'table';
}

const CHART_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
];

export function SizeProfileComparison({
  comparison,
  viewMode = 'chart',
}: SizeProfileComparisonProps) {
  const { profiles, differences, summary } = comparison;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (profiles.length === 0) return [];

    // Get all unique size codes
    const allSizes = new Set<string>();
    profiles.forEach((p) => {
      p.sizeDistribution.forEach((s) => allSizes.add(s.sizeCode));
    });

    return Array.from(allSizes).map((sizeCode) => {
      const dataPoint: Record<string, string | number> = { size: sizeCode };
      profiles.forEach((profile) => {
        const sizeData = profile.sizeDistribution.find((s) => s.sizeCode === sizeCode);
        dataPoint[profile.name] = sizeData?.percentage ?? 0;
      });
      return dataPoint;
    });
  }, [profiles]);

  if (profiles.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select at least 2 profiles to compare.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparison Summary</CardTitle>
          <CardDescription>
            Comparing {profiles.length} profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Average Variance</span>
              <span className="text-2xl font-bold">{summary.avgVariance.toFixed(1)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Max Variance</span>
              <span className="text-2xl font-bold text-orange-500">
                {summary.maxVariance.toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Most Different Size</span>
              <span className="text-2xl font-bold text-primary">{summary.mostDifferentSize}</span>
            </div>
          </div>

          {/* Profile badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {profiles.map((profile, index) => (
              <Badge
                key={profile.id}
                variant="outline"
                style={{ borderColor: CHART_COLORS[index % CHART_COLORS.length] }}
              >
                <span
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                {profile.name}
                <span className="ml-1 text-muted-foreground">
                  ({SIZE_PROFILE_TYPE_LABELS[profile.profileType]})
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart View */}
      {viewMode === 'chart' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribution Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="size" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, '']}
                  labelFormatter={(label) => `Size: ${label}`}
                />
                <Legend />
                {profiles.map((profile, index) => (
                  <Bar
                    key={profile.id}
                    dataKey={profile.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detailed Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Size</TableHead>
                    {profiles.map((profile, index) => (
                      <TableHead key={profile.id} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          {profile.name}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {differences.map((diff) => (
                    <TableRow
                      key={diff.sizeCode}
                      className={cn(
                        diff.variance > summary.avgVariance * 1.5 && 'bg-orange-50'
                      )}
                    >
                      <TableCell className="font-medium">{diff.sizeCode}</TableCell>
                      {diff.values.map((v, index) => (
                        <TableCell key={v.profileId} className="text-center">
                          {v.percentage.toFixed(1)}%
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <Badge
                          variant={diff.variance > summary.avgVariance ? 'destructive' : 'secondary'}
                        >
                          {diff.variance.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variance Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variance Analysis</CardTitle>
          <CardDescription>
            Sizes with the highest differences between profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {differences
              .sort((a, b) => b.variance - a.variance)
              .slice(0, 5)
              .map((diff) => (
                <div key={diff.sizeCode} className="flex items-center gap-3">
                  <span className="w-12 font-medium">{diff.sizeCode}</span>
                  <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        diff.variance > summary.avgVariance * 1.5
                          ? 'bg-orange-500'
                          : diff.variance > summary.avgVariance
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min(diff.variance * 5, 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-right text-muted-foreground">
                    {diff.variance.toFixed(1)}% var
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
